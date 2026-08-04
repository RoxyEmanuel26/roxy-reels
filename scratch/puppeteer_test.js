const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => {
      if (response.url().includes('/api/posts')) {
        console.log('API RESPONSE:', response.url(), response.status());
      }
    });

    console.log('Navigating to https://www.missav-j.com/');
    await page.goto('https://www.missav-j.com/', { waitUntil: 'networkidle2' });
    
    console.log('Wait 5 seconds to let feed render...');
    await new Promise(r => setTimeout(r, 5000));
    
    const videoCount = await page.evaluate(() => document.querySelectorAll('.video-card').length);
    console.log('RENDERED VIDEO CARDS:', videoCount);
    
    const errorCount = await page.evaluate(() => document.querySelectorAll('.empty-state').length);
    console.log('EMPTY STATES (No results):', errorCount);

    const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('BODY HEAD:', bodyHtml);

    await browser.close();
  } catch (err) {
    console.error('Puppeteer Error:', err);
  }
})();
