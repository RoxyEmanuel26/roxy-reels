/**
 * Roxy Reels — App Orchestrator & SPA Router (Secured & Optimized)
 * Mengelola perutean berbasis hash (SPA), interaksi global seperti collapsible sidebar,
 * pencarian global, toggle tema, dan menyuntikkan tombol Scroll-to-Top premium.
 */

import ui from './ui.js';

// Parameter Helper: Mengambil nilai parameter dari hash query string
function getParam(name) {
  const hash = window.location.hash;
  const parts = hash.split('?');
  if (parts.length < 2) return null;
  const searchParams = new URLSearchParams(parts[1]);
  return searchParams.get(name);
}

// Daftar rute aplikasi Roxy Reels berbasis hash
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
};

/**
 * Fungsi navigasi utama yang dipanggil saat hash berubah
 * @param {string} hash - window.location.hash
 */
function navigate(hash) {
  const [pathWithHash] = hash.split('?');
  const path = pathWithHash.replace('#', '') || '/';
  
  // Ambil rute pencocokan atau default ke homepage
  const route = routes[path] || routes['/'];
  
  const mainApp = document.getElementById('app-content');
  if (mainApp) {
    mainApp.innerHTML = '';
  }
  
  // Tampilkan skeleton loader sebelum memuat konten
  ui.showSkeletons(8);
  
  // Highlight item aktif di sidebar
  highlightActiveSidebarItem(path);
  
  // Scroll halaman ke atas secara otomatis saat navigasi rute berubah (UX standar YouTube)
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Panggil modul halaman terkait
  route().catch(err => {
    console.error(`Gagal memuat rute ${path}:`, err);
    ui.showError(`Gagal memuat halaman: ${err.message}`);
  });
}

/**
 * Memberikan class active pada link menu sidebar yang sesuai dengan rute aktif
 * @param {string} activePath - Rute saat ini (misalnya '/trending')
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
  // Cegah injeksi ganda jika sudah ada
  if (document.getElementById('scroll-top-btn')) return;

  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.id = 'scroll-top-btn';
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.setAttribute('title', 'Kembali ke Atas');
  scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
  
  // SVG Arrow Up Icon
  scrollTopBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;
  
  document.body.appendChild(scrollTopBtn);

  // Pantau scroll untuk memicu visibilitas tombol
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  // Eksekusi scroll mulus kembali ke atas ketika diklik
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Inisialisasi global element listeners (Sidebar, Search, Theme)
 */
function initGlobalEvents() {
  // 1. Sidebar toggles (Desktop Collapsible & Mobile Slide)
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

  // 2. Sticky Search Bar Input (Aman dari query kosong)
  const searchInput = document.getElementById('header-search-input');
  const searchBtn = document.getElementById('header-search-btn');
  
  const handleSearchSubmit = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
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

  // 3. Theme Toggle Button (Dark / Light)
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      ui.toggleTheme();
    });
  }
  
  // Pulihkan tema tersimpan (default dark)
  ui.initTheme();

  // Bersihkan overlay sidebar mobile saat navigasi hash berubah
  window.addEventListener('hashchange', () => {
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('visible');
    }
  });
}

// Bootstrap router saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  initGlobalEvents();
  setupScrollTopButton(); // Suntikkan tombol scroll-to-top
  
  window.addEventListener('hashchange', () => navigate(window.location.hash));
  
  // Jalankan navigasi pertama kali untuk memicu pemuatan feed awal
  navigate(window.location.hash || '#/');
});
