/**
 * MISSAV-J — Modular Ads System
 * Mengelola konfigurasi Adsterra popunder, loading banner dinamis di SPA
 * untuk provider Adsterra & ExoClick, dan transparansi overlay di video player.
 */

import ui from './ui.js';

// ==========================================
// HIJACK CLICK LISTENERS FOR POPUNDER BOUNDS
// ==========================================
// Membungkus seluruh event listener klik tingkat dokumen/window yang didaftarkan 
// oleh script eksternal (Adsterra) agar HANYA berfungsi di halaman watch page.
(function hijackExternalClickListeners() {
  const originalAddDoc = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'click') {
      const stack = new Error().stack || '';
      // Saring ads.js dari stack trace untuk mencari pemanggil asli
      const filteredStack = stack.split('\n').filter(line => !line.includes('ads.js')).join('\n');
      const isLocalCaller = filteredStack.includes('/assets/js/');
      
      // Jika dipanggil oleh script luar (tidak mengandung path file JS lokal kita)
      if (stack && !isLocalCaller) {
        const wrappedListener = function(event) {
          // Hanya izinkan eksekusi popunder jika sedang berada di watch page (/watch)
          if (window.missavJState && window.missavJState.currentPath === '/watch') {
            return listener.call(this, event);
          }
          console.log('[Ads] Popunder click blocked because current path is not watch page:', window.missavJState?.currentPath);
        };
        wrappedListener._original = listener;
        return originalAddDoc.call(this, type, wrappedListener, options);
      }
    }
    return originalAddDoc.call(this, type, listener, options);
  };

  const originalAddWin = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === 'click') {
      const stack = new Error().stack || '';
      const filteredStack = stack.split('\n').filter(line => !line.includes('ads.js')).join('\n');
      const isLocalCaller = filteredStack.includes('/assets/js/');
      
      if (stack && !isLocalCaller) {
        const wrappedListener = function(event) {
          if (window.missavJState && window.missavJState.currentPath === '/watch') {
            return listener.call(this, event);
          }
          console.log('[Ads] Popunder click blocked because current path is not watch page:', window.missavJState?.currentPath);
        };
        wrappedListener._original = listener;
        return originalAddWin.call(this, type, wrappedListener, options);
      }
    }
    return originalAddWin.call(this, type, listener, options);
  };
})();

// Konfigurasi Kunci Iklan
window.missavJAdConfig = {
  popunderEnabled: true,
  // Tentukan provider banner: 'exoclick' atau 'adsterra'
  bannerProvider: 'exoclick',
  // Ganti placeholder dengan Key asli (Adsterra) atau Zone ID asli (ExoClick) dari dashboard Anda
  topBannerKey: '5933300',
  belowPlayerBannerKey: '5933316',
  sidebarBannerKey: '5933316'
};

/**
 * Memuat banner ExoClick secara dinamis menggunakan iframe (Aman untuk SPA & Bebas document.write)
 */
export function loadExoClickBanner(containerId, zoneId, width, height) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  // Jika kunci masih berbentuk placeholder, tampilkan placeholder premium bermotif dark mode neon
  if (!zoneId || String(zoneId).startsWith('placeholder_')) {
    container.innerHTML = `
      <div class="premium-ad-placeholder" style="max-width: ${width}px; height: ${height}px; margin: 0 auto; width: 100%;">
        <div class="ad-placeholder-glow"></div>
        <div class="ad-placeholder-content">
          <span class="ad-badge">EXOCLICK SLOT</span>
          <span class="ad-size">${width} × ${height}</span>
          <span class="ad-hint">Trafik Tinggi & Responsif</span>
        </div>
      </div>
    `;
    return;
  }

  // Load via Iframe syndication ExoClick untuk kompatibilitas SPA penuh
  const iframe = document.createElement('iframe');
  iframe.src = `https://a.magsrv.com/iframe.php?idzone=${zoneId}&size=${width}x${height}`;
  iframe.width = width;
  iframe.height = height;
  iframe.scrolling = 'no';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';

  container.appendChild(iframe);
}

/**
 * Memuat banner Adsterra secara dinamis di container tertentu
 */
