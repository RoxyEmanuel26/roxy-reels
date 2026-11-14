#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncWorkerSeoData } from './sync-worker-seo-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WP_V2_BASE = 'https://server.apijav.com/wp-json/wp/v2';
const MYVIDEO_BASE = 'https://server.apijav.com/wp-json/myvideo/v1';
export const MIN_INDEXABLE_VIDEOS = 5;

export function decodeHtmlEntities(value) {
  if (!value) return '';
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code >= 32 ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code >= 32 ? String.fromCodePoint(code) : '';
    })
    .replace(/<[^>]*>/g, '')
    .trim();
}

const SPAM_ACTOR_PATTERNS = [
  /[\[\]【】◯!?！？]/,
  /\.\.\./,
  /\byears?\s*old\b/i,
  /\b(?:creampie|orgy|sluts?|bitch|big\s*tits|squirts?|married\s*for|college\s*student|office\s*lady|company\s*(?:employee|president)|flight\s*attendant|beauty\s*(?:salon|clinic|industry|treatments)|dental\s*(?:clinic|hygienist|assistant)|hostess|course|therapist|receptionist|part-?timer|new\s*client|generation\s*z|underground\s*idol|amateur|masochistic|housewife|university\s*student)\b/i,
  /,\s*\d{2}\b/,
  /\(\s*\d{2}\s*\)/,
  /\//,
  /×/
];

const SINGLE_WORD_NON_ACTOR = new Set([
  'amateur', 'anyone', 'army', 'asmr', 'baby', 'ball', 'best', 'blonde', 'blue', 'bond',
  'captain', 'child', 'climb', 'dance', 'device', 'die', 'dolce', 'dragon', 'dream',
  'dreaming', 'drop', 'ear', 'everyone', 'eyes', 'fable', 'fire', 'first love', 'fishing',
  'flower', 'friends', 'further', 'general', 'go', 'gourd', 'guy', 'he', 'here', 'highlights',
  'honest', 'i cant hear it', 'im', 'infinity', 'intoxicated', '99', 'ic'
]);

export function isValidActorTerm(term) {
  const name = decodeHtmlEntities(term?.name || '');
  const count = Number(term?.count || 0);
  if (!name || count < 1) return false;
  if (/^[-_]+|[-_]+$/.test(name)) return false;
  if (/^\d+$/.test(name)) return false;
  if (/^[^\p{L}]+$/u.test(name)) return false;
  if (SINGLE_WORD_NON_ACTOR.has(name.toLowerCase())) return false;
  if (SPAM_ACTOR_PATTERNS.some(rx => rx.test(name))) return false;

  const baseName = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!baseName) return false;
  const words = baseName.split(/\s+/);
  if (words.length >= 5) return false;
  if (baseName.length > 42 || name.length > 68) return false;
  return true;
}

export function isValidCategoryTerm(term) {
  const name = decodeHtmlEntities(term?.name || '');
  const count = Number(term?.count || 0);
  if (!name || count < 1) return false;
  if (name.startsWith('©') || name.startsWith('#')) return false;
  if (/^(?:dm\d+\/|en\/)/i.test(name)) return false;
  if (/^\s*(.+?)\s*\/\s*\1\s*$/i.test(name)) return false;
  if (/^[0-9]+$/.test(name) && name !== '69') return false;
  if (name.length > 60) return false;
  return true;
}

async function fetchPagedWpTerms(endpoint, concurrency = 8) {
  const fetchPage = async (page) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${WP_V2_BASE}/${endpoint}?per_page=100&page=${page}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'MISSAV-J-Sync/1.0' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { data, totalPages: Number(res.headers.get('x-wp-totalpages') || '1') };
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  };

  const first = await fetchPage(1);
  const all = [...first.data];
  const pages = Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => i + 2);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, pages.length) }, async () => {
    while (idx < pages.length) {
      const page = pages[idx++];
      const res = await fetchPage(page);
      all.push(...res.data);
    }
  });
  await Promise.all(workers);
  return all;
}

function loadExistingActorNatives() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'actors_data.js'), 'utf8');
    const jsonText = raw.replace(/^[\s\S]*?export const ALL_ACTORS\s*=\s*/, '').replace(/;\s*$/, '');
    const arr = JSON.parse(jsonText);
    const map = new Map();
    for (const item of arr) {
      if (item?.name && item?.native) map.set(decodeHtmlEntities(item.name).toLowerCase(), item.native);
    }
    return map;
  } catch {
    return new Map();
  }
}

