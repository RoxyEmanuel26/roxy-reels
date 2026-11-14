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
  assert.match(html, /hreflang="en" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.doesNotMatch(html, /hreflang="de"/);
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
  assert.equal(notFound.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.equal(notFound.headers.get('X-Edge-Mode'), 'WATCH-SSR-404');
  const notFoundBody = await notFound.text();
  assert.match(notFoundBody, /<meta name="robots" content="noindex, follow" \/>/);

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
  assert.deepEqual(routes.include, ['/*']);
  for (const pattern of [...routes.include, ...routes.exclude]) {
    const starIdx = pattern.indexOf('*');
    assert.ok(starIdx === -1 || starIdx === pattern.length - 1, `Invalid wildcard position in _routes.json pattern: ${pattern}`);
  }
  const matchesRoute = (pathname) => {
    const matchPattern = (p) => (p.endsWith('*') ? pathname.startsWith(p.slice(0, -1)) : pathname === p);
    return routes.include.some(matchPattern) && !routes.exclude.some(matchPattern);
  };
  assert.equal(matchesRoute('/en/tag'), true);
  assert.equal(matchesRoute('/ko/tag'), true);
  assert.equal(matchesRoute('/en/actor%3Fname%3DNon-Chan'), true);
  assert.equal(matchesRoute('/zh-TW/watch/test-123'), true);
  assert.equal(matchesRoute('/assets/app.js'), false);
  assert.equal(matchesRoute('/api/actors.json'), false);
  assert.equal(matchesRoute('/api/duplicate-video-canonicals.json'), false);
  assert.equal(matchesRoute('/manifest.json'), false);
  assert.equal(matchesRoute('/sw.js'), false);
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 101, code: 'PRE-101', title: 'Sample Tag Video 1', thumbnail: 'https://image.apijav.com/thumb/101.jpg' },
    { id: 102, code: 'PRE-102', title: 'Sample Tag Video 2', thumbnail: 'https://image.apijav.com/thumb/102.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '2', 'X-WP-TotalPages': '1' }
  });
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
  assert.ok(routes.exclude.includes('/watch-later*'));
  for (const lang of ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt']) {
    assert.ok(routes.exclude.includes(`/${lang}/history*`));
    assert.ok(routes.exclude.includes(`/${lang}/watch-later*`));
  }
  assert.ok(routes.include.length + routes.exclude.length <= 100);
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
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 201, code: 'TRD-201', title: 'Trending Sample', thumbnail: 'https://image.apijav.com/thumb/201.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '40', 'X-WP-TotalPages': '4' }
  });
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
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 202, code: 'DRM-202', title: 'Drama Page 2 Sample', thumbnail: 'https://image.apijav.com/thumb/202.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '50', 'X-WP-TotalPages': '5' }
  });
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
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 203, code: 'HOM-203', title: 'Homepage Sample', thumbnail: 'https://image.apijav.com/thumb/203.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '100', 'X-WP-TotalPages': '5' }
  });
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
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 204, code: 'SUB-204', title: 'Sub Listing Sample', thumbnail: 'https://image.apijav.com/thumb/204.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '20', 'X-WP-TotalPages': '2' }
  });
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
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 205, code: 'HUB-205', title: 'Hub Sample Video', thumbnail: 'https://image.apijav.com/thumb/205.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '20', 'X-WP-TotalPages': '2' }
  });
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

test('SSR queries WordPress tag parameter as slug and returns videos instead of Soft 404', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const upstreamUrls = [];
  globalThis.fetch = async input => {
    const u = String(input);
    upstreamUrls.push(u);
    return new Response(JSON.stringify([
      { id: 501, code: 'PRE-501', title: 'Prestige Tag Video 1', thumbnail: 'https://image.apijav.com/thumb/501.jpg' },
      { id: 502, code: 'PRE-502', title: 'Prestige Tag Video 2', thumbnail: 'https://image.apijav.com/thumb/502.jpg' }
    ]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-WP-Total': '149', 'X-WP-TotalPages': '13' }
    });
  };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const response = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/tag?name=PRESTIGE%20PREMIUM', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(upstreamUrls.some(u => u.includes('tag=prestige-premium') && !u.includes('category=')), `Unexpected upstream URL: ${upstreamUrls}`);
  assert.match(html, /Prestige Tag Video 1/);
  assert.match(html, /<link rel="next" href="https:\/\/www\.missav-j\.com\/en\/tag\?name=PRESTIGE%20PREMIUM&amp;page=2"/);
});

test('/api/posts normalizes tag slug and studio aliases before forwarding upstream', async () => {
  const { onRequest } = await importSource('functions/api/posts/[[id]].js');
  globalThis.caches = { default: new MemoryCache() };
  const forwardedUrls = [];
  globalThis.fetch = async input => {
    forwardedUrls.push(String(input));
    return new Response(JSON.stringify([{ id: 601, code: 'SSIS-601', title: 'Alias Video' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-WP-Total': '10', 'X-WP-TotalPages': '1' }
    });
  };
  await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&tag=PRESTIGE%20PREMIUM'),
    env: {},
    params: { id: [] }
  }));
  await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&studio=S1%20NO.1%20STYLE'),
    env: {},
    params: { id: [] }
  }));
  assert.ok(forwardedUrls[0].includes('tag=prestige-premium'));
  assert.ok(forwardedUrls[1].includes('studio=S1') && !forwardedUrls[1].includes('NO.1'));
});

test('legacy studio aliases redirect with 301 to active upstream studio names', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  for (const [legacy, canonical] of [
    ['S1 NO.1 STYLE', 'S1'],
    ['Soft On Demand', 'SOD'],
    ['Idea Pocket', 'IdeaPocket'],
    ['MOODYZ', "Moody's"]
  ]) {
    const res = await onRequest(makeContext({
      request: new Request(`https://www.missav-j.com/en/studio?name=${encodeURIComponent(legacy)}`, {
        headers: { 'User-Agent': 'Googlebot/2.1' }
      }),
      env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
    }));
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('Location'), `https://www.missav-j.com/en/studio?name=${encodeURIComponent(canonical)}`);
  }
});

test('renamed or parenthetical actor aliases redirect with 301 via cached taxonomies', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('/taxonomies')) {
      return new Response(JSON.stringify({
        actors: ['Setuko Kusakabe (Setsuko Kusakabe)', 'Tsukushi (Tsukushi Osawa)'],
        categories: [], tags: [], studios: []
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('actor=Setuko%20Kusakabe%20(Setsuko%20Kusakabe)') || u.includes('actor=Setuko+Kusakabe+%28Setsuko+Kusakabe%29')) {
      return new Response(JSON.stringify([{ id: 701, title: 'Valid Actor Post' }]), {
        status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '5', 'X-WP-TotalPages': '1' }
      });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '0', 'X-WP-TotalPages': '1' } });
  };
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const res = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Setsuko%20Kusakabe', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  assert.equal(res.status, 301);
  assert.equal(
    res.headers.get('Location'),
    'https://www.missav-j.com/en/actor?name=Setuko%20Kusakabe%20(Setsuko%20Kusakabe)'
  );
});

test('empty taxonomy and out-of-range pagination return genuine 404 while upstream errors return 503 no-store', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('/taxonomies')) {
      return new Response(JSON.stringify({ actors: [], categories: [], tags: [], studios: [] }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '0', 'X-WP-TotalPages': '1' } });
  };
  const emptyRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/actor?name=Selina,%2025%20Years%20Old,%20Office%20Lady', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  assert.equal(emptyRes.status, 404);
  assert.match(await emptyRes.text(), /name="robots" content="noindex, follow"/);

  const oobPageRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/trending?page=99999', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  assert.equal(oobPageRes.status, 404);

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async () => new Response('upstream down', { status: 502 });
  const errRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Yua%20Mikami', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  assert.equal(errRes.status, 503);
  assert.match(errRes.headers.get('Cache-Control'), /no-store/);
  assert.equal(errRes.headers.get('Retry-After'), '120');
});

test('thin (1-video) or single-page taxonomies suppress rel=next, thin pages emit noindex without hreflang, and pagination preserves %20', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 801, code: 'ONE-801', title: 'Single Video Tax', thumbnail: 'https://image.apijav.com/thumb/801.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '1', 'X-WP-TotalPages': '1' }
  });
  const thinRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/tag?name=Nanase%20Nishino', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  const thinHtml = await thinRes.text();
  assert.equal(thinRes.status, 200);
  assert.match(thinHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(thinHtml, /rel="alternate" hreflang=/);
  assert.doesNotMatch(thinHtml, /rel="next"/);

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async () => new Response(JSON.stringify([
    { id: 802, code: 'PAG-802', title: 'Page 2 Item', thumbnail: 'https://image.apijav.com/thumb/802.jpg' }
  ]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-WP-Total': '30', 'X-WP-TotalPages': '3' }
  });
  const pagedActorRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ja/actor?name=Ai%20Kano&page=2', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml) } }
  }));
  const pagedHtml = await pagedActorRes.text();
  assert.equal(pagedActorRes.status, 200);
  assert.match(pagedHtml, /<link rel="prev" href="https:\/\/www\.missav-j\.com\/ja\/actor\?name=Ai%20Kano"/);
  assert.match(pagedHtml, /<link rel="next" href="https:\/\/www\.missav-j\.com\/ja\/actor\?name=Ai%20Kano&amp;page=3"/);
  assert.doesNotMatch(pagedHtml, /Ai\+Kano/);
  // Sidebar navigation localized to /ja/
  assert.match(pagedHtml, /<nav class="sidebar-nav">[\s\S]*href="\/ja\/trending"/);
  assert.doesNotMatch(pagedHtml, /<nav class="sidebar-nav">[\s\S]*href="\/en\/trending"/);
});

