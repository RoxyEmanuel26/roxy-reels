/**
 * MISSAV-J — Modular Ads System
 * Mengelola konfigurasi Adsterra popunder, loading banner dinamis di SPA
 * untuk provider Adsterra & ExoClick, dan transparansi overlay di video player.
 */

import ui from './ui.js?v=2.0.5';

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
  sidebarBannerKey: '5933316',
  outstreamBannerKey: '5940366', // ID Zona Outstream dari ExoClick Anda
  vastZoneId: 'https://s.magsrv.com/v1/vast.php?idz=5940372' // URL/ID Zona In-Stream VAST dari ExoClick Anda
};

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

/**
 * Memuat iklan ExoClick Outstream Video secara dinamis (Aman untuk SPA & Responsive)
 * 
 * Strategi multi-layer:
 * 1. ad-provider.js dimuat secara statis di index.html (primer)
 * 2. Fallback: dimuat ulang secara dinamis jika belum tersedia
 * 3. <ins> element diberi dimensi minimum 250px agar langsung terdeteksi oleh ad-provider
 * 4. Eksekusi AdProvider.push({"serve": {}}) langsung via JS untuk keandalan maksimum di SPA
 * 5. Diagnostic timer 3 detik untuk mengecek status data-processed dan menampilkan pesan log internal ExoClick
 */
export function loadExoClickOutstream(containerId, zoneId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[Ads] Outstream container not found:', containerId);
    return;
  }

  container.innerHTML = '';

  // Jika zoneId kosong atau placeholder, tampilkan placeholder premium dark mode neon
  if (!zoneId || String(zoneId).startsWith('placeholder_')) {
    container.innerHTML = `
      <div class="premium-ad-placeholder outstream-placeholder" style="width: 100%; height: 260px; display: flex; justify-content: center; align-items: center; background: var(--color-surface-2); border-radius: var(--radius-lg); border: 2px dashed rgba(255, 0, 0, 0.35); position: relative; overflow: hidden; box-shadow: var(--shadow-card); transition: all 0.3s ease;">
        <div class="ad-placeholder-glow" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle, rgba(255,0,0,0.08) 0%, transparent 70%);"></div>
        <div class="ad-placeholder-content" style="text-align: center; z-index: 1;">
          <span class="ad-badge" style="font-size: 0.65rem; font-weight: 800; color: var(--color-accent); border: 1px solid var(--color-accent); padding: 3px 10px; border-radius: var(--radius-sm); letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 0 10px rgba(255,0,0,0.2);">EXOCLICK VIDEO OUTSTREAM</span>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-text); margin-top: 10px; font-family: 'Roboto', sans-serif;">Video Iklan Outstream Disini</div>
          <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 6px; font-weight: 500;">Otomatis diputar tanpa suara saat di-scroll ke layar</div>
        </div>
      </div>
    `;
    return;
  }

  // Ciptakan tag <ins> ExoClick Outstream Video dengan dimensi minimum yang jelas
  // agar deteksi visibilitas (lazy load) ExoClick ad-provider langsung terpicu.
  const ins = document.createElement('ins');
  ins.className = 'eas6a97888e37';
  ins.setAttribute('data-zoneid', zoneId);
  ins.style.display = 'block';
  ins.style.width = '100%';
  ins.style.minHeight = '250px'; // Set minimum height 250px agar terlihat di viewport
  container.appendChild(ins);

  console.log('[Ads] Outstream <ins> injected. Zone:', zoneId, 'Container:', containerId);

  // Pastikan ad-provider.js sudah dimuat (fallback jika static load di index.html gagal/belum selesai)
  const ensureAdProvider = (callback) => {
    // Cek apakah script sudah dimuat
    const existingScript = document.querySelector('script[src*="ad-provider.js"]');
    if (!existingScript) {
      console.log('[Ads] ad-provider.js not found in DOM, loading dynamically as fallback...');
      const script = document.createElement('script');
      script.type = 'application/javascript';
      script.src = 'https://a.magsrv.com/ad-provider.js';
      script.async = true;
      script.onload = () => {
        console.log('[Ads] ad-provider.js loaded dynamically.');
        callback();
      };
      script.onerror = () => {
        console.warn('[Ads] Failed to load ad-provider.js (mungkin diblokir adblocker).');
      };
      document.head.appendChild(script);
    } else {
      callback();
    }
  };

  // Panggil serve command langsung via window.AdProvider.push
  const triggerServeCommand = () => {
    try {
      if (window.AdProvider && typeof window.AdProvider.push === 'function') {
        window.AdProvider.push({"serve": {}});
        console.log('[Ads] Outstream serve command executed directly.');
      } else {
        window.AdProvider = window.AdProvider || [];
        window.AdProvider.push({"serve": {}});
        console.log('[Ads] Outstream serve command pushed to global queue array.');
      }
    } catch (e) {
      console.warn('[Ads] Outstream serve error:', e);
    }
  };

  ensureAdProvider(() => {
    // Jalankan serve setelah delay singkat untuk memastikan DOM siap
    setTimeout(triggerServeCommand, 200);
  });

  // Diagnostic Checker: periksa 3 detik kemudian apakah iklan berhasil di-proses
  setTimeout(() => {
    try {
      const checkIns = container.querySelector('ins.eas6a97888e37');
      if (checkIns) {
        const isProcessed = checkIns.getAttribute('data-processed') === 'true';
        console.log(`[Ads Diagnostic] Outstream container inspection for zone ${zoneId}:`, {
          hasInsTag: true,
          dataProcessed: isProcessed,
          currentClass: checkIns.className,
          visibleHeight: checkIns.clientHeight
        });

        if (isProcessed) {
          console.log('[Ads Diagnostic] SUCCESS: ExoClick ad-provider has processed this tag.');
        } else {
          console.warn('[Ads Diagnostic] WARNING: ExoClick ad-provider has NOT processed this tag yet. Check for network block or JS exceptions.');
        }
      } else {
        console.error('[Ads Diagnostic] ERROR: <ins> tag missing from container.');
      }

      // Tampilkan log debug dari ExoClick jika tersedia
      if (window.AdProvider && typeof window.AdProvider.getDebugMessages === 'function') {
        const debugMsgs = window.AdProvider.getDebugMessages();
        console.log('[Ads Diagnostic] ExoClick Internal Debug Logs:', debugMsgs);
      }
    } catch (err) {
      console.error('[Ads Diagnostic] Error during diagnostic run:', err);
    }
  }, 3000);
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

