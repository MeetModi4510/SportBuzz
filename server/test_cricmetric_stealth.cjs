const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cheerio = require('cheerio');

async function run() {
    console.log("Launching Stealth Puppeteer for Cricmetric...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    try {
        const url = 'https://www.cricmetric.com/sage/?q=narendra+modi+stadium';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log("Initial Page Title:", await page.title());
        
        // Wait for Cloudflare challenge to pass
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        } catch(e) {
            console.log("Wait for navigation error (might already be loaded):", e.message);
        }
        
        console.log("Final Page Title:", await page.title());
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        // Find tables or data
        console.log("--- Extracting Data ---");
        $('table').each((i, el) => {
            console.log(`\nTable ${i + 1}:`);
            const rows = $(el).find('tr');
            rows.each((j, row) => {
                console.log($(row).text().replace(/\s+/g, ' ').trim());
            });
        });

        // Try extracting text specifically
        console.log("Extracting Sage response text...");
        const responseText = $('.sage-response').text() || $('.sage-results').text() || $('.card').text() || $('body').text().replace(/\s+/g, ' ').substring(0, 1000);
        console.log("Response text length:", responseText.length);
        console.log(responseText.substring(0, 500));
        
    } catch(e) {
        console.error("Failed:", e.message);
    } finally {
        await browser.close();
    }
}
run();
