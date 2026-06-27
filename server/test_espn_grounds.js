import axios from 'axios';
import * as cheerio from 'cheerio';

async function testEspnGrounds() {
    try {
        console.log("Scraping ESPN Grounds for India...");
        const url = 'https://stats.espncricinfo.com/ci/engine/ground/index.html?class=1';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        
        const grounds = [];
        $('table.engineTable').first().find('tr.data1').each((i, el) => {
            const cols = $(el).find('td');
            if (cols.length >= 3) {
                const groundA = $(cols[0]).find('a');
                const name = groundA.text().trim();
                const link = groundA.attr('href');
                const country = $(cols[1]).text().trim();
                
                if (country === 'India') {
                    grounds.push({ name, link, country });
                }
            }
        });
        
        console.log(`Found ${grounds.length} grounds in India!`);
        console.log(grounds.slice(0, 5));
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testEspnGrounds();