test('runtime JS and HTML contain zero ?v=--help, zero bare sidebar links, Analytics.init runs once, and getPost/getPlayer retry', async () => {
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const playerJs = await readFile(new URL('assets/js/player.js', ROOT), 'utf8');
  const i18nJs = await readFile(new URL('assets/js/i18n.js', ROOT), 'utf8');
  const appJs = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');

  assert.doesNotMatch(playerJs, /\?v=--help|href="#\/studio\?name=/);
  assert.doesNotMatch(i18nJs, /\?v=--help/);
  assert.doesNotMatch(indexHtml, /<a href="\/(?:trending|recent|actors|categories|studios|popular-actors|watch-later|history|2257|dmca|privacy-policy|terms|contact)"/);
  assert.equal((appJs.match(/Analytics\.init\(\)/g) || []).length, 1);

  globalThis.window = { location: { pathname: '/en/' } };
  const { default: api } = await importSource('assets/js/api.js');
  let postAttempts = 0;
  let playerAttempts = 0;
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('/api/posts?id=77')) {
      postAttempts += 1;
      if (postAttempts === 1) return new Response('busy', { status: 503, statusText: 'Busy' });
      return new Response(JSON.stringify({ id: 77, title: 'Retried Post' }), { status: 200 });
    }
    if (u.includes('/api/player?id=77')) {
      playerAttempts += 1;
      if (playerAttempts === 1) return new Response('busy', { status: 502, statusText: 'Bad Gateway' });
      return new Response(JSON.stringify({ iframe_html: '<iframe></iframe>' }), { status: 200 });
    }
    return new Response('[]', { status: 200 });
  };
  const postRes = await api.getPost(77);
  const playerRes = await api.getPlayer(77);
  assert.equal(postAttempts, 2);
  assert.equal(playerAttempts, 2);
  assert.equal(postRes.title, 'Retried Post');
  assert.equal(playerRes.iframe_html, '<iframe></iframe>');
});

test('serveHumanShell rewrites lang, canonical, and og:url per localized URL from a single cached shell', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  let assetFetches = 0;
  globalThis.caches = { default: new MemoryCache() };

  const makeHumanCtx = targetUrl => makeContext({
    request: new Request(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36' }
    }),
    env: {
      ASSETS: {
        fetch: async () => {
          assetFetches += 1;
          return new Response(indexHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }
      }
    }
  });

  // First human-shell request warms raw index.html cache
  const frRes = await onRequest(makeHumanCtx('https://www.missav-j.com/fr/'));
  const frHtml = await frRes.text();
  assert.equal(frRes.status, 200);
  assert.equal(frRes.headers.get('X-Cache-Status'), 'MISS');
  assert.match(frHtml, /<html lang="fr"/i);
  assert.match(frHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/fr\/"/);
  assert.match(frHtml, /<meta property="og:url" id="og-url" content="https:\/\/www\.missav-j\.com\/fr\/"/);

  // Second request with a different locale reuses the single cached shell without /en/ canonical leak
  const idRes = await onRequest(makeHumanCtx('https://www.missav-j.com/id/category?name=Drama'));
  const idHtml = await idRes.text();
  assert.equal(idRes.status, 200);
  assert.equal(idRes.headers.get('X-Cache-Status'), 'HIT');
  assert.equal(assetFetches, 1);
  assert.match(idHtml, /<html lang="id"/i);
  assert.match(idHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/id\/category\?name=Drama"/);
  assert.match(idHtml, /<meta property="og:url" id="og-url" content="https:\/\/www\.missav-j\.com\/id\/category\?name=Drama"/);
});

test('Watch SSR enforces Option 1A symmetrical hreflangs, localized VideoObject inLanguage/labels, and batch listing translations', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const postPayload = {
    id: 771,
    code: 'H0930-KI180818',
    title: 'Request Work Collection',
    thumbnail: 'https://fourhoi.com/771/cover.jpg',
    actors: ['Rika Aimi'],
    categories: ['Drama'],
    studio: 'PRESTIGE'
  };
  const translationRow = {
    id: 'Koleksi Permintaan Kerja',
    fr: 'Collection Travail Sur Demande'
  };

  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('supabase.example/rest/v1/translations?id=eq.771')) {
      return new Response(JSON.stringify([{ translations: translationRow }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (u.includes('supabase.example/rest/v1/translations?id=in.')) {
      return new Response(JSON.stringify([{ id: 771, translations: translationRow }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (u.includes('/posts/771')) {
      return new Response(JSON.stringify(postPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (u.includes('/posts?')) {
      return new Response(JSON.stringify([postPayload]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-WP-Total': '12', 'X-WP-TotalPages': '1' }
      });
    }
    return new Response('[]', { status: 200 });
  };

  const makeBotCtx = targetUrl => makeContext({
    request: new Request(targetUrl, { headers: { 'User-Agent': 'Googlebot/2.1' } }),
    env: {
      SUPABASE_URL: 'https://supabase.example',
      SUPABASE_KEY: 'test-key',
      ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) }
    }
  });

  // 1. Translated /id/ watch URL emits symmetrical hreflang cluster (en, fr, id, x-default) & localized inLanguage/labels
  globalThis.caches = { default: new MemoryCache() };
  const idWatchRes = await onRequest(makeBotCtx('https://www.missav-j.com/id/watch/h0930-ki180818-request-work-collection-771'));
  const idWatchHtml = await idWatchRes.text();
  assert.equal(idWatchRes.status, 200);
  assert.match(idWatchHtml, /Koleksi Permintaan Kerja/);
  assert.match(idWatchHtml, /"inLanguage":\s*"id"/);
  assert.match(idWatchHtml, /<strong>Aktris:<\/strong>/);
  assert.match(idWatchHtml, /<strong>Kategori:<\/strong>/);
  assert.match(idWatchHtml, /hreflang="en" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(idWatchHtml, /hreflang="id" href="https:\/\/www\.missav-j\.com\/id\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(idWatchHtml, /hreflang="fr" href="https:\/\/www\.missav-j\.com\/fr\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(idWatchHtml, /hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.doesNotMatch(idWatchHtml, /hreflang="ko"/);
  assert.match(idWatchHtml, /data-ssr-watch-id="771"/);

  // 2. Untranslated /ko/ watch URL stays self-canonical and omits mismatched hreflang tags
  const koWatchRes = await onRequest(makeBotCtx('https://www.missav-j.com/ko/watch/h0930-ki180818-request-work-collection-771'));
  const koWatchHtml = await koWatchRes.text();
  assert.equal(koWatchRes.status, 200);
  assert.match(koWatchHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/ko\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(koWatchHtml, /data-watch-hreflangs=""/);
  assert.doesNotMatch(koWatchHtml, /rel="alternate" hreflang=/);

  // 3. Listing SSR uses localized BreadcrumbList & translated catalog titles while keeping English href slug
  const idTrendingRes = await onRequest(makeBotCtx('https://www.missav-j.com/id/trending'));
  const idTrendingHtml = await idTrendingRes.text();
  assert.equal(idTrendingRes.status, 200);
  assert.match(idTrendingHtml, /"name":\s*"Beranda"/);
  assert.match(idTrendingHtml, /href="\/id\/watch\/h0930-ki180818-request-work-collection-771"[\s\S]*Koleksi Permintaan Kerja/);
});

test('localized SEO keys cover all 13 locales and API/cron enforce canonical English watch slugs', async () => {
  const i18nSource = await readFile(new URL('assets/js/i18n.js', ROOT), 'utf8');
  const appSource = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');
  const cronSource = await readFile(new URL('functions/api/telegram/cron.js', ROOT), 'utf8');

  assert.match(appSource, /data-ssr-watch-id/);
  assert.match(appSource, /data-watch-hreflangs/);
  assert.match(appSource, /_isSeoFallback/);
  assert.match(appSource, /en_slug/);
  assert.match(cronSource, /originalEnTitle/);

  const locales = ['en', 'id', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'fil', 'pt'];
  const metaKeys = [
    'meta_home_title', 'meta_home_desc', 'meta_trending_desc', 'meta_recent_desc',
    'meta_actors_desc', 'meta_categories_desc', 'meta_studios_desc', 'meta_search_desc',
    'meta_actor_detail_desc', 'meta_category_detail_desc', 'meta_studio_detail_desc',
    'meta_tag_detail_desc', 'meta_watch_prefix'
  ];
  for (const key of metaKeys) {
    const blockMatch = i18nSource.match(new RegExp(`\\b${key}\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
    assert.ok(blockMatch, `Missing dictionary block for ${key}`);
    for (const loc of locales) {
      const locKeyPattern = loc.includes('-') ? `'${loc}'` : `(?:${loc}|'${loc}')`;
      assert.match(blockMatch[1], new RegExp(`${locKeyPattern}\\s*:\\s*'[^']+'`), `Missing ${loc} translation in ${key}`);
    }
  }

  // /api/posts/:id returns English canonical slugs across all languages & Option 1A available_hreflangs
  const postsMod = await importSource('functions/api/posts/[[id]].js');
  const postPayload = { id: 88, code: 'ABC-088', title: 'Original English Title' };
  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('supabase.example/rest/v1/translations')) {
      return new Response(JSON.stringify([{
        translations: { fr: 'Titre Francais Traduit', ja: '日本語タイトル' }
      }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('server.apijav.com')) {
      return new Response(JSON.stringify(postPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('blocked', { status: 403 });
  };

  const frApiRes = await postsMod.onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts/88?lang=fr'),
    params: { id: ['88'] },
    env: { SUPABASE_URL: 'https://supabase.example', SUPABASE_KEY: 'test-key' }
  }));
  const frJson = await frApiRes.json();
  assert.equal(frJson.en_slug, 'abc-088-original-english-title');
  assert.equal(frJson.localized_slugs.fr, 'abc-088-original-english-title');
  assert.equal(frJson.localized_slugs.ja, 'abc-088-original-english-title');
  assert.deepEqual(frJson.available_hreflangs, ['en', 'ja', 'fr']);

  const koApiRes = await postsMod.onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts/88?lang=ko'),
    params: { id: ['88'] },
    env: { SUPABASE_URL: 'https://supabase.example', SUPABASE_KEY: 'test-key' }
  }));
  const koJson = await koApiRes.json();
  assert.deepEqual(koJson.available_hreflangs, []);
});

test('localized shell eliminates internal links to / and normalizes Watch entities, studios, IndexNow, and llms files', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const manifest = JSON.parse(await readFile(new URL('manifest.json', ROOT), 'utf8'));
  const llmsTxt = await readFile(new URL('llms.txt', ROOT), 'utf8');
  const llmsFullTxt = await readFile(new URL('llms-full.txt', ROOT), 'utf8');

  assert.equal(manifest.start_url, '/en/');
  assert.match(indexHtml, /<a href="\/en\/" class="logo" id="logo-branding">/);
  assert.doesNotMatch(llmsTxt, /\?name=(?:MOODYZ|SOD\+Create|Idea\+Pocket|Prestige)\b/);
  assert.doesNotMatch(llmsTxt, /\/en\/privacy(?![-\w])/);
  assert.doesNotMatch(llmsFullTxt, /\?name=(?:MOODYZ|SOD\+Create|Idea\+Pocket|Prestige)\b/);

  globalThis.caches = { default: new MemoryCache() };
  const entityPost = {
    id: 4040,
    code: 'ENT-040',
    title: 'Wife &amp; Friend&#039;s &#038; Husband &quot;Night&quot;',
    slug: '',
    thumbnail: 'https://fourhoi.com/4040/cover.jpg',
    studio: 'MOODYZ'
  };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('/posts/4040')) {
      return new Response(JSON.stringify(entityPost), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200 });
  };
  const env = { ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) } };

  // HUMAN-SHELL localizes logo-branding and sidebar links without leaving href="/"
  const humanFr = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/fr/trending', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36' }
    }),
    env
  }));
  const humanFrHtml = await humanFr.text();
  assert.equal(humanFr.headers.get('X-Edge-Mode'), 'HUMAN-SHELL');
  assert.match(humanFrHtml, /<a href="\/fr\/" class="logo" id="logo-branding">/);

  // canonicalWatchPath decodes HTML entities cleanly (no -amp- or -039- in canonical path)
  const expectedSlugUrl = 'https://www.missav-j.com/id/watch/ent-040-wife-friends-husband-night-4040';
  const entityWatch = await onRequest(makeContext({
    request: new Request(expectedSlugUrl, { headers: { 'User-Agent': 'Googlebot/2.1' } }),
    env
  }));
  const entityWatchHtml = await entityWatch.text();
  assert.equal(entityWatch.status, 200);
  assert.match(entityWatchHtml, /<a href="\/id\/" class="logo" id="logo-branding">/);
  assert.match(entityWatchHtml, /href="\/id\/studio\?name=Moody's"/);
  assert.match(entityWatchHtml, /"item":\s*"https:\/\/www\.missav-j\.com\/id\/"/);

  // Case-insensitive Prestige studio alias redirects cleanly to PRESTIGE
  const prestigeAlias = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/studio?name=Prestige', {
      headers: { 'User-Agent': 'Googlebot/2.1' }
    }),
    env
  }));
  assert.equal(prestigeAlias.status, 301);
  assert.equal(prestigeAlias.headers.get('Location'), 'https://www.missav-j.com/en/studio?name=PRESTIGE');

  // IndexNow uses canonical sitemap URLs for enriched posts and emits zero redirect/wrong-legal targets
  const { buildIndexNowUrls } = await import(`../scripts/indexnow.mjs?t=${Date.now()}`);
  const indexNowUrls = buildIndexNowUrls();
  assert.ok(!indexNowUrls.includes('https://www.missav-j.com/'));
  assert.ok(!indexNowUrls.some(u => /studio\?name=(?:MOODYZ|SOD\+Create)/.test(u)));
  assert.ok(!indexNowUrls.some(u => /\/en\/privacy$/.test(u)));
  assert.ok(indexNowUrls.includes('https://www.missav-j.com/en/privacy-policy'));
  assert.ok(!indexNowUrls.includes('https://www.missav-j.com/en/watch/iptd-508-kizaki-jessica-in-ideapocket-subtitled-619'));
});

