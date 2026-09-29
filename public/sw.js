const CACHE_NAME = 'nem-pro-cache-v2';
const urlsToCache = [
  '/manifest.json',
  '/planeadorpro.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // El HTML (navegación) siempre va primero a la red, para que cada visita
  // reciba el index.html más reciente (con las referencias correctas a los
  // archivos con hash de la última compilación). Solo cae a caché si no hay
  // conexión.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Los assets compilados (JS/CSS) llevan un hash de contenido en el nombre
  // de archivo, así que si cambian, su URL cambia — es seguro servirlos
  // desde caché primero y solo ir a la red si no están.
  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});
