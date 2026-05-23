/**
 * MISSAV-J — Categories Browse Page
 * Full taxonomy grid for browsing all available JAV categories.
 * Mirrors the actors/studios page pattern with instant local search and animated card grid.
 */

import ui from './ui.js';
import i18n from './i18n.js';

// Comprehensive curated list of JAV categories with emoji icons and i18n dictionary keys
const ALL_CATEGORIES = [
  { name: 'Uncensored', icon: '🔓', key: 'category_uncensored' },
  { name: 'Amateur', icon: '📸', key: 'category_amateur' },
  { name: 'Subtitled', icon: '💬', key: 'category_subtitled' },
  { name: 'Creampie', icon: '🍦', key: 'category_creampie' },
  { name: 'Cosplay', icon: '🎭', key: 'category_cosplay' },
  { name: 'Mosaic', icon: '🟦', key: 'category_mosaic' },
  { name: 'Leaked', icon: '🔥', key: 'category_leaked' },
  { name: 'Big Tits', icon: '🍈', key: 'category_big_tits' },
  { name: 'MILF', icon: '👩', key: 'category_milf' },
  { name: 'Threesome', icon: '👥', key: 'category_threesome' },
  { name: 'Teen', icon: '🌸', key: 'category_teen' },
  { name: 'Massage', icon: '💆', key: 'category_massage' },
  { name: 'Anal', icon: '🍑', key: 'category_anal' },
  { name: 'Lesbian', icon: '👩‍❤️‍👩', key: 'category_lesbian' },
  { name: 'Bondage', icon: '⛓️', key: 'category_bondage' },
  { name: 'Office Lady', icon: '💼', key: 'category_office_lady' },
  { name: 'Nurse', icon: '🏥', key: 'category_nurse' },
  { name: 'Teacher', icon: '📚', key: 'category_teacher' },
  { name: 'Schoolgirl', icon: '🎒', key: 'category_schoolgirl' },
  { name: 'Stepmom', icon: '👩‍👧', key: 'category_stepmom' },
  { name: 'Gangbang', icon: '👥', key: 'category_gangbang' },
  { name: 'NTR', icon: '💔', key: 'category_ntr' },
  { name: 'POV', icon: '👁️', key: 'category_pov' },
  { name: 'Orgy', icon: '🎊', key: 'category_orgy' },
  { name: 'Squirting', icon: '💦', key: 'category_squirting' },
  { name: 'Blowjob', icon: '👄', key: 'category_blowjob' },
  { name: 'Handjob', icon: '✋', key: 'category_handjob' },
  { name: 'Footjob', icon: '🦶', key: 'category_footjob' },
  { name: 'Outdoor', icon: '🌳', key: 'category_outdoor' },
  { name: 'Voyeur', icon: '👀', key: 'category_voyeur' }
];

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
    // Translate category name if dictionary key exists
    const translatedName = i18n.t(cat.key) || safeName;
    const animationStyle = `style="animation-delay: calc(${idx % 16} * 40ms);"`;

    return `
      <div class="category-browse-card fadeInUp" data-name="${encodeURIComponent(cat.name)}" ${animationStyle}>
        <div class="category-icon-circle">
          <span class="category-icon-emoji">${cat.icon}</span>
        </div>
        <div class="category-browse-name">${translatedName}</div>
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
    
    <div class="actors-grid" id="categories-grid"></div>
  `;

  // Render all categories initially
  renderCategoriesGrid(ALL_CATEGORIES);

  // Instant local search filter
  const searchInput = document.getElementById('category-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

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
