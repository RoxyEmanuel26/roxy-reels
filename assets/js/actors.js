/**
 * MISSAV-J — All Actors Browse Page
 * Full taxonomy grid for browsing all 7376 JAV actors.
 * Integrates an alphabetical A-Z navigation index for instant search and filtering.
 */

import ui from './ui.js?v=2.8.70';
import i18n from './i18n.js?v=2.8.70';
import { ALL_ACTORS } from './actors_data.js?v=2.8.70';

/**
 * Render actor grid cards based on filtered data
 * @param {Array} actorsList - List of actors to render
 * @param {string} [searchQuery=''] - Active search query for empty state
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

    // Hook search fallback button to API route
    const apiBtn = document.getElementById('search-api-actor-btn');
    if (apiBtn) {
      apiBtn.addEventListener('click', () => {
        const actorName = decodeURIComponent(apiBtn.dataset.name);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
      });
    }
    return;
  }

  grid.innerHTML = actorsList.map((actor, idx) => {
    const safeName = ui.escapeHTML(actor.name);
    const safeNative = ui.escapeHTML(actor.native);
    const safeLetter = ui.escapeHTML(actor.letter || (actor.name ? actor.name.charAt(0).toUpperCase() : '#'));
    const animationStyle = `style="animation-delay: calc(${idx % 16} * 15ms);"`;

    const nativeHtml = safeNative ? `<div class="actor-browse-native" title="${safeNative}">${safeNative}</div>` : '';
    const countHtml = actor.count !== undefined ? `<div class="actor-video-count">🎬 ${actor.count}</div>` : '';

    const lang = i18n.getLang() || 'en';
    const actorUrl = `/${lang}/actor?name=${encodeURIComponent(actor.name)}`;

    return `
      <a href="${actorUrl}" class="actor-browse-card fadeInUp" data-name="${encodeURIComponent(actor.name)}" ${animationStyle}>
        <div class="actor-avatar-circle">
          <span class="actor-initial">${safeLetter}</span>
        </div>
        <div class="actor-info-box">
          <div class="actor-browse-name" title="${safeName}">${safeName}</div>
          ${nativeHtml}
        </div>
        ${countHtml}
      </a>
    `;
  }).join('');
}

/**
 * Initialize the All Actors browse page
 */
export function init() {
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  const alphabet = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

  const alphabetHtml = alphabet.map(letter => {
    return `<button class="az-letter-btn ${letter === 'ALL' ? 'active' : ''}" data-letter="${letter}">${letter}</button>`;
  }).join('');

  mainApp.innerHTML = `
    <div class="taxonomy-browse-header">
      <div>
        <h2 style="font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-1);">${i18n.t('actors_browse_title_all') || 'All Actors'}</h2>
        <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('actors_browse_desc_all') || 'Browse and search all JAV actresses alphabetically'}</p>
      </div>
      
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

    <!-- A-Z Alphabetical Index Filter Bar -->
    <div class="az-filter-container">
      <div class="az-filter-bar" id="az-filter-bar">
        ${alphabetHtml}
      </div>
    </div>
    
    <div class="actors-grid all-actors-grid" id="actors-grid"></div>
  `;

  // Render initial list (first 250 actors for performance limit on initial mount, ALL is huge!)
  // It is best to slice the initial mount to the first 250 unless filtered, to keep DOM rendering instant.
  renderActorsGrid(ALL_ACTORS.slice(0, 250));

  const searchInput = document.getElementById('actor-search-input');
  const azBar = document.getElementById('az-filter-bar');
  let activeLetter = 'ALL';

  function setActiveLetter(letter) {
    activeLetter = letter;
    if (azBar) {
      const buttons = azBar.querySelectorAll('.az-letter-btn');
      buttons.forEach(btn => {
        if (btn.dataset.letter === letter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  // Alphabetical Index Click Handler
  if (azBar) {
    azBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.az-letter-btn');
      if (!btn) return;

      const letter = btn.dataset.letter;
      setActiveLetter(letter);

      // Reset search bar when letter filter is clicked
      if (searchInput) searchInput.value = '';

      if (letter === 'ALL') {
        // Show first 250 on full list to keep browser fast, user can search for specific names
        renderActorsGrid(ALL_ACTORS.slice(0, 250));
      } else {
        const filtered = ALL_ACTORS.filter(actor => {
          if (letter === '#') {
            return actor.letter === '#';
          } else {
            return actor.letter === letter;
          }
        });
        renderActorsGrid(filtered);
      }
    });
  }

  // Live Local Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      // Typing in the search resets active A-Z letter to "ALL"
      setActiveLetter('ALL');

      if (!query) {
        renderActorsGrid(ALL_ACTORS.slice(0, 250));
        return;
      }

      const filtered = ALL_ACTORS.filter(actor => {
        return actor.name.toLowerCase().includes(query) ||
               actor.native.toLowerCase().includes(query);
      });

      // Limit search results to 200 items for layout performance
      renderActorsGrid(filtered.slice(0, 200), e.target.value.trim());
    });
  }

  // Click delegation for actor cards
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

