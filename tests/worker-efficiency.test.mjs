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
    return new Response(JSON.stringify({ id: 77, code: 'ABC-077', title: 'ABC-077 English title', slug: 'abc-077-english-title' }), { status: 200 });
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
  assert.equal(post.localized_slugs.en, 'abc-077-english-title');
  assert.equal(post.localized_slugs.de, 'abc-077-english-title');
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

test('Googlebot watch aliases redirect to the same slug as the sitemap', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const post = {
    id: 771,
    code: 'H0930-KI180818',
    title: 'H0930-KI180818 Request work collection',
    slug: 'h0930-ki180818-request-work-collection',
    thumbnail: 'https://pics.dmm.co.jp/example.jpg'
  };
  globalThis.fetch = async () => new Response(JSON.stringify(post), { status: 200 });
  const env = { ASSETS: { fetch: async () => new Response(indexHtml) } };
  const headers = { 'User-Agent': 'Googlebot/2.1' };
  const alias = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/h0930-ki180818-h0930-ki180818-request-work-collection-771', { headers }),
    env
  });
  const redirect = await onRequest(alias);
  await settle(alias);
  const canonicalUrl = 'https://www.missav-j.com/en/watch/h0930-ki180818-request-work-collection-771';
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), canonicalUrl);

  const canonical = makeContext({ request: new Request(canonicalUrl, { headers }), env });
  const response = await onRequest(canonical);
  const html = await response.text();
  await settle(canonical);
  assert.equal(response.status, 200);
  assert.match(html, new RegExp(`<link rel="canonical"[^>]+href="${canonicalUrl}"`));
  assert.match(html, /<title>H0930-KI180818 Request work collection - MISSAV-J<\/title>/);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1);
  assert.match(html, /hreflang="de" href="https:\/\/www\.missav-j\.com\/de\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(html, /VideoObject/);

  const social = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/h0930-ki180818-h0930-ki180818-request-work-collection-771', {
      headers: { 'User-Agent': 'Twitterbot/1.0' }
    }),
    env
  });
  const socialResponse = await onRequest(social);
  const socialHtml = await socialResponse.text();
  await settle(social);
  assert.equal(socialResponse.status, 200);
  assert.match(socialHtml, new RegExp(`<link rel="canonical"[^>]+href="${canonicalUrl}"`));
  assert.match(socialHtml, /summary_large_image/);
  assert.match(socialHtml, /\/img\/[A-Za-z0-9_-]+\.jpg/);
});

test('missing watch metadata returns 404 only for confirmed absence, 503 for upstream failure', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const env = { ASSETS: { fetch: async () => new Response(indexHtml) } };
  const request = new Request('https://www.missav-j.com/en/watch/missing-999999999', {
    headers: { 'User-Agent': 'Googlebot/2.1' }
  });
  globalThis.fetch = async () => new Response('not found', { status: 404 });
  const absent = makeContext({ request, env });
  const notFound = await onRequest(absent);
  assert.equal(notFound.status, 404);
  assert.equal(notFound.headers.get('Cache-Control'), 'no-store');

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async () => new Response('unavailable', { status: 503 });
  const transient = makeContext({ request: request.clone(), env });
  const retry = await onRequest(transient);
  assert.equal(retry.status, 503);
  assert.equal(retry.headers.get('Retry-After'), '120');
});

test('tag pages receive route-specific crawler metadata instead of the home shell', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const routes = JSON.parse(await readFile(new URL('_routes.json', ROOT), 'utf8'));
  assert.ok(routes.include.includes('/*/tag'));
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/de/tag?name=Nanase%20Nishino', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Edge-Mode'), 'SEARCH-SSR');
  assert.match(html, /<title>[^<]*Nanase Nishino[^<]*<\/title>/);
  assert.match(html, /rel="canonical"[^>]*\/de\/tag\?name=Nanase%20Nishino/);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1);
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
  const postsFunction = await readFile(new URL('functions/api/posts/[[id]].js', ROOT), 'utf8');
  const routes = JSON.parse(await readFile(new URL('_routes.json', ROOT), 'utf8'));
  const assetVersion = sw.match(/CACHE_NAME = 'missavj-cache-v([^']+)'/)?.[1];
  const apiVersion = sw.match(/API_CACHE_NAME = 'missavj-api-cache-v([^']+)'/)?.[1];
  const ssrVersion = catchall.match(/SSR_CACHE_VERSION = 'v([^']+)'/)?.[1];
  const postsVersion = postsFunction.match(/POSTS_CACHE_VERSION = 'v([^']+)'/)?.[1];
  assert.ok(assetVersion);
  assert.equal(apiVersion, assetVersion);
  assert.equal(ssrVersion, assetVersion);
  assert.equal(postsVersion, assetVersion);
  assert.ok(routes.exclude.includes('/history*'));
  assert.ok(routes.exclude.includes('/*/history*'));
  assert.ok(routes.exclude.includes('/watch-later*'));
  assert.ok(routes.exclude.includes('/*/watch-later*'));
});


