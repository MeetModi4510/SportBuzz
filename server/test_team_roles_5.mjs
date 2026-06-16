import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRoles() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        const html = $('a:contains("Shubman Gill")').parent().parent().html();
        console.log(html);
        
    } catch(e) { console.error(e); }
}
testTeamRoles();
