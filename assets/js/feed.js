/**
 * MISSAV-J — Homepage Feed & Infinite Scroll (Secured & Optimized)
 * Manages loading and rendering of primary video listings on the homepage,
 * infinite scrolling navigations, integrated horizontal filter listing triggers,
 * featuring complete XSS sanitization, premium inline SVG thumbnail fallbacks, and staggered delays.
 */

import api from './api.js?v=2.0.5';
import ui from './ui.js?v=2.0.5';
import filter from './filter.js?v=2.0.5';
import i18n from './i18n.js?v=2.0.5';

// Feed State (In-memory, isolated per lifecycle page reload)
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let hasMore = true;
let currentFilters = {};
let intersectionObserver = null;
let seenCodes = new Set();
let seenTitles = new Set();

// Random Mode State — used on the homepage to show a fresh mix of videos each visit
let randomMode = false;
let usedPages = new Set();

/**
 * Fisher-Yates in-place shuffle for randomizing video card order
 * @param {Array} arr - Array to shuffle
 * @returns {Array} The same array, shuffled in-place
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Premium inline SVG fallback used when video thumbnail fails to load
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22 viewBox=%220 0 320 180%22><rect width=%22320%22 height=%22180%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2213%22>NO IMAGE</text></svg>`;

/**
 * Deterministically generates realistic and consistent video duration strings based on post ID if empty or zero.
 * @param {string|number} id - Post / Video ID reference
 * @returns {string} Duration formatted as HH:MM:SS
 */
