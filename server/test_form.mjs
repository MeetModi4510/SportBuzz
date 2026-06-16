import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFormScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/13866/sai-sudharsan', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let forms = { batting: [], bowling: [] };
        
        // Find Batting Form
        const battingDiv = $('div:contains("Batting Form")').filter((i, el) => $(el).text().trim() === 'Batting Form').parent().parent();
        console.log("Batting Form rows:");
        battingDiv.find('.cb-lst-itm-sm').each((i, row) => {
            console.log($(row).text().replace(/\s+/g, ' '));
        });

        console.log("-------");
        // Or let's just search for divs with the class that looks like rows
        // Actually, let's just find tables or divs after 'Batting Form'
        $('div').each((i, el) => {
            const text = $(el).text().trim();
            if (text === 'Batting Form') {
                console.log("Found Batting Form title!");
                const parent = $(el).closest('.cb-bg-white'); // Usually the container
                if(parent.length) {
                    console.log("Parent HTML excerpt:", parent.html().substring(0, 300));
                }
            }
        });
        
    } catch(e) { console.error(e); }
}
testFormScrape();
