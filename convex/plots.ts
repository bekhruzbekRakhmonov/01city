import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all plots in the city
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("plots").collect();
  },
});

// Get a specific plot by ID
export const getById = query({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get plots by user ID
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plots")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

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
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    return await ctx.db.insert("plots", {
      ...args,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
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

// Delete a plot
export const remove = mutation({
  args: { id: v.id("plots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});