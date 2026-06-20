/**
 * MISSAV-J — Cloudflare Pages Image Proxy (/api/image)
 * Memproksi gambar thumbnail dari server eksternal (fourhoi.com, image.apijav.com)
 * untuk menghindari pemblokiran DNS (Internet Positif) dan AdBlocker di sisi browser klien.
 */

export async function onRequest(context) {
  const { request } = context;
  const urlParams = new URL(request.url).searchParams;
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Daftar domain yang diizinkan untuk menghindari penyalahgunaan open proxy
  const allowedDomains = [
    'fourhoi.com',
    'image.apijav.com',
    'server.apijav.com',
    'server.appjav.com',
    'surrit.com',
    'media.surrit.com'
  ];

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    return new Response('Invalid URL', { status: 400 });
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
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(`Failed to fetch image: Upstream returned ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // Set headers respons dengan cache jangka panjang (1 tahun)
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*'
    });

    const responseBody = await response.arrayBuffer();
    const finalResponse = new Response(responseBody, {
      status: 200,
      headers: responseHeaders
    });

    // Simpan ke Cloudflare cache secara asinkron
    context.waitUntil(cache.put(cacheKey, finalResponse.clone()));

    return finalResponse;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Image proxy fetch error:', e);
    return new Response(`Proxy Error: ${e.message}`, { status: 502 });
  }
}
