import axios from 'axios';
import * as cheerio from 'cheerio';

async function testRankingsBumrah() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/9311/jasprit-bumrah', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let activeCategory = 'batting';
        const rankingsDiv = $('div:contains("ICC RANKINGS")').last().parent().parent();
        console.log("Found rankings div:", rankingsDiv.length);
        
        rankingsDiv.find('button').each((i, btn) => {
            const cls = $(btn).attr('class');
            const txt = $(btn).text().trim();
            console.log("Button:", txt, "| Classes:", cls);
            if ($(btn).hasClass('bg-white') || (cls && cls.includes('bg-white'))) {
                activeCategory = txt.toLowerCase().replace('-', '');
            }
        });
        console.log("Detected Active Category:", activeCategory);
        
        $('table').each((i, table) => {
            const firstTh = $(table).find('th').first().text().trim();
            if (firstTh === 'Format') {
                console.log(`\n--- TABLE ${i} ---`);
                $(table).find('tr').each((j, tr) => {
                    const tds = $(tr).find('td');
                    if (tds.length >= 3) {
                        const format = $(tds[0]).text().trim();
                        const rankVal = $(tds[1]).find('span').first().text().trim() || $(tds[1]).text().trim();
                        console.log(`Format: ${format}, Rank: ${rankVal}`);
                    }
                });
            }
        });

    } catch(e) { console.error(e); }
}
testRankingsBumrah();
