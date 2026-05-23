/**
 * MISSAV-J — API Client Wrapper
 * Mengintegrasikan front-end dengan apiJAV REST API.
 * Menyediakan fungsi-fungsi fetch terbungkus dengan penanganan error.
 */

const BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

const api = {
  /**
   * Mengambil daftar video (feed & listing) dengan query parameters.
   * @param {Object} params - Query parameters (per_page, page, search, category, tag, actor, studio, orderby, order, after)
   * @returns {Promise<{posts: Array, total: number, totalPages: number}>}
   */
  async getPosts(params = {}) {
    try {
      const cleanParams = {};
      
      // Bersihkan parameter dari nilai kosong/null/undefined agar tidak mengotori query string
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });

      const qs = new URLSearchParams(cleanParams).toString();
      const url = `${BASE}/posts?${qs}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${res.statusText}`);
      }
      
      const posts = await res.json();
      
      // Baca dan parse response headers untuk keperluan pagination di UI
      const total = parseInt(res.headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
      
      return {
        posts: Array.isArray(posts) ? posts : [],
        total,
        totalPages
      };
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
      
      const res = await fetch(`${BASE}/posts/${id}`);
      
      if (!res.ok) {
        throw new Error(`Post dengan ID ${id} tidak ditemukan (${res.status})`);
      }
      
      return await res.json();
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
      
      const res = await fetch(`${BASE}/player/${id}`);
      
      if (!res.ok) {
        throw new Error(`Player untuk ID ${id} gagal dimuat (${res.status})`);
      }
      
      return await res.json();
    } catch (error) {
      console.error(`[API getPlayer ${id} Error]`, error);
      throw error;
    }
  }
};

export default api;
