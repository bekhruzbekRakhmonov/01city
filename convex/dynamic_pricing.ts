import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Base pricing constants
const BASE_PRICE_PER_SQUARE = 1.0; // $1 per square meter
const CUSTOM_MODEL_FEE = 20.0; // $20 for custom model upload
const PREMIUM_LOCATION_MULTIPLIER = 2.0;
const HIGH_DEMAND_MULTIPLIER = 1.5;
const SUBSCRIPTION_DISCOUNTS = {
  free: 0,
  startup: 0.1, // 10% discount
  business: 0.2, // 20% discount
  corporate: 0.3, // 30% discount
  enterprise: 0.4 // 40% discount
};

// Calculate dynamic pricing for a plot
export const calculatePlotPricing = query({
  args: {
    size: v.object({
      width: v.number(),
      depth: v.number()
    }),
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    }),
    userId: v.optional(v.string()),
    hasCustomModel: v.optional(v.boolean()),
    premiumFeatures: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const area = args.size.width * args.size.depth;
    let basePrice = area * BASE_PRICE_PER_SQUARE;
    
    // Location-based pricing
    const locationMultiplier = calculateLocationMultiplier(args.position);
    let locationPrice = basePrice * locationMultiplier;
    
    // Demand-based pricing
    const demandMultiplier = await calculateDemandMultiplier(ctx, args.position);
    let demandPrice = locationPrice * demandMultiplier;
    
    // Custom model fee
    let customModelFee = args.hasCustomModel ? CUSTOM_MODEL_FEE : 0;
    
    // Premium features pricing
    let premiumFeaturesPrice = 0;
    if (args.premiumFeatures?.length) {
      premiumFeaturesPrice = calculatePremiumFeaturesPrice(args.premiumFeatures);
    }
    
    // User subscription discount
    let subscriptionDiscount = 0;
    if (args.userId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (user) {
        const discountRate = SUBSCRIPTION_DISCOUNTS[user.subscriptionTier as keyof typeof SUBSCRIPTION_DISCOUNTS] || 0;
        subscriptionDiscount = (demandPrice + customModelFee + premiumFeaturesPrice) * discountRate;
      }
    }
    
    const totalPrice = demandPrice + customModelFee + premiumFeaturesPrice - subscriptionDiscount;
    
    return {
      breakdown: {
        basePrice: Math.round(basePrice * 100) / 100,
        locationMultiplier: Math.round(locationMultiplier * 100) / 100,
        demandMultiplier: Math.round(demandMultiplier * 100) / 100,
        customModelFee,
        premiumFeaturesPrice: Math.round(premiumFeaturesPrice * 100) / 100,
        subscriptionDiscount: Math.round(subscriptionDiscount * 100) / 100
      },
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: "USD",
      area,
      pricePerSquare: Math.round((totalPrice / area) * 100) / 100
    };
  },
});

// Get pricing trends for analytics
export const getPricingTrends = query({
  args: {
    timeRange: v.optional(v.string()), // "day", "week", "month"
    area: v.optional(v.object({
      minX: v.number(),
      maxX: v.number(),
      minY: v.number(),
      maxY: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "month";
    const now = Date.now();
    
    let startTime = now;
    switch (timeRange) {
      case "day":
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case "week":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    let query = ctx.db
      .query("transactions")
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "plot_purchase"),
          q.gte(q.field("createdAt"), startTime)
        )
      );
    
    const transactions = await query.collect();
    
    // Get plot details for each transaction
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        // Since plotId might not exist in transactions schema, we'll work without it
        return { ...transaction, plot: null };
      })
    );
    
    // Filter by area if specified - skip area filtering since we don't have plot position data
    const filteredTransactions = enrichedTransactions;
    
    // Calculate trends
    const totalTransactions = filteredTransactions.length;
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averagePrice = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Price distribution
    const priceRanges = {
      "0-50": 0,
      "51-100": 0,
      "101-200": 0,
      "201-500": 0,
      "500+": 0
    };
    
    filteredTransactions.forEach(t => {
      const price = t.amount;
      if (price <= 50) priceRanges["0-50"]++;
      else if (price <= 100) priceRanges["51-100"]++;
      else if (price <= 200) priceRanges["101-200"]++;
      else if (price <= 500) priceRanges["201-500"]++;
      else priceRanges["500+"]++;
    });
    
    return {
      totalTransactions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      priceRanges,
      timeRange
    };
  },
});

