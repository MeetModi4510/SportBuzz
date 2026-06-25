const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.cricbuzz.com/cricket-series/7607/indian-premier-league-2024/matches', { waitUntil: 'networkidle2' });
  
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      text: document.body.innerText.substring(0, 2000)
    };
  });

  console.log("Title:", info.title);
  console.log("Text:", info.text.replace(/\n/g, ' '));
  await browser.close();
})();
