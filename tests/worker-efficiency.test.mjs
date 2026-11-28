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

test('Watch SSR consolidates indexing on canonical English (A1), marks non-EN watch noindex, and keeps batch listing translations', async () => {
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

  let enSupabaseSingleCalls = 0;
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('supabase.example/rest/v1/translations?id=eq.771')) {
      enSupabaseSingleCalls++;
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

  // 1. Canonical English watch URL is indexable, emits ONLY en + x-default hreflang, skips Supabase lookup, and emits VideoObject
  globalThis.caches = { default: new MemoryCache() };
  const enWatchRes = await onRequest(makeBotCtx('https://www.missav-j.com/en/watch/h0930-ki180818-request-work-collection-771'));
  const enWatchHtml = await enWatchRes.text();
  assert.equal(enWatchRes.status, 200);
  assert.equal(enSupabaseSingleCalls, 0, 'EN watch SSR must skip single-post Supabase translation fetch');
  assert.match(enWatchHtml, /<meta name="robots" content="index, follow/);
  assert.match(enWatchHtml, /"@type":\s*"VideoObject"/);
  assert.match(enWatchHtml, /"inLanguage":\s*"en"/);
  assert.match(enWatchHtml, /hreflang="en" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(enWatchHtml, /hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.doesNotMatch(enWatchHtml, /hreflang="(?:id|fr|ko|ms|de|ja)"/);
  assert.match(enWatchHtml, /data-ssr-watch-id="771"/);
  assert.match(enWatchHtml, /data-watch-hreflangs="en"/);

  // 2. Translated /id/ watch URL stays readable/localized for users & social previews, but is noindex + omits hreflang & VideoObject
  const idWatchRes = await onRequest(makeBotCtx('https://www.missav-j.com/id/watch/h0930-ki180818-request-work-collection-771'));
  const idWatchHtml = await idWatchRes.text();
  assert.equal(idWatchRes.status, 200);
  assert.match(idWatchHtml, /Koleksi Permintaan Kerja/);
  assert.match(idWatchHtml, /<strong>Aktris:<\/strong>/);
  assert.match(idWatchHtml, /<strong>Kategori:<\/strong>/);
  assert.match(idWatchHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(idWatchHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/id\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(idWatchHtml, /data-watch-hreflangs=""/);
  assert.doesNotMatch(idWatchHtml, /rel="alternate" hreflang=/);
  assert.doesNotMatch(idWatchHtml, /"@type":\s*"VideoObject"/);

  // 3. Untranslated /ko/ watch URL stays self-canonical, noindex, and omits hreflang tags
  const koWatchRes = await onRequest(makeBotCtx('https://www.missav-j.com/ko/watch/h0930-ki180818-request-work-collection-771'));
  const koWatchHtml = await koWatchRes.text();
  assert.equal(koWatchRes.status, 200);
  assert.match(koWatchHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(koWatchHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/ko\/watch\/h0930-ki180818-request-work-collection-771"/);
  assert.match(koWatchHtml, /data-watch-hreflangs=""/);
  assert.doesNotMatch(koWatchHtml, /rel="alternate" hreflang=/);

  // 4. Listing SSR uses localized BreadcrumbList & translated catalog titles while routing Googlebot links to canonical /en/watch/
  const idTrendingRes = await onRequest(makeBotCtx('https://www.missav-j.com/id/trending'));
  const idTrendingHtml = await idTrendingRes.text();
  assert.equal(idTrendingRes.status, 200);
  assert.match(idTrendingHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(idTrendingHtml, /"name":\s*"Beranda"/);
  assert.match(idTrendingHtml, /href="\/en\/watch\/h0930-ki180818-request-work-collection-771"[\s\S]*Koleksi Permintaan Kerja/);
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
  assert.deepEqual(frJson.available_hreflangs, []);

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
  assert.match(entityWatchHtml, /href="\/en\/studio\?name=Moody's"/);
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

  // Same-video legacy translated slug and double-code alias -> 301 SEARCH-REDIRECT directly to canonical /en/watch/ for Googlebot
  const translatedAlias = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/jur-231-english-subtitle-jur-231-hari-hari-gangbang-115025', { headers: botHeaders }),
    env
  }));
  assert.equal(translatedAlias.status, 301);
  assert.equal(translatedAlias.headers.get('Location'), 'https://www.missav-j.com/en/watch/jur-231-english-subtitle-jur-231-the-days-of-creampie-gangbang-115025');

  const doubleCodeAlias = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/watch/okb-190-okb-190-mika-sumikawa-118079', { headers: botHeaders }),
    env
  }));
  assert.equal(doubleCodeAlias.status, 301);
  assert.equal(doubleCodeAlias.headers.get('Location'), 'https://www.missav-j.com/en/watch/okb-190-mika-sumikawa-118079');
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

test('dynamic taxonomies enforce >=8 actor / >=5 category thresholds, translation-gated Option 1A, and rich entity summaries', async () => {
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
      if (actor === 'Seven Video Actor') {
        return new Response(JSON.stringify(samplePosts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '7', 'X-WP-TotalPages': '1' }
        });
      }
      if (actor === 'Mayu Nozomi') {
        return new Response(JSON.stringify(samplePosts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '10', 'X-WP-TotalPages': '1' }
        });
      }
      if (cat === 'Five Video Cat') {
        return new Response(JSON.stringify(samplePosts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-WP-Total': '5', 'X-WP-TotalPages': '1' }
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

  // < 8 videos on actor -> noindex even with translations present
  const thinTwoRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/actor?name=Takagi%20Misato', { headers: botHeaders }),
    env
  }));
  const thinTwoHtml = await thinTwoRes.text();
  assert.match(thinTwoHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(thinTwoHtml, /<link rel="alternate" hreflang=/);

  const thinSevenActorRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Seven%20Video%20Actor', { headers: botHeaders }),
    env
  }));
  const thinSevenActorHtml = await thinSevenActorRes.text();
  assert.match(thinSevenActorHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(thinSevenActorHtml, /<link rel="alternate" hreflang=/);

  // Category threshold stays at >= 5 videos -> indexable on 5 videos
  const fiveCatRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Five%20Video%20Cat', { headers: botHeaders }),
    env
  }));
  assert.match(await fiveCatRes.text(), /<meta name="robots" content="index, follow/);

  // English-specific category in German -> noindex, no hreflang
  const deEngSubRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/category?name=Jav%20English%20Sub', { headers: botHeaders }),
    env
  }));
  const deEngSubHtml = await deEngSubRes.text();
  assert.match(deEngSubHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(deEngSubHtml, /<link rel="alternate" hreflang=/);

  // Untranslated locale on >=8 video actor -> noindex, follow + self-canonical + omitted hreflang
  const koUntransRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ko/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const koUntransHtml = await koUntransRes.text();
  assert.match(koUntransHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(koUntransHtml, /<link rel="canonical" id="canonical-url" href="https:\/\/www\.missav-j\.com\/ko\/actor\?name=Mayu%20Nozomi"/);
  assert.doesNotMatch(koUntransHtml, /<link rel="alternate" hreflang=/);

  // English canonical on >=8 video actor -> index, follow + EN-only hreflang (en + x-default) + rich entity summary & ItemList
  const enMayuRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const enMayuHtml = await enMayuRes.text();
  assert.match(enMayuHtml, /<meta name="robots" content="index, follow/);
  assert.match(enMayuHtml, /hreflang="en" href="https:\/\/www\.missav-j\.com\/en\/actor\?name=Mayu%20Nozomi"/);
  assert.match(enMayuHtml, /hreflang="x-default" href="https:\/\/www\.missav-j\.com\/en\/actor\?name=Mayu%20Nozomi"/);
  assert.doesNotMatch(enMayuHtml, /hreflang="(?:id|ja|ko|fr|de)"/);
  assert.match(enMayuHtml, /<section class="taxonomy-profile-summary"/);
  assert.match(enMayuHtml, /MYS-100/);
  assert.match(enMayuHtml, /"numberOfItems": 10/);
  assert.match(enMayuHtml, /"itemListElement": \[/);

  // Non-EN dynamic taxonomy -> noindex, follow + omitted hreflang while keeping localized titles & canonical /en/watch/ links
  const idMayuRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/id/actor?name=Mayu%20Nozomi', { headers: botHeaders }),
    env
  }));
  const idMayuHtml = await idMayuRes.text();
  assert.match(idMayuHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(idMayuHtml, /<link rel="alternate" hreflang=/);
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

  // 1. Duplicate video canonical map triggers 301 redirect straight to canonical /en/watch/ for Googlebot (0 upstream calls)
  const dupRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ko/watch/jura-140-foo-3-125081', { headers: botHeaders }),
    env
  }));
  assert.equal(dupRes.status, 301);
  assert.equal(dupRes.headers.get('X-Edge-Mode'), 'DUPLICATE-VIDEO-REDIRECT');
  assert.equal(dupRes.headers.get('Location'), 'https://www.missav-j.com/en/watch/jura-140-foo-100694');
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

  // 5. Client router app.js handles %3F normalization, non-EN watch/unknown route noindex, and edition formatting
  const appSource = await readFile(new URL('assets/js/app.js', ROOT), 'utf8');
  assert.match(appSource, /\/%3f\/i\.test\(window\.location\.pathname\)/);
  assert.match(appSource, /isUnknownRoute/);
  assert.match(appSource, /isNonEnLocale/);
  assert.match(appSource, /routePath === '\/tag'/);
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

  // 1. GSC 404 example (/de/watch/...-113561) and ?id=113561 both 301 to canonical -32079:
  //    Googlebot goes directly to indexable /en/watch/, while humans keep /de/watch/ (0 upstream calls)
  for (const reqUrl of [
    'https://www.missav-j.com/de/watch/heyzo-3360-heyzo-3360-an-unattractive-married-woman-listens-to-her-japanese-husbands-wishes-and-has-113561',
    'https://www.missav-j.com/de/watch?id=113561'
  ]) {
    const botDupRes = await onRequest(makeContext({ request: new Request(reqUrl, { headers: googleHeaders }), env }));
    assert.equal(botDupRes.status, 301);
    assert.equal(botDupRes.headers.get('X-Edge-Mode'), 'DUPLICATE-VIDEO-REDIRECT');
    assert.match(botDupRes.headers.get('Location'), /^https:\/\/www\.missav-j\.com\/en\/watch\/heyzo-3360-.*-32079$/);

    const humanDupRes = await onRequest(makeContext({ request: new Request(reqUrl, { headers: humanHeaders }), env }));
    assert.equal(humanDupRes.status, 301);
    assert.equal(humanDupRes.headers.get('X-Edge-Mode'), 'DUPLICATE-VIDEO-REDIRECT');
    assert.match(humanDupRes.headers.get('Location'), /^https:\/\/www\.missav-j\.com\/de\/watch\/heyzo-3360-.*-32079$/);
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

  // 1. Indexable EN Watch SSR: iframe placed first above-the-fold before <h1> & details, no duplicate poster <img>, no loading="lazy", ?mvapm_embed fallback
  const enWatchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/h4610-ki230907-miyuki-24-years-old-4110', { headers: googleHeaders }),
    env
  }));
  const enHtml = await enWatchRes.text();
  assert.equal(enWatchRes.status, 200);
  const seoIdx = enHtml.indexOf('<div class="seo-fallback"');
  const iframeIdx = enHtml.indexOf('<iframe', seoIdx);
  const h1Idx = enHtml.indexOf('<h1>', seoIdx);
  const detailsIdx = enHtml.indexOf('video-release-details', seoIdx);
  assert.ok(iframeIdx > seoIdx && h1Idx > iframeIdx, 'Watch SSR must render <iframe> first before <h1> above the fold');
  assert.doesNotMatch(enHtml.slice(seoIdx), /<img[^>]*width="800"[^>]*height="450"/, 'Watch SSR must not emit duplicate 800x450 poster <img> below iframe');
  assert.ok(detailsIdx === -1 || detailsIdx > iframeIdx, 'Watch SSR must render <iframe> before editorial details');
  assert.match(enHtml.slice(iframeIdx, iframeIdx + 450), /src="https:\/\/server\.apijav\.com\/\?mvapm_embed=4110"/);
  assert.match(enHtml.slice(iframeIdx, iframeIdx + 450), /width="800"[\s\S]*height="450"/);
  assert.doesNotMatch(enHtml.slice(iframeIdx, iframeIdx + 450), /loading=["']lazy["']/);
  assert.doesNotMatch(enHtml, /server\.apijav\.com\/embed\//);
  assert.match(enHtml, /"@type":\s*"VideoObject"/);
  assert.match(enHtml, /"embedUrl":\s*"https:\/\/server\.apijav\.com\/\?mvapm_embed=4110"/);
  assert.match(enHtml, /"width":\s*800/);
  assert.match(enHtml, /"height":\s*450/);
  assert.match(enHtml, /"mainEntityOfPage":\s*\{\s*"@type":\s*"WebPage"/);
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
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/related-strategy\.js[^']*';/m, `const MIN_RELATED_RESULTS = 6; const getPrimaryRelatedQuery = () => ({}); const getFallbackRelatedQuery = () => ({});`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, `const loadIndexableTaxonomies = async () => {}; const renderTaxonomyLink = ({ type, name, lang, className, label, dataAttrs = '' }) => \`<a href="/\${lang}/\${type}?name=\${encodeURIComponent(name)}" class="\${className}"\${dataAttrs ? ' ' + dataAttrs : ''}>\${label}</a>\`;`]
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

test('growth SEO upgrades: 8 related links, 24-item SSR pagination, Kanji ProfilePage, Home hubs, PWA manifest, multi-page enrich & IndexNow', async () => {
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const feedJs = await readFile(new URL('assets/js/feed.js', ROOT), 'utf8');
  const uiJs = await readFile(new URL('assets/js/ui.js', ROOT), 'utf8');
  const manifestRaw = JSON.parse(await readFile(new URL('manifest.json', ROOT), 'utf8'));
  const playerJs = await readFile(new URL('assets/js/player.js', ROOT), 'utf8');

  // 1. PWA manifest MIME/size alignment & monetization/X/alt-site preservation
  assert.ok(manifestRaw.icons.some(ic => ic.src === '/assets/favicon.png' && ic.type === 'image/png' && ic.sizes === '192x192'));
  assert.ok(!manifestRaw.icons.some(ic => ic.src.endsWith('.webp') && ic.type === 'image/png'));
  assert.match(baseHtml, /glamournakedemployee\.com/);
  assert.match(baseHtml, /benchform\.org/);
  assert.match(baseHtml, /biomanos\.org/);
  assert.match(feedJs, /maintAltBtn1/);
  assert.match(uiJs, /maintAltBtn1/);
  assert.match(playerJs, /opt-x/);
  assert.match(playerJs, /opt-x-viral/);

  const { onRequest } = await importSource('functions/[[catchall]].js');
  const listingRequestedUrls = [];
  const batchPosts = Array.from({ length: 24 }, (_, idx) => ({
    id: 95000 + idx,
    code: `SSIS-${500 + idx}`,
    slug: `ssis-${500 + idx}-sample-${idx}`,
    title: `SSIS-${500 + idx} Sample Feature ${idx}`,
    thumbnail: `https://img.example/${95000 + idx}.jpg`,
    actors: ['Yua Mikami'],
    studio: 'S1',
    categories: ['Uncensored'],
    duration: '02:00:00'
  }));
  const relatedPool = Array.from({ length: 10 }, (_, idx) => ({
    id: 88000 + idx,
    code: `REL-${800 + idx}`,
    slug: `rel-${800 + idx}-video`,
    title: `Related Video ${idx}`,
    actors: ['Yua Mikami']
  }));

  let watchRelatedCalls = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('supabase.test/rest/v1/translations')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('myvideo/v1/posts/99123')) {
      return new Response(JSON.stringify({
        id: 99123,
        code: 'SSIS-999-ENGLISH-SUBTITLE',
        slug: 'ssis-999-english-subtitle-exclusive-feature',
        title: 'SSIS-999 Exclusive Feature',
        duration: '02:15:00',
        embed_url: 'https://server.apijav.com/embed/99123',
        thumbnail: 'https://img.example/99123.jpg',
        actors: ['Yua Mikami'],
        categories: ['Uncensored', 'English Subtitle'],
        studio: 'S1'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('myvideo/v1/posts?')) {
      listingRequestedUrls.push(url);
      if (url.includes('per_page=16')) {
        watchRelatedCalls += 1;
        return new Response(JSON.stringify(relatedPool), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify(batchPosts), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'x-wp-total': '120', 'x-wp-totalpages': '5' }
      });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = {
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_KEY: 'test-key',
    ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) }
  };

  // 2. Watch SSR renders 8 related links from the single per_page=8 call + runtime in meta description
  const watchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/ssis-999-english-subtitle-exclusive-feature-99123', { headers: botHeaders }),
    env
  }));
  const watchHtml = await watchRes.text();
  assert.equal(watchRelatedCalls, 1);
  const relatedNavMatch = watchHtml.match(/<nav aria-label="Related Videos"[\s\S]*?<\/nav>/);
  assert.ok(relatedNavMatch, 'Watch SSR must render Related Videos nav');
  const relatedLinkCount = (relatedNavMatch[0].match(/<li\b/g) || []).length;
  assert.equal(relatedLinkCount, 8, 'Watch SSR should render 8 related video links without extra subrequests');
  assert.match(watchHtml, /02:15:00/);

  // 3. Actor SSR includes Kanji alternateName in ProfilePage + <title> without breaking Person.name
  const actorRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/actor?name=Yua%20Mikami', { headers: botHeaders }),
    env
  }));
  const actorHtml = await actorRes.text();
  assert.match(actorHtml, /<title>Yua Mikami \(三上悠亜\) JAV Videos/);
  assert.match(actorHtml, /"name":\s*"Yua Mikami"/);
  assert.match(actorHtml, /"alternateName":\s*"三上悠亜"/);
  assert.ok(listingRequestedUrls.some(u => u.includes('per_page=24')), 'Listing SSR must request per_page=24');

  // 4. Home SSR renders Telegram handle sync, Home hub links, and Option 1A English-only gating
  const [enHomeRes, idHomeRes] = await Promise.all([
    onRequest(makeContext({ request: new Request('https://www.missav-j.com/en/', { headers: botHeaders }), env })),
    onRequest(makeContext({ request: new Request('https://www.missav-j.com/id/', { headers: botHeaders }), env }))
  ]);
  const [enHomeHtml, idHomeHtml] = await Promise.all([enHomeRes.text(), idHomeRes.text()]);
  assert.match(enHomeHtml, /https:\/\/t\.me\/missav_jav_english/);
  assert.doesNotMatch(enHomeHtml, /https:\/\/t\.me\/missav_j["']/);
  assert.match(enHomeHtml, /class="home-hub-links"/);
  assert.match(enHomeHtml, /href="\/en\/category\?name=English%20Subtitle"/);
  assert.match(idHomeHtml, /<meta name="robots" content="noindex, follow">/);
  assert.match(idHomeHtml, /href="\/en\/studio\?name=S1"/);

  // 5. Multi-page seo-enrich skips enriched page 1 (matching source_hash) and collects page 2+ candidates
  const { createHash } = await import('node:crypto');
  const { fetchCandidatePosts } = await import(`../scripts/seo-enrich.mjs?t=${Date.now()}`);
  const enrichedDb = {
    posts: Object.fromEntries(Array.from({ length: 50 }, (_, i) => {
      const id = 1000 + i;
      const hash = createHash('md5').update(`${id}:C-${i}:T-${i}::`).digest('hex');
      return [String(id), { status: 'enriched', source_hash: hash }];
    }))
  };
  let mockFetchCount = 0;
  const pagedCandidates = await fetchCandidatePosts(enrichedDb, 5, async (endpoint) => {
    mockFetchCount++;
    if (endpoint.includes('orderby=views')) return new Response('[]', { status: 200 });
    if (endpoint.includes('page=1')) {
      return new Response(JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ id: 1000 + i, code: `C-${i}`, title: `T-${i}` }))), { status: 200 });
    }
    if (endpoint.includes('page=2')) {
      return new Response(JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ id: 2000 + i, code: `NEW-${i}`, title: `New Title ${i}` }))), { status: 200 });
    }
    return new Response('[]', { status: 200 });
  });
  assert.ok(mockFetchCount >= 2, 'fetchCandidatePosts must continue past page 1');
  assert.ok(pagedCandidates.some(p => p.id === 2000), 'fetchCandidatePosts must include page 2 un-enriched items');

  // 6. IndexNow includes recent canonical Watch URLs within protocol limit
  const { buildIndexNowUrls } = await import(`../scripts/indexnow.mjs?idx=${Date.now()}`);
  const idxUrls = buildIndexNowUrls();
  assert.ok(idxUrls.length >= 200 && idxUrls.length <= 10000, `Unexpected IndexNow batch count: ${idxUrls.length}`);
  assert.ok(idxUrls.some(u => /\/en\/watch\/.+-\d+$/.test(u)));
});

