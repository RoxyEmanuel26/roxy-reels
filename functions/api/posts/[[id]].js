/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/posts)
 * Menjembatani front-end dengan REST API apiJAV secara gratis melalui caching.
 * Terintegrasi dengan database cloud Supabase untuk menyimpan terjemahan.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const POSTS_CACHE_VERSION = 'v2.8.102';
const LIST_FRESH_TTL_SECONDS = 15 * 60;
const LIST_FILTER_TTL_SECONDS = 24 * 60 * 60;
const DETAIL_TTL_SECONDS = 7 * 24 * 60 * 60;
const inFlightRequests = new Map();
const ALLOWED_PARAMS = new Set([
  'id', 'lang', 'page', 'per_page', 'actor', 'studio', 'category', 'tag',
  'search', 'orderby', 'order', 'after'
]);
const VALID_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
const LANG_BY_LOWER = new Map(VALID_LANGS.map(lang => [lang.toLowerCase(), lang]));
const FILTER_PARAMS = new Set(['actor', 'studio', 'category', 'tag', 'search']);
const ORDER_BY_VALUES = new Set(['date', 'modified', 'likes', 'views']);
const STUDIO_ALIASES = {
  's1 no.1 style': 'S1',
  'soft on demand': 'SOD',
  'sod create': 'SOD',
  'idea pocket': 'IdeaPocket',
  'moodyz': "Moody's",
  'kawaii*': 'kawaii',
  'unknown studio': 'Other'
};

function resolveStudioAlias(value) {
  if (!value) return value;
  const trimmed = String(value).trim();
  return STUDIO_ALIASES[trimmed.toLowerCase()] || trimmed;
}

function slugifyTaxonomyTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRequest(request, routeId) {
  const source = new URL(request.url);
  const url = new URL(source.origin + source.pathname);
  url.hash = '';
  for (const key of source.searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(key)) return { error: `Unsupported query parameter: ${key}` };
    if (source.searchParams.getAll(key).length !== 1) return { error: `Duplicate query parameter: ${key}` };
  }

  const queryId = source.searchParams.get('id');
  const id = routeId || queryId;
  if (routeId && queryId && routeId !== queryId) return { error: 'Conflicting video ID' };
  if (id && !/^\d+$/.test(id)) return { error: 'Invalid video ID' };

  for (const [key, rawValue] of source.searchParams) {
    if (key === 'id') continue;
    const value = rawValue.trim();
    if (key === 'lang') {
      const lang = LANG_BY_LOWER.get(value.toLowerCase());
      if (!lang) return { error: 'Invalid language' };
      url.searchParams.set(key, lang);
    } else if (key === 'page' || key === 'per_page') {
      if (!/^\d+$/.test(value)) return { error: `Invalid ${key}` };
      const number = Number(value);
      const maximum = key === 'per_page' ? 100 : 1000000;
      if (number < 1 || number > maximum) return { error: `Invalid ${key}` };
      url.searchParams.set(key, String(number));
    } else if (FILTER_PARAMS.has(key)) {
      if (!value || value.length > 200) return { error: `Invalid ${key}` };
      url.searchParams.set(key, value);
    } else if (key === 'orderby') {
      const normalized = value.toLowerCase();
      if (!ORDER_BY_VALUES.has(normalized)) return { error: 'Invalid orderby' };
      url.searchParams.set(key, normalized);
    } else if (key === 'order') {
      const normalized = value.toUpperCase();
      if (normalized !== 'ASC' && normalized !== 'DESC') return { error: 'Invalid order' };
      url.searchParams.set(key, normalized);
    } else if (key === 'after') {
      if (value.length > 40 || Number.isNaN(Date.parse(value))) return { error: 'Invalid after' };
      url.searchParams.set(key, value);
    }
  }
  if (id) url.searchParams.set('id', id);
  if (!url.searchParams.has('lang')) url.searchParams.set('lang', 'en');
  url.searchParams.sort();
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.set('__posts_cache_version', POSTS_CACHE_VERSION);
  return { url, id, lang: url.searchParams.get('lang'), cacheKey: new Request(cacheUrl.toString(), { method: 'GET' }) };
}

