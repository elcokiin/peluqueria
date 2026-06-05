const SERVICE_WORKER_URL = "/sw.js";

export function canUseServiceWorker() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD;
}

async function unregisterServiceWorkersInDevelopment() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.DEV) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export async function getServiceWorkerRegistration() {
  if (!canUseServiceWorker()) return null;

  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    unregisterServiceWorkersInDevelopment().catch((error) => {
      console.error("No se pudieron desregistrar los service workers de desarrollo", error);
    });
    return;
  }

  const register = () => {
    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
      console.error("No se pudo registrar el service worker", error);
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
