import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import type { Id } from "@v1_peluqueria/backend/convex/_generated/dataModel";
import { Badge } from "@v1_peluqueria/ui/components/badge";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Card, CardContent } from "@v1_peluqueria/ui/components/card";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@v1_peluqueria/ui/components/sheet";
import { Skeleton } from "@v1_peluqueria/ui/components/skeleton";
import { Bell, CalendarClock, CalendarPlus, Scissors, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments")({
  component: AppointmentsRoute,
});

type PushStatus = "idle" | "unsupported" | "denied" | "enabled" | "local";

const REMINDER_LEAD_MS = 30 * 60 * 1000;
const LOCAL_REMINDER_HORIZON_MS = 24 * 60 * 60 * 1000;
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function toPushKey(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scheduleLocalReminders(appointments: any[] | undefined) {
  if (!appointments || typeof window === "undefined" || !("serviceWorker" in navigator)) return () => {};
  if (!("Notification" in window) || Notification.permission !== "granted") return () => {};

  const timers: number[] = [];
  const notified = new Set(JSON.parse(localStorage.getItem("notifiedAppointments") || "[]"));
  const now = Date.now();

  for (const appointment of appointments) {
    if (appointment.status !== "scheduled" || notified.has(appointment._id)) continue;

    const notifyAt = appointment.startTime - REMINDER_LEAD_MS;
    const delay = Math.max(5000, notifyAt - now);
    if (appointment.startTime <= now || delay > LOCAL_REMINDER_HORIZON_MS) continue;

    const timer = window.setTimeout(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Tu cita está cerca", {
        body: `${appointment.serviceName} con ${appointment.barberName} a las ${formatDateTime(appointment.startTime)}.`,
        icon: "/logo.jpg",
        badge: "/logo.jpg",
        tag: `appointment-${appointment._id}`,
        data: { url: "/appointments" },
      });
      notified.add(appointment._id);
      localStorage.setItem("notifiedAppointments", JSON.stringify([...notified]));
    }, delay);

    timers.push(timer);
  }

  return () => timers.forEach((timer) => window.clearTimeout(timer));
}

function AppointmentsRoute() {
  return (
    <>
      <Authenticated>
        <MyAppointments />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/" />
      </Unauthenticated>
    </>
  );
}

function MyAppointments() {
  const appointments = useQuery(api.appointments.myAppointments);
  const savePushSubscription = useMutation(api.notifications.savePushSubscription);
  const cancelAppointment = useMutation(api.appointments.cancelAppointment);
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [cancelId, setCancelId] = useState<Id<"appointments"> | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => scheduleLocalReminders(appointments), [appointments]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setPushStatus(vapidPublicKey ? "enabled" : "local");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    }
  }, []);

  const groupedAppointments = useMemo(() => {
    const now = Date.now();
    const list = appointments ?? [];
    return {
      upcoming: list.filter((app) => app.startTime >= now && app.status === "scheduled"),
      history: list.filter((app) => app.startTime < now || app.status !== "scheduled"),
    };
  }, [appointments]);

  const enableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      setPushStatus("unsupported");
      toast.error("Este navegador no soporta notificaciones PWA.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus(permission === "denied" ? "denied" : "idle");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    if (!vapidPublicKey || !("PushManager" in window)) {
      setPushStatus("local");
      toast.success("Recordatorios activados en este dispositivo.");
      return;
    }

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toPushKey(vapidPublicKey),
      }));

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
      throw new Error("No se pudo leer la suscripción push del navegador.");
    }

    await savePushSubscription({
      endpoint: subscriptionJson.endpoint,
      expirationTime: subscriptionJson.expirationTime,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      },
      userAgent: navigator.userAgent,
    });

    setPushStatus("enabled");
    toast.success("Notificaciones push activadas.");
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    if (!cancelReason.trim()) {
      toast.error("Indica el motivo de cancelación.");
      return;
    }

    try {
      await cancelAppointment({ appointmentId: cancelId, reason: cancelReason.trim() });
      toast.success("Cita cancelada.");
      setCancelId(null);
      setCancelReason("");
    } catch (error: any) {
      toast.error(error.message || "No se pudo cancelar la cita.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-10">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agenda del cliente</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Mis citas agendadas</h1>
        </div>
        <Button onClick={enableNotifications} variant={pushStatus === "enabled" || pushStatus === "local" ? "secondary" : "default"}>
          <Bell data-icon="inline-start" className="mr-2" />
          {pushStatus === "enabled" ? "Push activo" : pushStatus === "local" ? "Recordatorios activos" : "Activar recordatorios"}
        </Button>
      </header>

      {pushStatus === "unsupported" && (
        <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Este navegador no permite notificaciones PWA.
        </p>
      )}
      {pushStatus === "denied" && (
        <p className="mb-4 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Las notificaciones están bloqueadas. Habilítalas desde los permisos del navegador.
        </p>
      )}

      {appointments === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <CalendarPlus className="mb-3 size-9 text-muted-foreground" />
            <h2 className="text-base font-semibold">Aún no tienes citas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Agenda un servicio con uno de nuestros profesionales.</p>
            <Link
              to="/book"
              className="mt-5 inline-flex h-8 items-center justify-center bg-primary px-2.5 text-xs font-medium text-primary-foreground"
            >
              Agendar cita
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-7">
          <AppointmentSection title="Próximas" appointments={groupedAppointments.upcoming} onCancel={setCancelId} />
          <AppointmentSection title="Historial" appointments={groupedAppointments.history} onCancel={setCancelId} />
        </div>
      )}

      <Sheet open={!!cancelId} onOpenChange={(open) => { if (!open) { setCancelId(null); setCancelReason(""); } }}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-base font-semibold">Cancelar cita</SheetTitle>
            <SheetDescription>Se notificará al barbero y la cita quedará marcada como cancelada.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Ej. No podré asistir"
              />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              Confirmar cancelación
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function AppointmentSection({
  title,
  appointments,
  onCancel,
}: {
  title: string;
  appointments: any[];
  onCancel: (id: Id<"appointments">) => void;
}) {
  if (appointments.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment._id} appointment={appointment} onCancel={onCancel} />
        ))}
      </div>
    </section>
  );
}

function AppointmentCard({ appointment, onCancel }: { appointment: any; onCancel: (id: Id<"appointments">) => void }) {
  const statusLabel: Record<string, string> = {
    scheduled: "Agendada",
    cancelled: "Cancelada",
    closed: "Finalizada",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
                {statusLabel[appointment.status] ?? appointment.status}
              </Badge>
              <span className="text-sm font-medium text-foreground">{formatDateTime(appointment.startTime)}</span>
            </div>
            <div>
              <h3 className="truncate text-base font-semibold text-foreground">{appointment.serviceName}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Scissors className="size-4" />
                {appointment.barberName} · {appointment.totalDuration} min
              </p>
            </div>
            {appointment.status === "cancelled" && appointment.cancelReason && (
              <p className="text-sm text-muted-foreground">Motivo: {appointment.cancelReason}</p>
            )}
          </div>

          {appointment.status === "scheduled" && appointment.startTime > Date.now() && (
            <Button size="icon" variant="outline" aria-label="Cancelar cita" onClick={() => onCancel(appointment._id)}>
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <CalendarClock className="size-4" />
          Recibirás un recordatorio cerca de la hora si activaste notificaciones.
        </div>
      </CardContent>
    </Card>
  );
}
