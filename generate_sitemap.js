const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE_URL = 'https://www.missav-j.com';
const API_BASE_URL = 'https://server.apijav.com/wp-json/myvideo/v1/posts';
const PER_PAGE = 1000;
const CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;
const MAX_SITEMAP_URLS = 50_000;
const VIDEO_BUCKET_SIZE = 1000;

const STATIC_ROUTES = ['', 'trending', 'recent', 'actors', 'categories', 'studios', 'popular-actors'];
const STUDIOS = [
  'S1 NO.1 STYLE', 'MOODYZ', 'PRESTIGE', 'Soft On Demand',
  'Idea Pocket', 'FALENO', 'MUTEKI', 'Fitch',
  'OPPAL', 'Kawaii*', 'KMP', 'Attackers', 'Premium', 'Other'
];

const VIDEO_FILE_PATTERN = /^sitemap_videos_(\d+)-(\d+)\.xml$/;
const SITEMAP_FILE_PATTERN = /^sitemap(?:_[A-Za-z0-9-]+)*\.xml$/;

function escXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDate(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  if (date > new Date().toISOString().slice(0, 10)) return null;
  return date;
}

function parseDuration(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const seconds = Math.floor(value);
    return seconds >= 1 && seconds <= 28_800 ? seconds : null;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^\d+$/.test(value.trim())) return parseDuration(Number(value.trim()));
  const match = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return seconds >= 1 && seconds <= 28_800 ? seconds : null;
}

