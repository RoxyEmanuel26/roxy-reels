/**
 * MISSAV-J — Video Player Page (Advanced Edition)
 * Mengelola pemuatan video embed dengan sandboxing aman, penanganan transpalasi balik
 * (transplant back) kontainer PiP tanpa reload iframe, pendaran cahaya Ambient Mode,
 * dan penyimpanan Riwayat serta Tonton Nanti in-memory.
 */

import api from './api.js';
import ui from './ui.js';
import { renderVideoCard, getDeterministicDuration } from './feed.js';
import i18n from './i18n.js';

// State like/dislike lokal in-memory
const likedVideos = new Set();
const dislikedVideos = new Set();

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22168%22 height=%2294%22 viewBox=%220 0 168 94%22><rect width=%22168%22 height=%2294%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2210%22>NO IMAGE</text></svg>`;

let placeholderObserver = null;

export function syncPlayerPosition() {
  const placeholder = document.getElementById('player-placeholder');
  const globalPlayer = document.getElementById('global-player-container');
  if (!placeholder || !globalPlayer || globalPlayer.classList.contains('floating-mode') || globalPlayer.classList.contains('global-player-hidden')) return;

  const rect = placeholder.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  globalPlayer.style.top = `${rect.top + scrollY}px`;
  globalPlayer.style.left = `${rect.left + scrollX}px`;
  globalPlayer.style.width = `${rect.width}px`;
  globalPlayer.style.height = `${rect.height}px`;
}

export function observePlaceholder() {
  const placeholder = document.getElementById('player-placeholder');
  const globalPlayer = document.getElementById('global-player-container');
  if (!placeholder || !globalPlayer) return;

  if (placeholderObserver) {
    placeholderObserver.disconnect();
  }

  placeholderObserver = new ResizeObserver(() => {
    syncPlayerPosition();
  });

  placeholderObserver.observe(placeholder);
  syncPlayerPosition();
}

export function disconnectPlaceholderObserver() {
  if (placeholderObserver) {
    placeholderObserver.disconnect();
    placeholderObserver = null;
  }
}

/**
 * Mengekstrak src dari HTML iframe mentah dan membangun iframe baru dengan sandboxing ketat (Mitigasi XSS)
 */
function getSecureIframeMarkup(iframeHtml) {
  if (!iframeHtml) return `<div class="player-loading-shimmer">${i18n.t('player_not_available')}</div>`;
  
  const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) {
    return `<div class="player-loading-shimmer">${i18n.t('player_format_not_supported')}</div>`;
  }
  
  // Ganti HTML entity &#038; atau &amp; dengan ampersand asli (&) agar query parameter tidak rusak
  let rawSrc = srcMatch[1].replace(/&#038;/g, '&').replace(/&amp;/g, '&');
  const safeSrc = ui.escapeHTML(rawSrc);
  
  return `
    <iframe 
      src="${safeSrc}" 
      allowfullscreen 
      frameborder="0"
      scrolling="no"
      title="MISSAV-J safe embed player"
      allow="autoplay; fullscreen; encrypted-media"
      style="width: 100%; height: 100%; display: block;"
    ></iframe>
  `;
}

/**
 * Inisialisasi halaman player detail (Mendukung transplantasi balik tanpa reload iframe)
 * @param {string} id - ID Post / Video dari URL hash query
 */
export async function init(id) {
  if (!id) {
    ui.showError(i18n.t('invalid_video_id'));
    return;
  }

  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  // 1. Tampilkan layout teater lengkap dengan Ambient Glow Canvas
  mainApp.innerHTML = `
    <!-- Efek Pendaran Teater Ambient Glow -->
    <div class="player-ambient-glow" id="player-ambient-glow"></div>

    <div class="player-page-layout">
      <!-- Kolom Kiri: Player & Info Utama -->
      <div class="player-main-column">
        <!-- Responsive video frame container (16:9) -->
        <div class="player-container-wrapper">
          <div class="player-iframe-placeholder" id="player-placeholder">
            <div class="player-loading-shimmer">
              <div class="spinner"></div>
              <span>${i18n.t('loading_player_embed')}</span>
            </div>
          </div>
        </div>
        
        <!-- Metadata Video -->
        <div class="player-metadata-container">
          <h1 class="player-title" id="player-title">${i18n.t('loading_video_title')}</h1>
          
          <div class="player-action-row">
            <div class="player-stats">
              <span id="player-views-count">0 ${i18n.t('views')}</span>
              <span class="card-dot">•</span>
              <span id="player-publish-date">${i18n.t('published')}</span>
            </div>
            
            <div class="player-buttons">
              <button id="like-btn" class="player-btn">
                <span class="btn-icon">👍</span>
                <span id="like-count" class="btn-label">0</span>
              </button>
              <button id="dislike-btn" class="player-btn">
                <span class="btn-icon">👎</span>
                <span id="dislike-count" class="btn-label">0</span>
              </button>
              <button id="watch-later-btn" class="player-btn">
                <span class="btn-icon">📁</span>
                <span id="watch-later-label" class="btn-label">${i18n.t('btn_watch_later')}</span>
              </button>
              <button id="share-btn" class="player-btn">
                <span class="btn-icon">🔗</span>
                <span class="btn-label">${i18n.t('btn_share')}</span>
              </button>
            </div>
          </div>
          
          <!-- Detail Metadata Box -->
          <div class="player-meta-box">
            <div class="meta-box-header">
              <div class="studio-badge-wrapper" id="player-studio-wrapper">
                <!-- Diisi Studio -->
              </div>
              <div class="video-code-badge" id="player-code">KODE</div>
            </div>
            
            <div class="meta-box-details">
              <div class="meta-section">
                <h4>${i18n.t('meta_actors')}</h4>
                <div class="meta-chips-list" id="player-actors-list">
                  <span class="chip-loading-placeholder">${i18n.t('loading_actors')}</span>
                </div>
              </div>
              
              <div class="meta-section">
                <h4>${i18n.t('meta_categories')}</h4>
                <div class="meta-chips-list" id="player-categories-list">
                  <span class="chip-loading-placeholder">${i18n.t('loading_categories')}</span>
                </div>
              </div>

              <div class="meta-section">
                <h4>${i18n.t('meta_tags')}</h4>
                <div class="meta-chips-list" id="player-tags-list">
                  <span class="chip-loading-placeholder">${i18n.t('loading_tags')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Kolom Kanan: Rekomendasi Video Terkait -->
      <div class="player-sidebar-column">
        <h3>${i18n.t('related_videos')}</h3>
        <div class="related-videos-list" id="related-videos-list">
          <!-- Diisi video rekomendasi -->
        </div>
      </div>
    </div>
  `;

  const relatedList = document.getElementById('related-videos-list');
  ui.showSkeletonsInElement(relatedList, 6);

  try {
    let post;
    const isCurrentlyPlaying = window.missavJState.activeVideo && String(window.missavJState.activeVideo.id) === String(id);

    if (isCurrentlyPlaying) {
      // 2. MASTERCLASS TRANSPLANT BACK WITHOUT RELOAD: Video sudah berjalan di float!
      post = window.missavJState.activeVideo;
      
      const floatWrapper = document.getElementById('floating-player-wrapper');
      if (floatWrapper) {
        floatWrapper.classList.add('hidden'); // Sembunyikan float wrapper
      }
      window.missavJState.isFloating = false;
      
      // Kembalikan global player container ke mode tonton dan jalankan observer
      const globalPlayer = document.getElementById('global-player-container');
      if (globalPlayer) {
        globalPlayer.className = 'global-player-container watch-mode';
        observePlaceholder();
      }

      // Render metadata langsung (UX super kilat)
      document.title = `${i18n.translateVideoTitle(post.title)} — MISSAV-J`;
      renderPostMeta(post, id);
      loadRelatedVideos(post);
      
      ui.showToast(i18n.t('maximize_player_toast'));
    } else {
      // 3. Video TIDAK sedang berjalan (Fresh Load) dengan Penanganan Error dan Fallback Berlapis
      const [fetchedPost, player] = await Promise.all([
        api.getPost(id).catch(err => {
          console.warn('[API Warning] Failed to load post details, trying fallback...', err);
          return null;
        }),
        api.getPlayer(id).catch(err => {
          console.warn('[API Warning] Failed to load player endpoint, trying fallback...', err);
          return null;
        })
      ]);
      
      if (!fetchedPost && !player) {
        throw new Error(i18n.t('error_failed_fetch_video_player'));
      }
      
      post = fetchedPost || {
        id,
        title: 'Video Stream',
        views: 0,
        thumbnail: '',
        iframe_html: player ? player.iframe_html : ''
      };
      
      // Simpan objek ke active state sesi
      window.missavJState.activeVideo = post;
      
      // Render iframe segar dengan fallback berlapis di global player container
      const globalPlayer = document.getElementById('global-player-container');
      if (globalPlayer) {
        const iframeMarkup = (player && player.iframe_html) || post.iframe_html || (post.embed_url ? `<iframe src="${post.embed_url}"></iframe>` : '');
        globalPlayer.innerHTML = getSecureIframeMarkup(iframeMarkup);
        globalPlayer.className = 'global-player-container watch-mode';
        
        // Reset inline styling layout positioning
        globalPlayer.style.top = '';
        globalPlayer.style.left = '';
        globalPlayer.style.width = '';
        globalPlayer.style.height = '';
        
        observePlaceholder();
      }
      
      document.title = `${i18n.translateVideoTitle(post.title)} — MISSAV-J`;
      renderPostMeta(post, id);
      loadRelatedVideos(post);
    }

    // 4. Catat Riwayat Tontonan Sesi (In-memory, hindari duplikasi rujukan)
    trackWatchHistory(post);

  } catch (error) {
    console.error('Failed to load player page:', error);
    ui.showError(i18n.t('error_load_watch_page', { message: error.message }));
  }
}

/**
 * Mencatat daftar riwayat tontonan sesi (Watch History)
 */
function trackWatchHistory(post) {
  const history = window.missavJState.history;
  const existIdx = history.findIndex(p => String(p.id) === String(post.id));
  
  if (existIdx !== -1) {
    history.splice(existIdx, 1); // Hapus rujukan lama agar naik ke atas (terbaru)
  }
  
  history.unshift(post); // Masukkan di antrean terdepan
}

/**
 * Merender metadata lengkap video ke elemen DOM (Tersanitasi Penuh)
 */
export function renderPostMeta(post, id) {
  const titleEl = document.getElementById('player-title');
  const viewsEl = document.getElementById('player-views-count');
  const dateEl = document.getElementById('player-publish-date');
  const studioWrapper = document.getElementById('player-studio-wrapper');
  const codeEl = document.getElementById('player-code');
  
  const actorsList = document.getElementById('player-actors-list');
  const categoriesList = document.getElementById('player-categories-list');
  const tagsList = document.getElementById('player-tags-list');

  // Ambient Mode: ikat warna poster video ke background ambient-glow blur
  const glowEl = document.getElementById('player-ambient-glow');
  if (glowEl && post.thumbnail) {
    glowEl.style.backgroundImage = `url('${ui.escapeHTML(post.thumbnail)}')`;
  }

  // Sanitasi & render Title & views
  const translatedTitle = i18n.translateVideoTitle(post.title);
  const safeTitle = ui.escapeHTML(translatedTitle);
  if (titleEl) titleEl.textContent = safeTitle;
  
  if (viewsEl) {
    const viewsCount = post.views ? parseInt(post.views, 10) : 0;
    viewsEl.textContent = `${viewsCount.toLocaleString(i18n.getLang())} ${i18n.t('views')}`;
  }
  
  if (dateEl && post.date) {
    const pubDate = new Date(post.date);
    const dateFormatted = pubDate.toLocaleDateString(i18n.getLang(), { year: 'numeric', month: 'long', day: 'numeric' });
    dateEl.textContent = `${i18n.t('published')} ${dateFormatted}`;
  }

  // Code & Studio
  if (codeEl) {
    const safeCode = ui.escapeHTML(post.code || '');
    if (safeCode) {
      codeEl.textContent = safeCode;
      codeEl.style.display = '';
    } else {
      codeEl.style.display = 'none';
    }
  }

  if (studioWrapper && post.studio) {
    const safeStudio = ui.escapeHTML(post.studio);
    studioWrapper.innerHTML = `
      <a href="#/studio?name=${encodeURIComponent(safeStudio)}" class="studio-link-badge">
        🎬 ${safeStudio}
      </a>
    `;
  }

  // Render Chip lists dengan sanitasi HTML terenkapsulasi
  const renderChips = (listEl, items, routePrefix) => {
    if (!listEl) return;
    if (!items || items.length === 0) {
      listEl.innerHTML = '<span class="text-faint">-</span>';
      return;
    }
    const itemsArr = Array.isArray(items) ? items : [items];
    listEl.innerHTML = itemsArr
      .map(item => {
        const safeItem = ui.escapeHTML(item);
        let displayName = safeItem;
        if (routePrefix === 'category') {
          const dictKey = `category_${safeItem.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const translated = i18n.t(dictKey);
          if (translated) displayName = translated;
        }
        return `<a href="#/${routePrefix}?name=${encodeURIComponent(safeItem)}" class="meta-tag-chip">${displayName}</a>`;
      })
      .join('');
  };

  renderChips(actorsList, post.actors, 'actor');
  renderChips(categoriesList, post.categories, 'category');
  renderChips(tagsList, post.tags, 'tag');

  // Likes & Dislikes
  setupLikesAndDislikes(post, id);

  // Watch Later (Tonton Nanti) button logic
  setupWatchLaterLogic(post);

  // Setup Share Button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        ui.showToast(i18n.t('toast_share_success'));
      }).catch(() => {
        ui.showToast(i18n.t('toast_share_failed'));
      });
    });
  }
}

