import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record analytics event
export const recordEvent = mutation({
  args: {
    plotId: v.id("plots"),
    visitors: v.optional(v.number()),
    interactions: v.optional(v.number()),
    leadsGenerated: v.optional(v.number()),
    revenue: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("analytics", {
      plotId: args.plotId,
      date: new Date(now).toISOString().split('T')[0], // YYYY-MM-DD format
      visitors: args.visitors || 1,
      interactions: args.interactions || 1,
      leadsGenerated: args.leadsGenerated || 0,
      conversionRate: 0,
      revenue: args.revenue || 0,
      avgSessionTime: 0,
      topPages: [],
      trafficSources: {
        direct: 1,
        search: 0,
        social: 0,
        referral: 0
      }
    });
  },
});

// Get business dashboard analytics
export const getBusinessDashboard = query({
  args: {
    userId: v.string(),
    timeRange: v.optional(v.string()), // "day", "week", "month", "year"
    plotId: v.optional(v.id("plots"))
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
      case "year":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get revenue events
    let revenueQuery = ctx.db
      .query("revenueEvents")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("timestamp"), startTime)
        )
      );
    
    if (args.plotId) {
      revenueQuery = revenueQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const revenueEvents = await revenueQuery.collect();
    
    // Get analytics events
    let analyticsQuery = ctx.db
      .query("analytics")
      .filter((q) => 
        q.gte(q.field("date"), new Date(startTime).toISOString().split('T')[0])
      );
    
    if (args.plotId) {
      analyticsQuery = analyticsQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const analyticsEvents = await analyticsQuery.collect();
    
    // Get leads
    let leadsQuery = ctx.db
      .query("leads")
      .filter((q) => 
        q.gte(q.field("createdAt"), startTime)
      );
    
    if (args.plotId) {
      leadsQuery = leadsQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const leads = await leadsQuery.collect();
    
    // Get AI interactions
    let aiQuery = ctx.db
      .query("aiInteractions")
      .filter((q) => 
        q.gte(q.field("timestamp"), startTime)
      );
    
    if (args.plotId) {
      aiQuery = aiQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const aiInteractions = await aiQuery.collect();
    
    // Calculate metrics
    const totalRevenue = revenueEvents.reduce((sum, event) => sum + event.amount, 0);
    const totalVisitors = analyticsEvents.reduce((sum, event) => sum + event.visitors, 0);
    
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.score >= 70).length;
    const closedDeals = leads.filter(l => l.status === "converted").length;
    const totalDealValue = 0; // Deal value not in schema
    
    const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
    const closeRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
    
    // AI metrics
    const aiSessions = new Set(aiInteractions.map(i => i.sessionId)).size;
    const averageLeadScore = aiInteractions.length > 0 
      ? aiInteractions.reduce((sum, i) => sum + i.leadScore, 0) / aiInteractions.length
      : 0;
    
    // Revenue breakdown
    const revenueByType = revenueEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + event.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Traffic sources from analytics data
    const trafficSources = analyticsEvents.reduce((acc, event) => {
      const sources = event.trafficSources;
      acc.direct = (acc.direct || 0) + sources.direct;
      acc.search = (acc.search || 0) + sources.search;
      acc.social = (acc.social || 0) + sources.social;
      acc.referral = (acc.referral || 0) + sources.referral;
      return acc;
    }, { direct: 0, search: 0, social: 0, referral: 0 });
    
    // Daily trends (last 30 days for month view)
    const dailyTrends = [];
    const daysToShow = timeRange === "year" ? 12 : (timeRange === "month" ? 30 : 7);
    const intervalMs = timeRange === "year" ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const dayStart = now - (i * intervalMs);
      const dayEnd = dayStart + intervalMs;
      
      const dayRevenue = revenueEvents
        .filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const dayVisitors = analyticsEvents
        .filter(e => {
          const eventDate = new Date(e.date).getTime();
          return eventDate >= dayStart && eventDate < dayEnd;
        })
        .reduce((sum, e) => sum + e.visitors, 0);
      
      const dayLeads = leads.filter(l => l.createdAt >= dayStart && l.createdAt < dayEnd).length;
      
      dailyTrends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        revenue: Math.round(dayRevenue * 100) / 100,
        visitors: dayVisitors,
        leads: dayLeads
      });
    }
    
    return {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalVisitors,
        totalLeads,
        qualifiedLeads,
        closedDeals,
        totalDealValue: Math.round(totalDealValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        closeRate: Math.round(closeRate * 100) / 100
      },
      aiMetrics: {
        totalInteractions: aiInteractions.length,
        uniqueSessions: aiSessions,
        averageLeadScore: Math.round(averageLeadScore),
        aiGeneratedLeads: leads.filter(l => l.source === "ai_chat").length
      },
      revenueByType,
      trafficSources,
      dailyTrends,
      timeRange
    };
  },
});

