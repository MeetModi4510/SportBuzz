import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMatchScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill/all-matches/batting', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        console.log("Checking tables...");
        $('table').each((i, table) => {
            const firstRow = $(table).find('tr').first().text().replace(/\s+/g, ' ').trim();
            console.log("Table", i, "First Row:", firstRow);
            if (firstRow.toLowerCase().includes('match')) {
                 // Sample first few rows
                 let count = 0;
                 $(table).find('tbody tr').each((j, tr) => {
                     if (count < 3) {
                         console.log("Row:", $(tr).text().replace(/\s+/g, ' ').trim());
                         count++;
                     }
                 });
            }
        });

    } catch(e) { console.error(e); }
}
testMatchScrape();
