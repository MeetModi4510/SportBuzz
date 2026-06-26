import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../cache/cricsheet');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ESPN Cricinfo Statsguru team IDs
const ESPNCRICINFO_TEAM_IDS = {
    'india-2': 6, 'australia-4': 2, 'england-9': 1, 'new-zealand-13': 5,
    'south-africa-11': 3, 'pakistan-3': 7, 'sri-lanka-5': 8, 'west-indies-10': 4,
    'bangladesh-6': 25, 'afghanistan-96': 40, 'zimbabwe-12': 9, 'ireland-27': 29,
    'scotland-23': 30, 'netherlands-24': 15, 'nepal-72': 32
};
const FORMAT_CLASS = { 't20i': 3, 'odi': 2, 'test': 1 };
const TEAM_NAMES = {
    'india-2': 'India', 'australia-4': 'Australia', 'england-9': 'England', 'new-zealand-13': 'New Zealand',
    'south-africa-11': 'South Africa', 'pakistan-3': 'Pakistan', 'sri-lanka-5': 'Sri Lanka', 'west-indies-10': 'West Indies',
    'bangladesh-6': 'Bangladesh', 'afghanistan-96': 'Afghanistan', 'zimbabwe-12': 'Zimbabwe', 'ireland-27': 'Ireland',
    'scotland-23': 'Scotland', 'netherlands-24': 'Netherlands', 'nepal-72': 'Nepal'
};

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function espnGet(url) {
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    return cheerio.load(data);
}

/** Fetch overall team record */
async function fetchTeamRecord(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team`;
    const $ = await espnGet(url);
    const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
    const cols = row.find('td');
    return {
        matchesPlayed: parseInt($(cols[2]).text()) || 0,
        won: parseInt($(cols[3]).text()) || 0,
        lost: parseInt($(cols[4]).text()) || 0,
        tied: parseInt($(cols[5]).text()) || 0,
        noResult: parseInt($(cols[6]).text()) || 0,
        highestTotal: parseInt($(cols[10]).text()) || 0,
        lowestTotal: parseInt($(cols[11]).text()) || 0
    };
}

/** Fetch year-by-year */
async function fetchYearByYear(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=year`;
    const $ = await espnGet(url);
    const years = [];
    $('table.engineTable').eq(2).find('tr.data1, tr.data2').each((i, row) => {
        const cols = $(row).find('td');
        const year = $(cols[12]).text().trim();
        const mat = parseInt($(cols[1]).text()) || 0;
        const won = parseInt($(cols[2]).text()) || 0;
        const lost = parseInt($(cols[3]).text()) || 0;
        const tied = parseInt($(cols[4]).text()) || 0;
        const drawNr = parseInt($(cols[5]).text()) || 0;
        if (year && mat > 0) years.push({ year, mat, won, lost, tied, drawNr });
    });
    return years.sort((a, b) => b.year - a.year);
}

/** Fetch venues */
async function fetchVenueBreakdown(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=team;view=ground`;
    const $ = await espnGet(url);
    const venues = [];
    let pendingData = null;
    $('table.engineTable').eq(2).find('tr').each((i, row) => {
        const dataRow = $(row).hasClass('data1') || $(row).hasClass('data2');
        const cols = $(row).find('td');
        
        if (dataRow) {
            const mat = parseInt($(cols[2]).text()) || 0;
            const won = parseInt($(cols[3]).text()) || 0;
            const lost = parseInt($(cols[4]).text()) || 0;
            const tied = parseInt($(cols[5]).text()) || 0;
            const drawNr = parseInt($(cols[6]).text()) || 0;
            pendingData = { mat, won, lost, tied, drawNr };
        } else if (cols.length === 1 && pendingData) {
            const groundName = $(cols[0]).text().trim();
            venues.push({
                ground: groundName,
                mat: pendingData.mat,
                won: pendingData.won,
                lost: pendingData.lost,
                tied: pendingData.tied,
                drawNr: pendingData.drawNr,
                winPct: pendingData.mat > 0 ? Math.round((pendingData.won / pendingData.mat) * 100) : 0
            });
            pendingData = null;
        }
    });
    return venues.sort((a, b) => b.mat - a.mat).slice(0, 10);
}

/** Fetch match list for H2H and Recent Form */
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
            if (page === 1 && i < 10 && ['won','lost','tied','n/r','draw','drawn'].includes(result)) {
                recentForm.push(result === 'n/r' ? 'NR' : result === 'won' ? 'W' : result === 'lost' ? 'L' : ['draw','drawn'].includes(result) ? 'D' : 'T');
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

/** Fetch Batting First / Chasing */
async function fetchBattingFirstVsChasing(espnTeamId, classId) {
    const fetchStats = async (battedOrFieldedFirst) => {
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?batting_fielding_first=${battedOrFieldedFirst};class=${classId};team=${espnTeamId};template=results;type=team`;
        const $ = await espnGet(url);
        const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
        if (row.length === 0) return { matches: 0, won: 0 };
        const cols = row.find('td');
        return {
            matches: parseInt($(cols[2]).text()) || 0,
            won: parseInt($(cols[3]).text()) || 0
        };
    };
    return {
        battingFirst: await fetchStats(1),
        chasing: await fetchStats(2)
    };
}

