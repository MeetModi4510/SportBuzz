const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        console.log('Navigating to BDFutbol...');
        await page.goto('https://www.bdfutbol.com/en/s/2002.html', { waitUntil: 'networkidle2' });
        
        console.log('Extracting stadium details...');
        const stadiums = await page.evaluate(() => {
            const results = [];
            // Assuming table rows contain the data, maybe class "taula" or something.
            // BDFutbol usually uses tables. Let's grab all rows that might contain stadium info.
            // Wait, we don't know the exact structure. Let's just dump the HTML first so we can parse it locally, 
            // or return the innerText of the main content area.
            
            // For now, let's just get the entire body HTML and save it, so we can parse it locally without hitting CF again.
            return document.body.innerHTML;
        });
        
        const fs = require('fs');
        fs.writeFileSync('bdfutbol.html', stadiums);
        console.log('Saved to bdfutbol.html');
        
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
