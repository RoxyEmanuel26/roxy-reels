export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // The path comes from req.url (e.g., /api/v2/users/trending)
  // We need to strip the /api prefix to pass it to redgifs
  const urlPath = req.url.replace(/^\/api/, '');
  const targetUrl = `https://api.redgifs.com${urlPath}`;

  try {
    const proxyHeaders = { ...req.headers };
    // Remove headers that might cause issues or reveal proxy origin
    delete proxyHeaders.host;
    delete proxyHeaders.origin;
    delete proxyHeaders.referer;
    delete proxyHeaders.connection;
    delete proxyHeaders['x-forwarded-for'];
    delete proxyHeaders['x-forwarded-host'];
    delete proxyHeaders['x-forwarded-proto'];
    
    // Inject RedGIFs spoof headers
    proxyHeaders['host'] = 'api.redgifs.com';
    proxyHeaders['origin'] = 'https://www.redgifs.com';
    proxyHeaders['referer'] = 'https://www.redgifs.com/';

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    });

    const data = await response.text();

    // Copy response headers
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
      }
    });

    return res.status(response.status).send(data);
  } catch (error) {
    console.error('[Proxy Error]', error);
    return res.status(502).json({ error: 'Proxy error', message: error.message });
  }
}
