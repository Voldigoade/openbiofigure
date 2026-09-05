import { isTauri } from "@tauri-apps/api/core";

type ServiceWorkerState = Pick<ServiceWorkerContainer, "getRegistrations">;
type CacheState = Pick<CacheStorage, "delete" | "keys">;

export async function clearDesktopOfflineState(
  serviceWorkers: ServiceWorkerState | undefined,
  cacheStorage: CacheState | undefined,
): Promise<void> {
  const registrations = serviceWorkers
    ? await serviceWorkers.getRegistrations()
    : [];
  const cacheNames = cacheStorage ? await cacheStorage.keys() : [];

  await Promise.all([
    ...registrations.map((registration) => registration.unregister()),
    ...cacheNames.map((cacheName) => cacheStorage?.delete(cacheName)),
  ]);
}

function reportOfflineSetupFailure(error: unknown): void {
  console.warn("OpenBioFigure offline setup could not be completed.", error);
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  if (isTauri()) {
    void clearDesktopOfflineState(
      navigator.serviceWorker,
      "caches" in globalThis ? globalThis.caches : undefined,
    ).catch(reportOfflineSetupFailure);
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("./sw.js")
      .catch(reportOfflineSetupFailure);
  });
}
