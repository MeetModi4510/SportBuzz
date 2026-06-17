import axios from 'axios';
import fs from 'fs';
import path from 'path';

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

async function getMatches(url) {
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        const cleanHtml = dataStr.replace(/\\"/g, '"');
        const matchInfos = extractJsonObjects(cleanHtml, 'matchInfo');
        
        const unique = [];
        const seen = new Set();
        matchInfos.forEach(m => {
            if (!seen.has(m.matchId)) {
                seen.add(m.matchId);
                unique.push(m);
            }
        });
        return unique;
    } catch(e) {
        console.log("Error:", e.message);
        return [];
    }
}

async function generateArtifact() {
    const recent = await getMatches('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches');
    const upcoming = await getMatches('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches');
    
    // Sort by date (assuming startDate or endDate exists)
    // If not, we just rely on Cricbuzz's ordering
    
    let markdown = `# Scraped Matches Summary\n\n`;
    
    markdown += `## ⏳ UPCOMING MATCHES (${upcoming.length})\n\n`;
    upcoming.forEach(m => {
        // Cricbuzz usually has startDate as a timestamp in ms
        const dateStr = m.startDate ? new Date(parseInt(m.startDate)).toLocaleString() : 'Date TBD';
        markdown += `- **${m.team1?.teamName || 'TBA'} vs ${m.team2?.teamName || 'TBA'}** (${m.seriesName})\n`;
        markdown += `  - **Date:** ${dateStr}\n`;
        markdown += `  - **Status:** ${m.status || 'Scheduled'}\n\n`;
    });
    
    markdown += `## ✅ RECENT / COMPLETED MATCHES (${recent.length})\n\n`;
    recent.forEach(m => {
        const dateStr = m.endDate ? new Date(parseInt(m.endDate)).toLocaleString() : (m.startDate ? new Date(parseInt(m.startDate)).toLocaleString() : 'Recent');
        markdown += `- **${m.team1?.teamName || 'TBA'} vs ${m.team2?.teamName || 'TBA'}** (${m.seriesName})\n`;
        markdown += `  - **Date:** ${dateStr}\n`;
        markdown += `  - **Result:** ${m.status}\n\n`;
    });
    
    // Write to artifact
    const artifactPath = path.join('C:\\Users\\PRANSHU PATEL\\.gemini\\antigravity-ide\\brain\\7dc4cd1f-1b79-48ea-9729-81f251ed78cc', 'scraped_matches_list.md');
    fs.writeFileSync(artifactPath, markdown);
    console.log("Artifact created at", artifactPath);
}

generateArtifact();