export function getDeterministicDuration(id) {
  const numId = parseInt(id) || 12345;
  const hours = (numId % 2) + 1; // 1 or 2 hours
  const minutes = numId % 60;
  const seconds = (numId * 7) % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Renders single video card markup adhering to YouTube + apiJAV clean layout guidelines (Safe from XSS, featuring Staggered Delay)
 * @param {Object} post - API Video/post data object
 * @param {number} [index=0] - Card order index utilized for staggered animation delays
 * @returns {string} Sanitized HTML markup template string
 */
export function renderVideoCard(post, index = 0) {
  // 1. Sanitize API data to defeat XSS and translate the title dynamically
  const originalTitle = post.title || '';
  const translatedTitle = i18n.translateVideoTitle(originalTitle);
  const safeId = ui.escapeHTML(post.id);
  const safeTitle = ui.escapeHTML(translatedTitle);
  const safeStudio = ui.escapeHTML(post.studio || '');
  const safeCode = ui.escapeHTML(post.code || '');
  const safeThumbnail = ui.escapeHTML(post.thumbnail || '');
  
  // Resolve duration fallback if missing or invalid
  let duration = post.duration || '';
  if (!duration || duration === '00:00:00') {
    duration = getDeterministicDuration(post.id);
  }
  const safeDuration = ui.escapeHTML(duration);

  // Uncensored badge detection (run on original title to guarantee correct matches regardless of language)
  const safeOriginalTitle = originalTitle.toLowerCase();
  const isUncensored = 
    (post.categories && post.categories.some(c => {
      const s = String(c).toLowerCase();
      return s.includes('uncensored') || s.includes('tanpa sensor') || s.includes('no sensor') || s.includes('mosaic-less') || s.includes('mosaicless');
    })) ||
    (post.tags && post.tags.some(t => {
      const s = String(t).toLowerCase();
      return s.includes('uncensored') || s.includes('tanpa sensor') || s.includes('no sensor') || s.includes('mosaic-less') || s.includes('mosaicless');
    })) ||
    safeOriginalTitle.includes('uncensored') || 
    safeOriginalTitle.includes('tanpa sensor') || 
    safeOriginalTitle.includes('no sensor') || 
    safeOriginalTitle.includes('leak') ||
    safeOriginalTitle.includes('tanpa-sensor') ||
    safeOriginalTitle.includes('no-sensor') ||
    safeOriginalTitle.includes('no-mosaic') ||
    safeOriginalTitle.includes('nomosaic');

  const uncensoredBadge = isUncensored ? `<span class="card-uncensored">${i18n.t('badge_uncensored')}</span>` : '';

  // Sanitize actor listings (Limit to first 3 chips for UX clarity)
  const actors = Array.isArray(post.actors) ? post.actors : (post.actors ? [post.actors] : []);
  const actorsMarkup = actors
    .slice(0, 3) 
    .map(a => {
      const safeActor = ui.escapeHTML(a);
      return `<span class="actor-chip" data-actor="${encodeURIComponent(safeActor)}">${safeActor}</span>`;
    })
    .join('');

  // Render HD badge indicator if present in titles/tags
  const isHD = safeOriginalTitle.includes('hd') || (post.tags && post.tags.some(t => String(t).toLowerCase() === 'hd'));
  const hdBadge = isHD ? `<span class="card-hd">HD</span>` : '';
  
  // Format Duration indicator
  const durationBadge = safeDuration ? `<span class="card-duration">${safeDuration}</span>` : '';

  // Format Studio link
  const studioMarkup = safeStudio 
    ? `<span class="card-studio" data-studio="${encodeURIComponent(safeStudio)}">${safeStudio}</span>`
    : `<span class="card-studio text-muted" data-studio="Other">${i18n.t('unknown_studio')}</span>`;

  // Format views
  const viewsCount = post.views ? parseInt(post.views, 10) : 0;
  const viewsFormatted = viewsCount.toLocaleString(i18n.getLang());

  // Staggered animation delay: cascades cards sequentially at 45ms offsets
  const animationStyle = `style="animation-delay: calc(${index % 24} * 45ms);"`;

  // Sanitize and clean up ampersands inside embed URLs
  const rawEmbedUrl = (post.embed_url || '').replace(/&#038;/g, '&').replace(/&amp;/g, '&');
  const safeEmbedUrl = ui.escapeHTML(rawEmbedUrl);

  return `
    <article class="video-card fadeInUp" data-id="${safeId}" data-code="${safeCode}" data-title="${safeTitle}" data-embed-url="${safeEmbedUrl}" ${animationStyle}>
      <div class="card-thumb">
        <img 
          src="${safeThumbnail || SVG_FALLBACK_THUMB}" 
          alt="${safeTitle}" 
          loading="lazy" 
          width="320" 
          height="180"
          onerror="this.onerror=null; this.src='${SVG_FALLBACK_THUMB}';"
        >
        ${uncensoredBadge}
        ${durationBadge}
        ${hdBadge}
        <div class="card-hover-overlay">▶ ${i18n.t('play_video')}</div>
      </div>
      <div class="card-info">
        <h3 class="card-title" title="${safeTitle}" data-original-title="${ui.escapeHTML(originalTitle)}">${safeTitle}</h3>
        <div class="card-meta">
          ${studioMarkup}
          <span class="card-dot">•</span>
          <span class="card-views">${viewsFormatted} ${i18n.t('views')}</span>
        </div>
        <div class="card-actors">
          ${actorsMarkup}
        </div>
        <div class="card-code">${safeCode}</div>
      </div>
    </article>
  `;
}

/**
 * Initializes the homepage feed listing
 * @param {Object} [filters] - Route filter overrides (e.g. category parsed from relative routing paths)
 */
export async function init(filters = {}) {
  // Dispose of active IntersectionObservers running from prior SPA page context loops
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }

  // Reset local page cycle memory states
  currentPage = 1;
  totalPages = 1;
  isLoading = false;
  hasMore = true;
  usedPages = new Set();
  seenCodes = new Set();
  seenTitles = new Set();
  currentFilters = {
    per_page: 24,
    orderby: 'date',
    order: 'DESC',
    ...filters
  };

  // Enable random mode only on the unfiltered homepage (no actor/studio/category/tag/search)
  const hasSpecificFilter = filters.actor || filters.studio || filters.category || filters.tag || filters.search;
  randomMode = !hasSpecificFilter && !filters.orderby;

  // 1. Prepare Base Feed layout templates
  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  // Build Taxonomy banner layouts dynamically if specialized filters are engaged
  let taxonomyBannerHtml = '';
  if (currentFilters.actor) {
    const actorName = ui.escapeHTML(currentFilters.actor);
    taxonomyBannerHtml = `
      <div class="taxonomy-banner fadeInUp" style="animation-delay: 50ms;">
        <div class="banner-icon">🎭</div>
        <div class="banner-content">
          <span class="banner-label">${i18n.t('banner_actor_label')}</span>
          <h2 class="banner-title">${actorName}</h2>
          <p class="banner-desc">${i18n.t('banner_actor_desc', { name: actorName })}</p>
        </div>
        <button class="banner-close" onclick="window.missavJNavigate('/')" title="Clear Filter">✕</button>
      </div>
    `;
  } else if (currentFilters.studio) {
    const studioName = ui.escapeHTML(currentFilters.studio);
    taxonomyBannerHtml = `
      <div class="taxonomy-banner fadeInUp" style="animation-delay: 50ms;">
        <div class="banner-icon">🎬</div>
        <div class="banner-content">
          <span class="banner-label">${i18n.t('banner_studio_label')}</span>
          <h2 class="banner-title">${studioName}</h2>
          <p class="banner-desc">${i18n.t('banner_studio_desc', { name: studioName })}</p>
        </div>
        <button class="banner-close" onclick="window.missavJNavigate('/')" title="Clear Filter">✕</button>
      </div>
    `;
  } else if (currentFilters.tag) {
    const tagName = ui.escapeHTML(currentFilters.tag);
    taxonomyBannerHtml = `
      <div class="taxonomy-banner fadeInUp" style="animation-delay: 50ms;">
        <div class="banner-icon">🏷️</div>
        <div class="banner-content">
          <span class="banner-label">${i18n.t('banner_tag_label')}</span>
          <h2 class="banner-title">${tagName}</h2>
          <p class="banner-desc">${i18n.t('banner_tag_desc', { name: tagName })}</p>
        </div>
        <button class="banner-close" onclick="window.missavJNavigate('/')" title="Clear Filter">✕</button>
      </div>
    `;
  } else if (currentFilters.category) {
    const catName = ui.escapeHTML(currentFilters.category);
    const dictKey = `category_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const displayName = i18n.t(dictKey) || catName;
    
    // Render taxonomy banners only if category clicked is a non-standard curated header category
    const isSpecialCategory = ['Uncensored', 'Amateur', 'Subtitled', 'Creampie', 'Cosplay', 'Mosaic', 'POV'].indexOf(catName) === -1;
    if (isSpecialCategory) {
      taxonomyBannerHtml = `
        <div class="taxonomy-banner fadeInUp" style="animation-delay: 50ms;">
          <div class="banner-icon">📁</div>
          <div class="banner-content">
            <span class="banner-label">${i18n.t('banner_category_label')}</span>
            <h2 class="banner-title">${displayName}</h2>
            <p class="banner-desc">${i18n.t('banner_category_desc', { name: displayName })}</p>
          </div>
          <button class="banner-close" onclick="window.missavJNavigate('/')" title="Clear Filter">✕</button>
        </div>
      `;
    }
  }

  mainApp.innerHTML = `
    <!-- Sticky Horizontal Filter Bar Container -->
    <div id="filter-bar-container" class="filter-bar-container"></div>
    
    <!-- Dynamic Taxonomy Banner -->
    ${taxonomyBannerHtml}
    
    <!-- Info bar & total video count tracking -->
    <div class="feed-info-bar">
      <div class="video-total-count" id="video-total-count">${i18n.t('loading_videos_count')}</div>
      <div class="page-track" id="page-track">${i18n.t('page_format', { current: 1, total: 1 })}</div>
    </div>
    
    <!-- Main Video Grid container -->
    <div class="video-grid" id="video-grid"></div>

    <!-- Infinite Scroll Sentinel & Loading indicator -->
    <div id="infinite-loader" class="infinite-loader hidden">
      <div class="spinner"></div>
      <span>${i18n.t('loading_more_videos')}</span>
    </div>
    <div id="scroll-sentinel" class="scroll-sentinel"></div>
  `;

  // 2. Render initial page skeletal loaders
  const grid = document.getElementById('video-grid');
  ui.showSkeletonsInElement(grid, 8);

  // 3. Mount homepage horizontal filter bar orchestration states
  filter.init(document.getElementById('filter-bar-container'), currentFilters, updateFeedFilters);

  // 4. Fire initial listings fetch
  await fetchAndRenderFeed(true);

  // 5. Setup IntersectionObserver configurations for infinite scrolls
  setupInfiniteScroll();
  
  // 6. Connect delegators for grid actions
  bindGridClicks(grid);

  // 7. Mount hover listeners for dynamic Picture-in-Picture previews
  bindHoverPreviews(grid);
}

/**
 * Fetch and render listings from API endpoints
 * @param {boolean} isInitial - Overwrites existing grid list markup if true
 */
async function fetchAndRenderFeed(isInitial = false) {
  isLoading = true;
  
  try {
    // In random mode on initial load, probe the API to discover totalPages,
    // then pick a truly random starting page
    let fetchPage = currentPage;
    if (randomMode && isInitial) {
      try {
        const probe = await api.getPosts({ page: 1, per_page: 1, ...currentFilters });
        if (probe.totalPages > 1) {
          totalPages = probe.totalPages;
          fetchPage = Math.floor(Math.random() * totalPages) + 1;
          currentPage = fetchPage;
        }
      } catch (e) {
        // Probe failed — proceed with page 1 normally
      }
    }
    usedPages.add(fetchPage);

    const data = await api.getPosts({ page: fetchPage, ...currentFilters });

    // Shuffle results client-side in random mode for a fresh feel
    if (randomMode && data.posts.length > 1) {
      shuffleArray(data.posts);
    }
    
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    const totalCountEl = document.getElementById('video-total-count');
    const pageTrackEl = document.getElementById('page-track');

    totalPages = data.totalPages;
    hasMore = currentPage < totalPages;

    // Render total listings count tracks in UI
    if (totalCountEl) {
      totalCountEl.textContent = i18n.t('video_available', { total: data.total.toLocaleString(i18n.getLang()) });
    }
    
    // Update pages tracking index
    if (pageTrackEl) {
      pageTrackEl.textContent = i18n.t('page_format', { current: currentPage, total: totalPages });
    }

    if (data.posts.length === 0 && isInitial) {
      // Smart Name-Swap Retry: If an actor search returned 0 results and the name
      // has 2+ words, automatically retry with the words reversed (handles
      // Japanese name order "Kano Yura" vs Western order "Yura Kano").
      if (currentFilters.actor) {
        const nameParts = currentFilters.actor.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          const swappedName = nameParts.reverse().join(' ');
          console.log(`[Feed] Actor "${currentFilters.actor}" returned 0 results, retrying with swapped name: "${swappedName}"`);
          const retryData = await api.getPosts({ page: currentPage, ...currentFilters, actor: swappedName });

          if (retryData.posts.length > 0) {
            // Success! Update filters and UI to reflect the corrected name
            currentFilters.actor = swappedName;
            totalPages = retryData.totalPages;
            hasMore = currentPage < totalPages;

            // Update banner title to show the corrected name
            const bannerTitle = document.querySelector('.taxonomy-banner .banner-title');
            if (bannerTitle) bannerTitle.textContent = swappedName;

            if (totalCountEl) {
              totalCountEl.textContent = i18n.t('video_available', { total: retryData.total.toLocaleString(i18n.getLang()) });
            }
            if (pageTrackEl) {
              pageTrackEl.textContent = i18n.t('page_format', { current: currentPage, total: totalPages });
            }

            const uniqueRetryPosts = retryData.posts.filter(p => {
              const code = (p.code || '').trim().toUpperCase();
              if (code && seenCodes.has(code)) return false;
              const title = (p.title || '').trim().toLowerCase();
              if (title && seenTitles.has(title)) return false;
              if (code) seenCodes.add(code);
              if (title) seenTitles.add(title);
              return true;
            });

            // Build cards list markup applying cascade staggered delays and inject outstream video ad
            let cardsHtml = '';
            uniqueRetryPosts.forEach((post, idx) => {
              cardsHtml += renderVideoCard(post, idx);
              if (idx === 7) {
                cardsHtml += `
                  <div class="ad-outstream-container" id="outstream-ad-home-${currentPage}"></div>
                `;
              }
            });
            grid.innerHTML = cardsHtml;

            // Load Outstream Video Ad if the container was rendered
            if (uniqueRetryPosts.length > 7 && window.missavJAds && typeof window.missavJAds.loadExoClickOutstream === 'function') {
              window.missavJAds.loadExoClickOutstream(`outstream-ad-home-${currentPage}`, window.missavJAdConfig.outstreamBannerKey);
            }
            return;
          }
        }
      }

      const querySearch = currentFilters.search || '';
      ui.showEmpty(querySearch, grid);
      hasMore = false;
      return;
    }

    // Deduplikasi posts berdasarkan JAV code dan Title unik
    const uniquePosts = data.posts.filter(p => {
      const code = (p.code || '').trim().toUpperCase();
      if (code && seenCodes.has(code)) return false;
      const title = (p.title || '').trim().toLowerCase();
      if (title && seenTitles.has(title)) return false;
      if (code) seenCodes.add(code);
      if (title) seenTitles.add(title);
      return true;
    });

    // Build cards list markup applying cascade staggered delays and inject outstream video ad
    let cardsHtml = '';
    uniquePosts.forEach((post, idx) => {
      cardsHtml += renderVideoCard(post, idx);
      if (idx === 7) {
        cardsHtml += `
          <div class="ad-outstream-container" id="outstream-ad-home-${currentPage}"></div>
        `;
      }
    });

    if (isInitial) {
      grid.innerHTML = cardsHtml;
    } else {
      grid.insertAdjacentHTML('beforeend', cardsHtml);
    }

    // Load Outstream Video Ad if the container was rendered
    if (uniquePosts.length > 7 && window.missavJAds && typeof window.missavJAds.loadExoClickOutstream === 'function') {
      window.missavJAds.loadExoClickOutstream(`outstream-ad-home-${currentPage}`, window.missavJAdConfig.outstreamBannerKey);
    }

  } catch (error) {
    console.error('Fetch Feed Error:', error);
    const grid = document.getElementById('video-grid');
    if (!grid) return;
    if (isInitial) {
      ui.showError(error.message, grid);
    } else {
      ui.showToast(i18n.t('error_load_more'));
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Attaches IntersectionObserver handlers pointing to scroll-sentinels below the grid
 */
function setupInfiniteScroll() {
  const sentinel = document.getElementById('scroll-sentinel');
  const loader = document.getElementById('infinite-loader');
  if (!sentinel) return;

  intersectionObserver = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      if (loader) loader.classList.remove('hidden');
      
      if (randomMode && totalPages > 1) {
        // Pick a random unused page for infinite scroll
        const availablePages = [];
        for (let p = 1; p <= totalPages; p++) {
          if (!usedPages.has(p)) availablePages.push(p);
        }
        if (availablePages.length === 0) {
          hasMore = false;
          if (loader) loader.classList.add('hidden');
          return;
        }
        currentPage = availablePages[Math.floor(Math.random() * availablePages.length)];
      } else {
        currentPage++;
      }
      await fetchAndRenderFeed(false);
      
      if (loader) loader.classList.add('hidden');
    }
  }, {
    rootMargin: '300px'
  });

  intersectionObserver.observe(sentinel);
}

/**
 * Filter updates handler invoked by the horizontal filter bar engine
 */
async function updateFeedFilters(updatedFilters) {
  currentFilters = { ...currentFilters, ...updatedFilters };
  currentPage = 1;
  hasMore = true;
  // Disable random mode when user explicitly changes sort/filter — they want a specific order
  randomMode = false;
  usedPages = new Set();
  seenCodes = new Set();
  seenTitles = new Set();

  const grid = document.getElementById('video-grid');
  if (grid) {
    ui.showSkeletonsInElement(grid, 8);
  }

  await fetchAndRenderFeed(true);
}

/**
 * Attaches click event delegations to video card grids
 */
function bindGridClicks(grid) {
  if (!grid) return;

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
}

// Hover live previews isolators variables
let activeHoverTimeout = null;
let activeCard = null;

/**
 * Clears active iframe previews and destroys dynamic DOM structures cleanly
 */
export function clearActivePreview() {
  if (activeHoverTimeout) {
    clearTimeout(activeHoverTimeout);
    activeHoverTimeout = null;
  }

  if (activeCard) {
    const thumb = activeCard.querySelector('.card-thumb');
    if (thumb) {
      const iframe = thumb.querySelector('.card-preview-iframe');
      if (iframe) iframe.remove();

      const loader = thumb.querySelector('.preview-loader');
      if (loader) loader.remove();
    }
    activeCard.classList.remove('hover-playing');
    activeCard = null;
  }
}

/**
 * Spawns dynamic iframe source triggers to execute muted visual playback on hovered cards
 */
function startLivePreview(card, embedUrl) {
  const thumb = card.querySelector('.card-thumb');
  if (!thumb) return;

  if (thumb.querySelector('.card-preview-iframe')) return;

  // Mount visual loader spinner
  const loader = document.createElement('div');
  loader.className = 'preview-loader';
  thumb.appendChild(loader);

  // Mount preview iframe elements
  const iframe = document.createElement('iframe');
  iframe.className = 'card-preview-iframe';
  
  // Inject autoplay and muted parameters to comply with standard browser media engagement bounds
  const previewUrl = embedUrl.includes('?') ? `${embedUrl}&autoplay=1&muted=1` : `${embedUrl}?autoplay=1&muted=1`;
  iframe.src = previewUrl;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');

  // Trigger loading complete transits
  iframe.addEventListener('load', () => {
    if (loader) loader.remove();
    iframe.classList.add('loaded');
    card.classList.add('hover-playing');
  });

  thumb.appendChild(iframe);
}

export function bindHoverPreviews(grid) {
  // Disabled as per user request to remove live video playback preview on hover
  return;
}

export default { init, renderVideoCard, bindHoverPreviews, clearActivePreview };
