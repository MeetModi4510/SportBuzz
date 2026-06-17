import axios from 'axios';
import * as cheerio from 'cheerio';

async function testStrategies() {
    console.log("=== STRATEGY 1: DIRECT API RSC HACK ===");
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log("Status:", res.status);
        console.log("Is RSC Response?", dataStr.startsWith('0:') || dataStr.includes('self.__next_f'));
        console.log("Contains 'typeMatches'?", dataStr.includes('typeMatches'));
        console.log("Contains 'matchId'?", dataStr.includes('matchId'));
        if (dataStr.includes('typeMatches')) {
            console.log("Sample:", dataStr.substring(dataStr.indexOf('typeMatches'), dataStr.indexOf('typeMatches') + 200));
        } else {
            console.log("Sample:", dataStr.substring(0, 200));
        }
    } catch(e) {
        console.log("Strategy 1 Failed:", e.message);
    }

    console.log("\n=== STRATEGY 3: JSON-LD ===");
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        const ldJsons = $('script[type="application/ld+json"]');
        console.log(`Found ${ldJsons.length} JSON-LD scripts.`);
        
        ldJsons.each((i, el) => {
            const content = $(el).html() || '';
            console.log(`JSON-LD ${i} length:`, content.length);
            if (content.length > 0) {
                console.log(content.substring(0, 300) + "...\n");
            }
        });
    } catch(e) {
        console.log("Strategy 3 Failed:", e.message);
    }
}

testStrategies();