function getCacheTtl(url, id) {
  if (id) return DETAIL_TTL_SECONDS;
  const hasFilter = ['actor', 'studio', 'category', 'tag', 'search']
    .some(key => url.searchParams.has(key));
  return hasFilter ? LIST_FILTER_TTL_SECONDS : LIST_FRESH_TTL_SECONDS;
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

function generateLocalizedSlugs(code, title, _translations, sourceSlug = '') {
  const supportedLangs = ['zh-TW', 'zh-CN', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
  const cleanCode = slugify(code || '');
  const withCode = value => {
    let base = slugify(value) || 'video';
    if (cleanCode && base !== cleanCode && !base.startsWith(`${cleanCode}-`)) base = `${cleanCode}-${base}`;
    return base.slice(0, 100).replace(/-+$/g, '') || 'video';
  };
  const enSlug = withCode(sourceSlug || title);

  // Every language route shares the canonical English slug (differing only by
  // /<lang>/ prefix) so non-ASCII translated slugs can never compete in GSC.
  const slugs = { en: enSlug };
  supportedLangs.forEach(lang => {
    slugs[lang] = enSlug;
  });
  return slugs;
}

const VALID_HREFLANG_ORDER = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

function getAvailableWatchHreflangs(targetLang, translations) {
  if (!translations || typeof translations !== 'object') {
    return (!targetLang || targetLang === 'en') ? ['en'] : [];
  }
  if (targetLang && targetLang !== 'en' && !translations[targetLang]) {
    return [];
  }
  return VALID_HREFLANG_ORDER.filter(code => code === 'en' || Boolean(translations[code]));
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
          const translated = data[0].map(segment => segment[0]).join('').trim();
          if (translated) return translated;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(`Google Translate error via ${domain}:`, e);
    }
  }
  return '';
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
    const translated = await translateTitle(post.title, targetLang);
    if (translated && translated !== String(post.title || '').trim()) {
      translations[targetLang] = translated;
      needsSave = true;
    }
  }

  if (needsSave && Object.keys(translations).length > 0) {
    await saveTranslationToDb(id, translations, supabaseUrl, supabaseKey);
  }

  return translations;
}

const STALE_BACKUP_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Determine whether an upstream HTTP status or thrown error warrants a transient retry.
 */
function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

/**
 * Perform an HTTP GET expecting JSON with bounded timeout and 1 transient retry.
 */
async function fetchUpstreamJsonWithRetry(targetUrl, requestHeaders, {
  timeoutMs = 10000,
  retryTimeoutMs = 8000,
  retryDelayMs = 150,
  expectArray = false
} = {}) {
  const attempts = [timeoutMs, retryTimeoutMs];
  let lastError = null;

  for (let i = 0; i < attempts.length; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), attempts[i]);
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        try { await response.body?.cancel?.(); } catch {}
        if (isRetryableStatus(status) && i + 1 < attempts.length) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        return { ok: false, timedOut: false, status, statusText };
      }

      const data = await response.json();
      if (expectArray && !Array.isArray(data)) {
        throw new Error('Unexpected non-array list payload from upstream');
      }
      return {
        ok: true,
        status: response.status,
        data,
        total: response.headers.get('X-WP-Total'),
        totalPages: response.headers.get('X-WP-TotalPages')
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      const isAbort = err?.name === 'AbortError';
      if (i + 1 < attempts.length) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }
      return {
        ok: false,
        timedOut: isAbort,
        status: isAbort ? 504 : 502,
        statusText: err?.message || 'Upstream fetch error'
      };
    }
  }

  return {
    ok: false,
    timedOut: false,
    status: 502,
    statusText: lastError?.message || 'Upstream fetch error'
  };
}

/**
 * Build a stale backup cache key scoped away from the fresh cache key.
 */
function buildStaleCacheKey(freshCacheKey) {
  if (!freshCacheKey) return null;
  const staleUrl = new URL(freshCacheKey.url);
  staleUrl.searchParams.set('__stale_backup', '1');
  return new Request(staleUrl.toString(), { method: 'GET' });
}

