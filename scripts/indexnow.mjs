/**
 * MISSAV-J — IndexNow Submission Protocol (Bing, Yandex, Seznam, Naver)
 * 
 * Penggunaan:
 *   node scripts/indexnow.mjs
 *   npm run seo:indexnow
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'www.missav-j.com';
const KEY = 'a1be0a661f577bbd2c3eb82350a10d97';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const STATIC_CRITICAL_URLS = [
  `https://${HOST}/en/`,
  `https://${HOST}/zh-TW/`,
  `https://${HOST}/ja/`,
  `https://${HOST}/ko/`,
  `https://${HOST}/en/trending`,
  `https://${HOST}/en/recent`,
  `https://${HOST}/en/category?name=Uncensored`,
  `https://${HOST}/en/category?name=Drama`,
  `https://${HOST}/en/category?name=Amateur`,
  `https://${HOST}/en/category?name=Cosplay`,
  `https://${HOST}/en/category?name=Romance`,
  `https://${HOST}/en/studio?name=S1`,
  `https://${HOST}/en/studio?name=Moody's`,
  `https://${HOST}/en/studio?name=SOD`,
  `https://${HOST}/en/dmca`,
  `https://${HOST}/en/terms`,
  `https://${HOST}/en/privacy-policy`,
  `https://${HOST}/en/2257`
];

/**
 * Loads a map of video ID -> canonical <loc> URL from generated video sitemaps
 * so IndexNow never invents non-canonical slugs from enriched SEO titles.
 * @param {string} sitemapDir
 * @returns {Map<string, string>}
 */
export function loadCanonicalWatchUrlsById(sitemapDir = path.resolve('sitemaps')) {
  const byId = new Map();
  if (!fs.existsSync(sitemapDir)) return byId;

  const files = fs.readdirSync(sitemapDir)
    .filter(name => /^sitemap_videos_\d+-\d+\.xml$/.test(name))
    .sort();
  const locRegex = /<loc>(https:\/\/[^<]+-(\d+))<\/loc>/g;

  for (const file of files) {
    const xml = fs.readFileSync(path.join(sitemapDir, file), 'utf8');
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      byId.set(match[2], match[1]);
    }
  }
  return byId;
}

/**
 * Builds the deduplicated list of canonical IndexNow URLs without emitting
 * redirecting root, studio-alias, wrong legal, or fake watch URLs.
 */
export function buildIndexNowUrls({
  sitemapDir = path.resolve('sitemaps'),
  dataFile = path.resolve('data/seo-enriched-posts.json')
} = {}) {
  const urls = [...STATIC_CRITICAL_URLS];
  const seen = new Set(urls);
  if (!fs.existsSync(dataFile)) return urls;

  const canonicalById = loadCanonicalWatchUrlsById(sitemapDir);
  try {
    const db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    for (const [id, post] of Object.entries(db.posts || {})) {
      if (post?.status !== 'enriched') continue;
      const canonicalUrl = canonicalById.get(String(id));
      if (canonicalUrl && !seen.has(canonicalUrl)) {
        seen.add(canonicalUrl);
        urls.push(canonicalUrl);
      }
    }
  } catch (e) {}

  return urls;
}

export async function submitIndexNow(urls = buildIndexNowUrls()) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  console.log(`[IndexNow] Menyiapkan submit ${urls.length} URLs ke IndexNow API...`);

  try {
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[IndexNow] Status Respons: ${response.status} ${response.statusText}`);
    if (response.status === 200 || response.status === 202) {
      console.log('✅ Berhasil di-submit ke IndexNow (Bing & Search Engine partner)!');
    } else {
      const text = await response.text();
      console.log(`[IndexNow Feedback]: ${text}`);
    }
  } catch (err) {
    console.error('❌ Gagal submit ke IndexNow:', err.message);
  }
}

const isCliEntry = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCliEntry) {
  submitIndexNow();
}
