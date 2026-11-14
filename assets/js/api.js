/**
 * MISSAV-J — API Client Wrapper
 * Mengintegrasikan front-end dengan apiJAV REST API.
 */

function getActiveLang() {
  const segments = window.location.pathname.replace(/^\//, '').split('/');
  const lang = segments[0] || 'en';
  const validLangs = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
  return validLangs.includes(lang) ? lang : 'en';
}

// In-memory cache to prevent redundant API network requests
const apiCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Helper to safely set cache and prevent memory leaks on infinite scrolling
function setCache(key, value) {
  if (apiCache.size >= MAX_CACHE_SIZE) {
    // Hapus 20% entri terlama untuk memberikan ruang
    const keysToDelete = Array.from(apiCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    keysToDelete.forEach(k => apiCache.delete(k));
  }
  apiCache.set(key, value);
}

// In-flight request deduplication map
const fetchPromises = new Map();

async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Koneksi terputus: Server memakan waktu terlalu lama (Timeout)');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  }
}

async function fetchJsonWithRetry(url, label, buildHttpError = null) {
  let lastError;
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        const msg = buildHttpError ? buildHttpError(res) : `API Error ${res.status}: ${res.statusText}`;
        const responseError = new Error(msg);
        responseError.status = res.status;
        throw responseError;
      }
      const data = await res.json();
      return { res, data };
    } catch (err) {
      lastError = err;
      console.warn(`[API ${label}] Attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      const isRetryable = err.name === 'TimeoutError' || [502, 503, 504].includes(err.status);
      if (!isRetryable || attempt >= MAX_ATTEMPTS) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 750));
    }
  }
  throw lastError;
}

const api = {
  /**
   * Mengambil daftar video (feed & listing) dengan query parameters.
   * Menggunakan Vercel proxy /api/posts untuk menghindari CORS error.
   * @param {Object} params - Query parameters
   * @returns {Promise<{posts: Array, total: number, totalPages: number}>}
   */
  async getPosts(params = {}) {
    try {
      const lang = getActiveLang();
      const cleanParams = { lang };
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });

      const qs = new URLSearchParams(cleanParams).toString();
      // Gunakan proxy /api/posts (Vercel serverless) untuk menghindari CORS.
      // server.apijav.com hanya mengizinkan missav-j.com (no-www),
      // sedangkan website berjalan di www.missav-j.com. Proxy mengembalikan CORS: *
      const url = `/api/posts?${qs}`;
      
      if (apiCache.has(url)) {
        return apiCache.get(url);
      }
      if (fetchPromises.has(url)) {
        return fetchPromises.get(url);
      }
      
      const fetchPromise = (async () => {
        try {
          const { res, data: posts } = await fetchJsonWithRetry(url, 'getPosts');
          const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
          const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);

          const result = {
            posts: Array.isArray(posts) ? posts : (posts.posts || []),
            total: total || (posts.total ? parseInt(posts.total, 10) : 0),
            totalPages: totalPages || (posts.totalPages ? parseInt(posts.totalPages, 10) : 1)
          };

          // Populate individual post cache for instant navigation!
          if (result.posts && result.posts.length > 0) {
            result.posts.forEach(p => {
              if (p && p.id) {
                setCache(`post:${p.id}:${lang}`, p);
              }
            });
          }

          setCache(url, result);
          return result;
        } finally {
          fetchPromises.delete(url);
        }
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
   * Menggunakan Vercel proxy /api/posts?id=<id> untuk menghindari CORS error.
   * @param {string|number} id - ID Post / Video
   * @returns {Promise<Object>} Detail post/video
   */
  async getPost(id) {
    try {
      if (!id) throw new Error('Post ID wajib disertakan');
      const lang = getActiveLang();
      const cacheKey = `post:${id}:${lang}`;
      // Gunakan proxy /api/posts dengan parameter id untuk single post
      const url = `/api/posts?id=${id}&lang=${lang}`;
      
      if (window.__SSR_POST__ && String(window.__SSR_POST__.id) === String(id)) {
        setCache(cacheKey, window.__SSR_POST__);
        delete window.__SSR_POST__;
      }

      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }

      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        try {
          const { data: post } = await fetchJsonWithRetry(
            url,
            `getPost ${id}`,
            res => `Post dengan ID ${id} tidak ditemukan (${res.status})`
          );
          setCache(cacheKey, post);
          return post;
        } finally {
          fetchPromises.delete(cacheKey);
        }
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
   * Menggunakan Vercel proxy /api/player untuk menghindari CORS error.
   * @param {string|number} id - ID Post / Video
   * @returns {Promise<{iframe_html: string}>} Data player berisi markup iframe
   */
  async getPlayer(id) {
    try {
      if (!id) throw new Error('Player ID wajib disertakan');
      const cacheKey = `player:${id}`;
      // Gunakan proxy /api/player bukan langsung ke server.apijav.com
      const url = `/api/player?id=${id}`;
      
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        try {
          const { data: player } = await fetchJsonWithRetry(
            url,
            `getPlayer ${id}`,
            res => `Player untuk ID ${id} gagal dimuat (${res.status})`
          );
          setCache(cacheKey, player);
          return player;
        } finally {
          fetchPromises.delete(cacheKey);
        }
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
