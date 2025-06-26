import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all leads for a user
export const getLeadsByUser = query({
  args: { 
    userId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Get user's plots first, then filter leads by those plots
    const userPlots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const plotIds = userPlots.map(plot => plot._id);
    
    let query = ctx.db
      .query("leads")
      .filter((q) => q.or(...plotIds.map(plotId => q.eq(q.field("plotId"), plotId))));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const leads = await query
      .order("desc")
      .take(limit);
    
    // Enrich with plot information
    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        let plot = null;
        if (lead.plotId) {
          plot = await ctx.db.get(lead.plotId);
        }
        return { ...lead, plot };
      })
    );
    
    return enrichedLeads;
  },
});

// Get leads for a specific plot
export const getLeadsByPlot = query({
  args: { 
    plotId: v.id("plots"),
    status: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("plotId"), args.plotId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await query.order("desc").collect();
  },
});

// Create a new lead
export const createLead = mutation({
  args: {
    plotId: v.optional(v.id("plots")),
    plotOwnerId: v.optional(v.string()),
    contactInfo: v.object({
      email: v.string(),
      name: v.optional(v.string()),
      company: v.optional(v.string()),
      phone: v.optional(v.string()),
      website: v.optional(v.string()),
      industry: v.optional(v.string())
    }),
    leadScore: v.number(),
    source: v.string(), // "ai_chat", "contact_form", "direct", "referral"
    sessionId: v.optional(v.string()),
    initialMessage: v.optional(v.string()),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const leadId = await ctx.db.insert("leads", {
      plotId: args.plotId!,
      visitorId: args.sessionId || "anonymous",
      email: args.contactInfo.email,
      phone: args.contactInfo.phone,
      company: args.contactInfo.company,
      name: args.contactInfo.name,
      interest: args.initialMessage || "General inquiry",
      budget: undefined,
      timeline: undefined,
      score: args.leadScore,
      quality: args.leadScore >= 70 ? "hot" : args.leadScore >= 40 ? "warm" : "cold",
      source: args.source,
      status: "new",
      notes: args.initialMessage,
      followUpDate: now + (24 * 60 * 60 * 1000), // Default follow-up in 24 hours
      createdAt: now,
      updatedAt: now
    });
    
    // Record revenue event for lead generation
    await ctx.db.insert("revenueEvents", {
      plotId: args.plotId!,
      userId: args.plotOwnerId || "", // Use plotOwnerId as userId
      type: "lead_generation",
      amount: 0, // No direct revenue from lead generation
      description: `Lead generated with score ${args.leadScore || 0}`,
      leadId,
      metadata: {
        leadScore: args.leadScore || 0,
        source: args.source
      },
      timestamp: now
    });
    
    return leadId;
  },
});

// Update lead status
export const updateLeadStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.string(), // "new", "contacted", "qualified", "proposal", "closed_won", "closed_lost"
    notes: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    dealValue: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    
    const now = Date.now();
    const updates: any = {
      status: args.status,
      updatedAt: now
    };
    
    if (args.notes) {
      updates.notes = args.notes;
    }
    
    if (args.followUpDate) {
      updates.followUpDate = args.followUpDate;
    }
    
    if (args.dealValue !== undefined) {
      updates.dealValue = args.dealValue;
    }
    
    await ctx.db.patch(args.leadId, updates);
    
    // Create revenue event for closed deals
    if (args.status === "closed_won" && args.dealValue) {
      // Get the plot to find the owner
      const plot = await ctx.db.get(lead.plotId);
      
      if (plot && plot.userId) {
        await ctx.db.insert("revenueEvents", {
          userId: plot.userId,
          plotId: lead.plotId,
          type: "deal_closed",
          amount: args.dealValue,
          description: `Deal closed for $${args.dealValue}`,

          timestamp: now
        });
      }
    }
    
    return { success: true };
  },
});

// Add tags to a lead
export const addLeadTags = mutation({
  args: {
    leadId: v.id("leads"),
    tags: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    
    // Verify user has access to this lead
    const plot = await ctx.db.get(lead.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== plot.userId) {
      throw new Error("Not authorized");
    }
    
    // Update the lead's metadata with the new tags
    const existingTags = lead.metadata?.tags || [];
    const uniqueTags = [...new Set([...existingTags, ...args.tags])];
    
    await ctx.db.patch(args.leadId, {
      metadata: {
        ...(lead.metadata as Record<string, any> || {}),
        tags: uniqueTags,
      },
      updatedAt: Date.now()
    });
    
    return uniqueTags;
  },
});

