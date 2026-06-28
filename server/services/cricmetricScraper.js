import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};

// Sub-API headers — must include Referer so Cricmetric doesn't return 403
const SUB_API_HEADERS = {
    ...HEADERS,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://www.cricmetric.com/',
};


// ── In-memory cache (4h TTL per venue+format combo) ─────────────────────────
const _cache = new Map();
function _getCached(key) {
    const item = _cache.get(key);
    if (item && item.expiry > Date.now()) return item.data;
    return null;
}
function _setCached(key, data, ttlMs = 4 * 60 * 60 * 1000) {
    _cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ── Venue name map: our ground name → cricmetric city query string ────────────
const VENUE_NAME_MAP = {
    // India
    'narendra modi stadium': 'Ahmedabad',
    'sardar patel stadium': 'Ahmedabad',
    'ahmedabad': 'Ahmedabad',
    'eden gardens': 'Kolkata',
    'kolkata': 'Kolkata',
    'wankhede stadium': 'Wankhede',
    'wankhede': 'Wankhede',
    'mumbai': 'Wankhede',
    'brabourne stadium': 'Mumbai',
    'ma chidambaram stadium': 'Chennai',
    'chepauk': 'Chennai',
    'chennai': 'Chennai',
    'arun jaitley stadium': 'Delhi',
    'feroz shah kotla': 'Delhi',
    'delhi': 'Delhi',
    'rajiv gandhi international stadium': 'Hyderabad',
    'uppal': 'Hyderabad',
    'hyderabad': 'Hyderabad',
    'm. chinnaswamy stadium': 'Bangalore',
    'chinnaswamy': 'Bangalore',
    'm chinnaswamy stadium': 'Bangalore',
    'bangalore': 'Bangalore',
    'bengaluru': 'Bangalore',
    'himachal pradesh cricket association stadium': 'Dharamsala',
    'hpca stadium': 'Dharamsala',
    'dharamsala': 'Dharamsala',
    'vidarbha cricket association stadium': 'Nagpur',
    'vca stadium': 'Nagpur',
    'nagpur': 'Nagpur',
    'saurashtra cricket association stadium': 'Rajkot',
    'rajkot': 'Rajkot',
    'maharaja yadavindra singh international cricket stadium': 'Chandigarh',
    'punjab cricket association is bindra stadium': 'Chandigarh',
    'mohali': 'Chandigarh',
    'chandigarh': 'Chandigarh',
    'barabati stadium': 'Cuttack',
    'cuttack': 'Cuttack',
    'ekana cricket stadium': 'Lucknow',
    'bharat ratna shri atal bihari vajpayee ekana cricket stadium': 'Lucknow',
    'lucknow': 'Lucknow',
    'barsapara cricket stadium': 'Guwahati',
    'guwahati': 'Guwahati',
    'dr y.s. rajasekhara reddy aca-vdca cricket stadium': 'Visakhapatnam',
    'visakhapatnam': 'Visakhapatnam',
    'greenfield international stadium': 'Thiruvananthapuram',
    'thiruvananthapuram': 'Thiruvananthapuram',
    // Pakistan
    'national stadium': 'Karachi',
    'karachi': 'Karachi',
    'gaddafi stadium': 'Lahore',
    'lahore': 'Lahore',
    'rawalpindi cricket stadium': 'Rawalpindi',
    'rawalpindi': 'Rawalpindi',
    'multan cricket stadium': 'Multan',
    'multan': 'Multan',
    // Australia
    'melbourne cricket ground': 'Melbourne',
    'mcg': 'Melbourne',
    'melbourne': 'Melbourne',
    'sydney cricket ground': 'Sydney',
    'scg': 'Sydney',
    'sydney': 'Sydney',
    'the gabba': 'Brisbane',
    'gabba': 'Brisbane',
    'brisbane': 'Brisbane',
    'adelaide oval': 'Adelaide',
    'adelaide': 'Adelaide',
    'optus stadium': 'Perth',
    'perth stadium': 'Perth',
    'waca ground': 'Perth',
    'waca': 'Perth',
    'perth': 'Perth',
    'manuka oval': 'Canberra',
    'bellerive oval': 'Hobart',
    // England
    "lord's cricket ground": 'Lords',
    "lords cricket ground": 'Lords',
    "lord's": 'Lords',
    'lords': 'Lords',
    'the oval': 'The Oval',
    'kia oval': 'The Oval',
    'oval': 'The Oval',
    'old trafford': 'Manchester',
    'manchester': 'Manchester',
    'edgbaston': 'Birmingham',
    'birmingham': 'Birmingham',
    'headingley': 'Leeds',
    'leeds': 'Leeds',
    'trent bridge': 'Nottingham',
    'nottingham': 'Nottingham',
    "sophia gardens": 'Cardiff',
    'cardiff': 'Cardiff',
    'riverside ground': 'Chester-le-Street',
    'riverside': 'Chester-le-Street',
    // South Africa
    'newlands': 'Cape Town',
    'cape town': 'Cape Town',
    'wanderers stadium': 'Johannesburg',
    'wanderers': 'Johannesburg',
    'johannesburg': 'Johannesburg',
    'kingsmead': 'Durban',
    'durban': 'Durban',
    "st george's park": 'Port Elizabeth',
    'port elizabeth': 'Port Elizabeth',
    'supersport park': 'Centurion',
    'centurion': 'Centurion',
    "buffalo park": 'East London',
    // West Indies
    'kensington oval': 'Bridgetown',
    'bridgetown': 'Bridgetown',
    "queen's park oval": 'Port of Spain',
    'port of spain': 'Port of Spain',
    'sabina park': 'Kingston',
    'kingston': 'Kingston',
    'warner park': 'Basseterre',
    'providence stadium': 'Providence',
    // Sri Lanka
    'r premadasa stadium': 'Colombo',
    'r. premadasa stadium': 'Colombo',
    'sssc': 'Colombo',
    'colombo': 'Colombo',
    'galle international stadium': 'Galle',
    'galle': 'Galle',
    'pallekele international cricket stadium': 'Pallekele',
    'pallekele': 'Pallekele',
    // New Zealand
    'eden park': 'Auckland',
    'auckland': 'Auckland',
    'basin reserve': 'Wellington',
    'wellington': 'Wellington',
    'hagley oval': 'Christchurch',
    'christchurch': 'Christchurch',
    'university oval': 'Dunedin',
    'dunedin': 'Dunedin',
    // Bangladesh
    'shere bangla national stadium': 'Dhaka',
    'dhaka': 'Dhaka',
    'zahur ahmed chowdhury stadium': 'Chittagong',
    'chittagong': 'Chittagong',
    // Zimbabwe
    'harare sports club': 'Harare',
    'harare': 'Harare',
    // UAE
    'dubai international cricket stadium': 'Dubai',
    'dubai': 'Dubai',
    'sheikh zayed stadium': 'Abu Dhabi',
    'abu dhabi': 'Abu Dhabi',
};

export function resolveVenueName(groundName) {
    if (!groundName) return null;
    const lower = groundName.toLowerCase().trim();
    if (VENUE_NAME_MAP[lower]) return VENUE_NAME_MAP[lower];
    // Partial match — longest key that is contained in groundName wins
    let best = null, bestLen = 0;
    for (const [key, val] of Object.entries(VENUE_NAME_MAP)) {
        if (lower.includes(key) && key.length > bestLen) {
            best = val; bestLen = key.length;
        }
    }
    return best;
}

// ── Parsers ───────────────────────────────────────────────────────────────────

/** Avg first innings score trend: returns { value, year, byYear[] } */
function parseAvgFirstInnings(scriptContent) {
    try {
        const matches = [...scriptContent.matchAll(/dataArray\.push\(\['(\d{4})',\s*([\d.]+)\]\)/g)];
        if (matches.length === 0) return null;
        const sorted = matches.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
        return {
            value: Math.round(parseFloat(sorted[0][2])),
            year: sorted[0][1],
            byYear: sorted.map(m => ({ year: m[1], score: Math.round(parseFloat(m[2])) })).slice(0, 10),
        };
    } catch { return null; }
}

/** Match outcomes donut: { batFirstWins, batSecondWins, draws, totalMatches, ...Pct } */
function parseMatchOutcomes(scriptContent) {
    try {
        const batSecondMatch = scriptContent.match(/['"]Team batting 2nd won['"],\s*(\d+)/);
        const batFirstMatch  = scriptContent.match(/['"]Team batting 1st won['"],\s*(\d+)/);
        const drawMatch      = scriptContent.match(/['"]Drawn['"],\s*(\d+)/);
        const tiedMatch      = scriptContent.match(/['"]Tied['"],\s*(\d+)/);
        const noResultMatch  = scriptContent.match(/['"]No result['"],\s*(\d+)/);

        const batFirst  = batFirstMatch  ? parseInt(batFirstMatch[1])  : 0;
        const batSecond = batSecondMatch ? parseInt(batSecondMatch[1]) : 0;
        const draws     = drawMatch      ? parseInt(drawMatch[1])      : 0;
        const tied      = tiedMatch      ? parseInt(tiedMatch[1])      : 0;
        const noResult  = noResultMatch  ? parseInt(noResultMatch[1])  : 0;
        const total     = batFirst + batSecond + draws + tied + noResult;
        if (total === 0) return null;

        return {
            batFirstWins: batFirst, batSecondWins: batSecond, draws, tied, noResult,
            totalMatches: total,
            batFirstWinPct:  Math.round((batFirst  / total) * 100),
            batSecondWinPct: Math.round((batSecond / total) * 100),
            drawPct:         Math.round((draws     / total) * 100),
        };
    } catch { return null; }
}

/** Bowler type scatter: [{ type, economy, average }] */
function parseBowlerTypes(scriptContent) {
    try {
        // The bowler chart addRows comes before the canvas id 'bowlerbowler_*'
        const match = scriptContent.match(/data\.addRows\(\[([\s\S]*?)\]\);[\s\S]{0,500}bowler/);
        if (!match) return [];
        const rows = [...match[1].matchAll(/\[([\d.]+),\s*([\d.]+),\s*'([^']+)'/g)];
        return rows.map(r => ({
            type: r[3],
            economy: parseFloat(r[1]),
            average: parseFloat(r[2]),
        }));
    } catch { return []; }
}

// ── Google Charts DataTable JSON → plain array ───────────────────────────────
function gcColumnNames(cols) {
    return cols.map(c => c.label || c.id);
}
function gcRows(json) {
    if (!json || !json.rows) return [];
    return json.rows.map(row => row.c.map(cell => (cell ? cell.v : null)));
}
/** Strip HTML tags from a string (player names come wrapped in <a> tags) */
function stripHtml(str) {
    if (!str || typeof str !== 'string') return str;
    // Extract text content from HTML tags
    return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract all url_string values from the page's inline <script> blocks.
 * Returns { batting, bowling, fixture } as relative paths (with sig).
 */
function extractSubApiUrls(html) {
    const found = [...html.matchAll(/url_string\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    return {
        batting: found.find(u => u.includes('role=Batting') || u.includes('Batting')),
        bowling: found.find(u => u.includes('role=Bowling') || u.includes('Bowling')),
        fixture: found.find(u => u.includes('fixture_data')),
    };
}

/** Fetch batting leaders JSON from Cricmetric sub-API */
async function fetchBattingLeaders(relUrl) {
    try {
        const url = `https://www.cricmetric.com${relUrl}`;
        const res = await axios.get(url, { headers: SUB_API_HEADERS, timeout: 12000 });
        const json = res.data;
        const cols = gcColumnNames(json.cols || []);
        const rows = gcRows(json);
        return rows.map((row, i) => {
            const get = (label) => {
                const idx = cols.indexOf(label);
                return idx >= 0 ? row[idx] : undefined;
            };
            return {
                rank: String(i + 1),
                name:    stripHtml(String(get('Player') ?? row[0] ?? '')),
                innings: parseInt(get('I')    ?? row[1]) || 0,
                runs:    parseInt(get('R')    ?? row[2]) || 0,
                balls:   parseInt(get('B')    ?? row[3]) || 0,
                outs:    parseInt(get('Outs') ?? row[4]) || 0,
                avg:     parseFloat(get('Avg') ?? row[5]) || 0,
                sr:      parseFloat(get('SR')  ?? row[6]) || 0,
                hs:      stripHtml(String(get('HS')  ?? row[7] ?? '-')),
                fours:   parseInt(get('4s')   ?? row[8]) || 0,
                sixes:   parseInt(get('6s')   ?? row[9]) || 0,
                hundreds: parseInt(get('100') ?? row[11]) || 0,
            };
        }).filter(p => p.name).slice(0, 10);
    } catch (e) {
        console.warn('[Cricmetric] fetchBattingLeaders error:', e.message);
        return [];
    }
}

/** Fetch bowling leaders JSON from Cricmetric sub-API */
async function fetchBowlingLeaders(relUrl) {
    try {
        const url = `https://www.cricmetric.com${relUrl}`;
        const res = await axios.get(url, { headers: SUB_API_HEADERS, timeout: 12000 });
        const json = res.data;
        const cols = gcColumnNames(json.cols || []);
        const rows = gcRows(json);
        return rows.map((row, i) => {
            const get = (label) => row[cols.indexOf(label)] ?? row[cols.findIndex(c => c.startsWith(label))];
            return {
                rank:    String(i + 1),
                name:    stripHtml(String(get('Player') ?? get('Name') ?? row[0] ?? '')),
                innings: parseInt(get('I')  ?? get('Inn') ?? row[1]) || 0,
                balls:   parseInt(get('B')  ?? get('Balls') ?? row[2]) || 0,
                runs:    parseInt(get('R')  ?? get('Runs') ?? row[3]) || 0,
                wickets: parseInt(get('W')  ?? get('Wkts') ?? row[4]) || 0,
                econ:    parseFloat(get('Econ') ?? row[5]) || 0,
                avg:     parseFloat(get('Avg')  ?? row[6]) || 0,
                sr:      parseFloat(get('SR')   ?? row[7]) || 0,
                bbi:     String(get('BBI') ?? row[8] ?? '-'),
                fiveWkt: parseInt(get('5W') ?? row[9]) || 0,
            };
        }).filter(p => p.name).slice(0, 10);
    } catch (e) {
        console.warn('[Cricmetric] fetchBowlingLeaders error:', e.message);
        return [];
    }
}

/** Fetch recent match list from Cricmetric fixture sub-API */
async function fetchMatchList(relUrl) {
    try {
        const url = `https://www.cricmetric.com${relUrl}`;
        const res = await axios.get(url, { headers: SUB_API_HEADERS, timeout: 12000 });
        const json = res.data;
        const cols = gcColumnNames(json.cols || []);
        const rows = gcRows(json);
        // Columns: ["Team 1", "Team 2", "Format", "Date", "Venue", "Result", "Status"]
        const team1Idx  = cols.findIndex(c => c === 'Team 1' || c === 'Home');
        const team2Idx  = cols.findIndex(c => c === 'Team 2' || c === 'Away');
        const dateIdx   = cols.findIndex(c => c === 'Date' || c === 'Start');
        const resultIdx = cols.findIndex(c => c === 'Result' || c === 'Winner');

        return rows.map(row => {
            // Strip HTML to get clean team names
            const team1Raw  = String(row[team1Idx]  ?? '');
            const team2Raw  = String(row[team2Idx]  ?? '');
            const resultRaw = String(row[resultIdx] ?? '');

            // Extract team name from: <a href="...">TeamName</a><br><div>Score</div>
            const extractTeamName = (html) => {
                const m = html.match(/<a[^>]*>([^<]+)<\/a>/);
                return m ? m[1].trim() : stripHtml(html);
            };
            const extractScore = (html) => {
                const m = html.match(/<div[^>]*>([^<]+)<\/div>/);
                return m ? m[1].trim() : '';
            };
            // Extract match URL from result column: <a href="/match/...">WINNER/DRAW</a>
            const hrefM = resultRaw.match(/href="([^"]+)"/);
            const matchPath = hrefM ? hrefM[1] : null;

            const team1 = extractTeamName(team1Raw);
            const team2 = extractTeamName(team2Raw);
            const score1 = extractScore(team1Raw);
            const score2 = extractScore(team2Raw);
            const result = stripHtml(resultRaw);
            const date   = String(row[dateIdx] ?? '').split('T')[0];

            const teams = score1 && score2
                ? `${team1} (${score1}) vs ${team2} (${score2})`
                : `${team1} vs ${team2}`;

            return {
                date,
                teams,
                result,
                matchUrl: matchPath ? `https://www.cricmetric.com${matchPath}` : null,
            };
        }).filter(m => m.teams && m.teams !== ' vs ').slice(0, 20);

    } catch (e) {
        console.warn('[Cricmetric] fetchMatchList error:', e.message);
        return [];
    }
}

// ── Main scraper ──────────────────────────────────────────────────────────────

/**
 * Scrape all venue data from cricmetric for a given ground name, country, and format.
 * Returns null if the venue name cannot be mapped.
 */
export async function scrapeCricmetricVenue(groundName, country, format = 'Test') {
    const venueName = resolveVenueName(groundName);
    if (!venueName) {
        console.log(`[Cricmetric] No mapping for "${groundName}" (${country})`);
        return null;
    }

    const cacheKey = `cm_${venueName}_${format}`;
    const cached = _getCached(cacheKey);
    if (cached) {
        console.log(`[Cricmetric] Cache hit: ${venueName} (${format})`);
        return cached;
    }

    const url = `https://www.cricmetric.com/venue.py?venue=${encodeURIComponent(venueName)}&format=${format}&category=Men`;
    console.log(`[Cricmetric] Fetching: ${url}`);

    try {
        const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        if (res.status !== 200) {
            console.warn(`[Cricmetric] Status ${res.status} for ${venueName}`);
            return null;
        }

        const $ = cheerio.load(res.data);
        const scriptContent = $('script').map((_, el) => $(el).html() || '').get().join('\n');

        // Parse from embedded JS (bowler types, match outcomes, avg innings trend)
        const avgFirstInnings = parseAvgFirstInnings(scriptContent);
        const outcomes        = parseMatchOutcomes(scriptContent);
        const bowlerTypes     = parseBowlerTypes(scriptContent);

        // Extract signed sub-API URLs and fetch in parallel
        const subUrls = extractSubApiUrls(res.data);
        const [battingLeaders, bowlingLeaders, recentMatches] = await Promise.all([
            subUrls.batting ? fetchBattingLeaders(subUrls.batting) : Promise.resolve([]),
            subUrls.bowling ? fetchBowlingLeaders(subUrls.bowling) : Promise.resolve([]),
            subUrls.fixture ? fetchMatchList(subUrls.fixture)      : Promise.resolve([]),
        ]);

        const result = {
            source: 'cricmetric',
            venueName,
            format,
            avgFirstInnings:       avgFirstInnings?.value || null,
            avgFirstInningsByYear: avgFirstInnings?.byYear || [],
            matchOutcomes:         outcomes,
            bowlerTypes,
            battingLeaders,
            bowlingLeaders,
            recentMatches,
        };

        console.log(`[Cricmetric] ✓ ${venueName} (${format}): outcomes=${outcomes?.totalMatches || 0}, avg=${avgFirstInnings?.value || 'n/a'}, bat=${battingLeaders.length}, bowl=${bowlingLeaders.length}, matches=${recentMatches.length}`);
        _setCached(cacheKey, result);
        return result;
    } catch (err) {
        console.error(`[Cricmetric] Failed ${venueName} (${format}):`, err.message);
        return null;
    }
}


/**
 * Scrape across all 3 formats and return a merged object keyed by format.
 */
export async function scrapeCricmetricAllFormats(groundName, country) {
    const formats = ['Test', 'ODI', 'T20'];
    const results = {};
    for (const fmt of formats) {
        const data = await scrapeCricmetricVenue(groundName, country, fmt);
        if (data) results[fmt] = data;
        await new Promise(r => setTimeout(r, 600));
    }
    return Object.keys(results).length > 0 ? results : null;
}
