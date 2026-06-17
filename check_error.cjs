const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER CONSOLE ERROR:', msg.text());
        }
    });

    // Catch page errors (unhandled exceptions)
    page.on('pageerror', err => {
        console.log('BROWSER PAGE ERROR:', err.toString());
    });

    try {
        await page.goto('http://localhost:5173/performance-lab', { waitUntil: 'networkidle0' });
        console.log('Page loaded. Clicking Player VS Player tab...');
        
        // Find the tab by text content and click it
        const tabs = await page.$$('button[role="tab"]');
        for (let tab of tabs) {
            const text = await page.evaluate(el => el.textContent, tab);
            if (text.includes('Player VS Player')) {
                await tab.click();
                console.log('Clicked Player VS Player tab.');
                break;
            }
        }
        
        // Wait a bit for the crash to happen
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({path: 'screenshot.png', fullPage: true});
        console.log('Finished waiting and took screenshot.');
    } catch (e) {
        console.log('SCRIPT ERROR:', e);
    } finally {
        await browser.close();
    }
})();
