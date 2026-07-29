import axios from 'axios';
import fs from 'fs';

async function testCricinfo() {
    // A recent test match on ESPNcricinfo (e.g. ENG vs IND 2024 Test)
    // Actually let's just fetch the ESPNcricinfo homepage or live scores to get a matchId
    try {
        const res = await axios.get('https://www.espncricinfo.com/live-cricket-score', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = res.data;
        // Search for seriesId and matchId pattern in Next.js state
        const matchIds = html.match(/"series":\{"objectId":(\d+).*?"matches":\[\{"objectId":(\d+)/);
        
        let seriesId = 1389389; // Default fallback (e.g. IPL 2024)
        let matchId = 1426261;  // Default fallback
        
        if (matchIds) {
            seriesId = matchIds[1];
            matchId = matchIds[2];
        }
        
        console.log(`Testing with Series: ${seriesId}, Match: ${matchId}`);
        
        // ESPN Cricinfo uses this GraphQL-like or REST endpoint for comments
        const apiUrl = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=${seriesId}&matchId=${matchId}&inningNumber=1&commentType=ALL&sortDirection=DESC`;
        
        console.log(`Hitting API: ${apiUrl}`);
        const apiRes = await axios.get(apiUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (apiRes.data && apiRes.data.comments) {
            console.log(`SUCCESS! Found ${apiRes.data.comments.length} comments.`);
            console.log("Pagination info:", apiRes.data.pagination || "None");
            if (apiRes.data.comments.length > 0) {
                 console.log("First comment:", apiRes.data.comments[0].text);
            }
        } else {
            console.log("No comments found in response.");
        }
        
    } catch(e) {
        console.error("Failed:", e.message);
        if (e.response && e.response.status === 403) {
            console.log("ESPNcricinfo blocked us with a 403 Forbidden!");
        }
    }
}

testCricinfo();
