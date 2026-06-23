const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/data/transfers')) {
      console.log('API call:', url);
    }
  });

  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle2' });
  
  console.log('Clicking Premier League filter...');
  // The league filter might be in a dropdown, but maybe I can find the URL in the network panel.
  // We can just dump all API calls. Let's try to click the league select.
  // Actually, wait, let's just use fotmob API documentation if any or search the web.
  await browser.close();
})();
