const CACHE_NAME = "openbiofigure-__OPENBIOFIGURE_CACHE_REVISION__";
const PRECACHE_FILES = ["__OPENBIOFIGURE_PRECACHE__"];

async function precacheApplication() {
  const cache = await caches.open(CACHE_NAME);
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreVary: true }).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          if (
            response.ok &&
            new URL(event.request.url).origin === self.location.origin
          ) {
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        }),
    ),
  );
});