test('upstream ID reassignment returns 410 Gone while same-video legacy watch aliases still 301 redirect', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const postsById = {
    14700: { id: 14700, code: 'HHKL-168', slug: 'hhkl-168-new-reassigned-video', title: 'HHKL-168 New Video', thumbnail: 'https://fourhoi.com/14700.jpg' },
    28438: { id: 28438, code: 'FC2-PPV-3245350', slug: 'fc2-ppv-3245350-new-video', title: 'FC2-PPV-3245350 New', thumbnail: 'https://fourhoi.com/28438.jpg' },
    115025: { id: 115025, code: 'JUR-231-ENGLISH-SUBTITLE', slug: 'jur-231-the-days-of-creampie-gangbang', title: 'JUR-231 The Days', thumbnail: 'https://fourhoi.com/115025.jpg' },
    118079: { id: 118079, code: 'OKB-190', slug: 'okb-190-mika-sumikawa', title: 'OKB-190 Mika Sumikawa', thumbnail: 'https://fourhoi.com/118079.jpg' }
  };

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const m = String(input).match(/\/posts\/(\d+)/);
    const payload = m && postsById[m[1]];
    if (payload) return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
    return new Response('not found', { status: 404 });
  };
  const env = { ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) } };
  const botHeaders = { 'User-Agent': 'Googlebot/2.1' };

  // Mismatched code -> 410 Gone
  const reassigned1 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/cemd-616-cemd-616-girls-who-feel-like-bullying-men-14700', { headers: botHeaders }),
    env
  }));
  assert.equal(reassigned1.status, 410);
  assert.equal(reassigned1.headers.get('X-Edge-Mode'), 'SEARCH-GONE-410');

  const reassignedFc2 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/vi/watch/fc2-ppv-3245176-fc2-ppv-3245176-married-woman-28438', { headers: botHeaders }),
    env
  }));
  assert.equal(reassignedFc2.status, 410);

  // Same-video legacy translated slug and double-code alias -> 301 SEARCH-REDIRECT
  const translatedAlias = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/jur-231-english-subtitle-jur-231-hari-hari-gangbang-115025', { headers: botHeaders }),
    env
  }));
  assert.equal(translatedAlias.status, 301);
  assert.equal(translatedAlias.headers.get('Location'), 'https://www.missav-j.com/id/watch/jur-231-english-subtitle-jur-231-the-days-of-creampie-gangbang-115025');

  const doubleCodeAlias = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/okb-190-okb-190-mika-sumikawa-118079', { headers: botHeaders }),
    env
  }));
  assert.equal(doubleCodeAlias.status, 301);
  assert.equal(doubleCodeAlias.headers.get('Location'), 'https://www.missav-j.com/id/watch/okb-190-mika-sumikawa-118079');
});

