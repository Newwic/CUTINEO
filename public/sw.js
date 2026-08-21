const CACHE_NAME = 'cutineo-shell-v1';

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

function isPublicAsset(url) {
  const scopePath = new URL(self.registration.scope).pathname;
  return url.origin === self.location.origin && (
    url.pathname.startsWith(`${scopePath}_next/static/`)
    || url.pathname.startsWith(`${scopePath}assets/`)
    || url.pathname.startsWith(`${scopePath}icons/`)
    || url.pathname.endsWith('/manifest.webmanifest')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      scopedUrl('offline.html'),
      scopedUrl('manifest.webmanifest'),
      scopedUrl('icons/icon-192.png'),
      scopedUrl('icons/icon-512.png'),
      scopedUrl('icons/icon-maskable-512.png'),
      scopedUrl('icons/apple-touch-icon.png'),
      scopedUrl('assets/logo-neo.png'),
    ])),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(scopedUrl('offline.html'))),
    );
    return;
  }

  if (isPublicAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
  }
});
