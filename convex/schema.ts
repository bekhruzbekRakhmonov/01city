import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  plots: defineTable({
    // Owner information
    userId: v.string(),
    username: v.string(),
    
    // Plot location and size
    position: v.object({
      x: v.number(),
      z: v.number(),
    }),
    size: v.object({
      width: v.number(),
      depth: v.number(),
    }),
    
    // Main building configuration
    mainBuilding: v.object({
      type: v.string(), // building style/type
      height: v.number(),
      color: v.string(),
      rotation: v.number(),
      customizations: v.optional(v.any()), // Additional customizations
    }),
    
    // Optional garden
    garden: v.optional(v.object({
      enabled: v.boolean(),
      style: v.string(),
      elements: v.array(v.string()),
    })),
    
    // Optional sub-buildings (like cafe, studio, gallery)
    subBuildings: v.optional(v.array(
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
    )),
    
    // Creator information and description
    creatorInfo: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});