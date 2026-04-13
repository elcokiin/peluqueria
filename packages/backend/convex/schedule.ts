import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// ─── Helper ──────────────────────────────────────────────────────────────────

async function requireBarberOrAdmin(ctx: any) {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");
    const profile = await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
        .unique();
    if (!profile) throw new Error("Profile not found");
    if (profile.role !== "barber" && profile.role !== "admin") {
        throw new Error("Only barbers or admins can manage schedules");
    }
    return profile;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get all schedule rows for the authenticated barber */
export const getMySchedule = query({
    args: {},
    handler: async (ctx) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) return null;
        const profile = await ctx.db
            .query("users")
            .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
            .unique();
        if (!profile) return null;
        return await ctx.db
            .query("barberSchedule")
            .withIndex("by_barber", (q) => q.eq("barberId", profile._id))
            .collect();
    },
});

/** Get the schedule for a specific barber (public, used for booking) */
export const getBarberSchedule = query({
    args: { barberId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("barberSchedule")
            .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
            .collect();
    },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create or update a single day in the barber's weekly schedule.
 * If a row already exists for that dayOfWeek, it is replaced.
 */
export const upsertScheduleDay = mutation({
    args: {
        dayOfWeek: v.number(),              // 0=Sun ... 6=Sat
        startMinute: v.number(),            // e.g. 480 = 8:00
        endMinute: v.number(),              // e.g. 1080 = 18:00
        baseSlotInterval: v.number(),       // e.g. 40
        breakStartMinute: v.optional(v.number()), // e.g. 720 = 12:00
        breakEndMinute: v.optional(v.number()),   // e.g. 840 = 14:00
    },
    handler: async (ctx, args) => {
        const profile = await requireBarberOrAdmin(ctx);

        if (args.dayOfWeek < 0 || args.dayOfWeek > 6) {
            throw new Error("dayOfWeek must be 0–6");
        }
        if (args.startMinute >= args.endMinute) {
            throw new Error("startMinute must be less than endMinute");
        }
        if (args.endMinute > 1440) {
            throw new Error("endMinute cannot exceed 1440 (midnight)");
        }
        if (args.baseSlotInterval < 5) {
            throw new Error("baseSlotInterval must be at least 5 minutes");
        }
        if (args.breakStartMinute !== undefined && args.breakEndMinute !== undefined) {
            if (args.breakStartMinute >= args.breakEndMinute) {
                throw new Error("breakStartMinute must be less than breakEndMinute");
            }
            if (args.breakStartMinute <= args.startMinute || args.breakEndMinute >= args.endMinute) {
                throw new Error("Break must be within the working hours");
            }
        }

        const existing = await ctx.db
            .query("barberSchedule")
            .withIndex("by_barber_and_day", (q) =>
                q.eq("barberId", profile._id).eq("dayOfWeek", args.dayOfWeek)
            )
            .unique();

        const data = {
            startMinute: args.startMinute,
            endMinute: args.endMinute,
            baseSlotInterval: args.baseSlotInterval,
            breakStartMinute: args.breakStartMinute,
            breakEndMinute: args.breakEndMinute,
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        } else {
            return await ctx.db.insert("barberSchedule", {
                barberId: profile._id,
                dayOfWeek: args.dayOfWeek,
                ...data,
            });
        }
    },
});

/** Remove a day from the barber's schedule (marks that day as non-working) */
export const deleteScheduleDay = mutation({
    args: { dayOfWeek: v.number() },
    handler: async (ctx, args) => {
        const profile = await requireBarberOrAdmin(ctx);

        const existing = await ctx.db
            .query("barberSchedule")
            .withIndex("by_barber_and_day", (q) =>
                q.eq("barberId", profile._id).eq("dayOfWeek", args.dayOfWeek)
            )
            .unique();

        if (!existing) throw new Error("Schedule day not found");
        await ctx.db.delete(existing._id);
    },
});
