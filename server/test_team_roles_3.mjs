import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRoles() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let currentRole = 'Batter';
        
        $('.cb-col.cb-col-100').each((i, el) => {
            const header = $(el).find('.cb-font-16.text-bold.cb-lst-itm-sm').text().trim();
            if (header) {
                currentRole = header;
            }
            
            $(el).find('a').each((j, a) => {
                const href = $(a).attr('href');
                if (href && href.includes('/profiles/')) {
                    const name = $(a).text().trim();
                    if (name && name !== 'Profiles' && name !== 'Players') {
                        console.log(`[${currentRole}] ${name}`);
                    }
                }
            });
        });
    } catch(e) { console.error(e); }
}
testTeamRoles();
