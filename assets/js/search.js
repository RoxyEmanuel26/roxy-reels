/**
 * MISSAV-J — Search Page & Live Debounce (Secured & Optimized)
 * Mengelola pemuatan pencarian, penundaan eksekusi keyboard (debounce 400ms),
 * perayapan infinite scroll, penyorotan kata kunci yang aman dari XSS, dan staggered delay.
 */

import api from './api.js?v=2.8.67';
import ui from './ui.js?v=2.8.67';
import filter from './filter.js?v=2.8.67';
import { renderVideoCard, bindHoverPreviews } from './feed.js?v=2.8.67';
import i18n from './i18n.js?v=2.8.67';

// State Halaman Pencarian (In-memory)
let currentQuery = '';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let hasMore = true;
let searchTimeout = null;
let intersectionObserver = null;
let currentFilters = {};
let seenCodes = new Set();
let seenTitles = new Set();

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22 viewBox=%220 0 320 180%22><rect width=%22320%22 height=%22180%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2213%22>NO IMAGE</text></svg>`;

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
  // Pre-translate title so cardHtml and highlight target match perfectly
  const translatedTitle = i18n.translateVideoTitle(post.title);
  const safeTitle = ui.escapeHTML(translatedTitle);
  
  // Pass the pre-translated title into renderVideoCard
  const cardHtml = renderVideoCard({ ...post, title: translatedTitle }, index);
  
  // Highlight query inside the translated safe title
  const highlightedTitle = highlightText(safeTitle, currentQuery);
  
  return cardHtml.replace(
    `class="card-title" title="${safeTitle}">${safeTitle}`,
    () => `class="card-title" title="${safeTitle}">${highlightedTitle}`
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
  seenCodes = new Set();
  seenTitles = new Set();
  currentFilters = {
    search: currentQuery,
    per_page: 24,
    orderby: 'views', // Hasil pencarian diurutkan berdasarkan views terpopuler secara default
    order: 'DESC'
  };

  // Sinkronisasikan teks input di header search bar dan fokuskan
  const headerSearchInput = document.getElementById('header-search-input');
  if (headerSearchInput) {
    headerSearchInput.value = currentQuery;
    headerSearchInput.focus();
  }

  // 1. Gambar layout dasar halaman pencarian
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  mainApp.innerHTML = `
    <!-- Sticky Horizontal Filter Bar Container -->
    <div id="filter-bar-container" class="filter-bar-container"></div>
    
    <div class="feed-info-bar">
      <div class="video-total-count" id="search-total-count">${i18n.t('searching_videos')}</div>
      <div class="page-track" id="search-page-track">${i18n.t('page_format', { current: 1, total: 1 })}</div>
    </div>
    
    <!-- Video Grid -->
    <div class="video-grid" id="search-video-grid"></div>

    <!-- Infinite Scroll Sentinel & Loader -->
    <div id="search-infinite-loader" class="infinite-loader hidden">
      <div class="spinner"></div>
      <span>${i18n.t('loading_more_search')}</span>
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

  // 6.5. Bind hover previews di grid pencarian
  bindHoverPreviews(grid);

  // 7. Expose live query trigger for app.js
  // [FIX K-4] Implementasi debounce sesungguhnya: batalkan timer sebelumnya dan
  // tunggu 400ms idle sebelum memicu fetch — mencegah N+1 request per keystroke.
  window.missavJSearchTriggerLiveQuery = (val) => {
    if (window.missavJState.currentPath !== '/search') return;

    // Batalkan timer debounce sebelumnya jika user masih mengetik
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    if (val.length >= 2) {
      searchTimeout = setTimeout(async () => {
        searchTimeout = null;

        // Guard: pastikan user masih di halaman search saat timer selesai
        if (window.missavJState.currentPath !== '/search') return;

        currentQuery = val;
        currentFilters.search = val;
        currentPage = 1;
        hasMore = true;
        seenCodes = new Set();
        seenTitles = new Set();

        // Perbarui URL dengan clean path (bukan hash agar tidak merusak History API)
        const currentLang = i18n.getLang() || 'en';
        const newPath = `/${currentLang}/search?q=${encodeURIComponent(val)}`;
        history.replaceState(null, '', newPath);

        const grid = document.getElementById('search-video-grid');
        if (grid) {
          ui.showSkeletonsInElement(grid, 8);
          await fetchAndRenderSearch(true);
        }
      }, 400); // 400ms debounce — hanya eksekusi setelah 400ms berhenti mengetik
    } else if (val.length === 0) {
      // Jika input dikosongkan, reset UI dan kembalikan URL search tanpa query
      currentQuery = '';
      currentFilters.search = '';
      const currentLang = i18n.getLang() || 'en';
      history.replaceState(null, '', `/${currentLang}/search`);
      const grid = document.getElementById('search-video-grid');
      if (grid) ui.showEmpty('', grid);
    }
  };
}

