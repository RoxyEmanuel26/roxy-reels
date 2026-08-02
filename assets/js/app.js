/**
 * MISSAV-J — App Orchestrator & SPA Router (Advanced Edition)
 * Manages History API relative pathname routing, Picture-in-Picture (PiP) iframe DOM transplantation,
 * desktop global hotkeys, and playlist in-memory states (Watch Later & Session History).
 */

import ui from './ui.js?v=2.8.29';
import { renderVideoCard, bindHoverPreviews } from './feed.js?v=2.8.29';
import i18n from './i18n.js?v=2.8.29';
import { Analytics } from './analytics.js?v=2.8.29';
import ReferralSystem from './referral.js?v=2.8.29';
import './ads.js?v=2.8.29';

// Initialize Global In-Memory SPA States
window.missavJState = {
  watchLater: [],   // Stores post objects saved to Watch Later list
  history: [],      // Session play history for recent video plays
  activeVideo: null, // Holds details of the currently active playing video
  isFloating: false, // Flag to trace if the player is currently in Picture-in-Picture (PiP) mode
  currentPath: ''    // Holds the currently active SPA route path
};

// Parameter Helper: Extracts value from query string parameters securely
function getParam(name) {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(name);
}

/**
 * Converts text into a clean Unicode-safe URL slug.
 * Smartly preserves letters across different languages (CJK, Cyrillic, etc.) and collapses special characters.
 */
export function slugify(text) {
  if (!text) return '';
  // Decode HTML entities first to prevent dirty slugs (e.g. &#039; -> ' which is then stripped)
  const decoded = text
    .toString()
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, '-') // Replace spaces, underscores, hyphens with a single hyphen
    .replace(/[^\p{L}\p{N}\-]/gu, '') // Keep Unicode letters, numbers, and hyphens (retains CJK characters)
    .replace(/-+/g, '-') // Collapse multiple consecutive hyphens
    .replace(/^-+/, '') // Trim leading hyphen
    .replace(/-+$/, ''); // Trim trailing hyphen
}

// Global helpers for generating and navigating watch URLs using clean slugs
window.missavJGetWatchUrl = function(id, code, title) {
  const cleanCode = slugify(code || '');
  const cleanTitle = slugify(title || '');
  let slug = '';
  if (cleanCode && cleanTitle) {
    slug = `${cleanCode}-${cleanTitle}`;
  } else if (cleanCode) {
    slug = cleanCode;
  } else if (cleanTitle) {
    slug = cleanTitle;
  }
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
  }
  return slug ? `/watch/${slug}-${id}` : `/watch/${id}`;
};

window.missavJNavigateToWatch = function(id, code, title) {
  const watchPath = window.missavJGetWatchUrl(id, code, title);
  window.missavJNavigate(watchPath);
};

window.missavJGetCurrentWatchId = function() {
  const searchParams = new URLSearchParams(window.location.search);
  const qId = searchParams.get('id');
  if (qId) return qId;
  
  const path = window.location.pathname;
  const match = path.match(/\/watch\/.*-(\d+)$/);
  if (match) return match[1];
  
  const fallbackMatch = path.match(/\/watch\/(\d+)$/);
  if (fallbackMatch) return fallbackMatch[1];
  
  return null;
};

/**
 * Parses URL path segments to extract active language subpath prefix and SPA internal route (Safe Segment parsing)
 * @param {string} urlPath - window.location.pathname
 * @returns {{lang: string, routePath: string}} Separated segments
 */
function parseUrl(urlPath) {
  const cleanPath = urlPath.replace(/^\//, ''); // e.g. "en/trending"
  const segments = cleanPath.split('?')[0].split('/'); // ["en", "trending"]
  
  let lang = segments[0] || '';
  const isValidLang = i18n.LANGS.some(l => l.code === lang);
  
  let routePath = '/';
  if (isValidLang) {
    routePath = '/' + segments.slice(1).join('/');
  } else {
    lang = i18n.getLang();
    routePath = '/' + segments.join('/');
  }
  
  // Clean trailing slashes on routing paths
  if (routePath.length > 1 && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }
  
  return { lang, routePath };
}

/**
 * Navigates to a new relative SPA route segment using the History API (dispatching clean URLs)
 * @param {string} routePath - The internal route destination (e.g. '/watch?id=123' or '/trending')
 */
window.missavJNavigate = function(routePath) {
  const currentLang = i18n.getLang();
  const cleanPath = routePath.startsWith('/') ? routePath : '/' + routePath;
  
  // Safely split pathnames and search query segments
  const [pathPart, queryPart] = cleanPath.split('?');
  const fullPath = `/${currentLang}${pathPart}` + (queryPart ? `?${queryPart}` : '');
  
  history.pushState(null, '', fullPath);
  navigate(fullPath);
};

/**
 * Handle SPA links click globally to prevent full page reloads for A href tags
 */
document.body.addEventListener('click', (e) => {
  const chip = e.target.closest('.meta-tag-chip');
  if (chip && chip.getAttribute('href') && chip.getAttribute('href').startsWith('/')) {
    e.preventDefault();
    
    const url = new URL(chip.href, window.location.origin);
    const pathParts = url.pathname.split('/');
    if (pathParts.length >= 3) {
      pathParts.shift();
      pathParts.shift();
      const relativePath = '/' + pathParts.join('/') + url.search;
      window.missavJNavigate(relativePath);
    } else {
      window.missavJNavigate(url.pathname + url.search);
    }
  }
});

// Custom playlist grid renderer for Watch Later & Session History
function renderSavedVideosPage(title, postsList, emptyMessage) {
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  if (postsList.length === 0) {
    mainApp.innerHTML = `
      <div class="saved-list-header">
        <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-2);">${title}</h2>
      </div>
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <h3 data-i18n="empty_state_title">Empty List</h3>
        <p>${emptyMessage}</p>
        <button onclick="window.missavJNavigate('/')" class="btn-primary" data-i18n="empty_clear_btn">Browse Videos</button>
      </div>
    `;
    i18n.translateStaticUI();
    return;
  }

  // Render cards grid with staggered animation delay
  mainApp.innerHTML = `
    <div class="saved-list-header" style="margin-bottom: var(--space-6);">
      <h2 style="font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-1);">${title}</h2>
      <p class="text-muted" style="font-size: var(--text-xs); font-weight: 500;">${i18n.t('video_available', { total: postsList.length })}</p>
    </div>
    <div class="video-grid" id="saved-video-grid">
      ${postsList.map((post, idx) => renderVideoCard(post, idx)).join('')}
    </div>
  `;

  // Hub card click events using high performance delegation
  const grid = document.getElementById('saved-video-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const actorChip = e.target.closest('.actor-chip');
      if (actorChip) {
        e.preventDefault();
        const actorName = decodeURIComponent(actorChip.dataset.actor);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
        return;
      }

      const studioName = e.target.closest('.card-studio');
      if (studioName) {
        const studio = decodeURIComponent(studioName.dataset.studio);
        window.missavJNavigate(`/studio?name=${encodeURIComponent(studio)}`);
        return;
      }

      const card = e.target.closest('.video-card');
      if (card && !card.classList.contains('skeleton-card')) {
        const postId = card.dataset.id;
        const code = card.dataset.code || '';
        const title = card.dataset.title || '';
        window.missavJNavigateToWatch(postId, code, title);
      }
    });

    // Attach high-performance dynamic hover listeners for video previews
    bindHoverPreviews(grid);
  }
  
  i18n.translateStaticUI();
}

// In-Memory routing map for SPA page handlers
const routes = {
  '/':          () => import('./feed.js?v=2.8.29').then(m => m.init()),
  '/trending':  () => import('./trending.js?v=2.8.29').then(m => m.init()),
  '/recent':    () => import('./recent.js?v=2.8.29').then(m => m.init()),
  '/search':    (q) => import('./search.js?v=2.8.29').then(m => m.init(q || getParam('q'))),
  '/watch':     (id) => import('./player.js?v=2.8.29').then(m => m.init(id || window.missavJGetCurrentWatchId())),
  '/category':  () => import('./feed.js?v=2.8.29').then(m => m.init({ category: getParam('name') })),
  '/actor':     () => import('./feed.js?v=2.8.29').then(m => m.init({ actor: getParam('name') })),
  '/studio':    () => import('./feed.js?v=2.8.29').then(m => m.init({ studio: getParam('name') })),
  '/tag':       () => import('./feed.js?v=2.8.29').then(m => m.init({ tag: getParam('name') })),
  
  // Taxonomy browsing routes for Actors, Studios & Categories
  '/actors':          () => import('./actors.js?v=2.8.29').then(m => m.init()),
  '/popular-actors':  () => import('./popular_actors.js?v=2.8.29').then(m => m.init()),
  '/studios':         () => import('./studios.js?v=2.8.29').then(m => m.init()),
  '/categories':      () => import('./categories.js?v=2.8.29').then(m => m.init()),
  
  // Playlists routing mapping
  '/watch-later': () => Promise.resolve(renderSavedVideosPage(i18n.t('nav_watch_later'), window.missavJState.watchLater, i18n.t('watch_later_empty_desc'))),
  '/history':     () => Promise.resolve(renderSavedVideosPage(i18n.t('nav_history'), window.missavJState.history, i18n.t('history_empty_desc')))
};

/**
 * Updates SEO Canonical, Alternate language links, Meta Description, OG Tags, Twitter Cards,
 * and JSON-LD Structured Data inside the document head — dynamically per route.
 */
function updateSEOTags(routePath, targetId) {
  // Remove existing canonical and alternate link elements
  document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]').forEach(el => el.remove());

  const baseDomain = window.location.origin;
  const currentLang = i18n.getLang();

  // Keep <html lang> in sync with the active locale (SPA route change does not
  // reload the document, so the static lang="id" in index.html would otherwise
  // stick on every localized route -> "Hreflang and HTML lang mismatch").
  document.documentElement.lang = i18n.hreflangCode(currentLang);

  let cleanRoutePath = routePath;
  let hasLocalizedSlugs = false;
  let localizedSlugsMap = {};

  if (routePath === '/watch' && window.missavJState.activeVideo) {
    const post = window.missavJState.activeVideo;
    if (post.localized_slugs) {
      hasLocalizedSlugs = true;
      localizedSlugsMap = post.localized_slugs;
      cleanRoutePath = `/watch/${localizedSlugsMap[currentLang] || slugify(post.code) + '-' + slugify(post.title)}-${post.id}`;
    } else {
      cleanRoutePath = window.missavJGetWatchUrl(post.id, post.code, post.title);
    }
  } else {
    // For listing and browsing pages
    const parsed = parseUrl(window.location.pathname);
    cleanRoutePath = parsed.routePath;
    if (window.location.search) {
      cleanRoutePath += window.location.search;
    }
  }

  const canonicalUrl = `${baseDomain}/${currentLang}${cleanRoutePath === '/' ? '' : cleanRoutePath}`;

  // 1. Add canonical link
  const canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = canonicalUrl;
  document.head.appendChild(canonicalLink);

  // 2. Add alternate links for all 13 languages
  i18n.LANGS.forEach(lang => {
    let langRoutePath = cleanRoutePath;
    
    if (routePath === '/watch' && window.missavJState.activeVideo) {
      const post = window.missavJState.activeVideo;
      if (hasLocalizedSlugs && localizedSlugsMap[lang.code]) {
        langRoutePath = `/watch/${localizedSlugsMap[lang.code]}-${post.id}`;
      } else {
        langRoutePath = window.missavJGetWatchUrl(post.id, post.code, post.title);
      }
    }
    
    const altLink = document.createElement('link');
    altLink.rel = 'alternate';
    altLink.hreflang = i18n.hreflangCode(lang.code);
    altLink.href = `${baseDomain}/${lang.code}${langRoutePath}`;
    document.head.appendChild(altLink);
  });
  
  // Add x-default alternate pointing to English
  const xDefaultLink = document.createElement('link');
  xDefaultLink.rel = 'alternate';
  xDefaultLink.hreflang = 'x-default';
  let enWatchPath = cleanRoutePath;
  if (routePath === '/watch' && window.missavJState.activeVideo) {
    const post = window.missavJState.activeVideo;
    if (hasLocalizedSlugs && localizedSlugsMap['en']) {
      enWatchPath = `/watch/${localizedSlugsMap['en']}-${post.id}`;
    } else {
      enWatchPath = window.missavJGetWatchUrl(post.id, post.code, post.title);
    }
  }
  xDefaultLink.href = `${baseDomain}/en${enWatchPath}`;
  document.head.appendChild(xDefaultLink);

  // 3. Update dynamic Meta Description, OG Tags, Twitter Cards, and JSON-LD
  updateDynamicMetaTags(routePath, canonicalUrl, cleanRoutePath);
}

