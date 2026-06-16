import axios from 'axios';
import * as cheerio from 'cheerio';

async function testRankingsScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('table').each((i, table) => {
            const firstTh = $(table).find('th').first().text().trim();
            if (firstTh === 'Format') {
                console.log(`\n--- TABLE ${i} ---`);
                const parentHtml = $(table).parent().html();
                console.log($(table).parent().attr('class'), $(table).parent().attr('id'));
                
                $(table).find('tr').each((j, tr) => {
                    const tds = $(tr).find('td');
                    if (tds.length >= 3) {
                        const format = $(tds[0]).text().trim();
                        const rankHtml = $(tds[1]).html();
                        const rankText = $(tds[1]).text().trim();
                        console.log(`Format: ${format}, Rank HTML: ${rankHtml}, Rank Text: ${rankText}`);
                    }
                });
            }
        });

    } catch(e) { console.error(e); }
}
testRankingsScrape();
