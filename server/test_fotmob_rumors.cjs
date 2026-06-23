const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  // Listen to responses to find the JSON data
  let transfersFound = false;
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api/frontend') && url.includes('transfers')) {
      try {
        const text = await response.text();
        const json = JSON.parse(text);
        
        // Let's traverse the json to find the array of transfers
        // Usually it's deep inside the pageProps or layout
        function findTransfersList(obj) {
            if (Array.isArray(obj)) {
                if (obj.length > 0 && obj[0].name && obj[0].playerId && obj[0].fromClub) {
                    return obj;
                }
                for (let item of obj) {
                    const found = findTransfersList(item);
                    if (found) return found;
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (let key in obj) {
                    const found = findTransfersList(obj[key]);
                    if (found) return found;
                }
            }
            return null;
        }

        const transfers = findTransfersList(json);
        if (transfers && transfers.length > 0) {
            transfersFound = true;
            console.log("=== FOUND TRANSFERS VIA API INTERCEPT ===");
            console.log(transfers.slice(0, 10).map(t => `${t.name} (${t.fromClub} -> ${t.toClub})`).join('\n'));
        }
      } catch (e) {
        // Not JSON or failed to parse
      }
    }
  });

  console.log("Navigating to FotMob Transfers...");
  await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle0', timeout: 30000 });
  
  if (!transfersFound) {
      console.log("Could not find transfers from API payload. Attempting DOM scrape...");
      // Try DOM scrape if API intercept failed
      const names = await page.evaluate(() => {
          // Find the rows in the transfer center table
          const rows = Array.from(document.querySelectorAll('a[href*="/players/"]'));
          return rows.map(el => {
              const nameEl = el.querySelector('span') || el;
              return nameEl.textContent.trim();
          }).filter(n => n.length > 0);
      });
      console.log("=== DOM SCRAPED NAMES ===");
      // De-duplicate and log
      console.log([...new Set(names)].slice(0, 15).join('\n'));
  }

  await browser.close();
})();
