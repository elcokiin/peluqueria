import { createFileRoute } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  useQuery,
} from "convex/react";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useQuery(api.privateData.get);

  return (
    <>
      <Authenticated>
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          <section className="bg-card p-4 md:p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">¡Bienvenido!</h2>
            <p className="text-muted-foreground">
              Este es el panel de control. Datos privados: {privateData?.message}
            </p>
          </section>
        </div>
      </Authenticated>
      <AuthLoading>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">Cargando...</div>
      </AuthLoading>
    </>
  );
}