test('category aliases 301 redirect, spam actors noindex, and Watch SSR avoids linking uncurated or spam taxonomies', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const curatedActors = JSON.parse(await readFile(new URL('api/actors.json', ROOT), 'utf8'));
  const curatedCategories = JSON.parse(await readFile(new URL('api/categories.json', ROOT), 'utf8'));
  const { onRequest } = await importSource('functions/[[catchall]].js');

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('myvideo/v1/posts?')) {
      const parsed = new URL(url);
      if (parsed.searchParams.get('actor') === '-Karin') {
        return new Response(JSON.stringify([{ id: 7001, code: 'KRN-001', title: 'Karin Sample', thumbnail: 'https://img.example/1.jpg' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '5', 'X-WP-TotalPages': '1' }
        });
      }
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '0' } });
    }
    if (url.includes('myvideo/v1/posts/77123')) {
      return new Response(JSON.stringify({
        id: 77123,
        code: 'ABC-777',
        title: 'Watch Metadata Hygiene Sample',
        duration: '01:30:00',
        embed_url: 'https://server.apijav.com/embed/77123',
        thumbnail: 'https://img.example/77123.jpg',
        actors: ['-Karin', 'Yuna Hasegawa'],
        categories: ['En/tokyohot', 'Dead Zero Video Category'],
        studio: 'Other'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = {
    ASSETS: {
      fetch: async (req) => {
        const p = new URL(String(req)).pathname;
        if (p === '/api/actors.json') return new Response(JSON.stringify(curatedActors), { status: 200 });
        if (p === '/api/categories.json') return new Response(JSON.stringify(curatedCategories), { status: 200 });
        return new Response(baseHtml, { status: 200 });
      }
    }
  };

  const dirtyCatRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/zh-CN/category?name=En%2Ftokyohot', { headers: botHeaders }),
    env
  }));
  assert.equal(dirtyCatRes.status, 301);
  assert.equal(dirtyCatRes.headers.get('X-Edge-Mode'), 'CATEGORY-ALIAS-REDIRECT');
  assert.equal(dirtyCatRes.headers.get('Location'), 'https://www.missav-j.com/zh-CN/category?name=Tokyohot');

  const dupSlashRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Blonde%20%2F%20Blonde', { headers: botHeaders }),
    env
  }));
  assert.equal(dupSlashRes.status, 301);
  assert.equal(dupSlashRes.headers.get('Location'), 'https://www.missav-j.com/en/category?name=Blonde');

  const spamActorRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/actor?name=-Karin', { headers: botHeaders }),
    env
  }));
  assert.equal(spamActorRes.status, 200);
  const spamActorHtml = await spamActorRes.text();
  assert.match(spamActorHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(spamActorHtml, /<link rel="alternate" hreflang=/);

  const watchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/abc-777-watch-metadata-hygiene-sample-77123', { headers: botHeaders }),
    env
  }));
  assert.equal(watchRes.status, 200);
  const watchHtml = await watchRes.text();
  assert.doesNotMatch(watchHtml, /actor\?name=-Karin/i);
  assert.match(watchHtml, /<span[^>]*>-Karin<\/span>/);
  assert.match(watchHtml, /<a href="\/en\/actor\?name=Yuna%20Hasegawa"/);
  assert.match(watchHtml, /<a href="\/en\/category\?name=Tokyohot"[^>]*>Tokyohot<\/a>/);
  assert.doesNotMatch(watchHtml, /category\?name=Dead%20Zero%20Video%20Category/i);
  assert.doesNotMatch(watchHtml, /studio\?name=Other/i);
});

test('dynamic taxonomies enforce >=5 indexable threshold, translation-gated Option 1A, and rich entity summaries', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js');

  const samplePosts = Array.from({ length: 5 }, (_, idx) => ({
    id: 8100 + idx,
    code: `MYS-10${idx}`,
    title: `Mayu Feature ${idx}`,
    thumbnail: `https://img.example/810${idx}.jpg`,
    categories: ['Tall', 'Unknown Dead Cat'],
    studio: 'S1'
  }));
  const translationRows = samplePosts.map(p => ({
    id: p.id,
    translations: {
      id: `Judul Bahasa Indonesia ${p.id}`,
      ja: `日本語タイトル ${p.id}`
    }
  }));

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('supabase.test/rest/v1/translations')) {
      return new Response(JSON.stringify(translationRows), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('myvideo/v1/posts?')) {
      const parsed = new URL(url);
      const actor = parsed.searchParams.get('actor');
      const cat = parsed.searchParams.get('category');
      if (actor === 'Takagi Misato') {
        return new Response(JSON.stringify(samplePosts.slice(0, 2)), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '2', 'X-WP-TotalPages': '1' }
        });
      }
      if (actor === 'Four Video Actor') {
        return new Response(JSON.stringify(samplePosts.slice(0, 4)), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '4', 'X-WP-TotalPages': '1' }
        });
      }
      if (actor === 'Mayu Nozomi') {
        return new Response(JSON.stringify(samplePosts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '7', 'X-WP-TotalPages': '1' }
        });
      }
      if (cat === 'Jav English Sub') {
        return new Response(JSON.stringify(samplePosts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '150', 'X-WP-TotalPages': '13' }
        });
      }
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '0' } });
  };

  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = {
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_KEY: 'test-key',
    ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) }
  };

  // < 5 videos -> noindex even with translations present
  const thinTwoRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/actor?name=Takagi%20Misato', { headers: botHeaders }),
    env
  }));
  const thinTwoHtml = await thinTwoRes.text();
  assert.match(thinTwoHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(thinTwoHtml, /<link rel="alternate" hreflang=/);

  const thinFourRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Four%20Video%20Actor', { headers: botHeaders }),
    env
  }));
  assert.match(await thinFourRes.text(), /<meta name="robots" content="noindex, follow">/);

  // English-specific category in German -> noindex, no hreflang
  const deEngSubRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/category?name=Jav%20English%20Sub', { headers: botHeaders }),
    env
  }));
  const deEngSubHtml = await deEngSubRes.text();
  assert.match(deEngSubHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(deEngSubHtml, /<link rel="alternate" hreflang=/);

  // Untranslated locale on >=5 video actor -> noindex, follow + self-canonical + omitted hreflang
  const koUntransRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ko/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const koUntransHtml = await koUntransRes.text();
  assert.match(koUntransHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(koUntransHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/ko\/actor\?name=Mayu%20Nozomi"/);
  assert.doesNotMatch(koUntransHtml, /<link rel="alternate" hreflang=/);

  // English canonical on >=5 video actor -> index, follow + symmetrical hreflangs (en, id, ja + x-default) + rich entity summary & ItemList
  const enMayuRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const enMayuHtml = await enMayuRes.text();
  assert.match(enMayuHtml, /<meta name="robots" content="index, follow/);
  assert.match(enMayuHtml, /hreflang="en" href="https:\/\/www\.missav-j\.com\/en\/actor\?name=Mayu%20Nozomi"/);
  assert.match(enMayuHtml, /hreflang="id" href="https:\/\/www\.missav-j\.com\/id\/actor\?name=Mayu%20Nozomi"/);
  assert.match(enMayuHtml, /hreflang="ja" href="https:\/\/www\.missav-j\.com\/ja\/actor\?name=Mayu%20Nozomi"/);
  assert.match(enMayuHtml, /hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/actor\?name=Mayu%20Nozomi"/);
  assert.doesNotMatch(enMayuHtml, /hreflang="ko"/);
  assert.match(enMayuHtml, /<section class="taxonomy-profile-summary"/);
  assert.match(enMayuHtml, /MYS-100/);
  assert.match(enMayuHtml, /"numberOfItems": 7/);
  assert.match(enMayuHtml, /"itemListElement": \[/);

  // Translated locale -> index, follow + same symmetrical hreflang set + Indonesian titles
  const idMayuRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const idMayuHtml = await idMayuRes.text();
  assert.match(idMayuHtml, /<meta name="robots" content="index, follow/);
  assert.match(idMayuHtml, /hreflang="id" href="https:\/\/www\.missav-j\.com\/id\/actor\?name=Mayu%20Nozomi"/);
  assert.doesNotMatch(idMayuHtml, /hreflang="ko"/);
  assert.match(idMayuHtml, /Judul Bahasa Indonesia 8100/);
});

test('non-enriched minimal Watch SSR renders factual release details, FAQPage, cached Related Videos, and synced enriched entries', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js');

  let relatedFetches = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('myvideo/v1/posts/6031')) {
      return new Response(JSON.stringify({
        id: 6031,
        code: 'CUS-180',
        title: 'CUS-180 Fallen Girl Sample',
        duration: '00:00:00',
        date: '2026-04-01T00:00:00Z',
        embed_url: 'https://server.apijav.com/embed/6031',
        thumbnail: 'https://img.example/6031.jpg',
        actors: [],
        categories: ['English Subtitle'],
        studio: ''
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('myvideo/v1/posts/619')) {
      return new Response(JSON.stringify({
        id: 619,
        code: 'IPTD-508',
        title: 'IPTD-508 Kizaki Jessica',
        embed_url: 'https://server.apijav.com/embed/619',
        thumbnail: 'https://img.example/619.jpg',
        actors: ['Kizaki Jessica'],
        categories: ['English Subtitle'],
        studio: 'IdeaPocket'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('myvideo/v1/posts?') && url.includes('category=English+Subtitle')) {
      relatedFetches += 1;
      return new Response(JSON.stringify([
        { id: 6031, code: 'CUS-180', title: 'CUS-180 Self' },
        { id: 6032, code: 'CUS-181', title: 'Related Title One' },
        { id: 6033, code: 'CUS-182', title: 'Related Title Two' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const socialHeaders = { 'User-Agent': 'Twitterbot/1.0' };
  const env = { ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) } };

  // Social crawler skips Related Videos subrequest
  const socialRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/cus-180-fallen-girl-sample-6031', { headers: socialHeaders }),
    env
  }));
  assert.equal(socialRes.status, 200);
  assert.equal(relatedFetches, 0);

  // Reset page cache by hitting a fresh cache store for Googlebot test
  globalThis.caches = { default: new MemoryCache() };
  const googleRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/cus-180-fallen-girl-sample-6031', { headers: botHeaders }),
    env
  }));
  const googleHtml = await googleRes.text();
  assert.equal(googleRes.status, 200);
  assert.equal(relatedFetches, 1);
  assert.match(googleHtml, /<section class="video-release-details"/);
  assert.doesNotMatch(googleHtml, /Duration:<\/dt><dd[^>]*>00:00:00/);
  assert.match(googleHtml, /"@type": "FAQPage"/);
  assert.match(googleHtml, /<nav aria-label="Related Videos"/);
  assert.match(googleHtml, /CUS-181/);
  assert.doesNotMatch(googleHtml, /CUS-180 Self/);

  // Real synced enriched entry (id 619 from data/seo-enriched-posts.json)
  const enrichedRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/iptd-508-kizaki-jessica-619', { headers: botHeaders }),
    env
  }));
  const enrichedHtml = await enrichedRes.text();
  assert.match(enrichedHtml, /IPTD-508: Kizaki Jessica in IdeaPocket Subtitled/);
  assert.match(enrichedHtml, /<section class="video-ai-enrichment"/);
});

test('encoded %3F/%3D query URLs 301 redirect cleanly and unknown SPA fallback routes return genuine 404', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js');

  let assetFetches = 0;
  const env = {
    ASSETS: {
      fetch: async () => {
        assetFetches += 1;
        return new Response(baseHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }
  };
  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

  // 1. %3F encoded query recovery for human & crawler, preserving %20 spaces and stripping tracking params
  const r1 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor%3Fname%3DNon-Chan'),
    env
  }));
  assert.equal(r1.status, 301);
  assert.equal(r1.headers.get('X-Edge-Mode'), 'ENCODED-QUERY-REDIRECT');
  assert.equal(r1.headers.get('Location'), 'https://www.missav-j.com/en/actor?name=Non-Chan');

  const r2 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ja/actor%3Fname%3DNoriko%20Ito?utm_source=x&ref=abc', { headers: botHeaders }),
    env
  }));
  assert.equal(r2.status, 301);
  assert.equal(r2.headers.get('Location'), 'https://www.missav-j.com/ja/actor?name=Noriko%20Ito');
  assert.equal(assetFetches, 0);

  // 2. Unknown extensionless routes return 404 immediately even when Cloudflare ASSETS.fetch would return 200 index.html
  const notFoundExtless = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ko/definitely-unknown-route', { headers: botHeaders }),
    env
  }));
  assert.equal(notFoundExtless.status, 404);
  assert.equal(notFoundExtless.headers.get('X-Edge-Mode'), 'NOT-FOUND-404');
  assert.equal(assetFetches, 0);
  const notFoundHtml = await notFoundExtless.text();
  assert.match(notFoundHtml, /<html lang="ko">/);
  assert.match(notFoundHtml, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(notFoundHtml, /href="https:\/\/www\.missav-j\.com\/ko\/"/);

  // 3. Extensioned non-html requests that receive Cloudflare's 200 text/html SPA fallback also convert to 404
  const fakeAsset = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/assets/missing-bundle.js'),
    env
  }));
  assert.equal(fakeAsset.status, 404);
  assert.equal(assetFetches, 1);
});

