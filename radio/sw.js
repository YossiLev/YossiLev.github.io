const CACHE_NAME = 'radio-app-v2';
const SHELL_FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'logos/station1.png',
  'logos/station2.png',
  'logos/station3.png',
  'logos/station4.png',
  'logos/station5.png',
  'logos/station6.png',
  'logos/station7.png',
  'logos/station8.png',
  'logos/station9.png',
  'logos/station10.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never touch cross-origin requests (radio streams) — always go to network.
  if (url.origin !== self.location.origin) {
    return;
  }

  // App shell: cache-first, fall back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
