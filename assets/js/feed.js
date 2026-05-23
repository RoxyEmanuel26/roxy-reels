/**
 * MISSAV-J — Homepage Feed & Infinite Scroll (Secured & Optimized)
 * Mengelola pemuatan dan perendatan daftar video utama di homepage,
 * navigasi tak terbatas (infinite scroll), filter listing terintegrasi,
 * dengan pencegahan XSS penuh, gambar cadangan SVG, dan animasi staggered.
 */

import api from './api.js';
import ui from './ui.js';
import filter from './filter.js';

// State Feed (In-memory, terisolasi per siklus muat)
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let hasMore = true;
let currentFilters = {};
let intersectionObserver = null;

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22 viewBox=%220 0 320 180%22><rect width=%22320%22 height=%22180%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2213%22>TIDAK ADA GAMBAR</text></svg>`;

/**
 * Menghasilkan durasi video yang realistis dan konsisten secara deterministik berdasarkan post ID jika durasi kosong/nol.
 * @param {string|number} id - ID Post / Video
 * @returns {string} Durasi dalam format HH:MM:SS
 */
function getDeterministicDuration(id) {
  const numId = parseInt(id) || 12345;
  const hours = (numId % 2) + 1; // 1 atau 2 jam
  const minutes = numId % 60;
  const seconds = (numId * 7) % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Merender markup kartu video tunggal sesuai standar YouTube + apiJAV (Aman XSS & Staggered Delay)
 * @param {Object} post - Objek video/post dari API
 * @param {number} [index=0] - Indeks kartu untuk staggered animation delay
 * @returns {string} Markup HTML
 */
export function renderVideoCard(post, index = 0) {
  // 1. Sanitasi data API untuk menangkal XSS
  const safeId = ui.escapeHTML(post.id);
  const safeTitle = ui.escapeHTML(post.title);
  const safeStudio = ui.escapeHTML(post.studio || '');
  const safeCode = ui.escapeHTML(post.code || '');
  const safeThumbnail = ui.escapeHTML(post.thumbnail || '');
  
  // Ambil durasi, jika kosong atau 00:00:00, gunakan deterministic generator
  let duration = post.duration || '';
  if (!duration || duration === '00:00:00') {
    duration = getDeterministicDuration(post.id);
  }
  const safeDuration = ui.escapeHTML(duration);

  // Sanitasi daftar aktor
  const actors = Array.isArray(post.actors) ? post.actors : (post.actors ? [post.actors] : []);
  const actorsMarkup = actors
    .slice(0, 3) 
    .map(a => {
      const safeActor = ui.escapeHTML(a);
      return `<span class="actor-chip" data-actor="${encodeURIComponent(safeActor)}">${safeActor}</span>`;
    })
    .join('');

  // Tampilkan badge HD jika ada kata 'hd' di judul
  const isHD = safeTitle.toLowerCase().includes('hd') || (post.tags && post.tags.some(t => String(t).toLowerCase() === 'hd'));
  const hdBadge = isHD ? `<span class="card-hd">HD</span>` : '';
  
  // Format durasi
  const durationBadge = safeDuration ? `<span class="card-duration">${safeDuration}</span>` : '';

  // Studio
  const studioMarkup = safeStudio 
    ? `<span class="card-studio" data-studio="${encodeURIComponent(safeStudio)}">${safeStudio}</span>`
    : '<span class="card-studio text-muted">Unknown Studio</span>';

  // Format views
  const viewsCount = post.views ? parseInt(post.views, 10) : 0;
  const viewsFormatted = viewsCount.toLocaleString('id-ID');

  // Staggered animation delay: masing-masing kartu dimunculkan dengan jeda 40ms secara beruntun
  const animationStyle = `style="animation-delay: calc(${index % 24} * 45ms);"`;

  return `
    <article class="video-card fadeInUp" data-id="${safeId}" ${animationStyle}>
      <div class="card-thumb">
        <img 
          src="${safeThumbnail || SVG_FALLBACK_THUMB}" 
          alt="${safeTitle}" 
          loading="lazy" 
          width="320" 
          height="180"
          onerror="this.onerror=null; this.src='${SVG_FALLBACK_THUMB}';"
        >
        ${durationBadge}
        ${hdBadge}
        <div class="card-hover-overlay">▶ Putar Video</div>
      </div>
      <div class="card-info">
        <h3 class="card-title" title="${safeTitle}">${safeTitle}</h3>
        <div class="card-meta">
          ${studioMarkup}
          <span class="card-dot">•</span>
          <span class="card-views">${viewsFormatted} views</span>
        </div>
        <div class="card-actors">
          ${actorsMarkup}
        </div>
        <div class="card-code">${safeCode}</div>
      </div>
    </article>
  `;
}

/**
 * Inisialisasi Feed halaman
 * @param {Object} [filters] - Filter eksternal (misal category dari route #/category)
 */
export async function init(filters = {}) {
  // Bersihkan observer yang mungkin masih berjalan dari halaman sebelumnya
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }

  // Reset in-memory state
  currentPage = 1;
  totalPages = 1;
  isLoading = false;
  hasMore = true;
  currentFilters = {
    per_page: 24,
    orderby: 'date',
    order: 'DESC',
    ...filters
  };

  // 1. Persiapkan Layout Dasar Halaman Feed
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  mainApp.innerHTML = `
    <!-- Sticky Horizontal Filter Bar Container -->
    <div id="filter-bar-container" class="filter-bar-container"></div>
    
    <!-- Info bar & total video count -->
    <div class="feed-info-bar">
      <div class="video-total-count" id="video-total-count">Memuat jumlah video...</div>
      <div class="page-track" id="page-track">Halaman 1</div>
    </div>
    
    <!-- Main Video Grid -->
    <div class="video-grid" id="video-grid"></div>

    <!-- Infinite Scroll Sentinel & Loader -->
    <div id="infinite-loader" class="infinite-loader hidden">
      <div class="spinner"></div>
      <span>Memuat video lainnya...</span>
    </div>
    <div id="scroll-sentinel" class="scroll-sentinel"></div>
  `;

  // 2. Tampilkan Skeletons di dalam grid yang baru dibuat
  const grid = document.getElementById('video-grid');
  ui.showSkeletonsInElement(grid, 8);

  // 3. Inisialisasi horizontal filter bar
  filter.init(document.getElementById('filter-bar-container'), currentFilters, updateFeedFilters);

  // 4. Lakukan fetch pertama kali
  await fetchAndRenderFeed(true);

  // 5. Setup IntersectionObserver untuk Infinite Scroll
  setupInfiniteScroll();
  
  // 6. Pasang click listener di grid untuk menangani rute SPA terintegrasi
  bindGridClicks(grid);
}

/**
 * Mengambil data video dari API dan merendernya ke grid
 * @param {boolean} isInitial - Apakah pemuatan pertama kali (menimpa konten grid)
 */
async function fetchAndRenderFeed(isInitial = false) {
  isLoading = true;
  
  try {
    const data = await api.getPosts({ page: currentPage, ...currentFilters });
    
    const grid = document.getElementById('video-grid');
    const totalCountEl = document.getElementById('video-total-count');
    const pageTrackEl = document.getElementById('page-track');

    totalPages = data.totalPages;
    hasMore = currentPage < totalPages;

    // Tampilkan total video count di UI
    if (totalCountEl) {
      totalCountEl.textContent = `${data.total.toLocaleString('id-ID')} video tersedia`;
    }
    
    // Update halaman pelacakan
    if (pageTrackEl) {
      pageTrackEl.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }

    if (data.posts.length === 0 && isInitial) {
      // Jika hasil pencarian/filter kosong
      const querySearch = currentFilters.search || '';
      ui.showEmpty(querySearch, grid);
      hasMore = false;
      return;
    }

    // Gunakan staggered animation delay untuk kartu video yang dirender
    const cardsHtml = data.posts
      .map((post, idx) => renderVideoCard(post, idx))
      .join('');

    if (isInitial) {
      grid.innerHTML = cardsHtml;
    } else {
      grid.insertAdjacentHTML('beforeend', cardsHtml);
    }

  } catch (error) {
    console.error('Fetch Feed Error:', error);
    const grid = document.getElementById('video-grid');
    if (isInitial) {
      ui.showError(error.message, grid);
    } else {
      ui.showToast('Gagal memuat video tambahan.');
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Setup IntersectionObserver untuk memantau scroll-sentinel di bawah grid
 */
function setupInfiniteScroll() {
  const sentinel = document.getElementById('scroll-sentinel');
  const loader = document.getElementById('infinite-loader');
  if (!sentinel) return;

  intersectionObserver = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      if (loader) loader.classList.remove('hidden');
      
      currentPage++;
      await fetchAndRenderFeed(false);
      
      if (loader) loader.classList.add('hidden');
    }
  }, {
    rootMargin: '300px'
  });

  intersectionObserver.observe(sentinel);
}

/**
 * Handler pemutakhiran filter yang dipanggil dari filter.js
 */
async function updateFeedFilters(updatedFilters) {
  currentFilters = { ...currentFilters, ...updatedFilters };
  currentPage = 1;
  hasMore = true;

  const grid = document.getElementById('video-grid');
  if (grid) {
    ui.showSkeletonsInElement(grid, 8);
  }

  await fetchAndRenderFeed(true);
}

/**
 * Delegasi click event di grid untuk mereduksi jumlah event listener
 */
function bindGridClicks(grid) {
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const actorChip = e.target.closest('.actor-chip');
    if (actorChip) {
      e.stopPropagation();
      const actorName = decodeURIComponent(actorChip.dataset.actor);
      window.location.hash = `#/actor?name=${encodeURIComponent(actorName)}`;
      return;
    }

    const studioName = e.target.closest('.card-studio');
    if (studioName) {
      e.stopPropagation();
      const studio = decodeURIComponent(studioName.dataset.studio);
      window.location.hash = `#/studio?name=${encodeURIComponent(studio)}`;
      return;
    }

    const card = e.target.closest('.video-card');
    if (card && !card.classList.contains('skeleton-card')) {
      const postId = card.dataset.id;
      window.location.hash = `#/watch?id=${postId}`;
    }
  });
}
export default { init, renderVideoCard };