test('Watch SSR enforces noindex on untranslated locales, localizes facts/related/og:locale, skips EN enrichment on non-en, cleans editions, and 301s duplicate IDs', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js', [
    [/const DUPLICATE_VIDEO_CANONICAL_MAP = \{[\s\S]*?\};/, 'const DUPLICATE_VIDEO_CANONICAL_MAP = {"125081":"jura-140-foo-100694"};']
  ]);

  let upstreamPostFetches = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('supabase.test/rest/v1/translations')) {
      if (url.includes('in.(')) {
        return new Response(JSON.stringify([
          { id: 701, translations: { id: 'Judul Terkait Bahasa Indonesia', ko: '한국어 관련 제목', 'zh-TW': '繁體相關標題', 'zh-CN': '简体相关标题' } }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      // Untranslated for id/zh-TW/zh-CN/ko on post 619 and 90837
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/api/posts/619') || url.includes('myvideo/v1/posts/619')) {
      upstreamPostFetches += 1;
      return new Response(JSON.stringify({
        id: 619,
        code: 'IPTD-508',
        title: 'IPTD-508 Original API Title',
        duration: '01:55:00',
        embed_url: 'https://server.apijav.com/embed/619',
        thumbnail: 'https://img.example/619.jpg',
        categories: ['Dramatic'],
        studio: 'IdeaPocket'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/api/posts/90837') || url.includes('myvideo/v1/posts/90837')) {
      return new Response(JSON.stringify({
        id: 90837,
        code: 'ATID-581-ENGLISH-SUBTITLE',
        title: 'ATID-581 Newly Married Teacher',
        duration: '02:00:00',
        embed_url: 'https://server.apijav.com/embed/90837',
        thumbnail: 'https://img.example/90837.jpg',
        categories: ['English Subtitle'],
        studio: 'Attackers'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('myvideo/v1/posts?')) {
      return new Response(JSON.stringify([
        { id: 701, code: 'REL-701', slug: 'rel-701-sample', title: 'Related English Title' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = {
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_KEY: 'test-key',
    ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) }
  };

  // 1. Duplicate video canonical map triggers 301 redirect in Watch SSR before upstream post fetch
  const dupRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ko/watch/jura-140-foo-3-125081', { headers: botHeaders }),
    env
  }));
  assert.equal(dupRes.status, 301);
  assert.equal(dupRes.headers.get('X-Edge-Mode'), 'DUPLICATE-VIDEO-REDIRECT');
  assert.equal(dupRes.headers.get('Location'), 'https://www.missav-j.com/ko/watch/jura-140-foo-100694');
  assert.equal(upstreamPostFetches, 0);

  // 2. Non-en (id) skips English SEO_ENRICHED_POSTS on 619, sets noindex when untranslated, localizes facts & related videos, and sets og:locale
  const idRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/iptd-508-original-api-title-619', { headers: botHeaders }),
    env
  }));
  const idHtml = await idRes.text();
  assert.doesNotMatch(idHtml, /IPTD-508: Kizaki Jessica in IdeaPocket Subtitled/);
  assert.doesNotMatch(idHtml, /<section class="video-ai-enrichment"/);
  assert.match(idHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(idHtml, /<link rel="alternate" hreflang=/);
  assert.match(idHtml, /<meta property="og:locale" id="og-locale" content="id_ID">/);
  assert.match(idHtml, /Judul Terkait Bahasa Indonesia/);

  // 3. Distinct Traditional vs Simplified Chinese fallback facts & og:locale
  const [twRes, cnRes] = await Promise.all([
    onRequest(makeContext({
      request: new Request('https://www.missav-j.com/zh-TW/watch/iptd-508-original-api-title-619', { headers: botHeaders }),
      env
    })),
    onRequest(makeContext({
      request: new Request('https://www.missav-j.com/zh-CN/watch/iptd-508-original-api-title-619', { headers: botHeaders }),
      env
    }))
  ]);
  const [twHtml, cnHtml] = await Promise.all([twRes.text(), cnRes.text()]);
  assert.match(twHtml, /<meta property="og:locale" id="og-locale" content="zh_TW">/);
  assert.match(cnHtml, /<meta property="og:locale" id="og-locale" content="zh_CN">/);
  assert.match(twHtml, /繁體相關標題/);
  assert.match(cnHtml, /简体相关标题/);
  assert.notEqual(twHtml, cnHtml);

  // 4. Edition code suffix cleanup (no [ATID-581-ENGLISH-SUBTITLE] double-prefix; edition label differentiates cleanly)
  const edRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/atid-581-english-subtitle-atid-581-newly-married-teacher-90837', { headers: botHeaders }),
    env
  }));
  const edHtml = await edRes.text();
  assert.doesNotMatch(edHtml, /\[ATID-581-ENGLISH-SUBTITLE\]/);
  assert.match(edHtml, /ATID-581 Newly Married Teacher \(English Subtitle\)/);
  assert.match(edHtml, /"name": "ATID-581 Newly Married Teacher \(English Subtitle\)"/);

  // 5. Client router app.js handles %3F normalization, untranslated watch/unknown route noindex, and edition formatting
  const appSource = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');
  assert.match(appSource, /\/%3f\/i\.test\(window\.location\.pathname\)/);
  assert.match(appSource, /isUnknownRoute/);
  assert.match(appSource, /isUntranslatedWatch/);
  assert.match(appSource, /formatWatchEditionTitle/);
});

test('Watch & Listing SSR recover via retry and stale-if-error backup cache for transient 5xx (GSC 68287 / 14405 patterns)', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = { ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) } };

  // 1. Transient 503 on Attempt 1 + /api/posts fallback recovers cleanly on Retry 2 -> 200 for 68287 & 301 for old 14405 slug
  let attempts68287 = 0;
  let attempts14405 = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('posts/68287')) {
      attempts68287 += 1;
      if (attempts68287 <= 2) return new Response('Upstream busy', { status: 503 });
      return new Response(JSON.stringify({
        id: 68287,
        code: 'FSDSS-314-ENGLISH-SUBTITLE',
        title: 'FSDSS-314 A Ruthless Chase',
        thumbnail: 'https://fourhoi.mrstcdn.store/fsdss-314-english-subtitle/cover-n.jpg',
        studio: 'FALENO',
        categories: ['English Subtitle', 'Drama']
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('posts/14405')) {
      attempts14405 += 1;
      if (attempts14405 <= 2) return new Response('Bad gateway', { status: 502 });
      return new Response(JSON.stringify({
        id: 14405,
        code: 'GGP-005',
        title: 'GGP-005 A Christmas creampie sex party with a super erotic dick that gets hard again and three super',
        thumbnail: 'https://fourhoi.mrstcdn.store/ggp-005/cover-n.jpg',
        studio: 'Other',
        categories: ['4K', 'Creampie']
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const ctx68287 = makeContext({
    request: new Request('https://www.missav-j.com/th/watch/fsdss-314-english-subtitle-fsdss-314-a-ruthless-chase-68287', { headers: botHeaders }),
    env
  });
  const res68287 = await onRequest(ctx68287);
  await settle(ctx68287);
  assert.equal(res68287.status, 200);
  assert.equal(attempts68287, 3);

  const ctx14405 = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/ggp-005-ggp-005-a-christmas-creampie-sex-party-with-a-super-erotic-dick-that-gets-hard-again-and-thr-14405', { headers: botHeaders }),
    env
  });
  const res14405 = await onRequest(ctx14405);
  await settle(ctx14405);
  assert.equal(res14405.status, 301);
  assert.equal(res14405.headers.get('X-Edge-Mode'), 'SEARCH-REDIRECT');
  assert.equal(attempts14405, 3);

  // 2. Evict fresh page + metadata caches (keeping stale backup) and force sustained 503 outage -> serves stale metadata for 301 & 200 with short TTL
  for (const key of [...cache.entries.keys()]) {
    if (!key.includes('__og-metadata-stale')) cache.entries.delete(key);
  }
  globalThis.fetch = async () => new Response('Sustained upstream failure', { status: 503 });

  const stale68287 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/th/watch/fsdss-314-english-subtitle-fsdss-314-a-ruthless-chase-68287', { headers: botHeaders }),
    env
  }));
  assert.equal(stale68287.status, 200);
  assert.equal(stale68287.headers.get('X-Data-Freshness'), 'stale');
  assert.equal(stale68287.headers.get('X-Cache-Status'), 'STALE');
  assert.match(stale68287.headers.get('Cache-Control'), /s-maxage=300/);

  const stale14405 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/ggp-005-ggp-005-a-christmas-creampie-sex-party-with-a-super-erotic-dick-that-gets-hard-again-and-thr-14405', { headers: botHeaders }),
    env
  }));
  assert.equal(stale14405.status, 301);

  // 3. Listing SSR warms __listing-stale and survives subsequent sustained 502 outage after page cache eviction
  let listingCalls = 0;
  globalThis.fetch = async (input) => {
    listingCalls += 1;
    if (String(input).includes('/posts?') && listingCalls === 1) {
      return new Response('Transient 502', { status: 502 });
    }
    return new Response(JSON.stringify([
      { id: 901, code: 'AAA-901', title: 'Sample Listing Video', categories: ['Drama'] }
    ]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '20', 'X-WP-TotalPages': '2' } });
  };
  const warmListCtx = makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Drama', { headers: botHeaders }),
    env
  });
  const warmListRes = await onRequest(warmListCtx);
  await settle(warmListCtx);
  assert.equal(warmListRes.status, 200);
  assert.equal(listingCalls, 2);

  for (const key of [...cache.entries.keys()]) {
    if (!key.includes('__listing-stale')) cache.entries.delete(key);
  }
  globalThis.fetch = async () => new Response('Down', { status: 503 });
  const staleListRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Drama', { headers: botHeaders }),
    env
  }));
  assert.equal(staleListRes.status, 200);
  assert.equal(staleListRes.headers.get('X-Data-Freshness'), 'stale');
});

