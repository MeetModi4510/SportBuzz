import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testStealthScrape() {
    console.log("Launching stealth browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        console.log("Navigating to ESPNcricinfo Statsguru page (Shubman Gill)...");
        await page.goto('https://stats.espncricinfo.com/ci/engine/player/1070173.html?class=11;template=results;type=batting', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log("Checking if Cloudflare blocked us...");
        const title = await page.title();
        console.log("Page Title:", title);

        if (title.includes("Just a moment") || title.includes("Cloudflare")) {
            console.log("FAILED: Caught by Cloudflare.");
        } else {
            console.log("SUCCESS: Bypassed Cloudflare!");
        
        // Grab the full HTML so we can parse it with Cheerio
        const html = await page.content();
        
        // Use Cheerio to parse the table
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);
        
        // Find the "Career summary" table or the main engineTable with stats
        // On Statsguru, the stats table usually has class 'engineTable' and contains headers like 'Mat', 'Inns', 'Runs'
        let extractedStats = [];
        
        $('table.engineTable').each((i, table) => {
            const firstHeader = $(table).find('th').first().text().trim();
            if (firstHeader === 'Span' || firstHeader === 'Mat' || firstHeader === 'Grouping') {
                $(table).find('tr').each((j, row) => {
                    // Extract all columns in the row
                    const cols = [];
                    $(row).find('th, td').each((k, cell) => {
                        cols.push($(cell).text().trim());
                    });
                    
                    if (cols.length > 5) {
                        extractedStats.push(cols.join(' | '));
                    }
                });
            }
        });

        console.log("===============================");
        console.log("DEEP STATS EXTRACTED FROM STATSGURU");
        console.log("===============================");
        console.log(extractedStats.join('\n'));
        }

    } catch (e) {
        console.error("Error during scraping:", e.message);
    } finally {
        await browser.close();
    }
}

testStealthScrape();