// Global click interceptor to dynamically clear Adsterra session 500ms after any click
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    // Check if we are on watch page before clearing session
    if (window.missavJState && window.missavJState.currentPath === '/watch') {
      setTimeout(clearAdsterraSession, 500);
    }
  }, { capture: true, passive: true });
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

  let overlayTimeout = null;

  newOverlay.addEventListener('click', (e) => {
    console.log('[Ads] Popunder triggered on player click.');

    // Hapus sesi pembatasan frekuensi Adsterra agar iklan berikutnya bisa muncul
    clearAdsterraSession();

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
  script.src = 'https://glamournakedemployee.com/41/96/d5/4196d5391d5da55a701ea177a284f8f2.js';
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

/**
 * Memuat pustaka CSS dan JS Fluid Player secara dinamis jika belum ada
 */
function loadFluidPlayerAssets() {
  return new Promise((resolve) => {
    if (window.fluidPlayer) {
      resolve();
      return;
    }

    // Load CSS
    if (!document.getElementById('fluid-player-css')) {
      const link = document.createElement('link');
      link.id = 'fluid-player-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
      document.head.appendChild(link);
    }

    // Load JS
    if (!document.getElementById('fluid-player-js')) {
      const script = document.createElement('script');
      script.id = 'fluid-player-js';
      script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
      script.onload = () => resolve();
      script.onerror = () => {
        console.error('[Ads] Failed to load Fluid Player script');
        resolve(); // resolve anyway to trigger fail-safe
      };
      document.head.appendChild(script);
    } else {
      // If script is in DOM but onload wasn't fired yet, poll until it's loaded
      const interval = setInterval(() => {
        if (window.fluidPlayer) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
}

/**
 * Memuat iklan In-Stream VAST Video Ad secara dinamis menggunakan Fluid Player
 * 
 * Perbaikan: Menambahkan timeout yang lebih panjang (15 detik) agar VAST tag
 * punya waktu cukup untuk di-fetch dan diputar sebelum fail-safe memotong.
 * Juga menambahkan logging lebih detail untuk debugging.
 */
export async function loadVastAd(containerId, zoneId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[Ads] In-stream VAST container not found:', containerId);
    onComplete();
    return;
  }

  // Jika zoneId kosong atau placeholder, lewati iklan langsung ke video asli
  if (!zoneId || String(zoneId).startsWith('placeholder_')) {
    console.log('[Ads] In-stream VAST ad skipped because zoneId is placeholder or empty.');
    onComplete();
    return;
  }

  console.log('[Ads] Initializing Fluid Player for In-stream VAST ad...', { containerId, zoneId });
  container.innerHTML = '';

  // Buat element video HTML5 sebagai host untuk Fluid Player
  const video = document.createElement('video');
  video.id = 'vast-ad-video';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.backgroundColor = '#000';
  video.setAttribute('playsinline', 'true');
  video.muted = true; // start muted for autoplay compliance
  video.preload = 'auto';

  // Tambahkan video source (blank MP4 1 detik — diperlukan agar Fluid Player bisa inisialisasi)
  const source = document.createElement('source');
  source.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';
  source.type = 'video/mp4';
  video.appendChild(source);
  container.appendChild(video);

  let adCompleted = false;
  const finishAd = (reason) => {
    if (adCompleted) return;
    adCompleted = true;
    clearTimeout(failSafeTimeout);
    console.log('[Ads] In-stream ad finished. Reason:', reason || 'unknown');
    
    // Hancurkan player instance jika ada
    try {
      if (playerInstance) {
        playerInstance.destroy();
      }
    } catch (e) {
      console.warn('[Ads] Error destroying Fluid Player instance:', e);
    }
    
    container.innerHTML = '';
    onComplete();
  };

  // Fail-safe timeout 15 detik (dinaikkan dari 7 detik) — VAST tag dari ExoClick
  // bisa lambat di jaringan tertentu, sehingga perlu waktu lebih.
  const failSafeTimeout = setTimeout(() => {
    console.warn('[Ads] In-stream ad playback timed out (15s). Force playing real video...');
    finishAd('timeout');
  }, 15000);

  // Muat berkas Fluid Player CSS & JS
  await loadFluidPlayerAssets();

  if (!window.fluidPlayer) {
    console.error('[Ads] Fluid Player script is not available. Skipping ad...');
    finishAd('fluidplayer-unavailable');
    return;
  }

  let playerInstance = null;
  try {
    // Tentukan VAST tag URL — jika zoneId sudah berupa URL lengkap, gunakan langsung
    let vastTagUrl;
    if (String(zoneId).startsWith('http://') || String(zoneId).startsWith('https://')) {
      vastTagUrl = zoneId;
    } else {
      vastTagUrl = `https://syndication.exoclick.com/splash.php?type=18&idzone=${zoneId}`;
    }
    
    console.log('[Ads] VAST Tag URL:', vastTagUrl);

    playerInstance = window.fluidPlayer('vast-ad-video', {
      layoutControls: {
        autoPlay: true,
        mute: true,
        keyboardControl: false,
        playPauseAnimation: false,
        showAndHideDelay: 0,
        controlBar: {
          autoHide: true,
          usePlayButton: false
        }
      },
      vastOptions: {
        adList: [
          {
            roll: 'preRoll',
            vastTag: vastTagUrl
          }
        ],
        adFinishedCallback: () => {
          console.log('[Ads] In-stream VAST ad finished playing.');
          finishAd('ad-finished');
        },
        adSkippedCallback: () => {
          console.log('[Ads] In-stream VAST ad skipped by user.');
          finishAd('ad-skipped');
        },
        adClickedCallback: () => {
          console.log('[Ads] In-stream VAST ad clicked.');
        },
        noVastVideoCallback: () => {
          console.warn('[Ads] No VAST video returned from tag. Playing real video...');
          finishAd('no-vast-video');
        },
        vastVideoEndedCallback: () => {
          console.log('[Ads] VAST video ended.');
          finishAd('vast-ended');
        }
      }
    });

    // Menangani error pemutar video itu sendiri
    video.addEventListener('error', (e) => {
      console.warn('[Ads] Video player element error:', e);
      finishAd('video-element-error');
    });

    // Fallback: jika ad tidak mulai dalam 5 detik setelah player init,
    // cek apakah ada VAST response
    setTimeout(() => {
      if (!adCompleted && video.paused && video.currentTime === 0) {
        console.warn('[Ads] VAST ad appears stuck (paused at 0s after 5s). May be blocked or empty response.');
      }
    }, 5000);

  } catch (err) {
    console.error('[Ads] Failed to initialize Fluid Player:', err);
    finishAd('init-error');
  }
}

// Ekspos secara global di namespace window untuk kemudahan integrasi dengan routing SPA
window.missavJAds = {
  loadAdBanner,
  loadExoClickBanner,
  loadAdsterraBanner,
  loadExoClickOutstream,
  loadVastAd,
  initPlayerAdOverlay,
  loadWatchPageAds,
  loadGlobalTopAd,
  initAdsterraPopunder,
  adjustScaledBanners
};
