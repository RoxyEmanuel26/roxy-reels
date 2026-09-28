/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/player)
 * Menjembatani front-end dengan REST API player apiJAV.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const PLAYER_TTL_SECONDS = 60 * 60;
const inFlightRequests = new Map();
const VALID_LANGS = new Set(['zh-tw', 'zh-cn', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt']);

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Client-Site',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const isGet = request.method === 'GET';
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
  const cacheKey = isGet ? normalized.cacheKey : null;
  let cache = null;
  let cachedResponse = null;
  if (isGet) {
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

    const targetUrl = `${TARGET_BASE}/player/${id}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Client-Site': clientSite,
          'Referer': 'https://www.missav-j.com/',
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'X-Forwarded-For': request.headers.get('cf-connecting-ip') || '',
          'CF-Connecting-IP': request.headers.get('cf-connecting-ip') || ''
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'Upstream Player API server did not respond in time.'
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
        error: 'Player API Error',
        message: response.statusText
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }

    const data = await response.json();

    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${PLAYER_TTL_SECONDS}`,
      'X-Cache-Status': isGet ? 'MISS' : 'BYPASS',
      'X-Edge-Mode': 'API-PLAYER'
    };

    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

    return responseToReturn;

  } catch (error) {
    console.error('[Cloudflare Worker player Error]', error);
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
  };

  if (cachedResponse && cachedResponse.ok) {
    const finalResp = new Response(cachedResponse.body, cachedResponse);
    finalResp.headers.set('X-Cache-Status', 'HIT');
    finalResp.headers.set('X-Edge-Mode', 'API-PLAYER');
    return finalResp;
  }

  if (!isGet) {
    const response = await processUpstream();
    response.headers.set('X-Cache-Status', 'BYPASS');
    response.headers.set('X-Edge-Mode', 'API-PLAYER');
    return response;
  }

  const inFlightKey = cacheKey.url;
  let responsePromise = inFlightRequests.get(inFlightKey);
  if (!responsePromise) {
    responsePromise = processUpstream()
      .then(response => {
        if (response.ok && cache) {
          context.waitUntil(cache.put(cacheKey, response.clone()));
        }
        return response;
      })
      .finally(() => inFlightRequests.delete(inFlightKey));
    inFlightRequests.set(inFlightKey, responsePromise);
  }

  const response = (await responsePromise).clone();
  response.headers.set('X-Cache-Status', 'MISS');
  response.headers.set('X-Edge-Mode', 'API-PLAYER');
  return response;
}
