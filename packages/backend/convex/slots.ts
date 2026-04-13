import { query } from "./_generated/server";
import { v } from "convex/values";

function parseDateParts(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return { year, month: month - 1, day };
}

/**
 * Converts minutes-from-midnight to a UTC timestamp for a given Bogota (UTC-5) date.
 */
function getTimestampForMinute(dateStr: string, minutesFromMidnight: number): number {
    const { year, month, day } = parseDateParts(dateStr);
    const bogotaOffsetMinutes = 300; // UTC-5
    const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return d.getTime() + ((minutesFromMidnight + bogotaOffsetMinutes) * 60000);
}

type TimeRange = { start: number; end: number };

/**
 * Core Liquid Timeline Algorithm.
 * Computes available start-time slots (ms timestamps) for a barber on a given date.
 * Treats the schedule break and blocked ranges as virtual occupied events.
 */
export const getAvailableSlots = query({
    args: {
        barberId: v.id("users"),
        date: v.string(), // "YYYY-MM-DD"
        totalDuration: v.number(), // in minutes
    },
    handler: async (ctx, args) => {
        // 1. Get the Schedule for the day of the week
        const { year, month, day } = parseDateParts(args.date);
        const strictDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
        const dayOfWeek = strictDate.getUTCDay();

        const schedule = await ctx.db
            .query("barberSchedule")
            .withIndex("by_barber_and_day", (q) =>
                q.eq("barberId", args.barberId).eq("dayOfWeek", dayOfWeek)
            )
            .unique();

        if (!schedule) return []; // Not working that day

        // 2. Get day-specific blocks for that date
        const blocks = await ctx.db
            .query("barberBlocks")
            .withIndex("by_barber_and_date", (q) =>
                q.eq("barberId", args.barberId).eq("date", args.date)
            )
            .collect();

        // Full-day block? Return no slots
        if (blocks.some((b) => b.startMinute === undefined || b.endMinute === undefined)) {
            return [];
        }

        // 3. Get existing active appointments for that day
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_barber_and_date", (q) =>
                q.eq("barberId", args.barberId).eq("date", args.date)
            )
            .collect();

        const activeAppointments = appointments.filter((a) => a.status !== "cancelled");

        // 4. Build boundaries
        const scheduleStartMs = getTimestampForMinute(args.date, schedule.startMinute);
        const scheduleEndMs = getTimestampForMinute(args.date, schedule.endMinute);

        // 5. Gather all blocking events
        const blockingEvents: TimeRange[] = [];

        // 5a. Partial day-specific blocks
        for (const b of blocks) {
            if (b.startMinute !== undefined && b.endMinute !== undefined) {
                blockingEvents.push({
                    start: getTimestampForMinute(args.date, b.startMinute),
                    end: getTimestampForMinute(args.date, b.endMinute),
                });
            }
        }

        // 5b. Schedule break (e.g. lunch 12:00–14:00) — injected as a virtual block
        if (schedule.breakStartMinute !== undefined && schedule.breakEndMinute !== undefined) {
            blockingEvents.push({
                start: getTimestampForMinute(args.date, schedule.breakStartMinute),
                end: getTimestampForMinute(args.date, schedule.breakEndMinute),
            });
        }

        // 5c. Existing appointments
        for (const a of activeAppointments) {
            blockingEvents.push({ start: a.startTime, end: a.endTime });
        }

        // 6. Sort and merge overlapping blocking events
        blockingEvents.sort((a, b) => a.start - b.start);
        const mergedEvents: TimeRange[] = [];
        if (blockingEvents.length > 0) {
            let current = { ...blockingEvents[0] };
            for (let i = 1; i < blockingEvents.length; i++) {
                const next = blockingEvents[i];
                if (next.start <= current.end) {
                    current.end = Math.max(current.end, next.end);
                } else {
                    mergedEvents.push(current);
                    current = { ...next };
                }
            }
            mergedEvents.push(current);
        }

        // 7. Generate candidate start-time seeds
        const candidateSeedsMs = new Set<number>();

        // Seed 1: Regular interval grid from schedule start
        const intervalMs = schedule.baseSlotInterval * 60000;
        let currentSeed = scheduleStartMs;
        while (currentSeed < scheduleEndMs) {
            candidateSeedsMs.add(currentSeed);
            currentSeed += intervalMs;
        }

        // Seed 2: End of every merged event (Liquid Timeline gaps)
        for (const event of mergedEvents) {
            if (event.end >= scheduleStartMs && event.end < scheduleEndMs) {
                candidateSeedsMs.add(event.end);
            }
        }

        // 8. Evaluate candidates — keep only those that fit
        const nowMs = Date.now();
        const requiredMs = args.totalDuration * 60000;
        const availableSlots: number[] = [];
        const sortedCandidates = Array.from(candidateSeedsMs).sort((a, b) => a - b);

        for (const candidate of sortedCandidates) {
            if (candidate < scheduleStartMs) continue;
            if (candidate <= nowMs) continue; // No past slots

            const candidateEnd = candidate + requiredMs;
            if (candidateEnd > scheduleEndMs) continue; // Overflows shift end

            let collides = false;
            for (const event of mergedEvents) {
                if (candidate < event.end && candidateEnd > event.start) {
                    collides = true;
                    break;
                }
            }

            if (!collides) availableSlots.push(candidate);
        }

        return availableSlots;
    },
});
