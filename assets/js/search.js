/**
 * MISSAV-J — Search Page & Live Debounce (Secured & Optimized)
 * Mengelola pemuatan pencarian, penundaan eksekusi keyboard (debounce 400ms),
 * perayapan infinite scroll, penyorotan kata kunci yang aman dari XSS, dan staggered delay.
 */

import api from './api.js';
import ui from './ui.js';
import filter from './filter.js';
import { renderVideoCard } from './feed.js';

// State Halaman Pencarian (In-memory)
let currentQuery = '';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let hasMore = true;
let searchTimeout = null;
let intersectionObserver = null;
let currentFilters = {};

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22 viewBox=%220 0 320 180%22><rect width=%22320%22 height=%22180%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2213%22>TIDAK ADA GAMBAR</text></svg>`;

/**
 * Menyorot (highlight) teks kata kunci di dalam teks yang sudah tersanitasi secara aman
 * @param {string} text - Teks asli yang sudah di-escape HTML
 * @param {string} keyword - Kata kunci pencarian mentah
 * @returns {string} Hasil markup HTML dengan highlight aman
 */
function highlightText(text, keyword) {
  if (!keyword) return text;
  
  // Sanitasi keyword sebelum menggunakannya di regex untuk mencegah injeksi regex
  const safeKeyword = ui.escapeHTML(keyword);
  const escapedKeyword = safeKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  if (!escapedKeyword) return text;
  
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Merender kartu video khusus pencarian dengan penyorotan judul (Aman XSS & Staggered Delay)
 * @param {Object} post - Objek video
 * @param {number} index - Indeks urutan kartu untuk staggered delay
 * @returns {string} Markup HTML
 */
function renderSearchVideoCard(post, index) {
  // 1. renderVideoCard secara default sudah melakukan sanitasi penuh terhadap judul,
  // sehingga kita menerima string kartu yang aman dengan judul tersanitasi di dalamnya.
  const cardHtml = renderVideoCard(post, index);
  
  // 2. Ambil judul tersanitasi dan terapkan penyorotan kata kunci di atas teks aman tersebut
  const safeTitle = ui.escapeHTML(post.title);
  const highlightedTitle = highlightText(safeTitle, currentQuery);
  
  // Ganti title asli dalam DOM string dengan title hasil sorotan aman
  return cardHtml.replace(
    `class="card-title" title="${safeTitle}">${safeTitle}`,
    `class="card-title" title="${safeTitle}">${highlightedTitle}`
  );
}

/**
 * Inisialisasi Halaman Pencarian
 * @param {string} query - Kata kunci pencarian awal
 */
export async function init(query = '') {
  // Matikan observer dari navigasi sebelumnya
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }

  currentQuery = query.trim();
  currentPage = 1;
  totalPages = 1;
  isLoading = false;
  hasMore = true;
  currentFilters = {
    search: currentQuery,
    per_page: 24,
    orderby: 'views', // Hasil pencarian diurutkan berdasarkan views terpopuler secara default
    order: 'DESC'
  };

  // Sinkronisasikan teks input di header search bar
  const headerSearchInput = document.getElementById('header-search-input');
  if (headerSearchInput) {
    headerSearchInput.value = currentQuery;
  }

  // 1. Gambar layout dasar halaman pencarian
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  mainApp.innerHTML = `
    <!-- Sticky Horizontal Filter Bar Container -->
    <div id="filter-bar-container" class="filter-bar-container"></div>
    
    <div class="feed-info-bar">
      <div class="video-total-count" id="search-total-count">Mencari video...</div>
      <div class="page-track" id="search-page-track">Halaman 1</div>
    </div>
    
    <!-- Video Grid -->
    <div class="video-grid" id="search-video-grid"></div>

    <!-- Infinite Scroll Sentinel & Loader -->
    <div id="search-infinite-loader" class="infinite-loader hidden">
      <div class="spinner"></div>
      <span>Memuat hasil pencarian lainnya...</span>
    </div>
    <div id="search-scroll-sentinel" class="scroll-sentinel"></div>
  `;

  // 2. Tampilkan Skeletons awal
  const grid = document.getElementById('search-video-grid');
  ui.showSkeletonsInElement(grid, 8);

  // 3. Inisialisasi horizontal filter bar khusus pencarian
  filter.init(document.getElementById('filter-bar-container'), currentFilters, updateSearchFilters);

  // 4. Lakukan pemuatan data awal
  if (currentQuery) {
    await fetchAndRenderSearch(true);
  } else {
    // Jika query kosong, tampilkan empty state default
    ui.showEmpty('', grid);
  }

  // 5. Setup Infinite Scroll
  setupInfiniteScroll();

  // 6. Bind click events di grid
  bindGridClicks(grid);

  // 7. Setup Event Debounce 400ms pada Header Input
  setupHeaderLiveSearch();
}

/**
 * Mengambil hasil pencarian dari API dan merendernya
 * @param {boolean} isInitial - Apakah loading pertama kali
 */
async function fetchAndRenderSearch(isInitial = false) {
  isLoading = true;
  
  try {
    const data = await api.getPosts({ page: currentPage, ...currentFilters });
    
    const grid = document.getElementById('search-video-grid');
    const totalCountEl = document.getElementById('search-total-count');
    const pageTrackEl = document.getElementById('search-page-track');

    totalPages = data.totalPages;
    hasMore = currentPage < totalPages;

    if (totalCountEl) {
      const safeQueryDisplay = ui.escapeHTML(currentQuery);
      totalCountEl.textContent = `Hasil untuk "${safeQueryDisplay}" (${data.total.toLocaleString('id-ID')} video ditemukan)`;
    }

    if (pageTrackEl) {
      pageTrackEl.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }

    if (data.posts.length === 0 && isInitial) {
      ui.showEmpty(currentQuery, grid);
      hasMore = false;
      return;
    }

    // Merender dengan cascading staggered animation delay
    const cardsHtml = data.posts
      .map((post, idx) => renderSearchVideoCard(post, idx))
      .join('');

    if (isInitial) {
      grid.innerHTML = cardsHtml;
    } else {
      grid.insertAdjacentHTML('beforeend', cardsHtml);
    }

  } catch (error) {
    console.error('Fetch Search Error:', error);
    const grid = document.getElementById('search-video-grid');
    if (isInitial) {
      ui.showError(error.message, grid);
    } else {
      ui.showToast('Gagal memuat hasil pencarian tambahan.');
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Setup IntersectionObserver untuk pencarian tak terbatas
 */
function setupInfiniteScroll() {
  const sentinel = document.getElementById('search-scroll-sentinel');
  const loader = document.getElementById('search-infinite-loader');
  if (!sentinel) return;

  intersectionObserver = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      if (loader) loader.classList.remove('hidden');
      currentPage++;
      await fetchAndRenderSearch(false);
      if (loader) loader.classList.add('hidden');
    }
  }, {
    rootMargin: '300px'
  });

  intersectionObserver.observe(sentinel);
}

/**
 * Setup Live Debounce 400ms pada Header Input
 */
function setupHeaderLiveSearch() {
  const searchInput = document.getElementById('header-search-input');
  if (!searchInput) return;

  // Hapus listener lama jika ada (agar tidak double firing)
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);

  newSearchInput.value = currentQuery;
  newSearchInput.focus();

  // Re-bind enter key
  newSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = newSearchInput.value.trim();
      if (val) {
        window.location.hash = `#/search?q=${encodeURIComponent(val)}`;
      }
    }
  });

  newSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
      if (val.length >= 2) {
        currentQuery = val;
        currentFilters.search = val;
        currentPage = 1;
        hasMore = true;

        // Perbarui hash URL tanpa reload SPA router
        const newHash = `#/search?q=${encodeURIComponent(val)}`;
        history.replaceState(null, '', newHash);

        const grid = document.getElementById('search-video-grid');
        if (grid) {
          ui.showSkeletonsInElement(grid, 8);
        }

        await fetchAndRenderSearch(true);
      }
    }, 400); // Debounce 400ms
  });
}

/**
 * Callback saat sort/filter bar diubah
 */
async function updateSearchFilters(updatedFilters) {
  currentFilters = { ...currentFilters, ...updatedFilters };
  currentPage = 1;
  hasMore = true;

  const grid = document.getElementById('search-video-grid');
  if (grid) {
    ui.showSkeletonsInElement(grid, 8);
  }

  await fetchAndRenderSearch(true);
}

/**
 * Delegasi click event di grid pencarian
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
