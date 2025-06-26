import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// AI Chat for visitors and plot owners
export const sendMessage = mutation({
  args: {
    plotId: v.id("plots"),
    userId: v.optional(v.string()),
    message: v.string(),
    sessionId: v.string(),
    visitorInfo: v.optional(v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      company: v.optional(v.string()),
      phone: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get plot information if plotId is provided
    let plot = null;
    if (args.plotId) {
      plot = await ctx.db.get(args.plotId);
      if (!plot) {
        throw new Error("Plot not found");
      }
    }

    // Generate AI response based on context
    const aiResponse = await generateAIResponse({
      message: args.message,
      plot,
      visitorInfo: args.visitorInfo,
      userId: args.userId
    });

    // Save user message
    const userMessageId = await ctx.db.insert("aiInteractions", {
      plotId: args.plotId,
      visitorId: args.userId || args.sessionId,
      sessionId: args.sessionId,
      message: args.message,
      response: "", // Will be updated with AI response
      leadScore: calculateLeadScore(args.message, args.visitorInfo),
      timestamp: now,
    });

    // Save AI response
    const aiMessageId = await ctx.db.insert("aiInteractions", {
      plotId: args.plotId,
      visitorId: args.userId || args.sessionId,
      sessionId: args.sessionId,
      message: "", // User message is empty for AI response
      response: aiResponse.message,
      leadScore: aiResponse.leadScore,
      timestamp: now + 1,
    });

    // Update user AI credits if applicable
    if (args.userId) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (user) {
        await ctx.db.patch(user._id, {
          aiCreditsUsed: (user.aiCreditsUsed || 0) + 1,
          updatedAt: now
        });
      }
    }

    // Check if this interaction qualifies as a lead
    if (aiResponse.leadScore >= 70 && args.visitorInfo?.email) {
      await createLead(ctx, {
        plotId: args.plotId,
        visitorInfo: args.visitorInfo,
        sessionId: args.sessionId,
        leadScore: aiResponse.leadScore,
        source: "ai_chat"
      });
    }

    return {
      userMessage: await ctx.db.get(userMessageId),
      aiMessage: await ctx.db.get(aiMessageId),
      leadGenerated: aiResponse.leadScore >= 70
    };
  },
});

// Get chat history for a session
export const getChatHistory = query({
  args: {
    sessionId: v.string(),
    plotId: v.optional(v.id("plots")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let query = ctx.db
      .query("aiInteractions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId));
    
    if (args.plotId) {
      query = query.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const messages = await query
      .order("desc")
      .take(limit);
    
    return messages.reverse();
  },
});

// Get AI analytics for plot owner
export const getAIAnalytics = query({
  args: {
    userId: v.string(),
    plotId: v.optional(v.id("plots")),
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

    let query = ctx.db
      .query("aiInteractions")
      .filter((q) => 
        q.gte(q.field("timestamp"), startTime)
      );
    
    if (args.plotId) {
      query = query.filter((q) => q.eq(q.field("plotId"), args.plotId));
    }
    
    const interactions = await query.collect();
    
    // Calculate analytics
    const totalInteractions = interactions.length;
    const uniqueSessions = new Set(interactions.map(i => i.sessionId)).size;
    const averageLeadScore = interactions.reduce((sum, i) => sum + (i.leadScore || 0), 0) / totalInteractions || 0;
    const highQualityLeads = interactions.filter(i => (i.leadScore || 0) >= 70).length;
    
    // Get leads generated in this period
    const leads = await ctx.db
      .query("leads")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startTime),
          args.plotId ? q.eq(q.field("plotId"), args.plotId) : q.eq(q.field("plotId"), args.plotId)
        )
      )
      .collect();
    
    return {
      totalInteractions,
      uniqueSessions,
      averageLeadScore: Math.round(averageLeadScore),
      highQualityLeads,
      leadsGenerated: leads.length,
      conversionRate: uniqueSessions > 0 ? Math.round((leads.length / uniqueSessions) * 100) : 0,
      timeRange
    };
  },
});

