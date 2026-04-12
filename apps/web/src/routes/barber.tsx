import { createFileRoute, Navigate } from "@tanstack/react-router";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { useState } from "react";

// Assuming we have these from your UI package, if any fail we can swap to standard HTML tags
import { Button } from "@v1_peluqueria/ui/components/button";
import { Switch } from "@v1_peluqueria/ui/components/switch";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@v1_peluqueria/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@v1_peluqueria/ui/components/select";

export const Route = createFileRoute("/barber")({
  component: RouteComponent,
});

function BarberServicesTab() {
  // Fetch real-time data
  const myServices = useQuery(api.barberServices.getMyServices, {});
  const globalServices = useQuery(api.barberServices.getAvailableGlobalServices);
  
  // Mutations
  const toggleStatus = useMutation(api.barberServices.toggleServiceStatus);
  const upsertService = useMutation(api.barberServices.upsertBarberService);

  // Sheet (Drawer) State
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  if (myServices === undefined || globalServices === undefined) {
    return <div className="text-center py-10">Cargando servicios...</div>;
  }

  const handleGlobalServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    const service = globalServices.find((s) => s._id === id);
    if (service) {
      setPrice(new Intl.NumberFormat("es-CL").format(service.defaultPrice));
      setDuration(service.defaultDuration.toString());
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, ""); // Remove existing dots
    if (!/^\d*$/.test(rawValue)) return; // Allow only digits
    
    if (!rawValue) {
      setPrice("");
      return;
    }
    
    setPrice(new Intl.NumberFormat("es-CL").format(parseInt(rawValue, 10)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !price || !duration) return;

    // Convert price back to a regular number before sending
    const numericPrice = Number(price.replace(/\./g, ""));

    await upsertService({
      serviceId: selectedServiceId as any,
      price: numericPrice,
      duration: Number(duration),
      isActive: true,
    });
    
    setIsOpen(false);
    // Reset form
    setSelectedServiceId("");
    setPrice("");
    setDuration("");
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden relative min-h-[500px]">
      <div className="p-4 md:p-6 border-b bg-muted/20">
        <h2 className="text-xl font-bold">Mis Servicios</h2>
        <p className="text-sm text-muted-foreground">Administra los servicios que ofreces y tus tarifas.</p>
      </div>

      {/* Service List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {myServices.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No has agregado ningún servicio aún.
          </div>
        ) : (
          myServices.map((service) => (
            <div key={service._id} className="bg-card p-4 rounded-xl shadow-sm border flex justify-between items-center transition-all hover:shadow-md">
              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
                  {service.name}
                  {!service.isActive && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-normal">Inactivo</span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {service.duration} min
                </p>
                {service.description && (
                  <p className="text-muted-foreground text-xs mt-1 truncate">{service.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4 border-l pl-4">
                <div className="text-right">
                  <span className="block font-bold text-green-600 text-lg">
                    ${new Intl.NumberFormat("es-CL").format(service.price)}
                  </span>
                </div>
                {/* Quick Toggle to pause a service */}
                <Switch 
                  checked={service.isActive} 
                  onCheckedChange={(checked) => 
                    toggleStatus({ barberServiceId: service._id, isActive: checked })
                  } 
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Sticky Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={<Button className="w-full text-lg h-12 rounded-full shadow-lg" />}>
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Agregar Servicio
            </span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl sm:h-auto sm:max-h-[80vh]">
            <SheetHeader className="mb-6 text-left">
              <SheetTitle>Agregar Nuevo Servicio</SheetTitle>
              <SheetDescription>
                Selecciona un servicio de la lista y ajusta tu precio y duración.
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service">Servicio</Label>
                <Select value={selectedServiceId} onValueChange={handleGlobalServiceSelect}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Selecciona un servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {globalServices.map((gs) => (
                      <SelectItem key={gs._id} value={gs._id}>
                        {gs.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedServiceId && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="price">Tu Precio ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        id="price" 
                        type="text" 
                        inputMode="numeric"
                        value={price}
                        onChange={handlePriceChange}
                        className="pl-8 h-12 text-lg font-medium"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min)</Label>
                    <div className="relative">
                      <Input 
                        id="duration" 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="pr-12 h-12 text-lg font-medium"
                        required
                        min="5"
                        step="5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">min</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg rounded-xl"
                  disabled={!selectedServiceId || !price || !duration}
                >
                  Guardar Servicio
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function RouteComponent() {
  const profile = useQuery(api.users.currentProfile);

  return (
    <>
      <Authenticated>
        {profile === undefined ? (
          <div className="flex h-screen items-center justify-center">Cargando perfil...</div>
        ) : profile.role !== "barber" && profile.role !== "admin" ? (
          <Navigate to="/dashboard" />
        ) : (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
            
            {/* SERVICES MANAGEMENT TAB */}
            <BarberServicesTab />

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
        <div className="flex h-screen items-center justify-center">Cargando...</div>
      </AuthLoading>
    </>
  );
}

