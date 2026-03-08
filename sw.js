// Stellar Assault — Service Worker
const CACHE = 'stellar-assault-v1';

const PRECACHE = [
  '/stellar-assault/',
  '/stellar-assault/index.html',
  '/stellar-assault/manifest.json',
  '/stellar-assault/icon-192.png',
  '/stellar-assault/icon-512.png',
];

// Install: cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: purge old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin, network-only for cross-origin
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle GET requests from our origin
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Serve from cache, refresh in background
        const refresh = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => {});
        return cached;
      }
      // Not cached — fetch and cache
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
