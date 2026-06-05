import { useEffect, useState } from "react";
import { MapPin, Navigation, Copy, Check, Clock, Route, ExternalLink } from "lucide-react";

import { Card, CardContent } from "@v1_peluqueria/ui/components/card";
import { Button } from "@v1_peluqueria/ui/components/button";
import { Badge } from "@v1_peluqueria/ui/components/badge";
import NativeMap, {
  type Theme,
  type RouteInfo,
  formatDistance,
  formatDuration,
} from "./native-map";

const ADDRESS = "Avenida Universitaria 47-12, Centro Comercial Toto Centro";
const CITY = "Tunja, Boyacá 15000";
const FULL_ADDRESS = `${ADDRESS}, ${CITY}, Colombia`;
const COORDS: [number, number] = [5.5397, -73.3614];

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const hasTouch = navigator.maxTouchPoints > 1;
  const smallViewport = window.innerWidth <= 1024 && hasTouch;
  return isAndroid || isIOS || smallViewport;
}

function buildExternalMapsUrl(): string {
  const dest = `${COORDS[0]},${COORDS[1]}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${encodeURIComponent("Kawz Barber Studio")}`;
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function LocationMap() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const openInGoogleMaps = () => {
    const url = buildExternalMapsUrl();
    const mobile = isMobileDevice();

    if (mobile) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const toggleRoute = () => {
    if (showRoute) {
      setShowRoute(false);
      setRouteInfo(null);
    } else {
      setRouteInfo(null);
      setShowRoute(true);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(FULL_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copia la dirección:", FULL_ADDRESS);
    }
  };

  return (
    <section
      aria-label="Ubicación del estudio"
      className="mt-6 px-4"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[14px] font-medium text-foreground">
          Nuestra Ubicación
        </h2>
        <Badge
          variant="secondary"
          className="rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-600/10"
        >
          <Clock className="mr-1 size-3" />
          Lun - Sáb · 9:00 a.m. - 7:00 p.m.
        </Badge>
      </div>

      <Card className="overflow-hidden rounded-[0.8rem] border border-border bg-card shadow-none">
        <div className="relative h-64 w-full overflow-hidden border-b border-border bg-muted">
          {mounted ? (
            <NativeMap
              center={COORDS}
              zoom={16}
              theme={theme}
              showRoute={showRoute}
              onRouteLoaded={setRouteInfo}
              onRouteCleared={() => setRouteInfo(null)}
              onError={setToastMsg}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] text-muted-foreground">
              Cargando mapa…
            </div>
          )}
          {toastMsg && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-md backdrop-blur">
              {toastMsg}
            </div>
          )}
        </div>

        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-tight text-foreground">
                {ADDRESS}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {CITY}
              </p>
              {showRoute && routeInfo && (
                <div className="mt-1.5 flex items-center gap-3 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  <span className="flex items-center gap-1">
                    <Route className="size-3" />
                    {formatDistance(routeInfo.distance)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="size-3" />
                    {formatDuration(routeInfo.duration)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={toggleRoute}
              variant={showRoute ? "default" : "default"}
              className="h-10 flex-1 rounded-lg text-[13px] font-semibold"
            >
              {showRoute ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1.5"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                  Cerrar ruta
                </>
              ) : (
                <>
                  <Route className="mr-1.5 size-4" />
                  Ver ruta
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={openInGoogleMaps}
              aria-label="Abrir en Google Maps"
              title="Abrir en Google Maps"
              className="h-10 w-10 shrink-0 rounded-lg"
            >
              <ExternalLink className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyAddress}
              aria-label="Copiar dirección"
              className="h-10 w-10 shrink-0 rounded-lg"
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
