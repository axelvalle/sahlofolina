const CACHE_VERSION = "sahlo-folina-account-cache-v4";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CORE = [
  "/index.html",
  "/styles.css?v=20260809-account-cache-v4",
  "/app.js?v=20260809-account-cache-v4",
  "/library.js?v=20260809-account-cache-v4",
  "/content/framework/runtime.js?v=20260809-account-cache-v4",
  "/content/framework/routes.js?v=20260809-account-cache-v4",
  "/content/parte-1/parte1.runtime.js?v=20260809-account-cache-v4",
  "/content/parte-2/parte2.runtime.js?v=20260809-account-cache-v4",
  "/content/parte-3/parte3.runtime.js?v=20260809-account-cache-v4",
  "/content/parte-4/parte4.runtime.js?v=20260809-account-cache-v4",
  "/content/parte-5/parte5.runtime.js?v=20260809-account-cache-v4",
  "/content/parte-6/parte6.runtime.js?v=20260809-account-cache-v4",
  "/content/extras/extras.runtime.js?v=20260809-account-cache-v4",
  "/assets/twenty-one-pilots-icon.webp",
  "/assets/cover-dema.webp",
  "/assets/social/sahlo-folina-og.webp",
  "/assets/cover-trench.webp",
  "/assets/cover-sai parte 3.webp",
  "/assets/parte-4/dema-nocturna.webp",
  "/assets/parte-4/habitacion-azul.webp",
  "/assets/parte-5/parte-v-mapa.webp",
  "/assets/parte-5/indice-voldsoy.webp",
  "/assets/parte-5/arco-1-indice.webp",
  "/assets/parte-5/arco-1-portada.webp",
  "/assets/parte-5/arco-2-portada.webp",
  "/assets/parte-5/arco-3-portada.webp",
  "/assets/parte-5/dema-distancia.webp",
  "/assets/parte-6/the-contract-cover.webp",
  "/assets/parte-6/the-contract-index.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match("/index.html"));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request, { cache: "no-store" })
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/downloads/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(?:css|js|webp)$/i.test(url.pathname) || url.pathname.includes("/content/")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
