/**
 * MISSAV-J — Trending Page
 * Halaman khusus untuk menampilkan video terpopuler (orderby=views, order=DESC).
 * Menggunakan sistem feed utama secara modular.
 */

import { init as initFeed } from './feed.js?v=2.7.9';

/**
 * Inisialisasi Halaman Trending
 */
export function init() {
  // Panggil feed utama dengan konfigurasi sort by views terpopuler secara default
  return initFeed({
    orderby: 'views',
    order: 'DESC'
  });
}