test('bare legal routes redirect to localized paths', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/dmca', { method: 'GET' }),
    env: { ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } }
  });
  const response = await onRequest(context);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.missav-j.com/en/dmca');
});

test('legal routes render full compliance SSR metadata and AboutPage schema', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/dmca', {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.match(text, /DMCA Copyright Notice/);
  assert.match(text, /compliance@missav-j\.com/);
  assert.match(text, /"@type":\s*"AboutPage"/);
});

test('unknown routes return genuine HTTP 404 with noindex metadata', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/non-existent-broken-url', {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    }),
    env: { ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } }
  });
  const response = await onRequest(context);
  const text = await response.text();
  assert.equal(response.status, 404);
  assert.match(text, /404 - Page Not Found/);
  assert.match(text, /name="robots" content="noindex, follow"/);
});

test('category and studio hubs render crawlable directory links in SSR', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const categoriesJson = JSON.stringify(['Uncensored', 'Amateur', 'Drama']);
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/categories', {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    }),
    env: {
      ASSETS: {
        fetch: async req => {
          const u = String(req.url || req);
          if (u.includes('categories.json')) return new Response(categoriesJson, { status: 200 });
          return new Response(indexHtml);
        }
      }
    }
  });
  const response = await onRequest(context);
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.match(text, /aria-label="All categories"/);
  assert.match(text, /href="\/en\/category\?name=Uncensored"/);
});


test('language root without trailing slash redirects to trailing slash (/en -> /en/)', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en', { method: 'GET' }),
    env: { ASSETS: { fetch: async () => new Response('shell') } }
  });
  const response = await onRequest(context);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.missav-j.com/en/');
});

test('subpages with trailing slash redirect to stripped slash (/en/trending/ -> /en/trending)', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/trending/', { method: 'GET' }),
    env: { ASSETS: { fetch: async () => new Response('shell') } }
  });
  const response = await onRequest(context);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.missav-j.com/en/trending');
});

test('regional language codes normalize case (/zh-tw/ -> /zh-TW/)', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/zh-tw/', { method: 'GET' }),
    env: { ASSETS: { fetch: async () => new Response('shell') } }
  });
  const response = await onRequest(context);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.missav-j.com/zh-TW/');
});

test('listing canonical strips sorting and pagination parameters', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/trending?sort=views&order=desc&page=1', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/en\/trending"/);
  assert.doesNotMatch(html, /href="https:\/\/www\.missav-j\.com\/en\/trending\?sort=/);
});

test('pagination pages (page > 1) receive noindex, follow and pagination links', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Drama&page=2', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /<link rel="prev"/);
  assert.match(html, /<link rel="next"/);
  // No hreflang on noindex page
  assert.doesNotMatch(html, /hreflang="ja"/);
});

test('homepage SSR renders WebSite and Organization schema with SearchAction and no breadcrumbs', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /"@type":\s*"WebSite"/);
  assert.match(html, /"@type":\s*"Organization"/);
  assert.match(html, /"@type":\s*"SearchAction"/);
  // Homepage should not emit BreadcrumbList
  assert.doesNotMatch(html, /"@type":\s*"BreadcrumbList"/);
});

test('sub-category and sub-actor SSR render 3-tier BreadcrumbList and ItemList', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  
  // Test category subpage
  const catContext = makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Uncensored', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const catRes = await onRequest(catContext);
  const catHtml = await catRes.text();
  assert.equal(catRes.status, 200);
  assert.match(catHtml, /"@type":\s*"BreadcrumbList"/);
  assert.match(catHtml, /"name":\s*"Categories"/);
  assert.match(catHtml, /"name":\s*"Uncensored"/);
  assert.match(catHtml, /"@type":\s*"ItemList"/);

  // Test actor subpage
  const actorContext = makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Yua%20Mikami', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const actorRes = await onRequest(actorContext);
  const actorHtml = await actorRes.text();
  assert.equal(actorRes.status, 200);
  assert.match(actorHtml, /"@type":\s*"ProfilePage"/);
  assert.match(actorHtml, /"name":\s*"Actresses"/);
  assert.match(actorHtml, /"name":\s*"Yua Mikami"/);
});

