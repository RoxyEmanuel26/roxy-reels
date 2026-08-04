/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/posts)
 * Menjembatani front-end dengan REST API apiJAV secara gratis melalui caching.
 * Terintegrasi dengan database cloud Supabase untuk menyimpan terjemahan.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

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

async function getTranslationFromDb(id, supabaseUrl, supabaseKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Supabase get error:', e);
    return null;
  }
}

async function getBatchTranslationsFromDb(ids, supabaseUrl, supabaseKey) {
  if (!ids || ids.length === 0) return {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=in.(${ids.join(',')})&select=id,translations`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
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
    clearTimeout(timeoutId);
    console.error('Supabase batch get error:', e);
    return {};
  }
}

async function saveTranslationToDb(id, translations, supabaseUrl, supabaseKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${supabaseUrl}/rest/v1/translations`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id, translations }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Supabase save error:', e);
  }
}

async function translateTitle(title, lang) {
  if (!title) return '';
  const domains = [
    'translate.googleapis.com',
    'translate.google.com',
    'translate.google.co.id'
  ];
  for (const domain of domains) {
    const url = `https://${domain}/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          return data[0].map(segment => segment[0]).join('').trim();
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(`Google Translate error via ${domain}:`, e);
    }
  }
  return title;
}

async function getOrTranslatePost(post, targetLang, supabaseUrl, supabaseKey, eagerTranslateAll = false) {
  const id = post.id;
  let translations = await getTranslationFromDb(id, supabaseUrl, supabaseKey);
  let needsSave = false;

  if (!translations) {
    translations = {};
    needsSave = true;
  }

  // OPTIMIZED: Hanya terjemahkan bahasa yang diminta saja (lazy translation).
  // Eager translation ke 12 bahasa dihapus karena Google Translate 
  // memblokir IP Cloudflare, menyebabkan loop gagal yang memakan CPU.
  if (targetLang && targetLang !== 'en' && !translations[targetLang]) {
    translations[targetLang] = await translateTitle(post.title, targetLang);
    needsSave = true;
  }

  if (needsSave && Object.keys(translations).length > 0) {
    await saveTranslationToDb(id, translations, supabaseUrl, supabaseKey);
  }

  return translations;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Client-Site',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const isGet = request.method === 'GET';
  let cache = null;
  if (isGet) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse && cachedResponse.ok) {
        return cachedResponse;
      }
    } catch (e) {
      console.error('[Cache Posts Match Error]', e);
    }
  }

  try {
    const url = new URL(request.url);
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;

    let id = null;
    if (params.id && params.id.length > 0) {
      id = params.id[0];
    }
    const idQuery = url.searchParams.get('id');
    id = id || idQuery;

    const lang = url.searchParams.get('lang') || 'en';

    let targetUrl;
    if (id) {
      targetUrl = new URL(`${TARGET_BASE}/posts/${id}`);
    } else {
      targetUrl = new URL(`${TARGET_BASE}/posts`);
    }

    const isOtherStudio = url.searchParams.get('studio') === 'Other' || url.searchParams.get('studio') === 'Unknown Studio';

    url.searchParams.forEach((value, key) => {
      if (id && key === 'id') return;
      if (isOtherStudio && key === 'studio') return;
      targetUrl.searchParams.append(key, value);
    });

    let data;
    let total = null;
    let totalPages = null;

    const clientSite = request.headers.get('x-client-site') || 'https://www.missav-j.com';

    if (isOtherStudio) {
      const requestedPage = parseInt(url.searchParams.get('page') || '1', 10) || 1;
      const perPageNum = 100;
      const startPage = (requestedPage - 1) * 4 + 1;
      const pagesToFetch = [startPage, startPage + 1, startPage + 2, startPage + 3];

      const fetchPage = async (pageNum) => {
        const pageUrl = new URL(targetUrl.toString());
        pageUrl.searchParams.set('per_page', String(perPageNum));
        pageUrl.searchParams.set('page', String(pageNum));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
          const response = await fetch(pageUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Client-Site': 'https://www.missav-j.com',
              'Referer': 'https://www.missav-j.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) return [];
          return await response.json();
        } catch (err) {
          clearTimeout(timeoutId);
          console.error(`Failed to fetch page ${pageNum} for Other Studio:`, err);
          return [];
        }
      };

      const results = await Promise.all(pagesToFetch.map(p => fetchPage(p)));
      const allPosts = results.flat();

      data = allPosts.filter(post => post && post.id && !post.studio);
      total = '120';
      totalPages = '10';
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response;
      try {
        response = await fetch(targetUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Client-Site': 'https://www.missav-j.com',
            'Referer': 'https://www.missav-j.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          error: 'Gateway Timeout',
          message: 'Upstream API server did not respond in time.'
        }), {
          status: 504,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'WordPress REST API Error',
          message: response.statusText
        }), {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      }

      data = await response.json();
      total = response.headers.get('X-WP-Total');
      totalPages = response.headers.get('X-WP-TotalPages');
    }

    if (data) {
      if (id && !Array.isArray(data)) {
        const translations = await getOrTranslatePost(data, lang, SUPABASE_URL, SUPABASE_KEY, false);
        if (lang && lang !== 'en' && translations[lang]) {
          data.title = translations[lang];
        }
        data.localized_slugs = generateLocalizedSlugs(data.code, data.title, translations);
      } else if (Array.isArray(data)) {
        const ids = data.map(p => p.id);
        const translationsMap = await getBatchTranslationsFromDb(ids, SUPABASE_URL, SUPABASE_KEY);
        
        const translatePromises = data.map(async (post) => {
          let translations = translationsMap[post.id];
          if (!translations) {
            translations = await getOrTranslatePost(post, lang, SUPABASE_URL, SUPABASE_KEY, false);
          }
          if (lang && lang !== 'en' && translations[lang]) {
            post.title = translations[lang];
          }
          post.localized_slugs = generateLocalizedSlugs(post.code, post.title, translations);
        });
        
        await Promise.all(translatePromises);
      }
    }

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400'
    };

    if (total) responseHeaders['X-WP-Total'] = total;
    if (totalPages) responseHeaders['X-WP-TotalPages'] = totalPages;

    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

    if (cache && isGet) {
      context.waitUntil(cache.put(request, responseToReturn.clone()));
    }

    return responseToReturn;

  } catch (error) {
    console.error('[Cloudflare Worker posts Error]', error);
    return new Response(JSON.stringify({
      error: 'Gateway Proxy Error',
      message: error.message
    }), {
      status: 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}
