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
        throw new Error("Only barbers or admins can manage blocks");
    }
    return profile;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get all blocks for the authenticated barber, optionally filtered by month */
export const getMyBlocks = query({
    args: {
        month: v.optional(v.string()), // "YYYY-MM" — filters by prefix
    },
    handler: async (ctx, args) => {
        const authUser = await authComponent.safeGetAuthUser(ctx);
        if (!authUser) return [];
        const profile = await ctx.db
            .query("users")
            .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
            .unique();
        if (!profile) return [];

        const all = await ctx.db
            .query("barberBlocks")
            .withIndex("by_barber", (q) => q.eq("barberId", profile._id))
            .collect();

        if (args.month) {
            return all.filter((b) => b.date.startsWith(args.month!));
        }
        return all;
    },
});

/** Get blocks for a specific barber on a specific date (used by slots calculation) */
export const getBlocksForDate = query({
    args: {
        barberId: v.id("users"),
        date: v.string(), // "YYYY-MM-DD"
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("barberBlocks")
            .withIndex("by_barber_and_date", (q) =>
                q.eq("barberId", args.barberId).eq("date", args.date)
            )
            .collect();
    },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new non-working block for the authenticated barber */
export const createBlock = mutation({
    args: {
        date: v.string(),                      // "YYYY-MM-DD"
        startMinute: v.optional(v.number()),   // undefined = full day
        endMinute: v.optional(v.number()),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const profile = await requireBarberOrAdmin(ctx);

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
            throw new Error("date must be in YYYY-MM-DD format");
        }

        // If partial block, validate minutes
        if (args.startMinute !== undefined || args.endMinute !== undefined) {
            if (args.startMinute === undefined || args.endMinute === undefined) {
                throw new Error("Both startMinute and endMinute must be provided for partial blocks");
            }
            if (args.startMinute < 0 || args.endMinute > 1440) {
                throw new Error("Block minutes must be between 0 and 1440");
            }
            if (args.startMinute >= args.endMinute) {
                throw new Error("startMinute must be less than endMinute");
            }
        }

        return await ctx.db.insert("barberBlocks", {
            barberId: profile._id,
            date: args.date,
            startMinute: args.startMinute,
            endMinute: args.endMinute,
            reason: args.reason,
        });
    },
});

/** Delete a block owned by the authenticated barber */
export const deleteBlock = mutation({
    args: { blockId: v.id("barberBlocks") },
    handler: async (ctx, args) => {
        const profile = await requireBarberOrAdmin(ctx);

        const block = await ctx.db.get(args.blockId);
        if (!block) throw new Error("Block not found");
        if (block.barberId !== profile._id && profile.role !== "admin") {
            throw new Error("Unauthorized to delete this block");
        }

        await ctx.db.delete(args.blockId);
    },
});