// Get lead analytics
export const getLeadAnalytics = query({
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
    
    // First get all plots owned by this user
    const userPlots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const plotIds = userPlots.map(plot => plot._id);
    
    // Then get leads for these plots
    let query = ctx.db
      .query("leads")
      .filter((q: any) => 
        q.and(
          plotIds.length > 0 
            ? q.or(...plotIds.map(plotId => q.eq(q.field("plotId"), plotId)))
            : q.eq(q.field("_id"), q.id("leads", "impossible_id")), // If no plots, return no leads
          q.gte(q.field("createdAt"), startTime)
        )
      );
    
    if (args.plotId) {
      query = query.filter((q: any) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const leads = await query.collect();
    
    // Calculate analytics
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => (l.score || 0) >= 70).length;
    const closedWon = leads.filter(l => l.status === "closed_won").length;
    const closedLost = leads.filter(l => l.status === "closed_lost").length;
    const inProgress = leads.filter(l => !l.status.startsWith("closed")).length;
    
    const totalDealValue = leads
      .filter(l => l.status === "closed_won")
      .reduce((sum, l) => sum + 0, 0);
    
    const averageLeadScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads)
      : 0;
    
    const conversionRate = totalLeads > 0 
      ? Math.round((closedWon / totalLeads) * 100)
      : 0;
    
    // Source breakdown
    const sourceBreakdown = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Status breakdown
    const statusBreakdown = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalLeads,
      qualifiedLeads,
      closedWon,
      closedLost,
      inProgress,
      totalDealValue,
      averageLeadScore,
      conversionRate,
      sourceBreakdown,
      statusBreakdown,
      timeRange
    };
  },
});

// Get leads that need follow-up
export const getLeadsNeedingFollowUp = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // First get all plots owned by this user
    const userPlots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const plotIds = userPlots.map(plot => plot._id);
    
    // Then get leads for these plots
    const leads = await ctx.db
      .query("leads")
      .filter((q: any) => 
        q.and(
          plotIds.length > 0 
            ? q.or(...plotIds.map(plotId => q.eq(q.field("plotId"), plotId)))
            : q.eq(q.field("_id"), q.id("leads", "impossible_id")), // If no plots, return no leads
          q.lte(q.field("followUpDate"), now),
          q.neq(q.field("status"), "closed_won"),
          q.neq(q.field("status"), "closed_lost")
        )
      )
      .order("asc")
      .collect();
    
    // Enrich with plot information
    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        let plot = null;
        if (lead.plotId) {
          plot = await ctx.db.get(lead.plotId);
        }
        return { ...lead, plot };
      })
    );
    
    return enrichedLeads;
  },
});

// Export lead data
export const exportLeads = query({
  args: {
    userId: v.string(),
    format: v.optional(v.string()), // "csv", "json"
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      source: v.optional(v.string()),
      minScore: v.optional(v.number()),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number()
      }))
    }))
  },
  handler: async (ctx, args) => {
    // First get all plots owned by this user
    const userPlots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const plotIds = userPlots.map(plot => plot._id);
    
    // Then get leads for these plots
    let query = ctx.db
      .query("leads")
      .filter((q: any) => 
        q.and(
          plotIds.length > 0 
            ? q.or(...plotIds.map(plotId => q.eq(q.field("plotId"), plotId)))
            : q.eq(q.field("_id"), q.id("leads", "impossible_id")) // If no plots, return no leads
        )
      );
    
    // Apply filters
    if (args.filters?.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.filters!.status));
    }
    
    if (args.filters?.source) {
      query = query.filter((q: any) => q.eq(q.field("source"), args.filters!.source));
    }
    
    if (args.filters?.minScore !== undefined) {
      query = query.filter((q: any) => q.gte(q.field("score"), args.filters!.minScore!));
    }
    
    if (args.filters?.dateRange && args.filters.dateRange.start !== undefined && args.filters.dateRange.end !== undefined) {
      query = query.filter((q: any) => 
        q.and(
          q.gte(q.field("createdAt"), args.filters!.dateRange!.start),
          q.lte(q.field("createdAt"), args.filters!.dateRange!.end)
        )
      );
    }
    
    const leads = await query.order("desc").collect();
    
    // Helper function to format lead data for export
    const formatLeadForExport = (lead: any, plot: any) => {
      const metadata = lead.metadata as Record<string, any> || {};
      return {
        id: lead._id,
        name: lead.name || "Unknown",
        email: lead.email || "",
        phone: lead.phone || "",
        plotName: plot?.name || "Unknown Plot",
        status: lead.status || "new",
        source: lead.source || "unknown",
        score: lead.score || 0,
        dealValue: metadata.dealValue || 0,
        createdAt: new Date(lead.createdAt).toISOString(),
        updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toISOString() : "",
        notes: lead.notes || "",
        tags: metadata.tags?.join(", ") || "",
      };
    };
    
    // Format for export and include plot information
    const exportData = await Promise.all(leads.map(async (lead) => {
      const plot = lead.plotId ? await ctx.db.get(lead.plotId) : null;
      return formatLeadForExport(lead, plot);
    }));
    
    return {
      data: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString()
    };
  },
});