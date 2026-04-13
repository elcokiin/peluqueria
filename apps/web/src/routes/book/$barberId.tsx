import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@v1_peluqueria/backend/convex/_generated/api';
import type { Id } from '@v1_peluqueria/backend/convex/_generated/dataModel';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@v1_peluqueria/ui/components/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@v1_peluqueria/ui/components/dialog';
import { Card, CardContent } from '@v1_peluqueria/ui/components/card';
import { Calendar } from '@v1_peluqueria/ui/components/calendar';
import { Skeleton } from '@v1_peluqueria/ui/components/skeleton';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { toast } from 'sonner';
import { z } from 'zod';

import avatar1 from '../../../assets/avatars/apple-avatar-1.jpeg';
import avatar2 from '../../../assets/avatars/apple-avatar-2.jpeg';
import avatar3 from '../../../assets/avatars/apple-avatar-3.jpeg';

const AVATARS = [avatar1, avatar2, avatar3];

const bookingSearchSchema = z.object({
  serviceId: z.string().optional(),
  date: z.string().optional(),
  time: z.number().optional(),
});

export const Route = createFileRoute('/book/$barberId')({
  component: BarberBookingComponent,
  validateSearch: bookingSearchSchema,
});

function BarberBookingComponent() {
  const { barberId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  
  // Date tracking
  const [minDate, setMinDate] = useState<Date>(new Date());
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today);
  }, []);
  
  const barbers = useQuery(api.users.getPublicBarbers);
  const services = useQuery(api.barberServices.getPublicServices, { 
    barberId: barberId as Id<'users'> 
  });
  
  const user = useQuery(api.auth.getCurrentUser);
  const createAppointment = useMutation(api.appointments.createAppointment);

  const selectedServiceId = search.serviceId as Id<'barberServices'> | undefined;
  
  // Create Date object from URL string if it exists
  const selectedDateObj = useMemo(() => {
    if (!search.date) return undefined;
    // Append T12:00:00 to avoid timezone shift issues parsing YYYY-MM-DD
    return new Date(`${search.date}T12:00:00`);
  }, [search.date]);
  
  const selectedTime = search.time;
  
  const selectedService = services?.find(s => s._id === selectedServiceId);

  // Auto-select service if there is exactly 1 service available
  useEffect(() => {
    if (services && services.length === 1 && !selectedServiceId) {
      navigate({
        search: (prev) => ({ ...prev, serviceId: services[0]._id }),
        replace: true,
      });
    }
  }, [services, selectedServiceId, navigate]);

  const availableSlots = useQuery(
    api.slots.getAvailableSlots,
    selectedService && search.date
      ? {
          barberId: barberId as Id<'users'>,
          date: search.date,
          totalDuration: selectedService.duration,
        }
      : 'skip'
  );

  const barber = barbers?.find(b => b._id === barberId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateSearch = (updates: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      updateSearch({ date: undefined, time: undefined });
      return;
    }
    // Format to YYYY-MM-DD explicitly
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    updateSearch({ date: `${year}-${month}-${day}`, time: undefined });
  };

  const handleBook = async () => {
    if (!selectedService || !search.date || !selectedTime || !barber) return;
    
    setIsSubmitting(true);
    try {
      await createAppointment({
        barberId: barber._id,
        serviceId: selectedService._id,
        date: search.date,
        startTime: selectedTime,
      });
      toast.success('¡Cita reservada con éxito!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al reservar la cita. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (barbers === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold text-destructive">Barbero no encontrado</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Barber Carousel / Selection */}
      <section className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4 text-foreground">1. Selecciona un Profesional</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
          {barbers.map((b, index) => {
            const isSelected = b._id === barber._id;
            return (
              <button
                key={b._id}
                onClick={() => navigate({ to: '/book/$barberId', params: { barberId: b._id } })}
                className={`group flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all snap-start min-w-[100px] sm:min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/20'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}>
                  <img 
                    src={AVATARS[index % AVATARS.length]} 
                    alt={b.name}
                    className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                  />
                </div>
                <span className={`text-sm font-medium text-center line-clamp-1 ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}>
                  {b.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Services */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">2. Selecciona un Servicio</h2>
        
        {services === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => updateSearch({ serviceId: service._id, time: undefined })}
                  className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <Card className={`transition-all h-full ${
                    selectedServiceId === service._id 
                      ? 'border-primary ring-1 ring-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-foreground">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {service.description || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <div className="font-semibold text-foreground">${new Intl.NumberFormat('es-CL').format(service.price)}</div>
                          <div className="text-xs text-muted-foreground">{service.duration} min</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-muted-foreground italic mt-4">Este barbero no tiene servicios disponibles aún.</p>
            )}
          </>
        )}
      </section>

      {/* Step 3: Date & Time */}
      {selectedServiceId && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4 text-foreground">3. Fecha y Hora</h2>
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="bg-background rounded-xl border p-2 w-fit">
                    <Calendar
                      mode="single"
                      selected={selectedDateObj}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        return d < minDate;
                      }}
                      className="pointer-events-auto"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  {search.date ? (
                    <div>
                      <h3 className="font-medium mb-4 text-foreground">Horarios para el {search.date}</h3>
                      {availableSlots === undefined ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                          ))}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center p-8 bg-muted/50 rounded-xl border border-dashed">
                          <p className="text-muted-foreground">No hay turnos disponibles este día.</p>
                          <p className="text-sm text-muted-foreground mt-1">Prueba seleccionando otra fecha.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((timestamp) => {
                            const dateObj = new Date(timestamp);
                            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isSelected = selectedTime === timestamp;
                            
                            return (
                              <button
                                key={timestamp}
                                onClick={() => updateSearch({ time: timestamp })}
                                className={`py-2.5 px-3 text-sm rounded-md border transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary text-primary-foreground font-medium shadow-sm' 
                                    : 'border-input bg-background hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                                }`}
                              >
                                {timeString}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8 text-muted-foreground border border-dashed rounded-xl bg-background/50">
                      Selecciona una fecha en el calendario para ver los horarios disponibles.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Step 4: Confirmation Dialog */}
      {selectedTime && selectedService && search.date && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t flex justify-end">
          <Dialog>
            <DialogTrigger render={<Button size="lg" className="w-full sm:w-auto" />}>
              Continuar a Confirmación
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
              <DialogTitle className="text-xl pb-2 border-b">Confirmar Reserva</DialogTitle>
              <DialogDescription>
                Revisa los detalles de tu cita antes de confirmar.
              </DialogDescription>
              
              <div className="my-6 space-y-3 bg-muted/50 p-4 rounded-xl text-sm border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Barbero:</span>
                  <span className="font-medium text-foreground">{barber.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-medium text-foreground text-right ml-4 line-clamp-1">{selectedService.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium text-foreground">{search.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hora:</span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duración:</span>
                  <span className="font-medium text-foreground">{selectedService.duration} min</span>
                </div>
                <div className="pt-3 mt-3 border-t border-border flex justify-between items-center font-bold text-lg">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">${new Intl.NumberFormat('es-CL').format(selectedService.price)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {user ? (
                  <Button 
                    className="w-full" 
                    onClick={handleBook} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Inicia sesión para finalizar tu reserva.
                    </p>
                    <GoogleAuthButton mode="signin" />
                  </div>
                )}
                <DialogClose render={<Button variant="outline" className="w-full" disabled={isSubmitting} />}>
                  Cancelar
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </section>
      )}
    </div>
  );
}
