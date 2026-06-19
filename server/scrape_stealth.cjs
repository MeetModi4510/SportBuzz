const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('Launching stealth browser...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to full commentary page...');
    const matchId = '129563';
    const url = `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded. Checking for Cloudflare...');

    // Quick check if we are on a Cloudflare challenge
    const title = await page.title();
    console.log('Page Title:', title);
    if (title.includes('Just a moment') || title.includes('Cloudflare')) {
        console.log('Still blocked by Cloudflare! Waiting a bit longer to see if it resolves automatically...');
        await new Promise(r => setTimeout(r, 10000));
        console.log('New Title:', await page.title());
    }

    console.log('Extracting Innings Tabs...');
    const tabs = await page.evaluate(() => {
        const t = [];
        document.querySelectorAll('.cb-nav-tab').forEach(el => {
            if (el.innerText.includes('Innings') || el.innerText.includes('Preview')) {
                t.push({ text: el.innerText.trim(), id: el.id });
            }
        });
        return t;
    });
    console.log('Tabs Found:', tabs);

    let allCommentary = [];

    // Helper to scroll and extract
    const scrollAndExtract = async (tabName) => {
        console.log(`\n--- Processing Tab: ${tabName} ---`);
        let previousHeight = 0;
        let noChangeCount = 0;
        
        // Scroll to trigger lazy loads
        for (let i = 0; i < 30; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 1500)); // Wait for XHR
            
            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) {
                noChangeCount++;
                if (noChangeCount >= 3) {
                    console.log('Reached bottom of this tab.');
                    break;
                }
            } else {
                noChangeCount = 0;
                previousHeight = newHeight;
                console.log(`Scrolled down... (Height: ${newHeight})`);
            }
        }

        // Extract text
        const comms = await page.evaluate(() => {
            const items = [];
            // Target the specific commentary paragraph classes
            document.querySelectorAll('p[itemprop="articleBody"], .cb-com-ln, .cb-com-ln-text').forEach(p => {
                items.push(p.innerText.replace(/\n/g, ' '));
            });
            return items;
        });
        console.log(`Extracted ${comms.length} items from ${tabName}.`);
        return comms;
    };

    // Extract default tab (usually the latest or Preview)
    allCommentary.push({
        tab: 'Default_Load',
        commentary: await scrollAndExtract('Default_Load')
    });

    // Try clicking other tabs
    for (const tab of tabs) {
        if (!tab.id) continue;
        console.log(`\nClicking Tab: ${tab.text}`);
        try {
            await page.click(`#${tab.id}`);
            await new Promise(r => setTimeout(r, 3000)); // Wait for tab to load
            const comms = await scrollAndExtract(tab.text);
            allCommentary.push({ tab: tab.text, commentary: comms });
        } catch(e) {
            console.error(`Error clicking tab ${tab.text}:`, e.message);
        }
    }

    fs.writeFileSync('full_commentary_extracted.json', JSON.stringify(allCommentary, null, 2));
    console.log('\nSaved all extracted commentary to full_commentary_extracted.json!');

    await browser.close();
})();