/**
 * Mengambil hasil pencarian dari API dan merendernya
 * @param {boolean} isInitial - Apakah loading pertama kali
 */
async function fetchAndRenderSearch(isInitial = false) {
  isLoading = true;
  
  try {
    const requestedQuery = currentQuery;
    const requestedPage = currentPage;
    const data = await api.getPosts({ page: requestedPage, ...currentFilters });
    
    // Race condition protection: if query or page changed while fetching, abort render
    if (currentQuery !== requestedQuery || currentPage !== requestedPage) {
      console.warn('[Search] Stale request aborted (Query or Page changed)');
      return;
    }
    
    const grid = document.getElementById('search-video-grid');
    if (!grid) return;

    const totalCountEl = document.getElementById('search-total-count');
    const pageTrackEl = document.getElementById('search-page-track');

    totalPages = data.totalPages;
    hasMore = currentPage < totalPages;

    if (totalCountEl) {
      const safeQueryDisplay = ui.escapeHTML(currentQuery);
      totalCountEl.textContent = i18n.t('search_results', { query: safeQueryDisplay, total: data.total.toLocaleString(i18n.getLang()) });
    }

    if (pageTrackEl) {
      pageTrackEl.textContent = i18n.t('page_format', { current: currentPage, total: totalPages });
    }

    if (data.posts.length === 0 && isInitial) {
      ui.showEmpty(currentQuery, grid);
      hasMore = false;
      return;
    }

    // Deduplikasi posts berdasarkan JAV code dan Title unik
    const uniquePosts = data.posts.filter(p => {
      const code = (p.code || '').trim().toUpperCase();
      if (code && seenCodes.has(code)) return false;
      const title = (p.title || '').trim().toLowerCase();
      if (title && seenTitles.has(title)) return false;
      if (code) seenCodes.add(code);
      if (title) seenTitles.add(title);
      return true;
    });

    // Merender dengan cascading staggered animation delay
    const cardsHtml = uniquePosts
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
    if (!grid) return;
    if (isInitial) {
      hasMore = false;
    } else {
      currentPage--;
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

// setupHeaderLiveSearch removed in favor of global app.js listener

/**
 * Callback saat sort/filter bar diubah
 */
async function updateSearchFilters(updatedFilters) {
  currentFilters = { ...currentFilters, ...updatedFilters };
  currentPage = 1;
  hasMore = true;
  seenCodes = new Set();
  seenTitles = new Set();

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
      e.preventDefault();
      const actorName = decodeURIComponent(actorChip.dataset.actor);
      window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
      return;
    }

    const studioName = e.target.closest('.card-studio');
    if (studioName) {
      const studio = decodeURIComponent(studioName.dataset.studio);
      window.missavJNavigate(`/studio?name=${encodeURIComponent(studio)}`);
      return;
    }

    const card = e.target.closest('.video-card');
    if (card && !card.classList.contains('skeleton-card')) {
      const postId = card.dataset.id;
      const code = card.dataset.code || '';
      const title = card.dataset.title || '';
      window.missavJNavigateToWatch(postId, code, title);
    }
  });
}

