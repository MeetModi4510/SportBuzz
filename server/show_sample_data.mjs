import axios from 'axios';
import fs from 'fs';

function extractJsonObjects(str, key) {
    const results = [];
    let searchIdx = 0;
    while (true) {
        const idx = str.indexOf(`"${key}":{`, searchIdx);
        if (idx === -1) break;
        
        let openBraces = 0;
        let startObjIdx = idx + `"${key}":`.length;
        let endObjIdx = -1;
        
        for (let i = startObjIdx; i < str.length; i++) {
            if (str[i] === '{') openBraces++;
            if (str[i] === '}') openBraces--;
            
            if (openBraces === 0) {
                endObjIdx = i;
                break;
            }
        }
        
        if (endObjIdx !== -1) {
            try {
                let jsonStr = str.substring(startObjIdx, endObjIdx + 1);
                jsonStr = jsonStr.replace(/\\"/g, '"'); 
                results.push(JSON.parse(jsonStr));
            } catch(e) {}
        }
        searchIdx = idx + 1;
    }
    return results;
}

async function showUserSample() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const cleanHtml = res.data.replace(/\\"/g, '"');
        
        const infoIndices = [];
        let searchIdx = 0;
        while(true) {
            const idx = cleanHtml.indexOf('"matchInfo":{', searchIdx);
            if(idx === -1) break;
            infoIndices.push(idx);
            searchIdx = idx + 1;
        }
        
        const matches = [];
        
        for (let i = 0; i < infoIndices.length; i++) {
            const idx = infoIndices[i];
            const endIdx = i < infoIndices.length - 1 ? infoIndices[i+1] : idx + 3000;
            const context = cleanHtml.substring(idx, endIdx);
            
            try {
                const infoStrMatch = context.match(/"matchInfo":(\{.*?"venueInfo":\{.*?\}\})/);
                if (!infoStrMatch) continue;
                const info = JSON.parse(infoStrMatch[1]);
                
                let score = undefined;
                const scoreStrMatch = context.match(/"matchScore":(\{.*?\})/);
                if (scoreStrMatch) {
                    try {
                        // Very dirty parse, just grabbing raw JSON string up to a safe boundary
                        let scoreStr = scoreStrMatch[1];
                        // Find closing brace of team1Score/team2Score
                        score = JSON.parse(scoreStr + "}}}"); 
                    } catch(e) {}
                }
                
                // Map to frontend format
                const formatted = {
                    matchInfo: {
                        matchId: info.matchId,
                        seriesName: info.seriesName || "Unknown Series",
                        matchDesc: info.matchDesc || "T20",
                        matchFormat: info.matchFormat || "T20I",
                        status: info.status || "In Progress",
                        team1: { teamName: info.team1?.teamName, teamSName: info.team1?.teamSName },
                        team2: { teamName: info.team2?.teamName, teamSName: info.team2?.teamSName }
                    },
                    matchScore: score ? {
                        team1Score: score.team1Score ? {
                            inngs1: score.team1Score.inngs1 ? { 
                                runs: score.team1Score.inngs1.runs, 
                                wickets: score.team1Score.inngs1.wickets, 
                                overs: score.team1Score.inngs1.overs 
                            } : undefined
                        } : undefined,
                        team2Score: score.team2Score ? {
                            inngs1: score.team2Score.inngs1 ? { 
                                runs: score.team2Score.inngs1.runs, 
                                wickets: score.team2Score.inngs1.wickets, 
                                overs: score.team2Score.inngs1.overs 
                            } : undefined
                        } : undefined
                    } : undefined
                };
                
                // Filter out duplicates
                if (!matches.find(m => m.matchInfo.matchId === formatted.matchInfo.matchId)) {
                    matches.push(formatted);
                }

            } catch(e) {}
            
            if (matches.length >= 3) break; // just need a few samples
        }
        
        fs.writeFileSync('sample_data.json', JSON.stringify(matches, null, 2));

    } catch(e) {
        console.error(e);
    }
}

showUserSample();
