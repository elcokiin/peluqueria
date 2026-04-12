import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import UserMenu from "./user-menu";
import { GoogleAuthButton } from "./google-auth-button";

export default function Header() {
  const user = useQuery(api.auth.getCurrentUser);
  const isLoading = user === undefined;
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">Peluquería</span>
        </Link>

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