/**
 * Helper: safely set meta tag content by ID
 */
function setMetaContent(id, content) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('content', content);
}

/**
 * Dynamically updates Meta Description, Open Graph, Twitter Card, and JSON-LD
 * based on the currently active route and video data.
 */
function updateDynamicMetaTags(routePath, canonicalUrl, cleanRoutePath) {
  const baseDomain = window.location.origin;
  const currentLang = i18n.getLang();
  const isWatchPage = routePath === '/watch' && window.missavJState.activeVideo;
  
  // Map locale codes to OG locale format
  const localeMap = {
    'en': 'en_US', 'ja': 'ja_JP', 'ko': 'ko_KR', 'zh-TW': 'zh_TW', 'zh-CN': 'zh_CN',
    'ms': 'ms_MY', 'th': 'th_TH', 'de': 'de_DE', 'fr': 'fr_FR', 'vi': 'vi_VN',
    'id': 'id_ID', 'fil': 'fil_PH', 'pt': 'pt_BR'
  };

  if (isWatchPage) {
    const post = window.missavJState.activeVideo;
    const translatedTitle = i18n.translateVideoTitle(post.title);
    const pageTitle = `${translatedTitle} — MISSAV-J`;
    const description = `${i18n.t('meta_watch_prefix') || 'Watch'} ${post.code || ''} ${translatedTitle}`.trim();
    const thumbnail = post.thumbnail || '/assets/images/logo.webp';

    // Meta Description
    setMetaContent('meta-description', description);
    
    // Open Graph
    setMetaContent('og-type', 'video.other');
    setMetaContent('og-url', canonicalUrl);
    setMetaContent('og-title', pageTitle);
    setMetaContent('og-description', description);
    setMetaContent('og-image', thumbnail);
    setMetaContent('og-locale', localeMap[currentLang] || 'en_US');
    
    // Twitter Card
    setMetaContent('twitter-card', 'summary_large_image');
    setMetaContent('twitter-title', pageTitle);
    setMetaContent('twitter-description', description);
    setMetaContent('twitter-image', thumbnail);

    // JSON-LD: VideoObject schema
    const jsonLdEl = document.getElementById('json-ld-data');
    if (jsonLdEl) {
      let uploadDate = new Date().toISOString();
      if (post.date) {
        const parsedDate = new Date(post.date);
        if (!isNaN(parsedDate.getTime())) {
          uploadDate = parsedDate.toISOString();
        }
      }
      const viewCount = post.views ? parseInt(post.views, 10) : 0;
      
      const cleanEmbedUrl = post.embed_url ? post.embed_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&') : `https://server.apijav.com/embed/${post.id}`;
      
      const videoSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        'name': translatedTitle,
        'description': description,
        'thumbnailUrl': thumbnail.startsWith('http') ? thumbnail : `${baseDomain}${thumbnail}`,
        'uploadDate': uploadDate,
        'embedUrl': cleanEmbedUrl,
        'interactionStatistic': {
          '@type': 'InteractionCounter',
          'interactionType': { '@type': 'WatchAction' },
          'userInteractionCount': viewCount
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'MISSAV-J',
          'url': baseDomain,
          'logo': {
            '@type': 'ImageObject',
            'url': `${baseDomain}/assets/images/logo.webp`
          }
        },
        'inLanguage': 'ja'
      };

      if (post.duration) {
        // Parse "HH:MM:SS" to ISO 8601 duration "PT...H...M...S" if possible
        const parts = String(post.duration).split(':').map(Number);
        if (parts.length === 3) {
          videoSchema.duration = `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
        }
      }

      // Add actor/performer info if available
      if (post.actors && post.actors.length > 0) {
        videoSchema.actor = post.actors.map(name => ({
          '@type': 'Person',
          'name': name
        }));
      }

      // Add genre if categories available
      if (post.categories && post.categories.length > 0) {
        videoSchema.genre = post.categories.slice(0, 5).join(', ');
      }

      jsonLdEl.textContent = JSON.stringify(videoSchema);
    }

  } else {
    // Non-watch pages: set default/listing meta tags
    const pageTitles = {
      '/':          'MISSAV-J — Premium Video Streaming Feed',
      '/trending':  `${i18n.t('nav_trending') || 'Trending'} — MISSAV-J`,
      '/recent':    `${i18n.t('nav_recent') || 'Recent'} — MISSAV-J`,
      '/actors':    `${i18n.t('nav_all_actors') || 'All Actors'} — MISSAV-J`,
      '/categories':`${i18n.t('nav_all_categories') || 'All Categories'} — MISSAV-J`,
      '/studios':   `${i18n.t('nav_studios') || 'Studios'} — MISSAV-J`,
      '/search':    `${i18n.t('nav_search') || 'Search'} — MISSAV-J`,
    };

    const pageDescriptions = {
      '/':          i18n.t('meta_home_desc') || 'Watch the best premium JAV streaming. Explore the latest releases, trending videos, and top actresses in high quality.',
      '/trending':  i18n.t('meta_trending_desc') || 'Browse the most popular and trending videos right now.',
      '/recent':    i18n.t('meta_recent_desc') || 'Watch the latest and most recently uploaded videos.',
      '/actors':    i18n.t('meta_actors_desc') || 'Browse all actors and actresses.',
      '/categories':i18n.t('meta_categories_desc') || 'Explore video categories and genres.',
      '/studios':   i18n.t('meta_studios_desc') || 'Discover popular production studios.',
      '/search':    i18n.t('meta_search_desc') || 'Search for videos, actors, studios, and more.',
    };

    const title = pageTitles[routePath] || 'MISSAV-J — Premium Video Streaming Feed';
    const desc = pageDescriptions[routePath] || pageDescriptions['/'];

    document.title = title;
    
    // Meta Description
    setMetaContent('meta-description', desc);
    
    // Open Graph
    setMetaContent('og-type', 'website');
    setMetaContent('og-url', canonicalUrl);
    setMetaContent('og-title', title);
    setMetaContent('og-description', desc);
    setMetaContent('og-image', '/assets/images/logo.webp');
    setMetaContent('og-locale', localeMap[currentLang] || 'en_US');

    // Twitter Card
    setMetaContent('twitter-card', 'summary');
    setMetaContent('twitter-title', title);
    setMetaContent('twitter-description', desc);
    setMetaContent('twitter-image', '/assets/images/logo.webp');

    // JSON-LD: WebSite schema with SearchAction
    const jsonLdEl = document.getElementById('json-ld-data');
    if (jsonLdEl) {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'MISSAV-J',
        'url': baseDomain,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${baseDomain}/en/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
      jsonLdEl.textContent = JSON.stringify(websiteSchema);
    }
  }

  // Update Breadcrumb UI (defensive — guards against stale cached ui.js missing this method)
  if (typeof ui.renderBreadcrumbs === 'function') {
    ui.renderBreadcrumbs(cleanRoutePath, document.title);
  }
}

function navigate(urlPath) {
  const { lang, routePath } = parseUrl(urlPath);
  
  // Sync selected language dynamically if it differs from current i18n states
  if (lang && lang !== i18n.getLang()) {
    i18n.setLang(lang, false); // Set active language segment without invoking popstate routing loops
  }

  // Update Telegram floating button link/label dynamically on routing/language shifts
  if (typeof window.missavJUpdateTelegramButton === 'function') {
    window.missavJUpdateTelegramButton();
  }

  // Auto-close mobile sidebar drawer on navigation
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('visible');

  // Normalize path slug watch routes (e.g. /watch/abp-123-sakura-imai-82597 -> /watch)
  let matchedRoutePath = routePath;
  if (routePath.startsWith('/watch/')) {
    matchedRoutePath = '/watch';
  }

  const prevPath = window.missavJState.currentPath;
  window.missavJState.currentPath = matchedRoutePath;

  // Set route attribute on body for CSS styling targeting
  document.body.setAttribute('data-route', matchedRoutePath);


  // Extract ID using our robust Unicode-safe extractor helper
  const targetId = window.missavJGetCurrentWatchId();

  // SPECIAL CASE: Language changed while on watch page with the same video.
  // Do NOT destroy and reload the player — just re-translate all visible UI text in-place.
  if (prevPath === '/watch' && matchedRoutePath === '/watch' &&
      window.missavJState.activeVideo &&
      String(window.missavJState.activeVideo.id) === String(targetId)) {
    
    // Re-translate all static UI elements (sidebar, header, buttons, etc.)
    i18n.translateStaticUI();
    
    // Re-translate the player page dynamic text using the stored post data
    const post = window.missavJState.activeVideo;
    const titleEl = document.getElementById('player-title');
    if (titleEl) {
      titleEl.textContent = i18n.translateVideoTitle(post.title);
      titleEl.setAttribute('data-original-title', post.title || '');
    }
    document.title = `${i18n.translateVideoTitle(post.title)} — MISSAV-J`;
    
    // Re-translate player button labels
    const watchLaterLabel = document.getElementById('watch-later-label');
    if (watchLaterLabel) watchLaterLabel.textContent = i18n.t('btn_watch_later');
    
    // Re-translate meta section headers (Actors, Categories, Tags)
    document.querySelectorAll('.meta-section h4').forEach((h4, idx) => {
      const keys = ['meta_actors', 'meta_categories', 'meta_tags'];
      if (keys[idx]) h4.textContent = i18n.t(keys[idx]);
    });
    
    // Re-translate related videos heading
    const relatedHeading = document.querySelector('.player-sidebar-column h3');
    if (relatedHeading) relatedHeading.textContent = i18n.t('related_videos');
    
    // Re-render metadata chips (actors, categories, tags) with new language
    import('./player.js?v=2.8.29').then(m => {
      if (m.renderPostMeta) m.renderPostMeta(post, targetId);
      if (m.loadRelatedVideos) m.loadRelatedVideos(post);
    }).catch(() => { /* silent — non-critical */ });
    
    return; // Early exit — player iframe is preserved!
  }

  // 1. LEAVE WATCH: Close/dispose the player immediately since floating/PiP mode is disabled
  if (prevPath === '/watch' && matchedRoutePath !== '/watch') {
    // Matikan observer karena kita keluar dari halaman watch
    import('./player.js?v=2.8.29').then(m => {
      if (m.disconnectPlaceholderObserver) {
        m.disconnectPlaceholderObserver();
      }
    }).catch(() => {});

    // Programmatically exit browser native Picture-in-Picture if active
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }

    closeFloatingPlayer();
  }

  // Retrieve routing module or default back to home feed
  const route = routes[matchedRoutePath] || routes['/'];
  
  // Control banner visibility (Only show on home '/')
  const homeBanner = document.querySelector('.custom-sponsor-banner');
  if (homeBanner) {
    if (matchedRoutePath === '/') {
      homeBanner.style.display = '';
    } else {
      homeBanner.style.display = 'none';
    }
  }
  
  const mainApp = document.getElementById('app-content');
  if (mainApp) {
    mainApp.innerHTML = '';
  }
  
  // Show page shimmer skeletal states
  ui.showSkeletons(8);
  
  // Highlight active sidebar navigation indicators (pass full path + query for accurate matching)
  highlightActiveSidebarItem(matchedRoutePath, window.location.search);
  
  // Scroll instantly to page top bounds
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Determine router initialization arguments dynamically
  let routeArg = undefined;
  if (matchedRoutePath === '/search') routeArg = getParam('q');
  if (matchedRoutePath === '/watch') routeArg = targetId;

  // Load and execute module script
  route(routeArg).then(() => {
    i18n.translateStaticUI();
    // Wrap SEO/breadcrumb updates in try-catch so they never crash page content
    try {
      updateSEOTags(matchedRoutePath, targetId);
    } catch (seoErr) {
      console.warn('SEO tags update failed (non-critical):', seoErr.message);
    }
    try {
      Analytics.trackPageView(window.location.pathname, document.title, document.documentElement.lang);
    } catch (analyticsErr) {
      console.warn('Analytics tracking failed (non-critical):', analyticsErr.message);
    }
  }).catch(err => {
    console.error(`Error loading route ${matchedRoutePath}:`, err);
    ui.showError(i18n.t('error_load_page', { message: err.message }));
  });
}

/**
 * Cleanly disposes of the active Picture-in-Picture floating player session
 */
export function closeFloatingPlayer() {
  const float = document.getElementById('floating-player-wrapper');
  if (float) {
    float.classList.add('hidden');
    float.classList.remove('mode-floating');
    float.classList.remove('mode-theater');
    float.style.position = '';
    float.style.top = '';
    float.style.left = '';
    float.style.width = '';
    float.style.height = '';
  }
  
  const playerContainer = document.getElementById('player-container');
  if (playerContainer) {
    playerContainer.style.transform = '';
    playerContainer.innerHTML = '';
  }
  
  window.missavJState.activeVideo = null;
  window.missavJState.isFloating = false;

  // Bersihkan observer dari player.js jika ada
  import('./player.js?v=2.8.29').then(m => {
    if (m.disconnectPlaceholderObserver) {
      m.disconnectPlaceholderObserver();
    }
  }).catch(() => {});
}

/**
 * Synchronizes selected visual state styling highlights on sidebar items
 */
function highlightActiveSidebarItem(activePath, activeSearch = '') {
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-nav button');
  const activeFullPath = activePath + activeSearch; // e.g. "/category?name=Uncensored"
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const cleanHref = href.replace('#', ''); // Remove hash prefix → "/category?name=Uncensored"
    const cleanHrefPath = cleanHref.split('?')[0]; // Just the path → "/category"
    
    // For parameterized routes, compare full path + query; for simple routes, compare path only
    const hasQuery = cleanHref.includes('?');
    const isMatch = hasQuery
      ? cleanHref === activeFullPath       // Exact match including query params
      : cleanHrefPath === activePath;       // Path-only match for simple routes
    
    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Dynamically injects and binds scroll-to-top floating elements
 */
function setupScrollTopButton() {
  if (document.getElementById('scroll-top-btn')) return;

  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.id = 'scroll-top-btn';
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.setAttribute('title', 'Back to Top');
  scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
  
  scrollTopBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;
  
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Setup and render premium floating Telegram button with localization and session dismiss support
 */
function setupFloatingTelegramButton() {
  if (sessionStorage.getItem('missav_tg_closed') === 'true') return;
  if (document.getElementById('floating-tg-wrapper')) return;

  const TG_LINKS = {
    id: 'https://t.me/missav_jav_english',
    en: 'https://t.me/missav_jav_english',
    'zh-TW': 'https://t.me/missav_jav_english',
    'zh-CN': 'https://t.me/missav_jav_english',
    ja: 'https://t.me/missav_jav_english',
    ko: 'https://t.me/missav_jav_english',
    ms: 'https://t.me/missav_jav_english',
    th: 'https://t.me/missav_jav_english',
    de: 'https://t.me/missav_jav_english',
    fr: 'https://t.me/missav_jav_english',
    vi: 'https://t.me/missav_jav_english',
    fil: 'https://t.me/missav_jav_english',
    pt: 'https://t.me/missav_jav_english'
  };

  const TEXTS = {
    id: { title: 'DOMAIN BACKUP', text: 'Gabung Telegram Kami' },
    en: { title: 'DOMAIN BACKUP', text: 'Join Our Telegram' },
    'zh-TW': { title: '備用網址', text: '加入官方電報群' },
    'zh-CN': { title: '备用网址', text: '加入官方电报群' },
    ja: { title: 'バックアップ', text: '公式テレグラムに参加' },
    ko: { title: '백업 도메인', text: '텔레그램 채널 가입' },
    ms: { title: 'DOMAIN BACKUP', text: 'Sertai Telegram Kami' },
    th: { title: 'โดเมนสำรอง', text: 'เข้าร่วม Telegram' },
    de: { title: 'BACKUP-DOMAIN', text: 'Treten Sie bei' },
    fr: { title: 'DOMAINE SECOURS', text: 'Rejoindre Telegram' },
    vi: { title: 'TÊN MIỀN DỰ PHÒNG', text: 'Tham gia Telegram' },
    fil: { title: 'BACKUP DOMAIN', text: 'Sumali sa Telegram' },
    pt: { title: 'DOMÍNIO BACKUP', text: 'Entrar no Telegram' }
  };

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'floating-tg-wrapper';
  wrapper.className = 'floating-tg-wrapper';

  document.body.appendChild(wrapper);

  // Update content based on current active language
  const updateContent = () => {
    const lang = i18n.getLang() || 'en';
    const link = TG_LINKS[lang] || TG_LINKS['en'];
    const content = TEXTS[lang] || TEXTS['en'];

    wrapper.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener" class="floating-tg-btn" title="${content.text}" aria-label="${content.text}">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.6 1.48-1.52 2.72-2.57 2.72-2.57.19-.18.06-.28-.18-.12-.34.23-2.9 1.93-3.8 2.53-.41.28-.78.34-1.06.33-.31-.01-.91-.18-1.36-.32-.55-.18-.99-.28-.95-.59.02-.16.24-.33.67-.51 2.62-1.14 8.74-3.7 10.74-4.52.54-.22.75-.26.88-.26.11 0 .28.03.37.11.08.07.11.17.11.27 0 .15-.02.43-.04.75z"/>
        </svg>
      </a>
      <div class="floating-tg-label" onclick="window.open('${link}', '_blank', 'noopener')">
        <span class="floating-tg-title">${content.title}</span>
        <span>${content.text}</span>
      </div>
      <button class="floating-tg-close" aria-label="Close Telegram pop">&times;</button>
    `;

    // Bind close event
    const closeBtn = wrapper.querySelector('.floating-tg-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.remove('visible');
        sessionStorage.setItem('missav_tg_closed', 'true');
        setTimeout(() => wrapper.remove(), 400);
      });
    }
  };

  updateContent();

  // Show after 3 seconds delay
  setTimeout(() => {
    if (sessionStorage.getItem('missav_tg_closed') !== 'true') {
      wrapper.classList.add('visible');
    }
  }, 3000);

  // Expose updater to sync language shifts
  window.missavJUpdateTelegramButton = updateContent;
}

