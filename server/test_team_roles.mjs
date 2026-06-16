import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRoles() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('a.cb-col.cb-col-50').each((i, el) => {
            const name = $(el).find('div').first().text().trim();
            const textContent = $(el).text().trim();
            console.log(`Player ${i}: ${name} | Full Text: ${textContent}`);
            console.log($(el).html());
        });
    } catch(e) { console.error(e); }
}
testTeamRoles();
