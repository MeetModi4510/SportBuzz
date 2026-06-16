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

        // Helper function to extract stats
        async function extractPlayer(name, url) {
            console.log(`\n\n=== EXTRACTING ${name.toUpperCase()} ===`);
            console.log(`URL: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 1500));
            
            const html = await page.content();
            const $ = cheerio.load(html);
            
            const photo = $('img').filter((i, el) => $(el).attr('src') && $(el).attr('src').includes('player')).attr('src');
            console.log(`PHOTO: ${photo}`);

            const extractTable = (title) => {
                let stats = [];
                let foundTable = false;
                $('.cb-plyr-tbl').each((i, table) => {
                    if (foundTable) return;
                    const prevText = $(table).prev('div').text().trim();
                    if (prevText.includes(title)) {
                        foundTable = true;
                        
                        // Extract headers
                        const headers = [];
                        $(table).find('thead th').each((j, th) => headers.push($(th).text().trim()));
                        console.log(`\n-- ${title} HEADERS --`);
                        console.log(headers.join(' | '));
                        
                        // Extract rows
                        console.log(`\n-- ${title} ROWS --`);
                        $(table).find('tbody tr').each((j, tr) => {
                            const row = [];
                            $(tr).find('td').each((k, td) => row.push($(td).text().trim()));
                            console.log(row.join(' | '));
                        });
                    }
                });
            };

            extractTable('Batting Career Summary');
            extractTable('Bowling Career Summary');
        }

        // Shubman Gill
        await extractPlayer('Shubman Gill', 'https://www.cricbuzz.com/profiles/11808/shubman-gill');

        // Australia Squad -> Find Mitchell Starc
        await page.goto('https://www.cricbuzz.com/cricket-team/australia/4/players', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1500));
        let squadHtml = await page.content();
        let $s = cheerio.load(squadHtml);
        
        let starcUrl = '';
        $s('a').each((i, el) => {
            const name = $s(el).text().trim();
            if (name === 'Mitchell Starc') {
                starcUrl = 'https://www.cricbuzz.com' + $s(el).attr('href');
            }
        });

        if (starcUrl) {
            await extractPlayer('Mitchell Starc', starcUrl);
        } else {
            console.log('Mitchell Starc not found in squad list');
            // Try known ID
            await extractPlayer('Mitchell Starc', 'https://www.cricbuzz.com/profiles/7710/mitchell-starc');
        }

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
