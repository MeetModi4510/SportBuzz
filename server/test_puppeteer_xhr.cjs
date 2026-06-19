const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1280, height: 800 });

    const matchId = '129563';
    const url = `https://www.cricbuzz.com/live-cricket-graphs/${matchId}/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026`;
    
    const jsonResponses = [];

    page.on('response', async (response) => {
        try {
            const reqUrl = response.url();
            const resourceType = response.request().resourceType();
            if (resourceType === 'fetch' || resourceType === 'xhr' || reqUrl.includes('_next/data')) {
                const text = await response.text();
                if (text.includes('ballMap') || text.includes('winProbability') || text.includes('overs') || text.includes('partnership')) {
                    jsonResponses.push({ url: reqUrl, data: text });
                }
            }
        } catch(e) {}
    });

    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded. Waiting for any background requests...');
    await new Promise(r => setTimeout(r, 5000));
    
    fs.writeFileSync('graphs_xhr.json', JSON.stringify(jsonResponses, null, 2));
    console.log(`Saved ${jsonResponses.length} XHR responses containing graph data!`);

    await browser.close();
})();
