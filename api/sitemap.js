/**
 * MISSAV-J — Vercel Serverless Edge CDN Caching Proxy for XML Sitemaps
 * Generasi XML sitemap multi-bahasa terdistribusi (13 bahasa * 100.000+ data).
 * Terintegrasi dengan database cloud Supabase untuk menyusun URL terlokalisasi secara instan tanpa WordPress write access.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1/posts';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 13 Bahasa yang didukung
const LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

// Helper to convert text into a clean Unicode-safe slug
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Generate clean slugs
function getSlug(code, title) {
  const cleanCode = slugify(code || '');
  const cleanTitle = slugify(title || '');
  let slug = '';
  if (cleanCode && cleanTitle) {
    slug = `${cleanCode}-${cleanTitle}`;
  } else if (cleanCode) {
    slug = cleanCode;
  } else if (cleanTitle) {
    slug = cleanTitle;
  } else {
    slug = 'video';
  }
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
  }
  return slug;
}

// Generate localized slug using Supabase translations mapping
function getLocalizedSlug(code, title, translations, lang) {
  if (lang === 'en') {
    return getSlug(code, title);
  }
  const tTitle = (translations && translations[lang]) ? translations[lang] : title;
  return getSlug(code, tTitle);
}

// Fetch translations for multiple post IDs in batches of 500
async function getBatchTranslationsFromDb(ids) {
  if (!ids || ids.length === 0) return {};
  const batchSize = 500;
  const results = {};
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/translations?id=in.(${chunk.join(',')})&select=id,translations`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            results[item.id] = item.translations;
          });
        }
      }
    } catch (e) {
      console.error('Supabase batch query error:', e);
    }
  }
  return results;
}

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

    // Tentukan domain utama berdasarkan request headers
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'www.missav-j.web.id';
    const domain = `${protocol}://${host}`;

    if (!file) {
      // -----------------------------------------------------------------------
      // GENERASI SITEMAP INDEX (sitemap.xml)
      // -----------------------------------------------------------------------
      let totalPosts = 113191; // Default fallback jika API error
      try {
        const headRes = await fetch(`${TARGET_BASE}?per_page=1`, {
          headers: { 'X-Client-Site': 'https://www.missav-j.web.id' }
        });
        if (headRes.ok) {
          const totalHeader = headRes.headers.get('X-WP-Total');
          if (totalHeader) {
            totalPosts = parseInt(totalHeader, 10);
          }
        }
      } catch (err) {
        console.error('Failed to fetch total posts count from apiJAV:', err);
      }

      // Setiap sub-sitemap memuat 1000 postingan
      const pagesCount = Math.ceil(totalPosts / 1000);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const lang of LANGS) {
        for (let p = 1; p <= pagesCount; p++) {
          xml += `  <sitemap>\n`;
          xml += `    <loc>${domain}/sitemaps/${lang}-${p}.xml</loc>\n`;
          xml += `  </sitemap>\n`;
        }
      }
      xml += `</sitemapindex>\n`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      // Cache-Control: s-maxage=86400 (cache di Edge CDN selama 24 jam)
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return res.status(200).send(xml);

    } else {
      // -----------------------------------------------------------------------
      // GENERASI SUB-SITEMAP HALAMAN DETAIL (sitemaps/ja-1.xml)
      // -----------------------------------------------------------------------
      const match = file.match(/^([a-zA-Z\-]+)-(\d+)\.xml$/);
      if (!match) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('Not Found');
      }

      const lang = match[1];
      const page = parseInt(match[2], 10);

      // Pastikan bahasa didukung
      if (!LANGS.includes(lang)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('Unsupported Language');
      }

      // Ambil 1000 postingan untuk halaman tersebut
      const postsRes = await fetch(`${TARGET_BASE}?per_page=1000&page=${page}`, {
        headers: { 'X-Client-Site': 'https://www.missav-j.web.id' }
      });

      if (!postsRes.ok) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(postsRes.status).send(`Failed to fetch posts from apiJAV: ${postsRes.statusText}`);
      }

      const posts = await postsRes.json();
      if (!Array.isArray(posts) || posts.length === 0) {
        // Kembalikan sitemap kosong daripada eror agar parser Google tidak rusak
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
        xml += `</urlset>\n`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(200).send(xml);
      }

      // Ambil seluruh pemetaan terjemahan dari database Supabase secara massal
      const ids = posts.map(p => p.id);
      const translationsMap = await getBatchTranslationsFromDb(ids);

      // Bangun XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

      for (const post of posts) {
        const id = post.id;
        const code = post.code || '';
        const title = post.title || '';
        const translations = translationsMap[id] || {};
        const dateStr = post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0];

        // URL utama untuk entitas sitemap ini (sesuai target bahasa request)
        const locSlug = getLocalizedSlug(code, title, translations, lang);
        const locUrl = `${domain}/${lang}/watch/${locSlug}-${id}`;

        xml += `  <url>\n`;
        xml += `    <loc>${locUrl}</loc>\n`;
        xml += `    <lastmod>${dateStr}</lastmod>\n`;

        // Masukkan alternate link untuk semua 13 bahasa
        for (const l of LANGS) {
          const altSlug = getLocalizedSlug(code, title, translations, l);
          const altUrl = `${domain}/${l}/watch/${altSlug}-${id}`;
          xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${altUrl}" />\n`;
        }

        // x-default mengarah ke URL bahasa Inggris
        const enSlug = getLocalizedSlug(code, title, translations, 'en');
        const xDefaultUrl = `${domain}/en/watch/${enSlug}-${id}`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />\n`;

        xml += `  </url>\n`;
      }

      xml += `</urlset>\n`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      // Cache-Control: s-maxage=86400 (cache di Edge CDN selama 24 jam)
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return res.status(200).send(xml);
    }

  } catch (error) {
    console.error('[Edge Proxy sitemap.js Error]', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(502).send(`Gateway Proxy Error: ${error.message}`);
  }
};
