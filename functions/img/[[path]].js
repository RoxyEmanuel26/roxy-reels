// Tipe MIME yang diizinkan
const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // params.path is an array from [[path]].js
  // e.g. /img/base64encodedurl.jpg -> params.path = ["base64encodedurl.jpg"]
  if (!params.path || params.path.length === 0) {
    return new Response('Missing path', { status: 400 });
  }

  const pathParam = params.path[0]; // "aHR0cHM6...jpg"
  
  // Pisahkan extension jika ada
  let base64Url = pathParam;
  if (base64Url.includes('.')) {
    base64Url = base64Url.substring(0, base64Url.lastIndexOf('.'));
  }

  let targetUrl;
  try {
    // Decode base64 URL. Convert URL-safe base64 (-_) back to standard (+/)
    let b64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    targetUrl = atob(b64);
  } catch (e) {
    return new Response('Invalid base64 encoding', { status: 400 });
  }

  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return new Response('Invalid URL protocol', { status: 400 });
  }

  const allowedDomains = [
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

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    return new Response('Invalid URL', { status: 400 });
  }

  if (parsedTarget.protocol !== 'https:') {
    return new Response('HTTPS required', { status: 400 });
  }

  const isAllowed = allowedDomains.some(domain =>
    parsedTarget.hostname === domain || parsedTarget.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return new Response('Domain not allowed', { status: 403 });
  }

  const cache = caches.default;
  const cacheKey = request;

  try {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  } catch (e) {
    console.error('Cache match error:', e);
  }

  const headers = new Headers();
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  headers.set('Referer', parsedTarget.origin);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(`Upstream error`, { status: response.status });
    }

    const rawContentType = (response.headers.get('Content-Type') || '').toLowerCase().split(';')[0].trim();
    const safeContentType = SAFE_IMAGE_TYPES.find(t => rawContentType === t || rawContentType.startsWith(t));
    const finalContentType = safeContentType || 'image/jpeg';

    const responseHeaders = new Headers({
      'Content-Type': finalContentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    });

    if (response.body) {
      const [streamForClient, streamForCache] = response.body.tee();
      const finalResponse = new Response(streamForClient, {
        status: 200,
        headers: responseHeaders
      });
      context.waitUntil(
        cache.put(cacheKey, new Response(streamForCache, { status: 200, headers: responseHeaders }))
          .catch(() => {})
      );
      return finalResponse;
    }

    const responseBody = await response.arrayBuffer();
    const finalResponse = new Response(responseBody, {
      status: 200,
      headers: responseHeaders
    });
    context.waitUntil(cache.put(cacheKey, finalResponse.clone()).catch(() => {}));
    return finalResponse;

  } catch (e) {
    clearTimeout(timeoutId);
    return new Response('Proxy Error: Unable to fetch image', { status: 502 });
  }
}
