const CACHE_NAME = 'nutrition-app-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data_sv.json',
  './data_en.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force new service worker to take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache opened');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', event => {
  // Network-first strategy for JSON data
  if (event.request.url.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response and save it to cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } 
  // Stale-while-revalidate for static assets (CSS, JS, HTML)
  else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          console.log('Network fetch failed, relying on cache.');
        });
        
        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Clear old caches when a new version is activated
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});