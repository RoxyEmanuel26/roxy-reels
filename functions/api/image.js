/**
 * MISSAV-J — Cloudflare Pages Image Proxy (/api/image)
 * Memproksi gambar thumbnail dari server eksternal (fourhoi.com, image.apijav.com)
 * untuk menghindari pemblokiran DNS (Internet Positif) dan AdBlocker di sisi browser klien.
 *
 * Security hardening v2.8.63:
 * - Content-Type strict whitelist (no HTML/SVG XSS)
 * - redirect: 'manual' to prevent whitelist bypass via redirect chains
 * - HTTPS enforcement
 * - CORS OPTIONS preflight handling
 * - Streaming response body (no arrayBuffer() buffering)
 * - Generic error messages (no information disclosure)
 */

// Tipe MIME yang diizinkan: hanya gambar raster yang aman
const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export async function onRequest(context) {
  const { request } = context;

  // === CORS Preflight ===
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

  // Hanya izinkan GET
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const urlParams = new URL(request.url).searchParams;
  let targetUrl = urlParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Check if targetUrl is base64 encoded (does not start with http:// or https://)
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    try {
      targetUrl = atob(targetUrl);
    } catch (e) {
      return new Response('Invalid base64 encoding', { status: 400 });
    }
  }

  // Daftar domain yang diizinkan untuk menghindari penyalahgunaan open proxy.
  // Mencakup semua CDN yang digunakan oleh server.apijav.com untuk thumbnail.
  const allowedDomains = [
    'fourhoi.com',
    'image.apijav.com',
    'server.apijav.com',
    'server.appjav.com',
    'surrit.com',
    'media.surrit.com',
    // Japanese JAV CDN providers (thumbnails sering dari domain ini)
    'dmm.co.jp',
    'dmm.com',
    'pics.dmm.co.jp',
    'cc3001.dmm.co.jp',
    // Note: storage.googleapis.com DIHAPUS — terlalu luas, bisa digunakan SSRF
    // New CDN domains from API
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

  // Enforce HTTPS only — cegah eksploitasi via HTTP
  if (parsedTarget.protocol !== 'https:') {
    return new Response('HTTPS required', { status: 400 });
  }

  // Cocokkan domain utama atau sub-domain
  const isAllowed = allowedDomains.some(domain =>
    parsedTarget.hostname === domain || parsedTarget.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return new Response('Domain not allowed', { status: 403 });
  }

  // Terapkan Cloudflare Cache untuk menghemat bandwidth upstream
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

  // Konfigurasi request headers untuk meniru browser
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
      // SECURITY: 'manual' mencegah whitelist bypass via redirect ke domain lain
      redirect: 'manual'
    });
    clearTimeout(timeoutId);

    // Tangani redirect secara eksplisit — jangan ikuti redirect otomatis
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      return new Response('Redirect not allowed', { status: 403 });
    }

    if (!response.ok) {
      return new Response(`Upstream error`, { status: response.status });
    }

    // SECURITY: Strict Content-Type whitelist — cegah XSS via HTML/SVG proxy
    const rawContentType = (response.headers.get('Content-Type') || '').toLowerCase().split(';')[0].trim();
    const safeContentType = SAFE_IMAGE_TYPES.find(t => rawContentType === t || rawContentType.startsWith(t));
    const finalContentType = safeContentType || 'image/jpeg';

    // Set headers respons dengan cache jangka panjang (1 tahun)
    const responseHeaders = new Headers({
      'Content-Type': finalContentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    });

    // PERFORMANCE: Stream response body langsung (bukan arrayBuffer() yang buffering ke RAM)
    if (response.body) {
      const [streamForClient, streamForCache] = response.body.tee();
      const finalResponse = new Response(streamForClient, {
        status: 200,
        headers: responseHeaders
      });
      // Cache secara asinkron setelah response terkirim ke klien
      context.waitUntil(
        cache.put(cacheKey, new Response(streamForCache, { status: 200, headers: responseHeaders }))
          .catch(err => console.error('Cache put error:', err))
      );
      return finalResponse;
    }

    // Fallback jika streaming tidak tersedia
    const responseBody = await response.arrayBuffer();
    const finalResponse = new Response(responseBody, {
      status: 200,
      headers: responseHeaders
    });
    context.waitUntil(cache.put(cacheKey, finalResponse.clone()).catch(() => {}));
    return finalResponse;

  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Image proxy fetch error:', e);
    // Generic error — jangan bocorkan detail internal
    return new Response('Proxy Error: Unable to fetch image', { status: 502 });
  }
}
