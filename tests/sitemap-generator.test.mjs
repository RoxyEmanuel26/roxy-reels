import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildSitemapSet,
  buildVideoUrlXml,
  parseDuration,
  promoteSitemapSet,
  validateSitemapSet
} = require('../generate_sitemap.js');

function post(id, overrides = {}) {
  return {
    id,
    code: `ABC-${id}`,
    slug: `abc-${id}-sample-title`,
    title: `ABC-${id} Sample & Video`,
    date: '2026-09-01T00:00:00Z',
    thumbnail: `https://fourhoi.mrstcdn.store/abc-${id}/cover-n.jpg`,
    duration: '01:02:03',
    categories: ['Drama', 'HD'],
    tags: ['viral'],
    actors: ['Example Actor'],
    studio: 'Example Studio',
    embed_url: `https://server.apijav.com/?mvapm_embed=${id}`,
    ...overrides
  };
}

const options = { actors: ['Zeta', 'Alpha', 'Alpha'], categories: ['Drama', 'HD'], studios: ['Studio'] };

test('sitemap generation is byte-for-byte deterministic and valid', () => {
  const first = buildSitemapSet([post(100), post(1000)], options);
  const second = buildSitemapSet([post(1000), post(100)], options);
  assert.deepEqual([...first.files], [...second.files]);
  assert.doesNotThrow(() => validateSitemapSet(first, 2));
  assert.equal(first.summary.eligibleVideos, 2);
});

test('a new ID range changes only its shard and the sitemap index', () => {
  const before = buildSitemapSet([post(100)], options);
  const after = buildSitemapSet([post(100), post(1001, { date: '2026-09-02T00:00:00Z' })], options);
  const names = new Set([...before.files.keys(), ...after.files.keys()]);
  const changed = [...names].filter(name => before.files.get(name) !== after.files.get(name)).sort();
  assert.deepEqual(changed, ['sitemap_index.xml', 'sitemap_videos_1000-1999.xml']);
});

test('promotion removes stale page-based sitemap files only after a valid set exists', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'roxy-sitemap-test-'));
  await writeFile(join(directory, 'sitemap_videos_1.xml'), '<stale/>', 'utf8');
  await writeFile(join(directory, 'notes.txt'), 'keep', 'utf8');
  const result = buildSitemapSet([post(100)], options);
  validateSitemapSet(result, 1);
  const changes = promoteSitemapSet(result.files, directory);
  const names = await readdir(directory);
  assert.equal(changes.removed, 1);
  assert.ok(!names.includes('sitemap_videos_1.xml'));
  assert.ok(names.includes('notes.txt'));
  assert.ok(names.includes('sitemap_videos_0-999.xml'));
});

test('a failed sitemap swap restores the previous complete set', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'roxy-sitemap-swap-test-'));
  const directory = join(parent, 'sitemaps');
  const initial = buildSitemapSet([post(100)], options);
  const updated = buildSitemapSet([post(100), post(1001)], options);
  promoteSitemapSet(initial.files, directory);
  const oldIndex = await readFile(join(directory, 'sitemap_index.xml'), 'utf8');
  const oldShard = await readFile(join(directory, 'sitemap_videos_0-999.xml'), 'utf8');

  const failingFs = Object.create(fs);
  let renameCount = 0;
  failingFs.renameSync = (source, destination) => {
    renameCount += 1;
    if (renameCount === 2) throw new Error('injected staging failure');
    return fs.renameSync(source, destination);
  };

  assert.throws(() => promoteSitemapSet(updated.files, directory, failingFs), /injected staging failure/);
  assert.equal(await readFile(join(directory, 'sitemap_index.xml'), 'utf8'), oldIndex);
  assert.equal(await readFile(join(directory, 'sitemap_videos_0-999.xml'), 'utf8'), oldShard);
  assert.deepEqual(await readdir(parent), ['sitemaps']);
});