// Update pricing factors based on market conditions
export const updatePricingFactors = mutation({
  args: {
    adminUserId: v.string(),
    factors: v.object({
      basePriceMultiplier: v.optional(v.number()),
      locationPremiums: v.optional(v.any()),
      demandThresholds: v.optional(v.any()),
      subscriptionDiscounts: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    // In a real implementation, you'd verify admin permissions
    // For now, we'll store these in a pricing_config table
    
    const now = Date.now();
    
    // For now, we'll just return success without storing config
    // TODO: Create a proper pricing configuration table in schema
    
    return { success: true };
  },
});

// Get current pricing factors
export const getPricingFactors = query({
  args: {},
  handler: async (ctx) => {
    // Return default pricing configuration
    return {
      basePriceMultiplier: 1.0,
      locationPremiums: {
        center: 2.0,
        premium: 1.5,
        standard: 1.0,
        outskirts: 0.8
      },
      demandThresholds: {
        high: 1.5,
        medium: 1.2,
        low: 1.0
      },
      subscriptionDiscounts: SUBSCRIPTION_DISCOUNTS
    };
  },
});

// Helper function to calculate location multiplier
function calculateLocationMultiplier(position: { x: number; y: number; z: number }): number {
  // Center of the map (0,0) is premium
  const distanceFromCenter = Math.sqrt(position.x * position.x + (position.z || 0) * (position.z || 0));
  
  // Define location zones
  if (distanceFromCenter <= 10) {
    return 2.0; // Premium center location
  } else if (distanceFromCenter <= 25) {
    return 1.5; // High-value area
  } else if (distanceFromCenter <= 50) {
    return 1.0; // Standard area
  } else {
    return 0.8; // Outskirts discount
  }
}

// Helper function to calculate demand multiplier
async function calculateDemandMultiplier(ctx: any, position: { x?: number; y?: number; z?: number }): Promise<number> {
  // Calculate demand based on nearby plots and recent activity
  const radius = 20; // Check within 20 units
  
  const nearbyPlots = await ctx.db
    .query("plots")
    .filter((q: any) => 
      q.and(
        q.gte(q.field("position.x"), (position.x || 0) - radius),
        q.lte(q.field("position.x"), (position.x || 0) + radius),
        q.gte(q.field("position.z"), (position.z || 0) - radius),
        q.lte(q.field("position.z"), (position.z || 0) + radius)
      )
    )
    .collect();
  
  const occupancyRate = nearbyPlots.length / (radius * radius * 0.1); // Normalize
  
  // Recent transaction activity in the area
  const recentTransactions = await ctx.db
    .query("transactions")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("type"), "plot_purchase"),
        q.gte(q.field("createdAt"), Date.now() - (7 * 24 * 60 * 60 * 1000)) // Last 7 days
      )
    )
    .collect();
  
  const nearbyTransactions = await Promise.all(
    recentTransactions.map(async (transaction: any) => {
      if (transaction.plotId) {
        const plot = await ctx.db.get(transaction.plotId);
        if (plot) {
          // Calculate distance using only x and z coordinates since y might not exist
          const distance = Math.sqrt(
            Math.pow((plot.position?.x || 0) - (position?.x || 0), 2) + 
            Math.pow((plot.position?.z || 0) - (position?.z || 0), 2)
          );
          return distance <= radius ? transaction : null;
        }
      }
      return null;
    })
  );
  
  const recentActivity = nearbyTransactions.filter(t => t !== null).length;
  
  // Calculate demand multiplier
  let demandMultiplier = 1.0;
  
  if (occupancyRate > 0.7) {
    demandMultiplier += 0.3; // High occupancy premium
  } else if (occupancyRate > 0.4) {
    demandMultiplier += 0.1; // Medium occupancy
  }
  
  if (recentActivity > 5) {
    demandMultiplier += 0.2; // High activity premium
  } else if (recentActivity > 2) {
    demandMultiplier += 0.1; // Medium activity
  }
  
  return Math.min(demandMultiplier, 2.0); // Cap at 2x
}

