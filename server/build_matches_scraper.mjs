import axios from 'axios';

async function buildBulletproofScraper() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        
        // Strategy: Instead of parsing the React tree, just regex all `matchInfo` blocks!
        // We can extract all Match IDs, Teams, and Scores sequentially.
        const matchBlocks = [];
        
        // A match block in the payload usually looks like:
        // "matchInfo":{"matchId":123,...},"matchScore":{"team1Score":...}
        
        const matchInfoRegex = /"matchInfo":\{"matchId":(\d+).*?"team1":\{"teamId":\d+,"teamName":"(.*?)","teamSName":"(.*?)"\}.*?"team2":\{"teamId":\d+,"teamName":"(.*?)","teamSName":"(.*?)"\}.*?"venueInfo":\{"id":\d+,"ground":"(.*?)","city":"(.*?)"/g;
        
        let match;
        while ((match = matchInfoRegex.exec(html)) !== null) {
            const matchId = match[1];
            
            // Extract the context chunk around this match
            const startIdx = match.index;
            const context = html.substring(startIdx, startIdx + 1500);
            
            // Find score within this context
            const scoreRegex = /"matchScore":\{"team1Score":\{"inngs1":\{"inningsId":\d+,"runs":(\d+).*?"wickets":(\d+).*?"overs":(\d+\.?\d*)/;
            const scoreMatch = context.match(scoreRegex);
            
            const matchObj = {
                matchInfo: {
                    matchId: parseInt(matchId),
                    team1: { teamName: match[2], teamSName: match[3] },
                    team2: { teamName: match[4], teamSName: match[5] },
                    venueInfo: { ground: match[6], city: match[7] },
                    // State can be "In Progress" etc
                    state: context.match(/"state":"(.*?)"/)?.[1] || "Unknown",
                    status: context.match(/"status":"(.*?)"/)?.[1] || ""
                },
                matchScore: scoreMatch ? {
                    team1Score: {
                        inngs1: { runs: parseInt(scoreMatch[1]), wickets: parseInt(scoreMatch[2]), overs: parseFloat(scoreMatch[3]) }
                    }
                } : undefined
            };
            
            matchBlocks.push(matchObj);
        }
        
        // Remove duplicates by matchId
        const uniqueMatches = [];
        const seenIds = new Set();
        matchBlocks.forEach(m => {
            if (!seenIds.has(m.matchInfo.matchId)) {
                seenIds.add(m.matchInfo.matchId);
                uniqueMatches.push(m);
            }
        });
        
        console.log(`Successfully scraped ${uniqueMatches.length} unique live matches natively!`);
        console.log(JSON.stringify(uniqueMatches.slice(0, 2), null, 2));

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

buildBulletproofScraper();
