import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function searchDDG() {
    console.log("Launching Puppeteer for DDG Lite...");
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        await page.goto('https://lite.duckduckgo.com/lite/', { waitUntil: 'networkidle2' });
        
        await page.type('input[name="q"]', 'site:cricbuzz.com/cricket-venue "Wankhede Stadium"');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('input[type="submit"]')
        ]);
        
        const firstLink = await page.evaluate(() => {
            const anchor = document.querySelector('a.result-url');
            return anchor ? anchor.innerText.trim() : null;
        });
        
        console.log("Found URL:", firstLink);
        
        if (firstLink) {
            const match = firstLink.match(/cricket-venue\/(\d+)/);
            if (match) console.log("ID:", match[1]);
        }
        
        await browser.close();
    } catch(e) {
        console.log("Error:", e.message);
    }
}
searchDDG();
