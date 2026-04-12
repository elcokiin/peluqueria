import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import type { Id } from "./_generated/dataModel";

const ADMINS_EMAILS = process.env.ADMINS_EMAILS?.split(",")?.map(email => email.trim()) || [];

export const syncUserProfile = internalMutation({
  args: {
    authUserId: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .unique();

    if (existingUser) return existingUser._id;

    const email = args.email.toLowerCase();
    const isAdmin = ADMINS_EMAILS.includes(email);
    let role: "user" | "barber" | "admin" = isAdmin ? "admin" : "user";

    // Check if the user was pre-approved as a barber
    const preapproved = await ctx.db
      .query("preapprovedBarbers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!isAdmin && preapproved) {
      role = "barber";
      // Clean up the pre-approved list
      await ctx.db.delete(preapproved._id);
    }

    // Create a new profile
    return await ctx.db.insert("users", {
      authUserId: args.authUserId,
      name: args.name,
      email: email,
      role,
      activeRole: role,
    });
  }
});

export const currentProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();
  },
});

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Not authenticated");

    const email = authUser.email.toLowerCase();
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (existingUser) {
      let updated = false;
      const updates: { role?: "user" | "barber" | "admin", activeRole?: "user" | "barber" | "admin" } = {};

      // 1. Check if they were just added to admins
      if (ADMINS_EMAILS.includes(email) && existingUser.role !== "admin") {
        updates.role = "admin";
        updates.activeRole = "admin";
        updated = true;
      }

      // 2. Check if they were just added to preapproved barbers
      if (!ADMINS_EMAILS.includes(email) && existingUser.role === "user") {
        const preapproved = await ctx.db
          .query("preapprovedBarbers")
          .withIndex("by_email", (q) => q.eq("email", email))
          .unique();

        if (preapproved) {
          updates.role = "barber";
          updates.activeRole = "barber";
          updated = true;
          // Clean up the pre-approved list
          await ctx.db.delete(preapproved._id);
        }
      }

      if (updated) {
        await ctx.db.patch(existingUser._id, updates);
      }
      
      return existingUser._id;
    }

    const isAdmin = ADMINS_EMAILS.includes(email);
    let role: "user" | "barber" | "admin" = isAdmin ? "admin" : "user";

    // Check if the user was pre-approved as a barber
    const preapproved = await ctx.db
      .query("preapprovedBarbers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!isAdmin && preapproved) {
      role = "barber";
      // Clean up the pre-approved list
      await ctx.db.delete(preapproved._id);
    }

    // Create a new profile
    return await ctx.db.insert("users", {
      authUserId: authUser._id,
      name: authUser.name,
      email: email,
      role,
      activeRole: role,
    });
  },
});

export const switchActiveRole = mutation({
  args: {
    targetRole: v.union(v.literal("user"), v.literal("barber"), v.literal("admin")),
  },
  handler: async (ctx, { targetRole }) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();
    
    if (!profile) throw new Error("Profile not found");

    // Enforce MAC:
    // Admin can be anything
    // Barber can be Barber or User
    // User can only be User
    if (profile.role === "user" && targetRole !== "user") {
      throw new Error("You do not have permissions to switch to this role");
    }
    if (profile.role === "barber" && targetRole === "admin") {
      throw new Error("You do not have permissions to switch to admin role");
    }

    await ctx.db.patch(profile._id, { activeRole: targetRole });
  },
});

// Admin ONLY: Set a user's role to barber or add them to pre-approved list
export const addBarberByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();
      
    if (profile?.role !== "admin") {
      throw new Error("Only admins can add barbers");
    }

    const targetUser = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (!targetUser) {
      // Add to pre-approved list if not already there
      const existingPreapproval = await ctx.db
        .query("preapprovedBarbers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
        
      if (!existingPreapproval) {
        await ctx.db.insert("preapprovedBarbers", { email });
      }
      return { status: "pending" };
    }

    await ctx.db.patch(targetUser._id, { role: "barber", activeRole: "barber" });
    return { status: "updated" };
  }
});

// Admin ONLY: Get all barbers
export const getBarbers = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (profile?.role !== "admin") {
      return null;
    }

    return await ctx.db
      .query("users")
      .filter((q) => q.or(q.eq(q.field("role"), "barber"), q.eq(q.field("role"), "admin")))
      .collect();
  }
});

// Admin ONLY: Get pending pre-approved barbers
export const getPendingBarbers = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return null;

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (profile?.role !== "admin") {
      return null;
    }

    return await ctx.db.query("preapprovedBarbers").collect();
  }
});
// Admin ONLY: Set a barber's active status
export const setBarberStatus = mutation({
  args: { 
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();
      
    if (profile?.role !== "admin") {
      throw new Error("Only admins can update barber status");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    if (targetUser.role !== "barber" && targetUser.role !== "admin") {
      throw new Error("Target user is not a barber");
    }

    await ctx.db.patch(args.userId, { isActive: args.isActive });
    return { status: "updated" };
  }
});

// Admin ONLY: Remove a barber (downgrade to user) or remove from pending
export const removeBarber = mutation({
  args: { 
    id: v.union(v.id("users"), v.id("preapprovedBarbers")),
    isPending: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");

    const profile = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();
      
    if (profile?.role !== "admin") {
      throw new Error("Only admins can remove barbers");
    }

    if (args.isPending) {
      await ctx.db.delete(args.id as Id<"preapprovedBarbers">);
    } else {
      const targetUser = await ctx.db.get(args.id as Id<"users">);
      if (!targetUser) throw new Error("User not found");
      
      if (targetUser.email && ADMINS_EMAILS.includes(targetUser.email)) {
        throw new Error("Cannot remove super admin");
      }

      await ctx.db.patch(args.id as Id<"users">, { role: "user", activeRole: "user" });
    }
    
    return { status: "removed" };
  }
});
