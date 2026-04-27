/**
 * EnakReels — API Layer
 * Handles RedGIFs authentication, data fetching, caching, and error handling.
 * Endpoints based on gallery-dl's reverse-engineered RedGIFs API.
 */
var RoxyAPI = (() => {
  // Use local CORS proxy in dev; in production, replace with your proxy URL
  const BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3001/v2'
    : 'https://api.redgifs.com/v2';

  let _token = null;
  let _tokenExpiry = 0;
  const _cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000;
  const _abortControllers = new Map();

  // Blocklist for categories
  const BLOCKED_WORDS = ['gay', 'gays', 'shemale', 'tranny', 'ladyboy', 'dick', 'cock', 'penis'];

  function _isBlocked(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return BLOCKED_WORDS.some(w => lower.includes(w));
  }

  function _abort(key) {
    if (_abortControllers.has(key)) {
      _abortControllers.get(key).abort();
      _abortControllers.delete(key);
    }
  }

  function _signal(key) {
    _abort(key);
    const ac = new AbortController();
    _abortControllers.set(key, ac);
    return ac.signal;
  }

  /** Get or refresh temporary token */
  async function _ensureToken() {
    if (_token && Date.now() < _tokenExpiry) return _token;
    const res = await fetch(`${BASE}/auth/temporary`);
    if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
    const data = await res.json();
    _token = data.token;
    _tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 min refresh
    return _token;
  }

  /** Authenticated fetch with auto-retry on 401 */
  async function _authFetch(url, opts = {}) {
    const token = await _ensureToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json, text/plain, */*',
      ...opts.headers,
    };
    let res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
      _token = null;
      _tokenExpiry = 0;
      const newToken = await _ensureToken();
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...opts, headers });
    }
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
  }

  /** Cached fetch */
  async function _cachedFetch(cacheKey, url, opts) {
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
    const data = await _authFetch(url, opts);
    _cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }

  /** Map raw gif to our normalized format */
  function _mapGif(gif) {
    if (!gif) return null;
    const urls = gif.urls || {};
    return {
      id: gif.id,
      title: gif.tags ? gif.tags.join(', ') : '',
      username: gif.userName || gif.username || 'unknown',
      tags: gif.tags || [],
      duration: gif.duration || 0,
      views: gif.views || 0,
      likes: gif.likes || 0,
      width: gif.width || 0,
      height: gif.height || 0,
      videoUrl: urls.hd || urls.sd || urls.vthumbnail || '',
      videoUrlSD: urls.sd || urls.vthumbnail || '',
      thumbnail: urls.thumbnail || urls.poster || '',
      poster: urls.poster || urls.thumbnail || '',
      createDate: gif.createDate || 0,
      verified: gif.verified || false,
    };
  }

  function _mapGifs(response) {
    const gifs = response.gifs || response.results || [];
    return {
      items: gifs.map(_mapGif).filter(g => g && g.videoUrl && !_isBlocked(g.title) && !g.tags.some(t => _isBlocked(t))),
      page: response.page || 1,
      pages: response.pages || 1,
      total: response.total || 0,
    };
  }

  // ─── Public API ───────────────────────────

  /** Trending feed — uses /v2/gifs/search with order=trending */
  async function getTrending(page = 1, count = 30) {
    const key = `trending_${page}_${count}`;
    const url = `${BASE}/gifs/search?order=trending&count=${count}&page=${page}`;
    const signal = _signal('feed');
    return _mapGifs(await _cachedFetch(key, url, { signal }));
  }

  /** Search by query — uses tags parameter (confirmed working) */
  async function search(query, page = 1, count = 30) {
    if (_isBlocked(query)) return { items: [], page: 1, pages: 1, total: 0 };
    const q = encodeURIComponent(query.trim());
    const signal = _signal('feed');

    // Primary: /v2/gifs/search with tags (confirmed working via API testing)
    const url = `${BASE}/gifs/search?tags=${q}&page=${page}&count=${count}&order=trending`;
    return _mapGifs(await _authFetch(url, { signal }));
  }

  /** Search suggestions */
  async function suggest(query) {
    if (!query || query.length < 2 || _isBlocked(query)) return [];
    const q = encodeURIComponent(query.trim());
    const signal = _signal('suggest');
    const url = `${BASE}/search/suggest?query=${q}`;
    try {
      const data = await _authFetch(url, { signal });
      let suggestions = [];
      if (Array.isArray(data)) suggestions = data.map(s => typeof s === 'string' ? s : s.text || s.name || '');
      else if (data.suggestions) suggestions = data.suggestions;
      else if (data.results) suggestions = data.results.map(r => r.text || r.name || r);
      return suggestions.filter(s => !_isBlocked(s));
    } catch (e) {
      if (e.name === 'AbortError') return [];
      throw e;
    }
  }

  /** Niche list — uses /v2/niches */
  async function getNiches() {
    const url = `${BASE}/niches`;
    const data = await _cachedFetch('niches', url, {});
    if (data && data.niches) {
      data.niches = data.niches.filter(n => !_isBlocked(n.name) && !_isBlocked(n.id));
    }
    return data;
  }

  /** Gifs by niche — uses /v2/niches/{niche}/gifs */
  async function getNicheGifs(nicheId, page = 1, count = 30) {
    if (_isBlocked(nicheId)) return { items: [], page: 1, pages: 1, total: 0 };
    const url = `${BASE}/niches/${encodeURIComponent(nicheId)}/gifs?page=${page}&count=${count}&order=trending`;
    const signal = _signal('feed');
    return _mapGifs(await _authFetch(url, { signal }));
  }

  /** Search niches */
  async function searchNiches(query) {
    if (_isBlocked(query)) return { niches: [] };
    const q = encodeURIComponent(query.trim());
    const url = `${BASE}/niches/search?search_text=${q}`;
    const data = await _authFetch(url, { signal: _signal('niche_search') });
    if (data && data.niches) {
      data.niches = data.niches.filter(n => !_isBlocked(n.name) && !_isBlocked(n.id));
    }
    return data;
  }

  /** Get single gif details */
  async function getGif(id) {
    const url = `${BASE}/gifs/${id.toLowerCase()}`;
    const data = await _cachedFetch(`gif_${id}`, url, {});
    return _mapGif(data.gif || data);
  }

  function cancel(key) { _abort(key); }
  function clearCache() { _cache.clear(); }

  return { getTrending, search, suggest, getNiches, searchNiches, getNicheGifs, getGif, cancel, clearCache };
})();

