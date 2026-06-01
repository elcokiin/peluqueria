import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { assertPositiveInteger, sanitizeOptionalText, sanitizeText } from "./security";

// Helper function to get current user profile
async function getCurrentProfile(ctx: any) {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
    .unique();
}

// 1. Get all services (Admin view - includes inactive)
export const getAllServices = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile || profile.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return await ctx.db.query("services").collect();
  },
});

// 2. Add or update a master service (Admin only)
export const upsertService = mutation({
  args: {
    id: v.optional(v.id("services")),
    name: v.string(),
    description: v.optional(v.string()),
    defaultDuration: v.number(),
    defaultPrice: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile || profile.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const name = sanitizeText(args.name, 80);
    if (!name) throw new Error("Service name is required");

    const data = {
      name,
      description: sanitizeOptionalText(args.description, 240),
      defaultDuration: assertPositiveInteger(args.defaultDuration, "defaultDuration", 5, 480),
      defaultPrice: assertPositiveInteger(args.defaultPrice, "defaultPrice", 0, 10000000),
      isActive: args.isActive,
    };
    const { id } = args;

    if (id) {
      // Update
      await ctx.db.patch(id, data);
      return id;
    } else {
      // Create
      return await ctx.db.insert("services", data);
    }
  },
});

// 3. Delete a master service (Admin only)
export const deleteService = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile || profile.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Optional: Delete associated barberServices too to keep DB clean
    const associatedBarberServices = await ctx.db
      .query("barberServices")
      .filter((q) => q.eq(q.field("serviceId"), args.id))
      .collect();
      
    for (const bs of associatedBarberServices) {
      await ctx.db.delete(bs._id);
    }

    await ctx.db.delete(args.id);
  },
});
