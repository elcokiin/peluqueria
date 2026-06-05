import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

async function requireProfile(ctx: any) {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");

    const profile = await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
        .unique();

    if (!profile) throw new Error("Profile not found");
    return profile;
}

export const internalGetApptContext = internalQuery({
    args: { appointmentId: v.id("appointments") },
    handler: async (ctx, args) => {
        const app = await ctx.db.get(args.appointmentId);
        if (!app) return null;
        const client = await ctx.db.get(app.clientId);
        const barber = await ctx.db.get(app.barberId);
        return {
            ...app,
            clientName: client?.name,
            clientEmail: client?.email,
            barberName: barber?.name,
        };
    },
});

export const internalLogNotification = internalMutation({
    args: {
        appointmentId: v.id("appointments"),
        clientId: v.id("users"),
        type: v.union(v.literal("cancellation"), v.literal("reschedule"), v.literal("reminder")),
        success: v.boolean(),
        error: v.optional(v.string()),
        sentAt: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("notifications", {
            appointmentId: args.appointmentId,
            clientId: args.clientId,
            type: args.type,
            success: args.success,
            error: args.error,
            sentAt: args.sentAt,
        });
    },
});

export const savePushSubscription = mutation({
    args: {
        endpoint: v.string(),
        expirationTime: v.optional(v.union(v.number(), v.null())),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const profile = await requireProfile(ctx);
        const now = Date.now();
        const existing = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                clientId: profile._id,
                expirationTime: args.expirationTime,
                p256dh: args.keys.p256dh,
                auth: args.keys.auth,
                userAgent: args.userAgent,
                updatedAt: now,
            });
            return existing._id;
        }

        return await ctx.db.insert("pushSubscriptions", {
            clientId: profile._id,
            endpoint: args.endpoint,
            expirationTime: args.expirationTime,
            p256dh: args.keys.p256dh,
            auth: args.keys.auth,
            userAgent: args.userAgent,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const deletePushSubscription = mutation({
    args: {
        endpoint: v.string(),
    },
    handler: async (ctx, args) => {
        const profile = await requireProfile(ctx);
        const existing = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .unique();

        if (existing && existing.clientId === profile._id) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const internalListSubscriptionsForClient = internalQuery({
    args: { clientId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .take(10);
    },
});

export const internalListDueReminderAppointments = internalQuery({
    args: {
        now: v.number(),
        windowEnd: v.number(),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_status_and_startTime", (q) =>
                q
                    .eq("status", "scheduled")
                    .gte("startTime", args.now)
                    .lt("startTime", args.windowEnd)
            )
            .take(args.limit * 3);

        const appointmentsWithoutReminder = appointments
            .filter((app) => app.notificationSent !== true)
            .slice(0, args.limit);

        return await Promise.all(
            appointmentsWithoutReminder.map(async (app) => {
                const barber = await ctx.db.get(app.barberId);
                const barberService = await ctx.db.get(app.serviceId);
                const masterService = barberService ? await ctx.db.get(barberService.serviceId) : null;

                return {
                    appointmentId: app._id,
                    clientId: app.clientId,
                    startTime: app.startTime,
                    barberName: barber?.name || "tu barbero",
                    serviceName: masterService?.name || "tu servicio",
                };
            })
        );
    },
});

export const internalMarkReminderSent = internalMutation({
    args: {
        appointmentId: v.id("appointments"),
        success: v.boolean(),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const app = await ctx.db.get(args.appointmentId);
        if (!app) return;

        if (args.success) {
            await ctx.db.patch(args.appointmentId, { notificationSent: true });
        }

        await ctx.db.insert("notifications", {
            appointmentId: args.appointmentId,
            clientId: app.clientId,
            type: "reminder",
            sentAt: Date.now(),
            success: args.success,
            error: args.error,
        });
    },
});
