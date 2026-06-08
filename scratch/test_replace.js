const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const fullTitle = 'TEST TITLE';
const description = 'TEST DESCRIPTION';
const cleanEmbedUrl = 'https://server.apijav.com/embed/96475';

const escapeHtml = (str) => str;

const seoFallbackContent = `
        <div class="seo-fallback" style="display: none;">
          <h1>${escapeHtml(fullTitle)}</h1>
          <p>${escapeHtml(description)}</p>
          <iframe src="${escapeHtml(cleanEmbedUrl)}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>
        </div>
`;

console.log('Testing replacement...');
const newHtml = htmlContent.replace(/<div class="seo-fallback" style="display: none;">[\s\S]*?<\/div>/i, seoFallbackContent);

const hasIframe = newHtml.includes('<iframe');
console.log('Contains iframe in output?', hasIframe);

const appContentMatch = newHtml.match(/<div id="app-content">([\s\S]*?)<\/main>/i);
if (appContentMatch) {
  console.log('App Content Block output:');
  console.log(appContentMatch[1].trim());
}
