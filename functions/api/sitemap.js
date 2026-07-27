/**
 * MISSAV-J — Comprehensive Multi-Type XML Sitemap System (Cloudflare)
 */

import ACTORS from '../../api/actors.json';
import CATEGORIES from '../../api/categories.json';

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1/posts';

const LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
// Map internal language keys to valid ISO 639-1 hreflang codes.
// 'fil' (ISO 639-2) -> 'tl' (ISO 639-1); URL paths keep the 'fil' key.
const HREFLANG_CODE_MAP = { fil: 'tl' };
const hreflangCode = (lang) => HREFLANG_CODE_MAP[lang] || lang;
const DOMAIN = 'https://www.missav-j.com';

const STATIC_ROUTES = [
  { path: '',               priority: '1.0', changefreq: 'daily' },
  { path: 'trending',       priority: '0.9', changefreq: 'daily' },
  { path: 'recent',         priority: '0.9', changefreq: 'daily' },
  { path: 'actors',         priority: '0.8', changefreq: 'weekly' },
  { path: 'categories',     priority: '0.8', changefreq: 'weekly' },
  { path: 'studios',        priority: '0.8', changefreq: 'weekly' },
  { path: 'popular-actors', priority: '0.7', changefreq: 'weekly' },
];

const STUDIOS = [
  'S1 NO.1 STYLE', 'MOODYZ', 'PRESTIGE', 'Soft On Demand',
  'Idea Pocket', 'FALENO', 'MUTEKI', 'Fitch',
  'OPPAL', 'Kawaii*', 'KMP', 'Attackers', 'Premium', 'Other'
];

const ACTORS_PER_SITEMAP = 40000;
const ACTORS_SITEMAP_COUNT = Math.ceil(ACTORS.length / ACTORS_PER_SITEMAP);

function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

function getLocalizedSlug(code, title, translations, lang) {
  if (lang === 'en') {
    return getSlug(code, title);
  }
  const tTitle = (translations && translations[lang]) ? translations[lang] : title;
  return getSlug(code, tTitle);
}

async function getBatchTranslationsFromDb(ids, supabaseUrl, supabaseKey) {
  if (!ids || ids.length === 0) return {};
  const batchSize = 500;
  const results = {};
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=in.(${chunk.join(',')})&select=id,translations`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
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

function buildAlternates(makeUrl) {
  let xml = '';
  for (const l of LANGS) {
    xml += `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${escXml(makeUrl(l))}" />\n`;
  }
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(makeUrl('en'))}" />\n`;
  return xml;
}

function urlsetOpen() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
}

function generatePagesSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let xml = urlsetOpen();

  for (const route of STATIC_ROUTES) {
    const routePath = route.path;
    const makeUrl = (lang) => {
      const p = routePath ? `/${lang}/${routePath}` : `/${lang}`;
      return `${DOMAIN}${p}`;
    };

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

async function generateSitemapIndex(domain) {
  const today = new Date().toISOString().split('T')[0];

  let totalPosts = 113191;
  try {
    const headRes = await fetch(`${TARGET_BASE}?per_page=1`, {
      headers: { 'X-Client-Site': 'https://www.missav-j.com' }
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

  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/pages.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  for (let i = 1; i <= ACTORS_SITEMAP_COUNT; i++) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${domain}/sitemaps/actors_${i}.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }

  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/categories.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

  xml += `  <sitemap>\n`;
  xml += `    <loc>${domain}/sitemaps/studios.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </sitemap>\n`;

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

async function generateVideoSitemap(lang, page, domain, supabaseUrl, supabaseKey) {
  const postsRes = await fetch(`${TARGET_BASE}?per_page=1000&page=${page}`, {
    headers: { 'X-Client-Site': 'https://www.missav-j.com' }
  });

  if (!postsRes.ok) {
    return { status: postsRes.status, body: `Failed to fetch posts from apiJAV: ${postsRes.statusText}` };
  }

  const posts = await postsRes.json();
  if (!Array.isArray(posts) || posts.length === 0) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
    xml += `</urlset>\n`;
    return { status: 200, body: xml };
  }

  const ids = posts.map(p => p.id);
  const translationsMap = await getBatchTranslationsFromDb(ids, supabaseUrl, supabaseKey);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const post of posts) {
    const id = post.id;
    const code = post.code || '';
    const title = post.title || '';
    const translations = translationsMap[id] || {};
    const dateStr = post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0];

    const locSlug = getLocalizedSlug(code, title, translations, lang);
    const locUrl = `${domain}/${lang}/watch/${locSlug}-${id}`;

    xml += `  <url>\n`;
    xml += `    <loc>${locUrl}</loc>\n`;
    xml += `    <lastmod>${dateStr}</lastmod>\n`;

    for (const l of LANGS) {
      const altSlug = getLocalizedSlug(code, title, translations, l);
      const altUrl = `${domain}/${l}/watch/${altSlug}-${id}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${altUrl}" />\n`;
    }

    const enSlug = getLocalizedSlug(code, title, translations, 'en');
    const xDefaultUrl = `${domain}/en/watch/${enSlug}-${id}`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />\n`;

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return { status: 200, body: xml };
}

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Client-Site',
  };

  const errorHeaders = {
    ...corsHeaders,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const file = url.searchParams.get('file');

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;

    const host = request.headers.get('host') || 'www.missav-j.com';
    const domain = `https://${host}`;

    const sendXml = (xml, statusCode = 200) => {
      return new Response(xml, {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
        }
      });
    };

    if (!file || file === 'sitemap_index.xml' || file === 'sitemap.xml') {
      const xml = await generateSitemapIndex(domain);
      return sendXml(xml);
    }

    if (file === 'pages.xml' || file === 'sitemap_pages.xml') {
      return sendXml(generatePagesSitemap());
    }

    const actorsMatch = file.match(/^(?:sitemap_)?actors_(\d+)\.xml$/);
    if (actorsMatch) {
      const pageNum = parseInt(actorsMatch[1], 10);
      if (pageNum < 1 || pageNum > ACTORS_SITEMAP_COUNT) {
        return new Response('Not Found', { status: 404, headers: errorHeaders });
      }
      return sendXml(generateActorsSitemap(pageNum));
    }

    if (file === 'categories.xml' || file === 'sitemap_categories.xml') {
      return sendXml(generateCategoriesSitemap());
    }

    if (file === 'studios.xml' || file === 'sitemap_studios.xml') {
      return sendXml(generateStudiosSitemap());
    }

    let lang = '';
    let page = 0;

    const newVideoMatch = file.match(/^([a-zA-Z\-]+)-(\d+)\.xml$/);
    const oldVideoMatch = file.match(/^sitemap_videos_([a-zA-Z\-]+)_(\d+)\.xml$/);

    if (newVideoMatch) {
      lang = newVideoMatch[1];
      page = parseInt(newVideoMatch[2], 10);
    } else if (oldVideoMatch) {
      lang = oldVideoMatch[1];
      page = parseInt(oldVideoMatch[2], 10);
    } else {
      return new Response('Not Found', { status: 404, headers: errorHeaders });
    }

    if (!LANGS.includes(lang)) {
      return new Response('Unsupported Language', { status: 404, headers: errorHeaders });
    }

    const result = await generateVideoSitemap(lang, page, domain, SUPABASE_URL, SUPABASE_KEY);

    if (result.status !== 200) {
      return new Response(result.body, { status: result.status, headers: errorHeaders });
    }

    return sendXml(result.body);

  } catch (error) {
    console.error('[Sitemap Error]', error);
    return new Response(`Gateway Proxy Error: ${error.message}`, {
      status: 502,
      headers: errorHeaders
    });
  }
}
