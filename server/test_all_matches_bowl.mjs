import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMatchScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill/all-matches/bowling', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('table').each((i, table) => {
            const firstRow = $(table).find('tr').first().text().replace(/\s+/g, ' ').trim();
            if (firstRow.toLowerCase().includes('wickets')) {
                 let count = 0;
                 $(table).find('tr').each((j, tr) => {
                     if (count < 5) {
                         const tds = [];
                         $(tr).find('td').each((k, td) => tds.push($(td).text().trim()));
                         if (tds.length) {
                             console.log("Row:", tds.join(" | "));
                             count++;
                         }
                     }
                 });
            }
        });

    } catch(e) { console.error(e); }
}
testMatchScrape();
