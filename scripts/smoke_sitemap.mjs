import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const baseUrl = process.env.SITEMAP_BASE_URL || 'https://www.missav-j.com';
const latestFile = process.env.LATEST_FILE;
const latestUrl = process.env.LATEST_URL;
const latestThumbnail = process.env.LATEST_THUMBNAIL;
const latestPlayer = process.env.LATEST_PLAYER;
const attempts = Number(process.env.SMOKE_ATTEMPTS || 20);
const delayMs = Number(process.env.SMOKE_DELAY_MS || 30_000);
const googlebot = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

if (!latestFile || !latestUrl || !latestThumbnail || !latestPlayer) {
  throw new Error('LATEST_FILE, LATEST_URL, LATEST_THUMBNAIL, and LATEST_PLAYER are required');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function get(url, timeoutMs = 30_000) {
  const response = await fetch(url, {
    headers: { 'User-Agent': googlebot, 'Accept': '*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs)
  });
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

async function waitForDeployment() {
  const expectedIndex = sha256(await readFile('sitemaps/sitemap_index.xml'));
  const expectedShard = sha256(await readFile(`sitemaps/${latestFile}`));
  const indexUrl = `${baseUrl}/sitemaps/sitemap_index.xml`;
  const shardUrl = `${baseUrl}/sitemaps/${latestFile}`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const [index, shard] = await Promise.all([get(indexUrl), get(shardUrl)]);
      if (index.response.ok && shard.response.ok && sha256(index.body) === expectedIndex && sha256(shard.body) === expectedShard) {
        console.log(`[DEPLOY] Production matches generated sitemap on attempt ${attempt}`);
        return;
      }
      console.log(`[DEPLOY] Attempt ${attempt}/${attempts}: waiting for Cloudflare Pages`);
    } catch (error) {
      console.log(`[DEPLOY] Attempt ${attempt}/${attempts}: ${error.message}`);
    }
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Cloudflare Pages did not serve the generated sitemap before timeout');
}

async function assertPublicResource(url, expectedType) {
  const { response, body } = await get(url);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (expectedType && !type.toLowerCase().includes(expectedType)) {
    throw new Error(`${url} returned unexpected Content-Type ${type}`);
  }
  return body.toString('utf8');
}

await waitForDeployment();
const robots = await assertPublicResource(`${baseUrl}/robots.txt`, 'text/plain');
if (!robots.includes(`${baseUrl}/sitemaps/sitemap_index.xml`)) throw new Error('robots.txt lacks the sitemap index');
const alias = await assertPublicResource(`${baseUrl}/sitemap.xml`, 'xml');
if (!alias.includes('<sitemapindex')) throw new Error('/sitemap.xml is not a sitemap index');
await assertPublicResource(`${baseUrl}/sitemaps/${latestFile}`, 'xml');
const watchHtml = await assertPublicResource(latestUrl, 'text/html');
if (!/rel=["']canonical["']/i.test(watchHtml)) throw new Error('Watch page lacks canonical metadata');
if (!/hreflang=["']en["']/i.test(watchHtml)) throw new Error('Watch page lacks hreflang metadata');
if (!/["']@type["']\s*:\s*["']VideoObject["']/i.test(watchHtml)) throw new Error('Watch page lacks VideoObject JSON-LD');
await assertPublicResource(latestThumbnail, 'image/');
await assertPublicResource(latestPlayer, 'text/html');
console.log('PRODUCTION SITEMAP SMOKE PASSED');
