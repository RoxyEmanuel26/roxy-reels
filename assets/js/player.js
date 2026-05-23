/**
 * Roxy Reels — Video Player Page (Secured & Optimized)
 * Mengelola pemuatan video embed dengan sandboxing aman (anti-XSS),
 * rendering metadata tersanitasi, panel interaksi, dan rekomendasi video staggered.
 */

import api from './api.js';
import ui from './ui.js';
import { renderVideoCard } from './feed.js';

// State like/dislike lokal in-memory
const likedVideos = new Set();
const dislikedVideos = new Set();

// Premium inline SVG fallback ketika thumbnail gagal dimuat
const SVG_FALLBACK_THUMB = `data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22168%22 height=%2294%22 viewBox=%220 0 168 94%22><rect width=%22168%22 height=%2294%22 fill=%22%23212121%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23717171%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2210%22>NO IMAGE</text></svg>`;

/**
 * Mengekstrak src dari HTML iframe mentah dan membangun iframe baru dengan sandboxing ketat (Mitigasi XSS)
 * @param {string} iframeHtml - String markup iframe asli dari API
 * @returns {string} Markup iframe yang aman dan disanbox
 */
function getSecureIframeMarkup(iframeHtml) {
  if (!iframeHtml) return '<div class="player-loading-shimmer">Pemutar tidak tersedia.</div>';
  
  // Ambil atribut src menggunakan regular expression
  const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) {
    return '<div class="player-loading-shimmer">Format player tidak didukung.</div>';
  }
  
  const safeSrc = ui.escapeHTML(srcMatch[1]);
  
  // Terapkan sandbox restrict:
  // allow-scripts: diperlukan oleh pemutar video eksternal
  // allow-same-origin: agar iframe dapat memuat asetnya sendiri
  // allow-presentation: mendukung cast screen/TV
  // Tanpa allow-top-navigation untuk mencegah pengalihan halaman induk secara paksa!
  return `
    <iframe 
      src="${safeSrc}" 
      sandbox="allow-scripts allow-same-origin allow-presentation allow-forms" 
      allowfullscreen 
      frameborder="0"
      scrolling="no"
      title="Roxy Reels Safe Embed Player"
      style="width: 100%; height: 100%; display: block;"
    ></iframe>
  `;
}

/**
 * Inisialisasi halaman player detail
 * @param {string} id - ID Post / Video dari URL hash query
 */
export async function init(id) {
  if (!id) {
    ui.showError('ID Video tidak valid');
    return;
  }

  const mainApp = document.getElementById('app-content');
  if (!mainApp) return;

  // 1. Tampilkan layout kerangka halaman (YouTube watch style)
  mainApp.innerHTML = `
    <div class="player-page-layout">
      <!-- Kolom Kiri: Player & Info Utama -->
      <div class="player-main-column">
        <!-- Responsive video frame container (16:9) -->
        <div class="player-container-wrapper">
          <div class="player-iframe-container" id="player-container">
            <div class="player-loading-shimmer">
              <div class="spinner"></div>
              <span>Memuat Player Embed...</span>
            </div>
          </div>
        </div>
        
        <!-- Metadata Video -->
        <div class="player-metadata-container">
          <h1 class="player-title" id="player-title">Memuat judul video...</h1>
          
          <div class="player-action-row">
            <div class="player-stats">
              <span id="player-views-count">0 views</span>
              <span class="card-dot">•</span>
              <span id="player-publish-date">Dipublikasikan</span>
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
              <button id="share-btn" class="player-btn">
                <span class="btn-icon">🔗</span>
                <span class="btn-label">Bagikan</span>
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
                <h4>Aktor / Bintang:</h4>
                <div class="meta-chips-list" id="player-actors-list">
                  <span class="chip-loading-placeholder">Memuat aktor...</span>
                </div>
              </div>
              
              <div class="meta-section">
                <h4>Kategori:</h4>
                <div class="meta-chips-list" id="player-categories-list">
                  <span class="chip-loading-placeholder">Memuat kategori...</span>
                </div>
              </div>

              <div class="meta-section">
                <h4>Tags / Label:</h4>
                <div class="meta-chips-list" id="player-tags-list">
                  <span class="chip-loading-placeholder">Memuat tags...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Kolom Kanan: Rekomendasi Video Terkait -->
      <div class="player-sidebar-column">
        <h3>Video Terkait</h3>
        <div class="related-videos-list" id="related-videos-list">
          <!-- Diisi video rekomendasi -->
        </div>
      </div>
    </div>
  `;

  // Tampilkan loading skeleton pada daftar video terkait
  const relatedList = document.getElementById('related-videos-list');
  ui.showSkeletonsInElement(relatedList, 6);

  try {
    // 2. Fetch Detail Post & Player Embed secara paralel
    const [post, player] = await Promise.all([
      api.getPost(id),
      api.getPlayer(id)
    ]);

    // 3. Bangun markup iframe sandboxed yang aman dari eksploitasi scripting
    const playerContainer = document.getElementById('player-container');
    if (playerContainer) {
      playerContainer.innerHTML = getSecureIframeMarkup(player.iframe_html);
    }

    // 4. Update Judul Dokumen + Metadata Detail
    document.title = `${post.title} — Roxy Reels`;
    renderPostMeta(post, id);

    // 5. Muat Video Terkait (Related) berdasarkan Kategori pertama video
    loadRelatedVideos(post);

  } catch (error) {
    console.error('Gagal memuat Halaman Player:', error);
    ui.showError(`Gagal memuat halaman watch: ${error.message}`);
  }
}

