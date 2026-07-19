const CACHE_NAME = 'missavj-cache-v2.5.5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/components.css?v=2.5.5',
  '/assets/css/main.css?v=2.5.5',
  '/assets/css/base.css?v=2.5.5',
  '/assets/css/layout.css?v=2.5.5',
  '/assets/css/player.css?v=2.5.5',
  '/assets/js/app.js?v=2.5.5',
  '/assets/js/api.js?v=2.5.5',
  '/assets/js/feed.js?v=2.5.5',
  '/assets/js/i18n.js?v=2.5.5',
  '/assets/js/player.js?v=2.5.5',
  '/assets/js/ui.js?v=2.5.5',
  '/assets/js/ads.js?v=2.5.5',
  '/assets/js/analytics.js?v=2.5.5',
  '/assets/js/referral.js?v=2.5.5',
  '/assets/images/logo.png',
  '/favicon.svg'
];

// Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate strategy for API, Cache First for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // API Requests: Network First, fallback to Cache
  if (url.origin === 'https://server.apijav.com' || (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/image'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open('missavj-api-cache').then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static Assets & App Shell: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache dynamically fetched assets (like lazy loaded images or chunks)
        if (response && response.status === 200 && response.type === 'basic') {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: Serve index.html for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
