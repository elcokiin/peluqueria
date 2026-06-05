import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@v1_peluqueria/backend/convex/_generated/api';
import { ArrowRight, CalendarDays, Scissors, Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@v1_peluqueria/ui/components/card';
import { Skeleton } from '@v1_peluqueria/ui/components/skeleton';

import avatar1 from '../../../assets/avatars/apple-avatar-1.jpeg';
import avatar2 from '../../../assets/avatars/apple-avatar-2.jpeg';
import avatar3 from '../../../assets/avatars/apple-avatar-3.jpeg';

const AVATARS = [avatar1, avatar2, avatar3];

export const Route = createFileRoute('/book/')({
  component: BookIndexComponent,
});

function BookIndexComponent() {
  const navigate = useNavigate();
  const barbers = useQuery(api.users.getPublicBarbers);
  const mvpAwards = useQuery(api.ratings.listMvpAwards);

  if (barbers === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-28 md:p-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (barbers.length === 0) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <Scissors className="mb-3 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">No hay barberos disponibles</h2>
        <p className="mt-2 text-sm text-muted-foreground">Vuelve a intentarlo más tarde o revisa tus citas existentes.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-28 md:p-8 md:pb-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agendar cita</p>
        <h1 className="text-2xl font-semibold text-foreground">Elige el profesional</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Después podrás seleccionar servicio, fecha, horario y confirmar la reserva.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {barbers.map((barber, index) => (
          <button
            key={barber._id}
            onClick={() => navigate({ to: '/book/$barberId', params: { barberId: barber._id } })}
            className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:ring-primary/50">
              <CardHeader className="flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={AVATARS[index % AVATARS.length]}
                    alt=""
                    className="size-14 rounded-full object-cover"
                  />
                  {barber.isMvp && (
                    <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-amber-400 text-amber-950">
                      <Trophy className="size-3.5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardTitle className="truncate text-base">{barber.name}</CardTitle>
                    {barber.isMvp && (
                      <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                        MVP
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    {barber.isMvp ? `Barbero MVP ${barber.mvpMonth}` : 'Profesional disponible'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {barber.isMvp ? (
                    <>
                      <Star data-icon="inline-start" className="fill-amber-400 text-amber-500" />
                      {barber.mvpAverageRating?.toFixed(1)} · {barber.mvpRatingCount} reseñas
                    </>
                  ) : (
                    <>
                      <CalendarDays data-icon="inline-start" />
                      Ver agenda
                    </>
                  )}
                </div>
                <span className="inline-flex h-7 items-center justify-center gap-1 rounded-none bg-primary px-2.5 text-xs font-medium text-primary-foreground">
                  Continuar
                  <ArrowRight data-icon="inline-end" />
                </span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      {mvpAwards && mvpAwards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial MVP</h2>
          <div className="divide-y rounded-lg border">
            {mvpAwards.slice(0, 6).map((award) => (
              <div key={award._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{award.barberName}</p>
                  <p className="text-xs text-muted-foreground">{award.month}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                  <Star className="size-3.5 fill-amber-400 text-amber-500" />
                  {award.averageRating.toFixed(1)} · {award.ratingCount}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
