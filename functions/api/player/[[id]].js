/**
 * MISSAV-J — Cloudflare Pages Function Caching Proxy (/api/player)
 * Menjembatani front-end dengan REST API player apiJAV.
 */

// API Primary & Fallback — jika API 1 (server.apijav.com) mati, otomatis coba API 2 (apijav.kantotph.com)
const API_BASES = [
  'https://server.apijav.com/wp-json/myvideo/v1',
  'https://apijav.kantotph.com/wp-json/myvideo/v1'
];


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

    // Coba setiap API base secara berurutan (Primary → Fallback)
    let data = null;
    let lastError = null;

    for (let i = 0; i < API_BASES.length; i++) {
      const base = API_BASES[i];
      const currentUrl = `${base}/player/${id}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(currentUrl, {
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

        if (response.ok) {
          data = await response.json();
          if (i > 0) console.info(`[API Player] Fallback API base ${i+1} (${base}) succeeded for ID ${id}.`);
          break; // Berhasil, hentikan loop
        }

        // Response tidak OK — catat dan coba fallback
        lastError = new Error(`API base ${i+1} returned ${response.status}: ${response.statusText}`);
        console.warn(`[API Player] ${lastError.message} for ID ${id}, trying next...`);

      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        console.warn(`[API Player] API base ${i+1} (${base}) failed for ID ${id}: ${err.message}, trying next...`);
      }
    }

    if (!data) {
      // Semua API base gagal
      return new Response(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'All player API servers did not respond. Server is under maintenance.'
      }), {
        status: 504,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }

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
