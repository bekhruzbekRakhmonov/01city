import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      companyInfo: {
        companyName: args.companyName,
        website: plot.companyInfo?.website || "",
        logoSvg: args.logoData,
        shortDescription: plot.companyInfo?.shortDescription || "",
        uploadedAt: timestamp,
      },
      updatedAt: timestamp,
    });
    
    return {
      logoSvg: args.logoData,
      message: "Logo uploaded successfully",
    };
  },
});

// Update company information for a plot
export const updateCompanyInfo = mutation({
  args: {
    userId: v.string(),
    plotId: v.id("plots"),
    companyInfo: v.object({
      companyName: v.string(),
      website: v.string(),
      logoSvg: v.string(),
      shortDescription: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Verify the plot belongs to the user
    const plot = await ctx.db.get(args.plotId);
    if (!plot || plot.userId !== args.userId) {
      throw new Error("Plot not found or access denied");
    }
    
    // Update company information
    await ctx.db.patch(args.plotId, {
      companyInfo: {
        companyName: args.companyInfo.companyName,
        website: args.companyInfo.website,
        logoSvg: args.companyInfo.logoSvg,
        shortDescription: args.companyInfo.shortDescription,
        uploadedAt: timestamp,
      },
      updatedAt: timestamp,
    });

    return {
      message: "Company information updated successfully",
    };
  },
});

// Get all plots with company information
export const getCompanyPlots = query({
  args: {},
  handler: async (ctx) => {
    const plots = await ctx.db
      .query("plots")
      .filter((q) => q.neq(q.field("companyInfo"), undefined))
      .collect();
    
    return plots.map(plot => ({
      _id: plot._id,
      position: plot.position,
      size: plot.size,
      mainBuilding: plot.mainBuilding,
      companyInfo: plot.companyInfo,
      username: plot.username,
      createdAt: plot.createdAt,
    }));
  },
});

// Get company information for a specific plot
export const getPlotCompanyInfo = query({
  args: {
    plotId: v.id("plots"),
  },
  handler: async (ctx, args) => {
    const plot = await ctx.db.get(args.plotId);
    if (!plot) {
      throw new Error("Plot not found");
    }
    
    return {
      companyInfo: plot.companyInfo,
      companyName: plot.companyInfo?.companyName,
      website: plot.companyInfo?.website,
      logoSvg: plot.companyInfo?.logoSvg,
      shortDescription: plot.companyInfo?.shortDescription,
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
          q.neq(q.field("companyInfo"), undefined),
          q.eq(q.field("companyInfo.companyName"), args.companyName)
        )
      )
      .collect();
    
    return plots.map(plot => ({
      _id: plot._id,
      position: plot.position,
      size: plot.size,
      companyInfo: plot.companyInfo,
      username: plot.username,
      createdAt: plot.createdAt,
    }));
  },
});

// Remove company information from a plot
export const removeCompanyInfo = mutation({
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
    
    // Remove company information
    await ctx.db.patch(args.plotId, {
      companyInfo: undefined,
      updatedAt: timestamp,
    });
    
    return {
      message: "Company information removed successfully",
    };
  },
});