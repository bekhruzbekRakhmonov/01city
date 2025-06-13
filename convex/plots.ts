import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Pricing constants
const FREE_SQUARES_LIMIT = 25; // 5x5 plot
const PRICE_PER_SQUARE_CENTS = 100; // $1.00 per square in cents
const CUSTOM_MODEL_UPLOAD_FEE_CENTS = 2000; // $20.00 for custom model upload

// Get all plots in the city
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("plots").collect();
  },
});

// Get a specific plot by ID
export const getById = query({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get plots by user ID
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Calculate plot pricing
export const calculatePricing = query({
  args: {
    userId: v.string(),
    plotSize: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    hasCustomModel: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, plotSize, hasCustomModel = false } = args;
    
    // Get user's current free squares usage
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    const userFreeSquaresUsed = user?.freeSquaresUsed || 0;
    const userFreeSquaresLimit = user?.freeSquaresLimit || FREE_SQUARES_LIMIT;
    
    const totalSquares = plotSize.width * plotSize.depth;
    const remainingFreeSquares = Math.max(0, userFreeSquaresLimit - userFreeSquaresUsed);
    const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
    const paidSquares = totalSquares - freeSquaresToUse;
    
    const plotCost = paidSquares * PRICE_PER_SQUARE_CENTS;
    const customModelFee = hasCustomModel ? CUSTOM_MODEL_UPLOAD_FEE_CENTS : 0;
    const totalCost = plotCost + customModelFee;
    
    return {
      totalSquares,
      freeSquares: freeSquaresToUse,
      paidSquares,
      pricePerSquare: PRICE_PER_SQUARE_CENTS,
      plotCost,
      customModelFee,
      totalCost,
      paymentRequired: totalCost > 0,
    };
  },
});

// Create a new plot
export const create = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    position: v.object({
      x: v.number(),
      z: v.number(),
    }),
    size: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    mainBuilding: v.object({
      type: v.string(),
      height: v.number(),
      color: v.string(),
      rotation: v.number(),
      customizations: v.optional(v.any()),
    }),
    garden: v.optional(
      v.object({
        enabled: v.boolean(),
        style: v.string(),
        elements: v.array(v.string()),
      })
    ),
    subBuildings: v.optional(
      v.array(
        v.object({
          type: v.string(),
          position: v.object({
            x: v.number(),
            z: v.number(),
          }),
          rotation: v.number(),
          size: v.number(),
          color: v.string(),
          customizations: v.optional(v.any()),
        })
      )
    ),
    creatorInfo: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Payment and pricing
    paymentId: v.optional(v.string()),
    customModel: v.optional(v.object({
      enabled: v.boolean(),
      modelUrl: v.optional(v.string()),
      modelType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const { paymentId, customModel, ...plotData } = args;
    
    // Calculate pricing
    const totalSquares = args.size.width * args.size.depth;
    
    // Get or create user record
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      // Create new user record
      await ctx.db.insert("users", {
        userId: args.userId,
        username: args.username,
        email: "", // Will be updated when available
        credits: 0,
        totalSpent: 0,
        subscriptionTier: "free",
        freeSquaresUsed: 0,
        freeSquaresLimit: FREE_SQUARES_LIMIT,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
    }
    
    if (!user) throw new Error("Failed to create user record");
    
    // Calculate pricing
    const remainingFreeSquares = Math.max(0, user.freeSquaresLimit - user.freeSquaresUsed);
    const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
    const paidSquares = totalSquares - freeSquaresToUse;
    const plotCost = paidSquares * PRICE_PER_SQUARE_CENTS;
    const customModelFee = customModel?.enabled ? CUSTOM_MODEL_UPLOAD_FEE_CENTS : 0;
    const totalCost = plotCost + customModelFee;
    
    // Determine payment status
    let paymentStatus = "free";
    if (totalCost > 0) {
      if (paymentId) {
        paymentStatus = "paid";
      } else {
        throw new Error("Payment required for this plot size");
      }
    }
    
    // Create the plot
    const plotId = await ctx.db.insert("plots", {
      ...plotData,
      pricing: {
        totalCost,
        freeSquares: freeSquaresToUse,
        paidSquares,
        pricePerSquare: PRICE_PER_SQUARE_CENTS,
      },
      paymentStatus,
      paymentId,
      customModel: customModel || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    // Update user's free squares usage
    await ctx.db.patch(user._id, {
      freeSquaresUsed: user.freeSquaresUsed + freeSquaresToUse,
      totalSpent: user.totalSpent + totalCost,
      updatedAt: timestamp,
    });
    
    // Create transaction record if payment was made
    if (totalCost > 0 && paymentId) {
      await ctx.db.insert("transactions", {
        userId: args.userId,
        plotId,
        amount: totalCost,
        currency: "USD",
        type: "plot_purchase",
        paymentProcessor: "stripe", // Default to Stripe
        transactionId: paymentId,
        status: "completed",
        metadata: {
          plotSize: args.size,
          freeSquares: freeSquaresToUse,
          paidSquares,
          customModel: customModel?.enabled || false,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    
    return plotId;
  },
});

// Update an existing plot
export const update = mutation({
  args: {
    id: v.id("plots"),
    mainBuilding: v.optional(
      v.object({
        type: v.string(),
        height: v.number(),
        color: v.string(),
        rotation: v.number(),
        customizations: v.optional(v.any()),
      })
    ),
    garden: v.optional(
      v.object({
        enabled: v.boolean(),
        style: v.string(),
        elements: v.array(v.string()),
      })
    ),
    subBuildings: v.optional(
      v.array(
        v.object({
          type: v.string(),
          position: v.object({
            x: v.number(),
            z: v.number(),
          }),
          rotation: v.number(),
          size: v.number(),
          color: v.string(),
          customizations: v.optional(v.any()),
        })
      )
    ),
    creatorInfo: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Verify the plot exists
    const existingPlot = await ctx.db.get(id);
    if (!existingPlot) {
      throw new Error("Plot not found");
    }
    
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a plot
export const remove = mutation({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});