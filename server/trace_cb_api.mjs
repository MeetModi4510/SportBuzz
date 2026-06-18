import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('commentary') || url.includes('.json')) {
      const type = response.headers()['content-type'] || '';
      if (type.includes('json') || type.includes('text')) {
        console.log(`[Network] ${url} - ${type}`);
        try {
            const text = await response.text();
            if (text.includes('Jamieson') || text.includes('commentaryList')) {
                console.log(`  -> Contains target data! Length: ${text.length}`);
            }
        } catch (e) {}
      }
    }
  });

  console.log('Navigating to page...');
  await page.goto('https://www.cricbuzz.com/live-cricket-full-commentary/129563/nz-vs-eng-2nd-test-new-zealand-tour-of-england-2026', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
