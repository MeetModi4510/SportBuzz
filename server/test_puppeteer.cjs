const puppeteer = require('puppeteer');

async function run() {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Cricbuzz Squads
    console.log("Fetching Cricbuzz India squad...");
    await page.goto('https://www.cricbuzz.com/cricket-team/india/2/players', { waitUntil: 'networkidle2' });
    const players = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('a').forEach(a => {
            if(a.href && a.href.includes('/profiles/')) {
                links.push(a.innerText.trim());
            }
        });
        return links.filter(l => l);
    });
    console.log(`Cricbuzz India Players (${players.length}):`, players.slice(0, 10));

    // ESPN Statsguru T20I Teams
    console.log("Fetching ESPN Statsguru T20I Team Stats...");
    await page.goto('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=3;type=team', { waitUntil: 'networkidle2' });
    const stats = await page.evaluate(() => {
        const rows = [];
        const trs = document.querySelectorAll('tr.data1');
        trs.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if(tds.length >= 8) {
                rows.push({
                    team: tds[0].innerText.trim(),
                    matches: tds[2].innerText.trim(),
                    won: tds[3].innerText.trim(),
                    lost: tds[4].innerText.trim(),
                    win_loss_ratio: tds[7].innerText.trim()
                });
            }
        });
        return rows;
    });
    console.log(`ESPN Statsguru Teams Found (${stats.length}):`, stats.slice(0, 5));

    await browser.close();
}

run().catch(console.error);
