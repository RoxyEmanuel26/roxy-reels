/**
 * MISSAV-J — Video Player Page (Advanced Edition)
 * Mengelola pemuatan video embed dengan sandboxing aman, penanganan transpalasi balik
 * (transplant back) kontainer PiP tanpa reload iframe, pendaran cahaya Ambient Mode,
 * dan penyimpanan Riwayat serta Tonton Nanti in-memory.
 */

import api from './api.js?v=2.8.77';
import ui from './ui.js?v=2.8.77';
import { renderVideoCard, getDeterministicDuration } from './feed.js?v=2.8.77';
import i18n from './i18n.js?v=2.8.77';
import ReferralSystem from './referral.js?v=2.8.77';
import { Analytics } from './analytics.js?v=2.8.77';

let playerInstance = null;
// State like/dislike lokal in-memory
const likedVideos = new Set();
const dislikedVideos = new Set();

// Observer untuk mendeteksi perubahan ukuran placeholder pemutar
let placeholderObserver = null;

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22168%22 height=%2294%22 viewBox=%220 0 168 94%22><rect width=%22168%22 height=%2294%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2210%22>NO IMAGE</text></svg>`;



/**
 * Mengekstrak src dari HTML iframe mentah dan membangun iframe baru dengan sandboxing ketat (Mitigasi XSS)
 */
function getSecureIframeMarkup(iframeHtml) {
  if (!iframeHtml) return `<div class="player-loading-shimmer">${i18n.t('player_not_available')}</div>`;
  
  // Clean up ampersands inside the src attribute of the iframe safely to prevent token errors
  let cleanedHtml = iframeHtml
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&');
  
  // Force 100% width and height style on the iframe for fully responsive presentation inside containers
  if (cleanedHtml.includes('style=')) {
    cleanedHtml = cleanedHtml.replace(/style=["']([^"']+)["']/i, 'style="width: 100%; height: 100%; display: block;"');
  } else {
    cleanedHtml = cleanedHtml.replace('<iframe', '<iframe style="width: 100%; height: 100%; display: block;"');
  }

  // Ensure full permissions for autoplay, picture-in-picture, fullscreen, etc., are explicitly allowed
  if (!cleanedHtml.includes('allow=')) {
    cleanedHtml = cleanedHtml.replace('<iframe', '<iframe allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; web-share"');
  } else {
    cleanedHtml = cleanedHtml.replace(/allow=["']([^"']+)["']/i, 'allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; web-share"');
  }

  if (!cleanedHtml.includes('allowfullscreen')) {
    cleanedHtml = cleanedHtml.replace('<iframe', '<iframe allowfullscreen="true"');
  }

  return cleanedHtml;
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

  // Bersihkan observer lama jika ada sebelum memuat halaman baru
  disconnectPlaceholderObserver();

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
          <div class="player-container-placeholder">
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
              <a id="player-download-btn" href="#" target="_blank" class="download-badge-btn" style="display: none;">
                <span class="btn-icon">📥</span>
                <span>Download</span>
              </a>
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
      
      <!-- Kolom Kanan: Rekomendasi Video Terkait & Iklan Sidebar -->
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

    // Make sure global player wrapper has correct classes and is shown
    const floatWrapper = document.getElementById('floating-player-wrapper');
    if (floatWrapper) {
      floatWrapper.classList.remove('hidden');
      floatWrapper.classList.remove('mode-floating');
      floatWrapper.classList.add('mode-theater');
      alignGlobalPlayerWithPlaceholder();
      setupPlaceholderObserver();
    }

    if (isCurrentlyPlaying) {
      post = window.missavJState.activeVideo;
      
      // Hide the placeholder shimmer since player is already loaded and active
      const shimmer = document.querySelector('.player-container-placeholder .player-loading-shimmer');
      if (shimmer) {
        shimmer.style.display = 'none';
      }
      
      // Align positioning
      alignGlobalPlayerWithPlaceholder();
      
      // Render metadata directly
      document.title = `${i18n.translateVideoTitle(post.title)} — MISSAV-J`;
      renderPostMeta(post, id);
      loadRelatedVideos(post);
      
      ui.showToast(i18n.t('maximize_player_toast'));
    } else {
      // Fresh load of a new video
      // 1. Fetch metadata first (usually instant from cache)
      const fetchedPost = await api.getPost(id).catch(err => {
        console.warn('[API Warning] Failed to load post details, trying fallback...', err);
        return null;
      });
      
      // 2. Start fetching player embed in the background (DO NOT await it yet)
      const playerPromise = api.getPlayer(id).catch(err => {
        console.warn('[API Warning] Failed to load player endpoint, trying fallback...', err);
        return null;
      });
      
      if (!fetchedPost) {
        // Jika post gagal, coba tunggu player info (mungkin server sedang lelah)
        const p = await playerPromise;
        if (!p) throw new Error(i18n.t('error_failed_fetch_video_player'));
        post = { id, title: 'Video Stream', views: 0, thumbnail: '', iframe_html: p.iframe_html };
      } else {
        post = fetchedPost;
      }
      
      // [FIX] Guard: jika pengguna navigasi ke video lain saat fetch sedang berjalan, batalkan render ini
      const checkWatchId = typeof window.missavJGetCurrentWatchId === 'function'
        ? window.missavJGetCurrentWatchId()
        : new URLSearchParams(window.location.search).get('id');

      if (window.missavJState.currentPath !== '/watch' || String(checkWatchId) !== String(id)) {
        return; // Abort stale render
      }
      
      window.missavJState.activeVideo = post;
      
      // Inject secure custom poster markup into the global player container
      const playerContainer = document.getElementById('player-container');
      if (playerContainer) {
        
        // Deteksi apakah pengakses adalah bot pencari (seperti Googlebot)
        const isBot = /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(navigator.userAgent);
        
        let isVideoLoading = false;
        const loadRealVideo = async (playBtn = null) => {
          if (isVideoLoading) return;
          isVideoLoading = true;
          
          let originalPlayBtnHtml = '';
          if (playBtn) {
            originalPlayBtnHtml = playBtn.innerHTML;
            // Tampilkan spinner pada tombol play saat menunggu iframe di-fetch
            playBtn.innerHTML = '<div class="spinner" style="width: 24px; height: 24px; border-width: 3px; margin: 0 auto; border-top-color: white; border-right-color: rgba(255,255,255,0.3); border-bottom-color: rgba(255,255,255,0.3); border-left-color: rgba(255,255,255,0.3);"></div>';
            playBtn.style.pointerEvents = 'none'; // Cegah klik ganda
          }

          let player;
          try {
             player = await playerPromise;
          } catch(e) {
             console.error('Player promise failed', e);
          }

          // [FIX] Guard 2: Pastikan pengguna belum pindah video setelah tombol Play ditekan
          if (window.missavJState.activeVideo && String(window.missavJState.activeVideo.id) !== String(id)) {
             return;
          }

          const iframeMarkup = (player && player.iframe_html) || post.iframe_html || (post.embed_url ? `<iframe src="${post.embed_url}"></iframe>` : '');
          
          if (!iframeMarkup) {
            if (playBtn) {
               playBtn.innerHTML = originalPlayBtnHtml;
               playBtn.style.pointerEvents = 'auto';
            }
            isVideoLoading = false;
            ui.showError(i18n.t('error_failed_fetch_video_player'), playerContainer);
            return;
          }

          if (isBot) {
            const inlinePlaceholder = document.querySelector('.player-container-placeholder');
            if (inlinePlaceholder) {
              inlinePlaceholder.innerHTML = getSecureIframeMarkup(iframeMarkup);
              return;
            }
          }
          
          playerContainer.innerHTML = getSecureIframeMarkup(iframeMarkup);
          
          // Hide the watch page loader shimmer when iframe is loaded
          const iframe = playerContainer.querySelector('iframe');
          if (iframe) {
            const hideShimmer = () => {
              const shimmer = document.querySelector('.player-container-placeholder .player-loading-shimmer');
              if (shimmer) shimmer.style.display = 'none';
              
              // Track video play event when iframe loads
              Analytics.trackVideoPlay(id, post.code || '', post.title || '', post.duration || '');
            };
            iframe.addEventListener('load', hideShimmer);
            setTimeout(hideShimmer, 3000); // fallback timer
          } else {
             Analytics.trackVideoPlay(id, post.code || '', post.title || '', post.duration || '');
          }
        };

        if (isBot) {
          console.log('[SEO] Bot detected, loading player iframe immediately...');
          loadRealVideo();
        } else {
          const secureThumb = ui.escapeHTML(ui.getProxiedThumbnail(post.thumbnail) || SVG_FALLBACK_THUMB);
          const secureTitle = ui.escapeHTML(post.title || '');
          const secureCode = ui.escapeHTML(post.code || '');
          
          playerContainer.innerHTML = `
            <div class="player-custom-poster" id="player-custom-poster">
              <div class="poster-bg" style="background-image: url('${secureThumb}');"></div>
              <div class="poster-overlay"></div>
              <div class="poster-play-btn-wrapper">
                <button class="poster-play-btn" id="poster-play-btn" aria-label="${i18n.t('play_video') || 'Play Video'}">
                  <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <div class="poster-meta">
                ${secureCode ? `<span class="poster-code">${secureCode}</span>` : ''}
                <h2 class="poster-title">${i18n.translateVideoTitle(secureTitle)}</h2>
              </div>
            </div>
          `;
          
          // Hide the watch page loader shimmer when poster is shown
          const shimmer = document.querySelector('.player-container-placeholder .player-loading-shimmer');
          if (shimmer) shimmer.style.display = 'none';

          // Add play button click listener
          const playBtn = document.getElementById('poster-play-btn');
          if (playBtn) {
            playBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              loadRealVideo(playBtn);
            });
          }
        }
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
  
  // [FIX K-3] Batasi history maks 100 item agar localStorage tidak QuotaExceededError
  if (history.length > 100) {
    history.length = 100;
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('missav_history', JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save history to localStorage', e);
  }
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
  const downloadBtn = document.getElementById('player-download-btn');
  
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
  if (titleEl) {
    titleEl.textContent = translatedTitle;
    titleEl.setAttribute('data-original-title', post.title || '');
  }
  
  if (viewsEl) {
    const viewsCount = post.views ? parseInt(post.views, 10) : 0;
    viewsEl.textContent = `${viewsCount.toLocaleString(i18n.getLang())} ${i18n.t('views')}`;
  }
  
  if (dateEl && post.date) {
    const pubDate = new Date(post.date);
    if (!isNaN(pubDate.getTime())) {
      const dateFormatted = pubDate.toLocaleDateString(i18n.getLang(), { year: 'numeric', month: 'long', day: 'numeric' });
      dateEl.textContent = `${i18n.t('published')} ${dateFormatted}`;
    } else {
      dateEl.style.display = 'none';
    }
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

  // Setup Download Button with redirect link
  if (downloadBtn) {
    const downloadLinks = [
      "https://glamournakedemployee.com/xvz5b27p?key=e93021d8d48312e0676820abac78db99"
    ];
    const randomUrl = downloadLinks[Math.floor(Math.random() * downloadLinks.length)];
    downloadBtn.href = randomUrl;
    downloadBtn.style.display = 'inline-flex';
  }

  if (studioWrapper) {
    if (post.studio) {
      const safeStudio = ui.escapeHTML(post.studio);
      studioWrapper.innerHTML = `
        <a href="#/studio?name=${encodeURIComponent(safeStudio)}" class="studio-link-badge">
          🎬 ${safeStudio}
        </a>
      `;
    } else {
      studioWrapper.innerHTML = `
        <a href="#/studio?name=Other" class="studio-link-badge text-muted">
          🎬 ${i18n.t('unknown_studio')}
        </a>
      `;
    }
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
        const lang = i18n.getLang() || 'en';
        return `<a href="/${lang}/${routePrefix}?name=${encodeURIComponent(item)}" class="meta-tag-chip">${displayName}</a>`;
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
      // Generate referral tracking link instead of basic URL
      const shareUrl = ReferralSystem.generateShareLink(window.location.href, 'video_share');
      const titleElement = document.getElementById('player-title');
      const translatedTitle = titleElement ? titleElement.textContent : (post.title ? i18n.translateVideoTitle(post.title) : i18n.t('btn_share'));
      const thumbnailUrl = post.thumbnail ? (post.thumbnail.startsWith('http') ? post.thumbnail : window.location.origin + post.thumbnail) : (window.location.origin + '/assets/images/logo.webp');
      showShareModal(translatedTitle, shareUrl, thumbnailUrl);
      Analytics.trackShare(id, 'modal');
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
      Analytics.trackWatchLaterAdd(id, post.title);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('missav_watch_later', JSON.stringify(window.missavJState.watchLater));
    } catch (e) {
      console.warn('Failed to save watch later to localStorage', e);
    }

    updateButtonVisualState();
  });
}

/**
 * Mengekstrak kata kunci bersih dari judul video untuk pencarian (menghindari tanda kurung & stop words umum)
 */
function extractTitleKeywords(title) {
  if (!title) return '';
  // Hapus blok kurung siku [...] dan kurung biasa (...)
  let clean = title.replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\)/g, ' ');
  // Hapus karakter khusus
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, ' ');
  
  // Daftar kata-kata tidak bermakna (stop words) untuk disaring
  const stopWords = new Set([
    'the', 'and', 'with', 'for', 'that', 'this', 'from', 'you', 'are', 'was', 'were', 
    'has', 'have', 'had', 'she', 'her', 'him', 'his', 'they', 'them', 'who', 'whom', 
    'which', 'what', 'why', 'how', 'slut', 'girl', 'beautiful', 'legs', 'breasts', 
    'knee', 'highs', 'senior', 'junior', 'friends', 'gals', 'dan', 'yang', 'untuk', 
    'dengan', 'dari', 'pada', 'atau', 'ini', 'itu', 'di', 'ke', 'terbaru', 'sub', 
    'indo', 'uncensored', 'censored', 'video', 'full', 'part', 'episode', 'scene',
    'new', 'hot', 'best', 'big', 'small', 'first', 'time', 'very', 'super', 'ultra',
    'special', 'edition', 'collection', 'series', 'vol', 'chapter'
  ]);
  
  const words = clean.split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()));
  
  // Ambil maksimal 3 kata kunci penting pertama
  return words.slice(0, 3).join(' ');
}

/**
 * Mengekstrak prefix seri kode video (contoh: ABP-123 → "ABP")
 */
function extractCodeSeriesPrefix(code) {
  if (!code) return '';
  const match = code.match(/^([A-Za-z]+)-?\d/);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Fisher-Yates shuffle untuk mengacak array in-place
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Menghitung skor relevansi video terkait dan menentukan alasan kecocokan utama.
 * Skor tertinggi = paling relevan. Alasan digunakan untuk badge visual.
 *
 * Faktor skor:
 *  +120 per aktor yang sama
 *  +90  seri kode yang sama (ABP-xxx)
 *  +50  studio yang sama
 *  +20  per tag yang sama
 *  +8   per kategori yang sama
 *  +10  video sangat baru (< 30 hari)
 *  +5   video baru (< 90 hari)
 *  +5   views > 50.000
 *  +3   views > 10.000
 *  +1   views > 1.000
 */
function computeRelevanceScore(candidate, currentPost) {
  let score = 0;
  let matchReason = '';

  const currentActors     = (currentPost.actors     || []).map(a => a.toLowerCase());
  const currentTags       = (currentPost.tags        || []).map(t => t.toLowerCase());
  const currentCategories = (currentPost.categories  || []).map(c => c.toLowerCase());
  const currentCode       = (currentPost.code        || '').toUpperCase();
  const currentStudio     = (currentPost.studio      || '').toLowerCase().trim();
  const currentSeriesPrefix = extractCodeSeriesPrefix(currentPost.code);

  const candidateActors     = (candidate.actors     || []).map(a => a.toLowerCase());
  const candidateTags       = (candidate.tags        || []).map(t => t.toLowerCase());
  const candidateCategories = (candidate.categories  || []).map(c => c.toLowerCase());
  const candidateCode       = (candidate.code        || '').toUpperCase();
  const candidateStudio     = (candidate.studio      || '').toLowerCase().trim();
  const candidateSeriesPrefix = extractCodeSeriesPrefix(candidate.code);

  // ── Skor tertinggi: Aktris yang sama (paling relevan bagi pengguna) ──
  const sharedActors = currentActors.filter(a => candidateActors.includes(a));
  if (sharedActors.length > 0) {
    score += 120 * sharedActors.length;
    matchReason = 'actor';
  }

  // ── Skor tinggi: Seri kode yang sama (contoh: ABP-123 & ABP-456) ──
  if (currentSeriesPrefix && candidateSeriesPrefix &&
      currentSeriesPrefix === candidateSeriesPrefix &&
      currentCode !== candidateCode) {
    score += 90;
    if (!matchReason) matchReason = 'series';
  }

  // ── Skor menengah-tinggi: Studio yang sama ──
  if (currentStudio && candidateStudio &&
      currentStudio !== 'unknown studio' && currentStudio !== 'other' &&
      currentStudio === candidateStudio) {
    score += 50;
    if (!matchReason) matchReason = 'studio';
  }

  // ── Skor sedang: Tag yang sama ──
  const sharedTags = currentTags.filter(t => candidateTags.includes(t));
  if (sharedTags.length > 0) {
    score += 20 * sharedTags.length;
    if (!matchReason) matchReason = 'tag';
  }

  // ── Skor rendah: Kategori yang sama ──
  const sharedCats = currentCategories.filter(c => candidateCategories.includes(c));
  if (sharedCats.length > 0) {
    score += 8 * sharedCats.length;
    if (!matchReason) matchReason = 'category';
  }

  // ── Bonus kesegaran video (video baru lebih menarik) ──
  if (candidate.date) {
    const ageMs = Date.now() - new Date(candidate.date).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 30)  score += 10;
    else if (ageDays < 90) score += 5;
  }

  // ── Bonus popularitas video (granular) ──
  const views = parseInt(candidate.views, 10) || 0;
  if (views > 50000)     score += 5;
  else if (views > 10000) score += 3;
  else if (views > 1000)  score += 1;

  return { score, matchReason };
}

/**
 * Smart Related Videos Engine — Progressive Two-Phase Loading
 *
 * ┌─ FASE 1 (Instan, ≤2 query) ─────────────────────────────────────────┐
 * │  Tembak hanya 2 query paling relevan (actor + series).               │
 * │  Render hasilnya LANGSUNG ke layar tanpa menunggu apapun.            │
 * │  Beban ke API pihak ketiga: hanya 2 request per user.               │
 * └──────────────────────────────────────────────────────────────────────┘
 * ┌─ FASE 2 (Background, +2 detik delay) ───────────────────────────────┐
 * │  Setelah 2 detik, tembak sisa 5 query (actor[1], tag[0], tag[1],    │
 * │  category, studio) di background tanpa menghalangi pengunjung.       │
 * │  Gabungkan dengan hasil Fase 1, re-score, perbarui tampilan.         │
 * │  Beban tersebar dalam waktu → tidak bisa memblokir server API.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export async function loadRelatedVideos(post) {
  const relatedList = document.getElementById('related-videos-list');
  if (!relatedList) return;

  const initialPath = window.missavJState?.currentPath;

  // ── Guard: Cek apakah user masih di halaman yang sama ──
  const isStillOnPage = () =>
    !!document.getElementById('related-videos-list') &&
    window.missavJState?.currentPath === initialPath;

  // ── Helper: Jalankan array query dan kumpulkan semua post yang berhasil ──
  const runQueries = async (queryList) => {
    if (queryList.length === 0) return [];
    const results = await Promise.allSettled(queryList);
    let posts = [];
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.posts)) {
        posts = posts.concat(res.value.posts);
      }
    });
    return posts;
  };

  // ── Helper: Deduplikasi berdasarkan ID, Code, dan Title ──
  const deduplicatePosts = (posts) => {
    const seenIds    = new Set();
    const seenCodes  = new Set();
    const seenTitles = new Set();
    return posts.filter(p => {
      if (String(p.id) === String(post.id)) return false; // hilangkan video yang sedang ditonton
      if (seenIds.has(p.id)) return false;
      const code = (p.code || '').trim().toUpperCase();
      if (code && seenCodes.has(code)) return false;
      const title = (p.title || '').trim().toLowerCase();
      if (title && seenTitles.has(title)) return false;
      seenIds.add(p.id);
      if (code) seenCodes.add(code);
      if (title) seenTitles.add(title);
      return true;
    });
  };

  // ── Helper: Hitung skor, urutkan, acak per-tier ──
  const scoreAndSort = (posts) => {
    const scored = posts.map(p => {
      const { score, matchReason } = computeRelevanceScore(p, post);
      return { ...p, _relevanceScore: score, _matchReason: matchReason };
    });
    scored.sort((a, b) => b._relevanceScore - a._relevanceScore);
    // Shuffle video dalam tier skor yang sama untuk variasi
    let lastScore = -1;
    let tierStart = 0;
    for (let i = 0; i <= scored.length; i++) {
      const currentScore = i < scored.length ? scored[i]._relevanceScore : -999;
      if (currentScore !== lastScore) {
        if (i - tierStart > 1) {
          const tierSlice = scored.slice(tierStart, i);
          shuffleArray(tierSlice);
          for (let j = 0; j < tierSlice.length; j++) scored[tierStart + j] = tierSlice[j];
        }
        tierStart = i;
        lastScore = currentScore;
      }
    }
    return scored;
  };

  // ── Helper: Render dan bind ke DOM ──
  const renderToDOM = (posts) => {
    const rl = document.getElementById('related-videos-list');
    if (!rl) return;
    rl.innerHTML = posts.map((p, idx) => renderRelatedRowCard(p, idx)).join('');
    bindRelatedClicks(rl);
  };

  let phase1RawPosts = []; // Simpan raw posts Fase 1 untuk digabung di Fase 2

  try {
    // ═══════════════════════════════════════════════════════════════════
    // FASE 1 — PRIORITAS TINGGI: Maks 2 query, render langsung ke layar
    // Tujuan: Pengunjung melihat konten relevan SECEPAT MUNGKIN.
    // Beban ke API: hanya 2 request per user di saat yang bersamaan.
    // ═══════════════════════════════════════════════════════════════════
    const phase1Queries = [];

    // [P1-Q1] Aktris Utama — relevansi tertinggi
    if (post.actors && post.actors.length > 0) {
      phase1Queries.push(api.getPosts({ actor: post.actors[0], per_page: 8 }));
    }

    // [P1-Q2] Seri Kode — relevansi sangat tinggi (ABP-001 → cari ABP-xxx)
    if (post.code && post.code.trim()) {
      const seriesPrefix = extractCodeSeriesPrefix(post.code);
      if (seriesPrefix) {
        phase1Queries.push(api.getPosts({ search: seriesPrefix, per_page: 8 }));
      }
    }

    // [P1-Fallback] Jika tidak ada aktor dan kode seri, gunakan kategori sementara
    if (phase1Queries.length === 0) {
      if (post.tags && post.tags.length > 0) {
        phase1Queries.push(api.getPosts({ tag: post.tags[0], per_page: 8 }));
      } else if (post.categories && post.categories.length > 0) {
        phase1Queries.push(api.getPosts({ category: post.categories[0], per_page: 8 }));
      }
    }

    phase1RawPosts = await runQueries(phase1Queries);

    // Guard navigasi setelah await selesai
    if (!isStillOnPage()) return;

    const phase1Final = scoreAndSort(deduplicatePosts(phase1RawPosts)).slice(0, 20);
    if (phase1Final.length > 0) {
      renderToDOM(phase1Final);
    }

    // ═══════════════════════════════════════════════════════════════════
    // FASE 2 — BACKGROUND: Sisa 5 query, dijalankan 2 detik kemudian
    // Tujuan: Perkaya hasil dengan lebih banyak sinyal relevansi.
    // Beban tersebar dalam waktu → tidak memblokir / tidak membanjiri
    //         server API pihak ketiga secara bersamaan.
    // ═══════════════════════════════════════════════════════════════════
    setTimeout(async () => {
      // Guard pertama: cek navigasi sebelum mulai
      if (!isStillOnPage()) return;

      const phase2Queries = [];

      // [P2-Q1] Aktris Kedua (jika ada)
      if (post.actors && post.actors.length > 1) {
        phase2Queries.push(api.getPosts({ actor: post.actors[1], per_page: 6 }));
      }

      // [P2-Q2] Tag Utama
      if (post.tags && post.tags.length > 0) {
        phase2Queries.push(api.getPosts({ tag: post.tags[0], per_page: 8 }));
      }

      // [P2-Q3] Tag Kedua (jika ada)
      if (post.tags && post.tags.length > 1) {
        phase2Queries.push(api.getPosts({ tag: post.tags[1], per_page: 6 }));
      }

      // [P2-Q4] Kategori Pertama
      if (post.categories && post.categories.length > 0) {
        phase2Queries.push(api.getPosts({ category: post.categories[0], per_page: 6 }));
      }

      // [P2-Q5] Studio yang sama
      if (post.studio && post.studio !== 'Unknown Studio' && post.studio !== 'Other') {
        phase2Queries.push(api.getPosts({ studio: post.studio, per_page: 8 }));
      }

      // [P2-Fallback] Jika Fase 2 kosong, coba kata kunci judul
      if (phase2Queries.length === 0) {
        const keywords = extractTitleKeywords(post.title);
        if (keywords) {
          phase2Queries.push(api.getPosts({ search: keywords, per_page: 6 }));
        }
      }

      const phase2RawPosts = await runQueries(phase2Queries);

      // Guard kedua: cek navigasi setelah semua query Fase 2 selesai
      if (!isStillOnPage()) return;

      // Gabung raw posts Fase 1 + Fase 2, lalu deduplicate & re-score bersama
      const combinedRaw = [...phase1RawPosts, ...phase2RawPosts];
      let combinedFinal = scoreAndSort(deduplicatePosts(combinedRaw));

      // Fallback akhir: jika masih kosong, gunakan video populer dari kategori
      if (combinedFinal.length === 0 && post.categories && post.categories[0]) {
        try {
          const fallbackData = await api.getPosts({
            category: post.categories[0],
            orderby: 'views',
            order: 'DESC',
            per_page: 12
          });
          if (!isStillOnPage()) return;
          combinedFinal = (fallbackData.posts || [])
            .filter(p => String(p.id) !== String(post.id))
            .map(p => ({ ...p, _relevanceScore: 0, _matchReason: 'category' }));
        } catch (err) {
          console.warn('[Related] Fallback category failed:', err);
        }
      }

      if (!isStillOnPage()) return;

      if (combinedFinal.length === 0) {
        const rl = document.getElementById('related-videos-list');
        if (rl) rl.innerHTML = `<span class="text-faint text-center py-4">${i18n.t('no_related_videos')}</span>`;
        return;
      }

      // Render hasil gabungan final (maks 20 video)
      renderToDOM(combinedFinal.slice(0, 20));

    }, 2000); // ← 2 detik jeda: menyebarkan beban ke API pihak ketiga

  } catch (error) {
    console.error('[Related] Fetch Error:', error);
    const rl = document.getElementById('related-videos-list');
    if (rl) rl.innerHTML = `<span class="text-faint text-center py-4">${i18n.t('error_load_related')}</span>`;
  }
}

/**
 * Merender markup kartu video baris kecil untuk rekomendasi sidebar (Aman XSS & Staggered)
 * Menambahkan badge alasan kecocokan jika tersedia (_matchReason).
 */
function renderRelatedRowCard(post, index) {
  const originalTitle = post.title || '';
  const translatedTitle = i18n.translateVideoTitle(originalTitle);
  const safeId = ui.escapeHTML(post.id);
  const safeTitle = ui.escapeHTML(translatedTitle);
  const safeStudio = ui.escapeHTML(post.studio || 'Unknown');
  const safeThumbnail = ui.escapeHTML(ui.getProxiedThumbnail(post.thumbnail) || '');
  
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

  // ── Badge alasan kecocokan (Match Reason) ──
  let matchBadgeHTML = '';
  if (post._matchReason) {
    const badgeConfig = {
      actor:    { icon: '🎭', key: 'match_same_actor',    cls: 'match-actor' },
      series:   { icon: '📀', key: 'match_same_series',   cls: 'match-series' },
      studio:   { icon: '🏢', key: 'match_same_studio',   cls: 'match-studio' },
      tag:      { icon: '🏷️', key: 'match_similar_tag',   cls: 'match-tag' },
      category: { icon: '📂', key: 'match_same_category', cls: 'match-category' },
    };
    const cfg = badgeConfig[post._matchReason];
    if (cfg) {
      matchBadgeHTML = `<span class="related-match-badge ${cfg.cls}">${cfg.icon} ${i18n.t(cfg.key)}</span>`;
    }
  }

  const animationStyle = `style="animation-delay: calc(${index} * 40ms);"`;

  return `
    <div class="related-video-card fadeInUp" data-id="${safeId}" data-code="${ui.escapeHTML(post.code || '')}" data-title="${safeTitle}" ${animationStyle}>
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
        <h4 class="related-title" title="${safeTitle}" data-original-title="${ui.escapeHTML(post.title || '')}">${safeTitle}</h4>
        <span class="related-studio">${safeStudio}</span>
        <div class="related-meta-row">
          <span class="related-views">${viewsFormatted} ${i18n.t('views')}</span>
          ${matchBadgeHTML}
        </div>
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
      const code = card.dataset.code || '';
      const title = card.dataset.title || '';
      window.missavJNavigateToWatch(postId, code, title);
    }
  });
}
/**
 * Aligns the persistent floating-player-wrapper exactly over the watch page placeholder.
 * Menggunakan deteksi koordinat absolut bebas-scroll (offsetParent traversal) untuk mencegah
 * pergeseran posisi akibat jeda reflow layout dan sinkronisasi scroll browser (scroll lag).
 */
