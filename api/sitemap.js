/**
 * MISSAV-J — Comprehensive Multi-Type XML Sitemap System
 * Vercel Serverless Function generating XML sitemaps for:
 *   - Static pages (pages.xml)
 *   - Actors (actors_1.xml, actors_2.xml, ...)
 *   - Categories (categories.xml)
 *   - Studios (studios.xml)
 *   - Video posts per language ({lang}-{page}.xml) — original logic preserved
 *
 * Sitemap Index at /sitemap.xml aggregates all sub-sitemaps.
 * All URLs include xhtml:link rel="alternate" for 13 languages + x-default.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1/posts';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 13 supported languages
const LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

// Domain constant
const DOMAIN = 'https://www.missav-j.web.id';

// Static page routes with SEO metadata
const STATIC_ROUTES = [
  { path: '',               priority: '1.0', changefreq: 'daily' },
  { path: 'trending',       priority: '0.9', changefreq: 'daily' },
  { path: 'recent',         priority: '0.9', changefreq: 'daily' },
  { path: 'actors',         priority: '0.8', changefreq: 'weekly' },
  { path: 'categories',     priority: '0.8', changefreq: 'weekly' },
  { path: 'studios',        priority: '0.8', changefreq: 'weekly' },
  { path: 'popular-actors', priority: '0.7', changefreq: 'weekly' },
];

// Studios (14 entries, hardcoded)
const STUDIOS = [
  'S1 NO.1 STYLE', 'MOODYZ', 'PRESTIGE', 'Soft On Demand',
  'Idea Pocket', 'FALENO', 'MUTEKI', 'Fitch',
  'OPPAL', 'Kawaii*', 'KMP', 'Attackers', 'Premium', 'Other'
];

// Load co-located JSON data (bundled by Vercel with the serverless function)
const ACTORS = require('./actors.json');       // string[] of actor names
const CATEGORIES = require('./categories.json'); // string[] of category names

// Max URLs per sitemap file for actors (each entry = 1 URL + 13 alternates as attributes)
const ACTORS_PER_SITEMAP = 40000;
const ACTORS_SITEMAP_COUNT = Math.ceil(ACTORS.length / ACTORS_PER_SITEMAP);

// ─── Shared Helpers ────────────────────────────────────────────────────────────

/** XML-escape special characters in URLs and text */
function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convert text into a clean Unicode-safe slug */
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

/** Generate clean slug from code + title */
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

/** Generate localized slug using Supabase translations mapping */
function getLocalizedSlug(code, title, translations, lang) {
  if (lang === 'en') {
    return getSlug(code, title);
  }
  const tTitle = (translations && translations[lang]) ? translations[lang] : title;
  return getSlug(code, tTitle);
}

/** Fetch translations for multiple post IDs in batches of 500 */
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

// ─── XML Generators ────────────────────────────────────────────────────────────

/** Build xhtml:link alternates block for a given URL pattern callback */
function buildAlternates(makeUrl) {
  let xml = '';
  for (const l of LANGS) {
    xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${escXml(makeUrl(l))}" />\n`;
  }
  // x-default → English
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(makeUrl('en'))}" />\n`;
  return xml;
}

/** Generate the urlset XML header */
function urlsetOpen() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
}

// ─── Sitemap: Static Pages ─────────────────────────────────────────────────────

function generatePagesSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let xml = urlsetOpen();

  for (const route of STATIC_ROUTES) {
    const routePath = route.path; // '' for home, 'trending', etc.
    const makeUrl = (lang) => {
      const p = routePath ? `/${lang}/${routePath}` : `/${lang}`;
      return `${DOMAIN}${p}`;
    };

    // Use 'en' as canonical loc
    xml += `  <url>\n`;
    xml += `    <loc>${escXml(makeUrl('en'))}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

// ─── Sitemap: Actors (paginated) ───────────────────────────────────────────────

function generateActorsSitemap(pageNum) {
  const start = (pageNum - 1) * ACTORS_PER_SITEMAP;
  const end = Math.min(start + ACTORS_PER_SITEMAP, ACTORS.length);
  const batch = ACTORS.slice(start, end);

  const today = new Date().toISOString().split('T')[0];
  let xml = urlsetOpen();

  for (const actorName of batch) {
    const encoded = encodeURIComponent(actorName);
    const makeUrl = (lang) => `${DOMAIN}/${lang}/actor?name=${encoded}`;

    xml += `  <url>\n`;
    xml += `    <loc>${escXml(makeUrl('en'))}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

// ─── Sitemap: Categories ───────────────────────────────────────────────────────

function generateCategoriesSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let xml = urlsetOpen();

  for (const catName of CATEGORIES) {
    const encoded = encodeURIComponent(catName);
    const makeUrl = (lang) => `${DOMAIN}/${lang}/category?name=${encoded}`;

    xml += `  <url>\n`;
    xml += `    <loc>${escXml(makeUrl('en'))}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

// ─── Sitemap: Studios ──────────────────────────────────────────────────────────

function generateStudiosSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let xml = urlsetOpen();

  for (const studioName of STUDIOS) {
    const encoded = encodeURIComponent(studioName);
    const makeUrl = (lang) => `${DOMAIN}/${lang}/studio?name=${encoded}`;

    xml += `  <url>\n`;
    xml += `    <loc>${escXml(makeUrl('en'))}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.5</priority>\n`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

// ─── Sitemap Index ─────────────────────────────────────────────────────────────

async function generateSitemapIndex(domain) {
  const today = new Date().toISOString().split('T')[0];

  // Fetch total video posts count for video sub-sitemaps
  let totalPosts = 113191; // Default fallback
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

  const videoPagesCount = Math.ceil(totalPosts / 1000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static pages
  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/pages.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  // 2. Actors (paginated)
  for (let i = 1; i <= ACTORS_SITEMAP_COUNT; i++) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${domain}/sitemaps/actors_${i}.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }

  // 3. Categories
  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/categories.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  // 4. Studios
  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/studios.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  // 5. Video sitemaps per language × page
  for (const lang of LANGS) {
    for (let p = 1; p <= videoPagesCount; p++) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${domain}/sitemaps/${lang}-${p}.xml</loc>\n`;
      xml += `  </sitemap>\n`;
    }
  }

  xml += `</sitemapindex>\n`;
  return xml;
}

