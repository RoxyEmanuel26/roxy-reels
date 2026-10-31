/**
 * MISSAV-J — SEO Indexing & Content Quality Status Report
 * Menghasilkan ringkasan komprehensif status indexing dan kualitas halaman:
 * 1. Jumlah video dengan status Enriched (Indexable) vs Pending/Thin (Noindex/Draft)
 * 2. Cakupan Hub Content Authority (Kategori & Studio)
 * 3. Ringkasan Sitemap XML
 * 
 * Penggunaan:
 *   node scripts/seo-status-report.mjs
 *   npm run seo:report
 */

import fs from 'node:fs';
import path from 'node:path';
import { HUB_DESCRIPTIONS } from '../assets/js/hub-content.js';

const DATA_FILE = path.resolve('data/seo-enriched-posts.json');
const SITEMAP_PAGES = path.resolve('sitemaps/sitemap_pages.xml');

export function generateReportData() {
  let db = { _meta: {}, posts: {} };
  if (fs.existsSync(DATA_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.warn('Could not read DB:', e.message);
    }
  }

  const postsList = Object.values(db.posts || {});
  const enriched = postsList.filter(p => p.status === 'enriched');
  const pending = postsList.filter(p => p.status === 'pending');
  const failed = postsList.filter(p => p.status === 'failed');
  const rejected = postsList.filter(p => p.status === 'rejected');

  const hubCategories = Object.keys(HUB_DESCRIPTIONS).length;

  let sitemapPagesCount = 0;
  if (fs.existsSync(SITEMAP_PAGES)) {
    const sitemapContent = fs.readFileSync(SITEMAP_PAGES, 'utf8');
    const matches = sitemapContent.match(/<loc>/g);
    sitemapPagesCount = matches ? matches.length : 0;
  }

  return {
    totalTrackedVideos: postsList.length,
    enrichedCount: enriched.length,
    pendingCount: pending.length,
    failedCount: failed.length,
    rejectedCount: rejected.length,
    hubEditorialGuidesCount: hubCategories,
    staticSitemapUrlsCount: sitemapPagesCount,
    lastUpdated: db._meta?.last_updated || 'N/A'
  };
}

export function printCliReport() {
  const data = generateReportData();
  const enrichPercent = data.totalTrackedVideos > 0
    ? ((data.enrichedCount / data.totalTrackedVideos) * 100).toFixed(1)
    : '0.0';

  console.log('\n============================================================');
  console.log('       MISSAV-J SEO QUALITY & INDEXING REPORT (FASE 5)       ');
  console.log('============================================================');
  console.log(` Terakhir Diperbarui : ${data.lastUpdated}`);
  console.log('------------------------------------------------------------');
  console.log(' 📊 STATUS PENGAYAAN KONTEN VIDEO (GEMINI PIPELINE)');
  console.log(`  • Total Video Terdata     : ${data.totalTrackedVideos}`);
  console.log(`  • Status 'Enriched' (Indexable) : ${data.enrichedCount} (${enrichPercent}%)`);
  console.log(`  • Status 'Pending'               : ${data.pendingCount}`);
  console.log(`  • Status 'Failed / Rejected'     : ${data.failedCount + data.rejectedCount}`);
  console.log('------------------------------------------------------------');
  console.log(' 🏛️ CAKUPAN HALAMAN HUB & E-E-A-T');
  console.log(`  • Editorial Hub Guides Aktif    : ${data.hubEditorialGuidesCount} panduan mendalam`);
  console.log(`  • Static Indexable Routes        : ${data.staticSitemapUrlsCount} URLs di sitemap_pages.xml`);
  console.log('------------------------------------------------------------');
  console.log(' 🚦 REKOMENDASI GERBANG INDEXING');
  if (data.enrichedCount > 0) {
    console.log('  ✅ Video enriched siap bersaing dengan metadata eksklusif, ringkasan AI, dan FAQ schema.');
  } else {
    console.log('  ⚠️ Belum ada video enriched. Jalankan: npm run seo:enrich');
  }
  console.log('============================================================\n');
}

if (process.argv[1] && process.argv[1].endsWith('seo-status-report.mjs')) {
  printCliReport();
}
