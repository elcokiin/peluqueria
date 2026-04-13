import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useQuery(api.privateData.get);
  const navigate = useNavigate();

  return (
    <>
      <Authenticated>
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mis Citas</h1>
            <Button 
              className="w-full sm:w-auto" 
              onClick={() => navigate({ to: "/book" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Reservar Turno
            </Button>
          </div>
          
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
