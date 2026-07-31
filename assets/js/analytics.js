/**
 * MISSAV-J — GA4 Analytics Module
 * SPA-aware event tracking for Google Analytics 4
 * 
 * Usage:
 *   import { Analytics } from './analytics.js';
 *   Analytics.init('G-XXXXXXXXXX');
 *   Analytics.trackPageView('/trending', 'Trending Videos');
 *   Analytics.trackEvent('video_play', { video_id: '123', video_title: 'Title' });
 */

const GA4_MEASUREMENT_ID = 'G-GEFLKZ0TNX';

class AnalyticsManager {
  constructor() {
    this._initialized = false;
    this._queue = [];
  }

  /**
   * Initialize GA4 tracking. Call once on app startup.
   * @param {string} measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
   */
  init(measurementId) {
    const id = measurementId || GA4_MEASUREMENT_ID;
    if (!id) {
      console.warn('[Analytics] GA4 Measurement ID not configured.');
      return;
    }

    // Set up dataLayer immediately to buffer commands
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };

    // Load gtag.js lazily to prevent blocking the main thread
    const loadGtag = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadGtag, { timeout: 2000 });
    } else {
      setTimeout(loadGtag, 1000);
    }
    
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false, // Manual page_view for SPA
      cookie_flags: 'SameSite=None;Secure',
      anonymize_ip: true
    });

    this._initialized = true;

    // Flush queued events
    this._queue.forEach(([method, ...args]) => this[method](...args));
    this._queue = [];

    console.log('[Analytics] GA4 initialized:', id);
  }

  /**
   * Track a page view (SPA navigation)
   */
  trackPageView(pagePath, pageTitle, language) {
    if (!this._initialized) {
      this._queue.push(['trackPageView', pagePath, pageTitle, language]);
      return;
    }
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
      language: language || document.documentElement.lang || 'en'
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, params = {}) {
    if (!this._initialized) {
      this._queue.push(['trackEvent', eventName, params]);
      return;
    }
    window.gtag('event', eventName, params);
  }

  // === Predefined Event Helpers ===

  /** Track video play */
  trackVideoPlay(videoId, videoCode, videoTitle, videoDuration) {
    this.trackEvent('video_play', {
      video_id: videoId,
      video_code: videoCode,
      video_title: videoTitle,
      video_duration: videoDuration
    });
  }

  /** Track video card click in feed */
  trackVideoCardClick(videoId, videoTitle, positionIndex) {
    this.trackEvent('video_card_click', {
      video_id: videoId,
      video_title: videoTitle,
      position_index: positionIndex
    });
  }

  /** Track actor chip click */
  trackActorClick(actorName, sourcePage) {
    this.trackEvent('video_actor_click', {
      actor_name: actorName,
      source_page: sourcePage
    });
  }

  /** Track category chip click */
  trackCategoryClick(categoryName, sourcePage) {
    this.trackEvent('video_category_click', {
      category_name: categoryName,
      source_page: sourcePage
    });
  }

  /** Track studio chip click */
  trackStudioClick(studioName, sourcePage) {
    this.trackEvent('video_studio_click', {
      studio_name: studioName,
      source_page: sourcePage
    });
  }

  /** Track search */
  trackSearch(searchTerm, resultsCount) {
    this.trackEvent('search_performed', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /** Track Watch Later add */
  trackWatchLaterAdd(videoId, videoTitle) {
    this.trackEvent('watch_later_add', {
      video_id: videoId,
      video_title: videoTitle
    });
  }

  /** Track share click */
  trackShare(videoId, shareMethod) {
    this.trackEvent('share_click', {
      video_id: videoId,
      share_method: shareMethod
    });
  }

  /** Track language change */
  trackLanguageChange(fromLang, toLang) {
    this.trackEvent('language_change', {
      from_lang: fromLang,
      to_lang: toLang
    });
  }
}

// Singleton export
export const Analytics = new AnalyticsManager();
