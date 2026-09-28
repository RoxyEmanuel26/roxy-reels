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

test('English posts use one cold upstream, zero on cache hit, and deduplicate concurrent misses', async () => {
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
  assert.equal(calls.length, 1);
  assert.equal(coldResponse.headers.get('X-Cache-Status'), 'MISS');

  const hit = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?page=1&lang=en'),
    env,
    params: { id: [] }
  });
  const hitResponse = await onRequest(hit);
  await hitResponse.json();
  assert.equal(calls.length, 1);
  assert.equal(hitResponse.headers.get('X-Cache-Status'), 'HIT');

  calls.length = 0;
  const request = new Request('https://www.missav-j.com/api/posts?lang=en&page=2');
  const first = makeContext({ request, env, params: { id: [] } });
  const second = makeContext({ request: request.clone(), env, params: { id: [] } });
  const [firstResponse, secondResponse] = await Promise.all([onRequest(first), onRequest(second)]);
  await Promise.all([firstResponse.json(), secondResponse.json()]);
  await Promise.all([settle(first), settle(second)]);
  assert.equal(calls.length, 1);

  calls.length = 0;
  const otherStudio = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&studio=Other&page=1&per_page=24'),
    env,
    params: { id: [] }
  });
  const otherStudioResponse = await onRequest(otherStudio);
  await otherStudioResponse.json();
  await settle(otherStudio);
  assert.equal(calls.length, 1);

  calls.length = 0;
  const localized = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=id&page=3'),
    env,
    params: { id: [] }
  });
  const localizedResponse = await onRequest(localized);
  await localizedResponse.json();
  await settle(localized);
  assert.equal(calls.length, 2);
  assert.ok(calls.some(url => url.startsWith('https://db.example/')));

  calls.length = 0;
  const invalid = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&cacheBust=1'),
    env,
    params: { id: [] }
  });
  const invalidResponse = await onRequest(invalid);
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidResponse.headers.get('X-Cache-Status'), 'BYPASS');
  assert.equal(calls.length, 0);
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

test('English detail bypasses Supabase and still returns every localized slug key', async () => {
  const { onRequest } = await importSource('functions/api/posts/[[id]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const calls = [];
  globalThis.fetch = async input => {
    calls.push(String(input));
    return new Response(JSON.stringify({ id: 77, code: 'ABC-077', title: 'English title' }), { status: 200 });
  };
  const context = makeContext({
    request: new Request('https://www.missav-j.com/api/posts/77?lang=en'),
    env: { SUPABASE_URL: 'https://db.example', SUPABASE_KEY: 'key' },
    params: { id: ['77'] }
  });
  const response = await onRequest(context);
  const post = await response.json();
  await settle(context);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('/posts/77'));
  assert.deepEqual(Object.keys(post.localized_slugs).sort(), ['de', 'en', 'fil', 'fr', 'id', 'ja', 'ko', 'ms', 'pt', 'th', 'vi', 'zh-CN', 'zh-TW'].sort());
});

