/**
 * MISSAV-J — App Orchestrator & SPA Router (Advanced Edition)
 * Manages History API relative pathname routing, Picture-in-Picture (PiP) iframe DOM transplantation,
 * desktop global hotkeys, and playlist in-memory states (Watch Later & Session History).
 */

import ui from './ui.js';
import { renderVideoCard, bindHoverPreviews } from './feed.js';
import i18n from './i18n.js';
import './ads.js?v=1.1.6';

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
        e.stopPropagation();
        const actorName = decodeURIComponent(actorChip.dataset.actor);
        window.missavJNavigate(`/actor?name=${encodeURIComponent(actorName)}`);
        return;
      }

      const studioName = e.target.closest('.card-studio');
      if (studioName) {
        e.stopPropagation();
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
  '/':          () => import('./feed.js?v=1.1.3').then(m => m.init()),
  '/trending':  () => import('./trending.js?v=1.1.3').then(m => m.init()),
  '/recent':    () => import('./recent.js?v=1.1.3').then(m => m.init()),
  '/search':    (q) => import('./search.js?v=1.1.3').then(m => m.init(q || getParam('q'))),
  '/watch':     (id) => import('./player.js?v=1.1.9').then(m => m.init(id || window.missavJGetCurrentWatchId())),
  '/category':  () => import('./feed.js?v=1.1.3').then(m => m.init({ category: getParam('name') })),
  '/actor':     () => import('./feed.js?v=1.1.3').then(m => m.init({ actor: getParam('name') })),
  '/studio':    () => import('./feed.js?v=1.1.3').then(m => m.init({ studio: getParam('name') })),
  '/tag':       () => import('./feed.js?v=1.1.3').then(m => m.init({ tag: getParam('name') })),
  
  // Taxonomy browsing routes for Actors, Studios & Categories
  '/actors':          () => import('./actors.js?v=1.1.7').then(m => m.init()),
  '/popular-actors':  () => import('./popular_actors.js?v=1.1.3').then(m => m.init()),
  '/studios':         () => import('./studios.js?v=1.1.3').then(m => m.init()),
  '/categories':      () => import('./categories.js?v=1.1.7').then(m => m.init()),
  
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

  const canonicalUrl = `${baseDomain}/${currentLang}${cleanRoutePath}`;

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
    altLink.hreflang = lang.code;
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
  updateDynamicMetaTags(routePath, canonicalUrl);
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
function updateDynamicMetaTags(routePath, canonicalUrl) {
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
    const thumbnail = post.thumbnail || '/assets/images/logo.png';

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
      const uploadDate = post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const viewCount = post.views ? parseInt(post.views, 10) : 0;
      
      const videoSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        'name': translatedTitle,
        'description': description,
        'thumbnailUrl': thumbnail.startsWith('http') ? thumbnail : `${baseDomain}${thumbnail}`,
        'uploadDate': uploadDate,
        'interactionStatistic': {
          '@type': 'InteractionCounter',
          'interactionType': { '@type': 'WatchAction' },
          'userInteractionCount': viewCount
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'MISSAV-J',
          'url': baseDomain
        }
      };

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
      '/':          i18n.t('meta_home_desc') || 'Discover the best video streaming with a premium YouTube-inspired dark mode interface.',
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
    setMetaContent('og-image', '/assets/images/logo.png');
    setMetaContent('og-locale', localeMap[currentLang] || 'en_US');

    // Twitter Card
    setMetaContent('twitter-card', 'summary');
    setMetaContent('twitter-title', title);
    setMetaContent('twitter-description', desc);
    setMetaContent('twitter-image', '/assets/images/logo.png');

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
}