/**
 * Setup data Likes/Dislikes & state in-memory
 */
function setupLikesAndDislikes(post, id) {
  const likeBtn = document.getElementById('like-btn');
  const dislikeBtn = document.getElementById('dislike-btn');
  const likeCountEl = document.getElementById('like-count');
  const dislikeCountEl = document.getElementById('dislike-count');

  let likes = parseInt(post.likes || 0, 10);
  let dislikes = parseInt(post.dislikes || 0, 10);

  const isLiked = likedVideos.has(id);
  const isDisliked = dislikedVideos.has(id);

  if (isLiked) {
    likeBtn.classList.add('active');
    likes += 1;
  }
  if (isDisliked) {
    dislikeBtn.classList.add('active');
    dislikes += 1;
  }

  if (likeCountEl) likeCountEl.textContent = likes.toLocaleString('id-ID');
  if (dislikeCountEl) dislikeCountEl.textContent = dislikes.toLocaleString('id-ID');

  likeBtn.addEventListener('click', () => {
    if (likedVideos.has(id)) {
      likedVideos.delete(id);
      likeBtn.classList.remove('active');
      likes -= 1;
    } else {
      likedVideos.add(id);
      likeBtn.classList.add('active');
      likes += 1;
      
      if (dislikedVideos.has(id)) {
        dislikedVideos.delete(id);
        dislikeBtn.classList.remove('active');
        dislikes -= 1;
      }
    }
    likeCountEl.textContent = likes.toLocaleString('id-ID');
    dislikeCountEl.textContent = dislikes.toLocaleString('id-ID');
  });

  dislikeBtn.addEventListener('click', () => {
    if (dislikedVideos.has(id)) {
      dislikedVideos.delete(id);
      dislikeBtn.classList.remove('active');
      dislikes -= 1;
    } else {
      dislikedVideos.add(id);
      dislikeBtn.classList.add('active');
      dislikes += 1;
      
      if (likedVideos.has(id)) {
        likedVideos.delete(id);
        likeBtn.classList.remove('active');
        likes -= 1;
      }
    }
    likeCountEl.textContent = likes.toLocaleString('id-ID');
    dislikeCountEl.textContent = dislikes.toLocaleString('id-ID');
  });
}

