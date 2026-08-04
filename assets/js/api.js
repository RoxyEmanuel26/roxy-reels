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
// In-flight request deduplication map
const fetchPromises = new Map();

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
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
        let lastError;
        for (let attempt = 1; attempt <= 1; attempt++) {
          try {
            const res = await fetchWithTimeout(url);
            
            if (!res.ok) {
              throw new Error(`API Error ${res.status}: ${res.statusText}`);
            }
            
            const posts = await res.json();
            
            const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
            const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
            
            const result = {
              posts: Array.isArray(posts) ? posts : (posts.posts || []),
              total: total || (posts.total ? parseInt(posts.total, 10) : 0),
              totalPages: totalPages || (posts.totalPages ? parseInt(posts.totalPages, 10) : 1)
            };
            
            apiCache.set(url, result);
            fetchPromises.delete(url);
            return result;
          } catch (err) {
            lastError = err;
            console.warn(`[API getPosts] Attempt ${attempt} failed:`, err.message);
            if (attempt < 1) {
              // Wait 1.5 seconds before retrying
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
        fetchPromises.delete(url);
        throw lastError;
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
        apiCache.set(cacheKey, window.__SSR_POST__);
        delete window.__SSR_POST__;
      }

      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }

      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        const res = await fetchWithTimeout(url);
        
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
   * Menggunakan Vercel proxy /api/player untuk menghindari CORS error.
   * @param {string|number} id - ID Post / Video
   * @returns {Promise<{iframe_html: string}>} Data player berisi markup iframe
   */
  async getPlayer(id) {
    try {
      if (!id) throw new Error('Player ID wajib disertakan');
      const lang = getActiveLang();
      const cacheKey = `player:${id}:${lang}`;
      // Gunakan proxy /api/player bukan langsung ke server.apijav.com
      const url = `/api/player?id=${id}&lang=${lang}`;
      
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      if (fetchPromises.has(cacheKey)) {
        return fetchPromises.get(cacheKey);
      }
      
      const fetchPromise = (async () => {
        const res = await fetchWithTimeout(url);
        
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
