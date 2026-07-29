import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Normalizes a string for comparison (lowercase, removes special chars)
 */
function normalizeStr(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Searches HT's live-score page for a match matching the given teams.
 * Extracts the HT Match ID if found.
 */
async function findHTMatchId(teamA, teamB) {
    console.log(`\n🔍 Searching HT for: ${teamA} vs ${teamB}`);
    
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket/live-score', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const html = res.data;
        const links = html.match(/href="([^"]+)"/g) || [];
        
        // Find links related to match scorecards/results
        const matchLinks = links
            .map(l => l.replace('href="', '').replace('"', ''))
            .filter(l => l.includes('/cricket/') && (l.includes('live-scorecard') || l.includes('match-result') || l.includes('commentary-live')));
            
        // Clean team names for fuzzy matching (e.g., "India Under-19" -> "india")
        const teamA_clean = teamA.toLowerCase().replace(/under-19/g, 'u19').split(' ')[0];
        const teamB_clean = teamB.toLowerCase().replace(/under-19/g, 'u19').split(' ')[0];
        
        let foundLink = null;
        for (const link of matchLinks) {
            const lowerLink = link.toLowerCase();
            // Look for both team names in the URL slug
            if (lowerLink.includes(teamA_clean) && lowerLink.includes(teamB_clean)) {
                foundLink = link;
                break;
            }
        }
        
        if (foundLink) {
            console.log(`✅ Found Match Link: ${foundLink}`);
            
            // Extract the 6-digit small ID from the end (e.g., 271827)
            const idMatch = foundLink.match(/(\d{6})$/);
            if (idMatch) {
                const htMatchId = idMatch[1];
                console.log(`✅ Extracted HT Match ID: ${htMatchId}`);
                return htMatchId;
            }
        }
        
        console.log(`❌ No matching game found on HT for ${teamA} vs ${teamB}.`);
        return null;
        
    } catch (e) {
        console.error("HT Search Failed:", e.message);
        return null;
    }
}

/**
 * Fetches the full commentary JSON from HT CDN using the HT Match ID.
 */
async function fetchHTFullCommentary(htMatchId) {
    console.log(`\n🚀 Fetching Full Commentary from CDN for ID: ${htMatchId}...`);
    
    let allCommentary = [];
    
    // We try fetching innings 1, 2, 3, 4 (Test matches can have 4 innings)
    for (let inning = 1; inning <= 4; inning++) {
        const cdnUrl = `https://www.hindustantimes.com/static-content/10s/commentary_${htMatchId}_${inning}.json`;
        try {
            const res = await axios.get(cdnUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });
            
            if (res.data && res.data.commentary) {
                console.log(`  -> Innings ${inning}: Found ${res.data.commentary.length} balls.`);
                allCommentary = [...allCommentary, ...res.data.commentary];
            }
        } catch (e) {
            if (e.response && e.response.status === 404) {
                // 404 means the inning hasn't happened yet or doesn't exist
                console.log(`  -> Innings ${inning}: 404 Not Found (End of available innings)`);
                break;
            }
        }
    }
    
    console.log(`🎉 Total HT Commentary Balls Fetched: ${allCommentary.length}`);
    return allCommentary;
}

// === RUN REAL-TIME TESTS ===
async function runTests() {
    console.log("==========================================");
    console.log("   REAL-TIME JIT COMMENTARY TEST SUITE");
    console.log("==========================================");
    
    // TEST 1: The Match You Requested (Sri Lanka U19 vs India U19)
    const id1 = await findHTMatchId("India", "Sri Lanka");
    if (id1) await fetchHTFullCommentary(id1);
    
    // TEST 2: A recent completed match (West Indies vs New Zealand)
    const id2 = await findHTMatchId("West Indies", "New Zealand");
    if (id2) await fetchHTFullCommentary(id2);
    
    // TEST 3: A domestic game HT doesn't cover
    const id3 = await findHTMatchId("Bhopal", "Indore");
    if (id3) await fetchHTFullCommentary(id3);
}

runTests();
