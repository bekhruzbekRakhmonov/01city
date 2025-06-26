import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get user's current subscription
export const getCurrentSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user || !user.currentSubscription) {
      return null;
    }

    return await ctx.db.get(user.currentSubscription);
  },
});

// Get all subscription tiers
export const getSubscriptionTiers = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "startup",
        name: "Startup District",
        price: 99,
        features: [
          "Up to 100 virtual square meters",
          "Basic AI Business Concierge",
          "5 custom 3D models",
          "Basic analytics dashboard",
          "Email support",
          "Standard mailbox system"
        ],
        limits: {
          plotSize: 100,
          aiCredits: 1000,
          customModels: 5,
          mailboxes: 1
        }
      },
      {
        id: "business",
        name: "Business Quarter",
        price: 299,
        features: [
          "Up to 500 virtual square meters",
          "Advanced AI with lead generation",
          "20 custom 3D models",
          "Advanced analytics & reporting",
          "Priority support",
          "Multiple mailbox addresses",
          "Custom branding"
        ],
        limits: {
          plotSize: 500,
          aiCredits: 5000,
          customModels: 20,
          mailboxes: 5
        }
      },
      {
        id: "corporate",
        name: "Corporate Campus",
        price: 799,
        features: [
          "Up to 2000 virtual square meters",
          "AI Business Intelligence Suite",
          "Unlimited custom 3D models",
          "Real-time business insights",
          "Dedicated account manager",
          "Enterprise mailbox system",
          "API access",
          "White-label options"
        ],
        limits: {
          plotSize: 2000,
          aiCredits: 20000,
          customModels: -1, // unlimited
          mailboxes: 20
        }
      },
      {
        id: "enterprise",
        name: "Enterprise Metropolis",
        price: 1999,
        features: [
          "Unlimited virtual space",
          "Full AI automation suite",
          "Custom AI training",
          "Advanced integrations",
          "24/7 dedicated support",
          "Custom development",
          "SLA guarantees",
          "Multi-tenant architecture"
        ],
        limits: {
          plotSize: -1, // unlimited
          aiCredits: -1, // unlimited
          customModels: -1, // unlimited
          mailboxes: -1 // unlimited
        }
      }
    ];
  },
});

// Create or update subscription
export const createSubscription = mutation({
  args: {
    userId: v.string(),
    tier: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get tier limits directly instead of calling the query function
    const tiers = [
      {
        id: "startup",
        name: "Startup District",
        price: 99,
        features: [
          "Up to 100 virtual square meters",
          "Basic AI Business Concierge",
          "5 custom 3D models",
          "Basic analytics dashboard",
          "Email support",
          "Standard mailbox system"
        ],
        limits: {
          plotSize: 100,
          aiCredits: 1000,
          customModels: 5,
          mailboxes: 1
        }
      },
      {
        id: "business",
        name: "Business Quarter",
        price: 299,
        features: [
          "Up to 400 virtual square meters",
          "Advanced AI Business Concierge",
          "15 custom 3D models",
          "Advanced analytics dashboard",
          "Priority email support",
          "Enhanced mailbox system"
        ],
        limits: {
          plotSize: 400,
          aiCredits: 5000,
          customModels: 15,
          mailboxes: 3
        }
      },
      {
        id: "corporate",
        name: "Corporate Plaza",
        price: 999,
        features: [
          "Up to 1000 virtual square meters",
          "Premium AI Business Concierge",
          "Unlimited custom 3D models",
          "Premium analytics dashboard",
          "24/7 support",
          "Premium mailbox system"
        ],
        limits: {
          plotSize: 1000,
          aiCredits: 20000,
          customModels: 50,
          mailboxes: 10
        }
      },
      {
        id: "enterprise",
        name: "Enterprise Tower",
        price: 2999,
        features: [
          "Unlimited virtual square meters",
          "Enterprise AI Business Concierge",
          "Unlimited custom 3D models",
          "Enterprise analytics dashboard",
          "Dedicated account manager",
          "Enterprise mailbox system"
        ],
        limits: {
          plotSize: 5000,
          aiCredits: 100000,
          customModels: 100,
          mailboxes: 50
        }
      }
    ];
    
    const tierInfo = tiers.find(t => t.id === args.tier);
    
    if (!tierInfo) {
      throw new Error("Invalid subscription tier");
    }

    const now = Date.now();
    // Ensure tier is one of the allowed values
    const validTier = (() => {
      switch(args.tier) {
        case "startup":
        case "business":
        case "corporate":
        case "enterprise":
          return args.tier;
        default:
          return "startup"; // Default to startup if invalid tier
      }
    })();
    
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      tier: validTier,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000), // 30 days
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      monthlyRevenue: tierInfo.price * 100, // Convert to cents
      features: {
        plotSizeLimit: { width: tierInfo.limits.plotSize, depth: tierInfo.limits.plotSize },
        aiCredits: tierInfo.limits.aiCredits,
        customModels: tierInfo.limits.customModels,
        businessIntelligence: args.tier !== "startup",
        prioritySupport: args.tier !== "startup",
        apiAccess: ["corporate", "enterprise"].includes(args.tier),
        virtualEvents: ["business", "corporate", "enterprise"].includes(args.tier),
        customAI: ["corporate", "enterprise"].includes(args.tier)
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update user with new subscription
    await ctx.db.patch(user._id, {
      currentSubscription: subscriptionId,
      subscriptionTier: args.tier,
      aiCreditsLimit: tierInfo.limits.aiCredits,
      freeSquaresLimit: tierInfo.limits.plotSize,
      updatedAt: now,
    });

    return subscriptionId;
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user || !user.currentSubscription) {
      throw new Error("No active subscription found");
    }

    const subscription = await ctx.db.get(user.currentSubscription);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const now = Date.now();
    
    // Mark subscription as cancelled
    await ctx.db.patch(subscription._id, {
      status: "canceled",
      updatedAt: now,
    });

    // Revert user to free tier
    await ctx.db.patch(user._id, {
      currentSubscription: undefined,
      subscriptionTier: "free",
      aiCreditsLimit: 100, // Free tier limit
      freeSquaresLimit: 25, // Free tier limit
      updatedAt: now,
    });

    return { success: true };
  },
});

// Get subscription usage stats
export const getUsageStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) {
      return null;
    }

    // Get user's plots to calculate space usage
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const totalSpaceUsed = plots.reduce((total, plot) => {
      return total + (plot.size.width * plot.size.depth);
    }, 0);

    // Get AI interactions count for this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    // Get AI interactions for all user's plots
    const allAiInteractions = await ctx.db
      .query("aiInteractions")
      .filter((q) => q.gte(q.field("timestamp"), monthStart.getTime()))
      .collect();
      
    const userPlotIds = new Set(plots.map(plot => plot._id));
    const aiInteractions = allAiInteractions.filter(interaction => 
      userPlotIds.has(interaction.plotId)
    );

    return {
      spaceUsed: totalSpaceUsed,
      spaceLimit: user.freeSquaresLimit,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: user.aiCreditsLimit,
      plotsCount: plots.length,
      aiInteractionsThisMonth: aiInteractions.length,
      subscriptionTier: user.subscriptionTier
    };
  },
});