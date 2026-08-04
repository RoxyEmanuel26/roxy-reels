const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    console.log('Navigating to https://www.missav-j.com/');
    await page.goto('https://www.missav-j.com/', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 8000));
    
    const gridHtml = await page.evaluate(() => {
      const grid = document.getElementById('video-grid');
      return grid ? grid.innerHTML : 'NO GRID FOUND';
    });
    console.log('GRID HTML LENGTH:', gridHtml.length);
    console.log('GRID HTML PREVIEW:', gridHtml.substring(0, 1000));

    await browser.close();
  } catch (err) {
    console.error('Puppeteer Error:', err);
  }
})();
