/**
 * MISSAV-J — App Orchestrator & SPA Router (Advanced Edition)
 * Mengelola perutean SPA berbasis hash, penanganan transpalasi pemutar melayang (PiP)
 * tanpa reload iframe, hotkey keyboard, dan playlist in-memory (Watch Later & History).
 */

import ui from './ui.js';
import { renderVideoCard, bindHoverPreviews } from './feed.js';
import i18n from './i18n.js';

// Inisialisasi State Global In-Memory
window.missavJState = {
  watchLater: [],   // Menyimpan objek post tonton nanti
  history: [],      // Menyimpan riwayat video yang dibuka
  activeVideo: null, // Menyimpan detail video yang sedang diputar
  isFloating: false, // Menandai apakah pemutar video sedang melayang
  currentPath: ''    // Menyimpan path rute aktif
};

// Parameter Helper: Mengambil nilai parameter dari query string URL
function getParam(name) {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(name);
}

/**
 * Memecah URL pathname untuk mengekstrak kode bahasa aktif dan sub-rute SPA (Aman)
 * @param {string} urlPath - window.location.pathname
 * @returns {{lang: string, routePath: string}}
 */
function parseUrl(urlPath) {
  const cleanPath = urlPath.replace(/^\//, ''); // Contoh: "en/trending"
  const segments = cleanPath.split('?')[0].split('/'); // ["en", "trending"]
  
  let lang = segments[0] || '';
  const isValidLang = i18n.LANGS.some(l => l.code === lang);
  
  let routePath = '/';
  if (isValidLang) {
    routePath = '/' + segments.slice(1).join('/');
  } else {
    lang = i18n.getLang();
    routePath = '/' + segments.join('/');
  }
  
  // Bersihkan rute dari trailing slash
  if (routePath.length > 1 && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }
  
  return { lang, routePath };
}

/**
 * Melakukan navigasi rute SPA baru menggunakan History API
 * @param {string} routePath - Rute internal (contoh: '/watch?id=123' atau '/trending')
 */
window.missavJNavigate = function(routePath) {
  const currentLang = i18n.getLang();
  const cleanPath = routePath.startsWith('/') ? routePath : '/' + routePath;
  
  // Pisahkan pathname dan query string agar aman
  const [pathPart, queryPart] = cleanPath.split('?');
  const fullPath = `/${currentLang}${pathPart}` + (queryPart ? `?${queryPart}` : '');
  
  history.pushState(null, '', fullPath);
  navigate(fullPath);
};

// Custom Renderer untuk Tonton Nanti dan Riwayat Tontonan
function renderSavedVideosPage(title, postsList, emptyMessage) {
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  if (postsList.length === 0) {
    mainApp.innerHTML = `
      <div class="saved-list-header">
        <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-2);">${title}</h2>
      </div>
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <h3 data-i18n="empty_state_title">Daftar Kosong</h3>
        <p>${emptyMessage}</p>
        <button onclick="window.missavJNavigate('/')" class="btn-primary" data-i18n="empty_clear_btn">Telusuri Video</button>
      </div>
    `;
    i18n.translateStaticUI();
    return;
  }

  // Render daftar video dengan grid dan staggered delay
  mainApp.innerHTML = `
    <div class="saved-list-header" style="margin-bottom: var(--space-6);">
      <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-1);">${title}</h2>
      <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('video_available', { total: postsList.length })}</p>
    </div>
    <div class="video-grid" id="saved-video-grid">
      ${postsList.map((post, idx) => renderVideoCard(post, idx)).join('')}
    </div>
  `;

  // Hubungkan event click untuk navigasi card
  const grid = document.getElementById('saved-video-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const actorChip = e.target.closest('.actor-chip');
      if (actorChip) {
        e.stopPropagation();
        const actorName = decodeURIComponent(actorChip.dataset.actor);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
        return;
      }

      const studioName = e.target.closest('.card-studio');
      if (studioName) {
        e.stopPropagation();
        const studio = decodeURIComponent(studioName.dataset.studio);
        window.missavJNavigate(`/studio?name=${encodeURIComponent(studio)}`);
        return;
      }

      const card = e.target.closest('.video-card');
      if (card && !card.classList.contains('skeleton-card')) {
        const postId = card.dataset.id;
        window.missavJNavigate(`/watch?id=${postId}`);
      }
    });

    // Pasang hover listeners untuk cuplikan video dinamis (Live Preview)
    bindHoverPreviews(grid);
  }
  
  i18n.translateStaticUI();
}

