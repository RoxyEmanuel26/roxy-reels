/**
 * EnakReels — Player Controller
 * Manages video playback, autoplay via IntersectionObserver, mute state, and progress.
 */
var RoxyPlayer = (() => {
  let _muted = true;
  let _volume = 0.3; // Default 30% volume
  let _activeVideo = null;
  let _observer = null;
  let _progressRAF = null;

  /** Initialize IntersectionObserver for viewport-based autoplay */
  function init() {
    _observer = new IntersectionObserver(_onIntersect, {
      root: document.getElementById('feed-container'),
      threshold: 0.6,
    });
  }

  function _onIntersect(entries) {
    entries.forEach(entry => {
      const card = entry.target;
      const video = card.querySelector('video');
      if (!video) return;
      if (entry.isIntersecting) {
        _playVideo(card, video);
      } else {
        _pauseVideo(card, video);
      }
    });
  }

  function _playVideo(card, video) {
    if (_activeVideo === video && !video.paused) return;
    // Pause previous
    if (_activeVideo && _activeVideo !== video) {
      _activeVideo.pause();
      const prevCard = _activeVideo.closest('.video-card');
      if (prevCard) prevCard.classList.remove('is-playing');
    }
    _activeVideo = video;
    video.muted = _muted;
    video.volume = _volume;
    card.classList.add('is-playing');
    // Hide skeleton/poster once playing
    const skeleton = card.querySelector('.video-skeleton');
    const poster = card.querySelector('.video-poster');
    const playPromise = video.play();
    if (playPromise) {
      playPromise.then(() => {
        if (skeleton) skeleton.classList.add('hidden');
        if (poster) poster.classList.add('hidden');
      }).catch(() => {
        // Autoplay blocked; keep poster visible
      });
    }
    _startProgressTracker(card, video);
  }

  function _pauseVideo(card, video) {
    video.pause();
    card.classList.remove('is-playing');
    _stopProgressTracker();
  }

  /** Track playback progress bar */
  function _startProgressTracker(card, video) {
    _stopProgressTracker();
    const bar = card.querySelector('.video-progress-bar');
    if (!bar) return;
    function tick() {
      if (video.duration && isFinite(video.duration)) {
        bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
      }
      _progressRAF = requestAnimationFrame(tick);
    }
    tick();
  }

  function _stopProgressTracker() {
    if (_progressRAF) {
      cancelAnimationFrame(_progressRAF);
      _progressRAF = null;
    }
  }

  /** Observe a video card element */
  function observe(card) {
    if (_observer) _observer.observe(card);
  }

  /** Unobserve a video card element */
  function unobserve(card) {
    if (_observer) _observer.unobserve(card);
  }

  /** Toggle global mute */
  function toggleMute() {
    _muted = !_muted;
    if (_activeVideo) {
      _activeVideo.muted = _muted;
      if (!_muted && _activeVideo.volume === 0) {
        setVolume(0.3); // give it some volume if it was 0
      }
    }
    RoxyUI.showMuteIndicator(_muted);
    return _muted;
  }

  function setVolume(val) {
    _volume = Math.max(0, Math.min(1, val));
    if (_activeVideo) _activeVideo.volume = _volume;
    if (_volume > 0 && _muted) {
      _muted = false;
      if (_activeVideo) _activeVideo.muted = false;
      RoxyUI.showMuteIndicator(false);
    } else if (_volume === 0 && !_muted) {
      _muted = true;
      if (_activeVideo) _activeVideo.muted = true;
      RoxyUI.showMuteIndicator(true);
    }
  }

  function getVolume() { return _volume; }

  /** Get muted state */
  function isMuted() { return _muted; }

  /** Pause all videos */
  function pauseAll() {
    document.querySelectorAll('.video-card video').forEach(v => v.pause());
    _activeVideo = null;
    _stopProgressTracker();
  }

  /** Cleanup */
  function destroy() {
    pauseAll();
    if (_observer) { _observer.disconnect(); _observer = null; }
    _stopProgressTracker();
  }

  return { init, observe, unobserve, toggleMute, isMuted, pauseAll, destroy, setVolume, getVolume };
})();
