import axios from 'axios';
import * as cheerio from 'cheerio';

async function testTeamRoles() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let currentRole = 'Batter';
        
        $('*').each((i, el) => {
            const className = $(el).attr('class') || '';
            const text = $(el).text().trim();
            if (['BATTERS', 'ALL ROUNDERS', 'WICKET KEEPERS', 'BOWLERS'].includes(text.toUpperCase())) {
                currentRole = text;
            }
            
            if ($(el).is('a')) {
                const href = $(el).attr('href');
                if (href && href.includes('/profiles/')) {
                    const name = text;
                    if (name && name !== 'Profiles' && name !== 'Players') {
                        // To avoid duplicates, check if it has img
                        if ($(el).find('img').length > 0) {
                            console.log(`[${currentRole}] ${name}`);
                        }
                    }
                }
            }
        });
    } catch(e) { console.error(e); }
}
testTeamRoles();
