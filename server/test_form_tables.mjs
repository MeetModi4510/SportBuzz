import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFormScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/13866/sai-sudharsan', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('table').each((i, table) => {
            const context = $(table).prev('div').text().trim() || $(table).parent().prev('div').text().trim() || $(table).closest('.cb-bg-white').find('div').first().text().trim();
            console.log("Table", i, "Context:", context.substring(0, 30));
            const firstRow = $(table).find('tr').first().text().replace(/\s+/g, ' ');
            console.log("First Row:", firstRow);
        });

    } catch(e) { console.error(e); }
}
testFormScrape();
