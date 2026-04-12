import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import UserMenu from "./user-menu";
import { GoogleAuthButton } from "./google-auth-button";

export default function Header() {
  const user = useQuery(api.auth.getCurrentUser);
  const profile = useQuery(api.users.currentProfile);
  const isLoading = user === undefined || profile === undefined;
  
  const role = profile?.activeRole || profile?.role || "user";
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-xl">Peluquería</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/" activeOptions={{ exact: true }} className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Inicio</Link>
            
            {/* Vista para Clientes */}
            {(!profile || role === "user") && (
              <Link to="/dashboard" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Mis Citas</Link>
            )}

            {/* Vista para Barberos */}
            {role === "barber" && (
              <>
                <Link to="/dashboard" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Agenda</Link>
                <Link to="/barber" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Menú</Link>
              </>
            )}

            {/* Vista para Administradores */}
            {role === "admin" && (
              <>
                <Link to="/admin" activeOptions={{ exact: true }} className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Panel</Link>
                <Link to="/admin/services" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Catálogo</Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          {!isLoading && (
            user ? (
              <div className="hidden sm:block">
                <UserMenu />
              </div>
            ) : (
              <div className="w-fit">
                <GoogleAuthButton mode="signin" />
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
