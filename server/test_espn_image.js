import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

async function getIndiaPlayers() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto('https://www.espncricinfo.com/cricketers/team/india-6', { waitUntil: 'networkidle2', timeout: 60000 });
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const players = {};
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/cricketers/') && !href.includes('/team/')) {
                const name = $(el).text().trim();
                if (name && name.length > 2) {
                    players[name] = href;
                }
            }
        });
        
        console.log("Found players on India page:");
        console.log(players);
        
    } catch(e) {
        console.log("Error:", e.message);
    } finally {
        await browser.close();
    }
}
getIndiaPlayers();
