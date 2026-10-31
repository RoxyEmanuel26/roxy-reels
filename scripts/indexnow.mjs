/**
 * MISSAV-J — IndexNow Submission Protocol (Bing, Yandex, Seznam, Naver)
 * 
 * Penggunaan:
 *   node scripts/indexnow.mjs
 *   npm run seo:indexnow
 */

import fs from 'node:fs';
import path from 'node:path';

const HOST = 'www.missav-j.com';
const KEY = 'a1be0a661f577bbd2c3eb82350a10d97';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Kumpulkan URL penting untuk di-submit
const criticalUrls = [
  `https://${HOST}/`,
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
  `https://${HOST}/en/studio?name=MOODYZ`,
  `https://${HOST}/en/studio?name=SOD+Create`,
  `https://${HOST}/en/dmca`,
  `https://${HOST}/en/terms`,
  `https://${HOST}/en/privacy`,
  `https://${HOST}/en/2257`
];

// Ambil URL video yang sudah di-enrich jika ada
const DATA_FILE = path.resolve('data/seo-enriched-posts.json');
if (fs.existsSync(DATA_FILE)) {
  try {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const [id, post] of Object.entries(db.posts || {})) {
      if (post.status === 'enriched') {
        const slug = (post.seo_title || `video-${id}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        criticalUrls.push(`https://${HOST}/en/watch/${slug}-${id}`);
      }
    }
  } catch (e) {}
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: criticalUrls
};

console.log(`[IndexNow] Menyiapkan submit ${criticalUrls.length} URLs ke IndexNow API...`);

async function submitIndexNow() {
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

submitIndexNow();