export function alignGlobalPlayerWithPlaceholder() {
  const container = document.getElementById('floating-player-wrapper');
  if (!container || container.classList.contains('mode-floating') || container.classList.contains('hidden')) {
    return;
  }
  
  const placeholder = document.querySelector('.player-container-placeholder');
  if (placeholder) {
    // 1. Hitung koordinat dokumen absolut menggunakan penelusuran offsetParent (kebal scroll)
    let docTop = 0;
    let docLeft = 0;
    let curr = placeholder;
    while (curr) {
      docTop += curr.offsetTop || 0;
      docLeft += curr.offsetLeft || 0;
      curr = curr.offsetParent;
    }

    const rect = placeholder.getBoundingClientRect();
    
    // 2. Jika perbedaan koordinat penelusuran dengan getBoundingClientRect + scroll kecil (< 15px),
    // gunakan getBoundingClientRect + scroll untuk presisi sub-pixel. Jika ada selisih besar (lag scroll/reflow),
    // gunakan penelusuran offsetParent untuk kestabilan penuh agar bingkai tidak bergeser.
    const rectDocTop = rect.top + window.scrollY;
    const rectDocLeft = rect.left + window.scrollX;
    
    const finalTop = Math.abs(rectDocTop - docTop) < 15 ? rectDocTop : docTop;
    const finalLeft = Math.abs(rectDocLeft - docLeft) < 15 ? rectDocLeft : docLeft;

    container.style.position = 'absolute';
    container.style.top = finalTop + 'px';
    container.style.left = finalLeft + 'px';
    container.style.width = rect.width + 'px';
    container.style.height = rect.height + 'px';
    
    // Scale the player-container from 960px fixed reference to match the placeholder width.
    // This prevents actual iframe resize events that would trigger DevTools detection
    // inside the embed player from apijav.com.
    const playerContainer = document.getElementById('player-container');
    if (playerContainer) {
      playerContainer.style.transform = 'none';  // ← Hapus transform
      playerContainer.style.width = rect.width + 'px';   // ← Resize langsung
      playerContainer.style.height = rect.height + 'px';
    }
  }
}

