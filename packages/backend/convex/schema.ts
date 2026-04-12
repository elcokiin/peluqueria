import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authUserId: v.string(), // Links to Better Auth's internal user ID
    name: v.optional(v.string()),
    email: v.string(),
    // max role of the user (admin > barber > user)
    role: v.union(v.literal("user"), v.literal("barber"), v.literal("admin")),
    // the currently active role selected in the UI dropdown
    activeRole: v.union(v.literal("user"), v.literal("barber"), v.literal("admin")),
    isActive: v.optional(v.boolean()), // Barber active status
  }).index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),
    
  preapprovedBarbers: defineTable({
    email: v.string(),
  }).index("by_email", ["email"]),

  // 1. ADMIN CONTROLLED: The Master Catalog
  services: defineTable({
    name: v.string(), // e.g., "Skin Fade", "Beard Trim"
    description: v.optional(v.string()),
    defaultDuration: v.number(), // in minutes (e.g., 30)
    defaultPrice: v.number(), // fallback price
    isActive: v.boolean(), // Admin can hide services platform-wide
  }),

  // 2. BARBER CONTROLLED: Their specific menu
  barberServices: defineTable({
    barberId: v.id("users"), // Links to the user (barber)
    serviceId: v.id("services"), // Link to the master catalog
    price: v.number(), // Barber's custom price
    duration: v.number(), // Barber's custom duration (in minutes)
    isActive: v.boolean(), // Barber can temporarily turn off a service
  })
  .index("by_barber", ["barberId"]) // For fast querying of a barber's menu
  .index("by_barber_and_service", ["barberId", "serviceId"]), // To prevent duplicates
});