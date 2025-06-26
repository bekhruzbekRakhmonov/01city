import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Create payment intent for plot purchase
export const createPlotPaymentIntent = mutation({
  args: {
    userId: v.string(),
    plotSize: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    hasCustomModel: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Get user info
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    const userFreeSquaresUsed = user?.freeSquaresUsed || 0;
    const userFreeSquaresLimit = (user?.freeSquaresLimit || 25) + (user?.subscriptionTier === "business" ? 50 : user?.subscriptionTier === "corporate" ? 100 : user?.subscriptionTier === "enterprise" ? 200 : 0);
    
    // Calculate pricing
    const totalSquares = args.plotSize.width * args.plotSize.depth;
    const remainingFreeSquares = Math.max(0, userFreeSquaresLimit - userFreeSquaresUsed);
    const freeSquaresToUse = Math.min(totalSquares, remainingFreeSquares);
    const paidSquares = totalSquares - freeSquaresToUse;
    
    const plotCost = paidSquares * 100; // $1 per square
    
    // Calculate custom model fee with subscription discounts
    let customModelFee = 0;
    if (args.hasCustomModel) {
      if (user?.subscriptionTier === "enterprise") {
        customModelFee = 0; // Free for enterprise
      } else if (user?.subscriptionTier === "corporate") {
        customModelFee = 500; // 75% off for corporate ($5)
      } else if (user?.subscriptionTier === "business") {
        customModelFee = 1000; // 50% off for business ($10)
      } else {
        customModelFee = 2000; // Full price ($20)
      }
    }
    const totalCost = plotCost + customModelFee;
    
    if (totalCost === 0) {
      // No payment required
      return {
        paymentRequired: false,
        totalCost: 0,
        freeSquares: freeSquaresToUse,
        paidSquares: 0,
      };
    }
    
    // Create payment intent record (in real app, this would call Stripe API)
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store payment intent for tracking
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: totalCost,
      currency: "USD",
      type: "plot_purchase",
      paymentProcessor: "stripe",
      transactionId: paymentIntentId,
      status: "pending",
      metadata: {
        plotSize: args.plotSize,
        freeSquares: freeSquaresToUse,
        paidSquares,
        customModel: args.hasCustomModel || false,
        ...args.metadata,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    return {
      paymentRequired: true,
      paymentIntentId,
      totalCost,
      plotCost,
      customModelFee,
      freeSquares: freeSquaresToUse,
      paidSquares,
      clientSecret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
    };
  },
});

// Confirm payment and update transaction status
export const confirmPayment = mutation({
  args: {
    paymentIntentId: v.string(),
    status: v.string(), // "succeeded", "failed", "canceled"
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Find the transaction
    const transaction = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("transactionId"), args.paymentIntentId))
      .first();
    
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    
    // Update transaction status
    const newStatus = args.status === "succeeded" ? "completed" : "failed";
    
    await ctx.db.patch(transaction._id, {
      status: newStatus,
      updatedAt: timestamp,
    });
    
    return {
      transactionId: transaction._id,
      status: newStatus,
      amount: transaction.amount,
    };
  },
});

// Create subscription payment intent
export const createSubscriptionPaymentIntent = mutation({
  args: {
    userId: v.string(),
    tier: v.string(), // "basic", "premium"
    durationMonths: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Calculate subscription cost
    let monthlyCost = 0;
    if (args.tier === "basic") {
      monthlyCost = 999; // $9.99
    } else if (args.tier === "premium") {
      monthlyCost = 1999; // $19.99
    } else {
      throw new Error("Invalid subscription tier");
    }
    
    const totalCost = monthlyCost * args.durationMonths;
    
    // Create payment intent
    const paymentIntentId = `pi_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: totalCost,
      currency: "USD",
      type: "subscription_upgrade",
      paymentProcessor: "stripe",
      transactionId: paymentIntentId,
      status: "pending",
      metadata: {
        tier: args.tier,
        durationMonths: args.durationMonths,
        monthlyCost,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    return {
      paymentIntentId,
      totalCost,
      monthlyCost,
      durationMonths: args.durationMonths,
      clientSecret: `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
    };
  },
});

// Get user's transaction history
export const getTransactionHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);
    
    return transactions.map(transaction => ({
      ...transaction,
      amountFormatted: `$${(transaction.amount / 100).toFixed(2)}`,
      createdAtFormatted: new Date(transaction.createdAt).toLocaleDateString(),
    }));
  },
});

