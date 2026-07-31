const CACHE_NAME = 'missavj-cache-v2.8.23';
const ASSETS_TO_CACHE = [
  '/assets/css/components.css?v=2.8.23',
  '/assets/css/base.css?v=2.8.23',
  '/assets/css/layout.css?v=2.8.23',
  '/assets/css/player.css?v=2.8.23',
  '/assets/js/app.js?v=2.8.23',
  '/assets/js/api.js?v=2.8.23',
  '/assets/js/feed.js?v=2.8.23',
  '/assets/js/i18n.js?v=2.8.23',
  '/assets/js/player.js?v=2.8.23',
  '/assets/js/ui.js?v=2.8.23',
  '/assets/js/ads.js?v=2.8.23',
  '/assets/js/analytics.js?v=2.8.23',
  '/assets/js/referral.js?v=2.8.23',
  '/assets/images/logo.webp',
  '/favicon.svg'
];
// PENTING: index.html, manifest.json, dan sw.js SENGAJA TIDAK di-cache
// agar script iklan Adsterra selalu dimuat ulang fresh dari server.

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

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // === CRITICAL FOR AD REVENUE ===
  // Script jaringan iklan (Adsterra) TIDAK boleh di-cache oleh Service Worker.
  // Script iklan berisi kode bidding real-time yang harus selalu diambil fresh dari server.
  // Men-cache script ini menyebabkan tayangan tidak terhitung & CPM turun drastis.
  const AD_NETWORK_DOMAINS = [
    'glamournakedemployee.com',
    'a.adnxs.com',
    's.magsrv.com',
    'a.magsrv.com',
    'syndication.adsterra.com',
  ];
  if (AD_NETWORK_DOMAINS.some(d => url.hostname.includes(d))) {
    // Network Only — jangan pernah cache script iklan
    event.respondWith(fetch(event.request));
    return;
  }

  // === CRITICAL FOR AD REVENUE ===
  // index.html WAJIB selalu diambil dari network (Network First).
  // Karena script Popunder & Social Bar Adsterra ada di dalam index.html,
  // jika index.html di-cache dan dikembalikan dari cache (stale),
  // browser tidak akan memuat ulang script iklan sehingga Popunder & Social Bar MENGHILANG.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html')) // Fallback ke cache HANYA jika offline
    );
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

  // Static Assets (CSS, JS, images): Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
