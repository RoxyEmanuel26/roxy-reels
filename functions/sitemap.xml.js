const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Coba ambil dari cache Cloudflare Edge (CACHE-CONTROL 1 jam)
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  try {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  } catch (e) {
    console.error('Cache match error in sitemap:', e);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Ambil 250 video terbaru (menghindari timeout dari server.apijav.com)
    const apiUrl = `${TARGET_BASE}/posts?per_page=250&orderby=date&order=DESC`;
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) (Sitemap Generator)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return new Response('Failed to fetch posts from API', { status: 502 });
    }

    const posts = await res.json();
    const postArray = Array.isArray(posts) ? posts : (posts.posts || []);

    // Bangun XML Sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Tambahkan halaman utama
    xml += `  <url>\n`;
    xml += `    <loc>${url.origin}/en/</loc>\n`;
    xml += `    <changefreq>hourly</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Tambahkan setiap video
    for (const post of postArray) {
      if (!post.slug) continue;
      
      const postUrl = `${url.origin}/en/watch/${post.slug}`;
      const lastmod = post.date ? post.date.split(' ')[0] : new Date().toISOString().split('T')[0];
      
      xml += `  <url>\n`;
      xml += `    <loc>${postUrl}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    const response = new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });

    // Simpan di cache Cloudflare
    context.waitUntil(cache.put(cacheKey, response.clone()));

    return response;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Sitemap Generator Error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
