/* Service worker: deja la app completa guardada en el teléfono.
   Estrategia: responde desde caché (funciona sin red) y, si hay red,
   baja la versión nueva en segundo plano para la próxima apertura. */
const CACHE = "qr-cajas-v5";
const ARCHIVOS = ["./", "./index.html", "./jsQR.js", "./sjcl.js", "./zxing.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const enCache = await c.match(e.request, { ignoreSearch: true });
      const red = fetch(e.request).then((r) => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
      return enCache || (await red) || new Response("Sin conexión y sin copia local", { status: 503 });
    })
  );
});
