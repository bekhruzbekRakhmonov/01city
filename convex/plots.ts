import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Pricing constants
const FREE_SQUARES_LIMIT = 25; // 5x5 plot
const PRICE_PER_SQUARE_CENTS = 100; // $1.00 per square in cents
const CUSTOM_MODEL_UPLOAD_FEE_CENTS = 2000; // $20.00 for custom model upload

// Get all plots with enhanced data
export const getAll = query({
  args: {
    includeAdvertising: v.optional(v.boolean()),
    filterBySubscription: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let plots = await ctx.db.query("plots").collect();
    
    // Filter by subscription tier if specified
    if (args.filterBySubscription) {
      const users = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("subscriptionTier"), args.filterBySubscription))
        .collect();
      
      const userIds = new Set(users.map(u => u.userId));
      plots = plots.filter(plot => userIds.has(plot.userId));
    }
    
    // Enrich with owner information
    const enrichedPlots = await Promise.all(
      plots.map(async (plot) => {
        const owner = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), plot.userId))
          .first();
        
        return {
          ...plot,
          owner: owner ? {
            username: owner.username,
            subscriptionTier: owner.subscriptionTier,
            businessProfile: owner.businessProfile
          } : null
        };
      })
    );
    
    return enrichedPlots;
  },
});

// Get plot by ID with full details
export const getById = query({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.id);
    if (!plot) return null;
    
    // Get owner information
    const owner = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), plot.userId))
      .first();
    
    return {
      ...plot,
      owner: owner ? {
        username: owner.username,
        subscriptionTier: owner.subscriptionTier,
        businessProfile: owner.businessProfile
      } : null,
      analytics: {
        weeklyVisitors: 0, // TODO: Implement proper analytics tracking
        totalViews: 0
      }
    };
  },
});

// Get plots by user ID with enhanced features
export const getByUserId = query({
  args: { 
    userId: v.string(),
    includeAnalytics: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (!args.includeAnalytics) {
      return plots;
    }
    
    // Enrich with analytics data
    const enrichedPlots = await Promise.all(
      plots.map(async (plot) => {
        const leads = await ctx.db
          .query("leads")
          .filter((q) => q.eq(q.field("plotId"), plot._id))
          .collect();
        
        return {
          ...plot,
          analytics: {
            monthlyVisitors: 0, // TODO: Implement proper analytics tracking
            totalViews: 0,
            totalLeads: leads.length,
            qualifiedLeads: leads.filter(l => l.score >= 70).length
          }
        };
      })
    );
    
    return enrichedPlots;
  },
});

