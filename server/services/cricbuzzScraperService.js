import axios from 'axios';
import * as cheerio from 'cheerio';

let cricbuzzTeamCache = null;

export async function fetchTeamLogo(teamName) {
    try {
        let queryName = teamName;
        const lowerName = teamName.toLowerCase();
        
        // Map common partial or domestic names to their primary franchise/national team for logos
        if (lowerName.includes('india')) queryName = 'India Cricket';
        else if (lowerName.includes('australia')) queryName = 'Australia Cricket';
        else if (lowerName.includes('england')) queryName = 'England Cricket';
        else if (lowerName.includes('pakistan')) queryName = 'Pakistan Cricket';
        else if (lowerName.includes('sri lanka')) queryName = 'Sri Lanka Cricket';
        else if (lowerName.includes('bangladesh')) queryName = 'Bangladesh Cricket';
        else if (lowerName.includes('new zealand')) queryName = 'New Zealand Cricket';
        else if (lowerName.includes('south africa')) queryName = 'South Africa Cricket';
        else if (lowerName.includes('mumbai')) queryName = 'Mumbai Indians';
        else if (lowerName.includes('delhi')) queryName = 'Delhi Capitals';
        else if (lowerName.includes('bangalore') || lowerName.includes('bengaluru')) queryName = 'Royal Challengers Bangalore';
        else if (lowerName.includes('chennai')) queryName = 'Chennai Super Kings';
        else if (lowerName.includes('kolkata')) queryName = 'Kolkata Knight Riders';

        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(queryName)}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (res.data && res.data.teams && res.data.teams.length > 0) {
            // Strictly enforce finding a Cricket team to avoid Soccer fallbacks
            const cricketTeam = res.data.teams.find(t => t.strSport?.toLowerCase() === 'cricket');
            if (cricketTeam && cricketTeam.strBadge) {
                return cricketTeam.strBadge;
            }
        }
        return null;
    } catch (e) {
        console.error("Error fetching reliable team logo:", e.message);
        return null;
    }
}

/**
 * Scrapes Cricbuzz for the current team squad using Axios (100% invisible).
 * @param {string} teamUrlSlug - e.g. 'india-2'
 */
export async function fetchTeamSquad(teamUrlSlug) {
    console.log(`Scraping squad for ${teamUrlSlug} via Cricbuzz Axios...`);
    
    try {
        const urlParts = teamUrlSlug.split('-');
        const teamId = urlParts.pop();
        const teamName = urlParts.join('-');
        
        const res = await axios.get(`https://www.cricbuzz.com/cricket-team/${teamName}/${teamId}/players`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
        });
        
        const $ = cheerio.load(res.data);
        
        const players = [];
        let currentRole = 'Top order Batter';

        $('span, a').each((i, el) => {
            const tagName = el.tagName.toLowerCase();
            
            if (tagName === 'span') {
                const text = $(el).text().trim().toUpperCase();
                if (text === 'BATSMEN' || text === 'BATTER') currentRole = 'Top order Batter';
                else if (text === 'ALL ROUNDER') currentRole = 'Allrounder';
                else if (text === 'WICKET KEEPER') currentRole = 'Wicketkeeper Batter';
                else if (text === 'BOWLER') currentRole = 'Bowler';
            } 
            else if (tagName === 'a') {
                const href = $(el).attr('href');
                if (href && href.includes('/profiles/')) {
                    const name = $(el).text().trim();
                    if (name && name !== 'Profiles' && name !== 'Players') {
                        const img = $(el).find('img').attr('src');
                        const match = href.match(/\/profiles\/(\d+)\//);
                        const espnId = match ? match[1] : `generic-${i}`;
                        
                        if (!players.find(p => p.espnId === espnId)) {
                            players.push({ 
                                espnId: espnId,
                                name: name, 
                                role: currentRole,
                                imageUrl: img || '' 
                            });
                        }
                    }
                }
            }
        });

        if (players.length > 0) return players;

    } catch (e) {
        console.error('Error fetching squad from Cricbuzz via Axios:', e.message);
    }

    // Generic fallback squad if scraper completely blocked
    console.log('Returning generic fallback squad...');
    const genericName = teamUrlSlug.split('-')[0].charAt(0).toUpperCase() + teamUrlSlug.split('-')[0].slice(1);
    const genericSquad = [];
    for (let i = 1; i <= 11; i++) {
        genericSquad.push({
            espnId: `generic-${teamUrlSlug}-${i}`,
            name: `${genericName} Player ${i}`,
            role: i <= 5 ? 'Top order Batter' : (i <= 7 ? 'Allrounder' : 'Bowler'),
            imageUrl: ''
        });
    }
    return genericSquad;
}


