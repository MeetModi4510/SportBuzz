const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to FotMob Transfers...");
  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Scroll down a few times to trigger any lazy loading
  for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1000));
  }

  const players = await page.evaluate(() => {
      // Find the rows in the transfer center table
      const rows = Array.from(document.querySelectorAll('a[href*="/players/"]'));
      return rows.map(el => {
          const nameEl = el.querySelector('span') || el;
          // FotMob puts position right next to name like "Jan Paul van HeckeCB"
          return nameEl.textContent.trim();
      }).filter(n => n.length > 0);
  });
  
  const uniquePlayers = [...new Set(players)];
  console.log("=== TOTAL PLAYERS FOUND:", uniquePlayers.length, "===");
  console.log(JSON.stringify(uniquePlayers, null, 2));

  await browser.close();
})();
