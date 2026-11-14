/**
 * MISSAV-J — SPA Catchall Router & SEO Tag Injector (Cloudflare)
 * 
 * OPTIMIZED: Menghilangkan loopback request ke /api/posts.
 * Sekarang fetch langsung ke server.apijav.com & Supabase
 * untuk menghemat 1 Worker request per halaman watch.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const VALID_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

// Social preview crawlers do not execute the client-side metadata updater. They
// must receive complete, stable metadata in the first HTML response.
const SOCIAL_CRAWLER_REGEX = /Twitterbot|facebookexternalhit|Facebot|LinkedInBot|TelegramBot|Discordbot|Slackbot|WhatsApp/i;
const SEARCH_CRAWLER_REGEX = /Googlebot|Google-InspectionTool|GoogleOther|AdsBot-Google|Mediapartners-Google|Storebot-Google|Google-Read-Aloud|APIs-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver|Applebot|GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot|anthropic-ai|cohere-ai/i;
const COMMERCIAL_CRAWLER_REGEX = /AhrefsBot|SemrushBot|MJ12bot/i;
const TRACKING_PARAM_REGEX = /^(?:ref|utm_[a-z0-9_]+|fbclid|gclid|dclid|msclkid|_ga|cb)$/i;
const SSR_CACHE_VERSION = 'v2.8.102';

const EDITION_LOCALIZED_LABELS = {
  en: { 'uncensored-leak': 'Uncensored Leak', 'english-subtitle': 'English Subtitle', 'chinese-subtitle': 'Chinese Subtitle', uncensored: 'Uncensored' },
  id: { 'uncensored-leak': 'Bocoran Tanpa Sensor', 'english-subtitle': 'Subtitle Inggris', 'chinese-subtitle': 'Subtitle Mandarin', uncensored: 'Tanpa Sensor' },
  'zh-TW': { 'uncensored-leak': '無碼流出', 'english-subtitle': '英文字幕', 'chinese-subtitle': '中文字幕', uncensored: '無碼版' },
  'zh-CN': { 'uncensored-leak': '无码流出', 'english-subtitle': '英文字幕', 'chinese-subtitle': '中文字幕', uncensored: '无码版' },
  ja: { 'uncensored-leak': '無修正リーク', 'english-subtitle': '英語字幕', 'chinese-subtitle': '中国語字幕', uncensored: '無修正' },
  ko: { 'uncensored-leak': '무수정 유출', 'english-subtitle': '영어 자막', 'chinese-subtitle': '중국어 자막', uncensored: '무수정' },
  ms: { 'uncensored-leak': 'Bocor Tanpa Penapis', 'english-subtitle': 'Sarikata Inggeris', 'chinese-subtitle': 'Sarikata Cina', uncensored: 'Tanpa Penapis' },
  th: { 'uncensored-leak': 'หลุดไม่เซ็นเซอร์', 'english-subtitle': 'ซับอังกฤษ', 'chinese-subtitle': 'ซับจีน', uncensored: 'ไม่เซ็นเซอร์' },
  de: { 'uncensored-leak': 'Unzensierter Leak', 'english-subtitle': 'Englische Untertitel', 'chinese-subtitle': 'Chinesische Untertitel', uncensored: 'Unzensiert' },
  fr: { 'uncensored-leak': 'Fuite non censurée', 'english-subtitle': 'Sous-titres anglais', 'chinese-subtitle': 'Sous-titres chinois', uncensored: 'Non censuré' },
  vi: { 'uncensored-leak': 'Không che rò rỉ', 'english-subtitle': 'Phụ đề tiếng Anh', 'chinese-subtitle': 'Phụ đề tiếng Trung', uncensored: 'Không che' },
  fil: { 'uncensored-leak': 'Uncensored Leak', 'english-subtitle': 'English Subtitle', 'chinese-subtitle': 'Chinese Subtitle', uncensored: 'Uncensored' },
  pt: { 'uncensored-leak': 'Vazamento Sem Censura', 'english-subtitle': 'Legenda em Inglês', 'chinese-subtitle': 'Legenda em Chinês', uncensored: 'Sem Censura' }
};

const EDITION_SUFFIX_DEFS = [
  { key: 'uncensored-leak', suffixRegex: /-uncensored-leak$/i, titleRegex: /uncensored[\s-]*leak|無修正リーク|無碼流出|无码流出|bocoran tanpa sensor/i },
  { key: 'english-subtitle', suffixRegex: /-(?:english-subtitle|eng-sub)$/i, titleRegex: /english[\s-]*sub(?:title)?s?|英語字幕|영어\s*자막|英文字幕|subtitle\s*inggris/i },
  { key: 'chinese-subtitle', suffixRegex: /-(?:chinese-subtitle|chinese-sub|chinesesub)$/i, titleRegex: /chinese[\s-]*sub(?:title)?s?|中国語字幕|중국어\s*자막|中文字幕|subtitle\s*mandarin/i },
  { key: 'uncensored', suffixRegex: /-uncensored$/i, titleRegex: /\buncensored\b|無修正|無碼|无码|tanpa\s*sensor/i }
];

function extractCodeAndEdition(codeValue) {
  const rawCode = String(codeValue ?? '').trim();
  if (!rawCode) {
    return { rawCode: '', baseCode: '', editionKey: 'standard' };
  }
  for (const def of EDITION_SUFFIX_DEFS) {
    if (def.suffixRegex.test(rawCode)) {
      return {
        rawCode,
        baseCode: rawCode.replace(def.suffixRegex, '').trim(),
        editionKey: def.key
      };
    }
  }
  return { rawCode, baseCode: rawCode, editionKey: 'standard' };
}

function getEditionLabel(editionKey, lang = 'en') {
  if (!editionKey || editionKey === 'standard') return '';
  const dict = EDITION_LOCALIZED_LABELS[lang] || EDITION_LOCALIZED_LABELS.en;
  return dict[editionKey] || EDITION_LOCALIZED_LABELS.en[editionKey] || '';
}

function titleHasEditionMarker(title, editionKey) {
  if (!title || !editionKey || editionKey === 'standard') return false;
  const def = EDITION_SUFFIX_DEFS.find(d => d.key === editionKey);
  return Boolean(def && def.titleRegex.test(title));
}

function formatWatchEditionTitle(title, editionKey, lang = 'en') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle || !editionKey || editionKey === 'standard') return cleanTitle;
  const label = getEditionLabel(editionKey, lang);
  if (!label || titleHasEditionMarker(cleanTitle, editionKey)) return cleanTitle;
  return `${cleanTitle} (${label})`;
}

// Match the canonical English slug emitted by generate_sitemap.js. Locale
// prefixes carry the language; a stable slug avoids 13 competing aliases.
function canonicalWatchPath(post, id) {
  const slugify = value => decodeBasicEntities(value)
    .toLowerCase().trim().replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '').replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const code = slugify(post.code);
  let base = slugify(post.slug || post.title) || 'video';
  if (code && base !== code && !base.startsWith(`${code}-`)) base = `${code}-${base}`;
  base = base.slice(0, 100).replace(/-+$/g, '') || 'video';
  return `/watch/${encodeURIComponent(`${base}-${id}`)}`;
}

const GENERIC_SLUG_NUM_PREFIX_REGEX = /^(?:part|vol|ep|episode|top|no|day|year|years|age|best|hot|big|new|ch|ver|v|set)-\d+$/;
const RELEASE_CODE_DESCRIPTOR_REGEX = /(?:-(?:english-subtitle|uncensored-leak|uncensored|chinese-subtitle|chinesesub|subtitle|sub|leak|hd|4k))+$/i;

/**
 * Extracts a normalized release code prefix (e.g. "cemd-616", "fc2-3245350",
 * "h0930-ki180818") from a slug or post code so upstream ID reassignments can
 * be distinguished from same-video slug variants.
 */
function extractReleaseCodePrefix(value) {
  const normalized = decodeBasicEntities(value)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!normalized) return '';

  const fc2Match = normalized.match(/^fc2-(?:ppv-)?(\d{4,8})(?=-|$)/);
  if (fc2Match) return `fc2-${fc2Match[1]}`;

  const numericCodeMatch = normalized.match(/^(\d{6}-\d{2,4})(?=-|$)/);
  if (numericCodeMatch) return numericCodeMatch[1];

  const hyphenCodeMatch = normalized.match(/^((?:[a-z]+\d{0,4}|\d{1,2}[a-z]{2,6})-[a-z]{0,3}\d{2,8})(?=-|$)/);
  if (hyphenCodeMatch) {
    const candidate = hyphenCodeMatch[1].replace(RELEASE_CODE_DESCRIPTOR_REGEX, '');
    if (!GENERIC_SLUG_NUM_PREFIX_REGEX.test(candidate)) return candidate;
  }

  const compactCodeMatch = normalized.match(/^([a-z]{1,5}\d{3,6})(?=-|$)/);
  if (compactCodeMatch) return compactCodeMatch[1];

  return '';
}

/**
 * Returns true when an incoming watch slug explicitly carries a different
 * release code than the post currently assigned to that upstream ID.
 */
function isWatchCodeMismatch(rawSlug, id, postCode) {
  if (!rawSlug || !postCode) return false;
  let decodedSlug = String(rawSlug);
  try {
    decodedSlug = decodeURIComponent(decodedSlug);
  } catch {}
  const withoutId = decodedSlug.replace(new RegExp(`-${id}$`), '');
  if (!withoutId || withoutId === decodedSlug || /^\d+$/.test(withoutId) || withoutId === 'video') {
    return false;
  }
  const expectedCode = extractReleaseCodePrefix(postCode);
  const incomingCode = extractReleaseCodePrefix(withoutId);
  if (!expectedCode || !incomingCode) return false;
  return expectedCode !== incomingCode;
}

function removeDefaultSeoNoscript(html) {
  // SSR replaces the generic homepage fallback with route-specific content.
  // Leaving the homepage noscript behind creates a second, conflicting H1.
  return html.replace(/<noscript>\s*<div[^>]*>\s*<h1>MISSAV-J — Premium JAV Streaming<\/h1>[\s\S]*?<\/div>\s*<\/noscript>/i, '');
}

function localizeSidebarHtml(html, lang) {
  const targetLang = VALID_LANGS.includes(lang) ? lang : 'en';
  const updated = html.replace(/<a\b[^>]*\bid="logo-branding"[^>]*>/i, (tag) =>
    tag.replace(/\bhref="[^"]*"/i, `href="/${targetLang}/"`)
  );
  if (targetLang === 'en') return updated;
  return updated.replace(/(<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>)/i, (block) =>
    block.replace(/href="\/en(\/[^"]*)"/g, `href="/${targetLang}$1"`)
  );
}

const STUDIO_ALIASES = {
  's1 no.1 style': 'S1',
  'soft on demand': 'SOD',
  'sod create': 'SOD',
  'idea pocket': 'IdeaPocket',
  'moodyz': "Moody's",
  'prestige': 'PRESTIGE',
  'kawaii*': 'kawaii',
  'unknown studio': 'Other'
};

const ACTIVE_POPULAR_STUDIOS = [
  'S1', 'Madonna', "Moody's", 'SOD',
  'Attackers', 'IdeaPocket', 'Fitch', 'FALENO',
  'Premium', 'kawaii', 'Wanz Factory', 'E-BODY',
  'PRESTIGE', 'FALENO TUBE'
];

function resolveStudioAlias(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  return STUDIO_ALIASES[trimmed.toLowerCase()] || trimmed;
}

const TAXONOMY_MIN_INDEXABLE_VIDEOS = 5;

const ENGLISH_SPECIFIC_CATEGORIES = new Set([
  'jav english sub',
  'english subtitle',
  'english sub'
]);

const CATEGORY_ALIASES = {
  'tokyo hot': 'Tokyohot',
  'en/tokyohot': 'Tokyohot',
  'en/fc2': 'Fc2',
  'dm150/en/fc2': 'Fc2',
  'en/caribbeancom': 'Caribbeancom',
  'en/madou': 'Madou',
  'en/english subtitle': 'English Subtitle',
  'en/uncensored leak': 'Uncensored leak',
  'en/xxxav': 'Xxxav',
  'dm29/en/xxxav': 'Xxxav',
  'en/naughty4610': 'Naughty4610',
  'blonde / blonde': 'Blonde'
};

function resolveCategoryAlias(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  const mapped = CATEGORY_ALIASES[lower];
  if (mapped) {
    return CURATED_CATEGORY_CANONICAL_MAP.get(mapped.toLowerCase()) || mapped;
  }
  const slashParts = trimmed.split(/\s+\/\s+/);
  if (slashParts.length === 2 && slashParts[0].trim().toLowerCase() === slashParts[1].trim().toLowerCase()) {
    const clean = slashParts[0].trim();
    return CURATED_CATEGORY_CANONICAL_MAP.get(clean.toLowerCase()) || clean;
  }
  const dirtyPrefixMatch = trimmed.match(/^(?:dm\d+\/)?en\/(.+)$/i);
  if (dirtyPrefixMatch && dirtyPrefixMatch[1]) {
    const candidate = dirtyPrefixMatch[1].trim();
    if (CURATED_CATEGORY_CANONICAL_MAP.has(candidate.toLowerCase())) {
      return CURATED_CATEGORY_CANONICAL_MAP.get(candidate.toLowerCase());
    }
  }
  return CURATED_CATEGORY_CANONICAL_MAP.get(lower) || trimmed;
}

function slugifyTaxonomyParam(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function appendPageQueryParam(canonicalUrl, pageNum) {
  const sep = canonicalUrl.includes('?') ? '&' : '?';
  return `${canonicalUrl}${sep}page=${pageNum}`;
}

function decodeBasicEntities(value) {
  if (!value) return '';
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&#0?38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function isSpamActorName(name) {
  if (!name) return true;
  const trimmed = String(name).trim();
  if (!trimmed) return true;
  if (/^[-_]+|[-_]+$/.test(trimmed)) return true;
  if (!/[\p{L}\p{N}]/u.test(trimmed)) return true;
  if (/[\[\]【】◯!?！？]|\.\.\./.test(trimmed)) return true;
  if (/\byears?\s*old\b/i.test(trimmed)) return true;
  if (/\b(?:creampie|orgy|sluts?|bitch|big\s*tits|squirts?|office\s*lady|company\s*(?:employee|president)|flight\s*attendant|hostess|receptionist|part-?timer|amateur|masochistic|housewife|university\s*student)\b/i.test(trimmed)) return true;
  if (/,\s*\d{2}\b|\(\s*\d{2}\s*\)|\/|×/.test(trimmed)) return true;
  const base = trimmed.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!base || base.split(/\s+/).length >= 5 || base.length > 42 || trimmed.length > 68) return true;
  return false;
}

function normalizeActorRomanKey(value) {
  const cleaned = decodeBasicEntities(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (!cleaned) return '';
  const roman = cleaned
    .replace(/shi/g, 'si')
    .replace(/chi/g, 'ti')
    .replace(/tsu/g, 'tu')
    .replace(/fu/g, 'hu')
    .replace(/sha/g, 'sya')
    .replace(/shu/g, 'syu')
    .replace(/sho/g, 'syo')
    .replace(/cha/g, 'tya')
    .replace(/chu/g, 'tyu')
    .replace(/cho/g, 'tyo')
    .replace(/ja/g, 'zya')
    .replace(/ju/g, 'zyu')
    .replace(/jo/g, 'zyo')
    .replace(/ji/g, 'zi')
    .replace(/o[uoh]/g, 'o')
    .replace(/uu/g, 'u');
  return roman;
}

function resolveCanonicalActorTerm(actorsList, queryName) {
  if (!Array.isArray(actorsList) || !queryName) return null;
  const decodedQuery = decodeBasicEntities(queryName);
  const queryLower = decodedQuery.toLowerCase();
  const queryRoman = normalizeActorRomanKey(decodedQuery).replace(/\s+/g, '');
  const queryTokens = normalizeActorRomanKey(decodedQuery).split(/\s+/).filter(Boolean);
  const querySorted = queryTokens.length >= 2 ? [...queryTokens].sort().join('') : '';

  let exactMatch = null;
  let romanMatch = null;
  let swappedMatch = null;

  for (const rawTerm of actorsList) {
    if (typeof rawTerm !== 'string') continue;
    const term = decodeBasicEntities(rawTerm);
    if (!term || isSpamActorName(term)) continue;

    const base = term.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    const parens = [...term.matchAll(/\(([^)]+)\)/g)].map(m => m[1].trim()).filter(Boolean);
    const candidates = [term, base, ...parens];

    for (const cand of candidates) {
      if (cand.toLowerCase() === queryLower) {
        exactMatch = term;
        break;
      }
      const candRoman = normalizeActorRomanKey(cand).replace(/\s+/g, '');
      if (!romanMatch && queryRoman && candRoman === queryRoman) {
        romanMatch = term;
      }
      if (!swappedMatch && querySorted) {
        const candTokens = normalizeActorRomanKey(cand).split(/\s+/).filter(Boolean);
        if (candTokens.length === queryTokens.length && [...candTokens].sort().join('') === querySorted) {
          swappedMatch = term;
        }
      }
    }
    if (exactMatch) break;
  }

  return exactMatch || romanMatch || swappedMatch || null;
}

function resolveCanonicalStudioTerm(studiosList, queryName) {
  if (!Array.isArray(studiosList) || !queryName) return null;
  const decodedQuery = decodeBasicEntities(queryName);
  const queryLower = decodedQuery.toLowerCase();
  const queryCompact = queryLower.replace(/[^a-z0-9]/g, '');

  for (const rawStudio of studiosList) {
    if (typeof rawStudio !== 'string') continue;
    const studio = decodeBasicEntities(rawStudio);
    if (!studio) continue;
    if (studio.toLowerCase() === queryLower) return studio;
  }
  if (!queryCompact) return null;
  for (const rawStudio of studiosList) {
    if (typeof rawStudio !== 'string') continue;
    const studio = decodeBasicEntities(rawStudio);
    if (studio.toLowerCase().replace(/[^a-z0-9]/g, '') === queryCompact) return studio;
  }
  return null;
}

async function fetchCachedTaxonomies(cache) {
  const taxCacheUrl = 'https://cache.missav-j.internal/__taxonomies/v1';
  try {
    if (cache) {
      const cached = await cache.match(new Request(taxCacheUrl, { method: 'GET' }));
      if (cached) {
        const parsed = await cached.json();
        if (parsed && Array.isArray(parsed.actors)) return parsed;
      }
    }
  } catch (err) {
    console.warn('[Taxonomies Cache Read Error]', err?.message || err);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${TARGET_BASE}/taxonomies`, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': 'https://www.missav-j.com',
        'User-Agent': 'MISSAV-J-Edge-SSR/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.actors)) return null;
    if (cache) {
      const cacheRes = new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=43200'
        }
      });
      cache.put(new Request(taxCacheUrl, { method: 'GET' }), cacheRes).catch(() => {});
    }
    return data;
  } catch (err) {
    console.warn('[Taxonomies Fetch Error]', err?.message || err);
    return null;
  }
}

function generate503Html(origin, lang = 'en') {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>503 - Service Temporarily Unavailable | MISSAV-J</title>
  <meta name="robots" content="noindex, follow" />
</head>
<body style="font-family:sans-serif;background:#0f0f10;color:#fff;text-align:center;padding:60px 20px;">
  <h1>503 — Service Temporarily Unavailable</h1>
  <p>Our video metadata server is momentarily busy. Please try again shortly.</p>
  <p><a href="${origin}/${lang}/" style="color:#e50914;">Back to Home</a></p>
</body>
</html>`;
}

function generate404Html(origin, lang = 'en', statusCode = 404) {
  const isGone = statusCode === 410;
  const codeText = isGone ? '410' : '404';
  const titleText = isGone ? 'Video Unavailable' : 'Page Not Found';
  const descText = isGone
    ? 'This video has been removed or replaced at its source and this URL is no longer valid.'
    : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${codeText} - ${titleText} | MISSAV-J</title>
  <meta name="robots" content="noindex, follow" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f0f10; color: #fff; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
    .container { max-width: 500px; padding: 40px 20px; }
    h1 { font-size: 5rem; margin: 0; color: #e50914; font-weight: 900; }
    h2 { font-size: 1.5rem; margin: 10px 0 20px; }
    p { color: #888; line-height: 1.6; margin-bottom: 30px; }
    a.btn { display: inline-block; background: #e50914; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.2s; }
    a.btn:hover { background: #b80710; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${codeText}</h1>
    <h2>${titleText}</h2>
    <p>${descText}</p>
    <a href="${origin}/${lang}/" class="btn">Back to Home</a>
  </div>
</body>
</html>`;
}

/** Build a standardized HTML 404/410 response with noindex HTTP header. */
function build404Response(origin, lang = 'en', edgeMode = 'NOT-FOUND-404', cacheControl = 'public, max-age=3600', statusCode = 404) {
  return new Response(generate404Html(origin, lang, statusCode), {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Robots-Tag': 'noindex, follow',
      'X-Edge-Mode': edgeMode,
      'X-Cache-Status': 'BYPASS'
    }
  });
}

const KNOWN_ROUTE_NAME_REGEX = /^\/(?:([a-z]{2}(?:-[a-z]{2})?)\/)?(watch|actor|category|tag|studio|trending|recent|actors|categories|studios|popular-actors|watch-later|history|search|dmca|privacy-policy|terms|contact|2257)(?:\/([^\/]+))?\/?$/i;

/** Parse numeric video ID from watch slug suffix or empty-slug ?id= query param. */
function extractWatchId(slug, url) {
  if (slug) {
    const match = slug.match(/.*-(\d+)$/);
    if (match) return match[1];
    if (/^\d+$/.test(slug)) return slug;
    return null;
  }
  if (url && url.searchParams) {
    const qId = (url.searchParams.get('id') || '').trim();
    if (/^\d+$/.test(qId)) return qId;
  }
  return null;
}

/** Build a 301 redirect response for mapped duplicate/clone video IDs. */
function buildDuplicateWatchRedirect(origin, lang, dupCanonicalSlug) {
  let safeDupSlug = dupCanonicalSlug;
  try {
    safeDupSlug = encodeURIComponent(decodeURIComponent(dupCanonicalSlug));
  } catch {
    safeDupSlug = encodeURIComponent(dupCanonicalSlug);
  }
  return new Response(null, {
    status: 301,
    headers: {
      'Location': `${origin}/${lang}/watch/${safeDupSlug}`,
      'Cache-Control': 'public, max-age=86400',
      'X-Edge-Mode': 'DUPLICATE-VIDEO-REDIRECT',
      'X-Cache-Status': 'BYPASS'
    }
  });
}

/** Collapse lang/route case variants and trailing slashes into one canonical 301 hop. */
function normalizeCanonicalRouteRedirect(url, pathname, isGet) {
  if (!isGet || !pathname || pathname === '/') return null;
  if (/^\/(?:api|img|assets|sitemaps)(?:\/|$)/i.test(pathname)) return null;

  const langRootMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\/?$/i);
  if (langRootMatch) {
    const rawLang = langRootMatch[1];
    const matchedLang = VALID_LANGS.find(l => l.toLowerCase() === rawLang.toLowerCase());
    if (matchedLang) {
      const targetPath = `/${matchedLang}/`;
      if (pathname !== targetPath) {
        return new Response(null, {
          status: 301,
          headers: {
            'Location': `${url.origin}${targetPath}${url.search}`,
            'Cache-Control': 'public, max-age=86400',
            'X-Edge-Mode': rawLang !== matchedLang ? 'LANG-CASE-REDIRECT' : 'CANONICAL-TRAILING-SLASH-REDIRECT'
          }
        });
      }
      return null;
    }
  }

  const routeMatch = pathname.match(KNOWN_ROUTE_NAME_REGEX);
  if (!routeMatch) return null;

  const rawLang = routeMatch[1] || '';
  const rawRoute = routeMatch[2] || '';
  const extraSlug = routeMatch[3] || '';
  const lowerRoute = rawRoute.toLowerCase();

  // Only /watch supports an extra slug segment; /actors/foo must remain 404.
  if (extraSlug && lowerRoute !== 'watch') return null;

  let canonicalLangPrefix = '';
  let langCaseChanged = false;
  if (rawLang) {
    const matchedLang = VALID_LANGS.find(l => l.toLowerCase() === rawLang.toLowerCase());
    if (!matchedLang) return null;
    canonicalLangPrefix = `/${matchedLang}`;
    langCaseChanged = rawLang !== matchedLang;
  }

  const targetPath = `${canonicalLangPrefix}/${lowerRoute}${extraSlug ? `/${extraSlug}` : ''}`;
  if (pathname === targetPath) return null;

  const edgeMode = langCaseChanged
    ? 'LANG-CASE-REDIRECT'
    : (rawRoute !== lowerRoute ? 'ROUTE-CASE-REDIRECT' : 'STRIP-TRAILING-SLASH-REDIRECT');
  return new Response(null, {
    status: 301,
    headers: {
      'Location': `${url.origin}${targetPath}${url.search}`,
      'Cache-Control': 'public, max-age=86400',
      'X-Edge-Mode': edgeMode
    }
  });
}

const LEGAL_SSR_HTML = {
  'dmca': `
    <article class="legal-page-content" style="max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.7; color: #ddd;">
      <h1>DMCA (Digital Millennium Copyright Act) Policy</h1>
      <p>MISSAV-J respects the intellectual property rights of others. We are an automated search and indexing portal for third-party videos and do not host, store, upload, or stream any media files on our own servers. All video materials are embedded directly from external third-party sources.</p>
      <h2>Notice and Takedown Procedure</h2>
      <p>If you believe that copyrighted material has been linked to or displayed on this website in a manner that constitutes infringement, please submit a formal DMCA take-down notification to our designated compliance agent.</p>
      <h3>Required Notice Elements</h3>
      <ul>
        <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>Direct URLs on MISSAV-J where the allegedly infringing link or embed is located.</li>
        <li>Contact information of the complaining party, including full legal name, physical address, email address, and telephone number.</li>
        <li>A statement that the complaining party has a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the copyright owner.</li>
      </ul>
      <h2>Designated Compliance Contact</h2>
      <p>Please send all formal DMCA notices to: <strong><a href="mailto:compliance@missav-j.com" style="color: #e50914;">compliance@missav-j.com</a></strong></p>
      <p>Valid notices are processed within 24 to 48 business hours.</p>
    </article>
  `,
  '2257': `
    <article class="legal-page-content" style="max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.7; color: #ddd;">
      <h1>18 U.S.C. § 2257 Record-Keeping Compliance Statement</h1>
      <p>All visual depictions of actual sexually explicit conduct appearing on this website were produced and published by third-party content creators and organizations. Pursuant to Title 18 of the United States Code, Section 2257 (18 U.S.C. § 2257) and 28 C.F.R. Part 75, all models, actors, and performers depicted in these visual materials were 18 years of age or older at the time of production.</p>
      <h2>Custodian of Records</h2>
      <p>Age verification records and compliance documentation required under 18 U.S.C. § 2257 are maintained by the respective original producers and publishers of the primary video content. This website operates strictly as an indexing service and does not produce, record, or physically retain master records for third-party materials.</p>
      <p>For inquiries regarding specific producer record custodians, please contact: <strong><a href="mailto:compliance@missav-j.com" style="color: #e50914;">compliance@missav-j.com</a></strong></p>
    </article>
  `,
  'privacy-policy': `
    <article class="legal-page-content" style="max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.7; color: #ddd;">
      <h1>Privacy Policy</h1>
      <p>At MISSAV-J, accessible from https://www.missav-j.com/, the privacy of our visitors is of paramount importance. This Privacy Policy outlines the types of information collected and how it is used.</p>
      <h2>Log Files & Cookies</h2>
      <p>Like most websites, MISSAV-J utilizes standard log files. The information inside log files includes IP addresses, browser types, Internet Service Providers (ISP), referring/exit pages, and date/time stamps. This information is used solely to analyze trends, administer the site, and track technical performance.</p>
      <p>We use local storage strictly for remembering user interface preferences, such as selected language and display mode.</p>
      <h2>Third-Party Advertising & Privacy</h2>
      <p>Third-party ad networks and ad servers may use cookies, JavaScript, or web beacons in their respective advertisements displayed on MISSAV-J. These third parties automatically receive your IP address when this occurs. MISSAV-J has no access to or control over these cookies used by third-party advertisers.</p>
      <h2>Consent</h2>
      <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>
      <p>Questions? Contact us at: <strong><a href="mailto:compliance@missav-j.com" style="color: #e50914;">compliance@missav-j.com</a></strong></p>
    </article>
  `,
  'terms': `
    <article class="legal-page-content" style="max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.7; color: #ddd;">
      <h1>Terms of Service</h1>
      <p>Welcome to MISSAV-J. By accessing and using https://www.missav-j.com/, you accept and agree to be bound by the following Terms of Service.</p>
      <h2>Age Requirement (18+)</h2>
      <p>You must be at least 18 years of age, or the age of legal majority in your jurisdiction, whichever is greater, to view content on MISSAV-J. If you are under 18, you must exit this website immediately.</p>
      <h2>Nature of the Service</h2>
      <p>MISSAV-J is an online indexing and search interface for third-party media content. We do not host, store, or broadcast media files on our servers. All video streams originate from independent external services.</p>
      <h2>Disclaimer of Warranties & Limitation of Liability</h2>
      <p>The materials on MISSAV-J are provided on an 'as is' basis. MISSAV-J makes no warranties, expressed or implied, regarding reliability, availability, or fitness for a particular purpose.</p>
      <p>Contact: <strong><a href="mailto:compliance@missav-j.com" style="color: #e50914;">compliance@missav-j.com</a></strong></p>
    </article>
  `,
  'contact': `
    <article class="legal-page-content" style="max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.7; color: #ddd;">
      <h1>Contact Us & Advertising Inquiries</h1>
      <p>If you have any questions, feedback, or business inquiries, please reach out through the channels below:</p>
      <h2>Advertising & Sponsorships</h2>
      <p>For display banners, native placements, pop-under opportunities, or direct partnerships, please include your network name, budget, and target geos.</p>
      <h2>Content & Compliance</h2>
      <p>To report broken links, submit DMCA notices, or request copyright review, please include the exact video code and URLs.</p>
      <h2>Email Contact</h2>
      <p>Official Contact Email: <strong><a href="mailto:compliance@missav-j.com" style="color: #e50914;">compliance@missav-j.com</a></strong></p>
      <p>We aim to respond to all legitimate requests within 24 to 48 hours.</p>
    </article>
  `
};

function rewriteHumanShellHtml(baseHtml, requestUrl, origin) {
  let reqUrl;
  try {
    reqUrl = new URL(requestUrl);
  } catch {
    return baseHtml;
  }
  const cleanUrl = getCleanPublicUrl(reqUrl);
  const langMatch = cleanUrl.pathname.match(LANG_STRIP_REGEX);
  const shellLang = langMatch ? langMatch[1] : 'en';
  const strippedSub = langMatch ? (cleanUrl.pathname.slice(langMatch[0].length) || '/') : (cleanUrl.pathname || '/');
  const cleanSub = strippedSub === '/' ? '/' : strippedSub.replace(/\/+$/, '');
  const listMatch = cleanSub.match(/^\/(actor|category|tag|studio)$/);
  let canonicalHref;
  if (listMatch) {
    const nameParam = cleanUrl.searchParams.get('name');
    canonicalHref = getCleanListingCanonical(origin, shellLang, listMatch[1], nameParam);
  } else if (cleanSub === '/search') {
    const q = cleanUrl.searchParams.get('q');
    canonicalHref = `${origin}/${shellLang}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  } else {
    canonicalHref = `${origin}/${shellLang}${cleanSub === '/' ? '/' : cleanSub}`;
  }
  const htmlLang = hreflangCode(shellLang);
  const ogLocale = getOgLocale(shellLang);
  const rewritten = baseHtml
    .replace(/<html lang="[^"]*"/i, `<html lang="${htmlLang}"`)
    .replace(/<link rel="canonical" id="canonical-url" href="[^"]*"/i, () => `<link rel="canonical" id="canonical-url" href="${escapeHtml(canonicalHref)}"`)
    .replace(/<meta property="og:url" id="og-url" content="[^"]*"/i, () => `<meta property="og:url" id="og-url" content="${escapeHtml(canonicalHref)}"`)
    .replace(/<meta property="og:locale" id="og-locale" content="[^"]*"/i, () => `<meta property="og:locale" id="og-locale" content="${escapeHtml(ogLocale)}"`);
  return localizeSidebarHtml(rewritten, shellLang);
}

const STALE_BACKUP_TTL_SECONDS = 2592000;

function generate503Response(origin, lang = 'en', edgeMode = 'SSR-503') {
  return new Response(generate503Html(origin, lang), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Retry-After': '120',
      'X-Edge-Mode': edgeMode,
      'X-Cache-Status': 'BYPASS'
    }
  });
}

async function fetchIndexHtmlResilient(env, origin, executionContext) {
  const indexUrl = new URL('/index.html', origin);
  let lastStatus = 500;
  let lastHeaders = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const asset = await env.ASSETS.fetch(indexUrl);
      if (asset && asset.ok) {
        const html = await asset.text();
        lastHeaders = new Headers(asset.headers);
        try {
          const cache = caches?.default;
          if (cache) {
            const shellCacheKey = new Request(`${origin}/__human-spa-shell?version=${SSR_CACHE_VERSION}`, { method: 'GET' });
            const warmHeaders = new Headers(lastHeaders);
            warmHeaders.set('Content-Type', 'text/html; charset=utf-8');
            warmHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=604800');
            warmHeaders.set('CDN-Cache-Control', 'public, max-age=604800');
            const putPromise = cache.put(shellCacheKey, new Response(html, { status: 200, headers: warmHeaders }))
              .catch(err => console.warn('[Human Shell Prewarm Error]', err));
            if (executionContext && typeof executionContext.waitUntil === 'function') {
              executionContext.waitUntil(putPromise);
            }
          }
        } catch {}
        return { ok: true, status: asset.status, html, headers: lastHeaders, fromCache: false };
      }
      lastStatus = asset?.status || 500;
      try { await asset?.body?.cancel?.(); } catch {}
      if (attempt === 0 && lastStatus >= 500) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
    } catch (err) {
      console.warn(`[ASSETS Fetch Attempt ${attempt + 1} Error]`, err?.message || err);
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
    }
    break;
  }

  try {
    const cache = caches?.default;
    if (cache) {
      const shellCacheKey = new Request(`${origin}/__human-spa-shell?version=${SSR_CACHE_VERSION}`, { method: 'GET' });
      const cached = await cache.match(shellCacheKey);
      if (cached && cached.ok) {
        return {
          ok: true,
          status: 200,
          html: await cached.text(),
          headers: new Headers(cached.headers),
          fromCache: true
        };
      }
    }
  } catch (err) {
    console.warn('[Human Shell Fallback Read Error]', err);
  }

  return { ok: false, status: lastStatus || 503, html: '', headers: lastHeaders || new Headers(), fromCache: false };
}

async function serveHumanShell(context, origin, activeLang = 'en') {
  const cacheKey = new Request(`${origin}/__human-spa-shell?version=${SSR_CACHE_VERSION}`, { method: 'GET' });
  const isHead = context.request.method === 'HEAD';
  let cache = null;
  try {
    cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-Edge-Mode', 'HUMAN-SHELL');
      headers.set('X-Cache-Status', 'HIT');
      const baseHtml = isHead ? '' : await cached.text();
      return new Response(isHead ? null : rewriteHumanShellHtml(baseHtml, context.request.url, origin), { status: cached.status, headers });
    }
  } catch (error) {
    console.warn('[Human Shell Cache Read Error]', error);
  }

  const assetResult = await fetchIndexHtmlResilient(context.env, origin, context);
  if (!assetResult.ok) {
    return generate503Response(origin, activeLang, 'HUMAN-SHELL-503');
  }
  const headers = new Headers(assetResult.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=604800');
  headers.set('CDN-Cache-Control', 'public, max-age=604800');
  headers.set('X-Edge-Mode', 'HUMAN-SHELL');
  headers.set('X-Cache-Status', assetResult.fromCache ? 'STALE' : 'MISS');
  return new Response(isHead ? null : rewriteHumanShellHtml(assetResult.html, context.request.url, origin), { status: assetResult.status, headers });
}

// Map internal language keys to valid ISO 639-1 hreflang / html-lang codes.
// Mirrors HREFLANG_CODE_MAP in assets/js/i18n.js and the sitemap emitters:
// URL paths keep /fil/, but the lang attribute must be 'tl' (ISO 639-1 Tagalog).
const HREFLANG_CODE_MAP = { fil: 'tl' };
const hreflangCode = (langKey) => HREFLANG_CODE_MAP[langKey] || langKey;

const OG_LOCALE_MAP = {
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-TW': 'zh_TW',
  'zh-CN': 'zh_CN',
  ms: 'ms_MY',
  th: 'th_TH',
  de: 'de_DE',
  fr: 'fr_FR',
  vi: 'vi_VN',
  id: 'id_ID',
  fil: 'fil_PH',
  pt: 'pt_BR'
};
const getOgLocale = (langKey) => OG_LOCALE_MAP[langKey] || 'en_US';

// FIX: Deduplicate lang arrays — semua bahasa direferensikan dari VALID_LANGS agar
// tidak terjadi desinkronisasi saat bahasa baru ditambahkan.
const LANG_STRIP_REGEX = new RegExp(`^\/(${VALID_LANGS.join('|').replace(/[-]/g, '\\-')})(?=\/|$)`);

// FIX: Hapus tracking query params dari URL sebelum dimasukkan ke tag hreflang.
// Google Search Console menandai hreflang error jika URL alternate mengandung
// parameter seperti ?utm_source=... atau ?fbclid=... karena tidak konsisten dengan canonical.
const TEST_MOCK_ENRICHED_POSTS = {
  '999123': {
    video_id: '999123',
    seo_title: 'SSIS-999 Exclusive Yua Mikami Feature',
    meta_description: 'Stream SSIS-999 starring Yua Mikami in full HD. Read our exclusive overview and FAQs.',
    summary: 'SSIS-999 is a cinematic drama presentation featuring award-winning performances.',
    highlights: [
      'Exclusive S1 4K release',
      'Starring Yua Mikami',
      'Feature Highlights verified release'
    ],
    faq: [
      {
        q: 'Who is the lead actress in SSIS-999?',
        a: 'SSIS-999 stars popular actress Yua Mikami.'
      },
      {
        q: 'Is SSIS-999 available in HD?',
        a: 'Yes, full high definition streaming is supported.'
      }
    ],
    status: 'enriched'
  },
  '999': {
    video_id: '999',
    seo_title: 'SSIS-999 Enriched Title',
    meta_description: 'Enriched meta description for SSIS-999 with rich context.',
    summary: 'SSIS-999 is a premier presentation featuring exclusive highlights and 4K remastering.',
    highlights: [
      'Exclusive high bitrate 1080p release',
      'Lead performance by award-winning actress',
      'Feature Highlights verified release'
    ],
    faq: [
      {
        q: 'Who is the lead actress in SSIS-999?',
        a: 'SSIS-999 stars celebrated Japanese performers.'
      }
    ],
    status: 'enriched'
  }
};

// <GENERATED_SEO_DATA_START>
const SEO_ENRICHED_POSTS_SYNCED = {"619":{"video_id":"619","seo_title":"IPTD-508: Kizaki Jessica in IdeaPocket Subtitled","meta_description":"Watch IPTD-508 featuring Kizaki Jessica, produced by IdeaPocket. Includes English subtitles with young wife and bukkake performance themes.","summary":"IPTD-508 is an IdeaPocket release starring popular performer Kizaki Jessica. The video portrays a young wife narrative accompanied by English subtitles. High definition presentation showcasing classic promiscuity and bukkake themes.","highlights":["Stars adult performer Kizaki Jessica","Produced by IdeaPocket with English subtitles","Features young wife and bukkake content"],"faq":[{"q":"Who stars in this video?","a":"Kizaki Jessica is the main actress in this video."},{"q":"What studio produced this title?","a":"It was produced by the studio IdeaPocket."}],"status":"enriched"},"1841":{"video_id":"1841","seo_title":"H0930-KI221231: Emi Makihara Age 40","meta_description":"Watch H0930-KI221231 featuring Emi Makihara (Age 40). A Japanese adult release delivering an authentic performance in an intimate presentation.","summary":"H0930-KI221231 highlights a performance by Emi Makihara, aged 40. The video captures a focused and mature adult entertainment experience under the Japanese catalog category. It is produced for fans of solo-focused Japanese adult features.","highlights":["Features Emi Makihara (Age 40)","Authentic Japanese adult content","Intimate mature-themed presentation"],"faq":[{"q":"Who stars in H0930-KI221231?","a":"This video features performer Emi Makihara, aged 40."},{"q":"What studio produced H0930-KI221231?","a":"The studio information is not specified for this release."}],"status":"enriched"},"3275":{"video_id":"3275","seo_title":"H4610-KI201222: Miu Suzuki Japanese Video","meta_description":"Explore H4610-KI201222 featuring Miu Suzuki in a classic Japanese video release. Learn more about this title from the Naughty4610 collection today.","summary":"H4610-KI201222 is a Japanese video presentation featuring 25-year-old Miu Suzuki. This title is part of the Naughty4610 release lineup.","highlights":["Features performer Miu Suzuki","Naughty4610 series release","Japanese video production"],"faq":[{"q":"Who stars in this video?","a":"This video features performer Miu Suzuki."},{"q":"What studio produced this title?","a":"The studio for H4610-KI201222 is not officially specified, but it is released under the Naughty4610 catalog."}],"status":"enriched"},"4682":{"video_id":"4682","seo_title":"JUFE-440: Sayama Love - Fitch | Uncensored Leak","meta_description":"Watch JUFE-440 featuring Sayama Love in this Fitch production. An uncensored leak release showcasing a female teacher theme in high definition.","summary":"JUFE-440 is an adult video production by Fitch starring performer Sayama Love. The video centers around a school trip and female teacher narrative theme, delivered in high-definition quality. This uncensored leak title highlights themes of big breasts and dirty talk.","highlights":["Stars performer Sayama Love","Produced by studio Fitch","Features female teacher narrative themes","Includes uncensored leak footage in HD quality"],"faq":[{"q":"Who stars in this video?","a":"Sayama Love stars in this video."},{"q":"What studio produced this title?","a":"This title was produced by Fitch."}],"status":"enriched"},"7824":{"video_id":"7824","seo_title":"CUS-1092 Uncensored Japanese Adult Video","meta_description":"Watch the uncensored Japanese adult release CUS-1092 featuring classic mature themes. Explore professional production details and category information.","summary":"This uncensored Japanese adult video explores mature themes within the CUS-1092 release. The production delivers standard genre expectations with clear focus on established tropes.","highlights":["Uncensored Japanese adult video format","Features classic mature themes","Part of the CUS production series"],"faq":[{"q":"Who stars in this video?","a":"Specific performer information is not listed in the metadata for this title."},{"q":"What studio produced this title?","a":"The studio is not specified in the official release metadata."}],"status":"enriched"},"8816":{"video_id":"8816","seo_title":"WTB022 - Madou Uncensored Release","meta_description":"Explore WTB022, a Japanese uncensored Madou production detailing a dramatic narrative centered around familial debt and sacrifice.","summary":"WTB022 is an uncensored Japanese adult release under the Madou label. The storyline focuses on a dramatic theme involving a sister taking on her brother's debt. This title presents an unrated narrative drama without a specified studio or performer.","highlights":["Uncensored Japanese release","Produced under the Madou category","Dramatic debt-repayment storyline"],"faq":[{"q":"Who stars in this video?","a":"The official metadata does not list specific performers for this title."},{"q":"What studio produced this title?","a":"The producing studio is unlisted in the provided metadata."}],"status":"enriched"},"12612":{"video_id":"12612","seo_title":"XXX-AV-23434: Shihori Endo Sales Chief Part 1","meta_description":"XXX-AV-23434 features Shihori Endo in Part 1 of an office sales department video series. Discover this classic Japanese release from the XXX-AV collection.","summary":"XXX-AV-23434 is Part 1 of a Japanese video series centered around Shihori Endo as a sales department chief. It belongs to the XXX-AV lineup depicting an office workplace scenario.","highlights":["Features Shihori Endo","Part 1 of the title series","Office sales department concept","Japanese release from XXX-AV"],"faq":[{"q":"Who stars in this video?","a":"This title features performer Shihori Endo."},{"q":"What studio produced this title?","a":"The production studio is associated with the XXX-AV label."}],"status":"enriched"},"13456":{"video_id":"13456","seo_title":"NPJS-110 Nationwide Married Woman Saori Nanpa JAPAN","meta_description":"Discover NPJS-110 by Nanpa JAPAN starring Saori (28). An exclusive HD Japanese adult release featuring ordinary person and intense adult themes.","summary":"Starring 28-year-old Saori, NPJS-110 is an exclusive HD release from studio Nanpa JAPAN. The video focuses on ordinary person and married woman themes with extreme climax sequences.","highlights":["Produced by studio Nanpa JAPAN","Features performer Saori (28)","Exclusive HD Japanese adult release","Includes ordinary person and wife themes"],"faq":[{"q":"Who stars in this video?","a":"This video stars Saori (28)."},{"q":"What studio produced this title?","a":"This title was produced by Nanpa JAPAN."}],"status":"enriched"},"14887":{"video_id":"14887","seo_title":"SDJS-155 Ayaka Yoshii — MISSAV-J","meta_description":"Watch SDJS-155 starring Ayaka Yoshii produced by SOD. Stream in full HD quality with fast loading on MISSAV-J.","summary":"SDJS-155 is a premium 123av presentation from SOD featuring Ayaka Yoshii. This title showcases exceptional cinematography and high-definition production values.","highlights":["Produced by renowned studio SOD","Lead performance by Ayaka Yoshii","Full length feature presented in 1080p HD quality","Verified authentic release code SDJS-155"],"faq":[{"q":"Who stars in SDJS-155?","a":"This title stars celebrated actress Ayaka Yoshii."},{"q":"What studio produced SDJS-155?","a":"This release was produced by SOD."}],"status":"enriched"},"16262":{"video_id":"16262","seo_title":"SUJI-263: Water Leaf - Exclusive HD Release","meta_description":"Water Leaf stars in SUJI-263, an exclusive HD Japanese adult video produced by Kanransha featuring small breasts and dramatic themes.","summary":"SUJI-263 is an exclusive HD Japanese adult production starring Water Leaf and released by studio 姦乱者. The video explores dramatic delusion themes featuring a small-breasted actress in individual performances.","highlights":["Stars performer Water Leaf","Produced by 姦乱者","Exclusive HD release featuring pretty girl themes","Includes shaving and creampie scenes"],"faq":[{"q":"Who stars in this video?","a":"Water Leaf stars in SUJI-263."},{"q":"What studio produced this title?","a":"This title was produced by 姦乱者."}],"status":"enriched"},"19807":{"video_id":"19807","seo_title":"GRMR-163: Human Observation - Muracchi HD","meta_description":"Explore GRMR-163, a Japanese adult video from Muracchi featuring an office observation story. Presented in crisp high definition with sneak shot themes.","summary":"GRMR-163 is a Japanese production released by studio Muracchi under a human observation narrative. The video follows a conference room scenario featuring slim performers and sneak shot aesthetics. It is presented in high definition focusing on ordinary person themes.","highlights":["Produced by studio Muracchi (ムラっch)","Features a conference room office scenario","Includes sneak shot observation themes","Available in high definition quality"],"faq":[{"q":"Who stars in this video?","a":"The performing cast is not specified in the official metadata."},{"q":"What studio produced this title?","a":"This title was produced by Muracchi (ムラっch)."}],"status":"enriched"},"20618":{"video_id":"20618","seo_title":"XVT-030: Azusa Misaki - Max-A Exclusive Release","meta_description":"Discover XVT-030 starring Azusa Misaki, an exclusive HD release from Max-A featuring pantyhose styling, oral sex, sperm swallowing, and creampies.","summary":"XVT-030 is an exclusive high-definition release from the studio Max-A starring popular actress Azusa Misaki. The feature highlights intense performances including pantyhose attire, oral sex, sperm swallowing, and creampie finishes. It offers a dedicated individual showcase of Azusa Misaki in top-tier production quality.","highlights":["Starring actress Azusa Misaki","Produced by Max-A studio","Features pantyhose, oral sex, and sperm swallowing","High-definition individual performance"],"faq":[{"q":"Who stars in XVT-030?","a":"XVT-030 stars adult actress Azusa Misaki in an individual performance."},{"q":"What studio produced XVT-030?","a":"XVT-030 was produced by the studio Max-A."}],"status":"enriched"},"22817":{"video_id":"22817","seo_title":"CEMD-681: Yukine Nagasaki - Celeb no Tomo","meta_description":"Watch CEMD-681 starring Yukine Nagasaki from studio Celeb no Tomo. An exclusive Japanese release featuring intense orgasm and squirting themes.","summary":"CEMD-681 is an exclusive Japanese video release from studio Celeb no Tomo. The film features performer Yukine Nagasaki in a solo focused production highlighting extreme orgasm themes and intense scenes. It showcases prominent performances tailored for fans of the featured actress.","highlights":["Features performer Yukine Nagasaki","Produced by studio Celeb no Tomo (セレブの友)","Exclusive Japanese video release","Focuses on intense climax and squirting themes"],"faq":[{"q":"Who stars in this video?","a":"Yukine Nagasaki stars in CEMD-681."},{"q":"What studio produced this title?","a":"This title was produced by Celeb no Tomo (セレブの友)."}],"status":"enriched"},"25163":{"video_id":"25163","seo_title":"FC2-PPV-2977705 Amateur Pick-up 3P Uncensored","meta_description":"Watch FC2-PPV-2977705 amateur nampa pick-up featuring an amateur college student group session. Authentic Japanese adult video content with 3P dynamics.","summary":"This FC2-PPV amateur production features a college student pick-up scenario. The video captures realistic amateur 3P encounters stemming from a campus circle setting.","highlights":["Amateur nampa pick-up documentation","College student circle background","Realistic unscripted atmosphere","Uncensored Japanese adult video format"],"faq":[{"q":"Who stars in this video?","a":"The video features amateur college students."},{"q":"What studio produced this title?","a":"This is an independent FC2-PPV release."}],"status":"enriched"},"26479":{"video_id":"26479","seo_title":"FC2-PPV-3114016: Plump Mature Wife Bondage Edition","meta_description":"FC2-PPV-3114016 features individual shooting focused on mature wife bondage themes. An uncensored Japanese release available in high quality.","summary":"FC2-PPV-3114016 is an uncensored Japanese independent production. The video covers themes of mature wife bondage and individual shooting presentations. Performer and studio details are not explicitly listed in the metadata.","highlights":["Uncensored Japanese release","Individual shooting format","Mature wife and bondage themes","FC2 PPV series release"],"faq":[{"q":"Who stars in this video?","a":"The specific performers are not identified in the provided metadata."},{"q":"What studio produced this title?","a":"This is an independent release distributed via FC2 PPV."}],"status":"enriched"},"27351":{"video_id":"27351","seo_title":"FC2-PPV-3162974 Uncensored Cinema Style","meta_description":"Explore FC2-PPV-3162974, an uncensored Japanese cinema-style release featuring a medical office worker scenario in a unique first-shoot presentation.","summary":"FC2-PPV-3162974 is an uncensored Japanese amateur release presented in a cinematic style. The video follows a medical office worker scenario during a special birthday setting. As an independent FC2 PPV release, specific performers and studio credits are unlisted.","highlights":["Uncensored Japanese FC2 PPV release","Cinematic style first-shoot presentation","Medical office worker themed setup"],"faq":[{"q":"Who stars in this video?","a":"The performers in this independent FC2 PPV release are uncredited."},{"q":"What studio produced this title?","a":"This video is an independent release under the FC2 PPV category with no formal studio listed."}],"status":"enriched"},"29359":{"video_id":"29359","seo_title":"HEYZO-3745: Anri Tachibana - Heyzo Uncensored","meta_description":"Anri Tachibana stars in HEYZO-3745, an uncensored release from Heyzo featuring big breasts and erotic solo and paired performances.","summary":"HEYZO-3745 features performer Anri Tachibana in an uncensored release produced by Heyzo. Part of the Beautiful Women Collection Vol.100 series, this title highlights her erotic body through various acts including dirty talk, tit jobs, and creampie scenes.","highlights":["Features performer Anri Tachibana","Uncensored studio release from Heyzo","Includes big breast performance and tit jobs","Part of Beautiful Women Collection Vol.100"],"faq":[{"q":"Who stars in this video?","a":"Anri Tachibana stars in HEYZO-3745."},{"q":"What studio produced this title?","a":"This title was produced by Heyzo."}],"status":"enriched"},"33314":{"video_id":"33314","seo_title":"MIAA-808: Sumire Kuramoto in Moody's Production","meta_description":"Discover MIAA-808 featuring Sumire Kuramoto, Haneda, Oyo Nakano, and Takashi Yoshimura. Produced by Moody's as an uncensored leak release.","summary":"MIAA-808 is a Moody's production featuring Sumire Kuramoto alongside Haneda, Oyo Nakano, and Takashi Yoshimura. The video highlights themes of intense passion and bodily fluids. Available in High Definition standard quality.","highlights":["Features Sumire Kuramoto and supporting cast","Produced by studio Moody's","Includes themes of kissing and creampie"],"faq":[{"q":"Who stars in this video?","a":"The title stars Sumire Kuramoto, Haneda, Oyo Nakano, and Takashi Yoshimura."},{"q":"What studio produced this title?","a":"This video was produced by Moody's."}],"status":"enriched"},"35543":{"video_id":"35543","seo_title":"SSIS-851 Ria Yuzuki S1 Exclusive Uncensored","meta_description":"Discover SSIS-851 starring Ria Yuzuki from S1. Experience 199 intense orgasms and 5500 convulsions in this exclusive 4K Japanese adult video special.","summary":"Starring Ria Yuzuki and produced by studio S1, this exclusive release focuses on an intense awakening featuring 199 orgasms and extensive convulsive sequences. The special production highlights individual performance across an extended runtime.","highlights":["Starring exclusive actress Ria Yuzuki","Produced by major studio S1","Features 199 intense orgasms and 5500 convulsions","High-definition 4K uncensored leak special"],"faq":[{"q":"Who stars in this video?","a":"The video stars Ria Yuzuki."},{"q":"What studio produced this title?","a":"This title was produced by the studio S1."}],"status":"enriched"},"39352":{"video_id":"39352","seo_title":"IPZZ-259: Light Blue Noah & March - IdeaPocket","meta_description":"IPZZ-259 from studio IdeaPocket features Light Blue Noah and March. An exclusive uncensored leak release delivered in high-definition video quality.","summary":"IPZZ-259 is an exclusive Japanese production by prominent studio IdeaPocket. The film stars performers Light Blue Noah and March in an engaging high-definition video showcase. Available as an uncensored leak version, it highlights sister dynamics and detailed performances.","highlights":["Stars performers Light Blue Noah and March","Produced by studio IdeaPocket","Uncensored leak edition in HD quality","Features sister-themed narrative elements"],"faq":[{"q":"Who stars in this video?","a":"Light Blue Noah and March star in IPZZ-259."},{"q":"What studio produced this title?","a":"This title was produced by studio IdeaPocket."}],"status":"enriched"},"40301":{"video_id":"40301","seo_title":"ROE-224: Reiko Seo - Madonna Uncensored Leak","meta_description":"Reiko Seo stars in ROE-224 from studio Madonna. A dramatic mature woman uncensored leak release exploring themes of marital confession and cuckolding.","summary":"ROE-224 is a dramatic mature woman production by studio Madonna starring actress Reiko Seo. The title presents an intense interrogation storyline where a husband confronts his wife regarding cuckolding. This HD release comes as an uncensored leak edition featuring compelling adult drama.","highlights":["Stars mature actress Reiko Seo","Produced by premium studio Madonna","Uncensored leak edition in HD quality","Explores cuckolding interrogation drama"],"faq":[{"q":"Who stars in this video?","a":"Reiko Seo stars in ROE-224."},{"q":"What studio produced this title?","a":"This title was produced by studio Madonna."}],"status":"enriched"},"40638":{"video_id":"40638","seo_title":"MISM-324-UNCENSORED-LEAK Pierre Sword — MISSAV-J","meta_description":"Watch MISM-324-UNCENSORED-LEAK starring Pierre Sword produced by えむっ娘ラボ. Stream in full HD quality with fast loading on MISSAV-J.","summary":"MISM-324-UNCENSORED-LEAK is a premium 123av presentation from えむっ娘ラボ featuring Pierre Sword. This title showcases exceptional cinematography and high-definition production values.","highlights":["Produced by renowned studio えむっ娘ラボ","Lead performance by Pierre Sword","Full length feature presented in 1080p HD quality","Verified authentic release code MISM-324-UNCENSORED-LEAK"],"faq":[{"q":"Who stars in MISM-324-UNCENSORED-LEAK?","a":"This title stars celebrated actress Pierre Sword."},{"q":"What studio produced MISM-324-UNCENSORED-LEAK?","a":"This release was produced by えむっ娘ラボ."}],"status":"enriched"},"43079":{"video_id":"43079","seo_title":"JUQ-852: Rinka Ono - Madonna Uncensored Leak","meta_description":"Rinka Ono stars in JUQ-852, an uncensored leak from studio Madonna featuring mature woman and NTR camping themes in high definition.","summary":"JUQ-852 is an uncensored leak release from Madonna starring Rinka Ono alongside Ippei Nakata, Masahiro Ueda, and Tooru Ozawa. The production features mature woman and NTR themes centered around a neighborhood camping story.","highlights":["Stars Rinka Ono with supporting cast","Produced by studio Madonna","Features mature woman and NTR camping theme","Includes uncensored leak footage in HD"],"faq":[{"q":"Who stars in this video?","a":"Rinka Ono stars alongside Ippei Nakata, Masahiro Ueda, and Tooru Ozawa."},{"q":"What studio produced this title?","a":"This video was produced by Madonna."}],"status":"enriched"},"43861":{"video_id":"43861","seo_title":"PP004 — MISSAV-J","meta_description":"Watch PP004 starring top performers produced by Premier Studio. Stream in full HD quality with fast loading on MISSAV-J.","summary":"PP004 is a premium 123av presentation from Premier Studio. This title showcases exceptional cinematography and high-definition production values.","highlights":["Produced by renowned studio Premier Studio","Star-studded ensemble cast","Full length feature presented in 1080p HD quality","Verified authentic release code PP004"],"faq":[{"q":"Who stars in PP004?","a":"This production features popular top performers."},{"q":"What studio produced PP004?","a":"This release was produced by Premier Studio."}],"status":"enriched"},"51421":{"video_id":"51421","seo_title":"072520_001: Naked Apron Delivery Health Housekeeper","meta_description":"Watch 072520_001, a Japanese video release featuring a delivery health housekeeper theme. Available in high-quality Japanese content format.","summary":"072520_001 is a Japanese release centered around a delivery health housekeeper concept. The title presents a classic roleplay theme in high quality. The specific performers and studio are unlisted in the official metadata.","highlights":["Delivery health housekeeper theme","Japanese video production","1pondo category release"],"faq":[{"q":"Who stars in this video?","a":"The performing cast is not specified in the official metadata."},{"q":"What studio produced this title?","a":"The production studio is not specified in the official metadata."}],"status":"enriched"},"53049":{"video_id":"53049","seo_title":"FC2-PPV-3600282: Married Woman Bed Play Uncensored","meta_description":"Watch FC2-PPV-3600282 featuring an uncensored Japanese amateur feature exploring intimate encounters and bed play with a married woman.","summary":"FC2-PPV-3600282 is an uncensored Japanese adult release showcasing a married woman's intimate story. The production delivers authentic amateur encounters focusing on personal bed play. It offers a raw, unscripted perspective typical of top FC2 PPV content.","highlights":["Uncensored Japanese release","Married woman theme","Authentic FC2 amateur style","Intimate bed play scenes"],"faq":[{"q":"Who stars in FC2-PPV-3600282?","a":"The release features an amateur performer without a listed actress name."},{"q":"What studio produced FC2-PPV-3600282?","a":"This title is an independent FC2 PPV release without a major studio listed."}],"status":"enriched"},"55178":{"video_id":"55178","seo_title":"FC2-PPV-4322453: Uncensored Japanese FC2 Release","meta_description":"Discover FC2-PPV-4322453, an uncensored Japanese FC2 video featuring a G-cup beauty. Explore details on this exclusive amateur production.","summary":"FC2-PPV-4322453 is an uncensored Japanese amateur release from the FC2 platform. The video features a G-cup beauty in an outdoor scenario. As an independent FC2 production, no specific studio or actress names are credited in the official release.","highlights":["Uncensored Japanese release","Features an amateur G-cup performer","FC2 platform independent production"],"faq":[{"q":"Who stars in this video?","a":"The performer's name is not specified in the official metadata."},{"q":"What studio produced this title?","a":"This title was released independently on the FC2 platform."}],"status":"enriched"},"55795":{"video_id":"55795","seo_title":"FC2-PPV-1415480 — MISSAV-J","meta_description":"Watch FC2-PPV-1415480 starring top performers produced by Premier Studio. Stream in full HD quality with fast loading on MISSAV-J.","summary":"FC2-PPV-1415480 is a premium 123av presentation from Premier Studio. This title showcases exceptional cinematography and high-definition production values.","highlights":["Produced by renowned studio Premier Studio","Star-studded ensemble cast","Full length feature presented in 1080p HD quality","Verified authentic release code FC2-PPV-1415480"],"faq":[{"q":"Who stars in FC2-PPV-1415480?","a":"This production features popular top performers."},{"q":"What studio produced FC2-PPV-1415480?","a":"This release was produced by Premier Studio."}],"status":"enriched"},"56098":{"video_id":"56098","seo_title":"FC2-PPV-2632543: Japanese Train Uniform Video","meta_description":"FC2-PPV-2632543 features an uncensored Japanese release centered on a chance encounter on a train. Discover more details about this standalone FC2 release.","summary":"FC2-PPV-2632543 is an uncensored Japanese video production released under the FC2 platform. The title focuses on a train encounter theme featuring an uncredited performer in a school-style uniform.","highlights":["FC2 PPV uncensored release","Train encounter concept","Uniform themed presentation"],"faq":[{"q":"Who stars in this video?","a":"The performer in FC2-PPV-2632543 is uncredited."},{"q":"What studio produced this title?","a":"This video is an independent FC2 user release with no official studio listed."}],"status":"enriched"},"57275":{"video_id":"57275","seo_title":"FC2-PPV-4507485: Uncensored Debut Release","meta_description":"View FC2-PPV-4507485, an uncensored independent debut release. This Japanese video features a first-time experience narrative.","summary":"FC2-PPV-4507485 is an independent release distributed via FC2 PPV featuring an uncredited debut performer. The content depicts a personal first-time experience narrative. Available as an uncensored Japanese video upload.","highlights":["Independent FC2 PPV user-generated video","Features debut performance narrative","Presented in an uncensored format"],"faq":[{"q":"Who stars in this video?","a":"The actress is uncredited in the provided metadata."},{"q":"What studio produced this title?","a":"This video is an independent FC2 PPV release without an official studio."}],"status":"enriched"},"57715":{"video_id":"57715","seo_title":"FC2-PPV-4529075: Uncensored Japanese Amateur Release","meta_description":"FC2-PPV-4529075 features uncensored Japanese adult content from the FC2 platform. Learn more about this independent amateur release and details.","summary":"FC2-PPV-4529075 is an uncensored Japanese adult title distributed via the FC2 platform. As an independent amateur production, specific performer names are unlisted. The release presents raw content characteristic of user-submitted FC2 releases.","highlights":["Uncensored Japanese release","Distributed on the FC2 platform","Amateur performance content"],"faq":[{"q":"Who stars in this video?","a":"The cast is not officially listed for this amateur release."},{"q":"What studio produced this title?","a":"This video was independently produced and released via FC2."}],"status":"enriched"},"59502":{"video_id":"59502","seo_title":"NTR-004: Ayumi Shinoda (English Subtitles)","meta_description":"Ayumi Shinoda stars in NTR-004 by studio HIBINO. Includes English subtitles focusing on an intense adultery narrative involving a boss and a beloved wife.","summary":"NTR-004 is an English-subtitled Japanese adult film produced by studio HIBINO. The drama stars Ayumi Shinoda alongside Forest Man in a narrative centered on marital infidelity and boss-wife relationship dynamics. It provides HD quality streaming with full English subtitle support.","highlights":["Stars Ayumi Shinoda and Forest Man","Produced by Japanese studio HIBINO","Includes full English subtitles","HD quality video featuring an infidelity theme"],"faq":[{"q":"Who stars in this video?","a":"Ayumi Shinoda and Forest Man star in NTR-004."},{"q":"What studio produced this title?","a":"This title was produced by studio HIBINO."}],"status":"enriched"},"60367":{"video_id":"60367","seo_title":"CJOD-019: Nozomi Tanihara & Yuna Takase Subtitled","meta_description":"CJOD-019 features Nozomi Tanihara and Yuna Takase with English subtitles. Produced by Chijo Heaven, this HD title includes mature themes.","summary":"CJOD-019 is an HD release from studio Chijo Heaven featuring English subtitles. The video stars Nozomi Tanihara, Yuna Takase, Samejima, and Tsukasa Hirata. It highlights mature themes, dirty talk, and multi-partner scenes.","highlights":["Includes English subtitles","Stars Nozomi Tanihara and Yuna Takase","Produced by Chijo Heaven (痴女ヘブン)","High definition production"],"faq":[{"q":"Who stars in this video?","a":"This title stars Nozomi Tanihara, Yuna Takase, Samejima, and Tsukasa Hirata."},{"q":"What studio produced this title?","a":"It was produced by Chijo Heaven (痴女ヘブン)."}],"status":"enriched"},"63689":{"video_id":"63689","seo_title":"STARS-060: Iori Furukawa SOD Release with Subtitles","meta_description":"Explore STARS-060 starring Iori Furukawa and Yo Ashida, produced by SOD. Features English subtitles in an HD documentary-style narrative format.","summary":"STARS-060 is a Japanese adult video released by SOD (Soft On Demand). It stars popular performer Iori Furukawa alongside Yo Ashida in a documentary-style setup. This version includes English subtitles for international audiences.","highlights":["Stars Iori Furukawa and Yo Ashida","Produced by SOD (Soft On Demand)","Includes English subtitles","Documentary-style format"],"faq":[{"q":"Who stars in this video?","a":"This video stars Iori Furukawa and Yo Ashida."},{"q":"What studio produced this title?","a":"This video was produced by SOD."}],"status":"enriched"},"66233":{"video_id":"66233","seo_title":"IPX-552-ENGLISH-SUBTITLE Amami Tsubasa — MISSAV-J","meta_description":"Watch IPX-552-ENGLISH-SUBTITLE starring Amami Tsubasa produced by IdeaPocket. Stream in full HD quality with fast loading on MISSAV-J.","summary":"IPX-552-ENGLISH-SUBTITLE is a premium 123av presentation from IdeaPocket featuring Amami Tsubasa. This title showcases exceptional cinematography and high-definition production values.","highlights":["Produced by renowned studio IdeaPocket","Lead performance by Amami Tsubasa","Full length feature presented in 1080p HD quality","Verified authentic release code IPX-552-ENGLISH-SUBTITLE"],"faq":[{"q":"Who stars in IPX-552-ENGLISH-SUBTITLE?","a":"This title stars celebrated actress Amami Tsubasa."},{"q":"What studio produced IPX-552-ENGLISH-SUBTITLE?","a":"This release was produced by IdeaPocket."}],"status":"enriched"},"70281":{"video_id":"70281","seo_title":"VAIAV-003: Marisa - BOTAN 4K Uncensored","meta_description":"Discover VAIAV-003 starring Marisa from studio BOTAN. A high-definition 4K uncensored leak featuring massage oil and married woman themes.","summary":"VAIAV-003 is a 4K high-definition adult video produced by BOTAN, starring performer Marisa. The release incorporates themes of massage oil, married women, and outdoor exposure. This title is made available as an uncensored leak showcasing specialized visual production.","highlights":["Stars performer Marisa","Produced by studio BOTAN","4K high-definition uncensored leak","Features oil massage and married woman themes"],"faq":[{"q":"Who stars in this video?","a":"The video stars performer Marisa."},{"q":"What studio produced this title?","a":"This title was produced by BOTAN."}],"status":"enriched"},"74680":{"video_id":"74680","seo_title":"ROE-321: Yuka Mizuno - Madonna | Uncensored Leak","meta_description":"Watch ROE-321 starring Yuka Mizuno in a classic Madonna studio release. Features mature woman, pantyhose, and adultery themes in HD quality.","summary":"ROE-321 is an adult release by studio Madonna featuring popular mature performer Yuka Mizuno. The story depicts an affair following a weekend drinking gathering set around a karaoke bar setting. This uncensored leak title focuses on pantyhose and mature female boss themes in HD.","highlights":["Stars performer Yuka Mizuno","Produced by studio Madonna","Explores mature woman and office boss affair themes","Uncensored leak presentation in high definition"],"faq":[{"q":"Who stars in this video?","a":"Yuka Mizuno stars in this video."},{"q":"What studio produced this title?","a":"This title was produced by Madonna."}],"status":"enriched"},"75001":{"video_id":"75001","seo_title":"START-267: Manami Yano - SOD | Uncensored Leak","meta_description":"Discover START-267 featuring Manami Yano from SOD. This uncensored leak title delivers a plot-driven narrative in high-definition 4K resolution.","summary":"START-267 is a high-definition release produced by SOD starring performer Manami Yano. The production presents a plot-driven story about a single mother returning home, highlighting performance aspects such as big breasts and tit jobs. The release is available as an uncensored leak shot in 4K resolution.","highlights":["Stars performer Manami Yano","Produced by studio SOD","Narrative-driven story format","Presented in 4K resolution and HD quality"],"faq":[{"q":"Who stars in this video?","a":"Manami Yano stars in this video."},{"q":"What studio produced this title?","a":"This title was produced by SOD."}],"status":"enriched"},"77429":{"video_id":"77429","seo_title":"FC2-PPV-4654481: Comprehensive Review Award","meta_description":"Explore FC2-PPV-4654481, an award-recognized uncensored release from the FC2 platform featuring authentic Japanese independent content.","summary":"FC2-PPV-4654481 is an uncensored adult video entry on the FC2 platform recognized with a Comprehensive Review Award. As an independent Japanese release, it delivers authentic amateur content. The title represents popular community-rated material in the FC2 category.","highlights":["Recognized with a Comprehensive Review Award","Distributed via the FC2-PPV platform","Features uncensored Japanese footage","Authentic independent production"],"faq":[{"q":"Who stars in this video?","a":"The performing cast is not specified in the official metadata."},{"q":"What studio produced this title?","a":"This title was independently produced and released via FC2."}],"status":"enriched"},"78441":{"video_id":"78441","seo_title":"FC2-PPV-4712188 - Amateur Debut Juri","meta_description":"FC2-PPV-4712188 features amateur debut performer Juri in an uncensored Japanese production highlighting slender model-like aesthetics.","summary":"FC2-PPV-4712188 is an uncensored Japanese FC2 release featuring 18-year-old amateur debut performer Juri. The video highlights her slender, model-like figure in a first-time shooting scenario. The production operates independently within the FC2 PPV category without an established studio.","highlights":["Features amateur debut performer Juri","Uncensored FC2 PPV release","Independent amateur production style"],"faq":[{"q":"Who stars in this video?","a":"The title features amateur performer Juri in her debut recording."},{"q":"What studio produced this title?","a":"This is an independent release distributed under the FC2-PPV platform."}],"status":"enriched"},"80072":{"video_id":"80072","seo_title":"FC2-PPV-4782304: Flight Attendant First Shoot Uncensored","meta_description":"Explore FC2-PPV-4782304 featuring a fair-skinned, slender flight attendant in her first uncensored shoot after drinking during vacation.","summary":"FC2-PPV-4782304 presents the debut uncensored appearance of a fair-skinned, slender flight attendant. The story follows a vacation encounter after missing the last train, leading to an intimate private home session. Produced under the FC2 brand, it provides a realistic ordinary-person video style.","highlights":["Features a fair-skinned flight attendant","Debut first shoot release","Ordinary person / realistic encounter scenario","Uncensored FC2 publication"],"faq":[{"q":"Who stars in FC2-PPV-4782304?","a":"The title stars an uncredited amateur performer introduced as a flight attendant."},{"q":"What studio produced FC2-PPV-4782304?","a":"This video was released under the FC2 platform."}],"status":"enriched"},"83854":{"video_id":"83854","seo_title":"NGOD-272: Yui Hatano Uncensored Leak","meta_description":"NGOD-272 features popular actress Yui Hatano in an uncensored leak release from JET映像. Explore this high-definition Japanese drama focusing on affairs.","summary":"NGOD-272 is a Japanese video release produced by JET映像 starring veteran performer Yui Hatano. The storyline explores themes of romance and infidelity presented in high-definition format.","highlights":["Stars actress Yui Hatano","Produced by studio JET映像","Uncensored leak edition","Infidelity and drama narrative"],"faq":[{"q":"Who stars in this video?","a":"NGOD-272 stars popular actress Yui Hatano."},{"q":"What studio produced this title?","a":"This video was produced by the studio JET映像 (JET Eizo)."}],"status":"enriched"},"84375":{"video_id":"84375","seo_title":"DANDY-987: Uncensored Leak 4K Title by DANDY","meta_description":"Check out DANDY-987, a 4K uncensored leak release from DANDY studio. Featuring aunt themes, oral sex, and big breasts in HD resolution.","summary":"DANDY-987 is a Japanese adult video produced by studio DANDY. Available in 4K resolution as an uncensored leak, it explores aunt-themed roleplay scenarios. No specific cast names are provided in the official metadata.","highlights":["Produced by studio DANDY","4K HD high-definition presentation","Features aunt roleplay and big breasts themes","Uncensored leak release"],"faq":[{"q":"Who stars in this video?","a":"The performing cast is not specified in the metadata."},{"q":"What studio produced this title?","a":"This title was produced by DANDY."}],"status":"enriched"},"87094":{"video_id":"87094","seo_title":"NIMA-074: Yuria Yoshine in Fitch Drama Release","meta_description":"Watch NIMA-074 starring Yuria Yoshine. Produced by Fitch, this uncensored leak release features a dramatic narrative with an office worker theme.","summary":"NIMA-074 is an HD narrative adult drama produced by the studio Fitch. It features lead actress Yuria Yoshine alongside Haruto Terahashi, Jun Odagiri, Seigo Hashimoto, and Tech. The plot adapts a story centered around an office worker in her 30s.","highlights":["Stars Yuria Yoshine and ensemble cast","Produced by the studio Fitch","Features big breasts and NTR themes","HD uncensored leak edition"],"faq":[{"q":"Who stars in this video?","a":"The video stars Yuria Yoshine, alongside Haruto Terahashi, Jun Odagiri, Seigo Hashimoto, and Tech."},{"q":"What studio produced this title?","a":"This title was produced by the studio Fitch."}],"status":"enriched"},"87142":{"video_id":"87142","seo_title":"EBWH-292: Yui Haruna in E-BODY Dating Release","meta_description":"Watch EBWH-292 featuring Yui Haruna and Frankfurt Forest. Produced by E-BODY, this release features big breasts, dating, and tit job themes.","summary":"EBWH-292 is an E-BODY production starring Yui Haruna and Frankfurt Forest. The video focuses on romantic dating themes and includes oral sex and tit job performances. Available as an uncensored leak in high definition.","highlights":["Features performers Yui Haruna and Frankfurt Forest","Produced by E-BODY in High Definition","Themes include dating, oral sex, and tit job"],"faq":[{"q":"Who stars in this video?","a":"This video stars Yui Haruna and Frankfurt Forest."},{"q":"What studio produced this title?","a":"This title was produced by the studio E-BODY."}],"status":"enriched"},"87723":{"video_id":"87723","seo_title":"JUL-956: Maihara Sei & Tony Oki - Madonna","meta_description":"Stream JUL-956 starring Maihara Sei and Tony Oki from studio Madonna. Includes English subtitles, mature office lady themes, and HD quality.","summary":"JUL-956 is an exclusive adult drama produced by studio Madonna, featuring performers Maihara Sei and Tony Oki. The narrative focuses on an office lady married woman theme with English subtitles included for global audiences. It delivers high-definition content focusing on mature aesthetic tropes.","highlights":["Stars Maihara Sei and Tony Oki","Produced by renowned studio Madonna","Includes English subtitles","Features office lady and married woman themes"],"faq":[{"q":"Who stars in this video?","a":"This title stars Maihara Sei alongside Tony Oki."},{"q":"What studio produced this title?","a":"This video was produced by Madonna."}],"status":"enriched"},"88316":{"video_id":"88316","seo_title":"IPX-932: Anna Kami - IdeaPocket (English Sub)","meta_description":"Anna Kami stars in IPX-932, an experimental documentary style release from IdeaPocket with English subtitles and multi-actor scenes.","summary":"IPX-932 is a 24-hour surveillance documentary style release by IdeaPocket starring Anna Kami. Supported by Daisuke Sadamatsu, Isedon Uchimura, Koume, and Yuuto Kuroda, this English-subtitled video features restraint and group performances.","highlights":["Stars Anna Kami with ensemble cast","Produced by IdeaPocket with English subtitles","Experimental 24-hour surveillance documentary style","Features restraint, slim performers, and orgy scenes"],"faq":[{"q":"Who stars in this video?","a":"Anna Kami stars alongside Daisuke Sadamatsu, Isedon Uchimura, Koume, and Yuuto Kuroda."},{"q":"What studio produced this title?","a":"This title was produced by IdeaPocket."}],"status":"enriched"},"90908":{"video_id":"90908","seo_title":"ADN-533: Shiramine Miu in Attackers English Sub","meta_description":"Explore ADN-533 starring Shiramine Miu, produced by Attackers. This English-subtitled drama focuses on neighbor adultery and NTR themes.","summary":"ADN-533 is an Attackers studio release starring Shiramine Miu. The title centers around drama involving a neighbor and adultery, featuring full English subtitles. Presented in High Definition as an exclusive individual work.","highlights":["Stars actress Shiramine Miu","Produced by Attackers with English subtitles","Explores themes of adultery, wife, and NTR"],"faq":[{"q":"Who stars in this video?","a":"The video stars actress Shiramine Miu."},{"q":"What studio produced this title?","a":"It was produced by the studio Attackers."}],"status":"enriched"},"92125":{"video_id":"92125","seo_title":"SONE-073: Riri Nanatsumori Swimsuit Special","meta_description":"SONE-073 stars Riri Nanatsumori in an S1 studio production featuring English subtitles and 4K quality. Watch this exclusive swimsuit-themed Japanese video.","summary":"SONE-073 is an exclusive 4K production by S1 starring Riri Nanatsumori alongside Danka, Eriguchi, and Seigo Hashimoto. The release comes equipped with English subtitles and centers around a swimsuit concept.","highlights":["Stars Riri Nanatsumori","Produced by S1 in 4K HD quality","Includes English subtitles","Swimsuit themed presentation"],"faq":[{"q":"Who stars in this video?","a":"This video stars Riri Nanatsumori, alongside Danka, Eriguchi, and Seigo Hashimoto."},{"q":"What studio produced this title?","a":"SONE-073 was produced by the studio S1."}],"status":"enriched"},"92310":{"video_id":"92310","seo_title":"FPRE-071: Satomi Miyamoto & Hajime Himori (English Sub)","meta_description":"Satomi Miyamoto and Hajime Himori star in FPRE-071, an English-subtitled HD release from Fitch featuring role reversal and riding scenes.","summary":"FPRE-071 is an English-subtitled HD release from Fitch starring Satomi Miyamoto and Hajime Himori. The video features a female college student role-reversal theme focused on riding and squirting performances.","highlights":["Stars Satomi Miyamoto and Hajime Himori","Produced by Fitch with English subtitles","Features female college student theme","Includes HD riding and squirting scenes"],"faq":[{"q":"Who stars in this video?","a":"Satomi Miyamoto and Hajime Himori star in FPRE-071."},{"q":"What studio produced this title?","a":"This video was produced by Fitch."}],"status":"enriched"},"94655":{"video_id":"94655","seo_title":"ACHJ-073: Madonna Release Starring Yumi Kazama","meta_description":"ACHJ-073 is an exclusive Madonna studio release starring Yumi Kazama alongside Oyo Nakano, Tact, and Takashi Haneda in high definition.","summary":"ACHJ-073 is a mature-themed release produced by studio Madonna. The video features an ensemble cast including Yumi Kazama, Oyo Nakano, Tact, and Takashi Haneda. The production showcases exclusive HD content focusing on mature women and specialized sensory themes.","highlights":["Features Yumi Kazama and Oyo Nakano","Produced by Madonna studio","HD exclusive release","Focuses on mature woman themes"],"faq":[{"q":"Who stars in this video?","a":"The video stars Yumi Kazama, Oyo Nakano, Tact, and Takashi Haneda."},{"q":"What studio produced this title?","a":"This video was produced by Madonna."}],"status":"enriched"},"97300":{"video_id":"97300","seo_title":"THPA-012: Super Heroine in Danger!! Vol.112 - Amami Mea","meta_description":"Discover THPA-012 starring Amami Mea. Produced by Giga, this sci-fi release features action, fighting, and heroines in danger.","summary":"THPA-012 is a sci-fi action feature produced by studio Giga starring Amami Mea. The title belongs to the Super Heroine in Danger series, combining dramatic acting and fighting sequences. It offers a specialized narrative focusing on sci-fi heroism and suspense.","highlights":["Stars actress Amami Mea","Produced by Giga studio","Sci-fi and action fighting themes","Part of the Super Heroine in Danger series"],"faq":[{"q":"Who stars in this video?","a":"Amami Mea stars in THPA-012."},{"q":"What studio produced this title?","a":"This title was produced by Giga (ギガ)."}],"status":"enriched"},"98737":{"video_id":"98737","seo_title":"SIRO-5600: Inexperienced H-Cup Busty Amateur First Shoot","meta_description":"Discover SIRO-5600 from Amateur TV, featuring an inexperienced H-cup busty amateur in her debut first shoot video. Stream this exclusive release today.","summary":"SIRO-5600 is an amateur release produced by Amateur TV featuring an inexperienced slim model with H-cup breasts. This debut first-shoot title highlights her initial curiosity as she steps in front of the camera for the very first time. The video captures her intimate transformation from a polite young lady into a passionate performer.","highlights":["Debut first shoot featuring an inexperienced amateur model","Highlights a slim physique with impressive H-cup breasts","Produced by Amateur TV (アマチュアテレビ)","Includes intimate selfie-style aesthetic and authentic themes"],"faq":[{"q":"Who stars in this video?","a":"This video features an inexperienced ordinary amateur model making her first shoot appearance."},{"q":"What studio produced this title?","a":"This title was produced by the studio Amateur TV (アマチュアテレビ)."}],"status":"enriched"},"102051":{"video_id":"102051","seo_title":"HUNTC-351: High School Baseball Club Orgy - Hunter","meta_description":"Explore HUNTC-351 from Hunter featuring a high school baseball club storyline, exclusive group scenes, oral sex, and uninhibited creampie themes.","summary":"HUNTC-351 is a high-definition release produced by Hunter centered around a unique high school baseball club theme. The video features group performances with multiple female managers, highlighting oral sex and creampie scenes. This uncensored leak release presents an engaging ensemble narrative.","highlights":["Produced by Hunter studio","High school baseball club theme","Features group scenes and oral sex","High-definition uncensored leak content"],"faq":[{"q":"Who stars in HUNTC-351?","a":"The title features an ensemble cast involved in a baseball club scenario without specified individual performers."},{"q":"What studio produced HUNTC-351?","a":"HUNTC-351 was produced by the studio Hunter."}],"status":"enriched"},"103916":{"video_id":"103916","seo_title":"NACT-090: Miki Yamase - Planet Plus","meta_description":"Watch Miki Yamase in NACT-090 produced by Planet Plus. An uncensored leak featuring a mature woman in high-definition 4K quality.","summary":"NACT-090 is a Japanese mature woman adult video produced by Planet Plus starring Miki Yamase. The narrative centers on a mother in her 40s entering the adult video industry following her son's scandal. Presented as an uncensored leak in high definition 4K quality, it showcases an individual performance.","highlights":["Stars mature performer Miki Yamase","Produced by Planet Plus","Uncensored leak presentation in 4K HD","Features mature woman and wife themes"],"faq":[{"q":"Who stars in this video?","a":"This video stars mature performer Miki Yamase."},{"q":"What studio produced this title?","a":"This title was produced by Planet Plus."}],"status":"enriched"}};
const CURATED_ACTORS_LIST = ["123 Yuri","Abe","Abe Indigo","Abe Mikako","Abe Noboru","Actress X Nh","Adachi Rui","Ai Akatsuki","Ai Haneda","Ai Hongo","Ai Hoshina","Ai Inoriyama","Ai Kano","Ai Takashima","Ai Uehara","Ai Yuzu","Aiba Himari","Aiba Misako","Aibu Mizuki","Aika","Aika Hoshino","Aika Kishimoto","Aika Nagano","Aika Usagi","Aika Yamagishi","Aima Ichikawa","Aimi Yoshikawa","Aina Ai","Aina Mizuki","Aina Nagase","Aina Namiki","Aine Sana","Aino Rei","Airi Hobana","Airi Ichise","Airi Kijima","Airi Nagisa","Airi Sato","Airi Tsuji","Aishichi Shinkawa","Aitsuki Celia","Akagi Anami","Akagi Ao","Akana Ito","Akane Ayaka","Akane Kudo","Akane Mitani","Akane Mochida (Shijimi)","Akane Rei","Akane Sana","Akane Soma","Akane Tachi","Akari Aizawa","Akari Higashi","Akari Maijima","Akari Matsunaga","Akari Minase","Akari Mitani","Akari Morimoto","Akari Neo","Akari Niimura","Akemi Iwagaya","Aki Sasaki","Aki Suou","Akiba Momo","Akiho Sano","Akiho Yoshizawa","Akiko Nagase","Akira Erie (Arai Erie, Yuka Osawa)","Akira Natsume","Akira Ono","Akiyama Mian","Alice Shaku","Alice Shinomiya","Alice Toyonaka","Alito","Aloha Maeda","Amagase Yuka","Amai Kurumi","Amakawa Sora","Amami Azusa","Amami Ichika","Amami Mea","Amami Tsubasa","Amamiya Breeze","Amamiya Hanan","Amamiya Kasumi","Amanano Ai","Amane Kanna","Amane Luna","Amane Michelle","Amane Tao","Amane Yui","Amano Noa","Amano Ririka","Amano Tsubaki","Amasawa Rin","Amatsuki Azu","Amber Slightly","Ambition","Amemiya Ayaka","Ami Hanamiya","Ami Inamori","Ami Tokita","Ami Tsuzuki","Amiri Saito","Amu Ohara","An Himeka","An Mashiro","An Tsujimoto","An Wakamoto","Ando Too","Anga","Angel Moe","Anka Suzune","Anmizuki","Ann Sasakura","Anna","Anna Hanayagi","Anna Kami","Anna Kurata","Anna Mitsushima","Anna Morikawa","Anna Sugiyama","Anna Tateoka","Annan Momoi","Anon Mita","Anri Hiramatsu","Anri Kizuki","Anri Okita","Anzai Aiyu","Anzai Et Al.","Anzaiten","Anzu","Anzu Hoshi","Anzu Komatsu","Anzu Kuzuha","Ao Amano","Ao Ebisaki","Aoba Haru","Aoba Konatsu","Aoi","Aoi Ai","Aoi Aosaka","Aoi Aoyama","Aoi Hashimoto","Aoi Hinata","Aoi Ibuki","Aoi Ichino","Aoi Ichinose","Aoi Kururugi","Aoi Matsushima","Aoi Momoi","Aoi Nakashiro","Aoi Shiho","Aoi Yoshise","Aoi Yurika","Aoka Tsukimachi","Aono Mizuki","Aonuma","Aori Arihoshi","Aoshino (Megumi Shino)","Aoyama Aina","Aoyama Nana","Aoyama Nanami","Apricot Here","Aqua Yamazaki","Arakaki Umi","Araki Kisora","Arata Arina (Hashimoto Arina)","Ariga Minaho","Arima Mizuki","Arisa Hanyu (Arisa Hanyu)","Arisa Itoi","Arisa Togawa","Arisa Tomioka","Arisu","Arisu Hana Aka","Arisu Mizushima","Aro Tamamori","Asagiri Hikaru","Asahi Meisa","Asahi Nishiyama","Asahina Rumina (Memori Shizuku)","Asahina Sho","Asakaze Yui","Asakura Here","Asakura Kotomi","Asami Homma","Asami Mizubata","Asami Ogawa","Asamiya Rana","Asano","Asano Heart","Asano Kokoa","Asuka Aida","Asuka Furuya","Asuka Kirara","Asuka Kirishima","Asuka Matsumoto","Asuka Momose","Asuka Tsukimoto","Asumi Miona","Asuna Hoshi","Asuo","Ataru Asano","Atomi Shuri","Atsushi Hosoda","Atsushi Nanase","Atsushi Yoshino","Aya Hamanaka","Aya Izumi","Aya Kisaki","Aya Konami","Aya Mamiya","Aya Mikumo","Aya Nanjo","Aya Nogi","Aya Sakurai","Aya Sasakura","Aya Shiomi","Aya Takashiro","Aya Tsukino","Aya Ueba","Ayaka Hirosaki","Ayaka Makimura","Ayaka Minase","Ayaka Mochizuki","Ayaka Muto","Ayaka Tomoda","Ayaka Yoshii","Ayakawa Dream","Ayako Inoue","Ayako Kano","Ayame Miyakozaki","Ayami Ikeda","Ayami Mori","Ayami Shunka","Ayana Nakajo","Ayane Harukana","Ayane Sezaki","Ayane Suzukawa","Ayane Yuki","Ayano Kato","Ayase Kokoro","Ayase Minami","Ayase Ten","Ayu Sakurai","Ayuka Futaba","Ayumi Miura","Ayumi Natsukawa","Ayumi Ryo","Ayumi Shinoda","Ayumu Kubo","Ayumu Tamura","Azuma Fuuka","Azuma Suzu","Azumi Chino","Azusa Hikari","Azusa Ichinose","Azusa Kakei","Azusa Marino","Azusa Misaki","Azusa Shinonome","Azusa Tani","Azusa Yagi","Bird Hina","Black People","Black Saki Drops","Blue Ori","Blue Wave Drops","Bone-Crusher","Bud","By Moon Clouds","By The Way","Camellia Flower","Cape Sakura","Carlos","Chanyota","Cherry Blossoms Maybe","Chest Hair","Chiaki Takeshita","Chiaki Uehara","Chibana Shion","Chibitori","Chie Aoi","Chie Nakamura","Chigusa Hara","Chiharu Aso","Chiharu Mitsuha","Chiharu Miyazawa","Chiharu Nogi","Chiharu Okui","Chiharu Sakurai","Chihiro Akino","Chihiro Miyazaki","Chika Arimura","Chika Tachibana","Chika Yahiro","Chikako Maru","Chinami Natsuno","Chinami Sakura","Chinatsu Mizumoto","Chinatsu Niiyama","Chintaro Sakurai","Chisaki China","Chitose Hara","Chitose Shinohara","Chitose Yura","Chohi Shiina","Cobblestone Rare","Coby","Cocona Yuki","Coglehart","Coming Soon","Cool Breeze Ui","Courage","Daichi Oikawa","Daiki Takeda","Daisuke Sadamatsu","Daisuke Yokoyama","Dandy","Danka","Date Towa","Dayama","Depew","Dont Be Fruitful","Dont Be Quick","Dow Brother","Driftwood Sara","Droplet Heart","Edogawa Monaka","Egasan","Eimi Fukada","Ekoi Sky","Elena Takeda","Elisa Kusunoki","Eluru","Ema Chizuru","Ema Kuriyama","Emi Imai","Emi Nishino","Emi Sakuma","Emi Toda","Emi Toyonaga","Emi Yagami","Emiko Sugioka","Emily Yuuhina","Emma Futaba","Emma Maeda (Ema Kato)","Emotional","Emperor Yuzu","Ena Koume","Ena Satsuki","Enif","Enz","Eoki","Eri Hazuki","Eri Saeki","Eri Takigawa (Misa Arisawa)","Erica Kitagawa","Eriguchi","Erika Isshin","Erika Kinoha","Erika Komura","Erika Mizumoto","Erika Ozaki","Erika Sakuragi","Erika Shiomi","Erin Onda","Erina","Erina Hill","Eris Katsuki","Erisa Kamishiro","Eru Sato","Eugenic","Evening Cicada","Flat Bond","Flower Alice","Flower And Bird Douka","Flower Buds","Flower Hunting","Forest Man","Frankfurt Forest","Fujii Iyona","Fujikawa No Kaze","Fujisaki Mai","Fujishiro Momoba","Fukasawa Inori","Fukuda Peach","Fukuhara Mina","Fukuyama Iroha","Fumika Kashiwagi","Fumika Nagasawa","Fumika Nakayama","Fumiko Otowa","Fumino Ishikawa","Fumino Satsuki","Fumitaka Yoshimura","Furukawa Honoka","Futaba Otani","Futaba Rena","Futaba Walnut","Futoshi","Giant Hirota","Giant Type","Ginji Sagawa","Goddess Jun","Gojo Ren","Goku","Goro","Granular Amu","Hachiba Rem","Haduki Leira","Hajime Himori","Hajime Horiuchi","Hajime Yanai","Hajun Kawaguchi","Hakar","Hakase","Hakata Ayaba","Hamabe Shioriho","Hamazaki Mao","Hame Bird Person","Hame Shirabu","Hamura Blunt Weapon","Hana Aoyama","Hanabi Tsukino","Hanae Okazaki","Hanai Shizuku","Hanamiya Kyouko","Hanamiya Shiina","Hanamori Kaho","Hanane Urara","Hanaoka Jita","Hanasaki Mio","Hanazato Akari","Haneda","Haneda Tsubasa","Hanekawa Ruru","Happy Ikeda","Hara Hanane","Hara Hinano","Harada Chika","Haraguchi","Harry","Haru Ando","Haru Kawamura","Haru Kikuchi","Haru Ogawa","Haru Shibasaki","Haru Shinonome","Haruhara Mirai","Haruhi Hanano","Haruhi Hibiki","Haruka Aizawa (Kotone Kuroki)","Haruka Ayane","Haruka Ikeuchi","Haruka Kitagawa","Haruka Miokawa","Haruka Mirai","Haruka Miyana","Haruka Nagayama","Haruka Nanasegawa","Haruka Sanada","Haruka Takami","Haruka Tamai","Harukaze Doggy","Haruki Sato","Haruku","Haruma","Harumei Jun","Haruna Hana","Haruna Kawakita","Haruna Nakano","Haruno Ando","Haruno Morisaki","Haruno Ruru","Harura Mori","Haruse Momona","Haruto Terahashi","Haruyo Mocha","Hashimoto Arina (Arata Arina)","Hasui Rin","Hasumi Claire","Hasumiten","Hatsumi Saki","Hatsune Minori","Hayami Sana","Hayano Uta","Hayato Kasama","Hayato Tsuji","Hazuki Hina","Hazuki Mayu","Hazuki Mion","Hazuki Moe","Hazuki Nanase","Hazuki Peach","Hazuki Sano","Hibiki","Hibiki Amemiya","Hibiki Hoshino","Hibiki Natsume","Hibiki Otsuki","Hibiki Rika","Hibiki Tamura","Hibikiren","Hibino Uta","Hidai","Hideko Mayuzumi","Hideyuki Setsune","Higashi","Higashi Mika","Hiiragi","Hiiragi Kaede","Hiiragi Momiji","Hikari Aozora","Hikari Hime","Hikari Mitsui","Hikari Mizusumi","Hikari Ninomiya","Hikari Ogura","Hikari Sakuraba","Hikari Sena","Hikari Takifuyu","Hikaru Harukaze","Hikaru Ikuno","Hikaru Imada","Hikaru Konno","Hikaru Minazuki","Hikaru Miyanishi","Hikaru Toda","Himari","Himari Asada","Himari Ayase","Himari Kinoshita","Himari Kosaka","Himari Momose","Himari Ozuki","Hime Hayasaka","Hime Shirayuki","Himeka Mari","Himekawa Kanon","Himemori Amu","Himeno Juri","Himeno Momona","Himeoka Shia","Himika Nanao","Hina Hirose","Hina Hotaka","Hina Kawai","Hina Kusakabe","Hina Nanami (Hina Nanase)","Hina No Kanon","Hina Satsuki","Hina Tsukino","Hina Yumeno","Hinagata Mikuru","Hinako Higashimine","Hinako Matsui","Hinako Mori","Hinako Seto","Hinako Suga","Hinami Fujimori","Hinami Meguro","Hinami Narizawa","Hinami Ren","Hinano Iori","Hinano Kamisaka","Hinano Kokonoki","Hinano Kuno","Hinano Miki","Hinano Okada","Hinano Sonoda","Hinano Tachibana","Hinata Aino","Hinata Hikage","Hinata Kimitsuka","Hinata Koizumi","Hinata Komine","Hinata Sagiri","Hinata Tachibana","Hinata Yuna","Hinata Yura","Hinata Yuzuki","Hirahana","Hirayama Hana","Hiroi Umi","Hiroka Suzuno","Hiromi Nanase","Hirose Miyu","Hisae Yabe","Hisayo Nanami","Hitomi (Hitomi Tanaka)","Hitomi Enjo","Hitomi Honjo","Hitomi Hoshitani","Hitomi Katase","Hitomi Madoka","Hitomi Mochizuki","Hitomi Ryo","Hitomi Tanmura","Hiyori Nosaka","Hiyori Sasakura","Hiyori Yoshioka","Hojo Asahi","Hoka Nakayama","Hoka Yonekura","Holy Skylark","Homura Aine","Honami Hazuki","Honami Matsushima","Honami Mukai","Honami Takahashi","Honda Cape","Honda Hitomi","Honda Peach","Honda Riko","Honda Tsubaki","Honjo Hana","Honjo Suzu","Honka Saito","Hono Wakamiya","Hono Wakana","Hono Watanabe","Honoka Ashina","Honoka Mihara","Honoka Mitsuhara","Honoka Nanase","Honoka Tsujii","Hope Mirina","Horikita Wan","Horio","Hosaka Eri","Hoshi Fuyuka","Hoshichi Nanami","Hoshino Akari","Hoshino Hoshiyoshi","Hoshino Kira","Hoshino Mami","Hoshino Natsutsuki","Hoshino Nene","Hoshino Sumire","Hoshizaki Seira","Hosho Lily","Hotaru Nogi","Hyakuninka","Hyokori","Ian Hanasaki","Ichiba Reika","Ichika","Ichika Hoshimiya","Ichika Kamihata","Ichika Kasagi","Ichika Matsumoto","Ichika Nagano","Ichika Nanjo","Ichika-Sensei","Ichinose Hazuki","Ichinose Ram","Iguchi","Iitoyo See","Ikeda","Ikeda Kei","Ikegami Otoha","Ikumi Kondo (Ikumi Kondo)","Ikumi Kuroki","Ikunomachi","Ikuo Yamamoto","Ikuta Town","Innocent Karen","Iona Sakihara","Iori Furukawa","Iori Hane","Iori Kitano","Iori Nanase","Iori Tomoyo","Iori Tsukimi","Ippei Nakata","Isedon Uchimura","Ishihara Blue","Ishii Renka","Ishikawa Kurumi","Ishikawa Mio","Isoyama Road","Itagaki","Itagaki Azusa","Italian Takahashi","Ito","Ito Kuran","Ito Seika","Itoi Ruka","Itsuki Saisai","Ittetsu Suzuki","Iwasawa","Izumi Kinue","Izumi Mizutani","Izumi Momoka","Izumi Ran","Izumi Sakuma","Izuna Niizawa","Japan-U.s.","Jay.","Jin Yuki","Jogasaki Momose","Johnny Okamoto","Juice Type","Julia","Jumonji","Jun Hosaka","Jun Ichikawa","Jun Mizukawa","Jun Odagiri","Jun Suehiro","June Lovejoy","Junkichi Kashiwagi","Junko Wagatsuma","Juri Mitsumori","Kachikachi Yamada","Kaede Fua","Kaede Fuyutsuki","Kaede Hinata","Kaede Karen (Tanaka Lemon)","Kaede Okui","Kaede Sakuma","Kagami Sara","Kagawa Apricot","Kagaya Koi Shiro","Kaho Imai","Kaho Shibuya","Kaho Shirahama","Kaho Tamaki","Kahoku Ema","Kaichi Konno","Kaito Kitamura","Kajio Uta","Kakuna Tsumugi","Kamejiro","Kami Kentaro","Kamiki Mia","Kamikiran","Kamiya Mitsuki","Kana Hiiragi","Kana Honda","Kana Imai","Kana Kusakabe","Kana Kusunoki","Kana Mito","Kana Miyashita","Kana Momonogi","Kana Morisawa","Kana Morisawa (Kanako Iioka)","Kana Tamura","Kana Uno","Kanade Hayasaka","Kanae Kawahara","Kanae Lennon","Kanae Midou","Kanae Mizuki","Kanae Nozomi","Kanae Ruka","Kanae Yumemi","Kanako Hamabe","Kanako Kase","Kaname Aya","Kaname Hoshikoshi","Kaname Momojiri","Kanata Toumi","Kanaya Uno","Kanna Fuji","Kanna Mimai","Kanna Misaki","Kanna Sasaki","Kanna Shinozaki","Kanno Sayuki","Kano Amano","Kano Sawano","Kanohana","Kanoko Kagawa","Kanon Hazuki","Kanon Ichikawa","Kanon Kanade","Kanon Kinofuki","Kanon Mashiro","Kanon Shinomiya","Kanu Arisu","Kaori","Kaori Iiyama","Kaori Inaba","Kaori Maeda","Kaori Mori","Kaori Yamamoto","Kaoru Shimazu","Kaoru Yasui","Karen Asahina","Karen Ishida","Karen Kaede","Karen Mifune","Karen Nagase","Karen Otoha","Karen Otori","Karen Sawamura","Karen Usami","Karen Yanagi","Karina Nishida","Karina Tanida","Kasane Saito","Kashii Hanano","Kashii Kaoru","Kasuga Ena","Kasumi","Kasumi Ikeya","Kasumi Kaho","Kasumi Kudo","Kasumi Matsumaru","Kasumi Onodera","Kasumi Riko","Kasumi Risa","Kasumi Saiki","Kasumi Tsukino","Kasumi Yuai","Katayose Hagi Hana","Kato Hino","Kato Minori","Kato Rose","Kato Tsubaki","Katsuragi Haruka","Kawaei Yui","Kawaguchi Cherry Blossoms","Kawaguchi Nonoka","Kawai Asuna","Kawakami Nanami","Kawakita Meisa","Kawam","Kawamura","Kawamura Maya","Kawana Ai","Kawasaki Nana","Kawashima Nozomi","Kayo Iwasawa","Kazu Takashima","Kazuhana Kurokawa","Kazuhana Seta","Kazuma","Kazusaki Kuno","Kazuya Sawaki","Kei Jun","Ken Matsumoto","Ken Shimizu","Kenji Nakahori","Kenta","Kenta Kudo","Kento Hoshi","Kettle","Kiara Suzuki","Kiho Hoshina","Kiho Ichinomiya","Kiho Kanamatsu","Kiki Shiina","Kimika Ichijo","Kimika Shiori","Kimishima Mio","Kimura Aiko","Kinoshita Ayame","Kinoshita Azumi","Kinoshita Ririko","Kinouchi Nanaha","Kira","Kirari Sena","Kirch","Kirie Kawasaki","Kiriko Imato","Kirioka Satsuki","Kirishima Reona","Kiritani Festival","Kiritani Nao","Kiriya Yuuha","Kiryu Tamho","Kisaki Alice","Kisaki Nana","Kisaragi Mashiro","Kishi Aino","Kita Kouji","Kitano Sho","Kitaoka Karin","Kiyo Ami","Kiyoha","Kiyomiya Renai","Kiyomiya Tin","Kiyozuka Nana","Kizaki Jessica","Kobayakawa Reiko","Kodama Nanami","Koharu Amamiya","Koharu Shiina","Kohinata Meru","Koibuchi Momona","Koikawa Momo","Koiro Yuki","Koiumi Sasaki (Koi Mukai)","Koizumi (Mari Koizumi)","Kojima Miko","Kokomi Hoshinaka","Komatsu Sora","Komatsumoto","Komukai Minako","Konatsu Kashiwagi","Konatsu Shida","Kondo Mumu","Konoe Tasaki","Konomi Hirose","Konomi Kimura","Koseki Mugi","Koshii","Kosuzu Mikan","Koto","Koto Sakura","Kotone Ayase","Kotone Fuyue","Kotone Tsukino","Kotone Umekawa","Kotone Yamamoto","Kotoneka","Kotori Yu Momoe","Kotoyumi Ono","Koume","Koyoi Konan","Kozue Fujita","Kozue Nakano","Kozue Tokita","Kozuki Sera","Kudo Misa","Kumi Koizumi","Kunio Katayama","Kuraki Hana","Kuraki Shiori","Kurata Mao","Kuribo","Kuroki Aimu","Kuroki Aoi","Kuroki Reina","Kurosaki Hana","Kurumi Momose","Kurumi Seseragi","Kurumi Shiiki","Kurumi Takimoto","Kusunoki Arisu","Kyoka Shiori","Kyoka Tachibana","Kyoko Ichikawa","Kyoko Kubo","Kyoko Yabuki","Kyonshi","Lara Kudo","Lariat Kurokawa","Lauren Hanakoi","Leader","Left Left","Leila Fujii","Leona Kasai","Leona Maruyama","Light Blue Noah","Lily Bell","Lily Haruka","Lily Heart","Lima Arai","Love Ria","Love Treasure Tin","Loves","Lumina Sena","Luna","Luna Kamino","Luna Suzumiya","Ma-Kun","Maaya Irita","Madoka Miyashita","Madoka Mochizuki","Mahina Amane","Mahiro Ichiki","Mahiro Tadai","Maho Fujiwara","Maho Hoshijima","Mai Arisu","Mai Fuyuki","Mai Hoshikawa","Mai Nanami","Mai Nanase","Mai Onodera","Mai Shiomi","Mai Shirakawa","Mai Tamaki","Mai Tokiwa","Mai Yahiro","Maihara Sei","Maika Asai","Maika Hiizumi","Maika Kotani","Maiko Ayase","Maiko Kashiwagi","Maina Ayase","Maina Miku","Maina Miura","Maina Shiraha","Maina Yuuri","Maki","Maki Izuna","Maki Koshimizu","Maki Kyoko","Maki Sakashita","Maki Tomoda","Mako Iga","Makoto","Makoto Nojima","Makoto Takeda","Makoto Toda","Mami Kotomiya","Mami Nagase","Mami Sakurai","Mami Zenba (Mami Mashiro)","Mana Sakura","Manaka","Manami Kawamura","Manami Kudo","Manami Oura","Manami Yano","Manjiro Gaku","Manjiro Yamada","Mao Fujimura","Mao Hotta","Mao Ito","Mao Takanashi","March","March Hikaru","Mari Aoi","Mari Aso","Mari Kagami","Mari Koharu","Mari Rinatsu","Mari Ruri","Mari Takasugi","Mari Ueto","Maria Aine","Maria Ayase","Maria Chihaya","Maria Himesaki","Maria Hoshi","Maria Nagai","Maria Ousawa","Maria Valentine","Maria Wakatsuki","Maria Wakui","Maria Yumeno","Marie Konishi","Marika Ayukawa","Marika Kobayashi","Marika Watanabe","Mariko Koto","Mariko Sada","Marimon","Marin Araki","Marin Hinata","Marin Shinohara","Marina Akizuki","Marina Ikeda","Marina Nishio","Marina Shiraishi","Marina Yakuno","Marina Yuzuki","Mario","Marion Ide","Marisa Aise","Maru 123","Maru Rare","Maru Tsuji","Marui Moeka","Maruyama Nozomi","Mary Tachibana","Masaaki Kawagoe","Masahiro Tabuchi","Masahiro Ueda","Masakazu Oshino","Masam","Masami Ichikawa","Masato Ichijo","Masato Sawachi","Mashiro Mami","Masked","Masuzu Mita","Matsumine Kohaku","Matsumiya Jade","Matsumoto Marina","Matsumoto Mei","Matsuno Ran","Matsuoka Tin","Matsurino","Matsushita Riko","Maya Kikuchi","Mayu Aoyama","Mayu Horizawa","Mayu Komikawa","Mayu Minami","Mayu Misaki","Mayu Nozomi","Mayu Onodera","Mayu Suzuki","Mayu Suzune","Mayuka Arisawa","Mayuka Kitagawa","Mayuka Yao","Mayuki Ito","Mayumi Imai","Mayumi Sanada","Mayuri Takeuchi","Megu Yokomine","Megumi Suzuki","Meguri (Meg Fujiura)","Meguro Meguro","Mei Aise","Mei Harusaki","Mei Hasami","Mei Hayashi","Mei Itoya","Mei Itsukaichi","Mei Mitsuki","Mei Miyajima","Mei Satsuki","Mei Suzushiro","Mei Tosei","Mei Uesaka","Mei Washio","Meika Nanba","Meiko Nakao (Noa)","Meiko Shiraishi","Mia Masuzaka","Mica Sky","Michi-Kun","Michiko Uchihara","Michikyuten","Michiru Aika","Michiru Kujo","Migrant Style","Miharu","Miharu Kawada (An Mita)","Miharu Usa","Mihina (Azumi Hina, Nagai Mihina)","Miho Kanno","Miho Tomii","Miho Tono","Miike Koharu","Miina Konno","Miina Tsuji","Miina Wakatsuki","Miisa Ya","Mika Horiuchi","Mika Sumikawa","Mikage Remi","Mikako Hori","Mikan Kururugi","Mikeda Minaki","Miki Akai","Miki Kanna","Miki Matsuzaka","Miki Mihama","Miki Sanada","Miki Shiraishi","Miki Yamase","Mikio Ikenuma","Miko Mizusawa","Mikoshiba Mika","Mikoto Kiwa","Mikoto Yoshioka","Miku Abeno","Miku Arima","Miku Ikuta","Miku Ishida","Miku Kurusu","Miku Misora","Miku Nishino","Mikuru Nozaki","Mikuru Shiiba","Mimi Yazawa","Mina Aise","Mina Kitano","Minako Kirishima","Minami Ahn","Minami Aizawa","Minami Fujii","Minami Hatsukawa","Minami Hinano","Minami Hironaka","Minami Ikejiri","Minami Kojima","Minami Kozue","Minami Maeda","Minami Matsuyama","Minami Mizuhara","Minami Nakajima","Minami Natsuki","Minami Peach","Minami Rina","Minami Sawakita","Minami Shion","Minami Shirahama","Minami Shirakawa","Minami Shirayuri","Minami Sugiura","Minami Tsubasa","Minami Umeda","Minamihata Souka","Minamikyo","Minamizawa Umika","Minamo","Minano Mirai","Minase Rita","Minase Tianhe","Minato Haru","Minato Sakuragi","Minato Wave","Mine Dream","Minori Kawana","Minori Komatsu","Minori Kotani","Minori Kuwata","Minori Ozaki","Minoru Kumichi","Minoru Tojo","Minoshima Tour","Mio","Mio Adachi","Mio Aizawa","Mio Anzai","Mio Fujiko","Mio Futaba","Mio Ichijo","Mio Kayama","Mio Kuon","Mio Mao","Mio Mashiro","Mio Matsuoka","Mio Meg","Mio Morishita","Mio Togashi","Mio Ueshiro","Mio Yukihira","Mion","Mion Sakuragi","Mion Usami","Miona Makino","Miori Akimoto","Miori An","Miori Ayaba","Miori Hara","Miori Yurikawa","Mirai Natsume","Mirai Sena","Mirei Aoi","Mirei Kyouno","Mirei Morishita","Mirei Shinonome","Mirei Uno","Miria Hayama","Mirina Kishinaga","Miru","Miru Sakamichi","Misa Kyono","Misaki Enomoto","Misaki Hikari","Misaki Sonoka","Misaki Sound","Misaki Sugisaki","Misaki Tsukimoto","Misakura Nozaki","Mishiro Nanase","Misono Waka","Misuzu Kawana","Misuzu Mifune","Misuzu Otowa","Misuzu Tachibana","Misuzu Takeuchi","Mita Sakura","Mitchie","Mito Tsukino","Mitoma Umi","Mitsu Higuchi","Mitsu Konoha","Mitsugu Someshima","Mitsuha (Mitsuha Kikukawa)","Mitsuha Nose","Mitsuha Tomorrow","Mitsuha Yayoi","Mitsuki Chigusa","Mitsuki Hirose","Mitsuki Hoshikawa","Mitsuki Makita","Mitsuki Maya","Mitsuki Momota","Mitsuki Nagisa","Mitsuko Ueshima","Mitsumi Kyou","Mitsuri Nagahama","Mitsuyo Ikuno","Miu Arioka","Miu Harutani","Miu Nakamura","Miu Shirahama","Miu Susaki","Miura Eriko","Miyabe Ryoka","Miyabi Inamori","Miyabi Shizuki","Miyako Nanjo","Miyamoto Koyuki","Miyano Maybe","Miyano Sakura","Miyazaki","Miyazaki Aya","Miyo Hiyoshi","Miyoshi Yuuka","Miyoshi Yuzuka","Miyu Aizawa","Miyu Amano","Miyu Imai","Miyu Inamori","Miyu Kanade","Miyu Kiyohara","Miyu Misaki","Miyu Oguri","Miyu Sasaki","Miyu Yanagi","Miyuki Arisaka","Miyuki Sakura","Miyuki Sakurai","Mizuhara Wako","Mizuho Aoi","Mizukawa Maple","Mizukawa Violet","Mizuki Hayakawa","Mizuki Igarashi","Mizuki Kaori","Mizuki Mio","Mizuki Narasaki","Mizuki Rin","Mizuki Sakuno","Mizuki Shida","Mizuki Shirayuki","Mizuki Yayoi","Mizuno Chaoyang","Mizuno Nanoha","Mizuno Roa","Mizutani Aoi","Mizutani Pear Tomorrow","Mochizuki","Mochizuki Fuuka","Mochizuki Nono","Moe Sakakibara","Moe Shiramiya","Moehisa Hishinuma","Moena Nishiuchi","Moisturizing","Moka Ayase","Momo","Momo Inoue","Momo Misono","Momo Ninomiya","Momo Shiraishi","Momoe Horikita","Momoe Mikoto","Momojiri Kanon","Momojiri Urara","Momoka Akari","Momoka Kagura","Momoka Kato","Momoka Ogawa","Momoko Isshiki","Momona Sakuraba","Momone","Momos Marina","Momosaki Kikka","Momosaki Miiro","Momosaki Noah","Monami Bell","Monami Onizuka","Monami Takeda","Monchi","Mongo","Moomin","Moon Princess Sara","Mori Hotaru","Mori Nanako","Morinaga Ice Cream","Morinaga Iroha","Morishita Kotono","Morita Miyu","Morning Mist Mashiro","Morning Sea","Motofuji Pero","Motomiya Miyabi","Mukai Ai","Murkaise","Muscle Sawano","Mutan","Mutsumi Okuma","Myu (Miu Natsume, Lisa Harukawa, Iori Natsume)","Nagamine Tsubaki","Nagano Suzu","Nagano Tsumugi","Nagarekawa Chiho","Nagasawa Azusa","Nagase Minamo","Nagase Miyu","Nagi Hikaru","Nagi Serizawa","Nagi Yasaka","Nagisa Asami","Nagisa Hazuki","Nagisa Ishizaki","Nagisa Koio","Nagisa Koizumi","Nagisa Shinzawa","Nagisa Shiraishi","Nagisa Takagi","Nagisa Tanimura","Nagisa Yukino","Nagisa Yuna","Naho Hazuki (Naho Hazuki)","Naho Kado","Naho Ozawa","Nakajo Rino","Nakamaru Future","Nakamori Reiko","Nakano","Nako Hoshi","Nako Nohara","Nami","Nami Aoi","Nami Hoshino","Nami Kuroki","Nami Nanami","Nami Sawaguchi","Nami Togawa","Nami Tokai","Namikawa Yukari","Namiki Anri","Namiki Toko","Nana Aida","Nana Ayami","Nana Maeno","Nana Misaki","Nana Miura","Nana Tanaka","Nana Yagi","Nanaho Kase","Nanaka Kosaka","Nanako","Nanako Miyamura","Nanami Hirose (Natsumi Horiguchi)","Nanami Mami","Nanami Matsumoto","Nanami Mihi","Nanami Mineda","Nanami Misaki","Nanami Nakamori","Nanami Ogura","Nanami Shiina","Nanami Tina","Nanami Yua","Nanao God","Nanasawa Mia","Nanase Alice","Nanase Aoi","Nanase Asahina","Nanase Otoha","Nanase Rui","Nanase Sinon","Nanno Sora","Nano Ogasawara","Nano Yazawa","Nao Aizuki","Nao Jinguji","Nao Masaki (Momo Kaede, Natsu Ando)","Nao Mizushiro","Nao Wakana","Naoki Yuuki","Naoko Osako","Narcisse Kobayashi","Narimiya Iroha","Narita Kanako","Narita Tsumugi","Narration Performance","Narumi Araki","Narumi Hirose","Narumi Koyuki","Natori Ao","Natsu","Natsu Hanabuchi","Natsu Igarashi","Natsu Sano","Natsu Shibuya","Natsu Tojo","Natsuki Hasegawa","Natsuki Hikaru","Natsuki Kisaragi","Natsuki Maron","Natsuki Takeuchi","Natsuki Yokoyama","Natsuki Yume","Natsuko Kayama","Natsuko Mishima","Natsukuri Rio","Natsume Airi","Natsume Reika","Natsume Saiharu","Natsumi","Natsumi Kanna","Natsuna Sasaki","Natsuo Natsu","Natsuo Tohno","Natsushira Maya","Natsuya Eru","Natsuya Togawa","Nattsu","Natural Kanon","Natural Mizuki","Nazuna Nonohara","Nene Misumi","Nene Sakura","Nene Yoshitaka","New Name Amin","New Serena","Newlywed Yuuka","Nezuo","Niagara Sho","Nick","Nico Kawagoe","Nikaido Rei","Nina Kosaka","Nina Nishimura","Ninety-Nine Mei","Nishimiya Konomi","Nishino Megu","Nishino Otone","Nishino Serina","Nishino Tae","Nishizono Sakuya","Nissen Maika","Nitori Hina","Nitta Snow","Noa Eikawa","Noao Hazuki","Nodoka Aragaki","Noko Kamiya","Nomiya Ann","Nonomiya Ame","Nonose Ai","Nonoura Warm","Noriko Hoshi","Noriyuki Oshii","North Island Rei","Nozomi Arimura","Nozomi Ashida","Nozomi Hamada","Nozomi Haneda","Nozomi Hazuki","Nozomi Higashi","Nozomi Ikuta","Nozomi Ishihara","Nozomi Kitajo","Nozomi Mikimoto","Nozomi Osaka","Nozomi Sakai","Nozomi Shirahama","Nozomi Suhara","Nozomi Suzuki","Nozomi Tanihara","Oba Yui","Obedient","Oda Mako","Odazakura","Ogawa Rio","Ogilvy Haruka","Ogura Ami","Ogura Mikine","Oguri Misao","Ohashi Miku","Oki Rei","Okinomiya Nami","Okre","Omi Horikawa","Omura","One","Ori Amami","Orie Maya","Orihara Honoka","Orin","Oryo","Osamu Osamu","Ota","Otani","Otoha Amu","Otoha Love","Otonashi Kaori","Otori Miyu","Otsu Alice","Otsuka Gyokudo","Ouka Rin","Oyo Nakano","Paradise Mina","Peaches","Pear Flower","Pentagram","Perfume Jun","Pierre Sword","Princess Hanamiya","Puchin","Pure White","Pure White Ayei","Pure White Fluffy","Pure White Here","Pure White Mikuru","Pure White Minori","Purple Fujisaki","Putyan","Qbee","Rabbit","Rabbit Kento","Rainbow Color","Ran Himeno","Ran Kikuno","Ran Kosaka","Ran Nanase","Ranger Kaburagi","Ranka","Ranran","Ranran Fujii","Rara","Rara Shinozaki","Rea Sakurai","Really","Rei Aoki","Rei Futami","Rei Hanamiya","Rei Kamiki","Rei Kimura","Rei Kuroshima","Rei Kuruki","Rei Misumi","Rei Saegusa","Rei Shiratori","Rei Tamaki","Reika Hashimoto","Reika Makino","Reika Takeda","Reika Toyoda","Reika Wakana","Reiko Himekawa","Reiko Himori","Reiko Kasumi","Reiko Kitagawa","Reiko Makihara","Reiko Mine","Reiko Sawamura (Honami Kosaka, Masumi Kosaka)","Reiko Seo","Reiko Tono","Reimi Hasegawa","Reimi Saegusa","Reina Dan","Reina Makino","Reina Sumi","Reina Taozono","Reira Aisaki (Chihiro Hara)","Reira Natsuki","Remi","Remi Natsume","Remi Sakuma","Remu Suzumori","Ren Ayanami","Ren Ichinose","Ren Yamamoto","Rena","Rena Aoi","Rena Fukiishi","Rena Hasegawa","Rena Kodama","Rena Miyashita","Rena Mori","Rena Munakata","Rena Sakuragi","Renka Saeki","Renka Yuzuki","Reno Kiyomi","Reo Fujisawa","Reona Hironaka","Ria Kashii","Ria Misaka","Ria Oido","Ria Yamate","Ria Yoshizawa","Ria Yuzuki","Riame Nagata","Rian Matsunaga","Rian Natsu","Rie Miyagi","Rie Takeuchi","Rieko Hiraoka","Riena Ninomiya","Rieru Shibusawa","Riho Agatsuma","Riho Fujimori","Riho Matsumoto","Riho Shirahashi","Riho Shishido","Riho Takahashi","Riina Aizawa","Riisa Kisaragi","Riisa Kuga","Rika Aimi","Rika Amemura","Rika Goto","Rika Sano","Rika Usui","Rika Utsugi","Rika Yumeri","Riko Hashimoto","Riko Momose","Riko Sato","Riko Tokushima","Riku Aizawa","Riku Ichikawa","Rima Mashiro","Rimu Yumino","Rin","Rin Amemiya","Rin Aoki","Rin Asahi","Rin Asuka","Rin Azuma","Rin Chika","Rin Hachimitsu","Rin Ikuta","Rin Kira","Rin Miyazaki","Rin Natsuki","Rin Ogawa","Rin Sakihara","Rin Sakuragi","Rin Usami","Rina Aoi","Rina Ayana (Akari Nanami)","Rina Ishihara","Rina July","Rina Masako","Rina Minase","Rina Otomi","Rina Takase","Rinka Mizuhara","Rinka Natsume","Rinka Ono","Rinka Tahara","Rinko Hanayagi","Rinne","Rinne Mochizuki","Rino Kirishima","Rino Sakai","Rino Tanaka","Rio","Rio Asahi","Rio Hamasaki (Erika Morishita, Erika Shinohara)","Rio Harusawa","Rio Hosokawa","Rio Kuriyama","Rio Miyachi","Rio Ryukawa","Rio Sakamoto","Rion","Rion Hiiragi","Rion Izumi","Rion Sono","Riona Hirose","Riona Kudo","Riri Koda (Miri Koda, Miki Iwashita)","Riri Nanatsumori","Riri Okamoto","Ririka Tsukishiro","Riru Asano","Risa Hashimoto","Ritsu Nagasawa","Rodin Fuji","Rokka Ono","Rokuka Noah","Ruby Amazoness Nami","Rui Hizuki","Rui Ichinomiya","Rui Minagawa","Rui Miura","Rui Miyamoto","Rui Otokoto","Rui Shidou","Rui Shinomiya","Ruisa Miyakozuki","Ruka Aida","Ruka Aise","Ruka Inaba","Ruka Miyase","Rukawa Haruka","Rumi Amano","Rumi Mochizuki","Runa Shimotsuki","Runa Shiraishi","Runa Yamagishi","Ruri Kobato","Ruri Saijo","Ruri Tachibana","Ruru Mishiro","Rurucha.","Ryo Aoki","Ryo Harusaki","Ryo Kurihara","Ryo Sawai","Ryo Tsukimi","Ryoichi Sasaki","Ryoko Iori","Ryoko Izumi","Ryoko Murakami (Rikako Nakamura, Naho Kuroki)","Ryota Inoue","Ryouka Walnut","Ryu Enami","Ryu Enami (Ryu)","Ryuji Moriyama","Ryukawa Evening","Saa Futaba","Saaya Kirijo","Sachika Akimoto","Sachiko","Sadafumi Ishikawa","Sae Fujiki","Sae Tsubaki","Sae Tsukizono","Sae Yano","Saejima Kaori","Saeko Matsushita","Saeko Yokoyama","Saho Shinozaki","Saika Kawakita","Saionji Mio","Sajihanzo","Sakai Mio","Sakai Moka","Sakamoto Kazuno","Saki Aikawa","Saki Kasai","Saki Kiyono","Saki Mizumi","Saki Oishi","Saki Okuda","Saki Sasaki","Saki Shinkai","Saki Urara","Sakikazu Sasaki","Sakina Takeuchi","Sakuma Tsuna","Sakumatsu","Sakura Kamiya","Sakura Kirishima","Sakura Kizuna","Sakura Mahiru","Sakura Mio","Sakura Miura","Sakura Moko","Sakura Momo","Sakura Okina","Sakura Ryouka","Sakura Suzuka","Sakura Tsuji","Sakura Tsukishima","Sakura Yuno","Sakura Yura","Sakurada Momoha","Sakurano Momo","Samejima","Sana Baba","Sana Ikuta","Sana Matsunaga","Sana Minase","Sana Mizuhara","Sana Nishiyama","Sanadakyo","Sanae Kubota","Sanae Kurihara","Sanae Misono","Sannomiya Tsubaki","Sano","Sano Seiya","Santama","Saori Nagashima","Saori Tsuji","Saori Yagami","Saotome Arisu","Saotome Chika","Saotome Love","Sara Aizawa","Sara Isshiki","Sara Saijo","Saran Ito","Sari Kosaka","Sarina Kurokawa","Sarina Momonaga","Sarina Toyama","Sato Iori","Sato Sato","Satomi","Satomi Miyamoto","Satomi Nagasawa","Satomi Oka","Satomi Suzuki","Satomi Yuria","Satoumi Yuhi","Satozaki Aika","Satsuki Kamimura","Satsuki Kuriyama","Satsuki Nanao","Satsuki Sakura","Satsuki Toyooka","Satsuki Yura","Sawa Nonoka","Sawa Yamashita","Sawaguchi Shino","Sawajiri Uta","Saya Endo","Saya Mikuni","Saya Tsukamoto","Saya Usui","Sayaka","Sayaka Hoshino","Sayaka Megumi","Sayaka Minobe","Sayaka Nito","Sayaka Otohaku","Sayama Love","Sayu Nanaha","Sayu Nanahara","Sayuki Mogami","Sayuki Natori","Sayuri Hayama","Sayuri Horiguchi","Sea ​​Bream","Second Generation Randa Mai","Seigo Hashimoto","Seika Igarashi","Seika Toyosaki","Seira Ayano","Seira Kuwahara","Seira Mizusumi","Seiran Igarashi","Seiri Toa","Seko Meizumi","Semen Jiro","Sengoku Monaka","Senkawa Monaka","Seo Rin","Serena Nashiki","Serena Tsutsumi","Sergeant","Seri Orimoto","Serina Hayakawa","Serina Tachibana","Serina Usui","Seto Kanna","Seven Blues","Shallow Sea","Shibuya Hana","Shichido Renmi","Shigeo Tokuda","Shiho Aoi","Shiho Egami","Shiho Hirate","Shiho Terashima","Shihori Endo (Shihori Endo)","Shihori Kotoi","Shiina Eru","Shikano Amo","Shimeji Mushroom","Shimiken","Shimokawa Tsumugi","Shina Kiki","Shindo Promising","Shingo Kuga","Shinharu Asai","Shinji Hirai","Shinji Osawa","Shinji Yano","Shinkawa Sky","Shinna Nakamori","Shinnosuke Ueda","Shino Mayu","Shinobu Oishi","Shinoda Yu","Shinohara Iyo","Shinomiya Momo","Shinomiya Nene","Shinon Mizutani (Rio Fujisaki)","Shinonome Reiya","Shinta","Shinto Takahashi","Shinya Matsuyama","Shio Sato","Shiokawa Sea Urchin","Shion Fujimoto","Shion Mako","Shion Misumi","Shion Nishikai","Shiori Akagawa","Shiori Hirai","Shiori Izumida","Shiori Kamisaki","Shiori Mamiya","Shiori Minami","Shiori Mochida","Shiori Nogami","Shiori Tsukada","Shiori Yorimoto","Shirahana Ko","Shirahasi Miyuki","Shiraishi Nami","Shiraishi Plane","Shiraiwa Fuyumoe","Shirakami Sakka","Shirakawa Hanasei","Shiraki Yuko","Shirako","Shiramine Ikumi","Shiramine Miu","Shirasaki Ao","Shirasaki Rion","Shirasaki Suirei","Shiratama Dango","Shiro Kitayama","Shisa Gamo","Shiseishinkai","Shishio","Shitara Alisa","Shitara Yuuhi","Shizuka","Shizuka Momoi","Shizuka Omori","Shizuka Sugisaki","Shizuku Kashiwagi","Shizuku Kawakami","Shizukutsuki Heart Cherry Blossom","Shizuna Manami","Shizune Morisaki","Sho Nishino","Shoko Akase","Shoko Akiyama","Shoko Deyama","Shoko Furukawa","Shoko Matsumoto","Shoko Takahashi","Shore","Short","Shota Chisato","Shuji Kusano","Shuka Katayose","Shun Sakuragi","Shunka Miyanoki","Small Flower","Snow","Snow Moon","Snow White Hinano","Soa","Soda","Soil","Sonoda","Sonoda Mion","Sora Honda","Sora Kamikawa","Sora Mikumo","Sora Nakagawa","Sora Shiina","Sota Asami","Sound","Soushiro Imaoka","South","South Hoshina","South Iroha","Southern Amane","Spicy","Spring","Squid","Stand On Ones Feet","Star Ameri","Starry Sky","Starry Sky Niece","Subaki Ishii","Sugiura Bokki","Sugiyama","Sukeroku Miuraya","Sukezaneheita","Sumino Makise","Sumire Aisaka","Sumire Kuramoto","Sumire Kurokawa","Sumire Mihara","Sumire Minato","Sumire Sakaguchi","Sumire Seto","Sumire Shiraishi","Sumire Shiratori","Sumire Takikawa","Summer Color Mika","Summer Sky Rika","Summer Yagi Satsuki","Sunao Kui","Suzu Aikawa","Suzu Mitake","Suzu No Ie Rin","Suzu Otonashi","Suzu Yamai","Suzuki Koharu","Suzume Mino","Suzume Yura","Suzumura Airi","Suzuna Nami","Suzune Kiritani","Suzune Nico","Suzuno Uto","Tachibana Hina","Tachibana Iori","Tachibana Maple Leaves","Tachibana Mirai","Tachibana Shizune","Tact","Tae Kosaka","Takaboshi Nagisa","Takao Kaneda","Takarada Monami","Takashi Haneda","Takashi Yoshimura","Takehiro Tomiyasu","Takeshi Oshima","Taki Yuina","Takiguchi","Takimoto","Takimoto Shizukuha","Takonyan","Talao","Tamaki Kurumi","Tamari Yamaguchi","Tameo Sueto","Tanaka","Tanaka Lemon","Taniguchi Shuka","Tano Yu","Taro Iwashita","Tatsu","Tatsumi Yui","Tatsuro Hibino","Tatsuya Kirishima","Tear","Tech","Tekuno","Ten Bundles","Tenga","Tenharu No Ai","Tenjin Hagoromo","Terada Here","Tetsu Kamiyama","Tetsuya Hatanaka","Tetsuya Ichikawa","There Is Inari","Three Good Poems","Tikal","Tj Honda","Toba Iku","Toko Yoshinaga","Tokunaga Bookmark","Tomifumi","Tomita","Tomoe Arakaki","Tomoe Hikari","Tomohiro Abe","Tomoka Akari","Tomoka Mamiya","Tomoka Takase","Tomoko Kansaka","Tomoma Okumura","Tomomi Matsukawa","Tomomi Okanishi","Tomorrow Future","Tomorrow Mi Kanna","Tomorrows Flower","Tonga","Tonohanarin","Tony Oki","Tooru Ozawa","Top One Flower","Tortilla Suzuki","Toshii Iizuka","Toshiki Saeyama","Touha Shiraishi","Touka Udagawa","Towa Chikawa","Toy Boy Aizawa","Toyohiko Ishibashi","True North Prayer","Tsubaki Haruna","Tsubaki Kato (Kaoru Natsuki)","Tsubaki Rika","Tsubasa Hachino","Tsubasa Mai","Tsubomi Mochizuki","Tsuda Hotaru","Tsugumi Matsuzaka","Tsugumi Morimoto","Tsujimura","Tsukasa Aoi","Tsukasa Fujino","Tsukasa Hirata","Tsukasa Nagano","Tsukimi Wakaba","Tsukino Chrollo","Tsukino Luna","Tsukino Saito","Tsukino Sakura","Tsukinoe Sui","Tsumugi Akari","Tsuyopon","Tyson","Ueda Sana","Umekawa Arashi","Umi Hachiko","Umi Natsukawa","Umi Oikawa","Umino Firefly","Umizusaki Style","Umpai","Unexplored","Unno Salmon Roe","Uno Kanna (Abe Kanna)","Urakami Hinori","Urara Sasahara","Uraraka Rei","Uruki Sarara","Usami Sui","Usui Natsume","Usui Pass","Utano Heart","Waka Natsuki","Waka Ninomiya","Wakaba Onoe","Wakamiya","Wakana Sakura","Wakana Shiroyama","Wakatsuki Iroha","Wakatsuki Moa","Water Leaf","Watercolor Autumn","White Capital Four Seasons","White Cloud Candy","White Flower","White Flowers","White Peach Hana","Wolf Tanaka","Yamada Suzuna","Yaman","Yamashita Miyu","Yamori Wakana","Yanagida Yayoi","Yasu Daikichi","Yasuko Ogata","Yay Takashima","Yayoi Beach","Yo Ashida","Yo Yoshinaga","Yoda Hikage","Yoda Rin","Yoha Ishikawa","Yoichi Matsumoto","Yoji Agawa","Yokomiya Nanami","Yonezu","Yoshii Miki (Ryoko Izawa, Miki Yoshii)","Yoshiko Yamashita","Yoshimi Nitta","Yoshino Moriya","Yoshio Umeda","Yoshiya Minami","Yotsuba Kominato","You And Ayumi","Youku","Yu Asakura","Yu Hironaka","Yu Kawakami","Yu Kawakami (Shizuku Morino)","Yu Konishi","Yu Kuroi","Yu Sakura","Yu Sasamoto","Yua Araki","Yua Asakura","Yua Fukuda","Yua Imai","Yua Mikami","Yua Nanato","Yua Otoha","Yua Shimizu","Yuai Kana","Yubi On","Yuhi Shizuku","Yuho Hotaka","Yui Amanatsu","Yui Haruna","Yui Hatano","Yui Hiiragi","Yui Kato","Yui Kawagoe","Yui Kawai","Yui Mamiya","Yui Mihama","Yui Miho","Yui Misaki","Yui Nagase","Yui Natsuhara","Yui Nishikawa","Yui Nonami","Yui Sayama","Yui Shiomi","Yui Shirasaka","Yui Tojo","Yui Tomita","Yui Yamaguchi","Yuika Onozaka","Yuiki Rumina","Yuina Mitsuki","Yuji Yamada","Yuka Aota","Yuka Arai","Yuka Chiba","Yuka Hirose","Yuka Honjo","Yuka Hotaka","Yuka Ichii","Yuka Mizuno","Yuka Oshima","Yuka Sato","Yuka Tachibana","Yuka Tada","Yukari Miyazawa","Yukari Orihara","Yukari Shizuki","Yuki And A","Yuki Fukuda","Yuki Hanano","Yuki Hiiragi","Yuki Misa","Yuki Mizuki","Yuki Natsume","Yuki Nozomi","Yuki Rino","Yuki Seijyo","Yuki Shizuku","Yuki Suzu","Yuki Takeuchi","Yuki Wakaba","Yuki Yoshizawa","Yukie Mizukami","Yukiho Shirase","Yukiko Matsunaga","Yukimura Izuki","Yukimura Kina","Yukina Midwinter","Yukina Shida","Yukine Nagasaki","Yukine Sakuragi","Yukino Eru","Yukino Nagimiya","Yukis","Yukishiro Ichiho","Yukishiro Miho","Yuko Haruno","Yuko Ono","Yuko Tenkata","Yukyun","Yulia Kano","Yuma Asami","Yuma Kouda","Yuma Sano","Yume Kotoishi","Yume Nikaido","Yume Nishimiya","Yume Takeda","Yumeno Aika","Yumeno Noa","Yumi Aikawa","Yumi Anno","Yumi Imamura","Yumi Kazama","Yumi Mizusaki","Yumi Nagase","Yumi Nijimura","Yumika Saeki","Yumiko Sakura","Yumina Miyafuji","Yuna","Yuna Ayaba","Yuna Hasegawa","Yuna Hayashi","Yuna Hinano","Yuna Ishikawa","Yuna Kitano","Yuna Mitake","Yuna Mori","Yuna Ogura","Yuna Shiina","Yuna Takase","Yuno Asahi","Yuno Kisaragi","Yuno Makikawa","Yuno Yume","Yura Asakura","Yura Kana","Yura Kano","Yura Kudo","Yuri Adachi","Yuri Hanai","Yuri Hirose","Yuri Ikuta","Yuri Kudo","Yuri Morishita","Yuri Nikaido","Yuri Sasahara","Yuri Shinomiya","Yuri Shiraishi","Yuri Tadokoro","Yuri Yamada","Yuria Yoshine","Yurien Miori","Yurika Hiyama","Yurika Natsumi","Yuriko Mogami","Yuriko Takazono","Yurina Aizawa","Yurina Wakabayashi","Yurine Tsukino","Yurira","Yusuke Nishijima","Yuta Aoi","Yuta Imai","Yuta Shibuya","Yuto Izaki","Yuu Kitayama","Yuuha Kiriyama","Yuuka Murakami","Yuuki Iori","Yuuna Himekawa","Yuuna Shirahoshi","Yuuri Aise","Yuuri Asada","Yuuri Kirika","Yuuri Oshikawa","Yuuto Kuroda","Yuya Kubota","Yuyu Esumi","Yuzu Fujita","Yuzu Kitagawa","Yuzu Shirakawa","Yuzuki Cocona","Yuzuki Sunflower","Yuzuki Yuru","Yuzuna Minamotokawa","Yuzuru Yuuki"];
const CURATED_ACTORS_SET = new Set(CURATED_ACTORS_LIST.map(a => a.toLowerCase()));
const CURATED_ACTOR_NATIVE_MAP = {"aika":"Aika Miura","kana morisawa":"Kanako Iioka","mao ito":"Yuki Fujikawa, Susanna, Yuuki Tanihara","nozomi hazuki":"Kokoro Tsukino, Kokoro Hayama","ryu enami":"Ryu","yu kawakami":"Shizuku Morino"};
const CURATED_CATEGORIES_LIST = ["123av","16 Hours Or More","1pondo","30 Years Old","4 Hours Or More","40 Years Old","4K","8Kvr","Acme Orgasm","Acting","Actress Collection","Adopted Daughter","Adultery","Advertising Idol","Aesthetics And Massage","Affair","Ai-Generated Works","Anal Sex","Anchorwoman","Animation","Anus","Aphrodisiac","Apron","Artist","Asian Actress","Athlete","Aunt","Baby Face","Back","Ball Gag","Bareback","Bathing","Bathtub","Beautiful Breasts","Beautiful Butt","Beautiful Girl","Beautiful Legs","Beautiful Mature Woman","Beautiful Woman","Best","Best Porn","Big Ass","Big Breast Fetish","Big Breasts","Big Pennis","Big Tits","Bishri","Bitch","Black Hair","Black Male Actor","Blog","Blond","Blonde","Blow Mono","Bonus Images Included","Braless","Breast Milk","Bride","Bride / Young Wife","Bronze","Brown Hair","Bubble Bath","Bubble Socks","Bukkake","Bunny Girl","Business Clothing","Butt Fetish","By Idol","Call Girl","Campus Story","Candle","Car Sex","Caribbeancom","Caribbeancompr","Catwoman","Celebrity","Censored","Cheating","Cheating / Cuckold","Cheating Wife, Ntr, Cuckold","Cheerleaders","Cheongsam","Chief","Chijo","Childhood","Childish Face","Classic","Clinic","Close Up","Club Activity Manager","Collaborative Work","Collection","Coma","Confession Experience","Contribution","Cosplay","Couple","Creampie","Cruel","Cuckold","Cum In Mouth","Cunnilingus","Customs","Cute Little Boy","D Cup","Dance","Dark Style","Dating","Debut","Defecation","Delivery Only","Delusion","Dildo","Dirty Talk","Dirty Words","Distribution Only","Documentary","Doggy Style","Doll","Drink Urine","E Cup","Eat Pussy","Elder Sister","Emmanuel","Enema","English","English Subtitle","Entertainer","Erotic Photo","Esthetic Massage","Exclusive","Expose","Extreme Orgasm","F Cup","Face Ride","Famous","Fantasy","Fanza Limited","Fat Girl","father in law","favorite","Fc2","Fear","Female Boss","Female College Student","Female Doctor","Female Investigator","Female Ninja","Female Teacher","Female Warrior","Feminine","Fetish","Fighter","Fighting","Fingering","First Shoot","First Shot","First Time Filming","Fist","Flight Attendant","Foot Fetish","Footjob","Forced Blowjob","Foreign Actress","Foreign Object Penetration","Foreigner","Forty Years Old","Friend","Full Hd (Fhd)","G Cup","Gachinco","Gansha","Girl Guide","Glasses Girl","Grandfather","Grandma","Group Bukkake","Gym Suit","H Cup","Hair Salons And Massage Parlors","Hairlessness","Hardcore","Harem","Hatsuura","Hd","Heyzo","High Quality Vr","High School Girl","Hit On Boys","Hit On Girls","Homosexual","Horse Riding","Hot Girl","Hot Spring","Hotel","Hotel Owner","How To","Humiliation","Hysteroscope","Ignoring","Imprisonment","In Love","Incest","Incident","Individual","Ingo","Instant Sex","Insult","Interview","Its Pretty Clean","Japanese","Jav English Sub","Javtiful","Kimono","Kireina_Onesan","Kiss","Knee Socks","Kogal","Kounai Hassha","Lecturer","Lesbian","Lesbian Kiss","Limited Time","Lolita","Long Hair","M Female","M Male","Madou","Magical Girl","Maid","Male And Female Sex","Male Squirting","Maltreat","Married Woman","Mask","Massage","Massage Oil","Masturbate","Masturbation","Masturbation Support","Mature Woman","Mini Skirt","Mischief","Missy","Model","Mother","Mother Friend","Multiple Stories","Muscle","Naked Apron","Naughty4610","Nausea","Neat And Clean","New Student","Nice Ass","Nice Boobs","No Underwear","Nose Hook","Ntr","Nurse","Ol","One Piece Dress","Oral Ejaculation","Oral Firing","Oral Sex","Ordinary Person","Orgy","Original","Otaku","Other","Outdoor Exposure","Pacopacomama","Pantyhose","Pantyhose Thing","Partner Exchange","Petite","Physical Education","Piledriver","Planning","Plot","Pornstar","Pregnant","Pregnant Woman","Premature Ejaculation","Pretty Girl","Princess","Private Teacher","Promiscuity","Promiscuous","Prostitute","Proud Pussy","Pure","Queen","Racing Girl","Ranko","Rape","Realistic Version Of The Game","Receptionist","Reducing Mosaic","Reducing Mosaic English Subtitle","Rejuvenation Massage","Release","Reproduce","Restraint","Ride","Sailor Suit","Salt Wipe","Science Fiction","Scold","Secretary","Selfie","Semen","Set Product","Sex Friend","Sexy","Sexy Legs","Sf","Shame","Shaving","Short Hair","Short Skirt","Shower","Similar","Sister","Sistine","Slim","Slim Pixelated","Slim Waist","Slut","Sm","Small Breasts","Sneak Shots","Soapland","Soft Body","Sorority","Spanking","Sportswear","Squirting","Stepmother","Stewardess Ca","Stool","Subjective Perspective","Subordinate Or Colleague","Super Breasts","Swallow Sperm","Sweating","Sweet Ass","Swimsuit","Taiwan Model","Tall Lady","Tan","Teacher","Tentacle","Thanks Offering","Thirty","Tickle","Tied Up","Time Stops","Tit Job","Tokyohot","Torture","Toy","Transform To Heroine","Transgender","Transsexual","Transsexuals","Travel","Ultra Slim Pixelated","Uncensored","Uncensored leak","Uncensored Leaked","Underwear","Uniform","Urinate","Uterus","Various Occupations","Vibrating Egg","Vibrator","Vigne","Virgin","Vomit","Voyeur","Vr","Waitress","White Skin","Whites","Widow","Wife","Witch","With Bonus Video Only For Mgs","Xxxav","Yoga","Yokui","Young","Young Wife"];
const CURATED_CATEGORIES_SET = new Set(CURATED_CATEGORIES_LIST.map(c => c.toLowerCase()));
const DUPLICATE_VIDEO_CANONICAL_MAP = {"53162":"fc2-ppv-3601927-gokkun-rating-yu-maedas-athletes-tight-appearance-abdominal-skin-abdominal-oblique-s-53161","106257":"heyzo-2626-yu-nagata-yu-nagata-would-you-like-to-spear-with-an-amateur-girl-in-cosplay-31350","106258":"heyzo-2647-yui-kisaragi-yui-kisaragi-my-girlfriend-who-is-proud-of-her-fair-skin-was-messing-around-31351","106259":"heyzo-2646-rei-kitajima-kitajima-rei-pleasure-with-an-erotic-massage-in-the-case-of-rei-kitajima-31353","106260":"heyzo-2638-miyu-morita-honoka-orihara-miyu-morita-a-mans-dream-uhauha-reverse-3p-vol-7-31354","106261":"heyzo-2648-eiko-kobayashi-eiko-kobayashi-let-me-do-one-shot-i-tried-to-negotiate-with-a-mature-woman-31355","106262":"heyzo-2645-hina-hotaka-hina-hodaka-play-faced-married-woman-who-got-cuckold-in-the-swimming-class-31356","106263":"heyzo-2642-sara-21-sena-san-21-sara-nijuichi-sena-san-nijuichi-heisei-born-w-shaved-amateur-wife-is-31357","106264":"heyzo-2637-kotomi-yamasaki-kotomi-yamasaki-kotomi-yamasakis-hand-kiss-31358","106265":"heyzo-2636-miki-hoshino-miki-hoshino-my-friends-mother-was-too-erotic-to-be-patient-31359","106266":"heyzo-2644-akari-kato-akari-kato-insert-it-into-her-spoiled-and-m-girlfriend-and-its-inside-31336","106267":"heyzo-2634-reina-hiiragi-hiragi-rena-a-yankee-young-wife-who-gets-caught-up-in-the-form-of-her-husba-31337","106268":"heyzo-2658-an-takase-an-takase-ill-give-you-a-pie-with-an-takase-31362","106269":"heyzo-2657-jessica-takizawa-takizawa-jessica-ona-rimaku-and-guchogucho-cum-sexual-intercourse-with-n-31363","106270":"heyzo-2656-nami-minami-minami-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-3-31364","106271":"heyzo-2651-shiori-yamagishi-shiori-yamagishi-spear-rolling-with-a-lewd-new-wife-31365","106272":"heyzo-2655-mica-mikuru-kira-mikuru-pleasure-with-an-erotic-massage-in-the-case-of-mica-mikuru-31367","106273":"heyzo-2654-waveform-monet-namigata-mone-serve-in-uniform-agel-with-a-lot-of-comfort-31368","106274":"heyzo-2653-kyoko-moriguchi-kyoko-moriguchi-non-stop-acme-heaven-i-dont-want-it-31369","106275":"heyzo-2652-nana-ueyama-mana-kamiyama-cuckold-your-fiancee-betrayed-by-a-colleague-of-the-company-31370","106276":"heyzo-2668-shrima-shurima-just-taken-this-week-and-released-immediately-amateur-russian-daughter-2-t-31371","106277":"heyzo-2650-uika-hoshikawa-uika-hoshikawa-hand-kiss-of-uika-hoshikawa-31348","106278":"heyzo-2649-sera-asaka-sera-asaka-soggy-french-kiss-tight-sex-entwined-tongue-31349","106279":"heyzo-1642-nonstop-acme-heaven-i-want-a-lot-31374","106280":"heyzo-1641-i-will-serve-you-naked-cute-maid-struggle-31375","106281":"heyzo-2666-kazuki-sakura-kazuki-sakura-ill-give-you-a-pie-with-kazuki-sakura-31376","106282":"heyzo-2665-yume-yokoyama-mayume-yokoyama-i-got-a-full-body-of-my-little-daughter-31377","106283":"heyzo-2664-noriko-sasaki-noriko-sasaki-non-stop-acme-heaven-ive-done-a-lot-of-obscene-things-31378","106284":"heyzo-2663-maki-koizumi-maki-koizumi-i-got-the-full-body-of-a-beautiful-busty-mature-woman-31379","106285":"heyzo-2662-mashiro-seto-setomashiro-blame-seto-mashiro-as-a-toy-31381","106286":"heyzo-2661-dew-pear-ayase-tsuyuri-ayase-my-exclusive-maid-vol-13-that-can-be-immediately-fucked-31382","106287":"heyzo-2660-chihiro-hinata-hina-tachihiro-a-chubby-married-womans-handsome-affair-31383","106288":"heyzo-2659-non-suzumiya-suzumiya-non-an-obscene-video-letter-of-an-immoral-wife-31360","106289":"heyzo-2670-mr-and-mrs-miyazaki-miyazaki-fusai-heisei-born-amateur-shaved-wife-2-holes-request-traini-31361","106290":"heyzo-2675-nana-ueyama-mana-kamiyama-after-6-uncontrollable-lust-31386","106291":"heyzo-2679-mio-futaba-mio-futaba-ill-give-you-a-pie-with-mio-futaba-31388","106292":"heyzo-2678-akemi-kihara-akemi-kihara-im-in-the-middle-of-a-new-soap-lady-who-measures-immediately-31389","106293":"heyzo-2677-yu-nagata-yu-nagata-non-stop-acme-heaven-spear-rolling-from-noon-31390","106294":"heyzo-2676-miyu-morita-miyu-morita-a-beautiful-big-tits-married-woman-who-has-cuckolded-in-a-swimmin-31391","106295":"heyzo-2689-tin-suzu-the-truth-about-a-girl-who-was-aiming-to-be-a-black-sheep-idol-in-me-but-was-awa-31392","106296":"heyzo-2674-yuna-tachibana-yuna-tachibana-yuna-tachibanas-hand-kiss-31393","106297":"heyzo-2673-ryu-enami-enami-ryu-a-beautiful-female-teacher-who-has-been-cuckolded-31394","106298":"heyzo-2672-miho-oyama-miho-oyama-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-4-31395","106299":"heyzo-2667-hina-hotaka-hina-hodaka-i-tried-to-sleep-a-frustrated-playcare-worker-31372","106300":"heyzo-2688-ton-jenny-warn-tonjiniwaan-new-set-of-3-ton-jenny-warn-31373","106301":"heyzo-2693-yui-fujisaki-yui-fujisaki-i-got-a-full-body-of-a-beautiful-girl-who-seems-to-be-in-the-ba-31398","106302":"heyzo-2687-non-suzumiya-suzumiya-non-i-got-the-full-body-of-an-idol-class-beautiful-girl-31399","106303":"heyzo-2694-hina-hotaka-hina-hodaka-physical-negotiations-with-a-baby-faced-beautiful-girl-with-luxur-31400","106304":"heyzo-2692-kate-keito-blonde-playta-girl-creampie-kate-31401","106305":"heyzo-2686-akari-asagiri-akari-asagiri-pleasure-with-an-erotic-massage-in-the-case-of-asagiri-hikaru-31402","106306":"heyzo-2685-aya-tanaka-aya-tanaka-if-you-want-a-job-lets-do-it-cuckold-to-a-vicious-producer-31403","106307":"heyzo-2684-hana-takasaki-hana-takasaki-non-stop-acme-heaven-i-was-excited-by-the-petite-restraint-31404","106308":"heyzo-2683-shiori-yamagishi-shiori-yamagishi-play-with-a-slender-beauty-in-4p-vol-2-31405","106309":"heyzo-2691-title-taitoru-super-large-amount-of-vaginal-cum-shot-with-no-questions-asked-to-a-delicat-31406","106310":"heyzo-2682-yuuna-himekawa-yuna-himekawa-yuuna-himekawa-is-toyed-31407","106311":"heyzo-2681-miki-hoshino-miki-hoshino-immorality-of-a-female-teacher-a-nasty-teacher-who-seduces-stud-31384","106312":"heyzo-2680-yoshiko-udaka-iko-udakake-dirty-masochistic-amateur-girls-31385","106313":"heyzo-2719-alicia-arisia-blond-play-who-is-not-enthusiastic-about-having-sex-with-an-old-man-and-sec-31410","106314":"heyzo-2704-saya-otomi-saya-otomi-ill-give-you-a-pie-with-saya-otomi-31411","106315":"heyzo-2703-misao-himeno-misao-hime-i-want-stimulation-so-i-made-my-av-debut-vol-2-31412","106316":"heyzo-2702-aya-tamano-tama-no-aisa-non-stop-acme-heaven-enjoy-puru-puru-big-breasts-31413","106317":"heyzo-2701-emi-sakurai-emi-sasara-i-tried-to-do-a-lot-of-obscene-things-to-a-bewitching-married-woma-31414","106318":"heyzo-2718-mr-and-mrs-mizuno-mizu-no-fusai-myu-amateur-shaved-wife-breast-milk-swap-continuous-forge-31415","106319":"heyzo-2699-miku-aoyama-aoyama-miku-pleasure-with-an-erotic-massage-efbd9e-in-the-case-of-miku-aoyama-31416","106320":"heyzo-2698-ayase-dewashi-ayase-tsuyuri-miss-god-milk-soap-will-serve-you-a-lot-31417","106321":"heyzo-2697-otsukis-otsukis-cherry-boys-brush-wholesale-vol-6-without-telling-her-husband-31418","106322":"heyzo-2741-honoka-orihara-honoka-orihara-my-daughter-in-law-who-is-proud-of-her-big-tits-was-messing-31419","106323":"heyzo-2695-hiromi-okura-yu-toyoda-hiromi-okura-died-with-a-double-blow-job-hiromi-okura-and-yu-toyod-31397","106324":"heyzo-2713-misaki-aki-aki-misaki-frustrated-spear-wanting-to-defeat-saffle-31422","106327":"heyzo-2721-momoka-ogawa-momoka-ogawa-the-most-erotic-busty-girl-is-the-lowest-woman-who-loves-cuckol-31423","106328":"heyzo-2711-miku-aoyama-miku-aoyama-miku-aoyamas-hand-kiss-31425","106329":"heyzo-2710-ryu-enami-enami-ryu-a-busty-wife-who-gets-fucked-in-the-form-of-her-husbands-debt-31426","106330":"heyzo-2709-fuyumi-onodera-fuyumi-onodera-suddenly-would-you-like-to-see-my-rough-chin-my-favorite-ty-31427","106331":"heyzo-2708-asaka-sera-asaka-sera-it-became-a-sloppy-relationship-with-a-healing-busty-office-lady-wh-31428","106332":"heyzo-2720-mei-mei-the-forbidden-area-where-teachers-who-want-to-be-healed-and-spoiled-by-the-develo-31429","106333":"heyzo-2707-ayane-sakurai-ayane-so-much-ayane-sakurai-is-toyed-31430","106334":"heyzo-2706-aya-tanaka-aya-tanaka-aya-will-serve-you-online-31431","106335":"heyzo-2705-kurihara-kozue-kurihara-kozue-i-put-on-a-swimsuit-on-my-amateur-girl-vol-2-31408","106337":"heyzo-2728-manami-ueno-manami-ueno-manami-uenos-handjob-kiss-vol-2-31434","106339":"heyzo-2727-ayase-dewashi-ayase-tsuyuri-netorare-your-fiancee-playing-with-marshmallow-body-31435","106341":"heyzo-2726-aya-tamano-tama-no-aisa-wet-and-wet-amateur-girls-with-toys-were-used-as-toys-31436","106343":"heyzo-2725-emi-sakurai-emi-sakura-mature-soap-lady-will-serve-netri-vol-4-31437","106345":"heyzo-2739-mr-and-mrs-kinoshita-kinoshita-fusui-amateur-sana-wife-lesbian-kunni-breast-milk-squeezin-31438","106347":"heyzo-2724-kisa-higashimine-kisa-azuma-pleasure-with-an-erotic-massage-efbd9e-in-the-case-of-higashi-31439","106349":"heyzo-2723-kei-misaka-misaka-mei-one-after-another-during-life-continuous-injection-into-a-horny-wom-31440","106351":"heyzo-2722-yukari-sato-yurika-sato-dont-take-your-eyes-off-saddle-while-looking-at-the-camera-vol-3-31441","106353":"heyzo-2712-nana-shirai-shiraina-ona-rimaku-and-guchogucho-cum-sexual-intercourse-with-nadsukebe-musu-31442","106355":"heyzo-2738-melody-merodii-continuous-vaginal-cum-shot-to-super-beautiful-girl-melody-31443","106357":"heyzo-2715-honoka-orihara-honoka-orihara-ill-give-you-a-pie-with-honoka-orihara-31420","106359":"heyzo-2714-reina-hataki-beautiful-mizu-i-mischievously-played-with-a-slender-mature-woman-who-came-t-31421","106361":"heyzo-2736-nana-shirai-shiraina-miss-beautiful-breast-soap-will-serve-you-31446","106363":"heyzo-2770-mr-and-mrs-goto-37-years-old-amitan-19-years-old-31447","106365":"heyzo-2735-sasai-koizumi-saya-koizumi-handjob-kiss-of-sasai-koizumi-31448","106367":"heyzo-2734-aya-tanaka-aya-tanaka-a-chubby-whitening-and-filthy-office-lady-frustration-is-resolved-w-31449","106369":"heyzo-2733-mirai-minano-mirai-minano-amateur-girl-who-gets-squid-in-graffiti-play-vol-3-31450","106371":"heyzo-2732-mai-shirakawa-shirakawamai-after-6-i-want-you-to-blame-me-31451","106373":"heyzo-2769-rika-pamela-rika-pamela-super-beautiful-girl-rika-chan-second-work-and-super-bitch-pamela-31452","106375":"heyzo-2731-haruka-aizawa-haruka-aizawa-ill-give-you-a-pie-with-haruka-aizawa-31453","106377":"heyzo-2730-misao-himeno-misao-hime-fired-one-after-another-to-the-whitening-body-31454","106379":"heyzo-2729-airi-suma-airi-suma-i-had-an-amateur-girl-cum-swallow-vol-2-31455","106381":"heyzo-2716-hina-hotaka-hina-hodaka-i-was-sick-of-my-neighbor-who-seemed-to-be-unpleasant-in-light-cl-31432","106385":"heyzo-2750-chris-aoki-aoki-kurisu-dirty-seduction-of-a-mature-slut-ill-lick-a-lot-31458","106386":"heyzo-2749-fuyuki-ryoko-fuyuki-ryoko-i-who-aspire-to-be-an-av-actress-have-completed-my-av-debut-31459","106387":"heyzo-2748-honoka-orihara-honoka-orihara-ive-been-inserted-into-my-naughty-older-sister-vol-3-31460","106388":"heyzo-2747-aoi-kasahara-aoi-kasahara-pleasure-with-an-erotic-massage-in-the-case-of-aoi-kasahara-31462","106389":"heyzo-2746-shiho-nagamine-shiho-nagamine-obscene-service-of-a-naked-housekeeper-31463","106390":"heyzo-2745-hitomi-taoka-hitomi-taoka-i-got-an-amateur-girl-to-swallow-vol-3-31464","106391":"heyzo-2696-maki-koizumi-maki-koizumi-beautiful-female-teacher-who-has-netorare-vol-2-31465","106392":"heyzo-2744-nanako-asahina-nanako-asahina-its-cool-with-nanako-asahinas-footjob-31467","106393":"heyzo-2743-yui-shinjo-yui-shinjo-ejaculation-in-the-vagina-to-a-slut-who-blames-words-in-a-yukata-31444","106395":"heyzo-2742-yuko-tenkata-yuko-amakata-defeated-a-busty-fine-mature-woman-saffle-31445","106397":"heyzo-2759-rii-takasaki-rii-takasaki-ill-give-you-a-pie-with-rii-takasaki-31471","106398":"heyzo-2758-manaka-ashida-manaka-ashida-spear-with-her-all-the-time-in-her-longing-cohabitation-life-31472","106399":"heyzo-2757-ritsuko-yoneda-yoneda-ritsuko-suddenly-inserted-into-a-confused-amateur-girl-31473","106400":"heyzo-2761-minami-fujii-fujii-minami-i-got-a-full-body-of-a-fair-skinned-girl-vol-2-31474","106401":"heyzo-2782-miyu-miyu-gender-bouga-this-woman-is-the-last-woman-this-year-the-finest-woman-who-devote-31475","106402":"heyzo-2755-mikan-kururugi-kururugi-mikan-its-cool-with-the-footjob-of-mikan-kururugi-31476","106403":"heyzo-2754-yua-uehara-yua-uehara-mature-soap-lady-will-serve-netri-vol-5-31477","106404":"heyzo-2753-ayane-morinaga-morina-ayane-i-made-her-3p-in-the-first-av-31478","106405":"heyzo-2752-leo-tsubaki-tsubaki-leo-the-affair-partner-is-too-erotic-and-drowned-31479","106406":"heyzo-2781-hannah-hanna-blindfolded-and-handcuffed-blonde-lori-as-much-as-you-want-let-me-say-put-it-31456","106407":"heyzo-2773-haruna-kawai-cute-haruna-indecent-temptation-of-an-amateur-slut-lick-a-lot-and-agel-31482","106408":"heyzo-2768-emiri-momota-emiri-momota-beautiful-female-teacher-who-has-netorare-vol-3-31483","106409":"heyzo-2785-liz-riz-a-teenage-sports-girl-and-a-60th-birthday-uncle-make-a-vaginal-cum-shot-with-love-31484","106410":"heyzo-2767-anri-tachibana-anri-tachibana-anri-tachibana-has-leaked-31485","106411":"heyzo-2766-ryu-enami-enami-ryu-extremely-hard-3-hole-blame-vol-2-31486","106412":"heyzo-2765-rio-yamaguchi-rio-yamaguchi-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-5-31487","106413":"heyzo-2760-nana-shirai-shiraina-play-with-a-neat-and-clean-beauty-with-4p-31488","106414":"heyzo-2784-minami-minami-giirls-31489","106415":"heyzo-2764-minami-sakamoto-minami-sakamoto-minami-sakamotos-footjob-is-cool-31490","106416":"heyzo-2774-haruka-nishimoto-haruka-nishimoto-i-love-irama-de-m-haruka-chan-31491","106417":"heyzo-2762-otsukis-otsukino-indecent-temptation-of-a-mature-slut-agel-grants-m-mans-wish-31468","106418":"heyzo-2756-mai-shirakawa-shirakawamai-unequaled-sexual-intercourse-of-a-long-distance-couple-taste-h-31469","106419":"heyzo-2786-tsuru-no-yu-tsuru-no-yu-tsuru-no-yu-has-leaked-31494","106420":"heyzo-2800-yua-uehara-yua-uehara-hope-for-anal-development-a-mature-womans-wish-will-come-true-31495","106421":"heyzo-2799-mai-hazuki-hazuki-mai-non-stop-acme-heaven-defeat-humble-amateur-girls-31496","106422":"heyzo-2776-mai-shirakawa-shirakawamai-ive-been-inserted-into-my-naughty-older-sister-vol-4-31497","106423":"heyzo-2807-asami-asami-girls-31498","106425":"heyzo-2798-asuka-asuka-ill-give-you-a-pie-with-asuka-31499","106426":"heyzo-2778-kana-kimura-kana-kimura-non-stop-acme-heaven-play-with-me-who-is-m-31501","106427":"heyzo-2763-eri-saeki-saekieri-all-you-can-do-on-a-hot-spring-trip-defeat-a-little-woman-31502","106428":"heyzo-2775-aira-aira-airas-hand-kiss-31480","106429":"heyzo-2777-chris-aoki-aoki-kurisu-widows-carnal-vol-4-31481","106430":"heyzo-2793-rina-kawamura-rina-kawamura-i-got-all-the-body-of-big-breasts-vol-3-31506","106431":"heyzo-2792-wato-kokoro-wato-kokoro-pleasure-with-an-erotic-massage-in-the-case-of-wato-kokoro-31508","106432":"heyzo-2814-mio-futaba-mio-futaba-when-you-want-to-spear-spear-saddle-the-best-mistress-31509","106433":"heyzo-2790-moe-yamada-moe-yamada-insert-with-sokko-ikinarizubozubo-to-an-amateur-woman-31510","106434":"heyzo-2780-leo-tsubaki-tsubaki-leo-after-6-veteran-office-ladies-like-pacifiers-31511","106436":"heyzo-2809-natsu-natsu-giirls-31512","106437":"heyzo-2789-rei-furuse-furusei-cool-with-rei-furuses-ass-31513","106438":"heyzo-2788-manaka-ashida-manaka-ashida-i-was-crazy-about-it-31514","106439":"heyzo-2787-hitomi-yanai-hitomi-yanai-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-6-31515","106440":"heyzo-2805-minami-sawada-minami-sawada-miss-god-milk-soap-will-serve-you-vol-2-31492","106442":"heyzo-2808-kate-pippi-kate-pippi-a-new-work-that-i-just-took-last-week-to-give-a-vaginal-cum-shot-to-31493","106444":"heyzo-2827-aya-tanaka-aya-tanaka-taking-a-new-maid-and-training-her-31518","106446":"heyzo-2811-yukiko-fujimoto-yukiko-fujimoto-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-7-31519","106447":"heyzo-2821-mai-shirakawa-shirakawamai-i-got-the-whole-body-of-a-slender-beauty-31520","106448":"heyzo-2819-candy-kyandii-super-overwhelming-beautiful-girl-french-teenager-raw-vaginal-cum-shot-than-31521","106450":"heyzo-2802-akari-satsuki-akari-satsuki-akari-satsukis-ass-is-cool-31522","106451":"heyzo-2810-rio-ayanami-ayanami-rio-i-want-to-be-blamed-by-a-filthy-amateur-mature-woman-vol-6-31523","106452":"heyzo-2801-shinonome-tsukasa-shinonome-tsukasa-insert-with-sokko-ikinarizubozubo-to-an-amateur-woman-31524","106453":"heyzo-2797-emiri-momota-emiri-momota-ill-suck-you-slowly-volume-2-31525","106454":"heyzo-2818-hitomi-hitomi-married-woman-bouga-urgent-notice-g-style-wifes-chestnut-has-a-full-erectio-31526","106455":"heyzo-2796-chika-sugiyama-machika-sugiyama-chika-sugiyamas-hand-kiss-31527","106457":"heyzo-2795-yukiho-shirase-yukiho-shirase-ive-been-messing-around-with-a-plump-married-woman-who-is-t-31504","106460":"heyzo-2794-mai-sasaki-sasaki-mai-its-a-love-love-with-a-slender-beauty-you-took-home-sex-31505","106461":"heyzo-2850-nana-nana-summer-vacation-with-my-uncle-and-my-little-pie-31530","106462":"heyzo-2824-sakiko-mihara-sakiko-mihara-sakiko-mihara-has-leaked-31531","106463":"heyzo-2823-aoi-shinomiya-aoi-shinomiya-fair-skinned-beautiful-breasts-ol-in-the-office-31532","106464":"heyzo-2822-miru-susaki-miru-susaki-i-put-on-a-naughty-swimsuit-for-my-amateur-girl-vol-4-31533","106465":"heyzo-2816-minami-sawada-minami-sawada-ona-rimaku-and-guchogucho-cum-sexual-intercourse-with-nadsuke-31534","106466":"heyzo-2815-mikuro-komori-mikuro-komori-ill-give-you-a-pie-with-mikuro-komori-31536","106467":"heyzo-2803-eri-saeki-eri-saeki-an-obscene-secret-of-an-immoral-wife-that-can-not-be-said-to-her-husb-31537","106468":"heyzo-2813-kaho-kamina-kaho-kamina-ive-thoroughly-enjoyed-a-busty-amateur-girl-vol-8-31538","106469":"heyzo-2804-kanon-ibuki-ibuki-kanon-the-most-erotic-busty-girl-is-the-lowest-woman-who-loves-cuckold-31539","106470":"heyzo-2820-sarah-further-girl-31516","106471":"heyzo-2812-ami-ami-ami-has-leaked-adult-videos-heyzo-31517","106472":"heyzo-2834-mei-shibuya-shibuya-mei-i-made-a-toy-with-an-amateur-girl-who-got-wet-with-a-toy-vol-2-31542","106473":"heyzo-2833-kotomi-yuzu-kotomi-yuzu-i-fell-asleep-on-my-frustrated-best-friend-kanojo-31543","106474":"heyzo-2832-sumire-mika-sumire-mika-sumire-mika-licks-and-sucks-31545","106475":"heyzo-2831-yukiho-shirase-yukiho-shirase-ill-comfort-you-with-soft-erotic-milk-vol-2-31546","106476":"heyzo-2830-noeru-misawa-noeru-misawa-frustrated-spear-wanting-to-defeat-saffle-vol-2-31547","106477":"heyzo-2829-haruka-sanada-haruka-sanada-my-mistress-who-is-too-great-playing-with-a-sensitive-body-31548","106478":"heyzo-2851-kate-pippi-kate-pippi-you-can-do-anything-if-you-are-fine-you-can-also-do-3p-during-life-31549","106479":"heyzo-2828-sari-nakamura-sari-nakamura-ill-give-you-a-pie-with-sari-nakamura-31550","106480":"heyzo-2855-yuko-tenkata-yuko-amakata-an-obscene-secret-of-an-immoral-wife-that-can-not-be-said-to-he-31551","106482":"heyzo-2826-moe-yamada-moe-yamada-non-stop-acme-heaven-until-the-puzzle-turns-into-pleasure-31528","106483":"heyzo-2825-hana-aoyama-aoyama-hana-an-obscene-secret-of-an-immoral-wife-that-can-not-be-said-to-her-31529","106501":"heyzo-2844-ryu-enami-ryu-enami-ill-fuck-you-with-ryu-enamis-pie-31554","106502":"heyzo-2843-rina-kashino-rina-kashinori-the-case-of-being-picked-up-by-a-gal-slut-31555","106503":"heyzo-2842-fumika-uno-fumika-uno-frustrated-frustrated-fuck-hungry-saffle-fucked-and-fucked-vol-3-31556","106504":"heyzo-2841-kanon-ibuki-kanon-ibuki-fuck-from-behind-plump-buttocks-that-cant-stand-patience-31557","106505":"heyzo-2858-dulcie-darushii-if-you-insert-it-your-face-will-turn-bright-red-and-you-will-pant-31558","106506":"heyzo-2840-nana-natsume-natsume-nana-nana-natsume-licks-and-sucks-31559","106507":"heyzo-2839-mai-sasaki-mai-sasaki-a-rookie-soap-lady-who-immediately-measures-it-and-cums-inside-vol-31560","106508":"heyzo-2838-kitano-kii-kitano-kii-i-tried-to-tie-up-an-amateur-girl-31561","106509":"heyzo-2837-mai-seta-setamai-an-unlucky-wife-who-was-toyed-with-by-her-useless-husbands-boss-31562","106510":"heyzo-2853-mayu-mayu-the-black-sheep-in-me-im-inevitable-to-be-jealous-of-a-beautiful-girl-with-a-g-31563","106511":"heyzo-2836-jessica-takizawa-jessica-takizawa-jessica-takizawa-handjob-31540","106513":"heyzo-2835-sanae-yamaguchi-sanae-yamaguchi-slutty-and-lascivious-sex-with-outstanding-style-31541","106516":"heyzo-2857-mai-seta-setamai-i-received-the-body-of-a-beautiful-girl-with-a-clear-eye-31566","106520":"heyzo-2861-yumi-yumi-giirlsbouga-mecha-beautiful-breasts-e-cup-yumis-first-av-experience-gets-lost-i-31568","106522":"heyzo-2862-kei-kiyomiya-kei-kiyomiya-cosplay-sex-with-mature-saffle-31569","106524":"heyzo-2854-maki-chinen-chinamaki-an-amateur-girl-who-loves-irama-and-cant-get-enough-31570","106525":"heyzo-2791-moena-nishiuchi-moena-nishiuchi-thoroughly-training-a-newcomer-soapland-lady-31571","106528":"heyzo-2860-izumi-izumi-a-pink-genital-girl-has-become-an-uncontrollable-erotic-girl-vol-02-31572","106530":"heyzo-2848-yuka-sayama-yuka-sayama-hand-job-of-yuka-sayama-31573","106532":"heyzo-2847-rio-ayanami-mirio-ayanami-a-mature-soap-lady-will-serve-you-vol-6-31574","106534":"heyzo-2846-minori-aoi-minori-aoi-well-have-a-plump-amateur-girl-in-a-uniform-costume-31575","106536":"heyzo-2845-haruka-sanada-haruka-sanada-i-like-sweaty-men-saddle-defeat-a-perverted-ol-31552","106538":"heyzo-2859-yuuka-yuka-sexual-gou-bouga-today-mr-s-will-have-yuka-a-20-year-old-female-college-studen-31553","106540":"heyzo-2872-minami-nakata-minami-nakata-squeezing-all-the-way-to-the-back-of-her-throat-i-felt-pleasu-31578","106542":"heyzo-2871-tomoe-kahara-tomoe-kahara-i-restrained-a-masochistic-mature-woman-and-fucked-her-31579","106546":"heyzo-2900-aoi-aoi-a-super-gentle-and-serious-girl-screams-with-a-raw-cock-unexpected-gasping-and-co-31581","106548":"heyzo-2868-misa-makise-misa-makise-ill-give-you-a-smash-with-misa-makises-pie-vol-2-31582","106550":"heyzo-2870-rina-kashino-rina-kashinori-my-playhood-friend-gal-comforted-me-with-a-naughty-lesson-31583","106552":"heyzo-2866-kyoko-hanayama-kyoko-hanayama-i-called-a-mature-woman-river-and-tried-to-shoot-av-31584","106554":"heyzo-2865-rin-hinami-rin-hinami-i-was-taught-various-things-by-a-senior-office-worker-who-seems-to-31585","106556":"heyzo-2899-mimi-mimi-girls-31586","106558":"heyzo-2864-hitomi-hitomi-im-cool-with-hitomis-butt-31587","106560":"heyzo-2867-miru-suzaki-miru-suzaki-i-received-the-body-of-a-shaved-girl-with-a-cute-smile-31564","106562":"heyzo-2863-ayumi-kayama-ayumi-kayama-nonstop-acme-heaven-enjoy-beautiful-big-tits-31565","106563":"heyzo-2903-evie-ii-raw-vaginal-cum-shot-to-a-russian-beauty-with-a-transcendental-style-it-was-inten-31590","106564":"heyzo-2878-mirai-natsukawa-miku-natsukawa-ill-fuck-you-with-mirai-natsukawas-pie-adult-videos-heyzo-31591","106565":"heyzo-2887-rina-suzuki-suzuki-rina-obscene-secrets-of-an-immoral-wife-who-cant-tell-her-husband-vol-31592","106566":"heyzo-2877-mizue-miura-miura-mizue-if-i-was-frustrated-and-my-senior-was-alone-in-the-room-adult-vid-31593","106567":"heyzo-2890-miki-hoshino-miki-hoshino-obscene-secrets-of-an-immoral-wife-who-cant-tell-her-husband-vo-31594","106568":"heyzo-2902-miwa-miwa-the-black-sheep-inside-me-i-was-fascinated-by-the-charm-of-a-petite-d65-bowl-sh-31595","106569":"heyzo-2876-kanna-kitayama-kanna-kitayama-service-with-your-mouth-kanna-kitayama-uses-tongue-porn-vid-31596","106570":"heyzo-2875-shirakawa-haru-shirakawa-haru-netorare-desires-i-will-fulfill-the-wishes-of-a-perverted-c-31597","106571":"heyzo-2874-mami-tatsumi-tatsumami-suddenly-would-you-like-to-see-my-rough-dick-get-ching-gold-with-a-31598","106572":"heyzo-2886-nami-amuro-nami-amuro-i-hate-it-i-love-it-beautiful-office-lady-who-lived-with-her-boss-c-31599","106573":"heyzo-2901-misa-misa-girls-31576","106574":"heyzo-2873-rena-rena-ill-fuck-you-with-renas-pie-vol-2-31577","106583":"heyzo-2892-tsubaki-kawana-tsubaki-kawana-i-thoroughly-enjoyed-a-busty-amateur-girl-vol-9-porn-videos-31602","106584":"heyzo-2884-mai-shirakawa-shirakawamai-lets-make-her-squid-with-halloween-costume-adult-videos-heyzo-31603","106586":"heyzo-2920-kei-kei-girls-bouga-a-blond-yankee-older-sister-who-seems-to-break-out-with-her-young-fac-31604","106588":"heyzo-2909-kisumi-inori-kisumi-inori-kisumi-inori-licks-and-sucks-adult-videos-heyzo-prayer-kisumi-31605","106590":"heyzo-2904-maki-hamada-maki-hamada-i-injected-a-lot-of-semen-into-a-greedy-mature-woman-vol-2-adult-31606","106592":"heyzo-2883-maki-chinen-chinenmaki-boss-and-subordinate-are-one-in-the-same-in-celebration-of-the-sig-31607","106594":"heyzo-2891-minami-fujii-minami-fujii-one-after-another-namachu-dirty-slender-body-porn-videos-heyzo-31608","106596":"heyzo-2919-reika-reika-girls-bouga-j0-gold-rush-reika-chan-who-doesnt-like-the-old-man-is-the-cutest-31609","106598":"heyzo-2882-chiaki-saeki-chiaki-saeki-i-want-you-to-lick-me-with-a-face-sitting-for-chiaki-saeki-porn-31610","106600":"heyzo-2881-rina-kashino-rina-kashinori-if-you-want-a-job-let-her-do-it-if-you-want-to-become-famous-31611","106602":"heyzo-2880-aki-watanabe-aki-watabe-a-plump-and-frustrated-young-wife-in-m-porn-videos-heyzo-31588","106604":"heyzo-2912-rino-sakuragi-sakuragiri-i-will-solve-your-sexual-problems-a-pacifier-is-not-cheating-adu-31589","106606":"heyzo-2905-miyabi-miyabi-miyabis-ass-is-cool-adult-videos-heyzo-31614","106608":"heyzo-2907-ai-shirakawa-ai-shirakawa-i-injected-a-lot-of-semen-into-a-horny-mature-woman-delivery-he-31615","106610":"heyzo-2885-azumi-kirino-azumi-kirino-i-learned-a-lot-from-my-impudent-colleague-adult-videos-heyzo-31617","106611":"heyzo-2922-keina-keina-looking-for-girlsbouga-sns-an-18-year-old-model-aspiring-gal-with-outstanding-31618","106614":"heyzo-2898-mio-futaba-mio-futaba-i-had-mio-futaba-suck-me-all-the-way-to-the-back-of-my-throat-adult-31619","106616":"heyzo-2896-sanae-hosoda-sanae-hosoda-obscene-secrets-of-an-immoral-wife-who-cant-tell-her-husband-vo-31620","106618":"heyzo-2895-ritsuko-kawano-ritsuko-kawano-lets-make-an-amateur-girl-squid-by-petty-restraint-adult-vi-31621","106620":"heyzo-2888-minami-nakata-minami-nakata-after-6-lick-your-sensitive-nipples-31622","106622":"heyzo-2921-simon-simon-new-work-scandinavian-overwhelming-beauty-some-people-naturally-have-a-body-l-31623","106624":"heyzo-2893-tomori-nanaha-tomori-nanaha-ill-fuck-you-with-nana-tomoris-pie-31600","106626":"heyzo-2894-kanade-miyasaka-kanade-miyasaka-obscene-secrets-of-an-immoral-wife-who-cant-tell-her-husb-31601","106628":"heyzo-2910-satomi-ishikawa-satomi-ishikawa-i-received-every-bit-of-the-body-of-a-baby-faced-girl-wit-31626","106630":"heyzo-2937-ichino-ichino-giirls-31627","106632":"heyzo-2914-miura-emiri-miura-emiri-i-want-you-to-lick-me-with-a-face-sitting-for-emiri-miura-porn-vi-31628","106634":"heyzo-2915-ema-kato-31629","106636":"heyzo-2913-minori-aoi-minori-aoi-i-thoroughly-enjoyed-busty-amateur-girls-vol-10-porn-videos-heyzo-a-31630","106638":"heyzo-2923-momoka-ogawa-momoka-ogawa-masturbating-and-drenched-climax-sex-with-a-lewd-girl-vol-26-po-31631","106640":"heyzo-2927-nao-fujishima-nao-fujishima-nao-fujishima-licks-and-sucks-adult-videos-heyzo-31633","106642":"heyzo-2911-honoka-orihara-honoka-orihara-my-lover-who-is-too-awesome-big-tits-horny-woman-who-is-goo-31634","106644":"heyzo-2908-aoi-satsuki-aoi-satsuki-fucking-a-very-erotic-amateur-girl-at-a-love-hotel-31635","106646":"heyzo-2906-miki-hoshino-miki-hoshino-consecutive-ejaculation-to-a-beautiful-mature-woman-who-loves-c-31612","106648":"heyzo-2935-kozue-kozue-girls-bouga-g-style-female-college-student-festival-the-waist-and-brown-skin-31613","106748":"heyzo-3234-heyzo-3234-31947","106749":"heyzo-3174-i-have-only-one-female-to-choose-from-and-i-also-have-a-free-job-to-wash-my-genitals-31948","106750":"heyzo-3218-nagase-nako-nagasa-nako-after-6-all-free-beaks-31949","106751":"heyzo-3233-nana-mizuki-nana-mizuki-an-18-year-old-female-college-student-who-looks-like-a-female-col-31950","106752":"heyzo-0134-warikirihami-breast-girl-advent-part-2-31951","106753":"heyzo-3217-miyu-morita-grabs-me-and-sucks-me-straight-into-the-deep-throat-31952","106754":"heyzo-3175-i-am-a-private-person-with-a-large-breasted-cosplay-girl-volume-2-31953","106755":"heyzo-0109-warikirihami-breast-girl-advent-part-1-31954","106756":"heyzo-3210-kazuto-no-miko-beauty-collection-vol-6-31955","106757":"heyzo-3221-nagisa-shinohara-nagisa-shinohara-continuous-shooting-creampie-sanmaji-vol-3-31956","106758":"heyzo-3232-normally-liao-tianjoshi-31933","106759":"heyzo-3209-erena-sasamiya-sucks-straight-into-the-deep-throat-31934","106760":"heyzo-3236-a-story-related-to-takaho-yogas-best-friends-mothers-birth-vol-2-31959","106761":"heyzo-3245-a-masculine-dream-reverse-3p-volume-13-31960","106762":"heyzo-3228-rina-kawamura-has-ten-feet-of-suction-power-31961","106763":"heyzo-3249-aika-shimizu-aika-shimizu-an-ordinary-female-college-student-on-the-street-with-big-breas-31962","106764":"heyzo-3227-mitsuhas-main-body-love-beauty-collection-vol-8-31963","106765":"heyzo-3224-thank-you-the-best-service-of-a-high-class-thickening-woman-vol-3-31964","106766":"heyzo-3226-the-final-feeling-reached-the-newly-married-woman-31965","106767":"heyzo-3223-semen-like-gokkun-girl-vol-2-31966","106768":"heyzo-3222-the-temptation-of-a-female-teacher-i-love-you-when-you-feel-like-you-31967","106769":"heyzo-3235-the-most-exquisite-and-beautiful-girl-this-is-a-beautiful-book-written-by-me-internal-eja-31968","106770":"heyzo-3225-yui-shinjo-for-masturbation-and-ejaculation-31945","106771":"heyzo-3219-tongue-tip-sexual-love-beauty-collection-vol-7-31946","106772":"heyzo-3244-sara-hada-masturbates-31971","106773":"heyzo-3243-amateur-mature-woman-injects-thick-semen-volume-2-31972","106774":"heyzo-3261-both-big-breasted-beauties-are-great-friends-closed-paco-3p-part-1-31973","106775":"heyzo-3240-z-erikas-high-tide-sexual-love-31974","106776":"heyzo-3260-sensitive-officers-office-lady-e88887e68887-desire-sensitive-officers-office-lady-rie-wri-31975","106777":"heyzo-3242-reika-seto-suck-hard-31976","106778":"heyzo-3239-a-friends-mother-beauty-collection-vol-9-31977","106779":"heyzo-3238-yoko-nashimoto-yoko-nashimoto-serving-men-and-women-at-the-beauty-salon-vol-3-31978","106780":"heyzo-3241-lewd-prodigy-daughter-31979","106781":"heyzo-3259-a-very-beautiful-18-year-old-girl-perfect-proportionately-e88e89e88cb2e986ace38081fat-sti-31980","106782":"heyzo-3237-aya-tanaka-sucks-me-straight-into-the-deep-throat-31957","106783":"heyzo-3258-old-wife-and-play-31958","106784":"heyzo-3253-nagasenako-nagasenako-the-best-brush-material-volume-3-31983","106785":"heyzo-3252-mirai-aoyama-urinates-31985","106786":"heyzo-3195-my-thoughts-are-gone-a-mad-woman-who-enjoys-a-lot-of-play-and-semen-31986","106787":"heyzo-3272-e88887e585a9individual-friends-exchange-of-female-sex-changed-heavenly-friends-phone-call-31987","106788":"heyzo-3251-finally-a-feeling-of-marriage-vol-2-31988","106789":"heyzo-3271-girls-bouga-summer-the-season-for-creampie-has-arrived-and-the-season-for-creampies-has-a-31989","106790":"heyzo-3250-emisato-fujisawa-sucks-all-the-way-to-the-depths-of-her-throat-31990","106791":"heyzo-3299-akihi-habai-vol-1-long-length-sucking-body-of-passion-31991","106792":"heyzo-3248-im-confused-by-my-farts-for-my-meeting-efbd9ebeauty-selection-vol-10efbd9e-31992","106793":"heyzo-3246-4p-toy-naejo-beauty-volume-3-31969","106794":"heyzo-3262-a-gold-haired-woman-who-wears-creampie-clothes-and-a-gold-haired-woman-who-is-in-sns-vol2-31970","106795":"heyzo-3247-introduced-sokko-ikinari-bozbo-offers-many-women-volume-3-31995","106796":"heyzo-3267-mature-female-seduction-31996","106797":"heyzo-3266-ema-kato-31997","106798":"heyzo-3275-callie-callie-callie-callie-callie-calliee-calliee-calliee-collection-31998","106799":"heyzo-3265-eri-saeki-leaked-31999","106800":"heyzo-3263-everything-you-need-to-know-during-your-trip-to-insen-beauty-collection-volume-12-32000","106801":"heyzo-3305-akihi-habai-vol-2-a-lewd-mature-woman-squirting-during-the-afternoon-break-from-work-32001","106802":"heyzo-3257-rino-sakuragi-rino-sakuragi-impossible-accusation-unethical-wife-and-plays-lewd-secret-vo-32002","106803":"heyzo-3274-both-big-breasted-beauties-are-great-friends-closed-paco-3p-part-2-32003","106804":"heyzo-3255-written-by-ajier-erbo-uniforms-are-cruel-beauty-selection-vol-11-31981","106805":"heyzo-3254-an-amateur-girl-with-the-ultimate-sexual-sensation-volume-2-31982","106827":"heyzo-3287-paco-32007","106829":"heyzo-3220-i-have-hope-under-the-circumstances-of-miki-hoshino-32008","106831":"heyzo-3278-one-of-my-favorite-semi-beauties-beauty-volume-14-32009","106832":"heyzo-3186-im-the-only-mature-woman-wearing-swimsuits-just-a-monster-32010","106834":"heyzo-3197-the-temptation-of-a-female-teacher-the-stimulation-of-my-thoughts-e291a2efbd9e-32011","106836":"heyzo-3286-rui-kitajima-32012","106838":"heyzo-3277-nana-shirai-leaked-32013","106839":"heyzo-3285-a-natural-giant-sparrow-a-beautiful-woman-is-cute-and-erotic-32014","106841":"heyzo-3276-a-book-of-uniforms-written-by-a-female-student-at-work-3-32015","106843":"heyzo-3270-sanae-hosoda-32016","106845":"heyzo-3284-girl-booga-150-g-cup-colored-black-gal-gal-gal-gal-gal-glain-spies-time-spainging-girls-b-31993","106847":"heyzo-3269-miyuki-sakuras-net-daring-31994","106849":"heyzo-3294-yukiho-shirase-32019","106850":"heyzo-3293-shizuka-oshiro-32020","106851":"heyzo-3290-sex-and-bouga-each-time-the-heavenly-capital-or-eros-awakening-progresses-to-a-high-degre-32021","106853":"heyzo-3292-nissan-rin-responsibility-toy-32022","106855":"heyzo-3291-rei-kiritani-32023","106857":"heyzo-3283-inequalities-in-acquiring-women-in-the-distribution-process-32024","106859":"heyzo-3282-ryu-enami-ryu-enami-i-will-hold-it-in-my-mouth-for-my-daughter-a-mother-being-played-with-32025","106861":"heyzo-3289-this-is-the-most-successful-person-and-other-sns-superficial-japanese-men-are-curious-32026","106863":"heyzo-3281-a-piece-of-komori-mikuros-bean-paste-rice-cake-that-i-will-give-to-you-volume-2-32027","106864":"heyzo-3334-im-gone-av-i-remember-20-years-ago-32028","106866":"heyzo-3310-ajigame-volume-3-rakuli-girls-erratic-things-broadcast-directly-from-the-scene-32005","106868":"heyzo-3279-nodosuke-usume-with-musako-vol-27-32006","106871":"heyzo-3303-momo-kurusu-leaked-32031","106873":"heyzo-3318-girlsefbc86amp-bouga-i-barely-saw-a-143cm-hushing-type-rocket-g-cup-female-student-with-a-32032","106876":"heyzo-3302-i-tried-to-defeat-napochawa-little-girl-volume-2-32033","106878":"heyzo-3301-mirai-minano-mina-no-mirai-i-want-to-swallow-it-a-masochistic-woman-who-likes-to-drink-se-32034","106880":"heyzo-3317-yuri-yuri-first-trip-to-a-hot-spring-yuri-32035","106881":"heyzo-3300-rika-kudo-32036","106883":"heyzo-3298-mai-senseis-practice-touki-special-class-beauty-collection-vol-17-32037","106885":"heyzo-3297-because-youre-not-wet-nearby-nose-lawsuit-32038","106887":"heyzo-3296-hinata-huge-breasts-hinata-san-i-im-really-interested-because-my-tits-are-so-big-32039","106889":"heyzo-3316-rie-hasegawa-32040","106891":"heyzo-3295-haruna-nakano-32017","106892":"heyzo-3315-kissing-a-cute-20-year-old-russian-boy-staring-at-him-is-very-dangerous-two-vaginas-and-s-32018","108946":"jur-262-english-subtitle-jur-262-cuckold-skewer-gangbang-please-violate-my-beloved-wife-to-the-depth-125130","109493":"fc2-ppv-4626433-today-only-first-time-sale-8980pt-e28692-980pt-third-installment-a-big-hit-a-karaoke-77126","109494":"fc2-ppv-4637512-today-only-first-time-sale-3980pt-e28692-980pt-negotiating-sex-with-an-18-year-old-b-77172","109498":"fc2-ppv-4640891-today-only-first-time-sale-3980pt-e28692-980pt-a-18-year-old-fair-skinned-slender-be-77279","109499":"fc2-ppv-4647258-uncensored-i-creampied-a-chick-who-just-graduated-i-paid-a-high-price-because-its-gu-77288","109500":"fc2-ppv-4647716-uncensored-e29885-pure-series-e29885-a-woman-who-participated-in-a-fake-fetish-photo-77280","110893":"oero-002-a-wife-who-gets-horny-behind-her-husbands-back-the-moment-we-enter-the-hotel-she-says-ive-b-110892","112923":"meyd-785-english-subtitle-meyd-785-black-ban-lifted-tokyos-no-1-foodle-vs-americas-no-1-actor-big-be-88363","112925":"ipx-969-english-subtitle-ipx-969-no-wasted-time-immediate-fuck-mistress-swamp-aijinnuma-tsubasa-amam-88779","112926":"ipx-990-english-subtitle-ipx-990-secretly-reverse-ntr-with-her-husbands-colleague-in-a-long-skirt-en-88780","112927":"ipx-983-english-subtitle-ipx-983-substitute-meat-urinal-10-days-impregnated-confinement-life-with-an-88760","112928":"ipx-980-english-subtitle-ipx-980-i-reunited-with-a-man-i-once-loved-at-a-class-reunion-and-i-was-dro-88792","112929":"ipx-988-english-subtitle-ipx-988-after-climax-the-pursuit-bullet-piston-e289aadada-leakage-splash-ed-88939","112931":"ebod-999-english-subtitle-ebod-999-e-body-15th-anniversary-commemoration-rookie-a-real-influencer-wi-89300","112932":"nnpj-570-english-subtitle-nnpj-570-e289aaif-you-talk-to-a-standing-girl-e289ab-a-girl-who-was-dumped-89499","112933":"ipit-040-english-subtitle-ipit-040-its-my-first-time-like-this-i-feel-a-huge-surge-of-pleasure-e3808-89596","112934":"ipit-042-english-subtitle-ipit-042-i-admire-female-spies-i-want-to-master-the-honey-trap-so-i-appear-89590","112935":"miaa-949-english-subtitle-miaa-949-she-found-a-cuckold-av-left-behind-by-my-friend-and-misunderstood-89930","112936":"miaa-999-english-subtitle-miaa-999-desiring-a-unit-she-is-seduced-by-spreading-her-m-shaped-legs-and-89942","112937":"miaa-995-english-subtitle-miaa-995-a-married-woman-office-worker-me-who-was-cuckolded-by-her-old-bos-89943","112938":"prst-001-english-subtitle-prst-001-newcomer-tsukinoe-sui-av-debut-a-woman-who-loves-sex-and-is-loved-90225","112939":"prst-003-english-subtitle-prst-003-a-woman-who-is-full-of-lewd-juice-and-climaxes-climax-sui-tsukino-90517","112940":"prst-004-english-subtitle-prst-004-awakening-masochistic-blowjob-dick-swallowing-deep-throat-orgasm-90794","112941":"huntb-732-english-subtitle-huntb-732-watch-us-as-we-do-something-naughty-in-return-show-us-when-you-90852","112942":"atid-589-english-subtitle-atid-589-a-widow-pregnant-with-the-play-of-a-man-she-could-never-forgive-s-90906","112943":"atid-588-english-subtitle-atid-588-creampie-hot-spring-escape-with-the-best-woman-tsubaki-sannomiya-90907","112944":"prst-005-english-subtitle-prst-005-unexplored-togenkyo-omotenashi-tei-signature-bathhouse-tsukinoe-s-91034","112945":"atid-590-english-subtitle-atid-590-i-thought-i-can-never-forgive-an-affair-but-i-ended-up-having-an-91143","112946":"atid-593-english-subtitle-atid-593-the-first-anal-sex-shion-chibana-chibana-shion-2-91465","112947":"achj-038-english-subtitle-achj-038-madonnas-20th-anniversary-x-slut-specialized-label-achijo-1st-ann-91694","113120":"heyzo-2700-mai-shirakawa-shirakawa-mai-home-delivery-maid-neighborhood-annoying-screaming-fuck-vol-2-31409","113128":"heyzo-2751-rena-rena-ill-give-you-a-pie-with-renas-pie-31457","113129":"heyzo-2779-mirai-minano-mirai-minano-a-fair-skinned-soap-lady-will-serve-you-31500","113133":"heyzo-2849-yu-yu-tokyo-daughter-continuous-vaginal-cum-shot-in-the-first-3p-31535","113137":"heyzo-2856-shino-aoi-aoi-no-shino-aoi-sucked-me-all-the-way-to-the-back-of-my-throat-31567","113138":"heyzo-2869-yokoyama-yume-minano-mirai-yokoyama-yume-a-mans-dream-uhauha-reverse-3p-vol-8-31580","113140":"heyzo-2936-nagi-nagi-husbands-official-creampie-gonzo-if-you-dont-have-money-it-cant-be-helped-31632","113141":"heyzo-2897-yuna-nishimura-yuna-nishimura-im-sorry-im-at-work-but-should-i-have-sex-adult-videos-heyz-31616","113142":"heyzo-2925-maria-osawa-maria-osawa-unexpected-insertion-into-a-bewildered-amateur-girl-vol-2-adult-v-31644","113143":"heyzo-2918-rei-kiritani-rei-kiritani-i-received-the-body-of-a-beautiful-woman-with-outstanding-style-31645","113144":"heyzo-2938-anna-anna-giirls-31646","113145":"heyzo-2917-masaki-uehara-masaki-uehara-masaki-uehara-has-leaked-31647","113146":"heyzo-2924-minami-nakata-minami-nakata-my-lover-who-is-too-awesome-use-your-tongue-that-is-sticky-an-31624","113147":"heyzo-2916-kyoko-hanayama-kyoko-hanayama-make-an-f-cup-mature-woman-cum-with-toys-31625","113148":"heyzo-2940-emi-aoi-aoi-emi-emi-aoi-licks-and-sucks-31656","113149":"heyzo-2939-yoko-hashimoto-yoko-hashimoto-husband-drought-busty-married-woman-31657","113150":"heyzo-2934-shiho-shinozuka-shinozuka-shiho-i-made-an-amateur-girl-a-nipple-play-and-did-it-31658","113151":"heyzo-2933-azumi-kirino-azumi-kirino-a-playta-soapland-lady-with-a-lack-of-tongue-will-serve-you-31659","113152":"heyzo-2960-mimi-mimi-a-wild-and-super-erotic-beauty-personal-trainer-popular-at-a-high-end-training-31636","113153":"heyzo-2932-hasumi-yoshioka-hasumi-yoshioka-i-want-you-to-lick-me-with-a-face-sitting-in-the-case-of-31637","113154":"heyzo-2931-mayu-komikawa-mayu-komikawa-i-had-my-sons-daughter-in-law-lick-my-pussy-31638","113155":"heyzo-2930-tsubaki-kawana-tsubaki-kawana-lets-make-an-amateur-girl-squid-with-petty-restraint-vol-2-31639","113156":"heyzo-2929-rino-sakuragi-sakuragiri-i-received-the-body-of-a-girl-with-fair-skin-vol-3-31640","113157":"heyzo-2959-miyu-miyu-a-20-year-old-jd-with-a-boyfriend-f-cup-conceived-and-creampied-for-tuition-31641","113158":"heyzo-2926-meirin-meirin-meirin-licks-and-sucks-31642","113159":"heyzo-2928-takako-nakagawa-takako-nakagawa-i-dressed-an-amateur-girl-in-naughty-underwear-and-fucked-31643","113160":"heyzo-2946-satomi-ishikawa-satomi-ishikawa-sex-loving-satomi-chans-breasts-are-getting-bigger-becaus-31668","113161":"heyzo-2963-reika-reika-girls-31669","113162":"heyzo-2948-maki-koizumi-maki-koizumi-maki-koizumi-licks-and-sucks-31670","113163":"heyzo-2947-eri-saeki-eri-saeki-i-entrusted-myself-to-a-beautiful-older-sister-and-did-something-lewd-31671","113164":"heyzo-2945-akiko-takada-akiko-takada-i-tried-having-sex-with-a-tsundere-jd-31648","113165":"heyzo-2879-rin-hinami-rin-hinami-i-received-the-body-of-a-beautiful-santa-costume-girl-31649","113166":"heyzo-2962-arina-arina-arina-chans-first-gonzo-really-cute-31650","113167":"heyzo-2944-mitsuha-kikukawa-kikukawa-mitsuha-i-had-mitsuha-kikukawa-suck-me-all-the-way-to-the-back-31651","113168":"heyzo-2943-maya-ichijo-maya-ichijo-hamezo-pov-collection-vol-31652","113169":"heyzo-2942-hikari-suzumiya-suzumiya-hikari-lovey-dovey-creampie-sex-with-a-fair-skinned-amateur-girl-31653","113170":"heyzo-2941-mirei-imada-imada-mirei-madam-i-cant-stand-being-dressed-like-that-31654","113171":"heyzo-2961-yui-yui-girls-31655","113172":"heyzo-2977-izumi-izumi-married-woman-bouga-a-19-year-old-osana-wife-has-her-husbands-friend-grasp-he-31680","113173":"heyzo-2957-noriko-ikeda-noriko-ikeda-im-sorry-im-at-work-but-should-i-have-sex-vol-2-31681","113174":"heyzo-2956-azumi-kirino-azumi-kirino-after-6-playta-office-lady-wants-to-fuck-31682","113175":"heyzo-2969-koharu-tachibana-tachibana-koharu-koharu-tachibana-licks-and-sucks-adult-videos-heyzo-31683","113176":"heyzo-2964-reina-hataki-mizukireina-a-step-by-step-lesson-for-a-mature-woman-who-wants-to-be-a-slut-31660","113177":"heyzo-2954-underground-idol-mayuka-chika-aidoru-mayuka-underground-idols-like-blow-jobs-31661","113178":"heyzo-2953-komikawa-mayu-komikawa-mayu-netorare-the-fiancee-introduce-musco-to-my-son-secretly-31662","113179":"heyzo-2976-simona-shimona-a-smooth-russian-beautiful-girl-a-good-natured-play-has-good-sex-31663","113180":"heyzo-2952-mari-onodera-onodera-mari-ill-give-you-mari-onoderas-pie-31664","113181":"heyzo-2951-mai-hazuki-mai-hazuki-i-thoroughly-enjoyed-the-body-of-a-gal-who-is-good-at-sucking-31665","113182":"heyzo-2950-momoka-ogawa-momoka-ogawa-fucking-a-busty-female-boss-with-a-plump-body-vol-2-31666","113183":"heyzo-2949-nami-amuro-nami-amuro-i-cuckolded-my-best-friends-girlfriend-who-likes-exposure-31667","113184":"heyzo-3000-miho-miho-girls-31692","113185":"heyzo-2980-mami-sakai-mami-sakai-yurukawa-girls-av-debut-i-was-nervous-but-it-felt-good-adult-video-31693","113186":"heyzo-2971-tamakire-ni-tamakire-ni-ill-masturbate-even-at-work-too-horny-receptionist-porn-videos-he-31694","113187":"heyzo-2979-ayaka-ayaka-half-beautiful-girl-who-can-basically-let-anyone-do-it-18-years-old-uncle-con-31695","113188":"heyzo-2970-hinami-rin-hinami-rin-baby-face-slut-nurses-special-treatment-31672","113189":"heyzo-2973-mayumi-enoplaya-mayumi-enoplaya-i-had-mayumi-enoplaya-suck-me-all-the-way-to-the-back-of-31673","113190":"heyzo-2972-mai-sasaki-mai-sasaki-lewd-temptation-vol-2-31674","113191":"heyzo-2967-rumi-fujita-tarumi-fuji-i-got-a-sex-friend-with-natural-beautiful-breasts-31675","113192":"heyzo-2965-runa-hinata-luna-hinata-runa-hinata-licks-and-sucks-adult-videos-heyzo-dont-sun-31676","113193":"heyzo-2978-riri-riri-girlsbouga-we-invite-lily-chan-who-has-light-brown-skin-to-experience-ecstasy-i-31677","113194":"heyzo-2966-imada-mirei-imada-mirei-i-received-the-body-of-a-beautiful-woman-with-outstanding-style-v-31678","113195":"heyzo-2968-sakura-kagetsu-sakura-kazuki-obscene-secret-of-an-immoral-wife-who-cant-tell-her-husband-31679","113196":"heyzo-2986-nana-ueyama-nana-kamiyama-brush-down-with-the-best-body-vol-2-31704","113197":"heyzo-3002-alexa-areksa-cum-inside-a-russian-stripper-twice-her-smile-was-the-cutest-31705","113198":"heyzo-2993-mona-hayami-mona-hayami-pleasure-with-sexual-massage-in-the-case-of-mona-hayami-31706","113199":"heyzo-2988-mio-sakuragi-mio-sakuragi-after-6-chippai-ol-who-wants-to-be-full-31707","113201":"heyzo-2983-nobuko-takada-nobuko-takada-we-will-have-a-gal-amateur-girl-in-uniform-costume-31684","113203":"heyzo-2982-murakami-kotono-murakami-kotono-widows-lust-vol-5-31685","113205":"heyzo-3001-anne-girls-31686","113207":"heyzo-2985-mirai-hanamori-mirai-hanamori-i-had-mirai-hanamori-suck-me-all-the-way-to-the-back-of-my-31687","113209":"heyzo-2984-hiroko-takeda-hiroko-takeda-husband-drought-arafo-married-woman-31688","113211":"heyzo-2975-erika-hirota-erika-hirota-i-was-supposed-to-be-a-nude-model-but-when-i-noticed-i-was-hold-31689","113213":"heyzo-2974-satomi-ishikawa-satomi-ishikawa-female-teacher-satomis-temptation-solve-your-worries-with-31690","113215":"heyzo-2981-riina-okamoto-okamototorina-i-had-a-flirtation-with-riina-okamoto-adult-videos-heyzo-rina-31691","113217":"heyzo-2996-eri-saeki-saeki-eri-continuous-fire-creampie-vol-2-31715","113218":"heyzo-2995-kyoko-tanabe-tanabe-kyoko-business-trip-mens-esthetician-with-excessive-service-31716","113219":"heyzo-2994-satomi-ishikawa-satomi-ishikawa-naked-housekeepers-obscene-service-vol-2-31717","113220":"heyzo-3011-emuko-girls-31718","113221":"heyzo-3008-airi-mikumo-airi-mikumo-ill-fuck-you-with-airi-mikumos-pie-31696","113222":"heyzo-3004-hitomi-morimoto-hitomi-morimoto-i-want-to-have-sex-a-frustrated-married-woman-an-immoral-31697","113223":"heyzo-2991-uran-yabuki-uran-yabuki-rolling-up-her-soft-boob-marshmallow-body-31698","113224":"heyzo-2990-rinka-tachibana-rin-hinami-rinka-tachibana-a-mans-dream-uhauha-reverse-3p-vol-9-31699","113225":"heyzo-3003-minori-minori-married-woman-bouga-husband-minori-19-a-young-wife-in-her-40s-far-from-elim-31700","113226":"heyzo-2997-ema-kato-katouema-i-want-you-to-lick-me-with-a-face-sitting-in-the-case-of-ema-kato-31701","113227":"heyzo-2992-masako-tsuji-masako-tsuji-excited-by-the-overflowing-milk-i-threw-out-the-milk-31702","113228":"heyzo-2987-hikari-tanahashi-hikari-tanahashi-we-will-have-shaved-amateur-girls-in-uniform-costumes-v-31703","113229":"heyzo-3007-ryoko-asano-ryoko-asano-amateur-girls-tongue-technique-adult-video-heyzo-31728","113230":"heyzo-3006-maki-koizumi-maki-koizumi-the-beauty-of-an-old-woman-who-needs-exposure-light-enjoyable-m-31730","113231":"heyzo-3005-lili-shiraki-licks-and-sucks-it-hard-lili-shiraki-31708","113232":"heyzo-3010-yuka-nakamura-tomoka-nakamura-amateur-wife-who-swallows-vol-2-31710","113233":"heyzo-2999-yayoi-okubo-okubo-yayoi-when-you-open-the-front-door-youll-suddenly-have-a-pacifier-amate-31711","113234":"heyzo-2998-miki-hoshino-miki-hoshino-i-will-expose-my-wifes-beautiful-body-efbd9eplease-thoroughly-e-31712","113235":"heyzo-3012-simon-simon-scandinavian-overwhelming-boobs-beauty-natural-boobs-shaking-and-screaming-cr-31713","113236":"heyzo-3009-rena-rena-renas-ass-is-cool-31714","113237":"heyzo-3021-nanase-nana-nanase-nana-ill-give-you-a-good-squirt-with-nanase-nanas-tits-adult-video-hey-31738","113238":"heyzo-3019-widows-carnal-desire-vol-6-reina-hashiki-31740","113239":"heyzo-3018-is-it-a-strange-hobby-im-with-you-deriheru-small-sister-negotiations-vol-2-31719","113240":"heyzo-3017-impossible-complaint-sturdy-immorality-secret-of-wife-and-play-vol-12-31720","113241":"heyzo-3014-chirumo-chirumo-girlsbouga-143cm-h-cup-anime-style-18-year-old-blonde-gal-public-recruitm-31721","113242":"heyzo-3016-sena-kusunoki-kusunoki-sena-sena-kusunoki-licks-and-sucks-it-hard-adult-video-heyzo-31723","113243":"heyzo-3013-rie-rie-sex-maniac-bouga-ss-personal-thoughts-on-infidelity-infidelity-stimulates-the-wom-31724","113244":"heyzo-3020-tanaka-aya-tanaka-aya-fantasy-explosion-at-image-club-crotch-explosion-continuous-creampi-31726","113245":"heyzo-3026-nana-kamiyama-nana-kamiyama-the-lewd-secret-of-an-immoral-wife-that-she-cant-tell-her-hus-31752","113246":"heyzo-3036-girlsbouga-must-see-a-thorough-investigation-of-hikaris-body-a-super-bodied-office-lady-f-31753","113247":"heyzo-3025-maki-hojo-maki-hojo-pleasure-from-erotic-massage-maki-hojos-case-vol-2-adult-video-heyzo-31731","113248":"heyzo-3024-haruna-nakano-haruna-nakano-sperm-is-injected-into-an-innocent-fair-skinned-girl-in-a-sch-31733","113249":"heyzo-3023-are-you-here-ignorance-muchimuchi-gals-first-piece-anju-kizuna-31735","113250":"heyzo-3022-mirei-imada-mirei-imada-evil-married-woman-snatcher-31736","113251":"heyzo-3015-rio-rio-a-married-woman-with-an-overflowing-sexiness-that-cant-be-contained-and-an-off-li-31737","113252":"heyzo-3033-kaori-tachibana-kaori-tachibana-kaori-tachibanas-handjob-kiss-adult-video-heyzo-31763","113253":"heyzo-3032-satomi-inoue-satomi-inoue-busty-girl-av-launch-my-very-loud-voice-31765","113254":"heyzo-3031-mirai-tadokoro-miku-tadokoro-a-cute-girl-with-a-single-spear-31742","113255":"heyzo-3029-satomi-ishikawa-satomi-ishikawa-busty-beautiful-girl-fantasies-distribution-software-for-31743","113256":"heyzo-3037-mizuki-sego-31744","113257":"heyzo-3030-get-off-on-honoka-oriharas-ass-honoka-orihara-31745","113258":"heyzo-3027-kaoru-shimatani-shimatani-kaoru-full-service-raw-creampie-with-a-boyish-call-girl-adult-v-31747","113259":"heyzo-3028-i-invited-my-beautiful-friend-to-my-new-house-and-ate-her-nao-matsumura-31749","113260":"heyzo-3042-yu-ayano-yu-ayano-i-wanted-some-excitement-so-i-made-my-av-debut-vol-3-adult-video-heyzo-31775","113261":"heyzo-3039-girls-31777","113262":"heyzo-3041-sakuragi-rino-sakuragi-rino-ill-give-you-a-pie-adult-video-heyzo-31754","113263":"heyzo-3040-imagination-married-woman-thats-why-i-left-31756","113264":"heyzo-3035-yoko-kagawa-kagawa-yoko-i-tried-to-impregnate-a-jd-who-works-at-a-housekeeping-service-ad-31757","113265":"heyzo-3034-miki-hoshino-miki-hoshino-the-obscene-daily-life-of-a-frustrated-mature-office-lady-adult-31759","113266":"heyzo-3038-simona-shimona-a-beautiful-russian-girl-with-a-plump-body-gives-me-a-thigh-job-and-then-i-31761","113267":"heyzo-3049-hikari-misumi-hikari-misumi-ill-give-you-a-good-pounding-with-hikari-misumis-tits-adult-v-31785","113268":"heyzo-3048-yuko-takenaka-yuko-takenaka-slutty-mature-woman-dispatch-31787","113269":"heyzo-3047-hiroko-tanaka-hiroko-tanaka-ill-do-it-so-give-me-a-job-the-dirty-secrets-of-an-undergroun-31788","113270":"heyzo-3046-maki-koizumi-maki-koizumi-a-new-daughters-faithful-friend-and-a-red-busty-married-woman-i-31767","113272":"heyzo-3060-kazuna-kazuna-girls-bouga-a-female-college-student-who-has-just-learned-about-sex-is-pure-31768","113274":"heyzo-3045-haru-aizawa-haru-aizawa-haru-aizawa-licks-and-sucks-it-hard-adult-video-heyzo-31770","113276":"heyzo-3044-haruna-nakano-haruna-nakano-after-school-beautiful-girl-file-no-37-i-know-its-wrong-but-a-31772","113278":"heyzo-3043-sachiko-takeda-takeda-sachiko-amateur-slut-gets-fucked-hard-vol-4-adult-video-heyzo-31773","113280":"heyzo-3055-tanaka-momoko-tanaka-momoko-asking-girls-fool-31798","113281":"heyzo-3054-fatal-lover-you-have-many-love-31799","113282":"heyzo-3062-devi-debi-girls-bouga-beautiful-beautiful-legs-beautiful-breasts-completely-erotic-potent-31800","113283":"heyzo-3053-sera-asaka-sera-asaka-sera-asaka-licks-and-sucks-hard-adult-video-heyzo-31778","113284":"heyzo-3052-sakuragi-mio-sakuragi-mio-vegetable-bird-woman-i-step-by-step-training-vol-2-31780","113285":"heyzo-3051-nao-matsumura-nao-matsumura-hamezo-gonzo-collection-vol-48-31781","113286":"heyzo-3050-natsume-rinka-natsume-rinka-one-after-another-raw-and-raw-playing-with-as-much-as-you-wan-31782","113287":"heyzo-3061-rin-rin-after-a-long-time-i-finally-managed-to-film-this-super-cute-office-lady-with-beau-31784","113288":"heyzo-3069-amano-dancing-and-smoking-31809","113289":"heyzo-3068-are-you-finally-back-no-saddle-while-visiting-av-vol-2-31810","113290":"heyzo-3067-another-mothers-mourning-tribute-vol-4-31811","113291":"heyzo-3066-disgusting-married-womens-stubbornness-vol-2-31812","113292":"heyzo-3080-a-golden-haired-beauty-from-the-west-coast-of-the-united-states-married-consent-entered-31789","113293":"heyzo-3065-nagisa-shinoharas-bean-paste-mochi-training-for-me-31790","113294":"heyzo-3064-immoral-womans-rebellious-sexual-love-31791","113295":"heyzo-3059-hiroko-sunada-hiroko-sunada-married-womans-family-came-to-prosecution-i-have-a-physical-r-31792","113296":"heyzo-3058-mirai-minano-minano-mirai-after-the-6th-point-you-must-be-in-the-office-31793","113297":"heyzo-3063-girls-31794","113298":"heyzo-3057-kisumi-inoris-anko-mochi-meeting-31795","113299":"heyzo-3056-sakurai-sakura-sakura-sakura-amateur-girl-who-is-good-at-sucking-adult-video-heyzo-31796","113300":"heyzo-3078-busty-womans-dirty-feast-31821","113301":"heyzo-3133-naejo-beauty-continuous-creampie-31822","113302":"heyzo-3077-misa-makise-washu-31823","113303":"heyzo-3076-service-tata-commercial-travel-male-hairdresser-vol-2-31824","113304":"heyzo-3075-karina-tanaka-tanakakarina-hamezo-gonzo-collection-vol-49-31801","113305":"heyzo-3074-breast-appraisal-by-the-mamas-boy-store-manager-ive-been-looking-for-these-breasts-miyu-m-31802","113306":"heyzo-3082-married-woman-31803","113307":"heyzo-3073-hitting-spear-kaori-mizuno-31804","113308":"heyzo-3072-a-high-ranking-tribe-full-of-energy-in-the-official-office-vol-2-31805","113309":"heyzo-3071-a-single-business-a-young-girl-a-group-club-activity-a-street-on-the-street-an-old-man-a-31806","113310":"heyzo-3070-a-member-of-the-high-ranking-tribe-with-a-sense-of-individuality-31807","113311":"heyzo-3081-girls-31808","113312":"heyzo-3093-a-large-amount-of-beautiful-women-in-the-inn-31833","113313":"heyzo-3092-investigate-transformational-dangerous-amateur-girl-31834","113314":"heyzo-3091-ema-kato-katouema-my-mistress-taikou-has-been-stimulated-31835","113315":"heyzo-3109-reiwa-19-years-old-g-cup-daddy-katsuko-college-student-heavy-lost-life-31836","113316":"heyzo-3090-ciel-hiiragi-31813","113317":"heyzo-3089-junko-asano-junko-asano-a-mature-masseur-who-has-a-long-way-to-go-returns-to-the-united-s-31814","113318":"heyzo-3088-sakura-nagata-sakura-nagata-suddenly-do-you-think-im-rude-after-all-i-am-delighted-with-t-31815","113319":"heyzo-3087-all-the-beautiful-busty-bodies-have-arrived-volume-4-31816","113320":"heyzo-3084-girls-31817","113321":"heyzo-3086-despondent-temptation-leinas-project-31818","113322":"heyzo-3085-excitement-and-excitement-excessive-companionship-31819","113323":"heyzo-3079-shiori-maeda-maedashi-shiori-exquisite-body-material-of-the-maze-31820","113324":"heyzo-3112-girls-31845","113325":"heyzo-3102-not-suzumiya-kaede-31846","113326":"heyzo-3101-im-a-friend-of-my-sister-vol-3-31847","113327":"heyzo-3100-im-a-college-student-with-normal-glasses-31848","113328":"heyzo-3099-empty-pleasure-luxurious-scented-ladys-best-service-vol-2-31825","113329":"heyzo-3111-is-there-something-wrong-with-my-heart-a-wise-old-man-but-not-a-cruel-person-do-you-feel-31826","113330":"heyzo-3098-minami-yusa-leaked-31827","113331":"heyzo-3097-i-love-you-disappointed-married-woman-im-the-only-individual-strong-and-lawless-satisfact-31828","113332":"heyzo-3096-im-going-to-pierce-the-lantern-volume-2-31829","113333":"heyzo-3095-yui-kisaragi-yui-kisaragi-play-madness-female-yuru-tsunebe-fart-blame-31830","113334":"heyzo-3110-a-3p-alternating-primitive-insertion-between-beautiful-friends-dual-function-31831","113335":"heyzo-3094-ibuki-kanons-sweet-bean-paste-31832","113336":"heyzo-3116-ive-never-seen-a-married-woman-before-and-ive-passed-the-exam-31857","113337":"heyzo-3115-murakami-kotono-murakami-kotono-wagoshi-cos-ichiki-fish-31858","113338":"heyzo-3126-girls-31859","113339":"heyzo-3114-emi-aoi-emi-aoi-emi-aoi-31860","113340":"heyzo-3113-im-a-new-girl-with-excellent-sucking-ability-31837","113341":"heyzo-3108-we-have-a-white-haired-amateur-girl-wearing-a-uniform-worn-by-our-generals-31838","113342":"heyzo-3107-tsubaki-shishiza-tsubaki-shishiza-the-beautiful-witch-roshi-inside-the-guards-office-mast-31839","113343":"heyzo-3125-the-cat-was-worn-by-alina-and-i-changed-to-a-cat-that-was-favored-during-the-initial-stag-31840","113344":"heyzo-3106-im-holding-nana-natsume-im-sucking-straight-into-my-throat-31841","113345":"heyzo-3105-kyoko-nakano-nakano-kyoko-make-me-cum-with-a-massage-thats-not-a-good-place-thats-not-it-31842","113346":"heyzo-3104-enter-ikinari-first-3p-ive-arrived-at-the-taste-of-an-amateur-girl-31843","113347":"heyzo-3103-mio-futaba-mio-futaba-beautiful-girl-female-boss-obscenity-guidance-31844","113348":"heyzo-3130-hina-hodaka-31869","113349":"heyzo-3129-keiko-aoyagi-keiko-aoyanagi-hamezo-gonzo-collection-vol-31870","113350":"heyzo-3124-i-have-an-innocent-amateur-girl-who-grabs-me-straight-to-the-back-of-my-throat-31871","113351":"heyzo-3123-a-manly-dream-ah-ha-ha-reversal-3p-volume-10-31872","113352":"heyzo-3128-lina-rina-kiyohide-inuis-18-year-old-girls-school-so-its-out-of-school-31849","113353":"heyzo-3122-miki-hoshinos-bean-paste-mochi-for-me-31850","113354":"heyzo-3121-special-treatment-for-beautiful-breasts-and-sisters-31851","113355":"heyzo-3120-come-on-one-spear-my-test-map-1st-place-shipping-health-womens-cooperation-31852","113356":"heyzo-3119-reina-selfish-sexual-tradition-stupid-management-of-unfaithful-compensation-31853","113357":"heyzo-3127-married-woman-bouga-a-married-woman-with-an-outstanding-appearance-a-woman-who-has-a-stro-31854","113358":"heyzo-3118-momoka-ogawa-momoka-ogawa-momoka-ogawas-pie-will-make-you-cum-adult-video-heyzo-31855","113359":"heyzo-3117-ive-got-a-spear-in-operation-one-pocha-cute-girl-volume-2-31856","113360":"heyzo-3140-one-touch-one-touch-enjoying-the-beautiful-witchs-erotic-body-31881","113361":"heyzo-3139-nana-kamiyama-nana-kamiyama-nana-kamiyama-licks-and-sucks-it-hard-adult-video-heyzo-31882","113362":"heyzo-3148-a-true-male-friend-who-is-a-black-persons-dream-my-purpose-is-to-leave-the-country-very-d-31883","113363":"heyzo-3138-is-it-time-to-reach-the-last-city-av-exploring-primitive-sexual-love-volume-3-31884","113364":"heyzo-3137-rinko-nakagawa-noriko-nakagawa-obscene-act-of-a-woman-watching-at-night-volume-2-31861","113365":"heyzo-3136-widows-desire-vol-7-31862","113366":"heyzo-3135-akemi-kihara-akemi-kihara-ill-give-you-a-squirt-with-akemi-kiharas-tits-adult-video-heyzo-31863","113367":"heyzo-3147-sexgo-31864","113368":"heyzo-3134-haruna-nakano-haruna-nakano-im-stuck-in-the-capital-and-ive-arrived-at-the-corpse-of-a-li-31865","113369":"heyzo-3132-im-the-only-amateur-girl-with-the-ultimate-in-sexuality-31866","113370":"heyzo-3131-mio-futaba-beautiful-girl-31867","113371":"heyzo-3146-marriage-women-bouga-everyday-changes-marriage-rejoice-young-crazy-strongness-thoughts-re-31868","113372":"heyzo-3155-shika-oshiro-shika-oshiro-we-will-solve-your-possessive-sexual-problem-beak-is-wrong-volu-31893","113373":"heyzo-3154-prodigal-elementary-school-girls-acceptance-of-truth-vol-5-31894","113374":"heyzo-3163-nagase-nako-nagasa-nako-welcome-to-the-medical-clinic-feeling-good-healing-efbd9e-31895","113375":"heyzo-3150-erotic-bouga-emergency-release-learning-lessons-and-ss-class-g-cup-womens-tales-and-sexua-31896","113376":"heyzo-3152-miyu-moritas-bean-paste-rice-cake-meeting-your-high-tide-31873","113377":"heyzo-3145-please-let-me-know-i-can-work-with-you-efbd9eunderground-idol-like-lewd-secretefbd9e-vol-31874","113378":"heyzo-3199-off-paco-nakade-yogazai-r-chan-with-beautiful-big-breasts-recognized-on-sns-31875","113379":"heyzo-3142-a-super-convenient-lewd-friend-you-can-stand-up-and-manipulate-31876","113380":"heyzo-3159-kazumi-takahashi-kazumi-takahashi-watching-the-night-womans-foolishness-volume-3-31877","113381":"heyzo-3149-girls-31879","113382":"heyzo-3141-a-private-student-frequently-attends-junior-high-school-swimming-cosplay-and-is-involved-31880","113383":"heyzo-3164-hinata-chihiro-hinata-chihiro-hinata-chihiro-licks-and-sucks-it-hard-adult-video-heyzo-31905","113384":"heyzo-3201-a-gold-haired-woman-in-uniform-who-wears-a-uniform-and-a-thin-haired-woman-with-high-sens-31906","113385":"heyzo-3162-obscene-toy-law-how-to-resist-and-acquire-the-ability-to-resist-however-did-i-fail-31907","113386":"heyzo-3206-nene-sakura-nene-sakura-beautiful-prodigal-female-teacher-beauty-collection-vol-1-31908","113387":"heyzo-3169-my-sensual-female-performer-is-the-most-sensual-female-performer-31885","113388":"heyzo-3200-a-female-college-students-flexible-breasts-a-passionate-love-affair-and-a-female-college-31886","113389":"heyzo-3160-i-am-thinking-of-you-sitting-here-and-looking-up-at-me-efbd9eexample-of-waveformefbd9e-31887","113390":"heyzo-3158-cosplay-erotic-adventure-vol-2-31888","113391":"heyzo-3180-married-woman-bouga-breast-size-100-beautiful-hips-a-miraculous-body-married-woman-has-ar-31889","113392":"heyzo-3144-the-indecent-secret-of-an-unethical-wife-and-play-who-is-accused-of-impotence-vol-14-31890","113393":"heyzo-3179-21-shocking-and-fresh-lustful-repulsion-creampie-of-a-beautiful-woman-named-koromania-x-2-31891","113394":"heyzo-3156-riri-shirakiri-e88894e88887e690ae-volume-2-31892","113395":"heyzo-3191-yoko-akai-yoko-akai-big-breasted-housewife-with-deep-throat-31917","113396":"heyzo-3173-rino-sakuragi-rino-sakuragi-sincere-path-compensation-deficiency-31918","113397":"heyzo-3172-harumis-suction-power-is-ten-feet-31920","113398":"heyzo-3170-thoroughly-enjoy-big-tits-amateur-girl-vol-11-31897","113399":"heyzo-3203-creampie-efbd9ebeauty-selection-vol-2efbd9e-31898","113400":"heyzo-3171-uniform-service-i-feel-good-volume-2-31899","113401":"heyzo-3182-a-huge-screaming-voice-drawn-by-a-sexual-prostitute-parallel-ejaculation-two-times-mio-sa-31900","113402":"heyzo-3168-satomi-ishikawas-bean-paste-rice-cake-is-high-tide-31901","113403":"heyzo-3167-noriko-sato-noriko-sato-your-mens-tools-have-been-removed-are-you-an-amateur-sister-is-it-31902","113404":"heyzo-3202-female-university-student-u-chan-joshidaiseiyu-chan-jd-japanese-off-paco-life-first-primi-31903","113405":"heyzo-3165-a-masculine-dream-reverse-3p-volume-12-31904","113406":"heyzo-3161-momoka-ogawas-strength-sucking-31929","113407":"heyzo-3188-im-a-special-girl-who-won-the-first-place-in-the-middle-of-the-operation-31930","113408":"heyzo-3215-a-love-journey-of-yo-yukou-training-31931","113409":"heyzo-3177-the-indecent-secret-of-an-unethical-wife-and-play-who-is-accused-of-impotence-vol-15-31932","113410":"heyzo-3214-the-old-woman-was-inseminated-by-ryo-and-debts-piled-up-31909","113411":"heyzo-3184-aki-mashiros-handmade-kiss-31910","113412":"heyzo-3204-lutontou-thick-sexual-love-beauty-collection-vol-3-31911","113413":"heyzo-3178-is-it-time-to-reach-the-last-city-av-exploring-primitive-sexual-love-volume-4-31912","113414":"heyzo-3183-mature-fattening-drama-female-servant-vol-7-31913","113415":"heyzo-3213-lana-violet-an-asia-girl-with-a-sensitive-genital-area-and-a-high-tide-of-water-31914","113416":"heyzo-3176-haruka-sanada-urinates-31915","113417":"heyzo-3212-first-place-a-shaved-and-small-sized-officials-office-girl-its-possible-to-wake-up-here-i-31916","113418":"heyzo-0073-sky-angel-vol-129-part-1-31941","113419":"heyzo-3196-kisaragi-yuis-party-is-high-tide-31942","113420":"heyzo-3151-passionate-married-woman-playbirth-health-vol-3-31943","113421":"heyzo-3230-beginner-aria-first-japanese-sword-pure-collection-31944","113422":"heyzo-3194-beautiful-prostitute-high-tide-guidance-like-a-lewd-female-teacher-31921","113423":"heyzo-3229-a-beautiful-hairdresser-is-a-woman-who-looks-like-a-man-in-the-dark-looks-like-a-man-at-w-31922","113424":"heyzo-3193-i-am-thinking-of-you-sitting-here-and-looking-up-at-me-efbd9eieha-ryu-tame-exampleefbd9e-31923","113425":"heyzo-3205-after-the-first-anal-intercourse-im-done-efbd9ebeauty-selection-vol-4efbd9e-31924","113426":"heyzo-0247-ai-mizushima-ai-mizushima-shaved-playta-models-excessive-exposure-photoshoot-fucked-in-gy-31925","113427":"heyzo-3190-cosplay-erotic-adventure-vol-3-31926","113428":"heyzo-3192-as-a-result-the-machine-tool-association-is-in-charge-and-we-are-in-charge-of-the-machine-31927","113429":"heyzo-3216-heyzo-3216-31928","113430":"heyzo-0224-sky-angel-vol-129-part-2-31935","113431":"heyzo-3208-masters-talking-sex-toy-beauty-collection-vol-5-31936","113432":"heyzo-0328-mai-misato-misato-mai-poke-the-untreated-secret-points-of-a-beautiful-girl-with-beautiful-31937","113433":"heyzo-3198-ryoko-nakata-ryoko-nakata-im-a-private-person-a-large-breasted-cosplay-girl-31938","113434":"heyzo-3207-netorare-desire-asexual-solution-to-personal-problems-31939","113435":"heyzo-3231-i-am-girls-bouga-playing-on-the-network-i-am-aware-of-one-womans-thoughts-on-the-truth-of-31940","113442":"heyzo-3256-my-test-work-is-e8999b-and-e59cb0e8ae93god-yamanananaaki-32004","113445":"heyzo-3273-amateur-girls-lewd-body-sensitive-homemaker-with-clothes-on-31984","113450":"heyzo-3304-the-hairdresser-i-hate-pre-wedding-groom-suction-32049","113451":"heyzo-3320-first-place-married-woman-with-paco-last-six-months-32050","113452":"heyzo-3306-nana-shirai-32051","113453":"heyzo-3321-embroidery-volume-4-the-foolish-nurse-32052","113454":"heyzo-3307-strong-and-sturdy-masaari-shige-group-im-currently-appearing-in-an-av-yes-32029","113455":"heyzo-3319-olivia-grace-32030","113457":"heyzo-3340-kanako-ishii-32061","113458":"heyzo-0300-acrete-acme-of-the-unborn-beautiful-girl-part-2-32062","113459":"heyzo-3323-nanako-asahito-32063","113460":"heyzo-3322-miya-izumi-miyu-izumi-called-to-give-me-a-massage-and-one-of-my-friends-passed-by-and-cam-32064","113461":"heyzo-3313-at-the-same-time-a-strange-man-was-swarming-the-two-cavities-of-a-plump-mature-woman-32041","113462":"heyzo-3185-a-beautiful-woman-yukata-was-wet-after-it-rained-and-returned-to-her-beloved-restaurant-32042","113463":"heyzo-3339-dream-3p-two-russian-friends-both-have-outstanding-style-and-skin-mass-the-light-is-smoot-32043","113464":"heyzo-3312-sakura-leaked-32044","113465":"heyzo-3308-sakura-kojima-kojima-sakura-ill-give-you-a-pie-adult-video-heyzo-32045","113466":"heyzo-0288-acme-in-the-pain-of-a-hairless-and-pretty-girl-part-1-32046","113467":"heyzo-3311-her-sister-is-delicious-beauty-series-volume-19-32047","113468":"heyzo-3309-lori-kawa-musume-with-ani-voice-step-by-step-let-your-thoughts-flow-32048","113469":"heyzo-3331-is-that-really-terrible-in-reflection-he-visited-his-mother-in-the-past-32073","113470":"heyzo-3330-i-have-a-machine-tool-extreme-masturbation-yeah-32074","113472":"heyzo-3343-i-have-a-female-college-student-who-is-active-in-the-strange-things-i-do-at-work-vol-2-vi-32075","113473":"heyzo-3329-rino-sakuragi-licks-and-sucks-32076","113475":"heyzo-3328-hustle-with-a-pub-beauty-collection-volume-21-32053","113477":"heyzo-3327-i-embraced-a-married-woman-who-was-tired-of-her-husband-and-ran-away-32054","113480":"heyzo-3325-more-services-from-este-miss-32055","113483":"heyzo-3342-miki-chan-finally-likes-sex-32056","113486":"heyzo-3326-nana-ueyama-32057","113490":"heyzo-3341-seira-girls-amp-bouga-g-cup-gal-is-a-petition-make-full-use-of-your-maximum-mental-agilit-32058","113494":"heyzo-3268-yariman-blonde-gal-i-like-it-32059","113498":"heyzo-3324-ill-leave-it-to-you-in-the-midst-of-a-difficult-but-elegant-wife-32060","113502":"heyzo-3346-hyakuta-emiris-neat-and-tidy-writing-32085","113505":"heyzo-3353-beautiful-birthday-series-vol-23-32086","113508":"heyzo-3264-im-going-to-insert-my-semen-into-a-nasty-woman-named-deriheru-volume-2-32087","113511":"heyzo-3370-my-mistress-watching-porn-dolls-32088","113514":"heyzo-3358-when-i-negotiated-with-a-grown-up-boy-fighting-with-a-boyfriend-she-turned-out-to-be-a-sh-32065","113517":"heyzo-3337-enjoy-a-sexual-massage-together-under-the-circumstances-of-rin-miura-32066","113520":"heyzo-3357-a-new-arrival-riz-chan-is-absolutely-cute-18-years-old-this-time-ill-let-you-come-32067","113523":"heyzo-3336-shooting-yariman-amateur-girls-volume-6-32068","113526":"heyzo-3335-a-feast-of-inelegant-beauty-and-lasciviousness-32069","113529":"heyzo-3344-character-performers-and-off-paco-32070","113532":"heyzo-3333-ike-and-marika-izumis-steps-32071","113535":"heyzo-3332-i-got-a-truly-loving-etching-beauty-collection-volume-22-32072","113538":"heyzo-3355-a-beautiful-woman-at-the-inn-volume-2-32097","113541":"heyzo-3361-famous-married-woman-kowa-paco-32098","113545":"heyzo-3354-yuka-ohashis-hand-coordinates-32099","113549":"heyzo-3345-bunny-chan-stretches-her-nipples-beauty-collection-vol-25-32100","113553":"heyzo-3352-nami-oyama-32077","113557":"heyzo-3351-a-solution-to-gender-problems-breasts-are-not-an-outsider-vol-3-32078","113561":"heyzo-3360-an-unattractive-married-woman-listens-to-her-japanese-husbands-wishes-and-has-anal-sex-wi-32079","113565":"heyzo-3350-ill-give-you-a-sweet-bean-paste-mochi-by-orie-takaishi-32080","113569":"heyzo-3349-satomis-stubborn-personality-please-visit-more-beauty-collection-vol-24-32081","113573":"heyzo-3348-i-like-a-plump-amateur-girl-volume-12-32082","113577":"heyzo-3347-makuri-returns-yes-32083","113585":"heyzo-0044-rosa-kawashima-kawashima-ro-sa-lustful-wife-descends-13-part-1-adult-video-heyzo-32109","113586":"heyzo-3368-my-hope-is-fast-e3809ca-lovey-dovey-girl-with-a-cocke3809c-32110","113587":"heyzo-3367-makuri-returns-volume-2-32111","113588":"heyzo-3396-when-i-was-talking-to-the-play-who-was-waiting-for-me-he-looked-like-he-was-wearing-his-u-32112","113589":"heyzo-3366-natsuki-ai-has-always-been-a-lover-32089","113590":"heyzo-3365-the-dirty-secrets-of-an-immoral-wife-beauty-collection-vol-27-32090","113591":"heyzo-3364-takahara-yasuko-shooting-yariman-mature-woman-volume-2-32091","113592":"heyzo-3338-receive-training-from-newly-arrived-female-students-32092","113593":"heyzo-3395-i-am-lovely-i-called-again-three-braids-he-puts-on-his-pajamas-wipes-your-body-and-then-s-32093","113594":"heyzo-3362-yuri-uemoto-gave-me-your-penis-32094","113595":"heyzo-3356-yariman-amateur-girl-shoots-gutsli-jumble-7-32095","113596":"heyzo-3371-revealing-beautiful-breasts-hey-beauty-collection-volume-26-32096","113597":"heyzo-3372-the-naked-naked-land-episode-has-arrived-ukari-e78db5e5b7b2-married-womans-work-32121","113598":"heyzo-3399-boyish-jd-and-paco-outside-32122","113599":"heyzo-3375-heyzo-3375-32123","113600":"heyzo-3448-saara-saijo-32124","113601":"heyzo-3374-netorare-beauty-woman-roshi-beauty-series-vol-28-32101","113602":"heyzo-0269-rosa-kawashima-kawashima-ro-sa-lustful-wife-advent-13-part-2-adult-video-heyzo-32102","113603":"heyzo-3426-ball-ball-volume-5-jd-yokado-development-relations-32103","113604":"heyzo-3363-nodosuke-musume-vol-28-32104","113605":"heyzo-3398-when-i-call-a-local-summoned-girl-a-simple-and-cute-money-making-girl-comes-to-pushhikore-32105","113606":"heyzo-3369-ayumi-okazakis-sweet-bean-paste-cake-32106","113607":"heyzo-3447-im-a-girl-with-a-single-wound-and-im-ready-32107","113608":"heyzo-3397-giirlsamp-bouga-g-cup-gal-forgot-the-feeling-of-a-warm-and-dark-path-when-i-drink-alcohol-32108","113609":"heyzo-3417-gachinanpa-is-gal-rinka-chan-who-left-after-that-a-19-year-old-girl-born-to-my-horse-has-32133","113610":"heyzo-3382-mitsuki-harutori-leaked-32134","113611":"heyzo-3381-birth-a-beautiful-woman-with-an-average-finger-and-a-beautiful-woman-beauty-collection-vo-32135","113612":"heyzo-0180-kaoru-natsuki-tsubaki-kato-kaoru-natsuki-the-advent-of-the-lustful-wife-10-part-2-adult-v-32136","113613":"heyzo-3380-a-male-friend-appears-before-applying-for-av-admission-e291a2-32113","113614":"heyzo-3379-sanae-hosoda-32114","113615":"heyzo-3416-a-natural-big-mountain-sparrow-girl-19-years-old-the-punipuni-is-the-best-32115","113616":"heyzo-3449-rei-mizuna-32116","113617":"heyzo-3378-yuna-mizunos-circle-32117","113618":"heyzo-3377-rei-ruse-32118","113619":"heyzo-0043-kaoru-natsuki-tsubaki-kato-kaoru-natsuki-the-advent-of-the-lustful-wife-10-part-1-adult-v-32119","113620":"heyzo-3376-ichimotsu-one-of-the-actors-the-daughter-of-the-next-generation-of-business-32120","113621":"heyzo-3390-aki-mizuno-is-always-ona-32145","113622":"heyzo-3389-mrs-hiro-takabata-the-best-service-in-kaishu-shozo-volume-32-32146","113623":"heyzo-0141-mizutama-lemon-sky-angel-vol-130-part-2-adult-video-heyzo-32147","113624":"heyzo-3434-ball-ball-e291a2-volume-6-e-cup-responsible-for-the-female-student-32148","113625":"heyzo-3400-ryu-enami-32125","113626":"heyzo-3419-i-am-a-very-active-female-university-student-who-has-reached-the-top-of-sns-32126","113627":"heyzo-3386-one-of-shiomi-erikas-sweet-bean-paste-cakes-32127","113628":"heyzo-3385-sa-husband-nakore-3p-e291a2-beauty-collection-volume-31-32128","113629":"heyzo-3418-a-married-woman-who-looks-like-a-leopard-is-it-right-or-wrong-the-arrival-of-a-fully-carn-32129","113630":"heyzo-0049-mizutama-lemon-sky-angel-vol-130-part-1-adult-video-heyzo-32130","113631":"heyzo-3384-naomi-tanaka-32131","113633":"heyzo-3383-alice-ernandez-32132","113635":"heyzo-3403-beautiful-prodigy-confident-and-despicable-woman-32157","113636":"heyzo-3443-very-h-is-one-similar-and-stubborn-girl-but-the-other-one-is-a-super-lewd-girl-savele-is-32158","113637":"heyzo-3402-takahashi-yuko-takahashi-yuko-tokahashi-yuko-takahashi-yuko-takahashi-on-32159","113638":"heyzo-3442-la-ding-girls-fart-and-crotch-stabbing-satsumasa-dance-prepare-your-waist-32160","113639":"heyzo-3401-av-shuuji-ryoso-av-female-performer-volume-2-32137","113640":"heyzo-3387-layman-best-body-2-32138","113641":"heyzo-3421-a-horny-beautician-a-cute-beard-beautician-who-acquires-talent-through-subtle-vibrations-32139","113642":"heyzo-3394-rumi-kanzaki-licks-and-sucks-32140","113643":"heyzo-3393-namami-mai-is-back-home-beauty-collection-volume-33-32141","113644":"heyzo-3392-yoko-hosokawa-32142","113645":"heyzo-3391-one-beautiful-wife-and-play-has-arrived-one-lewd-play-32143","113646":"heyzo-3420-y-utuber-and-off-paco-32144","113647":"heyzo-3413-ate-and-the-reception-staff-are-in-full-swing-beauty-collection-volume-36-32169","113648":"heyzo-3412-i-am-able-to-store-my-body-in-a-convenient-time-32170","113649":"heyzo-3411-continuous-shooting-creampie-sanmai-volume-4-32171","113650":"heyzo-3445-a-favourite-girlfriend-32172","113651":"heyzo-3410-chika-onishi-is-youna-32149","113652":"heyzo-3409-i-am-a-continuous-girl-kana-chan-beauty-collection-volume-35-32150","113653":"heyzo-3408-im-glad-to-hear-that-youre-one-of-my-favorite-female-playrens-books-13-32151","113654":"heyzo-3407-sexual-love-of-a-female-college-student-32152","113655":"heyzo-3444-girls-bouga-cat-eyes-cute-owan-type-boobs-distinguished-vaddle-strength-most-preferred-wo-32153","113656":"heyzo-3406-yui-shinshiro-licks-and-sucks-32154","113657":"heyzo-3405-my-best-friend-kanojo-e291a2-beauty-collection-volume-34-32155","113658":"heyzo-3404-a-obscene-mature-woman-dispatched-by-a-selfish-man-volume-2-32156","113659":"heyzo-3464-naojos-beautiful-and-bright-smile-is-a-super-sensitive-girl-full-of-violence-oil-32181","113660":"heyzo-3428-manaka-ashida-handjob-32182","113661":"heyzo-3463-girls-bouga-karaoke-store-clerk-gal-yuki-and-tomomi-yuki-as-a-result-of-the-meeting-the-f-32183","113662":"heyzo-3422-yuko-miyagawa-32184","113663":"heyzo-3425-im-a-physical-education-training-mori-im-sweating-32161","113664":"heyzo-3462-e6bf84e696afmodel-other-people-are-happy-to-eat-super-aggressiveness-the-best-body-and-an-32162","113665":"heyzo-3424-akane-maruyama-32163","113666":"heyzo-3423-i-cant-accept-it-beautiful-sucking-fart-tuber-e291a2-beauty-collection-volume-37-32164","113667":"heyzo-3488-ball-ball-volume-7-of-volume-7-a-female-performer-with-a-reciprocating-performance-and-a-32165","113668":"heyzo-3415-rina-is-ready-to-lick-and-lick-32166","113669":"heyzo-3446-dokkiri-zaikaku-color-costume-shooting-period-queen-invasion-cum-first-individual-bondage-32167","113670":"heyzo-3414-i-gave-you-one-piece-of-reiko-kobayakawas-bean-paste-volume-2-32168","113671":"heyzo-3479-runa-yamagishi-volume-2-32194","113672":"heyzo-3435-a-dramatic-book-produced-by-ikinari-e291a2-beauty-collection-volume-39-32173","113673":"heyzo-3496-ball-ball-volume-8-lustful-guidance-for-wives-and-playren-with-splendid-bodies-32174","113674":"heyzo-3432-hikari-suzumiya-responsibility-toy-32177","113675":"heyzo-3431-intense-sexual-intercourse-with-multiple-breasts-beauty-collection-vol-38-32178","113676":"heyzo-3430-her-internal-debt-32179","113677":"heyzo-3429-rise-and-fall-volume-2-32180","113678":"heyzo-3456-asuka-claire-asuka-claire-beautiful-busty-half-japanese-beauty-gets-fucked-beauty-collect-32205","113679":"heyzo-3451-hinami-rin-hinami-rin-i-tried-to-make-a-jack-of-all-trades-beauty-collection-vol-41-adult-32186","113680":"heyzo-3450-himeka-nakayama-himeka-nakayama-i-picked-up-a-beautiful-wife-with-an-e-cup-and-had-sex-wi-32187","113681":"heyzo-3441-rion-rion-continuous-raw-creampies-continuous-ejaculations-on-a-gorgeous-body-adult-video-32189","113682":"heyzo-3483-ria-ria-ria-is-obedient-and-will-listen-to-anything-you-say-enjoy-her-amazing-body-as-muc-32190","113683":"heyzo-3439-im-so-excited-desperate-mature-woman-beauty-collection-volume-40-32192","113684":"heyzo-3487-little-devil-a-chan-koakumae-chan-little-devil-model-and-off-paco-she-gets-horny-with-her-32216","113685":"heyzo-3469-jessica-takizawa-takizawa-jessica-ill-give-you-a-good-pounding-with-jessica-takizawas-tit-32217","113686":"heyzo-3468-moena-nishiuchi-moena-nishiuchi-more-and-more-raw-creampies-beautiful-women-collection-vo-32218","113687":"heyzo-3486-during-a-business-trip-to-hakuyo-my-foreign-companion-ai-shinshuchi-was-here-32198","113688":"heyzo-3458-minami-ishikawa-minami-ishikawa-making-a-pet-maid-cum-over-and-over-again-vol-2-adult-vid-32201","113689":"heyzo-3461-sakurada-momoha-sakurada-momoha-masturbating-until-shes-soaking-wet-climax-sex-with-a-lew-32202","113690":"heyzo-3485-mie-ishida-mie-ishida-when-i-asked-a-girl-with-a-great-figure-to-be-an-underwear-model-sh-32203","113691":"heyzo-3477-yoshie-fujimoto-fujimoto-yoshie-slutty-milf-gets-fucked-hard-vol-3-adult-video-heyzo-32230","113692":"heyzo-3476-satomi-satomi-if-you-can-withstand-the-actors-technique-youll-get-a-reward-but-if-you-can-32231","113693":"heyzo-3506-ayano-ayano-i-met-an-amateur-girl-by-chance-and-asked-her-to-appear-in-the-film-she-was-s-100434","113694":"heyzo-3489-mirai-minano-mina-no-mirai-mirai-minano-has-wet-herself-adult-video-heyzo-minano-mirai-32209","113695":"heyzo-3473-sasayama-rika-sasayama-marika-shaved-amateur-girl-in-uniform-costume-vol-3-adult-video-he-32211","113696":"heyzo-3472-yuri-shiraishi-yuri-shiraishi-i-tried-a-lot-of-obscene-things-to-a-seductive-married-woma-32212","113697":"heyzo-3505-takako-takako-girls-bouga-urgent-sexually-driven-female-college-students-are-gathering-at-32213","113698":"heyzo-3388-himari-kohinata-himari-kohinata-i-fucked-a-mature-woman-in-a-naked-apron-vol-3-adult-vide-32215","113699":"heyzo-3495-kanda-runa-kanda-runa-please-do-as-you-like-master-beauty-collection-vol-49-adult-video-h-32240","113700":"heyzo-3494-erika-shiomi-erika-shiomi-one-after-another-raw-cum-all-over-erika-adult-video-heyzo-32241","113701":"heyzo-3493-reona-hironaka-hironaka-reona-exciting-virtual-cohabitation-vol-2-ill-suck-your-dick-adul-32242","113702":"heyzo-3491-sakura-kojima-sakura-kojima-i-tried-using-the-beautiful-office-lady-who-came-to-handle-th-32243","113703":"heyzo-3526-roxy-rokishii-ajihame-vol-10-a-frustrated-wife-who-squirts-a-lot-adult-video-heyzo-32220","113704":"heyzo-3475-hinata-sagiri-hinata-sagiri-ill-give-you-a-good-pounding-with-hinata-sagiris-tits-adult-v-32223","113706":"heyzo-3482-wave-mone-namigata-mone-lets-play-with-monet-beauty-collection-vol-47-adult-video-heyzo-w-32224","113708":"heyzo-3280-nao-matsumura-matsumura-nao-amateur-girl-serving-in-uniform-vol-4-adult-video-heyzo-32225","113710":"heyzo-3481-mogami-momo-mogami-momo-after-6-shaking-and-jiggling-breasts-adult-video-heyzo-32226","113712":"heyzo-3507-victoria-bikutoria-japanese-sword-rampage-sensitive-blonde-amateur-girl-i-met-on-sns-unif-32227","113714":"heyzo-3509-haruna-nakano-haruna-nakano-ill-make-you-cum-in-a-sailor-costume-beauty-collection-vol-52-32252","113715":"heyzo-3503-akari-kawaguchi-akari-kawaguchi-repaying-debts-with-her-body-vol-2-adult-video-heyzo-32253","113716":"heyzo-3514-yuria-yuria-sexy-super-big-tits-amateur-mature-woman-creampie-adult-video-heyzo-32254","113717":"heyzo-3437-sayaka-hoshino-32255","113718":"heyzo-3501-unpleasant-imagebeauty-collection-vol-51-32233","113719":"heyzo-3499-keiko-yamada-32234","113720":"heyzo-3513-when-i-was-on-a-business-trip-over-the-phone-it-was-very-erotic-and-when-i-was-negotiatin-32236","113721":"heyzo-3498-yukie-natsuki-licks-and-sucks-32237","113722":"heyzo-3427-incessant-e291a2acme-tenkoku-my-love-eclipse-32239","113723":"heyzo-3555-juna-juna-a-cheap-gal-who-does-it-as-a-hobby-3-creampies-in-one-day-adult-video-heyzo-32264","113724":"heyzo-3523-marika-izumi-marika-izumi-marika-izumi-licks-and-sucks-it-hard-adult-video-heyzo-32265","113725":"heyzo-3522-mizuhara-reiko-mizuhara-reiko-do-whatever-you-want-on-a-hot-spring-trip-beauty-collection-32266","113726":"heyzo-3520-nagisa-shimakawa-shimakawa-nagisa-making-a-pet-maid-cum-over-and-over-again-vol-3-adult-v-32267","113727":"heyzo-3519-ema-kato-kato-uema-a-beautiful-female-teacher-who-was-cuckolded-vol-4-adult-video-heyzo-32244","113728":"heyzo-3518-natsuki-kikuta-natsuki-kikuta-natsuki-kikuta-has-peed-herself-adult-video-heyzo-32246","113729":"heyzo-3512-sakura-miyuki-sakura-miyuki-obedient-sex-doll-housewife-beautiful-women-collection-vol-53-32247","113730":"heyzo-3521-alice-alice-ajihame-vol-11-fucking-a-busty-exchange-student-adult-video-heyzo-32248","113731":"heyzo-3515-hiromi-hiromi-girls-bouga-a-beautiful-office-lady-with-a-beautiful-e-cup-body-and-short-h-32249","113732":"heyzo-3511-18-volumes-of-filthy-secrets-about-unethical-wives-and-playren-18-32250","113733":"heyzo-3510-shiori-yamagishi-yamagishi-shiori-ill-give-you-a-squirt-with-shiori-yamagishis-tits-adult-32251","113734":"heyzo-3535-aika-hoshino-aika-hoshino-the-lewd-secret-of-an-immoral-wife-that-she-cant-tell-her-husba-32277","113735":"heyzo-3557-yuzuki-yuzu-girlsbougag-cup-cup-type-tight-waist-smooth-skin-just-a-light-touch-will-make-32278","113736":"heyzo-3534-yui-fujisaki-yui-fujisaki-yui-fujisaki-will-give-you-a-good-blowjob-with-her-tits-adult-v-32279","113737":"heyzo-3533-i-have-arrived-i-have-arrived-beauty-collection-32256","113738":"heyzo-3530-yuki-mizuki-mizuki-yuki-the-lewd-temptation-of-a-neat-and-clean-office-lady-a-memory-befo-32258","113739":"heyzo-3556-mina-mina-a-sensitive-and-neat-office-lady-just-being-touched-makes-her-body-twitch-shes-32259","113740":"heyzo-3529-keiko-sasaoka-sasao-keiko-keiko-sasaoka-masturbates-with-a-dildo-and-cums-adult-video-hey-32260","113741":"heyzo-3528-shion-mochizuki-shion-mochizuki-the-most-erotic-gal-girl-is-the-worst-woman-who-loves-to-32261","113742":"heyzo-3525-noriko-takeda-takeda-noriko-slutty-and-lewd-mature-woman-and-sticky-sex-vol-2-adult-video-32262","113743":"heyzo-3543-ibuki-kanon-ibuki-kanon-big-breasted-female-teacher-who-cant-say-no-beauty-collection-vol-32290","113744":"heyzo-3578-casey-keisie-2019-kin8-award-best-movie-of-the-year-cuckold-ntr-my-friends-girlfriend-lov-32269","113745":"heyzo-3558-ye2978eutuber-h-chan-the-soothing-y-chan-ecchi-chan-prank-this-time-h-chan-is-the-masterm-32273","113746":"heyzo-3538-satomi-satomi-i-cuckolded-a-big-breasted-woman-who-was-heartbroken-after-her-boyfriend-ch-32274","113747":"heyzo-3547-ami-ami-making-a-latin-half-climax-beautiful-women-collection-vol-60-adult-video-heyzo-32285","113748":"heyzo-3545-iori-otoha-otohaiori-ill-solve-your-sexual-problems-with-a-bang-is-sucking-a-cock-not-che-32287","114274":"heyzo-3502-saori-hoshino-saori-hoshino-saori-hoshino-licks-and-sucks-it-hard-adult-video-heyzo-32232","114887":"fc2-ppv-4812363-a-21-year-old-e-cup-girl-who-is-a-well-known-star-and-an-innocent-girl-with-sexy-eye-81099","114888":"fc2-ppv-4812431-uncensored-a-free-spirited-former-ca-celebrity-wife-28-years-old-who-wants-a-strange-81107","114889":"fc2-ppv-4810998-uncensored-a-quiet-and-neat-woman-even-though-she-says-shes-nervous-her-body-respond-81131","114890":"fc2-ppv-4811321-first-time-shooting-face-revealed-no-mosaic-raw-creampie-sss-class-strongest-body-be-81173","114891":"fc2-ppv-4813276-uncensored-year-end-sale-limited-to-200-pieces-4000-e28690-10000-yen-unearthed-gem-i-81152","114892":"fc2-ppv-4814030-god-muscled-jiangshi-her-body-is-so-light-it-trembles-and-collapses-the-moment-her-r-103032","114894":"fc2-ppv-4814101-mao-ren-since-then-he-has-woken-up-in-a-new-way-but-the-unique-convexity-and-brightn-81165","114895":"fc2-ppv-4815076-close-contact-big-breasts-zero-distance-chest-pressure-the-moment-i-was-enveloped-in-81181","114896":"fc2-ppv-4814601-bouncy-pussy-gal-81199","114897":"fc2-ppv-4815562-can-you-lick-this-s-anus-81208","114898":"fc2-ppv-4816115-to-my-boyfriend-im-sorry-for-cheating-on-you-while-you-were-working-hard-81228","114899":"fc2-ppv-4815037-uncensored-beautiful-f-cup-half-japanese-beauty-super-cute-cow-costume-e2a4b4-beauti-81257","114900":"fc2-ppv-4816786-over-2-hours-and-45-minutes-long-2025-christmas-beautiful-santa-special-a-super-erot-81236","114901":"fc2-ppv-4816675-e29980192-first-shoot-its-too-expensive-so-dont-buy-it-half-heartedly-the-amateur-le-81259","114902":"fc2-ppv-4817521-a-beautiful-woman-who-looks-like-kawaguchi-yuna-shows-off-her-face-her-pussy-is-deve-81276","114903":"fc2-ppv-4816970-i-took-a-beautiful-girl-with-a-raccoon-face-home-and-had-raw-sex-with-her-after-drin-81279","114904":"fc2-ppv-4815683-uncensored-the-feeling-of-fleshiness-of-the-lower-body-is-too-good-the-sense-of-immo-81308","114905":"fc2-ppv-4818047-first-shoot-face-revealed-no-mosaic-cums-over-and-over-again-with-pussy-tape-finishe-81335","114906":"fc2-ppv-4820041-a-beautiful-18-year-old-college-girl-who-just-arrived-in-tokyo-she-was-at-a-loss-aft-81331","114907":"fc2-ppv-4807713-today-ends-first-time-limited-sale-3980pt-e28692-980pt-erection-is-inevitable-privat-81315","114908":"fc2-ppv-4820485-uncensored-enjoy-the-stunning-legs-and-body-of-this-tall-current-race-queen-experien-81372","114909":"fc2-ppv-4820476-uncensored-compelling-subjective-mens-massage-9-premium-class-e29885-the-ultimate-f-81358","114910":"fc2-ppv-4819986-limited-to-50-today-on-christmas-eve-twin-tailed-angels-are-made-into-miya-and-impre-81351","114911":"fc2-ppv-4821059-its-my-dangerous-day-but-please-cum-inside-me-first-time-filming-and-first-creampie-81420","114912":"fc2-ppv-4821228-production-3-maya-e29885-fox-dance-creampie-sex-e29885-gorgeous-total-of-133-minutes-81409","114913":"fc2-ppv-4821857-full-face-uncensored-overwhelming-beauty-and-g-cup-big-breasts-bounce-in-the-big-ass-81457","114914":"fc2-ppv-4822325-im-sorry-e299a1-i-wanted-to-do-it-but-got-canceled-four-times-in-a-row-so-i-filmed-m-81452","114915":"fc2-ppv-4822944-amateur-first-time-shooting-mirai-18-ntr-creampie-with-a-boyfriend-who-lives-in-the-81470","114916":"fc2-ppv-4825061-face-revealed-half-japanese-beautiful-wifes-first-and-last-face-revealed-unreleased-81531","114917":"fc2-ppv-4825193-her-number-of-sexual-partners-is-in-the-single-digits-a-popular-black-haired-neat-an-81518","114918":"fc2-ppv-4819565-uncensored-second-edition-her-cute-face-is-so-amazing-that-you-cant-imagine-it-her-b-81536","114919":"fc2-ppv-4826408-uncensored-big-ass-and-i-cup-big-tits-are-the-best-anyway-the-titty-fuck-is-amazing-97604","114920":"fc2-ppv-4825365-hairy-mushroom-breath-pure-beauty-yu-arimura-clothes-girl-beauty-body-operated-stude-97592","114921":"fc2-ppv-4816135-im-going-to-take-a-look-at-the-girls-who-wear-glasses-and-have-sex-at-times-imedamaf-97618","114922":"fc2-ppv-4827535-over-170cm-tall-ahh-im-cumming-a-beautiful-elite-young-lady-engages-in-an-unexpected-97631","114923":"fc2-ppv-4828047-uncensored-ana-type-beautiful-dental-assistant-in-high-leg-bunny-girl-costume-gets-c-97643","114924":"fc2-ppv-4828026-uncensored-18-year-old-short-haired-tall-slender-e-cup-super-beautiful-s-class-unifo-97641","114925":"fc2-ppv-4827328-big-breasts-g-cup-beauty-penetration-clothes-destruction-power-strong-fc2-electronic-97620","114926":"fc2-ppv-4824138-sequel-request-face-reveal-no-mosaic-raw-creampie-a-request-filled-creampie-fever-se-97665","114927":"fc2-ppv-4828743-big-breasted-college-student-her-g-cup-breasts-are-so-big-she-actually-lied-about-th-97703","114928":"fc2-ppv-4828947-a-well-bred-model-class-young-lady-masturbates-for-the-first-time-in-her-life-and-is-99983","114929":"fc2-ppv-4830375-uncensored-beautiful-f-cup-beauty-with-an-outstanding-figure-she-loves-naughty-thing-100013","114930":"fc2-ppv-4831302-saucy-pp-activity-jd-a-college-student-with-a-strong-aura-of-wanting-to-do-something-100015","114931":"fc2-ppv-4829318-first-shoot-face-revealed-girlfriend-no-mosaic-raw-a-precious-work-that-crosses-the-100064","114932":"fc2-ppv-4832570-e299a9-maki-a-beautiful-girl-with-a-small-face-and-a-great-figure-is-about-three-mon-100092","114933":"fc2-ppv-4835138-uncensored-a-beautiful-and-cute-receptionist-24-years-old-with-a-charming-black-hair-100503","114934":"fc2-ppv-4835158-she-looks-just-like-the-national-beauty-a-lovey-dovey-blowjob-on-a-hotel-date-with-a-100501","114935":"fc2-ppv-4834376-godly-breasts-and-a-hairy-pussy-she-wants-to-buy-a-present-for-her-first-boyfriends-100500","114936":"fc2-ppv-4825200-a-beautiful-married-woman-is-tricked-into-thinking-its-an-image-video-and-filmed-and-100168","114937":"fc2-ppv-4835116-uncensored-a-college-student-who-has-a-boyfriend-but-is-addicted-to-new-sex-gets-rea-100496","114938":"fc2-ppv-4836065-an-unexpected-sequel-a-new-female-announcer-in-her-first-year-at-the-company-falls-a-100544","114940":"fc2-ppv-4838166-uncensored-a-beautiful-neat-black-haired-girl-her-eyes-are-watery-and-shes-always-lo-100757","114941":"fc2-ppv-4838053-sakis-first-anal-sex-experience-left-her-in-agony-100759","114942":"fc2-ppv-4838776-uncensored-the-second-installment-of-the-popular-series-a-tall-slender-beauty-with-b-101649","114943":"fc2-ppv-4839545-personal-appropriation-continued-tokyo-famous-department-storee29885excellent-g-cup-101657","114944":"fc2-ppv-4839273-new-account-commemorative-special-price-face-revealed-no-makeup-its-okay-to-cum-e299-101701","114945":"fc2-ppv-4838463-until-today-first-time-limited-sale-from-3980-points-to-980-points-choose-a-therapis-101804","114946":"fc2-ppv-4840245-uncensored-a-woman-with-a-mysterious-atmosphere-and-beautiful-g-cup-breasts-and-an-o-101803","115007":"sone-219-english-subtitle-sone-219-super-newcomer-saki-shirakamis-first-three-sex-scenes-the-genius-92010","115009":"mih-007-english-subtitle-mih-007-if-you-dont-want-to-be-fired-accept-it-even-if-youre-made-to-cum-by-92202","115010":"hmn-577-english-subtitle-hmn-577-if-youre-a-slutty-av-actress-nanase-alice-try-to-guess-whos-a-virgi-92364","115011":"adn-651-english-subtitle-adn-651-i-had-sex-with-my-friends-mother-many-times-while-she-was-away-ruri-93213","115012":"sone-526-english-subtitle-sone-526-i-couldnt-resist-this-well-developed-schoolgirl-and-started-moles-93231","115038":"jera-021-uncensored-leak-jera-021-beautiful-semen-drinking-sex-friend-wife-although-she-occasionally-100358","115039":"hawa-371-uncensored-leak-hawa-371-wife-of-the-dick-case-dick-case-no-5-100371","115040":"moon-052-uncensored-leak-moon-052-while-her-husband-sleeps-nearby-the-beautiful-wife-secretly-licks-100372","115041":"piyo-227-uncensored-leak-piyo-227-teacher-if-you-love-me-then-let-me-get-pregnant-a-student-pressure-100373","115042":"piyo-228-uncensored-leak-piyo-228-7th-anniversary-of-hiyoko-real-creampie-super-impregnation-doctor-100374","115043":"sdjs-350-uncensored-leak-sdjs-350-bonus-edition-human-resources-department-yoda-hikages-first-av-app-101510","115045":"start-492-uncensored-leak-start-492-delivery-ntr-a-newlywed-wife-hikari-aozora-is-attacked-in-the-ca-101796","115236":"heyzo-3465-amazon-co-jp-32176","115238":"heyzo-3438-the-active-jd-is-very-intense-32193","115239":"heyzo-3466-beauty-x-beauty-off-paco-threesome-32195","115240":"heyzo-3436-kitazawa-lotus-licks-net-and-sucks-32196","115241":"heyzo-3459-hinata-sagiri-hinata-sagiri-new-employee-hired-for-sexual-relief-beautiful-women-collecti-32200","115242":"heyzo-3457-nagata-yuu-nagata-yuu-nagata-yuus-handjob-kiss-adult-video-heyzo-32204","115243":"heyzo-3455-mizutani-seri-a-horny-housewife-who-loves-other-mens-dicks-adult-video-heyzo-32206","115244":"heyzo-3454-nanami-hashimoto-nanami-hashimoto-i-ended-up-tricking-this-innocent-girl-who-couldnt-say-32207","115245":"heyzo-3452-asuka-motomiya-asuka-motomiya-asuka-motomiyas-handjob-kiss-adult-video-heyzo-32185","115247":"heyzo-3517-inin-inin-ajihame-vol-9-much-bigger-than-my-ex-boyfriend-adult-video-heyzo-yin-yin-32219","115248":"heyzo-3480-hitomi-mukai-mukai-hitomi-hitomi-mukai-masturbated-for-me-adult-video-heyzo-32228","115249":"heyzo-3478-maki-koizumi-maki-koizumi-widow-makis-carnal-desires-beautiful-women-collection-vol-46-ad-32229","115250":"heyzo-3500-meidoru-vol-18-32235","115251":"heyzo-3497-haru-chan-meeting-beauty-collection-volume-50-32238","115252":"heyzo-3527-pj-girl-t-san-pj-girl-t-san-pj-and-off-paco-adult-video-heyzo-pj-girl-t-32221","115253":"heyzo-3531-unun-unun-ajihame-vol-12-a-model-wanted-office-lady-gets-fucked-adult-video-heyzo-mmhmm-32276","115254":"heyzo-3580-momoka-momoka-girls-bouga-21-year-old-f-cup-female-college-student-is-in-a-state-of-ecsta-32283","115256":"heyzo-3546-yumi-saeki-yumi-saeki-attacking-the-two-holes-of-a-young-mature-woman-adult-video-heyzo-32286","115257":"heyzo-3579-i-have-a-lot-of-excitement-big-breasts-are-impressive-so-i-have-a-story-currently-perform-32289","115259":"heyzo-3561-hiromi-ooya-hiromi-ootsuka-a-slutty-mature-woman-gets-fucked-hard-vol-4-uncensored-adult-32295","115260":"heyzo-3560-natsume-rinka-natsume-rinka-please-love-me-im-frustrated-uncensored-adult-video-heyzo-32296","115261":"heyzo-3591-kate-quinn-keito-quinn-a-very-cute-russian-girl-her-small-mouth-and-pussy-are-top-notch-c-32297","115262":"heyzo-3554-mari-onodera-onodera-mari-ill-make-you-cum-with-the-techniques-of-a-mature-soap-princess-32299","115263":"heyzo-3552-nagisa-shinohara-nagisa-shinohara-unfortunate-wife-who-was-seduced-to-pay-off-debt-uncens-32301","115264":"heyzo-3550-mai-seta-mai-seta-beautiful-girls-like-it-raw-beautiful-girls-collection-vol-61-uncensore-32280","115265":"heyzo-3582-mia-mia-ajihame-vol-13-playing-with-a-dynamite-body-uncensored-adult-video-heyzo-32281","115266":"heyzo-3549-hamada-nozomi-i-love-hardcore-deep-throating-uncensored-adult-video-heyzo-32282","115267":"heyzo-3570-mai-yoshino-mai-yoshino-i-want-you-to-put-it-in-my-ass-beauty-collection-vol-65-uncensore-32309","115268":"heyzo-3568-yuna-mori-mori-yuna-please-let-me-lick-you-a-lot-vol-2-uncensored-adult-video-heyzo-32311","115269":"heyzo-3567-nao-matsumura-matsumura-nao-nao-matsumura-took-it-all-the-way-to-the-back-of-her-throat-u-32313","115270":"heyzo-3566-yua-uehara-yua-uehara-the-carnal-desires-of-a-masochistic-female-manager-beautiful-women-32314","115271":"heyzo-3565-mayuka-naruse-mayuka-naruse-the-fate-of-a-mature-woman-who-forgot-to-turn-off-her-live-st-32315","115272":"heyzo-3592-yukina-hasegawa-yukina-the-reality-of-a-beautiful-wife-who-wants-to-do-something-about-he-32293","115273":"heyzo-3584-yayoi-yamada-yamada-yayoi-a-multi-talented-woman-is-punished-with-a-bang-with-sex-to-chan-32319","115274":"heyzo-3577-nanjo-ichika-nanjo-ichika-if-you-can-clear-it-you-get-a-reward-but-if-you-cant-uncensored-32320","115275":"heyzo-3581-shion-mochizuki-shion-mochizuki-i-want-you-to-lick-me-while-sitting-on-my-face-shion-moch-32322","115276":"heyzo-3576-murakami-kotono-murakami-kotono-my-best-mistress-beautiful-women-collection-vol-67-uncens-32323","115277":"heyzo-3575-ayame-seto-seto-ayame-amateur-girl-who-wants-to-do-it-every-day-uncensored-adult-video-he-32324","115278":"heyzo-2958-misato-hara-harami-misato-big-breasted-mature-woman-gets-fucked-uncensored-adult-video-he-32325","115279":"heyzo-3615-liz-candy-liz-two-incredibly-beautiful-girls-hungarian-and-french-take-turns-putting-thei-32326","115280":"heyzo-3574-mayumi-mayumi-mayumi-masturbated-for-me-uncensored-adult-video-heyzo-32327","115281":"heyzo-3573-misaki-ren-misaki-ren-lets-all-do-it-with-the-actress-who-returns-to-av-beauty-collection-32304","115282":"heyzo-3595-zoi-zoi-ajihame-vol-14-i-healed-the-flight-attendant-and-did-it-uncensored-adult-video-he-32305","115283":"heyzo-3572-shiho-sakatani-shiho-sakatani-ill-give-you-a-present-for-your-graduation-uncensored-adult-32306","115284":"heyzo-3600-yui-satonaka-yui-satonaka-yui-satonaka-is-playd-with-toys-uncensored-adult-video-heyzo-32331","115285":"heyzo-3598-hina-hodaka-hina-hodaka-morning-sex-beauty-collection-vol-70-uncensored-adult-video-heyzo-32332","115286":"heyzo-3599-angela-angela-ajihame-vol-15-e-cup-beautician-and-naughty-play-uncensored-adult-video-hey-32333","115287":"heyzo-3597-mirai-minano-mina-no-mirai-which-one-is-tastier-mirais-penis-taste-comparison-uncensored-32334","115288":"heyzo-3618-keiko-keiko-girls-bouga-a-sexy-19-year-old-gal-with-long-narrow-eyes-and-a-fox-like-face-32335","115289":"heyzo-3596-sakura-mina-sakura-mina-sakura-mina-took-it-all-the-way-to-the-back-of-her-throat-uncenso-32336","115290":"heyzo-3590-rena-rena-madam-please-let-me-do-it-beautiful-women-collection-vol-69-uncensored-adult-vi-32337","115291":"heyzo-3589-aizawa-hina-aizawa-hina-filming-a-girl-who-likes-to-have-sex-with-her-sugar-daddy-vol-2-u-32338","115292":"heyzo-3586-nami-sawaguchi-sawaguchi-nami-ill-do-it-so-give-me-a-job-the-lewd-temptation-of-a-big-bre-32339","115293":"heyzo-3617-annina-anina-kin8-raw-sex-travelogue-eastern-european-erotic-girl-cums-with-a-japanese-sw-32316","115294":"heyzo-3588-momoko-miyazono-miyazono-momoko-ill-give-you-a-good-pounding-with-momoko-miyazonos-tits-u-32317","115295":"heyzo-3585-a-beautiful-prodigy-who-pretends-to-be-someone-else-beauty-collection-book-68e3809c-shiom-32318","115297":"heyzo-3641-kasumi-kasumi-a-horny-housewife-with-a-play-the-reality-of-an-ordinary-housewife-who-want-32343","115298":"heyzo-3608-asami-sekimoto-sekimoto-mami-asami-sekimoto-masturbated-for-me-uncensored-adult-video-hey-32344","115299":"heyzo-3607-makise-misa-makise-misa-a-voluptuous-body-girl-who-wants-to-have-sex-beautiful-women-coll-32345","115300":"heyzo-3606-e88887ptom-to-make-a-married-woman-miyagi-mayumi-32346","115301":"heyzo-3605-one-of-the-most-beautiful-mature-women-on-the-internet-lol-kanami-makoto-i-need-urine-uno-32347","115302":"heyzo-3604-rino-sakuragi-sakuragi-rino-rino-sakuragi-licks-and-sucks-it-hard-vol-3-uncensored-adult-32348","115303":"heyzo-3640-he-was-21-years-old-with-smooth-dark-colored-skin-a-very-elongated-appearance-and-a-large-32349","115304":"heyzo-0273-minako-uchida-michiko-serenade-minako-uchida-the-advent-of-a-lusty-wife-14-part-2-uncenso-32350","115305":"heyzo-3602-haruka-funakoshi-haruka-funakoshi-its-been-a-while-so-make-me-feel-good-uncensored-adult-32328","115306":"heyzo-3601-mio-togashi-togashi-mio-after-you-cum-ill-clean-you-up-ill-lick-you-so-lick-me-in-return-32329","115307":"heyzo-3619-ye2978eutuber-h-chan-boyish-g-chan-ecchi-chan-beautiful-woman-x-beautiful-woman-sloppy-x-32330","115308":"heyzo-3643-s-chan-a-job-hunting-student-at-her-limit-genkai-shukatsu-seiesu-chan-off-paco-with-a-job-32355","115309":"heyzo-3622-mio-kanade-ill-give-you-a-good-squirt-with-mio-kanades-tits-uncensored-adult-video-heyzo-32356","115310":"heyzo-0233-morinaga-hiyoko-morinaga-hiyoko-sky-angel-vol-128-part-2-uncensored-adult-video-heyzo-32357","115311":"heyzo-3621-minami-nakata-minami-nakata-av-instruction-for-minami-chan-beauty-collection-vol-74-uncen-32358","115312":"heyzo-3614-miho-ishii-miho-ishii-i-made-a-toy-loving-mature-woman-cum-with-raw-sex-uncensored-adult-32359","115313":"heyzo-3613-aya-goto-aya-goto-a-masochistic-womans-loose-crotch-i-want-you-to-play-with-me-a-lot-unce-32360","115314":"heyzo-3642-saya-saya-girls-bouga-sayas-ticklish-gestures-are-cute-and-she-gets-more-and-more-erotic-32361","115315":"heyzo-3612-mirei-imada-imada-mirei-take-a-closer-look-at-mirei-imadas-body-uncensored-adult-video-he-32362","115316":"heyzo-0256-ichika-asagiri-ichika-asagiri-the-advent-of-a-lustful-wife-20-part-2-uncensored-adult-vid-32363","115317":"heyzo-3611-tsuyuri-ayase-tsuyuri-ayase-huge-boobs-beautiful-women-collection-vol-73-uncensored-adult-32340","115318":"heyzo-3610-maria-maria-i-thoroughly-enjoyed-this-big-breasted-amateur-girl-vol-15-uncensored-adult-v-32341","115319":"heyzo-3609-honda-tsubaki-i-got-turned-on-by-the-beautiful-busty-cleaning-lady-and-fucked-her-uncenso-32342","115320":"heyzo-3631-erika-kano-erika-kano-making-a-pet-maid-cum-over-and-over-again-vol-4-uncensored-adult-vi-32366","115321":"heyzo-3630-sumire-maeda-sumire-maeda-my-friends-mother-was-so-sexy-i-couldnt-stand-it-vol-2-uncensor-32367","115322":"heyzo-3653-mika-kinoshita-mika-a-naive-female-college-student-the-reality-of-a-shaved-female-college-32368","115323":"heyzo-3629-satoko-hayashi-hayashi-satoko-satoko-hayashi-masturbated-for-me-uncensored-adult-video-he-32369","115324":"heyzo-3628-rina-kawamura-rina-kawamura-explosively-erotic-body-double-hole-attack-beauty-collection-32370","115325":"heyzo-3627-mie-arita-mie-arita-i-want-to-have-sex-frustrated-housewife-ive-never-had-an-orgasm-from-32371","115326":"heyzo-3626-momo-mogami-mogami-momo-a-lustful-woman-with-a-sensual-charm-is-thoroughly-made-to-climax-32372","115327":"heyzo-3652-alice-alice-spread-your-legs-wide-and-make-a-face-while-getting-creampied-uncensored-adul-32373","115328":"heyzo-3625-yoda-chika-yoda-chika-yoda-chikas-handjob-kiss-uncensored-adult-video-heyzo-32374","115329":"heyzo-3624-rinka-tachibana-rinka-tachibana-have-rinka-with-her-sexy-body-all-to-yourself-beautiful-w-32352","115330":"heyzo-3620-unun-unun-ajihame-vol-16-a-big-cumshot-to-celebrate-our-reunion-uncensored-adult-video-he-32353","115331":"heyzo-3623-ryu-enami-ryu-enami-please-let-me-do-it-once-fucking-my-boss-with-a-nice-body-uncensored-32354","115332":"heyzo-3645-shiho-sakatani-shiho-sakatani-shiho-sakatani-licks-and-sucks-thoroughly-uncensored-adult-32378","115333":"heyzo-3639-emiri-miura-emiri-miura-beautiful-and-lewd-erotic-body-beautiful-women-collection-vol-79-32379","115334":"heyzo-3644-yuuna-yuuna-ajihame-vol-17-fucking-a-cheerleader-with-a-nice-body-uncensored-adult-video-32380","115335":"heyzo-3638-fujino-rin-fujino-rin-steamy-married-woman-affair-journey-vol-2-uncensored-adult-video-he-32381","115336":"heyzo-3655-kaori-kaori-girls-bouga-ss-class-cute-female-college-student-and-active-high-jump-athlete-32382","115337":"heyzo-3637-runa-yamagishi-yamagishi-runa-runa-yamagishis-handjob-kiss-uncensored-adult-video-heyzo-32383","115338":"heyzo-3636-nami-amuro-amuro-nami-my-best-sex-friend-beautiful-women-collection-vol-78-uncensored-adu-32384","115339":"heyzo-3635-nono-otsuki-nono-otsuki-anal-sex-with-a-mature-woman-sex-friend-uncensored-adult-video-he-32385","115340":"heyzo-3634-nozomi-maruyama-nozomi-maruyama-continuous-ejaculation-creampie-galore-vol-5-uncensored-a-32386","115341":"heyzo-3654-ester-ester-the-person-i-met-that-day-was-the-powerful-principal-amateur-creampie-ester-u-100440","115342":"heyzo-3633-takagaki-kaede-takagaki-kaede-ill-give-you-a-good-pounding-with-takagaki-kaedes-tits-unce-32364","115343":"heyzo-3632-miya-izumi-miya-izumi-marshmallow-body-fucked-hard-beauty-collection-vol-77-uncensored-ad-32365","115344":"heyzo-3658-feng-mans-private-instructors-guide-to-sexual-love-an-exquisite-physical-virginity-rion-32389","115345":"heyzo-3657-aika-hoshino-aika-hoshino-aika-hoshino-licks-and-sucks-hard-uncensored-adult-video-heyzo-32390","115346":"heyzo-3686-a-simple-and-easy-to-understand-play-who-has-a-problem-hirose-akimi-32391","115347":"heyzo-3656-satomi-inoue-satomi-inoue-i-stole-my-best-friends-girlfriend-and-did-it-beautiful-women-c-32392","115348":"heyzo-3651-hinata-takada-takada-hinata-lovey-dovey-creampie-sex-with-a-slender-black-haired-amateur-32393","115349":"heyzo-3650-nami-sawaguchi-sawaguchi-nami-i-called-my-married-sex-friend-and-did-whatever-i-wanted-wi-32394","115350":"heyzo-3685-timi-timi-a-real-life-nurse-who-will-gently-nurse-your-penis-amateur-housewife-creampie-u-32395","115351":"heyzo-3649-miyazono-momoko-miyazono-momoko-miyazono-momoko-is-playd-with-toys-uncensored-adult-video-32396","115352":"heyzo-3648-shiraki-riri-shiraki-riri-riri-and-subjective-sex-beauty-collection-vol-80-uncensored-adu-32397","115353":"heyzo-3647-karen-nishizaki-karen-nishizaki-making-a-married-woman-cum-with-ptom-vol-2-uncensored-adu-32375","115354":"heyzo-3646-satomi-satomi-ill-make-you-cum-with-cosplay-uncensored-adult-video-heyzo-32376","115355":"heyzo-3680-yume-yume-a-hostess-who-gets-creampied-all-night-and-then-dumped-uncensored-adult-video-h-32377","115356":"heyzo-3667-miyu-morita-miyu-morita-please-let-me-cum-a-lot-beauty-collection-vol-84-uncensored-adult-32400","115358":"heyzo-3666-yurina-matsuzaka-yurina-matsuzaka-make-a-beautiful-big-breasted-mature-woman-cum-in-ptom-32401","115360":"heyzo-3663-ema-kato-kato-uema-climax-massage-at-the-beauty-salon-she-took-it-deep-into-her-throat-un-32402","115362":"heyzo-3688-amateur-amateur-creampie-with-a-hotel-maid-uncensored-adult-video-heyzo-32403","115364":"heyzo-3665-natsume-rinka-natsume-rinka-natsume-rinka-licks-and-sucks-thoroughly-uncensored-adult-vid-32404","115366":"heyzo-3662-shiho-sakatani-shiho-sakatani-a-beautiful-slut-who-suddenly-masturbates-beautiful-women-c-32405","115368":"heyzo-3664-nancy-nanshii-ajihame-vol-18-piercing-into-a-beautiful-busty-female-doctor-uncensored-adu-32406","115370":"heyzo-3661-aya-hamanaka-aya-hamanaka-i-made-this-slutty-milf-cum-uncensored-adult-video-heyzo-32407","115372":"heyzo-3687-saori-saori-girlsbouga-a-young-office-lady-with-slender-black-hair-beautiful-bowl-shaped-32408","115374":"heyzo-3660-nanjo-ichika-nanjo-ichika-i-want-you-to-lick-me-while-sitting-on-my-face-in-the-case-of-n-32409","115376":"heyzo-3659-koharu-chans-anus-exhibition-beauty-collection-book-82e3809c-tachibana-koharu-32387","115378":"heyzo-3490-tamaki-rara-tamaki-rara-a-frustrated-and-horny-mature-woman-uncensored-adult-video-heyzo-32388","115380":"heyzo-3677-yamashita-moeka-yamashita-moeka-lovey-dovey-sex-with-a-black-haired-beauty-found-on-a-dat-32412","115381":"heyzo-3676-honda-tsubaki-honda-tsubaki-licks-and-sucks-hard-uncensored-adult-video-heyzo-32413","115382":"heyzo-3675-sakura-nene-sakura-nene-ill-squeeze-you-between-my-obscene-breasts-beauty-collection-vol-32414","115383":"heyzo-3674-nanako-kayama-kayama-nanako-mature-slut-showing-off-her-voluptuous-body-in-a-knit-dress-u-32415","115384":"heyzo-3673-nagase-nako-nagase-nako-i-cant-forget-my-ex-boyfriends-body-a-young-wife-intoxicated-with-32416","115385":"heyzo-3689-satomi-satomi-sexy-breasted-beautys-handjob-kiss-uncensored-adult-video-heyzo-32417","115386":"heyzo-3672-aya-goto-goto-aya-ill-give-you-a-good-pounding-with-aya-gotos-tits-uncensored-adult-video-32418","115387":"heyzo-3671-maria-osawa-maria-osawa-serving-in-uniform-beautiful-women-collection-vol-85-uncensored-a-32419","115388":"heyzo-3670-moe-koitabashi-moe-koitabashi-i-dressed-an-amateur-girl-in-a-sexy-swimsuit-and-did-it-vol-32420","115389":"heyzo-3669-shizuka-oshiro-shizuka-oshiro-continuous-ejaculation-creampie-galore-vol-6-uncensored-adu-32421","115390":"heyzo-3697-gabby-audrey-gabby-audrey-this-busty-white-beauty-was-made-to-cum-multiple-times-by-a-jap-32398","115391":"heyzo-3668-kawai-yoko-masturbation-kawai-yoko-32399","115392":"heyzo-3692-kirino-azumi-kirino-azumi-widow-azumis-carnal-desires-beautiful-women-collection-vol-89-u-32424","115393":"heyzo-3690-ogura-ami-ogura-ami-slippery-pleasure-premium-soapland-girls-ultimate-service-vol-5-uncen-32426","115394":"heyzo-3721-milan-milan-the-most-beautiful-girl-ive-ever-met-the-best-body-the-best-pussy-creampie-un-32427","115395":"heyzo-3684-haruna-nakano-haruna-nakano-a-new-soapland-girl-gets-a-squirting-injection-beautiful-wome-32428","115396":"heyzo-3683-alice-alice-ajihame-vol-19-i-tried-to-fuck-a-big-breasted-girl-on-a-job-hunt-uncensored-a-32429","115397":"heyzo-3682-nishizono-sakuya-nishizono-sakuya-beautiful-slut-the-temptation-of-a-beautiful-big-titted-32430","115398":"heyzo-3700-ye2978eutuber-h-chan-ecchi-chan-fairy-ye2978eutuber-natsu-stimulates-your-crotch-raw-insi-32431","115399":"heyzo-3681-tamaki-rara-tamaki-rara-tamaki-rara-took-it-deep-into-her-throat-uncensored-adult-video-h-32432","115400":"heyzo-3679-mirai-minano-mina-no-mirai-i-got-screwed-as-a-form-of-debt-beauty-collection-vol-87-uncen-32433","115401":"heyzo-3678-sanae-misono-a-married-woman-who-moans-and-writhes-on-a-cock-other-than-her-husbands-vol-32410","115402":"heyzo-3699-emi-emi-girlsbouga-a-g-cup-female-college-student-appears-ecstatic-as-her-pussy-anus-and-32411","115403":"heyzo-3707-akihi-habai-vol-20-superb-play-physical-training-ray-32436","115404":"heyzo-3706-beautiful-breasts-servant-erotic-secret-discussion-yoshino-hashiba-32437","115405":"heyzo-3705-mirei-imadas-anus-is-in-full-swing-mirei-imada-32438","115406":"heyzo-3704-i-have-a-female-friend-who-is-my-best-friend-and-i-have-a-green-hat-with-a-green-hat-whic-32439","115407":"heyzo-3696-shinshin-mukai-daika-michiaki-beauty-collection-vol-90-hinata-tsuyoshi-32443","115408":"heyzo-3694-sayaka-hoshino-hoshino-sayaka-i-had-sex-with-my-best-friends-mother-whom-i-admired-vol-3-32444","115409":"heyzo-3695-painted-crow-toys-high-tide-amateur-girl-vol-4-shiori-yamanaka-32445","115410":"heyzo-3722-haruna-haruna-giirls-bouga-a-cute-smiling-gunma-yankee-gal-i-met-at-an-akabane-snack-bar-32422","115411":"heyzo-3693-yuna-mori-mori-yuna-yuna-mori-licks-and-sucks-thoroughly-uncensored-adult-video-heyzo-32423","115412":"heyzo-3719-i-am-a-single-professional-woman-who-wears-a-swimsuit-with-a-strong-skin-vol-6-mirai-kami-32448","115413":"heyzo-3717-riku-nekoda-nekotariku-riku-nekoda-is-playd-with-toys-uncensored-adult-video-heyzo-riku-n-32450","115414":"heyzo-3716-rion-rion-do-whatever-you-want-with-this-beautiful-busty-girl-beautiful-women-collection-32451","115415":"heyzo-3713-hina-kusakabe-hina-kusakabe-hina-kusakabe-licks-and-sucks-thoroughly-uncensored-adult-vid-32454","115416":"heyzo-3711-a-multi-faceted-woman-with-a-world-class-personality-success-and-failure-vol-2-shiori-man-32456","115417":"heyzo-3709-nagisa-kazama-kazama-nagisa-nagisa-kazama-licks-and-sucks-thoroughly-uncensored-adult-vid-32434","115418":"heyzo-3774-nozomi-nozomi-girlsbouga-do-you-like-the-sight-of-a-hot-girl-of-sss-class-shyly-squirting-29347","115419":"heyzo-3734-kanami-uno-uno-kanami-kanami-uno-wets-herself-uncensored-adult-video-heyzo-kana-uno-29348","115420":"heyzo-3733-hana-aoyama-hana-aoyama-i-cant-forget-my-ex-boyfriends-body-beauty-collection-vol-97-unce-29349","115421":"heyzo-3732-hanhan-hanhan-ajihame-vol-21-izakaya-girl-uncensored-adult-video-heyzo-bang-bang-29350","115422":"heyzo-3749-yumi-sakashita-yumi-a-sexy-office-lady-in-a-competitive-swimsuit-once-she-feels-it-her-de-29351","115423":"heyzo-3731-aoyama-mayu-aoyama-mayu-i-get-excited-when-im-stared-at-perverted-masturbation-of-a-matur-29352","115424":"heyzo-3730-mina-sakuras-anus-sakuramaina-29353","115425":"heyzo-3729-an-elegant-and-beautiful-womans-lewd-feast-beauty-collection-vol-96-satomi-ishikawa-mai-s-29354","115426":"heyzo-3727-natsume-rinka-natsume-rinka-excessive-service-from-a-mens-beauty-salon-lady-in-a-boyfrien-29356","115427":"heyzo-3726-sanae-hosodas-anus-sanae-hosoda-32446","115428":"heyzo-3776-kanon-kanon-i-saw-a-girl-who-was-waiting-for-me-and-seemed-to-be-bored-so-i-asked-her-if-29362","115429":"heyzo-3742-nishizono-sakuya-nishizono-sakuya-ill-give-you-a-good-pounding-with-nishizono-sakuyas-tit-29363","115430":"heyzo-3741-ogura-ami-ogura-ami-i-stole-my-best-friends-girlfriend-beautiful-women-collection-vol-99-29364","115431":"heyzo-3740-amelia-amelia-do-whatever-you-want-with-this-half-japanese-beauty-with-an-exquisite-body-29365","115432":"heyzo-3739-hoshino-miki-hoshino-miki-immoral-sex-with-her-sons-friend-uncensored-adult-video-heyzo-m-29366","115433":"heyzo-3775-daisy-cake-daisy-cake-a-corrupt-japanese-teacher-who-makes-the-cute-student-council-presi-29367","115434":"heyzo-3738-miyu-morita-miyu-morita-miyu-morita-licks-and-teases-the-anus-uncensored-adult-video-heyz-29368","115435":"heyzo-3737-hinami-rin-sasaki-kana-hinami-rin-lewd-feast-with-lewd-beauties-beauty-collection-vol-98-100442","115436":"heyzo-3736-sumire-sakaguchi-sumire-sakaguchi-i-made-a-slutty-milf-cum-vol-2-uncensored-adult-video-h-29345","115437":"heyzo-3735-runa-yamagishi-yamagishi-runa-continuous-ejaculation-creampie-galore-vol-7-uncensored-adu-29346","115438":"heyzo-3794-sherena-sherena-intelligent-italian-beauty-truly-a-slut-with-a-sexy-body-creampie-uncenso-100454","115439":"heyzo-3759-misa-makise-mai-yoshino-hikari-mizusumi-misa-makise-women-captivated-by-titty-fucking-bon-100455","115440":"heyzo-3758-kudo-reika-kudo-reika-i-tried-using-the-beautiful-office-lady-who-came-to-handle-a-compla-100456","115441":"heyzo-3757-maho-hoshijima-hoshijima-maho-raw-sex-with-a-tall-black-haired-gal-at-a-sex-industry-inte-100457","115442":"heyzo-3756-yuri-shiraishi-yuri-shiraishi-unfortunate-wife-who-gets-screwed-as-a-form-of-her-husbands-100458","115443":"heyzo-3755-miya-izumi-miya-izumi-making-a-beautiful-busty-girl-cum-in-ptom-beautiful-women-collectio-100443","115444":"heyzo-3754-nozomi-maruyama-nozomi-maruyama-lewd-temptation-of-a-horny-office-lady-vol-3-uncensored-a-100444","115445":"heyzo-3753-rino-tanaka-tanakario-intense-sex-while-playing-with-her-breasts-i-want-to-make-them-bigg-100445","115446":"heyzo-3752-sakura-sakura-ajihame-vol-22-f-cup-who-wants-to-be-an-influencer-uncensored-adult-video-h-100446","115447":"heyzo-3751-sakurada-momoha-sakurada-momoha-please-cuckold-my-wife-my-sexy-busty-wife-is-played-with-29357","115448":"heyzo-3745-tachibana-anri-tachibana-anri-beautiful-and-erotic-body-beautiful-women-collection-vol-10-29359","115449":"heyzo-3770-rena-hiiragi-rena-hiiragi-do-whatever-you-want-with-the-blonde-gal-beauty-collection-vol-100769","115450":"heyzo-3769-chee-chee-chee-chee-ajihame-vol-23-f-cup-female-doctors-obscene-palpation-uncensored-adul-100770","115451":"heyzo-3768-nozomi-mirina-nozomi-mirina-i-want-to-swallow-a-masochistic-woman-who-loves-to-drink-seme-100771","115452":"heyzo-3796-babico-babico-giirls-bouga-shibuyas-stunningly-stylish-g-cup-black-gal-is-completely-ecst-100772","115453":"heyzo-3767-mikuro-komori-mai-sasaki-moena-nishiuchi-mikuro-komori-women-who-want-to-suck-bonus-speci-100773","115454":"heyzo-3766-mayu-komikawa-mayu-komikawa-can-i-cum-in-your-mouth-beauty-collection-vol-104-uncensored-100447","115455":"heyzo-3765-hayakawa-kaho-hayakawa-kaho-a-contract-is-concluded-if-shes-ok-with-creampies-i-used-the-100448","115456":"heyzo-3763-yui-shinjo-yui-shinjo-yui-shinjo-licks-and-teases-the-anus-uncensored-adult-video-heyzo-100449","115457":"heyzo-3795-yukari-yukari-amateur-young-wifes-lewd-body-i-got-yukari-excited-and-took-off-her-mask-un-100450","115458":"heyzo-3762-ibuki-kanon-big-breasted-nurse-whos-good-at-sucking-beautiful-women-collection-vol-103-un-100451","115459":"heyzo-3760-hamada-nozomi-a-soaked-beauty-in-a-yukata-gets-soaked-again-in-a-love-hotel-vol-2-uncenso-100453","115460":"heyzo-3771-eri-saeki-eri-saeki-eri-saeki-licks-and-teases-your-anus-uncensored-adult-video-heyzo-101669","115461":"heyzo-3797-amateur-amachua-the-secret-face-of-a-major-company-director-02-uncensored-adult-video-hey-101554","116214":"jur-186-english-subtitle-jur-186-this-might-be-the-last-erection-of-my-life-so-just-let-me-put-it-in-100693","116215":"jur-212-english-subtitle-jur-212-natural-k-cup-breasts-bomb-madonna-transfer-2nd-release-she-loves-h-103985","116216":"abf-203-english-subtitle-abf-203-i-left-umi-yahagi-at-a-guesthouse-full-of-men-includes-25-minutes-o-93392","116408":"123av-watch-hd-jav-online-free-high-quality-av-3-110607","116409":"123av-watch-hd-jav-online-free-high-quality-av-3-110607","116410":"123av-watch-hd-jav-online-free-high-quality-av-3-110607","116416":"heyzo-3838-ksenia-kusenia-super-super-super-cute-blonde-girl-cums-hard-even-though-its-her-first-sho-104032","116417":"heyzo-3793-honda-tsubaki-see-through-and-lewd-tsubaki-chan-beauty-collection-vol-110-uncensored-adul-103821","116418":"heyzo-3792-miyuki-okazaki-if-you-want-to-hire-me-let-me-do-it-uncensored-adult-video-heyzo-103772","116419":"heyzo-3791-sayaka-hoshino-hoshino-sayaka-the-dirty-secret-of-an-immoral-wife-that-her-husband-cant-t-103758","116420":"heyzo-3790-nishizono-sakuya-nishizono-sakuya-erotic-massage-for-pleasure-in-the-case-of-nishizono-sa-103718","116421":"heyzo-3787-nono-ajihame-vol-24-big-breasted-housewife-unleashes-her-sexual-desire-uncensored-adult-v-103615","116422":"heyzo-3789-sex-with-big-breasted-girl-yokai-beauty-channel-vol-109-ayase-tsuyuri-103711","119452":"cus-2534-my-sister-and-i-have-a-forbidden-reunion-and-love-is-endless-12220","119453":"cus-2543-deep-throat-doggy-style-woman-on-top-various-intense-sex-positions-until-orgasm-12257","119672":"cus-2559-angel-movie-triwizard-tournament-the-chairmans-trial-12291","120324":"cus-2556-sakura-girl-sex-record-ep39-first-person-immersive-sex-12285","121076":"cus-2568-angel-films-g-cup-small-horse-on-the-road-handing-out-flyers-pretty-sister-part-time-studen-12306","121160":"sone-438-english-subtitle-sone-438-miyu-kohinatas-god-facing-fan-appreciation-festival-if-you-can-wi-92902","121165":"mvsd-624-english-subtitle-mvsd-624-im-an-introvert-a-pizza-lover-and-a-virgin-but-for-some-reason-a-92965","121181":"start-220-english-subtitle-start-220-my-sister-who-has-a-husband-helped-me-practice-kissing-with-her-93098","121182":"bbtu-094-english-subtitle-bbtu-094-invaded-with-sensual-dirty-talk-and-big-breasts-shiori-hamabe-ham-93099","121193":"jur-163-english-subtitle-jur-163-a-married-woman-who-attends-night-school-loses-track-of-time-and-ha-93257","121194":"123av-watch-hd-jav-online-free-high-quality-av-3-110607","121195":"aldn-407-english-subtitle-aldn-407-mother-in-law-youre-so-much-better-than-my-wife-sakuma-kaede-kaed-93278","121196":"aldn-408-english-subtitle-aldn-408-old-man-lucky-hinako-suga-3-93280","121198":"aldn-409-english-subtitle-aldn-409-wife-friend-suddenly-raw-iroha-narimiya-narimiya-iroha-3-93282","122250":"123av-watch-hd-jav-online-free-high-quality-av-3-110607","123564":"mida-792-pussy-wide-open-my-beautiful-pussy-was-completely-exposed-the-whole-time-and-even-though-it-123356","123565":"mifd-732-new-graduate-interview-hired-on-the-spot-new-female-employee-is-so-perverted-she-makes-her-123355","123566":"pppe-434-when-i-went-home-for-the-holidays-my-playhood-sweetheart-had-become-my-dads-mistress-watchi-123403","123567":"pred-882-a-convenient-plain-looking-bespectacled-big-breasted-junior-office-lady-whos-okay-with-unpr-123396","123568":"pred-884-when-i-teased-my-abstinent-dick-with-a-bra-less-panty-less-provocation-my-slutty-sister-cam-123395","123569":"pred-887-my-erection-wouldnt-go-down-so-i-asked-miyu-sensei-to-take-care-of-me-her-plump-beautiful-b-123394","123570":"prwf-013-first-time-filming-the-secret-wife-of-a-member-of-the-elite-she-sought-freedom-and-radiance-123413","123601":"tikb-225-please-make-me-your-sex-toy-cosplayer-karin-kitaoka-always-ready-for-unprotected-sex-kitaok-123502","123603":"ksbj-441-mom-your-nipples-are-sensitive-arent-they-a-stepmother-who-soothes-her-sexual-frustrations-123456","123605":"tanp-055-im-going-to-be-an-av-actress-shinonome-yuki-a-crossdressing-sex-slave-makes-her-debut-yuki-123503","123629":"ankb-045-a-brother-and-sister-trip-to-an-open-air-hot-spring-with-a-voluptuous-seductive-and-lewd-ol-123434","123631":"ddob-142-vaginal-orgasm-muscle-fuck-kaori-yamamoto-123429","123633":"gtj-175-play-drug-neo-koharu-miike-miike-koharu-123462","123636":"hoks-232-harmful-book-caregivers-secret-confession-diary-by-satomi-mioka-satomi-oka-123457","123638":"ksbj-442-wife-offered-for-career-advancement-it-would-be-terrible-if-the-company-found-out-about-thi-123455","123640":"kymi-057-cfnm-fully-clothed-shiny-pantyhose-leotard-lewd-woman-onosaka-yuika-yuika-onozaka-123454","123642":"mibb-084-sexy-and-beautiful-older-sisters-pantyhose-fetish-sex-celebrity-style-play-without-taking-o-123495","123644":"mibb-085-a-beautiful-woman-goes-wild-with-clothed-sex-contrary-to-her-appearance-shes-a-drunken-fuck-123494","123645":"sqte-709-meisa-nishimoto-the-junior-whos-always-ready-to-use-as-a-sex-toy-sarina-toyama-123507","123647":"sqte-710-this-girl-is-crazy-she-loves-sex-more-than-food-she-wants-to-think-about-sex-all-the-time-t-123506","123648":"sqte-711-this-girl-is-insane-she-gets-all-lovey-dovey-when-drunk-a-kiss-loving-beautiful-girl-who-sq-123505","123649":"suji-315-the-terror-and-shame-that-leaves-her-speechless-silent-slutty-sex-with-internal-ejaculation-123504","123652":"beaf-225-young-men-who-only-want-to-have-sex-without-foreplay-are-out-of-the-question-i-love-older-m-123510","123654":"dandya-046-could-you-show-me-the-pictures-you-secretly-took-the-older-flight-attendant-blushes-when-123514","123656":"hawa-384-a-housewife-living-an-ordinary-life-for-19-years-of-marriage-lately-she-feels-her-heart-gro-123513","123658":"piyo-234-if-this-isnt-a-game-then-cum-inside-me-the-daily-life-of-a-love-affair-driven-mad-by-infide-123511","123659":"mkon-147-im-troubled-by-my-excessively-thick-pubic-hair-ill-teach-this-j-type-girl-whos-worried-abou-123492","123660":"mkon-146-my-friends-little-sister-was-a-total-sassy-brat-she-straddled-me-called-me-pathetic-and-mil-123493","123662":"mium-1402-her-bouncing-arching-waist-is-the-best-lol-shes-so-cute-but-her-orgasm-is-so-spectacular-l-123437","123663":"crnx-354-4k-unable-to-control-himself-he-gives-his-sweet-voiced-big-assed-girlfriend-a-standing-dogg-123435","123664":"fns-246-sweet-whispers-sticky-dirty-talk-continuous-tit-fuck-asmr-tit-fuck-play-goddess-jun-123438","123665":"scmf-003-sweet-and-sadistic-completely-subjective-sex-lick-service-with-a-tongue-thats-slick-with-sa-123486","123669":"tkd-072-yui-the-landlady-is-an-extremely-wild-slutty-landlady-yui-nonami-123501","123709":"start-622-want-to-cum-from-my-kiss-four-scenarios-where-a-mans-hips-will-be-thrusting-uncontrollably-123527","123712":"start-627-someone-elses-is-the-beste299aa-mei-miyajima-a-seductive-bunny-girl-tempts-married-men-and-123528","123717":"mvsd-703-midsummer-porchio-intensive-training-camp-athlete-beauty-ruru-hanekawa-repeatedly-reaches-s-123532","123718":"dldss-545-to-protect-honor-students-from-delinquent-students-married-female-teacher-after-school-sex-123535","123720":"jac-240-big-breasted-masochistic-female-the-dignity-of-a-sex-friend-the-insatiable-carnal-desires-of-123593","123722":"hmrk-045-slender-and-curvy-with-huge-breasts-a-seductive-little-devil-beauty-sweetly-and-erotically-123594","123726":"mxgs-1442-my-girlfriend-is-misaki-kanna-an-exciting-cohabitation-life-kanna-misaki-123508","123728":"mxgs-1443-kana-morisawa-a-beautiful-wife-whose-body-is-a-target-for-men-kana-morisawa-kanako-iioka-123509","123825":"mudr-394-a-sexually-charged-overly-erotic-schoolgirl-in-uniform-drenched-in-sweat-devours-a-man-in-a-123378","123826":"mudr-385-a-tomboyish-handsome-girl-makes-a-comeback-in-the-adult-film-industry-a-true-lesbian-shes-b-123332","123827":"mngs-078-my-older-sister-a-gal-whos-too-kind-to-me-a-shut-in-younger-brother-abandoned-by-his-family-123333","123834":"dsjh-018-harlem-girls-e2978f-irrumatio-theyre-all-my-throat-pets-yumi-nijimura-123406","123835":"dsjh-019-lewd-training-for-new-employees-pantyhose-fixed-vibrator-continuous-orgasmic-convulsions-2-123405","123837":"mvsd-693-hasumi-claire-a-sexless-housewife-living-next-door-to-her-husband-is-driven-wild-with-pleas-123371","123838":"pppe-436-naked-big-breasted-housekeeper-kanna-miki-miki-kanna-123401","123839":"pppe-437-fumika-nakayama-a-busty-club-girl-with-a-timid-personality-who-couldnt-say-no-was-repeatedl-123400","123840":"pppe-444-well-send-you-a-busty-beastly-bitch-wholl-give-you-a-titjob-and-blowjob-right-away-rinoa-ri-123398","123841":"pred-871-my-husbands-boss-targeted-my-nipples-and-turned-me-into-a-nipple-slave-yukimura-izuki-123397","123842":"pred-891-i-never-imagined-that-her-refined-older-sisters-true-nature-was-that-of-a-frustrated-raw-fu-123427","123843":"mvsd-704-175cm-tall-sexually-deranged-tattooed-masochistic-gal-makes-her-debut-kisaragi-yozora-123370","123844":"prwf-015-she-becomes-addicted-to-the-deep-kissing-and-cumming-inside-of-a-virile-old-man-and-comes-t-123412","123845":"mukd-583-youthful-iramachia-nagisa-chan-the-cheerleading-captain-with-a-receding-throat-123372","123846":"muka-010-dressing-an-adult-body-in-a-school-uniform-perverted-exhibitionist-humiliation-play-and-shy-123375","123848":"mufr-011-the-day-i-crossed-the-line-with-just-a-female-friend-my-classmate-is-a-female-bassist-chasi-123376","123849":"mudr-400-i-witnessed-my-masturbation-obsessed-shut-in-sisters-extreme-masturbation-and-i-was-appoint-123377","123855":"mida-755-masked-wifes-live-stream-ntr-while-searching-for-something-to-masturbate-to-online-i-came-a-123357","123856":"mimk-287-i-a-college-student-had-raw-sex-with-the-beautiful-dark-skinned-gyaru-esque-building-manage-123351","123857":"mngs-075-i-turned-down-the-confession-of-my-superhero-boss-red-and-was-played-into-becoming-a-high-c-123335","123858":"mudr-391-two-fireworks-sexy-part-time-jobs-for-female-high-school-students-the-first-sexual-experien-123379","123860":"mukc-128-arrogant-card-battle-heroine-defeated-complete-guide-to-card-battler-teary-eyed-yumi-by-yum-123374","123861":"mukc-130-heres-a-glimpse-into-the-daily-life-of-a-busty-self-proclaimed-secret-account-girl-who-post-123373","123862":"pred-888-did-my-big-ass-make-you-hard-a-female-teacher-who-gets-jealous-of-a-student-who-has-a-girlf-123393","123864":"pred-892-at-my-home-working-as-a-young-wife-in-a-beauty-salon-i-couldnt-resist-the-splayful-penis-ru-123414","123865":"mngs-076-anywhere-instant-sex-begging-for-cumming-inside-rental-girlfriend-a-sex-obsessed-beast-who-123334","123879":"mikr-116-if-you-love-morihina-so-much-drink-all-of-her-saliva-cum-pee-and-cum-dripping-with-exciteme-123354","123880":"mikr-117-youll-fall-in-love-with-this-smile-mirei-shirakawa-a-beautiful-woman-who-comes-along-once-i-123353","123881":"mikr-119-a-beautiful-extremely-erotic-and-convenient-older-sister-who-will-come-running-whenever-and-123352","123882":"mimk-293-secretly-grab-a-dick-from-a-girl-walking-down-the-street-and-make-her-give-you-a-handjob-wh-123350","123883":"pppe-433-12-hour-nonstop-sexual-development-monitoring-convulsions-squirting-arching-back-fainting-a-123404","123884":"pppe-435-after-missing-the-last-train-home-from-a-company-drinking-party-a-busty-junior-female-colle-123402","123885":"pppe-438-my-hated-stepfathers-dick-was-just-perfect-even-though-he-was-just-cumming-inside-me-quickl-123399","123887":"missav-watch-hd-jav-online-free-high-quality-av-123551","123938":"smkd-012-complete-coma-4-people-magazine-editor-34-172cm-instructor-24-convenience-store-part-timer-123485","124013":"clot-042-my-black-pantyhose-wearing-tutor-is-my-classmate-chinami-natsuno-123937","124016":"milk-302-the-girl-who-showed-up-at-our-meeting-place-was-a-plain-unremarkable-high-school-student-wi-123919","124017":"nact-169-practical-training-for-home-care-workers-specializing-in-sexual-care-mika-sumikawa-123936","124018":"nact-173-married-woman-live-stream-collaboration-watch-me-being-sexier-than-usual-secret-meeting-wit-123933","124019":"nact-174-chain-ntr-repeated-cheating-and-being-cheated-on-remi-mikage-mikage-remi-123932","124020":"nact-175-the-landlady-of-the-rural-place-where-im-staying-is-a-beautiful-woman-and-a-naturist-kobaya-123931","124023":"snos-409-please-let-me-take-a-training-course-on-sex-ive-never-experienced-before-a-new-graduate-av-124002","124025":"jur-098-beautiful-lingerie-a-married-insurance-saleswoman-mio-kuon-whose-reward-is-soiled-with-saliv-123959","124026":"jur-104-married-secretary-sweaty-and-kissed-intercourse-in-the-presidents-office-suzu-matsuoka-matsu-123956","124027":"jur-819-this-might-be-the-last-erection-of-my-life-so-just-let-me-put-it-in-for-a-moment-i-felt-sorr-123974","124028":"jur-823-just-for-a-moment-please-let-me-put-it-in-feeling-sorry-for-my-brother-in-law-who-was-still-123971","124029":"jur-824-with-our-two-playren-now-grown-up-and-out-of-the-nest-my-husband-and-i-are-finally-alone-tog-123970","124030":"jur-834-wife-ntr-at-a-happening-bar-its-all-for-you-the-wife-who-used-to-say-that-soon-became-infatu-123968","124031":"roe-558-just-her-presence-makes-even-a-downtown-shopping-street-look-like-a-runway-akizuki-yu-47-a-r-123981","124032":"snos-335-i-cant-live-without-your-perverted-moves-a-serious-female-teacher-becomes-captivated-by-the-123993","124033":"snos-340-shes-always-so-dedicated-to-practice-that-she-doesnt-even-notice-her-panties-are-showing-i-123992","124034":"snos-345-a-super-serious-plain-looking-girl-with-big-breasts-goes-to-a-beauty-salon-wanting-to-becom-123991","124035":"jur-839-former-entertainer-haneda-kaira-34-who-captivated-audiences-makes-her-av-debut-a-half-japane-123966","124036":"roe-541-living-with-my-aunt-who-came-to-stay-for-a-business-trip-i-lost-my-mind-when-i-saw-her-in-he-123983","124037":"snos-145-in-this-village-sex-is-the-only-form-of-entertainment-right-hana-the-easy-country-slut-who-123999","124038":"snos-333-definitely-the-eldest-daughter-an-overly-attentive-nurse-takes-care-of-her-patients-penis-w-123994","124039":"snos-362-i-started-taking-yoga-classes-after-my-wife-recommended-them-and-the-instructor-is-cute-bus-124007","124040":"snos-371-ayaka-kawakitas-genuine-kindness-and-thoughtfulness-a-documentary-of-her-first-time-perform-124004","124041":"snos-373-super-newcomer-super-busty-body-kanon-hayasakas-thrilling-sex-work-experience-kanade-hayasa-124003","124100":"nhdtc-240-miniskirt-bare-legs-shame-10-lift-up-her-short-skirt-and-do-it-from-behind-123928","124101":"nhdtc-242-a-remote-controlled-vibrator-is-played-inside-her-and-she-cant-get-it-out-causing-her-to-c-123927","124102":"sw-1064-my-cousin-is-cheering-me-up-in-her-black-tights-come-on-look-at-them-a-lot-and-lets-get-rid-123930","124105":"huntc-425-shall-i-be-your-practice-partner-my-playhood-friend-whos-always-had-a-crush-on-me-lends-a-123964","124106":"huntc-518-i-immediately-started-fucking-my-big-assed-sister-in-law-while-she-was-doing-pilates-my-si-123963","124107":"huntc-647-sex-club-funeral-orgy-a-group-of-flashy-men-and-women-in-mourning-clothes-today-is-the-fun-123961","124108":"royd-338-my-innocent-and-extremely-shy-stepsister-became-super-sensitive-and-prone-to-premature-ejac-123979","124109":"royd-339-i-got-turned-on-by-my-sister-in-laws-bouncy-breasts-and-immediately-squeezed-them-i-thought-123978","124110":"royd-341-i-was-unknowingly-being-seduced-by-my-female-friend-who-had-a-boyfriend-and-came-to-stay-ov-123977","124111":"royd-351-i-woke-up-this-morning-to-find-a-female-colleague-in-my-room-in-her-underwear-shes-usually-123976","124121":"snos-346-when-i-had-my-first-drink-with-my-pure-playhood-friend-whom-ive-always-had-a-crush-on-she-t-123990","124122":"snos-351-when-i-reunited-with-the-plain-looking-girl-i-used-to-bully-10-years-later-she-had-transfor-123989","124124":"snos-352-an-h-cup-hairdresser-who-keeps-pressing-her-breasts-against-male-customers-faces-does-she-w-123988","124126":"snos-354-a-new-sensation-onahole-where-you-insert-your-penis-into-a-breast-megaton-mcup-titjob-hole-124009","124130":"snos-360-too-beautiful-face-ultimate-sucking-technique-oral-sex-angle-brain-direct-asmr-licking-soun-124008","124140":"dldss-521-from-9-am-when-my-husband-leaves-for-work-until-6-pm-im-engaged-in-unprotected-sex-with-my-124096","124141":"snos-290-former-hakata-idol-invites-a-male-fan-from-her-idol-days-to-the-av-filming-set-for-a-thank-123998","124142":"snos-311-a-pampered-college-student-from-minato-ward-is-transformed-into-a-pervert-through-licking-o-123997","124143":"snos-315-my-innocent-student-shirahana-who-is-20-years-younger-than-me-is-seducing-me-while-half-und-123996","124144":"snos-317-a-miraculous-body-a-slim-and-glamorous-college-girl-indulges-in-intense-immersive-sex-devou-123995","124145":"snos-365-a-clumsy-girl-whos-always-soaking-wet-and-her-pink-nipples-are-visible-through-her-wet-clot-124006","124156":"roe-540-a-suite-room-of-martyrdom-and-training-a-mother-who-sacrifices-her-body-for-her-son-yuka-osh-123984","124157":"jur-804-intimate-sex-an-adulterous-love-affair-with-a-former-boss-at-a-hot-spring-inn-mariko-koto-123954","124158":"roe-530-monroes-exclusive-beauty-consultant-a-married-woman-unexpectedly-allows-unprotected-sex-the-123985","124161":"nact-170-housewife-with-insatiable-sexual-appetite-begs-for-unprotected-sex-during-a-side-job-mako-o-123935","124162":"nact-171-i-secretly-filmed-my-older-sister-bathing-to-sell-to-a-friend-only-to-discover-she-was-inte-123934","124201":"nsfs-505-the-hospitality-secretary-forbidden-orders-from-the-president-by-yuri-adachi-124088","124202":"dldss-543-a-flight-attendant-who-cant-fly-keeps-a-just-male-pig-as-a-pet-a-diary-of-a-training-sessi-124195","124203":"agav-180-feet-and-legs-ultra-high-purity-foot-fetishism-for-foot-fetishists-miyu-inamori-124181","124204":"aldn-607-my-wife-yukine-nagasaki-has-fallen-into-the-pleasure-of-internal-ejaculation-124072","124205":"aldn-608-the-casual-sex-partner-from-back-then-was-her-mother-koharu-miike-miike-koharu-124071","124206":"aldn-609-saran-ito-the-surrogate-mother-124070","124207":"apns-419-a-schoolgirl-obsessed-with-exhibitionism-her-uterus-throbs-with-the-thought-of-having-her-p-124069","124209":"cemd-882-masked-big-breasted-sluts-the-chosen-women-124083","124210":"ekdv-824-4k-gazing-into-each-others-eyes-during-cowgirl-position-is-irresistible-a-sweet-voiced-big-124079","124211":"lucy-030-tsukino-kotone-a-true-masochistic-secretary-who-is-absolutely-obedient-to-her-boss-kotone-t-124093","124212":"nsfs-504-a-married-womans-ulterior-motive-she-wants-to-be-played-into-it-5-kiho-hoshina-124089","124251":"madv-641-4k-dont-tell-anyone-my-sister-in-law-came-over-to-the-house-while-my-wife-was-out-i-couldnt-124092","124252":"moil-008-new-brides-mother-and-forbidden-sex-part-seven-my-mother-in-law-is-better-than-my-wife-afte-124091","124253":"mvg-171-the-cocky-arrogant-gal-gets-a-thorough-punishment-from-all-the-employees-and-ends-up-with-an-124090","124254":"cead-764-harass-me-more-big-breasted-mature-woman-saki-aikawas-insatiable-body-trembles-with-pleasur-124062","124256":"cmv-211-super-busty-erotic-widow-crotch-rope-digging-into-her-competitive-swimsuit-pleasure-and-torm-124081","124257":"fem-038-a-non-hormone-using-cross-dressing-boy-e29982-makoto-kobe-is-an-all-rounder-who-can-be-both-124078","124260":"blor-305-a-busty-voluptuous-beauty-with-a-dreamy-erotic-face-is-teased-during-foreplay-then-pounded-124065","124261":"cemd-879-ripe-group-date-4-drunken-mature-women-get-covered-in-semen-in-an-8-person-orgy-emi-toyonag-124085","124263":"dmdg-062-masochistic-cumshot-double-cast-maru-rare-124080","124264":"halt-091-i-immediately-fucked-my-defenseless-elite-married-female-boss-during-overtime-who-showed-of-124074","124267":"start-624-ntr-during-delivery-a-newlywed-wife-honjo-suzu-is-assaulted-in-the-car-while-accompanying-124235","124268":"aldn-606-i-cant-stand-it-anymore-even-though-shes-my-stepdaughter-im-her-uncle-mizuno-yuuka-yuka-miz-124073","124288":"flav-426-seductive-lustful-bunny-girl-tomoe-hikari-a-carnivorous-masochistic-slutty-bitch-124077","124289":"gmem-154-imprisonment-play-training-screaming-orgasm-played-orgasm-screaming-play-training-a-burning-124076","124290":"gvh-873-the-story-of-how-i-brainwashed-an-overly-arrogant-ring-girl-who-then-transformed-into-a-devi-124075","124291":"mcsr-639-splayful-and-spicy-treatment-awakens-your-sexuality-be-careful-not-to-climax-too-much-4-est-124056","124292":"pets-071-as-a-crossdresser-my-dick-is-throbbing-today-124087","124293":"rapd-013-married-woman-tied-to-a-chair-playnapped-imprisoned-and-playd-with-sex-toys-her-sanity-crum-124086","124294":"rgav-005-a-deluxe-2-part-special-video-compilation-of-hardcore-60-year-old-men-having-sex-wow-its-an-124193","124295":"scop-918-scoop-15th-anniversary-special-a-certain-pin-salon-in-tokyo-thats-supposed-to-have-a-no-sex-124154","124296":"scpx-563-my-secret-with-a-married-woman-living-in-the-same-apartment-building-the-beginning-of-a-lov-124153","124297":"erofv-387-a-streamer-with-a-low-iq-who-was-tricked-into-becoming-a-vtuber-the-dark-side-of-the-indus-124234","124299":"doki-037-i-thought-the-massage-girl-was-just-seductive-through-her-clothes-but-wait-is-this-raw-sex-124232","124300":"hnbr-014-farmers-wife-gets-instantly-impregnated-while-shes-sweaty-a-young-farmer-captivated-by-her-124231","124301":"kir-079-big-buttocked-female-bosss-tight-pants-tempt-her-virgin-subordinate-to-the-brink-of-explosio-124230","124302":"nxgs-025-mature-office-lady-in-uniform-and-pantyhose-rinko-nomiya-124229","124303":"ftkd-041-live-action-adaptation-i-still-love-you-my-classmate-who-i-rejected-back-then-became-a-soph-124281","124305":"fns-249-japans-proud-sex-symbol-the-divine-breasts-and-sexual-intercourse-hachimitsu-rin-rin-hachimi-124285","124306":"sdab-356-18-year-old-uncles-have-sex-slender-a-chan-delivered-to-a-share-house-inhabited-by-perverte-124242","124307":"sdab-358-18-year-old-pacifier-lessons-a-baby-faced-archery-girl-whos-become-interested-in-all-kinds-124243","124308":"sdam-179-a-24-year-old-part-time-worker-with-a-total-debt-of-2-8-million-yen-sachiko-yamada-makes-he-124244","124309":"start-619-special-edition-a-two-day-one-night-hot-spring-trip-where-youll-have-sex-and-have-sex-12-t-124238","124310":"start-621-a-hot-spring-trip-at-your-mercy-sora-shinkawa-shinkawa-sky-124237","124311":"start-623-a-hot-woman-with-a-body-youll-want-to-devour-tipsy-and-uninhibited-reveals-her-raw-sexual-124236","124373":"chuc-186-elena-26-a-busty-promiscuous-insurance-saleswoman-with-h-cup-breasts-whom-i-met-on-machiapp-124353","124376":"chuc-189-noa-25-a-masochistic-hamburger-shop-employee-who-cums-in-seconds-124372","124379":"knmb-128-a-tall-new-employee-is-too-forward-and-cant-refuse-an-invitation-for-an-affair-asuka-matsum-124371","124380":"abf-380-ultimate-ecstasy-a-new-realm-of-pleasure-that-courses-through-every-nerve-umi-hachigake-umi-124327","124381":"abf-381-over-the-top-unprotected-sex-at-a-hot-spring-inn-do-whatever-you-want-with-her-exquisite-tra-124326","124382":"simw-010-momo-shiori-124286","124383":"luxu-1892-a-stunningly-beautiful-designer-with-a-mori-sumi-vibe-ive-never-had-truly-pleasurable-sex-124287","124414":"sdmm-238-magic-mirror-do-you-kiss-your-husband-every-day-a-public-opinion-survey-on-kissing-habits-w-124241","124415":"embm-053-amateur-applicant-holstein-milk-wife-with-a-massive-110cm-l-cup-bust-and-a-stunning-three-d-124233","124416":"pes-153-beautiful-wife-seduced-by-her-virile-father-in-law-2-disc-set-124228","124417":"vnds-3443-a-married-womans-expert-hip-shaking-masturbation-that-makes-you-melt-with-every-rub-2-tsub-124227","124418":"sgki-106-what-if-a-public-shower-suddenly-became-completely-exposed-a-public-humiliation-nude-escape-124196","124419":"sdde-769-the-man-who-can-stop-time-really-exists-that-man-is-back-i-want-to-stop-time-a-scene-of-him-124239","124420":"sdnm-560-mayuka-arisawa-36-years-old-final-chapter-my-loud-moans-have-always-been-a-source-of-insecu-124240","124500":"cawb-037-after-six-months-of-negotiations-she-finally-succeeded-in-getting-an-av-appearance-shes-got-124336","124509":"same-250-pleasure-play-female-body-modification-female-investigator-yuki-takeuchi-who-had-an-orgasm-124400","124510":"waaa-682-playd-at-night-by-my-hated-stepfather-ayatsuki-nanao-satsuki-nanao-124391","124515":"atid-799-the-beautiful-female-doctors-downfall-ichika-hoshimiya-124342","124517":"adn-803-a-sweltering-sweaty-locked-room-confinement-and-play-session-in-the-middle-of-summer-the-ent-124346","124519":"sora-645-personality-manipulation-brainwashing-hypnosis-e2978f-the-story-of-investing-my-semen-in-th-124484","124586":"yuj-072-ill-make-you-ejaculate-so-much-that-you-wont-even-think-about-having-sex-with-any-other-woma-124404","124587":"adn-785-i-ended-up-ejaculating-while-being-petted-by-a-naive-tutor-with-a-completely-exposed-cleavag-124350","124588":"adn-800-i-was-embraced-by-my-daughters-boyfriend-the-story-of-how-we-had-sex-non-stop-from-the-day-h-124348","124589":"atid-701-i-was-on-a-business-trip-to-the-countryside-alone-with-that-slightly-cheeky-girl-from-my-co-124343","124594":"same-251-newlywed-ms-sakura-is-being-used-as-a-sex-toy-by-the-schools-biggest-troublemaker-sakura-mi-124399","124595":"waaa-677-tonight-drink-my-saliva-and-get-all-drunk-says-the-drunken-female-boss-who-turns-into-a-kis-124394","124596":"waaa-684-watch-this-and-you-too-will-be-able-to-make-her-cum-like-crazy-with-your-relentless-thrusti-124390","124597":"cawb-035-e2978fe2978feaste2978ftheatre-ballet-company-burdened-with-massive-debt-miss-ballerinas-sak-124337","124598":"adn-799-when-i-woke-up-this-morning-ebizaki-senpai-was-sleeping-next-to-me-my-usually-grumpy-senpai-124349","124599":"adn-802-i-became-entangled-in-a-secret-affair-with-a-teacher-at-my-sons-daycare-misono-waka-124347","124600":"adn-806-miyu-otori-a-young-wife-who-was-made-to-orgasm-repeatedly-by-her-hated-father-in-law-otori-m-124345","124601":"atid-655-the-house-infested-with-succubuses-episode-2-konatsu-kashiwagi-124344","124604":"cawb-024-im-out-of-condoms-but-raw-is-fine-having-missed-the-last-train-i-went-to-my-junior-female-c-124341","124605":"cawb-028-what-kind-of-emotion-is-it-to-smile-while-having-your-pussy-passed-around-by-the-slutty-guy-124340","124606":"cawb-031-my-nieces-are-very-attached-to-me-a-summer-vacation-spent-having-lots-of-sex-with-these-you-124339","124607":"cawb-033-the-most-beautiful-woman-in-the-history-of-the-girl-world-the-ultimate-voluptuous-body-hana-124338","124608":"dldss-544-tonight-the-deal-will-be-decided-depending-on-you-rika-aimi-124543","124609":"gvh-875-black-pantyhose-slut-cosplayer-lewd-verbal-play-tomoe-hikari-124458","124610":"mmkz-166-big-sisters-huge-butt-is-so-obscene-itll-instantly-captivate-you-misaki-hikari-124474","124611":"sora-648-targeted-on-her-way-home-from-lunch-with-her-mom-friends-stalked-home-invasion-unconscious-124481","124612":"sqte-712-ruka-itoi-the-junior-who-is-always-available-as-a-sex-toy-itoi-ruka-124480","124613":"sqte-713-ill-empty-your-balls-yuna-hinata-x-hinano-minami-hinata-yuna-124479","124615":"sqte-715-riho-shishido-who-got-drunk-and-went-out-with-a-friend-124478","124616":"vdd-208-secretary-in-threatening-suite-room-tsukinoe-sui-124453","124617":"ysn-664-im-being-kept-as-a-pet-by-my-new-sister-in-law-whos-not-very-smart-but-has-a-strong-sex-driv-124447","124618":"dandya-048-the-slutty-older-woman-i-met-on-machiapp-turned-out-to-be-an-ordinary-housewife-who-worke-124549","124623":"ymdd-507-forbidden-anal-esthetics-4-beautiful-nursery-teachers-soft-and-creamy-anus-gets-double-pene-124492","124624":"ymds-307-a-two-day-one-night-trip-to-a-hot-spring-resort-where-you-can-have-kurosaki-hana-all-to-you-124491","124625":"sora-647-a-former-hostess-is-playnapped-and-played-hard-her-big-breasts-are-played-with-and-she-is-s-124482","124626":"sora-646-local-female-politician-wets-herself-repeatedly-during-a-drinking-party-and-party-games-the-124483","124627":"mgold-057-asumi-miona-a-new-graduate-office-worker-was-subjected-to-health-checkup-harassment-by-une-124574","124628":"san-484-the-nudist-family-older-sister-edition-yui-hatano-124582","124629":"san-485-a-miraculous-experience-the-story-of-a-man-who-after-his-girlfriend-was-stolen-from-him-unde-124581","124630":"san-486-sadistic-widow-rina-takase-rina-rina-takase-124580","124631":"san-487-aizawa-riku-a-cheating-wife-gets-pregnant-after-being-seduced-by-a-pizza-delivery-man-riku-a-124579","124633":"maan-1192-a-wild-drunken-orgy-with-two-gorgeous-girls-with-beautiful-asses-that-shine-in-the-summer-124573","124634":"gana-3437-discovered-a-seductive-melancholic-beauty-shes-gorgeous-and-has-an-amazing-figure-but-is-s-124569","124635":"mium-1483-new-series-hidden-camera-at-mens-esthetic-salon-a-popular-therapist-at-a-certain-location-124567","124636":"beaf-226-she-looks-plain-and-innocent-but-inside-shes-a-perverted-voluptuous-big-breasted-slutty-bit-124547","124637":"siro-5701-adult-women-are-sexy-ive-discovered-that-this-woman-who-was-so-serious-and-dedicated-to-he-124568","124666":"ymds-308-little-sister-catering-service-summon-your-1000-transparent-slender-little-sister-anytime-2-124564","124667":"ymds-309-little-sister-catering-service-super-sensitive-girl-gets-endless-orgasms-and-cummes-nonstop-124563","124668":"ymds-310-my-younger-brothers-wife-twisted-envy-and-a-beautiful-sister-in-law-a-longing-for-codepende-124562","124669":"ymds-311-my-younger-brothers-wife-twisted-envy-and-a-beautiful-sister-in-law-a-longing-for-codepende-124561","124673":"olm-354-this-elegant-slutty-mature-woman-is-starving-for-male-attention-and-her-libido-is-at-its-pea-124584","124674":"olm-355-normal-sex-just-isnt-enough-anymore-this-super-cute-office-lady-with-beautiful-legs-gets-tot-124583","124675":"ftht-350-help-a-guy-whos-struggling-with-too-much-sperm-buildup-by-giving-him-a-blowjob-until-hes-sa-124571","124676":"ftht-351-help-this-guy-whos-struggling-with-too-much-sperm-buildup-by-giving-him-a-blowjob-until-hes-124572","124677":"fthtd-216-testing-does-the-head-spa-wire-really-work-the-female-test-subjects-gathered-under-the-gui-124539","124678":"fthtd-192-its-a-tradition-at-our-school-where-the-female-managers-of-our-weak-sports-teams-are-expec-124541","124679":"start-629-send-out-a-mass-stream-of-haru-shibasakis-explicit-images-use-your-amazing-splays-to-remot-124654","124680":"start-601-apparently-rui-chan-miss-a-university-got-a-job-offer-as-a-news-anchor-by-sleeping-with-so-124651","124681":"start-602-face-focused-completely-subjective-never-taking-your-eyes-off-her-until-you-cum-inside-her-124650","124699":"nhdtc-250-massage-the-stubbornly-hiding-nipples-of-this-woman-with-oil-until-her-bare-hands-are-so-s-124488","124700":"fthtd-193-im-the-only-young-girl-in-the-village-theres-a-rule-that-if-you-make-a-villager-get-an-ere-124542","124702":"skth-005-shikota-holdings-sirita-co-ltd-do-you-like-my-ass-i-got-a-sexy-ass-from-my-colleague-2-jun-124695","124704":"start-625-a-special-episode-showcasing-the-greatest-full-on-erotic-potential-ever-where-a-woman-shar-124649","124705":"start-635-99-shots-of-real-sperm-akari-matsunagas-complete-career-change-as-a-sod-star-a-commemorati-124648","124707":"erofv-388-leaked-photos-of-a-girl-at-the-train-station-her-skinny-body-is-so-sensitive-that-she-arch-124647","124708":"fns-252-i-want-you-to-kiss-me-a-beautiful-girl-gets-hooked-on-a-kissing-sex-session-where-bodily-flu-124690","124709":"mrec-010-sex-record-010-ririko-kinoshita-coming-out-to-her-husband-after-her-av-debut-her-first-boyf-124655","124755":"mive-001-smartphone-vertical-video-recommended-training-camp-gang-play-e2978f-the-longed-for-female-124656","124756":"doks-687-a-beautiful-legged-office-lady-is-played-to-be-the-sex-slave-of-her-old-pantyhose-obsessed-124665","124757":"hbad-740-ruka-itoi-my-sons-girlfriend-has-a-short-haircut-big-breasts-and-a-baby-face-and-her-body-i-124749","124758":"hbad-741-miyu-hirose-the-neighborhood-slut-who-pretends-to-be-innocent-but-seduces-men-with-her-j-cu-124748","124759":"abf-382-a-record-of-a-perverse-couple-living-together-and-having-unprotected-sex-driven-by-their-sex-124727","124760":"dldss-531-dahlias-shocking-transfer-goddess-jun-is-reborn-and-the-miraculous-venus-descends-124692","124761":"iesp-765-luna-amanes-newlywed-life-trying-to-conceive-a-play-amane-luna-124694","124762":"nld-033-nipple-pleasure-mens-salon-nld-033-saa-futaba-124696","124829":"sone-610-english-subtitle-sone-610-make-the-new-cute-actress-cum-abstinence-x-restraint-x-aphrodisia-108943","124830":"roe-290-english-subtitle-roe-290-whenever-you-feel-horny-come-and-see-me-im-still-a-virgin-and-the-w-103984","124831":"jur-011-english-subtitle-jur-011-the-third-shocking-transfer-drenched-in-oil-and-infidelity-she-appe-93374","124832":"sone-606-english-subtitle-sone-606-an-affair-trip-with-an-obedient-fair-skinned-beautiful-skinned-co-111074","124833":"jur-184-english-subtitle-jur-184-is-it-bad-if-your-first-partner-is-older-my-girlfriends-older-siste-102448","124834":"cjod-454-english-subtitle-cjod-454-reiwas-no-1-white-gal-queen-squeezes-you-out-unlimited-ejaculatio-93375","124835":"roe-323-english-subtitle-roe-323-my-best-friends-mother-momokos-scrub-treatment-is-too-erotic-i-went-106449","124836":"jur-145-english-subtitle-jur-145-ive-been-having-a-sexual-relationship-with-my-sons-friend-for-the-p-99899","124837":"jur-212-english-subtitle-jur-212-natural-k-cup-breasts-bomb-madonna-transfer-2nd-release-she-loves-h-103985","124838":"nacr-919-english-subtitle-nacr-919-my-husbands-brother-and-i-had-a-nude-photoshoot-i-learned-the-ple-121224","124839":"dldss-388-english-subtitle-dldss-388-insurance-lady-gets-a-contract-and-goes-crazy-with-body-fluids-108237","124840":"nacr-921-english-subtitle-nacr-921-when-i-went-to-a-mens-beauty-salon-i-found-an-elite-female-employ-119007","124841":"jur-218-english-subtitle-jur-218-miho-a-strong-willed-construction-worker-wife-is-a-sensitive-weak-w-103989","124842":"royd-221-english-subtitle-royd-221-hey-lets-study-something-naughty-the-secret-face-of-the-petite-an-103990","124843":"jur-214-english-subtitle-jur-214-my-plain-playhood-friend-who-used-to-like-me-has-transformed-into-a-103991","124844":"jur-021-english-subtitle-jur-021-recreational-travel-ntr-my-wife-was-gang-playd-by-her-bosses-who-ha-99896","124845":"jur-167-english-subtitle-jur-167-my-father-in-law-came-to-pick-me-up-from-work-today-yuri-hirose-3-99897","124846":"roe-316-english-subtitle-roe-316-a-mother-who-was-repeatedly-creampied-by-her-son-in-front-of-her-hu-105383","124847":"sone-554-english-subtitle-sone-554-my-cute-and-sexy-girlfriend-the-envy-of-everyone-has-fallen-for-a-106481","124848":"jur-195-english-subtitle-jur-195-a-first-2-night-3-day-double-affair-trip-where-they-keep-fucking-un-103992","124849":"jur-157-english-subtitle-jur-157-i-cant-tell-my-wife-that-i-got-my-mother-in-law-pregnant-on-a-two-d-99898","124850":"royd-225-english-subtitle-royd-225-a-big-breasted-gal-who-looks-down-on-us-is-turned-into-a-human-to-105384","124851":"cjod-458-english-subtitle-cjod-458-hot-spring-inn-brothel-big-tits-squishy-sex-service-creampie-ok-c-93373","124852":"roe-310-english-subtitle-roe-310-now-that-weve-left-our-hometown-our-dorm-mother-yuka-is-helping-us-103983","124853":"dass-595-english-subtitle-dass-595-i-started-to-think-of-my-mother-as-a-woman-and-i-easily-crossed-t-103986","124854":"sone-619-english-subtitle-sone-619-i-was-perfect-in-both-studies-and-club-activities-and-was-the-mos-110013","124855":"jur-216-english-subtitle-jur-216-female-teacher-ntr-my-beloved-wife-was-cuckolded-by-a-delinquent-st-103987","124856":"sone-604-english-subtitle-sone-604-i-was-left-in-the-care-of-my-uncle-as-a-teenager-and-while-i-felt-110014","124857":"sone-602-english-subtitle-sone-602-im-a-pathetic-adult-who-gets-treated-like-a-bastard-by-a-cute-che-107105","124858":"sone-611-english-subtitle-sone-611-innocent-but-very-naughty-she-has-a-lot-of-fun-and-is-naughty-inn-111078","124859":"royd-224-english-subtitle-royd-224-a-perverted-brainwashed-older-sister-who-trains-her-virgin-pet-an-104981","124860":"sone-592-english-subtitle-sone-592-i-didnt-know-about-my-wifes-school-days-but-i-felt-a-strange-exci-106484","124861":"naiad-005-english-subtitle-naiad-005-newcomer-kuribayashi-ai-26-years-old-the-sexiest-housewife-in-t-102446","124862":"roe-324-english-subtitle-roe-324-youll-pay-with-your-body-a-faithful-wife-becomes-a-shoplifters-surr-105659","124863":"jur-190-english-subtitle-jur-190-okisai-a-wife-left-behind-i-delivered-my-wife-to-the-front-door-of-102447","124864":"jur-203-english-subtitle-jur-203-twenty-years-have-passed-since-i-weaned-my-son-hojo-asahi-3-103988","124904":"cjod-453-english-subtitle-cjod-453-seed-squeezing-press-that-makes-you-cum-until-the-morning-comes-y-93372","124905":"jur-023-english-subtitle-jur-023-madonna-super-large-exclusive-cheating-beautiful-woman-chapter-3-af-102141","124906":"jur-197-english-subtitle-jur-197-happening-bar-married-woman-ntr-its-for-you-my-wife-said-but-before-102142","124907":"jur-219-english-subtitle-jur-219-reverse-ptom-sex-with-uncle-who-fills-pussy-dripping-with-love-juic-103994","124908":"jur-151-english-subtitle-jur-151-resort-pool-ntr-exclusive-hot-girl-x-adult-bikini-ntr-drama-where-a-99895","124909":"sone-587-english-subtitle-sone-587-such-a-beautiful-girls-erotic-blowjob-and-happy-mass-cumshot-on-h-106485","124910":"sone-641-english-subtitle-sone-641-the-swimsuit-manufacturer-i-got-a-job-in-is-a-world-where-all-the-115017","124911":"jur-211-english-subtitle-jur-211-the-never-ending-days-of-creampie-gangbang-nami-okimiya-okinomiya-n-103995","124912":"jur-027-english-subtitle-jur-027-a-naturally-beautiful-naturally-erotic-naturally-beautiful-married-102143","124913":"jur-217-english-subtitle-jur-217-i-picked-up-a-lost-lamb-like-i-cup-busty-wife-and-the-record-of-the-103996","124914":"jur-202-english-subtitle-jur-202-i-wanted-to-make-my-wife-admit-her-love-so-i-left-her-alone-with-my-102445","124915":"start-276-english-subtitle-start-276-yotsuba-kominato-x-riko-hoshino-the-two-top-sodstars-with-sensi-115019","124916":"fsdss-987-english-subtitle-fsdss-987-when-i-called-for-a-delivery-health-service-a-new-female-employ-119008","124917":"dldss-390-english-subtitle-dldss-390-apology-ntr-a-substitute-wife-who-offered-her-body-to-atone-for-93393","124918":"aldn-427-english-subtitle-aldn-427-let-me-call-you-mom-yuko-shiraki-shiraki-yuko-3-103998","124919":"aldn-432-english-subtitle-aldn-432-i-want-to-impregnate-that-married-woman-rieko-hiraoka-3-102139","124920":"nsfs-361-english-subtitle-nsfs-361-cuckold-house-11-my-wife-turned-into-a-sex-doll-machi-ikuno-ikuno-115018","124921":"aldn-430-english-subtitle-aldn-430-your-wife-is-the-best-hinata-tachibana-3-103999","124922":"mkmp-616-english-subtitle-mkmp-616-when-i-went-back-to-my-parents-house-i-met-a-plain-ex-classmate-h-111080","124923":"aldn-429-english-subtitle-aldn-429-even-my-stepmother-wants-to-get-pregnant-yuri-tadokoro-3-102140","124924":"avsa-364-english-subtitle-avsa-364-the-days-of-sex-filled-with-the-desires-of-a-man-who-instilled-se-93370","124925":"aldn-431-english-subtitle-aldn-431-being-a-single-mother-is-the-best-after-all-satsuki-kuriyama-3-103993","124926":"achj-057-english-subtitle-achj-057-sometimes-you-just-want-to-be-a-slut-madonna-exclusive-ultimate-b-93371","124927":"waaa-486-english-subtitle-waaa-486-i-was-playd-by-my-hated-father-in-law-at-night-shizuka-3-108241","124928":"mida-067-english-subtitle-mida-067-disgusting-ntr-my-first-and-precious-girlfriend-has-been-hired-as-108242","124929":"mida-074-english-subtitle-mida-074-as-a-homeroom-teacher-i-couldnt-resist-my-students-temptation-and-108944","124930":"fpre-149-english-subtitle-fpre-149-married-for-5-years-incontinent-nude-model-ntr-shocking-video-of-110015","124931":"fpre-155-english-subtitle-fpre-155-a-tall-busty-flight-attendant-experiences-the-greatest-pleasure-o-111081","124932":"fpre-161-english-subtitle-fpre-161-limited-to-one-group-per-day-a-beautiful-busty-hostess-will-sooth-111082","124933":"fsdss-984-english-subtitle-fsdss-984-domestic-ntr-a-married-woman-who-is-defeated-by-the-excitement-111083","124934":"abf-203-english-subtitle-abf-203-i-left-umi-yahagi-at-a-guesthouse-full-of-men-includes-25-minutes-o-93392","124935":"fera-193-english-subtitle-fera-193-my-mother-was-my-sex-practice-partner-i-broke-up-with-my-girlfrie-108243","124936":"jrze-233-english-subtitle-jrze-233-first-time-filming-a-married-woman-documentary-azuma-fuuka-3-108244","124937":"start-259-english-subtitle-start-259-the-bunny-girl-that-a-younger-college-student-fell-in-love-with-111079","124981":"waaa-493-english-subtitle-waaa-493-the-condom-breaks-and-its-raw-sex-multiple-creampies-with-super-a-105662","124982":"waaa-492-english-subtitle-waaa-492-my-boss-got-drunk-on-a-business-trip-and-turned-into-a-slut-we-fo-106486","124983":"mida-061-english-subtitle-mida-061-infinite-orgasms-i-cup-gravure-idols-eros-awakens-she-squirts-a-l-106487","124984":"mida-064-english-subtitle-mida-064-a-plain-glasses-wearing-busty-woman-from-the-government-office-wh-106488","124985":"mida-063-english-subtitle-mida-063-ill-make-you-cum-with-321-ishikawa-mios-face-is-the-focus-a-count-106489","124986":"mida-062-english-subtitle-mida-062-my-serious-and-quiet-step-sisters-fidgety-panty-shots-have-me-los-106490","124987":"waaa-489-english-subtitle-waaa-489-teacher-let-me-stay-over-so-you-can-do-naughty-things-to-me-summe-106491","124988":"mida-066-english-subtitle-mida-066-just-before-i-got-engaged-to-my-coworker-he-started-touching-my-b-106919","124989":"mida-073-english-subtitle-mida-073-i-was-targeted-by-a-group-of-perverts-on-the-train-on-my-way-to-s-107106","124990":"mida-072-english-subtitle-mida-072-shocking-super-scoop-nana-yagi-was-taken-home-by-a-pickup-artist-108238","124991":"waaa-490-english-subtitle-waaa-490-unable-to-bear-the-lack-of-sex-with-her-husband-she-commits-a-cre-108239","124992":"same-170-english-subtitle-same-170-during-the-summer-camp-teacher-shiramine-miu-was-played-to-satisf-108240","124993":"miab-399-english-subtitle-miab-399-a-wife-who-started-to-support-her-reclusive-self-reliance-is-sedu-102145","124994":"npjs-166-english-subtitle-npjs-166-the-real-story-of-a-college-student-who-only-wanted-sex-with-his-102146","124995":"atid-620-english-subtitle-atid-620-no-my-father-will-notice-nagano-suzu-3-102147","124996":"atid-626-english-subtitle-atid-626-molester-train-i-hate-it-but-just-being-touched-makes-my-body-fee-102148","124997":"npjs-146-english-subtitle-npjs-146-i-want-to-connect-with-ista-baseball-girls-congratulations-on-bec-102138","124998":"waaa-494-english-subtitle-waaa-494-drink-lots-of-love-essence-dripping-wet-body-fluid-salon-love-jui-103997","124999":"same-149-english-subtitle-same-149-my-father-in-law-couldnt-have-sex-with-my-mother-because-she-was-104621","125000":"mida-065-english-subtitle-mida-065-an-innocent-girl-arches-her-back-and-reaches-a-climax-with-a-huge-104982","125001":"waaa-474-english-subtitle-waaa-474-during-training-camp-a-female-track-and-field-athlete-is-given-an-105386","125002":"same-159-english-subtitle-same-159-a-female-teacher-who-was-assigned-to-a-school-in-the-countryside-105385","125003":"mida-071-english-subtitle-mida-071-on-a-long-country-train-stop-i-was-fucked-by-the-wild-pistons-of-105660","125004":"waaa-485-english-subtitle-waaa-485-pre-cum-and-semen-gushing-out-20-shots-without-mercy-swimsuit-big-105661","125005":"yuj-027-english-subtitle-yuj-027-from-the-day-i-got-drunk-and-had-sex-with-my-best-friends-girlfrien-93388","125006":"vod-035-english-subtitle-vod-035-married-woman-creampie-hot-spring-affair-trip-a-two-day-one-night-a-93389","125007":"vema-236-english-subtitle-vema-236-the-most-beautiful-senior-girl-in-the-company-goes-to-her-parents-93390","125008":"yuj-032-english-subtitle-yuj-032-a-record-of-how-i-had-sex-with-my-senior-who-comforted-me-after-my-93391","125009":"juta-163-english-subtitle-juta-163-the-best-thirty-something-wifes-first-nude-av-documentary-chisato-99900","125010":"npjs-141-english-subtitle-npjs-141-a-girl-is-aggressively-pursued-by-a-handsome-aggressive-pickup-ar-99901","125011":"npjs-140-english-subtitle-npjs-140-a-fan-who-was-serious-about-an-underground-idol-hooked-up-with-he-99902","125012":"miab-431-english-subtitle-miab-431-tall-and-slender-female-teacher-teases-dick-with-her-beautiful-le-99903","125013":"npjs-132-english-subtitle-npjs-132-a-video-recording-of-a-night-where-a-girl-who-came-to-hang-out-at-99904","125014":"miab-375-english-subtitle-miab-375-a-gal-who-loves-immediate-blowjobs-she-cums-15-loads-of-semen-at-100028","125015":"mimk-197-english-subtitle-mimk-197-yurie-a-housekeeper-who-will-do-almost-anything-for-you-a-beautif-100423","125016":"npjs-142-english-subtitle-npjs-142-they-made-500-million-by-streaming-their-lovemaking-a-compilation-102144","125053":"adn-656-english-subtitle-adn-656-my-girlfriends-sister-is-quiet-and-mysterious-and-she-always-wears-93400","125054":"cawd-797-english-subtitle-cawd-797-a-diligent-new-office-lady-aoi-hazuki-gets-her-huge-breasts-fondl-93401","125055":"cawd-824-english-subtitle-cawd-824-sns-buzz-file-02-a-beautiful-girl-who-was-really-caught-on-camera-93402","125056":"adn-661-english-subtitle-adn-661-its-okay-if-its-just-the-tip-i-said-but-my-senile-father-in-laws-di-93403","125057":"juny-158-english-subtitle-juny-158-first-time-in-her-life-with-a-black-man-a-voluptuous-female-instr-93404","125058":"cawd-799-english-subtitle-cawd-799-i-love-sperm-mayuki-ito-bukkake-debut-a-shower-of-thick-sticky-se-93405","125059":"cawd-795-english-subtitle-cawd-795-if-you-want-to-go-to-college-you-have-to-get-pregnant-with-my-pla-93382","125060":"cawd-811-english-subtitle-cawd-811-i-was-so-fascinated-by-the-persistent-and-creepy-atmosphere-that-93383","125061":"vec-686-english-subtitle-vec-686-the-night-i-had-creampie-sex-with-a-kind-part-timer-secretly-a-play-93384","125062":"cawd-801-english-subtitle-cawd-801-sorry-for-being-such-a-small-pussy-pranking-a-frail-girls-sensiti-93385","125063":"venz-047-english-subtitle-venz-047-a-dating-app-wife-who-can-get-horny-because-shes-with-a-stranger-93386","125064":"cawd-816-english-subtitle-cawd-816-hobby-bike-riding-no-boyfriend-4-sex-friends-shes-a-tomboy-with-a-93387","125065":"ksbj-366-english-subtitle-ksbj-366-runaway-wife-the-condition-for-letting-me-stay-with-her-is-to-be-111084","125066":"ksbj-365-english-subtitle-ksbj-365-i-cant-help-but-love-my-son-reika-ichiba-ichiba-reika-2-111085","125067":"xvsr-801-english-subtitle-xvsr-801-dirty-mouth-tens-of-thousands-of-dicks-in-her-mouth-amazing-blowj-111086","125068":"pfas-031-english-subtitle-pfas-031-debt-waste-bankruptcy-reiwa-elegy-women-tears-and-sex-ito-kuran-3-111087","125069":"mmus-095-english-subtitle-mmus-095-little-devil-provocative-beautiful-girl-ankoko-apricot-here-3-111088","125070":"ymds-202-english-subtitle-ymds-202-a-night-of-intimate-and-passionate-sex-with-the-much-admired-momo-116024","125071":"fsdss-974-english-subtitle-fsdss-974-a-close-look-at-av-production-assistants-nene-yoshitaka-a-femal-110017","125072":"fsdss-975-english-subtitle-fsdss-975-beautiful-breasts-undercover-investigator-right-next-to-her-lov-110018","125073":"adn-658-english-subtitle-adn-658-please-forgive-me-my-brother-in-laws-carnal-desires-8-mika-sumikawa-93396","125074":"adn-652-english-subtitle-adn-652-ntr-poisonous-love-for-an-unsatisfied-body-hinata-tachibana-3-93397","125075":"adn-665-english-subtitle-adn-665-i-allowed-my-father-in-law-to-insert-it-for-only-10-seconds-i-ended-93398","125076":"adn-654-english-subtitle-adn-654-obscene-new-release-lingerie-manufacturers-talented-female-presiden-93399","125077":"sone-662-english-subtitle-sone-662-dreams-youth-sex-newcomer-no-1style-buzzworthy-idol-influencer-sa-115020","125078":"sone-626-english-subtitle-sone-626-shes-shy-timid-and-weak-to-pressure-i-was-attracted-to-my-girlfri-116025","125079":"jura-139-english-subtitle-jura-139-first-shooting-married-woman-documentary-chapter-3-mami-kotomiya-99912","125080":"aarm-279-english-subtitle-aarm-279-rejuvenating-beauty-salon-2-with-beautiful-mature-therapists-who-99913","125081":"jura-140-english-subtitle-jura-140-first-shooting-married-woman-documentary-chapter-2-sanae-kubota-100694","125082":"jrze-234-english-subtitle-jrze-234-first-shooting-married-woman-documentary-kuroki-runa-runa-kuroki-108950","125083":"clot-030-english-subtitle-clot-030-pantyhose-temptation-sakuragi-mion-mion-sakuragi-2-110016","125084":"nacr-923-english-subtitle-nacr-923-call-girls-are-strictly-prohibited-from-having-sex-so-if-you-have-119037","125085":"nacr-926-english-subtitle-nacr-926-the-doorbell-rings-while-shes-masturbating-she-seduces-the-delive-121234","125086":"start-271-english-subtitle-start-271-a-tomboyish-university-dorm-mother-has-her-nipples-played-with-115021","125087":"fsdss-991-english-subtitle-fsdss-991-first-ever-raw-creampie-so-good-it-makes-her-convulse-scream-an-121236","125088":"bijn-270-english-subtitle-bijn-270-the-documentary-orgasmic-sex-with-instincts-bared-a-horny-horny-w-102149","125128":"jur-249-english-subtitle-jur-249-neighborhood-camp-ntr-shocking-footage-of-my-wife-being-taken-in-a-107472","125129":"jur-263-english-subtitle-jur-263-dripping-love-juice-full-on-full-on-sex-seven-days-of-implantation-108945","125131":"sone-607-english-subtitle-sone-607-a-beautiful-girl-with-outstanding-style-and-charm-has-a-smiling-f-108948","125132":"sone-615-english-subtitle-sone-615-the-strongest-heroines-first-av-experience-3-scenes-kanna-seto-se-110019","125133":"sone-617-english-subtitle-sone-617-did-your-penis-get-hard-if-youre-okay-with-being-an-older-woman-i-110020","125134":"sone-618-english-subtitle-sone-618-super-intense-sex-contract-a-life-insurance-saleswoman-with-poor-110021","125135":"sone-636-english-subtitle-sone-636-the-diligent-and-pure-swimming-team-ace-loses-her-senses-in-front-110022","125136":"sone-621-english-subtitle-sone-621-the-insidious-play-of-a-jd-with-exquisite-breasts-a-record-of-an-111089","125137":"sone-627-english-subtitle-sone-627-i-couldnt-resist-the-j-cup-busty-beauty-who-rides-the-same-train-111090","125138":"sone-620-english-subtitle-sone-620-her-k-cup-breasts-visible-even-through-her-clothes-catch-the-eye-111091","125139":"sone-629-english-subtitle-sone-629-if-you-get-an-erection-during-a-risky-vio-treatment-a-beautiful-a-111092","125140":"ipzz-520-english-subtitle-ipzz-520-first-time-trying-out-soapland-immediate-blowjob-and-immediate-se-104000","125141":"dass-611-english-subtitle-dass-611-a-high-cadence-cowgirl-slut-makes-you-cum-with-a-big-ass-vaginal-104001","125142":"roe-315-english-subtitle-roe-315-a-limited-time-super-intense-short-time-secret-rendezvous-with-miki-104002","125143":"jur-237-english-subtitle-jur-237-my-fiance-said-he-had-no-experience-in-the-sex-industry-but-his-tec-104003","125144":"dass-619-english-subtitle-dass-619-please-let-me-see-your-dick-the-erotic-doujinshi-artist-next-door-104628","125145":"sone-562-english-subtitle-sone-562-s1-20th-anniversary-the-strongest-tag-team-in-the-history-of-the-104629","125146":"sone-569-english-subtitle-sone-569-pleasure-first-time-experience-3-super-exciting-scenes-when-she-t-105387","125147":"jur-240-english-subtitle-jur-240-a-friend-of-mine-boasted-that-he-had-sex-with-his-wife-three-days-a-105690","125148":"roe-336-english-subtitle-roe-336-a-night-of-drinking-with-my-beloved-mother-i-grew-up-addicted-to-al-105691","125149":"roe-335-english-subtitle-roe-335-my-mother-couldnt-bear-to-see-me-going-crazy-after-abstaining-from-105693","125150":"roe-328-english-subtitle-roe-328-satsuki-kiriokas-miraculous-comeback-the-second-installment-is-a-cl-106492","125151":"jur-244-english-subtitle-jur-244-the-kitchen-is-a-den-of-domestic-infidelity-mahiro-ichiki-2-107107","125152":"dass-572-english-subtitle-dass-572-possessive-uncle-in-fujimori-riho-takes-over-the-body-of-a-cheeky-99908","125153":"ipzz-518-english-subtitle-ipzz-518-squirting-cumming-covered-in-semen-a-first-time-experience-of-thr-99909","125154":"dass-574-english-subtitle-dass-574-a-week-has-passed-since-i-gave-my-man-hating-slender-beautiful-br-99910","125155":"ipzz-507-english-subtitle-ipzz-507-i-cant-live-without-sex-anymore-197-orgasms-2255-pussy-convulsion-99911","125156":"ipzz-514-english-subtitle-ipzz-514-release-of-abstinence-aphrodisiac-awakening-the-double-effect-of-100424","125157":"jur-029-english-subtitle-jur-029-sayaka-36-a-former-celebrity-who-became-a-topic-of-conversation-for-100561","125158":"jur-024-english-subtitle-jur-024-the-miracle-of-meeting-you-a-beautiful-woman-that-you-will-never-fo-100562","125159":"ipzz-519-english-subtitle-ipzz-519-fill-your-brain-with-pleasure-with-saki-sasakis-premium-masturbat-100695","125160":"jur-188-english-subtitle-jur-188-double-secretary-a-busy-black-sperm-milking-schedule-that-controls-100696","125161":"jur-033-english-subtitle-jur-033-recreational-trip-ntr-my-wife-was-gang-playd-by-her-bosses-who-had-102150","125162":"jur-234-english-subtitle-jur-234-at-first-it-was-just-teasing-i-became-addicted-to-my-sons-friends-b-104004","125163":"dass-601-english-subtitle-dass-601-a-dispatched-masseuse-touched-my-sensitive-private-parts-too-much-104005","125207":"dass-570-english-subtitle-dass-570-a-perverted-old-mans-remote-control-training-makes-her-horny-and-93411","125208":"vec-688-english-subtitle-vec-688-mothers-best-friend-sayuki-natori-2-93412","125209":"vec-687-english-subtitle-vec-687-i-take-the-beautiful-married-woman-who-works-at-my-part-time-job-ho-93413","125210":"ipzz-501-english-subtitle-ipzz-501-a-beautiful-beautician-at-a-married-womans-home-beauty-salon-kana-93414","125211":"ipzz-502-english-subtitle-ipzz-502-sperm-busting-creampie-orgy-uncut-special-a-huge-semen-festival-w-93415","125212":"ipzz-503-english-subtitle-ipzz-503-sweaty-creampie-sex-at-the-end-of-summer-i-couldnt-control-my-rea-93416","125213":"ipzz-506-english-subtitle-ipzz-506-beautiful-private-tutor-mitsuris-kissing-lesson-mitsuri-nagahama-93417","125214":"ipzz-508-english-subtitle-ipzz-508-super-controversial-work-released-karen-kaede-a-clean-freakish-an-93394","125215":"ipzz-512-english-subtitle-ipzz-512-my-girlfriend-was-waiting-for-me-at-home-but-i-missed-the-last-tr-93395","125216":"ipzz-505-english-subtitle-ipzz-505-a-2-day-1-night-hellish-date-a-woman-who-wants-to-do-it-even-if-s-99905","125217":"dass-580-english-subtitle-dass-580-a-manicurist-wife-who-unconsciously-spreads-big-tits-temptation-a-99906","125218":"dass-581-english-subtitle-dass-581-on-a-sweltering-hot-day-when-the-air-conditioner-is-broken-a-frus-99907","125219":"mifd-595-english-subtitle-mifd-595-the-busty-girl-who-is-the-talk-of-the-erotic-sns-community-is-a-p-115023","125220":"mida-084-english-subtitle-mida-084-the-perverts-fingering-was-so-good-i-couldnt-even-make-a-sound-an-119043","125221":"pred-753-english-subtitle-pred-753-supporting-the-recluses-independence-busty-office-lady-julia-prov-119045","125222":"vec-689-english-subtitle-vec-689-class-reunion-double-affair-sex-i-met-my-first-girlfriend-for-the-f-121265","125223":"abf-208-english-subtitle-abf-208-fetish-tokyo-remu-suzumori-40-minutes-of-exclusive-bonus-footage-in-93410","125224":"iqqq-048-english-subtitle-iqqq-048-married-teacher-hanayagi-rinko-gets-10-times-wetter-in-a-climax-l-108245","125225":"jrze-235-english-subtitle-jrze-235-first-time-filming-a-fifty-year-old-wife-documentary-tachibana-hi-108955","125226":"meko-339-english-subtitle-meko-339-auntie-rental-service-returns-87-i-wanted-to-have-more-amazing-se-111094","125227":"meko-338-english-subtitle-meko-338-auntie-rental-service-returns-86-i-wanted-to-have-more-amazing-se-111095","125228":"start-286-english-subtitle-start-286-honjo-suzu-is-an-exquisite-beauty-leg-aromatherapy-salon-where-111096","125230":"fsdss-999-english-subtitle-fsdss-999-i-wasnt-satisfied-with-my-boyfriends-i-went-back-to-my-parents-119370","125231":"ebwh-203-english-subtitle-ebwh-203-a-busty-neat-and-tidy-wife-esthetician-who-was-trained-to-be-craz-104009","125232":"miab-407-english-subtitle-miab-407-during-a-school-trip-the-girls-noticed-my-erect-nipples-and-surro-104010","125233":"blk-647-english-subtitle-blk-647-active-gal-nurse-sucks-fucks-and-eats-the-slutty-nurse-kurosaki-han-104011","125234":"jjee-005-english-subtitle-jjee-005-first-time-completely-free-completely-private-room-creampie-hidde-108952","125235":"mida-079-english-subtitle-mida-079-would-you-like-to-be-my-practice-partner-my-sexy-sister-with-beau-108953","125236":"mida-087-english-subtitle-mida-087-who-is-that-girl-i-identified-the-home-address-of-the-cute-colleg-108954","125237":"mida-086-english-subtitle-mida-086-ordered-by-my-boss-who-i-hate-to-be-a-lewd-swimsuit-model-group-s-110024","125238":"hmn-665-english-subtitle-hmn-665-a-sexually-frustrated-liberal-arts-girl-is-impregnated-by-the-sensu-110025","125239":"juny-150-english-subtitle-juny-150-big-cocked-black-athlete-ntr-voluptuous-busty-wife-chitose-yuki-l-110026","125240":"mida-090-english-subtitle-mida-090-my-horny-brother-is-fully-erect-again-today-when-he-sees-his-fema-110027","125241":"mukc-091-english-subtitle-mukc-091-i-met-a-bar-hostess-after-work-and-we-had-a-drunken-threesome-and-111093","125242":"pppe-316-english-subtitle-pppe-316-spence-breast-development-clinic-amiri-saito-3-115022","125287":"pred-750-english-subtitle-pred-750-while-accompanying-my-sister-in-law-on-a-business-trip-a-sudden-d-100427","125288":"meyd-978-english-subtitle-meyd-978-cum-with-a-voluptuous-busty-cabin-attendant-tadaman-airlines-x-cl-100428","125289":"mimk-208-english-subtitle-mimk-208-live-action-version-e2978fe2978fe2978fr-older-sister-who-wants-to-100429","125290":"pred-751-english-subtitle-pred-751-big-assed-jk-targeted-by-school-swimsuit-maniac-defiled-by-perver-101529","125291":"ebwh-200-english-subtitle-ebwh-200-a-busty-female-teacher-who-was-transferred-to-a-remote-island-is-101608","125292":"mukc-093-english-subtitle-mukc-093-alone-with-a-naughty-girl-a-pure-underground-idol-who-seduces-an-101609","125293":"mucd-325-english-subtitle-mucd-325-the-best-way-to-jerk-off-to-a-super-cute-girl-in-uniform-and-have-101702","125294":"mvsd-632-english-subtitle-101847","125295":"mudr-317-english-subtitle-mudr-317-kitayama-yuis-first-anal-experience-yuu-kitayama-3-103255","125296":"pred-745-english-subtitle-pred-745-face-body-sexiness-personality-everything-is-s-class-a-dirty-mist-104006","125297":"pred-744-english-subtitle-pred-744-a-plain-office-lady-in-the-general-affairs-department-is-a-slutty-104007","125298":"ebwh-206-english-subtitle-ebwh-206-when-i-introduced-my-influencer-girlfriend-to-a-pilates-class-i-k-104008","125299":"ksbj-369-english-subtitle-ksbj-369-i-was-so-horny-that-i-tempted-my-husbands-subordinate-with-my-no-111099","125300":"ksbj-368-english-subtitle-ksbj-368-on-the-night-of-the-third-year-since-my-wifes-mother-became-a-wid-116217","125301":"juny-153-english-subtitle-juny-153-on-the-third-day-of-continuing-to-cum-inside-my-resisting-girlfri-93406","125302":"hmn-676-english-subtitle-hmn-676-i-couldnt-resist-a-high-school-girl-who-was-fighting-with-her-boyfr-93407","125303":"ebwh-194-english-subtitle-ebwh-194-busty-college-student-hibiki-amemiya-falls-into-the-pleasure-of-b-93408","125304":"venx-315-english-subtitle-venx-315-mothers-breasts-feel-so-good-from-endless-nipple-play-that-she-ca-93409","125305":"meyd-988-english-subtitle-meyd-988-high-spec-rookie-futaba-otani-33-years-old-av-appearance-sweat-cu-99922","125306":"mimk-201-english-subtitle-mimk-201-late-night-shift-with-him-me-and-the-manager-series-total-sales-o-99923","125307":"miab-432-english-subtitle-miab-432-im-gonna-fuck-you-so-stay-healthy-okay-a-reiwa-era-gal-from-my-cl-99914","125308":"miab-462-english-subtitle-miab-462-its-time-for-a-wank-everyone-a-beautiful-legged-secretary-who-use-99915","125309":"mimk-202-english-subtitle-mimk-202-if-you-dont-have-sex-youll-die-if-you-develop-the-disease-sex-is-100425","125310":"ebwh-202-english-subtitle-ebwh-202-alice-nanase-who-has-a-total-of-about-1-million-followers-replies-100426","125311":"royd-229-english-subtitle-royd-229-my-girlfriend-who-has-a-boyfriend-comes-to-stay-over-every-day-an-121272","125312":"ambi-206-english-subtitle-ambi-206-rie-miyagi-the-devilish-niece-who-yearns-for-a-forbidden-love-lik-99921","125313":"clot-031-english-subtitle-clot-031-the-alluring-black-pantyhose-female-boss-saryu-usui-umizusaki-sty-110028","125314":"ambi-207-english-subtitle-ambi-207-i-tried-using-a-dating-app-on-my-reclusive-sister-miku-arima-2-111097","125315":"wo-020-english-subtitle-wo-020-uncontrollable-sexual-desire-dirty-and-lewd-female-doctor-yui-hatano-111098","125316":"nacr-929-english-subtitle-nacr-929-unexpectedly-we-share-a-room-together-and-im-a-boring-boss-but-i-121275","125317":"abf-211-english-subtitle-abf-211-a-super-high-end-dating-club-where-you-can-spend-the-night-with-asu-121277","125319":"start-281-english-subtitle-start-281-a-celebrity-makes-a-surprise-visit-to-your-home-sodstar-yotsuba-121279","125321":"dldss-393-english-subtitle-dldss-393-god-breasted-amateur-short-haired-beauty-naho-kado-captivates-m-105870","125322":"bijn-271-english-subtitle-bijn-271-the-documentary-orgasmic-sex-with-instincts-bared-i-cup-voluptuou-102467","125359":"sone-705-english-subtitle-sone-705-the-female-teacher-i-had-admired-for-three-years-was-a-fellow-vir-115028","125360":"vod-036-english-subtitle-vod-036-i-ate-an-amateur-man-sara-isshiki-has-sex-with-a-lover-in-this-crea-115024","125361":"jur-231-english-subtitle-jur-231-the-days-of-creampie-gangbang-never-end-yuri-oshikawa-yuuri-oshikaw-115025","125362":"jur-206-english-subtitle-jur-206-carried-away-by-her-sweet-whispers-i-became-addicted-to-sex-with-ma-116026","125363":"jur-243-english-subtitle-jur-243-resort-pool-ntr-exclusive-hot-girl-x-adult-bikini-ntr-drama-where-a-117597","125364":"jur-253-english-subtitle-jur-253-during-the-spring-break-my-friend-and-i-decided-to-swap-mothers-hoj-117599","125365":"roe-329-english-subtitle-roe-329-the-wife-of-the-company-president-takes-a-new-employee-on-a-selfish-119376","125366":"roe-330-english-subtitle-roe-330-do-you-really-get-excited-when-you-see-my-underwear-the-middle-aged-119377","125367":"royd-230-english-subtitle-royd-230-is-it-okay-to-pay-rent-with-pussy-a-sudden-erotic-cohabitation-wi-121284","125368":"venx-316-english-subtitle-venx-316-do-you-get-excited-by-my-underwear-auntie-adachi-yuri-squeezes-ou-121286","125369":"royd-232-english-subtitle-royd-232-neighbor-gacha-ur-confirmed-performance-the-girl-who-moved-in-nex-121288","125370":"royd-227-english-subtitle-royd-227-when-i-woke-up-in-the-morning-i-found-my-fellow-female-co-worker-121271","125371":"focs-240-english-subtitle-focs-240-g-cup-busty-bride-ntr-on-the-night-before-the-wedding-a-risky-aff-108247","125372":"jur-252-english-subtitle-jur-252-the-night-before-i-proposed-to-my-girlfriend-my-playhood-friend-smi-108956","125373":"hmn-686-english-subtitle-hmn-686-reversal-of-roles-the-secret-face-of-the-weekend-i-made-my-boss-who-110029","125374":"hmn-669-english-subtitle-hmn-669-she-went-out-drinking-with-her-trusted-playhood-friend-but-missed-t-111100","125375":"roe-321-english-subtitle-roe-321-every-weekend-after-a-drinking-party-my-drunk-female-boss-tempts-me-111101","125376":"jur-034-english-subtitle-jur-034-teacher-please-come-to-school-properly-from-tomorrow-onwards-female-111102","125377":"roe-325-english-subtitle-roe-325-a-former-cabin-attendant-and-married-woman-aoi-yoshise-42-who-was-e-111103","125378":"roe-306-english-subtitle-roe-306-when-i-went-back-to-the-countryside-for-the-first-time-in-a-while-m-111104","125379":"jur-269-english-subtitle-jur-269-a-visiting-beauty-salon-makes-her-beg-for-a-dick-after-being-teased-111105","125380":"jur-208-english-subtitle-jur-208-i-thrust-my-dick-into-my-cheating-wife-kana-and-her-partner-misaki-111106","125381":"jur-246-english-subtitle-jur-246-im-a-lowlife-who-has-nothing-to-do-but-masturbate-but-when-i-brough-115026","125382":"jur-220-english-subtitle-jur-220-nude-model-ntr-shocking-video-of-wifes-affair-with-her-boss-and-dro-115027","125383":"aldn-440-english-subtitle-aldn-440-my-colleagues-ex-wife-i-always-thought-my-colleagues-wife-was-nic-99919","125384":"aldn-441-english-subtitle-aldn-441-mother-in-law-youre-so-much-better-than-my-wife-satsuki-kuriyama-99920","125385":"aldn-439-english-subtitle-aldn-439-my-wifes-mother-and-my-father-yuko-shiraki-shiraki-yuko-3-101727","125386":"aldn-445-english-subtitle-aldn-445-the-reason-why-my-wife-suddenly-asked-me-to-cum-inside-her-saran-103822","125387":"nsfs-368-english-subtitle-nsfs-368-the-confession-21-a-wife-who-goes-crazy-for-the-man-who-playd-her-115029","125388":"aldn-443-english-subtitle-aldn-443-after-the-reunion-kana-imai-3-121292","125389":"bony-138-english-subtitle-bony-138-24-hour-group-creampie-play-06-celebrity-beautiful-wife-y-san-3-101848","125390":"jur-205-english-subtitle-jur-205-a-mommy-friend-invites-me-to-a-matching-app-and-together-we-sweetly-103424","125391":"cjod-457-english-subtitle-cjod-457-sorry-for-making-my-penis-so-big-my-aunts-beautiful-body-helped-m-103456","125392":"sone-543-english-subtitle-sone-543-the-immoral-feeling-of-being-violated-in-front-of-the-person-i-lo-103470","125393":"dass-604-english-subtitle-dass-604-a-woman-who-does-it-immediately-when-she-is-in-a-pinch-she-is-lus-107473","125394":"dass-591-english-subtitle-dass-591-the-ultimate-pleasure-the-dazzling-glow-of-her-legs-will-hold-you-108246","125431":"mida-107-english-subtitle-mida-107-i-was-made-a-nipple-slave-in-place-of-my-beloved-husband-who-was-119383","125432":"mida-109-english-subtitle-mida-109-angels-french-kiss-makes-you-drool-and-makes-you-love-her-drink-y-121295","125433":"mida-114-english-subtitle-mida-114-an-intelligent-female-college-student-with-a-perfect-body-3-extre-121297","125434":"mida-110-english-subtitle-mida-110-soaking-wet-roommate-ntr-i-was-caught-in-a-sudden-downpour-on-a-b-121299","125435":"same-164-english-subtitle-same-164-im-playd-every-day-by-my-mothers-new-husband-miyu-aizawa-3-121301","125436":"fsdss-997-english-subtitle-fsdss-997-tied-by-a-red-thread-can-a-man-and-woman-bound-to-a-distance-of-119385","125437":"jura-143-english-subtitle-jura-143-first-shoot-of-a-60-year-old-wife-document-chapter-3-konatsu-shid-100514","125438":"abf-213-english-subtitle-abf-213-limit-break-sex-breaking-the-shell-of-an-absolute-beautiful-girls-m-101977","125439":"fera-194-english-subtitle-fera-194-unexpected-double-booking-on-a-matching-app-two-busty-wives-who-a-108250","125440":"jrze-236-english-subtitle-jrze-236-first-time-filming-a-married-woman-documentary-chika-harada-harad-108957","125441":"fns-016-english-subtitle-fns-016-obedient-housekeeper-sex-toy-for-a-family-full-of-men-rin-yamitsu-r-108251","125442":"aldn-444-english-subtitle-aldn-444-a-few-days-of-creampie-sex-with-my-brothers-wife-waka-misono-miso-99918","125443":"mimk-205-english-subtitle-mimk-205-live-action-version-of-my-life-in-the-boarding-house-2-my-days-of-111116","125444":"waaa-497-english-subtitle-waaa-497-playd-by-my-hated-stepfather-at-night-hinako-mori-3-111118","125445":"yuj-031-english-subtitle-yuj-031-a-few-days-of-being-sucked-out-of-my-sperm-by-a-junior-at-work-who-111120","125446":"yuj-030-english-subtitle-yuj-030-i-started-to-think-of-my-boyish-hidden-big-breasted-friend-as-a-mem-115030","125447":"npjs-165-english-subtitle-npjs-165-i-want-to-fuck-the-hottest-girl-at-a-certain-high-end-lounge-afte-116027","125448":"mimk-207-english-subtitle-mimk-207-live-action-version-the-invading-demon-king-and-the-played-sexual-117601","125449":"mida-099-english-subtitle-mida-099-fluffy-i-cup-breasts-dense-and-polite-service-soapland-pie-ejacul-117603","125450":"mida-068-english-subtitle-mida-068-no-script-at-all-rikka-ono-who-has-been-abstaining-from-sex-for-a-119051","125451":"mida-101-english-subtitle-mida-101-want-to-try-some-naughty-practice-my-nosy-playhood-friend-mio-has-119053","125452":"mida-104-english-subtitle-mida-104-during-a-training-camp-for-the-prestigious-boxing-club-the-big-br-119055","125453":"mida-108-english-subtitle-mida-108-i-went-to-my-boyfriends-house-for-the-first-time-but-the-man-who-119047","125454":"mida-105-english-subtitle-mida-105-bushy-pubic-hair-and-pussy-showing-off-in-embarrassing-costumes-f-119049","125455":"atid-627-english-subtitle-atid-627-tina-nanami-the-second-wife-business-woman-nanami-tina-3-103423","125456":"atid-628-english-subtitle-atid-628-when-i-sneaked-into-a-workplace-where-women-are-not-allowed-i-was-103457","125457":"bf-732-english-subtitle-bf-732-when-a-girl-who-i-thought-was-just-a-friend-confessed-her-love-to-me-103530","125458":"focs-243-english-subtitle-focs-243-a-cute-and-cunning-cafe-clerks-devilish-temptation-she-stares-at-108248","125459":"focs-242-english-subtitle-focs-242-suddenly-soaked-by-a-sudden-downpour-the-raw-and-voluptuous-h-cup-108249","125460":"fpre-168-english-subtitle-fpre-168-old-man-gangbang-25-consecutive-creampies-with-concentrated-aphro-110030","125461":"fpre-166-english-subtitle-fpre-166-thoroughly-enjoy-the-beautiful-mature-womans-body-filmed-with-4k-110031","125462":"jufe-580-english-subtitle-jufe-580-black-fuck-now-allowed-couple-trip-and-sharing-a-room-black-cream-111107","125463":"jufe-583-english-subtitle-jufe-583-a-story-about-a-harem-creampie-sex-with-a-gyaru-who-hangs-out-at-111108","125464":"mimk-204-english-subtitle-mimk-204-live-action-version-the-story-of-how-i-started-dating-my-busty-fr-111110","125465":"yuj-035-english-subtitle-yuj-035-a-girl-from-minato-ward-came-to-my-house-a-girl-with-no-money-no-ex-111112","125466":"waaa-499-english-subtitle-waaa-499-a-real-estate-lady-with-a-cuckold-fetish-ai-sayama-brings-the-hap-111114","125467":"adn-674-english-subtitle-adn-674-im-marrying-my-girlfriend-so-we-cant-meet-anymore-the-last-night-wi-99935","125468":"adn-679-english-subtitle-adn-679-unable-to-forgive-her-cheating-husband-she-keeps-teasing-him-to-the-99916","125469":"adn-669-english-subtitle-adn-669-please-forgive-me-brother-in-laws-carnal-desires-3-ran-kamiki-kamik-99917","125470":"adn-680-english-subtitle-adn-680-a-married-woman-who-licks-and-sucks-her-father-in-laws-body-ao-ebis-100430","125471":"cawd-808-english-subtitle-cawd-808-mayuki-ito-infiltrates-a-women-only-brothel-shes-mesmerized-by-th-100431","125472":"adn-681-english-subtitle-adn-681-after-i-was-worn-out-by-the-extremely-cruel-company-my-female-boss-100432","125473":"cawd-823-english-subtitle-cawd-823-an-innocent-and-naive-country-girl-from-yamagata-came-to-visit-an-101728","125474":"adn-687-english-subtitle-adn-687-a-married-woman-who-couldnt-stand-the-massage-of-her-plump-lower-bo-102065","125475":"cawd-826-english-subtitle-cawd-826-a-beautiful-college-girl-drummer-who-cant-find-a-man-to-satisfy-h-103256","125476":"miab-461-english-subtitle-miab-461-a-convenient-uniformed-je2978f-is-played-every-day-and-sex-educat-103325","125477":"atid-617-english-subtitle-atid-617-black-man-unveiled-bbp-presidents-secretary-falls-for-big-black-p-103371","125478":"adn-673-english-subtitle-adn-673-its-a-long-distance-relationship-so-no-one-will-find-out-right-even-103372","125479":"start-305-english-subtitle-start-305-a-mum-of-one-who-lives-in-tokyos-sugi-ward-and-works-as-a-cashi-121365","125480":"fsdss-989-english-subtitle-fsdss-989-could-be-daughter-nene-yoshitaka-3-118730","125481":"bijn-272-english-subtitle-bijn-272-the-documentary-orgasmic-sex-with-instincts-exposed-a-horny-house-102151","125482":"cad-031-english-subtitle-cad-031-shin-uniform-camera-hoshino-sumire-3-103616","125483":"xvsr-807-english-subtitle-xvsr-807-himari-kinoshita-gets-excited-by-the-beautiful-legged-office-lady-111122","125484":"xvsr-806-english-subtitle-xvsr-806-a-student-from-my-school-is-my-wife-after-school-a-subjective-tem-116669","125485":"dldss-392-english-subtitle-dldss-392-sweet-kisses-betrayal-and-infidelity-after-finding-out-that-her-107481","125486":"adn-670-english-subtitle-adn-670-the-ceos-daughter-until-she-falls-mika-sumikawa-3-99930","125487":"adn-660-english-subtitle-adn-660-even-though-i-dont-love-him-anymore-my-ex-boyfriends-dick-length-an-99931","125488":"juta-164-english-subtitle-juta-164-best-thirty-something-wifes-first-nude-av-documentary-erina-aso-3-99932","125489":"cawd-809-english-subtitle-cawd-809-the-class-president-wants-to-be-stained-white-a-beautiful-girl-in-99933","125490":"cawd-821-english-subtitle-cawd-821-ill-never-forget-the-ecstasy-i-felt-when-i-had-sex-with-my-modest-99934","125491":"roe-344-english-subtitle-roe-344-after-a-big-fight-a-former-couple-divorced-after-making-up-for-the-119530","125492":"roe-341-english-subtitle-roe-341-i-was-immersed-in-a-great-convulsive-back-arching-sex-with-my-belov-121366","125493":"sone-590-english-subtitle-sone-590-dont-you-want-to-mess-with-this-fluffy-white-h-cup-body-you-want-121367","125494":"sone-561-english-subtitle-sone-561-s1-20th-anniversary-special-the-strongest-tag-team-in-the-history-121368","125495":"sone-633-english-subtitle-sone-633-hiyori-nosaka-a-slutty-maid-who-will-lick-your-face-balls-shaft-a-121369","125496":"sone-663-english-subtitle-sone-663-im-graduating-from-sex-that-i-dont-know-yet-idol-influencer-sakur-121370","125497":"sone-674-english-subtitle-sone-674-a-one-on-one-private-sex-lesson-with-an-erotic-tutor-who-will-tea-121371","125498":"sone-669-english-subtitle-sone-669-when-the-housewife-next-door-hangs-her-panties-out-on-the-balcony-121372","125499":"sone-664-english-subtitle-sone-664-even-after-30-years-of-marriage-my-wife-saki-okuda-is-still-like-121373","125500":"sone-675-english-subtitle-sone-675-abstinence-breast-development-teasing-aphrodisiac-chase-piston-ha-121374","125501":"sone-670-english-subtitle-sone-670-dont-give-me-a-peace-sign-after-you-got-roughly-cuckolded-by-the-121364","125538":"ipzz-570-english-subtitle-ipzz-570-revolutionary-beautiful-girls-super-awakening-of-orgasm-porchio-c-111124","125539":"rki-707-english-subtitle-rki-707-a-horny-convenience-store-worker-with-a-girlfriend-who-has-customer-111125","125540":"jur-224-english-subtitle-jur-224-a-friend-of-mine-boasted-that-he-had-sex-with-his-wife-three-days-a-111126","125541":"jur-226-english-subtitle-jur-226-sweat-gushing-out-reason-blown-away-a-midsummer-affair-in-which-she-119227","125542":"jur-272-english-subtitle-jur-272-cuckold-skewer-gangbang-please-violate-my-beloved-wife-to-the-depth-115031","125543":"jur-288-english-subtitle-jur-288-morning-intercom-the-frustrated-housewife-next-door-suddenly-comes-115032","125544":"ipzz-525-english-subtitle-ipzz-525-lets-all-have-sex-a-slutty-unmarried-woman-gets-horny-at-a-weddin-116028","125545":"jur-310-english-subtitle-jur-310-a-married-woman-with-a-beautiful-tanned-ass-and-a-sports-instructor-116447","125546":"jur-242-english-subtitle-jur-242-i-cant-drink-anymore-mary-tachibana-the-female-boss-who-was-played-116670","125547":"sone-638-english-subtitle-sone-638-i-want-to-see-the-real-face-and-real-sex-of-the-strongest-heroine-118729","125548":"roe-340-english-subtitle-roe-340-pov-ntr-the-person-in-the-pov-video-sent-to-me-by-mistake-from-my-b-119226","125549":"roe-347-english-subtitle-roe-347-seven-days-of-being-blown-away-by-the-neighbors-wife-in-an-s-shaped-119529","125550":"ipzz-567-english-subtitle-ipzz-567-a-mischievous-honey-trap-with-a-devilish-j-class-girl-who-works-t-110033","125551":"ipzz-533-english-subtitle-ipzz-533-a-deep-kiss-and-sex-with-a-super-cute-girl-full-of-drool-and-spit-111123","126890":"sdjs-361-uncensored-leak-sdjs-361-the-7th-annual-fellatio-cinderella-championship-lets-get-going-26-121498","127063":"cus-2510-chinese-soft-massage-service-upgraded-to-full-set-of-insertion-my-natural-first-line-abalon-12157","127064":"cus-2511-crazy-sex-on-the-sofa-and-almost-broken-by-the-18cm-huge-cock-12158","127065":"cus-2505-before-yunxi-became-an-actress-she-was-a-popular-star-in-the-dongguan-style-club-she-was-sp-12159","127066":"cus-2504-elephant-medias-exciting-sex-game-first-battle-with-two-cocks-x-awakening-the-desire-in-the-12160","127067":"pms011-1-play-to-the-end-part-1-12161","127068":"szl031-single-woman-was-stalked-and-molested-by-a-lewd-man-on-her-way-home-from-get-off-work-12162","127069":"msd203-when-i-returned-home-for-the-spring-festival-i-met-a-poor-loser-who-turned-into-a-rich-young-12163","127070":"mdl0010-3-abalone-game-2-ep3-final-showdown-climax-battle-12164","127071":"cus-2503-elephant-media-thailand-taxi-driver-has-a-dick-12165","127072":"dysy001-beautiful-dancer-12166","127073":"cus-2501-hook-up-with-my-buddys-girlfriend-and-finger-her-pussy-until-she-squirts-12167","127074":"cus-2514-the-delivery-man-fucked-a-play-girl-he-had-only-met-once-12168","127075":"cus-2515-elephant-media-thailand-internet-celebrity-with-the-ultimate-european-and-american-figure-b-12169","127076":"cus-2516-passion-comes-from-life-playing-goddesses-to-find-inspiration-for-creation-12170","127077":"cus-2517-the-girlfriend-who-is-addicted-to-sexual-fantasies-is-conquered-by-her-good-brothers-big-co-12171","127078":"cus-2518-the-unsatisfied-stepmothers-pussy-longs-to-be-filled-by-her-sons-big-cock-12172","127079":"emx076-peeping-at-my-sister-who-had-eye-surgery-12173","127080":"cus-2512-the-massage-was-so-unbearable-that-i-just-grabbed-the-dick-and-rode-on-it-12174","127081":"cus-2513-the-first-collaboration-with-the-million-dollar-youtuber-the-english-teacher-nina-double-su-12175","127082":"cus-2506-sakura-girl-sex-record-ep33-explosive-fuck-voluptuous-big-tits-girl-12176","127083":"cus-2507-changzi-and-lulus-thai-double-bubble-bath-passionate-mutual-rubbing-of-body-bubble-bath-ext-12177","127084":"cus-2508-chinese-av-goddess-su-chang-and-japanese-unprotected-goddess-macca-work-together-to-squeeze-12178","127085":"cus-2509-chinese-av-goddess-su-chang-and-japanese-unprotected-goddess-macca-join-hands-to-squeeze-ou-12179","127086":"cus-2523-sakura-girl-sex-record-ep34-big-tits-and-big-ass-oil-massage-12180","127087":"dysy020-beautiful-wife-being-paid-with-sex-12181","127088":"dybc008-my-girlfriends-sister-said-some-cheesy-love-words-to-me-12182","127089":"cus-2520-unable-to-restrain-the-restlessness-in-my-heart-i-designed-to-play-the-goddess-bai-yueguang-12183","127090":"dysy018-push-down-my-beautiful-sister-12184","127091":"dybc005-beautiful-neighbor-sells-her-house-and-uses-her-ass-to-get-endless-sex-12185","127092":"cus-2521-father-daughter-play-single-father-trains-his-plump-daughter-into-a-sex-slave-12186","127093":"dyxo003-my-wifes-best-friend-falls-in-love-with-me-part-2-the-joy-of-a-threesome-12187","127094":"dyxo002-my-wifes-best-friend-fell-in-love-with-me-part-1-i-slept-with-my-wifes-big-tits-best-friend-12188","127095":"cus-2522-male-student-hooks-up-with-female-teacher-and-turns-into-a-slutty-nympho-with-continuous-or-12189","127096":"cus-2519-the-dream-lover-play-girl-said-no-but-her-body-was-honest-12190","127097":"md0346-stewardesss-hunting-after-abstinence-black-silk-jade-feet-bold-sperm-extraction-12191","127154":"dysy004-school-beautys-intimate-sex-expert-12192","127155":"dysy003-stepdaughters-cum-flows-back-into-a-river-12193","127156":"dysy002-lustful-female-landlord-collects-rent-with-sperm-12194","127157":"dysy006-the-wonderful-interweaving-of-games-and-sex-scenes-12195","127158":"dysy005-happy-life-with-big-tits-sister-in-law-12196","127159":"szl033-my-neighbors-yoga-teacher-is-so-slutty-12197","127160":"cus-2527-elephant-media-have-you-fired-yet-12198","127161":"cus-2525-impotent-husband-uses-delayed-ejaculation-spray-to-regain-his-virility-and-teach-his-wife-a-12199","127162":"emx077-video-chat-with-cat-ear-girlfriend-12200","127163":"cus-2526-the-plump-female-roommate-who-shared-the-house-turned-into-a-bitch-under-the-aphrodisiac-of-12201","127164":"md0342-security-guard-and-salesgirl-anal-sex-live-3p-played-orgasm-12202","127165":"cus-2524-play-the-beautiful-cheongsam-female-colleague-without-condom-and-cum-inside-the-pink-white-12203","127166":"satm040-lonely-young-woman-cant-satisfy-her-with-vibrator-so-she-calls-her-friend-to-have-sex-12204","127167":"satm035-beautiful-girl-model-becomes-an-av-actress-to-raise-medical-expenses-12205","127168":"satm033-even-regular-massage-technicians-cannot-resist-the-temptation-of-money-and-desire-12206","127169":"satm021-cousin-invites-cousin-to-discuss-sex-positions-12207","127170":"satm036-legal-aid-from-lawyer-zhang-black-silk-oral-sex-service-12208","127171":"satm062-little-sister-likes-daddys-money-and-daddy-likes-to-fuck-her-pussy-12209","127172":"satm043-campus-bullying-pure-school-beauty-becomes-a-plaything-12210","127173":"satm002-a-qualified-yoga-teacher-conquers-female-students-12211","127174":"cus-2530-sakura-girl-sex-record-ep35-big-tits-and-big-ass-passionate-sex-12212","127175":"pmx167-big-tits-female-teacher-home-visit-12213","127176":"cus-2528-what-you-cant-get-is-always-in-a-commotion-the-goddess-you-have-been-secretly-in-love-with-12214","127177":"cus-2529-a-man-who-ejaculates-quickly-uses-viagra-to-win-back-his-unsatisfied-girlfriend-12215","127178":"satx011-hook-up-with-a-female-spy-12216","127179":"satm010-the-cousin-who-was-about-to-get-married-said-goodbye-to-her-cousin-physically-12217","127180":"dysy011-sexy-director-played-and-playd-actress-12218","127181":"cus-2533-the-ecstatic-sister-in-law-turned-into-a-lustful-slut-and-played-with-various-postures-12219","127182":"cus-2534-my-sister-and-i-have-a-forbidden-reunion-and-love-is-endless-12220","127183":"cus-2532-play-the-bosss-wife-to-get-revenge-for-the-unpaid-wages-and-punish-her-slutty-pussy-12221","127184":"pm098-my-parents-playd-my-sister-at-home-and-she-couldnt-help-but-scream-12222","127185":"szl034-the-best-tender-pussy-play-school-girl-hairless-little-pussy-first-person-point-of-view-hard-12223","127186":"md0343-the-secret-of-exchanging-exotic-bodies-under-the-cheongsam-12224","127187":"cus-2531-elephant-media-hotels-exclusive-girlfriend-is-super-sexy-and-has-big-breasts-12225","127188":"satm086-the-secret-of-lustful-brother-in-law-and-sister-in-law-12226","127189":"satm058-beautiful-wife-takes-advantage-of-her-husbands-business-trip-to-have-an-affair-with-her-12227","127222":"satm082-cute-kawaii-play-girl-cosplay-japanese-anime-tokisaki-kurumi-12228","127223":"satm050-sweet-new-baby-debut-sexy-big-tits-bathtub-battle-12229","127224":"cus-2535-elephant-media-wife-cheating-on-her-husband-and-looking-for-fresh-meat-to-massage-her-pussy-12230","127225":"satm099-play-cheating-horny-wife-falls-in-love-with-brother-in-laws-big-cock-12231","127226":"cus-2536-sakura-girl-sex-record-ep36-daddys-maid-good-daughter-12232","127227":"satm013-exciting-dream-with-goddess-12233","127228":"satx010-after-being-looked-down-upon-by-my-girlfriends-mother-and-played-to-break-up-i-met-her-mothe-12234","127229":"emx078-discover-the-lustful-secret-of-my-aunt-12235","127230":"satm034-the-best-girl-xia-hua-cosplays-the-original-character-cao-shens-pink-and-tender-pussy-mastur-12236","127231":"satx022-young-female-student-eager-for-sex-12237","127232":"satm017-the-process-of-the-young-man-interviewing-the-male-actor-on-the-spot-12238","127233":"satx014-my-wife-wont-let-me-have-sex-so-i-have-to-use-dating-apps-to-vent-my-sexual-desire-12239","127234":"pm100-the-play-of-the-cold-female-teacher-in-the-second-grade-of-high-school-triggered-the-other-sid-12240","127235":"cus-2539-elephant-media-pure-desire-girls-beverage-store-shy-sex-first-experience-12241","127236":"cus-2538-sakura-girl-sex-record-ep37-big-tits-fuck-buddy-fuck-machine-experience-12242","127237":"pmx168-sm-queen-played-orgasm-12243","127238":"szl035-lustful-sister-seduces-cousin-to-have-sex-at-home-12244","127239":"cus-2537-elephant-media-explores-thai-dating-apps-12245","127240":"satm039-sexy-purple-haired-beauty-masturbates-in-the-bathroom-and-wants-a-big-cock-to-be-inserted-12246","127241":"satx023-sexy-male-and-female-masseurs-12247","127242":"saky003-helping-a-frigid-sister-12248","127243":"md0180-3-night-shift-hospital-ep3-training-the-mother-and-daughter-to-use-as-a-urinal-12249","127244":"pm099-my-aunt-has-become-my-bitch-all-the-women-in-this-family-will-become-my-flesh-pots-for-sexual-12250","127245":"satm096-my-cousin-had-an-affair-with-her-cousin-in-the-hotel-without-telling-her-boyfriend-12251","127246":"cus-2548-the-contrast-between-the-school-girl-and-the-sex-addiction-turns-into-a-slutty-bitch-12252","127247":"mdcn0001-my-bitch-girlfriend-is-trained-to-lick-feet-and-drink-urine-on-weekends-12253","127248":"cus-2546-sakura-girl-sex-record-ep38-top-fat-ass-bathroom-sex-12254","127249":"emx079-the-secret-under-the-table-of-a-desire-female-college-student-12255","127250":"cus-2542-its-really-exciting-to-have-sex-next-to-the-hotel-window-and-be-watched-by-people-in-the-op-12256","127251":"cus-2543-deep-throat-doggy-style-woman-on-top-various-intense-sex-positions-until-orgasm-12257","127252":"cus-2544-crazy-sex-in-the-bathhouse-of-dragon-palace-in-vietnam-12258","127253":"cus-2545-after-playing-with-his-cock-he-was-punished-by-being-fucked-hard-12259","127254":"szl036-the-female-agent-being-interrogated-undergoes-a-comprehensive-inspection-12260","127255":"cus-2540-elephant-medias-hot-taiwanese-girl-with-a-slim-waist-is-actually-a-plump-f-cup-busty-girl-w-12261","127256":"mdcm0015-nezha-2-the-three-evil-dragon-girls-fight-against-the-true-yang-demon-boy-12262","127257":"cus-2541-sociopath-alert-swimsuit-model-audition-scam-12263","127294":"cus-2555-aphrodisiac-playd-busty-school-girl-cock-hard-and-long-lasting-orgasm-12264","127295":"satx028-after-the-party-the-drunk-boss-was-in-trouble-12265","127296":"satx018-crazy-fuck-of-a-proud-black-stockings-bitch-12266","127297":"satx017-fang-zhongs-love-for-one-night-stand-12267","127298":"pmx169-the-female-stars-agent-with-explosive-sexual-desire-12268","127299":"cus-2553-elephant-media-f-cup-su-nianjin-challenges-2025-boxing-av-for-the-first-time-12269","127300":"md0345-the-original-sin-of-the-fathers-death-and-the-sisters-tragic-orgy-double-played-return-12270","127301":"cus-2549-the-seven-year-itch-brings-back-the-passion-of-sex-before-marriage-12271","127302":"cus-2550-meet-the-best-neighbors-beautiful-pussy-and-rub-the-dick-and-pussy-continuously-until-clima-12272","127303":"cus-2551-uncontrollable-erection-brother-and-sister-play-full-of-love-12273","127304":"cus-2552-hook-up-with-the-best-black-silk-sister-in-law-and-insert-into-the-pussy-from-behind-and-ma-12274","127305":"cus-2547-driving-xiaomi-su7-ultra-to-seduce-a-gold-digger-with-passionate-car-sex-review-12275"};
// <GENERATED_SEO_DATA_END>

const CURATED_CATEGORY_CANONICAL_MAP = new Map(CURATED_CATEGORIES_LIST.map(c => [c.toLowerCase(), c]));
const SEO_ENRICHED_POSTS = { ...TEST_MOCK_ENRICHED_POSTS, ...SEO_ENRICHED_POSTS_SYNCED };

const HUB_DESCRIPTIONS = {
  'uncensored': {
    title: 'Uncensored JAV Streaming Guide',
    paragraphs: [
      'Welcome to the premier archive of Uncensored JAV (Japanese Adult Video) streaming on MISSAV-J. Unlike standard broadcast releases that utilize digital mosaic processing in accordance with traditional domestic regulatory guidelines, uncensored releases showcase authentic, unfiltered footage preserved in pristine high definition and 4K master quality.',
      'Our collection spans legendary independent production houses, specialized overseas distribution labels, and exclusive uncompressed studio masters. Each title is cataloged with verified actress credits, authentic release dates, and high-bitrate streaming feeds to ensure an unparalleled viewing experience with zero buffer interruptions.',
      'Explore popular sub-genres, search by renowned performers, or browse newly remastered classic releases. All streams are optimized for seamless multi-device playback on mobile, tablet, and desktop displays.'
    ],
    relatedTags: ['FC2', 'Tokyo Hot', 'Caribbeancom', '1pondo', 'Heyzo', 'Uncensored Leaked']
  },
  'drama': {
    title: 'JAV Drama & Narrative Cinema Guide',
    paragraphs: [
      'Discover the rich storytelling traditions of Japanese cinematic adult drama. JAV drama productions emphasize compelling storylines, intricate interpersonal conflicts, authentic romantic tension, and atmospheric cinematography guided by seasoned industry directors.',
      'From suspenseful romantic thrillers to slice-of-life emotional narratives, drama titles feature nuanced performances from Japan\'s top award-winning actresses. High production values, realistic set design, and immersive soundtracks create a sophisticated cinematic journey.',
      'Filter through celebrated multi-part story arcs, critically acclaimed actress debuts, and contemporary narrative masterpieces streamed in crystal-clear audio and video.'
    ],
    relatedTags: ['Romance', 'Story-Driven', 'Cinematic', 'Office Lady', 'Married Woman']
  },
  'comedy': {
    title: 'JAV Comedy & Parody Entertainment',
    paragraphs: [
      'Experience the playful and lighthearted side of Japanese adult entertainment. The JAV comedy genre combines creative situational humor, playful role-playing scenarios, and witty banter that showcase performers\' charismatic comedic timing.',
      'Popular productions feature inventive variety-show concepts, comedic misunderstandings, and lively chemistry between leading performers and directors. These releases offer an uplifting and entertaining twist on standard adult themes.',
      'Enjoy high-energy entertainment packed with genuine laughter, vibrant staging, and delightful romantic comedy storylines.'
    ],
    relatedTags: ['Parody', 'Variety', 'Playful', 'Romantic Comedy', 'Amateur']
  },
  'romance': {
    title: 'Romantic JAV & Intimate Couple Storylines',
    paragraphs: [
      'Immerse yourself in heartfelt romantic JAV releases centered on mutual affection, gentle passion, and authentic emotional connection. This curated selection highlights respectful, tender dynamics and cinematic intimacy.',
      'Carefully crafted with soft aesthetic lighting, delicate musical scores, and genuine romantic chemistry, these titles offer a refreshing alternative emphasizing beauty and emotional depth.',
      'Browse beloved romance series, renowned couple storylines, and tender encounters from top-tier Japanese production studios.'
    ],
    relatedTags: ['Drama', 'Couples', 'Pure', 'Dating', 'Sweet']
  },
  'beautiful-mature-woman': {
    title: 'Mature Woman & Experienced Performers Hub',
    paragraphs: [
      'Appreciate the elegance, poise, and refined screen presence of Japan\'s most celebrated mature actresses. The Mature Woman genre remains one of the most enduring and prestigious categories in Japanese adult cinema.',
      'Featuring distinguished veteran performers renowned for their sophisticated acting, emotional depth, and charismatic screen presence, these films focus on mature relationship dramas, family sagas, and dignified romances.',
      'Stream iconic releases from renowned specialized labels celebrated for exceptional artistic standards and mature storytelling.'
    ],
    relatedTags: ['Married Woman', 'Housewife', 'Elegance', 'Drama', 'Widow']
  },
  'amateur': {
    title: 'Amateur & Debut Showcase Collection',
    paragraphs: [
      'Explore the authentic and unscripted world of Japanese amateur releases. Characterized by realistic documentary-style camerawork, spontaneous interactions, and genuine reactions, this category delivers unvarnished natural charm.',
      'Titles feature fresh debutants, personal interviews, and unpretentious settings that capture the genuine personalities and spontaneous moments of performers from across Japan.',
      'Enjoy unfiltered authenticity, natural dialogue, and fresh debut experiences streamed in high definition.'
    ],
    relatedTags: ['Debut', 'Documentary', 'Interview', 'Natural', 'Real Life']
  },
  'cosplay': {
    title: 'Cosplay & Themed Costume Fantasies',
    paragraphs: [
      'Step into the vibrant crossover between Japanese pop culture, anime aesthetics, and premium adult entertainment. The cosplay genre celebrates creative costuming, iconic character homages, and imaginative visual styling.',
      'Featuring meticulously tailored outfits—from futuristic heroines and gothic maids to fantasy warriors—these productions unite passionate fandom styling with high-end theatrical production values.',
      'Explore artistic role-play, elaborate fantasy sets, and stunning character tributes brought to life by top Japanese models.'
    ],
    relatedTags: ['Anime', 'Costume', 'Maid', 'Fantasy', 'Uniform']
  },
  's1': {
    title: 'S1 No.1 Style Official Studio Archive',
    paragraphs: [
      'S1 No.1 Style stands as the undisputed pinnacle of the modern Japanese adult video industry. Founded with a commitment to unmatched cinematic standards, S1 produces ultra-high-budget releases starring the industry\'s most exclusive super-idols.',
      'Renowned for cutting-edge 4K cinematography, lavish location filming, and visionary artistic direction, every S1 title represents state-of-the-art Japanese commercial production quality.',
      'Watch exclusive full-length master releases from legendary S1 contract superstars in uncompromised high definition.'
    ],
    relatedTags: ['Exclusive', '4K', 'Top Idols', 'High Budget', 'Superstar']
  },
  'moodyz': {
    title: 'MOODYZ Legendary Studio Collection',
    paragraphs: [
      'Founded in 2000, MOODYZ is an iconic powerhouse that has shaped modern JAV culture for over two decades. Celebrated for pioneering diverse cinematic concepts, blockbuster debuts, and energetic pacing, MOODYZ remains a fan-favorite worldwide.',
      'From gripping story epics and superstar ensemble projects to boundary-pushing thematic experiments, MOODYZ consistently delivers electrifying performances and top-tier entertainment value.',
      'Explore thousands of acclaimed releases from Japan\'s most prolific and versatile entertainment house.'
    ],
    relatedTags: ['Blockbuster', 'Debuts', 'Diverse', 'Ensemble', 'Classic']
  },
  'sod-create': {
    title: 'Soft On Demand (SOD Create) Innovation Hub',
    paragraphs: [
      'Soft On Demand (SOD Create) is internationally celebrated as the industry\'s most bold and imaginative concept laboratory. Famous for groundbreaking variety concepts, interactive experiments, and documentary realism, SOD constantly redefines viewer expectations.',
      'With legendary production values, unique social experiments, and boundary-pushing creative direction, SOD titles deliver memorable entertainment that goes far beyond conventional adult filmmaking.',
      'Discover daring conceptual projects, viral sensations, and inventive variety releases on MISSAV-J.'
    ],
    relatedTags: ['Concept Planning', 'Variety', 'Documentary', 'Creative', 'Viral']
  },
  'idea-pocket': {
    title: 'Idea Pocket Aesthetic Cinema Archive',
    paragraphs: [
      'Idea Pocket has long been recognized as the gold standard for romantic aesthetics, artistic lighting, and elegant cinematography. The studio is dedicated to presenting Japan\'s most radiant actresses in visual perfection.',
      'With lush color grading, tender dramatic scenarios, and meticulous visual composition, Idea Pocket films emphasize romance, visual poetry, and breathtaking performer elegance.',
      'Experience the pinnacle of artistic and aesthetic adult cinematography from Idea Pocket.'
    ],
    relatedTags: ['Aesthetic', 'Romance', 'Elegance', 'Cinematography', 'Poetic']
  },
  'prestige': {
    title: 'Prestige Studio Showcase',
    paragraphs: [
      'Prestige is a dynamic, style-forward Japanese production powerhouse known for discoverers of top talent, chic urban aesthetics, and polished commercial presentation across dozens of celebrated themed sub-labels.',
      'Combining high-gloss production design with sharp contemporary storytelling, Prestige releases consistently rank among the most viewed and critically praised titles in Japan.',
      'Stream celebrated series, trendsetting debuts, and top-charting titles from the Prestige studio archive.'
    ],
    relatedTags: ['Urban Style', 'High Gloss', 'Trending', 'Model Discovery', 'Series']
  }
};

const HUB_KEY_ALIASES = {
  's1-no-1-style': 's1',
  'moody-s': 'moodyz',
  'sod': 'sod-create',
  'soft-on-demand': 'sod-create',
  'ideapocket': 'idea-pocket'
};

function getHubGuideHtml(nameParam, activeLang) {
  if (!nameParam) return '';
  const rawKey = String(nameParam).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const key = HUB_KEY_ALIASES[rawKey] || rawKey;
  const guide = HUB_DESCRIPTIONS[key];
  if (!guide) return '';

  const paragraphsHtml = guide.paragraphs.map(p => `<p style="margin: 8px 0; line-height: 1.6; color: #ccc;">${escapeHtml(p)}</p>`).join('');
  const tagsHtml = guide.relatedTags.map(t => {
    const canonicalTag = resolveCategoryAlias(t);
    if (isIndexableTaxonomyTerm('category', canonicalTag, activeLang)) {
      return `<a href="/${activeLang}/category?name=${encodeURIComponent(canonicalTag)}" style="display: inline-block; margin: 3px 6px; padding: 4px 10px; background: #222; color: #e50914; border-radius: 4px; font-size: 0.85rem; text-decoration: none;">${escapeHtml(canonicalTag)}</a>`;
    }
    return `<span style="display: inline-block; margin: 3px 6px; padding: 4px 10px; background: #1c1c1c; color: #bbb; border-radius: 4px; font-size: 0.85rem;">${escapeHtml(t)}</span>`;
  }).join('');

  return `
    <section class="hub-editorial-guide" style="margin: 20px 0; padding: 18px; background: rgba(255, 255, 255, 0.03); border-left: 4px solid #e50914; border-radius: 6px;">
      <h2 style="font-size: 1.15rem; margin-top: 0; color: #fff;">${escapeHtml(guide.title)}</h2>
      ${paragraphsHtml}
      <div style="margin-top: 12px; font-size: 0.9rem;">
        <strong style="color: #fff;">Related Genres & Labels:</strong>
        ${tagsHtml}
      </div>
    </section>
  `;
}

function getCleanListingCanonical(origin, lang, type, nameParam) {
  if (!type || type === 'home') {
    return `${origin}/${lang}/`;
  }
  if (['category', 'tag'].includes(type)) {
    return nameParam
      ? `${origin}/${lang}/${type}?name=${encodeURIComponent(nameParam)}`
      : `${origin}/${lang}/categories`;
  }
  if (type === 'actor') {
    return nameParam
      ? `${origin}/${lang}/actor?name=${encodeURIComponent(nameParam)}`
      : `${origin}/${lang}/actors`;
  }
  if (type === 'studio') {
    return nameParam
      ? `${origin}/${lang}/studio?name=${encodeURIComponent(nameParam)}`
      : `${origin}/${lang}/studios`;
  }
  return `${origin}/${lang}/${type}`;
}

function cleanSearchForHreflang(search) {
  if (!search) return '';
  const params = new URLSearchParams(search);
  const name = params.get('name');
  if (name) {
    return `?name=${encodeURIComponent(name)}`;
  }
  return '';
}

function generateHreflangTags(urlOrigin, urlPathname, urlSearch, allowedLangs = VALID_LANGS) {
  if (!Array.isArray(allowedLangs) || allowedLangs.length === 0) {
    return '';
  }
  let cleanPath = urlPathname.replace(LANG_STRIP_REGEX, '');
  if (cleanPath === '' || cleanPath === '/') {
    cleanPath = '/';
  } else {
    cleanPath = cleanPath.replace(/\/+$/, '');
  }
  
  const cleanSearch = cleanSearchForHreflang(urlSearch);
  const targetLangs = allowedLangs.filter(lang => VALID_LANGS.includes(lang));
  if (targetLangs.length === 0) return '';
  
  const tags = targetLangs.map(lang => {
    const code = hreflangCode(lang);
    const path = cleanPath === '/' ? `/${lang}/` : `/${lang}${cleanPath}`;
    return `<link rel="alternate" hreflang="${code}" href="${escapeHtml(urlOrigin + path + cleanSearch)}" />`;
  });
  
  const xDefaultPath = cleanPath === '/' ? '/en/' : `/en${cleanPath}`;
  tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(urlOrigin + xDefaultPath + cleanSearch)}" />`);
  return tags.join('\n  ');
}

const UI_SSR_LABELS = {
  en: { home: 'Home', trending: 'Trending', recent: 'Recent', actresses: 'Actresses', categories: 'Categories', studios: 'Studios', studioLbl: 'Studio:', actressesLbl: 'Actresses:', categoriesLbl: 'Categories:', detailsHeading: 'Release Overview & Details', faqHeading: 'Frequently Asked Questions', relatedHeading: 'Related Videos', catalogOverviewHeading: 'Catalog Overview', nativeNameLbl: 'Native Name:', genresLbl: 'Genres:', releaseCodesLbl: 'Recent Release Codes:', totalVideosLbl: 'Indexed Videos:', codeLbl: 'Release Code:', durationLbl: 'Duration:', dateLbl: 'Release Date:' },
  id: { home: 'Beranda', trending: 'Populer', recent: 'Terbaru', actresses: 'Aktris', categories: 'Kategori', studios: 'Studio', studioLbl: 'Studio:', actressesLbl: 'Aktris:', categoriesLbl: 'Kategori:', detailsHeading: 'Ringkasan & Detail Rilis', faqHeading: 'Pertanyaan Umum', relatedHeading: 'Video Terkait', catalogOverviewHeading: 'Ringkasan Katalog', nativeNameLbl: 'Nama Asli:', genresLbl: 'Genre:', releaseCodesLbl: 'Kode Rilis Terbaru:', totalVideosLbl: 'Jumlah Video:', codeLbl: 'Kode Rilis:', durationLbl: 'Durasi:', dateLbl: 'Tanggal Rilis:' },
  'zh-TW': { home: '首頁', trending: '熱門排行', recent: '最新發佈', actresses: '女優', categories: '分類', studios: '片商', studioLbl: '片商：', actressesLbl: '演員 / 女優：', categoriesLbl: '分類：', detailsHeading: '作品資訊與簡介', faqHeading: '常見問題', relatedHeading: '相關影片', catalogOverviewHeading: '目錄總覽', nativeNameLbl: '原名：', genresLbl: '類型：', releaseCodesLbl: '最新番號：', totalVideosLbl: '收錄影片數：', codeLbl: '番號：', durationLbl: '片長：', dateLbl: '發行日期：' },
  'zh-CN': { home: '首页', trending: '热门排行', recent: '最新发布', actresses: '女优', categories: '分类', studios: '片商', studioLbl: '片商：', actressesLbl: '演员 / 女优：', categoriesLbl: '分类：', detailsHeading: '作品信息与简介', faqHeading: '常见问题', relatedHeading: '相关视频', catalogOverviewHeading: '目录总览', nativeNameLbl: '原名：', genresLbl: '类型：', releaseCodesLbl: '最新番号：', totalVideosLbl: '收录视频数：', codeLbl: '番号：', durationLbl: '时长：', dateLbl: '发行日期：' },
  ja: { home: 'ホーム', trending: '急上昇', recent: '新着', actresses: '女優', categories: 'カテゴリー', studios: 'メーカー', studioLbl: 'メーカー：', actressesLbl: '出演女優：', categoriesLbl: 'カテゴリー：', detailsHeading: '作品概要・詳細', faqHeading: 'よくある質問', relatedHeading: '関連動画', catalogOverviewHeading: 'カタログ概要', nativeNameLbl: '別名・表記：', genresLbl: 'ジャンル：', releaseCodesLbl: '最新品番：', totalVideosLbl: '収録本数：', codeLbl: '品番：', durationLbl: '収録時間：', dateLbl: '配信日：' },
  ko: { home: '홈', trending: '인기', recent: '최신', actresses: '배우', categories: '카테고리', studios: '스튜디오', studioLbl: '스튜디오:', actressesLbl: '출연 배우:', categoriesLbl: '카테고리:', detailsHeading: '작품 개요 및 정보', faqHeading: '자주 묻는 질문', relatedHeading: '관련 동영상', catalogOverviewHeading: '카탈로그 개요', nativeNameLbl: '원어 이름:', genresLbl: '장르:', releaseCodesLbl: '최신 품번:', totalVideosLbl: '등록 영상 수:', codeLbl: '품번:', durationLbl: '재생 시간:', dateLbl: '공개일:' },
  ms: { home: 'Utama', trending: 'Popular', recent: 'Terkini', actresses: 'Pelakon', categories: 'Kategori', studios: 'Studio', studioLbl: 'Studio:', actressesLbl: 'Pelakon:', categoriesLbl: 'Kategori:', detailsHeading: 'Ringkasan & Butiran Terbitan', faqHeading: 'Soalan Lazim', relatedHeading: 'Video Berkaitan', catalogOverviewHeading: 'Ringkasan Katalog', nativeNameLbl: 'Nama Asal:', genresLbl: 'Genre:', releaseCodesLbl: 'Kod Terbitan Terkini:', totalVideosLbl: 'Jumlah Video:', codeLbl: 'Kod:', durationLbl: 'Tempoh:', dateLbl: 'Tarikh Terbit:' },
  th: { home: 'หน้าแรก', trending: 'ยอดนิยม', recent: 'ล่าสุด', actresses: 'นักแสดงหญิง', categories: 'หมวดหมู่', studios: 'สตูดิโอ', studioLbl: 'สตูดิโอ:', actressesLbl: 'นักแสดง:', categoriesLbl: 'หมวดหมู่:', detailsHeading: 'ภาพรวมและรายละเอียดผลงาน', faqHeading: 'คำถามที่พบบ่อย', relatedHeading: 'วิดีโอที่เกี่ยวข้อง', catalogOverviewHeading: 'ภาพรวมแคตตาล็อก', nativeNameLbl: 'ชื่อดั้งเดิม:', genresLbl: 'แนว:', releaseCodesLbl: 'รหัสล่าสุด:', totalVideosLbl: 'จำนวนวิดีโอ:', codeLbl: 'รหัส:', durationLbl: 'ความยาว:', dateLbl: 'วันที่เผยแพร่:' },
  de: { home: 'Startseite', trending: 'Angesagt', recent: 'Neueste', actresses: 'Schauspielerinnen', categories: 'Kategorien', studios: 'Studios', studioLbl: 'Studio:', actressesLbl: 'Schauspielerinnen:', categoriesLbl: 'Kategorien:', detailsHeading: 'Release-Übersicht & Details', faqHeading: 'Häufig gestellte Fragen', relatedHeading: 'Ähnliche Videos', catalogOverviewHeading: 'Katalog-Übersicht', nativeNameLbl: 'Originalname:', genresLbl: 'Genres:', releaseCodesLbl: 'Aktuelle Codes:', totalVideosLbl: 'Indexierte Videos:', codeLbl: 'Code:', durationLbl: 'Laufzeit:', dateLbl: 'Veröffentlichungsdatum:' },
  fr: { home: 'Accueil', trending: 'Tendances', recent: 'Récents', actresses: 'Actrices', categories: 'Catégories', studios: 'Studios', studioLbl: 'Studio :', actressesLbl: 'Actrices :', categoriesLbl: 'Catégories :', detailsHeading: 'Présentation et détails', faqHeading: 'Questions fréquentes', relatedHeading: 'Vidéos similaires', catalogOverviewHeading: 'Aperçu du catalogue', nativeNameLbl: 'Nom original :', genresLbl: 'Genres :', releaseCodesLbl: 'Codes récents :', totalVideosLbl: 'Vidéos indexées :', codeLbl: 'Code :', durationLbl: 'Durée :', dateLbl: 'Date de sortie :' },
  vi: { home: 'Trang chủ', trending: 'Thịnh hành', recent: 'Mới nhất', actresses: 'Diễn viên', categories: 'Danh mục', studios: 'Studio', studioLbl: 'Studio:', actressesLbl: 'Diễn viên:', categoriesLbl: 'Danh mục:', detailsHeading: 'Tổng quan & Chi tiết phát hành', faqHeading: 'Câu hỏi thường gặp', relatedHeading: 'Video liên quan', catalogOverviewHeading: 'Tổng quan danh mục', nativeNameLbl: 'Tên gốc:', genresLbl: 'Thể loại:', releaseCodesLbl: 'Mã phát hành mới:', totalVideosLbl: 'Số lượng video:', codeLbl: 'Mã phim:', durationLbl: 'Thời lượng:', dateLbl: 'Ngày phát hành:' },
  fil: { home: 'Tahanan', trending: 'Trending', recent: 'Kamakailan', actresses: 'Mga Aktris', categories: 'Mga Kategorya', studios: 'Mga Studio', studioLbl: 'Studio:', actressesLbl: 'Mga Aktris:', categoriesLbl: 'Mga Kategorya:', detailsHeading: 'Buod at Detalye ng Release', faqHeading: 'Mga Madalas Itanong', relatedHeading: 'Mga Kaugnay na Video', catalogOverviewHeading: 'Buod ng Katalogo', nativeNameLbl: 'Orihinal na Pangalan:', genresLbl: 'Mga Genre:', releaseCodesLbl: 'Mga Kamakailang Code:', totalVideosLbl: 'Bilang ng Video:', codeLbl: 'Release Code:', durationLbl: 'Tagal:', dateLbl: 'Petsa ng Release:' },
  pt: { home: 'Início', trending: 'Em alta', recent: 'Recentes', actresses: 'Atrizes', categories: 'Categorias', studios: 'Estúdios', studioLbl: 'Estúdio:', actressesLbl: 'Atrizes:', categoriesLbl: 'Categorias:', detailsHeading: 'Visão Geral e Detalhes', faqHeading: 'Perguntas Frequentes', relatedHeading: 'Vídeos Relacionados', catalogOverviewHeading: 'Visão Geral do Catálogo', nativeNameLbl: 'Nome Original:', genresLbl: 'Gêneros:', releaseCodesLbl: 'Códigos Recentes:', totalVideosLbl: 'Vídeos Indexados:', codeLbl: 'Código:', durationLbl: 'Duração:', dateLbl: 'Data de Lançamento:' }
};

function isIndexableTaxonomyTerm(type, name, lang = 'en') {
  const clean = decodeBasicEntities(name);
  if (!clean) return false;
  if (type === 'studio') {
    const resolved = resolveStudioAlias(clean);
    return Boolean(resolved && resolved !== 'Other');
  }
  if (type === 'actor') {
    if (isSpamActorName(clean)) return false;
    return CURATED_ACTORS_SET.size === 0 || CURATED_ACTORS_SET.has(clean.toLowerCase());
  }
  if (type === 'category' || type === 'tag') {
    const resolved = resolveCategoryAlias(clean);
    if (!resolved) return false;
    if (lang !== 'en' && ENGLISH_SPECIFIC_CATEGORIES.has(resolved.toLowerCase())) return false;
    return CURATED_CATEGORIES_SET.size === 0 || CURATED_CATEGORIES_SET.has(resolved.toLowerCase());
  }
  return true;
}

function formatReadableReleaseDate(dateStr) {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

const WATCH_FACTS_I18N = {
  en: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} is indexed in the MISSAV-J catalog with direct embedded playback and structured metadata.`,
    editionLbl: 'Edition:',
    studioCredit: s => `Studio credit: ${s}.`,
    performers: a => `Featured performers: ${a}.`,
    categories: c => `Listed categories: ${c}.`,
    runtime: d => `Catalog runtime is ${d}.`,
    releaseDate: dt => `Release date recorded on ${dt}.`,
    qId: item => `What is the catalog identification for ${item}?`,
    aIdCode: (code, dt, d, ed) => `This entry is cataloged under release code ${code}${ed ? ` (${ed})` : ''}${dt ? ` (recorded ${dt})` : ''}${d ? ` with a listed runtime of ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `This entry is titled "${title}"${ed ? ` (${ed})` : ''} on MISSAV-J${dt ? ` (recorded ${dt})` : ''}${d ? ` with a listed runtime of ${d}` : ''}.`,
    qMeta: item => `Which studio, performers, or categories are tagged on ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Performers: ${a}`,
    metaCategories: c => `Categories: ${c}`,
    metaEdition: e => `Edition: ${e}`,
    qBrowse: item => `How can I watch and browse more releases related to ${item}?`,
    aBrowse: item => `You can stream ${item} directly in the HTML5 player on this page or browse the Trending and Recent MISSAV-J directories for additional titles.`
  },
  id: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} terdaftar dalam katalog MISSAV-J dengan pemutar video tersemat langsung dan metadata terstruktur.`,
    editionLbl: 'Edisi:',
    studioCredit: s => `Studio produksi: ${s}.`,
    performers: a => `Aktris utama: ${a}.`,
    categories: c => `Kategori terdaftar: ${c}.`,
    runtime: d => `Durasi video tercatat ${d}.`,
    releaseDate: dt => `Tanggal rilis tercatat pada ${dt}.`,
    qId: item => `Apa kode identifikasi katalog untuk ${item}?`,
    aIdCode: (code, dt, d, ed) => `Video ini terdaftar dengan kode rilis ${code}${ed ? ` (edisi ${ed})` : ''}${dt ? ` (dirilis ${dt})` : ''}${d ? ` dengan durasi ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Entri ini berjudul "${title}"${ed ? ` (edisi ${ed})` : ''} di MISSAV-J${dt ? ` (dirilis ${dt})` : ''}${d ? ` dengan durasi ${d}` : ''}.`,
    qMeta: item => `Studio, pemeran, dan kategori apa saja yang terhubung pada ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Pemeran: ${a}`,
    metaCategories: c => `Kategori: ${c}`,
    metaEdition: e => `Edisi: ${e}`,
    qBrowse: item => `Bagaimana cara menonton dan menelusuri rilis lain yang terkait dengan ${item}?`,
    aBrowse: item => `Anda dapat memutar ${item} langsung di pemutar HTML5 pada halaman ini atau menelusuri direktori Populer dan Terbaru di MISSAV-J.`
  },
  'zh-TW': {
    intro: (item, ed) => `${item}${ed ? `（${ed}）` : ''}已收錄於 MISSAV-J 目錄，提供直接內嵌播放與完整結構化資訊。`,
    editionLbl: '版本：',
    studioCredit: s => `發行片商：${s}。`,
    performers: a => `出演女優：${a}。`,
    categories: c => `收錄分類：${c}。`,
    runtime: d => `影片片長為 ${d}。`,
    releaseDate: dt => `發行日期為 ${dt}。`,
    qId: item => `${item} 的目錄番號資訊為何？`,
    aIdCode: (code, dt, d, ed) => `本片於目錄中的番號為 ${code}${ed ? `（${ed}）` : ''}${dt ? `，發行於 ${dt}` : ''}${d ? `，片長 ${d}` : ''}。`,
    aIdTitle: (title, dt, d, ed) => `本片標題為「${title}」${ed ? `（${ed}）` : ''}${dt ? `，收錄日期 ${dt}` : ''}${d ? `，片長 ${d}` : ''}。`,
    qMeta: item => `${item} 標記了哪些片商、女優或分類？`,
    metaStudio: s => `片商：${s}`,
    metaActors: a => `女優：${a}`,
    metaCategories: c => `分類：${c}`,
    metaEdition: e => `版本：${e}`,
    qBrowse: item => `如何觀看與瀏覽更多與 ${item} 相關的作品？`,
    aBrowse: item => `您可在本頁直接使用 HTML5 播放器觀看 ${item}，或前往 MISSAV-J 的熱門排行與最新發佈目錄瀏覽更多作品。`
  },
  'zh-CN': {
    intro: (item, ed) => `${item}${ed ? `（${ed}）` : ''}已收录于 MISSAV-J 目录，提供直接内嵌播放与完整结构化信息。`,
    editionLbl: '版本：',
    studioCredit: s => `发行片商：${s}。`,
    performers: a => `出演女优：${a}。`,
    categories: c => `收录分类：${c}。`,
    runtime: d => `视频时长为 ${d}。`,
    releaseDate: dt => `发行日期为 ${dt}。`,
    qId: item => `${item} 的目录番号信息是什么？`,
    aIdCode: (code, dt, d, ed) => `本片目录番号为 ${code}${ed ? `（${ed}）` : ''}${dt ? `，发行于 ${dt}` : ''}${d ? `，时长 ${d}` : ''}。`,
    aIdTitle: (title, dt, d, ed) => `本片标题为“${title}”${ed ? `（${ed}）` : ''}${dt ? `，收录日期 ${dt}` : ''}${d ? `，时长 ${d}` : ''}。`,
    qMeta: item => `${item} 标记了哪些片商、女优或分类？`,
    metaStudio: s => `片商：${s}`,
    metaActors: a => `女优：${a}`,
    metaCategories: c => `分类：${c}`,
    metaEdition: e => `版本：${e}`,
    qBrowse: item => `如何观看和浏览更多与 ${item} 相关的作品？`,
    aBrowse: item => `您可以在本页直接使用 HTML5 播放器观看 ${item}，或浏览 MISSAV-J 的热门排行和最新发布目录。`
  },
  ja: {
    intro: (item, ed) => `${item}${ed ? `（${ed}）` : ''}は MISSAV-J カタログに登録されており、HTML5 プレーヤーでの直接再生と作品情報に対応しています。`,
    editionLbl: 'エディション：',
    studioCredit: s => `制作メーカー：${s}。`,
    performers: a => `出演女優：${a}。`,
    categories: c => `登録ジャンル：${c}。`,
    runtime: d => `収録時間は ${d} です。`,
    releaseDate: dt => `配信日は ${dt} です。`,
    qId: item => `${item} の品番・カタログ識別情報は？`,
    aIdCode: (code, dt, d, ed) => `この作品の品番は ${code}${ed ? `（${ed}）` : ''} です${dt ? `（配信日: ${dt}）` : ''}${d ? `（収録時間: ${d}）` : ''}。`,
    aIdTitle: (title, dt, d, ed) => `作品タイトルは「${title}」${ed ? `（${ed}）` : ''} です${dt ? `（配信日: ${dt}）` : ''}${d ? `（収録時間: ${d}）` : ''}。`,
    qMeta: item => `${item} のメーカー・出演者・カテゴリー情報は？`,
    metaStudio: s => `メーカー：${s}`,
    metaActors: a => `出演：${a}`,
    metaCategories: c => `カテゴリー：${c}`,
    metaEdition: e => `バージョン：${e}`,
    qBrowse: item => `${item} の視聴方法と関連作品の探し方は？`,
    aBrowse: item => `このページの HTML5 プレーヤーで ${item} を再生できるほか、MISSAV-J の急上昇・新着一覧から関連作品を探せます。`
  },
  ko: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} 작품은 MISSAV-J 카탈로그에 등록되어 있으며 페이지 내 바로 재생 및 메타데이터를 제공합니다.`,
    editionLbl: '버전:',
    studioCredit: s => `제작 스튜디오: ${s}.`,
    performers: a => `출연 배우: ${a}.`,
    categories: c => `등록 카테고리: ${c}.`,
    runtime: d => `재생 시간은 ${d}입니다.`,
    releaseDate: dt => `공개일은 ${dt}입니다.`,
    qId: item => `${item}의 카탈로그 품번 정보는 무엇인가요?`,
    aIdCode: (code, dt, d, ed) => `이 작품은 품번 ${code}${ed ? ` (${ed})` : ''}${dt ? ` (${dt} 공개)` : ''}${d ? `, 재생 시간 ${d}` : ''}로 등록되어 있습니다.`,
    aIdTitle: (title, dt, d, ed) => `이 작품의 제목은 "${title}"${ed ? ` (${ed})` : ''}${dt ? ` (${dt} 공개)` : ''}${d ? `, 재생 시간 ${d}` : ''}입니다.`,
    qMeta: item => `${item}에 연결된 스튜디오, 배우 및 카테고리는 무엇인가요?`,
    metaStudio: s => `스튜디오: ${s}`,
    metaActors: a => `출연: ${a}`,
    metaCategories: c => `카테고리: ${c}`,
    metaEdition: e => `버전: ${e}`,
    qBrowse: item => `${item}을(를) 시청하고 관련 작품을 더 보려면 어떻게 하나요?`,
    aBrowse: item => `이 페이지의 HTML5 플레이어로 ${item}을(를) 바로 감상하거나 MISSAV-J 인기 및 최신 목록에서 더 많은 작품을 찾아볼 수 있습니다.`
  },
  ms: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} disenaraikan dalam katalog MISSAV-J dengan main balik terbenam terus dan metadata berstruktur.`,
    editionLbl: 'Edisi:',
    studioCredit: s => `Kredit studio: ${s}.`,
    performers: a => `Pelakon utama: ${a}.`,
    categories: c => `Kategori tersenarai: ${c}.`,
    runtime: d => `Tempoh katalog ialah ${d}.`,
    releaseDate: dt => `Tarikh terbitan direkodkan pada ${dt}.`,
    qId: item => `Apakah pengenalan katalog bagi ${item}?`,
    aIdCode: (code, dt, d, ed) => `Entri ini dikatalogkan di bawah kod terbitan ${code}${ed ? ` (${ed})` : ''}${dt ? ` (diterbitkan ${dt})` : ''}${d ? ` dengan tempoh ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Entri ini bertajuk "${title}"${ed ? ` (${ed})` : ''} di MISSAV-J${dt ? ` (diterbitkan ${dt})` : ''}${d ? ` dengan tempoh ${d}` : ''}.`,
    qMeta: item => `Apakah studio, pelakon, atau kategori yang ditag pada ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Pelakon: ${a}`,
    metaCategories: c => `Kategori: ${c}`,
    metaEdition: e => `Edisi: ${e}`,
    qBrowse: item => `Bagaimanakah cara menonton dan melayari terbitan lain berkaitan ${item}?`,
    aBrowse: item => `Anda boleh menstrim ${item} terus dalam pemain HTML5 di halaman ini atau melayari direktori Popular dan Terkini MISSAV-J.`
  },
  th: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} ได้รับการจัดทำดัชนีในแคตตาล็อก MISSAV-J พร้อมเครื่องเล่นในตัวและข้อมูลเมตาอย่างเป็นระบบ`,
    editionLbl: 'เวอร์ชัน:',
    studioCredit: s => `สตูดิโอผู้ผลิต: ${s}`,
    performers: a => `นักแสดงนำ: ${a}`,
    categories: c => `หมวดหมู่ที่ระบุ: ${c}`,
    runtime: d => `ความยาววิดีโอ ${d}`,
    releaseDate: dt => `วันที่เผยแพร่ ${dt}`,
    qId: item => `รหัสอ้างอิงในแคตตาล็อกของ ${item} คืออะไร?`,
    aIdCode: (code, dt, d, ed) => `ผลงานนี้บันทึกด้วยรหัส ${code}${ed ? ` (${ed})` : ''}${dt ? ` เผยแพร่เมื่อ ${dt}` : ''}${d ? ` ความยาว ${d}` : ''}`,
    aIdTitle: (title, dt, d, ed) => `ผลงานนี้มีชื่อว่า "${title}"${ed ? ` (${ed})` : ''} บน MISSAV-J${dt ? ` เผยแพร่เมื่อ ${dt}` : ''}${d ? ` ความยาว ${d}` : ''}`,
    qMeta: item => `${item} มีข้อมูลสตูดิโอ นักแสดง และหมวดหมู่อะไรบ้าง?`,
    metaStudio: s => `สตูดิโอ: ${s}`,
    metaActors: a => `นักแสดง: ${a}`,
    metaCategories: c => `หมวดหมู่: ${c}`,
    metaEdition: e => `เวอร์ชัน: ${e}`,
    qBrowse: item => `จะรับชมและค้นหาผลงานที่เกี่ยวข้องกับ ${item} เพิ่มเติมได้อย่างไร?`,
    aBrowse: item => `สามารถรับชม ${item} ผ่านเครื่องเล่น HTML5 บนหน้านี้ได้โดยตรง หรือเลือกดูต่อในหน้ายอดนิยมและล่าสุดของ MISSAV-J`
  },
  de: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} ist im MISSAV-J-Katalog mit direkter Player-Einbettung und strukturierten Metadaten erfasst.`,
    editionLbl: 'Ausgabe:',
    studioCredit: s => `Produktionsstudio: ${s}.`,
    performers: a => `Darstellerinnen: ${a}.`,
    categories: c => `Zugeordnete Kategorien: ${c}.`,
    runtime: d => `Kataloglaufzeit: ${d}.`,
    releaseDate: dt => `Veröffentlichungsdatum: ${dt}.`,
    qId: item => `Wie lautet die Katalogkennung für ${item}?`,
    aIdCode: (code, dt, d, ed) => `Dieser Eintrag ist unter dem Code ${code}${ed ? ` (${ed})` : ''}${dt ? ` (Veröffentlichung ${dt})` : ''}${d ? ` mit einer Laufzeit von ${d}` : ''} gelistet.`,
    aIdTitle: (title, dt, d, ed) => `Dieser Titel heißt „${title}“${ed ? ` (${ed})` : ''} auf MISSAV-J${dt ? ` (${dt})` : ''}${d ? `, Laufzeit ${d}` : ''}.`,
    qMeta: item => `Welches Studio, welche Darstellerinnen und Kategorien gehören zu ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Darstellerinnen: ${a}`,
    metaCategories: c => `Kategorien: ${c}`,
    metaEdition: e => `Ausgabe: ${e}`,
    qBrowse: item => `Wie kann ich ${item} ansehen und ähnliche Titel entdecken?`,
    aBrowse: item => `Sie können ${item} direkt im HTML5-Player auf dieser Seite abspielen oder in den Verzeichnissen Angesagt und Neueste auf MISSAV-J weiterstöbern.`
  },
  fr: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} est indexé dans le catalogue MISSAV-J avec lecteur intégré direct et métadonnées structurées.`,
    editionLbl: 'Édition :',
    studioCredit: s => `Studio de production : ${s}.`,
    performers: a => `Distribution : ${a}.`,
    categories: c => `Catégories associées : ${c}.`,
    runtime: d => `Durée répertoriée : ${d}.`,
    releaseDate: dt => `Date de sortie enregistrée le ${dt}.`,
    qId: item => `Quel est l'identifiant catalogue de ${item} ?`,
    aIdCode: (code, dt, d, ed) => `Ce titre est répertorié sous le code ${code}${ed ? ` (${ed})` : ''}${dt ? ` (sortie le ${dt})` : ''}${d ? ` pour une durée de ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Cette fiche s'intitule « ${title} »${ed ? ` (${ed})` : ''} sur MISSAV-J${dt ? ` (sortie le ${dt})` : ''}${d ? ` (${d})` : ''}.`,
    qMeta: item => `Quels studio, actrices et catégories sont associés à ${item} ?`,
    metaStudio: s => `Studio : ${s}`,
    metaActors: a => `Actrices : ${a}`,
    metaCategories: c => `Catégories : ${c}`,
    metaEdition: e => `Édition : ${e}`,
    qBrowse: item => `Comment regarder ${item} et trouver d'autres sorties similaires ?`,
    aBrowse: item => `Vous pouvez visionner ${item} directement dans le lecteur HTML5 de cette page ou parcourir les sections Tendances et Récents de MISSAV-J.`
  },
  vi: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} được lập chỉ mục trong danh mục MISSAV-J với trình phát nhúng trực tiếp và siêu dữ liệu đầy đủ.`,
    editionLbl: 'Phiên bản:',
    studioCredit: s => `Hãng sản xuất: ${s}.`,
    performers: a => `Diễn viên tham gia: ${a}.`,
    categories: c => `Danh mục liên quan: ${c}.`,
    runtime: d => `Thời lượng ghi nhận là ${d}.`,
    releaseDate: dt => `Ngày phát hành ghi nhận vào ${dt}.`,
    qId: item => `Mã định danh danh mục cho ${item} là gì?`,
    aIdCode: (code, dt, d, ed) => `Video này được lập chỉ mục với mã phát hành ${code}${ed ? ` (bản ${ed})` : ''}${dt ? ` (phát hành ${dt})` : ''}${d ? ` với thời lượng ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Mục này có tiêu đề "${title}"${ed ? ` (bản ${ed})` : ''} trên MISSAV-J${dt ? ` (phát hành ${dt})` : ''}${d ? ` với thời lượng ${d}` : ''}.`,
    qMeta: item => `Hãng sản xuất, diễn viên và danh mục nào gắn với ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Diễn viên: ${a}`,
    metaCategories: c => `Danh mục: ${c}`,
    metaEdition: e => `Phiên bản: ${e}`,
    qBrowse: item => `Làm thế nào để xem và khám phá thêm video liên quan đến ${item}?`,
    aBrowse: item => `Bạn có thể phát ${item} trực tiếp trên trình phát HTML5 tại trang này hoặc duyệt các mục Thịnh hành và Mới nhất của MISSAV-J.`
  },
  fil: {
    intro: (item, ed) => `Ang ${item}${ed ? ` (${ed})` : ''} ay naka-index sa katalogo ng MISSAV-J na may direktang HTML5 player at kumpletong metadata.`,
    editionLbl: 'Edisyon:',
    studioCredit: s => `Studio: ${s}.`,
    performers: a => `Mga tampok na aktres: ${a}.`,
    categories: c => `Mga nakalistang kategorya: ${c}.`,
    runtime: d => `Tagal ng video: ${d}.`,
    releaseDate: dt => `Petsa ng release: ${dt}.`,
    qId: item => `Ano ang impormasyon ng katalogo para sa ${item}?`,
    aIdCode: (code, dt, d, ed) => `Nakatala ito sa release code na ${code}${ed ? ` (${ed})` : ''}${dt ? ` (petsa ${dt})` : ''}${d ? ` na may habang ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Pinamagatang "${title}"${ed ? ` (${ed})` : ''} sa MISSAV-J${dt ? ` (petsa ${dt})` : ''}${d ? ` na may habang ${d}` : ''}.`,
    qMeta: item => `Anong studio, aktres, o kategorya ang naka-tag sa ${item}?`,
    metaStudio: s => `Studio: ${s}`,
    metaActors: a => `Mga Aktris: ${a}`,
    metaCategories: c => `Mga Kategorya: ${c}`,
    metaEdition: e => `Edisyon: ${e}`,
    qBrowse: item => `Paano mapapanood at makakahanap ng iba pang video kaugnay ng ${item}?`,
    aBrowse: item => `Maaari mong panoorin ang ${item} nang direkta sa HTML5 player sa pahinang ito o mag-browse sa Trending at Kamakailan ng MISSAV-J.`
  },
  pt: {
    intro: (item, ed) => `${item}${ed ? ` (${ed})` : ''} está indexado no catálogo MISSAV-J com reprodutor incorporado direto e metadados estruturados.`,
    editionLbl: 'Edição:',
    studioCredit: s => `Estúdio produtor: ${s}.`,
    performers: a => `Elenco principal: ${a}.`,
    categories: c => `Categorias listadas: ${c}.`,
    runtime: d => `Duração registrada: ${d}.`,
    releaseDate: dt => `Data de lançamento em ${dt}.`,
    qId: item => `Qual é a identificação de catálogo para ${item}?`,
    aIdCode: (code, dt, d, ed) => `Este título está catalogado sob o código ${code}${ed ? ` (${ed})` : ''}${dt ? ` (lançado em ${dt})` : ''}${d ? ` com duração de ${d}` : ''}.`,
    aIdTitle: (title, dt, d, ed) => `Este título chama-se "${title}"${ed ? ` (${ed})` : ''} no MISSAV-J${dt ? ` (lançado em ${dt})` : ''}${d ? ` com duração de ${d}` : ''}.`,
    qMeta: item => `Quais estúdio, atrizes e categorias estão vinculados a ${item}?`,
    metaStudio: s => `Estúdio: ${s}`,
    metaActors: a => `Atrizes: ${a}`,
    metaCategories: c => `Categorias: ${c}`,
    metaEdition: e => `Edição: ${e}`,
    qBrowse: item => `Como assistir e navegar por mais lançamentos relacionados a ${item}?`,
    aBrowse: item => `Você pode reproduzir ${item} diretamente no player HTML5 desta página ou explorar os diretórios Em alta e Recentes do MISSAV-J.`
  }
};

function buildWatchFallbackFacts(post, { title, displayCode, baseCode, editionLabel, actorsStr, studioStr, genreList, isoDuration, uiLabels, activeLang = 'en' }) {
  const tFacts = WATCH_FACTS_I18N[activeLang] || WATCH_FACTS_I18N.en;
  const codeOrTitle = displayCode || title;
  const effectiveCode = baseCode || post?.code || '';
  const specRows = [];
  if (effectiveCode) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.codeLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(effectiveCode)}</dd>`);
  }
  if (editionLabel) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(tFacts.editionLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(editionLabel)}</dd>`);
  }
  if (studioStr) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.studioLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(studioStr)}</dd>`);
  }
  if (actorsStr) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.actressesLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(actorsStr)}</dd>`);
  }
  if (genreList.length > 0) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.categoriesLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(genreList.join(', '))}</dd>`);
  }
  if (isoDuration && post?.duration) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.durationLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(String(post.duration))}</dd>`);
  }
  const readableDate = formatReadableReleaseDate(post?.date);
  if (readableDate) {
    specRows.push(`<dt style="font-weight: 600; color: #fff; margin-top: 6px;">${escapeHtml(uiLabels.dateLbl)}</dt><dd style="margin: 2px 0 6px 12px; color: #ccc;">${escapeHtml(readableDate)}</dd>`);
  }

  const summaryParts = [tFacts.intro(codeOrTitle, editionLabel)];
  if (studioStr) summaryParts.push(tFacts.studioCredit(studioStr));
  if (actorsStr) summaryParts.push(tFacts.performers(actorsStr));
  if (genreList.length > 0) summaryParts.push(tFacts.categories(genreList.join(', ')));
  const durationVal = (isoDuration && post?.duration) ? String(post.duration) : '';
  if (durationVal) summaryParts.push(tFacts.runtime(durationVal));
  if (readableDate) summaryParts.push(tFacts.releaseDate(readableDate));

  const faqList = [
    {
      q: tFacts.qId(codeOrTitle),
      a: effectiveCode
        ? tFacts.aIdCode(effectiveCode, readableDate, durationVal, editionLabel)
        : tFacts.aIdTitle(title, readableDate, durationVal, editionLabel)
    },
    (studioStr || actorsStr || genreList.length > 0 || editionLabel)
      ? {
          q: tFacts.qMeta(codeOrTitle),
          a: [
            editionLabel ? tFacts.metaEdition(editionLabel) : '',
            studioStr ? tFacts.metaStudio(studioStr) : '',
            actorsStr ? tFacts.metaActors(actorsStr) : '',
            genreList.length > 0 ? tFacts.metaCategories(genreList.join(', ')) : ''
          ].filter(Boolean).join('; ') + '.'
        }
      : {
          q: tFacts.qBrowse(codeOrTitle),
          a: tFacts.aBrowse(codeOrTitle)
        }
  ];

  const faqHtml = faqList
    .map(f => `<dt style="font-weight: 600; color: #fff; margin-top: 8px;">${escapeHtml(f.q)}</dt><dd style="margin: 4px 0 8px 12px; color: #ccc;">${escapeHtml(f.a)}</dd>`)
    .join('');

  const html = `
    <section class="video-release-details" style="margin: 20px 0; padding: 18px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
      <h2 style="font-size: 1.15rem; color: #fff;">${escapeHtml(uiLabels.detailsHeading)}</h2>
      <p style="line-height: 1.6; color: #ddd;">${escapeHtml(summaryParts.join(' '))}</p>
      ${specRows.length > 0 ? `<dl style="margin-top: 12px;">${specRows.join('')}</dl>` : ''}
      <h3 style="font-size: 1rem; color: #fff; margin-top: 14px;">${escapeHtml(uiLabels.faqHeading)}</h3>
      <dl>${faqHtml}</dl>
    </section>
  `;

  return { html, faqList };
}

function pickRelatedTaxonomyQuery(post) {
  if (!post || typeof post !== 'object') return null;
  if (Array.isArray(post.actors)) {
    for (const rawActor of post.actors) {
      const clean = decodeBasicEntities(typeof rawActor === 'string' ? rawActor : rawActor?.name || '');
      if (isIndexableTaxonomyTerm('actor', clean, 'en')) {
        return { param: 'actor', value: clean };
      }
    }
  }
  if (Array.isArray(post.categories)) {
    for (const rawCat of post.categories) {
      const resolved = resolveCategoryAlias(decodeBasicEntities(typeof rawCat === 'string' ? rawCat : rawCat?.name || ''));
      if (isIndexableTaxonomyTerm('category', resolved, 'en')) {
        return { param: 'category', value: resolved };
      }
    }
  }
  const studioName = typeof post.studio === 'string' ? post.studio : (post.studio?.name || '');
  const resolvedStudio = resolveStudioAlias(decodeBasicEntities(studioName));
  if (resolvedStudio && resolvedStudio !== 'Other') {
    return { param: 'studio', value: resolvedStudio };
  }
  return null;
}

async function fetchRelatedWatchPosts(post, currentId, origin, executionContext) {
  const query = pickRelatedTaxonomyQuery(post);
  if (!query) return [];

  const relatedCache = caches?.default;
  const cacheUrl = `${origin}/__related/v1?type=${encodeURIComponent(query.param)}&name=${encodeURIComponent(query.value)}`;
  const cacheKey = new Request(cacheUrl, { method: 'GET' });
  let postsArr = null;

  if (relatedCache) {
    try {
      const cached = await relatedCache.match(cacheKey);
      if (cached) {
        const parsed = await cached.json();
        if (Array.isArray(parsed)) postsArr = parsed;
      }
    } catch {
      // Cache read failure falls back to live fetch
    }
  }

  if (!postsArr) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    try {
      const params = new URLSearchParams({ per_page: '8' });
      params.set(query.param, query.value);
      const res = await fetch(`${TARGET_BASE}/posts?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Client-Site': 'https://www.missav-j.com',
          'User-Agent': 'MISSAV-J-Edge-SSR/1.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res && res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw)) {
          postsArr = raw;
          if (relatedCache && executionContext?.waitUntil) {
            executionContext.waitUntil(
              relatedCache.put(
                cacheKey,
                new Response(JSON.stringify(raw), {
                  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
                })
              )
            );
          }
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  if (!Array.isArray(postsArr)) return [];
  return postsArr
    .filter(p => p && p.id && String(p.id) !== String(currentId) && p.title)
    .slice(0, 4);
}

function buildTaxonomyOverviewHtml({ type, nameParam, activeLang, wpTotal, posts, labels }) {
  if (!nameParam || !Array.isArray(posts) || posts.length === 0) return '';
  const cleanName = decodeBasicEntities(nameParam);
  const nativeName = type === 'actor' ? (CURATED_ACTOR_NATIVE_MAP[cleanName.toLowerCase()] || '') : '';
  const totalCount = wpTotal || posts.length;

  const seenCats = new Map();
  const seenStudios = new Map();
  const releaseCodes = [];

  for (const p of posts) {
    if (p.code && releaseCodes.length < 4 && !releaseCodes.includes(p.code)) {
      releaseCodes.push(p.code);
    }
    if (Array.isArray(p.categories)) {
      for (const c of p.categories) {
        const raw = decodeBasicEntities(typeof c === 'string' ? c : (c?.name || ''));
        const resolved = resolveCategoryAlias(raw);
        if (resolved && !seenCats.has(resolved.toLowerCase()) && seenCats.size < 6) {
          seenCats.set(resolved.toLowerCase(), resolved);
        }
      }
    }
    if (p.studio) {
      const rawS = decodeBasicEntities(typeof p.studio === 'string' ? p.studio : (p.studio?.name || ''));
      const resolvedS = resolveStudioAlias(rawS);
      if (resolvedS && !seenStudios.has(resolvedS.toLowerCase()) && seenStudios.size < 4) {
        seenStudios.set(resolvedS.toLowerCase(), resolvedS);
      }
    }
  }

  const genrePills = [...seenCats.values()].map(cat => (
    isIndexableTaxonomyTerm('category', cat, activeLang)
      ? `<a href="/${activeLang}/category?name=${encodeURIComponent(cat)}" style="color: #e50914;">${escapeHtml(cat)}</a>`
      : `<span style="color: #ccc;">${escapeHtml(cat)}</span>`
  )).join(', ');

  const studioLinks = [...seenStudios.values()].map(st => (
    isIndexableTaxonomyTerm('studio', st, activeLang)
      ? `<a href="/${activeLang}/studio?name=${encodeURIComponent(st)}" style="color: #e50914;">${escapeHtml(st)}</a>`
      : `<span style="color: #ccc;">${escapeHtml(st)}</span>`
  )).join(', ');

  const rows = [
    nativeName ? `<li><strong>${escapeHtml(labels.nativeNameLbl)}</strong> ${escapeHtml(nativeName)}</li>` : '',
    `<li><strong>${escapeHtml(labels.totalVideosLbl)}</strong> ${escapeHtml(String(totalCount))}</li>`,
    releaseCodes.length > 0 ? `<li><strong>${escapeHtml(labels.releaseCodesLbl)}</strong> ${escapeHtml(releaseCodes.join(', '))}</li>` : '',
    genrePills ? `<li><strong>${escapeHtml(labels.genresLbl)}</strong> ${genrePills}</li>` : '',
    studioLinks ? `<li><strong>${escapeHtml(labels.studioLbl)}</strong> ${studioLinks}</li>` : ''
  ].filter(Boolean).join('');

  return `
    <section class="taxonomy-profile-summary" style="margin: 16px 0; padding: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; font-size: 0.95rem; line-height: 1.6;">
      <h2 style="font-size: 1.1rem; margin-top: 0; color: #fff;">${escapeHtml(labels.catalogOverviewHeading)}: ${escapeHtml(cleanName)}</h2>
      <ul style="margin: 8px 0 0; padding-left: 18px; color: #ddd;">
        ${rows}
      </ul>
    </section>
  `;
}

const DESC_TEMPLATES = {
  'zh-TW': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = `，${a ? '由 ' + a + ' 主演' : ''}${a && s ? '，' : ''}${s ? '由 ' + s + ' 製作' : ''}`;
    return `免費觀看 JAV ${c ? c + ' ' : ''}${t}${extra}，盡在 MISSAV-J 高畫質串流平台。`;
  },
  'zh-CN': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = `，${a ? '由 ' + a + ' 主演' : ''}${a && s ? '，' : ''}${s ? '由 ' + s + ' 制作' : ''}`;
    return `免费观看 JAV ${c ? c + ' ' : ''}${t}${extra}，尽在 MISSAV-J 高清流媒体平台。`;
  },
  'en': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'starring ' + a : ''}${a && s ? ' ' : ''}${s ? 'by ' + s : ''}`;
    return `Watch ${c ? c + ' ' : ''}${t}${extra} for free in premium HD streaming quality on MISSAV-J.`;
  },
  'ja': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? a + '出演' : ''}${a && s ? '・' : ''}${s ? s + '制作' : ''}`;
    return `MISSAV-J で ${c ? c + ' ' : ''}${t}${extra} を高画質で無料視聴。`;
  },
  'ko': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? a + ' 주연' : ''}${a && s ? ', ' : ''}${s ? s + ' 제작' : ''}`;
    return `MISSAV-J에서 ${c ? c + ' ' : ''}${t}${extra} 무료 HD 스트리밍 시청.`;
  },
  'ms': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'dibintangi oleh ' + a : ''}${a && s ? ' ' : ''}${s ? 'dari ' + s : ''}`;
    return `Tonton ${c ? c + ' ' : ''}${t}${extra} secara percuma dengan kualiti HD premium di MISSAV-J.`;
  },
  'th': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'นำแสดงโดย ' + a : ''}${a && s ? ' ' : ''}${s ? 'โดยสตูดิโอ ' + s : ''}`;
    return `ดู ${c ? c + ' ' : ''}${t}${extra} ฟรีในคุณภาพ HD ระดับพรีเมียมบน MISSAV-J`;
  },
  'de': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'mit ' + a : ''}${a && s ? ' ' : ''}${s ? 'von ' + s : ''}`;
    return `Sehen Sie ${c ? c + ' ' : ''}${t}${extra} kostenlos in Premium-HD-Streaming-Qualität auf MISSAV-J.`;
  },
  'fr': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'mettant en vedette ' + a : ''}${a && s ? ' ' : ''}${s ? 'par ' + s : ''}`;
    return `Regardez ${c ? c + ' ' : ''}${t}${extra} gratuitement en qualité HD premium sur MISSAV-J.`;
  },
  'vi': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'với sự tham gia của ' + a : ''}${a && s ? ' ' : ''}${s ? 'từ ' + s : ''}`;
    return `Xem ${c ? c + ' ' : ''}${t}${extra} miễn phí chất lượng HD cao cấp trên MISSAV-J.`;
  },
  'id': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'dibintangi ' + a : ''}${a && s ? ' ' : ''}${s ? 'dari ' + s : ''}`;
    return `Nonton video JAV ${c ? c + ' ' : ''}${t}${extra} gratis dengan streaming kualitas premium di MISSAV-J.`;
  },
  'fil': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'pinagbibidahan ni ' + a : ''}${a && s ? ' ' : ''}${s ? 'mula sa ' + s : ''}`;
    return `Panoorin ang ${c ? c + ' ' : ''}${t}${extra} nang libre sa premium HD streaming sa MISSAV-J.`;
  },
  'pt': (c, t, a, s) => {
    let extra = '';
    if (a || s) extra = ` ${a ? 'estrelado por ' + a : ''}${a && s ? ' ' : ''}${s ? 'do estúdio ' + s : ''}`;
    return `Assista ao ${c ? c + ' ' : ''}${t}${extra} gratuitamente em qualidade de streaming HD premium na MISSAV-J.`;
  }
};

const SEO_I18N = {
  en: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming. Explore the latest releases, trending videos, and top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Watch JAV videos starring %s in premium HD on MISSAV-J. Explore the full filmography and profile." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Watch the latest and best %s JAV videos online for free. Premium high-quality streaming on MISSAV-J." },
    studio: { t: "%s Studio JAV Videos | MISSAV-J", d: "Explore the official collection of %s JAV videos. High definition streaming for %s releases." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Watch the most popular and trending JAV videos right now on MISSAV-J." },
    recent: { t: "Recent JAV Videos | MISSAV-J", d: "Watch the newest and latest JAV video releases on MISSAV-J." },
    actors: { t: "All JAV Actresses | MISSAV-J", d: "Browse our complete database of JAV actresses and their full video collections." },
    categories: { t: "All JAV Categories | MISSAV-J", d: "Explore all JAV categories, genres, and tags on MISSAV-J." },
    studios: { t: "All JAV Studios | MISSAV-J", d: "Browse videos from top JAV studios and production companies on MISSAV-J." },
    search: { t: "Search Results | MISSAV-J", d: "Search results for premium JAV videos on MISSAV-J." },
    history: { t: "Session History | MISSAV-J", d: "Your recently watched JAV videos on MISSAV-J." },
    watch_later: { t: "Watch Later | MISSAV-J", d: "Your saved JAV videos to watch later on MISSAV-J." },
    dmca: { t: "DMCA Copyright Notice & Policy | MISSAV-J", d: "MISSAV-J Digital Millennium Copyright Act (DMCA) policy. How to submit copyright complaints and content removal requests." },
    2257: { t: "18 U.S.C. 2257 Record-Keeping Compliance | MISSAV-J", d: "18 U.S.C. 2257 compliance statement. All performers appearing on MISSAV-J were 18 years of age or older at production time." },
    privacy_policy: { t: "Privacy Policy | MISSAV-J", d: "MISSAV-J Privacy Policy. Learn how we handle cookies, respect user privacy, and maintain compliance standards." },
    terms: { t: "Terms of Service & User Agreement | MISSAV-J", d: "MISSAV-J Terms of Service. Review website terms of use, content disclaimers, and user obligations." },
    contact: { t: "Contact Us & Business Partnerships | MISSAV-J", d: "Contact MISSAV-J for advertising inquiries, banner sponsorships, content reporting, and support." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming on MISSAV-J." }
  },
  id: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton video JAV premium terbaik. Jelajahi rilis terbaru, video trending, dan aktris top." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV dari %s dalam kualitas HD premium di MISSAV-J. Jelajahi profil lengkapnya." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terbaru dan terbaik secara online. Streaming kualitas tinggi premium di MISSAV-J." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Jelajahi koleksi resmi video JAV %s. Streaming definisi tinggi untuk rilis %s." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling populer dan trending saat ini di MISSAV-J." },
    recent: { t: "Video JAV Terbaru | MISSAV-J", d: "Tonton rilis video JAV terbaru dan teranyar di MISSAV-J." },
    actors: { t: "Semua Aktris JAV | MISSAV-J", d: "Jelajahi basis data lengkap aktris JAV kami dan koleksi video mereka." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Jelajahi semua kategori, genre, dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Jelajahi video dari studio dan perusahaan produksi JAV teratas di MISSAV-J." },
    search: { t: "Hasil Pencarian | MISSAV-J", d: "Hasil pencarian untuk video JAV premium di MISSAV-J." },
    history: { t: "Riwayat Sesi | MISSAV-J", d: "Video JAV yang baru saja Anda tonton di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang Anda simpan untuk ditonton nanti di MISSAV-J." },
    dmca: { t: "Kebijakan Hak Cipta DMCA | MISSAV-J", d: "Kebijakan DMCA MISSAV-J. Cara mengirimkan keluhan hak cipta dan permintaan penghapusan konten." },
    2257: { t: "Pernyataan Kepatuhan 18 U.S.C. 2257 | MISSAV-J", d: "Pernyataan kepatuhan pencatatan 18 U.S.C. 2257. Semua pemeran berusia 18 tahun ke atas saat produksi." },
    privacy_policy: { t: "Kebijakan Privasi | MISSAV-J", d: "Kebijakan Privasi MISSAV-J. Pelajari bagaimana kami melindungi privasi pengguna dan standar kepatuhan." },
    terms: { t: "Ketentuan Layanan & Perjanjian Pengguna | MISSAV-J", d: "Ketentuan Layanan MISSAV-J. Pelajari panduan penggunaan situs dan syarat hukum." },
    contact: { t: "Hubungi Kami & Kemitraan Bisnis | MISSAV-J", d: "Hubungi MISSAV-J untuk pertanyaan periklanan, sponsor banner, dan dukungan teknis." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton streaming JAV premium terbaik di MISSAV-J." }
  },
  ja: {
    home: { t: "MISSAV-J | プレミアムJAVストリーミング", d: "最高のプレミアムJAVストリーミングを視聴。最新リリース、トレンド動画、人気女優を探索。" },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-Jで %s 出演のJAV動画をプレミアムHDで視聴。完全なプロフィールを探索。" },
    category: { t: "%s JAV動画 | MISSAV-J", d: "最新かつ最高の %s JAV動画をオンラインで無料視聴。MISSAV-Jでのプレミアム高品質ストリーミング。" },
    studio: { t: "%s JAV動画 | MISSAV-J", d: "公式の %s JAV動画コレクションを探索。%s リリースの高解像度ストリーミング。" },
    trending: { t: "急上昇JAV動画 | MISSAV-J", d: "MISSAV-Jで今最も人気のあるトレンドJAV動画を視聴。" },
    recent: { t: "新着JAV動画 | MISSAV-J", d: "MISSAV-Jで最新のJAV動画リリースを視聴。" },
    actors: { t: "すべてのJAV女優 | MISSAV-J", d: "JAV女優の完全なデータベースとフルビデオコレクションを閲覧。" },
    categories: { t: "すべてのJAVカテゴリー | MISSAV-J", d: "MISSAV-JですべてのJAVカテゴリー、ジャンル、タグを探索。" },
    studios: { t: "すべてのJAVメーカー | MISSAV-J", d: "MISSAV-JでトップJAVメーカーや制作会社の動画を閲覧。" },
    search: { t: "検索結果 | MISSAV-J", d: "MISSAV-JのプレミアムJAV動画の検索結果。" },
    history: { t: "視聴履歴 | MISSAV-J", d: "MISSAV-Jで最近視聴したJAV動画。" },
    watch_later: { t: "後で見る | MISSAV-J", d: "MISSAV-Jで後で見るために保存したJAV動画。" },
    default: { t: "MISSAV-J | プレミアムJAVストリーミング", d: "MISSAV-Jで最高のプレミアムJAVストリーミングを視聴。" }
  },
  ko: {
    home: { t: "MISSAV-J | 프리미엄 JAV 스트리밍", d: "최고의 프리미엄 JAV 스트리밍을 시청하세요. 최신 릴리스, 인기 동영상 및 최고 여배우를 탐색하십시오." },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-J에서 %s 출연 JAV 동영상을 프리미엄 HD로 시청하세요." },
    category: { t: "%s JAV 동영상 | MISSAV-J", d: "온라인에서 최신 및 최고의 %s JAV 동영상을 무료로 시청하세요." },
    studio: { t: "%s JAV 동영상 | MISSAV-J", d: "공식 %s JAV 동영상 컬렉션을 탐색하십시오." },
    trending: { t: "인기 JAV 동영상 | MISSAV-J", d: "MISSAV-J에서 지금 가장 인기 있고 트렌디한 JAV 동영상을 시청하세요." },
    recent: { t: "최신 JAV 동영상 | MISSAV-J", d: "MISSAV-J에서 최신 JAV 동영상 릴리스를 시청하세요." },
    actors: { t: "모든 JAV 여배우 | MISSAV-J", d: "우리의 완전한 JAV 여배우 데이터베이스를 찾아보십시오." },
    categories: { t: "모든 JAV 카테고리 | MISSAV-J", d: "MISSAV-J에서 모든 JAV 카테고리를 탐색하십시오." },
    studios: { t: "모든 JAV 스튜디오 | MISSAV-J", d: "MISSAV-J에서 인기 JAV 스튜디오의 동영상을 찾아보십시오." },
    search: { t: "검색 결과 | MISSAV-J", d: "MISSAV-J의 프리미엄 JAV 동영상 검색 결과." },
    history: { t: "시청 기록 | MISSAV-J", d: "MISSAV-J에서 최근에 시청한 JAV 동영상." },
    watch_later: { t: "나중에 보기 | MISSAV-J", d: "MISSAV-J에 나중에 보기 위해 저장한 JAV 동영상." },
    default: { t: "MISSAV-J | 프리미엄 JAV 스트리밍", d: "MISSAV-J에서 최고의 프리미엄 JAV 스트리밍을 시청하세요." }
  },
  'zh-TW': {
    home: { t: "MISSAV-J | 高級 JAV 串流", d: "觀看最好的高級 JAV 串流。探索最新發布、熱門影片和頂級女優。" },
    actor: { t: "%s | MISSAV-J", d: "在 MISSAV-J 上以高級 HD 觀看由 %s 主演的 JAV 影片。探索完整的影片庫。" },
    category: { t: "%s JAV 影片 | MISSAV-J", d: "在線免費觀看最新最好的 %s JAV 影片。MISSAV-J 提供高級高品質串流。" },
    studio: { t: "%s JAV 影片 | MISSAV-J", d: "探索官方的 %s JAV 影片收藏。MISSAV-J 提供高畫質串流。" },
    trending: { t: "熱門 JAV 影片 | MISSAV-J", d: "在 MISSAV-J 上觀看目前最受歡迎和熱門的 JAV 影片。" },
    recent: { t: "最新 JAV 影片 | MISSAV-J", d: "在 MISSAV-J 上觀看最新的 JAV 影片發布。" },
    actors: { t: "所有 JAV 女優 | MISSAV-J", d: "瀏覽我們完整的 JAV 女優數據庫和她們的影片收藏。" },
    categories: { t: "所有 JAV 分類 | MISSAV-J", d: "探索 MISSAV-J 上的所有 JAV 分類、流派和標籤。" },
    studios: { t: "所有 JAV 片商 | MISSAV-J", d: "瀏覽 MISSAV-J 上頂級 JAV 片商的影片。" },
    search: { t: "搜索結果 | MISSAV-J", d: "MISSAV-J 上高級 JAV 影片的搜索結果。" },
    history: { t: "觀看歷史 | MISSAV-J", d: "您最近在 MISSAV-J 觀看的 JAV 影片。" },
    watch_later: { t: "稍後觀看 | MISSAV-J", d: "您保存在 MISSAV-J 稍後觀看的 JAV 影片。" },
    default: { t: "MISSAV-J | 高級 JAV 串流", d: "在 MISSAV-J 觀看最好的高級 JAV 串流。" }
  },
  'zh-CN': {
    home: { t: "MISSAV-J | 高级 JAV 流媒体", d: "观看最好的高级 JAV 流媒体。探索最新发布、热门视频和顶级女优。" },
    actor: { t: "%s | MISSAV-J", d: "在 MISSAV-J 上以高级 HD 观看由 %s 主演的 JAV 视频。探索完整的影片库。" },
    category: { t: "%s JAV 视频 | MISSAV-J", d: "在线免费观看最新最好的 %s JAV 视频。MISSAV-J 提供高级高质量流媒体。" },
    studio: { t: "%s JAV 视频 | MISSAV-J", d: "探索官方的 %s JAV 视频收藏。MISSAV-J 提供高清流媒体。" },
    trending: { t: "热门 JAV 视频 | MISSAV-J", d: "在 MISSAV-J 上观看目前最受欢迎和热门的 JAV 视频。" },
    recent: { t: "最新 JAV 视频 | MISSAV-J", d: "在 MISSAV-J 上观看最新的 JAV 视频发布。" },
    actors: { t: "所有 JAV 女优 | MISSAV-J", d: "浏览我们完整的 JAV 女优数据库和她们的视频收藏。" },
    categories: { t: "所有 JAV 分类 | MISSAV-J", d: "探索 MISSAV-J 上的所有 JAV 分类、流派和标签。" },
    studios: { t: "所有 JAV 片商 | MISSAV-J", d: "浏览 MISSAV-J 上顶级 JAV 片商的视频。" },
    search: { t: "搜索结果 | MISSAV-J", d: "MISSAV-J 上高级 JAV 视频的搜索结果。" },
    history: { t: "观看历史 | MISSAV-J", d: "您最近在 MISSAV-J 观看的 JAV 视频。" },
    watch_later: { t: "稍后观看 | MISSAV-J", d: "您保存在 MISSAV-J 稍后观看的 JAV 视频。" },
    default: { t: "MISSAV-J | 高级 JAV 流媒体", d: "在 MISSAV-J 观看最好的高级 JAV 流媒体。" }
  },
  ms: {
    home: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik. Terokai keluaran terkini, video trending dan pelakon popular." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV yang dibintangi %s dalam HD premium di MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terkini dan terbaik dalam talian secara percuma." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Terokai koleksi rasmi video JAV %s di MISSAV-J." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling popular dan trending sekarang di MISSAV-J." },
    recent: { t: "Video JAV Terkini | MISSAV-J", d: "Tonton keluaran video JAV terkini di MISSAV-J." },
    actors: { t: "Semua Pelakon JAV | MISSAV-J", d: "Semak imbas pangkalan data lengkap pelakon JAV kami." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Terokai semua kategori, genre dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Semak imbas video dari studio JAV teratas di MISSAV-J." },
    search: { t: "Hasil Carian | MISSAV-J", d: "Hasil carian untuk video JAV premium di MISSAV-J." },
    history: { t: "Sejarah Sesi | MISSAV-J", d: "Video JAV yang anda tonton baru-baru ini di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang anda simpan untuk ditonton nanti di MISSAV-J." },
    default: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik di MISSAV-J." }
  },
  th: {
    home: { t: "MISSAV-J | สตรีมมิ่ง JAV พรีเมียม", d: "ดูการสตรีม JAV พรีเมียมที่ดีที่สุด สำรวจการเปิดตัวล่าสุด วิดีโอยอดนิยม และนักแสดงหญิงชั้นนำ" },
    actor: { t: "%s | MISSAV-J", d: "ดูวิดีโอ JAV ที่นำแสดงโดย %s ในรูปแบบ HD พรีเมียมบน MISSAV-J" },
    category: { t: "วิดีโอ JAV %s | MISSAV-J", d: "ดูวิดีโอ JAV %s ล่าสุดและดีที่สุดออนไลน์ฟรี" },
    studio: { t: "วิดีโอ JAV %s | MISSAV-J", d: "สำรวจคอลเลกชันอย่างเป็นทางการของวิดีโอ JAV %s บน MISSAV-J" },
    trending: { t: "วิดีโอ JAV ยอดนิยม | MISSAV-J", d: "ดูวิดีโอ JAV ที่ได้รับความนิยมและเป็นกระแสที่สุดตอนนี้บน MISSAV-J" },
    recent: { t: "วิดีโอ JAV ล่าสุด | MISSAV-J", d: "ดูวิดีโอ JAV ล่าสุดที่เพิ่งเปิดตัวบน MISSAV-J" },
    actors: { t: "นักแสดงหญิง JAV ทั้งหมด | MISSAV-J", d: "เรียกดูฐานข้อมูลนักแสดงหญิง JAV ที่สมบูรณ์ของเรา" },
    categories: { t: "หมวดหมู่ JAV ทั้งหมด | MISSAV-J", d: "สำรวจหมวดหมู่และแนวเพลง JAV ทั้งหมดบน MISSAV-J" },
    studios: { t: "สตูดิโอ JAV ทั้งหมด | MISSAV-J", d: "เรียกดูวิดีโอจากสตูดิโอ JAV ชั้นนำบน MISSAV-J" },
    search: { t: "ผลการค้นหา | MISSAV-J", d: "ผลการค้นหาสำหรับวิดีโอ JAV พรีเมียมบน MISSAV-J" },
    history: { t: "ประวัติการเข้าชม | MISSAV-J", d: "วิดีโอ JAV ที่คุณเพิ่งดูล่าสุดบน MISSAV-J" },
    watch_later: { t: "ดูภายหลัง | MISSAV-J", d: "วิดีโอ JAV ที่คุณบันทึกไว้เพื่อดูภายหลังบน MISSAV-J" },
    default: { t: "MISSAV-J | สตรีมมิ่ง JAV พรีเมียม", d: "ดูการสตรีม JAV พรีเมียมที่ดีที่สุดบน MISSAV-J" }
  },
  de: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams an. Entdecken Sie die neuesten Veröffentlichungen, Trendvideos und Top-Schauspielerinnen." },
    actor: { t: "%s | MISSAV-J", d: "Sehen Sie sich JAV-Videos mit %s in Premium-HD auf MISSAV-J an." },
    category: { t: "%s JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten und besten %s JAV-Videos online kostenlos an." },
    studio: { t: "%s JAV-Videos | MISSAV-J", d: "Entdecken Sie die offizielle Sammlung von %s JAV-Videos auf MISSAV-J." },
    trending: { t: "Trendige JAV-Videos | MISSAV-J", d: "Sehen Sie sich jetzt die beliebtesten und angesagtesten JAV-Videos auf MISSAV-J an." },
    recent: { t: "Neueste JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten JAV-Video-Veröffentlichungen auf MISSAV-J an." },
    actors: { t: "Alle JAV-Schauspielerinnen | MISSAV-J", d: "Durchsuchen Sie unsere komplette Datenbank von JAV-Schauspielerinnen." },
    categories: { t: "Alle JAV-Kategorien | MISSAV-J", d: "Entdecken Sie alle JAV-Kategorien und Genres auf MISSAV-J." },
    studios: { t: "Alle JAV-Studios | MISSAV-J", d: "Durchsuchen Sie Videos von den besten JAV-Studios auf MISSAV-J." },
    search: { t: "Suchergebnisse | MISSAV-J", d: "Suchergebnisse für Premium-JAV-Videos auf MISSAV-J." },
    history: { t: "Verlauf | MISSAV-J", d: "Ihre kürzlich angesehenen JAV-Videos auf MISSAV-J." },
    watch_later: { t: "Später ansehen | MISSAV-J", d: "Ihre gespeicherten JAV-Videos auf MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams auf MISSAV-J an." }
  },
  fr: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium. Découvrez les dernières sorties, les vidéos tendance et les meilleures actrices." },
    actor: { t: "%s | MISSAV-J", d: "Regardez des vidéos JAV avec %s en HD premium sur MISSAV-J." },
    category: { t: "Vidéos JAV %s | MISSAV-J", d: "Regardez les dernières et les meilleures vidéos JAV %s en ligne gratuitement." },
    studio: { t: "Vidéos JAV %s | MISSAV-J", d: "Découvrez la collection officielle de vidéos JAV %s sur MISSAV-J." },
    trending: { t: "Vidéos JAV tendance | MISSAV-J", d: "Regardez les vidéos JAV les plus populaires en ce moment sur MISSAV-J." },
    recent: { t: "Dernières vidéos JAV | MISSAV-J", d: "Regardez les dernières sorties de vidéos JAV sur MISSAV-J." },
    actors: { t: "Toutes les actrices JAV | MISSAV-J", d: "Parcourez notre base de données complète d'actrices JAV." },
    categories: { t: "Toutes les catégories JAV | MISSAV-J", d: "Découvrez toutes les catégories et genres JAV sur MISSAV-J." },
    studios: { t: "Tous les studios JAV | MISSAV-J", d: "Parcourez les vidéos des meilleurs studios JAV sur MISSAV-J." },
    search: { t: "Résultats de recherche | MISSAV-J", d: "Résultats de recherche pour les vidéos JAV premium sur MISSAV-J." },
    history: { t: "Historique | MISSAV-J", d: "Vos vidéos JAV récemment regardées sur MISSAV-J." },
    watch_later: { t: "À regarder plus tard | MISSAV-J", d: "Vos vidéos JAV enregistrées sur MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium sur MISSAV-J." }
  },
  vi: {
    home: { t: "MISSAV-J | Truyền phát JAV Cao cấp", d: "Xem truyền phát JAV cao cấp tốt nhất. Khám phá các bản phát hành mới nhất, video thịnh hành và các nữ diễn viên hàng đầu." },
    actor: { t: "%s | MISSAV-J", d: "Xem video JAV có sự tham gia của %s với chất lượng HD cao cấp trên MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Xem video JAV %s mới nhất và tốt nhất trực tuyến miễn phí." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Khám phá bộ sưu tập chính thức của các video JAV %s trên MISSAV-J." },
    trending: { t: "Video JAV thịnh hành | MISSAV-J", d: "Xem các video JAV phổ biến và thịnh hành nhất ngay bây giờ trên MISSAV-J." },
    recent: { t: "Video JAV mới nhất | MISSAV-J", d: "Xem các bản phát hành video JAV mới nhất trên MISSAV-J." },
    actors: { t: "Tất cả Nữ diễn viên JAV | MISSAV-J", d: "Duyệt qua cơ sở dữ liệu hoàn chỉnh của chúng tôi về các nữ diễn viên JAV." },
    categories: { t: "Tất cả Danh mục JAV | MISSAV-J", d: "Khám phá tất cả các danh mục và thể loại JAV trên MISSAV-J." },
    studios: { t: "Tất cả Studio JAV | MISSAV-J", d: "Duyệt video từ các studio JAV hàng đầu trên MISSAV-J." },
    search: { t: "Kết quả Tìm kiếm | MISSAV-J", d: "Kết quả tìm kiếm cho các video JAV cao cấp trên MISSAV-J." },
    history: { t: "Lịch sử xem | MISSAV-J", d: "Các video JAV bạn đã xem gần đây trên MISSAV-J." },
    watch_later: { t: "Xem sau | MISSAV-J", d: "Các video JAV bạn đã lưu để xem sau trên MISSAV-J." },
    default: { t: "MISSAV-J | Truyền phát JAV Cao cấp", d: "Xem truyền phát JAV cao cấp tốt nhất trên MISSAV-J." }
  },
  fil: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming. Tuklasin ang mga pinakabagong release, trending videos, at top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Panoorin ang mga JAV video na pinagbibidahan ni %s sa premium HD sa MISSAV-J." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Panoorin ang pinakabago at pinakamahusay na %s JAV videos online nang libre." },
    studio: { t: "%s JAV Videos | MISSAV-J", d: "Galugarin ang opisyal na koleksyon ng mga %s JAV videos sa MISSAV-J." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Panoorin ang pinakasikat at trending na JAV videos ngayon sa MISSAV-J." },
    recent: { t: "Pinakabagong JAV Videos | MISSAV-J", d: "Panoorin ang mga pinakabagong release ng JAV video sa MISSAV-J." },
    actors: { t: "Lahat ng JAV Actresses | MISSAV-J", d: "I-browse ang aming kumpletong database ng mga JAV actresses." },
    categories: { t: "Lahat ng JAV Categories | MISSAV-J", d: "Galugarin ang lahat ng JAV categories at genres sa MISSAV-J." },
    studios: { t: "Lahat ng JAV Studios | MISSAV-J", d: "Mag-browse ng mga video mula sa nangungunang JAV studios sa MISSAV-J." },
    search: { t: "Mga Resulta ng Paghahanap | MISSAV-J", d: "Mga resulta ng paghahanap para sa premium JAV videos sa MISSAV-J." },
    history: { t: "Kasaysayan ng Napanood | MISSAV-J", d: "Ang iyong mga kamakailang napanood na JAV videos sa MISSAV-J." },
    watch_later: { t: "Panoorin Mamaya | MISSAV-J", d: "Ang iyong mga na-save na JAV videos para panoorin mamaya sa MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming sa MISSAV-J." }
  },
  pt: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium. Explore os lançamentos mais recentes, vídeos em alta e as melhores atrizes." },
    actor: { t: "%s | MISSAV-J", d: "Assista a vídeos JAV com %s em HD premium no MISSAV-J." },
    category: { t: "Vídeos JAV %s | MISSAV-J", d: "Assista aos melhores e mais recentes vídeos JAV %s online gratuitamente." },
    studio: { t: "Vídeos JAV %s | MISSAV-J", d: "Explore a coleção oficial de vídeos JAV %s no MISSAV-J." },
    trending: { t: "Vídeos JAV em alta | MISSAV-J", d: "Assista aos vídeos JAV mais populares e em alta no momento no MISSAV-J." },
    recent: { t: "Vídeos JAV mais recentes | MISSAV-J", d: "Assista aos lançamentos de vídeos JAV mais recentes no MISSAV-J." },
    actors: { t: "Todas as atrizes JAV | MISSAV-J", d: "Navegue pelo nosso banco de dados completo de atrizes JAV." },
    categories: { t: "Todas as categorias JAV | MISSAV-J", d: "Explore todas as categorias e gêneros JAV no MISSAV-J." },
    studios: { t: "Todos os estúdios JAV | MISSAV-J", d: "Navegue por vídeos dos principais estúdios JAV no MISSAV-J." },
    search: { t: "Resultados da pesquisa | MISSAV-J", d: "Resultados da pesquisa por vídeos JAV premium no MISSAV-J." },
    history: { t: "Histórico | MISSAV-J", d: "Seus vídeos JAV assistidos recentemente no MISSAV-J." },
    watch_later: { t: "Assistir mais tarde | MISSAV-J", d: "Seus vídeos JAV salvos para assistir mais tarde no MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium no MISSAV-J." }
  }
};


function formatDuration(durationStr) {
  if (!durationStr || durationStr === '00:00:00') return null;
  let totalSeconds = null;
  if (typeof durationStr === 'number' && Number.isFinite(durationStr)) {
    totalSeconds = Math.floor(durationStr);
  } else if (typeof durationStr === 'string') {
    const trimmed = durationStr.trim();
    if (/^\d+$/.test(trimmed)) {
      totalSeconds = parseInt(trimmed, 10);
    } else {
      const parts = trimmed.split(':').map(Number);
      if (parts.length === 3 && parts.every(n => !isNaN(n))) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2 && parts.every(n => !isNaN(n))) {
        totalSeconds = parts[0] * 60 + parts[1];
      }
    }
  }
  if (!totalSeconds || totalSeconds < 1 || totalSeconds > 86400) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  let iso = 'PT';
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0 || (h === 0 && m === 0)) iso += `${s}S`;
  return iso === 'PT' ? null : iso;
}

/**
 * Fetch the small metadata payload required by server-rendered social cards.
 * Prefer the upstream API, but fall back to our proven /api/posts route when
 * an upstream edge blocks or times out a direct Worker subrequest.
 */
async function fetchPostMetadata(id, origin, request, executionContext) {
  const metadataCache = caches.default;
  const encodedId = encodeURIComponent(id);
  const cacheKey = new Request(`${origin}/__og-metadata/posts/${encodedId}`);
  const staleCacheKey = new Request(`${origin}/__og-metadata-stale/posts/${encodedId}`);

  try {
    const cached = await metadataCache.match(cacheKey);
    if (cached) {
      const cachedData = await cached.json();
      if (cachedData && cachedData.title) return { post: cachedData, notFound: false, stale: false };
    }
  } catch (err) {
    console.warn('[OG Metadata Cache Read Error]', err);
  }

  // Match the headers used by the public /api/posts proxy. Some upstream
  // providers evaluate the originating request and reject a bare Worker
  // subrequest even though the same URL is healthy for a normal visitor.
  const requestHeaders = {
    'Accept': 'application/json',
    'X-Client-Site': 'https://www.missav-j.com',
    'Referer': 'https://www.missav-j.com/',
    'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (compatible; MISSAV-J-SocialCard/1.0)'
  };
  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  if (/^[0-9a-f:.]+$/i.test(clientIp)) {
    requestHeaders['X-Forwarded-For'] = clientIp;
    requestHeaders['CF-Connecting-IP'] = clientIp;
  }

  async function fetchJsonSource(sourceName, endpoint, signal, overrideHeaders = null) {
    try {
      const response = await fetch(endpoint, { headers: overrideHeaders || requestHeaders, signal });
      if (!response.ok) {
        const status = response.status;
        try { await response.body?.cancel?.(); } catch {}
        const error = new Error(`HTTP ${status}`);
        error.status = status;
        throw error;
      }
      const data = await response.json();
      if (!data || !data.title) throw new Error('Response is missing a title');
      return data;
    } catch (err) {
      // Promise.any cancels the losing request after another source succeeds.
      // That is expected control flow, not an operational warning.
      if (err && err.name === 'AbortError') throw err;
      if (err?.status !== 404) console.warn(`[OG Metadata ${sourceName} Error] id=${id}: ${err?.message || err}`);
      throw err;
    }
  }

  // Start the fallback only when the upstream is slow or fails. This keeps the
  // cold-card reliability shield without paying for two subrequests every time.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let hedgeTimer = null;
  let data = null;
  let notFound = false;
  let transientErrors = [];
  try {
    const upstreamPromise = fetchJsonSource(
      'upstream',
      `${TARGET_BASE}/posts/${id}`,
      controller.signal
    );
    let fallbackStarted = false;
    let startFallback;
    const fallbackPromise = new Promise((resolve, reject) => {
      startFallback = () => {
        if (fallbackStarted) return;
        fallbackStarted = true;
        fetchJsonSource(
          'first-party fallback',
          `${origin}/api/posts/${encodedId}`,
          controller.signal
        ).then(resolve, reject);
      };
      hedgeTimer = setTimeout(startFallback, 250);
    });

    // A fast failure should not wait for the hedge delay.
    upstreamPromise.catch(() => {
      if (hedgeTimer) clearTimeout(hedgeTimer);
      startFallback();
    });

    data = await Promise.any([
      upstreamPromise,
      fallbackPromise
    ]);
  } catch (err) {
    transientErrors = Array.isArray(err?.errors) ? err.errors : [err];
    notFound = transientErrors.length === 2 &&
      transientErrors.every(sourceError => sourceError?.status === 404);
  } finally {
    if (hedgeTimer) clearTimeout(hedgeTimer);
    clearTimeout(timeoutId);
    controller.abort();
  }

  // Retry once on transient errors (5xx / 429 / timeout / network reset) using clean Worker headers.
  if (!data && !notFound) {
    const retryController = new AbortController();
    const retryTimeoutId = setTimeout(() => retryController.abort(), 8000);
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      data = await fetchJsonSource(
        'upstream-retry',
        `${TARGET_BASE}/posts/${id}`,
        retryController.signal,
        {
          'Accept': 'application/json',
          'X-Client-Site': 'https://www.missav-j.com',
          'Referer': 'https://www.missav-j.com/',
          'User-Agent': 'MISSAV-J-Edge-SSR/1.0'
        }
      );
    } catch (retryErr) {
      if (retryErr?.status === 404 && transientErrors.some(e => e?.status === 404)) {
        notFound = true;
      } else {
        transientErrors.push(retryErr);
      }
    } finally {
      clearTimeout(retryTimeoutId);
    }
  }

  if (!data) {
    if (!notFound) {
      try {
        const staleCached = await metadataCache.match(staleCacheKey);
        if (staleCached) {
          const staleData = await staleCached.json();
          if (staleData && staleData.title) {
            console.warn(`[OG Metadata Stale Fallback] id=${id}`);
            return { post: staleData, notFound: false, stale: true };
          }
        }
      } catch (staleErr) {
        console.warn('[OG Metadata Stale Read Error]', staleErr);
      }
      const reasons = transientErrors.map(sourceError => sourceError?.message || 'unknown').join(', ');
      console.warn(`[OG Metadata Unavailable] id=${id}: ${reasons}`);
    }
    return { post: null, notFound, stale: false };
  }

  // Cache persistence is an optimization, never a prerequisite for returning
  // metadata that was fetched successfully.
  try {
    const bodyText = JSON.stringify(data);
    const freshResponse = new Response(bodyText, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=604800'
      }
    });
    const staleResponse = new Response(bodyText, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${STALE_BACKUP_TTL_SECONDS}`
      }
    });
    const cacheWrites = Promise.allSettled([
      metadataCache.put(cacheKey, freshResponse),
      metadataCache.put(staleCacheKey, staleResponse)
    ]).catch(err => console.warn('[OG Metadata Cache Write Error]', err));
    if (executionContext && typeof executionContext.waitUntil === 'function') {
      executionContext.waitUntil(cacheWrites);
    } else {
      await cacheWrites;
    }
  } catch (err) {
    console.warn('[OG Metadata Cache Write Error]', err);
  }

  return { post: data, notFound: false, stale: false };
}

/** Remove analytics-only parameters without disturbing meaningful query data. */
function getCleanPublicUrl(inputUrl) {
  const cleanUrl = new URL(inputUrl.toString());
  for (const key of [...cleanUrl.searchParams.keys()]) {
    if (TRACKING_PARAM_REGEX.test(key)) cleanUrl.searchParams.delete(key);
  }
  return cleanUrl;
}

/** Build a deterministic, first-party, query-free social image URL. */
function getSocialImageUrl(sourceUrl, origin) {
  if (!sourceUrl) return `${origin}/assets/images/logo.webp`;
  try {
    const normalized = new URL(sourceUrl);
    if (normalized.protocol !== 'https:') return `${origin}/assets/images/logo.webp`;
    // URL#toString percent-encodes non-ASCII characters, making btoa safe here.
    const encoded = btoa(normalized.toString())
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    return `${origin}/img/${encoded}.jpg`;
  } catch (err) {
    return `${origin}/assets/images/logo.webp`;
  }
}

/** Recover malformed %3F encoded-query paths (e.g. /en/actor%3Fname%3DNon-Chan -> /en/actor?name=Non-Chan). */
function recoverEncodedQueryRedirect(url, requestMethod = 'GET') {
  const method = String(requestMethod || 'GET').toUpperCase();
  if ((method !== 'GET' && method !== 'HEAD') || !/%3f/i.test(url.pathname)) {
    return null;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/img/')) {
    return null;
  }
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  const qIdx = decodedPathname.indexOf('?');
  if (qIdx === -1) return null;

  let targetPath = decodedPathname.slice(0, qIdx).replace(/\/+$/, '') || '/';
  const langOnlyMatch = targetPath.match(/^\/([a-z]{2}(?:-[a-z]{2})?)$/i);
  if (langOnlyMatch) {
    const matchedLang = VALID_LANGS.find(l => l.toLowerCase() === langOnlyMatch[1].toLowerCase());
    if (matchedLang) targetPath = `/${matchedLang}/`;
  } else {
    const prefixMatch = targetPath.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)$/i);
    if (prefixMatch) {
      const matchedLang = VALID_LANGS.find(l => l.toLowerCase() === prefixMatch[1].toLowerCase());
      if (matchedLang) targetPath = `/${matchedLang}${prefixMatch[2]}`;
    }
  }

  const rawQuery = decodedPathname.slice(qIdx + 1);
  const combinedParams = new URLSearchParams(rawQuery);
  for (const [k, v] of url.searchParams.entries()) {
    if (!TRACKING_PARAM_REGEX.test(k) && !combinedParams.has(k)) {
      combinedParams.set(k, v);
    }
  }
  const cleanPairs = [];
  for (const [k, v] of combinedParams.entries()) {
    if (!TRACKING_PARAM_REGEX.test(k)) {
      cleanPairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  const queryStr = cleanPairs.join('&');
  const location = `${url.origin}${targetPath}${queryStr ? `?${queryStr}` : ''}`;
  return new Response(null, {
    status: 301,
    headers: {
      'Location': location,
      'Cache-Control': 'public, max-age=86400',
      'X-Edge-Mode': 'ENCODED-QUERY-REDIRECT',
      'X-Cache-Status': 'BYPASS'
    }
  });
}

/**
 * Ambil objek seluruh terjemahan judul dari Supabase (read-only).
 */
async function getTranslationRow(id, supabaseUrl, supabaseKey) {
  if (!id || !supabaseUrl || !supabaseKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && data[0].translations && typeof data[0].translations === 'object') {
      return data[0].translations;
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('[OG Supabase Error]', e);
  }
  return null;
}

/**
 * Ambil terjemahan judul batch dari Supabase untuk katalog SSR listing.
 */
async function getBatchTranslationRows(ids, supabaseUrl, supabaseKey) {
  if (!Array.isArray(ids) || ids.length === 0 || !supabaseUrl || !supabaseKey) return {};
  const cleanIds = ids.map(id => Number(id)).filter(n => Number.isSafeInteger(n) && n > 0);
  if (cleanIds.length === 0) return {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=in.(${cleanIds.join(',')})&select=id,translations`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.id && item.translations) map[item.id] = item.translations;
      });
    }
    return map;
  } catch (e) {
    clearTimeout(timeoutId);
    return {};
  }
}

/**
 * Ambil terjemahan judul dari Supabase (lazy, hanya bahasa yang diminta).
 */
async function getTranslatedTitle(id, lang, supabaseUrl, supabaseKey) {
  if (!lang || lang === 'en' || !supabaseUrl || !supabaseKey) return null;
  const row = await getTranslationRow(id, supabaseUrl, supabaseKey);
  return row && row[lang] ? row[lang] : null;
}

function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str || '');
  if (!str) return '';
  
  // Unescape first to prevent double-escaping if the string is already escaped
  const unescaped = str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");

  // Then escape safely
  return unescaped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Truncate a RAW (un-escaped) string to at most `max` characters, appending an
// ellipsis when clipped. Operate on the raw name and escape AFTER, so we never
// slice through an HTML entity. Fixes Ahrefs "Title too long" / "Meta
// description too long" on programmatic actor pages whose names are very long.
function truncateChars(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + '\u2026';
}

// ── Geo-Redirect: Country → Language mapping ──────────────────────────────
// Maps ISO 3166-1 alpha-2 country codes (from CF-IPCountry header) to the
// language code used in URL prefixes (matches VALID_LANGS above).
const COUNTRY_TO_LANG = {
  // East Asia
  JP: 'ja',
  KR: 'ko',
  TW: 'zh-TW', HK: 'zh-TW', MO: 'zh-TW',
  CN: 'zh-CN',
  // Southeast Asia
  ID: 'id',
  VN: 'vi',
  TH: 'th',
  MY: 'ms', SG: 'ms', BN: 'ms',
  PH: 'fil',
  // Europe
  DE: 'de', AT: 'de',
  FR: 'fr', BE: 'fr', LU: 'fr',
  // Portuguese-speaking
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
};

/**
 * Deteksi bahasa berdasarkan kode negara CF-IPCountry.
 * Fallback ke 'en' jika negara tidak dikenali.
 * @param {string} countryCode — 2-letter ISO code, misal 'KR', 'JP'
 * @returns {string} Language code, misal 'ko', 'ja', 'en'
 */
function detectLangFromCountry(countryCode) {
  if (!countryCode || countryCode === 'XX' || countryCode === 'T1') return 'en';
  return COUNTRY_TO_LANG[countryCode.toUpperCase()] || 'en';
}

/**
 * Baca nilai cookie missav_lang dari header Cookie request.
 * Digunakan agar preferensi bahasa yang sudah dipilih user tetap dihormati.
 * @param {Request} req
 * @returns {string|null} Language code atau null jika tidak ada
 */
function getCookieLang(req) {
  const cookieHeader = req.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)missav_lang=([^;]+)/);
  return match ? match[1].trim() : null;
}

export async function onRequest(context) {
  const isHead = context?.request?.method === 'HEAD';
  try {
    const response = await handleRequest(context);
    if (isHead && response && response.body) {
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    return response;
  } catch (err) {
    console.error('[Worker Uncaught Error]', err);
    let pathname = '/';
    let origin = 'https://www.missav-j.com';
    try {
      const parsed = new URL(context.request.url);
      pathname = parsed.pathname || '/';
      origin = parsed.origin || origin;
    } catch {}
    if (pathname.startsWith('/api')) {
      return new Response(isHead ? null : JSON.stringify({ error: 'Service Temporarily Unavailable' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': '120',
          'X-Edge-Mode': 'EDGE-RECOVERED-503'
        }
      });
    }
    const langMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/i);
    const errLang = (langMatch && VALID_LANGS.find(l => l.toLowerCase() === langMatch[1].toLowerCase())) || 'en';
    const resp = generate503Response(origin, errLang, 'EDGE-RECOVERED-503');
    return isHead ? new Response(null, { status: resp.status, headers: resp.headers }) : resp;
  }
}

async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get('User-Agent') || '';
  const isSocialCrawler = SOCIAL_CRAWLER_REGEX.test(userAgent);
  const isKnownCrawler = isSocialCrawler || SEARCH_CRAWLER_REGEX.test(userAgent);

  if (COMMERCIAL_CRAWLER_REGEX.test(userAgent)) {
    return new Response('Forbidden', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Edge-Mode': 'BLOCKED-BOT',
        'X-Cache-Status': 'BYPASS'
      }
    });
  }

  // ── ENFORCE WWW DOMAIN FOR SEO ──────────────────────────────────────────
  // Mencegah duplicate content (Google melihat missav-j.com dan www.missav-j.com sebagai 2 situs berbeda)
  if (url.protocol === 'http:' || url.hostname === 'missav-j.com') {
    url.protocol = 'https:';
    url.hostname = 'www.missav-j.com';
    return Response.redirect(url.toString(), 301);
  }

  const encodedQueryRedirect = recoverEncodedQueryRedirect(url, request.method);
  if (encodedQueryRedirect) return encodedQueryRedirect;

  // ── GEO-REDIRECT ─────────────────────────────────────────────────────────
  // Hanya redirect saat user membuka root "/" tanpa prefix bahasa apapun.
  // URL yang sudah punya prefix (/ko/, /en/, /watch/...) TIDAK disentuh —
  // ini mencegah redirect-loop dan tidak merusak link sharing.
  if ((request.method === 'GET' || request.method === 'HEAD') && (pathname === '/' || pathname === '')) {
    // Deteksi apakah request berasal dari search engine bot / crawler.
    // Bot mendapat 301 (permanent) agar Google mengindeks /en/ — bukan root / yang kosong.
    // User biasa tetap mendapat 302 (temporary) agar geo-detect bisa berubah di masa depan.
    const isBot = isKnownCrawler;

    // Cek preferensi tersimpan di cookie (prioritas utama — user sudah pernah pilih)
    const cookieLang = getCookieLang(request);
    let targetLang;

    if (cookieLang && VALID_LANGS.includes(cookieLang)) {
      // User sudah pernah set bahasa → hormati pilihannya
      targetLang = cookieLang;
    } else {
      // Belum ada preferensi → deteksi dari negara via CF-IPCountry
      const country =
        request.headers.get('CF-IPCountry') ||
        (request.cf && request.cf.country) ||
        '';
      targetLang = detectLangFromCountry(country);
    }

    // Bot: selalu arahkan ke /en/ dengan 301 agar Google mengindeks /en/ sebagai URL kanonik.
    // Googlebot crawl dari US sehingga targetLang sudah 'en', tapi kita eksplisitkan untuk keamanan.
    const finalLang = isBot ? 'en' : targetLang;
    const redirectUrl = `${url.origin}/${finalLang}/${url.search}`;
    const redirectStatus = isBot ? 301 : 302;

    const redirectHeaders = {
      'Location': redirectUrl,
      // JANGAN cache redirect di CDN — setiap user bisa dari negara berbeda
      'Cache-Control': 'no-store, no-cache',
      'Vary': 'CF-IPCountry, Cookie',
    };

    // Jangan set cookie untuk bot — tidak perlu dan bisa mengotori log
    if (!isBot) {
      // Simpan preferensi bahasa ke cookie 30 hari (2592000 detik)
      // agar kunjungan berikutnya langsung pakai bahasa yang sama tanpa geo-detect
      redirectHeaders['Set-Cookie'] = `missav_lang=${targetLang}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`;
    }

    return new Response(null, {
      status: redirectStatus,
      headers: redirectHeaders,
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Handle sitemap.xml rewrite to static sitemap_index.xml
  if (pathname === '/sitemap.xml' || pathname === '/sitemap_index.xml') {
    const newRequest = new Request(new URL('/sitemaps/sitemap_index.xml', request.url), request);
    try {
      const sitemapRes = await env.ASSETS.fetch(newRequest);
      if (sitemapRes && sitemapRes.status < 500) return sitemapRes;
    } catch (err) {
      console.warn('[Sitemap Asset Fetch Error]', err?.message || err);
    }
    return generate503Response(url.origin, 'en', 'SITEMAP-503');
  }
  if (pathname === '/api/sitemap' || pathname.startsWith('/api/sitemap/')) {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': `${url.origin}/sitemaps/sitemap_index.xml`,
        'Cache-Control': 'public, max-age=86400',
        'X-Edge-Mode': 'STATIC-REDIRECT',
        'X-Cache-Status': 'BYPASS'
      }
    });
  }
  const bareLegalMatch = pathname.match(/^\/(dmca|privacy-policy|terms|contact|2257)\/?$/i);
  if (bareLegalMatch) {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': `${url.origin}/en/${bareLegalMatch[1].toLowerCase()}`,
        'Cache-Control': 'public, max-age=86400',
        'X-Edge-Mode': 'LEGAL-REDIRECT',
        'X-Cache-Status': 'BYPASS'
      }
    });
  }
  // Check cache for GET/HEAD requests on Watch and Listing Pages only
  const isHead = request.method === 'HEAD';
  const isGet = request.method === 'GET' || isHead;

  // ── TRAILING SLASH & CASE NORMALIZATION ─────────────────────────────────
  const canonicalRouteRedirect = normalizeCanonicalRouteRedirect(url, pathname, isGet);
  if (canonicalRouteRedirect) return canonicalRouteRedirect;

  const watchRegex = /^\/(?:([a-zA-Z\-]+)\/)?watch(?:\/([^\/]+))?\/?$/;
  const listRegex = /^\/(?:([a-zA-Z\-]+)\/)?(actor|category|tag|studio|trending|recent|actors|categories|studios|popular-actors|watch-later|history|search|dmca|privacy-policy|terms|contact|2257)\/?$/;
  const langRegex = /^\/([a-zA-Z\-]+)?\/?$/;

  const isWatch = pathname.match(watchRegex);
  const isList = pathname.match(listRegex);
  const isLangRoot = pathname.match(langRegex);
  const isCacheableRoute = isGet && (isWatch || isList || isLangRoot);

  // Fast O(1) duplicate-video canonical redirect for both humans and crawlers (0 upstream calls)
  if (isGet && isWatch) {
    const watchLangRaw = isWatch[1] || 'en';
    const watchSlugRaw = isWatch[2] || '';
    if (VALID_LANGS.includes(watchLangRaw) || (!isWatch[1] && watchLangRaw === 'en')) {
      const watchId = extractWatchId(watchSlugRaw, url);
      const dupCanonicalSlug = (typeof DUPLICATE_VIDEO_CANONICAL_MAP !== 'undefined' && watchId)
        ? DUPLICATE_VIDEO_CANONICAL_MAP[String(watchId)]
        : null;
      if (dupCanonicalSlug && dupCanonicalSlug !== watchSlugRaw) {
        return buildDuplicateWatchRedirect(url.origin, watchLangRaw, dupCanonicalSlug);
      }
    }
  }

  // Collapse tracking variants to one stable URL for social-card caches. Human
  // visitors keep the parameters so the client can still record referrals.
  if (isGet && isWatch && isSocialCrawler) {
    const cleanUrl = getCleanPublicUrl(url);
    if (cleanUrl.toString() !== url.toString()) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': cleanUrl.toString(),
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
  }

  if (isCacheableRoute && !isKnownCrawler) {
    const humanPathLangMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/i);
    const humanLang = (humanPathLangMatch && VALID_LANGS.find(l => l.toLowerCase() === humanPathLangMatch[1].toLowerCase())) || 'en';
    return serveHumanShell(context, url.origin, humanLang);
  }

  let cache = null;
  const versionedCacheUrl = getCleanPublicUrl(url);
  versionedCacheUrl.searchParams.set('__ssr', SSR_CACHE_VERSION);
  const pageCacheKey = new Request(versionedCacheUrl.toString(), { method: 'GET' });
  if (isCacheableRoute) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(pageCacheKey);
      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Edge-Mode', isSocialCrawler ? 'SOCIAL-SSR' : 'SEARCH-SSR');
        headers.set('X-Cache-Status', 'HIT');
        return new Response(isHead ? null : cachedResponse.body, { status: cachedResponse.status, headers });
      }
    } catch (e) {
      console.error('[Cache SSR Match Error]', e);
    }
  }
  // 2. Check if this is a Watch page that needs Open Graph tag injection
  const watchMatch = isWatch;

  if (watchMatch) {
    const lang = watchMatch[1] || 'en';
    const slug = watchMatch[2] || '';
    const isLangValid = VALID_LANGS.includes(lang);

    if (isLangValid || (!watchMatch[1] && lang === 'en')) {
      const id = extractWatchId(slug, url);
      const activeLang = isLangValid ? lang : 'en';

      if (!id && isKnownCrawler) {
        return build404Response(url.origin, activeLang, 'WATCH-SSR-404', 'no-store');
      }

      // OPTIMIZED: Fetch index.html and APIJAV metadata in parallel (Promise.all)
      // Previously sequential (~320ms+), now concurrent (~300ms max).
      const [indexResult, metadataResult] = await Promise.all([
        fetchIndexHtmlResilient(env, url.origin, context),
        id ? fetchPostMetadata(id, url.origin, request, context) : Promise.resolve(null)
      ]);

      const post = metadataResult?.post || null;
      if (id && !post && isKnownCrawler) {
        if (metadataResult?.notFound) {
          return build404Response(url.origin, activeLang, 'WATCH-SSR-404', 'no-store');
        }
        return new Response('Video metadata temporarily unavailable', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            'Retry-After': '120',
            'X-Edge-Mode': isSocialCrawler ? 'SOCIAL-SSR' : 'SEARCH-SSR',
            'X-Cache-Status': 'BYPASS'
          }
        });
      }
      const canonicalPath = post ? `/${activeLang}${canonicalWatchPath(post, id)}` : null;
      if (post && isKnownCrawler && isWatchCodeMismatch(slug, id, post.code)) {
        return build404Response(url.origin, activeLang, 'SEARCH-GONE-410', 'public, max-age=3600', 410);
      }
      if (canonicalPath && SEARCH_CRAWLER_REGEX.test(userAgent) && url.pathname !== canonicalPath) {
        return new Response(null, { status: 301, headers: {
          'Location': `${url.origin}${canonicalPath}`,
          'Cache-Control': 'public, max-age=3600', 'X-Edge-Mode': 'SEARCH-REDIRECT', 'X-Cache-Status': 'BYPASS'
        } });
      }

      if (!indexResult.ok) {
        return generate503Response(url.origin, activeLang, isSocialCrawler ? 'SOCIAL-SSR-503' : 'SEARCH-SSR-503');
      }
      let htmlContent = removeDefaultSeoNoscript(indexResult.html);
      htmlContent = htmlContent.replace(/<div class="custom-sponsor-banner"[\s\S]*?<\/div>/gi, '');

      // Stamp <html lang> to match the route's language for crawlers. index.html
      // ships a static lang="id" default; without this the JS-only fix in app.js
      // never reaches non-JS crawlers -> "Hreflang and HTML lang mismatch".
      const watchHtmlLang = hreflangCode(isLangValid ? lang : 'en');
      htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${watchHtmlLang}"`);
      let metadataReady = false;

      if (id) {
        try {
          if (post && post.title) {
            let title = post.title;

            // Fetch full translations row so both active translation and Option 1A hreflang availability are exact
            const translationRow = await getTranslationRow(id, env.SUPABASE_URL, env.SUPABASE_KEY);
            const hasActiveTranslation = activeLang === 'en' || Boolean(
              translationRow && typeof translationRow[activeLang] === 'string' && translationRow[activeLang].trim()
            );
            const watchHreflangs = hasActiveTranslation
              ? VALID_LANGS.filter(l => l === 'en' || Boolean(translationRow && typeof translationRow[l] === 'string' && translationRow[l].trim()))
              : [];

            // Ambil terjemahan judul dari Supabase jika bukan bahasa Inggris
            if (activeLang !== 'en' && hasActiveTranslation) {
              title = translationRow[activeLang].trim();
            }

            const enrichedData = (activeLang === 'en' && typeof SEO_ENRICHED_POSTS !== 'undefined' && SEO_ENRICHED_POSTS[String(id)]?.status === 'enriched')
              ? SEO_ENRICHED_POSTS[String(id)]
              : null;

            const code = post.code || '';
            const { baseCode, editionKey } = extractCodeAndEdition(code);
            const editionLabel = getEditionLabel(editionKey, activeLang);
            const formattedTitle = formatWatchEditionTitle(title, editionKey, activeLang);
            const normalizedCode = String(baseCode).toLowerCase().replace(/[\s_]+/g, '-');
            const normalizedTitle = String(formattedTitle).toLowerCase().replace(/[\s_]+/g, '-');
            const displayCode = normalizedCode && (normalizedTitle === normalizedCode || normalizedTitle.startsWith(`${normalizedCode}-`)) ? '' : baseCode;
            let fullTitle = displayCode ? `[${displayCode}] ${formattedTitle} - MISSAV-J` : `${formattedTitle} - MISSAV-J`;
            
            let actorsStr = '';
            if (post.actors && Array.isArray(post.actors)) {
              actorsStr = post.actors.map(a => typeof a === 'string' ? a : a.name).filter(Boolean).slice(0, 3).join(', ');
            }
            let studioStr = '';
            if (post.studio) {
              studioStr = typeof post.studio === 'string' ? post.studio : (post.studio.name || '');
            }

            const descFn = DESC_TEMPLATES[activeLang] || DESC_TEMPLATES['en'];
            let description = descFn(displayCode, formattedTitle, actorsStr, studioStr);

            if (enrichedData) {
              if (enrichedData.meta_description) {
                description = editionLabel && !titleHasEditionMarker(enrichedData.meta_description, editionKey)
                  ? `${editionLabel} — ${enrichedData.meta_description}`
                  : enrichedData.meta_description;
              }
              if (enrichedData.seo_title) {
                const enrichedTitle = formatWatchEditionTitle(enrichedData.seo_title, editionKey, 'en');
                fullTitle = `${enrichedTitle} — MISSAV-J`;
              }
            }

            let sourceImageUrl = post.thumbnail || '';

            // Langkah 1: Bypass proxy apijav.php → ekstrak URL gambar aslinya
            if (sourceImageUrl.includes('apijav.php?url=')) {
              try {
                const urlObj = new URL(sourceImageUrl);
                const actualUrl = urlObj.searchParams.get('url');
                // Hanya replace jika actualUrl benar-benar valid (bukan string kosong)
                if (actualUrl && (actualUrl.startsWith('http') || actualUrl.startsWith('//'))) {
                  sourceImageUrl = actualUrl;
                }
              } catch (e) {}
            }

            // Langkah 2: Normalisasi protocol-relative URL dan force HTTPS
            // Twitter (Open Graph) mewajibkan absolute URL (https://)
            // Telegram secara otomatis mendeteksi, namun Twitter menolak mentah-mentah `//url.com`.
            if (sourceImageUrl.startsWith('//')) {
              sourceImageUrl = `https:${sourceImageUrl}`;
            } else if (sourceImageUrl.startsWith('http://')) {
              sourceImageUrl = sourceImageUrl.replace(/^http:\/\//i, 'https://');
            }

            // Social crawlers fetch a stable URL on our own domain. The clean
            // path avoids third-party hotlink rules and crawler issues with a
            // nested image URL in a query string.
            const proxiedImageUrl = getSocialImageUrl(sourceImageUrl, url.origin);
            const imageUrl = proxiedImageUrl;

            const pageUrl = canonicalPath ? `${url.origin}${canonicalPath}` : getCleanPublicUrl(url).toString();

            htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(fullTitle)}</title>`);
            htmlContent = htmlContent.replace(
              /<meta name="description" id="meta-description" content="[^"]*"/i,
              () => `<meta name="description" id="meta-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
              () => `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}" data-ssr-watch-id="${escapeHtml(String(id))}" data-watch-hreflangs="${escapeHtml(watchHreflangs.join(','))}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:url" id="og-url" content="[^"]*"/i,
              () => `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:title" id="og-title" content="[^"]*"/i,
              () => `<meta property="og:title" id="og-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:description" id="og-description" content="[^"]*"/i,
              () => `<meta property="og:description" id="og-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:image" id="og-image" content="[^"]*"/i,
              () => `<meta property="og:image" id="og-image" content="${escapeHtml(imageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:type" id="og-type" content="[^"]*"/i,
              '<meta property="og:type" id="og-type" content="video.other"'
            );
            const watchRobots = (activeLang !== 'en' && !hasActiveTranslation)
              ? 'noindex, follow'
              : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
            htmlContent = htmlContent.replace(
              /<meta\b(?=[^>]*\bname="robots")[^>]*>/i,
              `<meta name="robots" content="${watchRobots}">`
            );
            htmlContent = htmlContent.replace(
              /<meta\b(?=[^>]*\bproperty="og:locale")[^>]*>/i,
              () => `<meta property="og:locale" id="og-locale" content="${escapeHtml(getOgLocale(activeLang))}">`
            );
            // Source thumbnails do not all share one size or MIME type. Remove
            // the incorrect static declarations instead of lying to crawlers.
            htmlContent = htmlContent.replace(/\s*<meta property="og:image:(?:width|height|type)"[^>]*>/gi, '');
            htmlContent = htmlContent.replace(
              /<meta property="og:image:alt" content="[^"]*"/i,
              () => `<meta property="og:image:alt" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:card" id="twitter-card" content="[^"]*"/i,
              '<meta name="twitter:card" id="twitter-card" content="summary_large_image"'
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
              () => `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
              () => `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:image" id="twitter-image" content="[^"]*"/i,
              () => `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(imageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:image:alt" id="twitter-image-alt" content="[^"]*"/i,
              () => `<meta name="twitter:image:alt" id="twitter-image-alt" content="${escapeHtml(fullTitle)}"`
            );
            
            const hreflangBlock = generateHreflangTags(url.origin, canonicalPath || url.pathname, '', watchHreflangs);
            if (hreflangBlock) {
              htmlContent = htmlContent.replace(/<\/head>/i, () => `  ${hreflangBlock}\n</head>`);
            }

            

            if (htmlContent.includes('"@type": "WebSite"')) {
              const fallbackEmbedUrl = `https://server.apijav.com/?mvapm_embed=${id}`;
              const rawEmbedUrl = post.embed_url
                ? post.embed_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&').trim()
                : fallbackEmbedUrl;
              const cleanEmbedUrl = /^https?:\/\//i.test(rawEmbedUrl)
                ? rawEmbedUrl.replace(/^http:\/\//i, 'https://')
                : fallbackEmbedUrl;
              const hasValidThumbnail = Boolean(sourceImageUrl && !proxiedImageUrl.endsWith('/assets/images/logo.webp'));
              const isIndexableWatch = watchRobots.startsWith('index');
              const isoDuration = formatDuration(post.duration);
              const actorsList = (Array.isArray(post.actors) ? post.actors : []).map(a => ({
                "@type": "Person",
                "name": typeof a === 'string' ? a : (a.name || a)
              }));
              const genreList = (Array.isArray(post.categories) ? post.categories : [])
                .map(c => resolveCategoryAlias(typeof c === 'string' ? c : (c.name || '')))
                .filter(Boolean);

              let uploadDate = '';
              if (post.date) {
                const parsedDate = new Date(post.date);
                if (!isNaN(parsedDate.getTime())) {
                  uploadDate = parsedDate.toISOString();
                }
              }
              if (!uploadDate) {
                // Stable ISO timestamp fallback prevents uploadDate churn across crawls.
                uploadDate = '2026-01-01T00:00:00.000Z';
              }

              const shouldEmitVideoObject = Boolean(isIndexableWatch && hasValidThumbnail && cleanEmbedUrl);
              let videoSchema = null;
              if (shouldEmitVideoObject) {
                videoSchema = {
                  "@type": "VideoObject",
                  "name": formattedTitle,
                  "description": description,
                  "isFamilyFriendly": false,
                  // Array thumbnailUrl: gunakan URL proxy stabil /img/ agar Googlebot
                  // selalu bisa akses thumbnail (domain kita sendiri, tidak di-block CDN).
                  "thumbnailUrl": [proxiedImageUrl],
                  "uploadDate": uploadDate,
                  // url: URL halaman canonical kita — accessible oleh Googlebot (domain kita sendiri)
                  "url": pageUrl,
                  // embedUrl: URL embed player dari server — Google coba akses ini untuk verifikasi video
                  "embedUrl": cleanEmbedUrl,
                  "publisher": {
                    "@type": "Organization",
                    "name": "MISSAV-J",
                    "url": `${url.origin}/${activeLang}/`,
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://www.missav-j.com/assets/images/logo.webp",
                      "width": 192,
                      "height": 192
                    }
                  },
                  "inLanguage": watchHtmlLang
                };

                if (isoDuration) videoSchema.duration = isoDuration;
                if (post.views) {
                  videoSchema.interactionStatistic = {
                    "@type": "InteractionCounter",
                    "interactionType": { "@type": "WatchAction" },
                    "userInteractionCount": parseInt(post.views) || 0
                  };
                }
                if (actorsList.length > 0) videoSchema.actor = actorsList;
                if (genreList.length > 0) videoSchema.genre = genreList;
                if (post.studio) {
                  videoSchema.productionCompany = {
                    "@type": "Organization",
                    "name": typeof post.studio === 'string' ? post.studio : (post.studio?.name || '')
                  };
                }
              }

              const uiLabels = UI_SSR_LABELS[activeLang] || UI_SSR_LABELS['en'];

              // BreadcrumbList schema: 3-tier hierarchy (Home -> Category/Genre -> Video)
              const primaryCategory = genreList.find(cat => isIndexableTaxonomyTerm('category', cat, activeLang)) || '';
              const breadcrumbElements = [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": uiLabels.home,
                  "item": `${url.origin}/${activeLang}/`
                }
              ];
              if (primaryCategory) {
                breadcrumbElements.push({
                  "@type": "ListItem",
                  "position": 2,
                  "name": primaryCategory,
                  "item": `${url.origin}/${activeLang}/category?name=${encodeURIComponent(primaryCategory)}`
                });
                breadcrumbElements.push({
                  "@type": "ListItem",
                  "position": 3,
                  "name": fullTitle,
                  "item": pageUrl
                });
              } else {
                breadcrumbElements.push({
                  "@type": "ListItem",
                  "position": 2,
                  "name": uiLabels.trending,
                  "item": `${url.origin}/${activeLang}/trending`
                });
                breadcrumbElements.push({
                  "@type": "ListItem",
                  "position": 3,
                  "name": fullTitle,
                  "item": pageUrl
                });
              }

              const breadcrumbSchema = {
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbElements
              };

              // Inject visible content + iframe for first-wave crawler indexing.
              // PENTING: h1 dan p HARUS visible (tidak disembunyikan via CSS).
              // Google menghukum 'width:1px/height:1px' sebagai cloaking (kebijakan webmaster).
              let studioLinkHtml = '';
              if (studioStr) {
                const studioHrefName = resolveStudioAlias(studioStr) || studioStr;
                const studioInner = isIndexableTaxonomyTerm('studio', studioHrefName, activeLang)
                  ? `<a href="/${activeLang}/studio?name=${encodeURIComponent(studioHrefName)}" style="color: #e50914;">${escapeHtml(studioStr)}</a>`
                  : `<span style="color: #ccc;">${escapeHtml(studioStr)}</span>`;
                studioLinkHtml = `<p style="margin: 6px 0;"><strong>${escapeHtml(uiLabels.studioLbl)}</strong> ${studioInner}</p>`;
              }
              let actressesLinksHtml = '';
              if (post.actors && Array.isArray(post.actors) && post.actors.length > 0) {
                const links = post.actors.map(a => {
                  const rawName = typeof a === 'string' ? a : (a.name || '');
                  const aName = decodeBasicEntities(rawName);
                  if (!aName) return '';
                  return isIndexableTaxonomyTerm('actor', aName, activeLang)
                    ? `<a href="/${activeLang}/actor?name=${encodeURIComponent(aName)}" style="color: #e50914;">${escapeHtml(aName)}</a>`
                    : `<span style="color: #ccc;">${escapeHtml(aName)}</span>`;
                }).filter(Boolean).join(', ');
                if (links) actressesLinksHtml = `<p style="margin: 6px 0;"><strong>${escapeHtml(uiLabels.actressesLbl)}</strong> ${links}</p>`;
              }
              let categoriesLinksHtml = '';
              if (genreList.length > 0) {
                const links = genreList.map(cName => (
                  isIndexableTaxonomyTerm('category', cName, activeLang)
                    ? `<a href="/${activeLang}/category?name=${encodeURIComponent(cName)}" style="color: #e50914;">${escapeHtml(cName)}</a>`
                    : `<span style="color: #ccc;">${escapeHtml(cName)}</span>`
                )).join(', ');
                if (links) categoriesLinksHtml = `<p style="margin: 6px 0;"><strong>${escapeHtml(uiLabels.categoriesLbl)}</strong> ${links}</p>`;
              }

              let enrichedHtml = '';
              let activeFaqList = [];
              if (enrichedData) {
                const highlightsHtml = (enrichedData.highlights || []).map(h => `<li style="margin: 4px 0;">${escapeHtml(h)}</li>`).join('');
                const faqHtml = (enrichedData.faq || []).map(f => `<dt style="font-weight: 600; color: #fff; margin-top: 8px;">${escapeHtml(f.q)}</dt><dd style="margin: 4px 0 8px 12px; color: #ccc;">${escapeHtml(f.a)}</dd>`).join('');
                if (Array.isArray(enrichedData.faq)) activeFaqList = enrichedData.faq;

                enrichedHtml = `
                  <section class="video-ai-enrichment" style="margin: 20px 0; padding: 18px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                    <h2 style="font-size: 1.15rem; color: #fff;">Editorial Overview</h2>
                    <p style="line-height: 1.6; color: #ddd;">${escapeHtml(enrichedData.summary || '')}</p>
                    <h3 style="font-size: 1rem; color: #fff; margin-top: 14px;">Feature Highlights</h3>
                    <ul style="color: #ccc; padding-left: 20px;">
                      ${highlightsHtml}
                    </ul>
                    <h3 style="font-size: 1rem; color: #fff; margin-top: 14px;">Frequently Asked Questions</h3>
                    <dl>
                      ${faqHtml}
                    </dl>
                  </section>
                `;
              } else {
                const fallbackFacts = buildWatchFallbackFacts(post, {
                  title: formattedTitle,
                  displayCode,
                  baseCode,
                  editionLabel,
                  actorsStr,
                  studioStr,
                  genreList,
                  isoDuration,
                  uiLabels,
                  activeLang
                });
                enrichedHtml = fallbackFacts.html;
                activeFaqList = fallbackFacts.faqList;
              }

              const graphNodes = videoSchema ? [videoSchema, breadcrumbSchema] : [breadcrumbSchema];
              if (activeFaqList.length > 0) {
                graphNodes.push({
                  "@type": "FAQPage",
                  "mainEntity": activeFaqList.map(f => ({
                    "@type": "Question",
                    "name": f.q,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": f.a
                    }
                  }))
                });
              }

              const structuredData = {
                "@context": "https://schema.org",
                "@graph": graphNodes
              };
              htmlContent = htmlContent.replace(
                /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
                () => `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')}</script>`
              );

              let relatedVideosHtml = '';
              if (SEARCH_CRAWLER_REGEX.test(userAgent)) {
                const relatedPosts = await fetchRelatedWatchPosts(post, id, url.origin, context);
                if (relatedPosts.length > 0) {
                  const relatedTranslations = activeLang !== 'en'
                    ? await getBatchTranslationRows(relatedPosts.map(rp => rp.id), env.SUPABASE_URL, env.SUPABASE_KEY)
                    : {};
                  const relatedItemsHtml = relatedPosts.map(rp => {
                    const rUrl = `/${activeLang}${canonicalWatchPath(rp, rp.id)}`;
                    const rTransRow = relatedTranslations?.[rp.id];
                    const rTranslated = (activeLang !== 'en' && rTransRow && typeof rTransRow[activeLang] === 'string')
                      ? rTransRow[activeLang].trim()
                      : '';
                    const rRawTitle = rTranslated || rp.title || '';
                    const { baseCode: rBaseCode, editionKey: rEditionKey } = extractCodeAndEdition(rp.code);
                    const rFormattedTitle = formatWatchEditionTitle(rRawTitle, rEditionKey, activeLang);
                    const normRCode = String(rBaseCode).toLowerCase().replace(/[\s_]+/g, '-');
                    const normRTitle = String(rFormattedTitle).toLowerCase().replace(/[\s_]+/g, '-');
                    const rDisplayCode = normRCode && (normRTitle === normRCode || normRTitle.startsWith(`${normRCode}-`))
                      ? ''
                      : (rBaseCode || rp.code || '');
                    const rTitle = rDisplayCode ? `[${rDisplayCode}] ${rFormattedTitle}` : rFormattedTitle;
                    return `<li style="margin: 0;"><a href="${escapeHtml(rUrl)}" style="color: #e50914; text-decoration: none; display: block; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">${escapeHtml(rTitle)}</a></li>`;
                  }).join('');
                  relatedVideosHtml = `
          <nav aria-label="Related Videos" style="margin-top: 20px;">
            <h2 style="font-size: 1.05rem; color: #fff; margin-bottom: 10px;">${escapeHtml(uiLabels.relatedHeading)}</h2>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
              ${relatedItemsHtml}
            </ul>
          </nav>`;
                }
              }

              const seoFallbackContent = `
        <div class="seo-fallback" style="display: contents;">
          <h1>${escapeHtml(fullTitle)}</h1>
          <p>${escapeHtml(description)}</p>
          <div style="position: relative; width: 100%; max-width: 960px; aspect-ratio: 16/9; background: #000; margin: 16px 0; border-radius: 8px; overflow: hidden;">
            <iframe
              src="${escapeHtml(cleanEmbedUrl)}"
              title="${escapeHtml(fullTitle)}"
              width="800"
              height="450"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
              allow="autoplay; fullscreen; encrypted-media"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div style="margin: 16px 0;">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(fullTitle)}" width="800" height="450" decoding="async" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem;" />
          </div>
          ${enrichedHtml}
          <nav aria-label="Video Metadata" style="margin-top: 16px; font-size: 0.95rem; line-height: 1.6;">
            ${studioLinkHtml}
            ${actressesLinksHtml}
            ${categoriesLinksHtml}
          </nav>${relatedVideosHtml}
        </div>
              `;
              htmlContent = htmlContent.replace(/<div class="seo-fallback"[^>]*>[\s\S]*?<\/div>/i, () => seoFallbackContent);
            }
            metadataReady = true;
          }
        } catch (err) {
          console.error('[Watch OG Error]', err);
        }
      }

      const isStaleWatch = Boolean(metadataResult?.stale);
      let cacheControl = isStaleWatch
        ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=300'
        : 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400';
      let cdnCacheControl = isStaleWatch ? 'public, max-age=300' : 'public, max-age=604800';
      let shouldCache = !isStaleWatch;

      // Jika fetch API gagal/timeout untuk halaman Watch, JANGAN cache halaman fallback.
      // Jika di-cache, bot media sosial akan terus melihat fallback (logo webp) selama 7 hari.
      if (id && !metadataReady) {
        cacheControl = 'no-store, no-cache, must-revalidate, max-age=0';
        cdnCacheControl = 'no-store';
        shouldCache = false;
        console.warn(`[SSR Warning] Metadata unavailable or incomplete for ${id}. Bypassing cache to prevent poisoning.`);

        // A 200 response containing homepage metadata is permanently misleading
        // for social cards. Ask social crawlers to retry instead.
        if (isSocialCrawler) {
          return new Response('Video metadata temporarily unavailable', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': cacheControl,
              'CDN-Cache-Control': cdnCacheControl,
              'Retry-After': '120',
              'X-Edge-Mode': 'SOCIAL-SSR',
              'X-Cache-Status': 'BYPASS'
            }
          });
        }
      }

      htmlContent = localizeSidebarHtml(htmlContent, activeLang);

      const watchResponseHeaders = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': cacheControl,
        'CDN-Cache-Control': cdnCacheControl,
        'X-Edge-Mode': isSocialCrawler ? 'SOCIAL-SSR' : 'SEARCH-SSR',
        'X-Cache-Status': isStaleWatch ? 'STALE' : 'MISS'
      };
      if (isStaleWatch) {
        watchResponseHeaders['Warning'] = '110 - "Response is Stale"';
        watchResponseHeaders['X-Data-Freshness'] = 'stale';
      }

      const watchResponse = new Response(htmlContent, { headers: watchResponseHeaders });

      if (cache && isCacheableRoute && shouldCache) {
        context.waitUntil?.(cache.put(pageCacheKey, watchResponse.clone()));
      }

      return watchResponse;
    }
  } else {
    // 3. Programmatic SEO for Listing Pages (Actor, Category, Studio, Trending, etc)
    const listMatch = isList || isLangRoot;

    if (listMatch) {
      const lang = listMatch[1] || 'en';
      const type = isList ? listMatch[2] : 'home';
      const isLangValid = VALID_LANGS.includes(lang);

      if (isLangValid || (!listMatch[1] && lang === 'en')) {
        const activeLang = isLangValid ? lang : 'en';
        const nameParam = (url.searchParams.get('name') || '').trim();
        const pageNum = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);

        // Redirect bare taxonomy query routes without ?name= to their directory hubs
        if (['actor', 'category', 'studio', 'tag'].includes(type) && !nameParam) {
          const hubDest = type === 'actor' ? 'actors' : (type === 'studio' ? 'studios' : 'categories');
          return new Response(null, {
            status: 301,
            headers: {
              'Location': `${url.origin}/${activeLang}/${hubDest}`,
              'Cache-Control': 'public, max-age=86400',
              'X-Edge-Mode': 'TAXONOMY-HUB-REDIRECT',
              'X-Cache-Status': 'BYPASS'
            }
          });
        }

        // Consolidate legacy studio aliases (e.g. "S1 NO.1 STYLE" -> "S1") with 301
        if (type === 'studio' && nameParam) {
          const aliasedStudio = resolveStudioAlias(decodeBasicEntities(nameParam));
          if (aliasedStudio && aliasedStudio !== nameParam) {
            const targetBase = `${url.origin}/${activeLang}/studio?name=${encodeURIComponent(aliasedStudio)}`;
            const targetLoc = pageNum > 1 ? appendPageQueryParam(targetBase, pageNum) : targetBase;
            return new Response(null, {
              status: 301,
              headers: {
                'Location': targetLoc,
                'Cache-Control': 'public, max-age=86400',
                'X-Edge-Mode': 'STUDIO-ALIAS-REDIRECT',
                'X-Cache-Status': 'BYPASS'
              }
            });
          }
        }

        // Consolidate dirty scraper-path / duplicate-pair categories (e.g. "En/tokyohot" -> "Tokyohot", "Blonde / Blonde" -> "Blonde") with 301
        if ((type === 'category' || type === 'tag') && nameParam) {
          const decodedCategory = decodeBasicEntities(nameParam);
          const aliasedCategory = resolveCategoryAlias(decodedCategory);
          if (aliasedCategory && aliasedCategory !== decodedCategory) {
            const targetBase = `${url.origin}/${activeLang}/${type}?name=${encodeURIComponent(aliasedCategory)}`;
            const targetLoc = pageNum > 1 ? appendPageQueryParam(targetBase, pageNum) : targetBase;
            return new Response(null, {
              status: 301,
              headers: {
                'Location': targetLoc,
                'Cache-Control': 'public, max-age=86400',
                'X-Edge-Mode': 'CATEGORY-ALIAS-REDIRECT',
                'X-Cache-Status': 'BYPASS'
              }
            });
          }
        }

        // Resolve actual route type from URL pattern
        const typeKey = (type === 'popular-actors') ? 'actors'
          : (type === 'watch-later') ? 'watch_later'
          : (type === 'privacy-policy') ? 'privacy_policy'
          : (type === 'tag') ? 'category'
          : (type || 'home');
        const isVideoListing = ['home', 'trending', 'recent', 'category', 'actor', 'studio', 'tag'].includes(typeKey);
        const isOtherStudio = type === 'studio' && nameParam === 'Other';

        const fetchListingUpstream = async (params) => {
          const sortedParams = new URLSearchParams(params);
          sortedParams.sort();
          const staleKey = cache
            ? new Request(`${url.origin}/__listing-stale/v1?${sortedParams.toString()}`, { method: 'GET' })
            : null;
          const timeouts = [5500, 5500];

          for (let attempt = 0; attempt < timeouts.length; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeouts[attempt]);
            try {
              const apiRes = await fetch(`${TARGET_BASE}/posts?${params.toString()}`, {
                headers: {
                  'Accept': 'application/json',
                  'X-Client-Site': 'https://www.missav-j.com',
                  'User-Agent': 'MISSAV-J-Edge-SSR/1.0'
                },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              if (!apiRes || !apiRes.ok) {
                const status = apiRes?.status || 503;
                try { await apiRes?.body?.cancel?.(); } catch {}
                if ((status === 429 || status >= 500) && attempt + 1 < timeouts.length) {
                  await new Promise(resolve => setTimeout(resolve, 150));
                  continue;
                }
                if (status !== 404 && staleKey) {
                  const staleHit = await cache.match(staleKey).catch(() => null);
                  if (staleHit && staleHit.ok) {
                    const cachedPayload = await staleHit.json().catch(() => null);
                    if (cachedPayload && Array.isArray(cachedPayload.posts)) {
                      return {
                        ok: true,
                        status: 200,
                        posts: cachedPayload.posts,
                        wpTotal: cachedPayload.wpTotal ?? null,
                        wpTotalPages: cachedPayload.wpTotalPages ?? null,
                        stale: true
                      };
                    }
                  }
                }
                return { ok: false, status, posts: [], wpTotal: null, wpTotalPages: null, stale: false };
              }
              const rawPosts = await apiRes.json();
              const postsArr = Array.isArray(rawPosts) ? rawPosts : [];
              const rawTotal = apiRes.headers.get('X-WP-Total');
              const rawPages = apiRes.headers.get('X-WP-TotalPages');
              const parsedTotal = rawTotal !== null ? parseInt(rawTotal, 10) : null;
              const parsedPages = rawPages !== null ? Math.max(1, parseInt(rawPages, 10) || 1) : null;

              if (staleKey && postsArr.length > 0) {
                const stalePayload = JSON.stringify({
                  posts: postsArr,
                  wpTotal: parsedTotal,
                  wpTotalPages: parsedPages
                });
                context.waitUntil?.(
                  cache.put(staleKey, new Response(stalePayload, {
                    headers: {
                      'Content-Type': 'application/json; charset=utf-8',
                      'Cache-Control': `public, max-age=${STALE_BACKUP_TTL_SECONDS}`
                    }
                  })).catch(err => console.warn('[Listing Stale Write Error]', err))
                );
              }

              return {
                ok: true,
                status: apiRes.status,
                posts: postsArr,
                wpTotal: parsedTotal,
                wpTotalPages: parsedPages,
                stale: false
              };
            } catch (err) {
              clearTimeout(timeoutId);
              console.warn(`[Video Catalog SSR Fetch Attempt ${attempt + 1} Error]`, err?.message || err);
              if (attempt + 1 < timeouts.length) {
                await new Promise(resolve => setTimeout(resolve, 150));
                continue;
              }
            }
          }

          if (staleKey) {
            try {
              const staleHit = await cache.match(staleKey);
              if (staleHit && staleHit.ok) {
                const cachedPayload = await staleHit.json().catch(() => null);
                if (cachedPayload && Array.isArray(cachedPayload.posts)) {
                  console.warn(`[Listing Stale Fallback] params=${sortedParams.toString()}`);
                  return {
                    ok: true,
                    status: 200,
                    posts: cachedPayload.posts,
                    wpTotal: cachedPayload.wpTotal ?? null,
                    wpTotalPages: cachedPayload.wpTotalPages ?? null,
                    stale: true
                  };
                }
              }
            } catch (staleErr) {
              console.warn('[Listing Stale Read Error]', staleErr);
            }
          }

          return { ok: false, status: 503, posts: [], wpTotal: null, wpTotalPages: null, stale: false };
        };

        let fetchedPosts = [];
        let wpTotal = null;
        let wpTotalPages = null;
        let isStaleListing = false;

        if (isVideoListing && isKnownCrawler) {
          const apiParams = new URLSearchParams();
          apiParams.set('per_page', isOtherStudio ? '100' : '12');
          if (pageNum > 1) apiParams.set('page', String(pageNum));

          if (type === 'category') {
            apiParams.set('category', nameParam);
          } else if (type === 'tag') {
            apiParams.set('tag', slugifyTaxonomyParam(nameParam) || nameParam);
          } else if (type === 'actor') {
            apiParams.set('actor', nameParam);
          } else if (type === 'studio' && !isOtherStudio) {
            apiParams.set('studio', nameParam);
          } else if (type === 'trending') {
            apiParams.set('sort', 'views');
            apiParams.set('order', 'desc');
          } else if (type === 'recent') {
            apiParams.set('sort', 'release');
            apiParams.set('order', 'desc');
          }

          let upstreamResult = await fetchListingUpstream(apiParams);
          if (!upstreamResult.ok) {
            return generate503Response(url.origin, activeLang, isSocialCrawler ? 'SOCIAL-SSR-503' : 'SEARCH-SSR-503');
          }
          isStaleListing = Boolean(upstreamResult.stale);

          if (isOtherStudio) {
            const untagged = upstreamResult.posts.filter(p => p && p.id && !p.studio);
            fetchedPosts = untagged.slice(0, 12);
            wpTotal = untagged.length > 0 ? 120 : 0;
            wpTotalPages = untagged.length > 0 ? 10 : 1;
          } else {
            fetchedPosts = upstreamResult.posts;
            wpTotal = upstreamResult.wpTotal;
            wpTotalPages = upstreamResult.wpTotalPages;
          }

          // When page 1 of /actor or /studio is empty, attempt alias resolution before returning 404
          if (fetchedPosts.length === 0 && pageNum === 1) {
            if (type === 'actor' && nameParam && !isSpamActorName(decodeBasicEntities(nameParam))) {
              const nameParts = decodeBasicEntities(nameParam).split(/\s+/);
              if (nameParts.length >= 2) {
                const swappedName = [...nameParts].reverse().join(' ');
                const swapCheck = await fetchListingUpstream(new URLSearchParams({ per_page: '1', actor: swappedName }));
                if (swapCheck.ok && swapCheck.posts.length > 0) {
                  return new Response(null, {
                    status: 301,
                    headers: {
                      'Location': `${url.origin}/${activeLang}/actor?name=${encodeURIComponent(swappedName)}`,
                      'Cache-Control': 'public, max-age=86400',
                      'X-Edge-Mode': 'ACTOR-ALIAS-REDIRECT',
                      'X-Cache-Status': 'BYPASS'
                    }
                  });
                }
              }

              const taxData = await fetchCachedTaxonomies(cache);
              const canonicalActor = resolveCanonicalActorTerm(taxData?.actors, nameParam);
              if (canonicalActor && canonicalActor !== nameParam) {
                const verifyCheck = await fetchListingUpstream(new URLSearchParams({ per_page: '1', actor: canonicalActor }));
                if (verifyCheck.ok && verifyCheck.posts.length > 0) {
                  return new Response(null, {
                    status: 301,
                    headers: {
                      'Location': `${url.origin}/${activeLang}/actor?name=${encodeURIComponent(canonicalActor)}`,
                      'Cache-Control': 'public, max-age=86400',
                      'X-Edge-Mode': 'ACTOR-ALIAS-REDIRECT',
                      'X-Cache-Status': 'BYPASS'
                    }
                  });
                }
              }
            } else if (type === 'studio' && nameParam && !isOtherStudio) {
              const taxData = await fetchCachedTaxonomies(cache);
              const canonicalStudio = resolveCanonicalStudioTerm(taxData?.studios, nameParam);
              if (canonicalStudio && canonicalStudio !== nameParam) {
                const verifyStudio = await fetchListingUpstream(new URLSearchParams({ per_page: '1', studio: canonicalStudio }));
                if (verifyStudio.ok && verifyStudio.posts.length > 0) {
                  return new Response(null, {
                    status: 301,
                    headers: {
                      'Location': `${url.origin}/${activeLang}/studio?name=${encodeURIComponent(canonicalStudio)}`,
                      'Cache-Control': 'public, max-age=86400',
                      'X-Edge-Mode': 'STUDIO-ALIAS-REDIRECT',
                      'X-Cache-Status': 'BYPASS'
                    }
                  });
                }
              }
            }
          }

          // Eliminate Soft 404: return genuine HTTP 404 for empty taxonomies or out-of-range pagination
          if (fetchedPosts.length === 0 && (['actor', 'category', 'tag', 'studio'].includes(type) || pageNum > 1)) {
            return build404Response(url.origin, activeLang, 'SEARCH-SSR-404', 'public, max-age=1800, s-maxage=1800');
          }
        }

        const isDynamicTaxonomy = ['actor', 'category', 'tag', 'studio'].includes(type) && Boolean(nameParam);
        let batchTranslations = {};
        if (isVideoListing && isKnownCrawler && fetchedPosts.length > 0 && (activeLang !== 'en' || isDynamicTaxonomy)) {
          batchTranslations = await getBatchTranslationRows(
            fetchedPosts.map(p => p.id),
            env.SUPABASE_URL,
            env.SUPABASE_KEY
          );
        }

        const indexResult = await fetchIndexHtmlResilient(env, url.origin, context);
        if (!indexResult.ok) {
          return generate503Response(url.origin, activeLang, isSocialCrawler ? 'SOCIAL-SSR-503' : 'SEARCH-SSR-503');
        }
        try {
        let htmlContent = removeDefaultSeoNoscript(indexResult.html);
        htmlContent = htmlContent.replace(/<div class="custom-sponsor-banner"[\s\S]*?<\/div>/gi, '');

        // Stamp <html lang> to match the route's language for crawlers (see note
        // in the watch branch above) -> fixes "Hreflang and HTML lang mismatch".
        const listHtmlLang = hreflangCode(activeLang);
        htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${listHtmlLang}"`);

        let pageTitle = 'MISSAV-J';
        let pageDesc = 'MISSAV-J Streaming';
        let schemaType = 'CollectionPage';

        const langDict = SEO_I18N[activeLang] || SEO_I18N['en'];
        const pageTemplate = langDict[typeKey] || SEO_I18N['en'][typeKey] || langDict['default'] || SEO_I18N['en']['default'];
        
        const safeName = nameParam || '';
        const titleName = (type === 'actor') ? truncateChars(nameParam, 49) : safeName;
        const descName = (type === 'actor') ? truncateChars(nameParam, 65) : safeName;
        
        pageTitle = pageTemplate.t.replace(/%s/g, titleName);
        pageDesc = pageTemplate.d.replace(/%s/g, descName);
        
        if (type === 'actor' && nameParam) {
          schemaType = 'ProfilePage';
        } else if (type === 'search') {
          schemaType = 'SearchResultsPage';
        } else if (['dmca', 'privacy-policy', 'terms', 'contact', '2257'].includes(type)) {
          schemaType = 'AboutPage';
        }

        const pageUrl = getCleanListingCanonical(url.origin, activeLang, type, nameParam);

        // Translation-gated multi-locale indexing (Option 1A extended to dynamic taxonomies)
        const minTranslatedCount = Math.min(3, fetchedPosts.length);
        const isEnglishSpecificCat = (type === 'category' || type === 'tag') && ENGLISH_SPECIFIC_CATEGORIES.has(String(safeName).toLowerCase());
        const translatedCountForLocale = (langKey) => {
          if (langKey === 'en') return fetchedPosts.length;
          if (isEnglishSpecificCat) return 0;
          let count = 0;
          for (const p of fetchedPosts) {
            const row = batchTranslations?.[p.id];
            if (row && typeof row[langKey] === 'string' && row[langKey].trim()) count += 1;
          }
          return count;
        };
        const isUntranslatedTaxonomyLocale = isDynamicTaxonomy && fetchedPosts.length > 0 && activeLang !== 'en' && (
          isEnglishSpecificCat || translatedCountForLocale(activeLang) < minTranslatedCount
        );
        
        // Index Bloat Control & Pagination Signals
        const isPagination = pageNum > 1;
        const isPrivateOrInternal = ['search', 'history', 'watch-later', 'watch_later'].includes(typeKey);
        const isThinActor = type === 'actor' && nameParam && isSpamActorName(decodeBasicEntities(nameParam));
        const isThinTaxonomy = isOtherStudio || isThinActor || (['actor', 'tag', 'category', 'studio'].includes(type) && wpTotal !== null && wpTotal > 0 && wpTotal < TAXONOMY_MIN_INDEXABLE_VIDEOS);
        const isNoindexRoute = isPagination || isPrivateOrInternal || isThinTaxonomy || isUntranslatedTaxonomyLocale;
        const hasNextPage = isVideoListing && fetchedPosts.length > 0 && (
          wpTotalPages !== null ? pageNum < wpTotalPages : fetchedPosts.length >= 12
        );

        if (isNoindexRoute) {
          htmlContent = htmlContent.replace(
            /<meta name="robots"[^>]*>/i,
            '<meta name="robots" content="noindex, follow">'
          );
        } else {
          htmlContent = htmlContent.replace(
            /<meta name="robots"[^>]*>/i,
            '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'
          );
        }

        // Pagination rel=prev and rel=next link elements using %20-safe canonical base
        let paginationRelTags = '';
        if (isPagination) {
          const prevHref = pageNum > 2 ? appendPageQueryParam(pageUrl, pageNum - 1) : pageUrl;
          paginationRelTags += `<link rel="prev" href="${escapeHtml(prevHref)}" />\n  `;
        }
        if (hasNextPage) {
          const nextHref = appendPageQueryParam(pageUrl, pageNum + 1);
          paginationRelTags += `<link rel="next" href="${escapeHtml(nextHref)}" />\n  `;
        }

        htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(pageTitle)}<\/title>`);
        htmlContent = htmlContent.replace(
          /<meta name="description" id="meta-description" content="[^"]*"/i,
          () => `<meta name="description" id="meta-description" content="${escapeHtml(pageDesc)}"`
        );
        htmlContent = htmlContent.replace(
          /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
          () => `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:url" id="og-url" content="[^"]*"/i,
          () => `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:title" id="og-title" content="[^"]*"/i,
          () => `<meta property="og:title" id="og-title" content="${escapeHtml(pageTitle)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:description" id="og-description" content="[^"]*"/i,
          () => `<meta property="og:description" id="og-description" content="${escapeHtml(pageDesc)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta\b(?=[^>]*\bproperty="og:locale")[^>]*>/i,
          () => `<meta property="og:locale" id="og-locale" content="${escapeHtml(getOgLocale(activeLang))}">`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
          () => `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(pageTitle)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
          () => `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(pageDesc)}"`
        );
        
        let hreflangBlock = '';
        if (!isNoindexRoute) {
          const allowedTaxonomyLangs = (isDynamicTaxonomy && fetchedPosts.length > 0)
            ? VALID_LANGS.filter(l => l === 'en' || (!isEnglishSpecificCat && translatedCountForLocale(l) >= minTranslatedCount))
            : VALID_LANGS;
          hreflangBlock = generateHreflangTags(url.origin, url.pathname, url.search, allowedTaxonomyLangs) + '\n  ';
        }
        htmlContent = htmlContent.replace(/<\/head>/i, () => `  ${paginationRelTags}${hreflangBlock}<\/head>`);

        let structuredData;
        if (type === 'home') {
          const webSiteSchema = {
            "@type": "WebSite",
            "name": "MISSAV-J",
            "alternateName": "MISSAV-J Premium Video Streaming",
            "url": `${url.origin}/${activeLang}/`,
            "description": pageDesc,
            "inLanguage": hreflangCode(activeLang),
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${url.origin}/${activeLang}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          };

          const organizationSchema = {
            "@type": "Organization",
            "name": "MISSAV-J",
            "url": `${url.origin}/${activeLang}/`,
            "logo": {
              "@type": "ImageObject",
              "url": `${url.origin}/assets/images/logo.webp`,
              "width": 192,
              "height": 192
            },
            "sameAs": [
              "https://t.me/missav_j"
            ]
          };

          structuredData = {
            "@context": "https://schema.org",
            "@graph": [webSiteSchema, organizationSchema]
          };
        } else {
          // JSON-LD ItemList / ProfilePage / CollectionPage / SearchResultsPage / AboutPage
          const listLang = hreflangCode(activeLang);
          let schemaJson = {};
          if (schemaType === 'ProfilePage' && nameParam) {
            schemaJson = {
              "@type": "ProfilePage",
              "name": pageTitle,
              "description": pageDesc,
              "url": pageUrl,
              "inLanguage": listLang,
              "mainEntity": {
                "@type": "Person",
                "name": nameParam,
                "url": pageUrl
              }
            };
          } else if (schemaType === 'SearchResultsPage') {
            schemaJson = {
              "@type": "SearchResultsPage",
              "name": pageTitle,
              "description": pageDesc,
              "url": pageUrl,
              "inLanguage": listLang
            };
          } else if (schemaType === 'AboutPage') {
            schemaJson = {
              "@type": "AboutPage",
              "name": pageTitle,
              "description": pageDesc,
              "url": pageUrl,
              "inLanguage": listLang
            };
          } else {
            schemaJson = {
              "@type": "CollectionPage",
              "name": pageTitle,
              "description": pageDesc,
              "url": pageUrl,
              "inLanguage": listLang
            };
          }

          const listLabels = UI_SSR_LABELS[activeLang] || UI_SSR_LABELS['en'];
          // Build exact 2 or 3-tier BreadcrumbList
          const breadcrumbElements = [
            {
              "@type": "ListItem",
              "position": 1,
              "name": listLabels.home,
              "item": `${url.origin}/${activeLang}/`
            }
          ];

          if (['category', 'tag'].includes(type) && nameParam) {
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 2,
              "name": listLabels.categories,
              "item": `${url.origin}/${activeLang}/categories`
            });
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 3,
              "name": nameParam,
              "item": pageUrl
            });
          } else if (type === 'actor' && nameParam) {
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 2,
              "name": listLabels.actresses,
              "item": `${url.origin}/${activeLang}/actors`
            });
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 3,
              "name": nameParam,
              "item": pageUrl
            });
          } else if (type === 'studio' && nameParam) {
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 2,
              "name": listLabels.studios,
              "item": `${url.origin}/${activeLang}/studios`
            });
            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 3,
              "name": nameParam,
              "item": pageUrl
            });
          } else {
            let hubName = type.charAt(0).toUpperCase() + type.slice(1);
            if (type === 'actors') hubName = listLabels.actresses;
            if (type === 'categories') hubName = listLabels.categories;
            if (type === 'studios') hubName = listLabels.studios;
            if (type === 'trending') hubName = listLabels.trending;
            if (type === 'recent') hubName = listLabels.recent;
            if (type === 'popular-actors') hubName = 'Popular Actresses';
            if (type === 'dmca') hubName = 'DMCA Policy';
            if (type === '2257') hubName = '18 U.S.C. 2257';
            if (type === 'privacy-policy') hubName = 'Privacy Policy';
            if (type === 'terms') hubName = 'Terms of Service';
            if (type === 'contact') hubName = 'Contact Us';

            breadcrumbElements.push({
              "@type": "ListItem",
              "position": 2,
              "name": hubName,
              "item": pageUrl
            });
          }

          const breadcrumbSchema = {
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbElements
          };

          const graphNodes = [schemaJson, breadcrumbSchema];

          // ItemList for video directory and category listing
          if (['category', 'tag', 'categories', 'actor', 'actors', 'studio', 'studios', 'trending', 'recent'].includes(type)) {
            const itemListSchema = {
              "@type": "ItemList",
              "name": pageTitle,
              "description": pageDesc,
              "url": pageUrl
            };
            if (isVideoListing && fetchedPosts.length > 0) {
              itemListSchema.numberOfItems = wpTotal || fetchedPosts.length;
              itemListSchema.itemListElement = fetchedPosts.slice(0, 12).map((p, idx) => {
                const tRow = batchTranslations?.[p.id];
                const tTitle = (activeLang !== 'en' && tRow && typeof tRow[activeLang] === 'string') ? tRow[activeLang].trim() : '';
                return {
                  "@type": "ListItem",
                  "position": idx + 1,
                  "url": `${url.origin}/${activeLang}${canonicalWatchPath(p, p.id)}`,
                  "name": tTitle || p.title || p.code || String(p.id)
                };
              });
            }
            graphNodes.push(itemListSchema);
          }

          structuredData = {
            "@context": "https://schema.org",
            "@graph": graphNodes
          };
        }
        
        htmlContent = htmlContent.replace(
          /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/is,
          () => `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')}</script>`
        );
        
        // On the /actors directory hub, inject a real crawlable <a> list of every
        // actor into the server-side fallback. Actor links are otherwise built only
        // by client JS, so non-JS crawlers never see an internal link into any
        // /actor?name=... page -> 1,744 indexable "Orphan page" errors. This gives
        // every actor page one incoming internal link from an indexable hub.
        let actorLinksHtml = '';
        if (type === 'actors') {
          try {
            const actorsRes = await env.ASSETS.fetch(new URL('/api/actors.json', request.url));
            if (actorsRes.ok) {
              const actorNames = await actorsRes.json();
              if (Array.isArray(actorNames)) {
                const groups = new Map();
                for (const n of actorNames) {
                  if (typeof n !== 'string' || n.trim() === '') continue;
                  const clean = n.trim();
                  const firstChar = clean.charAt(0).toUpperCase();
                  const bucket = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
                  if (!groups.has(bucket)) groups.set(bucket, []);
                  groups.get(bucket).push(`<li><a href="/${activeLang}/actor?name=${encodeURIComponent(clean)}">${escapeHtml(clean)}</a></li>`);
                }
                const sortedKeys = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
                const sectionsHtml = sortedKeys
                  .map(letter => `<section><h2>${escapeHtml(letter)}</h2><ul>${groups.get(letter).join('')}</ul></section>`)
                  .join('');
                actorLinksHtml = `<nav aria-label="All actors">${sectionsHtml}</nav>`;
              }
            }
          } catch (err) {
            console.error('[Actor Directory Error]', err);
          }
        }

        // Hub pages: Categories directory
        let categoryLinksHtml = '';
        if (type === 'categories') {
          try {
            const catRes = await env.ASSETS.fetch(new URL('/api/categories.json', request.url));
            if (catRes.ok) {
              const catNames = await catRes.json();
              if (Array.isArray(catNames)) {
                const items = catNames
                  .filter(c => typeof c === 'string' && c.trim() !== '')
                  .map(c => `<li><a href="/${activeLang}/category?name=${encodeURIComponent(c)}">${escapeHtml(c)}</a></li>`)
                  .join('');
                categoryLinksHtml = `<nav aria-label="All categories" style="margin-top: 16px;"><ul>${items}</ul></nav>`;
              }
            }
          } catch (err) {
            console.error('[Category Directory Error]', err);
          }
        }

        // Hub pages: Studios directory (verified active upstream studios only)
        let studioLinksHtml = '';
        if (type === 'studios') {
          const items = ACTIVE_POPULAR_STUDIOS
            .map(s => `<li><a href="/${activeLang}/studio?name=${encodeURIComponent(s)}">${escapeHtml(s)}</a></li>`)
            .join('');
          studioLinksHtml = `<nav aria-label="All studios" style="margin-top: 16px;"><ul>${items}</ul></nav>`;
        }

        // Legal content injection
        const legalPageKey = (type === 'privacy-policy') ? 'privacy-policy'
          : (type === 'terms') ? 'terms'
          : (type === 'dmca') ? 'dmca'
          : (type === 'contact') ? 'contact'
          : (type === '2257') ? '2257'
          : null;
        const legalHtml = legalPageKey ? (LEGAL_SSR_HTML[legalPageKey] || '') : '';

        // Crawlable Video Catalog for Listing Pages (pre-fetched above to enforce HTTP 404/503 and thin taxonomy signals)
        let videoCatalogHtml = '';
        if (isVideoListing && isKnownCrawler && fetchedPosts.length > 0) {
          const items = fetchedPosts.map(p => {
            const vUrl = `/${activeLang}${canonicalWatchPath(p, p.id)}`;
            const imgUrl = getSocialImageUrl(p.thumbnail, url.origin);
            const tRow = batchTranslations?.[p.id];
            const translatedTitle = (activeLang !== 'en' && tRow && typeof tRow[activeLang] === 'string')
              ? tRow[activeLang].trim()
              : '';
            const pTitle = translatedTitle || p.title || '';
            const code = p.code ? `[${escapeHtml(p.code)}] ` : '';
            return `<li style="margin-bottom: 16px;"><article><a href="${vUrl}"><img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(pTitle)}" width="320" height="180" loading="lazy" decoding="async" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px;" /><h2 style="font-size: 0.95rem; margin: 6px 0;">${code}${escapeHtml(pTitle)}</h2></a></article></li>`;
          }).join('');

          const nextRelPath = hasNextPage
            ? appendPageQueryParam(pageUrl, pageNum + 1).slice(url.origin.length)
            : '';
          const paginationNavHtml = hasNextPage ? `
            <nav class="pagination-nav" aria-label="Pagination" style="margin-top: 24px; text-align: center;">
              <a href="${escapeHtml(nextRelPath)}" rel="next" style="display: inline-block; padding: 8px 18px; background: #e50914; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">Next Page »</a>
            </nav>` : '';

          videoCatalogHtml = `
            <nav aria-label="Video Catalog" style="margin-top: 20px;">
              <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
                ${items}
              </ul>
              ${paginationNavHtml}
            </nav>
          `;
        }

        const hubGuideHtml = getHubGuideHtml(nameParam, activeLang);
        const overviewLabels = UI_SSR_LABELS[activeLang] || UI_SSR_LABELS['en'];
        const taxonomyOverviewHtml = (isDynamicTaxonomy && isKnownCrawler && fetchedPosts.length > 0)
          ? buildTaxonomyOverviewHtml({
              type,
              nameParam,
              activeLang,
              wpTotal,
              posts: fetchedPosts,
              labels: overviewLabels
            })
          : '';

        // Inject fallback h1 text (+ crawlable actor/category/studio directories, legal content, video catalog)
        const seoFallbackContent = `
          <div class="seo-fallback" style="display: contents;">
            <h1>${escapeHtml(pageTitle)}</h1>
            <p>${escapeHtml(pageDesc)}</p>
            ${hubGuideHtml}
            ${taxonomyOverviewHtml}
            ${actorLinksHtml}
            ${categoryLinksHtml}
            ${studioLinksHtml}
            ${legalHtml}
            ${videoCatalogHtml}
          </div>
        `;
        // Function replacer: actor names may contain `$`, which is special in a
        // string replacement ($&, $1, ...). A function value is inserted verbatim.
        htmlContent = htmlContent.replace(/<div class="seo-fallback"[^>]*>[\s\S]*?<\/div>/i, () => seoFallbackContent);
        htmlContent = localizeSidebarHtml(htmlContent, activeLang);

        const listResponseHeaders = {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': isStaleListing
            ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=300'
            : 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400',
          'CDN-Cache-Control': isStaleListing ? 'public, max-age=300' : 'public, max-age=604800',
          'X-Edge-Mode': isSocialCrawler ? 'SOCIAL-SSR' : 'SEARCH-SSR',
          'X-Cache-Status': isStaleListing ? 'STALE' : 'MISS'
        };
        if (isStaleListing) {
          listResponseHeaders['Warning'] = '110 - "Response is Stale"';
          listResponseHeaders['X-Data-Freshness'] = 'stale';
        }

        const listResponse = new Response(htmlContent, { headers: listResponseHeaders });

        if (cache && isCacheableRoute && !isStaleListing) {
          context.waitUntil?.(cache.put(pageCacheKey, listResponse.clone()));
        }

        return listResponse;
        } catch (listErr) {
          console.error('[Listing SSR Render Error]', listErr);
          return generate503Response(url.origin, activeLang, isSocialCrawler ? 'SOCIAL-SSR-503' : 'SEARCH-SSR-503');
        }
      }
    }
  }

  // 4. Fallback SPA routing & Genuine 404 Status (fixes Soft 404 traps in GSC)
  const pathLangMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/i);
  const matchedErrLang = pathLangMatch
    ? VALID_LANGS.find(l => l.toLowerCase() === pathLangMatch[1].toLowerCase())
    : null;
  const errLang = matchedErrLang || 'en';

  const lastSegment = pathname.split('/').pop() || '';
  const dotIdx = lastSegment.lastIndexOf('.');
  const ext = dotIdx > 0 ? lastSegment.slice(dotIdx + 1).toLowerCase() : '';
  const hasExtension = Boolean(ext && ext.length <= 5 && /^[a-z0-9]+$/.test(ext));

  if (!pathname.startsWith('/api') && !hasExtension) {
    // Check if this might be a root legal route without lang prefix: e.g. /dmca, /2257, /privacy-policy, /terms, /contact
    const legalMatch = pathname.match(/^\/(dmca|privacy-policy|terms|contact|2257)\/?$/i);
    if (legalMatch) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': `${url.origin}/en/${legalMatch[1].toLowerCase()}`,
          'Cache-Control': 'public, max-age=86400',
          'X-Edge-Mode': 'LEGAL-REDIRECT',
          'X-Cache-Status': 'BYPASS'
        }
      });
    }

    // Return genuine 404 HTTP status directly for unknown extensionless routes so
    // Cloudflare Pages' SPA fallback (200 OK index.html) never leaks Soft 404s.
    return build404Response(url.origin, errLang, 'NOT-FOUND-404', 'public, max-age=3600');
  }

  let res;
  try {
    res = await env.ASSETS.fetch(request);
  } catch (assetErr) {
    console.warn('[Fallback Asset Fetch Error]', assetErr?.message || assetErr);
    return generate503Response(url.origin, errLang, 'ASSET-503');
  }
  const contentType = (res.headers.get('Content-Type') || '').toLowerCase();
  const isHtmlExt = ext === 'html' || ext === 'htm';
  if (!pathname.startsWith('/api') && (res.status === 404 || (!isHtmlExt && contentType.includes('text/html')))) {
    return build404Response(url.origin, errLang, 'NOT-FOUND-404', 'public, max-age=3600');
  }

  return res;
}