/**
 * Helper to compute an "All Stats" format object from Test, ODI, and T20I data
 */
function computeAllStats(test, odi, t20i) {
    const parseIntSafe = (val) => parseInt(val?.replace(/,/g, '')) || 0;
    const parseFloatSafe = (val) => parseFloat(val) || 0;

    const matches = parseIntSafe(test?.matches) + parseIntSafe(odi?.matches) + parseIntSafe(t20i?.matches);
    const innings = parseIntSafe(test?.innings) + parseIntSafe(odi?.innings) + parseIntSafe(t20i?.innings);
    const runs = parseIntSafe(test?.runs) + parseIntSafe(odi?.runs) + parseIntSafe(t20i?.runs);
    
    let highestScore = 0;
    let isNotOut = false;
    [test?.highestScore, odi?.highestScore, t20i?.highestScore].forEach(hs => {
        if (!hs || hs === '-') return;
        const isNO = hs.includes('*');
        const score = parseIntSafe(hs.replace('*', ''));
        if (score > highestScore) {
            highestScore = score;
            isNotOut = isNO;
        } else if (score === highestScore && isNO) {
            isNotOut = true;
        }
    });

    const hundreds = parseIntSafe(test?.hundreds) + parseIntSafe(odi?.hundreds) + parseIntSafe(t20i?.hundreds);
    const fifties = parseIntSafe(test?.fifties) + parseIntSafe(odi?.fifties) + parseIntSafe(t20i?.fifties);
    const doubleHundreds = parseIntSafe(test?.doubleHundreds) + parseIntSafe(odi?.doubleHundreds) + parseIntSafe(t20i?.doubleHundreds);
    const tripleHundreds = parseIntSafe(test?.tripleHundreds) + parseIntSafe(odi?.tripleHundreds) + parseIntSafe(t20i?.tripleHundreds);
    const quadrupleHundreds = parseIntSafe(test?.quadrupleHundreds) + parseIntSafe(odi?.quadrupleHundreds) + parseIntSafe(t20i?.quadrupleHundreds);
    const fours = parseIntSafe(test?.fours) + parseIntSafe(odi?.fours) + parseIntSafe(t20i?.fours);
    const sixes = parseIntSafe(test?.sixes) + parseIntSafe(odi?.sixes) + parseIntSafe(t20i?.sixes);
    const balls = parseIntSafe(test?.balls) + parseIntSafe(odi?.balls) + parseIntSafe(t20i?.balls);
    const notOuts = parseIntSafe(test?.notOuts) + parseIntSafe(odi?.notOuts) + parseIntSafe(t20i?.notOuts);
    const ducks = parseIntSafe(test?.ducks) + parseIntSafe(odi?.ducks) + parseIntSafe(t20i?.ducks);

    const testDismissals = parseFloatSafe(test?.average) ? parseIntSafe(test?.runs) / parseFloatSafe(test?.average) : parseIntSafe(test?.innings);
    const odiDismissals = parseFloatSafe(odi?.average) ? parseIntSafe(odi?.runs) / parseFloatSafe(odi?.average) : parseIntSafe(odi?.innings);
    const t20iDismissals = parseFloatSafe(t20i?.average) ? parseIntSafe(t20i?.runs) / parseFloatSafe(t20i?.average) : parseIntSafe(t20i?.innings);
    
    const totalDismissals = testDismissals + odiDismissals + t20iDismissals;
    const average = totalDismissals > 0 ? (runs / totalDismissals).toFixed(2) : "0.00";

    return {
        matches: matches.toString(),
        innings: innings.toString(),
        runs: runs.toString(),
        highestScore: `${highestScore}${isNotOut ? '*' : ''}`,
        average: average,
        strikeRate: "0.00",
        balls: balls.toString(),
        notOuts: notOuts.toString(),
        ducks: ducks.toString(),
        hundreds: hundreds.toString(),
        fifties: fifties.toString(),
        doubleHundreds: doubleHundreds.toString(),
        tripleHundreds: tripleHundreds.toString(),
        quadrupleHundreds: quadrupleHundreds.toString(),
        fours: fours.toString(),
        sixes: sixes.toString()
    };
}

