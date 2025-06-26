import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// --- MUTATIONS ---

/**
 * Sends a message to a plot's mailbox.
 */
export const sendMessage = mutation({
  args: {
    recipientPlotAddress: v.string(), // The unique mailbox address of the recipient plot
    subject: v.string(),
    body: v.string(),
    senderDisplayName: v.optional(v.string()), // Optional: If system or anonymous, can be set
    messageType: v.optional(v.string()), // e.g., "user_message", "system_notification"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let senderUserId: string | undefined = undefined;
    let finalSenderDisplayName = args.senderDisplayName || "Anonymous";

    if (identity) {
      senderUserId = identity.subject; // Clerk User ID
      // Prefer user's name if available and no specific senderDisplayName is provided
      if (!args.senderDisplayName) {
        finalSenderDisplayName = identity.name || identity.nickname || identity.email || "Authenticated User";
      }
    } else if (!args.senderDisplayName) {
      // If no identity and no display name, it could be a system message or an error
      // For now, we'll default to "System" if no identity and no explicit senderDisplayName
      finalSenderDisplayName = "System";
    }

    // Find the plot by its mailbox address to link the message
    const plot = await ctx.db
      .query("plots")
      .withIndex("by_mailbox_address", (q) => q.eq("mailbox.address", args.recipientPlotAddress))
      .unique();

    if (!plot) {
      throw new Error(`Plot with mailbox address "${args.recipientPlotAddress}" not found.`);
    }
    if (!plot.mailbox?.enabled) {
        throw new Error(`Mailbox for plot "${args.recipientPlotAddress}" is disabled.`);
    }

    const messageId = await ctx.db.insert("mailMessages", {
      plotId: plot._id,
      senderUserId,
      senderDisplayName: finalSenderDisplayName,
      recipientPlotAddress: args.recipientPlotAddress,
      subject: args.subject,
      body: args.body,
      timestamp: Date.now(),
      isRead: false,
      messageType: args.messageType || "user_message",
    });

    return messageId;
  },
});

/**
 * Marks a specific message as read.
 */
export const markMessageAsRead = mutation({
  args: { messageId: v.id("mailMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to mark messages as read.");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }

    // Optional: Check if the current user is the owner of the plot this message belongs to
    const plot = await ctx.db.get(message.plotId);
    if (!plot || plot.userId !== identity.subject) {
      throw new Error("User not authorized to mark this message as read.");
    }

    await ctx.db.patch(args.messageId, { isRead: true });
    return true;
  },
});

/**
 * Deletes a specific message.
 */
export const deleteMessage = mutation({
  args: { messageId: v.id("mailMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to delete messages.");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found.");
    }

    // Check if the current user is the owner of the plot this message belongs to
    const plot = await ctx.db.get(message.plotId);
    if (!plot || plot.userId !== identity.subject) {
      throw new Error("User not authorized to delete this message.");
    }

    await ctx.db.delete(args.messageId);
    return true;
  },
});


// --- QUERIES ---

/**
 * Retrieves messages for a specific plot, paginated.
 * Only the plot owner can retrieve messages.
 */
export const getMessagesForPlot = query({
  args: {
    plotId: v.id("plots"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to retrieve messages.");
    }

    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found.");
    }

    if (plot.userId !== identity.subject) {
      throw new Error("User not authorized to retrieve messages for this plot.");
    }
    
    if (!plot.mailbox?.enabled) {
        // Or return empty results if preferred
        throw new Error(`Mailbox for plot "${plot.address?.street || plot._id.toString()}" is disabled.`);
    }

    return await ctx.db
      .query("mailMessages")
      .withIndex("by_plotId_timestamp", (q) => q.eq("plotId", args.plotId))
      .order("desc") // Show newest messages first
      .paginate(args.paginationOpts);
  },
});

/**
 * Gets the count of unread messages for a specific plot.
 * Only the plot owner can get this count.
 */
export const getUnreadMessageCount = query({
  args: { plotId: v.id("plots") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Or return 0 if preferred for unauthenticated users
      throw new Error("User must be authenticated to get unread message count.");
    }

    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found.");
    }

    if (plot.userId !== identity.subject) {
      throw new Error("User not authorized to get unread count for this plot.");
    }

    if (!plot.mailbox?.enabled) {
        return 0; 
    }

    const unreadMessages = await ctx.db
      .query("mailMessages")
      .withIndex("by_plotId_timestamp", (q) => q.eq("plotId", args.plotId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadMessages.length;
  },
});