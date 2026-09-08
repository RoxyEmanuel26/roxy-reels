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
  try {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return request.method === 'HEAD'
        ? new Response(null, { status: cached.status, headers: cached.headers })
        : cached;
    }
  } catch (err) {
    console.warn('[Social Image Cache Read Error]', err);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(target.toString(), {
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

    if (!upstream.ok || upstream.status >= 300) {
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
      'Access-Control-Allow-Origin': '*'
    });
    const body = await upstream.arrayBuffer();
    const cacheResponse = new Response(body, { status: 200, headers: responseHeaders });
    context.waitUntil(cache.put(cacheKey, cacheResponse.clone()).catch(err =>
      console.warn('[Social Image Cache Write Error]', err)
    ));

    return request.method === 'HEAD'
      ? new Response(null, { status: 200, headers: responseHeaders })
      : cacheResponse;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Social Image Proxy Error]', err);
    return new Response('Image proxy temporarily unavailable', {
      status: 502,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' }
    });
  }
}
