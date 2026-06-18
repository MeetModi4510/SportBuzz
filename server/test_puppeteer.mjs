import puppeteer from 'puppeteer';

async function scrapeWithPuppeteer() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto('https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026', { waitUntil: 'networkidle2' });
    
    // Find an element containing "IND Innings" and click it
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span, div, button, a'));
        for (const el of spans) {
            if (el.textContent && el.textContent.trim() === 'IND Innings') {
                el.click();
                return;
            }
        }
    });
    
    // Wait for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.screenshot({ path: 'cricbuzz_after_click.png' });
    
    // Scrape balls
    const balls = await page.evaluate(() => {
        const found = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
            const txt = el.textContent ? el.textContent.trim() : '';
            if (txt.match(/^\d+\.\d+$/)) {
                // If it's a small element like span or p, it's a ball
                if (el.tagName.toLowerCase() === 'span' || el.tagName.toLowerCase() === 'p' || el.tagName.toLowerCase() === 'div') {
                    // Check if parent has commentary text
                    found.push(txt);
                }
            }
        }
        // Unique
        return [...new Set(found)];
    });
    
    console.log('Balls after click:', balls.length);
    if (balls.length > 0) console.log('First 5:', balls.slice(0, 5));

    await browser.close();
}
scrapeWithPuppeteer();
