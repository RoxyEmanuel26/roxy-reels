/**
 * MISSAV-J — Modular Ads System
 * Mengelola konfigurasi Adsterra popunder, loading banner dinamis di SPA
 * untuk provider Adsterra & ExoClick, dan transparansi overlay di video player.
 */

import ui from './ui.js?v=2.3.0';


// Konfigurasi Kunci Iklan
window.missavJAdConfig = {
  popunderEnabled: false, // JANGAN DIHAPUS: Setel ke true untuk mengaktifkan kembali popunder
  socialBarEnabled: true,
  // Tentukan provider banner: 'exoclick' atau 'adsterra'
  bannerProvider: 'adsterra',
  // Ganti dengan Key asli Adsterra dari dashboard Anda
  topBannerKey: 'bdec847e5576cfc239f93361b9353a34',         // Banner 728x90
  topMobileBannerKey: '9263e17e549b59add0a02c334b7b6b7e',   // Banner 320x50
  belowPlayerBannerKey: '42bf4702a7a9795846258d2f444784f4', // Banner 300x250
  sidebarBannerKey: '42bf4702a7a9795846258d2f444784f4'     // Banner 300x250
};

// Queue untuk memuat iklan berurutan (mencegah konflik atOptions)
let adLoaderPromise = Promise.resolve();

/**
 * Menyesuaikan skala banner yang ditandai scalable agar pas dengan lebar kontainernya
 */
export function adjustScaledBanners() {
  const scaledContainers = document.querySelectorAll('[data-scalable="true"]');
  scaledContainers.forEach(container => {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;
    
    const nativeWidth = parseInt(container.getAttribute('data-native-width')) || 728;
    const nativeHeight = parseInt(container.getAttribute('data-native-height')) || 90;
    
    // Dapatkan lebar parent kontainer untuk presisi tata letak (menghindari overflow)
    const parentWidth = container.parentElement ? container.parentElement.clientWidth : window.innerWidth;
    
    // Kurangi sedikit padding pengaman agar tidak mepet ke tepi layar
    const padding = 16;
    const availableWidth = Math.min(parentWidth - padding, nativeWidth);
    const scaleFactor = availableWidth / nativeWidth;
    
    if (scaleFactor < 1) {
      iframe.style.position = 'absolute';
      iframe.style.left = '50%';
      iframe.style.top = '0';
      iframe.style.transform = `translate(-50%, 0) scale(${scaleFactor})`;
      iframe.style.transformOrigin = 'top center';
      
      const scaledHeight = nativeHeight * scaleFactor;
      container.style.height = `${scaledHeight}px`;
      container.style.minHeight = '0px'; // Bypass stylesheet min-height during scaling
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'flex-start';
    } else {
      // Kembalikan ke default jika tidak perlu di-scale
      iframe.style.position = '';
      iframe.style.left = '';
      iframe.style.top = '';
      iframe.style.transform = '';
      iframe.style.transformOrigin = '';
      
      container.style.height = '';
      container.style.minHeight = ''; // Restore stylesheet min-height
      container.style.position = '';
      container.style.overflow = '';
      container.style.display = '';
      container.style.justifyContent = '';
      container.style.alignItems = '';
    }
  });
}

// Inisialisasi event listener resize global dengan debounce
if (typeof window !== 'undefined') {
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(adjustScaledBanners, 100);
  });
}

/**
 * Memuat banner ExoClick secara dinamis menggunakan iframe (Aman untuk SPA & Bebas document.write)
 */
export function loadExoClickBanner(containerId, zoneId, width, height) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  // Setel ulang atribut scaling bawaan jika ada
  container.removeAttribute('data-scalable');
  container.removeAttribute('data-native-width');
  container.removeAttribute('data-native-height');
  container.style.height = '';
  container.style.overflow = '';
  container.style.display = '';
  container.style.justifyContent = '';
  container.style.alignItems = '';

  // Khusus untuk global-top-ad di mobile, kita selalu muat 728x90 lalu di-scale.
  // Karena ExoClick Zone ID 5933300 dikonfigurasi khusus untuk ukuran 728x90 di ExoClick,
  // me-request ukuran 320x50 ke zone ini akan menyebabkan tampilan terpotong.
  let targetWidth = width;
  let targetHeight = height;
  if (containerId === 'global-top-ad' && window.innerWidth < 768) {
    targetWidth = 728;
    targetHeight = 90;
  }

  // Jika kunci masih berbentuk placeholder, tampilkan placeholder premium bermotif dark mode neon
  if (!zoneId || String(zoneId).startsWith('placeholder_')) {
    container.innerHTML = `
      <div class="premium-ad-placeholder" style="max-width: ${targetWidth}px; height: ${targetHeight}px; margin: 0 auto; width: 100%;">
        <div class="ad-placeholder-glow"></div>
        <div class="ad-placeholder-content">
          <span class="ad-badge">EXOCLICK SLOT</span>
          <span class="ad-size">${targetWidth} × ${targetHeight}</span>
          <span class="ad-hint">Trafik Tinggi & Responsif</span>
        </div>
      </div>
    `;
    return;
  }

  // Load via Iframe syndication ExoClick untuk kompatibilitas SPA penuh
  const iframe = document.createElement('iframe');
  iframe.src = `https://a.magsrv.com/iframe.php?idzone=${zoneId}&size=${targetWidth}x${targetHeight}`;
  iframe.width = targetWidth;
  iframe.height = targetHeight;
  iframe.scrolling = 'no';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';

  container.appendChild(iframe);

  // Tandai kontainer sebagai scalable jika targetWidth >= 728 (seperti banner atas)
  if (targetWidth >= 728) {
    container.setAttribute('data-scalable', 'true');
    container.setAttribute('data-native-width', targetWidth);
    container.setAttribute('data-native-height', targetHeight);
    adjustScaledBanners();
  }
}



