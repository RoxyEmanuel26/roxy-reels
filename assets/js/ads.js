/**
 * MISSAV-J — Modular Ads System
 * Mengelola konfigurasi Adsterra popunder, loading banner dinamis di SPA
 * untuk provider Adsterra & ExoClick, dan transparansi overlay di video player.
 */

import ui from './ui.js?v=2.5.3';


// Konfigurasi Kunci Iklan
window.missavJAdConfig = {
  popunderEnabled: true, // JANGAN DIHAPUS: Setel ke true untuk mengaktifkan kembali popunder
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

/**
 * Menghapus frequency cap cookies Adsterra agar tayangan iklan bisa dimuat ulang
 * Dipanggil setiap kali router SPA berpindah halaman.
 */
export function clearAdsterraSession() {
  try {
    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
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
    // Clear sessionStorage (kecuali sticky_ad_closed agar tidak reset)
    for (let key in sessionStorage) {
      if (key.includes('adsterra') || key.includes('pop')) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('[Ads] Error clearing ad session:', e);
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
 * Helper untuk Lazy Loading ad container agar Viewability Score maksimal
 */
function lazyLoadAd(containerId, loadCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        obs.unobserve(entry.target);
        loadCallback();
      }
    });
  }, { rootMargin: '500px 0px' });

  observer.observe(container);
}

/**
 * Memuat seluruh iklan halaman tontonan video secara paralel (dengan Lazy Load)
 */
export function loadWatchPageAds() {
  const cfg = window.missavJAdConfig;
  
  // Tentukan lebar responsif di bawah player (728x90 di desktop, 300x250 di mobile)
  const isMobile = window.innerWidth < 768;
  const belowPlayerWidth = isMobile ? 300 : 728;
  const belowPlayerHeight = isMobile ? 250 : 90;
  const belowPlayerKey = isMobile ? cfg.belowPlayerBannerKey : cfg.topBannerKey;

  lazyLoadAd('sponsor-below-player', () => {
    loadAdBanner('sponsor-below-player', belowPlayerKey, belowPlayerWidth, belowPlayerHeight);
  });
  
  lazyLoadAd('sponsor-native-banner', () => {
    loadNativeBannerAd('sponsor-native-banner');
  });
  
  lazyLoadAd('sponsor-sidebar', () => {
    loadAdBanner('sponsor-sidebar', cfg.sidebarBannerKey, 300, 250);
  });

  initPlayerAdOverlay();
  
  // Muat script popunder Adsterra secara dinamis
  initAdsterraPopunder();
}

/**
 * Memuat iklan Native Banner secara dinamis menggunakan iframe terisolasi.
 * Ini mencegah masalah di mana script Adsterra bertabrakan di SPA (ID Collision)
 * atau gagal memuat CSS yang menyebabkan teks iklan bocor menjadi "Raw Text".
 */
export function loadNativeBannerAd(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // bersihkan container
  
  // Karena Native Banner Adsterra berantakan jika dimuat multiple kali di DOM yang sama,
  // kita mengisolasinya ke dalam iframe kita sendiri.
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.height = window.innerWidth < 768 ? '350px' : '250px'; 
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.display = 'block';
  iframe.scrolling = 'no';
  iframe.style.transition = 'height 0.3s ease';
  
  container.appendChild(iframe);

  function writeIframeContent() {
    const iframeDoc = iframe.contentWindow.document;
    const currentDomain = window.location.origin;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <base href="${currentDomain}/">
          <link rel="canonical" href="${window.location.href}">
          <style>
            body { margin: 0; padding: 0; background: transparent; }
            #container-21b7c6791db50dfb4cce684222b4187e { width: 100%; display: flex; justify-content: center; }
          </style>
        </head>
        <body>
          <div id="container-21b7c6791db50dfb4cce684222b4187e"></div>
          <script async="async" data-cfasync="false" src="https://glamournakedemployee.com/21b7c6791db50dfb4cce684222b4187e/invoke.js?cb=${Date.now()}"></script>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Auto-resize logic dari parent
    let pollCount = 0;
    const checkHeight = setInterval(() => {
      pollCount++;
      if (pollCount > 20 || !iframe.contentWindow) {
        clearInterval(checkHeight);
        return;
      }
      try {
        const doc = iframe.contentWindow.document;
        const adWrapper = doc.getElementById('container-21b7c6791db50dfb4cce684222b4187e');
        if (adWrapper && adWrapper.scrollHeight > 50) {
          const newHeight = adWrapper.scrollHeight + 10;
          if (newHeight > parseInt(iframe.style.height || iframe.height)) {
            iframe.height = newHeight + 'px';
            iframe.style.height = newHeight + 'px';
          }
          if (pollCount > 5) clearInterval(checkHeight);
        }
      } catch(e) {
        clearInterval(checkHeight);
      }
    }, 500);
  }

  // Tulis konten pertama kali
  writeIframeContent();

  // Algoritma Smart Auto-Refresh: Me-refresh iklan setiap 45 detik HANYA JIKA terlihat di layar
  let isVisible = false;
  let refreshTimer = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible && !refreshTimer) {
        refreshTimer = setInterval(() => {
          if (isVisible) {
            writeIframeContent(); // Refresh isi iframe secara diam-diam
          }
        }, 45000); // 45 detik
      } else if (!isVisible && refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    });
  }, { threshold: 0.5 });

  observer.observe(iframe);
}

/**
 * Memuat iklan global top banner di list feed dengan Lazy Loading
 */
export function loadGlobalTopAd(containerId = 'top-global-ad') {
  const cfg = window.missavJAdConfig;
  const isMobile = window.innerWidth < 768;
  const width = isMobile ? 320 : 728;
  const height = isMobile ? 50 : 90;
  const key = isMobile ? cfg.topMobileBannerKey : cfg.topBannerKey;
  
  // Lazy load agar hanya dimuat saat container masuk viewport (Viewability 100%)
  lazyLoadAd(containerId, () => {
    loadAdBanner(containerId, key, width, height);
  });
}

/**
 * Memuat iklan sticky bottom mobile secara dinamis
 * Sticky tampil lagi otomatis setiap 5 menit setelah user menutup
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

  // Cek apakah masih dalam cooldown (5 menit setelah ditutup)
  const closedAt = parseInt(localStorage.getItem('sticky_ad_closed_at') || '0', 10);
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 menit
  if (closedAt && (Date.now() - closedAt) < COOLDOWN_MS) {
    return;
  }

  const container = document.getElementById('sticky-bottom-ad-container');
  if (!container) return;

  // Tampilkan container
  container.classList.remove('hidden');

  // Inisialisasi tombol close — simpan timestamp, bukan boolean permanen
  const closeBtn = document.getElementById('close-sticky-bottom-ad');
  if (closeBtn) {
    const newBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newBtn, closeBtn);
    newBtn.onclick = () => {
      container.classList.add('hidden');
      localStorage.setItem('sticky_ad_closed_at', String(Date.now()));
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
  clearAdsterraSession,
  adjustScaledBanners
};
