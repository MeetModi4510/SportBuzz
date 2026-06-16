import axios from 'axios';
import * as cheerio from 'cheerio';

async function testOrder() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let currentRole = 'Batter';
        
        $('span, a').each((i, el) => {
            const tagName = el.tagName.toLowerCase();
            if (tagName === 'span') {
                const text = $(el).text().trim().toUpperCase();
                if (text === 'BATSMEN') currentRole = 'Batter';
                else if (text === 'ALL ROUNDER') currentRole = 'Allrounder';
                else if (text === 'WICKET KEEPER') currentRole = 'Wicketkeeper';
                else if (text === 'BOWLER') currentRole = 'Bowler';
            } else if (tagName === 'a') {
                const href = $(el).attr('href');
                if (href && href.includes('/profiles/') && $(el).find('img').length > 0) {
                    console.log(`[${currentRole}] ${$(el).text().trim()}`);
                }
            }
        });
    } catch(e) { console.error(e); }
}
testOrder();