test('Worker eliminates HTTP 500s via ASSETS shell fallback, HEAD caching, top-level error boundary, and API/img hardening', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const cache = new MemoryCache();
  globalThis.caches = { default: cache };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

  // 1. Warm __human-spa-shell then break env.ASSETS.fetch (500 + throw) -> zero HTTP 500 responses
  const healthyEnv = { ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) } };
  const warmHuman = makeContext({ request: new Request('https://www.missav-j.com/en/'), env: healthyEnv });
  const warmHumanRes = await onRequest(warmHuman);
  await warmHumanRes.text();
  await settle(warmHuman);
  assert.equal(warmHumanRes.status, 200);

  globalThis.fetch = async () => new Response(JSON.stringify({
    id: 555,
    code: 'XYZ-555',
    title: 'XYZ-555 Resilient Assets Test',
    categories: ['Drama']
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const brokenEnv = { ASSETS: { fetch: async () => new Response('asset store error', { status: 500 }) } };
  const recoveredWatch = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/xyz-555-resilient-assets-test-555', { headers: botHeaders }),
    env: brokenEnv
  }));
  assert.equal(recoveredWatch.status, 200);
  assert.match(await recoveredWatch.text(), /XYZ-555 Resilient Assets Test/);

  // Cold ASSETS failure without shell cache returns structured 503 Retry-After, never 500
  globalThis.caches = { default: new MemoryCache() };
  const coldBroken = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/xyz-555-resilient-assets-test-555', { headers: botHeaders }),
    env: { ASSETS: { fetch: async () => { throw new Error('ASSETS outage'); } } }
  }));
  assert.equal(coldBroken.status, 503);
  assert.equal(coldBroken.headers.get('Retry-After'), '120');

  // 2. HEAD populates GET page cache cleanly without stripping cached body for subsequent GET
  globalThis.caches = { default: new MemoryCache() };
  let upstreamCount = 0;
  globalThis.fetch = async (input) => {
    if (String(input).includes('posts/777')) {
      upstreamCount += 1;
      return new Response(JSON.stringify({
        id: 777,
        code: 'HED-777',
        title: 'HED-777 Head Cache Check',
        categories: ['Drama']
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const headCtx = makeContext({
    request: new Request('https://www.missav-j.com/en/watch/hed-777-head-cache-check-777', {
      method: 'HEAD',
      headers: botHeaders
    }),
    env: healthyEnv
  });
  const headRes = await onRequest(headCtx);
  await settle(headCtx);
  assert.equal(headRes.status, 200);
  assert.equal(await headRes.text(), '');

  const getAfterHead = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/hed-777-head-cache-check-777', { headers: botHeaders }),
    env: healthyEnv
  }));
  assert.equal(getAfterHead.status, 200);
  assert.equal(getAfterHead.headers.get('X-Cache-Status'), 'HIT');
  assert.match(await getAfterHead.text(), /HED-777 Head Cache Check/);
  assert.equal(upstreamCount, 1);

  // 3. /api/posts handles non-array Other Studio payload & retries transient 503 cleanly + falls back to stale cache
  const postsMod = await importSource('functions/api/posts/[[id]].js');
  globalThis.caches = { default: new MemoryCache() };
  let postsAttempts = 0;
  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.includes('studio=') || !u.includes('/posts/')) {
      postsAttempts += 1;
      if (postsAttempts === 1) return new Response(JSON.stringify({ error: 'unexpected object' }), { status: 200 });
      if (postsAttempts === 2) return new Response(JSON.stringify([{ id: 10, studio: '', title: 'Indie Post' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('[]', { status: 200 });
  };
  const otherCtx = makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&studio=Other&page=1'),
    env: {},
    params: { id: [] }
  });
  const otherRes = await postsMod.onRequest(otherCtx);
  await settle(otherCtx);
  assert.equal(otherRes.status, 200);
  const otherData = await otherRes.json();
  assert.equal(otherData.length, 1);
  assert.equal(postsAttempts, 2);

  // Evict fresh /api/posts cache and fail upstream with 503 -> serves stale backup
  for (const k of [...globalThis.caches.default.entries.keys()]) {
    if (!k.includes('__stale_backup=1')) globalThis.caches.default.entries.delete(k);
  }
  globalThis.fetch = async () => new Response('down', { status: 503 });
  const staleApiPosts = await postsMod.onRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=en&studio=Other&page=1'),
    env: {},
    params: { id: [] }
  }));
  assert.equal(staleApiPosts.status, 200);
  assert.equal(staleApiPosts.headers.get('X-Data-Freshness'), 'stale');

  // 4. /api/player retries transient 502 and serves stale backup on outage
  const playerMod = await importSource('functions/api/player/[[id]].js');
  globalThis.caches = { default: new MemoryCache() };
  let playerCalls = 0;
  globalThis.fetch = async () => {
    playerCalls += 1;
    if (playerCalls === 1) return new Response('bad gateway', { status: 502 });
    return new Response(JSON.stringify({ iframe_html: '<iframe src="https://example.com"></iframe>' }), { status: 200 });
  };
  const pCtx = makeContext({
    request: new Request('https://www.missav-j.com/api/player/888'),
    env: {},
    params: { id: ['888'] }
  });
  const pRes = await playerMod.onRequest(pCtx);
  await settle(pCtx);
  assert.equal(pRes.status, 200);
  assert.equal(playerCalls, 2);

  // 5. /img proxy retries transient 502 while preserving streaming without buffering arrayBuffer()
  const imgMod = await importSource('functions/img/[[path]].js');
  globalThis.caches = { default: new MemoryCache() };
  let imgCalls = 0;
  let buffered = false;
  globalThis.fetch = async () => {
    imgCalls += 1;
    if (imgCalls === 1) return new Response('cdn hiccup', { status: 502 });
    const streamRes = new Response(new Uint8Array([9, 8, 7]), {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' }
    });
    streamRes.arrayBuffer = async () => { buffered = true; throw new Error('must stream'); };
    return streamRes;
  };
  const encodedImg = Buffer.from('https://pics.dmm.co.jp/retry-ok.jpg').toString('base64url');
  const imgCtx = makeContext({
    request: new Request(`https://www.missav-j.com/img/${encodedImg}.jpg`),
    params: { path: [`${encodedImg}.jpg`] }
  });
  const imgRes = await imgMod.onRequest(imgCtx);
  assert.equal(imgRes.status, 200);
  assert.deepEqual([...new Uint8Array(await imgRes.arrayBuffer())], [9, 8, 7]);
  await settle(imgCtx);
  assert.equal(imgCalls, 2);
  assert.equal(buffered, false);
});

