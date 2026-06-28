const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testPuppeteer() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log("Navigating to StatGuru advanced filter page...");
        // Go to advanced filter page to get dropdown IDs
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;filter=advanced`;
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("Status Code:", response.status());
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        let dropdownId = null;
        $('select[name="ground"] option').each((i, el) => {
            if ($(el).text().toLowerCase().includes('eden gardens')) {
                dropdownId = $(el).attr('value');
                console.log(`Dropdown ID for Eden Gardens:`, dropdownId);
            }
        });
        
        if (dropdownId) {
            console.log("\nNavigating to High/Low Stats for Eden Gardens...");
            const urlHighLow = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;ground=${dropdownId};template=results;type=team;view=innings;sort=score;direction=desc`;
            const hlResponse = await page.goto(urlHighLow, { waitUntil: 'networkidle2', timeout: 30000 });
            console.log("High/Low Status Code:", hlResponse.status());
            
            const hlHtml = await page.content();
            const $hl = cheerio.load(hlHtml);
            const rows = $hl('table.engineTable').eq(2).find('tr.data1, tr.data2');
            
            console.log("Rows found:", rows.length);
            if(rows.length > 0) {
                console.log("Highest Score First row text:", $hl(rows[0]).text().trim().replace(/\n+/g, ' '));
            }
        } else {
            console.log("Could not find dropdown ID. Page title:", $('title').text());
        }
        
    } catch (e) {
        console.error("Error during Puppeteer execution:", e);
    } finally {
        await browser.close();
    }
}

testPuppeteer();