// Daftar rute aplikasi MISSAV-J berbasis hash
const routes = {
  '/':          () => import('./feed.js').then(m => m.init()),
  '/trending':  () => import('./trending.js').then(m => m.init()),
  '/recent':    () => import('./recent.js').then(m => m.init()),
  '/search':    () => import('./search.js').then(m => m.init(getParam('q'))),
  '/watch':     () => import('./player.js').then(m => m.init(getParam('id'))),
  '/category':  () => import('./feed.js').then(m => m.init({ category: getParam('name') })),
  '/actor':     () => import('./feed.js').then(m => m.init({ actor: getParam('name') })),
  '/studio':    () => import('./feed.js').then(m => m.init({ studio: getParam('name') })),
  '/tag':       () => import('./feed.js').then(m => m.init({ tag: getParam('name') })),
  
  // Rute baru untuk taksonomi aktor & studio
  '/actors':    () => import('./actors.js').then(m => m.init()),
  '/studios':   () => import('./studios.js').then(m => m.init()),
  
  // Rute baru untuk playlists in-memory
  '/watch-later': () => Promise.resolve(renderSavedVideosPage(i18n.t('nav_watch_later'), window.missavJState.watchLater, i18n.t('watch_later_empty_desc'))),
  '/history':     () => Promise.resolve(renderSavedVideosPage(i18n.t('nav_history'), window.missavJState.history, i18n.t('history_empty_desc')))
};

/**
 * Fungsi navigasi utama yang dipanggil saat rute berubah (Dengan Logika Transpalasi PiP)
 * @param {string} urlPath - window.location.pathname + window.location.search
 */
function navigate(urlPath) {
  const { lang, routePath } = parseUrl(urlPath);
  
  // Sinkronisasi bahasa secara dinamis jika berbeda dari preferensi i18n aktif saat ini
  if (lang && lang !== i18n.getLang()) {
    i18n.setLang(lang, false); // Setel bahasa tanpa memicu redirect loop
  }

  const prevPath = window.missavJState.currentPath;
  window.missavJState.currentPath = routePath;

  // 1. Logika Transpalasi LEAVE WATCH (Watch -> Halaman Lain): Pindahkan player ke mode floating
  if (prevPath === '/watch' && routePath !== '/watch') {
    const playerContainer = document.getElementById('player-container');
    if (playerContainer && window.missavJState.activeVideo) {
      const floatBody = document.getElementById('floating-player-body');
      const floatTitle = document.getElementById('floating-player-title');
      const floatWrapper = document.getElementById('floating-player-wrapper');
      
      if (floatBody && floatTitle && floatWrapper) {
        floatBody.innerHTML = '';
        floatBody.appendChild(playerContainer); // Pindahkan elemen DOM player tanpa reload iframe!
        floatTitle.textContent = window.missavJState.activeVideo.title;
        floatWrapper.classList.remove('hidden');
        window.missavJState.isFloating = true;
        ui.showToast(i18n.t('playing_floating_player'));
      }
    }
  }

  // 2. Logika Transpalasi ENTER WATCH (Halaman Lain -> Watch): Jika ID video sama dengan yang melayang, transplant balik!
  const targetId = getParam('id');
  if (routePath === '/watch' && window.missavJState.activeVideo && String(window.missavJState.activeVideo.id) === String(targetId)) {
    // Sembunyikan floating player karena kita akan memindahkannya kembali ke watch area
    const floatWrapper = document.getElementById('floating-player-wrapper');
    if (floatWrapper) floatWrapper.classList.add('hidden');
    window.missavJState.isFloating = false;
  } 
  // Jika membuka video watch yang BERBEDA dari yang sedang melayang, matikan pemutar melayang
  else if (routePath === '/watch' && window.missavJState.isFloating) {
    closeFloatingPlayer();
  }

  // Ambil rute pencocokan atau default ke beranda
  const route = routes[routePath] || routes['/'];
  
  const mainApp = document.getElementById('app-content');
  if (mainApp) {
    mainApp.innerHTML = '';
  }
  
  // Tampilkan skeleton loader
  ui.showSkeletons(8);
  
  // Highlight sidebar
  highlightActiveSidebarItem(routePath);
  
  // Scroll halaman ke atas secara instan saat rute berubah
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Panggil modul halaman terkait
  route().then(() => {
    i18n.translateStaticUI();
  }).catch(err => {
    console.error(`Error loading route ${routePath}:`, err);
    ui.showError(i18n.t('error_load_page', { message: err.message }));
  });
}

