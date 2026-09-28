import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);

async function importSource(relativePath, replacements = []) {
  let source = await readFile(new URL(relativePath, ROOT), 'utf8');
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement);
  }
  const encoded = Buffer.from(`${source}\n// test=${Math.random()}`).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

class MemoryCache {
  constructor() {
    this.entries = new Map();
  }

  async match(request) {
    const response = this.entries.get(request.url);
    return response ? response.clone() : undefined;
  }

  async put(request, response) {
    this.entries.set(request.url, response.clone());
  }
}

function makeContext(overrides = {}) {
  const waits = [];
  return {
    waits,
    waitUntil(promise) {
      waits.push(Promise.resolve(promise));
    },
    ...overrides
  };
}

async function settle(context) {
  await Promise.all(context.waits);
}

test('posts list uses two cold subrequests, zero on normalized cache hit, and deduplicates concurrent misses', async () => {
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('https://db.example/')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([
      { id: 1, code: 'AAA-001', title: 'One' },
      { id: 2, code: 'AAA-002', title: 'Two' }
    ]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-WP-Total': '2', 'X-WP-TotalPages': '1' }
    });
  };

  const { onRequest } = await importSource('functions/api/posts/[[id]].js');
  const env = { SUPABASE_URL: 'https://db.example', SUPABASE_KEY: 'key' };
  const cold = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&page=1'),
    env,
    params: { id: [] }
  });
  const coldResponse = await onRequest(cold);
  await coldResponse.json();
  await settle(cold);
  assert.equal(calls.length, 2);
  assert.equal(coldResponse.headers.get('X-Cache-Status'), 'MISS');

  const hit = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?page=1&lang=en'),
    env,
    params: { id: [] }
  });
  const hitResponse = await onRequest(hit);
  await hitResponse.json();
  assert.equal(calls.length, 2);
  assert.equal(hitResponse.headers.get('X-Cache-Status'), 'HIT');

  calls.length = 0;
  const request = new Request('https://www.missav-j.com/api/posts?lang=en&page=2');
  const first = makeContext({ request, env, params: { id: [] } });
  const second = makeContext({ request: request.clone(), env, params: { id: [] } });
  const [firstResponse, secondResponse] = await Promise.all([onRequest(first), onRequest(second)]);
  await Promise.all([firstResponse.json(), secondResponse.json()]);
  await Promise.all([settle(first), settle(second)]);
  assert.equal(calls.length, 2);

  calls.length = 0;
  const otherStudio = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&studio=Other&page=1&per_page=24'),
    env,
    params: { id: [] }
  });
  const otherStudioResponse = await onRequest(otherStudio);
  await otherStudioResponse.json();
  await settle(otherStudio);
  assert.equal(calls.length, 2);
});

test('related strategy produces one primary query and at most one fallback', async () => {
  const strategy = await importSource('assets/js/related-strategy.js');
  const post = { actors: ['Rina'], code: 'ABC-123', categories: ['Drama'] };
  assert.deepEqual(strategy.getPrimaryRelatedQuery(post), {
    kind: 'actor',
    params: { actor: 'Rina', per_page: 20 }
  });
  assert.deepEqual(strategy.getFallbackRelatedQuery(post, 'actor'), {
    search: 'ABC',
    per_page: 20
  });
  assert.equal(strategy.MIN_RELATED_RESULTS, 12);
});

