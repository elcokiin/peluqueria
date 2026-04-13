import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

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
        type: v.union(v.literal("cancellation"), v.literal("reschedule")),
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