/**
 * Merender metadata lengkap video ke elemen DOM (Tersanitasi Penuh)
 * @param {Object} post - Objek data video
 * @param {string|number} id - ID Video saat ini
 */
function renderPostMeta(post, id) {
  const titleEl = document.getElementById('player-title');
  const viewsEl = document.getElementById('player-views-count');
  const dateEl = document.getElementById('player-publish-date');
  const studioWrapper = document.getElementById('player-studio-wrapper');
  const codeEl = document.getElementById('player-code');
  
  const actorsList = document.getElementById('player-actors-list');
  const categoriesList = document.getElementById('player-categories-list');
  const tagsList = document.getElementById('player-tags-list');

  // Sanitasi & render Title & views
  const safeTitle = ui.escapeHTML(post.title);
  if (titleEl) titleEl.textContent = safeTitle;
  
  if (viewsEl) {
    const viewsCount = post.views ? parseInt(post.views, 10) : 0;
    viewsEl.textContent = `${viewsCount.toLocaleString('id-ID')} views`;
  }
  
  if (dateEl && post.date) {
    const pubDate = new Date(post.date);
    dateEl.textContent = pubDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Code & Studio (Aman XSS)
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
        return `<a href="#/${routePrefix}?name=${encodeURIComponent(safeItem)}" class="meta-tag-chip">${safeItem}</a>`;
      })
      .join('');
  };

  renderChips(actorsList, post.actors, 'actor');
  renderChips(categoriesList, post.categories, 'category');
  renderChips(tagsList, post.tags, 'tag');

  // Likes & Dislikes
  setupLikesAndDislikes(post, id);

  // Setup Share Button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        ui.showToast('Tautan berhasil disalin ke clipboard! 📋');
      }).catch(() => {
        ui.showToast('Gagal menyalin tautan.');
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
 * Mengambil rekomendasi video terkait berdasarkan kategori pertama
 */
async function loadRelatedVideos(post) {
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
      relatedList.innerHTML = '<span class="text-faint text-center py-4">Tidak ada video terkait</span>';
      return;
    }

    // Gunakan staggered animation delay untuk kartu rekomendasi samping
    relatedList.innerHTML = filteredPosts
      .map((p, idx) => renderRelatedRowCard(p, idx))
      .join('');
    
    bindRelatedClicks(relatedList);

  } catch (error) {
    console.error('Fetch Related Videos Error:', error);
    relatedList.innerHTML = '<span class="text-faint text-center py-4">Gagal memuat video terkait</span>';
  }
}

/**
 * Merender markup kartu video baris kecil untuk rekomendasi sidebar (Aman XSS & Staggered)
 * @param {Object} post - Objek video
 * @param {number} index - Indeks urutan untuk staggered delay
 * @returns {string} Markup HTML
 */
function renderRelatedRowCard(post, index) {
  const safeId = ui.escapeHTML(post.id);
  const safeTitle = ui.escapeHTML(post.title);
  const safeStudio = ui.escapeHTML(post.studio || 'Unknown');
  const safeThumbnail = ui.escapeHTML(post.thumbnail || '');
  const safeDuration = ui.escapeHTML(post.duration || '');

  const isHD = safeTitle.toLowerCase().includes('hd') || (post.tags && post.tags.some(t => String(t).toLowerCase() === 'hd'));
  const hdBadge = isHD ? `<span class="card-hd">HD</span>` : '';
  const durationBadge = safeDuration ? `<span class="card-duration">${safeDuration}</span>` : '';
  const viewsFormatted = post.views ? parseInt(post.views, 10).toLocaleString('id-ID') : '0';

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
        ${durationBadge}
        ${hdBadge}
      </div>
      <div class="related-info">
        <h4 class="related-title" title="${safeTitle}">${safeTitle}</h4>
        <span class="related-studio">${safeStudio}</span>
        <span class="related-views">${viewsFormatted} views</span>
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
      window.location.hash = `#/watch?id=${postId}`;
    }
  });
}
