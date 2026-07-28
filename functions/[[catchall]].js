/**
 * MISSAV-J — SPA Catchall Router & SEO Tag Injector (Cloudflare)
 * 
 * OPTIMIZED: Menghilangkan loopback request ke /api/posts.
 * Sekarang fetch langsung ke server.apijav.com & Supabase
 * untuk menghemat 1 Worker request per halaman watch.
 */

const TARGET_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
const VALID_LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];

const DESC_TEMPLATES = {
  'zh-TW': (code, title) => `免費觀看 JAV ${code ? code + ' ' : ''}${title}，盡在 MISSAV-J 高畫質串流平台。`,
  'zh-CN': (code, title) => `免费观看 JAV ${code ? code + ' ' : ''}${title}，尽在 MISSAV-J 高清流媒体平台。`,
  'en': (code, title) => `Watch ${code ? code + ' ' : ''}${title} for free in premium HD streaming quality on MISSAV-J.`,
  'ja': (code, title) => `MISSAV-J で ${code ? code + ' ' : ''}${title} を高画質で無料視聴。`,
  'ko': (code, title) => `MISSAV-J에서 ${code ? code + ' ' : ''}${title} 무료 HD 스트리밍 시청.`,
  'ms': (code, title) => `Tonton ${code ? code + ' ' : ''}${title} secara percuma dengan kualiti HD premium di MISSAV-J.`,
  'th': (code, title) => `ดู ${code ? code + ' ' : ''}${title} ฟรีในคุณภาพ HD ระดับพรีเมียมบน MISSAV-J`,
  'de': (code, title) => `Sehen Sie ${code ? code + ' ' : ''}${title} kostenlos in Premium-HD-Streaming-Qualität auf MISSAV-J.`,
  'fr': (code, title) => `Regardez ${code ? code + ' ' : ''}${title} gratuitement en qualité HD premium sur MISSAV-J.`,
  'vi': (code, title) => `Xem ${code ? code + ' ' : ''}${title} miễn phí chất lượng HD cao cấp trên MISSAV-J.`,
  'id': (code, title) => `Nonton video JAV ${code ? code + ' ' : ''}${title} gratis dengan streaming kualitas premium di MISSAV-J.`,
  'fil': (code, title) => `Panoorin ang ${code ? code + ' ' : ''}${title} nang libre sa premium HD streaming sa MISSAV-J.`,
  'pt': (code, title) => `Assista ${code ? code + ' ' : ''}${title} gratuitamente em qualidade HD premium no MISSAV-J.`
};

function formatDuration(durationStr) {
  if (!durationStr || durationStr === '00:00:00') return null;
  const parts = durationStr.split(':').map(Number);
  if (parts.length !== 3) return null;
  const [h, m, s] = parts;
  if (h === 0 && m === 0 && s === 0) return null;
  let iso = 'PT';
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0) iso += `${s}S`;
  return iso === 'PT' ? null : iso;
}

/**
 * Fetch metadata video langsung dari API eksternal (tanpa loopback).
 * Hanya mengambil data dasar yang dibutuhkan untuk OG tags.
 */