test('traffic breakthrough: concise Watch <title>, semantic card links, WRS SSR preservation, code search, referral retention & invariants', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  globalThis.caches = { default: new MemoryCache() };
  const baseHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = { ASSETS: { fetch: async () => new Response(baseHtml, { status: 200 }) } };

  // 1. Long Watch title (>140 chars) produces concise SERP <title> (<=72 chars) while keeping full title in <h1>
  const longTitle = 'A Very Long Feature Movie Release Description That Exceeds Desktop And Mobile SERP Pixel Truncation Thresholds By Many Words Across Paragraphs';
  globalThis.fetch = async (input) => {
    const u = String(input);
    if (u.includes('posts/99221')) {
      return new Response(JSON.stringify({
        id: 99221,
        code: 'SAMPLE-999-ENGLISH-SUBTITLE',
        title: longTitle,
        slug: 'sample-999-english-subtitle-long-feature',
        duration: '02:05:00',
        thumbnail: 'https://pics.dmm.co.jp/sample999.jpg',
        embed_url: 'https://server.apijav.com/?mvapm_embed=99221',
        actors: ['Actor One'],
        categories: ['English Subtitle', 'Drama'],
        studio: 'S1'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('categories=') && u.includes('per_page=8')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  };

  const watchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/sample-999-english-subtitle-long-feature-99221', { headers: botHeaders }),
    env
  }));
  assert.equal(watchRes.status, 200);
  const watchHtml = await watchRes.text();
  const titleMatch = watchHtml.match(/<title>([^<]+)<\/title>/i);
  assert.ok(titleMatch, 'Watch SSR must include <title>');
  const renderedTitle = titleMatch[1];
  assert.ok(renderedTitle.length <= 72, `Concise Watch <title> must be <=72 chars, got ${renderedTitle.length}: ${renderedTitle}`);
  assert.match(renderedTitle, /\[SAMPLE-999\]/);
  assert.match(renderedTitle, /\(English Subtitle\)/);
  assert.match(renderedTitle, /- MISSAV-J$/);
  const h1Match = watchHtml.match(/<h1>([^<]+)<\/h1>/i);
  assert.ok(h1Match && h1Match[1].includes(longTitle), 'Watch SSR <h1> must keep full untruncated movie title');

  // 2. feed.js renderVideoCard emits real <a href="/en/watch/..."> links (no nested <a>), studio <a> for known studio, and <span> for Other
  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  const prevLocalStorage = globalThis.localStorage;
  try {
    globalThis.window = {
      missavJGetWatchUrl: (id, code, title, slug) => `/watch/${String(slug || 'video').toLowerCase()}-${id}`,
      location: { origin: 'https://www.missav-j.com', pathname: '/en/', search: '' }
    };
    const { renderVideoCard } = await importSource('assets/js/feed.js', [
      [/^import\s+api\s+from\s+'[^']+';/m, 'const api = {};'],
      [/^import\s+ui\s+from\s+'[^']+';/m, `const ui = {
        escapeHTML: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
        getProxiedThumbnail: s => s ? '/img/' + s : ''
      };`],
      [/^import\s+filter\s+from\s+'[^']+';/m, 'const filter = {};'],
      [/^import\s+i18n\s+from\s+'[^']+';/m, 'const i18n = { t: k => k, getLang: () => "en", translateVideoTitle: t => t };'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/hub-content\.js[^']*';/m, 'const getHubContent = () => null;'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, 'const loadIndexableTaxonomies = async () => {}; const renderTaxonomyLink = ({ type, name, lang, className, label, dataAttrs = "" }) => `<a href="/${lang}/${type}?name=${encodeURIComponent(name)}" class="${className}"${dataAttrs ? " " + dataAttrs : ""}>${label}</a>`;']
    ]);

    const cardHtml = renderVideoCard({
      id: 881,
      code: 'ABC-881',
      title: 'Feature Release Test',
      en_slug: 'abc-881-feature-release',
      studio: 'S1',
      actors: ['Performer One'],
      views: 1200,
      duration: '01:30:00',
      thumbnail: 'cover.jpg'
    }, 0);
    assert.match(cardHtml, /<a href="\/en\/watch\/abc-881-feature-release-881" class="card-watch-link card-thumb-link"/);
    assert.match(cardHtml, /<a href="\/en\/watch\/abc-881-feature-release-881" class="card-watch-link card-title-link">Feature Release Test<\/a>/);
    assert.match(cardHtml, /<a href="\/en\/studio\?name=S1" class="card-studio"/);
    assert.match(cardHtml, /<a href="\/en\/actor\?name=Performer%20One" class="actor-chip"/);

    const unknownStudioCard = renderVideoCard({ id: 882, code: 'ABC-882', title: 'No Studio', studio: '', actors: [] }, 1);
    assert.match(unknownStudioCard, /<span class="card-studio text-muted" data-studio="Other">/);

    // 3. search.js normalizes unhyphenated release codes without breaking multi-word queries
    const { normalizeSearchQuery } = await importSource('assets/js/search.js', [
      [/^import\s+api\s+from\s+'[^']+';/m, 'const api = {};'],
      [/^import\s+ui\s+from\s+'[^']+';/m, 'const ui = { escapeHTML: s => String(s || "") };'],
      [/^import\s+filter\s+from\s+'[^']+';/m, 'const filter = {};'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/feed\.js[^']*';/m, 'const renderVideoCard = () => ""; const bindHoverPreviews = () => {};'],
      [/^import\s+i18n\s+from\s+'[^']+';/m, 'const i18n = { t: k => k, getLang: () => "en", translateVideoTitle: t => t };'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, 'const loadIndexableTaxonomies = async () => {};']
    ]);
    assert.equal(normalizeSearchQuery('ssis888'), 'SSIS-888');
    assert.equal(normalizeSearchQuery('ssis 888'), 'SSIS-888');
    assert.equal(normalizeSearchQuery('fc2ppv123456'), 'FC2-PPV-123456');
    assert.equal(normalizeSearchQuery('part 10'), 'part 10');

    // 4. referral.js preserves non-tracking params (?name=, ?q=) and leaves Telegram channels free of ?start=
    const replacedUrls = [];
    const store = new Map();
    const tgChannelLink = { href: 'https://t.me/missav_jav_english' };
    const tgBotLink = { href: 'https://t.me/missav_helper_bot' };
    globalThis.localStorage = {
      getItem: k => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    };
    globalThis.window = {
      location: {
        href: 'https://www.missav-j.com/en/actor?name=Yua+Mikami&ref=social_card&utm_source=tg',
        search: '?name=Yua+Mikami&ref=social_card&utm_source=tg'
      },
      history: {
        replaceState: (_state, _title, url) => replacedUrls.push(url)
      }
    };
    globalThis.document = {
      querySelectorAll: (sel) => sel.includes('t.me') ? [tgChannelLink, tgBotLink] : []
    };
    const { default: ReferralSystem } = await importSource('assets/js/referral.js');
    ReferralSystem.init();
    assert.equal(replacedUrls.length, 1);
    assert.equal(replacedUrls[0], '/en/actor?name=Yua+Mikami');
    assert.equal(tgChannelLink.href, 'https://t.me/missav_jav_english');
    assert.equal(tgBotLink.href, 'https://t.me/missav_helper_bot?start=ref_social_card');
  } finally {
    globalThis.window = prevWindow;
    globalThis.document = prevDocument;
    globalThis.localStorage = prevLocalStorage;
  }

  // 5. Source parity & invariant audit across frontend, SW, HTML, and monetization
  const [feedSrc, playerSrc, studiosSrc, categoriesSrc, actorsSrc, popActorsSrc, appSrc, swSrc] = await Promise.all([
    readFile(new URL('assets/js/feed.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/player.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/studios.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/categories.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/actors.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/popular_actors.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/app.js', ROOT), 'utf8'),
    readFile(new URL('sw.js', ROOT), 'utf8')
  ]);

  assert.match(feedSrc, /const TAXONOMY_MIN_INDEXABLE_VIDEOS = 5;/);
  assert.match(feedSrc, /const TAXONOMY_MIN_INDEXABLE_ACTOR_VIDEOS = 8;/);
  assert.match(feedSrc, /class="feed-page-h1"/);
  assert.match(feedSrc, /class="home-hub-links"/);
  assert.match(playerSrc, /<a href="\$\{ui\.escapeHTML\(watchPath\)\}" class="related-video-card/);
  assert.match(playerSrc, /id="player-release-details"/);
  assert.match(playerSrc, /class="video-release-details"/);
  assert.match(playerSrc, /glamournakedemployee\.com/);
  assert.match(studiosSrc, /<a href="\$\{studioHref\}" class="studio-browse-card/);
  assert.match(studiosSrc, /<h1\b/);
  assert.match(categoriesSrc, /<a href="\$\{catHref\}" class="category-browse-card/);
  assert.match(categoriesSrc, /<h1\b/);
  assert.match(actorsSrc, /Number\(actor\.count\) < 8/);
  assert.match(actorsSrc, /isThinActor[\s\S]*role="link"[^>]*taxonomy-link-thin/);
  assert.doesNotMatch(actorsSrc, /rel="nofollow"/);
  assert.match(actorsSrc, /<h1\b/);
  assert.match(popActorsSrc, /<h1\b/);
  assert.match(appSrc, /captureInitialSsrState/);
  assert.match(appSrc, /shouldPreserveInitialSsr/);
  assert.match(appSrc, /__missavJShouldPreserveInitialSsrTitle/);
  assert.match(appSrc, /defaultLabel: 'Top Actresses'/);
  assert.doesNotMatch(appSrc, /Actress ranking MAY 2026/);
  assert.match(appSrc, /e\.key === '\/'/);
  assert.match(baseHtml, /rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com/);
  assert.match(baseHtml, /benchform\.org/);
  assert.match(baseHtml, /biomanos\.org/);
  assert.match(baseHtml, />Home<\/span>/);
  assert.match(baseHtml, />Popular Actors<\/span>/);
  assert.doesNotMatch(baseHtml, />(?:Beranda|Populer \(Trending\)|Tonton Nanti|Riwayat Sesi|Aktor Populer|Studio Populer)</);
  assert.doesNotMatch(baseHtml, /title="Toggle Tema"/);
  assert.match(swSrc, /popular_actors\.js\?v=2\.8\.109/);
  assert.match(swSrc, /hub-content\.js\?v=2\.8\.109/);
  assert.match(swSrc, /taxonomy-index\.js\?v=2\.8\.109/);
});

test('noindex discovery guard: client chips link only indexable taxonomies', async () => {
  const prevFetch = globalThis.fetch;
  const prevWindow = globalThis.window;
  const escapeHTML = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/api/actors.json')) {
        return new Response(JSON.stringify(['Yua Mikami', 'Eimi Fukada']), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (String(url).includes('/api/categories.json')) {
        return new Response(JSON.stringify(['Creampie', 'English Subtitle', 'Blonde']), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('[]', { status: 404 });
    };

    const taxonomyMod = await importSource('assets/js/taxonomy-index.js', [
      [/^import\s+ui\s+from\s+'[^']+';/m, `const ui = { escapeHTML: ${escapeHTML.toString()} };`]
    ]);
    await taxonomyMod.loadIndexableTaxonomies({ timeoutMs: 0 });

    assert.equal(taxonomyMod.isIndexableTaxonomy('actor', 'Yua Mikami', 'ko'), true);
    assert.equal(taxonomyMod.isIndexableTaxonomy('actor', 'Kawano Mina', 'ko'), false);
    assert.equal(taxonomyMod.isIndexableTaxonomy('actor', 'Kitagi Rina', 'ko'), false);
    assert.equal(taxonomyMod.isIndexableTaxonomy('actor', 'Yuki Mikami', 'de'), false);
    assert.equal(taxonomyMod.isIndexableTaxonomy('category', 'Creampie', 'ko'), true);
    assert.equal(taxonomyMod.isIndexableTaxonomy('category', 'English Subtitle', 'en'), true);
    assert.equal(taxonomyMod.isIndexableTaxonomy('category', 'English Subtitle', 'ko'), false);
    assert.equal(taxonomyMod.isIndexableTaxonomy('category', 'Blonde / Blonde', 'en'), true);
    assert.equal(taxonomyMod.isIndexableTaxonomy('tag', 'Rare Thin Tag', 'en'), false);

    const indexableActorChip = taxonomyMod.renderTaxonomyLink({
      type: 'actor',
      name: 'Yua Mikami',
      lang: 'ko',
      className: 'actor-chip',
      label: 'Yua Mikami',
      dataAttrs: 'data-actor="Yua%20Mikami"'
    });
    assert.match(indexableActorChip, /^<a href="\/ko\/actor\?name=Yua%20Mikami" class="actor-chip" data-actor="Yua%20Mikami">Yua Mikami<\/a>$/);

    const thinActorChip = taxonomyMod.renderTaxonomyLink({
      type: 'actor',
      name: 'Kitagi Rina',
      lang: 'ko',
      className: 'actor-chip',
      label: 'Kitagi Rina',
      dataAttrs: 'data-actor="Kitagi%20Rina"'
    });
    assert.match(thinActorChip, /^<span role="link" tabindex="0" class="actor-chip taxonomy-link-thin" data-nav-href="\/ko\/actor\?name=Kitagi%20Rina"/);
    assert.doesNotMatch(thinActorChip, /\shref=/);

    const canonicalCategoryChip = taxonomyMod.renderTaxonomyLink({
      type: 'category',
      name: 'Blonde / Blonde',
      lang: 'en',
      className: 'meta-tag-chip',
      label: 'Blonde'
    });
    assert.match(canonicalCategoryChip, /^<a href="\/en\/category\?name=Blonde"/);

    // End-to-end card rendering: mix of curated + thin actors in feed.js renderVideoCard
    globalThis.__testTaxonomyMod = taxonomyMod;
    globalThis.window = {
      missavJGetWatchUrl: (id, _c, _t, slug) => `/watch/${String(slug || 'video').toLowerCase()}-${id}`,
      location: { origin: 'https://www.missav-j.com', pathname: '/ko/', search: '' }
    };
    const { renderVideoCard } = await importSource('assets/js/feed.js', [
      [/^import\s+api\s+from\s+'[^']+';/m, 'const api = {};'],
      [/^import\s+ui\s+from\s+'[^']+';/m, `const ui = { escapeHTML: ${escapeHTML.toString()}, getProxiedThumbnail: s => s || '' };`],
      [/^import\s+filter\s+from\s+'[^']+';/m, 'const filter = {};'],
      [/^import\s+i18n\s+from\s+'[^']+';/m, 'const i18n = { t: k => k, getLang: () => "ko", translateVideoTitle: t => t };'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/hub-content\.js[^']*';/m, 'const getHubContent = () => null;'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, 'const { loadIndexableTaxonomies, renderTaxonomyLink, isIndexableTaxonomy, resolveCategoryAlias, hasLoadedTaxonomySet, isEnglishSpecificCategory } = globalThis.__testTaxonomyMod;']
    ]);

    const mixedCard = renderVideoCard({
      id: 991,
      code: 'TST-991',
      title: 'Mixed Actors Card',
      en_slug: 'tst-991-mixed',
      studio: 'Other',
      actors: ['Yua Mikami', 'Kitagi Rina'],
      views: 100,
      duration: '00:45:00'
    }, 0);
    assert.match(mixedCard, /<a href="\/ko\/actor\?name=Yua%20Mikami" class="actor-chip"/);
    assert.match(mixedCard, /<span role="link" tabindex="0" class="actor-chip taxonomy-link-thin" data-nav-href="\/ko\/actor\?name=Kitagi%20Rina"/);
    assert.doesNotMatch(mixedCard, /<a href="\/ko\/actor\?name=Kitagi%20Rina"/);
    assert.doesNotMatch(mixedCard, /<a href="\/ko\/studio\?name=Other"/);

    // Static invariants: SW cache, routes exclusion, player.js & monetization untouched
    const [playerSrc, routesRaw, swSrc, baseHtml] = await Promise.all([
      readFile(new URL('assets/js/player.js', ROOT), 'utf8'),
      readFile(new URL('_routes.json', ROOT), 'utf8'),
      readFile(new URL('sw.js', ROOT), 'utf8'),
      readFile(new URL('index.html', ROOT), 'utf8')
    ]);
    const routes = JSON.parse(routesRaw);
    assert.ok(routes.exclude.includes('/api/actors.json'));
    assert.ok(routes.exclude.includes('/api/categories.json'));
    assert.match(swSrc, /\/api\/actors\.json['"][\s\S]*ONE_DAY/);
    assert.match(swSrc, /\/api\/categories\.json['"][\s\S]*ONE_DAY/);
    assert.match(swSrc, /taxonomy-index\.js\?v=2\.8\.109/);
    assert.match(playerSrc, /renderTaxonomyLink\(/);
    assert.doesNotMatch(playerSrc, /<a href="\$\{baseHref\}\?name=Other"|<a href="\/\$\{lang\}\/studio\?name=Other"/);
    assert.match(playerSrc, /glamournakedemployee\.com/);
    assert.match(baseHtml, /benchform\.org/);
    assert.match(baseHtml, /biomanos\.org/);
    const wfSrc = await readFile(new URL('.github/workflows/weekly-sitemap.yml', ROOT), 'utf8');
    assert.match(wfSrc, /seo-enrich\.mjs --limit=400/);
  } finally {
    delete globalThis.__testTaxonomyMod;
    globalThis.fetch = prevFetch;
    globalThis.window = prevWindow;
  }
});

test('feed skeleton race guard: overlapping home navigations never leave skeleton cards above results', async () => {
  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  const prevSessionStorage = globalThis.sessionStorage;
  const prevIntersectionObserver = globalThis.IntersectionObserver;
  const escapeHTML = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  try {
    const store = new Map();
    globalThis.sessionStorage = {
      getItem: k => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v))
    };

    const makeEl = (id) => ({
      id,
      _innerHTML: '',
      get innerHTML() { return this._innerHTML; },
      set innerHTML(val) {
        this._innerHTML = String(val || '');
        if (id === 'app-content') {
          activeDom['video-grid'] = makeEl('video-grid');
          activeDom['video-total-count'] = makeEl('video-total-count');
          activeDom['page-track'] = makeEl('page-track');
          activeDom['filter-bar-container'] = makeEl('filter-bar-container');
          activeDom['infinite-loader'] = makeEl('infinite-loader');
          activeDom['scroll-sentinel'] = makeEl('scroll-sentinel');
        }
      },
      textContent: '',
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      insertAdjacentHTML(_pos, html) { this._innerHTML += html; },
      querySelectorAll(sel) {
        if (sel.includes('skeleton') && this._innerHTML.includes('skeleton-card')) {
          return [{
            remove: () => {
              this._innerHTML = this._innerHTML.replace(/<div class="video-card skeleton-card[\s\S]*$/m, '');
            }
          }];
        }
        return [];
      }
    });

    const appContent = makeEl('app-content');
    const activeDom = { 'app-content': appContent };
    globalThis.document = {
      getElementById: id => activeDom[id] || null
    };
    globalThis.window = {
      missavJGetWatchUrl: (id) => `/watch/video-${id}`,
      location: { origin: 'https://www.missav-j.com', pathname: '/en/', search: '' }
    };

    let observerCreations = 0;
    let disconnectCalls = 0;
    globalThis.IntersectionObserver = class {
      constructor(cb) {
        observerCreations++;
        this.cb = cb;
      }
      observe(sentinel) {
        this.sentinel = sentinel;
        queueMicrotask(() => {
          if (!this.disconnected) this.cb([{ isIntersecting: true }]);
        });
      }
      disconnect() {
        disconnectCalls++;
        this.disconnected = true;
      }
    };

    const deferred = [];
    const skeletonVariants = [];
    globalThis.__raceTestDeps = {
      api: {
        getPosts({ page }) {
          return new Promise((resolve) => {
            deferred.push({ page, resolve });
          });
        }
      },
      ui: {
        escapeHTML,
        getProxiedThumbnail: s => s || '',
        setRobotsMeta() {},
        showEmpty() {},
        showSkeletonsInElement(el, count, variant = 'row') {
          skeletonVariants.push(variant);
          if (el) el.innerHTML = Array(count).fill('<div class="video-card skeleton-card"></div>').join('');
        }
      }
    };

    const { init: initFeed } = await importSource('assets/js/feed.js', [
      [/^import\s+api\s+from\s+'[^']+';/m, 'const { api } = globalThis.__raceTestDeps;'],
      [/^import\s+ui\s+from\s+'[^']+';/m, 'const { ui } = globalThis.__raceTestDeps;'],
      [/^import\s+filter\s+from\s+'[^']+';/m, 'const filter = { init() {} };'],
      [/^import\s+i18n\s+from\s+'[^']+';/m, 'const i18n = { t: k => k, getLang: () => "en", translateVideoTitle: t => t };'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/hub-content\.js[^']*';/m, 'const getHubContent = () => null;'],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, 'const loadIndexableTaxonomies = async () => {}; const renderTaxonomyLink = ({ label }) => `<span>${label}</span>`; const isIndexableTaxonomy = () => true; const resolveCategoryAlias = v => v; const hasLoadedTaxonomySet = () => false; const isEnglishSpecificCategory = () => false;']
    ]);

    // Start two overlapping Home init() calls (exact double-click / rapid Watch->Home transition race)
    const p1 = initFeed({});
    await new Promise(r => setTimeout(r, 0));
    const p2 = initFeed({});
    await new Promise(r => setTimeout(r, 0));

    assert.equal(deferred.length, 2, 'Two initial page fetches should have started');
    // Resolve stale #1 FIRST while #2 is still in flight
    deferred[0].resolve({
      total: 122810,
      totalPages: 5118,
      posts: [{ id: 101, code: 'STALE-101', title: 'Stale Video', studio: 'S1', actors: [] }]
    });
    await p1;

    // Crucial check: stale p1 MUST NOT attach an IntersectionObserver to p2's sentinel
    assert.equal(observerCreations, 0, 'Stale feed.init() must not attach a zombie IntersectionObserver');
    assert.equal(deferred.length, 2, 'Stale completion must not unlock an extra infinite-scroll fetch');

    // Now resolve active #2
    deferred[1].resolve({
      total: 122810,
      totalPages: 5118,
      posts: [{ id: 202, code: 'REAL-202', title: 'Fresh Video', studio: 'S1', actors: [] }]
    });
    await p2;

    const finalGrid = activeDom['video-grid'];
    assert.ok(finalGrid.innerHTML.includes('Fresh Video'), 'Active Home fetch must populate video grid');
    assert.doesNotMatch(finalGrid.innerHTML, /skeleton-card/, 'Home grid must never retain skeleton placeholders alongside or above real cards');
    assert.equal(observerCreations, 1, 'Exactly one IntersectionObserver should be created for the active epoch');
    assert.ok(skeletonVariants.every(v => v === 'grid'), 'Feed skeletons should use 16:9 grid card layout');
    assert.ok(disconnectCalls >= 0);

    // Static checks in app.js & search.js for click dedup & race protection
    const [appSrc, searchSrc] = await Promise.all([
      readFile(new URL('assets/js/app.js', ROOT), 'utf8'),
      readFile(new URL('assets/js/search.js', ROOT), 'utf8')
    ]);
    assert.match(appSrc, /if\s*\(\s*e\.defaultPrevented\s*\)\s*return;/);
    assert.match(appSrc, /logoLink\.addEventListener\([\s\S]*e\.stopPropagation\(\)/);
    assert.match(appSrc, /activeNavigationToken/);
    assert.match(searchSrc, /searchEpoch/);
    assert.match(searchSrc, /showSkeletonsInElement\([^,]+,\s*8,\s*'grid'\)/);
  } finally {
    delete globalThis.__raceTestDeps;
    globalThis.window = prevWindow;
    globalThis.document = prevDocument;
    globalThis.sessionStorage = prevSessionStorage;
    globalThis.IntersectionObserver = prevIntersectionObserver;
  }
});

test('compact double-prefix release codes 301 redirect instead of false 410 while true mismatches still return 410', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const postsById = {
    6253: { id: 6253, code: 'PM028', slug: 'pm028-grounded-flight-sample', title: 'PM028 Grounded Flight Sample', thumbnail: 'https://fourhoi.com/6253.jpg' },
    43861: { id: 43861, code: 'PP004', slug: 'pp004-sample-title', title: 'PP004 Sample Title', thumbnail: 'https://fourhoi.com/43861.jpg' }
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

  const compactDup6253 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/watch/pm028-pm028-grounded-flight-ho-6253', { headers: botHeaders }),
    env
  }));
  assert.equal(compactDup6253.status, 301);
  assert.equal(compactDup6253.headers.get('X-Edge-Mode'), 'SEARCH-REDIRECT');
  assert.equal(compactDup6253.headers.get('Location'), 'https://www.missav-j.com/en/watch/pm028-grounded-flight-sample-6253');

  const compactDup43861 = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/pp004-pp004-old-slug-43861', { headers: botHeaders }),
    env
  }));
  assert.equal(compactDup43861.status, 301);
  assert.equal(compactDup43861.headers.get('X-Edge-Mode'), 'SEARCH-REDIRECT');

  const mismatchCompact = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/watch/pm029-pm029-wrong-code-6253', { headers: botHeaders }),
    env
  }));
  assert.equal(mismatchCompact.status, 410);
  assert.equal(mismatchCompact.headers.get('X-Edge-Mode'), 'SEARCH-GONE-410');

  const mismatchDifferentPrefix = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/de/watch/ssis-111-wrong-code-6253', { headers: botHeaders }),
    env
  }));
  assert.equal(mismatchDifferentPrefix.status, 410);
  assert.equal(mismatchDifferentPrefix.headers.get('X-Edge-Mode'), 'SEARCH-GONE-410');
});

test('transient API errors never poison valid SSR pages with client noindex', async () => {
  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;

  try {
    const robotsEl = { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' };
    const appContentEl = { innerHTML: '' };
    globalThis.window = { i18n: null, location: { reload() {} } };
    globalThis.document = {
      documentElement: { setAttribute() {} },
      head: { appendChild() {} },
      querySelector: sel => (sel === 'meta[name="robots"]' ? robotsEl : null),
      createElement: () => ({ name: 'robots', content: '' }),
      getElementById: id => (id === 'app-content' ? appContentEl : null)
    };

    const uiMod = await importSource('assets/js/ui.js');
    const ui = uiMod.default;

    ui.showError('Temporary upstream timeout');
    assert.match(robotsEl.content, /^index, follow/, 'Transient ui.showError must preserve indexability by default');

    ui.showError('404 - Page Not Found', null, { noindex: true });
    assert.equal(robotsEl.content, 'noindex, follow', 'Explicit permanent 404 may set noindex');

    const [uiSrc, playerSrc, feedSrc, appSrc] = await Promise.all([
      readFile(new URL('assets/js/ui.js', ROOT), 'utf8'),
      readFile(new URL('assets/js/player.js', ROOT), 'utf8'),
      readFile(new URL('assets/js/feed.js', ROOT), 'utf8'),
      readFile(new URL('assets/js/app.js', ROOT), 'utf8')
    ]);

    assert.match(uiSrc, /showError\(message,\s*container\s*=\s*null,\s*\{\s*noindex\s*=\s*false\s*\}\s*=\s*\{\}\)/);
    assert.doesNotMatch(playerSrc, /catch\s*\(error\)\s*\{[\s\S]*ui\.setRobotsMeta\(true\)/);
    assert.match(playerSrc, /preservedSsrFullHtml/);
    assert.match(playerSrc, /error_not_found|invalid_video_id.*noindex:\s*true/);
    assert.doesNotMatch(feedSrc, /catch\s*\(error\)\s*\{[\s\S]*ui\.setRobotsMeta\(true\)/);
    assert.match(feedSrc, /preservedSsrFeedHtml/);
    assert.match(appSrc, /error_not_found[\s\S]*noindex:\s*true/);
  } finally {
    globalThis.document = prevDocument;
    globalThis.window = prevWindow;
  }
});

test('curated hub link hygiene: zero 404, 301 alias, or noindex crawl-trap links in client hubs', async () => {
  const [actorsJsonRaw, catsJsonRaw, popActorsSrc, feedSrc, categoriesSrc, studiosSrc, indexHtml, swSrc] = await Promise.all([
    readFile(new URL('api/actors.json', ROOT), 'utf8'),
    readFile(new URL('api/categories.json', ROOT), 'utf8'),
    readFile(new URL('assets/js/popular_actors.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/feed.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/categories.js', ROOT), 'utf8'),
    readFile(new URL('assets/js/studios.js', ROOT), 'utf8'),
    readFile(new URL('index.html', ROOT), 'utf8'),
    readFile(new URL('sw.js', ROOT), 'utf8')
  ]);

  const curatedActorSet = new Set(JSON.parse(actorsJsonRaw).map(a => String(a).trim().toLowerCase()));
  const curatedCatSet = new Set(JSON.parse(catsJsonRaw).map(c => String(c).trim().toLowerCase()));

  const popNames = [...popActorsSrc.matchAll(/\{\s*name:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(popNames.length >= 15, 'Expected curated list in popular_actors.js');
  for (const actorName of popNames) {
    assert.ok(curatedActorSet.has(actorName.toLowerCase()), `popular_actors.js entry "${actorName}" must exist in api/actors.json (>=8 videos)`);
  }
  assert.doesNotMatch(popActorsSrc, /Karen Kanon|Maria Ozawa|Sora Aoi|'Arina Hashimoto'/);

  const hubFnMatch = feedSrc.match(/function buildClientHomeHubLinksHtml\(lang\)[\s\S]*?\n\}/);
  assert.ok(hubFnMatch, 'Expected buildClientHomeHubLinksHtml in feed.js');
  const hubFnBody = hubFnMatch[0];
  assert.doesNotMatch(hubFnBody, /'Drama'|'Romance'|'Solowork'|'Amateur'|'POV'/);
  assert.match(hubFnBody, /lang === 'en'\s*\?\s*\['English Subtitle'\]\s*:\s*\[\]/);
  for (const catLiteral of [...hubFnBody.matchAll(/'([^']+)'/g)].map(m => m[1])) {
    if (['Uncensored', 'Uncensored leak', 'English Subtitle', '4K', 'Full Hd (Fhd)', 'Cosplay', 'Mature Woman', 'Married Woman', 'Big Breasts', 'Vr'].includes(catLiteral)) {
      assert.ok(curatedCatSet.has(catLiteral.toLowerCase()), `Home hub category "${catLiteral}" must exist in api/categories.json`);
    }
  }

  assert.match(feedSrc, /isIndexableTaxonomy\('category',\s*canonicalTag,\s*lang\)/);
  assert.match(feedSrc, /isNonCuratedCategory/);
  assert.match(categoriesSrc, /loadIndexableTaxonomies\(\)/);
  assert.match(categoriesSrc, /role="link"[^>]*taxonomy-link-thin[^>]*data-nav-href="\$\{catHref\}"/);
  assert.match(studiosSrc, /isThinStudio[\s\S]*role="link"[^>]*taxonomy-link-thin[^>]*data-nav-href="\$\{studioHref\}"/);

  // Adsterra & v2.8.109 invariants
  assert.match(indexHtml, /benchform\.org/);
  assert.match(indexHtml, /biomanos\.org/);
  assert.match(indexHtml, /app\.js\?v=2\.8\.109/);
  assert.match(swSrc, /missavj-cache-v2\.8\.109/);
});

test('v2.8.108 404 elimination: HTML-entity tag redirects, apostrophe WP slugify, and slash category fallback', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const { onRequest: postsOnRequest } = await importSource('functions/api/posts/[[id]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Googlebot/2.1' };
  const env = { ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) } };

  // 1. Raw HTML entity in ?name= redirects 301 to decoded query param
  const entityTagRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/ms/tag?name=one%26%23039%3Bs%20junior', { headers: botHeaders }),
    env
  }));
  assert.equal(entityTagRes.status, 301);
  assert.equal(entityTagRes.headers.get('X-Edge-Mode'), 'TAXONOMY-ENTITY-REDIRECT');
  assert.equal(entityTagRes.headers.get('Location'), "https://www.missav-j.com/ms/tag?name=one's%20junior");

  // 2. Decoded apostrophe tag resolves to WordPress slug "ones-junior" (not "one-s-junior") and emits noindex
  const seenTagQueries = [];
  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    seenTagQueries.push(u);
    if (u.includes('tag=ones-junior')) {
      return new Response(JSON.stringify([
        { id: 9101, code: 'JUN-101', title: 'Junior Sample 1', slug: 'jun-101-sample', thumbnail: 'https://img.example/9101.jpg' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '10', 'X-WP-TotalPages': '1' } });
    }
    if (u.includes('category=Kimono')) {
      return new Response(JSON.stringify([
        { id: 9102, code: 'KIM-102', title: 'Kimono Sample 1', slug: 'kim-102-sample', thumbnail: 'https://img.example/9102.jpg' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '508', 'X-WP-TotalPages': '22' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '0', 'X-WP-TotalPages': '1' } });
  };

  const apostropheTagRes = await onRequest(makeContext({
    request: new Request("https://www.missav-j.com/ms/tag?name=one's%20junior", { headers: botHeaders }),
    env
  }));
  const apostropheTagHtml = await apostropheTagRes.text();
  assert.equal(apostropheTagRes.status, 200);
  assert.ok(seenTagQueries.some(u => u.includes('tag=ones-junior')), `Expected WP apostrophe slug ones-junior in: ${seenTagQueries}`);
  assert.match(apostropheTagHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(apostropheTagHtml, /rel="alternate" hreflang=/);

  // /api/posts also normalizes HTML entities + apostrophes to ones-junior
  await postsOnRequest(makeContext({
    request: new Request('https://www.missav-j.com/api/posts?lang=ms&tag=one%26%23039%3Bs%20junior'),
    env: {},
    params: { id: [] }
  }));
  assert.ok(seenTagQueries.filter(u => u.includes('tag=ones-junior')).length >= 2);

  // 3. Static alias "Kimono / Yukata" redirects O(1) to "Kimono", and dynamic unknown slash category falls back to active segment
  const kimonoAliasRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Kimono%20/%20Yukata', { headers: botHeaders }),
    env
  }));
  assert.equal(kimonoAliasRes.status, 301);
  assert.equal(kimonoAliasRes.headers.get('X-Edge-Mode'), 'CATEGORY-ALIAS-REDIRECT');
  assert.equal(kimonoAliasRes.headers.get('Location'), 'https://www.missav-j.com/en/category?name=Kimono');

  const dynamicSlashRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=ObsoleteLabel%20/%20Kimono', { headers: botHeaders }),
    env
  }));
  assert.equal(dynamicSlashRes.status, 301);
  assert.equal(dynamicSlashRes.headers.get('X-Edge-Mode'), 'CATEGORY-ALIAS-REDIRECT');
  assert.equal(dynamicSlashRes.headers.get('Location'), 'https://www.missav-j.com/en/category?name=Kimono');
});

test('v2.8.108 Option A consolidation: /tag and non-EN routes noindex, curated tags 301 to /en/category, zero Supabase on /en/ taxonomies', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Googlebot/2.1' };

  let supabaseCallsOnEn = 0;
  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('supabase.test')) {
      supabaseCallsOnEn += 1;
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([
      { id: 9201, code: 'DAT-201', title: 'Sample Video 1', slug: 'dat-201-sample', categories: ['123av', 'Dating'], thumbnail: 'https://img.example/9201.jpg' },
      { id: 9202, code: 'DAT-202', title: 'Sample Video 2', slug: 'dat-202-sample', categories: ['Javtiful', 'Dating'], thumbnail: 'https://img.example/9202.jpg' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '450', 'X-WP-TotalPages': '19' } });
  };
  const env = {
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_KEY: 'test-key',
    ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) }
  };

  // Curated tag redirects 301 to canonical /en/category
  const curatedTagRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/zh-TW/tag?name=Uncensored', { headers: botHeaders }),
    env
  }));
  assert.equal(curatedTagRes.status, 301);
  assert.equal(curatedTagRes.headers.get('X-Edge-Mode'), 'TAG-TO-CATEGORY-REDIRECT');
  assert.equal(curatedTagRes.headers.get('Location'), 'https://www.missav-j.com/en/category?name=Uncensored');

  // Uncurated tag -> 200 noindex, 0 hreflang, video links -> /en/watch/
  const indecentTagRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/zh-TW/tag?name=Indecent', { headers: botHeaders }),
    env
  }));
  const indecentHtml = await indecentTagRes.text();
  assert.equal(indecentTagRes.status, 200);
  assert.match(indecentHtml, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(indecentHtml, /rel="alternate" hreflang=/);
  assert.match(indecentHtml, /href="\/en\/watch\/dat-201-sample-9201"/);
  assert.doesNotMatch(indecentHtml, /href="\/zh-TW\/watch\//);

  // /en/ taxonomy -> index, EN-only hreflang, 0 Supabase calls
  supabaseCallsOnEn = 0;
  const enDatingRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=Dating', { headers: botHeaders }),
    env
  }));
  const enDatingHtml = await enDatingRes.text();
  assert.equal(enDatingRes.status, 200);
  assert.match(enDatingHtml, /<meta name="robots" content="index, follow/);
  assert.match(enDatingHtml, /hreflang="en"/);
  assert.match(enDatingHtml, /hreflang="x-default"/);
  assert.doesNotMatch(enDatingHtml, /hreflang="(?:fr|ms|id|ko|ja|zh-TW|zh-CN|de)"/);
  assert.equal(supabaseCallsOnEn, 0, '/en/ dynamic taxonomy must skip Supabase batch lookup');
  assert.doesNotMatch(enDatingHtml, /category\?name=123av/);
  assert.doesNotMatch(enDatingHtml, /category\?name=Javtiful/);

  // Noise/competitor category /en/category?name=123av -> noindex even with 450 videos
  const noiseCatRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/category?name=123av', { headers: botHeaders }),
    env
  }));
  assert.match(await noiseCatRes.text(), /<meta name="robots" content="noindex, follow">/);

  // Non-EN home /fr/ & non-EN category /fr/category?name=Dating -> noindex, 0 hreflang, video links -> /en/watch/
  for (const nonEnUrl of ['https://www.missav-j.com/fr/', 'https://www.missav-j.com/fr/category?name=Dating']) {
    const res = await onRequest(makeContext({ request: new Request(nonEnUrl, { headers: botHeaders }), env }));
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.doesNotMatch(html, /rel="alternate" hreflang=/);
    assert.match(html, /href="\/en\/watch\/dat-201-sample-9201"/);
    assert.doesNotMatch(html, /href="\/fr\/watch\//);
  }
});

test('v2.8.108 Watch on-page quality: concise FAQ code, deduped Related Videos, and zero noise brands in catalogs/sitemaps', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Googlebot/2.1' };
  const longTitle = 'FNS-168 A very long descriptive title sample repeated check for concise fallback summary and FAQ formatting verification across the catalog entry';

  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async input => {
    const u = String(input);
    if (u.includes('/posts/107269')) {
      return new Response(JSON.stringify({
        id: 107269,
        code: 'FNS-168',
        slug: 'fns-168-long-title-sample',
        title: longTitle,
        date: '2026-03-29T18:11:53+08:00',
        duration: '00:00:00',
        views: 10156,
        studio: 'FALENO',
        actors: ['Rin Hachimitsu'],
        categories: ['123av', 'Javtiful', 'Famous', 'Release', 'Hd', 'Big Breasts'],
        thumbnail: 'https://img.example/107269.jpg',
        embed_url: 'https://server.apijav.com/?mvapm_embed=107269'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('myvideo/v1/posts?')) {
      return new Response(JSON.stringify([
        { id: 107269, code: 'FNS-168', slug: 'fns-168-self', title: longTitle },
        { id: 20001, code: 'FNS-249', slug: 'fns-249-std', title: 'FNS-249 First Edition' },
        { id: 20002, code: 'FNS-249-UNCENSORED-LEAK', slug: 'fns-249-leak', title: 'FNS-249 Leak Duplicate' },
        { id: 20003, code: 'FNS-237', slug: 'fns-237-std', title: 'FNS-237 First Edition' },
        { id: 20004, code: 'FNS-237-UNCENSORED-LEAK', slug: 'fns-237-leak', title: 'FNS-237 Leak Duplicate' },
        { id: 20005, code: 'FNS-220', slug: 'fns-220-std', title: 'FNS-220 Distinct' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const watchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/fns-168-long-title-sample-107269', { headers: botHeaders }),
    env: { ASSETS: { fetch: async () => new Response(indexHtml, { status: 200 }) } }
  }));
  const watchHtml = await watchRes.text();
  assert.equal(watchRes.status, 200);
  assert.match(watchHtml, /What is the catalog identification for FNS-168\?/);
  assert.doesNotMatch(watchHtml, /What is the catalog identification for FNS-168 A very long descriptive/);
  assert.doesNotMatch(watchHtml, /"genre":\s*\[[^\]]*"(?:123av|Javtiful|Famous|Release|Hd)"/);
  const relatedNav = (watchHtml.match(/<nav aria-label="Related Videos"[\s\S]*?<\/nav>/) || [''])[0];
  assert.equal((relatedNav.match(/FNS-249/g) || []).length, 1, 'Related Videos must deduplicate FNS-249 base code');
  assert.equal((relatedNav.match(/FNS-237/g) || []).length, 1, 'Related Videos must deduplicate FNS-237 base code');
  assert.match(relatedNav, /FNS-220/);

  // Static catalog & sitemap hygiene
  const [catsJson, actorsJson, smCats, smActors, smPages] = await Promise.all([
    readFile(new URL('api/categories.json', ROOT), 'utf8'),
    readFile(new URL('api/actors.json', ROOT), 'utf8'),
    readFile(new URL('sitemaps/sitemap_categories.xml', ROOT), 'utf8'),
    readFile(new URL('sitemaps/sitemap_actors_1.xml', ROOT), 'utf8'),
    readFile(new URL('sitemaps/sitemap_pages.xml', ROOT), 'utf8')
  ]);
  for (const noise of ['"123av"', '"Javtiful"', '"Famous"', '"Release"', '"Uncensored Leaked"']) {
    assert.ok(!catsJson.includes(noise), `api/categories.json must exclude ${noise}`);
  }
  assert.doesNotMatch(smCats, /name=(?:123av|Javtiful|Famous|Release|Uncensored%20Leaked)</);
  assert.doesNotMatch(actorsJson, /"Actress X Nh"|"123 Yuri"/);
  assert.doesNotMatch(smActors, /name=(?:Actress%20X%20Nh|123%20Yuri)</);
  assert.doesNotMatch(smPages, /xhtml:link/);
});

test('v2.8.109 indexing & video breakthrough: zero-delay bot iframe, 503 Watch Soft-404 guard, orderby=views trending, edge X-Robots-Tag, and EN-only IndexNow', async () => {
  const { onRequest } = await importSource('functions/[[catchall]].js');
  const indexHtml = await readFile(new URL('index.html', ROOT), 'utf8');
  const botHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const env = { ASSETS: { fetch: async () => new Response(indexHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }) } };

  // 1. Watch SSR returns 503 (never 200 homepage Soft 404) when upstream returns incomplete watch record without title
  const fetchedQueries = [];
  globalThis.caches = { default: new MemoryCache() };
  globalThis.fetch = async (input) => {
    const u = String(input);
    fetchedQueries.push(u);
    if (u.includes('/posts/90999')) {
      return new Response(JSON.stringify({ id: 90999, code: 'BROKEN-99', title: '' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('/posts/90998')) {
      return new Response(JSON.stringify({
        id: 90998,
        code: 'WRS-109',
        slug: 'wrs-109-sample-watch',
        title: 'WRS-109 Sample Watch Feature',
        thumbnail: 'https://img.example/90998.jpg',
        embed_url: 'https://server.apijav.com/?mvapm_embed=90998'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (u.includes('myvideo/v1/posts?')) {
      return new Response(JSON.stringify([
        { id: 43861, code: 'TOP-001', slug: 'top-001-popular', title: 'TOP-001 Popular Video', views: 60002, thumbnail: 'https://img.example/43861.jpg' }
      ]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WP-Total': '100', 'X-WP-TotalPages': '5' } });
    }
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const brokenWatchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/broken-99-90999', { headers: botHeaders }),
    env
  }));
  assert.equal(brokenWatchRes.status, 503, 'Incomplete Watch metadata must return 503 to Googlebot instead of 200 Soft 404');
  assert.equal(brokenWatchRes.headers.get('Retry-After'), '120');

  // 2. Valid Watch SSR stamps data-ssr-embed-url & data-ssr-title on #canonical-url
  const validWatchRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/watch/wrs-109-sample-watch-90998', { headers: botHeaders }),
    env
  }));
  const validWatchHtml = await validWatchRes.text();
  assert.equal(validWatchRes.status, 200);
  assert.match(validWatchHtml, /data-ssr-embed-url="https:\/\/server\.apijav\.com\/\?mvapm_embed=90998"/);
  assert.match(validWatchHtml, /data-ssr-title="WRS-109 Sample Watch Feature"/);

  // 3. /en/trending and /en/recent forward orderby=views / orderby=date (never ignored sort=views)
  const trendRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/trending', { headers: botHeaders }),
    env
  }));
  assert.equal(trendRes.status, 200);
  const recentRes = await onRequest(makeContext({
    request: new Request('https://www.missav-j.com/en/recent', { headers: botHeaders }),
    env
  }));
  assert.equal(recentRes.status, 200);
  assert.ok(fetchedQueries.some(q => q.includes('orderby=views') && q.includes('order=desc')), '/en/trending must pass orderby=views');
  assert.ok(fetchedQueries.some(q => q.includes('orderby=date') && q.includes('order=desc')), '/en/recent must pass orderby=date');
  assert.ok(!fetchedQueries.some(q => q.includes('sort=views') || q.includes('sort=release')), 'SSR must not send ignored sort= params');

  // 4. Zero-delay bot player.js renders <iframe> synchronously before api.getPost resolves & skips api.getPlayer
  let getPlayerCalls = 0;
  let resolvePost;
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
        getPost() { return new Promise(r => { globalThis.__resolveDelayedPost = r; }); },
        async getPlayer() { globalThis.__bumpPlayerCalls(); return { iframe_html: '<iframe src="https://server.apijav.com/?mvapm_embed=90998"></iframe>' }; },
        async getPosts() { return []; }
      };`],
      [/^import\s+ui\s+from\s+'[^']+';/m, `const ui = { showError() {}, showSkeletonsInElement() {}, showToast() {}, escapeHTML: s => String(s || ''), getProxiedThumbnail: s => s || '', setRobotsMeta() {} };`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/feed\.js[^']*';/m, `const renderVideoCard = () => ''; const getDeterministicDuration = () => '45:00'; const resolveStudioAlias = s => s;`],
      [/^import\s+i18n\s+from\s+'[^']+';/m, `const i18n = { t: k => k, getLang: () => 'en', translateVideoTitle: t => t };`],
      [/^import\s+ReferralSystem\s+from\s+'[^']+';/m, `const ReferralSystem = {};`],
      [/^import\s+\{\s*Analytics\s*\}\s+from\s+'[^']+';/m, `const Analytics = { trackVideoPlay() {} };`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/related-strategy\.js[^']*';/m, `const MIN_RELATED_RESULTS = 6; const getPrimaryRelatedQuery = () => ({}); const getFallbackRelatedQuery = () => ({});`],
      [/^import\s+\{[^}]+\}\s+from\s+'\.\/taxonomy-index\.js[^']*';/m, `const loadIndexableTaxonomies = async () => {}; const renderTaxonomyLink = ({ label }) => label;`]
    ]);
    globalThis.__bumpPlayerCalls = () => { getPlayerCalls += 1; };
    const appContent = { innerHTML: '', querySelector: () => null };
    const inlinePlaceholder = { innerHTML: '' };
    const floatWrapper = { classList: { _s: new Set(['hidden']), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));}, contains(x){return this._s.has(x);} } };
    const canonicalEl = {
      getAttribute(k) {
        if (k === 'data-ssr-watch-id') return '90998';
        if (k === 'data-ssr-embed-url') return 'https://server.apijav.com/?mvapm_embed=90998';
        if (k === 'data-ssr-title') return 'WRS-109 Sample Watch Feature';
        return '';
      }
    };
    const elements = {
      'app-content': appContent,
      'canonical-url': canonicalEl,
      'floating-player-wrapper': floatWrapper,
      'related-videos-list': { innerHTML: '' },
      'player-title': { textContent: '' }
    };
    globalThis.window = {
      scrollY: 0, scrollX: 0,
      location: { pathname: '/en/watch/wrs-109-sample-watch-90998', search: '', origin: 'https://www.missav-j.com' },
      missavJState: { activeVideo: null, currentPath: '/watch', history: [] },
      missavJGetCurrentWatchId: () => '90998',
      missavJUpdateSEOTags() {}
    };
    globalThis.document = {
      title: '',
      getElementById: id => elements[id] || null,
      querySelector: sel => (sel === '.player-container-placeholder' ? inlinePlaceholder : null)
    };
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: botHeaders['User-Agent'] }, configurable: true, writable: true });
    globalThis.localStorage = { setItem() {}, getItem: () => null };
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };

    const initPromise = initPlayer('90998');
    // Before api.getPost even resolves (0ms synchronous WRS snapshot), iframe & SSR title MUST already be in DOM
    assert.match(appContent.innerHTML, /<iframe[^>]*src="https:\/\/server\.apijav\.com\/\?mvapm_embed=90998"/);
    assert.doesNotMatch(appContent.innerHTML, /player-loading-shimmer/);
    assert.match(appContent.innerHTML, /WRS-109 Sample Watch Feature/);
    assert.match(inlinePlaceholder.innerHTML, /<iframe[^>]*width="800" height="450"/);
    resolvePost = globalThis.__resolveDelayedPost;
    resolvePost({ id: 90998, code: 'WRS-109', title: 'WRS-109 Sample Watch Feature', thumbnail: '', embed_url: 'https://server.apijav.com/?mvapm_embed=90998' });
    await initPromise;
    assert.equal(getPlayerCalls, 0, 'Bot hydration must skip redundant /api/player call when SSR embed URL is active');
  } finally {
    delete globalThis.__resolveDelayedPost;
    delete globalThis.__bumpPlayerCalls;
    globalThis.window = savedGlobals.window;
    globalThis.document = savedGlobals.document;
    globalThis.localStorage = savedGlobals.localStorage;
    globalThis.ResizeObserver = savedGlobals.ResizeObserver;
    if (savedGlobals.navigatorDesc) Object.defineProperty(globalThis, 'navigator', savedGlobals.navigatorDesc);
  }

  // 5. Edge _headers X-Robots-Tag, sidebar rel=nofollow, single canonical robots.txt Sitemap, EN-only IndexNow
  const [headersTxt, robotsTxt] = await Promise.all([
    readFile(new URL('_headers', ROOT), 'utf8'),
    readFile(new URL('robots.txt', ROOT), 'utf8')
  ]);
  for (const route of ['/history', '/*/history', '/watch-later', '/*/watch-later', '/search', '/*/search']) {
    assert.match(headersTxt, new RegExp(`${route.replace(/[/*]/g, '\\$&')}\\r?\\n\\s+X-Robots-Tag: noindex, nofollow`), `_headers missing noindex for ${route}`);
  }
  assert.match(indexHtml, /<a href="\/en\/watch-later" rel="nofollow">/);
  assert.match(indexHtml, /<a href="\/en\/history" rel="nofollow">/);
  assert.equal((robotsTxt.match(/^Sitemap:/gm) || []).length, 1, 'robots.txt must declare exactly one canonical Sitemap index');
  assert.doesNotMatch(robotsTxt, /^Disallow:\s*\/(?:\*\/)?(?:history|watch-later|search)\s*$/m, 'robots.txt must not block crawlers from reading X-Robots-Tag noindex on private routes');

  const { buildIndexNowUrls } = await import(`../scripts/indexnow.mjs?v109=${Date.now()}`);
  const idxUrls = buildIndexNowUrls();
  assert.ok(!idxUrls.some(u => /^https:\/\/www\.missav-j\.com\/(?!en\/)/.test(u)), 'IndexNow must only submit canonical /en/ URLs');
});