export function loadAdsterraBanner(containerId, key, width, height) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Kosongkan container lama
  container.innerHTML = '';

  // Jika kunci masih berbentuk placeholder, tampilkan placeholder premium bermotif dark mode neon
  if (!key || key.startsWith('placeholder_')) {
    container.innerHTML = `
      <div class="premium-ad-placeholder" style="max-width: ${width}px; height: ${height}px; margin: 0 auto; width: 100%;">
        <div class="ad-placeholder-glow"></div>
        <div class="ad-placeholder-content">
          <span class="ad-badge">ADSTERRA SLOT</span>
          <span class="ad-size">${width} × ${height}</span>
          <span class="ad-hint">Trafik Tinggi & Responsif</span>
        </div>
      </div>
    `;
    return;
  }

  // Load Script Konfigurasi Adsterra secara dinamis
  const configScript = document.createElement('script');
  configScript.type = 'text/javascript';
  configScript.text = `
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  `;
  container.appendChild(configScript);

  // Load Script Invocation Adsterra secara dinamis
  const invokeScript = document.createElement('script');
  invokeScript.type = 'text/javascript';
  invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
  
  // Tangani kegagalan load (misal karena adblocker aktif)
  invokeScript.onerror = () => {
    container.innerHTML = `
      <div class="premium-ad-placeholder ad-blocked" style="max-width: ${width}px; height: ${height}px; margin: 0 auto; width: 100%;">
        <div class="ad-placeholder-content">
          <span class="ad-badge error">BLOCKED</span>
          <span class="ad-size">AD BLOCKER ACTIVE</span>
          <span class="ad-hint">Harap matikan adblocker Anda untuk mendukung kami</span>
        </div>
      </div>
    `;
  };

  container.appendChild(invokeScript);
}

/**
 * Fungsi pembungkus umum untuk memuat iklan banner berdasarkan provider terpilih
 */
export function loadAdBanner(containerId, key, width, height) {
  const cfg = window.missavJAdConfig;
  if (cfg.bannerProvider === 'exoclick') {
    loadExoClickBanner(containerId, key, width, height);
  } else {
    loadAdsterraBanner(containerId, key, width, height);
  }
}

/**
 * Menginisialisasi klik pelindung transparan di atas player untuk pemicu popunder
 */
export function initPlayerAdOverlay() {
  const adOverlay = document.getElementById('player-ad-overlay');
  if (!adOverlay) return;

  // Tampilkan kembali overlay transparan setiap memuat video baru
  adOverlay.classList.remove('hidden');

  // Bersihkan event listener lama jika ada (menghindari duplikasi callback)
  const newOverlay = adOverlay.cloneNode(true);
  adOverlay.parentNode.replaceChild(newOverlay, adOverlay);

  newOverlay.addEventListener('click', (e) => {
    console.log('[Ads] Popunder triggered on player first click.');

    // Sembunyikan pelindung transparan dengan efek transisi cepat
    newOverlay.classList.add('hidden');
  });
}

/**
 * Menginisialisasi pemuatan script popunder Adsterra secara dinamis di watch page
 */
export function initAdsterraPopunder() {
  const cfg = window.missavJAdConfig;
  if (!cfg.popunderEnabled) return;

  // Hindari memuat ulang jika script sudah ada di DOM
  if (document.getElementById('adsterra-popunder-script')) return;

  console.log('[Ads] Loading Adsterra popunder script dynamically on watch page...');
  const script = document.createElement('script');
  script.id = 'adsterra-popunder-script';
  script.src = 'https://glamournakedemployee.com/42/94/4e/42944edee184893535ddfd1e20e98e81.js';
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Memuat seluruh iklan halaman tontonan video secara paralel
 */
export function loadWatchPageAds() {
  const cfg = window.missavJAdConfig;
  
  // Tentukan lebar responsif di bawah player (728x90 di desktop, 300x250 di mobile)
  const isMobile = window.innerWidth < 768;
  const belowPlayerWidth = isMobile ? 300 : 728;
  const belowPlayerHeight = isMobile ? 250 : 90;
  const belowPlayerKey = isMobile ? cfg.belowPlayerBannerKey : (cfg.topBannerKey || cfg.belowPlayerBannerKey);

  loadAdBanner('below-player-ad', belowPlayerKey, belowPlayerWidth, belowPlayerHeight);
  loadAdBanner('sidebar-ad', cfg.sidebarBannerKey, 300, 250);
  initPlayerAdOverlay();
  
  // Muat script popunder Adsterra secara dinamis
  initAdsterraPopunder();
}

/**
 * Memuat iklan global top banner di list feed
 */
export function loadGlobalTopAd() {
  const cfg = window.missavJAdConfig;
  const isMobile = window.innerWidth < 768;
  const width = isMobile ? 320 : 728;
  const height = isMobile ? 50 : 90;
  
  loadAdBanner('global-top-ad', cfg.topBannerKey, width, height);
}

// Ekspos secara global di namespace window untuk kemudahan integrasi dengan routing SPA
window.missavJAds = {
  loadAdBanner,
  loadExoClickBanner,
  loadAdsterraBanner,
  initPlayerAdOverlay,
  loadWatchPageAds,
  loadGlobalTopAd,
  initAdsterraPopunder
};
