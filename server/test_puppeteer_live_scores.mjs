import puppeteer from 'puppeteer';

async function testPuppeteerLiveScores() {
    console.log("=== TESTING LIVE SCORES DOM SCRAPING WITH PUPPETEER ===");
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Go to live scores page
        console.log("Loading live scores page...");
        await page.goto('https://www.cricbuzz.com/cricket-match/live-scores', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for matches to load
        await page.waitForSelector('a[href^="/live-cricket-scores/"]', { timeout: 10000 });
        
        console.log("Page loaded. Extracting match cards...");

        // Evaluate on the browser DOM to extract live score details
        const matches = await page.evaluate(() => {
            const results = [];
            // Target the actual match links
            const matchLinks = document.querySelectorAll('a[href^="/live-cricket-scores/"]');
            
            matchLinks.forEach(link => {
                // Ignore general tabs like /live-cricket-scores/recent-matches
                if (!link.href.match(/\/\d+\//)) return;
                
                const title = link.getAttribute('title') || link.querySelector('h2, h3')?.innerText || 'Unknown Title';
                const scoreText = link.innerText;
                
                results.push({
                    title: title.trim(),
                    rawText: scoreText.replace(/\n/g, ' | ').substring(0, 150)
                });
            });
            
            return results;
        });

        console.log(`\nSuccessfully extracted ${matches.length} matches!`);
        matches.slice(0, 5).forEach(m => {
            console.log(`\nTitle: ${m.title}`);
            console.log(`Score Data: ${m.rawText}`);
        });

    } catch(e) {
        console.error("Puppeteer Failed:", e.message);
    } finally {
        if (browser) await browser.close();
    }
}

testPuppeteerLiveScores();
