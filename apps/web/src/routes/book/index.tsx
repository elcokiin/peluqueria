import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@v1_peluqueria/backend/convex/_generated/api';
import { useEffect } from 'react';
import { Card, CardContent } from '@v1_peluqueria/ui/components/card';
import { Skeleton } from '@v1_peluqueria/ui/components/skeleton';

export const Route = createFileRoute('/book/')({
  component: BookIndexComponent,
});

function BookIndexComponent() {
  const navigate = useNavigate();
  const barbers = useQuery(api.users.getPublicBarbers);

  useEffect(() => {
    // Auto-redirect if there is exactly 1 barber
    if (barbers && barbers.length === 1) {
      navigate({
        to: '/book/$barberId',
        params: { barberId: barbers[0]._id },
        replace: true,
      });
    }
  }, [barbers, navigate]);

  if (barbers === undefined) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64 mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center">
        <h2 className="text-xl font-semibold text-foreground">No hay barberos disponibles</h2>
        <p className="text-muted-foreground mt-2">Vuelve a intentarlo más tarde.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Selecciona un Profesional</h1>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {barbers.map((barber) => (
          <button
            key={barber._id}
            onClick={() => navigate({ to: '/book/$barberId', params: { barberId: barber._id } })}
            className="text-left block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold">
                  {barber.name?.[0]?.toUpperCase() || 'B'}
                </div>
                <span className="text-lg font-medium text-foreground">{barber.name}</span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
