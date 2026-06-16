import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRolesHeaders() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('span').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 2 && text === text.toUpperCase() && !text.includes('1') && !text.includes('2')) {
                console.log("UPPERCASE SPAN:", text);
            }
        });
    } catch(e) { console.error(e); }
}
testTeamRolesHeaders();