// Get visitor analytics for a plot
export const getPlotVisitorAnalytics = query({
  args: {
    plotId: v.id("plots"),
    timeRange: v.optional(v.string())
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
    
    const visits = await ctx.db
      .query("analytics")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.gte(q.field("date"), new Date(startTime).toISOString().split('T')[0])
        )
      )
      .collect();
    
    const uniqueVisitors = visits.reduce((sum, v) => sum + v.visitors, 0);
    const totalPageViews = visits.reduce((sum, v) => sum + v.interactions, 0);
    const averageSessionDuration = visits.reduce((sum, v) => sum + v.avgSessionTime, 0) / visits.length || 0;

    // Geographic distribution - simplified since not in schema
    const geoDistribution = { "Unknown": uniqueVisitors };

    // Device types - simplified since not in schema
    const deviceTypes = { "Unknown": uniqueVisitors };

    // Hourly distribution - simplified since timestamp not available
    const hourlyDistribution = Array(24).fill(0);
    hourlyDistribution[new Date().getHours()] = uniqueVisitors;
    
    return {
      uniqueVisitors,
      totalPageViews,
      averageSessionDuration: Math.round(averageSessionDuration),
      geoDistribution,
      deviceTypes,
      hourlyDistribution,
      timeRange
    };
  },
});

// Get real-time analytics
export const getRealTimeData = query({
  args: {
    userId: v.string(),
    plotId: v.optional(v.id("plots"))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);
    
    // Current active sessions - simplified since timestamp not in analytics schema
    const activeSessions = await ctx.db
      .query("analytics")
      .filter((q) => 
        args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
      )
      .collect();
    
    const activeVisitors = activeSessions.length; // Count unique sessions as active visitors
    
    // Recent leads (last hour)
    const recentLeadsQuery = ctx.db
      .query("leads")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), lastHour),
          args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
        )
      );
    
    const recentLeads = await recentLeadsQuery.collect();
    
    // Recent AI interactions
    const recentAIQuery = ctx.db
      .query("aiInteractions")
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), lastHour),
          args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
        )
      );
    
    const recentAI = await recentAIQuery.collect();
    
    // Revenue today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    let todayRevenueQuery = ctx.db
      .query("revenueEvents")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("timestamp"), todayStart.getTime())
        )
      );
    
    if (args.plotId) {
      todayRevenueQuery = todayRevenueQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const todayRevenue = await todayRevenueQuery.collect();
    const totalTodayRevenue = todayRevenue.reduce((sum, event) => sum + event.amount, 0);
    
    return {
      activeVisitors,
      recentLeads: recentLeads.length,
      recentAIInteractions: recentAI.length,
      todayRevenue: Math.round(totalTodayRevenue * 100) / 100,
      lastUpdated: now
    };
  },
});

// Alias for backward compatibility
export const getRealTimeAnalytics = query({
  args: {
    userId: v.string(),
    plotId: v.optional(v.id("plots"))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);
    
    // Current active sessions - simplified since timestamp not in analytics schema
    const activeSessions = await ctx.db
      .query("analytics")
      .filter((q) => 
        args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
      )
      .collect();
    
    const activeVisitors = activeSessions.length; // Count unique sessions as active visitors
    
    // Recent leads (last hour)
    const recentLeadsQuery = ctx.db
      .query("leads")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), lastHour),
          args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
        )
      );
    
    const recentLeads = await recentLeadsQuery.collect();
    
    // Recent AI interactions
    const recentAIQuery = ctx.db
      .query("aiInteractions")
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), lastHour),
          args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.neq(q.field("plotId"), undefined)
        )
      );
    
    const recentAI = await recentAIQuery.collect();
    
    // Revenue today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    let todayRevenueQuery = ctx.db
      .query("revenueEvents")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gte(q.field("timestamp"), todayStart.getTime())
        )
      );
    
    if (args.plotId) {
      todayRevenueQuery = todayRevenueQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const todayRevenue = await todayRevenueQuery.collect();
    const totalTodayRevenue = todayRevenue.reduce((sum, event) => sum + event.amount, 0);
    
    return {
      activeVisitors,
      recentLeads: recentLeads.length,
      recentAIInteractions: recentAI.length,
      todayRevenue: Math.round(totalTodayRevenue * 100) / 100,
      lastUpdated: now
    };
  },
});

