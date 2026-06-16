import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFormScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/13866/sai-sudharsan', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let forms = { batting: [], bowling: [] };

        $('div').each((i, el) => {
            if ($(el).text().trim() === 'Batting Form' || $(el).text().trim() === 'Bowling Form') {
                const type = $(el).text().trim() === 'Batting Form' ? 'batting' : 'bowling';
                const container = $(el).closest('.p-4').length ? $(el).closest('.p-4') : $(el).parent().parent();
                
                container.find('div.flex:not(.items-center):not(.bg-\\[\\#FAFAFA\\])').each((j, row) => {
                    // Extract columns
                    const cols = [];
                    $(row).children('div').each((k, col) => {
                        cols.push($(col).text().trim());
                    });
                    if (cols.length >= 4 && cols[0] !== 'Score' && cols[0] !== 'Wickets') {
                        let parsedRuns = parseInt(cols[0].replace(/[^0-9]/g, '')) || 0;
                        if (cols[0] === 'DNB') parsedRuns = 0;
                        forms[type].push({ match: `M${forms[type].length + 1}`, runs: parsedRuns, opp: cols[1], raw: cols[0] });
                    }
                });
            }
        });
        console.log(JSON.stringify(forms, null, 2));
    } catch(e) { console.error(e); }
}
testFormScrape();
