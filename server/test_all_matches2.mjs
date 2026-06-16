import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMatchScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill/all-matches/batting', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('div').each((i, el) => {
            if ($(el).text().trim() === 'Score' || $(el).text().trim() === 'Wickets') {
                const p = $(el).parent().parent();
                console.log(p.html().substring(0, 500));
            }
        });

    } catch(e) { console.error(e); }
}
testMatchScrape();
