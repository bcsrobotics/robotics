// BCS Robotics service worker
// Provides basic offline support and enables "Add to Home Screen" installability.

const CACHE_NAME = 'bcsrobotics-cache-v1';

// Install: activate immediately without waiting for old tabs to close
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// Activate: clean up any old cache versions
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, falling back to cache when offline.
// Successful responses are cached as they're fetched, so previously
// visited pages remain available without a connection.
self.addEventListener('fetch', function (event) {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('index.html');
        });
      })
  );
});