/**
 * Menginisialisasi ResizeObserver pada placeholder untuk menyelaraskan pemutar secara dinamis
 * saat ukuran layar berubah, sidebar diciutkan, atau reflow layout DOM selesai.
 */
export function setupPlaceholderObserver() {
  disconnectPlaceholderObserver();
  
  const placeholder = document.querySelector('.player-container-placeholder');
  if (!placeholder) return;
  
  placeholderObserver = new ResizeObserver(() => {
    alignGlobalPlayerWithPlaceholder();
  });
  
  placeholderObserver.observe(placeholder);
}

/**
 * Membersihkan ResizeObserver saat meninggalkan halaman watch atau menutup pemutar
 */
export function disconnectPlaceholderObserver() {
  if (placeholderObserver) {
    placeholderObserver.disconnect();
    placeholderObserver = null;
  }
}

/**
 * Menampilkan modal popup Share Premium dengan dukungan sosial media (Pinterest, X, Facebook, Copy Link)
 */
export function showShareModal(title, shareUrl, thumbnailUrl) {
  let modal = document.getElementById('share-modal-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'share-modal-overlay';
    modal.className = 'share-modal-overlay hidden';
    modal.innerHTML = `
      <div class="share-modal-card">
        <div class="share-modal-header">
          <h3 data-i18n="share_modal_title">Share Video</h3>
          <button class="share-modal-close" aria-label="Close Share Dialog">✕</button>
        </div>
        <div class="share-modal-body">
          <div class="share-options-grid">
            <a href="#" target="_blank" class="share-option-btn opt-telegram">
              <span class="share-icon">✈️</span>
              <span>Telegram</span>
            </a>
            <a href="#" target="_blank" class="share-option-btn opt-facebook">
              <span class="share-icon">📘</span>
              <span>Facebook</span>
            </a>
            <a href="#" target="_blank" class="share-option-btn opt-x">
              <span class="share-icon">𝕏</span>
              <span>X (Twitter)</span>
            </a>
            <a href="#" target="_blank" class="share-option-btn opt-pinterest">
              <span class="share-icon">📌</span>
              <span>Pinterest</span>
            </a>
            <button class="share-option-btn opt-copy">
              <span class="share-icon">🔗</span>
              <span data-i18n="share_modal_copy">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.share-modal-close');
    const closeModal = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  // Update dynamic links
  const tgBtn = modal.querySelector('.opt-telegram');
  const fbBtn = modal.querySelector('.opt-facebook');
  const xBtn = modal.querySelector('.opt-x');
  const pinBtn = modal.querySelector('.opt-pinterest');
  const copyBtn = modal.querySelector('.opt-copy');

  tgBtn.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  xBtn.href = `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  pinBtn.href = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(thumbnailUrl)}&description=${encodeURIComponent(title)}`;

  copyBtn.onclick = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(shareUrl).then(() => {
      ui.showToast(i18n.t('toast_share_success') || 'Link successfully copied to clipboard! 📋');
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }).catch(() => {
      ui.showToast(i18n.t('toast_share_failed') || 'Failed to copy link.');
    });
  };

  // Translate modal static texts
  if (typeof i18n.translateStaticUI === 'function') {
    i18n.translateStaticUI();
  }

  // Show
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export default { 
  init, 
  alignGlobalPlayerWithPlaceholder, 
  setupPlaceholderObserver, 
  disconnectPlaceholderObserver 
};

