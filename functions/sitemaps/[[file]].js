/**
 * MISSAV-J — sitemaps directory router (Cloudflare)
 * Mengalihkan request /sitemaps/:file ke /api/sitemap?file=:file secara internal.
 */

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  
  let file = '';
  if (params.file && params.file.length > 0) {
    file = params.file[0];
  }

  const newUrl = new URL('/api/sitemap', url.origin);
  if (file) {
    newUrl.searchParams.set('file', file);
  }

  const newRequest = new Request(newUrl.toString(), request);
  return fetch(newRequest);
}
