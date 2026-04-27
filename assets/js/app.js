/**
 * EnakReels — App Orchestrator
 * Initializes all modules, wires up events, and manages top-level UX flows.
 */
var RoxyApp = (() => {
  let _searchDebounce = null;
  let _nicheSearchDebounce = null;

  async function init() {
    RoxyUI.restoreTheme();
    RoxyPlayer.init();
    RoxyFeed.init();
    _bindEvents();
    // Boot: load trending
    await _boot();
  }

  async function _boot() {
    try {
      await RoxyFeed.load('trending');
      _hideSplash();
    } catch (err) {
      console.error('Boot error:', err);
      _hideSplash();
      RoxyUI.showError('Couldn\'t load feed', 'Please refresh the page or try again later.');
    }
  }

  function _hideSplash() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app');
    setTimeout(() => {
      splash.classList.add('hidden');
      app.style.display = '';
      setTimeout(() => splash.remove(), 500);
    }, 400);
  }

  // ─── Event Bindings ─────────────────────────
  function _bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => _onTabClick(btn));
    });

    // Refresh
    document.getElementById('btn-refresh').addEventListener('click', _onRefresh);

    // Theme toggle
    document.getElementById('btn-theme').addEventListener('click', RoxyUI.toggleTheme);

    // Logo → go trending
    document.getElementById('header-logo').addEventListener('click', () => {
      _setActiveTab('trending');
      _closeSearch();
      _closeNichePanel();
      RoxyFeed.load('trending');
    });

    // Search
    _bindSearch();

    // Niche panel
    _bindNichePanel();

    // Error retry
    document.getElementById('error-retry').addEventListener('click', () => {
      RoxyUI.hideError();
      RoxyFeed.load(RoxyFeed.getMode());
    });

    // Empty action
    document.getElementById('empty-action').addEventListener('click', () => {
      RoxyUI.hideEmpty();
      _setActiveTab('trending');
      _closeSearch();
      RoxyFeed.load('trending');
    });

    // Keyboard: Escape closes drawers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        _closeSearch();
        _closeNichePanel();
      }
    });
  }

  // ─── Tabs ───────────────────────────────────
  function _onTabClick(btn) {
    const mode = btn.dataset.mode;
    _setActiveTab(mode);

    if (mode === 'trending') {
      _closeSearch();
      _closeNichePanel();
      RoxyFeed.load('trending');
    } else if (mode === 'search') {
      _closeNichePanel();
      _openSearch();
    } else if (mode === 'niches') {
      _closeSearch();
      _openNichePanel();
    }
  }

  function _setActiveTab(mode) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const target = document.querySelector(`.tab-btn[data-mode="${mode}"]`);
    if (target) target.classList.add('active');
  }

  // ─── Refresh ────────────────────────────────
  function _onRefresh() {
    const btn = document.getElementById('btn-refresh');
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 600);
    RoxyAPI.clearCache();
    RoxyFeed.load(RoxyFeed.getMode(), {
      query: document.getElementById('search-input').value,
    });
    RoxyUI.showToast('Feed refreshed');
  }

  // ─── Search ─────────────────────────────────
  function _bindSearch() {
    const drawer = document.getElementById('search-drawer');
    const backdrop = document.getElementById('search-backdrop');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');

    backdrop.addEventListener('click', _closeSearch);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.remove('visible');
      RoxyUI.renderSuggestions([]);
      input.focus();
    });

    input.addEventListener('input', () => {
      const val = input.value.trim();
      clearBtn.classList.toggle('visible', val.length > 0);
      clearTimeout(_searchDebounce);
      if (val.length < 2) {
        RoxyUI.renderSuggestions([]);
        return;
      }
      _searchDebounce = setTimeout(async () => {
        try {
          const suggestions = await RoxyAPI.suggest(val);
          RoxyUI.renderSuggestions(suggestions);
        } catch (e) {
          if (e.name !== 'AbortError') console.error('Suggest error:', e);
        }
      }, 300);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) executeSearch(val);
      }
    });
  }

  function _openSearch() {
    const drawer = document.getElementById('search-drawer');
    drawer.classList.add('open');
    setTimeout(() => document.getElementById('search-input').focus(), 100);
  }

  function _closeSearch() {
    const drawer = document.getElementById('search-drawer');
    drawer.classList.remove('open');
    RoxyUI.renderSuggestions([]);
  }

  function executeSearch(query) {
    _closeSearch();
    const input = document.getElementById('search-input');
    input.value = query;
    _setActiveTab('search');
    RoxyFeed.load('search', { query });
  }

  function searchByTag(tag) {
    executeSearch(tag);
  }

  // ─── Niche Panel ────────────────────────────
  function _bindNichePanel() {
    const panel = document.getElementById('niche-panel');
    const backdrop = document.getElementById('niche-backdrop');
    const closeBtn = document.getElementById('niche-close');
    const input = document.getElementById('niche-search-input');

    backdrop.addEventListener('click', _closeNichePanel);
    closeBtn.addEventListener('click', _closeNichePanel);

    input.addEventListener('input', () => {
      const val = input.value.trim();
      clearTimeout(_nicheSearchDebounce);
      _nicheSearchDebounce = setTimeout(async () => {
        try {
          if (val.length < 2) {
            await _loadDefaultNiches();
          } else {
            const data = await RoxyAPI.searchNiches(val);
            const niches = data.niches || data.results || data || [];
            RoxyUI.renderNiches(Array.isArray(niches) ? niches : []);
          }
        } catch (e) {
          if (e.name !== 'AbortError') console.error('Niche search error:', e);
        }
      }, 300);
    });
  }

  async function _openNichePanel() {
    const panel = document.getElementById('niche-panel');
    panel.classList.add('open');
    await _loadDefaultNiches();
  }

  function _closeNichePanel() {
    document.getElementById('niche-panel').classList.remove('open');
  }

  async function _loadDefaultNiches() {
    const list = document.getElementById('niche-list');
    list.innerHTML = '<div class="niche-loading"><div class="spinner"></div></div>';
    try {
      const data = await RoxyAPI.getNiches();
      const niches = data.niches || data.results || data || [];
      RoxyUI.renderNiches(Array.isArray(niches) ? niches : []);
    } catch (e) {
      list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);padding:40px 0;font-size:13px;">Failed to load niches</div>';
    }
  }

  function loadNiche(nicheId, nicheName) {
    _closeNichePanel();
    _setActiveTab('niches');
    RoxyFeed.load('niche', { nicheId, nicheName: nicheName || nicheId });
  }

  return { init, executeSearch, searchByTag, loadNiche };
})();

// ─── Bootstrap ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => RoxyApp.init());
