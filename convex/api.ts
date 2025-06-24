import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get pricing information for the frontend
export const getPricingInfo = query({
  args: {},
  handler: async (ctx) => {
    return {
      freeSquaresLimit: 25,
      pricePerSquareCents: 100, // $1 per square
      customModelUploadFeeCents: 2000, // $20 for custom model upload
      subscriptionTiers: {
        basic: {
          name: "Basic",
          pricePerMonthCents: 999, // $9.99
          freeSquaresBonus: 50,
          customModelDiscount: 50, // 50% off
          features: ["50 bonus free squares", "50% off custom models", "Priority support"]
        },
        premium: {
          name: "Premium",
          pricePerMonthCents: 1999, // $19.99
          freeSquaresBonus: 100,
          customModelDiscount: 100, // Free custom models
          features: ["100 bonus free squares", "Free custom models", "Advanced analytics", "Priority support"]
        }
      }
    };
  },
});

// Calculate plot cost before purchase
export const calculatePlotCost = query({
  args: {
    userId: v.string(),
    plotSize: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    hasCustomModel: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get user info
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    const userFreeSquaresUsed = user?.freeSquaresUsed || 0;
    const userFreeSquaresLimit = (user?.freeSquaresLimit || 25) + (user?.subscriptionTier === "basic" ? 50 : user?.subscriptionTier === "premium" ? 100 : 0);
    
    // Calculate pricing
    const totalSquares = args.plotSize.width * args.plotSize.depth;
    const remainingFreeSquares = Math.max(0, userFreeSquaresLimit - userFreeSquaresUsed);
    const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
    const paidSquares = totalSquares - freeSquaresToUse;
    
    const plotCost = paidSquares * 100; // $1 per square
    
    // Calculate custom model fee with subscription discounts
    let customModelFee = 0;
    if (args.hasCustomModel) {
      if (user?.subscriptionTier === "premium") {
        customModelFee = 0; // Free for premium
      } else if (user?.subscriptionTier === "basic") {
        customModelFee = 1000; // 50% off for basic ($10)
      } else {
        customModelFee = 2000; // Full price ($20)
      }
    }
    
    const totalCost = plotCost + customModelFee;
    
    return {
      totalSquares,
      freeSquares: freeSquaresToUse,
      paidSquares,
      plotCost,
      customModelFee,
      totalCost,
      remainingFreeSquares: remainingFreeSquares - freeSquaresToUse,
      userSubscriptionTier: user?.subscriptionTier || "free",
      breakdown: {
        plotCostFormatted: `$${(plotCost / 100).toFixed(2)}`,
        customModelFeeFormatted: `$${(customModelFee / 100).toFixed(2)}`,
        totalCostFormatted: `$${(totalCost / 100).toFixed(2)}`,
      }
    };
  },
});

// Get user dashboard data
export const getUserDashboard = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user info
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    // Get user's plots
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
    
    // Get recent transactions
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(5);
    
    const totalFreeSquares = (user?.freeSquaresLimit || 25) + 
      (user?.subscriptionTier === "basic" ? 50 : user?.subscriptionTier === "premium" ? 100 : 0);
    
    return {
      user: user ? {
        ...user,
        totalFreeSquares,
        remainingFreeSquares: Math.max(0, totalFreeSquares - (user.freeSquaresUsed || 0)),
        totalSpentFormatted: `$${((user.totalSpent || 0) / 100).toFixed(2)}`,
        subscriptionExpiryFormatted: user.subscriptionExpiry ? 
          new Date(user.subscriptionExpiry).toLocaleDateString() : null,
      } : null,
      plots: plots.map(plot => ({
        ...plot,
        totalSquares: plot.size.width * plot.size.depth,
        costFormatted: plot.pricing ? `$${(plot.pricing.totalCost / 100).toFixed(2)}` : "Free",
        createdAtFormatted: new Date(plot.createdAt).toLocaleDateString(),
      })),
      recentTransactions: transactions.map(transaction => ({
        ...transaction,
        amountFormatted: `$${(transaction.amount / 100).toFixed(2)}`,
        createdAtFormatted: new Date(transaction.createdAt).toLocaleDateString(),
      })),
      stats: {
        totalPlots: plots.length,
        totalSquaresOwned: plots.reduce((sum, plot) => sum + (plot.size.width * plot.size.depth), 0),
        totalSpent: user?.totalSpent || 0,
        totalSpentFormatted: `$${((user?.totalSpent || 0) / 100).toFixed(2)}`,
      }
    };
  },
});