test('404 prevention: duplicate clone redirects (human + bot), ?id= watch queries, case normalization, and noindex 404 headers', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js');

  let upstreamPostCalls = 0;
  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.includes('/posts/32079')) {
      upstreamPostCalls += 1;
      return new Response(JSON.stringify({
        id: 32079,
        code: 'HEYZO-3360',
        title: 'HEYZO-3360 Sample Title',
        slug: 'heyzo-3360-sample-title',
        duration: '00:55:00',
        embed_url: 'https://server.apijav.com/embed/32079',
        thumbnail: 'https://img.example/32079.jpg'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const env = {
    ASSETS: { fetch: async () => new Response(baseHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }) }
  };
  const googleHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const socialHeaders = { 'User-Agent': 'TelegramBot (like TwitterBot)' };
  const humanHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' };

  // 1. GSC 404 example (/de/watch/...-113561) and ?id=113561 both 301 to canonical -32079 for humans AND bots with 0 upstream calls
  for (const reqUrl of [
    'https://www.missav-j.com/de/watch/heyzo-3360-heyzo-3360-an-unattractive-married-woman-listens-to-her-japanese-husbands-wishes-and-has-113561',
    'https://www.missav-j.com/de/watch?id=113561'
  ]) {
    for (const hdrs of [googleHeaders, humanHeaders]) {
      const res = await onRequest(makeContext({ request: new Request(reqUrl, { headers: hdrs }), env }));
      assert.equal(res.status, 301);
      assert.equal(res.headers.get('X-Edge-Mode'), 'DUPLICATE-VIDEO-REDIRECT');
      assert.match(res.headers.get('Location'), /^https:\/\/www\.missav-j\.com\/de\/watch\/heyzo-3360-.*-32079$/);
    }
  }
  assert.equal(upstreamPostCalls, 0);

  // 2. Non-duplicate /en/watch?id=32079 & /watch?id=32079 resolve for Googlebot (301 canonical), Social (200 SSR), and humans (200 shell)
  for (const qUrl of ['https://www.missav-j.com/en/watch?id=32079', 'https://www.missav-j.com/watch?id=32079']) {
    const botRes = await onRequest(makeContext({ request: new Request(qUrl, { headers: googleHeaders }), env }));
    assert.equal(botRes.status, 301);
    assert.equal(botRes.headers.get('X-Edge-Mode'), 'SEARCH-REDIRECT');
    assert.equal(botRes.headers.get('Location'), 'https://www.missav-j.com/en/watch/heyzo-3360-sample-title-32079');
  }

  const socialRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch?id=32079', { headers: socialHeaders }),
    env
  }));
  assert.equal(socialRes.status, 200);
  const socialHtml = await socialRes.text();
  assert.match(socialHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/en\/watch\/heyzo-3360-sample-title-32079"/);

  const humanQueryRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch?id=32079', { headers: humanHeaders }),
    env
  }));
  assert.equal(humanQueryRes.status, 200);

  // 3. Invalid or empty /en/watch without ID returns structured WATCH-SSR-404 HTML with X-Robots-Tag: noindex, follow
  for (const badWatchUrl of ['https://www.missav-j.com/en/watch', 'https://www.missav-j.com/en/watch?id=abc']) {
    const badRes = await onRequest(makeContext({ request: new Request(badWatchUrl, { headers: googleHeaders }), env }));
    assert.equal(badRes.status, 404);
    assert.equal(badRes.headers.get('X-Edge-Mode'), 'WATCH-SSR-404');
    assert.equal(badRes.headers.get('X-Robots-Tag'), 'noindex, follow');
    assert.equal(badRes.headers.get('Cache-Control'), 'no-store');
    assert.match(await badRes.text(), /<meta name="robots" content="noindex, follow" \/>/);
  }

  // 4. Case & trailing-slash normalization (single hop 301s) without catching invalid subpaths
  const caseCases = [
    ['https://www.missav-j.com/EN/trending', 'https://www.missav-j.com/en/trending', 'LANG-CASE-REDIRECT'],
    ['https://www.missav-j.com/en/Trending/', 'https://www.missav-j.com/en/trending', 'ROUTE-CASE-REDIRECT'],
    ['https://www.missav-j.com/zh-cn/Actors', 'https://www.missav-j.com/zh-CN/actors', 'LANG-CASE-REDIRECT'],
    ['https://www.missav-j.com/ja/Category?name=Drama', 'https://www.missav-j.com/ja/category?name=Drama', 'ROUTE-CASE-REDIRECT'],
    ['https://www.missav-j.com/EN/Watch/test-123', 'https://www.missav-j.com/en/watch/test-123', 'LANG-CASE-REDIRECT'],
    ['https://www.missav-j.com/ZH-TW', 'https://www.missav-j.com/zh-TW/', 'LANG-CASE-REDIRECT'],
    ['https://www.missav-j.com/en/trending/', 'https://www.missav-j.com/en/trending', 'STRIP-TRAILING-SLASH-REDIRECT']
  ];
  for (const [inputUrl, expectedLoc, expectedMode] of caseCases) {
    const cRes = await onRequest(makeContext({ request: new Request(inputUrl, { headers: googleHeaders }), env }));
    assert.equal(cRes.status, 301, `Expected 301 for ${inputUrl}`);
    assert.equal(cRes.headers.get('Location'), expectedLoc);
    assert.equal(cRes.headers.get('X-Edge-Mode'), expectedMode);
  }

  // Unknown subpaths still return genuine 404 NOT-FOUND-404 with X-Robots-Tag
  for (const badPath of ['https://www.missav-j.com/en/actors/extra', 'https://www.missav-j.com/EN/unknown-route']) {
    const r = await onRequest(makeContext({ request: new Request(badPath, { headers: googleHeaders }), env }));
    assert.equal(r.status, 404);
    assert.equal(r.headers.get('X-Edge-Mode'), 'NOT-FOUND-404');
    assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, follow');
  }

  // 5. Client router app.js parseUrl normalizes language & route case cleanly
  const appSource = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');
  const parseUrlMatch = appSource.match(/function parseUrl\(urlPath\)\s*\{[\s\S]*?\n\}/);
  assert.ok(parseUrlMatch, 'parseUrl function must exist in assets/js/app.js');
  const stubI18n = {
    LANGS: [{ code: 'en' }, { code: 'zh-CN' }, { code: 'zh-TW' }, { code: 'ja' }],
    getLang: () => 'en'
  };
  const parseUrlFn = new Function('i18n', `${parseUrlMatch[0]}; return parseUrl;`)(stubI18n);
  assert.deepEqual(parseUrlFn('/EN/Trending/'), { lang: 'en', routePath: '/trending' });
  assert.deepEqual(parseUrlFn('/zh-cn/Actors'), { lang: 'zh-CN', routePath: '/actors' });
  assert.deepEqual(parseUrlFn('/en/Watch/Heyzo-123'), { lang: 'en', routePath: '/watch/Heyzo-123' });
});

