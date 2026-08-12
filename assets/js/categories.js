/**
 * MISSAV-J — Categories Browse Page
 * Full taxonomy grid for browsing all 499 JAV categories.
 * Integrates an alphabetical A-Z navigation index for instant search and filtering.
 */

import ui from './ui.js?v=2.8.58';
import i18n from './i18n.js?v=2.8.58';
import { ALL_CATEGORIES } from './categories_data.js?v=2.8.58';

/**
 * Render category grid cards based on filtered data
 * @param {Array} categories - List of categories to render
 * @param {string} [searchQuery=''] - Active search query for empty state
 */
function renderCategoriesGrid(categories, searchQuery = '') {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  if (categories.length === 0) {
    const escapedQuery = ui.escapeHTML(searchQuery);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
        <div class="empty-icon">📁</div>
        <h3>${i18n.t('category_not_found')}</h3>
        <p>${i18n.t('category_not_found_desc', { query: escapedQuery })}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map((cat, idx) => {
    const safeName = ui.escapeHTML(cat.name);
    // Translate category name if dictionary key exists in i18n
    const translatedName = i18n.t(cat.key) || safeName;
    const animationStyle = `style="animation-delay: calc(${idx % 16} * 20ms);"`;

    return `
      <div class="category-browse-card fadeInUp" data-name="${encodeURIComponent(cat.name)}" ${animationStyle}>
        <div class="category-icon-circle">
          <span class="category-icon-emoji">${cat.icon}</span>
        </div>
        <div class="category-info-box">
          <div class="category-browse-name" title="${translatedName}">${translatedName}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initialize the Categories browse page
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
        <h2 style="font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-1);">${i18n.t('categories_browse_title')}</h2>
        <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('categories_browse_desc')}</p>
      </div>
      
      <div class="taxonomy-search-wrapper">
        <input 
          type="text" 
          id="category-search-input" 
          class="taxonomy-search-input" 
          placeholder="${i18n.t('category_search_placeholder')}" 
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
    
    <div class="actors-grid all-categories-grid" id="categories-grid"></div>
  `;

  // Render all categories initially
  renderCategoriesGrid(ALL_CATEGORIES);

  const searchInput = document.getElementById('category-search-input');
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

  // Alphabetical Filter Clicks
  if (azBar) {
    azBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.az-letter-btn');
      if (!btn) return;

      const letter = btn.dataset.letter;
      setActiveLetter(letter);

      // Clear search input since we are filtering by letter group
      if (searchInput) searchInput.value = '';

      if (letter === 'ALL') {
        renderCategoriesGrid(ALL_CATEGORIES);
      } else {
        const filtered = ALL_CATEGORIES.filter(cat => {
          const firstChar = cat.name.trim().charAt(0).toUpperCase();
          if (letter === '#') {
            return !/^[A-Z]$/.test(firstChar);
          } else {
            return firstChar === letter;
          }
        });
        renderCategoriesGrid(filtered);
      }
    });
  }

  // Instant local search filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      // Typing in the search resets the active A-Z filter to "ALL"
      setActiveLetter('ALL');

      if (!query) {
        renderCategoriesGrid(ALL_CATEGORIES);
        return;
      }

      const filtered = ALL_CATEGORIES.filter(cat => {
        const translated = i18n.t(cat.key) || cat.name;
        return cat.name.toLowerCase().includes(query) ||
               translated.toLowerCase().includes(query);
      });

      renderCategoriesGrid(filtered, e.target.value.trim());
    });
  }

  // Click delegation for category cards
  const grid = document.getElementById('categories-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.category-browse-card');
      if (card) {
        const categoryName = decodeURIComponent(card.dataset.name);
        window.missavJNavigate(`/category?name=${encodeURIComponent(categoryName)}`);
      }
    });
  }
}

export default { init };