// Global callback for handling blocked ad scripts inside iframes
window.missavJAdError = function(containerId, width, height) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const activeText = window.i18n ? window.i18n.t('ad_blocker_active') : 'AD BLOCKER ACTIVE';
  const hintText = window.i18n ? window.i18n.t('ad_blocker_hint') : 'Harap matikan adblocker Anda untuk mendukung kami';

  container.innerHTML = `
    <div class="premium-ad-placeholder ad-blocked" style="max-width: ${width}px; height: ${height}px; margin: 0 auto; width: 100%;">
      <div class="ad-placeholder-content">
        <span class="ad-badge error">BLOCKED</span>
        <span class="ad-size">${activeText}</span>
        <span class="ad-hint">${hintText}</span>
      </div>
    </div>
  `;
};

/**
 * Memuat banner Adsterra secara dinamis di container tertentu lewat DOM langsung (bukan iframe)
 * untuk memaksimalkan CPM karena Adsterra dapat membaca cookies dan referer utama.
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

  // Antrean Promise untuk menghindari bentrok pada window.atOptions saat SPA routing
  adLoaderPromise = adLoaderPromise.then(() => {
    return new Promise((resolve) => {
      window.atOptions = {
        'key' : key,
        'format' : 'iframe',
        'height' : height,
        'width' : width,
        'params' : {}
      };

      // Buat elemen script Adsterra
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://glamournakedemployee.com/${key}/invoke.js`;
      
      // Amankan document.write agar tidak membuat blank page di SPA
      const originalWrite = document.write;
      const originalWriteln = document.writeln;
      let capturedHtml = '';
      
      document.write = function(html) { capturedHtml += html; };
      document.writeln = function(html) { capturedHtml += html + '\n'; };

      script.onload = () => {
        // Kembalikan document.write
        document.write = originalWrite;
        document.writeln = originalWriteln;
        
        // Suntikkan kode iframe Adsterra asli yang ditangkap
        if (capturedHtml) {
          container.innerHTML = capturedHtml;
        }
        
        // Atur skala jika lebih dari 728
        if (width >= 728) {
          container.setAttribute('data-scalable', 'true');
          container.setAttribute('data-native-width', width);
          container.setAttribute('data-native-height', height);
          adjustScaledBanners();
        }
        resolve();
      };
      
      script.onerror = () => {
        document.write = originalWrite;
        document.writeln = originalWriteln;
        resolve();
      };

      container.appendChild(script);
    });
  });
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

// Helper to clear Adsterra frequency cap cookies & storage
function clearAdsterraSession() {
  try {
    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Adsterra cookies typically have random names/hashes or start with _
      if (name.includes('adsterra') || name.startsWith('__') || name.length > 10) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname.replace(/^www\./, '');
      }
    }
    // Clear localStorage
    for (let key in localStorage) {
      if (key.includes('adsterra') || key.includes('pop') || key.length > 10) {
        localStorage.removeItem(key);
      }
    }
    // Clear sessionStorage
    for (let key in sessionStorage) {
      if (key.includes('adsterra') || key.includes('pop') || key.length > 10) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('[Ads] Error clearing ad session:', e);
  }
}

/**
 * Menginisialisasi klik pelindung transparan di atas player untuk pemicu popunder
 */
