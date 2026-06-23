const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle0', timeout: 60000 });
  
  const html = await page.evaluate(() => {
      const playerLink = document.querySelector('a[href*="/players/"]');
      if (!playerLink) return 'No playerLink found';
      // Go up until we find a row-like container, probably a div or tr with multiple children
      let row = playerLink;
      while (row.parentElement && row.parentElement.childElementCount < 3 && row.tagName !== 'TR') {
          row = row.parentElement;
      }
      return row.parentElement ? row.parentElement.outerHTML : row.outerHTML;
  });
  
  console.log(html);
  await browser.close();
})();