// ─── Video Sub-Sitemap (original logic preserved) ──────────────────────────────

async function generateVideoSitemap(lang, page, domain) {
  // Fetch posts for this page
  const postsRes = await fetch(`${TARGET_BASE}?per_page=1000&page=${page}`, {
    headers: { 'X-Client-Site': 'https://www.missav-j.web.id' }
  });

  if (!postsRes.ok) {
    return { status: postsRes.status, body: `Failed to fetch posts from apiJAV: ${postsRes.statusText}` };
  }

  const posts = await postsRes.json();
  if (!Array.isArray(posts) || posts.length === 0) {
    // Return empty sitemap so Google parser doesn't break
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
    xml += `</urlset>\n`;
    return { status: 200, body: xml };
  }

  // Fetch all translation mappings from Supabase in bulk
  const ids = posts.map(p => p.id);
  const translationsMap = await getBatchTranslationsFromDb(ids);

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const post of posts) {
    const id = post.id;
    const code = post.code || '';
    const title = post.title || '';
    const translations = translationsMap[id] || {};
    const dateStr = post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0];

    // Primary URL for this sitemap entity (matches target language)
    const locSlug = getLocalizedSlug(code, title, translations, lang);
    const locUrl = `${domain}/${lang}/watch/${locSlug}-${id}`;

    xml += `  <url>\n`;
    xml += `    <loc>${locUrl}</loc>\n`;
    xml += `    <lastmod>${dateStr}</lastmod>\n`;

    // Include alternate links for all 13 languages
    for (const l of LANGS) {
      const altSlug = getLocalizedSlug(code, title, translations, l);
      const altUrl = `${domain}/${l}/watch/${altSlug}-${id}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${altUrl}" />\n`;
    }

    // x-default points to English URL
    const enSlug = getLocalizedSlug(code, title, translations, 'en');
    const xDefaultUrl = `${domain}/en/watch/${enSlug}-${id}`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />\n`;

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return { status: 200, body: xml };
}

// ─── Request Handler ───────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Client-Site');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { file } = req.query; // e.g. "pages.xml", "actors_1.xml", "ja-1.xml", or undefined

    // Determine domain from request headers
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'www.missav-j.web.id';
    const domain = `${protocol}://${host}`;

    // Standard response headers for all XML responses
    const sendXml = (xml, statusCode = 200) => {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return res.status(statusCode).send(xml);
    };

    // ── Sitemap Index (/sitemap.xml) ──
    if (!file) {
      const xml = await generateSitemapIndex(domain);
      return sendXml(xml);
    }

    // ── Static Pages (pages.xml) ──
    if (file === 'pages.xml') {
      return sendXml(generatePagesSitemap());
    }

    // ── Actors (actors_1.xml, actors_2.xml, ...) ──
    const actorsMatch = file.match(/^actors_(\d+)\.xml$/);
    if (actorsMatch) {
      const pageNum = parseInt(actorsMatch[1], 10);
      if (pageNum < 1 || pageNum > ACTORS_SITEMAP_COUNT) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('Not Found');
      }
      return sendXml(generateActorsSitemap(pageNum));
    }

    // ── Categories (categories.xml) ──
    if (file === 'categories.xml') {
      return sendXml(generateCategoriesSitemap());
    }

    // ── Studios (studios.xml) ──
    if (file === 'studios.xml') {
      return sendXml(generateStudiosSitemap());
    }

    // ── Video Sub-Sitemaps ({lang}-{page}.xml) — original logic ──
    const videoMatch = file.match(/^([a-zA-Z\-]+)-(\d+)\.xml$/);
    if (!videoMatch) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(404).send('Not Found');
    }

    const lang = videoMatch[1];
    const page = parseInt(videoMatch[2], 10);

    if (!LANGS.includes(lang)) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(404).send('Unsupported Language');
    }

    const result = await generateVideoSitemap(lang, page, domain);

    if (result.status !== 200) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(result.status).send(result.body);
    }

    return sendXml(result.body);

  } catch (error) {
    console.error('[Sitemap Error]', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(502).send(`Gateway Proxy Error: ${error.message}`);
  }
};
