import axios from 'axios';

async function researchNextJsMatches() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const html = res.data;
        const chunks = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)\]\)/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            try {
                // Next.js chunks are JSON-stringified strings inside an array.
                // We need to properly unescape them.
                const unescaped = JSON.parse(`"${match[1]}"`);
                chunks.push(unescaped);
            } catch(e) {
                // Ignore parse errors for broken chunks
            }
        }
        
        console.log(`Found ${chunks.length} valid chunks.`);
        
        // Combine all chunks into one giant string to rebuild the React tree payload
        const fullPayload = chunks.join('');
        
        // Now try to extract the typeMatches JSON object!
        const typeMatchesMatch = fullPayload.match(/"typeMatches":(\[.*?\]\}\])/);
        
        if (typeMatchesMatch) {
            console.log("Successfully found typeMatches in the concatenated payload!");
            try {
                // Because the Next.js stream might have split the JSON randomly across chunks, 
                // joining them rebuilds the original JSON string!
                // Let's attempt to parse it. We might need to handle trailing characters.
                // The regex captures up to the closing brackets of typeMatches.
                
                let jsonStr = typeMatchesMatch[0];
                // wrap it to make it valid JSON
                jsonStr = `{${jsonStr}}`;
                
                const parsed = JSON.parse(jsonStr);
                const categories = parsed.typeMatches;
                
                console.log(`Found ${categories.length} match categories.`);
                
                categories.forEach(category => {
                    console.log(`\n-- ${category.matchType} --`);
                    if (category.seriesMatches) {
                        category.seriesMatches.forEach(series => {
                            if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                                series.seriesAdWrapper.matches.forEach(m => {
                                    const info = m.matchInfo || {};
                                    const score = m.matchScore || {};
                                    console.log(`Match: ${info.team1?.teamName} vs ${info.team2?.teamName}`);
                                    if (score.team1Score) {
                                        const s1 = score.team1Score.inngs1 || {};
                                        console.log(`  ${info.team1?.teamSName}: ${s1.runs}/${s1.wickets} (${s1.overs} ov)`);
                                    }
                                });
                            }
                        });
                    }
                });
            } catch (e) {
                console.log("Error parsing rebuilt JSON:", e.message);
                console.log(typeMatchesMatch[0].substring(typeMatchesMatch[0].length - 100));
            }
        } else {
            console.log("typeMatches not found in concatenated payload.");
            // Search for "matchScore"
            const idx = fullPayload.indexOf('matchScore');
            if (idx > -1) {
                console.log("Found matchScore at idx:", idx);
                console.log(fullPayload.substring(idx - 100, idx + 200));
            }
        }

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

researchNextJsMatches();
