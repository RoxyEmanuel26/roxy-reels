/**
 * MISSAV-J — API Client Wrapper
 * Mengintegrasikan front-end dengan apiJAV REST API.
 * Menyediakan fungsi-fungsi fetch terbungkus dengan penanganan error.
 */

const BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

function getActiveLang() {
  const segments = window.location.pathname.replace(/^\//, '').split('/');
  const lang = segments[0] || 'en';
  const validLangs = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
  return validLangs.includes(lang) ? lang : 'en';
}

// In-memory cache to prevent redundant API network requests
const apiCache = new Map();
// In-flight request deduplication map
const fetchPromises = new Map();

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi terputus: Server memakan waktu terlalu lama (Timeout)');
    }
    throw error;
  }
}

const api = {
  /**
   * Mengambil daftar video (feed & listing) dengan query parameters.
   * @param {Object} params - Query parameters (per_page, page, search, category, tag, actor, studio, orderby, order, after)
   * @returns {Promise<{posts: Array, total: number, totalPages: number}>}
   */
  async getPosts(params = {}) {
    try {
      const lang = getActiveLang();
      const cleanParams = { lang };
      
      // Bersihkan parameter dari nilai kosong/null/undefined agar tidak mengotori query string
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });

      const qs = new URLSearchParams(cleanParams).toString();
      const url = `${BASE}/posts?${qs}`;
      
      if (apiCache.has(url)) {
        return apiCache.get(url);
      }
      if (fetchPromises.has(url)) {
        return fetchPromises.get(url);
      }
      
      const fetchPromise = (async () => {
        const res = await fetchWithTimeout(url);
        
        if (!res.ok) {
          throw new Error(`API Error ${res.status}: ${res.statusText}`);
        }
        
        const posts = await res.json();
        
        // Baca dan parse response headers untuk keperluan pagination di UI
        const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
        
        const result = {
          posts: Array.isArray(posts) ? posts : [],
          total,
          totalPages
        };
        
        apiCache.set(url, result);
        fetchPromises.delete(url);
        return result;
      })();
      
      fetchPromises.set(url, fetchPromise);
      return fetchPromise;
    } catch (error) {
      console.error('[API getPosts Error]', error);
      throw error;
    }
  },

  /**
   * Mengambil detail lengkap video tunggal berdasarkan ID.
   * @param {string|number} id - ID Post / Video
   * @returns {Promise<Object>} Detail post/video
   */
  async getPost(id) {
    try {
      if (!id) throw new Error('Post ID wajib disertakan');
      const lang = getActiveLang();
      const cacheKey = `post:${id}:${lang}`;
      
      // 1. Cek apakah ada SSR state yang diinjeksi oleh Cloudflare
      if (window.__SSR_POST__ && String(window.__SSR_POST__.id) === String(id)) {
        apiCache.set(cacheKey, window.__SSR_POST__);
        delete window.__SSR_POST__; // Hapus dari global agar tidak menumpuk
      }

      // 2. Cek in-memory cache
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }

      // 3. Cek in-flight request deduplication
      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        const res = await fetchWithTimeout(`${BASE}/posts/${id}?lang=${lang}`);
        
        if (!res.ok) {
          throw new Error(`Post dengan ID ${id} tidak ditemukan (${res.status})`);
        }
        
        const post = await res.json();
        apiCache.set(cacheKey, post);
        fetchPromises.delete(cacheKey);
        return post;
      })();
      
      fetchPromises.set(cacheKey, fetchPromise);
      return fetchPromise;
    } catch (error) {
      console.error(`[API getPost ${id} Error]`, error);
      throw error;
    }
  },

  /**
   * Mengambil data embed player berdasarkan ID video.
   * @param {string|number} id - ID Post / Video
   * @returns {Promise<{iframe_html: string}>} Data player berisi markup iframe
   */
  async getPlayer(id) {
    try {
      if (!id) throw new Error('Player ID wajib disertakan');
      const lang = getActiveLang();
      const cacheKey = `player:${id}:${lang}`;
      
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        const res = await fetchWithTimeout(`${BASE}/player/${id}?lang=${lang}`);
        
        if (!res.ok) {
          throw new Error(`Player untuk ID ${id} gagal dimuat (${res.status})`);
        }
        
        const player = await res.json();
        apiCache.set(cacheKey, player);
        fetchPromises.delete(cacheKey);
        return player;
      })();
      
      fetchPromises.set(cacheKey, fetchPromise);
      return fetchPromise;
    } catch (error) {
      console.error(`[API getPlayer ${id} Error]`, error);
      throw error;
    }
  }
};

export default api;
