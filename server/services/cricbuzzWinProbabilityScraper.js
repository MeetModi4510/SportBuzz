import axios from 'axios';
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

export async function getWinProbabilityGraph(matchId) {
    const cacheKey = `winprob_${matchId}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await axios.get(`https://www.cricbuzz.com/live-cricket-graphs/${matchId}/match`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        let html = response.data.replace(/\\"/g, '"');
        const startIdx = html.indexOf('"winProbabilityChartData":');
        
        if (startIdx === -1) {
            return { available: false, error: 'Graph not available yet' };
        }

        const sub = html.substring(startIdx + 26);
        let braceCount = 0;
        let endIdx = 0;
        
        for (let i = 0; i < sub.length; i++) {
            if (sub[i] === '{') braceCount++;
            else if (sub[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                }
            }
        }

        const jsonStr = sub.substring(0, endIdx);
        const data = JSON.parse(jsonStr);
        let arr = [];
        // Extract keys and sort them numerically to ensure innings order (1, 2, 3...)
        const keys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
        for (const key of keys) {
            arr = arr.concat(data[key]);
        }

        if (!arr || arr.length === 0) {
            return { available: false, error: 'Empty graph data' };
        }

        // Extract team names from the first tooltip text (e.g. "Over 0 | AFG: 50% • IND: 50%")
        const firstTooltip = arr[0].tooltipText || '';
        const matchNames = firstTooltip.match(/\|\s*([^:]+):.*?•\s*([^:]+):/);
        
        const team1Name = matchNames ? matchNames[2].trim() : 'Team 1'; // Team1 is usually the second team in the string "AFG: 50% • IND: 50%" where IND is team1
        const team2Name = matchNames ? matchNames[1].trim() : 'Team 2';

        const resultData = arr.map(item => ({
            over: item.over,
            [team1Name]: item.team1,
            [team2Name]: item.team2
        }));

        const result = {
            available: true,
            team1: { name: team1Name, color: '#3b82f6' }, // Blue
            team2: { name: team2Name, color: '#ef4444' }, // Red
            data: resultData
        };

        cache.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error(`[Cricbuzz WinProb] Fast Scraper error:`, error.message);
        return { available: false, error: error.message };
    }
}
