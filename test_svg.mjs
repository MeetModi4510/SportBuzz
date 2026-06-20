import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  await page.goto('https://www.cricbuzz.com/live-cricket-graphs/148415/ind-vs-afg-3rd-odi-afghanistan-tour-of-india-2026', {waitUntil: 'networkidle2'});
  
  console.log("Looking for Win Probability tab...");
  // Find the exact div/span/a that has text "Win Probability"
  const clicked = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const btn = elements.find(el => el.textContent.trim() === 'Win Probability' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.children.length === 0);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  
  if (clicked) {
    console.log("Clicked! Waiting 3 seconds for chart to render...");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("Could not find Win Probability tab");
  }

  const svgs = await page.$$eval('svg', svgs => svgs.map(svg => svg.outerHTML));
  fs.writeFileSync('svgs.json', JSON.stringify(svgs));
  console.log('Extracted ' + svgs.length + ' svgs');
  await browser.close();
})();