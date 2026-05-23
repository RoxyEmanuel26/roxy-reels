/**
 * MISSAV-J — CORS Proxy Server
 * Proxies requests to RedGIFs API, stripping/overriding CORS headers.
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;
const TARGET = 'https://api.redgifs.com';

const server = http.createServer((req, res) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const parsed = url.parse(req.url);
  const targetUrl = TARGET + parsed.path;

  // Build proxy headers — remove browser-origin headers
  const proxyHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    const lower = k.toLowerCase();
    if (['host', 'origin', 'referer', 'connection'].includes(lower)) continue;
    proxyHeaders[k] = v;
  }
  proxyHeaders['host'] = 'api.redgifs.com';
  proxyHeaders['origin'] = 'https://www.redgifs.com';
  proxyHeaders['referer'] = 'https://www.redgifs.com/';

  const proxyReq = https.request(targetUrl, {
    method: req.method,
    headers: proxyHeaders,
  }, (proxyRes) => {
    // Build response headers, REPLACING any CORS headers from upstream
    const responseHeaders = {};
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      const lower = k.toLowerCase();
      // Skip upstream CORS headers — we set our own
      if (lower.startsWith('access-control-')) continue;
      responseHeaders[k] = v;
    }
    // Set our CORS headers
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`[MISSAV-J Proxy] Running on http://localhost:${PORT}`);
  console.log(`[MISSAV-J Proxy] Proxying to ${TARGET}`);
});
