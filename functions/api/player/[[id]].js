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
    const clientSite = request.headers.get('x-client-site') || 'https://missav-j.vercel.app';

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': clientSite
      }
    });

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
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });

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