function labels(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .map(item => {
      if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
      if (item && typeof item === 'object') return String(item.name || item.title || item.label || '').trim();
      return '';
    })
    .filter(Boolean);
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const clean = String(value ?? '').trim();
    const key = clean.toLocaleLowerCase('en-US');
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function buildVideoSlug(post) {
  const code = slugify(post.code);
  let base = slugify(post.slug || post.title) || 'video';
  if (code && base !== code && !base.startsWith(`${code}-`)) base = `${code}-${base}`;
  base = base.slice(0, 100).replace(/-+$/g, '') || 'video';
  return encodeURIComponent(`${base}-${post.id}`);
}

function buildDescription(post) {
  const title = String(post.title || '').trim();
  const code = String(post.code || '').trim();
  const actor = labels(post.actors).slice(0, 3).join(', ');
  const studio = labels(post.studio)[0] || '';
  const codePrefix = code && !title.toLocaleLowerCase('en-US').startsWith(code.toLocaleLowerCase('en-US'))
    ? `${code} `
    : '';
  let extra = '';
  if (actor) extra += ` starring ${actor}`;
  if (studio) extra += ` by ${studio}`;
  return `Watch ${codePrefix}${title}${extra} for free in premium HD streaming quality on MISSAV-J.`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2048);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function buildImageProxyUrl(source) {
  const target = safeHttpsUrl(source);
  if (!target) return null;
  return `${BASE_URL}/img/${Buffer.from(target).toString('base64url')}.jpg`;
}

function buildPlayerUrl(post) {
  const direct = safeHttpsUrl(post.embed_url);
  if (direct) return direct;
  if (typeof post.iframe_html === 'string') {
    const match = post.iframe_html.match(/\bsrc=["']([^"']+)["']/i);
    const iframe = safeHttpsUrl(match?.[1]?.replace(/&amp;|&#038;/g, '&'));
    if (iframe) return iframe;
  }
  return null;
}

function buildVideoTags(post) {
  return uniqueStrings([
    post.code,
    ...labels(post.studio),
    ...labels(post.categories),
    ...labels(post.tags)
  ])
    .map(tag => tag.slice(0, 100))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizePost(post) {
  const id = Number(post?.id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Invalid post ID: ${post?.id}`);
  return {
    id,
    title: String(post.title || '').trim(),
    slug: String(post.slug || '').trim(),
    date: String(post.date || '').trim(),
    thumbnail: String(post.thumbnail || '').trim(),
    duration: post.duration,
    categories: labels(post.categories),
    tags: labels(post.tags),
    actors: labels(post.actors),
    studio: labels(post.studio),
    code: String(post.code || '').trim(),
    embed_url: String(post.embed_url || '').trim(),
    iframe_html: String(post.iframe_html || '')
  };
}

function standardUrlset(entries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const location of entries) {
    xml += `  <url>\n    <loc>${escXml(location)}</loc>\n  </url>\n`;
  }
  return `${xml}</urlset>\n`;
}

function buildVideoUrlXml(post) {
  const location = `${BASE_URL}/en/watch/${buildVideoSlug(post)}`;
  const date = normalizeDate(post.date);
  const thumbnail = buildImageProxyUrl(post.thumbnail);
  const player = buildPlayerUrl(post);
  const title = String(post.title || '').trim();
  const description = title ? buildDescription(post) : '';
  const eligible = Boolean(title && description && thumbnail && player && player !== location);

  let xml = `  <url>\n    <loc>${escXml(location)}</loc>\n`;
  if (date) xml += `    <lastmod>${date}</lastmod>\n`;
  if (eligible) {
    xml += '    <video:video>\n';
    xml += `      <video:thumbnail_loc>${escXml(thumbnail)}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${escXml(title)}</video:title>\n`;
    xml += `      <video:description>${escXml(description)}</video:description>\n`;
    xml += `      <video:player_loc>${escXml(player)}</video:player_loc>\n`;
    const duration = parseDuration(post.duration);
    if (duration) xml += `      <video:duration>${duration}</video:duration>\n`;
    if (date) xml += `      <video:publication_date>${date}</video:publication_date>\n`;
    xml += '      <video:family_friendly>no</video:family_friendly>\n';
    xml += '      <video:live>no</video:live>\n';
    for (const tag of buildVideoTags(post)) {
      xml += `      <video:tag>${escXml(tag)}</video:tag>\n`;
    }
    xml += '    </video:video>\n';
  }
  xml += '  </url>\n';
  return { xml, location, date, eligible, thumbnail, player };
}

function actorFiles(actors) {
  const sorted = uniqueStrings(actors).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  const files = new Map();
  const perFile = 10_000;
  for (let offset = 0; offset < sorted.length; offset += perFile) {
    const number = Math.floor(offset / perFile) + 1;
    const urls = sorted.slice(offset, offset + perFile)
      .map(actor => `${BASE_URL}/en/actor?name=${encodeURIComponent(actor)}`);
    files.set(`sitemap_actors_${number}.xml`, standardUrlset(urls));
  }
  return files;
}

function buildSitemapSet(posts, options = {}) {
  const actors = options.actors || [];
  const categories = options.categories || [];
  const studios = options.studios || STUDIOS;
  const uniquePosts = new Map();
  for (const rawPost of posts) {
    const post = normalizePost(rawPost);
    if (uniquePosts.has(post.id)) throw new Error(`Duplicate post ID from upstream: ${post.id}`);
    uniquePosts.set(post.id, post);
  }

  const files = new Map();
  files.set('sitemap_pages.xml', standardUrlset(STATIC_ROUTES.map(route =>
    `${BASE_URL}/en${route ? `/${route}` : ''}`
  )));
  for (const [name, xml] of actorFiles(actors)) files.set(name, xml);
  files.set('sitemap_categories.xml', standardUrlset(
    uniqueStrings(categories)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
      .map(category => `${BASE_URL}/en/category?name=${encodeURIComponent(category)}`)
  ));
  files.set('sitemap_studios.xml', standardUrlset(
    uniqueStrings(studios)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
      .map(studio => `${BASE_URL}/en/studio?name=${encodeURIComponent(studio)}`)
  ));

  const buckets = new Map();
  for (const post of uniquePosts.values()) {
    const start = Math.floor(post.id / VIDEO_BUCKET_SIZE) * VIDEO_BUCKET_SIZE;
    if (!buckets.has(start)) buckets.set(start, []);
    buckets.get(start).push(post);
  }

  const videoIndex = [];
  let eligibleVideos = 0;
  const missingVideoMetadata = [];
  let latest = null;
  for (const start of [...buckets.keys()].sort((a, b) => b - a)) {
    const end = start + VIDEO_BUCKET_SIZE - 1;
    const fileName = `sitemap_videos_${start}-${end}.xml`;
    const bucketPosts = buckets.get(start).sort((a, b) => b.id - a.id);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
    let newestDate = null;
    for (const post of bucketPosts) {
      const built = buildVideoUrlXml(post);
      xml += built.xml;
      if (built.date && (!newestDate || built.date > newestDate)) newestDate = built.date;
      if (built.eligible) eligibleVideos += 1;
      else missingVideoMetadata.push(post.id);
      if (!latest || post.id > latest.id) {
        latest = {
          id: post.id,
          fileName,
          url: built.location,
          thumbnail: built.thumbnail || '',
          player: built.player || ''
        };
      }
    }
    xml += '</urlset>\n';
    files.set(fileName, xml);
    videoIndex.push({ fileName, newestDate });
  }

  let index = '<?xml version="1.0" encoding="UTF-8"?>\n';
  index += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const staticNames = [...files.keys()].filter(name => !VIDEO_FILE_PATTERN.test(name)).sort((a, b) => {
    const preferred = ['sitemap_pages.xml', 'sitemap_categories.xml', 'sitemap_studios.xml'];
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 100 : ai) - (bi === -1 ? 100 : bi);
    return a.localeCompare(b, 'en', { numeric: true });
  });
  for (const name of staticNames) {
    index += `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${name}</loc>\n  </sitemap>\n`;
  }
  for (const item of videoIndex) {
    index += `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${item.fileName}</loc>\n`;
    if (item.newestDate) index += `    <lastmod>${item.newestDate}</lastmod>\n`;
    index += '  </sitemap>\n';
  }
  index += '</sitemapindex>\n';
  files.set('sitemap_index.xml', index);

  return {
    files,
    summary: {
      totalVideos: uniquePosts.size,
      eligibleVideos,
      standardOnlyVideos: missingVideoMetadata.length,
      missingVideoMetadata,
      videoFiles: videoIndex.length,
      latest
    }
  };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function validateSitemapSet(result, expectedTotal) {
  const { files, summary } = result;
  if (!files.has('sitemap_index.xml')) throw new Error('Missing sitemap_index.xml');
  if (summary.totalVideos !== expectedTotal) {
    throw new Error(`Video count mismatch: expected ${expectedTotal}, generated ${summary.totalVideos}`);
  }
  const index = files.get('sitemap_index.xml');
  const referenced = [...index.matchAll(/<loc>https:\/\/www\.missav-j\.com\/sitemaps\/([^<]+)<\/loc>/g)]
    .map(match => match[1]);
  if (new Set(referenced).size !== referenced.length) throw new Error('Duplicate sitemap reference in index');
  for (const name of referenced) {
    if (!files.has(name)) throw new Error(`Index references missing file: ${name}`);
  }
  const locations = new Set();
  let watchUrls = 0;
  let videoBlocks = 0;
  for (const [name, xml] of files) {
    const bytes = Buffer.byteLength(xml);
    if (bytes > MAX_SITEMAP_BYTES) throw new Error(`${name} exceeds 50 MiB`);
    if (/<(?:changefreq|priority)>/.test(xml)) throw new Error(`${name} contains ignored sitemap tags`);
    if (name === 'sitemap_index.xml') continue;
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    if (locs.length > MAX_SITEMAP_URLS) throw new Error(`${name} exceeds 50,000 URLs`);
    if (VIDEO_FILE_PATTERN.test(name) && locs.length > VIDEO_BUCKET_SIZE) {
      throw new Error(`${name} exceeds ${VIDEO_BUCKET_SIZE} video URLs`);
    }
    for (const location of locs) {
      if (locations.has(location)) throw new Error(`Duplicate sitemap URL: ${location}`);
      locations.add(location);
      if (location.includes('/en/watch/')) watchUrls += 1;
    }
    const blocks = [...xml.matchAll(/<video:video>([\s\S]*?)<\/video:video>/g)].map(match => match[1]);
    for (const block of blocks) {
      for (const required of ['thumbnail_loc', 'title', 'description', 'player_loc']) {
        if (!block.includes(`<video:${required}>`)) throw new Error(`${name} has an incomplete video block`);
      }
      videoBlocks += 1;
    }
  }
  if (watchUrls !== expectedTotal) throw new Error(`Expected ${expectedTotal} watch URLs, found ${watchUrls}`);
  if (videoBlocks !== summary.eligibleVideos) throw new Error('Video enrichment count mismatch');
  if (!summary.latest || !locations.has(escXml(summary.latest.url))) throw new Error('Latest video is missing');
}

function promoteSitemapSet(files, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const desired = new Set(files.keys());
  let written = 0;
  let unchanged = 0;
  for (const [name, content] of files) {
    const target = path.join(outputDir, name);
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === content) {
      unchanged += 1;
      continue;
    }
    fs.writeFileSync(target, content, 'utf8');
    written += 1;
  }
  let removed = 0;
  for (const name of fs.readdirSync(outputDir)) {
    if (SITEMAP_FILE_PATTERN.test(name) && !desired.has(name)) {
      fs.unlinkSync(path.join(outputDir, name));
      removed += 1;
    }
  }
  return { written, unchanged, removed };
}

function parseRetryAfter(value) {
  if (!value) return null;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(page, fetchImpl = fetch) {
  const url = `${API_BASE_URL}?per_page=${PER_PAGE}&page=${page}`;
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MISSAV-J-Sitemap/4.0',
          'X-Client-Site': BASE_URL
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(`Page ${page} returned non-array JSON`);
        return { data, headers: response.headers };
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) throw new Error(`Page ${page} returned HTTP ${response.status}`);
      lastError = new Error(`Page ${page} returned HTTP ${response.status}`);
      if (attempt < MAX_ATTEMPTS) {
        const delay = parseRetryAfter(response.headers.get('Retry-After')) ?? (1000 * (2 ** (attempt - 1)));
        await sleep(Math.min(delay, 30_000));
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await sleep(1000 * (2 ** (attempt - 1)));
    }
  }
  throw new Error(`Failed to fetch page ${page} after ${MAX_ATTEMPTS} attempts: ${lastError?.message || 'unknown error'}`);
}

async function mapConcurrent(items, limit, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function fetchAllPosts(fetchImpl = fetch) {
  console.log(`[API] Fetching page 1 (${PER_PAGE} posts per page)...`);
  const first = await fetchPage(1, fetchImpl);
  const total = Number(first.headers.get('x-wp-total'));
  const totalPages = Number(first.headers.get('x-wp-totalpages')) || Math.ceil(total / PER_PAGE);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(totalPages) || totalPages <= 0) {
    throw new Error('Upstream did not return valid X-WP-Total headers');
  }
  const pages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  let completed = 1;
  const remaining = await mapConcurrent(pages, CONCURRENCY, async page => {
    const result = await fetchPage(page, fetchImpl);
    completed += 1;
    console.log(`[API] ${completed}/${totalPages} pages complete (page ${page})`);
    return result.data;
  });
  const posts = [first.data, ...remaining].flat().map(normalizePost);
  if (posts.length !== total) throw new Error(`Upstream total is ${total}, but ${posts.length} records were received`);
  return { posts, total, totalPages };
}

function loadJson(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${filePath} must contain a JSON array`);
  return parsed;
}

function appendGithubOutputs(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const { summary, files } = result;
  const latest = summary.latest || {};
  const lines = [
    `total_videos=${summary.totalVideos}`,
    `eligible_videos=${summary.eligibleVideos}`,
    `latest_id=${latest.id || ''}`,
    `latest_file=${latest.fileName || ''}`,
    `latest_url=${latest.url || ''}`,
    `latest_thumbnail=${latest.thumbnail || ''}`,
    `latest_player=${latest.player || ''}`,
    `index_sha256=${sha256(files.get('sitemap_index.xml') || '')}`,
    `latest_shard_sha256=${latest.fileName ? sha256(files.get(latest.fileName) || '') : ''}`
  ];
  fs.appendFileSync(outputPath, `${lines.join(os.EOL)}${os.EOL}`, 'utf8');
}

async function main() {
  const root = __dirname;
  const outputDir = path.join(root, 'sitemaps');
  console.log('MISSAV-J deterministic video sitemap generator v4.0');
  console.log(`Source: ${API_BASE_URL}`);
  console.log('Cloudflare Worker requests: 0');

  const actors = loadJson(path.join(root, 'api', 'actors.json'));
  const categories = loadJson(path.join(root, 'api', 'categories.json'));
  const fetched = await fetchAllPosts();
  console.log(`[BUILD] Building ${fetched.total.toLocaleString('en-US')} canonical video URLs...`);
  const result = buildSitemapSet(fetched.posts, { actors, categories, studios: STUDIOS });
  validateSitemapSet(result, fetched.total);
  const changes = promoteSitemapSet(result.files, outputDir);
  appendGithubOutputs(result);

  const publicSummary = {
    totalVideos: result.summary.totalVideos,
    eligibleVideos: result.summary.eligibleVideos,
    standardOnlyVideos: result.summary.standardOnlyVideos,
    videoFiles: result.summary.videoFiles,
    latestId: result.summary.latest?.id || null,
    written: changes.written,
    unchanged: changes.unchanged,
    removed: changes.removed
  };
  console.log(`[SUCCESS] ${JSON.stringify(publicSummary)}`);
  if (result.summary.standardOnlyVideos > 0) {
    console.warn(`[WARN] ${result.summary.standardOnlyVideos} videos lacked required video metadata. IDs: ${result.summary.missingVideoMetadata.slice(0, 20).join(', ')}`);
  }
  return result;
}

module.exports = {
  BASE_URL,
  VIDEO_BUCKET_SIZE,
  actorFiles,
  buildDescription,
  buildImageProxyUrl,
  buildSitemapSet,
  buildVideoSlug,
  buildVideoUrlXml,
  escXml,
  fetchAllPosts,
  fetchPage,
  normalizeDate,
  parseDuration,
  promoteSitemapSet,
  slugify,
  validateSitemapSet
};

if (require.main === module) {
  main().catch(error => {
    console.error(`[FATAL] ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