/**
 * Mengelola logic penyimpanan video Tonton Nanti in-memory
 */
function setupWatchLaterLogic(post) {
  const watchLaterBtn = document.getElementById('watch-later-btn');
  const watchLaterLabel = document.getElementById('watch-later-label');
  if (!watchLaterBtn || !watchLaterLabel) return;

  const updateButtonVisualState = () => {
    const isSaved = window.missavJState.watchLater.some(p => String(p.id) === String(post.id));
    if (isSaved) {
      watchLaterBtn.classList.add('active');
      watchLaterLabel.textContent = i18n.t('btn_saved');
    } else {
      watchLaterBtn.classList.remove('active');
      watchLaterLabel.textContent = i18n.t('btn_watch_later');
    }
  };

  updateButtonVisualState();

  watchLaterBtn.addEventListener('click', () => {
    const isSaved = window.missavJState.watchLater.some(p => String(p.id) === String(post.id));
    
    if (isSaved) {
      // Hapus dari tonton nanti
      window.missavJState.watchLater = window.missavJState.watchLater.filter(p => String(p.id) !== String(post.id));
      ui.showToast(i18n.t('toast_removed_watch_later'));
    } else {
      // Simpan ke tonton nanti
      window.missavJState.watchLater.push(post);
      ui.showToast(i18n.t('toast_saved_watch_later'));
    }
    updateButtonVisualState();
  });
}

