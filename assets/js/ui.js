/**
 * EnakReels — UI Module
 * Handles DOM creation, toasts, mute indicator, theme toggle, and component rendering.
 */
var RoxyUI = (() => {
  let _muteTimeout = null;

  // ─── Utility Helpers ────────────────────────
  function formatCount(n) {
    if (!n || isNaN(n)) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  function formatDuration(secs) {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ─── Video Card Builder ─────────────────────
  function createVideoCard(item) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="video-skeleton"><div class="video-skeleton-pulse"></div></div>
      ${item.poster ? `<div class="video-poster" style="background-image:url('${item.poster}')"></div>` : ''}
      <video
        src="${item.videoUrl}"
        playsinline
        muted
        loop
        preload="metadata"
        poster="${item.poster || ''}"
      ></video>
      <div class="video-volume-control">
        <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.3">
      </div>
      <div class="video-progress"><div class="video-progress-bar"></div></div>
      <div class="video-overlay">
        <div class="video-info">
          <div class="video-username" data-user="${item.username}">@${item.username}${item.verified ? ' <span style="color:var(--accent)">✓</span>' : ''}</div>
          <div class="video-caption">${_escapeHtml(item.title)}</div>
          <div class="video-tags">${item.tags.slice(0, 5).map(t => `<span class="video-tag" data-tag="${_escapeHtml(t)}">#${_escapeHtml(t)}</span>`).join('')}</div>
          <div class="video-meta">
            <span class="video-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>${formatCount(item.views)}</span>
            <span class="video-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${formatCount(item.likes)}</span>
            ${item.duration ? `<span class="video-meta-item">${formatDuration(item.duration)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="video-actions">
        <button class="action-btn" data-action="like" title="Like">
          <div class="action-btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <span class="action-btn-label">${formatCount(item.likes)}</span>
        </button>
        <button class="action-btn" data-action="share" title="Share">
          <div class="action-btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
          <span class="action-btn-label">Share</span>
        </button>
        <button class="action-btn" data-action="source" title="Open source">
          <div class="action-btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
          <span class="action-btn-label">Source</span>
        </button>
      </div>`;

    // Event: tap video to toggle mute
    const video = card.querySelector('video');
    video.addEventListener('click', (e) => {
      e.stopPropagation();
      RoxyPlayer.toggleMute();
      
      // Sync slider if unmuted
      const slider = card.querySelector('.volume-slider');
      if (slider) {
        if (!RoxyPlayer.isMuted() && RoxyPlayer.getVolume() === 0) {
          slider.value = 0.3;
        } else if (RoxyPlayer.isMuted()) {
          // Do we want the slider to drop to 0 visually? 
          // Usually, mute is a separate state. We'll let the indicator handle it.
        }
      }
    });

    // Event: Volume Slider
    const volumeSlider = card.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.value = RoxyPlayer.getVolume();
      volumeSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        RoxyPlayer.setVolume(val);
        // Sync other sliders visually
        document.querySelectorAll('.volume-slider').forEach(s => {
          if (s !== e.target) s.value = val;
        });
      });
      volumeSlider.addEventListener('click', e => e.stopPropagation());
    }

    // Event: video loaded data → hide skeleton
    video.addEventListener('loadeddata', () => {
      const skel = card.querySelector('.video-skeleton');
      if (skel) skel.classList.add('hidden');
    });

    // Event: video error → show placeholder
    video.addEventListener('error', () => {
      const skel = card.querySelector('.video-skeleton');
      if (skel) {
        skel.innerHTML = '<div style="color:var(--text-tertiary);font-size:13px;">Failed to load</div>';
        skel.classList.remove('hidden');
      }
    });

    // Event: tag click
    card.querySelectorAll('.video-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = tag.dataset.tag;
        if (t && window.RoxyApp) RoxyApp.searchByTag(t);
      });
    });

    // Event: action buttons
    card.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _handleAction(btn.dataset.action, item, btn);
      });
    });

    return card;
  }

  function _handleAction(action, item, btn) {
    switch (action) {
      case 'like':
        btn.classList.toggle('liked');
        showToast(btn.classList.contains('liked') ? '❤️ Liked' : 'Removed like');
        break;
      case 'share':
        const url = `https://www.redgifs.com/watch/${item.id}`;
        if (navigator.share) {
          navigator.share({ title: item.title || 'EnakReels', url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast('Could not copy'));
        }
        break;
      case 'source':
        window.open(`https://www.redgifs.com/watch/${item.id}`, '_blank');
        break;
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Loading Skeleton Cards ─────────────────
  function createSkeletonCards(count = 3) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'video-card skeleton-card';
      card.innerHTML = '<div class="video-skeleton"><div class="video-skeleton-pulse"></div></div>';
      frag.appendChild(card);
    }
    return frag;
  }

  function removeSkeletonCards() {
    document.querySelectorAll('.skeleton-card').forEach(c => c.remove());
  }

  // ─── Mute Indicator ────────────────────────
  function showMuteIndicator(muted) {
    const el = document.getElementById('mute-indicator');
    const iconOn = document.getElementById('mute-icon-on');
    const iconOff = document.getElementById('mute-icon-off');
    if (!el) return;
    iconOn.style.display = muted ? 'block' : 'none';
    iconOff.style.display = muted ? 'none' : 'block';
    el.style.display = 'block';
    el.classList.remove('show');
    void el.offsetWidth; // force reflow
    el.classList.add('show');
    clearTimeout(_muteTimeout);
    _muteTimeout = setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('show');
    }, 600);
  }

  // ─── Toast ──────────────────────────────────
  function showToast(msg, duration = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  // ─── Show/Hide States ──────────────────────
  function showEmpty(title, message) {
    const el = document.getElementById('empty-state');
    document.getElementById('empty-title').textContent = title || 'No videos found';
    document.getElementById('empty-message').textContent = message || 'Try a different search or explore trending content';
    el.style.display = 'flex';
  }
  function hideEmpty() { document.getElementById('empty-state').style.display = 'none'; }

  function showError(title, message) {
    const el = document.getElementById('error-state');
    document.getElementById('error-title').textContent = title || 'Something went wrong';
    document.getElementById('error-message').textContent = message || 'We couldn\'t load the feed. Please try again.';
    el.style.display = 'flex';
  }
  function hideError() { document.getElementById('error-state').style.display = 'none'; }

  function showLoader() { document.getElementById('feed-loader').style.display = 'block'; }
  function hideLoader() { document.getElementById('feed-loader').style.display = 'none'; }

  function showFeedStatus(text) {
    const el = document.getElementById('feed-status');
    document.getElementById('feed-status-text').textContent = text;
    el.style.display = 'block';
  }
  function hideFeedStatus() { document.getElementById('feed-status').style.display = 'none'; }

  // ─── Theme Toggle ──────────────────────────
  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('roxy-theme', next);
    showToast(next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
  }

  function restoreTheme() {
    const saved = localStorage.getItem('roxy-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }

  // ─── Niche Items Rendering ──────────────────
  function renderNiches(niches) {
    const list = document.getElementById('niche-list');
    list.innerHTML = '';
    if (!niches || niches.length === 0) {
      list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);padding:40px 0;font-size:14px;">No niches found</div>';
      return;
    }
    niches.forEach(n => {
      const nicheId = n.id || n.name || '';
      const nicheName = n.name || n.id || '';
      const item = document.createElement('div');
      item.className = 'niche-item';
      item.dataset.id = nicheId;
      item.innerHTML = `<div class="niche-item-name">${_escapeHtml(nicheName)}</div><div class="niche-item-count">${formatCount(n.gifs || n.subscribers || 0)} videos</div>`;
      item.addEventListener('click', () => {
        if (window.RoxyApp) RoxyApp.loadNiche(nicheId, nicheName);
      });
      list.appendChild(item);
    });
  }

  // ─── Search Suggestions ─────────────────────
  function renderSuggestions(suggestions) {
    const el = document.getElementById('search-suggestions');
    if (!suggestions || suggestions.length === 0) {
      el.classList.remove('visible');
      el.innerHTML = '';
      return;
    }
    el.innerHTML = suggestions.map(s =>
      `<div class="suggestion-item" data-query="${_escapeHtml(s)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <span>${_escapeHtml(s)}</span>
      </div>`
    ).join('');
    el.classList.add('visible');
    el.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.RoxyApp) RoxyApp.executeSearch(item.dataset.query);
      });
    });
  }

  return {
    createVideoCard, createSkeletonCards, removeSkeletonCards,
    showMuteIndicator, showToast,
    showEmpty, hideEmpty, showError, hideError,
    showLoader, hideLoader, showFeedStatus, hideFeedStatus,
    toggleTheme, restoreTheme,
    renderNiches, renderSuggestions,
    formatCount, formatDuration,
  };
})();
