import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user info (used by frontend components)
export const getCurrentUser = query({  
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      // Return default user data if not found
      return {
        userId: args.userId,
        username: `user_${args.userId.slice(-8)}`,
        email: "",
        credits: 0,
        totalSpent: 0,
        subscriptionTier: "free" as const,
        freeSquaresUsed: 0,
        freeSquaresLimit: 25,
        freeSquares: 25,
        totalFreeSquares: 25,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    
    // Calculate remaining free squares
    const totalFreeSquares = user.freeSquaresLimit + 
      (user.subscriptionTier === "basic" ? 75 : user.subscriptionTier === "premium" ? 375 : 0);
    const remainingFreeSquares = Math.max(0, totalFreeSquares - (user.freeSquaresUsed || 0));
    
    return {
      ...user,
      freeSquares: remainingFreeSquares,
      totalFreeSquares,
    };
  },
});

// Get user profile and account info
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      return null;
    }
    
    // Get user's plots
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    // Get user's transactions
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(10); // Last 10 transactions
    
    return {
      ...user,
      plotsCount: plots.length,
      totalSquaresOwned: plots.reduce((sum, plot) => sum + (plot.size.width * plot.size.depth), 0),
      recentTransactions: transactions,
    };
  },
});

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        username: args.username,
        email: args.email,
        updatedAt: timestamp,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        userId: args.userId,
        username: args.username,
        email: args.email,
        credits: 0,
        totalSpent: 0,
        lifetimeValue: 0,
        subscriptionTier: "free",
        freeSquaresUsed: 0,
        freeSquaresLimit: 25, // 5x5 plot
        aiCreditsUsed: 0,
        aiCreditsLimit: 100,
        onboardingCompleted: false,
        loginCount: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  },
});

// Add credits to user account
export const addCredits = mutation({
  args: {
    userId: v.string(),
    amount: v.number(), // Amount in cents
    paymentId: v.string(),
    paymentProcessor: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update user credits
    await ctx.db.patch(user._id, {
      credits: user.credits + args.amount,
      updatedAt: timestamp,
    });
    
    // Create transaction record
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      currency: "USD",
      type: "credit_purchase",
      paymentProcessor: args.paymentProcessor,
      transactionId: args.paymentId,
      status: "completed",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    return user.credits + args.amount;
  },
});

// Upgrade user subscription
export const upgradeSubscription = mutation({
  args: {
    userId: v.string(),
    tier: v.string(), // "basic", "premium"
    paymentId: v.string(),
    durationMonths: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const expiryDate = timestamp + (args.durationMonths * 30 * 24 * 60 * 60 * 1000);
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Calculate new free squares limit based on tier
    let newFreeSquaresLimit = 25; // Default free tier
    let subscriptionCost = 0;
    
    if (args.tier === "basic") {
      newFreeSquaresLimit = 100; // 10x10 plot
      subscriptionCost = 999; // $9.99/month
    } else if (args.tier === "premium") {
      newFreeSquaresLimit = 400; // 20x20 plot
      subscriptionCost = 1999; // $19.99/month
    }
    
    const totalCost = subscriptionCost * args.durationMonths;
    
    // Update user subscription
    await ctx.db.patch(user._id, {
      subscriptionTier: args.tier,
      freeSquaresLimit: newFreeSquaresLimit,
      totalSpent: user.totalSpent + totalCost,
      updatedAt: timestamp,
    });
    
    // Create transaction record
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: totalCost,
      currency: "USD",
      type: "subscription_upgrade",
      paymentProcessor: "stripe",
      transactionId: args.paymentId,
      status: "completed",
      metadata: {
        tier: args.tier,
        durationMonths: args.durationMonths,
        newFreeSquaresLimit,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    return {
      tier: args.tier,
      expiryDate,
      freeSquaresLimit: newFreeSquaresLimit,
    };
  },
});

// Get pricing information
export const getPricing = query({
  handler: async () => {
    return {
      freeSquaresLimit: 25,
      pricePerSquareCents: 100,
      customModelUploadFeeCents: 2000,
      subscriptionTiers: {
        basic: {
          monthlyCostCents: 999,
          freeSquaresLimit: 100,
          features: ["10x10 free plot", "Priority support", "Advanced customization"]
        },
        premium: {
          monthlyCostCents: 1999,
          freeSquaresLimit: 400,
          features: ["20x20 free plot", "Unlimited custom models", "Analytics dashboard", "API access"]
        }
      }
    };
  },
});