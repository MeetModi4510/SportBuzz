const puppeteer = require('puppeteer');

async function scrapeH2H() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    console.log("Navigating to Cricbuzz India Results page...");
    await page.goto('https://www.cricbuzz.com/cricket-team/india/2/results', { waitUntil: 'networkidle2' });
    
    console.log("Extracting match data...");
    const matches = await page.evaluate(() => {
        try {
            const nextData = window.__NEXT_DATA__;
            return nextData.props.pageProps.initialState.team.results.matchList;
        } catch (e) {
            return null;
        }
    });
    
    await browser.close();
    
    if (matches) {
        const h2hMatches = matches.filter(match => {
            const team1 = match.matchInfo.team1.teamName.toLowerCase();
            const team2 = match.matchInfo.team2.teamName.toLowerCase();
            return team1.includes('afghanistan') || team2.includes('afghanistan');
        });
        
        console.log("\n--- RECENT INDIA VS AFGHANISTAN MATCHES (SCRAPED VIA CRICBUZZ) ---");
        if (h2hMatches.length === 0) {
            console.log("No recent India vs Afghanistan matches found on the current results page.");
        } else {
            h2hMatches.slice(0, 5).forEach((m, idx) => {
                const date = new Date(parseInt(m.matchInfo.startDate)).toDateString();
                console.log(`${idx + 1}. [${date}] ${m.matchInfo.matchDesc}: ${m.matchInfo.status}`);
            });
        }
    } else {
        console.log("Failed to extract data. Cricbuzz may have changed their site structure.");
    }
}

scrapeH2H();
