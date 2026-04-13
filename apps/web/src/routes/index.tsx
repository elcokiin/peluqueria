import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { Facebook, Instagram, Globe, Plus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@v1_peluqueria/ui/components/avatar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@v1_peluqueria/ui/components/accordion";
import { Card, CardContent } from "@v1_peluqueria/ui/components/card";
import { Badge } from "@v1_peluqueria/ui/components/badge";
import { ScrollArea, ScrollBar } from "@v1_peluqueria/ui/components/scroll-area";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Skeleton } from "@v1_peluqueria/ui/components/skeleton";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const barbers = useQuery(api.users.getPublicBarbers);

  const servicesQueryData = useQuery(api.barberServices.getMyServices,
    selectedBarberId ? { barberId: selectedBarberId as any } : {}
  );

  const globalServices = useQuery(api.barberServices.getAvailableGlobalServices);

  const services = selectedBarberId ? servicesQueryData : (globalServices?.map((s: any) => ({ ...s, serviceId: s._id, price: s.defaultPrice, duration: s.defaultDuration })) || undefined);

  // Dynamically group services
  const groupedServices: Record<string, any[]> = {
    "Barbas": [],
    "Cortes de Cabello": [],
    "Otros Servicios": []
  };

  if (services) {
    services.forEach((s: any) => {
      const name = (s.name || "").toLowerCase();
      if (name.includes("barba") || name.includes("afeitado") || name.includes("ras")) {
        groupedServices["Barbas"].push(s);
      } else if (name.includes("corte") || name.includes("fade") || name.includes("cabello")) {
        groupedServices["Cortes de Cabello"].push(s);
      } else {
        groupedServices["Otros Servicios"].push(s);
      }
    });
  }

  const activeCategories = Object.entries(groupedServices).filter(([_, items]) => items.length > 0);

  return (
    <div className="flex h-full w-full justify-center bg-slate-50 font-sans text-slate-900 pt-2 pb-6 dark:bg-background">
      <div className="w-full max-w-md bg-slate-50 dark:bg-background h-full">
        {/* Banner Hero */}
        <div className="p-4 pt-6">
          <Card className="relative w-full h-[180px] rounded-[1.25rem] overflow-hidden shadow-sm border-0">
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
              alt="Barber banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />

            {/* Social Icons */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-slate-800/80 text-white backdrop-blur-sm transition-colors hover:bg-slate-900">
                <Facebook className="size-4" />
              </a>
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-slate-800/80 text-white backdrop-blur-sm transition-colors hover:bg-slate-900">
                <Globe className="size-4" />
              </a>
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-slate-800/80 text-white backdrop-blur-sm transition-colors hover:bg-slate-900">
                <Instagram className="size-4" />
              </a>
            </div>

            {/* Barber logo */}
            <Card className="absolute left-4 top-4 flex size-28 items-center justify-center rounded-[1.25rem] border-0 bg-white p-1.5 shadow-md">
              <div className="flex size-full items-center justify-center rounded-xl bg-[#1A1A1A]">
                <span className="text-center text-sm font-bold leading-tight tracking-tighter text-white">BARBER<br />SHOP</span>
              </div>
            </Card>
          </Card>
        </div>

        {/* Barber Selection */}
        <div className="mt-4 px-4">
          <h2 className="mb-4 px-1 text-[14px] font-medium text-slate-800 dark:text-foreground">
            ¿Quieres agendar con un profesional en particular?
          </h2>
          {barbers === undefined ? (
            <div className="flex gap-4"><Skeleton className="size-16 rounded-full" /><Skeleton className="size-16 rounded-full" /></div>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="mr-4 flex gap-5 px-1">
                {barbers.map((barber: any) => {
                  const isSelected = selectedBarberId === barber._id;
                  const initials = barber.name?.substring(0, 2).toUpperCase() || "BA";
                  return (
                    <button
                      key={barber._id}
                      className="group flex flex-col items-center gap-2 outline-none"
                      onClick={() => setSelectedBarberId(isSelected ? null : barber._id)}
                    >
                      <Avatar className={`size-16 transition-all ${isSelected ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-background" : "group-hover:ring-2 group-hover:ring-primary/20"
                        }`}>
                        <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${barber._id}&backgroundColor=333333`} alt={barber.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className={`w-16 truncate text-center text-[13px] ${isSelected ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                        {barber.name?.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          )}
        </div>

        {/* Catalog */}
        <div className="mt-4 px-4 pb-8">
          <h2 className="mb-4 px-1 text-[14px] font-medium text-slate-800 dark:text-foreground">
            {selectedBarberId ? "Servicios ofrecidos por este profesional" : "Selecciona los servicios que deseas agendar"}
          </h2>

          <div className="flex flex-col gap-3">
            {services === undefined ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : activeCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay servicios disponibles en este momento.</p>
            ) : (
              <Accordion type="multiple" defaultValue={["Barbas"]} className="flex w-full flex-col gap-4">
                {activeCategories.map(([category, items]) => (
                  <AccordionItem value={category} key={category} className="overflow-hidden rounded-[0.8rem] border border-border bg-card shadow-sm px-0">
                    <AccordionTrigger className="border-none px-4 py-4 text-[15px] font-semibold hover:bg-muted/50 hover:no-underline">
                      {category}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 border-t border-border bg-background px-4 pb-4 pt-4">
                      {items.map((service: any, idx: number) => (
                        <Card key={`${service.serviceId}-${idx}`} className="relative overflow-hidden rounded-[0.8rem] border-border p-0 shadow-none">
                          <Badge variant="secondary" className="absolute left-0 top-0 rounded-none rounded-br-[0.8rem] bg-emerald-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-emerald-700">
                            Descuento pagando en línea
                          </Badge>

                          <CardContent className="p-4 pt-10">
                            <h3 className="mt-1 text-[16px] font-semibold text-foreground">
                              {service.name}
                            </h3>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">{service.duration} min</p>

                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-[16px] font-bold text-foreground">${(service.price ?? 0).toLocaleString("es-CL")}</span>
                              <span className="text-[13px] line-through text-muted-foreground">Normal: ${((service.price ?? 0) * 1.2).toLocaleString("es-CL")}</span>
                            </div>

                            <p className="mt-2 text-[13px] italic text-muted-foreground">{service.description || "Servicio profesional."}</p>

                            <Button onClick={() => toast.success(`Se ha agregado ${service.name}`, { description: 'Puedes proceder al pago de tu cita.' })} className="mt-5 w-full rounded-lg font-medium">
                              <Plus data-icon="inline-start" className="mr-2" />
                              Agregar servicio
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
