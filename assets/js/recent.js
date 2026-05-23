/**
 * Roxy Reels — Recent Page
 * Halaman khusus untuk menampilkan video terbaru (orderby=date, order=DESC).
 * Menggunakan sistem feed utama secara modular.
 */

import { init as initFeed } from './feed.js';

/**
 * Inisialisasi Halaman Terbaru
 */
export function init() {
  // Panggil feed utama dengan konfigurasi sort by date terbaru secara default
  return initFeed({
    orderby: 'date',
    order: 'DESC'
  });
}
