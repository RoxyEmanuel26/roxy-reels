/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/player)
 * Menjembatani front-end dengan REST API player apiJAV.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';

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
      console.error('[Cache Player Match Error]', e);
    }
  }

  try {
    const url = new URL(request.url);
    
    let id = null;
    if (params.id && params.id.length > 0) {
      id = params.id[0];
    }
    const idQuery = url.searchParams.get('id');
    id = id || idQuery;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request', 
        message: 'Dynamic parameter video ID wajib disertakan' 
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }

    const targetUrl = `${TARGET_BASE}/player/${id}`;
    const clientSite = request.headers.get('x-client-site') || 'https://www.missav-j.com';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(targetUrl, {
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
        message: 'Player API upstream server did not respond in time.'
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
        error: 'WordPress REST Player Error',
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
      'Cache-Control': 'public, max-age=0, s-maxage=604800, stale-while-revalidate=86400'
    };

    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

    if (cache && isGet) {
      context.waitUntil(cache.put(request, responseToReturn.clone()));
    }

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
}
