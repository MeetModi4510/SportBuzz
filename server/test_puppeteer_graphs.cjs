const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('Launching stealth browser...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1280, height: 800 });

    const matchId = '129563';
    const url = `https://www.cricbuzz.com/live-cricket-graphs/${matchId}/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026`;
    console.log('Navigating to', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Waiting for graphs to render...');
    await new Promise(r => setTimeout(r, 5000));
    
    const title = await page.title();
    console.log('Page Title:', title);

    // Extract HTML body to see what classes are generated
    const html = await page.content();
    fs.writeFileSync('graphs_puppeteer.html', html);
    console.log('Saved rendered HTML to graphs_puppeteer.html');

    // Let's specifically look for the Ball Map
    const ballMapData = await page.evaluate(() => {
        // Try to find the grid container
        // The screenshot shows columns 1-20 and numbers
        const els = Array.from(document.querySelectorAll('div, span, p')).filter(el => {
            return el.innerText && el.innerText.includes('Ball Map');
        });
        
        let containerHtml = "Not found";
        if (els.length > 0) {
            // Find a large parent container
            containerHtml = els[els.length - 1].parentElement.parentElement.innerHTML;
        }
        return containerHtml.substring(0, 500);
    });

    console.log('\nBall Map Container Preview:');
    console.log(ballMapData);

    await browser.close();
})();
