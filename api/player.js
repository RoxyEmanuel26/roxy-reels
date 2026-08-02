/**
 * MISSAV-J — Vercel Serverless Edge CDN Caching Proxy (/api/player)
 * Menjembatani front-end dengan REST API player apiJAV.
 * Karena data embed token bersifat permanen, cuplikan player dapat disimpan dengan aman
 * di Edge CDN terdekat hingga 1 jam (s-maxage=3600) untuk kecepatan respon instan (0ms delay).
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

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Dynamic parameter video ID wajib disertakan' 
      });
    }

    const targetUrl = `${TARGET_BASE}/player/${id}`;
    console.log(`[Edge Proxy GET Player] ${targetUrl}`);

    // Panggil server WordPress backend apiJAV
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': req.headers['x-client-site'] || 'https://www.missav-j.com'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'WordPress REST Player Error',
        message: response.statusText
      });
    }

    const data = await response.json();

    // =========================================================================
    // OPTIMASI EMAS: INJEKSI VERCEL EDGE CDN CACHING HEADERS (100% GRATIS)
    // - s-maxage=604800 (Player iframe disimpan di CDN selama 1 minggu)
    // - stale-while-revalidate=86400 (Servis data usang selama revalidasi background hingga 1 hari)
    // =========================================================================
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Edge Proxy player.js Error]', error);
    return res.status(502).json({
      error: 'Gateway Proxy Error',
      message: error.message
    });
  }
};
