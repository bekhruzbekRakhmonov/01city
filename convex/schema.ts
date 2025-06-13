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
    
    // Pricing and payment information
    pricing: v.object({
      totalCost: v.number(), // Total cost in USD cents
      freeSquares: v.number(), // Number of free squares used
      paidSquares: v.number(), // Number of paid squares
      pricePerSquare: v.number(), // Price per square in USD cents
    }),
    
    // Payment status
    paymentStatus: v.string(), // "pending", "paid", "free"
    paymentId: v.optional(v.string()), // Payment processor transaction ID
    
    // Custom 3D model support
    customModel: v.optional(v.object({
      enabled: v.boolean(),
      modelUrl: v.optional(v.string()), // URL to uploaded GLB/GLTF file
      modelType: v.optional(v.string()), // "glb" or "gltf"
      uploadedAt: v.optional(v.number()),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  
  // User accounts and credits
  users: defineTable({
    userId: v.string(), // Clerk user ID
    username: v.string(),
    email: v.string(),
    
    // Account balance and credits
    credits: v.number(), // Available credits in USD cents
    totalSpent: v.number(), // Total amount spent
    
    // Subscription info (for future premium features)
    subscriptionTier: v.string(), // "free", "basic", "premium"
    subscriptionExpiry: v.optional(v.number()),
    
    // Free squares allowance
    freeSquaresUsed: v.number(),
    freeSquaresLimit: v.number(), // Default: 25 (5x5 plot)
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  
  // Payment transactions
  transactions: defineTable({
    userId: v.string(),
    plotId: v.optional(v.id("plots")),
    
    // Transaction details
    amount: v.number(), // Amount in USD cents
    currency: v.string(), // "USD"
    type: v.string(), // "plot_purchase", "credit_purchase", "model_upload"
    
    // Payment processor info
    paymentProcessor: v.string(), // "stripe", "paypal", etc.
    transactionId: v.string(),
    status: v.string(), // "pending", "completed", "failed", "refunded"
    
    // Additional metadata
    metadata: v.optional(v.any()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});