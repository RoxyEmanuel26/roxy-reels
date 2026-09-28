import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
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
