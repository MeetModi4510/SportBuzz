import { connect } from 'puppeteer-real-browser';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
    let browserInstance;
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });
        browserInstance = browser;

        console.log('Visiting Gill Profile...');
        await page.goto('https://www.cricbuzz.com/profiles/11808/shubman-gill', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        
        const html = await page.content();
        fs.writeFileSync('gill.html', html);
        
        const $ = cheerio.load(html);
        
        // Find all tables and their headers
        $('table').each((i, table) => {
            console.log(`\n--- TABLE ${i + 1} ---`);
            const prevText = $(table).prev().text().trim();
            const parentText = $(table).parent().prev().text().trim();
            console.log(`Context: ${prevText} | ${parentText}`);
            
            const headers = [];
            $(table).find('th').each((j, th) => headers.push($(th).text().trim()));
            console.log('Headers:', headers.join(' | '));
            
            $(table).find('tbody tr').each((j, tr) => {
                const row = [];
                $(tr).find('td').each((k, td) => row.push($(td).text().trim()));
                console.log(row.join(' | '));
            });
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (browserInstance) {
            await browserInstance.close();
            process.exit(0);
        }
    }
}
test();