// Export analytics data
export const exportAnalytics = query({
  args: {
    userId: v.string(),
    type: v.string(), // "revenue", "visitors", "leads", "ai_interactions"
    plotId: v.optional(v.id("plots")),
    format: v.optional(v.string()), // "csv", "json"
    timeRange: v.object({
      start: v.number(),
      end: v.number()
    })
  },
  handler: async (ctx, args) => {
    let data: any[] = [];
    
    switch (args.type) {
      case "revenue":
        let revenueQuery = ctx.db
          .query("revenueEvents")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), args.userId),
              q.gte(q.field("timestamp"), args.timeRange.start),
              q.lte(q.field("timestamp"), args.timeRange.end)
            )
          );
        
        if (args.plotId) {
          revenueQuery = revenueQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
        }
        
        const revenueEvents = await revenueQuery.collect();
        data = revenueEvents.map(event => ({
          date: new Date(event.timestamp).toISOString(),
          type: event.type,
          amount: event.amount,
          plotId: event.plotId,
          metadata: JSON.stringify(event.metadata || {})
        }));
        break;
        
      case "visitors":
        let visitorQuery = ctx.db
          .query("analytics")
          .filter((q) => 
            q.and(
              q.gte(q.field("date"), new Date(args.timeRange.start).toISOString().split('T')[0]),
              q.lte(q.field("date"), new Date(args.timeRange.end).toISOString().split('T')[0])
            )
          );
        
        if (args.plotId) {
          visitorQuery = visitorQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
        }
        
        const visits = await visitorQuery.collect();
        data = visits.map(visit => ({
          date: visit.date,
          plotId: visit.plotId,
          visitors: visit.visitors,
          interactions: visit.interactions,
          avgSessionTime: visit.avgSessionTime
        }));
        break;
        
      case "leads":
        let leadsQuery = ctx.db
          .query("leads")
          .filter((q) => 
            q.and(
              q.gte(q.field("createdAt"), args.timeRange.start),
              q.lte(q.field("createdAt"), args.timeRange.end)
            )
          );
        
        if (args.plotId) {
          leadsQuery = leadsQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
        }
        
        const leads = await leadsQuery.collect();
        data = leads.map(lead => ({
          date: new Date(lead.createdAt).toISOString(),
          email: lead.email || "",
          name: lead.name || "",
          company: lead.company || "",
          score: lead.score,
          status: lead.status,
          source: lead.source
        }));
        break;
        
      case "ai_interactions":
        let aiQuery = ctx.db
          .query("aiInteractions")
          .filter((q) => 
            q.and(
              q.gte(q.field("timestamp"), args.timeRange.start),
              q.lte(q.field("timestamp"), args.timeRange.end)
            )
          );
        
        if (args.plotId) {
          aiQuery = aiQuery.filter((q) => q.eq(q.field("plotId"), args.plotId));
        }
        
        const aiInteractions = await aiQuery.collect();
        data = aiInteractions.map(interaction => ({
          date: new Date(interaction.timestamp).toISOString(),
          sessionId: interaction.sessionId,
          visitorId: interaction.visitorId,
          message: interaction.message,
          response: interaction.response,
          leadScore: interaction.leadScore,
          plotId: interaction.plotId
        }));
        break;
    }
    
    return {
      data,
      count: data.length,
      type: args.type,
      timeRange: {
        start: new Date(args.timeRange.start).toISOString(),
        end: new Date(args.timeRange.end).toISOString()
      },
      exportedAt: new Date().toISOString()
    };
  },
});