// Create a new plot with enhanced features
export const createPlot = mutation({
  args: {
    userId: v.string(),
    position: v.object({
      x: v.number(),
      z: v.number()
    }),
    size: v.object({
      width: v.number(),
      depth: v.number()
    }),
    address: v.optional(v.object({
      street: v.string(),
      number: v.string(),
      district: v.string(),
      city: v.string(),
      postalCode: v.string()
    })),
    mailbox: v.optional(v.object({
      address: v.string(),
      type: v.string(), // "standard", "premium", "business"
      autoResponder: v.optional(v.boolean())
    })),
    advertising: v.optional(v.object({
      enabled: v.boolean(),
      companyName: v.string(),
      website: v.optional(v.string()),
      description: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      industry: v.optional(v.string())
    })),
    aiFeatures: v.optional(v.object({
      chatbotEnabled: v.boolean(),
      autoResponder: v.boolean(),
      leadCapture: v.boolean(),
      aiPersonality: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique mailbox address if not provided
    let mailboxAddress = args.mailbox?.address;
    if (args.mailbox && !mailboxAddress) {
      mailboxAddress = `plot-${args.position.x}-${args.position.z}@metrospace.city`;
    }
    
    // Calculate pricing inline
    const totalSquares = args.size.width * args.size.depth;
    const pricePerSquare = 100; // $1.00 per square in cents
    const totalCost = totalSquares * pricePerSquare;
    
    const pricing = {
      totalCost,
      freeSquares: 0, // TODO: Calculate based on user's free squares
      paidSquares: totalSquares,
      pricePerSquare
    };
    
    const plotId = await ctx.db.insert("plots", {
      userId: args.userId,
      username: args.userId, // TODO: Fetch actual username from users table
      position: args.position,
      size: args.size,
      address: args.address ? {
        street: args.address.street,
        city: args.address.city,
        state: args.address.district, // Using district as state
        zipCode: args.address.postalCode,
        country: "US", // Default country
        coordinates: {
          lat: 0, // Default coordinates
          lng: 0
        }
      } : undefined,
      mailbox: args.mailbox ? {
        enabled: true,
        address: mailboxAddress!,
        type: args.mailbox.type,
        autoResponder: args.mailbox.autoResponder,
        publicContact: {
          email: "", // Default empty values
          phone: undefined,
          website: undefined
        }
      } : undefined,
      advertising: args.advertising ? {
        companyName: args.advertising.companyName,
        website: args.advertising.website,
        description: args.advertising.description || "",
        contact: {
          email: args.advertising.contactEmail || "",
          phone: undefined
        },
        industry: args.advertising.industry || "",
        services: "", // Required field
        socialMedia: {
          linkedin: undefined,
          twitter: undefined
        },
        businessHours: "9AM-5PM" // Default business hours
      } : undefined,
      aiFeatures: args.aiFeatures ? {
        chatbot: args.aiFeatures.chatbotEnabled,
        autoResponder: args.aiFeatures.autoResponder,
        leadCapture: args.aiFeatures.leadCapture,
        businessIntelligence: false, // Default value
        personality: args.aiFeatures.aiPersonality
      } : undefined,
      mainBuilding: {
        type: "standard",
        height: 10,
        color: "#FFFFFF",
        rotation: 0,
      },
      pricing,
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now
    });
    
    // Record analytics event
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    await ctx.db.insert("analytics", {
      plotId,
      date: today,
      visitors: 0,
      interactions: 0,
      leadsGenerated: 0,
      conversionRate: 0,
      revenue: 0,
      avgSessionTime: 0,
      topPages: [],
      trafficSources: {
        direct: 0,
        search: 0,
        social: 0,
        referral: 0
      }
    });
    
    return plotId;
  },
});

// Update plot advertising information
export const updateAdvertising = mutation({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    advertising: v.object({
      enabled: v.boolean(),
      companyName: v.string(),
      website: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      description: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      industry: v.optional(v.string()),
      services: v.optional(v.array(v.string())),
      socialMedia: v.optional(v.object({
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string())
      })),
      businessHours: v.optional(v.object({
        timezone: v.string(),
        schedule: v.array(v.object({
          day: v.string(),
          open: v.string(),
          close: v.string(),
          closed: v.boolean()
        }))
      }))
    })
  },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    if (plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    const now = Date.now();
    await ctx.db.patch(args.plotId, {
      advertising: {
        companyName: args.advertising.companyName,
        website: args.advertising.website,
        logoUrl: args.advertising.logoUrl,
        description: args.advertising.description || "",
        contact: {
          email: args.advertising.contactEmail || "",
          phone: undefined
        },
        industry: args.advertising.industry || "",
        services: args.advertising.services?.join(", ") || "",
        socialMedia: {
          linkedin: args.advertising.socialMedia?.linkedin,
          twitter: args.advertising.socialMedia?.twitter
        },
        businessHours: args.advertising.businessHours?.timezone 
          ? `${args.advertising.businessHours.timezone}: ${args.advertising.businessHours.schedule?.[0]?.open || "9AM"}-${args.advertising.businessHours.schedule?.[0]?.close || "5PM"}`
          : "9AM-5PM"
      },
      updatedAt: now
    });
    
    // Record analytics event
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const existingAnalytics = await ctx.db
      .query("analytics")
      .withIndex("by_plotId_date", q => q.eq("plotId", args.plotId).eq("date", today))
      .first();
      
    if (existingAnalytics) {
      await ctx.db.patch(existingAnalytics._id, {
        interactions: existingAnalytics.interactions + 1
      });
    } else {
      await ctx.db.insert("analytics", {
        plotId: args.plotId,
        date: today,
        visitors: 1,
        interactions: 1,
        leadsGenerated: 0,
        conversionRate: 0,
        revenue: 0,
        avgSessionTime: 0,
        topPages: [],
        trafficSources: {
          direct: 1,
          search: 0,
          social: 0,
          referral: 0
        }
      });
    }
    
    return { success: true };
  },
});

// Update plot AI features
export const updateAIFeatures = mutation({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    aiFeatures: v.object({
      chatbotEnabled: v.boolean(),
      autoResponder: v.boolean(),
      leadCapture: v.boolean(),
      businessIntelligence: v.boolean(),
      customPrompts: v.optional(v.array(v.string())),
      aiPersonality: v.optional(v.string()),
      responseTemplates: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    if (plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    // Check user subscription limits
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify AI features are allowed for user's subscription tier
    const allowedFeatures = getAIFeaturesForTier(user.subscriptionTier);
    
    if (args.aiFeatures.businessIntelligence && !allowedFeatures.businessIntelligence) {
      throw new Error("Business Intelligence requires Corporate or Enterprise subscription");
    }
    
    const now = Date.now();
    await ctx.db.patch(args.plotId, {
      aiFeatures: {
        chatbot: args.aiFeatures.chatbotEnabled,
        autoResponder: args.aiFeatures.autoResponder,
        leadCapture: args.aiFeatures.leadCapture,
        businessIntelligence: args.aiFeatures.businessIntelligence,
        personality: args.aiFeatures.aiPersonality,
        customPrompts: args.aiFeatures.customPrompts?.join('\n')
      },
      updatedAt: now
    });
    
    return { success: true };
  },
});

// Update plot mailbox settings
export const updateMailbox = mutation({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    mailbox: v.object({
      address: v.string(),
      type: v.string(),
      autoResponder: v.optional(v.boolean()),
      forwardingEmail: v.optional(v.string()),
      customGreeting: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    if (plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    // Check if mailbox address is unique
    const existingPlot = await ctx.db
      .query("plots")
      .filter((q) => 
        q.and(
          q.eq(q.field("mailbox.address"), args.mailbox.address),
          q.neq(q.field("_id"), args.plotId)
        )
      )
      .first();
    
    if (existingPlot) {
      throw new Error("Mailbox address already in use");
    }
    
    const now = Date.now();
    await ctx.db.patch(args.plotId, {
      mailbox: {
        enabled: true,
        address: args.mailbox.address,
        type: args.mailbox.type,
        autoResponder: args.mailbox.autoResponder,
        customGreeting: args.mailbox.customGreeting,
        publicContact: {
          email: args.mailbox.forwardingEmail,
          phone: undefined,
          website: undefined
        }
      },
      updatedAt: now
    });
    
    return { success: true };
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
    premiumFeatures: v.optional(v.array(v.string()))
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
    
    // Add premium features cost
    let premiumFeaturesPrice = 0;
    if (args.premiumFeatures?.length) {
      const featurePricing: Record<string, number> = {
        "chatbotEnabled": 2500, // $25
        "autoResponder": 1500, // $15
        "leadCapture": 2000, // $20
        "businessIntelligence": 4000, // $40
      };
      
      premiumFeaturesPrice = args.premiumFeatures.reduce((total, feature) => {
        return total + (featurePricing[feature] || 0);
      }, 0);
    }
    
    // Apply subscription discount if user is provided
    let subscriptionDiscount = 0;
    if (user) {
      const discountRates: Record<string, number> = {
        free: 0,
        startup: 0.1, // 10%
        business: 0.2, // 20%
        corporate: 0.3, // 30%
        enterprise: 0.4 // 40%
      };
      
      const discountRate = discountRates[user.subscriptionTier] || 0;
      subscriptionDiscount = (plotCost + customModelFee + premiumFeaturesPrice) * discountRate;
    }
    
    const totalCost = plotCost + customModelFee + premiumFeaturesPrice - subscriptionDiscount;
    
    return {
      totalSquares,
      freeSquares: freeSquaresToUse,
      paidSquares,
      pricePerSquare: PRICE_PER_SQUARE_CENTS,
      plotCost,
      customModelFee,
      premiumFeaturesPrice,
      subscriptionDiscount,
      totalCost,
      paymentRequired: totalCost > 0,
    };
  },
});

// Get plots by mailbox address
export const getByMailboxAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plots")
      .withIndex("by_mailbox_address", (q) => q.eq("mailbox.address", args.address))
      .first();
  },
});

// Search plots by various criteria
export const searchPlots = query({
  args: {
    query: v.optional(v.string()),
    industry: v.optional(v.string()),
    hasAdvertising: v.optional(v.boolean()),
    hasAI: v.optional(v.boolean()),
    subscriptionTier: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let plots = await ctx.db.query("plots").take(limit * 2); // Get more to filter
    
    // Apply filters
    if (args.hasAdvertising !== undefined) {
      plots = plots.filter(plot => !!plot.advertising === args.hasAdvertising);
    }
    
    if (args.hasAI !== undefined) {
      plots = plots.filter(plot => !!plot.aiFeatures?.chatbot === args.hasAI);
    }
    
    if (args.industry) {
      plots = plots.filter(plot => plot.advertising?.industry === args.industry);
    }
    
    if (args.query) {
      const queryLower = args.query.toLowerCase();
      plots = plots.filter(plot => 
        plot.advertising?.companyName?.toLowerCase().includes(queryLower) ||
        plot.advertising?.description?.toLowerCase().includes(queryLower) ||
        plot.address?.street?.toLowerCase().includes(queryLower)
      );
    }
    
    // Enrich with owner information
    const enrichedPlots = await Promise.all(
      plots.slice(0, limit).map(async (plot) => {
        const owner = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), plot.userId))
          .first();
        
        return {
          ...plot,
          owner: owner ? {
            username: owner.username,
            subscriptionTier: owner.subscriptionTier
          } : null
        };
      })
    );
    
    return enrichedPlots;
  },
});