// Helper function to generate AI response
async function generateAIResponse({ message, plot, visitorInfo, userId }: {
  message: string;
  plot: any;
  visitorInfo?: any;
  userId?: string;
}) {
  // This is a simplified AI response generator
  // In production, you would integrate with OpenAI, Claude, or other AI services
  
  const lowerMessage = message.toLowerCase();
  let response = "";
  let leadScore = 0;
  let metadata: any = {};

  // Business inquiry detection
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("quote")) {
    leadScore += 30;
    response = "I'd be happy to discuss pricing with you. ";
  }
  
  if (lowerMessage.includes("service") || lowerMessage.includes("help") || lowerMessage.includes("solution")) {
    leadScore += 20;
    response += "Let me tell you about our services. ";
  }
  
  if (lowerMessage.includes("contact") || lowerMessage.includes("call") || lowerMessage.includes("meeting")) {
    leadScore += 40;
    response += "I'd love to schedule a call with you. ";
  }
  
  // Company information
  if (plot?.advertising?.companyName) {
    response += `Welcome to ${plot.advertising.companyName}! `;
    
    if (plot.advertising.description) {
      response += `${plot.advertising.description} `;
    }
    
    if (plot.advertising.services?.length) {
      response += `We specialize in: ${plot.advertising.services.join(", ")}. `;
    }
  }
  
  // Contact information
  if (plot?.advertising?.contactEmail && leadScore > 30) {
    response += `Feel free to reach out to us directly at ${plot.advertising.contactEmail}. `;
  }
  
  // Business hours
  if (plot?.advertising?.businessHours && lowerMessage.includes("hours")) {
    response += "Our business hours are: ";
    plot.advertising.businessHours.schedule.forEach((day: any) => {
      if (!day.closed) {
        response += `${day.day}: ${day.open} - ${day.close}, `;
      }
    });
  }
  
  // Default responses
  if (!response) {
    const defaultResponses = [
      "Thank you for your interest! How can I help you today?",
      "I'm here to assist you with any questions you might have.",
      "Welcome! What would you like to know about our services?",
      "Hello! I'm happy to help you learn more about what we offer."
    ];
    response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }
  
  // Boost lead score based on visitor info
  if (visitorInfo?.email) leadScore += 20;
  if (visitorInfo?.company) leadScore += 15;
  if (visitorInfo?.phone) leadScore += 25;
  
  return {
    message: response.trim(),
    leadScore: Math.min(leadScore, 100),
    metadata: {
      responseType: "automated",
      confidence: leadScore / 100,
      detectedIntent: leadScore > 50 ? "business_inquiry" : "general_inquiry"
    }
  };
}

// Helper function to calculate lead score
function calculateLeadScore(message: string, visitorInfo?: any): number {
  let score = 0;
  const lowerMessage = message.toLowerCase();
  
  // Message content scoring
  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) score += 25;
  if (lowerMessage.includes("buy") || lowerMessage.includes("purchase")) score += 30;
  if (lowerMessage.includes("service") || lowerMessage.includes("solution")) score += 20;
  if (lowerMessage.includes("contact") || lowerMessage.includes("call")) score += 35;
  if (lowerMessage.includes("meeting") || lowerMessage.includes("demo")) score += 40;
  
  // Visitor info scoring
  if (visitorInfo?.email) score += 20;
  if (visitorInfo?.company) score += 15;
  if (visitorInfo?.phone) score += 25;
  if (visitorInfo?.name) score += 10;
  
  return Math.min(score, 100);
}

// Helper function to create a lead
async function createLead(ctx: any, { plotId, visitorInfo, sessionId, leadScore, source }: {
  plotId?: Id<"plots">;
  visitorInfo: any;
  sessionId: string;
  leadScore: number;
  source: string;
}) {
  const now = Date.now();
  
  // Get plot owner
  let plotOwnerId = null;
  if (plotId) {
    const plot = await ctx.db.get(plotId);
    plotOwnerId = plot?.ownerId;
  }
  
  return await ctx.db.insert("leads", {
    plotId,
    plotOwnerId,
    contactInfo: {
      email: visitorInfo.email,
      name: visitorInfo.name,
      company: visitorInfo.company,
      phone: visitorInfo.phone
    },
    leadScore,
    status: "new",
    source,
    sessionId,
    tags: [],
    notes: "",
    createdAt: now,
    updatedAt: now
  });
}