// Get performance insights and recommendations
export const getPerformanceInsights = query({
  args: {
    userId: v.string(),
    plotId: v.optional(v.id("plots"))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const last30Days = now - (30 * 24 * 60 * 60 * 1000);
    // const previous30Days = last30Days - (30 * 24 * 60 * 60 * 1000);
    
    // TODO: Implement growth metrics calculation
    // For now, return placeholder data
    
    // Define placeholder data for current period
    const currentPeriodData = {
      overview: {
        totalRevenue: 1200,
        totalVisitors: 500,
        totalLeads: 50,
        conversionRate: 10,
        avgSessionTime: 120
      },
      aiMetrics: {
        chatbotInteractions: 300,
        averageLeadScore: 75,
        automatedResponses: 250
      },
      trafficSources: {
        direct: 200,
        search: 150,
        social: 100,
        referral: 50
      }
    };
    
    // Calculate trends (simplified - in production you'd get actual previous period data)
    const insights = [];
    const recommendations = [];
    
    // Revenue insights
    if (currentPeriodData.overview.totalRevenue > 1000) {
      insights.push({
        type: "positive",
        title: "Strong Revenue Performance",
        description: `Generated $${currentPeriodData.overview.totalRevenue} in revenue this month`,
        metric: "revenue"
      });
    } else if (currentPeriodData.overview.totalRevenue < 100) {
      insights.push({
        type: "warning",
        title: "Low Revenue",
        description: "Revenue is below expected levels",
        metric: "revenue"
      });
      recommendations.push({
        priority: "high",
        title: "Improve Monetization",
        description: "Consider upgrading your subscription tier or enabling premium features",
        action: "upgrade_subscription"
      });
    }
    
    // Conversion insights
    if (currentPeriodData.overview.conversionRate < 2) {
      insights.push({
        type: "warning",
        title: "Low Conversion Rate",
        description: `Only ${currentPeriodData.overview.conversionRate}% of visitors become leads`,
        metric: "conversion"
      });
      recommendations.push({
        priority: "medium",
        title: "Optimize Lead Capture",
        description: "Enable AI chatbot and lead capture forms to improve conversions",
        action: "enable_ai_features"
      });
    }
    
    // AI performance insights
    if (currentPeriodData.aiMetrics.averageLeadScore > 70) {
      insights.push({
        type: "positive",
        title: "High-Quality AI Interactions",
        description: `Average lead score of ${currentPeriodData.aiMetrics.averageLeadScore}`,
        metric: "ai_quality"
      });
    }
    
    // Traffic insights
    if (currentPeriodData.overview.totalVisitors < 50) {
      insights.push({
        type: "warning",
        title: "Low Traffic",
        description: "Your plot needs more visibility",
        metric: "traffic"
      });
      recommendations.push({
        priority: "high",
        title: "Increase Visibility",
        description: "Add more content, improve SEO, or consider advertising",
        action: "improve_content"
      });
    }
    
    return {
      insights,
      recommendations,
      performanceScore: calculatePerformanceScore(currentPeriodData),
      benchmarks: {
        industryAverageConversion: 3.2,
        industryAverageLeadScore: 65,
        industryAverageRevenue: 500
      }
    };
  },
});

// Helper function to calculate performance score
function calculatePerformanceScore(data: any): number {
  let score = 0;
  
  // Revenue score (0-30 points)
  if (data.overview.totalRevenue > 1000) score += 30;
  else if (data.overview.totalRevenue > 500) score += 20;
  else if (data.overview.totalRevenue > 100) score += 10;
  
  // Conversion score (0-25 points)
  if (data.overview.conversionRate > 5) score += 25;
  else if (data.overview.conversionRate > 3) score += 20;
  else if (data.overview.conversionRate > 1) score += 10;
  
  // Traffic score (0-20 points)
  if (data.overview.totalVisitors > 200) score += 20;
  else if (data.overview.totalVisitors > 100) score += 15;
  else if (data.overview.totalVisitors > 50) score += 10;
  
  // AI score (0-15 points)
  if (data.aiMetrics.averageLeadScore > 80) score += 15;
  else if (data.aiMetrics.averageLeadScore > 60) score += 10;
  else if (data.aiMetrics.averageLeadScore > 40) score += 5;
  
  // Close rate score (0-10 points)
  if (data.overview.closeRate > 20) score += 10;
  else if (data.overview.closeRate > 10) score += 7;
  else if (data.overview.closeRate > 5) score += 3;
  
  return Math.min(score, 100);
}

