import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { Camera, Facebook, Instagram, Plus, ScanLine, X } from "lucide-react";
import { toast } from "sonner";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOfflineQueryCache } from "@/hooks/use-offline-query-cache";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@v1_peluqueria/ui/components/accordion";
import { Card, CardContent } from "@v1_peluqueria/ui/components/card";
import { Badge } from "@v1_peluqueria/ui/components/badge";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Skeleton } from "@v1_peluqueria/ui/components/skeleton";
import { DatePicker } from "@v1_peluqueria/ui/components/date-picker";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@v1_peluqueria/ui/components/sheet";

import avatar1 from '../../assets/avatars/apple-avatar-1.jpeg';
import avatar2 from '../../assets/avatars/apple-avatar-2.jpeg';
import avatar3 from '../../assets/avatars/apple-avatar-3.jpeg';

import LocationMap from "../components/location-map";

const AVATARS = [avatar1, avatar2, avatar3];

function extractCheckInCode(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const parsedUrl = new URL(value);
    const code = parsedUrl.searchParams.get("code");
    if (code) return code.trim();
  } catch {
    // Not a URL; continue parsing supported raw formats.
  }

  if (value.startsWith("barberstudio-checkin:")) {
    return value.replace("barberstudio-checkin:", "").trim();
  }

  try {
    const parsedJson = JSON.parse(value) as { checkInCode?: unknown };
    if (typeof parsedJson.checkInCode === "string") return parsedJson.checkInCode.trim();
  } catch {
    // Plain code fallback below.
  }

  return value;
}

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const selectedBarberId: string | null = null;

  const barbers = useQuery(api.users.getPublicBarbers);

  const servicesQueryData = useQuery(api.barberServices.getMyServices,
    selectedBarberId ? { barberId: selectedBarberId as any } : {}
  );

  const globalServices = useQuery(api.barberServices.getAvailableGlobalServices);

  const services = selectedBarberId ? servicesQueryData : (globalServices?.map((s: any) => ({ ...s, serviceId: s._id, price: s.defaultPrice, duration: s.defaultDuration })) || undefined);

  // Dynamically group services
  const groupedServices: Record<string, any[]> = {
    "Barbas": [],
    "Cortes de Cabello": [],
    "Otros Servicios": []
  };

  if (services) {
    services.forEach((s: any) => {
      const name = (s.name || "").toLowerCase();
      if (name.includes("barba") || name.includes("afeitado") || name.includes("ras")) {
        groupedServices["Barbas"].push(s);
      } else if (name.includes("corte") || name.includes("fade") || name.includes("cabello")) {
        groupedServices["Cortes de Cabello"].push(s);
      } else {
        groupedServices["Otros Servicios"].push(s);
      }
    });
  }

  const activeCategories = Object.entries(groupedServices).filter(([_, items]) => items.length > 0);

  return (
    <div className="flex h-full w-full justify-center bg-background font-sans text-foreground pt-2 pb-6">
      <div className="w-full max-w-md bg-background h-full">
        {/* Banner Hero */}
        <div className="p-4 pt-6">
          <Card className="relative w-full h-[220px] rounded-[1.25rem] overflow-hidden shadow-sm border-0">
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
              alt="Barber banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Barber info overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex w-full flex-col justify-end text-white">
              <h1 className="text-xl font-bold leading-none tracking-tight">Kawz Barber Studio</h1>
              <p className="mt-1 text-[13px] text-white/80 shrink-0">Admin: Brandon Molano</p>
              
              <div className="mt-2.5 flex items-center gap-4">
                <a href="https://instagram.com/kawz_barberstudio" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-medium text-white transition-colors hover:text-white/80">
                  <Instagram className="size-4" />
                  @kawz_barberstudio
                </a>
                <a href="https://facebook.com/search/top?q=BarberStudio%20BrandonMolano" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-medium text-white transition-colors hover:text-white/80">
                  <Facebook className="size-4" />
                  BarberStudio
                </a>
              </div>
            </div>

            {/* Barber logo */}
            <Card className="absolute left-4 top-4 flex size-20 items-center justify-center overflow-hidden rounded-2xl border-0 bg-transparent shadow-md">
              <div className="flex size-full items-center justify-center overflow-hidden rounded-xl bg-black">
                <img 
                  src="/logo.jpg" 
                  alt="Kawz Logo" 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const span = e.currentTarget.nextElementSibling as HTMLElement;
                    if (span) span.style.display = 'block';
                  }}
                />
                <span style={{ display: 'none' }} className="text-center text-[10px] font-bold leading-tight tracking-tighter text-white">
                  KAWZ<br />BARBER<br/>STUDIO
                </span>
              </div>
            </Card>
          </Card>
        </div>

        {/* Barber Selection */}
        <div className="mt-4 px-4">
          <h2 className="mb-4 px-1 text-[14px] font-medium text-foreground">
            ¿Quieres agendar con un profesional en particular?
          </h2>
          {barbers === undefined ? (
            <div className="flex gap-4"><Skeleton className="size-16 rounded-full" /><Skeleton className="size-16 rounded-full" /></div>
          ) : barbers.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No hay profesionales disponibles actualmente
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
              {barbers.map((b: any, index: number) => {
                return (
                  <button
                    key={b._id}
                    onClick={() => navigate({ to: '/book/$barberId', params: { barberId: b._id } })}
                    className={`group flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all snap-start min-w-[100px] sm:min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/20`}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden transition-all">
                      <img 
                        src={AVATARS[index % AVATARS.length]} 
                        alt={b.name}
                        className="w-full h-full object-cover transition-opacity opacity-80 group-hover:opacity-100"
                      />
                    </div>
                    <span className="text-sm font-medium text-center line-clamp-1 text-foreground">
                      {b.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Catalog */}
        <div className="mt-4 px-4 pb-8">
          <h2 className="mb-4 px-1 text-[14px] font-medium text-slate-800 dark:text-foreground">
            {selectedBarberId ? "Servicios ofrecidos por este profesional" : "Selecciona los servicios que deseas agendar"}
          </h2>

          <div className="flex flex-col gap-3">
            {services === undefined ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : activeCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay servicios disponibles en este momento.</p>
            ) : (
              <Accordion multiple defaultValue={["Barbas"]} className="flex w-full flex-col gap-4">
                {activeCategories.map(([category, items]) => (
                  <AccordionItem value={category} key={category} className="overflow-hidden rounded-[0.8rem] border border-border bg-card shadow-sm px-0">
                    <AccordionTrigger className="border-none px-4 py-4 text-[15px] font-semibold hover:bg-muted/50 hover:no-underline">
                      {category}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 border-t border-border bg-background px-4 pb-4 pt-4">
                      {items.map((service: any, idx: number) => (
                        <Card key={`${service.serviceId}-${idx}`} className="relative overflow-hidden rounded-[0.8rem] border-border p-0 shadow-none">
                          <Badge variant="secondary" className="absolute left-0 top-0 rounded-none rounded-br-[0.8rem] bg-emerald-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-emerald-700">
                            Descuento pagando en línea
                          </Badge>

                          <CardContent className="p-4 pt-10">
                            <h3 className="mt-1 text-[16px] font-semibold text-foreground">
                              {service.name}
                            </h3>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">{service.duration} min</p>

                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-[16px] font-bold text-foreground">${(service.price ?? 0).toLocaleString("es-CL")}</span>
                              <span className="text-[13px] line-through text-muted-foreground">Normal: ${((service.price ?? 0) * 1.2).toLocaleString("es-CL")}</span>
                            </div>

                            <p className="mt-2 text-[13px] italic text-muted-foreground">{service.description || "Servicio profesional."}</p>

                            <Button onClick={() => toast.success(`Se ha agregado ${service.name}`, { description: 'Puedes proceder al pago de tu cita.' })} className="mt-5 w-full rounded-lg font-medium">
                              <Plus data-icon="inline-start" className="mr-2" />
                              Agregar servicio
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <LocationMap />
        </div>
      </div>
    </div>
  );
}

function CheckInScanner({
  onCheckIn,
  isCheckingIn,
}: {
  onCheckIn: (rawCode: string) => Promise<void>;
  isCheckingIn: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function startScanner() {
      setCameraError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La cámara no está disponible en este navegador.");
        return;
      }
      if (!videoRef.current) return;

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result) => {
            if (!result) return;
            controlsRef.current?.stop();
            controlsRef.current = null;
            setIsOpen(false);
            await onCheckIn(result.getText());
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (error) {
        console.error(error);
        setCameraError("No se pudo iniciar la cámara. Revisa permisos o usa el código manual.");
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [isOpen, onCheckIn]);

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Ingresa o escanea un código QR.");
      return;
    }
    await onCheckIn(manualCode);
    setManualCode("");
    setIsOpen(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Check-in por QR</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Escanea el código de confirmación del cliente al llegar.
            </p>
          </div>
          <Button
            type="button"
            variant={isOpen ? "outline" : "default"}
            size="sm"
            onClick={() => setIsOpen((open) => !open)}
            disabled={isCheckingIn}
            className="shrink-0"
          >
            {isOpen ? <X data-icon="inline-start" /> : <Camera data-icon="inline-start" />}
            {isOpen ? "Cerrar" : "Escanear"}
          </Button>
        </div>

        {isOpen && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              <video ref={videoRef} className="size-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="size-40 rounded-lg border-2 border-primary/80 shadow-[0_0_0_999px_rgb(0_0_0/0.35)]" />
              </div>
            </div>
            {cameraError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {cameraError}
              </p>
            )}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="Pegar código QR"
                className="h-9 text-sm"
                disabled={isCheckingIn}
              />
              <Button type="submit" size="sm" disabled={isCheckingIn}>
                <ScanLine data-icon="inline-start" />
                Validar
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarberAppointmentsView() {
  const isOnline = useNetworkStatus();
  const now = new Date();
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(now);
  
  const dateStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, "0")}-${String(selectedDateObj.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(dateStr);
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDateObj(date);
      setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
    }
  };

  const liveAppointments = useQuery(api.appointments.listAppointments, { date: selectedDate });
  const cachedAppointments = useOfflineQueryCache(`barber-appointments:${selectedDate}`, liveAppointments);
  const appointments = liveAppointments ?? cachedAppointments?.data;
  const isUsingCachedAppointments = liveAppointments === undefined && cachedAppointments !== null;
  const cancelAppt = useMutation(api.appointments.cancelAppointment);
  const closeAppt = useMutation(api.appointments.closeAppointment);
  const checkInByCode = useMutation(api.appointments.checkInByCode);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleCancel = async () => {
    if (!cancelId) return;
    if (!isOnline) { toast.error("Sin conexión. La cancelación se sincroniza cuando recuperes internet."); return; }
    if (!cancelReason.trim()) { toast.error("El motivo de cancelación es obligatorio."); return; }
    try {
      await cancelAppt({ appointmentId: cancelId as any, reason: cancelReason });
      toast.success("Cita cancelada. Se notificará al cliente.");
      setCancelId(null); setCancelReason("");
    } catch {
      toast.error("No se pudo cancelar la cita.");
    }
  };

  const handleClose = async (id: string) => {
    if (!isOnline) { toast.error("Sin conexión. La finalización se sincroniza cuando recuperes internet."); return; }
    try {
      await closeAppt({ appointmentId: id as any, extraServiceIds: [] });
      toast.success("Cita marcada como finalizada.");
    } catch {
      toast.error("No se pudo finalizar la cita.");
    }
  };

  const handleCheckIn = useCallback(async (rawCode: string) => {
    if (!isOnline) {
      toast.error("Sin conexión. El check-in se habilita al recuperar internet.");
      return;
    }

    const checkInCode = extractCheckInCode(rawCode);
    if (!checkInCode) {
      toast.error("El QR no contiene un código de check-in válido.");
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await checkInByCode({ checkInCode });
      toast.success(`Check-in registrado para ${result.clientName}`, {
        description: `${result.serviceName} · ${new Date(result.startTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`,
      });
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar el check-in.");
    } finally {
      setIsCheckingIn(false);
    }
  }, [checkInByCode, isOnline]);

  const statusBadge: Record<string, string> = {
    scheduled: "bg-blue-500/15 text-blue-500",
    checked_in: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    cancelled: "bg-red-500/15 text-red-500",
    closed: "bg-emerald-500/15 text-emerald-500",
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada",
    checked_in: "Check-in",
    cancelled: "Cancelada",
    closed: "Finalizada",
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground mb-0">Citas</p>
        <DatePicker value={selectedDateObj} onChange={handleDateChange} className="h-8 w-[150px] text-xs" />
      </div>

      <CheckInScanner onCheckIn={handleCheckIn} isCheckingIn={isCheckingIn || !isOnline} />

      {(!isOnline || isUsingCachedAppointments) && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-[12px] text-muted-foreground">
          <span className="font-medium text-amber-600 dark:text-amber-400">Modo offline.</span>{" "}
          Mostrando la última agenda guardada
          {cachedAppointments ? ` (${new Date(cachedAppointments.savedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })})` : ""}.
          Los cambios se habilitan al recuperar conectividad.
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {appointments === undefined ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : (appointments as any[]).length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground border-dashed">
              Sin citas para este día.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {(appointments as any[]).map((app) => (
                <div
                  key={app._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-opacity ${app.status === "cancelled" || app.status === "closed" ? "opacity-50" : "hover:bg-muted/20"}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold tabular-nums">
                        {new Date(app.startTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full tracking-wider ${statusBadge[app.status] ?? ""}`}>
                        {statusLabel[app.status] ?? app.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      {app.clientName} &middot; {app.serviceName} &middot; {app.totalDuration} min
                    </p>
                  </div>

                  {(app.status === "scheduled" || app.status === "checked_in") && (
                    <div className="flex gap-2 shrink-0">
                      {app.status === "checked_in" && (
                        <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => handleClose(app._id)} disabled={!isOnline}>
                          Finalizar
                        </Button>
                      )}
                      {app.status === "scheduled" && (
                        <Button variant="destructive" size="sm" className="h-8 text-[12px]" onClick={() => setCancelId(app._id)} disabled={!isOnline}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!cancelId} onOpenChange={(o) => { if (!o) { setCancelId(null); setCancelReason(""); } }}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-5 text-left px-1">
            <SheetTitle className="text-base font-semibold">Cancelar Cita</SheetTitle>
            <SheetDescription className="text-[12px]">Se enviará un correo al cliente con el motivo indicado.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Motivo (obligatorio)
              </Label>
              <Input
                placeholder="Ej. Emergencia personal, cierre inesperado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="h-11 text-sm"
              />
            </div>
            <Button variant="destructive" className="w-full h-11 text-sm font-medium" onClick={handleCancel} disabled={!isOnline}>
              Confirmar cancelación
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RouteComponent() {
  const isOnline = useNetworkStatus();
  const profile = useQuery(api.users.currentProfile);
  const cachedProfile = useOfflineQueryCache("current-profile", profile);
  const effectiveProfile = profile === undefined ? cachedProfile?.data : profile;
  const activeRole = effectiveProfile?.activeRole;

  const showLanding = !activeRole || activeRole === "user";

  if (profile === undefined && !effectiveProfile && isOnline) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (profile === undefined && !effectiveProfile && !isOnline) {
    return (
      <div className="flex h-screen items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Sin conexión. Abre la agenda una vez con internet para guardarla en este dispositivo.
      </div>
    );
  }

  return (
    showLanding ? (
      <HomeComponent />
    ) : (
      <div className="max-w-xl mx-auto pb-28">
        <BarberAppointmentsView />
      </div>
    )
  );
}