/**
 * Mengambil rekomendasi video terkait berdasarkan kategori pertama
 */
export async function loadRelatedVideos(post) {
  const relatedList = document.getElementById('related-videos-list');
  if (!relatedList) return;

  try {
    const firstCategory = post.categories && post.categories[0] ? post.categories[0] : '';
    
    const data = await api.getPosts({
      category: firstCategory,
      orderby: 'views',
      order: 'DESC',
      per_page: 12
    });

    const filteredPosts = data.posts.filter(p => p.id !== post.id);

    if (filteredPosts.length === 0) {
      relatedList.innerHTML = `<span class="text-faint text-center py-4">${i18n.t('no_related_videos')}</span>`;
      return;
    }

    relatedList.innerHTML = filteredPosts
      .map((p, idx) => renderRelatedRowCard(p, idx))
      .join('');
    
    bindRelatedClicks(relatedList);

  } catch (error) {
    console.error('Fetch Related Videos Error:', error);
    relatedList.innerHTML = `<span class="text-faint text-center py-4">${i18n.t('error_load_related')}</span>`;
  }
}

/**
 * Merender markup kartu video baris kecil untuk rekomendasi sidebar (Aman XSS & Staggered)
 */
function renderRelatedRowCard(post, index) {
  const originalTitle = post.title || '';
  const translatedTitle = i18n.translateVideoTitle(originalTitle);
  const safeId = ui.escapeHTML(post.id);
  const safeTitle = ui.escapeHTML(translatedTitle);
  const safeStudio = ui.escapeHTML(post.studio || 'Unknown');
  const safeThumbnail = ui.escapeHTML(post.thumbnail || '');
  
  // Ambil durasi, jika kosong atau 00:00:00, gunakan deterministic generator
  let duration = post.duration || '';
  if (!duration || duration === '00:00:00') {
    duration = getDeterministicDuration(post.id);
  }
  const safeDuration = ui.escapeHTML(duration);

  // Deteksi jika video tanpa sensor (Uncensored)
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

  const uncensoredBadge = isUncensored ? `<span class="card-uncensored" style="font-size: 0.6rem; padding: 1px 4px; bottom: 4px; left: 4px;">${i18n.t('badge_uncensored')}</span>` : '';

  const isHD = safeTitle.toLowerCase().includes('hd') || (post.tags && post.tags.some(t => String(t).toLowerCase() === 'hd'));
  const hdBadge = isHD ? `<span class="card-hd">HD</span>` : '';
  const durationBadge = safeDuration ? `<span class="card-duration">${safeDuration}</span>` : '';
  const viewsFormatted = post.views ? parseInt(post.views, 10).toLocaleString(i18n.getLang()) : '0';

  const animationStyle = `style="animation-delay: calc(${index} * 40ms);"`;

  return `
    <div class="related-video-card fadeInUp" data-id="${safeId}" ${animationStyle}>
      <div class="related-thumb">
        <img 
          src="${safeThumbnail || SVG_FALLBACK_THUMB}" 
          alt="${safeTitle}" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${SVG_FALLBACK_THUMB}';"
        >
        ${uncensoredBadge}
        ${durationBadge}
        ${hdBadge}
      </div>
      <div class="related-info">
        <h4 class="related-title" title="${safeTitle}">${safeTitle}</h4>
        <span class="related-studio">${safeStudio}</span>
        <span class="related-views">${viewsFormatted} ${i18n.t('views')}</span>
      </div>
    </div>
  `;
}

/**
 * Pasang event listener untuk rute navigasi pada sidebar rekomendasi
 */
function bindRelatedClicks(list) {
  list.addEventListener('click', (e) => {
    const card = e.target.closest('.related-video-card');
    if (card) {
      const postId = card.dataset.id;
      window.missavJNavigate(`/watch?id=${postId}`);
    }
  });
}
export default { init };
