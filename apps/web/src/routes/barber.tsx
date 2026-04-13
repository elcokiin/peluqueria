import { createFileRoute, Navigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@v1_peluqueria/ui/components/button";
import { Switch } from "@v1_peluqueria/ui/components/switch";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import { DatePicker } from "@v1_peluqueria/ui/components/date-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@v1_peluqueria/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@v1_peluqueria/ui/components/select";
import {
  Card,
  CardContent,
} from "@v1_peluqueria/ui/components/card";

export const Route = createFileRoute("/barber")({
  component: RouteComponent,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minsToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ─── Shared styles ─────────────────────────────────────────────────────────────
const sectionTitle = "text-[13px] font-semibold uppercase tracking-widest text-muted-foreground mb-3";
const rowItem = "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors";

// ─── Services Tab ─────────────────────────────────────────────────────────────
function BarberServicesTab() {
  const myServices = useQuery(api.barberServices.getMyServices, {});
  const globalServices = useQuery(api.barberServices.getAvailableGlobalServices);
  const toggleStatus = useMutation(api.barberServices.toggleServiceStatus);
  const upsertService = useMutation(api.barberServices.upsertBarberService);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  if (myServices === undefined || globalServices === undefined) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Cargando servicios...</div>;
  }

  const handleServiceSelect = (id: string | null) => {
    if (!id) {
      setSelectedServiceId("");
      setPrice("");
      setDuration("");
      return;
    }

    setSelectedServiceId(id);
    const service = globalServices.find((s) => s._id === id);
    if (service) {
      setPrice(new Intl.NumberFormat("es-CL").format(service.defaultPrice));
      setDuration(service.defaultDuration.toString());
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "");
    if (!/^\d*$/.test(raw)) return;
    setPrice(raw ? new Intl.NumberFormat("es-CL").format(parseInt(raw, 10)) : "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) { toast.error("Selecciona un servicio de la lista."); return; }
    if (!price) { toast.error("Ingresa el precio del servicio."); return; }
    if (!duration || Number(duration) < 5) { toast.error("La duración mínima es 5 minutos."); return; }

    try {
      await upsertService({
        serviceId: selectedServiceId as any,
        price: Number(price.replace(/\./g, "")),
        duration: Number(duration),
        isActive: true,
      });
      toast.success("Servicio guardado correctamente.");
      setIsOpen(false);
      setSelectedServiceId(""); setPrice(""); setDuration("");
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    }
  };

  const handleToggle = async (id: any, checked: boolean) => {
    try {
      await toggleStatus({ barberServiceId: id, isActive: checked });
      toast.success(checked ? "Servicio activado." : "Servicio pausado.");
    } catch {
      toast.error("No se pudo cambiar el estado del servicio.");
    }
  };

  return (
    <div className="space-y-4">
      <p className={sectionTitle}>Mis Servicios</p>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {myServices.length === 0 ? (
            <div className="py-14 text-center text-[13px] text-muted-foreground border-b border-dashed">
              No has agregado ningún servicio todavía.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {myServices.map((svc) => (
                <div key={svc._id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!svc.isActive ? "text-muted-foreground line-through" : ""}`}>
                        {svc.name}
                      </span>
                      {!svc.isActive && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium tracking-wide">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {svc.duration} min &nbsp;&middot;&nbsp;
                      <span className="font-semibold text-emerald-500">${new Intl.NumberFormat("es-CL").format(svc.price)}</span>
                    </p>
                  </div>
                  <Switch
                    checked={svc.isActive}
                    onCheckedChange={(c) => handleToggle(svc._id, c)}
                    className="data-[state=checked]:bg-primary shrink-0"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-border/40">
            <Button className="w-full h-10 text-sm font-medium" onClick={() => setIsOpen(true)}>
              Agregar servicio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-5 text-left px-1">
            <SheetTitle className="text-base font-semibold">Agregar Servicio</SheetTitle>
            <SheetDescription className="text-[12px]">Selecciona del catálogo y personaliza precio y duración.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 px-1">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Servicio</Label>
              <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                <SelectTrigger className="h-11 text-sm">
                  <SelectValue placeholder="Selecciona un servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {globalServices.map((gs) => (
                    <SelectItem key={gs._id} value={gs._id} className="text-sm">{gs.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedServiceId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Precio</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input type="text" inputMode="numeric" value={price} onChange={handlePriceChange} className="pl-7 h-11 text-sm" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Minutos</Label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-11 text-sm" required min="5" step="5" />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full h-11 text-sm font-medium mt-2" disabled={!selectedServiceId || !price || !duration}>
              Guardar
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}


// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function BarberScheduleTab() {
  const schedule = useQuery(api.schedule.getMySchedule) || [];
  const upsertDay = useMutation(api.schedule.upsertScheduleDay);
  const deleteDay = useMutation(api.schedule.deleteScheduleDay);

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startClock, setStartClock] = useState("08:00");
  const [endClock, setEndClock] = useState("18:00");
  const [breakStartClock, setBreakStartClock] = useState("");
  const [breakEndClock, setBreakEndClock] = useState("");

  const [globalBreakStart, setGlobalBreakStart] = useState("12:00");
  const [globalBreakEnd, setGlobalBreakEnd] = useState("14:00");

  const handleToggle = async (dayOfWeek: number, isActive: boolean) => {
    try {
      if (isActive) {
        await upsertDay({ dayOfWeek, startMinute: 480, endMinute: 1080, baseSlotInterval: 30 });
        toast.success(`${DAY_NAMES[dayOfWeek]} habilitado.`);
      } else {
        await deleteDay({ dayOfWeek });
        toast.success(`${DAY_NAMES[dayOfWeek]} marcado como no laborable.`);
      }
    } catch {
      toast.error("No se pudo actualizar el horario.");
    }
  };

  const saveConfig = async () => {
    if (editingDay === null) return;
    const startMins = timeToMins(startClock);
    const endMins = timeToMins(endClock);

    if (startMins >= endMins) {
      toast.error("La apertura debe ser menor que el cierre.");
      return;
    }

    let breakStartMins: number | undefined;
    let breakEndMins: number | undefined;

    if (breakStartClock && breakEndClock) {
      breakStartMins = timeToMins(breakStartClock);
      breakEndMins = timeToMins(breakEndClock);
      if (breakStartMins >= breakEndMins) {
        toast.error("El inicio del receso debe ser anterior al fin.");
        return;
      }
      if (breakStartMins <= startMins || breakEndMins >= endMins) {
        toast.error("El receso debe estar dentro del horario laboral.");
        return;
      }
    } else if (breakStartClock || breakEndClock) {
      toast.error("Debes completar tanto el inicio como el fin del receso.");
      return;
    }

    try {
      await upsertDay({
        dayOfWeek: editingDay,
        startMinute: startMins,
        endMinute: endMins,
        baseSlotInterval: 30,
        breakStartMinute: breakStartMins,
        breakEndMinute: breakEndMins,
      });
      toast.success(`Horario del ${DAY_NAMES[editingDay]} guardado.`);
      setEditingDay(null);
    } catch {
      toast.error("Error al guardar el horario.");
    }
  };

  const removeBreak = async () => {
    if (editingDay === null) return;
    const config = (schedule as any[]).find((s) => s.dayOfWeek === editingDay);
    if (!config) return;
    try {
      await upsertDay({
        dayOfWeek: editingDay,
        startMinute: config.startMinute,
        endMinute: config.endMinute,
        baseSlotInterval: config.baseSlotInterval ?? 30,
        breakStartMinute: undefined,
        breakEndMinute: undefined,
      });
      toast.success("Receso eliminado.");
      setBreakStartClock(""); setBreakEndClock("");
      setEditingDay(null);
    } catch {
      toast.error("No se pudo eliminar el receso.");
    }
  };

  const applyGlobalBreak = async () => {
    const active = (schedule as any[]);
    if (active.length === 0) { toast.warning("No tienes días laborables activos."); return; }
    if (!globalBreakStart || !globalBreakEnd) { toast.error("Define el inicio y fin del receso global."); return; }

    const bStart = timeToMins(globalBreakStart);
    const bEnd = timeToMins(globalBreakEnd);
    if (bStart >= bEnd) { toast.error("El inicio del receso debe ser anterior al fin."); return; }

    let applied = 0; let skipped = 0;
    for (const s of active) {
      if (bStart <= s.startMinute || bEnd >= s.endMinute) { skipped++; continue; }
      try {
        await upsertDay({ dayOfWeek: s.dayOfWeek, startMinute: s.startMinute, endMinute: s.endMinute, baseSlotInterval: s.baseSlotInterval ?? 30, breakStartMinute: bStart, breakEndMinute: bEnd });
        applied++;
      } catch { skipped++; }
    }

    if (applied > 0 && skipped === 0) toast.success(`Receso aplicado a ${applied} día(s).`);
    else if (applied > 0) toast.warning(`Aplicado a ${applied} día(s). ${skipped} omitido(s) por conflicto.`);
    else toast.error("Ningún día compatible con ese horario de receso.");
  };

  const currentDayHasBreak = editingDay !== null && (schedule as any[]).find((s) => s.dayOfWeek === editingDay)?.breakStartMinute !== undefined;

  return (
    <div className="space-y-4">
      <p className={sectionTitle}>Horario Semanal</p>

      {/* Day list */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {DAY_NAMES.map((dayName, idx) => {
              const config = (schedule as any[]).find((s) => s.dayOfWeek === idx);
              return (
                <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <Switch
                    checked={!!config}
                    onCheckedChange={(c) => handleToggle(idx, c)}
                    className="data-[state=checked]:bg-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{dayName}</p>
                    {config ? (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {minsToTime(config.startMinute)}&ndash;{minsToTime(config.endMinute)}
                        {config.breakStartMinute !== undefined && (
                          <span className="ml-2 text-amber-500">
                            Receso {minsToTime(config.breakStartMinute)}&ndash;{minsToTime(config.breakEndMinute)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-[12px] text-muted-foreground mt-0.5">No laborable</p>
                    )}
                  </div>
                  {config && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[12px] h-8 px-3 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => {
                        setEditingDay(idx);
                        setStartClock(minsToTime(config.startMinute));
                        setEndClock(minsToTime(config.endMinute));
                        setBreakStartClock(config.breakStartMinute !== undefined ? minsToTime(config.breakStartMinute) : "");
                        setBreakEndClock(config.breakEndMinute !== undefined ? minsToTime(config.breakEndMinute) : "");
                      }}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Global lunch block */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">Receso general de almuerzo</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Se aplicará a todos los días activos de forma masiva.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Inicio</Label>
            <Input type="time" value={globalBreakStart} onChange={(e) => setGlobalBreakStart(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Fin</Label>
            <Input type="time" value={globalBreakEnd} onChange={(e) => setGlobalBreakEnd(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-[12px] border-amber-400/40 hover:bg-amber-500/10" onClick={applyGlobalBreak}>
          Aplicar a todos los días activos
        </Button>
      </div>

      {/* Per-day editor */}
      <Sheet open={editingDay !== null} onOpenChange={(o) => { if (!o) setEditingDay(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="mb-5 text-left px-1">
            <SheetTitle className="text-base font-semibold">
              {editingDay !== null ? DAY_NAMES[editingDay] : ""}
            </SheetTitle>
            <SheetDescription className="text-[12px]">Configura el turno y el receso específico de este día.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-1">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Horario de trabajo</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Apertura</span>
                  <Input type="time" value={startClock} onChange={(e) => setStartClock(e.target.value)} className="h-11 text-sm" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Cierre</span>
                  <Input type="time" value={endClock} onChange={(e) => setEndClock(e.target.value)} className="h-11 text-sm" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Receso</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Deja vacío para no tener receso este día.</p>
                </div>
                {currentDayHasBreak && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-7 text-destructive hover:bg-destructive/10"
                    onClick={removeBreak}
                  >
                    Eliminar receso
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Inicio</span>
                  <Input type="time" value={breakStartClock} onChange={(e) => setBreakStartClock(e.target.value)} className="h-11 text-sm" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Fin</span>
                  <Input type="time" value={breakEndClock} onChange={(e) => setBreakEndClock(e.target.value)} className="h-11 text-sm" />
                </div>
              </div>
            </div>

            <Button className="w-full h-11 text-sm font-medium" onClick={saveConfig}>
              Guardar horario
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


// ─── Blocks Tab ───────────────────────────────────────────────────────────────
function BarberBlocksTab() {
  const blocks = useQuery(api.blocks.getMyBlocks, {}) || [];
  const addBlock = useMutation(api.blocks.createBlock);
  const deleteBlock = useMutation(api.blocks.deleteBlock);

  const [selectedBlockDate, setSelectedBlockDate] = useState<Date | undefined>(undefined);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const dateStr = selectedBlockDate
    ? `${selectedBlockDate.getFullYear()}-${String(selectedBlockDate.getMonth() + 1).padStart(2, "0")}-${String(selectedBlockDate.getDate()).padStart(2, "0")}`
    : "";

  const handleAdd = async () => {
    if (!dateStr) { toast.error("Selecciona una fecha para el bloqueo."); return; }

    let startMins: number | undefined;
    let endMins: number | undefined;

    if (start || end) {
      if (!start || !end) { toast.error("Debes definir el inicio y el fin del rango horario."); return; }
      startMins = timeToMins(start);
      endMins = timeToMins(end);
      if (startMins >= endMins) { toast.error("El inicio debe ser anterior al fin."); return; }
    }

    try {
      await addBlock({ date: dateStr, startMinute: startMins, endMinute: endMins });
      toast.success(startMins !== undefined ? `Rango ${minsToTime(startMins)}–${minsToTime(endMins!)} bloqueado el ${dateStr}.` : `${dateStr} bloqueado completamente.`);
      setSelectedBlockDate(undefined); setStart(""); setEnd("");
    } catch {
      toast.error("No se pudo crear el bloqueo.");
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteBlock({ blockId: id });
      toast.success("Bloqueo eliminado.");
    } catch {
      toast.error("No se pudo eliminar el bloqueo.");
    }
  };

  return (
    <div className="space-y-4">
      <p className={sectionTitle}>Bloqueos de Agenda</p>

      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nuevo bloqueo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Fecha</Label>
                <DatePicker value={selectedBlockDate} onChange={setSelectedBlockDate} minDate={new Date()} className="h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Inicio (opcional)</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Fin (opcional)</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-10 text-sm" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Si no defines hora, se bloqueará el día completo.</p>
            <Button className="w-full text-sm h-10" onClick={handleAdd}>Agregar bloqueo</Button>
          </div>

          {(blocks as any[]).length === 0 ? (
            <div className="py-8 text-center text-[12px] text-muted-foreground border border-dashed rounded-xl">
              No hay bloqueos activos.
            </div>
          ) : (
            <div className="space-y-2">
              {(blocks as any[]).map((b) => (
                <div key={b._id} className={rowItem}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{b.date}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {b.startMinute !== undefined ? `${minsToTime(b.startMinute)} — ${minsToTime(b.endMinute)}` : "Día completo"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] h-8 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(b._id)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Route ────────────────────────────────────────────────────────────────────
function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);

  return (
    <>
      <Authenticated>
        {profile === undefined ? (
          <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : !profile || (profile.role !== "barber" && profile.role !== "admin") ? (
          <Navigate to="/dashboard" />
        ) : (
          <div className="max-w-xl mx-auto px-4 py-8 space-y-10 pb-28">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Panel del Barbero</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Gestiona tu agenda, servicios y disponibilidad.</p>
            </div>
            <BarberServicesTab />
            <BarberScheduleTab />
            <BarberBlocksTab />
          </div>
        )}
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/dashboard" />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      </AuthLoading>
    </>
  );
}
