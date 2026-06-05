import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@v1_peluqueria/ui/components/theme-provider";

import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import { registerServiceWorker } from "@/lib/service-worker";

import Header from "../components/header";
import MobileNav from "../components/mobile-nav";
import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Barber Studio" },
      { name: "description", content: "Agenda PWA instalable para clientes, barberos y administradores de Kawz Barber Studio." },
      { name: "theme-color", content: "#0f0f10" },
      { name: "color-scheme", content: "light dark" },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Kawz Barber" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    try {
      const token = await getAuth();
      if (token) {
        ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
      }
      return { isAuthenticated: !!token, token };
    } catch {
      return { isAuthenticated: false, token: null };
    }
  },
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ConvexBetterAuthProvider
            client={context.convexQueryClient.convexClient}
            authClient={authClient}
            initialToken={context.token}
          >
            <div className="grid h-svh grid-rows-[auto_1fr_auto] sm:grid-rows-[auto_1fr]">
              <Header />
              <div className="overflow-y-auto">
                <Outlet />
              </div>
              <MobileNav />
            </div>
            <Toaster richColors theme="dark" position="top-right" closeButton />
            <TanStackRouterDevtools position="bottom-right" />
          </ConvexBetterAuthProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