test('video XML escapes text and includes all required Google video fields', () => {
  const built = buildVideoUrlXml(post(200, { title: 'A&B <Test> "Quoted"' }));
  assert.equal(built.eligible, true);
  assert.match(built.xml, /A&amp;B &lt;Test&gt; &quot;Quoted&quot;/);
  for (const tag of ['thumbnail_loc', 'title', 'description', 'player_loc', 'family_friendly', 'live']) {
    assert.match(built.xml, new RegExp(`<video:${tag}>`));
  }
  assert.doesNotMatch(built.xml, /<priority>|<changefreq>/);
});

test('records missing required metadata stay as standard URLs without invalid video blocks', () => {
  const built = buildVideoUrlXml(post(300, { thumbnail: '', embed_url: '', iframe_html: '' }));
  assert.equal(built.eligible, false);
  assert.match(built.xml, /<loc>https:\/\/www\.missav-j\.com\/en\/watch\//);
  assert.doesNotMatch(built.xml, /<video:video>/);
});

test('duration parsing accepts Google range and rejects empty or oversized values', () => {
  assert.equal(parseDuration('01:02:03'), 3723);
  assert.equal(parseDuration('00:00:00'), null);
  assert.equal(parseDuration('09:00:00'), null);
  assert.equal(parseDuration(120), 120);
});


test('sitemap_pages.xml emits xhtml:link alternates for all 13 locales and x-default', async () => {
  const mod = await import('../generate_sitemap.js');
  const { buildStaticTaxonomyFiles, SITEMAP_VALID_LANGS } = mod.default || mod;
  const files = buildStaticTaxonomyFiles();
  const pagesXml = files.get('sitemap_pages.xml');
  assert.ok(pagesXml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  assert.match(pagesXml, /<loc>https:\/\/www\.missav-j\.com\/en\/<\/loc>/);
  assert.match(pagesXml, /<xhtml:link rel="alternate" hreflang="fr" href="https:\/\/www\.missav-j\.com\/fr\/" \/>/);
  assert.match(pagesXml, /<xhtml:link rel="alternate" hreflang="tl" href="https:\/\/www\.missav-j\.com\/fil\/" \/>/);
  assert.match(pagesXml, /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/" \/>/);
  for (const lang of SITEMAP_VALID_LANGS) {
    const code = lang === 'fil' ? 'tl' : lang;
    assert.ok(pagesXml.includes(`hreflang="${code}" href="https://www.missav-j.com/${lang}/"`));
  }
});

test('sync-taxonomies enforces >=5 video threshold, spam/hyphen actor filter, and dirty category exclusion', async () => {
  const { isValidActorTerm, isValidCategoryTerm, MIN_INDEXABLE_VIDEOS } = await import('../scripts/sync-taxonomies.mjs');
  assert.equal(MIN_INDEXABLE_VIDEOS, 5);

  assert.equal(isValidActorTerm({ name: '-Karin', count: 1 }), false);
  assert.equal(isValidActorTerm({ name: 'Mayu Nozomi', count: 0 }), false);
  assert.equal(isValidActorTerm({ name: 'Mayu Nozomi', count: 4 }), true);
  assert.equal(4 >= MIN_INDEXABLE_VIDEOS, false);
  assert.equal(isValidActorTerm({ name: 'Mayu Nozomi', count: 5 }), true);
  assert.equal(5 >= MIN_INDEXABLE_VIDEOS, true);
  assert.equal(isValidActorTerm({ name: 'Eimi Fukada (深田えいみ)', count: 20 }), true);
  assert.equal(isValidActorTerm({ name: 'Ai, 23 Years Old', count: 10 }), false);

  assert.equal(isValidCategoryTerm({ name: 'En/tokyohot', count: 1087 }), false);
  assert.equal(isValidCategoryTerm({ name: 'Dm150/en/fc2', count: 21851 }), false);
  assert.equal(isValidCategoryTerm({ name: 'Blonde / Blonde', count: 8 }), false);
  assert.equal(isValidCategoryTerm({ name: 'Thin Cat', count: 4 }), true);
  assert.equal(4 >= MIN_INDEXABLE_VIDEOS, false);
  assert.equal(isValidCategoryTerm({ name: 'Tokyohot', count: 1087 }), true);
  assert.equal(isValidCategoryTerm({ name: 'Blonde', count: 8 }), true);
});

test('sync-worker-seo-data updates Worker sentinel block from JSON sources cleanly', async () => {
  const { syncWorkerSeoData, START_MARKER, END_MARKER } = await import('../scripts/sync-worker-seo-data.mjs');
  const tmpDir = await mkdtemp(join(tmpdir(), 'worker-sync-test-'));
  try {
    await Promise.all([
      mkdir(join(tmpDir, 'api'), { recursive: true }),
      mkdir(join(tmpDir, 'data'), { recursive: true }),
      mkdir(join(tmpDir, 'functions'), { recursive: true }),
      mkdir(join(tmpDir, 'assets', 'js'), { recursive: true })
    ]);
    await Promise.all([
      writeFile(join(tmpDir, 'api', 'actors.json'), JSON.stringify(['Mayu Nozomi']), 'utf8'),
      writeFile(join(tmpDir, 'api', 'categories.json'), JSON.stringify(['Tokyohot']), 'utf8'),
      writeFile(join(tmpDir, 'assets', 'js', 'actors_data.js'), 'export const ALL_ACTORS = [{"name":"Mayu Nozomi","native":"希美まゆ"}];', 'utf8'),
      writeFile(join(tmpDir, 'data', 'seo-enriched-posts.json'), JSON.stringify({
        posts: { '619': { video_id: '619', seo_title: 'Test Title', meta_description: 'Desc', summary: 'Sum', highlights: ['H1'], faq: [], status: 'enriched' } }
      }), 'utf8'),
      writeFile(join(tmpDir, 'functions', '[[catchall]].js'), `// header\n${START_MARKER}\nconst OLD = true;\n${END_MARKER}\n// footer\n`, 'utf8')
    ]);

    const res = syncWorkerSeoData(tmpDir);
    assert.equal(res.changed, true);
    assert.equal(res.actorsCount, 1);
    assert.equal(res.categoriesCount, 1);
    assert.equal(res.enrichedCount, 1);
    const updated = await readFile(join(tmpDir, 'functions', '[[catchall]].js'), 'utf8');
    assert.match(updated, /"mayu nozomi":"希美まゆ"/);
    assert.match(updated, /const CURATED_CATEGORIES_LIST = \["Tokyohot"\];/);
    assert.match(updated, /"619":\{"video_id":"619"/);
    assert.doesNotMatch(updated, /const OLD = true;/);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test('deduplicateExactVideoClones removes exact and -2/-3 clones while preserving editions and preferred IDs', async () => {
  const mod = await import('../generate_sitemap.js');
  const { deduplicateExactVideoClones, formatEditionVideoTitle, buildDescription, buildSitemapSet, validateSitemapSet } = mod.default || mod;

  const input = [
    post(100694, { code: 'JURA-140', slug: 'jura-140-married-woman', title: 'JURA-140 Married Woman' }),
    post(125081, { code: 'JURA-140', slug: 'jura-140-married-woman-3', title: 'JURA-140 Married Woman' }),
    post(125082, {
      code: 'JURA-140-ENGLISH-SUBTITLE',
      slug: 'jura-140-english-subtitle-married-woman',
      title: 'JURA-140 Married Woman',
      categories: ['English Subtitle']
    }),
    post(100773, { code: 'HEYZO-3767', slug: 'heyzo-3767-model', title: 'HEYZO-3767 Model', embed_url: '' }),
    post(115453, { code: 'HEYZO-3767', slug: 'heyzo-3767-model', title: 'HEYZO-3767 Model', embed_url: 'https://embed.example/115453' })
  ];

  // Preferred ID 100694 wins over 125081; higher-quality 115453 (has embed_url) wins over 100773; edition 125082 stays distinct
  const dedup = deduplicateExactVideoClones(input, { preferredIds: new Set(['100694']) });
  assert.equal(dedup.skippedCount, 2);
  assert.deepEqual(dedup.posts.map(p => p.id).sort((a, b) => a - b), [100694, 115453, 125082]);
  assert.equal(dedup.canonicalMap['125081'], 'jura-140-married-woman-100694');
  assert.equal(dedup.canonicalMap['100773'], 'heyzo-3767-model-115453');
  assert.equal(dedup.canonicalMap['125082'], undefined);

  // Edition title & description differentiate without doubling existing markers
  assert.equal(
    formatEditionVideoTitle({ code: 'ATID-581-ENGLISH-SUBTITLE', title: 'ATID-581 Newly Married Teacher' }),
    'ATID-581 Newly Married Teacher (English Subtitle)'
  );
  assert.equal(
    formatEditionVideoTitle({ code: 'ATID-581-ENGLISH-SUBTITLE', title: 'ATID-581 English Subtitle Teacher' }),
    'ATID-581 English Subtitle Teacher'
  );
  const stdDesc = buildDescription(post(100694, { code: 'JURA-140', title: 'JURA-140 Married Woman' }));
  const subDesc = buildDescription(post(125082, { code: 'JURA-140-ENGLISH-SUBTITLE', title: 'JURA-140 Married Woman', categories: ['English Subtitle'] }));
  assert.notEqual(stdDesc, subDesc);
  assert.match(subDesc, /English Subtitle/);

  // Full sitemap set accounts for skipped duplicates cleanly during validation
  const result = buildSitemapSet(input, { preferredIds: new Set(['100694']) });
  assert.equal(result.summary.totalVideos, 3);
  assert.equal(result.summary.duplicateClonesSkipped, 2);
  assert.equal(result.duplicateCanonicals['125081'], 'jura-140-married-woman-100694');
  assert.doesNotThrow(() => validateSitemapSet(result, input.length));
});

test('sync-worker-seo-data emits DUPLICATE_VIDEO_CANONICAL_MAP when api/duplicate-video-canonicals.json exists', async () => {
  const { syncWorkerSeoData, START_MARKER, END_MARKER } = await import('../scripts/sync-worker-seo-data.mjs');
  const tmpDir = await mkdtemp(join(tmpdir(), 'worker-dup-sync-'));
  try {
    await Promise.all([
      mkdir(join(tmpDir, 'api'), { recursive: true }),
      mkdir(join(tmpDir, 'data'), { recursive: true }),
      mkdir(join(tmpDir, 'functions'), { recursive: true }),
      mkdir(join(tmpDir, 'assets', 'js'), { recursive: true })
    ]);
    await Promise.all([
      writeFile(join(tmpDir, 'api', 'actors.json'), '[]', 'utf8'),
      writeFile(join(tmpDir, 'api', 'categories.json'), '[]', 'utf8'),
      writeFile(join(tmpDir, 'api', 'duplicate-video-canonicals.json'), JSON.stringify({ '125081': 'jura-140-foo-100694' }), 'utf8'),
      writeFile(join(tmpDir, 'assets', 'js', 'actors_data.js'), 'export const ALL_ACTORS = [];', 'utf8'),
      writeFile(join(tmpDir, 'data', 'seo-enriched-posts.json'), '{"posts":{}}', 'utf8'),
      writeFile(join(tmpDir, 'functions', '[[catchall]].js'), `${START_MARKER}\n${END_MARKER}\n`, 'utf8')
    ]);
    const res = syncWorkerSeoData(tmpDir);
    assert.equal(res.duplicatesCount, 1);
    const updated = await readFile(join(tmpDir, 'functions', '[[catchall]].js'), 'utf8');
    assert.match(updated, /const DUPLICATE_VIDEO_CANONICAL_MAP = \{"125081":"jura-140-foo-100694"\};/);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});