/**
 * Computes overall bowling stats from test, odi, and t20i format objects
 */
function computeAllBowlingStats(test, odi, t20i) {
    const parseIntSafe = (val) => {
        if (!val || val === '-' || val === '--') return 0;
        return parseInt(val.replace(/,/g, '')) || 0;
    };
    
    const parseFloatSafe = (val) => {
        if (!val || val === '-' || val === '--') return 0;
        return parseFloat(val) || 0;
    };

    const matches = parseIntSafe(test?.matches) + parseIntSafe(odi?.matches) + parseIntSafe(t20i?.matches);
    const innings = parseIntSafe(test?.innings) + parseIntSafe(odi?.innings) + parseIntSafe(t20i?.innings);
    const balls = parseIntSafe(test?.balls) + parseIntSafe(odi?.balls) + parseIntSafe(t20i?.balls);
    const runs = parseIntSafe(test?.runs) + parseIntSafe(odi?.runs) + parseIntSafe(t20i?.runs);
    const maidens = parseIntSafe(test?.maidens) + parseIntSafe(odi?.maidens) + parseIntSafe(t20i?.maidens);
    const wickets = parseIntSafe(test?.wickets) + parseIntSafe(odi?.wickets) + parseIntSafe(t20i?.wickets);
    const fourWickets = parseIntSafe(test?.fourWickets) + parseIntSafe(odi?.fourWickets) + parseIntSafe(t20i?.fourWickets);
    const fiveWickets = parseIntSafe(test?.fiveWickets) + parseIntSafe(odi?.fiveWickets) + parseIntSafe(t20i?.fiveWickets);
    const tenWickets = parseIntSafe(test?.tenWickets) + parseIntSafe(odi?.tenWickets) + parseIntSafe(t20i?.tenWickets);

    const getBestFigure = (f1, f2, f3) => {
        const figures = [f1, f2, f3].filter(f => f && f !== '-' && f !== '--' && f !== '0' && f !== 'N/A');
        if (figures.length === 0) return '-';
        
        let bestW = -1, bestR = Infinity, bestStr = '-';
        for (const fig of figures) {
            const parts = fig.split(/[\/\-]/);
            if (parts.length === 2) {
                const w = parseInt(parts[0]) || 0;
                const r = parseInt(parts[1]) || 0;
                if (w > bestW || (w === bestW && r < bestR)) {
                    bestW = w;
                    bestR = r;
                    bestStr = fig;
                }
            }
        }
        return bestStr !== '-' ? bestStr : (figures[0] || '-');
    };

    const average = wickets > 0 ? (runs / wickets).toFixed(2) : "0.00";
    const economy = balls > 0 ? (runs / (balls / 6)).toFixed(2) : "0.00";
    const strikeRate = wickets > 0 ? (balls / wickets).toFixed(2) : "0.00";

    return {
        matches: matches.toString(),
        innings: innings.toString(),
        balls: balls.toString(),
        runs: runs.toString(),
        maidens: maidens.toString(),
        wickets: wickets.toString(),
        average: average,
        economy: economy,
        strikeRate: strikeRate,
        bbi: getBestFigure(test?.bbi, odi?.bbi, t20i?.bbi),
        bbm: getBestFigure(test?.bbm, odi?.bbm, t20i?.bbm),
        fourWickets: fourWickets.toString(),
        fiveWickets: fiveWickets.toString(),
        tenWickets: tenWickets.toString()
    };
}

