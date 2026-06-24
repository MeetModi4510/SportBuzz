import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeFotmob() {
  const url = 'https://www.fotmob.com/teams/6706/overview/argentina';
  console.log(`Starting headless browser to scrape: ${url} ...`);

  try {
    const browser = await puppeteer.launch({
      headless: "new"
    });
    const page = await browser.newPage();
    
    // Set a realistic user agent to bypass basic bot protection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    console.log('Navigating to the page (this might take a few seconds)...');
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract the hidden __NEXT_DATA__ JSON state used by the React app
    const nextDataJson = await page.evaluate(() => {
      const scriptTag = document.getElementById('__NEXT_DATA__');
      return scriptTag ? scriptTag.innerText : null;
    });

    console.log('\n--- SCRAPE SUCCESSFUL ---');

    if (nextDataJson) {
       const data = JSON.parse(nextDataJson);
       const apiData = data.props.pageProps;
       fs.writeFileSync('fotmob_api_data.json', JSON.stringify(apiData, null, 2));
       console.log('✅ Successfully extracted the raw internal JSON data API payload!');
    } else {
       console.log('Could not find internal JSON state.');
    }

    await browser.close();
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

scrapeFotmob();
