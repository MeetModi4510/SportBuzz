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
            // We want to capture anything that looks like an API call
            if (reqUrl.includes('mcenter') || reqUrl.includes('api/') || reqUrl.includes('_next/data')) {
                if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
                    jsonUrls.add(reqUrl);
                }
            }
        } catch(e) {}
    });

    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Finding and clicking Win Probability tab...');
    const clicked = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        for (let el of divs) {
            if (el.innerText && el.innerText.trim() === 'Win Probability') {
                el.click();
                return true;
            }
        }
        return false;
    });

    console.log('Clicked Win Probability:', clicked);
    
    // Wait for the API call to complete
    await new Promise(r => setTimeout(r, 4000));
    
    const urlsArray = Array.from(jsonUrls);
    fs.writeFileSync('win_prob_urls.json', JSON.stringify(urlsArray, null, 2));
    
    const winProbUrls = urlsArray.filter(u => !u.includes('balls-map'));
    console.log(`Captured ${winProbUrls.length} new URLs!`);
    console.log('New URLs:', winProbUrls);

    await browser.close();
})();
