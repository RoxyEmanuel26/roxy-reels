/**
 * MISSAV-J — Vercel Serverless Edge CDN Caching Proxy for XML Sitemaps
 * Proxy sitemaps directly from the WordPress REST API to cache them globally.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1/sitemaps';

module.exports = async (req, res) => {
  try {
    // Set Header CORS Terbuka & Aman
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Client-Site');

    // Tangani preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { file } = req.query; // e.g. "ja-1.xml" or undefined
    let targetUrl;

    if (!file) {
      targetUrl = `${TARGET_BASE}/index`;
    } else {
      // Parse file like "ja-1.xml" to get lang and page
      const match = file.match(/^([a-zA-Z\-]+)-(\d+)\.xml$/);
      if (!match) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('Not Found');
      }
      const lang = match[1];
      const page = match[2];
      targetUrl = `${TARGET_BASE}/posts?lang=${lang}&page=${page}`;
    }

    console.log(`[Edge Proxy GET Sitemap] ${targetUrl}`);

    const clientSite = req.headers['x-client-site'] || 'https://www.missav-j.web.id';

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'X-Client-Site': clientSite
      }
    });

    if (!response.ok) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(response.status).send(`WordPress REST Sitemap Error: ${response.statusText}`);
    }

    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    
    // Caching: s-maxage=86400 (cache at Edge for 24 hours), stale-while-revalidate=43200 (revalidate in background)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).send(xml);

  } catch (error) {
    console.error('[Edge Proxy sitemap.js Error]', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(502).send(`Gateway Proxy Error: ${error.message}`);
  }
};