// Internal mutation to record transaction and update user (if applicable)
export const _internalRecordTransaction = internalMutation({
  args: {
    userId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    type: v.union(v.literal('land'), v.literal('custom_model'), v.literal('plot')), // Added 'plot' here as well for consistency, though action validates
    paymentProcessor: v.string(),
    transactionId: v.string(),
    status: v.string(),
    metadata: v.any(),
    paymentSuccessful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    await ctx.db.insert("transactions", {
      userId: args.userId || "guest",
      amount: args.amount,
      currency: args.currency,
      type: args.type,
      paymentProcessor: args.paymentProcessor,
      transactionId: args.transactionId,
      status: args.status,
      metadata: args.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (args.userId && args.paymentSuccessful) {
      const user = await ctx.db.query("users").filter(q => q.eq(q.field("userId"), args.userId!)).first();
      if (user) {
        // Example: Add credits or update user status based on payment type
        // await ctx.db.patch(user._id, { credits: (user.credits || 0) + args.amount });
      }
    }
    return { transactionId: args.transactionId, status: args.status };
  }
});

// Process a generic payment (Action)
export const processPayment = action({
  args: {
    amount: v.number(),
    description: v.string(),
    // Ensure 'plot' is a valid type if it can be passed from client
    type: v.union(v.literal('land'), v.literal('custom_model'), v.literal('plot')),
    paymentMethod: v.union(v.literal('card'), v.literal('crypto')),
    paymentDetails: v.object({
      cardNumber: v.optional(v.string()),
      cardHolder: v.optional(v.string()),
      walletAddress: v.optional(v.string()),
    }),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let paymentSuccessful = true;
    let errorMessage = null;

    if (args.paymentMethod === 'card') {
      if (!args.paymentDetails.cardNumber || args.paymentDetails.cardNumber.length < 4) {
        paymentSuccessful = false;
        errorMessage = 'Invalid card details provided.';
      } else if (args.paymentDetails.cardNumber.endsWith('0000')) {
        paymentSuccessful = false;
        errorMessage = 'Card declined by issuer.';
      }
    } else if (args.paymentMethod === 'crypto') {
      if (!args.paymentDetails.walletAddress || args.paymentDetails.walletAddress.length < 10) {
        paymentSuccessful = false;
        errorMessage = 'Invalid crypto wallet address.';
      }
    }

    const paymentId = `pay_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Record the transaction attempt by calling the internal mutation
    await ctx.runMutation(internal.payments._internalRecordTransaction, {
      userId: args.userId,
      amount: args.amount,
      currency: "USD",
      type: args.type,
      paymentProcessor: args.paymentMethod === 'card' ? "mock_card_processor" : "mock_crypto_processor",
      transactionId: paymentId,
      status: paymentSuccessful ? "completed" : "failed",
      metadata: {
        description: args.description,
        paymentDetails: args.paymentDetails, // Be careful about storing sensitive info
      },
      paymentSuccessful: paymentSuccessful,
    });

    if (!paymentSuccessful) {
      return {
        success: false,
        error: errorMessage || "Payment processing failed.",
        paymentId: paymentId,
      };
    }

    return {
      success: true,
      paymentId: paymentId,
      message: "Payment processed successfully.",
    };
  },
});

// Refund transaction
export const refundTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    
    if (transaction.status !== "completed") {
      throw new Error("Can only refund completed transactions");
    }
    
    // Update transaction status
    await ctx.db.patch(args.transactionId, {
      status: "refunded",
      updatedAt: timestamp,
      metadata: {
        ...transaction.metadata,
        refundReason: args.reason,
        refundedAt: timestamp,
      },
    });
    
    // If this was a plot purchase, we should also handle plot removal
    if (transaction.type === "plot_purchase" && transaction.plotId) {
      // Mark plot as refunded or remove it
      const plot = await ctx.db.get(transaction.plotId);
      if (plot) {
        await ctx.db.patch(transaction.plotId, {
          paymentStatus: "refunded",
          updatedAt: timestamp,
        });
        
        // Restore user's free squares
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), transaction.userId))
          .first();
        
        if (user && plot.pricing) {
          await ctx.db.patch(user._id, {
            freeSquaresUsed: Math.max(0, user.freeSquaresUsed - plot.pricing.freeSquares),
            totalSpent: Math.max(0, user.totalSpent - transaction.amount),
            updatedAt: timestamp,
          });
        }
      }
    }
    
    return {
      transactionId: args.transactionId,
      refundAmount: transaction.amount,
      status: "refunded",
    };
  },
});