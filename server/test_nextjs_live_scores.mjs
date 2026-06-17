import axios from 'axios';

async function testNextJsExtraction() {
    try {
        console.log("=== TESTING AXIOS NEXT.JS EXTRACTION FOR LIVE SCORES ===");
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const html = res.data;
        
        // Let's find all Next.js hydration chunks
        const chunks = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)\]\)/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            // Unescape the string slightly to make it searchable
            let chunkData = match[1].replace(/\\"/g, '"');
            chunks.push(chunkData);
        }
        
        console.log(`Found ${chunks.length} Next.js data chunks!`);
        
        let matchFound = false;
        let extractionCount = 0;

        chunks.forEach((chunk, i) => {
            // Look for match details
            if (chunk.includes('matchId') || chunk.includes('matchScore') || chunk.includes('seriesName')) {
                matchFound = true;
                
                // Try to find an array of matches or a single match structure
                // Cricbuzz often uses "matchInfo":{"matchId":123}
                const matchInfoRegex = /"matchInfo":\{"matchId":(\d+).*?"team1":\{"teamId":\d+,"teamName":"(.*?)"\}.*?"team2":\{"teamId":\d+,"teamName":"(.*?)"\}/g;
                let infoMatch;
                
                while ((infoMatch = matchInfoRegex.exec(chunk)) !== null) {
                    extractionCount++;
                    console.log(`\nExtracted Match:`);
                    console.log(`- Match ID: ${infoMatch[1]}`);
                    console.log(`- Teams: ${infoMatch[2]} vs ${infoMatch[3]}`);
                    
                    // See if we can extract the score near this matchInfo
                    const chunkContext = chunk.substring(infoMatch.index, infoMatch.index + 500);
                    const scoreMatch = chunkContext.match(/"inngs1":\{"inningsId":\d+,"runs":(\d+).*?"wickets":(\d+).*?"overs":(\d+\.?\d*)/);
                    if (scoreMatch) {
                        console.log(`- Live Score: ${scoreMatch[1]}/${scoreMatch[2]} (${scoreMatch[3]} Overs)`);
                    }
                }
            }
        });
        
        if (!matchFound) {
            console.log("Could not find any match data in the Next.js chunks.");
            // Print a sample of the largest chunks
            chunks.sort((a, b) => b.length - a.length);
            console.log("Largest chunk snippet:", chunks[0].substring(0, 500));
        } else {
            console.log(`\nTotal Matches Found inside Next.js Chunks: ${extractionCount}`);
        }

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testNextJsExtraction();
