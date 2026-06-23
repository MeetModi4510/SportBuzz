const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      console.log('API Request:', url);
    }
  });

  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle2' });
  await browser.close();
})();