/**
 * Read a stale cached JSON response when live upstream attempts fail.
 */
async function readStaleResponse(cache, staleCacheKey, corsHeaders) {
  if (!cache || !staleCacheKey) return null;
  try {
    const stale = await cache.match(staleCacheKey);
    if (!stale || !stale.ok) return null;
    const headers = new Headers(stale.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    headers.set('Warning', '110 - "Response is Stale"');
    headers.set('X-Data-Freshness', 'stale');
    headers.set('X-Cache-Status', 'STALE');
    headers.set('X-Edge-Mode', 'API-POSTS');
    return new Response(stale.body, { status: 200, headers });
  } catch (err) {
    console.warn('[Stale Posts Cache Read Error]', err);
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Client-Site',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const isHead = request.method === 'HEAD';
  const isRead = request.method === 'GET' || isHead;
  const routeId = params.id && params.id.length > 0 ? params.id[0] : null;
  const normalized = normalizeRequest(request, routeId);
  if (normalized.error) {
    return new Response(JSON.stringify({ error: 'Bad Request', message: normalized.error }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Cache-Status': 'BYPASS',
        'X-Edge-Mode': 'API-POSTS'
      }
    });
  }
  const requestUrl = normalized.url;
  const requestedId = normalized.id;
  const cacheTtl = getCacheTtl(requestUrl, requestedId);
  const cacheKey = isRead ? normalized.cacheKey : null;
  const staleCacheKey = (isRead && !requestUrl.searchParams.has('search')) ? buildStaleCacheKey(cacheKey) : null;
  let cache = null;
  let cachedResponse = null;
  if (isRead) {
    try {
      cache = caches.default;
      cachedResponse = await cache.match(cacheKey);
    } catch (e) {
      console.error('[Cache Posts Match Error]', e);
    }
  }

  const processUpstream = async () => {
  try {
    const url = new URL(requestUrl);
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;

    const id = requestedId;
    const lang = normalized.lang;

    let targetUrl;
    if (id) {
      targetUrl = new URL(`${TARGET_BASE}/posts/${id}`);
    } else {
      targetUrl = new URL(`${TARGET_BASE}/posts`);
    }

    const rawStudio = url.searchParams.get('studio');
    const resolvedStudio = rawStudio ? resolveStudioAlias(rawStudio) : '';
    const isOtherStudio = resolvedStudio === 'Other';

    url.searchParams.forEach((value, key) => {
      if (key === 'id' || key === 'lang') return;
      if (key === 'studio') {
        if (!isOtherStudio && resolvedStudio) {
          targetUrl.searchParams.append('studio', resolvedStudio);
        }
        return;
      }
      if (key === 'tag') {
        targetUrl.searchParams.append('tag', slugifyTaxonomyTag(value) || value);
        return;
      }
      targetUrl.searchParams.append(key, value);
    });

    let data;
    let total = null;
    let totalPages = null;

    const clientIp = request.headers.get('cf-connecting-ip') || '';
    const upstreamHeaders = {
      'Accept': 'application/json',
      'X-Client-Site': 'https://www.missav-j.com',
      'Referer': 'https://www.missav-j.com/',
      'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'X-Forwarded-For': clientIp,
      'CF-Connecting-IP': clientIp
    };

    if (isOtherStudio) {
      const requestedPage = parseInt(url.searchParams.get('page') || '1', 10) || 1;
      const requestedPerPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '24', 10) || 24));
      const pageUrl = new URL(targetUrl.toString());
      pageUrl.searchParams.set('per_page', '100');
      pageUrl.searchParams.set('page', String(requestedPage));
      const upstreamRes = await fetchUpstreamJsonWithRetry(pageUrl.toString(), upstreamHeaders, { expectArray: true });
      if (!upstreamRes.ok) {
        console.error(`Failed to fetch page ${requestedPage} for Other Studio:`, upstreamRes.status, upstreamRes.statusText);
        const staleResp = await readStaleResponse(cache, staleCacheKey, corsHeaders);
        if (staleResp) return staleResp;
        return new Response(JSON.stringify({
          error: upstreamRes.timedOut ? 'Gateway Timeout' : 'WordPress REST API Error',
          message: upstreamRes.statusText
        }), {
          status: upstreamRes.status || 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }

      const allPosts = Array.isArray(upstreamRes.data) ? upstreamRes.data : [];
      data = allPosts
        .filter(post => post && post.id && !post.studio)
        .slice(0, requestedPerPage);
      total = '120';
      totalPages = '10';
    } else {
      const upstreamRes = await fetchUpstreamJsonWithRetry(targetUrl.toString(), upstreamHeaders, { expectArray: !id });
      if (!upstreamRes.ok) {
        if (upstreamRes.timedOut || isRetryableStatus(upstreamRes.status)) {
          const staleResp = await readStaleResponse(cache, staleCacheKey, corsHeaders);
          if (staleResp) return staleResp;
        }
        return new Response(JSON.stringify({
          error: upstreamRes.timedOut ? 'Gateway Timeout' : 'WordPress REST API Error',
          message: upstreamRes.statusText
        }), {
          status: upstreamRes.timedOut ? 504 : (upstreamRes.status || 502),
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(isRetryableStatus(upstreamRes.status) || upstreamRes.timedOut ? { 'Retry-After': '60' } : {})
          }
        });
      }

      data = upstreamRes.data;
      total = upstreamRes.total;
      totalPages = upstreamRes.totalPages;
    }

    if (data) {
      if (id && !Array.isArray(data) && lang === 'en') {
        data.localized_slugs = generateLocalizedSlugs(data.code, data.title, {}, data.slug);
        data.en_slug = data.localized_slugs.en;
      } else if (id && !Array.isArray(data)) {
        // Preserve canonical English title/slug before overwriting data.title for display
        const originalEnTitle = data.title;
        // Single post: apply translation with a strict 5-second timeout cap
        const translationTimeout = new Promise(resolve => setTimeout(() => resolve(null), 5000));
        const translationResult = await Promise.race([
          getOrTranslatePost(data, lang, SUPABASE_URL, SUPABASE_KEY, false).catch(() => null),
          translationTimeout
        ]);
        if (translationResult) {
          if (lang && lang !== 'en' && translationResult[lang]) {
            data.title = translationResult[lang];
          }
          data.localized_slugs = generateLocalizedSlugs(data.code, originalEnTitle, translationResult, data.slug);
          data.en_slug = data.localized_slugs.en;
          data.available_hreflangs = getAvailableWatchHreflangs(lang, translationResult);
        } else {
          // Timeout — keep canonical English slug and avoid advertising untranslated hreflangs
          data.localized_slugs = generateLocalizedSlugs(data.code, originalEnTitle, {}, data.slug);
          data.en_slug = data.localized_slugs.en;
          data.available_hreflangs = [];
        }
      } else if (Array.isArray(data) && lang === 'en') {
        data.forEach(post => {
          post.localized_slugs = generateLocalizedSlugs(post.code, post.title, {}, post.slug);
          post.en_slug = post.localized_slugs.en;
        });
      } else if (Array.isArray(data)) {
        // LIST: Only apply CACHED translations (fast Supabase lookup, max 6s timeout)
        // Never block the response for real-time translation of new posts.
        // Background translation will populate the cache for subsequent requests.
        const ids = data.filter(p => p && p.id).map(p => p.id);
        const translationsMap = await getBatchTranslationsFromDb(ids, SUPABASE_URL, SUPABASE_KEY).catch(() => ({}));
        
        data.forEach(post => {
          if (!post) return;
          const originalEnTitle = post.title;
          const translations = translationsMap[post.id] || {};
          if (lang && lang !== 'en' && translations[lang]) {
            post.title = translations[lang];
          }
          post.localized_slugs = generateLocalizedSlugs(post.code, originalEnTitle, translations, post.slug);
          post.en_slug = post.localized_slugs.en;
          post.available_hreflangs = getAvailableWatchHreflangs(lang, translations);
        });

      }
    }

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${cacheTtl}, stale-while-revalidate=86400`,
      'X-Cache-Status': isRead ? 'MISS' : 'BYPASS',
      'X-Edge-Mode': 'API-POSTS'
    };

    if (total) responseHeaders['X-WP-Total'] = total;
    if (totalPages) responseHeaders['X-WP-TotalPages'] = totalPages;

    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

    // A normal page visit commonly loads this endpoint before its share button
    // is used. Store the small post payload under the same key consumed by the
    // server-rendered social card so the first Twitterbot request is warm.
    if (id && data && !Array.isArray(data) && data.title) {
      try {
        const socialBody = JSON.stringify(data);
        const socialMetadataKey = new Request(
          `${url.origin}/__og-metadata/posts/${encodeURIComponent(id)}`,
          { method: 'GET' }
        );
        const socialStaleKey = new Request(
          `${url.origin}/__og-metadata-stale/posts/${encodeURIComponent(id)}`,
          { method: 'GET' }
        );
        const socialMetadataResponse = new Response(socialBody, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=604800'
          }
        });
        const socialStaleResponse = new Response(socialBody, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${STALE_BACKUP_TTL_SECONDS}`
          }
        });
        context.waitUntil?.(
          Promise.allSettled([
            caches.default.put(socialMetadataKey, socialMetadataResponse),
            caches.default.put(socialStaleKey, socialStaleResponse)
          ]).catch(err => console.warn('[Social Metadata Prewarm Error]', err))
        );
      } catch (err) {
        console.warn('[Social Metadata Prewarm Error]', err);
      }
    }

    return responseToReturn;

  } catch (error) {
    console.error('[Cloudflare Worker posts Error]', error);
    const staleResp = await readStaleResponse(cache, staleCacheKey, corsHeaders);
    if (staleResp) return staleResp;
    return new Response(JSON.stringify({
      error: 'Gateway Proxy Error',
      message: error.message
    }), {
      status: 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  };

  const toClientResponse = (resp) => isHead
    ? new Response(null, { status: resp.status, headers: resp.headers })
    : resp;

  if (cachedResponse && cachedResponse.ok) {
    const finalResp = new Response(isHead ? null : cachedResponse.body, cachedResponse);
    finalResp.headers.set('X-Cache-Status', 'HIT');
    finalResp.headers.set('X-Edge-Mode', 'API-POSTS');
    return finalResp;
  }

  if (!isRead) {
    const response = await processUpstream();
    response.headers.set('X-Cache-Status', 'BYPASS');
    response.headers.set('X-Edge-Mode', 'API-POSTS');
    return toClientResponse(response);
  }

  const inFlightKey = cacheKey.url;
  let responsePromise = inFlightRequests.get(inFlightKey);
  if (!responsePromise) {
    responsePromise = processUpstream()
      .then(response => {
        if (response.ok && cache && response.headers.get('X-Data-Freshness') !== 'stale') {
          const writes = [cache.put(cacheKey, response.clone())];
          if (staleCacheKey) {
            const staleHeaders = new Headers(response.headers);
            staleHeaders.set('Cache-Control', `public, max-age=${STALE_BACKUP_TTL_SECONDS}`);
            writes.push(cache.put(staleCacheKey, new Response(response.clone().body, { status: 200, headers: staleHeaders })));
          }
          context.waitUntil?.(Promise.allSettled(writes));
        }
        return response;
      })
      .finally(() => inFlightRequests.delete(inFlightKey));
    inFlightRequests.set(inFlightKey, responsePromise);
  }

  const response = (await responsePromise).clone();
  if (response.headers.get('X-Data-Freshness') !== 'stale') {
    response.headers.set('X-Cache-Status', 'MISS');
  }
  response.headers.set('X-Edge-Mode', 'API-POSTS');
  return toClientResponse(response);
  } catch (fatalErr) {
    console.error('[API Posts Fatal Error]', fatalErr);
    return new Response(JSON.stringify({
      error: 'Service Temporarily Unavailable',
      message: fatalErr?.message || 'Unexpected posts proxy error'
    }), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
        'X-Edge-Mode': 'API-POSTS-503'
      }
    });
  }
}