function loadExistingCategoryIcons() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'categories_data.js'), 'utf8');
    const jsonText = raw.replace(/^[\s\S]*?export const ALL_CATEGORIES\s*=\s*/, '').replace(/;\s*$/, '');
    const arr = JSON.parse(jsonText);
    const map = new Map();
    for (const item of arr) {
      if (item?.name) map.set(decodeHtmlEntities(item.name).toLowerCase(), item);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchCategoryUpstreamTotals(catNames, concurrency = 10) {
  const totals = new Map();
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, catNames.length) }, async () => {
    while (idx < catNames.length) {
      const name = catNames[idx++];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(`${MYVIDEO_BASE}/posts?per_page=1&category=${encodeURIComponent(name)}`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'MISSAV-J-Sync/1.0' }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const rawTotal = res.headers.get('x-wp-total');
          totals.set(name.toLowerCase(), rawTotal !== null ? Number(rawTotal) : 0);
          break;
        } catch {
          if (attempt === 2) totals.set(name.toLowerCase(), -1);
          else await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  });
  await Promise.all(workers);
  return totals;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[Sync] Fetching live actors and categories from ${WP_V2_BASE}...`);
  const [rawActors, rawCategories] = await Promise.all([
    fetchPagedWpTerms('actors'),
    fetchPagedWpTerms('categories')
  ]);

  const existingNatives = loadExistingActorNatives();
  const existingCatMap = loadExistingCategoryIcons();

  const seenActorNames = new Map();
  const rejectedActors = [];
  for (const term of rawActors) {
    const cleanName = decodeHtmlEntities(term.name);
    if (!isValidActorTerm({ ...term, name: cleanName })) {
      rejectedActors.push({ name: cleanName, count: term.count });
      continue;
    }
    const key = cleanName.toLowerCase();
    const prev = seenActorNames.get(key);
    if (!prev || Number(term.count) > prev.count) {
      seenActorNames.set(key, {
        name: cleanName,
        native: existingNatives.get(key) || '',
        slug: String(term.slug || '').trim(),
        letter: /^[A-Za-z]/.test(cleanName) ? cleanName.charAt(0).toUpperCase() : '#',
        count: Number(term.count)
      });
    }
  }
  const cleanActors = [...seenActorNames.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const existingCatsRaw = fs.existsSync(path.join(ROOT, 'api', 'categories.json'))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'categories.json'), 'utf8'))
    : [];
  const mergedCuratedMap = new Map();
  for (const name of existingCatsRaw) {
    const decoded = decodeHtmlEntities(name);
    if (decoded) mergedCuratedMap.set(decoded.toLowerCase(), decoded);
  }
  for (const [lower, item] of existingCatMap.entries()) {
    const decoded = decodeHtmlEntities(item?.name || '');
    if (decoded && !mergedCuratedMap.has(lower)) mergedCuratedMap.set(lower, decoded);
  }
  const existingCatsList = [...mergedCuratedMap.values()];

  const liveCatByLower = new Map();
  for (const c of rawCategories) {
    const cleanName = decodeHtmlEntities(c.name);
    const key = cleanName.toLowerCase();
    const prev = liveCatByLower.get(key);
    if (!prev || Number(c.count) > Number(prev.count || 0)) {
      liveCatByLower.set(key, { ...c, cleanName });
    }
  }
  const candidateCats = existingCatsList
    .filter(name => {
      const hit = liveCatByLower.get(name.toLowerCase());
      return hit && Number(hit.count || 0) >= 1 && isValidCategoryTerm({ name, count: hit.count });
    });

  console.log(`[Sync] Verifying ${candidateCats.length} categories against ${MYVIDEO_BASE}...`);
  const myVideoCatTotals = await fetchCategoryUpstreamTotals(candidateCats);
  const deadCuratedCats = existingCatsList.filter(name => {
    const hit = liveCatByLower.get(name.toLowerCase());
    if (!hit || Number(hit.count || 0) < 1 || !isValidCategoryTerm({ name, count: hit.count })) return true;
    const mvCount = myVideoCatTotals.get(name.toLowerCase());
    return mvCount === 0;
  });
  const activeCuratedCats = candidateCats.filter(name => {
    const mvCount = myVideoCatTotals.get(name.toLowerCase());
    const fallbackWpCount = Number(liveCatByLower.get(name.toLowerCase())?.count || 0);
    const effectiveCount = (mvCount !== undefined && mvCount >= 0) ? mvCount : fallbackWpCount;
    return effectiveCount >= 1;
  });

  const indexableActors = cleanActors.filter(a => a.count >= MIN_INDEXABLE_VIDEOS);
  const indexableCuratedCats = [...new Set(activeCuratedCats)]
    .filter(name => {
      const mvCount = myVideoCatTotals.get(name.toLowerCase());
      const fallbackWpCount = Number(liveCatByLower.get(name.toLowerCase())?.count || 0);
      const effectiveCount = (mvCount !== undefined && mvCount >= 0) ? mvCount : fallbackWpCount;
      return effectiveCount >= MIN_INDEXABLE_VIDEOS;
    })
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  console.log(`[Sync] Live actors: ${rawActors.length} -> valid non-spam with >=1 video: ${cleanActors.length} (rejected: ${rejectedActors.length})`);
  console.log(`[Sync] Indexable actors (>=${MIN_INDEXABLE_VIDEOS} videos): ${indexableActors.length} | thin (1-${MIN_INDEXABLE_VIDEOS - 1} videos): ${cleanActors.length - indexableActors.length}`);
  console.log(`[Sync] Curated categories: ${existingCatsList.length} -> active valid: ${activeCuratedCats.length} (rejected/dead: ${deadCuratedCats.length}) | indexable (>=${MIN_INDEXABLE_VIDEOS} videos): ${indexableCuratedCats.length}`);
  if (deadCuratedCats.length > 0) console.log('[Sync] Rejected/dead curated categories:', deadCuratedCats);
  console.log('[Sync] Sample rejected actors (count >= 1):', rejectedActors.filter(x => x.count >= 1).slice(0, 15));

  if (dryRun) return;

  // Sitemap & SSR directory only list indexable actors (>=5 videos); frontend search retains all >=1-video actors.
  const indexableActorNames = indexableActors.map(a => a.name);
  fs.writeFileSync(path.join(ROOT, 'api', 'actors.json'), JSON.stringify(indexableActorNames), 'utf8');
  fs.writeFileSync(
    path.join(ROOT, 'assets', 'js', 'actors_data.js'),
    `/**\n * MISSAV-J — Auto-generated Actors list\n * Contains ${cleanActors.length} verified active actors synced from apijav server.\n */\n\nexport const ALL_ACTORS = ${JSON.stringify(cleanActors, null, 2)};\n`,
    'utf8'
  );

  const uniqueAllActiveCats = [...new Set(activeCuratedCats)].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  fs.writeFileSync(path.join(ROOT, 'api', 'categories.json'), JSON.stringify(indexableCuratedCats), 'utf8');
  const categoryObjects = uniqueAllActiveCats.map(name => {
    const live = liveCatByLower.get(name.toLowerCase());
    const old = existingCatMap.get(name.toLowerCase());
    return {
      name,
      slug: live?.slug || old?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      icon: old?.icon || '📁',
      key: old?.key || `category_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    };
  });
  fs.writeFileSync(
    path.join(ROOT, 'assets', 'js', 'categories_data.js'),
    `/**\n * MISSAV-J — Auto-generated Categories list\n * Contains ${categoryObjects.length} active categories verified against apijav server.\n */\n\nexport const ALL_CATEGORIES = ${JSON.stringify(categoryObjects, null, 2)};\n`,
    'utf8'
  );
  if (fs.existsSync(path.join(ROOT, 'functions', '[[catchall]].js'))) {
    try {
      const workerSync = syncWorkerSeoData(ROOT);
      console.log(`[Sync] Synced Worker SEO data (changed=${workerSync.changed}, actors=${workerSync.actorsCount}, categories=${workerSync.categoriesCount}, enriched=${workerSync.enrichedCount})`);
    } catch (err) {
      console.warn('[Sync] Skipped Worker SEO data sync:', err.message);
    }
  }
  console.log('[Sync] Files updated successfully.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('[Sync Fatal]', err);
    process.exitCode = 1;
  });
}