/**
 * Dynamically injects floating Picture-in-Picture player wrapper to the page document body
 */
function setupFloatingPlayerDOM() {
  if (document.getElementById('floating-player-wrapper')) return;

  const float = document.createElement('div');
  float.id = 'floating-player-wrapper';
  float.className = 'floating-player-wrapper hidden';
  float.innerHTML = `
    <div class="floating-player-header">
      <span id="floating-player-title" class="text-ellipsis" data-i18n="now_playing">Now Playing...</span>
      <div class="floating-player-controls">
        <button id="floating-player-maximize" data-i18n-title="restore_full_screen" title="Restore to Full Screen">🗖</button>
        <button id="floating-player-close" data-i18n-title="close_player" title="Close Player">✕</button>
      </div>
    </div>
    <div id="floating-player-body" class="floating-player-body">
      <div class="player-iframe-container" id="player-container"></div>
    </div>
  `;
  document.body.appendChild(float);

  document.getElementById('floating-player-maximize').addEventListener('click', () => {
    if (window.missavJState.activeVideo) {
      const post = window.missavJState.activeVideo;
      window.missavJNavigateToWatch(post.id, post.code, post.title);
    }
  });

  // Click Close: Dispose player elements
  document.getElementById('floating-player-close').addEventListener('click', closeFloatingPlayer);

  // Re-align positioning dynamically when the viewport size changes (Theater Mode)
  window.addEventListener('resize', () => {
    const wrapper = document.getElementById('floating-player-wrapper');
    if (wrapper && wrapper.classList.contains('mode-theater') && !wrapper.classList.contains('hidden')) {
      import('./player.js?v=2.8.29').then(m => {
        if (m.alignGlobalPlayerWithPlaceholder) {
          m.alignGlobalPlayerWithPlaceholder();
        }
      }).catch(() => {});
    }
  });
}

/**
 * Registers global keyboard shortcut hotkeys
 */
