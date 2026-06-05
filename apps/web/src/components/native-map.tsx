import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const ROUTING_URL = "https://router.project-osrm.org/route/v1/driving";

export interface RouteInfo {
  distance: number;
  duration: number;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} h ${m} min`;
}

function createPinIcon(theme: "light" | "dark") {
  const isDark = theme === "dark";
  const ringColor = isDark ? "#0a0a0a" : "#ffffff";
  const shadow = isDark
    ? "0 4px 10px rgba(0,0,0,0.55)"
    : "0 3px 8px rgba(0,0,0,0.30)";

  return L.divIcon({
    className: "kawz-pin",
    html: `
      <div style="position:relative;width:26px;height:34px;filter:drop-shadow(${shadow});">
        <svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="kawzPinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#34d399"/>
              <stop offset="100%" stop-color="#059669"/>
            </linearGradient>
          </defs>
          <path d="M13 1C6.4 1 1 6.4 1 13c0 8.5 12 20 12 20s12-11.5 12-20C25 6.4 19.6 1 13 1z"
            fill="url(#kawzPinGrad)" stroke="${ringColor}" stroke-width="1.8"/>
          <circle cx="13" cy="13" r="4.2" fill="${ringColor}"/>
        </svg>
      </div>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 33],
    popupAnchor: [0, -30],
  });
}

function createUserIcon(theme: "light" | "dark") {
  const isDark = theme === "dark";
  const fill = "#3b82f6";
  return L.divIcon({
    className: "kawz-user",
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:-4px;border-radius:9999px;background:${fill};opacity:0.25;animation:kawz-pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;inset:0;border-radius:9999px;background:${fill};border:2.5px solid ${isDark ? "#0a0a0a" : "#ffffff"};box-sizing:border-box;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export type Theme = "light" | "dark";

interface NativeMapProps {
  center: [number, number];
  zoom?: number;
  theme: Theme;
  showRoute: boolean;
  onRouteLoaded?: (info: RouteInfo) => void;
  onRouteCleared?: () => void;
  onError?: (msg: string) => void;
}

export default function NativeMap({
  center,
  zoom = 16,
  theme,
  showRoute,
  onRouteLoaded,
  onRouteCleared,
  onError,
}: NativeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [ready, setReady] = useState(false);
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    L.marker(center, { icon: createPinIcon(theme), title: "Kawz Barber Studio" })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:170px;">
           <strong style="font-size:13px;color:#0a0a0a;">Kawz Barber Studio</strong><br/>
           <span style="font-size:11px;color:#555;">Avenida Universitaria 47-12</span><br/>
           <span style="font-size:11px;color:#555;">Tunja, Boyacá</span>
         </div>`
      );

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setReady(true);

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.options.title === "Kawz Barber Studio") {
        layer.setIcon(createPinIcon(theme));
      }
      if (layer instanceof L.Marker && layer.options.title === "user-location") {
        layer.setIcon(createUserIcon(theme));
      }
    });
  }, [theme]);

  const clearRoute = () => {
    if (routeLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (userMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
    onRouteCleared?.();
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (!showRoute) {
      if (routeLineRef.current) {
        mapRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      onError?.("Tu dispositivo no soporta geolocalización.");
      return;
    }

    setRouting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mapRef.current) return;
        const userPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(userPos);
        } else {
          userMarkerRef.current = L.marker(userPos, {
            icon: createUserIcon(theme),
            title: "user-location",
          })
            .addTo(mapRef.current)
            .bindPopup("Estás aquí");
        }

        try {
          const url = `${ROUTING_URL}/${userPos[1]},${userPos[0]};${center[1]},${center[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("routing failed");
          const data = await res.json();
          if (!data.routes || data.routes.length === 0) throw new Error("no route");

          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );

          if (routeLineRef.current) {
            mapRef.current.removeLayer(routeLineRef.current);
          }
          routeLineRef.current = L.polyline(coords, {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapRef.current);

          const isDark = theme === "dark";
          routeLineRef.current.setStyle({
            color: isDark ? "#60a5fa" : "#2563eb",
          });

          const bounds = L.latLngBounds([userPos, center, ...coords]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });

          onRouteLoaded?.({
            distance: route.distance,
            duration: route.duration,
          });
        } catch {
          onError?.("No pudimos calcular la ruta. Intenta de nuevo.");
        } finally {
          setRouting(false);
        }
      },
      () => {
        setRouting(false);
        onError?.("No pudimos obtener tu ubicación.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showRoute]);

  const locateUser = () => {
    if (!mapRef.current) return;
    if (!navigator.geolocation) {
      onError?.("Tu dispositivo no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current) return;
        const userPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(userPos);
        } else {
          userMarkerRef.current = L.marker(userPos, {
            icon: createUserIcon(theme),
            title: "user-location",
          })
            .addTo(mapRef.current)
            .bindPopup("Estás aquí");
        }
        mapRef.current.setView(userPos, 16, { animate: true });
      },
      () => onError?.("No pudimos obtener tu ubicación."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ background: theme === "dark" ? "#1a1a1a" : "#e5e7eb" }}
        aria-label="Mapa interactivo de la ubicación del estudio"
        role="region"
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-[12px] text-muted-foreground">
          Cargando mapa…
        </div>
      )}
      {showRoute && (
        <button
          type="button"
          onClick={clearRoute}
          aria-label="Cerrar ruta"
          className="absolute right-3 top-3 z-[400] flex size-9 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      )}
      {!showRoute && (
        <button
          type="button"
          onClick={locateUser}
          aria-label="Centrar en mi ubicación"
          className="absolute right-3 top-3 z-[400] flex size-9 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}
      {routing && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-md backdrop-blur">
          Calculando ruta…
        </div>
      )}
      <style>{`
        @keyframes kawz-pulse {
          0% { transform: scale(0.7); opacity: 0.55; }
          100% { transform: scale(2.3); opacity: 0; }
        }
        .leaflet-container { font-family: 'Inter', system-ui, sans-serif; }
        .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,0.85) !important; }
        .dark .leaflet-control-attribution { background: rgba(10,10,10,0.85) !important; color: #d4d4d8 !important; }
        .dark .leaflet-control-attribution a { color: #34d399 !important; }
        .leaflet-control-zoom a { border-radius: 9999px !important; width: 32px !important; height: 32px !important; line-height: 32px !important; font-size: 18px !important; }
        .kawz-pin { background: transparent !important; border: 0 !important; }
        .kawz-user { background: transparent !important; border: 0 !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; padding: 6px 10px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { box-shadow: none !important; }
        @media (prefers-color-scheme: dark) {
          .leaflet-tile-pane { filter: brightness(0.85) invert(1) contrast(0.85) hue-rotate(180deg) saturate(0.6) brightness(0.9); }
        }
      `}</style>
    </div>
  );
}

export { formatDistance, formatDuration };
