const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // We will store all API URLs called that look like commentary
    const apiUrls = [];
    let allCommentary = "";

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('commentary') || url.includes('_next/data')) {
            try {
                if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
                    apiUrls.push(url);
                }
            } catch (e) {}
        }
    });

    console.log('Navigating to full commentary page...');
    await page.goto('https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026', { waitUntil: 'networkidle2' });

    console.log('Page loaded. Scrolling to bottom to trigger lazy loading...');
    
    // Scroll down multiple times to load more commentary
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1000));
    }

    // Extract commentary text directly from the DOM
    const commentaryDOM = await page.evaluate(() => {
        const comms = [];
        // Typically Cricbuzz commentary has paragraphs with specific classes or bold text for overs
        const items = document.querySelectorAll('p[itemprop="articleBody"], .cb-com-ln, .cb-com-ln-text');
        items.forEach(item => comms.push(item.innerText.replace(/\n/g, ' ')));
        return comms;
    });

    console.log(`Extracted ${commentaryDOM.length} DOM commentary items.`);
    
    const tabs = await page.evaluate(() => {
        const t = [];
        document.querySelectorAll('a').forEach(a => {
            if (a.innerText.includes('Innings')) {
                t.push({ text: a.innerText, href: a.href });
            }
        });
        return t;
    });

    console.log('Found Innings Tabs:', tabs);
    console.log('API URLs triggered:', [...new Set(apiUrls)]);

    const dump = {
        apiUrls: [...new Set(apiUrls)],
        tabs: tabs,
        domCommentaryPreview: commentaryDOM.slice(0, 50)
    };

    fs.writeFileSync('full_comm_dump.json', JSON.stringify(dump, null, 2));
    console.log('Saved dump to full_comm_dump.json');

    await browser.close();
})();
