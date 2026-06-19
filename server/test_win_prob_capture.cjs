const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const matchId = '129563';
    const url = `https://www.cricbuzz.com/live-cricket-graphs/${matchId}/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026`;
    
    const allResponses = [];

    page.on('response', async (response) => {
        try {
            const reqUrl = response.url();
            const resourceType = response.request().resourceType();
            
            // Capture all fetches and XHRs to see if one contains Win Prob data
            if (resourceType === 'fetch' || resourceType === 'xhr' || reqUrl.includes('_next/data')) {
                const text = await response.text();
                allResponses.push({ url: reqUrl, length: text.length, preview: text.substring(0, 300) });
                
                // Save the full response if it contains graph-like data
                if (text.includes('1st Inn') || text.includes('Draw') || text.includes('NZ') || text.includes('ENG')) {
                    fs.writeFileSync(`response_${Date.now()}.json`, JSON.stringify({url: reqUrl, data: text}));
                }
            }
        } catch(e) {}
    });

    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Clicking ALL tabs...');
    await page.evaluate(() => {
        document.querySelectorAll('div').forEach(el => {
            if (el.innerText === 'Win Probability' || el.innerText === 'Partnerships' || el.innerText === 'Ball Map') {
                el.click();
            }
        });
    });

    await new Promise(r => setTimeout(r, 4000));
    
    fs.writeFileSync('all_xhr_responses.json', JSON.stringify(allResponses, null, 2));
    console.log(`Captured ${allResponses.length} total XHR responses!`);

    await browser.close();
})();
