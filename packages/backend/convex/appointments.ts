import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth(ctx: any, roleRequired?: "barber" | "admin" | "any") {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Unauthorized");
    const profile = await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
        .unique();
    if (!profile) throw new Error("Profile not found");
    if (roleRequired === "admin" && profile.role !== "admin") {
        throw new Error("Action restricted to admins");
    }
    if (roleRequired === "barber" && profile.role !== "barber" && profile.role !== "admin") {
        throw new Error("Action restricted to barber/admin");
    }
    return profile;
}

function parseDateParts(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return { year, month: month - 1, day };
}

function getTimestampForMinute(dateStr: string, minutesFromMidnight: number): number {
    const { year, month, day } = parseDateParts(dateStr);
    const bogotaOffsetMinutes = 300; // UTC-5
    const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return d.getTime() + (minutesFromMidnight + bogotaOffsetMinutes) * 60000;
}

function assertValidDateString(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("date must be in YYYY-MM-DD format");
    }
}

/**
 * Core validation: verifies the appointment fits within schedule, doesn't
 * overlap blocks, and doesn't conflict with existing appointments.
 * Returns the computed endTime (ms).
 */
async function assertAppointmentFits(
    ctx: any,
    params: {
        barberId: any;
        date: string;
        startTime: number;
        totalDuration: number;
        ignoreAppointmentId?: any;
    }
): Promise<number> {
    const { barberId, date, startTime, totalDuration, ignoreAppointmentId } = params;
    assertValidDateString(date);

    if (totalDuration <= 0) throw new Error("totalDuration must be greater than 0");
    if (startTime <= Date.now()) throw new Error("Cannot schedule appointments in the past");

    const endTime = startTime + totalDuration * 60000;
    const { year, month, day } = parseDateParts(date);
    const strictDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const dayOfWeek = strictDate.getUTCDay();

    const schedule = await ctx.db
        .query("barberSchedule")
        .withIndex("by_barber_and_day", (q: any) =>
            q.eq("barberId", barberId).eq("dayOfWeek", dayOfWeek)
        )
        .unique();

    if (!schedule) throw new Error("Barber is not working on the selected day");

    const scheduleStartMs = getTimestampForMinute(date, schedule.startMinute);
    const scheduleEndMs = getTimestampForMinute(date, schedule.endMinute);

    if (startTime < scheduleStartMs || endTime > scheduleEndMs) {
        throw new Error("Appointment is outside the barber working schedule");
    }

    const blocks = await ctx.db
        .query("barberBlocks")
        .withIndex("by_barber_and_date", (q: any) =>
            q.eq("barberId", barberId).eq("date", date)
        )
        .collect();

    // Full-day block
    if (blocks.some((b: any) => b.startMinute === undefined || b.endMinute === undefined)) {
        throw new Error("The selected day is fully blocked by the barber");
    }

    // Partial blocks overlap check
    for (const block of blocks) {
        if (block.startMinute === undefined || block.endMinute === undefined) continue;
        const blockStart = getTimestampForMinute(date, block.startMinute);
        const blockEnd = getTimestampForMinute(date, block.endMinute);
        if (startTime < blockEnd && endTime > blockStart) {
            throw new Error("Appointment collides with a blocked time range");
        }
    }

    const appointments = await ctx.db
        .query("appointments")
        .withIndex("by_barber_and_date", (q: any) =>
            q.eq("barberId", barberId).eq("date", date)
        )
        .collect();

    const ignoredId = ignoreAppointmentId ? String(ignoreAppointmentId) : null;
    const activeAppointments = appointments.filter(
        (a: any) => a.status !== "cancelled" && String(a._id) !== ignoredId
    );

    for (const a of activeAppointments) {
        if (startTime < a.endTime && endTime > a.startTime) {
            throw new Error("This slot is no longer available. It conflicts with another appointment.");
        }
    }

    return endTime;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** List appointments for a barber on a given date, ordered by startTime. */
export const listAppointments = query({
    args: {
        barberId: v.optional(v.id("users")),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const profile = await requireAuth(ctx, "barber");
        assertValidDateString(args.date);

        let targetBarberId = profile._id;
        if (profile.role === "admin" && args.barberId) {
            targetBarberId = args.barberId;
        }
        if (profile.role !== "admin" && args.barberId && args.barberId !== profile._id) {
            throw new Error("Unauthorized to view another barber's appointments");
        }

        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_barber_and_date", (q) =>
                q.eq("barberId", targetBarberId).eq("date", args.date)
            )
            .collect();

        appointments.sort((a, b) => a.startTime - b.startTime);

        return await Promise.all(
            appointments.map(async (app) => {
                const client = await ctx.db.get(app.clientId);
                const barberService = await ctx.db.get(app.serviceId);
                const masterService = barberService ? await ctx.db.get(barberService.serviceId) : null;

                let extraServices: string[] = [];
                if (app.extraServiceIds) {
                    extraServices = await Promise.all(
                        app.extraServiceIds.map(async (id) => {
                            const bls = await ctx.db.get(id);
                            if (!bls) return null;
                            const ms = await ctx.db.get(bls.serviceId);
                            return ms ? ms.name : "Unknown";
                        })
                    ).then((r) => r.filter((s): s is string => s !== null));
                }

                return {
                    ...app,
                    clientName: client?.name || client?.email || "Unknown Client",
                    serviceName: masterService?.name || "Unknown Service",
                    extraServiceNames: extraServices,
                };
            })
        );
    },
});

