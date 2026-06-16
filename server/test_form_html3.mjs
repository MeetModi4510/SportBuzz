import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFormScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/13866/sai-sudharsan', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('div').each((i, el) => {
            if ($(el).text().trim() === 'Batting Form') {
                const p = $(el).parent().parent();
                console.log(p.html().substring(0, 800));
            }
        });
    } catch(e) { console.error(e); }
}
testFormScrape();
