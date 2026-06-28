const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

async function testStealth() {
    console.log("Launching Puppeteer with Stealth Plugin...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        console.log("Navigating to StatGuru advanced filter endpoint...");
        // Target StatGuru advanced endpoint for Eden Gardens highest totals
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;filter=advanced;ground=57980;template=results;type=team;view=innings`;
        
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log("Status Code:", response.status());
        
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('stealth_eden.html', html);
        console.log("Saved stealth_eden.html");
        
        const $ = cheerio.load(html);
        
        const nextData = $('#__NEXT_DATA__').html();
        if (nextData) {
            console.log("__NEXT_DATA__ FOUND! Length:", nextData.length);
            const json = JSON.parse(nextData);
            
            // Dump to file to investigate
            const fs = require('fs');
            fs.writeFileSync('stealth_next_data.json', JSON.stringify(json, null, 2));
            console.log("Saved to stealth_next_data.json");
            
            console.log("Keys in data:", Object.keys(json.props?.appPageProps?.data || {}));
        } else {
            console.log("No __NEXT_DATA__ found. Page title:", $('title').text());
        }
        
    } catch (e) {
        console.error("Error during Puppeteer Stealth execution:", e);
    } finally {
        await browser.close();
    }
}

testStealth();
