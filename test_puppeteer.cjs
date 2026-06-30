const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.goto('https://www.bdfutbol.com/en/s/2002.html', { waitUntil: 'networkidle2' });
        
        // Wait a few seconds for potential JS challenge to resolve
        await new Promise(r => setTimeout(r, 5000));
        
        const content = await page.content();
        if (content.includes('Etihad')) {
            console.log('Success! Puppeteer stealth bypassed Cloudflare.');
        } else {
            console.log('Failed to bypass Cloudflare.');
        }
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