// Helper function to get AI features allowed for subscription tier
function getAIFeaturesForTier(tier: string) {
  const features = {
    free: {
      chatbotEnabled: false,
      autoResponder: false,
      leadCapture: false,
      businessIntelligence: false
    },
    startup: {
      chatbotEnabled: true,
      autoResponder: true,
      leadCapture: true,
      businessIntelligence: false
    },
    business: {
      chatbotEnabled: true,
      autoResponder: true,
      leadCapture: true,
      businessIntelligence: true
    },
    corporate: {
      chatbotEnabled: true,
      autoResponder: true,
      leadCapture: true,
      businessIntelligence: true
    },
    enterprise: {
      chatbotEnabled: true,
      autoResponder: true,
      leadCapture: true,
      businessIntelligence: true
    }
  };
  
  return features[tier as keyof typeof features] || features.free;
}

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
      selectedModel: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.string(), // 'model' or 'procedural'
        modelType: v.optional(v.string()), // for 3D models
        buildingType: v.optional(v.string()), // for procedural buildings
      })),
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
    companyInfo: v.optional(v.object({
      companyName: v.string(),
      website: v.string(),
      logoSvg: v.string(),
      shortDescription: v.string(),
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
        lifetimeValue: 0,
        subscriptionTier: "free",
        freeSquaresUsed: 0,
        freeSquaresLimit: FREE_SQUARES_LIMIT,
        aiCreditsUsed: 0,
        aiCreditsLimit: 0,
        onboardingCompleted: false,
        loginCount: 0,
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
      address: { // Initialize address field
        street: "Main Street", // Placeholder, can be updated later
        city: "MetroCity", // Placeholder
        state: "MS", // Placeholder
        zipCode: "01000", // Placeholder
        country: "MetroSpace", // Placeholder
        coordinates: { // Placeholder, ideally derived from plotData.position
          lat: plotData.position.x, // Example: using x for lat
          lng: plotData.position.z, // Example: using z for lng
        },
      },
      mailbox: { // Initialize mailbox field
        enabled: false,
        address: "", // Will be set by setupPlotMailbox
        publicContact: {}, // Initialize empty public contact
      },
      pricing: {
        totalCost,
        freeSquares: freeSquaresToUse,
        paidSquares,
        pricePerSquare: PRICE_PER_SQUARE_CENTS,
      },
      paymentStatus,
      paymentId,
      customModel: customModel || undefined,
      companyInfo: args.companyInfo ? {
        companyName: args.companyInfo.companyName,
        website: args.companyInfo.website,
        logoSvg: args.companyInfo.logoSvg,
        shortDescription: args.companyInfo.shortDescription,
        uploadedAt: timestamp,
      } : undefined,
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

// Setup or update a plot's mailbox
export const setupPlotMailbox = mutation({
  args: {
    plotId: v.id("plots"),
    enable: v.boolean(), // Whether to enable or disable the mailbox
    customAddress: v.optional(v.string()), // Optional: allow user to suggest an address
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to set up a mailbox.");
    }

    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found.");
    }

    // Ensure the current user owns the plot
    if (plot.userId !== identity.subject) {
      throw new Error("User not authorized to modify this plot's mailbox.");
    }

    let mailboxAddress = plot.mailbox?.address;

    if (args.enable) {
      if (args.customAddress) {
        // Check if custom address is already taken by another plot's mailbox
        const existingPlotWithAddress = await ctx.db
          .query("plots")
          .withIndex("by_mailbox_address", (q) => q.eq("mailbox.address", args.customAddress!))
          .filter((q) => q.neq(q.field("_id"), args.plotId)) // Exclude current plot
          .first();
        if (existingPlotWithAddress) {
          throw new Error(`Mailbox address "${args.customAddress}" is already in use.`);
        }
        mailboxAddress = args.customAddress;
      } else if (!mailboxAddress) {
        // Generate a unique address if one doesn't exist and no custom one is provided
        // Simple unique address: "plot-[first 8 chars of plotId]"
        // This needs to be robust enough to ensure uniqueness if plots can be deleted and IDs potentially reused (though unlikely with Convex IDs)
        // A more robust solution might involve a separate counter or a truly random string checked for collisions.
        let potentialAddress = `plot-${args.plotId.substring(0, 8)}`;
        let Retycount = 0;
        let isUnique = false;
        while(!isUnique && Retycount < 5){ // try 5 times to generate unique address
            const existing = await ctx.db
            .query("plots")
            .withIndex("by_mailbox_address", (q) => q.eq("mailbox.address", potentialAddress))
            .first();
            if(!existing){
                isUnique = true;
                mailboxAddress = potentialAddress;
            } else {
                // attempt to make it unique by adding a random char
                potentialAddress = `plot-${args.plotId.substring(0, 8)}-${Math.random().toString(36).substring(2, 3)}`;
                Retycount++;
            }
        }
        if(!isUnique){
            // Fallback if we couldn't generate a unique one easily, this should be rare
            mailboxAddress = `plot-${args.plotId}-${Date.now().toString().slice(-4)}`; 
        }
      }
    }

    await ctx.db.patch(args.plotId, {
      mailbox: {
        // Spread existing mailbox fields first, ensuring publicContact is handled
        ...(plot.mailbox || { publicContact: {} }), // Default publicContact if mailbox is new
        enabled: args.enable,
        address: args.enable ? mailboxAddress! : (plot.mailbox?.address || ""), // Assert mailboxAddress is string when enabling
        // Explicitly carry over publicContact if it exists, otherwise it's defaulted above
        publicContact: plot.mailbox?.publicContact || {},
      },
      updatedAt: Date.now(),
    });

    return { mailboxAddress: args.enable ? mailboxAddress : undefined, enabled: args.enable };
  },
});
// Delete a plot
export const remove = mutation({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});