import { connect } from 'puppeteer-real-browser';
import * as cheerio from 'cheerio';

async function test() {
    let browserInstance;
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });
        browserInstance = browser;

        // Test Squad Page
        await page.goto('https://www.cricbuzz.com/cricket-team/india/2/players', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        let html = await page.content();
        let $ = cheerio.load(html);
        
        const players = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/profiles/')) {
                const name = $(el).text().trim();
                const img = $(el).find('img').attr('src');
                if (name && name !== 'Profiles' && name !== 'Players') {
                    players.push({ name, url: 'https://www.cricbuzz.com' + href, img });
                }
            }
        });
        console.log('INDIA SQUAD EXTRACTED LINKS:', players.slice(0, 5));

        // Test Player Page
        await page.goto('https://www.cricbuzz.com/profiles/10713/shubman-gill', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        html = await page.content();
        $ = cheerio.load(html);
        
        let photo = $('img').filter((i, el) => $(el).attr('src') && $(el).attr('src').includes('player')).attr('src');
        console.log('GILL PHOTO:', photo);

        console.log('--- TABLE HEADERS ---');
        $('table th').each((i, el) => console.log($(el).text().trim()));

        console.log('--- BATTING STATS ROWS ---');
        $('table').first().find('tbody tr').each((i, row) => {
            const rowData = [];
            $(row).find('td').each((j, td) => rowData.push($(td).text().trim()));
            console.log(rowData);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (browserInstance) await browserInstance.close();
    }
}
test();
