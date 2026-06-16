import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkScripts() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/9311/jasprit-bumrah', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        let found = false;
        $('script').each((i, el) => {
            const text = $(el).html() || '';
            if (text.includes('ranking') || text.includes('icc')) {
                console.log(`Script ${i}:`, text.substring(0, 200) + '...');
                found = true;
            }
        });
        if (!found) console.log("No scripts with ranking data found.");
    } catch(e) { console.error(e); }
}
checkScripts();
