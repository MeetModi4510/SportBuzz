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
    
    const jsonUrls = new Set();

    page.on('response', async (response) => {
        try {
            const reqUrl = response.url();
            if (reqUrl.includes('mcenter') || reqUrl.includes('api/') || reqUrl.includes('_next/data')) {
                if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
                    jsonUrls.add(reqUrl);
                }
            }
        } catch(e) {}
    });

    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Clicking tabs to trigger APIs...');
    const tabsToClick = await page.evaluate(() => {
        const tabs = [];
        document.querySelectorAll('div').forEach(el => {
            if (el.innerText === 'Win Probability' || el.innerText === 'Partnerships') {
                el.id = 'tab_' + el.innerText.replace(' ', '');
                tabs.push(el.id);
            }
        });
        return tabs;
    });

    for (const tabId of tabsToClick) {
        console.log('Clicking', tabId);
        try {
            await page.click(`#${tabId}`);
            await new Promise(r => setTimeout(r, 3000));
        } catch(e) {}
    }
    
    fs.writeFileSync('graphs_urls.json', JSON.stringify(Array.from(jsonUrls), null, 2));
    console.log(`Saved captured URLs!`);

    await browser.close();
})();