/** Get all appointments for the authenticated client. */
export const myAppointments = query({
    args: {},
    handler: async (ctx) => {
        const profile = await requireAuth(ctx, "any");
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_client", (q) => q.eq("clientId", profile._id))
            .order("desc")
            .take(50);

        const enriched = await Promise.all(
            appointments.map(async (app) => {
                const barber = await ctx.db.get(app.barberId);
                const barberService = await ctx.db.get(app.serviceId);
                const masterService = barberService ? await ctx.db.get(barberService.serviceId) : null;

                return {
                    ...app,
                    barberName: barber?.name || barber?.email || "Barbero",
                    serviceName: masterService?.name || "Servicio",
                    servicePrice: barberService?.price ?? null,
                };
            })
        );

        return enriched.sort((a, b) => a.startTime - b.startTime);
    },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new appointment after validating the slot is free. */
export const createAppointment = mutation({
    args: {
        barberId: v.id("users"),
        serviceId: v.id("barberServices"),
        date: v.string(),
        startTime: v.number(),
    },
    handler: async (ctx, args) => {
        const profile = await requireAuth(ctx, "any");
        assertValidDateString(args.date);

        const barber = await ctx.db.get(args.barberId);
        if (!barber || (barber.role !== "barber" && barber.role !== "admin")) {
            throw new Error("Barber not found");
        }

        const barberService = await ctx.db.get(args.serviceId);
        if (!barberService) throw new Error("Service not found");
        if (barberService.barberId !== args.barberId) {
            throw new Error("Service does not belong to the selected barber");
        }
        if (!barberService.isActive) throw new Error("Selected service is currently inactive");

        const totalDuration = barberService.duration;
        const endTime = await assertAppointmentFits(ctx, {
            barberId: args.barberId,
            date: args.date,
            startTime: args.startTime,
            totalDuration,
        });

        return await ctx.db.insert("appointments", {
            barberId: args.barberId,
            clientId: profile._id,
            serviceId: args.serviceId,
            date: args.date,
            startTime: args.startTime,
            endTime,
            totalDuration,
            status: "scheduled",
            notificationSent: false,
        });
    },
});

/** Cancel an appointment and notify the client via email. */
export const cancelAppointment = mutation({
    args: {
        appointmentId: v.id("appointments"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const profile = await requireAuth(ctx, "any");
        const target = await ctx.db.get(args.appointmentId);
        if (!target) throw new Error("Appointment not found");

        if (
            target.clientId !== profile._id &&
            target.barberId !== profile._id &&
            profile.role !== "admin"
        ) {
            throw new Error("Unauthorized to cancel this appointment");
        }

        if (target.status === "cancelled") throw new Error("Appointment is already cancelled");
        if (target.status === "closed") throw new Error("Cannot cancel a closed appointment");

        await ctx.db.patch(target._id, {
            status: "cancelled",
            cancelReason: args.reason,
        });

        // Fire-and-forget email via Resend (Node.js action)
        await ctx.scheduler.runAfter(0, internal.notificationsNode.sendEmail, {
            appointmentId: target._id,
            type: "cancellation",
            reason: args.reason,
        });
    },
});

/** Reschedule an appointment to a new date/time, notifying client. */
export const rescheduleAppointment = mutation({
    args: {
        appointmentId: v.id("appointments"),
        date: v.string(),
        startTime: v.number(),
    },
    handler: async (ctx, args) => {
        const profile = await requireAuth(ctx, "any");
        const target = await ctx.db.get(args.appointmentId);
        if (!target) throw new Error("Appointment not found");

        assertValidDateString(args.date);

        if (
            target.clientId !== profile._id &&
            target.barberId !== profile._id &&
            profile.role !== "admin"
        ) {
            throw new Error("Unauthorized to reschedule this appointment");
        }

        if (target.status === "cancelled") throw new Error("Cannot reschedule a cancelled appointment");
        if (target.status === "closed") throw new Error("Cannot reschedule a closed appointment");

        const endTime = await assertAppointmentFits(ctx, {
            barberId: target.barberId,
            date: args.date,
            startTime: args.startTime,
            totalDuration: target.totalDuration,
            ignoreAppointmentId: target._id,
        });

        await ctx.db.patch(target._id, {
            date: args.date,
            startTime: args.startTime,
            endTime,
            notificationSent: false,
        });

        await ctx.scheduler.runAfter(0, internal.notificationsNode.sendEmail, {
            appointmentId: target._id,
            type: "reschedule",
        });
    },
});

/** Close an appointment and compute the final price (optionally with extra services). */
export const closeAppointment = mutation({
    args: {
        appointmentId: v.id("appointments"),
        extraServiceIds: v.array(v.id("barberServices")),
    },
    handler: async (ctx, args) => {
        const profile = await requireAuth(ctx, "barber");
        const target = await ctx.db.get(args.appointmentId);
        if (!target) throw new Error("Appointment not found");

        if (target.barberId !== profile._id && profile.role !== "admin") {
            throw new Error("Unauthorized to close this appointment");
        }

        if (target.status === "cancelled") throw new Error("Cannot close a cancelled appointment");
        if (target.status === "closed") throw new Error("Appointment is already closed");

        let finalPrice = 0;
        const primaryService = await ctx.db.get(target.serviceId);
        if (primaryService) finalPrice += primaryService.price;

        const uniqueExtraIds = Array.from(new Set(args.extraServiceIds));
        for (const sid of uniqueExtraIds) {
            const extra = await ctx.db.get(sid);
            if (!extra) throw new Error("One or more extra services were not found");
            if (extra.barberId !== target.barberId) {
                throw new Error("Extra service does not belong to this barber");
            }
            finalPrice += extra.price;
        }

        await ctx.db.patch(target._id, {
            status: "closed",
            extraServiceIds: uniqueExtraIds,
            finalPrice,
        });
    },
});
