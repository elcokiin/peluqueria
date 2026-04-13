import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import UserMenu from "./user-menu";
import { GoogleAuthButton } from "./google-auth-button";
import { useEffect, useState } from "react";

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
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm dark:bg-background/95 dark:backdrop-blur dark:supports-[backdrop-filter]:bg-background/60 text-slate-900 dark:text-foreground">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 relative">
        {/* MOBILE LAYOUT */}
        <div className="flex sm:hidden items-center w-full justify-between">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[8px] leading-tight text-center tracking-tighter">
              BARBER<br />SHOP
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 font-semibold text-[15px]">
            Barbería Pro
          </div>
          <button className="flex items-center justify-center text-slate-800 dark:text-foreground">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden sm:flex items-center gap-6 md:gap-8 w-full">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-xl">Peluquería</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground mr-auto">
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

        <div className="flex flex-1 items-center justify-end gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center cursor-pointer"
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
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
    </header>
  );
}
