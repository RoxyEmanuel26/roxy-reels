/**
 * MISSAV-J — Vercel Serverless Edge CDN Caching Proxy (/api/posts)
 * Menjembatani front-end dengan REST API apiJAV secara gratis melalui tameng caching.
 * Mengurangi load server WordPress, mencegah crash di trafik tinggi (1M+ user),
 * dan meningkatkan kecepatan respons menjadi di bawah 15ms menggunakan Vercel Edge CDN Cache.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

module.exports = async (req, res) => {
  try {
    // Setel Header CORS Terbuka & Aman
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Client-Site');

    // Tangani preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Deteksi apakah ini request untuk single post berdasarkan parameter id
    let targetUrl;
    if (req.query.id) {
      targetUrl = new URL(`${TARGET_BASE}/posts/${req.query.id}`);
    } else {
      targetUrl = new URL(`${TARGET_BASE}/posts`);
    }

    // Salin parameter query lainnya (kecuali id jika itu request single post)
    Object.keys(req.query).forEach(key => {
      if (req.query.id && key === 'id') return; // Lewati parameter id agar tidak masuk query string
      targetUrl.searchParams.append(key, req.query[key]);
    });

    console.log(`[Edge Proxy GET] ${targetUrl.toString()}`);

    // Panggil server WordPress backend apiJAV
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': req.headers['x-client-site'] || 'https://missav-j.vercel.app'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'WordPress REST API Error',
        message: response.statusText
      });
    }

    const data = await response.json();

    // Teruskan header pagination penting WordPress untuk keperluan penomoran halaman di UI
    const total = response.headers.get('X-WP-Total');
    const totalPages = response.headers.get('X-WP-TotalPages');
    if (total) res.setHeader('X-WP-Total', total);
    if (totalPages) res.setHeader('X-WP-TotalPages', totalPages);

    // =========================================================================
    // OPTIMASI EMAS: INJEKSI VERCEL EDGE CDN CACHING HEADERS (100% GRATIS)
    // - s-maxage=300 (Respons disimpan di Edge CDN Vercel selama 5 menit secara global)
    // - stale-while-revalidate=600 (Servis data usang selama revalidasi background hingga 10 menit)
    // =========================================================================
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Edge Proxy posts.js Error]', error);
    return res.status(502).json({
      error: 'Gateway Proxy Error',
      message: error.message
    });
  }
};