function setupKeyboardHotkeys() {
  window.addEventListener('keydown', (e) => {
    // Escape keyboard listening if active element is an input bar
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    
    const iframe = document.querySelector('iframe');
    if (!iframe) return;

    // F: Toggle fullscreen presentation bounds on the player wrapper
    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const wrapper = document.getElementById('global-player-container');
      if (wrapper) {
        if (!document.fullscreenElement) {
          wrapper.requestFullscreen().catch(() => {});
          ui.showToast('Fullscreen Mode Activated 🖥️');
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
    // M: Focus frame mute keys
    else if (e.key.toLowerCase() === 'm') {
      iframe.focus();
      ui.showToast('Player focused. Press M to Mute.');
    }
    // Space: Play/Pause trigger frame bounds
    else if (e.code === 'Space') {
      e.preventDefault();
      iframe.focus();
      ui.showToast('Player focused. Press Space to Play/Pause.');
    }
  });
}

/**
 * Sets up 18 U.S.C. 2257 & DMCA modal events and text contents
 */
function setupLegalModals() {
  const btn2257 = document.getElementById('sidebar-legal-2257-btn');
  const btnDmca = document.getElementById('sidebar-legal-dmca-btn');
  const btnContact = document.getElementById('sidebar-legal-contact-btn');
  const overlay = document.getElementById('legal-modal-overlay');
  const title = document.getElementById('legal-modal-title');
  const body = document.getElementById('legal-modal-body');
  const closeBtn = document.getElementById('legal-modal-close-btn');

  if (!overlay || !title || !body || !closeBtn) return;

  const LEGAL_TEXTS = {
    '2257': {
      'en': {
        header: '18 U.S.C. § 2257 Record-Keeping Compliance Statement',
        p1: 'All visual materials displayed on this website (including images, preview clips, and video players) are produced and hosted by third-party content providers. Pursuant to Federal Law (18 U.S.C. § 2257), all actors, models, and performers appearing in these materials were of the age of majority (18 years of age or older) at the time the content was produced.',
        p2: 'Age verification and record-keeping compliance documentation for all performers are maintained by the original content producers and publishers of said content. This website does not produce, shoot, or upload any materials directly, and acts solely as an index/search interface for embedded external content.'
      },
      'id': {
        header: 'Pernyataan Kepatuhan Pencatatan 18 U.S.C. § 2257',
        p1: 'Semua materi visual yang ditampilkan di situs ini (termasuk gambar, cuplikan video, dan video player) diproduksi dan di-host oleh penyedia konten pihak ketiga. Sesuai dengan Hukum Federal Amerika Serikat (18 U.S.C. § 2257), semua aktor, model, dan pemeran yang muncul dalam materi ini berumur 18 tahun atau lebih pada saat materi tersebut diproduksi.',
        p2: 'Dokumentasi kepatuhan verifikasi usia dan pencatatan untuk semua pemeran diarsipkan dan dipelihara secara hukum oleh produser asli dan penerbit dari konten tersebut. Situs ini tidak memproduksi, merekam, atau mengunggah materi apa pun secara langsung, dan hanya berfungsi sebagai indeks/antarmuka pencarian untuk menyematkan (embed) konten eksternal.'
      },
      'zh-TW': {
        header: '18 U.S.C. § 2257 記錄保存合規聲明',
        p1: '本網站上顯示的所有視覺材料（包括圖片、預覽剪輯和影片播放器）均由第三方內容提供商製作和託管。根據美國聯邦法律（18 U.S.C. § 2257），此類材料中出現的所有演員、模特兒和表演者在內容製作時均已達到法定年齡（18歲或以上）。',
        p2: '所有表演者的年齡驗證和記錄保存合規文件均由該內容的原始內容製作商和發行商維護。本網站不直接製作、拍攝或上傳任何材料，僅作為嵌入式外部內容的索引/搜尋介面。'
      },
      'zh-CN': {
        header: '18 U.S.C. § 2257 记录保存合规声明',
        p1: '本网站上显示的所有视觉材料（包括图片、预览剪辑和视频播放器）均由第三方内容提供商制作和托管。根据美国联邦法律（18 U.S.C. § 2257），此类材料中出现的所有演员、模特和表演者在内容制作时均已达到法定年龄（18岁或以上）。',
        p2: '所有表演者的年龄验证和记录保存合规文件均由该内容的原始内容制作商和发行商维护。本网站不直接制作、拍摄或上传任何材料，仅作为嵌入式外部内容的索引/搜索界面。'
      },
      'ja': {
        header: '18 U.S.C. § 2257 記録保持遵守声明',
        p1: '当ウェブサイトに表示されるすべてのビジュアル資料（画像、プレビュークリップ、ビデオプレーヤーを含む）は、サードパーティのコンテンツプロバイダーによって制作およびホストされています。米国連邦法（18 U.S.C. § 2257）に基づき、これらの資料に登場するすべての俳優、モデル、およびパフォーマーは、コンテンツの制作時に成人年齢（18歳以上）に達していました。',
        p2: 'すべてのパフォーマーの年齢確認および記録保持コンプライアンス文書は、当該コンテンツの元のコンテンツプロデューサーおよびパブリッシャーによって維持されています。当ウェブサイトは、素材を直接制作、撮影、またはアップロードすることはなく、埋め込まれた外部コンテンツのインデックス/検索インターフェースとしてのみ機能します。'
      },
      'ko': {
        header: '18 U.S.C. § 2257 기록 보존 준수 선언문',
        p1: '본 웹사이트에 표시되는 모든 시각적 자료(이미지, 미리보기 클립 및 비디오 플레이어 포함)는 제3자 콘텐츠 제공업체에서 제작 및 호스팅합니다. 미국 연방법(18 U.S.C. § 2257)에 따라 이 자료에 출연하는 모든 배우, 모델 및 출연자는 콘텐츠가 제작될 당시 성인 연령(18세 이상)이었습니다.',
        p2: '모든 출연자의 연령 확인 및 기록 보존 준수 문서는 해당 콘텐츠의 원본 콘텐츠 제작자 및 게시자가 유지 및 관리합니다. 본 웹사이트는 어떠한 자료도 직접 제작, 촬영 또는 업로드하지 않으며, 삽입된 외부 콘텐츠의 색인/검색 인터페이스 역할만 수행합니다.'
      },
      'ms': {
        header: 'Pernyataan Pematuhan Penyimpanan Rekod 18 U.S.C. § 2257',
        p1: 'Semua bahan visual yang dipaparkan di laman web ini (termasuk imej, klip pratonton, dan pemain video) dihasilkan dan dihoskan oleh penyedia kandungan pihak ketiga. Menurut Undang-undang Persekutuan (18 U.S.C. § 2257), semua pelakon, model, dan penghibur yang muncul dalam bahan-bahan ini telah mencapai umur dewasa (18 tahun ke atas) pada masa kandungan itu dihasilkan.',
        p2: 'Dokumentasi pengesahan umur dan pematuhan penyimpanan rekod untuk semua penghibur diselenggara oleh pengeluar kandungan dan penerbit asal kandungan tersebut. Laman web ini tidak menghasilkan, merakam, atau memuat naik sebarang bahan secara langsung, dan hanya bertindak sebagai antarmuka indeks/carian untuk kandungan luaran yang disematkan.'
      },
      'th': {
        header: 'คำแถลงการปฏิบัติตามการเก็บรักษาบันทึกตาม 18 U.S.C. § 2257',
        p1: 'วัสดุทางภาพทั้งหมดที่แสดงบนเว็บไซต์นี้ (รวมถึงรูปภาพ คลิปตัวอย่าง และเครื่องเล่นวิดีโอ) ผลิตและจัดทำโดยผู้ให้บริการเนื้อหาบุคคลที่สาม ตามกฎหมายของสหพันธรัฐ (18 U.S.C. § 2257) นักแสดง นายแบบ และผู้แสดงทั้งหมดที่ปรากฏในวัสดุเหล่านี้มีอายุบรรลุนิติภาวะ (18 ปีขึ้นไป) ณ เวลาที่ผลิตเนื้อหา',
        p2: 'เอกสารการตรวจสอบอายุและการปฏิบัติตามการเก็บรักษาบันทึกสำหรับผู้แสดงทุกคนได้รับการดูแลโดยผู้ผลิตเนื้อหาและผู้เผยแพร่ต้นฉบับของเนื้อหาดังกล่าว เว็บไซต์นี้ไม่ได้ผลิต ถ่ายทำ หรืออัปโหลดวัสดุใด ๆ โดยตรง และทำหน้าที่เป็นเพียงอินเทอร์เฟซดัชนี/การค้นหาสำหรับเนื้อหาภายนอกที่ฝังไว้เท่านั้น'
      },
      'de': {
        header: '18 U.S.C. § 2257 Erklärung zur Einhaltung der Aufzeichnungspflichten',
        p1: 'Alle auf dieser Website angezeigten visuellen Materialien (einschließlich Bildern, Vorschau-Clips und Videoplayern) werden von Drittanbietern von Inhalten erstellt und gehostet. Gemäß dem Bundesgesetz (18 U.S.C. § 2257) waren alle in diesen Materialien auftretenden Schauspieler, Models und Darsteller zum Zeitpunkt der Erstellung der Inhalte volljährig (18 Jahre oder älter).',
        p2: 'Die Dokumentation zur Altersverifizierung und Einhaltung der Aufzeichnungspflichten für alle Darsteller wird von den ursprünglichen Inhaltsproduzenten und Herausgebern der genannten Inhalte gepflegt. Diese Website produziert, dreht oder lädt keine Materialien direkt hoch und fungiert ausschließlich als Index-/Suchoberfläche für eingebettete externe Inhalte.'
      },
      'fr': {
        header: 'Déclaration de conformité à la tenue des registres 18 U.S.C. § 2257',
        p1: 'Tous les documents visuels affichés sur ce site Web (y compris les images, les clips d\'aperçu et les lecteurs vidéo) sont produits et hébergés par des fournisseurs de contenu tiers. Conformément à la loi fédérale (18 U.S.C. § 2257), tous les acteurs, modèles et interprètes apparaissant dans ces documents étaient majeurs (âgés de 18 ans ou plus) au moment de la production du contenu.',
        p2: 'La documentation de vérification de l\'âge et de conformité à la tenue des registres pour tous les interprètes est tenue par les producteurs et éditeurs de contenu originaux desdits contenus. Ce site Web ne produit, ne filme ni ne télécharge aucun matériel directement, et agit uniquement en tant qu\'interface d\'indexation/recherche pour le contenu externe intégré.'
      },
      'vi': {
        header: 'Tuyên bố tuân thủ lưu trữ hồ sơ theo 18 U.S.C. § 2257',
        p1: 'Tất cả các tài liệu trực quan được hiển thị trên trang web này (bao gồm hình ảnh, clip xem trước và trình phát video) đều được sản xuất và lưu trữ bởi các nhà cung cấp nội dung bên thứ ba. Theo Luật Liên bang (18 U.S.C. § 2257), tất cả các diễn viên, người mẫu và người biểu diễn xuất hiện trong các tài liệu này đều đã đến tuổi trưởng thành (từ 18 tuổi trở lên) tại thời điểm nội dung được sản xuất.',
        p2: 'Tài liệu xác minh độ tuổi và tuân thủ lưu trữ hồ sơ cho tất cả những người biểu diễn được duy trì bởi các nhà sản xuất và nhà xuất bản nội dung gốc của nội dung đó. Trang web này không trực tiếp sản xuất, quay phim hoặc tải lên bất kỳ tài liệu nào và chỉ đóng vai trò là giao diện chỉ mục/tìm kiếm cho nội dung bên ngoài được nhúng.'
      },
      'fil': {
        header: 'Pahayag ng Pagsunod sa Pagpapanatili ng Rekord ng 18 U.S.C. § 2257',
        p1: 'Ang lahat ng visual na materyales na ipinapakita sa website na ito (kabilang ang mga larawan, preview clip, at video player) ay ginawa at hino-host ng mga third-party content provider. Alinsunod sa Batas Pederal (18 U.S.C. § 2257), ang lahat ng aktor, modelo, at performer na lumalabas sa mga materyales na ito ay nasa legal na edad (18 taong gulang o mas matanda) sa oras na ginawa ang nilalaman.',
        p2: 'Ang pagpapatunay ng edad at mga dokumento ng pagsunod sa pagpapanatili ng rekord para sa lahat ng performer ay pinapanatili ng mga orihinal na producer at publisher ng nasabing nilalaman. Ang website na ito ay hindi direktang gumagawa, kumukuha ng video, o nag-a-upload ng anumang materyales, at nagsisilbi lamang bilang index/search interface para sa mga naka-embed na panlabas na nilalaman.'
      },
      'pt': {
        header: 'Declaração de Conformidade de Manutenção de Registros 18 U.S.C. § 2257',
        p1: 'Todos os materiais visuais exibidos neste site (incluindo imagens, clipes de visualização e players de vídeo) são produzidos e hospedados por provedores de conteúdo terceirizados. De acordo com a Lei Federal (18 U.S.C. § 2257), todos os artistas que aparecem nesses materiais eram maiores de idade (18 anos ou mais) no momento em que o conteúdo foi produzido.',
        p2: 'A documentação de verificação de idade e conformidade com a manutenção de registros de todos os artistas é mantida pelos produtores e editores de conteúdo originais dos referidos conteúdos. Este site não produz, filma ou envia quaisquer materiais diretamente, e atua exclusivamente como uma interface de índice/busca para conteúdo externo incorporado.'
      }
    },
    'dmca': {
      'en': {
        header: 'DMCA (Digital Millennium Copyright Act) Policy',
        p1: 'MISSAV-J respects the intellectual property rights of others. We are a search and indexing portal for third-party videos and do not host, store, or stream any video files on our own servers. All videos are embedded from external sources.',
        p2: 'If you believe that your copyrighted work has been linked to or displayed on this website in a way that constitutes copyright infringement, please submit a formal DMCA take-down notice.',
        listIntro: 'Your notice must include:',
        li1: 'A physical or electronic signature of the copyright owner or authorized representative.',
        li2: 'Identification of the copyrighted work claimed to have been infringed.',
        li3: 'Specific URL links on our site containing the link you wish to have removed.',
        li4: 'Your contact details including Name, Email, and Phone.',
        li5: 'A statement that you have a good faith belief that use of the material is unauthorized.',
        emailText: 'Please send your complaint directly to our workable compliance email address: compliance@missav-j.com',
        footer: 'We will process your request and remove the infringing links within 24 to 48 business hours.'
      },
      'id': {
        header: 'Kebijakan Hak Cipta DMCA',
        p1: 'MISSAV-J menghormati hak kekayaan intelektual orang lain. Kami adalah portal pencarian dan indeks untuk video pihak ketiga dan tidak meng-host, menyimpan, atau menayangkan file video apa pun di server kami. Semua video disematkan (embed) dari sumber luar.',
        p2: 'Jika Anda percaya bahwa karya berhak cipta Anda telah ditautkan atau ditampilkan di situs ini dengan cara yang melanggar hak cipta, silakan kirimkan pemberitahuan penghapusan resmi (DMCA).',
        listIntro: 'Pemberitahuan Anda harus menyertakan:',
        li1: 'Tanda tangan fisik atau elektronik dari pemilik hak cipta atau perwakilan resmi.',
        li2: 'Identifikasi karya berhak cipta yang diklaim telah dilanggar.',
        li3: 'URL spesifik di situs kami yang ingin dihapus.',
        li4: 'Informasi kontak Anda termasuk Nama, Email, dan Telepon.',
        li5: 'Pernyataan iktikad baik bahwa penggunaan materi tersebut tidak sah.',
        emailText: 'Silakan kirimkan pengaduan Anda langsung ke email kepatuhan kami yang aktif: compliance@missav-j.com',
        footer: 'Kami akan memproses permintaan Anda dan menghapus tautan yang melanggar dalam waktu 24 hingga 48 jam kerja.'
      },
      'zh-TW': {
        header: 'DMCA (數位千禧年著作權法) 政策',
        p1: 'MISSAV-J 尊重他人的智慧財產權。我們是第三方影片的搜尋和索引門戶網站，不在我們自己的伺服器上託管、儲存或串流傳輸任何影片檔案。所有影片均嵌入自外部來源。',
        p2: '如果您認為您的有著作權作品以構成著作權侵權的方式在本網站上被連結或顯示，請提交正式的 DMCA 下架通知。',
        listIntro: '您的通知必須包括：',
        li1: '著作權所有人或授權代表的實體或電子簽名。',
        li2: '聲稱受到侵權的有著作權作品的識別。',
        li3: '我們網站上包含您希望刪除的連結的具體 URL 連結。',
        li4: '您的聯絡方式，包括姓名、電子郵件和電話。',
        li5: '聲明您誠實地相信該材料的使用未經授權。',
        emailText: '請將您的投訴直接發送至我們的合規電子郵件地址：compliance@missav-j.com',
        footer: '我們將在 24 至 48 個工作小時內處理您的請求並刪除侵權連結。'
      },
      'zh-CN': {
        header: 'DMCA (数字千年版权法) 政策',
        p1: 'MISSAV-J 尊重他人的知识产权。我们是第三方视频的搜索和索引门户网站，不在我们自己的服务器上托管、存储或流式传输任何视频文件。所有视频均嵌入自外部来源。',
        p2: '如果您认为您的有著作权作品以构成著作权侵权的方式在本网站上被链接或显示，请提交正式的 DMCA 下架通知。',
        listIntro: '您的通知必须包括：',
        li1: '著作权所有人或授权代表的实体或电子签名。',
        li2: '声称受到侵权的有著作权作品的识别。',
        li3: '我们网站上包含您希望删除的链接的具体 URL 链接。',
        li4: '您的联络方式，包括姓名、电子邮件和电话。',
        li5: '声明您诚实地相信该材料的使用未经授权。',
        emailText: '请将您的投诉直接发送至我们的合规电子邮件地址：compliance@missav-j.com',
        footer: '我们将在 24 至 48 个工作小时内处理您的请求并删除侵权链接。'
      },
      'ja': {
        header: 'DMCA (デジタルミレニアム著作権法) ポリシー',
        p1: 'MISSAV-Jは他者の知的財産権を尊重します。当サイトはサードパーティ動画の検索およびインデックスポータルであり、自社サーバーで動画ファイルをホスト、保存、またはストリーミングすることはありません。すべての動画は外部ソースから埋め込まれています。',
        p2: 'ご自身の著作物が著作権侵害にあたる方法で当ウェブサイトにリンクまたは表示されていると思われる場合は、正式なDMCA削除申し立てを送付してください。',
        listIntro: '通知には以下を含める必要があります：',
        li1: '著作権者または授権代理人の物理的または電子的な署名。',
        li2: '侵害されたと主張する著作物の特定。',
        li3: '削除を希望するリンクが含まれている、当サイト上の特定のURLリンク。',
        li4: '氏名、メールアドレス、電話番号を含む連絡先詳細。',
        li5: '素材の使用が許可されていないと善意で信じる旨の声明。',
        emailText: '苦情は、弊社のアクティブなコンプライアンス電子メールアドレスに直接送信してください：compliance@missav-j.com',
        footer: '弊社はリクエストを処理し、24〜48営業時間内に対象リンクを削除いたします。'
      },
      'ko': {
        header: 'DMCA (디지털 밀레니엄 저작권법) 정책',
        p1: 'MISSAV-J는 타인의 지적 재산권을 존중합니다. 본 사이트는 제3자 비디오의 검색 및 색인 포털이며, 자체 서버에 비디오 파일을 호스팅, 저장 또는 스트리밍하지 않습니다. 모든 비디오는 외부 소스에서 삽입되었습니다.',
        p2: '귀하의 저작물이 저작권을 침해하는 방식으로 본 웹사이트에 링크되거나 표시되었다고 판단되는 경우, 공식 DMCA 침해 신고서를 제출해 주시기 바랍니다.',
        listIntro: '침해 신고서에는 다음 사항이 포함되어야 합니다:',
        li1: '저작권자 또는 권한을 위임받은 대리인의 실물 또는 전자 서명.',
        li2: '침해를 주장하는 저작물에 대한 정보.',
        li3: '삭제를 원하는 링크가 포함된 본 사이트의 특정 URL 주소.',
        li4: '성명, 이메일, 전화번호를 포함한 귀하의 연락처 정보.',
        li5: '해당 자료의 사용이 허가되지 않았다는 신념을 표명하는 진술서.',
        emailText: '침해 신고는 당사의 활성 컴플라이언스 이메일 주소로 직접 보내주시기 바랍니다: compliance@missav-j.com',
        footer: '당사는 귀하의 요청을 처리하고 영업일 기준 24~48시간 이내에 침해 링크를 제거합니다.'
      },
      'ms': {
        header: 'Polisi DMCA (Digital Millennium Copyright Act)',
        p1: 'MISSAV-J menghormati hak harta intelek orang lain. Kami ialah portal carian dan indeks untuk video pihak ketiga dan tidak mengehos, menyimpan atau menstrim sebarang fail video pada pelayan kami sendiri. Semua video disematkan daripada sumber luaran.',
        p2: 'Jika anda percaya bahawa karya hak cipta anda telah dipautkan atau dipaparkan di laman web ini dengan cara yang membentuk pelanggaran hak cipta, sila serahkan notis penyingkiran DMCA rasmi.',
        listIntro: 'Notis anda mesti termasuk:',
        li1: 'Tandatangan fizikal atau elektronik pemilik hak cipta atau wakil sah.',
        li2: 'Pengenalan karya berhak cipta yang didakwa telah dilanggar.',
        li3: 'Pautan URL khusus di laman web kami yang mengandungi pautan yang anda mahu dialih keluar.',
        li4: 'Butiran hubungan anda termasuk Nama, E-mel dan Telefon.',
        li5: 'Pernyataan bahawa anda mempunyai kepercayaan dengan niat baik bahawa penggunaan bahan tersebut tidak dibenarkan.',
        emailText: 'Sila hantar aduan anda terus ke alamat e-mel pematuhan kami yang aktif: compliance@missav-j.com',
        footer: 'Kami akan memproses permintaan anda dan mengalih keluar pautan yang melanggar dalam tempoh 24 hingga 48 jam perniagaan.'
      },
      'th': {
        header: 'นโยบาย DMCA (Digital Millennium Copyright Act)',
        p1: 'MISSAV-J เคารพสิทธิ์ในทรัพย์สินทางปัญญาของผู้อื่น เราเป็นพอร์ทัลค้นหาและจัดทำดัชนีสำหรับวิดีโอของบุคคลที่สาม และไม่ได้โฮสต์ จัดเก็บ หรือสตรีมไฟล์วิดีโอใด ๆ บนเซิร์ฟเวอร์ของเราเอง วิดีโอทั้งหมดถูกฝังมาจากแหล่งภายนอก',
        p2: 'หากคุณเชื่อว่าผลงานที่มีลิขสิทธิ์ของคุณถูกลิงก์หรือแสดงบนเว็บไซต์นี้ในลักษณะที่เป็นการละเมิดลิขสิทธิ์ โปรดส่งคำแจ้งเตือนการนำ DMCA ออกอย่างเป็นทางการ',
        listIntro: 'คำประกาศของคุณต้องประกอบด้วย:',
        li1: 'ลายเซ็นจริงหรือลายเซ็นอิเล็กทรอนิกส์ของเจ้าของลิขสิทธิ์หรือตัวแทนที่ได้รับมอบอำนาจ',
        li2: 'การระบุผลงานที่มีลิขสิทธิ์ซึ่งถูกอ้างว่าถูกละเมิด',
        li3: 'ลิงก์ URL เฉพาะบนไซต์ของเราที่มีลิงก์ที่คุณต้องการให้นำออก',
        li4: 'รายละเอียดการติดต่อของคุณ รวมถึงชื่อ อีเมล และโทรศัพท์',
        li5: 'คำแถลงว่าคุณเชื่อโดยสุจริตว่าการใช้เนื้อหานั้นไม่ได้รับอนุญาต',
        emailText: 'โปรดส่งข้อร้องเรียนของคุณไปยังที่อยู่อีเมลการปฏิบัติตามข้อกำหนดของเราโดยตรงที่: compliance@missav-j.com',
        footer: 'เราจะดำเนินการตามคำขอของคุณและนำลิงก์ที่ละเมิดออกภายใน 24 ถึง 48 ชั่วโมงทำการ'
      },
      'de': {
        header: 'DMCA-Richtlinie (Digital Millennium Copyright Act)',
        p1: 'MISSAV-J respektiert die Rechte an geistigem Eigentum anderer. Wir sind ein Such- und Indexierungsportal für Videos von Drittanbietern und hosten, speichern oder streamen keine Videodateien auf unseren eigenen Servern. Alle Videos sind aus externen Quellen eingebettet.',
        p2: 'Wenn Sie glauben, dass Ihr urheberrechtlich geschütztes Werk auf eine Weise verlinkt oder auf dieser Website angezeigt wurde, die eine Urheberrechtsverletzung darstellt, reichen Sie bitte eine formelle DMCA-Takedown-Benachrichtigung ein.',
        listIntro: 'Ihre Benachrichtigung muss Folgendes enthalten:',
        li1: 'Eine physische oder elektronische Unterschrift des Urheberrechtsinhabers oder des bevollmächtigten Vertreters.',
        li2: 'Identifizierung des urheberrechtlich geschützten Werks, das angeblich verletzt wurde.',
        li3: 'Spezifische URL-Links auf unserer Website, die den zu entfernenden Link enthalten.',
        li4: 'Ihre Kontaktdaten einschließlich Name, E-Mail-Adresse und Telefonnummer.',
        li5: 'Eine Erklärung, dass Sie in gutem Glauben davon ausgehen, dass die Nutzung des Materials nicht genehmigt ist.',
        emailText: 'Bitte senden Sie Ihre Beschwerde direkt an unsere aktive Compliance-E-Mail-Adresse: compliance@missav-j.com',
        footer: 'Wir werden Ihre Anfrage bearbeiten und die verletzenden Links innerhalb von 24 bis 48 Geschäftsstunden entfernen.'
      },
      'fr': {
        header: 'Politique DMCA (Digital Millennium Copyright Act)',
        p1: 'MISSAV-J respecte les droits de propriété intellectuelle de l\'autrui. Nous sommes un portail de recherche et d\'indexation de vidéos tierces et n\'hébergeons, ne stockons ni ne diffusons aucun fichier vidéo sur nos propres serveurs. Toutes les vidéos sont intégrées à partir de sources externes.',
        p2: 'Si vous pensez que votre œuvre protégée par le droit d\'auteur a été liée ou affichée sur ce site Web d\'une manière qui constitue une violation du droit d\'auteur, veuillez soumettre un avis de suppression formel DMCA.',
        listIntro: 'Votre avis doit inclure :',
        li1: 'Une signature physique ou électronique du titulaire des droits d\'auteur ou de son représentant autorisé.',
        li2: 'Identification de l\'œuvre protégée par le droit d\'auteur prétendument contrefaite.',
        li3: 'Liens URL spécifiques sur notre site contenant le lien que vous souhaitez faire supprimer.',
        li4: 'Vos coordonnées y compris votre nom, adresse e-mail et numéro de téléphone.',
        li5: 'Une déclaration selon laquelle vous croyez de bonne foi que l\'utilisation du matériel n\'est pas autorisée.',
        emailText: 'Veuillez envoyer votre plainte directement à notre adresse e-mail de conformité active : compliance@missav-j.com',
        footer: 'Nous traiterons votre demande et supprimerons les liens contrefaits dans un délai de 24 à 48 heures ouvrables.'
      },
      'vi': {
        header: 'Chính sách DMCA (Digital Millennium Copyright Act)',
        p1: 'MISSAV-J tôn trọng quyền sở hữu trí tuệ của người khác. Chúng tôi là cổng tìm kiếm và lập chỉ mục cho các video của bên thứ ba, đồng thời không lưu trữ, lưu giữ hoặc phát trực tuyến bất kỳ tệp video nào trên máy chủ của riêng mình. Tất cả các video đều được nhúng từ các nguồn bên ngoài.',
        p2: 'Nếu bạn tin rằng tác phẩm có bản quyền của mình đã được liên kết hoặc hiển thị trên trang web này theo cách cấu thành hành vi vi phạm bản quyền, vui lòng gửi thông báo gỡ bỏ DMCA chính thức.',
        listIntro: 'Thông báo của bạn phải bao gồm:',
        li1: 'Chữ ký vật lý hoặc điện tử của chủ sở hữu bản quyền hoặc đại diện được ủy quyền.',
        li2: 'Xác định tác phẩm có bản quyền bị cáo buộc là vi phạm.',
        li3: 'Các liên kết URL cụ thể trên trang web của chúng tôi chứa liên kết bạn muốn xóa.',
        li4: 'Thông tin liên hệ của bạn bao gồm Tên, Email và Điện thoại.',
        li5: 'Một tuyên bố rằng bạn tin tưởng một cách thiện chí rằng việc sử dụng tài liệu đó là không được phép.',
        emailText: 'Vui lòng gửi khiếu nại của bạn trực tiếp đến địa chỉ email tuân thủ đang hoạt động của chúng tôi: compliance@missav-j.com',
        footer: 'Chúng tôi sẽ xử lý yêu cầu của bạn và xóa các liên kết vi phạm trong vòng 24 đến 48 giờ làm việc.'
      },
      'fil': {
        header: 'Patakaran ng DMCA (Digital Millennium Copyright Act)',
        p1: 'Ipinapasa ng MISSAV-J ang mga karapatan sa ari-ariang intelektwal ng iba. Kami ay isang portal ng paghahanap at pag-index para sa mga video ng ikatlong partido at hindi nagho-host, nag-iimbak, o nag-i-stream ng anumang mga file ng video sa aming sariling mga server. Ang lahat ng mga video ay naka-embed mula sa mga panlabas na mapagkukunan.',
        p2: 'Kung naniniwala ka na ang iyong gawaing may karapatang-ari ay na-link o naipakita sa website na ito sa paraang lumalabag sa karapatang-ari, mangyaring magsumite ng pormal na paunawa ng pagtanggal ng DMCA.',
        listIntro: 'Ang iyong paunawa ay dapat maglaman ng:',
        li1: 'Fisikal o elektronikong lagda ng may-ari ng karapatang-ari o awtorisadong kinatawan.',
        li2: 'Pagtukoy sa gawaing may karapatang-ari na inaangking nilabag.',
        li3: 'Tiyak na mga URL link sa aming site na naglalaman ng link na nais mong alisin.',
        li4: 'Iyong mga detalye sa pakikipag-ugnayan kabilang ang Pangalan, Email, at Telepono.',
        li5: 'Isang pahayag na naniniwala ka nang may mabuting katapatan na ang paggamit ng materyal ay walang pahintulot.',
        emailText: 'Mangyaring ipadala ang iyong reklamo nang direkta sa aming aktibong email address ng pagsunod: compliance@missav-j.com',
        footer: 'Ipoproseso namin ang iyong kahilingan at aalisin ang mga lumalabag na link sa loob ng 24 hanggang 48 oras ng negosyo.'
      },
      'pt': {
        header: 'Política do DMCA (Digital Millennium Copyright Act)',
        p1: 'O MISSAV-J respeita os direitos de propriedade intelectual de terceiros. Somos um portal de busca e indexação de vídeos de terceiros e não hospedamos, armazenamos ou transmitimos quaisquer arquivos de vídeo em nossos próprios servidores. Todos os vídeos são incorporados de fontes externas.',
        p2: 'Se você acredita que seu trabalho protegido por direitos autorais foi vinculado ou exibido neste site de uma forma que constitua violação de direitos autorais, envie uma notificação formal de remoção do DMCA.',
        listIntro: 'Sua notificação deve incluir:',
        li1: 'Uma assinatura física ou eletrônica do proprietário dos direitos autorais ou representante autorizado.',
        li2: 'Identificação do trabalho protegido por direitos autorais que se alega ter sido violado.',
        li3: 'Links de URL específicos em nosso site contendo o link que você deseja remover.',
        li4: 'Seus detalhes de contato, incluindo Nome, E-mail e Telefone.',
        li5: 'Uma declaração de que você acredita de boa-fé que o uso do material não é autorizado.',
        emailText: 'Envie sua reclamação diretamente para nosso endereço de e-mail de conformidade ativo: compliance@missav-j.com',
        footer: 'Processaremos sua solicitação e removeremos os links infratores em até 24 a 48 horas úteis.'
      }
    },
    'contact': {
      'en': {
        adsHeader: 'Partnerships & Advertising',
        adsText: 'For advertising placements, banner sponsorships, partnerships, or business proposals, please contact our advertising team.',
        supportHeader: 'General Support',
        supportText: 'For website feedback, technical issues, content inquiries, or general support requests, feel free to reach out.',
        emailText: 'Send your inquiries directly to our contact email: compliance@missav-j.com',
        footer: 'We typically respond to all legitimate inquiries within 24 to 48 business hours.'
      },
      'id': {
        adsHeader: 'Kemitraan & Iklan',
        adsText: 'Untuk penawaran iklan, penempatan banner, kemitraan, atau proposal bisnis, silakan hubungi tim periklanan kami.',
        supportHeader: 'Dukungan Umum',
        supportText: 'Untuk pertanyaan umum, kendala teknis, masukan situs web, atau bantuan lainnya, jangan ragu untuk menghubungi kami.',
        emailText: 'Kirim pertanyaan Anda langsung ke email kontak kami: compliance@missav-j.com',
        footer: 'Kami biasanya menanggapi semua pertanyaan resmi dalam waktu 24 hingga 48 jam hari kerja.'
      },
      'zh-TW': {
        adsHeader: '商務合作與廣告',
        adsText: '如需廣告投放、橫幅贊助、合作夥伴關係或商業提案，請與我們的廣告團隊聯絡。',
        supportHeader: '一般支援',
        supportText: '對於網站反饋、技術問題、內容諮詢或一般支援請求，請隨時與我們聯絡。',
        emailText: '請將您的諮詢直接發送至我們的聯絡電子郵件：compliance@missav-j.com',
        footer: '我們通常會在 24 至 48 個工作小時內回覆所有合法諮詢。'
      },
      'zh-CN': {
        adsHeader: '商务合作与广告',
        adsText: '如需广告投放、横幅赞助、合作伙伴关系 or 商业提案，请与我们的广告团队联络。',
        supportHeader: '一般支援',
        supportText: '对于网站反馈、技术问题、内容咨询 or 一般支援请求，请随时与我们联络。',
        emailText: '请将您的咨询直接发送至我们的联络电子邮件：compliance@missav-j.com',
        footer: '我们通常会在 24 至 48 个工作小时内回复所有合法咨询。'
      },
      'ja': {
        adsHeader: 'パートナーシップ・広告掲載',
        adsText: '広告掲載、バナースポンサーシップ、提携、またはビジネス提案については、広告チームまでお問い合わせください。',
        supportHeader: '一般的なサポート',
        supportText: 'ウェブサイトのフィードバック、技術的な問題、コンテンツに関するお問い合わせ、または一般的なサポートリクエストについては、お気軽にお問い合わせください。',
        emailText: 'お問い合わせは、連絡先メールアドレスまで直接送信してください：compliance@missav-j.com',
        footer: '通常、営業日24〜48時間以内にすべての正当なお問い合わせに対応いたします。'
      },
      'ko': {
        adsHeader: '제휴 및 광고',
        adsText: '광고 게재, 배너 후원, 제휴 또는 비즈니스 제안은 광고 팀에 문의하십시오.',
        supportHeader: '일반 지원',
        supportText: '웹사이트 피드백, 기술적 문제, 콘텐츠 문의 또는 일반적인 지원 요청은 언제든지 문의해 주십시오.',
        emailText: '문의 사항은 공식 연락처 이메일로 직접 보내주십시오: compliance@missav-j.com',
        footer: '당사는 영업일 기준 24~48시간 이내에 모든 합법적인 문의에 답변해 드립니다.'
      },
      'ms': {
        adsHeader: 'Kerjasama & Pengiklanan',
        adsText: 'Untuk penempatan iklan, penajaan banner, perkongsian, atau cadangan perniagaan, sila hubungi pasukan pengiklanan kami.',
        supportHeader: 'Sokongan Umum',
        supportText: 'Untuk maklum balas laman web, isu teknikal, pertanyaan kandungan, atau permintaan sokongan umum, sila hubungi kami.',
        emailText: 'Hantar pertanyaan anda terus ke e-mel hubungan kami: compliance@missav-j.com',
        footer: 'Kami biasanya maklum balas kepada semua pertanyaan rasmi dalam masa 24 hingga 48 jam waktu bekerja.'
      },
      'th': {
        adsHeader: 'พันธมิตรและการโฆษณา',
        adsText: 'สำหรับการลงโฆษณา สปอนเซอร์แบนเนอร์ พันธมิตร หรือข้อเสนอทางธุรกิจ โปรดติดต่อทีมโฆษณาของเรา',
        supportHeader: 'การสนับสนุนทั่วไป',
        supportText: 'สำหรับข้อเสนอแนะเกี่ยวกับเว็บไซต์ ปัญหาทางเทคนิค การสอบถามข้อมูลเนื้อหา หรือคำขอรับความช่วยเหลือทั่วไป โปรดติดต่อเรา',
        emailText: 'ส่งคำถามของคุณโดยตรงไปที่อีเมลติดต่อของเรา: compliance@missav-j.com',
        footer: 'ปกติเราจะตอบกลับคำถามที่เป็นทางการทั้งหมดภายใน 24 ถึง 48 ชั่วโมงทำการ'
      },
      'de': {
        adsHeader: 'Partnerschaften & Werbung',
        adsText: 'Für Werbeplatzierungen, Bannersponsorings, Partnerships oder Geschäftsvorschläge wenden Sie sich bitte an unser Werbeteam.',
        supportHeader: 'Allgemeiner Support',
        supportText: 'Bei Feedback zur Website, technischen Problemen, Inhaltsanfragen oder allgemeinen Supportanfragen können Sie sich gerne an uns wenden.',
        emailText: 'Senden Sie Ihre Anfragen direkt an unsere Kontakt-E-Mail: compliance@missav-j.com',
        footer: 'Wir antworten in der Regel auf alle legitimen Anfragen innerhalb von 24 bis 48 Geschäftsstunden.'
      },
      'fr': {
        adsHeader: 'Partenariats & Publicité',
        adsText: 'Pour les placements publicitaires, les parrainages de bannières, les partenariats ou les propositions commerciales, veuillez contacter notre équipe publicitaire.',
        supportHeader: 'Support Général',
        supportText: 'Pour les retours sur le site web, les problèmes techniques, les demandes de contenu ou les demandes de support général, n\'hésitez pas à nous contacter.',
        emailText: 'Envoyez vos demandes directement à notre adresse e-mail de contact : compliance@missav-j.com',
        footer: 'Nous répondons généralement à toutes les demandes légitimes dans les 24 à 48 heures ouvrables.'
      },
      'vi': {
        adsHeader: 'Hợp tác & Quảng cáo',
        adsText: 'Đối với các vị trí đặt quảng cáo, tài trợ biểu ngữ, quan hệ đối tác hoặc đề xuất kinh doanh, vui lòng liên hệ với nhóm quảng cáo của chúng tôi.',
        supportHeader: 'Hỗ trợ chung',
        supportText: 'Đối với phản hồi về trang web, sự cố kỹ thuật, câu hỏi về nội dung hoặc yêu cầu hỗ trợ chung, vui lòng liên hệ với chúng tôi.',
        emailText: 'Gửi yêu cầu của bạn trực tiếp đến email liên hệ của chúng tôi: compliance@missav-j.com',
        footer: 'Chúng tôi thường phản hồi tất cả các yêu cầu hợp lệ trong vòng 24 đến 48 giờ làm việc.'
      },
      'fil': {
        adsHeader: 'Pakikipagtulungan at Patalastas',
        adsText: 'Para sa mga pagkakalagay ng patalastas, mga sponsorship ng banner, pakikipagtulungan, o mga panukalang negosyo, mangyaring makipag-ugnayan sa aming koponan sa patalastas.',
        supportHeader: 'Pangkalahatang Suporta',
        supportText: 'Para sa feedback sa website, mga teknikal na isyu, mga pagtatanong sa nilalaman, o mga pangkalahatang kahilingan sa suporta, huwag mag-atubiling makipag-ugnayan.',
        emailText: 'Ipadala ang iyong mga katanungan nang direkta sa aming contact email: compliance@missav-j.com',
        footer: 'Karaniwan kaming tumutugon sa lahat ng lehitimong katanungan sa loob ng 24 hanggang 48 oras ng negosyo.'
      },
      'pt': {
        adsHeader: 'Parcerias & Publicidade',
        adsText: 'Para veiculação de anúncios, patrocínio de banners, parcerias ou propostas comerciais, entre em contato com nossa equipe de publicidade.',
        supportHeader: 'Suporte Geral',
        supportText: 'Para feedback do site, problemas técnicos, consultas de conteúdo ou solicitações de suporte geral, sinta-se à vontade para entrar em contato.',
        emailText: 'Envie suas dúvidas diretamente para o nosso e-mail de contato: compliance@missav-j.com',
        footer: 'Geralmente respondemos a todas as consultas legítimas dentro de 24 a 48 horas úteis.'
      }
    }
  };

  const showModal = (type) => {
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');

    const activeLang = i18n.getLang() || 'en';
    const isEn = activeLang === 'en';

    if (type === '2257') {
      title.textContent = i18n.t('legal_2257_title') || '18 U.S.C. 2257 Compliance Statement';
      
      const contentLang = LEGAL_TEXTS['2257'][activeLang] || LEGAL_TEXTS['2257']['en'];
      const contentEn = LEGAL_TEXTS['2257']['en'];

      let bodyHtml = `
        <div style="margin-bottom: 20px;">
          <h3 style="color: var(--color-text, #fff); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">${contentLang.header}</h3>
          <p style="margin-bottom: 12px; line-height: 1.5;">${contentLang.p1}</p>
          <p style="margin-bottom: 12px; line-height: 1.5;">${contentLang.p2}</p>
        </div>
      `;

      if (!isEn) {
        bodyHtml += `
          <hr style="border: 0; border-top: 1px solid var(--color-border, rgba(255,255,255,0.08)); margin: 16px 0;">
          <div style="opacity: 0.7;">
            <h3 style="color: var(--color-text, #fff); font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">${contentEn.header} (Original)</h3>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.p1}</p>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.p2}</p>
          </div>
        `;
      }
      body.innerHTML = bodyHtml;

    } else if (type === 'dmca') {
      title.textContent = i18n.t('legal_dmca_title') || 'DMCA Copyright Policy';

      const contentLang = LEGAL_TEXTS['dmca'][activeLang] || LEGAL_TEXTS['dmca']['en'];
      const contentEn = LEGAL_TEXTS['dmca']['en'];

      let bodyHtml = `
        <div style="margin-bottom: 20px;">
          <h3 style="color: var(--color-text, #fff); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">${contentLang.header}</h3>
          <p style="margin-bottom: 12px; line-height: 1.5;">${contentLang.p1}</p>
          <p style="margin-bottom: 12px; line-height: 1.5;">${contentLang.p2}</p>
          <p style="margin-bottom: 12px; line-height: 1.5;"><strong>${contentLang.listIntro}</strong></p>
          <ul style="margin-bottom: 12px; padding-left: 20px; list-style-type: disc; line-height: 1.5;">
            <li>${contentLang.li1}</li>
            <li>${contentLang.li2}</li>
            <li>${contentLang.li3}</li>
            <li>${contentLang.li4}</li>
            <li>${contentLang.li5}</li>
          </ul>
          <p style="margin-bottom: 12px; line-height: 1.5;">
            ${contentLang.emailText.replace('compliance@missav-j.com', '<strong style="color: var(--color-accent, #ff003c); font-weight: 700;">compliance@missav-j.com</strong>')}
          </p>
          <p style="margin-bottom: 12px; line-height: 1.5;">${contentLang.footer}</p>
        </div>
      `;

      if (!isEn) {
        bodyHtml += `
          <hr style="border: 0; border-top: 1px solid var(--color-border, rgba(255,255,255,0.08)); margin: 16px 0;">
          <div style="opacity: 0.7;">
            <h3 style="color: var(--color-text, #fff); font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">${contentEn.header} (Original)</h3>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.p1}</p>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.p2}</p>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);"><strong>${contentEn.listIntro}</strong></p>
            <ul style="margin-bottom: 12px; padding-left: 20px; list-style-type: disc; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">
              <li>${contentEn.li1}</li>
              <li>${contentEn.li2}</li>
              <li>${contentEn.li3}</li>
              <li>${contentEn.li4}</li>
              <li>${contentEn.li5}</li>
            </ul>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">
              ${contentEn.emailText.replace('compliance@missav-j.com', '<strong style="font-weight: 700;">compliance@missav-j.com</strong>')}
            </p>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.footer}</p>
          </div>
        `;
      }
      body.innerHTML = bodyHtml;
    } else if (type === 'contact') {
      title.textContent = i18n.t('legal_contact_title') || 'Contact Us & Partnerships';

      const contentLang = LEGAL_TEXTS['contact'][activeLang] || LEGAL_TEXTS['contact']['en'];
      const contentEn = LEGAL_TEXTS['contact']['en'];

      let bodyHtml = `
        <div style="margin-bottom: 20px;">
          <h3 style="color: var(--color-text, #fff); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">📢 ${contentLang.adsHeader}</h3>
          <p style="margin-bottom: 16px; line-height: 1.5;">${contentLang.adsText}</p>
          
          <h3 style="color: var(--color-text, #fff); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">🛠️ ${contentLang.supportHeader}</h3>
          <p style="margin-bottom: 16px; line-height: 1.5;">${contentLang.supportText}</p>
          
          <p style="margin-bottom: 12px; line-height: 1.5;">
            ${contentLang.emailText.replace('compliance@missav-j.com', '<strong style="color: var(--color-accent, #ff003c); font-weight: 700;">compliance@missav-j.com</strong>')}
          </p>
          <p style="margin-bottom: 12px; line-height: 1.5; color: var(--color-text-muted, #aaa);">${contentLang.footer}</p>
        </div>
      `;

      if (!isEn) {
        bodyHtml += `
          <hr style="border: 0; border-top: 1px solid var(--color-border, rgba(255,255,255,0.08)); margin: 16px 0;">
          <div style="opacity: 0.7;">
            <h3 style="color: var(--color-text, #fff); font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">📢 ${contentEn.adsHeader} (Original)</h3>
            <p style="margin-bottom: 16px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.adsText}</p>
            
            <h3 style="color: var(--color-text, #fff); font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">🛠️ ${contentEn.supportHeader} (Original)</h3>
            <p style="margin-bottom: 16px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.supportText}</p>
            
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">
              ${contentEn.emailText.replace('compliance@missav-j.com', '<strong style="font-weight: 700;">compliance@missav-j.com</strong>')}
            </p>
            <p style="margin-bottom: 12px; font-size: 0.9rem; line-height: 1.5; color: var(--color-text-muted, #888);">${contentEn.footer}</p>
          </div>
        `;
      }
      body.innerHTML = bodyHtml;
    }
  };

  const closeModal = () => {
    document.body.style.overflow = '';
    overlay.classList.add('hidden');
  };

  if (btn2257) {
    btn2257.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('2257');
    });
  }

  if (btnDmca) {
    btnDmca.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('dmca');
    });
  }

  if (btnContact) {
    btnContact.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('contact');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeModal();
    }
  });
}

