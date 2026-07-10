import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let jsonData = null;
  page.on('response', async (response) => {
    if (response.url().includes('/api/data/transfers')) {
        console.log('Intercepted API:', response.url());
        try {
            const data = await response.json();
            if (data && data.transfers && data.transfers.length > 0) {
                jsonData = data.transfers;
            }
        } catch (e) {}
    }
  });

  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle2' });
  
  if (jsonData) {
      console.log('Found transfers:', jsonData.slice(0, 3).map(t => t.name));
  } else {
      console.log('No JSON data found');
  }
  
  await browser.close();
})();
