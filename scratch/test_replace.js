const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const fullTitle = 'TEST TITLE';
const description = 'TEST DESCRIPTION';
const cleanEmbedUrl = 'https://server.apijav.com/embed/96475';

const escapeHtml = (str) => str;

const seoFallbackContent = `
        <div class="seo-fallback" style="width: 100%; max-width: 1200px; margin: 0 auto;">
          <h1 style="position: absolute; width: 1px; height: 1px; overflow: hidden;">${escapeHtml(fullTitle)}</h1>
          <p style="position: absolute; width: 1px; height: 1px; overflow: hidden;">${escapeHtml(description)}</p>
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000;">
            <iframe src="${escapeHtml(cleanEmbedUrl)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
          </div>
        </div>
`;

console.log('Testing replacement...');
const newHtml = htmlContent.replace(/<div class="seo-fallback"[^>]*>[\s\S]*?<\/div>/i, () => seoFallbackContent);

const hasIframe = newHtml.includes('<iframe');
console.log('Contains iframe in output?', hasIframe);

const appContentMatch = newHtml.match(/<div id="app-content">([\s\S]*?)<\/main>/i);
if (appContentMatch) {
  console.log('App Content Block output:');
  console.log(appContentMatch[1].trim());
}