export function initPlayerAdOverlay() {
  const cfg = window.missavJAdConfig;
  const adOverlay = document.getElementById('player-ad-overlay');
  if (!adOverlay) return;

  // Jika popunder tidak aktif, pastikan overlay disembunyikan dan abaikan inisialisasi click handler
  if (!cfg || !cfg.popunderEnabled) {
    adOverlay.classList.add('hidden');
    return;
  }

  // Tampilkan kembali overlay transparan setiap memuat video baru
  adOverlay.classList.remove('hidden');

  // Bersihkan event listener lama jika ada (menghindari duplikasi callback)
  const newOverlay = adOverlay.cloneNode(true);
  adOverlay.parentNode.replaceChild(newOverlay, adOverlay);

  let overlayTimeout = null;

  newOverlay.addEventListener('click', (e) => {
    console.log('[Ads] Popunder triggered on player click.');

    // Sembunyikan pelindung transparan dengan efek transisi cepat
    newOverlay.classList.add('hidden');

    if (overlayTimeout) clearTimeout(overlayTimeout);

    // Tampilkan kembali overlay setelah 40 detik (cooldown agar 2-3 kali per 2 menit)
    overlayTimeout = setTimeout(() => {
      console.log('[Ads] Restoring player ad overlay for next popunder trigger.');
      newOverlay.classList.remove('hidden');
    }, 40000); // 40 detik
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
  script.src = 'https://glamournakedemployee.com/b2/9e/1b/b29e1b8f1f4574a57f5873d55a1a1a29.js';
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Menginisialisasi pemuatan script Social Bar Adsterra secara dinamis
 */
export function initAdsterraSocialBar() {
  const cfg = window.missavJAdConfig;
  if (!cfg.socialBarEnabled) return;

  // Hindari memuat ulang jika script sudah ada di DOM
  if (document.getElementById('adsterra-socialbar-script')) return;

  console.log('[Ads] Loading Adsterra Social Bar script dynamically...');
  const script = document.createElement('script');
  script.id = 'adsterra-socialbar-script';
  script.src = 'https://glamournakedemployee.com/c9/97/1d/c9971d54c2e1ed33b58dee3c4a998b66.js';
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
  const belowPlayerKey = isMobile ? cfg.belowPlayerBannerKey : cfg.topBannerKey;

  loadAdBanner('below-player-ad', belowPlayerKey, belowPlayerWidth, belowPlayerHeight);
  loadNativeBannerAd('native-banner-ad');
  loadAdBanner('sidebar-ad', cfg.sidebarBannerKey, 300, 250);
  initPlayerAdOverlay();
  
  // Muat script popunder Adsterra secara dinamis
  initAdsterraPopunder();
}

/**
 * Memuat iklan Native Banner secara dinamis langsung ke DOM (bukan iframe sandboxing)
 */
export function loadNativeBannerAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // bersihkan container
  
  adLoaderPromise = adLoaderPromise.then(() => {
    return new Promise((resolve) => {
      // Masukkan div target native
      container.innerHTML = '<div id="container-21b7c6791db50dfb4cce684222b4187e"></div>';

      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = 'https://glamournakedemployee.com/21b7c6791db50dfb4cce684222b4187e/invoke.js';
      
      script.onload = () => resolve();
      script.onerror = () => resolve();

      container.appendChild(script);
    });
  });
}

/**
 * Memuat iklan global top banner di list feed
 */
export function loadGlobalTopAd() {
  const cfg = window.missavJAdConfig;
  const isMobile = window.innerWidth < 768;
  const width = isMobile ? 320 : 728;
  const height = isMobile ? 50 : 90;
  const key = isMobile ? cfg.topMobileBannerKey : cfg.topBannerKey;
  
  loadAdBanner('global-top-ad', key, width, height);
}

/**
 * Memuat iklan sticky bottom mobile secara dinamis
 */
export function loadStickyBottomAd() {
  const cfg = window.missavJAdConfig;
  const isMobile = window.innerWidth < 768;
  
  // Sticky bottom banner hanya untuk mobile (lebar < 768)
  if (!isMobile) {
    const container = document.getElementById('sticky-bottom-ad-container');
    if (container) container.classList.add('hidden');
    return;
  }

  // Jika user sudah pernah menutup iklan di sesi ini, jangan tampilkan lagi
  if (sessionStorage.getItem('sticky_ad_closed') === 'true') {
    return;
  }

  const container = document.getElementById('sticky-bottom-ad-container');
  if (!container) return;

  // Tampilkan container
  container.classList.remove('hidden');

  // Inisialisasi tombol close
  const closeBtn = document.getElementById('close-sticky-bottom-ad');
  if (closeBtn) {
    closeBtn.onclick = () => {
      container.classList.add('hidden');
      sessionStorage.setItem('sticky_ad_closed', 'true');
    };
  }

  // Muat banner 320x50 di dalam sticky-bottom-ad
  loadAdBanner('sticky-bottom-ad', cfg.topMobileBannerKey, 320, 50);
}

// Ekspos secara global di namespace window untuk kemudahan integrasi dengan routing SPA
window.missavJAds = {
  loadAdBanner,
  loadNativeBannerAd,
  loadExoClickBanner,
  loadAdsterraBanner,
  initPlayerAdOverlay,
  loadWatchPageAds,
  loadGlobalTopAd,
  loadStickyBottomAd,
  initAdsterraPopunder,
  initAdsterraSocialBar,
  adjustScaledBanners
};
