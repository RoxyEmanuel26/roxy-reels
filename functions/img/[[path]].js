/**
 * Stable social-image proxy: /img/<base64url-source>.jpg
 *
 * The source URL is kept out of the query string because social crawlers cache
 * and parse these URLs more reliably. Only explicitly approved HTTPS image
 * hosts and raster content types are accepted.
 */

const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOMAINS = [
  'fourhoi.com',
  'image.apijav.com',
  'server.apijav.com',
  'server.appjav.com',
  'surrit.com',
  'media.surrit.com',
  'dmm.co.jp',
  'dmm.com',
  'pics.dmm.co.jp',
  'cc3001.dmm.co.jp',
  'fourhoi.mrstcdn.store',
  'mrstcdn.store',
  'mrstcdn.com'
];

function isAllowedTarget(url) {
  return url.protocol === 'https:' && ALLOWED_DOMAINS.some(domain =>
    url.hostname === domain || url.hostname.endsWith(`.${domain}`)
  );
}

function decodeTarget(pathParts) {
  if (!pathParts || pathParts.length !== 1) return null;
  const pathParam = pathParts[0];
  const extensionIndex = pathParam.lastIndexOf('.');
  const encoded = extensionIndex > 0 ? pathParam.slice(0, extensionIndex) : pathParam;
  if (!encoded || encoded.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;

  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    base64 += '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const target = new URL(new TextDecoder().decode(bytes));
    return isAllowedTarget(target) ? target : null;
  } catch (err) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'GET, HEAD, OPTIONS' }
    });
  }

  const target = decodeTarget(params.path);
  if (!target) return new Response('Invalid image path', { status: 400 });

  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: 'GET' });
  const staleUrl = new URL(request.url);
  staleUrl.searchParams.set('__stale_backup', '1');
  const staleCacheKey = new Request(staleUrl.toString(), { method: 'GET' });
  try {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', 'HIT');
      headers.set('X-Edge-Mode', 'IMAGE-PROXY');
      return request.method === 'HEAD'
        ? new Response(null, { status: cached.status, headers })
        : new Response(cached.body, { status: cached.status, headers });
    }
  } catch (err) {
    console.warn('[Social Image Cache Read Error]', err);
  }

  const serveStaleImage = async () => {
    try {
      const stale = await cache.match(staleCacheKey);
      if (!stale || !stale.ok) return null;
      const headers = new Headers(stale.headers);
      headers.set('Cache-Control', 'public, max-age=300');
      headers.set('X-Cache-Status', 'STALE');
      headers.set('X-Data-Freshness', 'stale');
      headers.set('X-Edge-Mode', 'IMAGE-PROXY');
      return request.method === 'HEAD'
        ? new Response(null, { status: 200, headers })
        : new Response(stale.body, { status: 200, headers });
    } catch {
      return null;
    }
  };

  const timeouts = [10000, 6000];
  let upstream = null;
  let lastError = null;
  for (let i = 0; i < timeouts.length; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeouts[i]);
    try {
      const res = await fetch(target.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MISSAV-J-ImageProxy/1.0)',
          'Accept': 'image/jpeg,image/png,image/webp,image/gif,*/*;q=0.1',
          'Referer': target.origin
        },
        signal: controller.signal,
        // Never follow a redirect to a host that bypasses the allowlist.
        redirect: 'manual'
      });
      clearTimeout(timeoutId);
      if ((res.status === 429 || res.status >= 500) && i + 1 < timeouts.length) {
        try { await res.body?.cancel?.(); } catch {}
        await new Promise(resolve => setTimeout(resolve, 150));
        continue;
      }
      upstream = res;
      break;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (i + 1 < timeouts.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
        continue;
      }
    }
  }

  try {
    if (!upstream) {
      console.error('[Social Image Proxy Error]', lastError);
      const staleResp = await serveStaleImage();
      if (staleResp) return staleResp;
      return new Response('Image proxy temporarily unavailable', {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' }
      });
    }

    if (!upstream.ok || upstream.status >= 300) {
      if (upstream.status === 429 || upstream.status >= 500) {
        const staleResp = await serveStaleImage();
        if (staleResp) return staleResp;
      }
      return new Response('Upstream image unavailable', {
        status: upstream.status >= 400 && upstream.status <= 599 ? upstream.status : 502,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const contentType = (upstream.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (!SAFE_IMAGE_TYPES.includes(contentType)) {
      return new Response('Unsupported image type', {
        status: 415,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'X-Cache-Status': 'MISS',
      'X-Edge-Mode': 'IMAGE-PROXY'
    });
    if (!upstream.body) {
      const staleResp = await serveStaleImage();
      if (staleResp) return staleResp;
      return new Response('Upstream image body unavailable', {
        status: 502,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const writeStaleAndFresh = (bodyStream) => {
      const [freshStream, staleStream] = bodyStream.tee();
      const staleHeaders = new Headers(responseHeaders);
      staleHeaders.set('Cache-Control', 'public, max-age=31536000');
      context.waitUntil(
        Promise.allSettled([
          cache.put(cacheKey, new Response(freshStream, { status: 200, headers: responseHeaders })),
          cache.put(staleCacheKey, new Response(staleStream, { status: 200, headers: staleHeaders }))
        ]).catch(err => console.warn('[Social Image Cache Write Error]', err))
      );
    };

    if (request.method === 'HEAD') {
      writeStaleAndFresh(upstream.body);
      return new Response(null, { status: 200, headers: responseHeaders });
    }

    const [streamForClient, streamForCache] = upstream.body.tee();
    const clientResponse = new Response(streamForClient, { status: 200, headers: responseHeaders });
    writeStaleAndFresh(streamForCache);
    return clientResponse;
  } catch (err) {
    console.error('[Social Image Proxy Error]', err);
    const staleResp = await serveStaleImage();
    if (staleResp) return staleResp;
    return new Response('Image proxy temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' }
    });
  }
}
