/**
 * MISSAV-J — Studios Taxonomy Page
 * Mengelola penelusuran studio JAV terkemuka, filter pencarian instan lokal,
 * dan perutean dinamis ke feed video berbasis API.
 */

import ui from './ui.js?v=2.8.6';
import i18n from './i18n.js?v=2.8.6';

// Daftar Studio JAV terkemuka terkurasi dengan nama singkatan/logo visual
const POPULAR_STUDIOS = [
  { name: 'S1 NO.1 STYLE', label: 'S1' },
  { name: 'MOODYZ', label: 'MOODYZ' },
  { name: 'PRESTIGE', label: 'PRESTIGE' },
  { name: 'Soft On Demand', label: 'SOD' },
  { name: 'Idea Pocket', label: 'I.P.' },
  { name: 'FALENO', label: 'FALENO' },
  { name: 'MUTEKI', label: 'MUTEKI' },
  { name: 'Fitch', label: 'FITCH' },
  { name: 'OPPAL', label: 'OPPAL' },
  { name: 'Kawaii*', label: 'KAWAII*' },
  { name: 'KMP', label: 'KMP' },
  { name: 'Attackers', label: 'ATTACK' },
  { name: 'Premium', label: 'PREMIUM' },
  { name: 'Other', label: 'OTHER' }
];

// Hilangkan duplikasi nama jika ada
const UNIQUE_STUDIOS = Array.from(new Map(POPULAR_STUDIOS.map(item => [item.name, item])).values());

/**
 * Render grid kartu studio berdasarkan data yang disaring
 * @param {Array} studiosList - Daftar studio yang akan dirender
 * @param {string} [searchQuery=''] - Query pencarian aktif untuk render tombol fallback
 */
function renderStudiosGrid(studiosList, searchQuery = '') {
  const grid = document.getElementById('studios-grid');
  if (!grid) return;

  if (studiosList.length === 0) {
    const escapedQuery = ui.escapeHTML(searchQuery);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-icon">🎬</div>
        <h3>${i18n.t('studio_not_found')}</h3>
        <p>${i18n.t('studio_not_found_desc', { query: escapedQuery })}</p>
        <button id="search-api-studio-btn" class="btn-primary" data-name="${encodeURIComponent(searchQuery)}">
          ${i18n.t('search_studio_on_server', { query: escapedQuery })}
        </button>
      </div>
    `;

    // Pasang handler tombol pencarian server
    const apiBtn = document.getElementById('search-api-studio-btn');
    if (apiBtn) {
      apiBtn.addEventListener('click', () => {
        const studioName = decodeURIComponent(apiBtn.dataset.name);
        window.missavJNavigate(`/studio?name=${encodeURIComponent(studioName)}`);
      });
    }
    return;
  }

  // Render kartu studio dengan staggered animation delay
  grid.innerHTML = studiosList.map((studio, idx) => {
    const safeName = ui.escapeHTML(studio.name);
    const safeLabel = ui.escapeHTML(studio.label);
    const animationStyle = `style="animation-delay: calc(${idx % 12} * 45ms);"`;

    return `
      <div class="studio-browse-card fadeInUp" data-name="${encodeURIComponent(studio.name)}" ${animationStyle}>
        <div class="studio-logo-box">
          <span class="studio-icon-text">${safeLabel}</span>
        </div>
        <div class="studio-browse-name">${safeName}</div>
      </div>
    `;
  }).join('');
}

/**
 * Inisialisasi halaman Studio
 */
export function init() {
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  // 1. Tulis template layout utama Studio
  mainApp.innerHTML = `
    <div class="taxonomy-browse-header">
      <div>
        <h2 style="font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-1);">${i18n.t('studios_browse_title')}</h2>
        <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('studios_browse_desc')}</p>
      </div>
      
      <!-- Input pencarian taksonomi -->
      <div class="taxonomy-search-wrapper">
        <input 
          type="text" 
          id="studio-search-input" 
          class="taxonomy-search-input" 
          placeholder="${i18n.t('studio_search_placeholder')}" 
          autocomplete="off"
          spellcheck="false"
        >
        <span class="taxonomy-search-icon">🔍</span>
      </div>
    </div>
    
    <!-- Grid Studio -->
    <div class="studios-grid" id="studios-grid"></div>
  `;

  // 2. Render list studio awal
  renderStudiosGrid(UNIQUE_STUDIOS);

  // 3. Pasang search listener untuk filter instan lokal
  const searchInput = document.getElementById('studio-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (!query) {
        renderStudiosGrid(UNIQUE_STUDIOS);
        return;
      }

      const filtered = UNIQUE_STUDIOS.filter(studio => 
        studio.name.toLowerCase().includes(query) || 
        studio.label.toLowerCase().includes(query)
      );
      
      renderStudiosGrid(filtered, e.target.value.trim());
    });
  }

  // 4. Pasang click handler delegasi pada grid studio
  const grid = document.getElementById('studios-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.studio-browse-card');
      if (card) {
        const studioName = decodeURIComponent(card.dataset.name);
        window.missavJNavigate(`/studio?name=${encodeURIComponent(studioName)}`);
      }
    });
  }
}

export default { init };

