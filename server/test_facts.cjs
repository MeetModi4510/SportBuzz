const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const { data } = await axios.get('https://www.cricbuzz.com/cricket-match-facts/129563/match', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(data);
        
        console.log("### INFO TABLE");
        $('.facts-row-grid').each((i, el) => {
            const key = $(el).find('div').first().text().trim();
            let valueStr = '';
            
            if (key.toLowerCase().includes('squad')) {
                // Get all the direct text contents inside the squad column
                // The structure usually has headings like "Players", "Bench", "Support Staff"
                const rightCol = $(el).children('div').eq(1);
                valueStr = rightCol.text().trim().replace(/\s{2,}/g, '\n');
            } else {
                valueStr = $(el).children('div').eq(1).text().trim();
            }
            
            if(key === 'Stadium') console.log('\n### VENUE GUIDE');
            if(key === 'Streaming') console.log('\n### BROADCAST GUIDE');
            
            console.log(`**${key}**: ${valueStr}`);
        });
        
    } catch (e) {
        console.error(e);
    }
}
test();