// Purchase plot with payment processing
export const purchasePlot = mutation({
  args: {
    userId: v.string(),
    creatorInfo: v.optional(v.string()),
    description: v.optional(v.string()),
    garden: v.optional(v.object({
      enabled: v.boolean(),
      style: v.string(),
      elements: v.array(v.string()),
    })),
    position: v.object({
      index: v.optional(v.number()),
      x: v.number(),
      z: v.number(),
    }),
    size: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    building: v.optional(v.object({
      type: v.string(),
      height: v.optional(v.number()),
      color: v.optional(v.string()),
      modelUrl: v.optional(v.string()),
      customModel: v.optional(v.boolean()),
      customizations: v.optional(v.any()),
      scale: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      })),
      rotation: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      })),
      selectedModel: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        modelType: v.optional(v.string()),
        buildingType: v.optional(v.string()),
      })),
    })),
    paymentIntentId: v.optional(v.string()),
    paymentId: v.optional(v.union(v.null(), v.string())), // Allow null or string for paymentId
    paymentMethod: v.optional(v.string()), // Added to handle payment method (e.g., "credits", "stripe")
    advertising: v.optional(v.object({
      enabled: v.boolean(),
      companyName: v.string(),
      website: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      logoFileName: v.optional(v.string()),
      logoSvg: v.optional(v.string()),
      description: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      bannerStyle: v.optional(v.string()),
      bannerPosition: v.optional(v.string()),
      bannerColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      animationStyle: v.optional(v.string()),
    })),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Check if position is already occupied
    const existingPlot = await ctx.db
      .query("plots")
      .filter((q) => 
        q.and(
          q.eq(q.field("position.x"), args.position.x),
          q.eq(q.field("position.z"), args.position.z)
        )
      )
      .first();
    
    if (existingPlot) {
      throw new Error("Position already occupied");
    }
    
    // Get or create user
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      const username = args.metadata?.username || `user_${args.userId.slice(-8)}`;
      const userId = await ctx.db.insert("users", {
        userId: args.userId,
        username,
        email: "",
        credits: 0,
        totalSpent: 0,
        subscriptionTier: "free",
        freeSquaresUsed: 0,
        freeSquaresLimit: 25,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      user = await ctx.db.get(userId);
    }
    
    if (!user) {
      throw new Error("Failed to create user");
    }
    
    // Calculate pricing
    const totalSquares = args.size.width * args.size.depth;
    const userFreeSquaresUsed = user.freeSquaresUsed || 0;
    const totalFreeSquares = (user.freeSquaresLimit || 25) + 
      (user.subscriptionTier === "basic" ? 50 : user.subscriptionTier === "premium" ? 100 : 0);
    
    const remainingFreeSquares = Math.max(0, totalFreeSquares - userFreeSquaresUsed);
    const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
    const paidSquares = totalSquares - freeSquaresToUse;
    
    const plotCost = paidSquares * 100;
    
    // Calculate custom model fee
    let customModelFee = 0;
    if (args.building?.customModel) {
      if (user.subscriptionTier === "premium") {
        customModelFee = 0;
      } else if (user.subscriptionTier === "basic") {
        customModelFee = 1000;
      } else {
        customModelFee = 2000;
      }
    }
    
    const totalCost = plotCost + customModelFee;
    
    // Verify payment if required
    let paymentStatus = "free";
    let transactionId = null;
    
    if (totalCost > 0) {
      if (user.credits >= totalCost) {
        // Pay with credits
        await ctx.db.patch(user._id, { credits: user.credits - totalCost });
        paymentStatus = "paid_with_credits";
        // Optionally, create a transaction record for credit payments
        // transactionId = await ctx.db.insert("transactions", { ... }); 
      } else if (!args.paymentIntentId) {
        throw new Error("Payment required (and insufficient credits) but no payment intent provided");
      } else {
        // Verify payment was successful
        const transaction = await ctx.db
          .query("transactions")
          .filter((q) => q.eq(q.field("transactionId"), args.paymentIntentId))
          .first();
        
        if (!transaction || transaction.status !== "completed") {
          throw new Error("Payment not completed");
        }
        
        if (transaction.amount !== totalCost) {
          throw new Error("Payment amount mismatch");
        }
        
        paymentStatus = "paid";
        transactionId = transaction._id;
      }
    }
    
    // Create the plot
    const plotId = await ctx.db.insert("plots", {
      userId: args.userId,
      username: args.metadata?.username || user.username || `user_${args.userId.slice(-8)}`,
      position: {
        x: args.position.x,
        z: args.position.z,
      },
      size: args.size,
      mainBuilding: {
        type: args.building?.type || "empty",
        height: 1,
        color: "#ffffff",
        rotation: args.building?.rotation?.y || 0,
        customizations: args.building,
      },
      pricing: {
        totalCost,
        freeSquares: freeSquaresToUse,
        paidSquares,
        pricePerSquare: 100,
      },
      paymentStatus,
      paymentId: transactionId ? transactionId.toString() : undefined,
      customModel: args.building?.customModel ? {
        enabled: true,
        modelUrl: args.building.modelUrl,
        modelType: "glb",
        uploadedAt: timestamp,
      } : undefined,
      advertising: args.advertising ? {
        enabled: args.advertising.enabled,
        companyName: args.advertising.companyName,
        website: args.advertising.website,
        logoUrl: args.advertising.logoUrl,
        logoFileName: args.advertising.logoFileName,
        description: args.advertising.description,
        contactEmail: args.advertising.contactEmail,
        uploadedAt: timestamp,
      } : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    // Update user's free squares and total spent
    await ctx.db.patch(user._id, {
      freeSquaresUsed: userFreeSquaresUsed + freeSquaresToUse,
      totalSpent: (user.totalSpent || 0) + totalCost,
      updatedAt: timestamp,
    });
    
    // Update transaction with plot ID if payment was made
    if (transactionId) {
      await ctx.db.patch(transactionId, {
        plotId,
        updatedAt: timestamp,
      });
    }
    
    return {
      plotId,
      totalCost,
      paymentStatus,
      freeSquaresUsed: freeSquaresToUse,
      paidSquares,
      message: totalCost === 0 ? "Plot created successfully using free squares!" : "Plot purchased successfully!"
    };
  },
});

