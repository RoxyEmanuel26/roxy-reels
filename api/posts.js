/**
 * MISSAV-J — Vercel Serverless Edge CDN Caching Proxy (/api/posts)
 * Menjembatani front-end dengan REST API apiJAV secara gratis melalui tameng caching.
 * Terintegrasi dengan database cloud Supabase untuk menyimpan dan mengembalikan terjemahan massal secara instan.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

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

// Generate localized slugs mapping for frontend alternate links
function generateLocalizedSlugs(code, title, translations) {
  const supportedLangs = ['zh-TW', 'zh-CN', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
  const cleanCode = slugify(code || '');
  const cleanTitle = slugify(title || '');
  
  let enSlug = cleanCode && cleanTitle ? `${cleanCode}-${cleanTitle}` : (cleanCode || cleanTitle || 'video');
  if (enSlug.length > 100) enSlug = enSlug.substring(0, 100);

  const slugs = { en: enSlug };
  supportedLangs.forEach(lang => {
    const tTitle = translations[lang] || title;
    const cleanTTitle = slugify(tTitle || '');
    let slug = cleanCode && cleanTTitle ? `${cleanCode}-${cleanTTitle}` : (cleanCode || cleanTTitle || 'video');
    if (slug.length > 100) slug = slug.substring(0, 100);
    slugs[lang] = slug;
  });
  return slugs;
}

// Fetch translations mapping for a single post from Supabase
async function getTranslationFromDb(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    console.error('Supabase get error:', e);
    return null;
  }
}

// Fetch translations for multiple post IDs in a single query (batch)
async function getBatchTranslationsFromDb(ids) {
  if (!ids || ids.length === 0) return {};
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/translations?id=in.(${ids.join(',')})&select=id,translations`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        map[item.id] = item.translations;
      });
    }
    return map;
  } catch (e) {
    console.error('Supabase batch get error:', e);
    return {};
  }
}

// Save translations mapping to Supabase
async function saveTranslationToDb(id, translations) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/translations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id, translations })
    });
  } catch (e) {
    console.error('Supabase save error:', e);
  }
}

// Request server-side translation from Google Translate
async function translateTitle(title, lang) {
  if (!title) return '';
  const domains = [
    'translate.googleapis.com',
    'translate.google.com',
    'translate.google.co.id'
  ];
  for (const domain of domains) {
    const url = `https://${domain}/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(title)}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          return data[0].map(segment => segment[0]).join('').trim();
        }
      }
    } catch (e) {
      console.error(`Google Translate error via ${domain}:`, e);
    }
  }
  return title;
}

// Get cached translation or translate on-the-fly and save to database
async function getOrTranslatePost(post, targetLang) {
  const id = post.id;
  let translations = await getTranslationFromDb(id);
  let needsSave = false;

  if (!translations) {
    translations = {};
    needsSave = true;
  }

  const supportedLangs = ['zh-TW', 'zh-CN', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
  
  // Inline translate requested language if missing
  if (targetLang && targetLang !== 'en' && !translations[targetLang]) {
    translations[targetLang] = await translateTitle(post.title, targetLang);
    needsSave = true;
  }

  // Pre-translate remaining languages in parallel to prime database cache
  if (Object.keys(translations).length < 12) {
    const promises = supportedLangs.map(async (l) => {
      if (!translations[l]) {
        translations[l] = await translateTitle(post.title, l);
      }
    });
    await Promise.all(promises);
    needsSave = true;
  }

  if (needsSave) {
    await saveTranslationToDb(id, translations);
  }

  return translations;
}

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

    const lang = req.query.lang || 'en';

    // Deteksi apakah ini request untuk single post berdasarkan parameter id
    let targetUrl;
    if (req.query.id) {
      targetUrl = new URL(`${TARGET_BASE}/posts/${req.query.id}`);
    } else {
      targetUrl = new URL(`${TARGET_BASE}/posts`);
    }

    // Intercept filtering untuk studio "Other" atau "Unknown Studio"
    const isOtherStudio = req.query.studio === 'Other' || req.query.studio === 'Unknown Studio';

    // Salin parameter query lainnya (kecuali id jika itu request single post, dan studio jika itu studio Other)
    Object.keys(req.query).forEach(key => {
      if (req.query.id && key === 'id') return; // Lewati parameter id agar tidak masuk query string
      if (isOtherStudio && key === 'studio') return; // Jangan teruskan parameter studio=Other ke backend
      targetUrl.searchParams.append(key, req.query[key]);
    });

    let data;

    if (isOtherStudio) {
      // Untuk studio "Other", kita ambil 4 halaman dari API secara paralel (total 400 posts)
      // lalu memfilternya di memory agar hanya menyisakan post yang studio-nya kosong.
      const requestedPage = parseInt(req.query.page || '1', 10);
      const perPageNum = 100;
      const startPage = (requestedPage - 1) * 4 + 1;
      const pagesToFetch = [startPage, startPage + 1, startPage + 2, startPage + 3];

      console.log(`[Edge Proxy GET Other Studio] Pages: ${pagesToFetch.join(', ')}`);

      const fetchPage = async (pageNum) => {
        const pageUrl = new URL(targetUrl.toString());
        pageUrl.searchParams.set('per_page', String(perPageNum));
        pageUrl.searchParams.set('page', String(pageNum));
        
        try {
          const response = await fetch(pageUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Client-Site': req.headers['x-client-site'] || 'https://www.missav-j.com'
            }
          });
          if (!response.ok) return [];
          return await response.json();
        } catch (err) {
          console.error(`Failed to fetch page ${pageNum} for Other Studio:`, err);
          return [];
        }
      };

      const results = await Promise.all(pagesToFetch.map(p => fetchPage(p)));
      const allPosts = results.flat();

      // Filter posts yang tidak memiliki nama studio (atau studio nya kosong/Unknown)
      data = allPosts.filter(post => !post.studio);

      res.setHeader('X-WP-Total', '120');
      res.setHeader('X-WP-TotalPages', '10');
    } else {
      console.log(`[Edge Proxy GET] ${targetUrl.toString()}`);

      // Panggil server WordPress backend apiJAV
      const response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Client-Site': req.headers['x-client-site'] || 'https://www.missav-j.com'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'WordPress REST API Error',
          message: response.statusText
        });
      }

      data = await response.json();

      // Teruskan header pagination penting WordPress untuk keperluan penomoran halaman di UI
      const total = response.headers.get('X-WP-Total');
      const totalPages = response.headers.get('X-WP-TotalPages');
      if (total) res.setHeader('X-WP-Total', total);
      if (totalPages) res.setHeader('X-WP-TotalPages', totalPages);
    }

    // =========================================================================
    // PEMROSESAN TERJEMAHAN MASAL DATABASE CLOUD (SUPABASE)
    // =========================================================================
    if (data) {
      if (req.query.id && !Array.isArray(data)) {
        // Single post request
        const translations = await getOrTranslatePost(data, lang);
        if (lang && lang !== 'en' && translations[lang]) {
          data.title = translations[lang];
        }
        data.localized_slugs = generateLocalizedSlugs(data.code, data.title, translations);
      } else if (Array.isArray(data)) {
        // Posts listing request
        const ids = data.map(p => p.id);
        const translationsMap = await getBatchTranslationsFromDb(ids);
        
        const translatePromises = data.map(async (post) => {
          let translations = translationsMap[post.id];
          if (!translations) {
            // Lazy translate in database if missing
            translations = await getOrTranslatePost(post, lang);
          }
          if (lang && lang !== 'en' && translations[lang]) {
            post.title = translations[lang];
          }
          post.localized_slugs = generateLocalizedSlugs(post.code, post.title, translations);
        });
        
        await Promise.all(translatePromises);
      }
    }

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
