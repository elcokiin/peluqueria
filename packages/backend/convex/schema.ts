import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authUserId: v.string(), // Links to Better Auth's internal user ID
    name: v.optional(v.string()),
    email: v.string(),
    // max role of the user (admin > barber > user)
    role: v.union(v.literal("user"), v.literal("barber"), v.literal("admin")),
    // the currently active role selected in the UI dropdown
    activeRole: v.union(v.literal("user"), v.literal("barber"), v.literal("admin")),
    isActive: v.optional(v.boolean()), // Barber active status
  }).index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),

  preapprovedBarbers: defineTable({
    email: v.string(),
  }).index("by_email", ["email"]),

  // 1. ADMIN CONTROLLED: The Master Catalog
  services: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    defaultDuration: v.number(), // in minutes
    defaultPrice: v.number(),
    isActive: v.boolean(),
  }),

  // 2. BARBER CONTROLLED: Their specific menu
  barberServices: defineTable({
    barberId: v.id("users"),
    serviceId: v.id("services"),
    price: v.number(),
    duration: v.number(), // in minutes
    isActive: v.boolean(),
  })
    .index("by_barber", ["barberId"])
    .index("by_barber_and_service", ["barberId", "serviceId"]),

  // 3. BARBER CONTROLLED: Weekly work schedule (F3)
  barberSchedule: defineTable({
    barberId: v.id("users"),
    dayOfWeek: v.number(),              // 0=Sun, 1=Mon ... 6=Sat
    startMinute: v.number(),            // minutes from midnight (e.g. 480 = 8:00)
    endMinute: v.number(),              // minutes from midnight (e.g. 1080 = 18:00)
    baseSlotInterval: v.number(),       // seed interval in minutes (e.g. 40) — cosmetic only
    breakStartMinute: v.optional(v.number()), // Optional break start (e.g. 720 = 12:00)
    breakEndMinute: v.optional(v.number()),   // Optional break end   (e.g. 840 = 14:00)
  })
    .index("by_barber", ["barberId"])
    .index("by_barber_and_day", ["barberId", "dayOfWeek"]),

  // 4. BARBER CONTROLLED: Non-working time blocks (F3)
  barberBlocks: defineTable({
    barberId: v.id("users"),
    date: v.string(),                     // "YYYY-MM-DD"
    startMinute: v.optional(v.number()),  // undefined = full day block
    endMinute: v.optional(v.number()),
    reason: v.optional(v.string()),
  })
    .index("by_barber", ["barberId"])
    .index("by_barber_and_date", ["barberId", "date"]),

  // 5. Appointments / Turnos (F4)
  appointments: defineTable({
    barberId: v.id("users"),
    clientId: v.id("users"),
    serviceId: v.id("barberServices"),  // primary booked service
    date: v.string(),                   // "YYYY-MM-DD" for day-level indexing
    startTime: v.number(),              // UTC timestamp ms
    endTime: v.number(),                // UTC timestamp ms
    totalDuration: v.number(),          // minutes
    status: v.union(
      v.literal("scheduled"),
      v.literal("checked_in"),
      v.literal("cancelled"),
      v.literal("closed")
    ),
    checkInCode: v.optional(v.string()),
    checkedInAt: v.optional(v.number()),
    // Populated at close time
    extraServiceIds: v.optional(v.array(v.id("barberServices"))),
    finalPrice: v.optional(v.number()),
    // Cancellation / reschedule notes
    cancelReason: v.optional(v.string()),
    notificationSent: v.optional(v.boolean()),
  })
    .index("by_barber_and_date", ["barberId", "date"])
    .index("by_client", ["clientId"])
    .index("by_barber_and_status", ["barberId", "status"])
    .index("by_status_and_startTime", ["status", "startTime"])
    .index("by_status_and_notificationSent_and_startTime", ["status", "notificationSent", "startTime"])
    .index("by_checkInCode", ["checkInCode"]),

  // 6. Email notification log (F4)
  notifications: defineTable({
    appointmentId: v.id("appointments"),
    clientId: v.id("users"),
    type: v.union(v.literal("cancellation"), v.literal("reschedule"), v.literal("reminder")),
    sentAt: v.number(),           // UTC timestamp ms
    success: v.boolean(),
    error: v.optional(v.string()),
  })
    .index("by_appointment", ["appointmentId"]),

  // 7. Service ratings and monthly barber MVP history (F9)
  ratings: defineTable({
    appointmentId: v.id("appointments"),
    barberId: v.id("users"),
    clientId: v.id("users"),
    rating: v.number(), // 1..5 stars
    comment: v.optional(v.string()),
    month: v.string(), // "YYYY-MM", derived from the appointment date
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_appointment", ["appointmentId"])
    .index("by_client", ["clientId"])
    .index("by_barber", ["barberId"])
    .index("by_barber_and_month", ["barberId", "month"])
    .index("by_month", ["month"]),

  monthlyMvpAwards: defineTable({
    month: v.string(), // "YYYY-MM"
    barberId: v.id("users"),
    averageRating: v.number(),
    ratingCount: v.number(),
    awardedAt: v.number(),
  })
    .index("by_month", ["month"])
    .index("by_barber", ["barberId"])
    .index("by_barber_and_month", ["barberId", "month"]),

  pushSubscriptions: defineTable({
    clientId: v.id("users"),
    endpoint: v.string(),
    expirationTime: v.optional(v.union(v.number(), v.null())),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_endpoint", ["endpoint"]),
});