/**
 * Initializes global click events and mobile sidebar states
 */
function initGlobalEvents() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.toggle('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('visible');
      } else {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed-layout');
      }
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('visible');
    });
  }

  const searchInput = document.getElementById('header-search-input');
  const searchBtn = document.getElementById('header-search-btn');
  
  const handleSearchSubmit = () => {
    const activeSearchInput = document.getElementById('header-search-input');
    const query = activeSearchInput ? activeSearchInput.value.trim() : '';
    if (query) {
      window.missavJNavigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearchSubmit();
      }
    });

    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      if (window.missavJState.currentPath === '/search') {
        const val = e.target.value.trim();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (window.missavJState.currentPath === '/search' && typeof window.missavJSearchTriggerLiveQuery === 'function') {
            window.missavJSearchTriggerLiveQuery(val);
          }
        }, 400);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearchSubmit);
  }

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      ui.toggleTheme();
    });
  }
  
  ui.initTheme();

  window.addEventListener('hashchange', () => {
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('visible');
    }
  });
}

// Curated menu taxonomy configuration for the 4 header categories and subcategories/tags
const HEADER_CATEGORIES = [
  {
    id: 'watch_jav',
    labelKey: 'category_watch_jav',
    defaultLabel: 'Watch JAV',
    route: '/',
    items: [
      { labelKey: 'sort_recent_update', defaultLabel: 'Recent update', route: '/recent' },
      { labelKey: 'sub_new_releases', defaultLabel: 'New Releases', route: '/' },
      { labelKey: 'sub_uncensored_leak', defaultLabel: 'Uncensored leak', route: '/tag?name=Uncensored%20leak' },
      { labelKey: 'sub_actress_list', defaultLabel: 'Actress list', route: '/actors' },
      { labelKey: 'sub_actress_ranking', defaultLabel: 'Actress ranking MAY 2026', route: '/actors' },
      { labelKey: 'sub_genre', defaultLabel: 'Genre', route: '/categories' },
      { labelKey: 'sub_maker', defaultLabel: 'Maker', route: '/studios' },
      { labelKey: 'sub_vr', defaultLabel: 'VR', route: '/tag?name=VR' },
      { labelKey: 'sort_views_today', defaultLabel: 'Most viewed today', route: '/trending' },
      { labelKey: 'sort_views_weekly', defaultLabel: 'Most viewed by week', route: '/trending' },
      { labelKey: 'sort_views_monthly', defaultLabel: 'Most viewed by month', route: '/trending' }
    ]
  },
  {
    id: 'amateur',
    labelKey: 'category_amateur',
    defaultLabel: 'Amateur',
    route: '/category?name=Amateur',
    items: [
      { labelKey: 'tag_siro', defaultLabel: 'SIRO', route: '/tag?name=SIRO' },
      { labelKey: 'tag_luxu', defaultLabel: 'LUXU', route: '/tag?name=LUXU' },
      { labelKey: 'tag_gana', defaultLabel: 'GANA', route: '/tag?name=GANA' },
      { labelKey: 'tag_prestige_premium', defaultLabel: 'PRESTIGE PREMIUM', route: '/tag?name=PRESTIGE%20PREMIUM' },
      { labelKey: 'tag_s_cute', defaultLabel: 'S-CUTE', route: '/tag?name=S-CUTE' },
      { labelKey: 'tag_ara', defaultLabel: 'ARA', route: '/tag?name=ARA' }
    ]
  },
  {
    id: 'uncensored',
    labelKey: 'category_uncensored',
    defaultLabel: 'Uncensored',
    route: '/category?name=Uncensored',
    items: [
      { labelKey: 'sub_uncensored_leak', defaultLabel: 'Uncensored leak', route: '/tag?name=Uncensored%20leak' },
      { labelKey: 'tag_fc2', defaultLabel: 'FC2', route: '/tag?name=FC2' },
      { labelKey: 'tag_heyzo', defaultLabel: 'HEYZO', route: '/tag?name=HEYZO' },
      { labelKey: 'tag_tokyo_hot', defaultLabel: 'Tokyo Hot', route: '/tag?name=Tokyo%20Hot' },
      { labelKey: 'tag_1pondo', defaultLabel: '1pondo', route: '/tag?name=1pondo' },
      { labelKey: 'tag_caribbeancom', defaultLabel: 'Caribbeancom', route: '/tag?name=Caribbeancom' },
      { labelKey: 'tag_caribbeancompr', defaultLabel: 'Caribbeancompr', route: '/tag?name=Caribbeancompr' },
      { labelKey: 'tag_10musume', defaultLabel: '10musume', route: '/tag?name=10musume' },
      { labelKey: 'tag_pacopacomama', defaultLabel: 'pacopacomama', route: '/tag?name=pacopacomama' },
      { labelKey: 'tag_gachinco', defaultLabel: 'Gachinco', route: '/tag?name=Gachinco' },
      { labelKey: 'tag_xxx_av', defaultLabel: 'XXX-AV', route: '/tag?name=XXX-AV' },
      { labelKey: 'sub_married_slash', defaultLabel: 'Married Slash', route: '/tag?name=Married%20Slash' },
      { labelKey: 'tag_naughty_4610', defaultLabel: 'Naughty 4610', route: '/tag?name=Naughty%204610' },
      { labelKey: 'tag_naughty_0930', defaultLabel: 'Naughty 0930', route: '/tag?name=Naughty%200930' }
    ]
  },
  {
    id: 'asia_av',
    labelKey: 'category_asia_av',
    defaultLabel: 'Asia AV',
    route: '/category?name=Asia%20AV',
    items: [
      { labelKey: 'tag_madou', defaultLabel: 'Madou', route: '/tag?name=Madou' },
      { labelKey: 'tag_twav', defaultLabel: 'TWAV', route: '/tag?name=TWAV' },
      { labelKey: 'tag_furuke', defaultLabel: 'Furuke', route: '/tag?name=Furuke' },
      { labelKey: 'sub_korean_live', defaultLabel: 'Korean Live', route: '/tag?name=Korean%20Live' },
      { labelKey: 'sub_chinese_live', defaultLabel: 'Chinese Live', route: '/tag?name=Chinese%20Live' }
    ]
  }
];

