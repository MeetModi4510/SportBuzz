import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle2' });
  
  // click rumors button
  const buttons = await page.$$('button');
  for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('rumors')) {
          console.log('Clicking rumors button...');
          await btn.click();
          await page.waitForTimeout(2000);
          break;
      }
  }

  // grab player names from the list
  const names = await page.$$eval('span', spans => spans.map(s => s.textContent));
  const uniqueNames = [...new Set(names)].filter(n => n && n.length > 3);
  console.log('Spans on page:', uniqueNames.slice(0, 50));
  
  await browser.close();
})();
