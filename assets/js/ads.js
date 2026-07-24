/**
 * MISSAV-J — Modular Ads System
 * Mengelola konfigurasi Adsterra Popunder dan Social Bar.
 * [UPDATE 2.8.0] Semua kode Banner Statis telah dicabut secara permanen untuk fokus
 * pada kecepatan web, skor UX, dan maksimalisasi CPM via Popunder & Social Bar native.
 */

import ui from './ui.js?v=2.8.0';

window.missavJAdConfig = {
  popunderEnabled: true, 
  socialBarEnabled: true
};

export function clearAdsterraSession() {
  // Hanya menghapus session cache lokal kita sendiri jika ada
  try {
    const ownKeys = ['missavj_ad_page_loaded', 'missavj_popunder_fired', 'missavj_ad_session'];
    ownKeys.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.warn('[Ads] Error clearing ad session:', e);
  }
}

// Stub function fallbacks in case anything still calls them during transition
export const adjustScaledBanners = () => {};
export const loadExoClickBanner = () => {};
export const loadAdsterraBanner = () => {};
export const loadAdBanner = () => {};
export const loadNativeBannerAd = () => {};
export const loadWatchPageAds = () => {};
export const loadGlobalTopAd = () => {};
export const loadStickyBottomAd = () => {};
export const initAdsterraPopunder = () => {};
export const initAdsterraSocialBar = () => {};

window.missavJAds = {
  loadAdBanner,
  loadNativeBannerAd,
  loadExoClickBanner,
  loadAdsterraBanner,
  loadWatchPageAds,
  loadGlobalTopAd,
  loadStickyBottomAd,
  initAdsterraPopunder,
  initAdsterraSocialBar,
  clearAdsterraSession,
  adjustScaledBanners
};