async function fetchPostMetadata(id, origin) {
  const apiUrl = `${TARGET_BASE}/posts/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': 'https://www.missav-j.com',
        'Referer': 'https://www.missav-j.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[OG Fetch Error]', err);
    return null;
  }
}

/**
 * Ambil terjemahan judul dari Supabase (lazy, hanya bahasa yang diminta).
 */
async function getTranslatedTitle(id, lang, supabaseUrl, supabaseKey) {
  if (!lang || lang === 'en' || !supabaseUrl || !supabaseKey) return null;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && data[0].translations && data[0].translations[lang]) {
      return data[0].translations[lang];
    }
  } catch (e) {
    clearTimeout(timeoutId);
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
  // Check cache for GET requests on Watch and Listing Pages only
  const isGet = request.method === 'GET';
  const watchRegex = /^\/(?:([a-zA-Z\-]+)\/)?watch(?:\/([^\/]+))?$/;
  const listRegex = /^\/(?:([a-zA-Z\-]+)\/)?(actor|category|studio|trending|recent|actors|categories|studios|popular-actors|watch-later|history|search)$/;
  const langRegex = /^\/([a-zA-Z\-]+)\/?$/;
  
  const isWatch = pathname.match(watchRegex);
  const isList = pathname.match(listRegex);
  const isLangRoot = pathname.match(langRegex);
  const isCacheableRoute = isGet && (isWatch || isList || isLangRoot);

  let cache = null;
  if (isCacheableRoute) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (e) {
      console.error('[Cache SSR Match Error]', e);
    }
  }
  // 2. Check if this is a Watch page that needs Open Graph tag injection
  const watchMatch = isWatch;

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
            const descFn = DESC_TEMPLATES[activeLang] || DESC_TEMPLATES['en'];
            const description = descFn(code, title);

            let imageUrl = post.thumbnail || '/assets/images/logo.png';
            
            // Bypass API image proxy for Googlebot to prevent 403 Forbidden on thumbnails
            if (imageUrl.includes('apijav.php?url=')) {
              try {
                const urlObj = new URL(imageUrl);
                const actualUrl = urlObj.searchParams.get('url');
                if (actualUrl) imageUrl = actualUrl;
              } catch (e) {}
            }

            if (imageUrl && imageUrl.startsWith('//')) {
              imageUrl = `https:${imageUrl}`;
            } else if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
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
              const cleanEmbedUrl = post.embed_url ? post.embed_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&') : `https://server.apijav.com/embed/${id}`;
              const isoDuration = formatDuration(post.duration);
              const actorsList = (post.actors || []).map(a => ({
                "@type": "Person",
                "name": typeof a === 'string' ? a : (a.name || a)
              }));
              const genreList = (post.categories || []).map(c => typeof c === 'string' ? c : (c.name || c));

              const videoSchema = {
                "@type": "VideoObject",
                "name": title,
                "description": description,
                "thumbnailUrl": imageUrl,
                "uploadDate": post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
                "embedUrl": cleanEmbedUrl,
                "publisher": {
                  "@type": "Organization",
                  "name": "MISSAV-J",
                  "url": "https://www.missav-j.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.missav-j.com/assets/images/logo.png"
                  }
                },
                "inLanguage": "ja"
              };

              if (isoDuration) videoSchema.duration = isoDuration;
              if (post.views) {
                videoSchema.interactionStatistic = {
                  "@type": "InteractionCounter",
                  "interactionType": { "@type": "WatchAction" },
                  "userInteractionCount": parseInt(post.views) || 0
                };
              }
              if (actorsList.length > 0) videoSchema.actor = actorsList;
              if (genreList.length > 0) videoSchema.genre = genreList;
              if (post.studio) {
                videoSchema.productionCompany = {
                  "@type": "Organization",
                  "name": typeof post.studio === 'string' ? post.studio : (post.studio.name || post.studio)
                };
              }

              // BreadcrumbList schema
              const breadcrumbSchema = {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.missav-j.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item": pageUrl
                  }
                ]
              };

              const structuredData = {
                "@context": "https://schema.org",
                "@graph": [videoSchema, breadcrumbSchema]
              };
              htmlContent = htmlContent.replace(
                /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
                `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
              );

              // Inject iframe into raw HTML for first-wave crawler indexing
              const seoFallbackContent = `
        <div class="seo-fallback" style="display: none;">
          <h1>${escapeHtml(fullTitle)}</h1>
          <p>${escapeHtml(description)}</p>
          <iframe src="${escapeHtml(cleanEmbedUrl)}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>
        </div>
              `;
              htmlContent = htmlContent.replace(/<div class="seo-fallback" style="display: none;">[\s\S]*?<\/div>/i, seoFallbackContent);
            }
          }
        } catch (err) {
          console.error('[Watch OG Error]', err);
        }
      }

      const watchResponse = new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, max-age=300'
        }
      });

      if (cache && isCacheableRoute) {
        context.waitUntil(cache.put(request, watchResponse.clone()));
      }

      return watchResponse;
    }
  } else {
    // 3. Programmatic SEO for Listing Pages (Actor, Category, Studio, Trending, etc)
    const listMatch = isList || isLangRoot;

    if (listMatch) {
      const lang = listMatch[1] || 'en';
      const type = isList ? listMatch[2] : 'home';
      const isLangValid = VALID_LANGS.includes(lang);

      if (isLangValid || (!listMatch[1] && lang === 'en')) {
        const activeLang = isLangValid ? lang : 'en';
        const nameParam = url.searchParams.get('name') || '';
        
        const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
        if (!indexResponse.ok) {
          return new Response('Internal Server Error: Failed to fetch index.html', { status: 500 });
        }
        let htmlContent = await indexResponse.text();
        
        let pageTitle = 'MISSAV-J';
        let pageDesc = 'MISSAV-J Streaming';
        let schemaType = 'CollectionPage';
        
        const safeName = escapeHtml(nameParam);
        
        if (type === 'actor' && nameParam) {
          pageTitle = `${safeName} - Actress Profile & Videos | MISSAV-J`;
          pageDesc = `Watch the best JAV videos starring ${safeName} in premium HD. Explore ${safeName}'s full filmography and profile on MISSAV-J.`;
          schemaType = 'ProfilePage';
        } else if (type === 'category' && nameParam) {
          pageTitle = `${safeName} JAV Videos | MISSAV-J`;
          pageDesc = `Watch the latest and best ${safeName} JAV videos online for free. Premium high-quality streaming on MISSAV-J.`;
        } else if (type === 'studio' && nameParam) {
          pageTitle = `${safeName} Studio JAV Videos | MISSAV-J`;
          pageDesc = `Explore the official collection of ${safeName} JAV videos. High definition streaming for ${safeName} studio releases.`;
        } else if (type === 'trending') {
          pageTitle = `Trending JAV Videos | MISSAV-J`;
          pageDesc = `Watch the most popular and trending JAV videos right now on MISSAV-J.`;
        } else if (type === 'recent') {
          pageTitle = `Recent JAV Videos | MISSAV-J`;
          pageDesc = `Watch the newest and latest JAV video releases on MISSAV-J.`;
        } else if (type === 'actors') {
          pageTitle = `All JAV Actresses | MISSAV-J`;
          pageDesc = `Browse our complete database of JAV actresses and their video collections.`;
        } else if (type === 'categories') {
          pageTitle = `All JAV Categories | MISSAV-J`;
          pageDesc = `Explore all JAV categories, genres, and tags. Find exactly what you want to watch.`;
        } else if (type === 'studios') {
          pageTitle = `All JAV Studios | MISSAV-J`;
          pageDesc = `Browse videos from top JAV studios and production companies.`;
        } else if (type === 'popular-actors') {
          pageTitle = `Popular JAV Actresses | MISSAV-J`;
          pageDesc = `Browse the most popular JAV actresses and their premium video collections.`;
        } else if (type === 'watch-later') {
          pageTitle = `Watch Later | MISSAV-J`;
          pageDesc = `Your saved JAV videos to watch later.`;
        } else if (type === 'history') {
          pageTitle = `Session History | MISSAV-J`;
          pageDesc = `Your recently watched JAV videos.`;
        } else if (type === 'search') {
          pageTitle = `Search Results | MISSAV-J`;
          pageDesc = `Search results for premium JAV videos on MISSAV-J.`;
        } else if (type === 'home' || !type) {
          pageTitle = `MISSAV-J | Premium JAV Streaming`;
          pageDesc = `Watch the best premium JAV streaming. Explore the latest releases, trending videos, and top actresses.`;
        }

        const pageUrl = `${url.origin}${url.pathname}${url.search}`;
        
        htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, `<title>${pageTitle}</title>`);
        htmlContent = htmlContent.replace(
          /<meta name="description" id="meta-description" content="[^"]*"/i,
          `<meta name="description" id="meta-description" content="${pageDesc}"`
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
          `<meta property="og:title" id="og-title" content="${pageTitle}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:description" id="og-description" content="[^"]*"/i,
          `<meta property="og:description" id="og-description" content="${pageDesc}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
          `<meta name="twitter:title" id="twitter-title" content="${pageTitle}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
          `<meta name="twitter:description" id="twitter-description" content="${pageDesc}"`
        );

        // JSON-LD ItemList / ProfilePage / CollectionPage
        let schemaJson = {};
        if (schemaType === 'ProfilePage' && nameParam) {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": nameParam,
              "url": pageUrl
            }
          };
        } else {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": pageDesc,
            "url": pageUrl
          };
        }
        
        // BreadcrumbList for listing
        const breadcrumbSchema = {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.missav-j.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": (nameParam ? safeName : type.charAt(0).toUpperCase() + type.slice(1)),
              "item": pageUrl
            }
          ]
        };
        
        const structuredData = {
          "@context": "https://schema.org",
          "@graph": [schemaJson, breadcrumbSchema]
        };
        
        htmlContent = htmlContent.replace(
          /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
          `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
        );
        
        // On the /actors directory hub, inject a real crawlable <a> list of every
        // actor into the server-side fallback. Actor links are otherwise built only
        // by client JS, so non-JS crawlers never see an internal link into any
        // /actor?name=... page -> 1,744 indexable "Orphan page" errors. This gives
        // every actor page one incoming internal link from an indexable hub.
        let actorLinksHtml = '';
        if (type === 'actors') {
          try {
            const actorsRes = await env.ASSETS.fetch(new URL('/api/actors.json', request.url));
            if (actorsRes.ok) {
              const actorNames = await actorsRes.json();
              if (Array.isArray(actorNames)) {
                // Names in actors.json are already HTML-encoded (e.g. '&amp;') and
                // contain no raw <, >, or " -> insert display text verbatim (escaping
                // would double-encode). href uses encodeURIComponent, matching the
                // exact encoding used in sitemaps/sitemap_actors_*.xml.
                const items = actorNames
                  .filter(n => typeof n === 'string' && n.trim() !== '')
                  .map(n => `<li><a href="/${activeLang}/actor?name=${encodeURIComponent(n)}">${n}</a></li>`)
                  .join('');
                actorLinksHtml = `<nav aria-label="All actors"><ul>${items}</ul></nav>`;
              }
            }
          } catch (err) {
            console.error('[Actor Directory Error]', err);
          }
        }

        // Inject fallback h1 text (+ crawlable actor directory on /actors)
        const seoFallbackContent = `
          <div class="seo-fallback" style="display: none;">
            <h1>${pageTitle}</h1>
            <p>${pageDesc}</p>
            ${actorLinksHtml}
          </div>
        `;
        // Function replacer: actor names may contain `$`, which is special in a
        // string replacement ($&, $1, ...). A function value is inserted verbatim.
        htmlContent = htmlContent.replace(/<div class="seo-fallback" style="display: none;">[\s\S]*?<\/div>/i, () => seoFallbackContent);

        const listResponse = new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'CDN-Cache-Control': 'public, max-age=300'
          }
        });

        if (cache && isCacheableRoute) {
          context.waitUntil(cache.put(request, listResponse.clone()));
        }

        return listResponse;
      }
    }
  }

  // 4. Fallback SPA routing
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
