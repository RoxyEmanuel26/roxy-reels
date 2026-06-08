/**
 * MISSAV-J — SPA Catchall Router & SEO Tag Injector (Cloudflare)
 * 
 * OPTIMIZED: Menghilangkan loopback request ke /api/posts.
 * Sekarang fetch langsung ke server.apijav.com & Supabase
 * untuk menghemat 1 Worker request per halaman watch.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const VALID_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

/**
 * Fetch metadata video langsung dari API eksternal (tanpa loopback).
 * Hanya mengambil data dasar yang dibutuhkan untuk OG tags.
 */
async function fetchPostMetadata(id, origin) {
  const apiUrl = `${TARGET_BASE}/posts/${id}`;
  const res = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json',
      'X-Client-Site': origin
    }
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Ambil terjemahan judul dari Supabase (lazy, hanya bahasa yang diminta).
 */
async function getTranslatedTitle(id, lang, supabaseUrl, supabaseKey) {
  if (!lang || lang === 'en' || !supabaseUrl || !supabaseKey) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && data[0].translations && data[0].translations[lang]) {
      return data[0].translations[lang];
    }
  } catch (e) {
    console.error('[OG Supabase Error]', e);
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Handle sitemap.xml rewrite to static sitemap_index.xml
  if (pathname === '/sitemap.xml') {
    const newRequest = new Request(new URL('/sitemaps/sitemap_index.xml', request.url), request);
    return env.ASSETS.fetch(newRequest);
  }

  // 2. Check if this is a Watch page that needs Open Graph tag injection
  const watchRegex = /^\/(?:([a-zA-Z\-]+)\/)?watch(?:\/([^\/]+))?$/;
  const watchMatch = pathname.match(watchRegex);

  if (watchMatch) {
    const lang = watchMatch[1] || 'en';
    const slug = watchMatch[2] || '';
    const isLangValid = VALID_LANGS.includes(lang);

    if (isLangValid || (!watchMatch[1] && lang === 'en')) {
      let id = null;
      if (slug) {
        const match = slug.match(/.*-(\d+)$/);
        if (match) {
          id = match[1];
        } else if (slug.match(/^\d+$/)) {
          id = slug;
        }
      }

      const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
      if (!indexResponse.ok) {
        return new Response('Internal Server Error: Failed to fetch index.html', { status: 500 });
      }
      let htmlContent = await indexResponse.text();

      if (id) {
        try {
          // OPTIMIZED: Fetch langsung ke server.apijav.com (tanpa loopback)
          const activeLang = isLangValid ? lang : 'en';
          const post = await fetchPostMetadata(id, url.origin);

          if (post && post.title) {
            let title = post.title;

            // Ambil terjemahan judul dari Supabase jika bukan bahasa Inggris
            if (activeLang !== 'en') {
              const translated = await getTranslatedTitle(
                id, activeLang,
                env.SUPABASE_URL, env.SUPABASE_KEY
              );
              if (translated) title = translated;
            }

            const code = post.code || '';
            const fullTitle = code ? `[${code}] ${title} - MISSAV-J` : `${title} - MISSAV-J`;
            const description = `Nonton video JAV ${code ? code + ' ' : ''}${title} gratis dengan streaming kualitas premium di MISSAV-J.`;

            let imageUrl = post.thumbnail || '/assets/images/logo.png';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `${url.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }

            const pageUrl = `${url.origin}${url.pathname}${url.search}`;

            htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
            htmlContent = htmlContent.replace(
              /<meta name="description" id="meta-description" content="[^"]*"/i,
              `<meta name="description" id="meta-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
              `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:url" id="og-url" content="[^"]*"/i,
              `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:title" id="og-title" content="[^"]*"/i,
              `<meta property="og:title" id="og-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:description" id="og-description" content="[^"]*"/i,
              `<meta property="og:description" id="og-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:image" id="og-image" content="[^"]*"/i,
              `<meta property="og:image" id="og-image" content="${escapeHtml(imageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
              `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
              `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:image" id="twitter-image" content="[^"]*"/i,
              `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(imageUrl)}"`
            );

            if (htmlContent.includes('"@type": "WebSite"')) {
              const structuredData = {
                "@context": "https://schema.org",
                "@type": "VideoObject",
                "name": title,
                "description": description,
                "thumbnailUrl": imageUrl,
                "uploadDate": post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
                "embedUrl": post.embed_url ? post.embed_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&') : `https://server.apijav.com/embed/${id}`
              };
              htmlContent = htmlContent.replace(
                /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
                `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
              );
            }
          }
        } catch (err) {
          console.error('[Watch OG Error]', err);
        }
      }

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, max-age=300'
        }
      });
    }
  }

  // 3. Fallback SPA routing
  const res = await env.ASSETS.fetch(request);

  if (res.status === 404) {
    const ext = pathname.split('.').pop();
    const hasExtension = pathname.includes('.') && ext.length < 5;

    if (!pathname.startsWith('/api') && !hasExtension) {
      const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
      return new Response(indexResponse.body, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'CDN-Cache-Control': 'public, max-age=3600'
        }
      });
    }
  }

  return res;
}
