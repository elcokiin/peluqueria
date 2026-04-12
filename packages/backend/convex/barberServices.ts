import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

async function getCurrentProfile(ctx: any) {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
    .unique();
}

// 1. Get all active global services (for the "Add Service" dropdown)
export const getAvailableGlobalServices = query({
  args: {},
  handler: async (ctx) => {
    // Both Admins and Barbers should be able to see active global services to pick from them
    return await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// 2. Get a specific barber's customized menu
// (If barberId is provided, get that barber's menu. If not, get current user's menu)
export const getMyServices = query({
  args: { barberId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let targetBarberId = args.barberId;

    if (!targetBarberId) {
      const profile = await getCurrentProfile(ctx);
      if (!profile) return [];
      targetBarberId = profile._id;
    }

    const barberServices = await ctx.db
      .query("barberServices")
      .withIndex("by_barber", (q) => q.eq("barberId", targetBarberId!))
      .collect();

    // Join with the master services table to get the Names and Descriptions
    const populatedServices = await Promise.all(
      barberServices.map(async (bs) => {
        const globalService = await ctx.db.get(bs.serviceId);
        return {
          ...bs,
          name: globalService?.name || "Unknown Service",
          description: globalService?.description,
          // Could return a flag if the global service is now inactive
          isGlobalActive: globalService?.isActive ?? false,
        };
      })
    );

    return populatedServices;
  },
});

// 3. Add or Update a barber's service
export const upsertBarberService = mutation({
  args: {
    serviceId: v.id("services"),
    price: v.number(),
    duration: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new Error("Unauthorized");
    
    if (profile.role !== "barber" && profile.role !== "admin") {
      throw new Error("Only barbers can configure services");
    }

    // Check if the barber already added this service
    const existing = await ctx.db
      .query("barberServices")
      .withIndex("by_barber_and_service", (q) => 
        q.eq("barberId", profile._id).eq("serviceId", args.serviceId)
      )
      .unique();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        price: args.price,
        duration: args.duration,
        isActive: args.isActive,
      });
    } else {
      // Insert new
      await ctx.db.insert("barberServices", {
        barberId: profile._id,
        serviceId: args.serviceId,
        price: args.price,
        duration: args.duration,
        isActive: args.isActive,
      });
    }
  },
});

// 4. Quick toggle active status (e.g., toggle switch on UI)
export const toggleServiceStatus = mutation({
  args: { barberServiceId: v.id("barberServices"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new Error("Unauthorized");

    const bs = await ctx.db.get(args.barberServiceId);
    if (!bs) throw new Error("Service not found");

    if (bs.barberId !== profile._id && profile.role !== "admin") {
      throw new Error("Unauthorized to edit this service");
    }

    await ctx.db.patch(args.barberServiceId, { isActive: args.isActive });
  },
});

// 5. Remove a service from barber's list
export const removeBarberService = mutation({
  args: { barberServiceId: v.id("barberServices") },
  handler: async (ctx, args) => {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new Error("Unauthorized");

    const bs = await ctx.db.get(args.barberServiceId);
    if (!bs) throw new Error("Service not found");

    if (bs.barberId !== profile._id && profile.role !== "admin") {
      throw new Error("Unauthorized to remove this service");
    }

    await ctx.db.delete(args.barberServiceId);
  }
});
