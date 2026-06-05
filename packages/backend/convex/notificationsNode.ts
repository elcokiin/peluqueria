"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import webpush from "web-push";

/**
 * Send an email notification using Resend.
 * Relies on RESEND_API_KEY and optionally RESEND_FROM_EMAIL.
 */
export const sendEmail = internalAction({
    args: {
        appointmentId: v.id("appointments"),
        type: v.union(v.literal("cancellation"), v.literal("reschedule")),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const env = (globalThis as any).process?.env ?? {};

        const app = await ctx.runQuery(internal.notifications.internalGetApptContext, {
            appointmentId: args.appointmentId,
        });

        if (!app) {
            console.error("Could not load appointment context for notification");
            return;
        }

        if (!app.clientEmail) {
            await ctx.runMutation(internal.notifications.internalLogNotification, {
                appointmentId: args.appointmentId,
                clientId: app.clientId,
                type: args.type,
                success: false,
                error: "Client email is missing",
                sentAt: Date.now(),
            });
            return;
        }

        if (!env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not defined. Skipping email notification.");
            await ctx.runMutation(internal.notifications.internalLogNotification, {
                appointmentId: args.appointmentId,
                clientId: app.clientId,
                type: args.type,
                success: false,
                error: "RESEND_API_KEY is not configured",
                sentAt: Date.now(),
            });
            return;
        }

        const resend = new Resend(env.RESEND_API_KEY);

        let subject = "";
        let html = "";
        const appDateStr = new Date(app.startTime).toLocaleString("es-CO", { timeZone: "America/Bogota" });

        if (args.type === "cancellation") {
            subject = `Tu turno ha sido cancelado - ${app.barberName ?? "Barber"}`;
            html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Hola ${app.clientName ?? "cliente"},</h2>
          <p>Te informamos que tu cita con <strong>${app.barberName ?? "tu barbero"}</strong> programada para el <strong>${appDateStr}</strong> ha sido cancelada.</p>
          ${args.reason ? `<p><strong>Motivo:</strong> ${args.reason}</p>` : ""}
          <br/>
          <p>Lamentamos los inconvenientes.</p>
        </div>
      `;
        } else {
            subject = `Tu turno ha sido reprogramado - ${app.barberName ?? "Barber"}`;
            html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Hola ${app.clientName ?? "cliente"},</h2>
          <p>Tu cita con <strong>${app.barberName ?? "tu barbero"}</strong> ha sido reprogramada.</p>
          <p>Nueva fecha y hora: <strong>${appDateStr}</strong>.</p>
          <br/>
          <p>Te esperamos.</p>
        </div>
      `;
        }

        try {
            await resend.emails.send({
                from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                to: app.clientEmail,
                subject,
                html,
            });

            await ctx.runMutation(internal.notifications.internalLogNotification, {
                appointmentId: args.appointmentId,
                clientId: app.clientId,
                type: args.type,
                success: true,
                sentAt: Date.now(),
            });
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error";
            console.error("Resend error:", e);

            await ctx.runMutation(internal.notifications.internalLogNotification, {
                appointmentId: args.appointmentId,
                clientId: app.clientId,
                type: args.type,
                success: false,
                error: errorMessage,
                sentAt: Date.now(),
            });
        }
    },
});

export const sendDuePushReminders = internalAction({
    args: {},
    handler: async (ctx) => {
        const env = (globalThis as any).process?.env ?? {};

        if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
            console.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are not configured. Skipping push reminders.");
            return null;
        }

        webpush.setVapidDetails(
            env.VAPID_SUBJECT || "mailto:admin@barberstudio.local",
            env.VAPID_PUBLIC_KEY,
            env.VAPID_PRIVATE_KEY
        );

        const now = Date.now();
        const dueAppointments = await ctx.runQuery(internal.notifications.internalListDueReminderAppointments, {
            now,
            windowEnd: now + 30 * 60 * 1000,
            limit: 25,
        });

        for (const app of dueAppointments) {
            const subscriptions = await ctx.runQuery(internal.notifications.internalListSubscriptionsForClient, {
                clientId: app.clientId,
            });

            if (subscriptions.length === 0) {
                await ctx.runMutation(internal.notifications.internalMarkReminderSent, {
                    appointmentId: app.appointmentId,
                    success: false,
                    error: "Client has no push subscriptions",
                });
                continue;
            }

            const appDate = new Date(app.startTime).toLocaleString("es-CO", {
                timeZone: "America/Bogota",
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
            });

            const payload = JSON.stringify({
                title: "Tu cita está cerca",
                body: `${app.serviceName} con ${app.barberName} a las ${appDate}.`,
                url: "/appointments",
                tag: `appointment-${app.appointmentId}`,
            });

            let sent = false;
            let lastError: string | undefined;

            for (const subscription of subscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            expirationTime: subscription.expirationTime ?? null,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                        },
                        payload
                    );
                    sent = true;
                } catch (error: unknown) {
                    lastError = error instanceof Error ? error.message : "Unknown push error";
                    console.error("Push reminder error:", error);
                }
            }

            await ctx.runMutation(internal.notifications.internalMarkReminderSent, {
                appointmentId: app.appointmentId,
                success: sent,
                error: sent ? undefined : lastError ?? "Push delivery failed",
            });
        }

        return null;
    },
});
