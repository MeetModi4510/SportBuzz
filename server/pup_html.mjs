import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Navigating to page...');
  await page.goto('https://www.cricbuzz.com/live-cricket-full-commentary/129563/nz-vs-eng-2nd-test-new-zealand-tour-of-england-2026', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  fs.writeFileSync('cb_full_comm_pup.html', content);
  
  console.log('Jacob Bethell occurrences:', content.split('Jacob Bethell').length - 1);
  console.log('Jamieson occurrences:', content.split('Jamieson').length - 1);
  console.log('291-7 occurrences:', content.split('291-7').length - 1);
  
  await browser.close();
})();
