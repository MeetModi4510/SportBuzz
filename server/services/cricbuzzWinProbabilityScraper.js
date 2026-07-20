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
        
        // Always extract team1 and team2 exactly as they appear in the tooltip string
        const team1Name = matchNames ? matchNames[1].trim() : 'Team 1';
        const team2Name = matchNames ? matchNames[2].trim() : 'Team 2';

        const resultData = arr.map((item, index) => {
            let t1Val = item.team1;
            let t2Val = item.team2;
            let displayOver = item.over;
            
            if (item.tooltipText) {
                // e.g. "Over 41 | ENG: 2% • IND: 98%" or "Over 41.2 | ENG: 2% • IND: 98%"
                const tMatch = item.tooltipText.match(/Over\s+([0-9.]+)/i);
                if (tMatch) {
                    displayOver = parseFloat(tMatch[1]);
                }
                
                // Escape regex special chars just in case a team name has them
                const safeT1 = team1Name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const safeT2 = team2Name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const t1Regex = new RegExp(safeT1 + ":\\s*([0-9.]+)%", "i");
                const t2Regex = new RegExp(safeT2 + ":\\s*([0-9.]+)%", "i");
                
                const m1 = item.tooltipText.match(t1Regex);
                const m2 = item.tooltipText.match(t2Regex);
                
                if (m1) t1Val = parseFloat(m1[1]);
                if (m2) t2Val = parseFloat(m2[1]);
            }
            
            return {
                seqIndex: index, // Ensure X-Axis orders sequentially even if overs reset
                over: displayOver,
                [team1Name]: t1Val,
                [team2Name]: t2Val
            };
        });

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

export async function getOversGraph(matchId) {
    const cacheKey = `overs_graph_${matchId}`;
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
        const startIdx = html.indexOf('"runsPerOverChartData":');
        
        if (startIdx === -1) {
            return { available: false, error: 'Graph not available yet' };
        }

        const sub = html.substring(startIdx + 23);
        let braceCount = 0;
        let endIdx = 0;
        
        for (let i = 0; i < sub.length; i++) {
            if (sub[i] === '{' || sub[i] === '[') braceCount++;
            else if (sub[i] === '}' || sub[i] === ']') {
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
        
        if (Array.isArray(data)) {
            arr = data;
        } else {
            const keys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
            for (const key of keys) {
                arr = arr.concat(data[key]);
            }
        }

        if (!arr || arr.length === 0) {
            return { available: false, error: 'Empty graph data' };
        }

        const firstTooltip = arr[0].tooltipText || '';
        const matchNames = firstTooltip.match(/\|\s*([^:]+):.*?•\s*([^:]+):/);
        
        const team1Name = matchNames ? matchNames[1].trim() : 'Team 1';
        const team2Name = matchNames ? matchNames[2].trim() : 'Team 2';

        const resultData = arr.map((item, index) => {
            let t1Val = item.team1;
            let t2Val = item.team2;
            let displayOver = item.over;
            let isWicket = item.isTeam1Wicket || item.isTeam2Wicket;
            
            return {
                seqIndex: index,
                over: displayOver,
                [team1Name]: t1Val,
                [team2Name]: t2Val,
                isTeam1Wicket: !!item.isTeam1Wicket,
                isTeam2Wicket: !!item.isTeam2Wicket,
                team1WicketsCount: item.team1WicketCommentary ? item.team1WicketCommentary.length : (item.isTeam1Wicket ? 1 : 0),
                team2WicketsCount: item.team2WicketCommentary ? item.team2WicketCommentary.length : (item.isTeam2Wicket ? 1 : 0),
                isWicket: isWicket
            };
        });

        const result = {
            available: true,
            team1: { name: team1Name, color: '#3b82f6' }, // Blue
            team2: { name: team2Name, color: '#ef4444' }, // Red
            data: resultData
        };

        cache.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error(`[Cricbuzz OversGraph] Fast Scraper error:`, error.message);
        return { available: false, error: error.message };
    }
}

