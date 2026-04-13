import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import UserMenu from "./user-menu";
import { Home, Calendar, Scissors, Settings, LayoutDashboard, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { useEffect, useRef } from "react";

export default function MobileNav() {
  const profile = useQuery(api.users.currentProfile);
  const isLoading = profile === undefined;
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active role (fallback to 'user' if not logged in yet)
  const role = profile?.activeRole || profile?.role || "user";

  // Touch handlers for swipe navigation
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Determine the available tabs based on the role
    const getRoutesForRole = (r: string) => {
      if (r === "admin") return ["/", "/admin", "/admin/services"];
      if (r === "barber") return ["/", "/dashboard", "/barber"];
      return ["/", "/dashboard"];
    };

    const routes = getRoutesForRole(role);
    const currentIndex = routes.indexOf(location.pathname);

    // Only handle swipes on main tab routes
    if (currentIndex === -1) return;

    const onTouchStart = (e: TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;

      const dx = touchStart.current.x - touchEnd.current.x;
      const dy = touchStart.current.y - touchEnd.current.y;

      const minSwipeDistance = 50;

      // Ensure mostly horizontal swipe
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
        if (dx > 0 && currentIndex < routes.length - 1) {
          // Swipe left -> go right
          navigate({ to: routes[currentIndex + 1] });
        } else if (dx < 0 && currentIndex > 0) {
          // Swipe right -> go left
          navigate({ to: routes[currentIndex - 1] });
        }
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [role, location.pathname, navigate]);

  return (
    <div className="sm:hidden border-t bg-background flex items-center justify-around px-2 py-3 pb-safe">
      <Link
        to="/"
        activeOptions={{ exact: true }}
        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
      >
        <Home className="h-5 w-5" />
        <span className="text-[10px]">Inicio</span>
      </Link>

      {/* Vista para Clientes (Usuarios regulares) */}
      {(!profile || role === "user") && (
        <Link
          to="/dashboard"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px]">Mis Citas</span>
        </Link>
      )}

      {/* Vista para Barberos */}
      {role === "barber" && (
        <>
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px]">Agenda</span>
          </Link>
          <Link
            to="/barber"
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
          >
            <Scissors className="h-5 w-5" />
            <span className="text-[10px]">Menú</span>
          </Link>
        </>
      )}

      {/* Vista para Administradores */}
      {role === "admin" && (
        <>
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Panel</span>
          </Link>
          <Link
            to="/admin/services"
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:font-medium transition-all"
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Catálogo</span>
          </Link>
        </>
      )}

      {!isLoading && (
        <div className="flex flex-col items-center gap-1">
          {profile ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => authClient.signIn.social({ provider: "google" })}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-all"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px]">Ingresar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}