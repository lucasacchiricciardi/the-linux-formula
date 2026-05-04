const CACHE_NAME = 'tlf-v1';
const BASE_PATH = location.pathname.replace(/\/[^/]*$/, '') || '';
const ASSETS_TO_CACHE = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/main.js',
  BASE_PATH + '/newsWorker.js',
  BASE_PATH + '/sw.js',
  BASE_PATH + '/favicon.svg',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/news/news-feed.json',
  BASE_PATH + '/feed.xml',
  BASE_PATH + '/version.txt',
  BASE_PATH + '/robots.txt',
  BASE_PATH + '/sitemap.xml'
];

// Install event - cache assets (individual to handle missing files gracefully)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(function(url) {
          return fetch(url).then(function(response) {
            if (response.ok) {
              cache.put(url, response);
            }
          }).catch(function() {
            // Ignore individual failures
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Clone the response
        var responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(function() {
        // Fallback to cache
        return caches.match(event.request).then(function(response) {
          return response || caches.match(BASE_PATH + '/');
        });
      })
  );
});