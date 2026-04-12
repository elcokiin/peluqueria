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
  }).index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),
    
  preapprovedBarbers: defineTable({
    email: v.string(),
  }).index("by_email", ["email"]),
});