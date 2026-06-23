const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to FotMob Transfers...");
  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle0', timeout: 60000 });
  
  for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1000));
  }

  const players = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('a[href*="/players/"]'));
      return rows.map(el => {
          let playerId = '';
          const href = el.getAttribute('href');
          if (href) {
              const match = href.match(/\/players\/(\d+)\//);
              if (match) playerId = match[1];
          }

          const nameEl = el.querySelector('span');
          const nameWithPos = nameEl ? nameEl.textContent.trim() : '';
          
          // Fotmob row usually has several columns if it's a table-like flex layout
          // Let's get all spans in the row
          const allSpans = Array.from(el.querySelectorAll('span')).map(s => s.textContent.trim()).filter(Boolean);
          
          return {
              href,
              playerId,
              nameWithPos,
              allSpans
          };
      });
  });
  
  console.log(JSON.stringify(players.slice(0, 5), null, 2));
  await browser.close();
})();
