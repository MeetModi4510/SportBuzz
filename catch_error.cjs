const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('pageerror', err => { 
      console.log('PAGE ERROR:', err.toString()); 
  });
  
  page.on('console', msg => { 
      if (msg.type() === 'error') {
          console.log('CONSOLE ERROR:', msg.text()); 
      }
  });
  
  try {
      await page.goto('http://localhost:5173/performance-lab', { waitUntil: 'networkidle0' });
      console.log("Page loaded. Clicking Football tab...");
      
      // Click Football tab
      await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const fbBtn = btns.find(b => b.textContent.includes('Football'));
          if (fbBtn) fbBtn.click();
      });
      
      await new Promise(r => setTimeout(r, 2000));
      console.log("Football selected. Clicking player HUD...");
      
      // Click first HUD to open dropdown
      await page.evaluate(() => {
          const huds = Array.from(document.querySelectorAll('h4'));
          const p1 = huds.find(h => h.textContent.includes('Select Player'));
          if (p1) p1.click();
      });
      
      await new Promise(r => setTimeout(r, 2000));
      console.log("Dropdown open. Clicking a player...");
      
      // Click Argentina filter
      await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const arBtn = btns.find(b => b.textContent.includes('ARGENTINA'));
          if (arBtn) arBtn.click();
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      // Click LIONEL SCALONI
      await page.evaluate(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const sca = spans.find(s => s.textContent.includes('LIONEL SCALONI'));
          if (sca) sca.click();
      });
      
      console.log("Player clicked. Waiting for crash...");
      await new Promise(r => setTimeout(r, 3000));
      console.log("Done.");
  } catch (err) {
      console.log("Goto error:", err.message);
  }
  
  await browser.close();
})();