// Get available plots in a region
export const getAvailablePlots = query({
  args: {
    minX: v.number(),
    maxX: v.number(),
    minZ: v.number(),
    maxZ: v.number(),
  },
  handler: async (ctx, args) => {
    const occupiedPlots = await ctx.db
      .query("plots")
      .filter((q) => 
        q.and(
          q.gte(q.field("position.x"), args.minX),
          q.lte(q.field("position.x"), args.maxX),
          q.gte(q.field("position.z"), args.minZ),
          q.lte(q.field("position.z"), args.maxZ)
        )
      )
      .collect();
    
    // Generate grid of available positions
    const availablePositions = [];
    for (let x = args.minX; x <= args.maxX; x++) {
      for (let z = args.minZ; z <= args.maxZ; z++) {
        const isOccupied = occupiedPlots.some(plot => 
          plot.position.x === x && plot.position.z === z
        );
        
        if (!isOccupied) {
          availablePositions.push({ x, z });
        }
      }
    }
    
    return {
      availablePositions,
      occupiedPlots: occupiedPlots.map(plot => ({
        position: plot.position,
        size: plot.size,
        owner: plot.userId,
        building: plot.mainBuilding,
      })),
      totalAvailable: availablePositions.length,
      totalOccupied: occupiedPlots.length,
    };
  },
});