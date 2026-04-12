import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useQuery(api.users.currentProfile);
  
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  useEffect(() => {
    const role = profile?.activeRole || profile?.role || "user";
    
    const getRoutesForRole = (r: string) => {
      if (r === "admin") return ["/", "/admin", "/admin/services"];
      if (r === "barber") return ["/", "/dashboard", "/barber"];
      return ["/", "/dashboard"];
    };

    const routes = getRoutesForRole(role);
    
    // Only apply swipe navigation if we're on one of the main tab routes
    const currentIndex = routes.findIndex(route => location.pathname === route);
    if (currentIndex === -1) return;

    const onTouchStart = (e: TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    };

    const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      
      const distanceX = touchStart.current.x - touchEnd.current.x;
      const distanceY = touchStart.current.y - touchEnd.current.y;
      
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;
      
      // Make sure the swipe is mostly horizontal
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (isLeftSwipe && currentIndex < routes.length - 1) {
          navigate({ to: routes[currentIndex + 1] });
        }
        if (isRightSwipe && currentIndex > 0) {
          navigate({ to: routes[currentIndex - 1] });
        }
      }
    };

    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [profile, location.pathname, navigate]);
}
