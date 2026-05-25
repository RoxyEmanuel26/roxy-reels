/**
 * MISSAV-J — Open Graph Meta Tag Injector for Watch Pages
 * Serves index.html with dynamically injected SEO & Open Graph meta tags 
 * to support rich preview cards on social platforms like X (Twitter), Facebook, and Pinterest.
 */

const fs = require('fs');
const path = require('path');

// Helper to escape HTML characters safely
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async (req, res) => {
  // Read index.html from workspace root
  const htmlPath = path.join(process.cwd(), 'index.html');
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  } catch (err) {
    console.error('Failed to read index.html:', err);
    return res.status(500).send('Internal Server Error');
  }

  // Parse parameters
  const slug = req.query.slug || '';
  const lang = req.query.lang || 'en';
  
  // Try to find post ID from slug or query
  let id = req.query.id || null;
  if (!id && slug) {
    const match = slug.match(/.*-(\d+)$/);
    if (match) {
      id = match[1];
    } else if (slug.match(/^\d+$/)) {
      id = slug;
    }
  }

  // Fallback if no ID is found: serve default index.html
  if (!id) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(htmlContent);
  }

  try {
    // Fetch post details using the internal API endpoint to get translated title and thumbnail
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const apiUrl = `${protocol}://${host}/api/posts?id=${id}&lang=${lang}`;

    console.log(`[Watch OG] Fetching API metadata: ${apiUrl}`);
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': `${protocol}://${host}`
      }
    });

    if (!apiRes.ok) {
      throw new Error(`API returned status ${apiRes.status}`);
    }

    const post = await apiRes.json();
    if (!post || !post.title) {
      throw new Error('Invalid post data received');
    }

    // Prepare tags
    const code = post.code || '';
    const title = post.title;
    const fullTitle = code ? `[${code}] ${title} - MISSAV-J` : `${title} - MISSAV-J`;
    
    // Create clean description
    const description = `Nonton video JAV ${code ? code + ' ' : ''}${title} gratis dengan streaming kualitas premium di MISSAV-J.`;
    
    // Ensure absolute image URL
    let imageUrl = post.thumbnail || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${protocol}://${host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    const pageUrl = `${protocol}://${host}${req.url}`;

    // Perform meta tag replacement in index.html
    htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
    
    htmlContent = htmlContent.replace(
      /<meta name="description" id="meta-description" content="[^"]*"/i,
      `<meta name="description" id="meta-description" content="${escapeHtml(description)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta property="og:url" id="og-url" content="[^"]*"/i,
      `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta property="og:title" id="og-title" content="[^"]*"/i,
      `<meta property="og:title" id="og-title" content="${escapeHtml(fullTitle)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta property="og:description" id="og-description" content="[^"]*"/i,
      `<meta property="og:description" id="og-description" content="${escapeHtml(description)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta property="og:image" id="og-image" content="[^"]*"/i,
      `<meta property="og:image" id="og-image" content="${escapeHtml(imageUrl)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
      `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(fullTitle)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
      `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(description)}"`
    );
    
    htmlContent = htmlContent.replace(
      /<meta name="twitter:image" id="twitter-image" content="[^"]*"/i,
      `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(imageUrl)}"`
    );

    // Dynamic schema metadata for SEO search bots
    if (htmlContent.includes('"@type": "WebSite"')) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": title,
        "description": description,
        "thumbnailUrl": imageUrl,
        "uploadDate": post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
        "embedUrl": post.embed_url || `https://server.apijav.com/embed/${id}`
      };
      htmlContent = htmlContent.replace(
        /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
        `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2)}</script>`
      );
    }

    // Set caching headers for Edge network to cache the dynamic page for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlContent);

  } catch (err) {
    console.error(`[Watch OG Error for ID ${id}]:`, err);
    // Serve default index.html as a fallback to ensure page load still works
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(htmlContent);
  }
};
