// Service worker de Editable · AI Office
// Permite instalar el juego como app. Siempre busca la versión más nueva en internet
// y solo usa la copia guardada si no hay conexión. No guarda nada de tu oficina (la API).
const CACHE = 'ai-office-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
