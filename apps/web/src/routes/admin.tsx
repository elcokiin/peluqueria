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

import { Button } from "@v1_peluqueria/ui/components/button";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);
  const barbers = useQuery(api.users.getBarbers);
  const pendingBarberos = useQuery(api.users.getPendingBarbers);
  const addBarbero = useMutation(api.users.addBarberByEmail);
  const [email, setEmail] = useState("");

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
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 w-full sm:flex-1">
                          <p className="font-medium truncate">
                            {b.name || "Usuario Desconocido"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {b.email}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-1 text-xs rounded-full font-medium ${b.role === "admin" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}
                        >
                          {b.role === 'admin' ? 'ADMINISTRADOR' : 'BARBERO'}
                        </span>
                      </li>
                    ))}
                    
                    {/* Render pending barbers directly in the same list */}
                    {pendingBarberos?.map((b) => (
                      <li
                        key={b._id}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 hover:bg-muted/50 transition-colors opacity-75"
                      >
                        <div className="min-w-0 w-full sm:flex-1">
                          <p className="font-medium italic truncate">Registro Pendiente</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {b.email}
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-1 text-xs rounded-full font-medium bg-muted text-muted-foreground border">
                          BARBERO PENDIENTE
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
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