function navigate(urlPath) {
  const { lang, routePath } = parseUrl(urlPath);
  
  // Sync selected language dynamically if it differs from current i18n states
  if (lang && lang !== i18n.getLang()) {
    i18n.setLang(lang, false); // Set active language segment without invoking popstate routing loops
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

  // Manage Global Top Ad Visibility and Loading
  const globalTopAd = document.getElementById('global-top-ad');
  if (globalTopAd) {
    if (matchedRoutePath === '/watch') {
      globalTopAd.style.display = 'none';
      globalTopAd.innerHTML = ''; // Hancurkan iframe iklan lama agar tidak nyangkut/memakan memori
    } else {
      globalTopAd.style.display = '';
      if (window.missavJAds && typeof window.missavJAds.loadGlobalTopAd === 'function') {
        window.missavJAds.loadGlobalTopAd();
      }
    }
  }

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
    import('./player.js?v=1.1.9').then(m => {
      if (m.renderPostMeta) m.renderPostMeta(post, targetId);
      if (m.loadRelatedVideos) m.loadRelatedVideos(post);
    }).catch(() => { /* silent — non-critical */ });
    
    return; // Early exit — player iframe is preserved!
  }

  // 1. LEAVE WATCH: Switch player container to floating mode (PiP)
  if (prevPath === '/watch' && matchedRoutePath !== '/watch') {
    // Matikan observer karena kita keluar dari halaman watch
    import('./player.js?v=1.1.9').then(m => {
      if (m.disconnectPlaceholderObserver) {
        m.disconnectPlaceholderObserver();
      }
    }).catch(() => {});

    const floatWrapper = document.getElementById('floating-player-wrapper');
    const floatTitle = document.getElementById('floating-player-title');
    
    // Check if browser native Picture-in-Picture is active
    const isNativePipActive = !!document.pictureInPictureElement;
    
    if (floatWrapper && window.missavJState.activeVideo) {
      if (isNativePipActive) {
        // Native PiP is active, so we hide our custom floating player visually to avoid duplicates,
        // but we do NOT destroy the iframe so the native window keeps playing.
        floatWrapper.classList.add('hidden');
        window.missavJState.isFloating = true;
      } else {
        // Transition class styles
        floatWrapper.classList.remove('mode-theater');
        floatWrapper.classList.add('mode-floating');
        floatWrapper.classList.remove('hidden');
        
        // Clear inline absolute positioning properties used in theater mode
        floatWrapper.style.position = '';
        floatWrapper.style.top = '';
        floatWrapper.style.left = '';
        floatWrapper.style.width = '';
        floatWrapper.style.height = '';
        
        // Clear the theater-mode inline scale transform on #player-container
        // so the CSS floating scale rule (.mode-floating #player-container { transform: scale(0.3333) }) takes over.
        // This ensures the iframe never experiences an actual resize — only a CSS transform change.
        const playerContainer = document.getElementById('player-container');
        if (playerContainer) {
          playerContainer.style.transform = '';
          playerContainer.style.width = '';
          playerContainer.style.height = '';
        }
        
        if (floatTitle) {
          floatTitle.textContent = i18n.translateVideoTitle(window.missavJState.activeVideo.title);
        }
        
        window.missavJState.isFloating = true;
        ui.showToast(i18n.t('playing_floating_player'));
      }
      
      // Hide player overlay in floating PiP mode to avoid click blockage
      const adOverlay = document.getElementById('player-ad-overlay');
      if (adOverlay) adOverlay.classList.add('hidden');
    }
  }

  // 2. ENTER WATCH: If target watch ID matches floating ID, switch player container to theater mode
  if (matchedRoutePath === '/watch' && window.missavJState.activeVideo && String(window.missavJState.activeVideo.id) === String(targetId)) {
    const floatWrapper = document.getElementById('floating-player-wrapper');
    if (floatWrapper) {
      floatWrapper.classList.remove('mode-floating');
      floatWrapper.classList.add('mode-theater');
      floatWrapper.classList.remove('hidden');
    }
    
    // Programmatically exit browser native Picture-in-Picture if active
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
    
    window.missavJState.isFloating = false;
  } 
  // If launching a watch page of a DIFFERENT video, dispose of active floating session
  else if (matchedRoutePath === '/watch' && window.missavJState.isFloating) {
    closeFloatingPlayer();
  }

  // Retrieve routing module or default back to home feed
  const route = routes[matchedRoutePath] || routes['/'];
  
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
    updateSEOTags(matchedRoutePath, targetId);
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
  import('./player.js?v=1.1.9').then(m => {
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
      <div id="player-ad-overlay" class="player-ad-overlay"></div>
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
      import('./player.js?v=1.1.9').then(m => {
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
  setupFloatingPlayerDOM();
  setupKeyboardHotkeys();
  
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
