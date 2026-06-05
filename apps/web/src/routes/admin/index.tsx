import { createFileRoute } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MoreVertical, Check, X, Trash2, CalendarDays, Scissors, TrendingDown, Trophy } from "lucide-react";

import { Badge } from "@v1_peluqueria/ui/components/badge";
import { Button } from "@v1_peluqueria/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1_peluqueria/ui/components/card";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@v1_peluqueria/ui/components/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1_peluqueria/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@v1_peluqueria/ui/components/dialog";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

type ReportPeriod = "day" | "week" | "month";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function toDateInputValue(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function getBogotaDate(value: string) {
  return new Date(`${value}T12:00:00-05:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(period: ReportPeriod, anchorValue: string) {
  const anchor = getBogotaDate(anchorValue);

  if (period === "day") {
    return { startDate: anchorValue, endDate: anchorValue };
  }

  if (period === "week") {
    const dayOfWeek = anchor.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = addDays(anchor, mondayOffset);
    const end = addDays(start, 6);
    return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
  }

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) return dateFormatter.format(getBogotaDate(startDate));
  return `${dateFormatter.format(getBogotaDate(startDate))} - ${dateFormatter.format(getBogotaDate(endDate))}`;
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex grid-cols-[1fr_auto] flex-row items-start justify-between">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-2xl font-semibold">{value}</CardTitle>
        </div>
        <div className="rounded-md bg-muted p-2 text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);
  const barbers = useQuery(api.users.getBarbers);
  const pendingBarberos = useQuery(api.users.getPendingBarbers);
  const addBarbero = useMutation(api.users.addBarberByEmail);
  const setBarberStatus = useMutation(api.users.setBarberStatus);
  const removeBarber = useMutation(api.users.removeBarber);
  const [email, setEmail] = useState("");
  const [barberToDelete, setBarberToDelete] = useState<{id: string, isPending: boolean} | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("week");
  const [reportDate, setReportDate] = useState(() => toDateInputValue(new Date()));
  const [reportBarberId, setReportBarberId] = useState("all");
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsInvalid = normalizedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const reportRange = useMemo(() => getDateRange(reportPeriod, reportDate), [reportPeriod, reportDate]);
  const currentWeekRange = useMemo(() => getDateRange("week", toDateInputValue(new Date())), []);
  const report = useQuery(
    api.appointments.productivityReport,
    profile?.role === "admin"
      ? {
          ...reportRange,
          barberId: reportBarberId === "all" ? undefined : reportBarberId as any,
        }
      : "skip"
  );
  const weeklyReport = useQuery(
    api.appointments.productivityReport,
    profile?.role === "admin" ? currentWeekRange : "skip"
  );
  const totals = report?.totals;
  const cancellationRate = totals && totals.totalCount > 0
    ? Math.round((totals.cancelledCount / totals.totalCount) * 1000) / 10
    : 0;
  const weeklyLeader = weeklyReport?.rows.find((row) => row.closedCount > 0);

  const handleAddBarbero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedEmail || emailIsInvalid) {
      toast.error("Ingresa un correo válido para asignar el rol.");
      return;
    }
    try {
      const result = await addBarbero({ email: normalizedEmail });
      if (result?.status === "pending") {
        toast.success(`Barbero añadido a la lista de pendientes. Se les concederá acceso al registrarse.`);
      } else {
        toast.success("¡Rol de barbero concedido con éxito!");
      }
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Error al añadir barbero");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean | undefined) => {
    try {
      await setBarberStatus({ userId: userId as any, isActive: !currentStatus });
      toast.success(currentStatus ? "Barbero desactivado" : "Barbero activado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar estado");
    }
  };

  const confirmDeleteBarber = async () => {
    if (!barberToDelete) return;
    try {
      await removeBarber({ id: barberToDelete.id as any, isPending: barberToDelete.isPending });
      toast.success("Barbero eliminado con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar barbero");
    } finally {
      setBarberToDelete(null);
    }
  };

  return (
    <>
      <Authenticated>
        {profile === undefined ? (
          <div>Cargando perfil...</div>
        ) : profile?.role !== "admin" ? (
          <Navigate to="/" />
        ) : (
          <div className="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-28 md:p-8">
            <section className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">F2 · Reportes de productividad</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Panel de administración</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Controla el volumen de citas, cierres y cancelaciones por barbero.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Filtros del reporte</CardTitle>
                  <CardDescription>
                    Período activo: {formatDateRange(reportRange.startDate, reportRange.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label>Período</Label>
                      <Select value={reportPeriod} onValueChange={(value) => setReportPeriod(value as ReportPeriod)}>
                        <SelectTrigger className="w-full md:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="day">Día</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mes</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="report-date">Fecha base</Label>
                      <Input
                        id="report-date"
                        type="date"
                        value={reportDate}
                        onChange={(event) => setReportDate(event.target.value)}
                        className="md:w-44"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:min-w-64">
                      <Label>Barbero</Label>
                      <Select value={reportBarberId} onValueChange={setReportBarberId}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="all">Todos los barberos</SelectItem>
                            {barbers?.map((barber) => (
                              <SelectItem key={barber._id} value={barber._id}>
                                {barber.name || barber.email}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<CalendarDays />}
                  label="Citas agendadas"
                  value={report === undefined ? "..." : String(totals?.scheduledCount ?? 0)}
                  detail="Pendientes y en check-in"
                />
                <MetricCard
                  icon={<Scissors />}
                  label="Citas finalizadas"
                  value={report === undefined ? "..." : String(totals?.closedCount ?? 0)}
                  detail="Cortes cerrados en el período"
                />
                <MetricCard
                  icon={<TrendingDown />}
                  label="Tasa de cancelación"
                  value={report === undefined ? "..." : `${cancellationRate}%`}
                  detail={`${totals?.cancelledCount ?? 0} canceladas de ${totals?.totalCount ?? 0}`}
                />
                <MetricCard
                  icon={<Trophy />}
                  label="Más cortes esta semana"
                  value={weeklyReport === undefined ? "..." : weeklyLeader?.barberName ?? "Sin cortes"}
                  detail={weeklyLeader ? `${weeklyLeader.closedCount} cortes finalizados` : "Aún no hay finalizaciones"}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Productividad por barbero</CardTitle>
                  <CardDescription>
                    Conteo de citas y cancelaciones para {formatDateRange(reportRange.startDate, reportRange.endDate)}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report === undefined ? (
                    <div className="py-8 text-center text-muted-foreground">Cargando reporte...</div>
                  ) : report.rows.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No hay barberos para mostrar.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Barbero</th>
                            <th className="px-4 py-3 font-medium">Agendadas</th>
                            <th className="px-4 py-3 font-medium">Finalizadas</th>
                            <th className="px-4 py-3 font-medium">Canceladas</th>
                            <th className="px-4 py-3 font-medium">Tasa cancelación</th>
                            <th className="px-4 py-3 font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {report.rows.map((row) => (
                            <tr key={row.barberId} className="hover:bg-muted/30">
                              <td className="px-4 py-3">
                                <div className="font-medium">{row.barberName}</div>
                                <div className="text-xs text-muted-foreground">{row.barberEmail}</div>
                              </td>
                              <td className="px-4 py-3">{row.scheduledCount}</td>
                              <td className="px-4 py-3 font-medium">{row.closedCount}</td>
                              <td className="px-4 py-3">{row.cancelledCount}</td>
                              <td className="px-4 py-3">{row.cancellationRate}%</td>
                              <td className="px-4 py-3">
                                <Badge variant={row.isActive ? "secondary" : "destructive"}>
                                  {row.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="rounded-lg border bg-card p-4 md:p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold tracking-tight">Gestión de barberos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Gestiona roles de barbero y acceso al panel instalado.</p>
              </div>
              <form onSubmit={handleAddBarbero} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex w-full flex-col gap-1.5 sm:max-w-sm">
                  <Label htmlFor="barber-email">Correo del barbero</Label>
                  <Input
                    id="barber-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="barber@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={emailIsInvalid}
                    required
                  />
                  {emailIsInvalid && (
                    <p className="text-xs text-destructive">Usa un correo con formato nombre@dominio.com.</p>
                  )}
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={!normalizedEmail || emailIsInvalid}>
                  Añadir barbero
                </Button>
              </form>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">Barberos y administradores actuales</h2>
              <div className="bg-card border rounded-lg overflow-hidden">
                {barbers === undefined ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Cargando...
                  </div>
                ) : barbers?.length === 0 && pendingBarberos?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No se encontraron barberos.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {barbers?.map((b) => (
                      <li
                        key={b._id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {b.name || "Usuario Desconocido"}
                            </p>
                            {b.role === 'barber' && b.isActive !== false && (
                              <Badge variant="secondary" className="shrink-0">Activo</Badge>
                            )}
                            {b.role === 'barber' && b.isActive === false && (
                              <Badge variant="destructive" className="shrink-0">Inactivo</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {b.email}
                            </p>
                            <Badge variant={b.role === "admin" ? "default" : "secondary"} className="shrink-0">
                              {b.role === 'admin' ? 'ADMINISTRADOR' : 'BARBERO'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          
                          {b._id !== profile._id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {b.role === 'barber' && (
                                    <DropdownMenuItem onClick={() => handleToggleStatus(b._id, b.isActive)}>
                                      {b.isActive !== false ? (
                                        <><X className="mr-2 h-4 w-4" /> Desactivar</>
                                      ) : (
                                        <><Check className="mr-2 h-4 w-4" /> Activar</>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setBarberToDelete({ id: b._id, isPending: false })}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </li>
                    ))}
                    
                    {/* Render pending barbers directly in the same list */}
                    {pendingBarberos?.map((b) => (
                      <li
                        key={b._id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors opacity-75"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium italic truncate mb-1">
                            Registro Pendiente
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {b.email}
                            </p>
                            <Badge variant="outline" className="shrink-0">
                              BARBERO PENDIENTE
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => setBarberToDelete({ id: b._id, isPending: true })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            
            <Dialog open={!!barberToDelete} onOpenChange={(open) => !open && setBarberToDelete(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Estás completamente seguro?</DialogTitle>
                  <DialogDescription>
                    Esta acción no se puede deshacer. Se le revocará el acceso de barbero
                    a este usuario y será eliminado de la lista.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setBarberToDelete(null)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteBarber}>
                    Sí, eliminar barbero
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        )}
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/" />
      </Unauthenticated>
      <AuthLoading>
        <div>Cargando...</div>
      </AuthLoading>
    </>
  );
}