/** Fetch Top Run Scorers */
async function fetchTopRunScorers(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=batting`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 15) return false;
        const name = $(el).find('td').eq(0).find('a').first().text().trim() || $(el).find('td').eq(0).text().trim();
        const matches = parseInt($(el).find('td').eq(2).text());
        const runs = parseInt($(el).find('td').eq(5).text().replace(/,/g, ''));
        const hs = $(el).find('td').eq(6).text().trim();
        const avg = parseFloat($(el).find('td').eq(7).text());
        const sr = parseFloat($(el).find('td').eq(9).text());
        if (name && !isNaN(runs) && runs > 0) results.push({ name, runs, matches, hs, avg, sr });
    });
    return results;
}

/** Fetch Top Wicket Takers */
async function fetchTopWicketTakers(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=bowling`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 15) return false;
        const name = $(el).find('td').eq(0).find('a').first().text().trim() || $(el).find('td').eq(0).text().trim();
        const matches = parseInt($(el).find('td').eq(2).text());
        const wickets = parseInt($(el).find('td').eq(6).text().replace(/,/g, ''));
        const bbi = $(el).find('td').eq(7).text().trim();
        const avg = parseFloat($(el).find('td').eq(8).text());
        const econ = parseFloat($(el).find('td').eq(9).text());
        if (name && !isNaN(wickets) && wickets > 0) results.push({ name, wickets, matches, bbi, avg, econ });
    });
    return results;
}

/** Fetch Home/Away Record */
async function fetchHomeAway(espnTeamId, classId) {
    const fetchLoc = async (hostType) => {
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};home_or_away=${hostType};template=results;type=team`;
        const $ = await espnGet(url);
        const row = $('table.engineTable').eq(2).find('tr.data1').eq(0);
        if (row.length === 0) return { matches: 0, won: 0, lost: 0 };
        const cols = row.find('td');
        return {
            matches: parseInt($(cols[2]).text()) || 0,
            won: parseInt($(cols[3]).text()) || 0,
            lost: parseInt($(cols[4]).text()) || 0
        };
    };
    return {
        home: await fetchLoc(1),
        away: await fetchLoc(2)
    };
}

/** Fetch Highest Individual Scores in an Innings */
async function fetchHighestScores(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=batting;view=innings`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 5) return false;
        const cols = $(el).find('td');
        const name = $(cols[0]).text().trim();
        const runs = $(cols[1]).text().trim();
        const opp = $(cols[9]).text().trim().replace(/^v\s+/, '');
        const ground = $(cols[10]).text().trim();
        const date = $(cols[11]).text().trim();
        if (name) results.push({ name, runs, opp, ground, date });
    });
    return results;
}

