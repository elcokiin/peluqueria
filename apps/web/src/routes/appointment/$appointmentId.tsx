import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import type { Id } from "@v1_peluqueria/backend/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CalendarCheck, Clock, QrCode } from "lucide-react";

import { Badge } from "@v1_peluqueria/ui/components/badge";
import { Button } from "@v1_peluqueria/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@v1_peluqueria/ui/components/card";
import { Skeleton } from "@v1_peluqueria/ui/components/skeleton";

export const Route = createFileRoute("/appointment/$appointmentId")({
  component: AppointmentConfirmationRoute,
});

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("es-CL").format(value)}`;
}

function buildCheckInPayload(checkInCode: string) {
  if (typeof window === "undefined") return checkInCode;
  const url = new URL("/check-in", window.location.origin);
  url.searchParams.set("code", checkInCode);
  return url.toString();
}

function AppointmentConfirmation() {
  const { appointmentId } = Route.useParams();
  const appointment = useQuery(api.appointments.getAppointmentConfirmation, {
    appointmentId: appointmentId as Id<"appointments">,
  });
  const [qrDataUrl, setQrDataUrl] = useState("");

  const checkInPayload = useMemo(
    () => (appointment?.checkInCode ? buildCheckInPayload(appointment.checkInCode) : ""),
    [appointment],
  );

  useEffect(() => {
    let isMounted = true;
    if (!checkInPayload) return;

    QRCode.toDataURL(checkInPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (isMounted) setQrDataUrl(dataUrl);
    });

    return () => {
      isMounted = false;
    };
  }, [checkInPayload]);

  if (appointment === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Cita no encontrada</h1>
        <Button render={<Link to="/" />} className="mt-6">
          Volver al inicio
        </Button>
      </div>
    );
  }

  const appointmentTime = new Date(appointment.startTime).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 pb-28">
      <div>
        <Badge variant="secondary" className="mb-3">
          Reserva confirmada
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">Tu código de check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Muéstrale este QR al barbero cuando llegues.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode data-icon="inline-start" />
            QR de la cita
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex aspect-square w-full max-w-[260px] items-center justify-center rounded-lg border bg-white p-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Código QR para check-in de la cita" className="size-full object-contain" />
            ) : !appointment.checkInCode ? (
              <p className="px-4 text-center text-sm text-muted-foreground">
                Esta cita fue creada antes de activar check-in por QR.
              </p>
            ) : (
              <Skeleton className="size-full rounded-md" />
            )}
          </div>
          {appointment.checkInCode && (
            <div className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-center font-mono text-xs break-all">
              {appointment.checkInCode}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Barbero</span>
            <span className="text-right font-medium">{appointment.barberName}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Servicio</span>
            <span className="text-right font-medium">{appointment.serviceName}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck data-icon="inline-start" />
              Fecha
            </span>
            <span className="font-medium">{appointment.date}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock data-icon="inline-start" />
              Hora
            </span>
            <span className="font-medium">{appointmentTime}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(appointment.servicePrice)}</span>
          </div>
        </CardContent>
      </Card>

      <Button render={<Link to="/" />} variant="outline">
        Volver al inicio
      </Button>
    </div>
  );
}

function AppointmentConfirmationRoute() {
  return (
    <>
      <Authenticated>
        <AppointmentConfirmation />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/" />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      </AuthLoading>
    </>
  );
}