window.missavJRenderCategories = function() {
  // Empty, categories dropdowns in header are removed
  return;
};

// Global click dismiss handler for category dropdown menus
document.addEventListener('click', (e) => {
  document.querySelectorAll('.header-dropdown').forEach(dropdownEl => {
    if (!dropdownEl.contains(e.target)) {
      dropdownEl.classList.remove('open');
      dropdownEl.querySelector('.header-dropdown-menu')?.classList.add('hidden');
      dropdownEl.querySelector('.header-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    }
  });
});

/**
 * Sets up the language selector dropdown and triggers setLang
 */
function setupLanguageDropdown() {
  const trigger = document.getElementById('lang-dropdown-trigger');
  const menu = document.getElementById('lang-dropdown-menu');
  if (!trigger || !menu) return;

  // Render language selections from configuration data structures
  menu.innerHTML = i18n.LANGS.map(lang => `
    <button class="lang-item" data-lang="${lang.code}">
      <img class="lang-item-flag" src="${lang.flag}" alt="${lang.label}">
      <span class="lang-item-label">${lang.label}</span>
    </button>
  `).join('');

  // Dropdown expanding toggle
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !isExpanded);
    menu.classList.toggle('hidden');
    trigger.parentElement.classList.toggle('open');
  });

  // Catch select item triggers
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (item) {
      const selectedLang = item.dataset.lang;
      i18n.setLang(selectedLang);
      
      // Close bounds
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.parentElement.classList.remove('open');
    }
  });

  // Auto-close dropdown when cursor clicks out of bounds
  document.addEventListener('click', (e) => {
    if (!trigger.parentElement.contains(e.target)) {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.parentElement.classList.remove('open');
    }
  });
}

