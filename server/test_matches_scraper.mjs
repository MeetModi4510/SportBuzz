import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMatchScraping(url, type) {
    try {
        console.log(`\n--- Fetching ${type} Matches ---`);
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const $ = cheerio.load(res.data);
        const matches = [];

        // In Cricbuzz, match cards are usually inside divs with class 'cb-mtch-lst' or similar.
        // Let's look for specific anchor tags or list items that represent matches.
        $('.cb-mtch-lst, .cb-col-100.cb-col.cb-schdl').each((i, el) => {
            if (i > 4) return; // limit to 5 for testing
            
            const title = $(el).find('.cb-lv-scrs-well-spn-1, .cb-col-100.cb-col.cb-schdl-hdr').first().text().trim() || 
                          $(el).find('h3').text().trim() || 
                          $(el).find('a.text-hvr-underline').text().trim();
                          
            const status = $(el).find('.cb-text-live, .cb-text-complete, .cb-text-preview').text().trim();
            const scoreNode = $(el).find('.cb-scr-wll-chvrn');
            const team1 = scoreNode.find('.cb-hm-rght').first().text().trim();
            const team2 = scoreNode.find('.cb-hm-rght').last().text().trim();
            
            // On the new next.js UI, the classes might be completely different.
            // Let's grab all text from the container to see what it looks like if selectors fail.
            const rawText = $(el).text().replace(/\s+/g, ' ').trim();

            matches.push({
                title,
                status,
                rawText: rawText.substring(0, 100) + '...'
            });
        });

        // If the old classes fail, let's look for the new Next.js UI elements
        if (matches.length === 0) {
            console.log("Old selectors failed, trying generic match wrapper parsing...");
            // Looking for Next.js app wrapper that contains match data
            const html = res.data;
            const nextMatch = html.match(/"matches":(\[.*?\])/);
            if (nextMatch) {
                console.log(`Found Next.js match JSON payload for ${type}!`);
                try {
                    const parsed = JSON.parse(nextMatch[1]);
                    console.log(`Successfully parsed ${parsed.length} matches.`);
                    console.log("Sample match:", JSON.stringify(parsed[0], null, 2).substring(0, 300));
                    return;
                } catch(e) {
                    console.log("JSON parse error:", e.message);
                }
            } else {
                console.log(`No matches JSON found in NextJS payload for ${type}.`);
                // Let's try finding the generic match card containers
                $('a[href^="/live-cricket-scores/"]').each((i, el) => {
                    if (i > 2) return;
                    console.log(`Match Link ${i}:`, $(el).attr('href'));
                    console.log(`Text:`, $(el).text().substring(0, 150));
                });
            }
        } else {
            console.log(matches);
        }

    } catch(e) {
        console.error(`Error fetching ${type}:`, e.message);
    }
}

async function runTests() {
    await testMatchScraping('https://www.cricbuzz.com/cricket-match/live-scores', 'LIVE');
    await testMatchScraping('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', 'RECENT');
    await testMatchScraping('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', 'UPCOMING');
}

runTests();
