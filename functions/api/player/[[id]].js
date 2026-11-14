/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/player)
 * Menjembatani front-end dengan REST API player apiJAV.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const PLAYER_TTL_SECONDS = 60 * 60;
const STALE_PLAYER_TTL_SECONDS = 30 * 24 * 60 * 60;
const inFlightRequests = new Map();
const VALID_LANGS = new Set(['zh-tw', 'zh-cn', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt']);

function buildStalePlayerKey(cacheKey) {
  if (!cacheKey) return null;
  const staleUrl = new URL(cacheKey.url);
  staleUrl.searchParams.set('__stale_backup', '1');
  return new Request(staleUrl.toString(), { method: 'GET' });
}

async function fetchPlayerJsonWithRetry(targetUrl, requestHeaders) {
  const timeouts = [10000, 8000];
  for (let i = 0; i < timeouts.length; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeouts[i]);
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
        if ((status === 429 || status >= 500) && i + 1 < timeouts.length) {
          await new Promise(resolve => setTimeout(resolve, 150));
          continue;
        }
        return { ok: false, status, statusText, timedOut: false };
      }
      const data = await response.json();
      return { ok: true, status: 200, data };
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      if (i + 1 < timeouts.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
        continue;
      }
      return {
        ok: false,
        status: isAbort ? 504 : 502,
        statusText: isAbort ? 'Upstream Player API server did not respond in time.' : (err?.message || 'Upstream fetch error'),
        timedOut: isAbort
      };
    }
  }
  return { ok: false, status: 502, statusText: 'Upstream fetch error', timedOut: false };
}

async function readStalePlayer(cache, staleCacheKey, corsHeaders) {
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
    headers.set('X-Edge-Mode', 'API-PLAYER');
    return new Response(stale.body, { status: 200, headers });
  } catch (err) {
    console.warn('[Stale Player Cache Read Error]', err);
    return null;
  }
}

function normalizeRequest(request, routeId) {
  const source = new URL(request.url);
  for (const key of source.searchParams.keys()) {
    if (key !== 'id' && key !== 'lang') return { error: `Unsupported query parameter: ${key}` };
    if (source.searchParams.getAll(key).length !== 1) return { error: `Duplicate query parameter: ${key}` };
  }
  const queryId = source.searchParams.get('id');
  if (routeId && queryId && routeId !== queryId) return { error: 'Conflicting video ID' };
  const id = routeId || queryId;
  if (!id || !/^\d+$/.test(id)) return { error: 'Invalid or missing video ID' };
  const lang = source.searchParams.get('lang');
  if (lang && !VALID_LANGS.has(lang.toLowerCase())) return { error: 'Invalid language' };
  return {
    id,
    cacheKey: new Request(`${source.origin}/api/player/${id}`, { method: 'GET' })
  };
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
        'X-Edge-Mode': 'API-PLAYER'
      }
    });
  }
  const cacheKey = isRead ? normalized.cacheKey : null;
  const staleCacheKey = isRead ? buildStalePlayerKey(cacheKey) : null;
  let cache = null;
  let cachedResponse = null;
  if (isRead) {
    try {
      cache = caches.default;
      cachedResponse = await cache.match(cacheKey);
    } catch (e) {
      console.error('[Cache Player Match Error]', e);
    }
  }

  const processUpstream = async () => {
  try {
    const id = normalized.id;

    const clientSite = request.headers.get('x-client-site') || 'https://www.missav-j.com';
    const clientIp = request.headers.get('cf-connecting-ip') || '';
    const targetUrl = `${TARGET_BASE}/player/${id}`;
    const upstreamRes = await fetchPlayerJsonWithRetry(targetUrl, {
      'Accept': 'application/json',
      'X-Client-Site': clientSite,
      'Referer': 'https://www.missav-j.com/',
      'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'X-Forwarded-For': clientIp,
      'CF-Connecting-IP': clientIp
    });

    if (!upstreamRes.ok) {
      if (upstreamRes.timedOut || upstreamRes.status === 429 || upstreamRes.status >= 500) {
        const staleResp = await readStalePlayer(cache, staleCacheKey, corsHeaders);
        if (staleResp) return staleResp;
      }
      return new Response(JSON.stringify({
        error: upstreamRes.timedOut ? 'Gateway Timeout' : 'Player API Error',
        message: upstreamRes.statusText
      }), {
        status: upstreamRes.status || 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          ...(upstreamRes.timedOut || upstreamRes.status === 429 || upstreamRes.status >= 500 ? { 'Retry-After': '60' } : {})
        }
      });
    }

    const data = upstreamRes.data;

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${PLAYER_TTL_SECONDS}`,
      'X-Cache-Status': isRead ? 'MISS' : 'BYPASS',
      'X-Edge-Mode': 'API-PLAYER'
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('[Cloudflare Worker player Error]', error);
    const staleResp = await readStalePlayer(cache, staleCacheKey, corsHeaders);
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
    finalResp.headers.set('X-Edge-Mode', 'API-PLAYER');
    return finalResp;
  }

  if (!isRead) {
    const response = await processUpstream();
    response.headers.set('X-Cache-Status', 'BYPASS');
    response.headers.set('X-Edge-Mode', 'API-PLAYER');
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
            staleHeaders.set('Cache-Control', `public, max-age=${STALE_PLAYER_TTL_SECONDS}`);
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
  response.headers.set('X-Edge-Mode', 'API-PLAYER');
  return toClientResponse(response);
  } catch (fatalErr) {
    console.error('[API Player Fatal Error]', fatalErr);
    return new Response(JSON.stringify({
      error: 'Service Temporarily Unavailable',
      message: fatalErr?.message || 'Unexpected player proxy error'
    }), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
        'X-Edge-Mode': 'API-PLAYER-503'
      }
    });
  }
}