/**
 * Menutup pemutar melayang sepenuhnya
 */
export function closeFloatingPlayer() {
  const float = document.getElementById('floating-player-wrapper');
  if (float) float.classList.add('hidden');
  
  const body = document.getElementById('floating-player-body');
  if (body) body.innerHTML = '';
  
  window.missavJState.activeVideo = null;
  window.missavJState.isFloating = false;
}

/**
 * Memberikan class active pada link menu sidebar yang sesuai dengan rute aktif
 */
function highlightActiveSidebarItem(activePath) {
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-nav button');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const cleanHref = href.split('?')[0].replace('#', '');
    
    if (cleanHref === activePath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Menyuntikkan tombol Scroll-to-Top mengambang secara dinamis
 */
function setupScrollTopButton() {
  if (document.getElementById('scroll-top-btn')) return;

  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.id = 'scroll-top-btn';
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.setAttribute('title', 'Kembali ke Atas');
  scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
  
  scrollTopBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;
  
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Menyuntikkan struktur DOM Pemutar Melayang (PiP) secara dinamis
 */
function setupFloatingPlayerDOM() {
  if (document.getElementById('floating-player-wrapper')) return;

  const float = document.createElement('div');
  float.id = 'floating-player-wrapper';
  float.className = 'floating-player-wrapper hidden';
  float.innerHTML = `
    <div class="floating-player-header">
      <span id="floating-player-title" class="text-ellipsis" data-i18n="now_playing">Sedang Memutar...</span>
      <div class="floating-player-controls">
        <button id="floating-player-maximize" data-i18n-title="restore_full_screen" title="Kembali ke Layar Penuh">🗖</button>
        <button id="floating-player-close" data-i18n-title="close_player" title="Tutup Pemutar">✕</button>
      </div>
    </div>
    <div id="floating-player-body" class="floating-player-body"></div>
  `;
  document.body.appendChild(float);

  // Klik Maximize: Transplant balik ke watch page penuh
  document.getElementById('floating-player-maximize').addEventListener('click', () => {
    if (window.missavJState.activeVideo) {
      window.missavJNavigate(`/watch?id=${window.missavJState.activeVideo.id}`);
    }
  });

  // Klik Close: Hancurkan pemutar melayang
  document.getElementById('floating-player-close').addEventListener('click', closeFloatingPlayer);
}

/**
 * Mendaftarkan Pintasan Keyboard Desktop (Hotkeys)
 */
function setupKeyboardHotkeys() {
  window.addEventListener('keydown', (e) => {
    // Abaikan jika user sedang mengetik di input bar
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    
    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    // F: Layar Penuh (Fullscreen) untuk wrapper pemutar
    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const wrapper = document.querySelector('.player-container-wrapper');
      if (wrapper) {
        if (!document.fullscreenElement) {
          wrapper.requestFullscreen().catch(() => {});
          ui.showToast('Mode Layar Penuh Aktif 🖥️');
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
    // M: Fokus pemutar untuk membisukan (Mute) via standard keyboard
    else if (e.key.toLowerCase() === 'm') {
      iframe.focus();
      ui.showToast('Pemutar difokuskan. Tekan M untuk Mute.');
    }
    // Spasi: Fokus pemutar untuk memutar/jeda
    else if (e.code === 'Space') {
      e.preventDefault();
      iframe.focus();
      ui.showToast('Pemutar difokuskan. Tekan Spasi untuk Putar/Jeda.');
    }
  });
}

/**
 * Inisialisasi global element listeners (Sidebar, Search, Theme)
 */
function initGlobalEvents() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.toggle('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('visible');
      } else {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed-layout');
      }
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('visible');
    });
  }

  const searchInput = document.getElementById('header-search-input');
  const searchBtn = document.getElementById('header-search-btn');
  
  const handleSearchSubmit = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.missavJNavigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearchSubmit();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearchSubmit);
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      ui.toggleTheme();
    });
  }
  
  ui.initTheme();

  window.addEventListener('hashchange', () => {
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('visible');
    }
  });
}

