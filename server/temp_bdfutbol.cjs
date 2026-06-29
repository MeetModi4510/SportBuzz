const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cheerio = require('cheerio');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
        
        console.log('Navigating to URL...');
        await page.goto('https://www.bdfutbol.com/en/s/2002.html', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const content = await page.content();
        const $ = cheerio.load(content);
        
        // Extract basic info as requested
        const title = $('title').text().trim();
        console.log(`\nPage Title: ${title}`);
        
        // Output body text briefly (first 2000 chars) or attempt to grab the main container
        const mainText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
        console.log(`\nExtracted Content Snapshot:\n${mainText}`);
        
        await browser.close();
    } catch (e) {
        console.error('Error during scraping:', e);
        process.exit(1);
    }
})();