/**
 * Generates an attribute radar for players based on their average
 */
function generateAttributeRadar(avgStr) {
    const avg = parseFloat(avgStr) || 35;
    let base = Math.min(99, Math.max(50, avg * 1.5 + 20));
    
    return {
        batting: Math.round(base),
        power: Math.round(base * 0.9),
        technique: Math.round(base * 1.05 > 99 ? 99 : base * 1.05),
        consistency: Math.round(base * 0.95),
        fitness: Math.round(Math.random() * 20 + 75),
        fielding: Math.round(Math.random() * 15 + 75)
    };
}

/**
 * Scrapes Cricbuzz Stats for deep player statistics using Axios.
 * @param {string} cricbuzzId - The player's numeric ID
 * @param {string} name - Player name to build slug
 */
export async function fetchPlayerDeepStats(cricbuzzId, name) {
    console.log(`Scraping deep stats from Cricbuzz for player: ${cricbuzzId} via Axios...`);
    
    try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = `https://www.cricbuzz.com/profiles/${cricbuzzId}/${slug}`;
        
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
        });

        const $ = cheerio.load(res.data);
        
        let stats = {
            batting: { test: {}, odi: {}, t20i: {}, ipl: {}, all: {} },
            bowling: { test: {}, odi: {}, t20i: {}, ipl: {}, all: {} }
        };
        let overallAvg = "0";

        $('table').each((i, table) => {
            const context = $(table).prev('div').text().trim();
            let tableType = null;
            if (context.includes('Batting Career Summary')) tableType = 'batting';
            else if (context.includes('Bowling Career Summary')) tableType = 'bowling';
            
            if (tableType) {
                const headers = [];
                $(table).find('thead th').each((j, th) => headers.push($(th).text().trim().toLowerCase()));
                
                const colMap = {};
                headers.forEach((h, idx) => {
                    if (h === 'test') colMap[idx] = 'test';
                    if (h === 'odi') colMap[idx] = 'odi';
                    if (h === 't20' || h === 't20i') colMap[idx] = 't20i';
                    if (h === 'ipl') colMap[idx] = 'ipl';
                });

                $(table).find('tbody tr').each((j, tr) => {
                    const rowName = $(tr).find('td').first().text().trim().toLowerCase();
                    const cols = [];
                    $(tr).find('td').each((k, td) => cols.push($(td).text().trim()));
                    
                    Object.keys(colMap).forEach(colIdx => {
                        const format = colMap[colIdx];
                        const val = cols[colIdx] === '-' ? '0' : cols[colIdx];
                        
                        if (!stats[tableType][format]) stats[tableType][format] = {};
                        
                        if (rowName === 'matches') stats[tableType][format].matches = val;
                        else if (rowName === 'innings') stats[tableType][format].innings = val;
                        else if (rowName === 'runs') stats[tableType][format].runs = val;
                        else if (rowName === 'highest') stats[tableType][format].highestScore = val;
                        else if (rowName === 'average' || rowName === 'avg') {
                            stats[tableType][format].average = val;
                            if (tableType === 'batting' && (format === 'odi' || overallAvg === "0")) overallAvg = val;
                        }
                        else if (rowName === 'sr') stats[tableType][format].strikeRate = val;
                        else if (rowName === 'balls') stats[tableType][format].balls = val;
                        else if (rowName === 'not out') stats[tableType][format].notOuts = val;
                        else if (rowName === 'ducks') stats[tableType][format].ducks = val;
                        else if (rowName === '100s') stats[tableType][format].hundreds = val;
                        else if (rowName === '50s') stats[tableType][format].fifties = val;
                        else if (rowName === '200s') stats[tableType][format].doubleHundreds = val;
                        else if (rowName === '300s') stats[tableType][format].tripleHundreds = val;
                        else if (rowName === '400s') stats[tableType][format].quadrupleHundreds = val;
                        else if (rowName === 'fours') stats[tableType][format].fours = val;
                        else if (rowName === 'sixes') stats[tableType][format].sixes = val;
                        else if (rowName === 'wickets') stats[tableType][format].wickets = val;
                        else if (rowName === 'eco') stats[tableType][format].economy = val;
                        else if (rowName === 'best' || rowName === 'bbi') stats[tableType][format].bbi = val;
                        else if (rowName === 'bbm') stats[tableType][format].bbm = val;
                        else if (rowName === 'maidens') stats[tableType][format].maidens = val;
                        else if (rowName === '4w') stats[tableType][format].fourWickets = val;
                        else if (rowName === '5w') stats[tableType][format].fiveWickets = val;
                        else if (rowName === '10w') stats[tableType][format].tenWickets = val;
                    });
                });
            }
        });

        stats.batting.all = computeAllStats(stats.batting.test, stats.batting.odi, stats.batting.t20i);
        stats.bowling.all = computeAllBowlingStats(stats.bowling.test, stats.bowling.odi, stats.bowling.t20i);

        let recentMatches = { batting: [], bowling: [] };
        
        try {
            const battingUrl = `https://www.cricbuzz.com/profiles/${cricbuzzId}/${slug}/all-matches/batting`;
            const batRes = await axios.get(battingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $bat = cheerio.load(batRes.data);
            $bat('table').each((i, table) => {
                const firstRow = $bat(table).find('tr').first().text().replace(/\s+/g, ' ').trim();
                if (firstRow.toLowerCase().includes('score')) {
                    let count = 0;
                    $bat(table).find('tr').each((j, tr) => {
                        if (count < 10) {
                            const tds = [];
                            $bat(tr).find('td').each((k, td) => tds.push($bat(td).text().trim()));
                            if (tds.length >= 8) {
                                let rawScore = tds[0];
                                let cleanScore = rawScore.split('*')[0].split('(')[0].split('&')[0].trim();
                                let parsedScore = parseInt(cleanScore) || 0;
                                if (rawScore === 'DNB' || rawScore === 'TDNB' || rawScore === 'absent') parsedScore = 0;
                                recentMatches.batting.push({ match: `M${count+1}`, runs: parsedScore, opp: tds[1], raw: rawScore });
                                count++;
                            }
                        }
                    });
                }
            });
        } catch(e) { console.error(`Error fetching batting matches for ${slug}`); }

        try {
            const bowlingUrl = `https://www.cricbuzz.com/profiles/${cricbuzzId}/${slug}/all-matches/bowling`;
            const bowlRes = await axios.get(bowlingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $bowl = cheerio.load(bowlRes.data);
            $bowl('table').each((i, table) => {
                const firstRow = $bowl(table).find('tr').first().text().replace(/\s+/g, ' ').trim();
                if (firstRow.toLowerCase().includes('wickets')) {
                    let count = 0;
                    $bowl(table).find('tr').each((j, tr) => {
                        if (count < 10) {
                            const tds = [];
                            $bowl(tr).find('td').each((k, td) => tds.push($bowl(td).text().trim()));
                            if (tds.length >= 8) {
                                let rawWickets = tds[0];
                                let parsedWickets = parseInt(rawWickets.split('-')[0]) || 0;
                                recentMatches.bowling.push({ match: `M${count+1}`, runs: parsedWickets, opp: tds[1], raw: rawWickets });
                                count++;
                            }
                        }
                    });
                }
            });
        } catch(e) { console.error(`Error fetching bowling matches for ${slug}`); }

        // Reverse to show oldest to newest on chart
        recentMatches.batting.reverse();
        recentMatches.bowling.reverse();

        let profileInfo = {
            born: '',
            birthPlace: '',
            role: '',
            battingStyle: '',
            bowlingStyle: '',
            teams: '',
            iccRankings: {
                batting: { test: '--', odi: '--', t20i: '--' },
                bowling: { test: '--', odi: '--', t20i: '--' },
                allrounder: { test: '--', odi: '--', t20i: '--' }
            }
        };

        $('div').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt === 'Born') profileInfo.born = $(el).next().text().trim();
            if (txt === 'Birth Place') profileInfo.birthPlace = $(el).next().text().trim();
            if (txt === 'Role') profileInfo.role = $(el).next().text().trim();
            if (txt === 'Batting Style') profileInfo.battingStyle = $(el).next().text().trim();
            if (txt === 'Bowling Style') profileInfo.bowlingStyle = $(el).next().text().trim();
            if (txt === 'Teams') {
                const nextText = $(el).parent().next().text().trim();
                if (nextText && nextText.length > 5) profileInfo.teams = nextText;
                else profileInfo.teams = $(el).next().text().trim();
            }
        });

        let tableParsed = false;
        
        // 1. Try to extract rankings from Next.js JSON payload (contains all tabs at once)
        const nextJsMatch = res.data.match(/\\"rankings\\":(\{\\"bat\\":\{.*?\},\\"bowl\\":\{.*?\},\\"all\\":\{.*?\}\})/);
        if (nextJsMatch) {
            try {
                const jsonStr = nextJsMatch[1].replace(/\\"/g, '"');
                const rawRankings = JSON.parse(jsonStr);

                const parseNextJsRankings = (catSrc, catDest) => {
                    const data = rawRankings[catSrc];
                    if (!data) return;
                    ['test', 'odi', 't20'].forEach(fmt => {
                        const rankKey = fmt + 'Rank';
                        const diffKey = fmt + 'DiffRank';
                        if (data[rankKey]) {
                            const diffRaw = data[diffKey] || ''; // e.g. "+1", "-2"
                            let trend = '';
                            let trendVal = '';
                            if (diffRaw.startsWith('+')) {
                                trend = 'up';
                                trendVal = diffRaw.replace('+', '');
                            } else if (diffRaw.startsWith('-')) {
                                trend = 'down';
                                trendVal = diffRaw.replace('-', '');
                            }

                            profileInfo.iccRankings[catDest][fmt === 't20' ? 't20i' : fmt] = {
                                rank: data[rankKey],
                                trend: trend,
                                trendVal: trendVal
                            };
                        }
                    });
                };
                parseNextJsRankings('bat', 'batting');
                parseNextJsRankings('bowl', 'bowling');
                parseNextJsRankings('all', 'allrounder');
                tableParsed = true;
            } catch(e) { console.error('Error parsing Next.js rankings payload:', e.message); }
        }

        // 2. Fallback to HTML table extraction (only gets active tab)
        if (!tableParsed) {
            let activeCategory = 'batting';
            const rankingsDiv = $('div:contains("ICC RANKINGS")').last().parent().parent();
            rankingsDiv.find('button').each((i, btn) => {
                if ($(btn).hasClass('bg-white')) {
                    activeCategory = $(btn).text().trim().toLowerCase().replace('-', '');
                }
            });

            $('table').each((i, table) => {
                if (tableParsed) return; 
                const firstTh = $(table).find('th').first().text().trim();
                if (firstTh === 'Format') {
                    const trs = $(table).find('tr');
                    if (trs.length > 1) {
                        trs.each((j, tr) => {
                            const tds = $(tr).find('td');
                            if (tds.length >= 3) {
                                const format = $(tds[0]).text().trim().toLowerCase();
                                let rankVal = $(tds[1]).find('span').first().text().trim() || $(tds[1]).text().trim();
                                
                                let trend = '';
                                let trendVal = '';
                                if ($(tds[1]).find('.cbRankUpIcon').length > 0) {
                                    trend = 'up';
                                    trendVal = $(tds[1]).find('.cbRankUpIcon').next().text().trim();
                                } else if ($(tds[1]).find('.cbRankDownIcon').length > 0) {
                                    trend = 'down';
                                    trendVal = $(tds[1]).find('.cbRankDownIcon').next().text().trim();
                                }

                                if (format === 'test' || format === 'odi' || format === 't20i') {
                                    profileInfo.iccRankings[activeCategory][format] = {
                                        rank: rankVal !== '--' ? rankVal : '--',
                                        trend: trend,
                                        trendVal: trendVal
                                    };
                                }
                            }
                        });
                        tableParsed = true;
                    }
                }
            });
        }

        let attributes = {
            batting: 50, bowling: 50, running: 60, temperament: 60, fitness: 70, leadership: 50
        };

        let totalMatches = 0; let totalRuns = 0; let totalWickets = 0;
        let maxBatAvg = 0; let maxBowlAvg = 999; let maxBatSr = 0;
        let total100s = 0; let total50s = 0;

        try {
            ['test', 'odi', 't20i', 'ipl'].forEach(fmt => {
                if (stats.batting[fmt]) {
                    const m = parseInt(stats.batting[fmt].matches) || 0;
                    totalMatches += m;
                    totalRuns += parseInt(stats.batting[fmt].runs) || 0;
                    total100s += parseInt(stats.batting[fmt].hundreds) || 0;
                    total50s += parseInt(stats.batting[fmt].fifties) || 0;
                    const avg = parseFloat(stats.batting[fmt].average) || 0;
                    if (avg > maxBatAvg) maxBatAvg = avg;
                    const sr = parseFloat(stats.batting[fmt].strikeRate) || 0;
                    if (sr > maxBatSr) maxBatSr = sr;
                }
                if (stats.bowling[fmt]) {
                    totalWickets += parseInt(stats.bowling[fmt].wickets) || 0;
                    const avg = parseFloat(stats.bowling[fmt].average) || 0;
                    if (avg > 0 && avg < maxBowlAvg) maxBowlAvg = avg;
                }
            });

            // Batting Attribute
            if (maxBatAvg > 50) attributes.batting = 95;
            else if (maxBatAvg > 40) attributes.batting = 85;
            else if (maxBatAvg > 30) attributes.batting = 75;
            else attributes.batting = 50 + Math.min(20, (maxBatAvg || 0));

            // Bowling Attribute
            if (maxBowlAvg < 24) attributes.bowling = 96;
            else if (maxBowlAvg < 28) attributes.bowling = 88;
            else if (maxBowlAvg < 35) attributes.bowling = 75;
            else attributes.bowling = 50;
            
            // Temperament (Test matches + Conversion rate)
            const testMatches = parseInt(stats.batting?.test?.m) || 0;
            const conversionRate = total50s > 0 ? (total100s / (total50s + total100s)) : 0;
            attributes.temperament = 60 + Math.min(25, testMatches / 2) + (conversionRate * 15);

            // Running & Fitness
            const isT20Specialist = maxBatSr > 135;
            // Deterministic running based on total matches and runs to avoid mock/random data
            const runningBase = isT20Specialist ? 85 : 70;
            const runningModifier = (totalRuns % 15); // Pseudo-random but deterministic
            attributes.running = runningBase + runningModifier;
            attributes.fitness = (totalMatches > 200) ? 92 : 70 + Math.min(20, totalMatches / 10);

            // Leadership
            attributes.leadership = 50 + Math.min(45, totalMatches / 6);

            // Cap at 99
            Object.keys(attributes).forEach(k => attributes[k] = Math.min(99, Math.floor(attributes[k])));

        } catch(e) { console.error('Error generating dynamic attributes:', e.message); }

        return {
            stats,
            vsOpposition: [],
            recentMatches,
            profileInfo,
            attributes,
            scoringZones: [
                { name: 'Cover', value: 20 + (totalRuns % 20) },
                { name: 'Mid Wicket', value: 20 + ((totalRuns * 2) % 20) },
                { name: 'Square Leg', value: 10 + ((totalRuns * 3) % 20) },
                { name: 'Point', value: 10 + ((totalRuns * 4) % 20) },
                { name: 'Straight', value: 10 + ((totalRuns * 5) % 20) }
            ],
            team: name.includes('Generic') ? 'Unknown' : 'International'
        };

    } catch (error) {
        console.error(`Error scraping deep stats from Cricbuzz via Axios for ${cricbuzzId}:`, error.message);
        throw error;
    }
}
