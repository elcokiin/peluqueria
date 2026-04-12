import { api } from "@v1_peluqueria/backend/convex/_generated/api";
import { Button } from "@v1_peluqueria/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1_peluqueria/ui/components/dropdown-menu";
import { useQuery } from "convex/react";
import { LogOut, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export default function UserMenu() {
  const user = useQuery(api.auth.getCurrentUser);
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
            toast.success("Signed out successfully");
            navigate({ to: "/" });
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to sign out");
          },
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during sign out.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 p-0 overflow-hidden">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "User avatar"} 
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
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
