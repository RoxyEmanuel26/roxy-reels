#!/usr/bin/env node
/**
 * Syncs data/seo-enriched-posts.json, api/actors.json, api/categories.json,
 * and native actor names into functions/[[catchall]].js between sentinel markers.
 * Keeps Cloudflare Worker SSR zero-subrequest and single-file test-compatible.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export const START_MARKER = '// <GENERATED_SEO_DATA_START>';
export const END_MARKER = '// <GENERATED_SEO_DATA_END>';

function readJsonArraySafe(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string' && v.trim() !== '') : [];
}

function readJsonObjectSafe(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && /^\d+$/.test(k) && v.trim() !== '') {
        clean[k] = v.trim();
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function loadNativeActorMap(rootDir, curatedActors) {
  const curatedLower = new Set(curatedActors.map(name => name.toLowerCase()));
  const nativeMap = {};
  const actorsDataPath = path.join(rootDir, 'assets', 'js', 'actors_data.js');
  if (!fs.existsSync(actorsDataPath)) return nativeMap;
  try {
    const raw = fs.readFileSync(actorsDataPath, 'utf8');
    const jsonText = raw.replace(/^[\s\S]*?export const ALL_ACTORS\s*=\s*/, '').replace(/;\s*$/, '');
    const arr = JSON.parse(jsonText);
    if (!Array.isArray(arr)) return nativeMap;
    for (const item of arr) {
      if (!item || typeof item.name !== 'string' || typeof item.native !== 'string') continue;
      const name = item.name.trim();
      const nat = item.native.trim();
      if (!name || !nat || !curatedLower.has(name.toLowerCase())) continue;
      nativeMap[name.toLowerCase()] = nat;
    }
  } catch {
    // Optional enrichment metadata
  }
  return nativeMap;
}

function compactEnrichedPosts(rootDir) {
  const enrichedPath = path.join(rootDir, 'data', 'seo-enriched-posts.json');
  const compact = {};
  if (!fs.existsSync(enrichedPath)) return compact;
  const db = JSON.parse(fs.readFileSync(enrichedPath, 'utf8'));
  const entries = Object.values(db?.posts || {})
    .filter(p => p && p.status === 'enriched' && p.video_id)
    .sort((a, b) => Number(a.video_id) - Number(b.video_id));
  for (const item of entries) {
    const id = String(item.video_id);
    compact[id] = {
      video_id: id,
      seo_title: item.seo_title || '',
      meta_description: item.meta_description || '',
      summary: item.summary || '',
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      faq: Array.isArray(item.faq) ? item.faq : [],
      status: 'enriched'
    };
  }
  return compact;
}

export function buildGeneratedWorkerDataBlock(rootDir = DEFAULT_ROOT) {
  const curatedActors = readJsonArraySafe(path.join(rootDir, 'api', 'actors.json'));
  const curatedCategories = readJsonArraySafe(path.join(rootDir, 'api', 'categories.json'));
  const nativeMap = loadNativeActorMap(rootDir, curatedActors);
  const enrichedPosts = compactEnrichedPosts(rootDir);
  const duplicateCanonicals = readJsonObjectSafe(path.join(rootDir, 'api', 'duplicate-video-canonicals.json'));

  return [
    START_MARKER,
    `const SEO_ENRICHED_POSTS_SYNCED = ${JSON.stringify(enrichedPosts)};`,
    `const CURATED_ACTORS_LIST = ${JSON.stringify(curatedActors)};`,
    `const CURATED_ACTORS_SET = new Set(CURATED_ACTORS_LIST.map(a => a.toLowerCase()));`,
    `const CURATED_ACTOR_NATIVE_MAP = ${JSON.stringify(nativeMap)};`,
    `const CURATED_CATEGORIES_LIST = ${JSON.stringify(curatedCategories)};`,
    `const CURATED_CATEGORIES_SET = new Set(CURATED_CATEGORIES_LIST.map(c => c.toLowerCase()));`,
    `const DUPLICATE_VIDEO_CANONICAL_MAP = ${JSON.stringify(duplicateCanonicals)};`,
    END_MARKER
  ].join('\n');
}

export function syncWorkerSeoData(rootDir = DEFAULT_ROOT) {
  const workerPath = path.join(rootDir, 'functions', '[[catchall]].js');
  if (!fs.existsSync(workerPath)) {
    throw new Error(`Worker file not found: ${workerPath}`);
  }
  const source = fs.readFileSync(workerPath, 'utf8');
  const startIdx = source.indexOf(START_MARKER);
  const endIdx = source.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Missing ${START_MARKER} ... ${END_MARKER} markers in functions/[[catchall]].js`);
  }
  const generatedBlock = buildGeneratedWorkerDataBlock(rootDir);
  const updated = `${source.slice(0, startIdx)}${generatedBlock}${source.slice(endIdx + END_MARKER.length)}`;
  const changed = updated !== source;
  if (changed) {
    fs.writeFileSync(workerPath, updated, 'utf8');
  }
  return {
    changed,
    actorsCount: readJsonArraySafe(path.join(rootDir, 'api', 'actors.json')).length,
    categoriesCount: readJsonArraySafe(path.join(rootDir, 'api', 'categories.json')).length,
    enrichedCount: Object.keys(compactEnrichedPosts(rootDir)).length,
    duplicatesCount: Object.keys(readJsonObjectSafe(path.join(rootDir, 'api', 'duplicate-video-canonicals.json'))).length
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = syncWorkerSeoData(DEFAULT_ROOT);
  console.log(`[Worker Sync] Updated=${result.changed} actors=${result.actorsCount} categories=${result.categoriesCount} enriched=${result.enrichedCount} duplicates=${result.duplicatesCount}`);
}