/** Fetch Best Bowling Figures in an Innings */
async function fetchBestBowling(espnTeamId, classId) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};team=${espnTeamId};template=results;type=bowling;view=innings`;
    const $ = await espnGet(url);
    const results = [];
    $('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
        if (i >= 5) return false;
        const cols = $(el).find('td');
        const name = $(cols[0]).text().trim();
        const figures = $(cols[1]).text().trim() + '/' + $(cols[4]).text().trim(); // Overs/Runs is weird, let's just grab O M R W
        // Columns: [0]Player [1]Overs [2]... [3]Mdns [4]Runs [5]Wkts
        const wkts = $(cols[5]).text().trim();
        const runs = $(cols[4]).text().trim();
        const opp = $(cols[9]).text().trim().replace(/^v\s+/, '');
        const ground = $(cols[10]).text().trim();
        const date = $(cols[11]).text().trim();
        if (name) results.push({ name, figures: `${wkts}/${runs}`, opp, ground, date });
    });
    return results;
}

export async function getTeamAnalytics(teamId, format) {
    const cacheFile = path.join(CACHE_DIR, `${teamId}_${format}.json`);
    if (fs.existsSync(cacheFile)) {
        const ageHours = (new Date() - fs.statSync(cacheFile).mtime) / (1000 * 60 * 60);
        if (ageHours < 24) {
            console.log(`[Analytics] Returning cached data for ${teamId} (${format})`);
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        }
    }

    const espnTeamId = ESPNCRICINFO_TEAM_IDS[teamId];
    const teamName = TEAM_NAMES[teamId] || teamId;
    if (!espnTeamId) throw new Error(`Unknown team ID: ${teamId}`);

    console.log(`[Analytics] Fetching all data from ESPN for ${teamName} (${format})...`);
    const formatsToProcess = format === 'all' ? ['t20i', 'odi', 'test'] : [format];

    let aggregated = {
        team: teamName, format, matchesPlayed: 0,
        winLoss: { won: 0, lost: 0, tied: 0, noResult: 0 },
        highestTotal: { score: 0, against: 'N/A' }, lowestTotal: 0,
        battingFirst: { matches: 0, won: 0 }, chasing: { matches: 0, won: 0 },
        headToHead: {}, venues: [], yearByYear: [],
        players: { topRunScorers: [], topWicketTakers: [] },
        recentForm: [], // newest to oldest
        homeAway: { home: { matches: 0, won: 0, lost: 0 }, away: { matches: 0, won: 0, lost: 0 } },
        highestInnings: [],
        bestBowling: []
    };

    for (const f of formatsToProcess) {
        const classId = FORMAT_CLASS[f];
        if (!classId) continue;
        try {
            console.log(`[Analytics] Fetching ${f} data sequentially...`);
            
            // Sequentially await to prevent IP bans
            const teamRecord = await fetchTeamRecord(espnTeamId, classId);
            const yearByYear = await fetchYearByYear(espnTeamId, classId);
            const venues = await fetchVenueBreakdown(espnTeamId, classId);
            const matchesData = await fetchMatchesList(espnTeamId, classId);
            const battingStats = await fetchBattingFirstVsChasing(espnTeamId, classId);
            const topRunScorers = await fetchTopRunScorers(espnTeamId, classId);
            const topWicketTakers = await fetchTopWicketTakers(espnTeamId, classId);
            const homeAway = await fetchHomeAway(espnTeamId, classId);
            const highestInnings = await fetchHighestScores(espnTeamId, classId);
            const bestBowling = await fetchBestBowling(espnTeamId, classId);

            aggregated.matchesPlayed += teamRecord.matchesPlayed;
            aggregated.winLoss.won += teamRecord.won;
            aggregated.winLoss.lost += teamRecord.lost;
            aggregated.winLoss.tied += teamRecord.tied;
            aggregated.winLoss.noResult += teamRecord.noResult;

            if (teamRecord.highestTotal > aggregated.highestTotal.score) aggregated.highestTotal.score = teamRecord.highestTotal;
            if (!aggregated.lowestTotal || (teamRecord.lowestTotal > 0 && teamRecord.lowestTotal < aggregated.lowestTotal)) aggregated.lowestTotal = teamRecord.lowestTotal;

            yearByYear.forEach(y => {
                const existing = aggregated.yearByYear.find(x => x.year === y.year);
                if (existing) { 
                    existing.mat += y.mat; 
                    existing.won += y.won; 
                    existing.lost += y.lost; 
                    existing.tied += (y.tied || 0);
                    existing.drawNr += (y.drawNr || 0);
                }
                else aggregated.yearByYear.push({ ...y, tied: y.tied || 0, drawNr: y.drawNr || 0 });
            });
            venues.forEach(v => {
                const existing = aggregated.venues.find(x => x.ground === v.ground);
                if (existing) { 
                    existing.mat += v.mat; 
                    existing.won += v.won; 
                    existing.lost += v.lost;
                    existing.tied += (v.tied || 0);
                    existing.drawNr += (v.drawNr || 0);
                }
                else aggregated.venues.push({ ...v, tied: v.tied || 0, drawNr: v.drawNr || 0 });
            });
            for (const [opp, rec] of Object.entries(matchesData.headToHead)) {
                if (!aggregated.headToHead[opp]) aggregated.headToHead[opp] = { played: 0, won: 0, lost: 0, tied: 0, drawNr: 0 };
                aggregated.headToHead[opp].played += rec.played;
                aggregated.headToHead[opp].won += rec.won;
                aggregated.headToHead[opp].lost += rec.lost;
                aggregated.headToHead[opp].tied += rec.tied;
                aggregated.headToHead[opp].drawNr += rec.drawNr;
            }
            
            // recent form is tricky across formats, we just take the first format's recent form if it's "all"
            if (aggregated.recentForm.length === 0) aggregated.recentForm = matchesData.recentForm;

            aggregated.battingFirst.matches += battingStats.battingFirst.matches;
            aggregated.battingFirst.won += battingStats.battingFirst.won;
            aggregated.chasing.matches += battingStats.chasing.matches;
            aggregated.chasing.won += battingStats.chasing.won;

            topRunScorers.forEach(p => {
                const existing = aggregated.players.topRunScorers.find(x => x.name === p.name);
                if (existing) existing.runs += p.runs;
                else aggregated.players.topRunScorers.push({ ...p });
            });
            topWicketTakers.forEach(p => {
                const existing = aggregated.players.topWicketTakers.find(x => x.name === p.name);
                if (existing) existing.wickets += p.wickets;
                else aggregated.players.topWicketTakers.push({ ...p });
            });

            aggregated.homeAway.home.matches += homeAway.home.matches;
            aggregated.homeAway.home.won += homeAway.home.won;
            aggregated.homeAway.home.lost += homeAway.home.lost;
            aggregated.homeAway.away.matches += homeAway.away.matches;
            aggregated.homeAway.away.won += homeAway.away.won;
            aggregated.homeAway.away.lost += homeAway.away.lost;

            // Merging best innings is hard for "all formats", let's just append and slice later
            highestInnings.forEach(h => aggregated.highestInnings.push({...h, format: f}));
            bestBowling.forEach(b => aggregated.bestBowling.push({...b, format: f}));

        } catch (e) {
            console.error(`[Analytics] Error fetching ${f} for ${teamId}:`, e.message);
        }
    }

    aggregated.players.topRunScorers.sort((a, b) => b.runs - a.runs);
    aggregated.players.topWicketTakers.sort((a, b) => b.wickets - a.wickets);
    aggregated.yearByYear.sort((a, b) => b.year - a.year);
    aggregated.venues = aggregated.venues.map(v => ({ ...v, winPct: v.mat > 0 ? Math.round((v.won / v.mat) * 100) : 0 })).sort((a, b) => b.mat - a.mat).slice(0, 10);
    
    // Sort best scores/figures for "all formats"
    aggregated.highestInnings = aggregated.highestInnings.sort((a, b) => {
        const aRuns = parseInt(a.runs.replace('*', ''));
        const bRuns = parseInt(b.runs.replace('*', ''));
        if (aRuns === bRuns) return a.runs.includes('*') ? -1 : 1; // Not out ranks higher
        return bRuns - aRuns;
    }).slice(0, 5);
    
    aggregated.bestBowling = aggregated.bestBowling.sort((a, b) => {
        const aW = parseInt(a.figures.split('/')[0]);
        const bW = parseInt(b.figures.split('/')[0]);
        if (aW === bW) {
            const aR = parseInt(a.figures.split('/')[1]);
            const bR = parseInt(b.figures.split('/')[1]);
            return aR - bR; // fewer runs conceded ranks higher
        }
        return bW - aW; // more wickets ranks higher
    }).slice(0, 5);

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(aggregated, null, 2));
    console.log(`[Analytics] Done for ${teamId}/${format}`);
    return aggregated;
}
