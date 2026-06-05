import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

async function requireAuth(ctx: any) {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) throw new Error("Unauthorized");

  const profile = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", authUser._id))
    .unique();

  if (!profile) throw new Error("Profile not found");
  return profile;
}

function assertValidRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("La calificación debe estar entre 1 y 5 estrellas.");
  }
}

function sanitizeComment(comment: string | undefined) {
  if (!comment) return undefined;
  const clean = comment.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 280) : undefined;
}

function monthFromDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  return date.slice(0, 7);
}

function previousMonth(now = new Date()) {
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function upsertMvpAwardForMonth(ctx: any, month: string) {
  const ratings = await ctx.db
    .query("ratings")
    .withIndex("by_month", (q: any) => q.eq("month", month))
    .take(1000);

  const totals = new Map<string, { barberId: any; sum: number; count: number }>();
  for (const item of ratings) {
    const key = String(item.barberId);
    const current = totals.get(key) ?? { barberId: item.barberId, sum: 0, count: 0 };
    current.sum += item.rating;
    current.count += 1;
    totals.set(key, current);
  }

  let winner: { barberId: any; averageRating: number; ratingCount: number } | null = null;
  for (const item of totals.values()) {
    const averageRating = item.sum / item.count;
    if (
      !winner ||
      averageRating > winner.averageRating ||
      (averageRating === winner.averageRating && item.count > winner.ratingCount)
    ) {
      winner = { barberId: item.barberId, averageRating, ratingCount: item.count };
    }
  }

  const existing = await ctx.db
    .query("monthlyMvpAwards")
    .withIndex("by_month", (q: any) => q.eq("month", month))
    .unique();

  if (!winner) {
    if (existing) await ctx.db.delete(existing._id);
    return null;
  }

  const award = {
    month,
    barberId: winner.barberId,
    averageRating: Math.round(winner.averageRating * 100) / 100,
    ratingCount: winner.ratingCount,
    awardedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, award);
    return existing._id;
  }

  return await ctx.db.insert("monthlyMvpAwards", award);
}

export const submitAppointmentRating = mutation({
  args: {
    appointmentId: v.id("appointments"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireAuth(ctx);
    assertValidRating(args.rating);

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Cita no encontrada.");
    if (appointment.clientId !== profile._id) {
      throw new Error("Solo el cliente de la cita puede calificar el servicio.");
    }
    if (appointment.status !== "closed") {
      throw new Error("Solo puedes calificar una cita finalizada.");
    }

    const now = Date.now();
    const month = monthFromDate(appointment.date);
    const comment = sanitizeComment(args.comment);
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", appointment._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        comment,
        updatedAt: now,
      });
      await upsertMvpAwardForMonth(ctx, month);
      return existing._id;
    }

    const ratingId = await ctx.db.insert("ratings", {
      appointmentId: appointment._id,
      barberId: appointment.barberId,
      clientId: appointment.clientId,
      rating: args.rating,
      comment,
      month,
      createdAt: now,
      updatedAt: now,
    });

    await upsertMvpAwardForMonth(ctx, month);
    return ratingId;
  },
});

export const getBarberRatingSummary = query({
  args: {
    barberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .take(1000);

    if (ratings.length === 0) {
      return { averageRating: null, ratingCount: 0 };
    }

    const total = ratings.reduce((sum, item) => sum + item.rating, 0);
    return {
      averageRating: Math.round((total / ratings.length) * 10) / 10,
      ratingCount: ratings.length,
    };
  },
});

export const getLatestMvpAward = query({
  args: {},
  handler: async (ctx) => {
    const awards = await ctx.db.query("monthlyMvpAwards").take(100);
    awards.sort((a, b) => b.month.localeCompare(a.month));
    const award = awards[0];
    if (!award) return null;

    const barber = await ctx.db.get(award.barberId);
    return {
      ...award,
      barberName: barber?.name || barber?.email || "Barbero",
    };
  },
});

export const listMvpAwards = query({
  args: {},
  handler: async (ctx) => {
    const awards = await ctx.db.query("monthlyMvpAwards").take(24);
    awards.sort((a, b) => b.month.localeCompare(a.month));

    return await Promise.all(
      awards.map(async (award) => {
        const barber = await ctx.db.get(award.barberId);
        return {
          ...award,
          barberName: barber?.name || barber?.email || "Barbero",
        };
      })
    );
  },
});

export const awardPreviousMonth = internalMutation({
  args: {},
  handler: async (ctx) => {
    await upsertMvpAwardForMonth(ctx, previousMonth());
    return null;
  },
});

export const awardMonth = internalMutation({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}$/.test(args.month)) {
      throw new Error("month must be in YYYY-MM format");
    }
    await upsertMvpAwardForMonth(ctx, args.month);
    return null;
  },
});