// Bootstrap router elements when page finishes parsing DOM
document.addEventListener('DOMContentLoaded', () => {
  Analytics.init();
  ReferralSystem.init();

  // Back to Top Button Logic
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTopBtn.classList.remove('hidden');
      } else {
        backToTopBtn.classList.add('hidden');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 1. Backward Compatibility: Catch hash-based legacy paths and replace state to localized URL path segments
  if (window.location.hash) {
    const hashPath = window.location.hash.replace('#', '') || '/';
    const lang = i18n.getLang();
    window.location.replace(`/${lang}${hashPath}`);
    return;
  }

  // 2. Global SPA Anchor click interception bounds
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href) {
        const isInternalSPA = href.startsWith('#/') || 
          (href.startsWith('/') && !href.startsWith('/api') && !href.startsWith('/assets') && !href.includes('.'));
        if (isInternalSPA) {
          e.preventDefault();
          const cleanPath = href.replace('#', '');
          window.missavJNavigate(cleanPath);
        }
      }
    }
  });

  // 3. Auto-redirect root domain to /en/ (English default) if no language prefix present
  const currentPathname = window.location.pathname;
  const { lang, routePath } = parseUrl(currentPathname);
  
  // Check if the URL has no valid language prefix (root "/" or bare path like "/trending")
  const firstSegment = currentPathname.replace(/^\//, '').split('/')[0] || '';
  const hasValidLangPrefix = i18n.LANGS.some(l => l.code === firstSegment);
  
  if (!hasValidLangPrefix) {
    // Default to English for URLs without language prefix
    const defaultLang = 'en';
    localStorage.setItem('missav_lang', defaultLang);
    const targetPath = currentPathname === '/' || currentPathname === '' 
      ? `/${defaultLang}/` 
      : `/${defaultLang}${currentPathname}${window.location.search}`;
    history.replaceState(null, '', targetPath);
  }

  initGlobalEvents();
  setupLanguageDropdown();
  setupScrollTopButton();
  setupFloatingTelegramButton();
  setupFloatingPlayerDOM();
  setupKeyboardHotkeys();
  setupLegalModals();
  Analytics.init(); // GA4 tracking — configure ID in analytics.js
  
  // Collapse sidebar by default on tablet viewports (768px to 1023px)
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const sidebar = document.getElementById('sidebar');
  if (isTablet && sidebar) {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed-layout');
  }
  
  // Sync selected language segmentation state
  if (lang) {
    i18n.setLang(lang, false);
  }
  
  i18n.translateStaticUI();
  i18n.initTranslationObserver();
  
  // Register browser popstate triggers
  window.addEventListener('popstate', () => {
    navigate(window.location.pathname + window.location.search);
  });
  
  navigate(window.location.pathname + window.location.search);
});

