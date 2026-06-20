const puppeteer = require('puppeteer');

async function scrapeH2HDOM() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    console.log("Navigating to Cricbuzz India Results page...");
    await page.goto('https://www.cricbuzz.com/cricket-team/india/2/results', { waitUntil: 'networkidle2' });
    
    console.log("Extracting match text...");
    const matchTexts = await page.evaluate(() => {
        return document.body.innerText;
    });
    
    await browser.close();
    
    const lines = matchTexts.split('\n');
    let h2hCount = 0;
    
    console.log("\n--- RECENT INDIA VS AFGHANISTAN MATCHES ---");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('afghanistan')) {
            console.log(`Match context:`);
            console.log(lines.slice(Math.max(0, i-2), Math.min(lines.length, i+4)).join(' | '));
            h2hCount++;
        }
    }
    if (h2hCount === 0) console.log("No Afghanistan matches found in the text.");
}

scrapeH2HDOM();