/**
 * Menyusun dropdown pilihan bahasa dan event listener-nya
 */
function setupLanguageDropdown() {
  const trigger = document.getElementById('lang-dropdown-trigger');
  const menu = document.getElementById('lang-dropdown-menu');
  if (!trigger || !menu) return;

  // Render list bahasa dari i18n.LANGS secara dinamis
  menu.innerHTML = i18n.LANGS.map(lang => `
    <button class="lang-item" data-lang="${lang.code}">
      <img class="lang-item-flag" src="${lang.flag}" alt="${lang.label}">
      <span class="lang-item-label">${lang.label}</span>
    </button>
  `).join('');

  // Toggle dropdown menu saat trigger diklik
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !isExpanded);
    menu.classList.toggle('hidden');
    trigger.parentElement.classList.toggle('open');
  });

  // Event handler ketika item bahasa dipilih
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (item) {
      const selectedLang = item.dataset.lang;
      i18n.setLang(selectedLang);
      
      // Tutup menu
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.parentElement.classList.remove('open');
    }
  });

  // Tutup dropdown jika mengklik di luar area dropdown
  document.addEventListener('click', (e) => {
    if (!trigger.parentElement.contains(e.target)) {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.parentElement.classList.remove('open');
    }
  });
}

// Bootstrap router saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  // 1. Backward Compatibility: Tangkap rute hash lama dan alihkan ke pathname rute bersih baru secara instan
  if (window.location.hash) {
    const hashPath = window.location.hash.replace('#', '') || '/';
    const lang = i18n.getLang();
    window.location.replace(`/${lang}${hashPath}`);
    return;
  }

  // 2. Interseptor Klik Tautan Global (Mendukung link hash lama dan link pathname relatif baru)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href) {
        const isInternalSPA = href.startsWith('#/') || 
          (href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/assets') && !href.includes('.'));
        if (isInternalSPA) {
          e.preventDefault();
          const cleanPath = href.replace('#', '');
          window.missavJNavigate(cleanPath);
        }
      }
    }
  });

  // 3. Jika rute pathname saat ini kosong atau tidak memiliki subpath bahasa, lakukan redirect
  const currentPathname = window.location.pathname;
  const { lang, routePath } = parseUrl(currentPathname);
  
  // Deteksi jika pengguna membuka root URL "/" secara langsung
  if (currentPathname === '/' || currentPathname === '') {
    const activeLang = i18n.getLang();
    history.replaceState(null, '', `/${activeLang}/`);
  }

  initGlobalEvents();
  setupLanguageDropdown();  // Inisialisasi dropdown bahasa
  setupScrollTopButton();   // Injeksi tombol scroll-to-top
  setupFloatingPlayerDOM(); // Injeksi pemutar melayang (PiP)
  setupKeyboardHotkeys();   // Daftarkan hotkeys keyboard
  
  // Sinkronkan preferensi bahasa aktif
  if (lang) {
    i18n.setLang(lang, false);
  }
  
  i18n.translateStaticUI(); // Pelokalan pertama kali
  
  // Daftarkan event popstate untuk tombol back/forward browser
  window.addEventListener('popstate', () => {
    navigate(window.location.pathname + window.location.search);
  });
  
  navigate(window.location.pathname + window.location.search);
});
