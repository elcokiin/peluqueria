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

import { Button } from "@v1_peluqueria/ui/components/button";
import { Input } from "@v1_peluqueria/ui/components/input";
import { Label } from "@v1_peluqueria/ui/components/label";
import { Switch } from "@v1_peluqueria/ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@v1_peluqueria/ui/components/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/services")({
  component: RouteComponent,
});

function AdminServicesTab() {
  const allServices = useQuery(api.services.getAllServices);
  const upsertService = useMutation(api.services.upsertService);
  const deleteService = useMutation(api.services.deleteService);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [defaultDuration, setDefaultDuration] = useState("");
  const [isActive, setIsActive] = useState(true);

  if (allServices === undefined) {
    return <div className="text-center py-10">Cargando servicios del catálogo...</div>;
  }

  const openForEdit = (service: any) => {
    setEditingId(service._id);
    setName(service.name);
    setDescription(service.description || "");
    setDefaultPrice(new Intl.NumberFormat("es-CL").format(service.defaultPrice));
    setDefaultDuration(service.defaultDuration.toString());
    setIsActive(service.isActive);
    setIsOpen(true);
  };

  const openForCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setDefaultPrice("");
    setDefaultDuration("");
    setIsActive(true);
    setIsOpen(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, ""); // Remove existing dots
    if (!/^\d*$/.test(rawValue)) return; // Allow only digits
    
    if (!rawValue) {
      setDefaultPrice("");
      return;
    }
    
    setDefaultPrice(new Intl.NumberFormat("es-CL").format(parseInt(rawValue, 10)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !defaultPrice || !defaultDuration) return;

    const numericPrice = Number(defaultPrice.replace(/\./g, ""));

    try {
      await upsertService({
        id: editingId as any || undefined,
        name,
        description,
        defaultPrice: numericPrice,
        defaultDuration: Number(defaultDuration),
        isActive,
      });
      
      toast.success(editingId ? "Servicio actualizado" : "Servicio creado correctamente");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error al guardar el servicio");
    }
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService({ id: serviceToDelete as any });
      toast.success("Servicio eliminado");
    } catch (err: any) {
      toast.error("Error al eliminar el servicio");
    } finally {
      setServiceToDelete(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 border-b bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Catálogo Maestro de Servicios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Los servicios que crees aquí estarán disponibles para que los barberos los agreguen a su menú.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button onClick={openForCreate} className="shrink-0" />}>
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Nuevo Servicio
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Servicio" : "Crear Servicio Global"}</DialogTitle>
              <DialogDescription>
                Define la información base de este servicio.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej: Corte Degradado (Fade)"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Descripción (Opcional)</Label>
                <Input 
                  id="desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Breve descripción para el cliente" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Sugerido ($) *</Label>
                  <Input 
                    id="price" 
                    type="text" 
                    inputMode="numeric"
                    value={defaultPrice} 
                    onChange={handlePriceChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración Base (min) *</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="5" step="5" 
                    value={defaultDuration} 
                    onChange={(e) => setDefaultDuration(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t mt-4">
                <div className="space-y-0.5">
                  <Label>Estado Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Si se desactiva, los barberos no podrán agregarlo.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">Precio Base</th>
              <th className="px-4 py-3 font-medium">Duración</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay servicios en el catálogo maestro.
                </td>
              </tr>
            ) : (
              allServices.map((service) => (
                <tr key={service._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {service.name}
                    {service.description && (
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5 truncate max-w-[200px] md:max-w-xs">
                        {service.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">${new Intl.NumberFormat("es-CL").format(service.defaultPrice)}</td>
                  <td className="px-4 py-3">{service.defaultDuration} min</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'}`}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openForEdit(service)} className="mr-1">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setServiceToDelete(service._id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás completamente seguro?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar este servicio del catálogo base? 
              Esto afectará a los barberos que lo utilizan y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setServiceToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Sí, eliminar servicio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        ) : profile.role !== "admin" ? (
          <Navigate to="/dashboard" />
        ) : (
          <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Administración de Servicios</h1>
            <AdminServicesTab />
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