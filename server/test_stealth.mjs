import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function takeScreenshot() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating...');
    await page.goto('https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026', { waitUntil: 'networkidle2' });
    
    await page.screenshot({ path: 'stealth_before.png' });
    
    console.log('Clicking IND Innings...');
    await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('span, div, button, a, li'));
        for (const el of els) {
            if (el.textContent && el.textContent.trim() === 'IND Innings') {
                el.click();
                return;
            }
        }
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Scrolling down...');
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, 1000);
        });
        await new Promise(r => setTimeout(r, 1500));
    }
    
    await page.screenshot({ path: 'stealth_after.png' });
    
    console.log('Done.');
    await browser.close();
}

takeScreenshot();
