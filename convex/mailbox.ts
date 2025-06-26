import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Send a mail message to a plot's mailbox
export const sendMessage = mutation({
  args: {
    toAddress: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    subject: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      size: v.number()
    })))
  },
  handler: async (ctx, args) => {
    // Find the plot with this mailbox address
    const plot = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("mailbox.address"), args.toAddress))
      .first();
    
    if (!plot) {
      throw new Error("Mailbox address not found");
    }
    
    const now = Date.now();
    
    // Create the mail message
    const messageId = await ctx.db.insert("mailMessages", {
      plotId: plot._id,
      senderDisplayName: args.fromName,
      recipientPlotAddress: args.toAddress,
      subject: args.subject,
      body: args.content,
      isRead: false,
      timestamp: now,
      messageType: "user_message"
    });
    
    // Send auto-responder if enabled
    if (plot.mailbox?.autoResponder) {
      await sendAutoResponse(ctx, {
        originalMessageId: messageId,
        toEmail: args.fromEmail,
        toName: args.fromName,
        plotId: plot._id,
        customGreeting: plot.mailbox.customGreeting
      });
    }
    
    // TODO: Add email forwarding functionality when schema supports it
    
    // Record revenue event for mail activity
    await ctx.db.insert("revenueEvents", {
      plotId: plot._id,
      userId: plot.userId,
      type: "mail_activity",
      amount: 0,
      description: "Mail message received",
      timestamp: now,
      metadata: {
        fromEmail: args.fromEmail,
        subject: args.subject
      }
    });
    
    return messageId;
  },
});

// Get messages for a plot's mailbox
export const getMessages = query({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // Verify user owns the plot
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    const messagesQuery = ctx.db
      .query("mailMessages")
      .withIndex("by_plotId_timestamp", (q: any) => q.eq("plotId", args.plotId))
      .order("desc");
    
    const messages = await (args.limit ? messagesQuery.take(args.limit) : messagesQuery);
    
    if (args.unreadOnly) {
      return messages.filter((msg: any) => !msg.isRead);
    }
    
    return messages;
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: {
    messageId: v.id("mailMessages"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user owns the plot
    const plot = await ctx.db.get(message.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    await ctx.db.patch(args.messageId, {
      isRead: true
    });
    
    return { success: true };
  },
});

// Delete message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("mailMessages"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user owns the plot
    const plot = await ctx.db.get(message.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    await ctx.db.delete(args.messageId);
    
    return { success: true };
  },
});

// Get mailbox statistics
export const getMailboxStats = query({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    timeRange: v.optional(v.string()) // "7d", "30d", "90d", "1y"
  },
  handler: async (ctx, args) => {
    // Verify user owns the plot
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    const timeRanges: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000
    };
    
    const startTime = now - timeRanges[timeRange];
    
    const messages = await ctx.db
      .query("mailMessages")
      .withIndex("by_plotId_timestamp", (q) => q.eq("plotId", args.plotId))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .collect();
    
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(msg => !msg.isRead).length;
    const uniqueSenders = new Set(messages.map(msg => msg.senderUserId || msg.senderDisplayName)).size;
    
    // Group by day for chart data
    const dailyStats: Record<string, number> = {};
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    return {
      totalMessages,
      unreadMessages,
      uniqueSenders,
      dailyStats,
      timeRange
    };
  },
});

// Search messages
export const searchMessages = query({
  args: {
    plotId: v.id("plots"),
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Verify user owns the plot
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this plot");
    }
    
    const messages = await ctx.db
      .query("mailMessages")
      .withIndex("by_plotId_timestamp", (q: any) => q.eq("plotId", args.plotId))
      .order("desc")
      .take(args.limit || 100);
    
    const queryLower = args.query.toLowerCase();
    
    return messages.filter((msg: any) => 
      msg.subject.toLowerCase().includes(queryLower) ||
      msg.body.toLowerCase().includes(queryLower) ||
      (msg.senderDisplayName || "").toLowerCase().includes(queryLower)
    );
  },
});

// Helper function to send auto-response
async function sendAutoResponse(
  ctx: any,
  args: {
    originalMessageId: Id<"mailMessages">;
    toEmail: string;
    toName: string;
    plotId: Id<"plots">;
    customGreeting?: string;
  }
) {
  const plot = await ctx.db.get(args.plotId);
  if (!plot) return;
  
  const defaultGreeting = `Thank you for contacting ${plot.advertising?.companyName || 'us'}! We have received your message and will get back to you soon.`;
  const greeting = args.customGreeting || defaultGreeting;
  
  // In a real implementation, this would integrate with an email service
  // For now, we'll just log the auto-response
  console.log(`Auto-response sent to ${args.toEmail}: ${greeting}`);
  
  // Record the auto-response in analytics
  await ctx.db.insert("analytics", {
        userId: plot.userId,
    type: "auto_response_sent",
    data: {
      plotId: args.plotId,
      toEmail: args.toEmail,
      originalMessageId: args.originalMessageId
    },
    plotId: args.plotId,
    timestamp: Date.now()
  });
}

// Helper function to forward email
async function forwardToEmail(
  ctx: any,
  args: {
    messageId: Id<"mailMessages">;
    forwardingEmail: string;
    originalMessage: {
      from: string;
      subject: string;
      content: string;
    };
  }
) {
  // In a real implementation, this would integrate with an email service
  // For now, we'll just log the forwarding
  console.log(`Message forwarded to ${args.forwardingEmail}:`, args.originalMessage);
  
  // Record the forwarding in analytics
  const message = await ctx.db.get(args.messageId);
  if (message) {
    const plot = await ctx.db.get(message.plotId);
    if (plot) {
      await ctx.db.insert("analytics", {
        userId: plot.userId,
        type: "mail_forwarded",
        data: {
          plotId: message.plotId,
          messageId: args.messageId,
          forwardingEmail: args.forwardingEmail
        },
        plotId: message.plotId,
        timestamp: Date.now()
      });
    }
  }
}

// Get all mailbox addresses for validation
export const getAllMailboxAddresses = query({
  args: {},
  handler: async (ctx) => {
    const plots = await ctx.db.query("plots").collect();
    return plots
      .filter(plot => plot.mailbox?.address)
      .map(plot => ({
        address: plot.mailbox!.address,
        plotId: plot._id,
        companyName: plot.advertising?.companyName
      }));
  },
});

// Check if mailbox address is available
export const checkAddressAvailability = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const existingPlot = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("mailbox.address"), args.address))
      .first();
    
    return {
      available: !existingPlot,
      suggestion: existingPlot ? generateAlternativeAddress(args.address) : null
    };
  },
});

// Helper function to generate alternative mailbox addresses
function generateAlternativeAddress(requestedAddress: string): string {
  const [localPart, domain] = requestedAddress.split('@');
  const timestamp = Date.now().toString().slice(-4);
  return `${localPart}${timestamp}@${domain || 'metrospace.city'}`;
}