test('sitemap routes are static and legacy API redirects without a runtime generator', async () => {
  const routes = JSON.parse(await readFile(new URL('_routes.json', ROOT), 'utf8'));
  const redirects = await readFile(new URL('_redirects', ROOT), 'utf8');
  assert.ok(routes.exclude.includes('/api/sitemap*'));
  assert.ok(routes.exclude.includes('/sitemap.xml'));
  assert.match(redirects, /^\/api\/sitemap \/sitemaps\/sitemap_index\.xml 301$/m);
  assert.match(redirects, /^\/sitemap\.xml \/sitemaps\/sitemap_index\.xml 200$/m);
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

test('legacy image endpoint redirects to the stable image path without fetching upstream', async () => {
  const { onRequest } = await importSource('functions/api/image.js');
  let fetchCount = 0;
  globalThis.fetch = async () => { fetchCount += 1; throw new Error('must not fetch'); };
  const source = 'https://pics.dmm.co.jp/example.jpg';
  const response = await onRequest({
    request: new Request(`https://www.missav-j.com/api/image?url=${encodeURIComponent(source)}`)
  });
  assert.equal(response.status, 301);
  assert.match(response.headers.get('Location'), /^https:\/\/www\.missav-j\.com\/img\/[A-Za-z0-9_-]+\.jpg$/);
  assert.equal(response.headers.get('X-Edge-Mode'), 'IMAGE-REDIRECT');
  assert.equal(fetchCount, 0);
});

test('human routes share one cached SPA shell while commercial crawlers perform zero subrequests', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  let assetFetches = 0;
  let externalFetches = 0;
  globalThis.fetch = async () => { externalFetches += 1; throw new Error('unexpected external fetch'); };
  const env = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response(indexHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
      }
    }
  };

  const cold = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/example-321'),
    env
  });
  const coldResponse = await onRequest(cold);
  await coldResponse.text();
  await settle(cold);
  assert.equal(coldResponse.headers.get('X-Edge-Mode'), 'HUMAN-SHELL');
  assert.equal(coldResponse.headers.get('X-Cache-Status'), 'MISS');
  assert.equal(assetFetches, 1);

  const warm = makeContext({ request: new Request('https://www.missav-j.com/id/category?name=Drama'), env });
  const warmResponse = await onRequest(warm);
  await warmResponse.text();
  assert.equal(warmResponse.headers.get('X-Cache-Status'), 'HIT');
  assert.equal(assetFetches, 1);
  assert.equal(externalFetches, 0);

  for (const bot of ['AhrefsBot', 'SemrushBot', 'MJ12bot']) {
    const blocked = await onRequest(makeContext({
      request: new Request('https://www.missav-j.com/en/watch/example-321', { headers: { 'User-Agent': bot } }),
      env
    }));
    assert.equal(blocked.status, 403);
    assert.equal(blocked.headers.get('X-Edge-Mode'), 'BLOCKED-BOT');
  }
  assert.equal(assetFetches, 1);
  assert.equal(externalFetches, 0);
});

test('player cache is shared across languages and rejects cache-busting parameters', async () => {
  const { onRequest } = await importSource('functions/api/player/[[id]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ iframe_html: '<iframe></iframe>' }), { status: 200 });
  };
  const first = makeContext({
    request: new Request('https://www.missav-j.com/api/player?id=88&lang=en'),
    params: { id: [] }
  });
  const firstResponse = await onRequest(first);
  await firstResponse.json();
  await settle(first);
  assert.equal(firstResponse.headers.get('X-Cache-Status'), 'MISS');

  const second = makeContext({
    request: new Request('https://www.missav-j.com/api/player?lang=id&id=88'),
    params: { id: [] }
  });
  const secondResponse = await onRequest(second);
  await secondResponse.json();
  assert.equal(secondResponse.headers.get('X-Cache-Status'), 'HIT');
  assert.equal(fetchCount, 1);

  const invalid = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/player?id=88&nonce=1'),
    params: { id: [] }
  }));
  assert.equal(invalid.status, 400);
  assert.equal(fetchCount, 1);
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
  assert.match(html, /rel="canonical"/);
  assert.match(html, /hreflang=/);
  assert.match(html, /VideoObject/);
  assert.equal(coldResponse.headers.get('X-Edge-Mode'), 'SOCIAL-SSR');
  assert.equal(metadataFetches, 1);

  const warm = makeContext({ request: request.clone(), env });
  const warmResponse = await onRequest(warm);
  await warmResponse.text();
  assert.equal(metadataFetches, 1);
  assert.equal(warmResponse.headers.get('X-Cache-Status'), 'HIT');
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

test('Googlebot receives full search SSR metadata instead of the human shell', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  let assetFetches = 0;
  let metadataFetches = 0;
  globalThis.fetch = async () => {
    metadataFetches += 1;
    return new Response(JSON.stringify({
      id: 125,
      code: 'ABC-125',
      title: 'Search Metadata',
      thumbnail: 'https://pics.dmm.co.jp/example.jpg',
      date: '2026-09-27T00:00:00Z'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/abc-125-search-metadata-125', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
    }),
    env: { ASSETS: { fetch: async () => { assetFetches += 1; return new Response(indexHtml); } } }
  });
  const response = await onRequest(context);
  const html = await response.text();
  await settle(context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Edge-Mode'), 'SEARCH-SSR');
  assert.match(html, /VideoObject/);
  assert.match(html, /hreflang=/);
  assert.equal(assetFetches, 1);
  assert.equal(metadataFetches, 1);
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