test('dynamic sitemap is generated once and then served without external fetches', async () => {
  const actors = await readFile(new URL('api/actors.json', ROOT), 'utf8');
  const categories = await readFile(new URL('api/categories.json', ROOT), 'utf8');
  const replacements = [
    [/import ACTORS from '\.\.\/\.\.\/api\/actors\.json';/, `const ACTORS = ${actors};`],
    [/import CATEGORIES from '\.\.\/\.\.\/api\/categories\.json';/, `const CATEGORIES = ${categories};`]
  ];
  const { onRequest } = await importSource('functions/api/sitemap.js', replacements);
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  let fetchCount = 0;
  globalThis.fetch = async input => {
    fetchCount += 1;
    if (String(input).startsWith('https://db.example/')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([
      { id: 10, code: 'ABC-010', title: 'Example', date: '2026-09-28T00:00:00Z' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const request = new Request('https://www.missav-j.com/api/sitemap?file=en-1.xml');
  const first = makeContext({ request, env: { SUPABASE_URL: 'https://db.example', SUPABASE_KEY: 'key' } });
  const firstResponse = await onRequest(first);
  await firstResponse.text();
  await settle(first);
  assert.equal(fetchCount, 2);
  assert.equal(firstResponse.headers.get('X-Cache-Status'), 'MISS');

  const second = makeContext({ request: request.clone(), env: first.env });
  const secondResponse = await onRequest(second);
  await secondResponse.text();
  assert.equal(fetchCount, 2);
  assert.equal(secondResponse.headers.get('X-Cache-Status'), 'HIT');
});

test('social image proxy streams instead of buffering the upstream body', async () => {
  const { onRequest } = await importSource('functions/img/[[path]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  let arrayBufferCalled = false;
  globalThis.fetch = async () => {
    const response = new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' }
    });
    response.arrayBuffer = async () => {
      arrayBufferCalled = true;
      throw new Error('upstream body was buffered');
    };
    return response;
  };
  const encoded = Buffer.from('https://pics.dmm.co.jp/example.jpg')
    .toString('base64url');
  const context = makeContext({
    request: new Request(`https://www.missav-j.com/img/${encoded}.jpg`),
    params: { path: [`${encoded}.jpg`] }
  });
  const response = await onRequest(context);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
  await settle(context);
  assert.equal(arrayBufferCalled, false);
});

test('fast social metadata source avoids starting the fallback and warm page cache avoids all metadata fetches', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  let metadataFetches = 0;
  globalThis.fetch = async input => {
    metadataFetches += 1;
    assert.match(String(input), /server\.apijav\.com/);
    return new Response(JSON.stringify({
      id: 123,
      code: 'ABC-123',
      title: 'Metadata Test',
      thumbnail: 'https://pics.dmm.co.jp/example.jpg',
      description: 'Metadata description',
      actors: ['Rina'],
      categories: ['Drama']
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const env = {
    ASSETS: {
      fetch: async () => new Response(indexHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    }
  };
  const request = new Request('https://www.missav-j.com/en/watch/abc-123-metadata-test-123', {
    headers: { 'User-Agent': 'Twitterbot/1.0' }
  });
  const cold = makeContext({ request, env });
  const coldResponse = await onRequest(cold);
  const html = await coldResponse.text();
  await settle(cold);
  assert.equal(coldResponse.status, 200);
  assert.match(html, /summary_large_image/);
  assert.equal(metadataFetches, 1);

  const warm = makeContext({ request: request.clone(), env });
  const warmResponse = await onRequest(warm);
  await warmResponse.text();
  assert.equal(metadataFetches, 1);
});

test('slow social metadata source starts exactly one fallback', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    calls.push(url);
    if (url.includes('server.apijav.com')) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    return new Response(JSON.stringify({
      id: 124,
      code: 'ABC-124',
      title: 'Hedged Metadata',
      thumbnail: 'https://pics.dmm.co.jp/example.jpg'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/abc-124-hedged-metadata-124', {
      headers: { 'User-Agent': 'Twitterbot/1.0' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  await response.text();
  await settle(context);
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.ok(calls.some(url => url.includes('/api/posts/124')));
});

test('service worker API cache prevents a second Worker request within TTL', async () => {
  const handlers = {};
  globalThis.self = {
    location: { origin: 'https://www.missav-j.com' },
    addEventListener(type, handler) {
      handlers[type] = handler;
    }
  };
  const cache = new MemoryCache();
  globalThis.caches = {
    open: async () => cache,
    match: request => cache.match(request),
    keys: async () => [],
    delete: async () => true
  };
  let networkFetches = 0;
  globalThis.fetch = async () => {
    networkFetches += 1;
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  await importSource('sw.js');

  const runFetch = async () => {
    const waits = [];
    let responsePromise;
    handlers.fetch({
      request: new Request('https://www.missav-j.com/api/posts?actor=Rina&lang=en'),
      respondWith(promise) {
        responsePromise = Promise.resolve(promise);
      },
      waitUntil(promise) {
        waits.push(Promise.resolve(promise));
      }
    });
    const response = await responsePromise;
    await response.text();
    await Promise.all(waits);
    return response;
  };

  await runFetch();
  const cachedResponse = await runFetch();
  assert.equal(networkFetches, 1);
  assert.equal(cachedResponse.headers.get('X-SW-Cache-Status'), 'HIT');
});

test('frontend retries one transient failure but never retries a 4xx response', async () => {
  globalThis.window = { location: { pathname: '/en/' } };
  const { default: api } = await importSource('assets/js/api.js');

  let notFoundCalls = 0;
  globalThis.fetch = async () => {
    notFoundCalls += 1;
    return new Response('not found', { status: 404, statusText: 'Not Found' });
  };
  await assert.rejects(() => api.getPosts({ page: 901 }), /API Error 404/);
  assert.equal(notFoundCalls, 1);

  let transientCalls = 0;
  globalThis.fetch = async () => {
    transientCalls += 1;
    if (transientCalls === 1) {
      return new Response('unavailable', { status: 503, statusText: 'Unavailable' });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  await api.getPosts({ page: 902 });
  assert.equal(transientCalls, 2);
});

test('versioned caches stay synchronized and private routes bypass Functions', async () => {
  const sw = await readFile(new URL('sw.js', ROOT), 'utf8');
  const catchall = await readFile(new URL('functions/[[catchall]].js', ROOT), 'utf8');
  const routes = JSON.parse(await readFile(new URL('_routes.json', ROOT), 'utf8'));
  const assetVersion = sw.match(/CACHE_NAME = 'missavj-cache-v([^']+)'/)?.[1];
  const apiVersion = sw.match(/API_CACHE_NAME = 'missavj-api-cache-v([^']+)'/)?.[1];
  const ssrVersion = catchall.match(/SSR_CACHE_VERSION = 'v([^']+)'/)?.[1];
  assert.ok(assetVersion);
  assert.equal(apiVersion, assetVersion);
  assert.equal(ssrVersion, assetVersion);
  assert.ok(routes.exclude.includes('/history*'));
  assert.ok(routes.exclude.includes('/*/history*'));
  assert.ok(routes.exclude.includes('/watch-later*'));
  assert.ok(routes.exclude.includes('/*/watch-later*'));
});