// Record building click event
export const recordBuildingClick = mutation({
  args: {
    plotId: v.id("plots"),
    visitorId: v.string(),
    sessionId: v.string(),
    timestamp: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = args.timestamp || Date.now();
    
    // Insert building click event
    await ctx.db.insert("buildingClicks", {
      plotId: args.plotId,
      visitorId: args.visitorId,
      sessionId: args.sessionId,
      timestamp: now,
      userAgent: args.userAgent,
      referrer: args.referrer
    });
    
    // Update daily analytics
    const today = new Date(now).toISOString().split('T')[0];
    const existingAnalytics = await ctx.db
      .query("analytics")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.eq(q.field("date"), today)
        )
      )
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

// Record website visit event
export const recordWebsiteVisit = mutation({
  args: {
    plotId: v.id("plots"),
    visitorId: v.string(),
    sessionId: v.string(),
    websiteUrl: v.string(),
    timestamp: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = args.timestamp || Date.now();
    
    // Insert website visit event
    await ctx.db.insert("websiteVisits", {
      plotId: args.plotId,
      visitorId: args.visitorId,
      sessionId: args.sessionId,
      websiteUrl: args.websiteUrl,
      timestamp: now,
      userAgent: args.userAgent,
      referrer: args.referrer
    });
    
    return { success: true };
  },
});

// Get building click analytics
export const getBuildingClickAnalytics = query({
  args: {
    plotId: v.id("plots"),
    timeRange: v.optional(v.string()) // "day", "week", "month", "year"
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
      case "year":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    const clicks = await ctx.db
      .query("buildingClicks")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.gte(q.field("timestamp"), startTime)
        )
      )
      .collect();
    
    const websiteVisits = await ctx.db
      .query("websiteVisits")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.gte(q.field("timestamp"), startTime)
        )
      )
      .collect();
    
    // Calculate metrics
    const totalClicks = clicks.length;
    const uniqueVisitors = new Set(clicks.map(c => c.visitorId)).size;
    const totalWebsiteVisits = websiteVisits.length;
    const uniqueWebsiteVisitors = new Set(websiteVisits.map(v => v.visitorId)).size;
    const clickToWebsiteRate = totalClicks > 0 ? (totalWebsiteVisits / totalClicks) * 100 : 0;
    
    // Daily breakdown
    const dailyData = [];
    const daysToShow = timeRange === "year" ? 12 : (timeRange === "month" ? 30 : 7);
    const intervalMs = timeRange === "year" ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const dayStart = now - (i * intervalMs);
      const dayEnd = dayStart + intervalMs;
      
      const dayClicks = clicks.filter(c => c.timestamp >= dayStart && c.timestamp < dayEnd).length;
      const dayWebsiteVisits = websiteVisits.filter(v => v.timestamp >= dayStart && v.timestamp < dayEnd).length;
      
      dailyData.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        clicks: dayClicks,
        websiteVisits: dayWebsiteVisits
      });
    }
    
    // Top referrers
    const referrerCounts = clicks.reduce((acc, click) => {
      const referrer = click.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topReferrers = Object.entries(referrerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
    
    return {
      overview: {
        totalClicks,
        uniqueVisitors,
        totalWebsiteVisits,
        uniqueWebsiteVisitors,
        clickToWebsiteRate: Math.round(clickToWebsiteRate * 100) / 100
      },
      dailyData,
      topReferrers,
      timeRange
    };
  },
});

// Get customer analytics dashboard
export const getCustomerAnalytics = query({
  args: {
    plotId: v.id("plots"),
    timeRange: v.optional(v.string())
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
      case "year":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get building clicks
    const buildingClicks = await ctx.db
      .query("buildingClicks")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.gte(q.field("timestamp"), startTime)
        )
      )
      .collect();
    
    // Get website visits
    const websiteVisits = await ctx.db
      .query("websiteVisits")
      .filter((q) => 
        q.and(
          q.eq(q.field("plotId"), args.plotId),
          q.gte(q.field("timestamp"), startTime)
        )
      )
      .collect();
    
    // Calculate metrics
    const uniqueVisitors = new Set(buildingClicks.map(click => click.visitorId)).size;
    const totalClicks = buildingClicks.length;
    const totalWebsiteVisits = websiteVisits.length;
    const clickToWebsiteRate = totalClicks > 0 ? (totalWebsiteVisits / totalClicks) * 100 : 0;
    
    // Get daily breakdown
    const dailyData = new Map();
    
    buildingClicks.forEach(click => {
      const date = new Date(click.timestamp).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, buildingClicks: 0, websiteVisits: 0 });
      }
      dailyData.get(date).buildingClicks++;
    });
    
    websiteVisits.forEach(visit => {
      const date = new Date(visit.timestamp).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, buildingClicks: 0, websiteVisits: 0 });
      }
      dailyData.get(date).websiteVisits++;
    });
    
    // Get top referrers
    const referrerCounts = new Map();
    [...buildingClicks, ...websiteVisits].forEach(item => {
      const referrer = item.referrer || 'Direct';
      referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
    });
    
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get general analytics
    const generalAnalytics = await ctx.db
      .query("analytics")
      .filter((q) => q.eq(q.field("plotId"), args.plotId))
      .collect();
    
    const totalVisitors = generalAnalytics.reduce((sum, a) => sum + a.visitors, 0);
    const totalInteractions = generalAnalytics.reduce((sum, a) => sum + a.interactions, 0);
    const totalLeads = generalAnalytics.reduce((sum, a) => sum + a.leadsGenerated, 0);
    
    return {
      buildingClicks: {
        overview: {
          totalClicks,
          uniqueVisitors,
          websiteVisits: totalWebsiteVisits,
          clickToWebsiteRate
        },
        dailyBreakdown: Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date)),
        topReferrers
      },
      overview: {
        totalVisitors,
        totalInteractions,
        totalLeads,
        conversionRate: totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0
      }
    };
  },
});