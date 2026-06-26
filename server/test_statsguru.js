import axios from 'axios';
import * as cheerio from 'cheerio';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
async function espnGet(url) {
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    return cheerio.load(data);
}

async function fetchMatchesList(espnTeamId, classId) {
    const headToHead = {};
    const recentForm = [];
    let page = 1;
    
    while (true) {
        // Order by start reverse to get recent matches first
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=match;orderby=start;orderbyad=reverse;page=${page}`;
        const $ = await espnGet(url);
        const rows = $('table.engineTable').eq(2).find('tr.data1, tr.data2');
        if (rows.length === 0) break;

        rows.each((i, row) => {
            const cols = $(row).find('td');
            let opponent = $(cols[8]).text().trim().replace(/^v\s+/, '');
            const result = $(cols[6]).text().trim().toLowerCase();
            
            // Collect recent form from the first 10 rows of the first page
            if (page === 1 && i < 10 && ['won','lost','tied','n/r', 'draw', 'drawn'].includes(result)) {
                recentForm.push(result === 'n/r' ? 'NR' : result === 'won' ? 'W' : result === 'lost' ? 'L' : result === 'draw' || result === 'drawn' ? 'D' : 'T');
            }

            if (!opponent) return;
            if (!headToHead[opponent]) headToHead[opponent] = { played: 0, won: 0, lost: 0, tied: 0, drawNr: 0 };
            headToHead[opponent].played++;
            if (result === 'won') headToHead[opponent].won++;
            else if (result === 'lost') headToHead[opponent].lost++;
            else if (result === 'tied') headToHead[opponent].tied++;
            else if (['draw', 'n/r', 'drawn'].includes(result)) headToHead[opponent].drawNr++;
        });

        const pageText = $('table.engineTable').eq(3).text();
        const pageMatch = pageText.match(/Page (\d+) of (\d+)/);
        if (!pageMatch || parseInt(pageMatch[1]) >= parseInt(pageMatch[2])) break;
        page++;
    }

    return { headToHead, recentForm: recentForm.reverse() }; // chronologically oldest to newest
}
fetchMatchesList(6, 1).then(r => console.log(r.headToHead['England']));
