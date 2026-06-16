import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRoles() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/profiles/')) {
                const name = $(el).text().trim();
                const parentHtml = $(el).parent().html() || '';
                const roleText = $(el).next().text() || $(el).parent().next().text() || 'Unknown';
                if (name && name !== 'Profiles' && name !== 'Players') {
                    console.log(`Name: ${name} | Next text: ${roleText.substring(0, 30)}`);
                    if (i < 5) console.log('Parent HTML:', parentHtml);
                }
            }
        });
    } catch(e) { console.error(e); }
}
testTeamRoles();
