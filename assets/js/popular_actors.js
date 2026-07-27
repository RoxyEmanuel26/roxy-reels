/**
 * MISSAV-J — Curated Popular Actors Page
 * Mengelola penelusuran aktris JAV terpopuler, filter pencarian instan lokal,
 * dan perutean dinamis ke feed video berbasis API.
 */

import ui from './ui.js?v=2.8.5';
import i18n from './i18n.js?v=2.8.5';

// Daftar Aktris JAV populer terkurasi dengan nama kanji & inisial premium
const POPULAR_ACTORS = [
  { name: 'Eimi Fukada', native: '深田えいみ', letter: 'E' },
  { name: 'Yua Mikami', native: '三上悠亜', letter: 'Y' },
  { name: 'Arina Hashimoto', native: '橋本ありな', letter: 'A' },
  { name: 'Kana Momonogi', native: '桃乃木かな', letter: 'K' },
  { name: 'Remu Suzumori', native: '涼森れむ', letter: 'R' },
  { name: 'Saeko Matsushita', native: '松下紗栄子', letter: 'S' },
  { name: 'Minami Hatsukawa', native: '初川みなみ', letter: 'M' },
  { name: 'Karen Kanon', native: '花音かれん', letter: 'K' },
  { name: 'Yura Kano', native: '架乃ゆら', letter: 'Y' },
  { name: 'Julia', native: 'ジュリア', letter: 'J' },
  { name: 'Shoko Takahashi', native: '高橋しょう子', letter: 'S' },
  { name: 'Tsukasa Aoi', native: '葵つかさ', letter: 'T' },
  { name: 'Ai Uehara', native: '上原亜衣', letter: 'A' },
  { name: 'Maria Ozawa', native: '小沢マリア', letter: 'M' },
  { name: 'Sora Aoi', native: '蒼井そら', letter: 'S' }
];

// Hilangkan duplikasi nama jika ada
const UNIQUE_ACTORS = Array.from(new Map(POPULAR_ACTORS.map(item => [item.name, item])).values());

/**
 * Render grid kartu aktris berdasarkan data yang disaring
 * @param {Array} actorsList - Daftar aktris yang akan dirender
 * @param {string} [searchQuery=''] - Query pencarian aktif untuk render tombol fallback
 */
function renderActorsGrid(actorsList, searchQuery = '') {
  const grid = document.getElementById('actors-grid');
  if (!grid) return;

  if (actorsList.length === 0) {
    const escapedQuery = ui.escapeHTML(searchQuery);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-icon">🎭</div>
        <h3>${i18n.t('actor_not_found')}</h3>
        <p>${i18n.t('actor_not_found_desc', { query: escapedQuery })}</p>
        <button id="search-api-actor-btn" class="btn-primary" data-name="${encodeURIComponent(searchQuery)}">
          ${i18n.t('search_actor_on_server', { query: escapedQuery })}
        </button>
      </div>
    `;

    // Pasang handler tombol pencarian server
    const apiBtn = document.getElementById('search-api-actor-btn');
    if (apiBtn) {
      apiBtn.addEventListener('click', () => {
        const actorName = decodeURIComponent(apiBtn.dataset.name);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
      });
    }
    return;
  }

  // Render kartu aktris dengan staggered animation delay
  grid.innerHTML = actorsList.map((actor, idx) => {
    const safeName = ui.escapeHTML(actor.name);
    const safeNative = ui.escapeHTML(actor.native);
    const safeLetter = ui.escapeHTML(actor.letter || actor.name.charAt(0));
    const animationStyle = `style="animation-delay: calc(${idx % 16} * 40ms);"`;

    const lang = i18n.getLang() || 'en';
    const actorUrl = `/${lang}/actor?name=${encodeURIComponent(actor.name)}`;

    return `
      <a href="${actorUrl}" class="actor-browse-card fadeInUp" data-name="${encodeURIComponent(actor.name)}" ${animationStyle}>
        <div class="actor-avatar-circle">
          <span class="actor-initial">${safeLetter}</span>
        </div>
        <div class="actor-info-box">
          <div class="actor-browse-name" title="${safeName}">${safeName}</div>
          <div class="actor-browse-native" title="${safeNative}">${safeNative}</div>
        </div>
      </a>
    `;
  }).join('');
}

/**
 * Inisialisasi halaman Aktor
 */
export function init() {
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  // 1. Tulis template layout utama Aktor
  mainApp.innerHTML = `
    <div class="taxonomy-browse-header">
      <div>
        <h2 style="font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-1);">${i18n.t('actors_browse_title')}</h2>
        <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('actors_browse_desc')}</p>
      </div>
      
      <!-- Input pencarian taksonomi -->
      <div class="taxonomy-search-wrapper">
        <input 
          type="text" 
          id="actor-search-input" 
          class="taxonomy-search-input" 
          placeholder="${i18n.t('actor_search_placeholder')}" 
          autocomplete="off"
          spellcheck="false"
        >
        <span class="taxonomy-search-icon">🔍</span>
      </div>
    </div>
    
    <!-- Grid Aktris -->
    <div class="actors-grid" id="actors-grid"></div>
  `;

  // 2. Render list aktris awal
  renderActorsGrid(UNIQUE_ACTORS);

  // 3. Pasang search listener untuk filter instan lokal
  const searchInput = document.getElementById('actor-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (!query) {
        renderActorsGrid(UNIQUE_ACTORS);
        return;
      }

      const filtered = UNIQUE_ACTORS.filter(actor => 
        actor.name.toLowerCase().includes(query) || 
        actor.native.toLowerCase().includes(query)
      );
      
      renderActorsGrid(filtered, e.target.value.trim());
    });
  }

  // 4. Pasang click handler delegasi pada grid aktris
  const grid = document.getElementById('actors-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.actor-browse-card');
      if (card) {
        e.preventDefault();
        const actorName = decodeURIComponent(card.dataset.name);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
      }
    });
  }
}

export default { init };

