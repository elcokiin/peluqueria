import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import UserMenu from "./user-menu";
import { GoogleAuthButton } from "./google-auth-button";
import { useEffect, useState } from "react";
import { Button } from "@v1_peluqueria/ui/components/button";
import { InstallAppButton } from "./install-app-button";

export default function Header() {
  const user = useQuery(api.auth.getCurrentUser);
  const profile = useQuery(api.users.currentProfile);
  const isLoading = user === undefined || profile === undefined;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = profile?.activeRole || profile?.role || "user";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 relative">
        <div className="flex sm:hidden items-center w-full justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Ir al inicio">
            <img src="/icons/icon-512.png" alt="" className="size-9 rounded-lg object-contain" />
            <span className="text-sm font-semibold tracking-tight">Kawz Barber</span>
          </Link>
          <div className="flex-1 flex justify-end gap-2 items-center">
            <InstallAppButton compact />
            {mounted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? (
                  <Sun />
                ) : (
                  <Moon />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 md:gap-8 w-full">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src="/icons/icon-512.png" alt="" className="size-9 rounded-lg object-contain" />
            <span className="text-xl">Kawz Barber</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground mr-auto">
            {(!profile || role === "user") && (
              <>
                <Link to="/book" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Agendar</Link>
                <Link to="/appointments" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Mis Citas</Link>
              </>
            )}

            {role === "barber" && (
              <Link to="/barber" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Menú</Link>
            )}

            {role === "admin" && (
              <>
                <Link to="/admin" activeOptions={{ exact: true }} className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Panel</Link>
                <Link to="/admin/services" className="transition-colors hover:text-foreground [&.active]:text-primary [&.active]:font-semibold">Catálogo</Link>
              </>
            )}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <InstallAppButton compact />
            {mounted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? (
                  <Sun />
                ) : (
                  <Moon />
                )}
              </Button>
            )}
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
      </div>
    </header>
  );
}
