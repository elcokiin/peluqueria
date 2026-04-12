import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import UserMenu from "./user-menu";
import { Home, Calendar, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function MobileNav() {
  const user = useQuery(api.auth.getCurrentUser);
  const isLoading = user === undefined;

  return (
    <div className="sm:hidden border-t bg-background flex items-center justify-around px-6 py-3">
      <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
        <Home className="h-5 w-5" />
        <span className="text-[10px]">Inicio</span>
      </Link>
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
        <Calendar className="h-5 w-5" />
        <span className="text-[10px]">Citas</span>
      </Link>
      
      {!isLoading && user && (
        <div className="flex flex-col items-center gap-1">
          <UserMenu />
        </div>
      )}
    </div>
  );
}