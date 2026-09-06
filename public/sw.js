const SHELL_CACHE_NAME = "openbiofigure-__OPENBIOFIGURE_CACHE_REVISION__";
const ASSET_CACHE_NAME =
  "openbiofigure-assets-__OPENBIOFIGURE_ASSET_CACHE_REVISION__";
const ASSET_CACHE_LIMIT = 200;
const PRECACHE_FILES = ["__OPENBIOFIGURE_PRECACHE__"];

async function precacheApplication() {
  const cache = await caches.open(SHELL_CACHE_NAME);
  const precacheUrls = new Set([
    new URL("./", self.registration.scope).href,
    new URL("./index.html", self.registration.scope).href,
    new URL("./app/", self.registration.scope).href,
    new URL("./app/index.html", self.registration.scope).href,
    new URL("./download/", self.registration.scope).href,
    new URL("./download/index.html", self.registration.scope).href,
    new URL("./manifest.webmanifest", self.registration.scope).href,
    new URL("./icon.svg", self.registration.scope).href,
    ...PRECACHE_FILES.map(
      (file) => new URL(file, self.registration.scope).href,
    ),
  ]);
  await cache.addAll([...precacheUrls]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheApplication());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("openbiofigure-") &&
              key !== SHELL_CACHE_NAME &&
              key !== ASSET_CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isScientificAsset =
    url.origin === self.location.origin &&
    /\/assets\/[^/]+\.svg$/i.test(url.pathname);

  if (isScientificAsset) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request, { ignoreVary: true });
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put(event.request, response.clone());
          const keys = await cache.keys();
          await Promise.all(
            keys
              .slice(0, Math.max(0, keys.length - ASSET_CACHE_LIMIT))
              .map((request) => cache.delete(request)),
          );
        }
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request, { ignoreVary: true })
      .then((cached) => cached ?? fetch(event.request)),
  );
});
