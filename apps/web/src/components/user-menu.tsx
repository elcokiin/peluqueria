import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { Button } from "@v1_peluqueria/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@v1_peluqueria/ui/components/dropdown-menu";
import { useQuery, useMutation } from "convex/react";
import { LogOut, User, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export default function UserMenu() {
  const user = useQuery(api.auth.getCurrentUser);
  const profile = useQuery(api.users.currentProfile);
  const switchActiveRole = useMutation(api.users.switchActiveRole);
  const navigate = useNavigate();

  if (user === undefined) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />;
  }

  if (user === null) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Sesión cerrada correctamente");
            navigate({ to: "/" });
          },
          onError: (error) => {
            toast.error(error.error.message || "Error al cerrar sesión");
          },
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al cerrar sesión.");
    }
  };

  const handleRoleChange = async (newRole: "user" | "barber" | "admin") => {
    try {
      await switchActiveRole({ targetRole: newRole });
      toast.success(`Rol cambiado a ${newRole === 'user' ? 'usuario' : newRole === 'barber' ? 'barbero' : 'admin'}`);
      navigate({ to: newRole === "user" ? "/dashboard" : `/${newRole}` });
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el rol");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 p-0 overflow-hidden">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "Avatar de usuario"} 
              className="h-full w-full object-cover border rounded-full" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted border">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground truncate">
            {user.email}
          </p>
          {profile && profile.role !== "user" && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              ROL: {profile.activeRole === 'user' ? 'usuario' : profile.activeRole === 'barber' ? 'barbero' : 'admin'}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {profile && (profile.role === "admin" || profile.role === "barber") && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Shield className="mr-2 h-4 w-4" />
                <span>Cambiar Rol</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={profile.activeRole} onValueChange={(value) => handleRoleChange(value as any)}>
                  <DropdownMenuRadioItem value="user">Usuario</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="barber">Barbero</DropdownMenuRadioItem>
                  {profile.role === "admin" && (
                    <DropdownMenuRadioItem value="admin">Administrador</DropdownMenuRadioItem>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
