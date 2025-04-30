const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', evt => {
  const url = evt.request.url;

  // API calls: network-first
  if (url.includes('/api/')) {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(evt.request, res.clone());
            return res;
          });
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // Static assets: cache-first
  evt.respondWith(
    caches.match(evt.request)
      .then(resp => resp || fetch(evt.request))
  );
});