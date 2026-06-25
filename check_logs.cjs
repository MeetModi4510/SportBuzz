const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.log('PAGE ERROR LOG:', msg.text());
      } else {
          console.log('PAGE LOG:', msg.text());
      }
  });
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));

  console.log("Navigating to http://localhost:5173/ ...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
      localStorage.setItem('token', 'dummy');
      localStorage.setItem('user', JSON.stringify({email: 'test@test.com'}));
  });
  
  await page.reload({ waitUntil: 'networkidle2' });

  console.log("Clicking IPL link in sidebar...");
  
  await page.evaluate(() => {
      const link = document.querySelector('a[href="/cricket/series"]');
      if (link) {
          link.click();
      } else {
          console.log("Link not found");
      }
  });

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'd:\\dev_scripts\\screenshot.png' });
  console.log("Screenshot saved.");
  await browser.close();
})();
