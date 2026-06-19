import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.log('BROWSER CONSOLE ERROR:', msg.text());
      }
  });
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));
  
  await page.goto('http://localhost:5173/match/153761', { waitUntil: 'networkidle0' });
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("BODY LENGTH:", bodyHTML.length);
  if (bodyHTML.length < 500) {
      console.log("BODY CONTENT:", bodyHTML);
  }
  
  await browser.close();
})();
