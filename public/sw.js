const CACHE = "what-to-eat-v16-static";
const BASE = self.registration.scope.replace(self.location.origin, "").replace(/\/$/, "");
const HOME = BASE + "/";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([HOME])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Places content may not be stored offline. Cache only our static shell/assets.
  if (url.origin !== self.location.origin || url.pathname.startsWith(BASE + "/api/")) return;
  if (!["document", "script", "style", "image", "font"].includes(event.request.destination)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match(HOME)))
  );
});