// Helper function to calculate premium features pricing
function calculatePremiumFeaturesPrice(features: string[]): number {
  const featurePricing: Record<string, number> = {
    "ai_chatbot": 25.0,
    "advanced_analytics": 15.0,
    "custom_branding": 30.0,
    "priority_support": 20.0,
    "api_access": 40.0,
    "white_label": 100.0,
    "multiple_mailboxes": 10.0,
    "business_hours_display": 5.0,
    "social_media_integration": 15.0,
    "lead_capture_forms": 20.0
  };
  
  return features.reduce((total, feature) => {
    return total + (featurePricing[feature] || 0);
  }, 0);
}

// Get recommended pricing for a plot
export const getRecommendedPricing = query({
  args: {
    plotId: v.id("plots"),
    targetMargin: v.optional(v.number()) // Desired profit margin
  },
  handler: async (ctx, args): Promise<any> => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    const targetMargin = args.targetMargin || 0.2; // 20% default margin
    
    // Calculate current market price using the api
    const marketPrice: any = await ctx.runQuery(api.dynamic_pricing.calculatePlotPricing, {
      size: plot.size,
      position: {
        x: plot.position?.x || 0,
        y: (plot.position as any)?.y || 0,
        z: plot.position?.z || 0
      },
      userId: plot.userId, // Use userId instead of ownerId
      hasCustomModel: !!plot.customModel,
      premiumFeatures: plot.aiFeatures ? Object.keys(plot.aiFeatures).filter(key => 
        plot.aiFeatures && plot.aiFeatures[key as keyof typeof plot.aiFeatures] === true
      ) : []
    });
    
    // Calculate recommended pricing based on market conditions
    const baseRecommendation = marketPrice.totalPrice;
    const marginAdjustment = baseRecommendation * targetMargin;
    const recommendedPrice = baseRecommendation + marginAdjustment;
    
    // Get competitor analysis (nearby plots)
    const nearbyPlots = await ctx.db
      .query("plots")
      .filter((q: any) => 
        q.and(
          q.gte(q.field("position.x"), (plot.position?.x || 0) - 20),
          q.lte(q.field("position.x"), (plot.position?.x || 0) + 20),
          q.gte(q.field("position.z"), (plot.position?.z || 0) - 20),
          q.lte(q.field("position.z"), (plot.position?.z || 0) + 20),
          q.neq(q.field("_id"), args.plotId)
        )
      )
      .take(10);
    
    const competitorPrices = nearbyPlots
      .filter(p => p.pricing?.totalCost)
      .map(p => p.pricing!.totalCost!);
    
    const averageCompetitorPrice = competitorPrices.length > 0 
      ? competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
      : 0;
    
    return {
      currentMarketPrice: marketPrice.totalPrice,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      competitorAnalysis: {
        averagePrice: Math.round(averageCompetitorPrice * 100) / 100,
        competitorCount: competitorPrices.length,
        priceRange: competitorPrices.length > 0 ? {
          min: Math.min(...competitorPrices),
          max: Math.max(...competitorPrices)
        } : null
      },
      recommendations: {
        priceOptimal: recommendedPrice <= averageCompetitorPrice * 1.1,
        marketPosition: recommendedPrice > averageCompetitorPrice ? "premium" : "competitive",
        suggestedAdjustment: averageCompetitorPrice > 0 ? 
          Math.round(((averageCompetitorPrice - recommendedPrice) / recommendedPrice) * 100) : 0
      }
    };
  },
});