import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRolesHeaders() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        // Print all headers
        $('*').each((i, el) => {
            const text = $(el).text().trim().toLowerCase();
            if (text === 'batters' || text === 'all rounders' || text === 'wicket keepers' || text === 'bowlers') {
                console.log("Found EXACT text:", $(el).text().trim());
                console.log("Element tag:", el.tagName);
                console.log("Element class:", $(el).attr('class'));
            }
        });
    } catch(e) { console.error(e); }
}
testTeamRolesHeaders();
