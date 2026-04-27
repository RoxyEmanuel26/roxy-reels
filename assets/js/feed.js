/**
 * EnakReels — Feed Controller
 * Manages feed state, infinite loading, and feed mode switching.
 */
var RoxyFeed = (() => {
  const BATCH = 20;
  let _container = null;
  let _mode = 'trending'; // 'trending' | 'search' | 'niche'
  let _query = '';
  let _nicheId = '';
  let _nicheName = '';
  let _page = 1;
  let _totalPages = 1;
  let _loading = false;
  let _hasMore = true;
  let _scrollObserver = null;
  let _sentinel = null;

  function init() {
    _container = document.getElementById('feed-container');
    _setupInfiniteScroll();
  }

  /** Setup sentinel-based infinite scroll */
  function _setupInfiniteScroll() {
    _sentinel = document.createElement('div');
    _sentinel.className = 'feed-sentinel';
    _sentinel.style.cssText = 'height:1px;width:100%;';
    _container.appendChild(_sentinel);

    _scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !_loading && _hasMore) {
        loadMore();
      }
    }, { root: _container, rootMargin: '800px' });
    _scrollObserver.observe(_sentinel);
  }

  /** Clear the feed */
  function clear() {
    RoxyPlayer.pauseAll();
    // Unobserve all current cards
    _container.querySelectorAll('.video-card').forEach(c => RoxyPlayer.unobserve(c));
    _container.innerHTML = '';
    // Re-add sentinel
    _container.appendChild(_sentinel);
    _page = 1;
    _totalPages = 1;
    _hasMore = true;
    RoxyUI.hideEmpty();
    RoxyUI.hideError();
  }

  /** Load initial feed based on current mode */
  async function load(mode, opts = {}) {
    _mode = mode;
    _query = opts.query || '';
    _nicheId = opts.nicheId || '';
    _nicheName = opts.nicheName || opts.nicheId || '';
    _page = 1;
    _hasMore = true;

    clear();
    // Add skeleton placeholders
    _container.insertBefore(RoxyUI.createSkeletonCards(3), _sentinel);
    _container.scrollTop = 0;

    try {
      const result = await _fetch();
      RoxyUI.removeSkeletonCards();

      if (!result.items || result.items.length === 0) {
        RoxyUI.showEmpty('No videos found', _mode === 'search' ? `No results for "${_query}"` : 'Try a different category');
        _hasMore = false;
        return;
      }

      _totalPages = result.pages || 1;
      _hasMore = _page < _totalPages;
      _appendItems(result.items);
      _updateFeedStatus();
    } catch (err) {
      RoxyUI.removeSkeletonCards();
      if (err.name === 'AbortError') return;
      console.error('Feed load error:', err);
      RoxyUI.showError('Failed to load feed', err.message || 'Please check your connection and try again.');
    }
  }

  /** Load more items (next page) */
  async function loadMore() {
    if (_loading || !_hasMore) return;
    _loading = true;
    _page++;
    RoxyUI.showLoader();

    try {
      const result = await _fetch();
      RoxyUI.hideLoader();

      if (!result.items || result.items.length === 0) {
        _hasMore = false;
        _loading = false;
        return;
      }

      _totalPages = result.pages || _totalPages;
      _hasMore = _page < _totalPages;
      _appendItems(result.items);
    } catch (err) {
      RoxyUI.hideLoader();
      if (err.name === 'AbortError') { _loading = false; return; }
      console.error('Load more error:', err);
      _page--; // Revert page
      RoxyUI.showToast('Failed to load more. Tap to retry.');
    }
    _loading = false;
  }

  /** Fetch based on current mode */
  async function _fetch() {
    switch (_mode) {
      case 'search':
        return RoxyAPI.search(_query, _page, BATCH);
      case 'niche':
        return RoxyAPI.getNicheGifs(_nicheId, _page, BATCH);
      case 'trending':
      default:
        return RoxyAPI.getTrending(_page, BATCH);
    }
  }

  /** Append video cards to feed */
  function _appendItems(items) {
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      if (!item.videoUrl) return;
      // Deduplicate
      if (_container.querySelector(`[data-id="${item.id}"]`)) return;
      const card = RoxyUI.createVideoCard(item);
      frag.appendChild(card);
    });
    _container.insertBefore(frag, _sentinel);
    // Observe new cards for autoplay
    _container.querySelectorAll('.video-card:not(.observed)').forEach(card => {
      card.classList.add('observed');
      RoxyPlayer.observe(card);
    });
  }

  function _updateFeedStatus() {
    if (_mode === 'search' && _query) {
      RoxyUI.showFeedStatus(`Results for "${_query}"`);
    } else if (_mode === 'niche' && _nicheId) {
      RoxyUI.showFeedStatus(`Niche: ${_nicheName}`);
    } else {
      RoxyUI.hideFeedStatus();
    }
  }

  /** Get current mode */
  function getMode() { return _mode; }

  return { init, load, loadMore, clear, getMode };
})();
