import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Upload company logo (SVG format)
export const uploadLogo = mutation({
  args: {
    userId: v.string(),
    plotId: v.id("plots"),
    logoData: v.string(), // Base64 encoded SVG data
    fileName: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Verify the plot belongs to the user
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Plot not found or access denied");
    }
    
    // Validate SVG format (basic check)
    if (!args.logoData.includes('<svg') || !args.logoData.includes('</svg>')) {
      throw new Error("Invalid SVG format");
    }
    
    // In a real implementation, you would upload to a file storage service
    // For now, we'll store the data directly (not recommended for production)
    const logoUrl = `data:image/svg+xml;base64,${btoa(args.logoData)}`;
    
    // Update the plot with logo information
    await ctx.db.patch(args.plotId, {
      advertising: {
        ...plot.advertising,
        enabled: true,
        companyName: args.companyName,
        logoUrl,
        logoFileName: args.fileName,
        uploadedAt: timestamp,
      },
      updatedAt: timestamp,
    });
    
    return {
      logoUrl,
      message: "Logo uploaded successfully",
    };
  },
});

// Update advertising information for a plot
export const updateAdvertising = mutation({
  args: {
    userId: v.string(),
    plotId: v.id("plots"),
    advertising: v.object({
      enabled: v.boolean(),
      companyName: v.string(),
      website: v.optional(v.string()),
      description: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      bannerStyle: v.optional(v.string()), // 'classic', 'modern', 'neon', 'minimal', 'billboard'
      bannerPosition: v.optional(v.string()), // 'front', 'side', 'top', 'corner', 'wrap'
      bannerColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      animationStyle: v.optional(v.string()), // 'none', 'glow', 'pulse', 'scroll'
    }),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Verify the plot belongs to the user
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Plot not found or access denied");
    }
    
    // Update advertising information
    await ctx.db.patch(args.plotId, {
      advertising: {
        ...plot.advertising,
        enabled: args.advertising.enabled,
        companyName: args.advertising.companyName,
        website: args.advertising.website,
        description: args.advertising.description,
        contactEmail: args.advertising.contactEmail,
        bannerStyle: args.advertising.bannerStyle || 'classic',
        bannerPosition: args.advertising.bannerPosition || 'front',
        bannerColor: args.advertising.bannerColor || '#ffffff',
        textColor: args.advertising.textColor || '#333333',
        animationStyle: args.advertising.animationStyle || 'none',
        uploadedAt: plot.advertising?.uploadedAt || timestamp,
      },
      updatedAt: timestamp,
    });
    
    return {
      message: "Advertising information updated successfully",
    };
  },
});

// Get all plots with advertising enabled
export const getAdvertisingPlots = query({
  args: {},
  handler: async (ctx) => {
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("advertising.enabled"), true))
      .collect();
    
    return plots.map(plot => ({
      _id: plot._id,
      position: plot.position,
      size: plot.size,
      mainBuilding: plot.mainBuilding,
      advertising: plot.advertising,
      username: plot.username,
      createdAt: plot.createdAt,
    }));
  },
});

// Get advertising information for a specific plot
export const getPlotAdvertising = query({
  args: {
    plotId: v.id("plots"),
  },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    return {
      advertising: plot.advertising,
      companyName: plot.advertising?.companyName,
      website: plot.advertising?.website,
      logoUrl: plot.advertising?.logoUrl,
      description: plot.advertising?.description,
      contactEmail: plot.advertising?.contactEmail,
    };
  },
});

// Search plots by company name
export const searchByCompany = query({
  args: {
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const plots = await ctx.db
      .query("plots")
      .filter((q) => 
        q.and(
          q.eq(q.field("advertising.enabled"), true),
          q.eq(q.field("advertising.companyName"), args.companyName)
        )
      )
      .collect();
    
    return plots.map(plot => ({
      _id: plot._id,
      position: plot.position,
      size: plot.size,
      advertising: plot.advertising,
      username: plot.username,
      createdAt: plot.createdAt,
    }));
  },
});

// Remove advertising from a plot
export const removeAdvertising = mutation({
  args: {
    userId: v.string(),
    plotId: v.id("plots"),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Verify the plot belongs to the user
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Plot not found or access denied");
    }
    
    // Remove advertising information
    await ctx.db.patch(args.plotId, {
      advertising: undefined,
      updatedAt: timestamp,
    });
    
    return {
      message: "Advertising removed successfully",
    };
  },
});