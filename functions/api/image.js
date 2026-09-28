/** Legacy compatibility redirect from /api/image?url= to the stable /img/ path. */
const ALLOWED_DOMAINS = ['fourhoi.com', 'image.apijav.com', 'server.apijav.com', 'server.appjav.com', 'surrit.com', 'media.surrit.com', 'dmm.co.jp', 'dmm.com', 'pics.dmm.co.jp', 'cc3001.dmm.co.jp', 'fourhoi.mrstcdn.store', 'mrstcdn.store', 'mrstcdn.com'];

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeLegacyValue(value) {
  if (/^https?:\/\//i.test(value)) return value;
  try {
    let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    normalized += '='.repeat((4 - normalized.length % 4) % 4);
    const binary = atob(normalized);
    return new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
  } catch (error) {
    return null;
  }
}

export async function onRequest({ request }) {
  const commonHeaders = { 'Access-Control-Allow-Origin': '*', 'X-Cache-Status': 'BYPASS', 'X-Edge-Mode': 'IMAGE-REDIRECT' };
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...commonHeaders, 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: commonHeaders });

  const raw = new URL(request.url).searchParams.get('url');
  if (!raw || raw.length > 4096) return new Response('Invalid image URL', { status: 400, headers: commonHeaders });
  const decoded = decodeLegacyValue(raw);
  let target;
  try { target = new URL(decoded); } catch (error) { return new Response('Invalid image URL', { status: 400, headers: commonHeaders }); }
  const allowed = target.protocol === 'https:' && ALLOWED_DOMAINS.some(domain => target.hostname === domain || target.hostname.endsWith(`.${domain}`));
  if (!allowed) return new Response('Domain not allowed', { status: 403, headers: commonHeaders });

  const location = `${new URL(request.url).origin}/img/${base64UrlEncode(target.toString())}.jpg`;
  return new Response(null, { status: 301, headers: { ...commonHeaders, 'Location': location, 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
