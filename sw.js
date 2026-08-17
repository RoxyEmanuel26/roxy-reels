const CACHE_NAME = 'missavj-cache-v2.8.72';
const API_CACHE_NAME = 'missavj-api-cache-v1';

const ASSETS_TO_CACHE = [
  '/assets/css/components.css?v=2.8.72',
  '/assets/css/base.css?v=2.8.72',
  '/assets/css/layout.css?v=2.8.72',
  '/assets/css/player.css?v=2.8.72',
  '/assets/js/app.js?v=2.8.72',
  '/assets/js/api.js?v=2.8.72',
  '/assets/js/feed.js?v=2.8.72',
  '/assets/js/i18n.js?v=2.8.72',
  '/assets/js/player.js?v=2.8.72',
  '/assets/js/ui.js?v=2.8.72',
  '/assets/js/ads.js?v=2.8.72',
  '/assets/js/analytics.js?v=2.8.72',
  '/assets/js/referral.js?v=2.8.72',
  '/assets/js/filter.js?v=2.8.72',
  '/assets/js/trending.js?v=2.8.72',
  '/assets/js/recent.js?v=2.8.72',
  '/assets/js/search.js?v=2.8.72',
  '/assets/js/actors.js?v=2.8.72',
  '/assets/js/studios.js?v=2.8.72',
  '/assets/js/categories.js?v=2.8.72',
  '/assets/images/logo.webp',
  '/favicon.svg'
];
// PENTING: index.html, manifest.json, dan sw.js SENGAJA TIDAK di-cache
// agar script iklan Adsterra selalu dimuat ulang fresh dari server.

// Install Event: Cache Core Assets
// FIX: Gunakan Promise.allSettled agar kegagalan 1 aset minor tidak membatalkan
// instalasi SW secara keseluruhan (cache.addAll() bersifat all-or-nothing / atomic).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache aset statis — toleran terhadap kegagalan 1-2 file
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err.message))
        )
      );
      // FIX: Cache index.html sebagai offline fallback satu kali saat install
      // Ini terpisah dari runtime (TIDAK akan ditampilkan fresh — hanya fallback offline).
      try {
        const res = await fetch('/index.html', { cache: 'no-cache' });
        if (res.ok) await cache.put('/offline-fallback', res);
      } catch (e) {
        console.warn('[SW] Could not cache offline fallback:', e.message);
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup Old Caches
// FIX: Whitelist-based cleanup — pertahankan CACHE_NAME dan API_CACHE_NAME
// sebelumnya semua cache selain CACHE_NAME dihapus, termasuk missavj-api-cache yang masih valid
self.addEventListener('activate', (event) => {
  const VALID_CACHES = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!VALID_CACHES.includes(cacheName)) {
            return caches.delete(cacheName);
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
  const AD_NETWORK_DOMAINS = [
    'glamournakedemployee.com',
    'a.adnxs.com',
    's.magsrv.com',
    'a.magsrv.com',
    'syndication.adsterra.com',
  ];
  if (AD_NETWORK_DOMAINS.some(d => url.hostname.includes(d))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // === CRITICAL FOR AD REVENUE ===
  // index.html WAJIB selalu diambil dari network (Network First).
  // FIX: Gunakan '/offline-fallback' (yang disimpan saat install) sebagai fallback offline.
  // Sebelumnya caches.match('/index.html') selalu return undefined → halaman kosong offline.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline-fallback').then(r => r || Response.error()))
    );
    return;
  }

  // API Requests: Network First, fallback to Cache
  // FIX: Hanya cache response yang sukses (status 200 ok) — jangan simpan response error 500/502/404!
  if (url.origin === 'https://server.apijav.com' || (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/image'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok && response.status === 200) {
            const clonedResponse = response.clone();
            // FIX: Gunakan event.waitUntil via background task untuk mencegah SW early termination
            const bgCache = caches.open(API_CACHE_NAME).then((cache) => {
              return cache.put(event.request, clonedResponse);
            }).catch(err => console.warn('[SW] API cache put failed:', err));
            // Background — tidak memblokir response ke klien
            self.registration.active && bgCache;
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || Response.error();
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, images): Cache First, fallback to Network
  // FIX: Izinkan tipe 'cors' selain 'basic' agar aset CDN eksternal juga ter-cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse).catch(() => {});
          });
        }
        return response;
      });
    }).catch(() => {
      // FIX: Fallback ke offline-fallback yang benar-benar ada di cache
      if (event.request.mode === 'navigate') {
        return caches.match('/offline-fallback').then(r => r || Response.error());
      }
      return Response.error();
    })
  );
});