test('video indexing fix: above-fold eager SSR iframe, ?mvapm_embed fallback, VideoObject guards, and non-occluded bot player.js', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const { onRequest } = await importSource('functions/[[catchall]].js');

  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.includes('/posts/4110')) {
      return new Response(JSON.stringify({
        id: 4110,
        code: 'H4610-KI230907',
        title: 'H4610-KI230907 Miyuki 24 years old',
        slug: 'h4610-ki230907-miyuki-24-years-old',
        thumbnail: 'https://fourhoi.mrstcdn.store/h4610-ki230907/cover-n.jpg',
        embed_url: '',
        categories: ['Amateur'],
        studio: 'H4610'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('/posts/555111')) {
      return new Response(JSON.stringify({
        id: 555111,
        code: 'NOTHUMB-001',
        title: 'Thumbnail Missing Sample Video',
        slug: 'thumbnail-missing-sample-video',
        thumbnail: '',
        duration: '00:00:00',
        embed_url: ''
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const env = {
    ASSETS: { fetch: async () => new Response(baseHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }) }
  };
  const googleHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };

  // 1. Indexable EN Watch SSR: iframe placed above-the-fold before poster <img> & details, no loading="lazy", ?mvapm_embed fallback
  const enWatchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/h4610-ki230907-miyuki-24-years-old-4110', { headers: googleHeaders }),
    env
  }));
  const enHtml = await enWatchRes.text();
  assert.equal(enWatchRes.status, 200);
  const seoIdx = enHtml.indexOf('<div class="seo-fallback"');
  const iframeIdx = enHtml.indexOf('<iframe', seoIdx);
  const imgIdx = enHtml.indexOf('<img', seoIdx);
  const detailsIdx = enHtml.indexOf('video-release-details', seoIdx);
  assert.ok(iframeIdx > seoIdx && imgIdx > iframeIdx, 'Watch SSR must render <iframe> before poster <img>');
  assert.ok(detailsIdx === -1 || detailsIdx > iframeIdx, 'Watch SSR must render <iframe> before editorial details');
  assert.match(enHtml.slice(iframeIdx, iframeIdx + 450), /src="https:\/\/server\.apijav\.com\/\?mvapm_embed=4110"/);
  assert.match(enHtml.slice(iframeIdx, iframeIdx + 450), /width="800"[\s\S]*height="450"/);
  assert.doesNotMatch(enHtml.slice(iframeIdx, iframeIdx + 450), /loading=["']lazy["']/);
  assert.doesNotMatch(enHtml, /server\.apijav\.com\/embed\//);
  assert.match(enHtml, /"@type":\s*"VideoObject"/);
  assert.match(enHtml, /"embedUrl":\s*"https:\/\/server\.apijav\.com\/\?mvapm_embed=4110"/);
  assert.match(enHtml, /"uploadDate":\s*"2026-01-01T00:00:00\.000Z"/);

  // 2. Thumbnail-less Watch SSR (e.g. 33 standard_only_videos): keeps visible <iframe> & BreadcrumbList, skips VideoObject with logo.webp
  const noThumbRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/nothumb-001-thumbnail-missing-sample-video-555111', { headers: googleHeaders }),
    env
  }));
  const noThumbHtml = await noThumbRes.text();
  assert.equal(noThumbRes.status, 200);
  assert.match(noThumbHtml, /<iframe[\s\S]*src="https:\/\/server\.apijav\.com\/\?mvapm_embed=555111"/);
  assert.match(noThumbHtml, /"@type":\s*"BreadcrumbList"/);
  assert.doesNotMatch(noThumbHtml, /"@type":\s*"VideoObject"/);

  // 3. Untranslated non-EN Watch SSR (noindex, follow) skips VideoObject while preserving BreadcrumbList & FAQPage
  const frWatchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/fr/watch/h4610-ki230907-miyuki-24-years-old-4110', { headers: googleHeaders }),
    env
  }));
  const frHtml = await frWatchRes.text();
  assert.equal(frWatchRes.status, 200);
  assert.match(frHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(frHtml, /"@type":\s*"BreadcrumbList"/);
  assert.doesNotMatch(frHtml, /"@type":\s*"VideoObject"/);

  // 4. Client metadata app.js uses ?mvapm_embed= fallback & syncs VideoObject guards
  const appSource = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');
  assert.doesNotMatch(appSource, /server\.apijav\.com\/embed\//);
  assert.match(appSource, /server\.apijav\.com\/\?mvapm_embed=/);
  assert.match(appSource, /shouldEmitVideoObject\s*=\s*Boolean\(!isNoindex && hasValidThumbnail/);

  // 5. Client WRS player.js keeps #floating-player-wrapper hidden for Googlebot (no black mode-theater overlay over inline bot iframe)
  const makeClassList = (initial = []) => {
    const set = new Set(initial);
    return {
      add: (...cls) => cls.forEach(c => set.add(c)),
      remove: (...cls) => cls.forEach(c => set.delete(c)),
      contains: c => set.has(c)
    };
  };
  const makeEl = (id, initialClasses = []) => ({
    id,
    innerHTML: '',
    textContent: '',
    href: '',
    style: {},
    dataset: {},
    classList: makeClassList(initialClasses),
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    addEventListener() {},
    getBoundingClientRect: () => ({ top: 80, left: 20, width: 800, height: 450 }),
    querySelector: () => null
  });

  const savedGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    navigatorDesc: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    localStorage: globalThis.localStorage,
    ResizeObserver: globalThis.ResizeObserver
  };

  try {
    const { init: initPlayer } = await importSource('assets/js/player.js', [
      [/^import\s+api\s+from\s+'[^']+';/m, `const api = {
        async getPost(id) { return { id: Number(id), code: 'H4610-KI230907', title: 'Test Video', thumbnail: '', embed_url: '' }; },
        async getPlayer() { return { iframe_html: '<iframe src="https://server.apijav.com/?mvapm_embed=4110" loading="lazy"></iframe>' }; },
        async getPosts() { return []; }
      };`],
      [/^import\s+ui\s+from\s+'[^']+';/m, `const ui = {
        showError() {},
        showSkeletonsInElement() {},
        showToast() {},
        escapeHTML: s => String(s || ''),
        getProxiedThumbnail: s => s || '',
        setRobotsMeta() {}
      };`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/feed\.js[^']*';/m, `const renderVideoCard = () => ''; const getDeterministicDuration = () => '45:00'; const resolveStudioAlias = s => s;`],
      [/^import\s+i18n\s+from\s+'[^']+';/m, `const i18n = { t: k => k, getLang: () => 'en', translateVideoTitle: t => t };`],
      [/^import\s+ReferralSystem\s+from\s+'[^']+';/m, `const ReferralSystem = {};`],
      [/^import\s+\{\s*Analytics\s*\}\s+from\s+'[^']+';/m, `const Analytics = { trackVideoPlay() {} };`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/related-strategy\.js[^']*';/m, `const MIN_RELATED_RESULTS = 6; const getPrimaryRelatedQuery = () => ({}); const getFallbackRelatedQuery = () => ({});`]
    ]);

    const runPlayerMode = async (ua) => {
      const floatWrapper = makeEl('floating-player-wrapper', ['floating-player-wrapper', 'hidden']);
      const playerContainer = makeEl('player-container');
      const inlinePlaceholder = makeEl('inline-placeholder', ['player-container-placeholder']);
      const elements = {
        'app-content': makeEl('app-content'),
        'floating-player-wrapper': floatWrapper,
        'player-container': playerContainer,
        'related-videos-list': makeEl('related-videos-list'),
        'player-title': makeEl('player-title'),
        'like-btn': makeEl('like-btn'),
        'dislike-btn': makeEl('dislike-btn'),
        'like-count': makeEl('like-count'),
        'dislike-count': makeEl('dislike-count')
      };
      globalThis.window = {
        scrollY: 0,
        scrollX: 0,
        location: { pathname: '/en/watch/h4610-4110', search: '', origin: 'https://www.missav-j.com' },
        missavJState: { activeVideo: null, currentPath: '/watch', history: [] },
        missavJGetCurrentWatchId: () => '4110',
        missavJUpdateSEOTags() {}
      };
      globalThis.document = {
        title: '',
        getElementById: id => elements[id] || null,
        querySelector: sel => (sel === '.player-container-placeholder' ? inlinePlaceholder : null)
      };
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: ua },
        configurable: true,
        writable: true
      });
      globalThis.localStorage = { setItem() {}, getItem: () => null };
      globalThis.ResizeObserver = class { observe() {} disconnect() {} };

      await initPlayer('4110');
      return { floatWrapper, playerContainer, inlinePlaceholder };
    };

    const botView = await runPlayerMode('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    assert.equal(botView.floatWrapper.classList.contains('hidden'), true, '#floating-player-wrapper must stay hidden for bots');
    assert.equal(botView.floatWrapper.classList.contains('mode-theater'), false, 'mode-theater must not overlay bot iframe');
    assert.match(botView.inlinePlaceholder.innerHTML, /<iframe[^>]*src="https:\/\/server\.apijav\.com\/\?mvapm_embed=4110"/);
    assert.match(botView.inlinePlaceholder.innerHTML, /width="800" height="450"/);
    assert.doesNotMatch(botView.inlinePlaceholder.innerHTML, /loading=["']lazy["']/);

    const humanView = await runPlayerMode('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    assert.equal(humanView.floatWrapper.classList.contains('hidden'), false, '#floating-player-wrapper stays active for real users');
    assert.equal(humanView.floatWrapper.classList.contains('mode-theater'), true);
    assert.match(humanView.playerContainer.innerHTML, /player-custom-poster/);
  } finally {
    globalThis.window = savedGlobals.window;
    globalThis.document = savedGlobals.document;
    globalThis.localStorage = savedGlobals.localStorage;
    globalThis.ResizeObserver = savedGlobals.ResizeObserver;
    if (savedGlobals.navigatorDesc) {
      Object.defineProperty(globalThis, 'navigator', savedGlobals.navigatorDesc);
    }
  }
});
