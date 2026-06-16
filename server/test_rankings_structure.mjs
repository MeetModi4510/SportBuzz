import axios from 'axios';
import * as cheerio from 'cheerio';

async function testRankingsStructure() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        // Find the "ICC RANKINGS" header
        let rankingsHeader = $('div:contains("ICC RANKINGS")').last();
        if (rankingsHeader.length) {
            console.log(rankingsHeader.parent().parent().html());
        }

    } catch(e) { console.error(e); }
}
testRankingsStructure();
