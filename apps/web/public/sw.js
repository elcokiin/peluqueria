const CACHE_NAME = "barberstudio-offline-v2";
const APP_SHELL = [
  "/",
  "/book",
  "/appointments",
  "/barber",
  "/admin",
  "/manifest.json",
  "/logo.jpg",
  "/icons/app-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/screenshots/mis-citas-pwa.png",
];

const VITE_DEV_PREFIXES = ["/src/", "/@vite/", "/@react-refresh", "/node_modules/", "/__vite_ping"];

function isViteDevRequest(url) {
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return isLocalhost && VITE_DEV_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function canCacheResponse(response) {
  return response && response.ok && response.type === "basic";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isViteDevRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (canCacheResponse(response)) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedRoute = await caches.match(request);
          return cachedRoute || caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (canCacheResponse(response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch((error) => {
          if (cached) return cached;
          throw error;
        });

      return cached || network;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Recordatorio de cita";
  const options = {
    body: data.body || "Tienes una cita próxima en Barber Studio.",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag || "appointment-reminder",
    data: {
      url: data.url || "/appointments",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/appointments";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
