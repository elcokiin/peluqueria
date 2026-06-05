import { createFileRoute } from "@tanstack/react-router";
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
import { MoreVertical, Check, X, Trash2 } from "lucide-react";

import { Badge } from "@v1_peluqueria/ui/components/badge";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
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

function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);
  const barbers = useQuery(api.users.getBarbers);
  const pendingBarberos = useQuery(api.users.getPendingBarbers);
  const addBarbero = useMutation(api.users.addBarberByEmail);
  const setBarberStatus = useMutation(api.users.setBarberStatus);
  const removeBarber = useMutation(api.users.removeBarber);
  const [email, setEmail] = useState("");
  const [barberToDelete, setBarberToDelete] = useState<{id: string, isPending: boolean} | null>(null);
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsInvalid = normalizedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

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
          <div className="mx-auto flex max-w-2xl flex-col gap-8 p-4 pb-28 md:p-8">
            <section className="rounded-lg border bg-card p-4 md:p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
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
