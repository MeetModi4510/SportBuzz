import axios from 'axios';
import * as cheerio from 'cheerio';

async function testProfileScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        console.log("Looking for Personal Info...");
        $('div').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt === 'Born' || txt === 'Teams' || txt === 'Batting Style') {
                console.log(txt, ":", $(el).parent().html());
            }
        });

    } catch(e) { console.error(e); }
}
testProfileScrape();