test('video watch page SSR renders 3-tier BreadcrumbList with primary category and valid VideoObject', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const post = {
    id: 888123,
    code: 'SSIS-888',
    title: 'SSIS-888 Test Title',
    duration: '01:45:30',
    categories: ['Uncensored', 'Drama'],
    actors: ['Yua Mikami'],
    studio: 'S1',
    thumbnail: 'https://image.apijav.com/thumb/888.jpg',
    embed_url: 'https://server.apijav.com/embed/888123'
  };
  globalThis.fetch = async input => {
    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  const env = {
    ASSETS: { fetch: async () => new Response(indexHtml) }
  };
  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/ssis-888-test-title-888123', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env
  });
  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /"@type":\s*"VideoObject"/);
  assert.match(html, /"duration":\s*"PT1H45M30S"/);
  assert.match(html, /"isFamilyFriendly":\s*false/);
  assert.match(html, /"@type":\s*"BreadcrumbList"/);
  assert.match(html, /"name":\s*"Uncensored"/);
  assert.match(html, /"name":\s*"SSIS-888 Test Title [-—] MISSAV-J"/);
});

test('category and studio hubs render rich editorial guide (Hub Content) in SSR', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  
  // Category guide check
  const catContext = makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Uncensored', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const catRes = await onRequest(catContext);
  const catHtml = await catRes.text();
  assert.equal(catRes.status, 200);
  assert.match(catHtml, /hub-editorial-guide/);
  assert.match(catHtml, /Uncensored JAV Streaming Guide/);
  assert.match(catHtml, /Caribbeancom/);

  // Studio guide check
  const studioContext = makeContext({
    request: new Request('https://www.missav-j.com/en/studio?name=S1', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  });
  const studioRes = await onRequest(studioContext);
  const studioHtml = await studioRes.text();
  assert.equal(studioRes.status, 200);
  assert.match(studioHtml, /hub-editorial-guide/);
  assert.match(studioHtml, /S1 No.1 Style Official Studio Archive/);
});

test('enriched video watch page SSR injects FAQPage schema and AI editorial highlights', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const post = {
    id: 999123,
    code: 'SSIS-999',
    title: 'SSIS-999 Enriched Title',
    duration: '01:30:00',
    categories: ['Drama'],
    actors: ['Yua Mikami'],
    studio: 'S1',
    thumbnail: 'https://image.apijav.com/thumb/999.jpg',
    embed_url: 'https://server.apijav.com/embed/999123'
  };
  const enrichedPostsDb = {
    _meta: { version: '1.0.0' },
    posts: {
      '999123': {
        video_id: '999123',
        seo_title: 'SSIS-999 Exclusive Yua Mikami Feature',
        meta_description: 'Stream SSIS-999 starring Yua Mikami in full HD. Read our exclusive overview and FAQs.',
        summary: 'SSIS-999 is a cinematic drama presentation featuring award-winning performances.',
        highlights: ['Exclusive S1 4K release', 'Starring Yua Mikami', 'Cinematic narrative pacing'],
        tags: ['Drama', 'S1', 'SSIS-999'],
        faq: [
          { q: 'Who is the lead actress in SSIS-999?', a: 'SSIS-999 stars popular actress Yua Mikami.' },
          { q: 'Is SSIS-999 available in HD?', a: 'Yes, full high definition streaming is supported.' }
        ],
        status: 'enriched'
      }
    }
  };

  globalThis.fetch = async input => {
    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const env = {
    ASSETS: {
      fetch: async url => {
        const u = String(url);
        if (u.includes('seo-enriched-posts.json')) {
          return new Response(JSON.stringify(enrichedPostsDb), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(indexHtml);
      }
    }
  };

  const context = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/ssis-999-enriched-title-999123', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env
  });

  const response = await onRequest(context);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /"@type":\s*"FAQPage"/);
  assert.match(html, /Who is the lead actress in SSIS-999?/);
  assert.match(html, /video-ai-enrichment/);
  assert.match(html, /Feature Highlights/);
});
