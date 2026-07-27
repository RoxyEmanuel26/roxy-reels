/**
 * MISSAV-J — Recent Page
 * Halaman khusus untuk menampilkan video terbaru (orderby=date, order=DESC).
 * Menggunakan sistem feed utama secara modular.
 */

import { init as initFeed } from './feed.js?v=2.8.8';

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

