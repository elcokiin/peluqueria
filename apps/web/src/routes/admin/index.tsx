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

import { Button } from "@v1_peluqueria/ui/components/button";
import { Input } from "@v1_peluqueria/ui/components/input";
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

  const handleAddBarbero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const normalizedEmail = email.trim().toLowerCase();
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
          <Navigate to="/dashboard" />
        ) : (
          <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
            <section className="bg-card p-4 md:p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Añadir un Barbero</h2>
              <form onSubmit={handleAddBarbero} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="barber@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full sm:max-w-sm"
                  required
                />
                <Button type="submit" className="w-full sm:w-auto">Añadir Barbero</Button>
              </form>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">
                Barberos y Administradores Actuales
              </h2>
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
                              <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">Activo</span>
                            )}
                            {b.role === 'barber' && b.isActive === false && (
                              <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">Inactivo</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {b.email}
                            </p>
                            <span
                              className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium ${b.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}
                            >
                              {b.role === 'admin' ? 'ADMINISTRADOR' : 'BARBERO'}
                            </span>
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
                            <span className="shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium bg-muted text-muted-foreground border">
                              BARBERO PENDIENTE
                            </span>
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
        <Navigate to="/dashboard" />
      </Unauthenticated>
      <AuthLoading>
        <div>Cargando...</div>
      </AuthLoading>
    </>
  );
}

