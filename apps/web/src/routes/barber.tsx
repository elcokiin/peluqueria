import { createFileRoute, Navigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";

export const Route = createFileRoute("/barber")({
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);

  return (
    <>
      <Authenticated>
        {profile === undefined ? (
          <div>Cargando perfil...</div>
        ) : profile.role !== "barber" && profile.role !== "admin" ? (
          <Navigate to="/dashboard" />
        ) : (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <section className="bg-card p-4 md:p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Tu Horario</h2>
              <p className="text-muted-foreground">Próximamente...</p>
            </section>

            <section className="bg-card p-4 md:p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">
                Próximas Citas
              </h2>
              <p className="text-muted-foreground">Próximamente...</p>
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

