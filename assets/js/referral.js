/**
 * MISSAV-J Simple Referral & UTM Tracking System
 * Tracks ?ref= or ?utm_source= parameters and stores them in localStorage
 */

const ReferralSystem = {
  REF_KEY: 'missav_j_referrer',
  
  init() {
    this.captureReferral();
    this.injectReferralToLinks();
  },

  /**
   * Captures the referral parameter from the URL and stores it.
   */
  captureReferral() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('utm_source');
    
    if (ref) {
      // Store in localStorage for 30 days
      const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
      const data = {
        source: ref,
        expiry: expiry
      };
      localStorage.setItem(this.REF_KEY, JSON.stringify(data));
      
      // Fire GA4 Event if available
      if (typeof gtag === 'function') {
        gtag('event', 'referral_visit', {
          'referral_source': ref
        });
      }
      
      // Clean up tracking params ONLY while preserving functional query params (?name=, ?q=, ?page=)
      if (window.history.replaceState) {
        try {
          const cleanUrl = new URL(window.location.href);
          ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
            .forEach(p => cleanUrl.searchParams.delete(p));
          const remainingSearch = cleanUrl.searchParams.toString();
          const newRelativeUrl = cleanUrl.pathname + (remainingSearch ? `?${remainingSearch}` : '') + cleanUrl.hash;
          window.history.replaceState({ path: newRelativeUrl }, '', newRelativeUrl);
        } catch (e) {}
      }
    }
  },

  /**
   * Gets the active referral code if it exists and hasn't expired.
   */
  getReferral() {
    try {
      const dataStr = localStorage.getItem(this.REF_KEY);
      if (!dataStr) return null;
      
      const data = JSON.parse(dataStr);
      if (new Date().getTime() > data.expiry) {
        localStorage.removeItem(this.REF_KEY);
        return null;
      }
      return data.source;
    } catch (e) {
      return null;
    }
  },

  /**
   * Generates a sharing link with the user's implicit referral ID (or generic social).
   */
  generateShareLink(url, platform = 'general') {
    const base = url || window.location.href;
    const urlObj = new URL(base, window.location.origin);
    urlObj.searchParams.set('ref', `share_${platform}`);
    return urlObj.toString();
  },

  /**
   * Injects the ?ref= parameter into external community links.
   */
  injectReferralToLinks() {
    const refSource = this.getReferral() || 'direct';
    
    // Only append ?start=ref_X on Telegram bot links, leaving public channel URLs clean
    const tgLinks = document.querySelectorAll('a[href^="https://t.me/"]');
    tgLinks.forEach(link => {
      try {
        const url = new URL(link.href);
        const tgPath = url.pathname.replace(/^\/+/, '');
        if (!tgPath || tgPath.includes('/') || !/bot$/i.test(tgPath)) return;
        if (!url.searchParams.has('start')) {
          url.searchParams.set('start', `ref_${refSource}`);
          link.href = url.toString();
        }
      } catch (e) {}
    });
  }
};

export default ReferralSystem;
