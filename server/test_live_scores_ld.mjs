import axios from 'axios';
import * as cheerio from 'cheerio';

async function testLiveScoresLD() {
    try {
        console.log("=== TESTING LIVE SCORES WITH JSON-LD ===");
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(res.data);
        const ldJsons = $('script[type="application/ld+json"]');
        let extractedMatches = 0;
        
        ldJsons.each((i, el) => {
            const content = $(el).html() || '';
            try {
                const parsed = JSON.parse(content);
                // Check if this block contains matches
                if (parsed['@type'] === 'WebPage' && parsed.mainEntity && parsed.mainEntity.itemListElement) {
                    const matches = parsed.mainEntity.itemListElement;
                    console.log(`Found ${matches.length} matches in JSON-LD!`);
                    matches.forEach((m, idx) => {
                        if (idx < 5) console.log(`- ${m.name}`);
                        extractedMatches++;
                    });
                }
            } catch(e) {}
        });

        console.log(`Total live matches extracted: ${extractedMatches}`);

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testLiveScoresLD();
