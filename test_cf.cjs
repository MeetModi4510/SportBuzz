const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log("Launching headless: false...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log("Going to URL...");
    await page.goto('https://www.bdfutbol.com/en/s/2002.html', { waitUntil: 'networkidle2' });
    
    // Wait for the h1 element to ensure we bypassed CF
    try {
        await page.waitForSelector('h1', { timeout: 10000 });
        const h1 = await page.$eval('h1', el => el.textContent);
        console.log("H1:", h1);
        
        const html = await page.content();
        require('fs').writeFileSync('campnou_real.html', html);
        console.log("Saved campnou_real.html");
    } catch (e) {
        console.log("Timeout waiting for h1. Cloudflare might have blocked it.");
    }

    await browser.close();
})();
