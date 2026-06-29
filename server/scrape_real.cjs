const { connect } = require("puppeteer-real-browser");
const fs = require('fs');

async function scrape() {
    try {
        console.log('Connecting with puppeteer-real-browser...');
        const { browser, page } = await connect({
            headless: false,
            args: [],
            customConfig: {},
            turnstile: true,
            connectOption: {}
        });

        console.log('Navigating...');
        await page.goto('https://www.bdfutbol.com/en/s/2002.html', { waitUntil: 'networkidle2' });
        
        console.log('Extracting data...');
        // Waiting a bit just in case
        await new Promise(r => setTimeout(r, 5000));
        
        const html = await page.content();
        fs.writeFileSync('bdfutbol2.html', html);
        
        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error(e);
    }
}

scrape();
