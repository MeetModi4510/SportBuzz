/**
 * espnStatsguruScraper.js
 *
 * Scrapes ESPN Cricinfo Statsguru for venue analysis data.
 * Uses Node's built-in https module (NOT axios) because ESPN URLs use
 * semicolons as query-param separators, and axios URL-encodes them (→ 400).
 *
 * Data available: batting leaders, bowling leaders, match list, innings averages.
 * All-time records — not limited to recent years like Cricmetric.
 */

import https from 'https';
import * as cheerio from 'cheerio';

// ── Request headers ──────────────────────────────────────────────────────────
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espncricinfo.com/',
};

// ── In-memory cache (6h TTL) ─────────────────────────────────────────────────
const _cache = new Map();
function _getCached(key) {
    const item = _cache.get(key);
    if (item && item.expiry > Date.now()) return item.data;
    return null;
}
function _setCached(key, data, ttlMs = 6 * 60 * 60 * 1000) {
    _cache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ── ESPN Ground ID map ────────────────────────────────────────────────────────
// Maps common venue name keywords/aliases → ESPN Statsguru numeric ground ID
// Format: lowercase key fragments → groundId
export const ESPN_GROUND_MAP = {
    // ── India (all major international venues) ────────────────────────────────
    'wankhede': { id: 713, name: 'Wankhede Stadium, Mumbai' },
    'mumbai': { id: 713, name: 'Wankhede Stadium, Mumbai' },
    'eden gardens': { id: 292, name: 'Eden Gardens, Kolkata' },
    'kolkata': { id: 292, name: 'Eden Gardens, Kolkata' },
    'ma chidambaram': { id: 291, name: 'MA Chidambaram Stadium, Chennai' },
    'm. a. chidambaram': { id: 291, name: 'MA Chidambaram Stadium, Chennai' },
    'chidambaram': { id: 291, name: 'MA Chidambaram Stadium, Chennai' },
    'chepauk': { id: 291, name: 'MA Chidambaram Stadium, Chennai' },
    'chennai': { id: 291, name: 'MA Chidambaram Stadium, Chennai' },
    'arun jaitley': { id: 333, name: 'Arun Jaitley Stadium, Delhi' },
    'feroz shah kotla': { id: 333, name: 'Arun Jaitley Stadium, Delhi' },
    'delhi': { id: 333, name: 'Arun Jaitley Stadium, Delhi' },
    'm. chinnaswamy': { id: 683, name: 'M. Chinnaswamy Stadium, Bengaluru' },
    'chinnaswamy': { id: 683, name: 'M. Chinnaswamy Stadium, Bengaluru' },
    'bangalore': { id: 683, name: 'M. Chinnaswamy Stadium, Bengaluru' },
    'bengaluru': { id: 683, name: 'M. Chinnaswamy Stadium, Bengaluru' },
    'narendra modi': { id: 840, name: 'Narendra Modi Stadium, Ahmedabad' },
    'sardar patel': { id: 840, name: 'Narendra Modi Stadium, Ahmedabad' },
    'motera': { id: 840, name: 'Narendra Modi Stadium, Ahmedabad' },
    'ahmedabad': { id: 840, name: 'Narendra Modi Stadium, Ahmedabad' },
    'rajiv gandhi': { id: 1981, name: 'Rajiv Gandhi International Stadium, Hyderabad' },
    'uppal': { id: 1981, name: 'Rajiv Gandhi International Stadium, Hyderabad' },
    'hyderabad': { id: 1981, name: 'Rajiv Gandhi International Stadium, Hyderabad' },
    'hpca': { id: 1920, name: 'HPCA Stadium, Dharamsala' },
    'dharamsala': { id: 1920, name: 'HPCA Stadium, Dharamsala' },
    'himachal pradesh': { id: 1920, name: 'HPCA Stadium, Dharamsala' },
    'vidarbha': { id: 2399, name: 'VCA Stadium, Nagpur' },
    'vca stadium': { id: 2399, name: 'VCA Stadium, Nagpur' },
    'nagpur': { id: 2399, name: 'VCA Stadium, Nagpur' },
    'sawai mansingh': { id: 664, name: 'Sawai Mansingh Stadium, Jaipur' },
    'jaipur': { id: 664, name: 'Sawai Mansingh Stadium, Jaipur' },
    'barabati': { id: 442, name: 'Barabati Stadium, Cuttack' },
    'cuttack': { id: 442, name: 'Barabati Stadium, Cuttack' },
    'green park': { id: 419, name: 'Green Park, Kanpur' },
    'kanpur': { id: 419, name: 'Green Park, Kanpur' },
    'saurashtra': { id: 2401, name: 'Saurashtra Cricket Association Stadium, Rajkot' },
    'niranjan shah': { id: 2401, name: 'Saurashtra Cricket Association Stadium, Rajkot' },
    'rajkot': { id: 2401, name: 'Saurashtra Cricket Association Stadium, Rajkot' },
    'is bindra': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'i. s. bindra': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'bindra': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'pca stadium': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'mohali': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'chandigarh': { id: 1015, name: 'IS Bindra Stadium, Mohali' },
    'ekana': { id: 3355, name: 'Ekana Cricket Stadium, Lucknow' },
    'lucknow': { id: 3355, name: 'Ekana Cricket Stadium, Lucknow' },
    'barsapara': { id: 2865, name: 'Barsapara Cricket Stadium, Guwahati' },
    'aca stadium': { id: 2865, name: 'Barsapara Cricket Stadium, Guwahati' },
    'guwahati': { id: 2865, name: 'Barsapara Cricket Stadium, Guwahati' },
    'aca vdca': { id: 1896, name: 'ACA-VDCA Stadium, Visakhapatnam' },
    'aca-vdca': { id: 1896, name: 'ACA-VDCA Stadium, Visakhapatnam' },
    'aca–vdca': { id: 1896, name: 'ACA-VDCA Stadium, Visakhapatnam' },
    'visakhapatnam': { id: 1896, name: 'ACA-VDCA Stadium, Visakhapatnam' },
    'maharaja yadavindra': { id: 3585, name: 'Maharaja Yadavindra Singh International Stadium, Mullanpur' },
    'mullanpur': { id: 3585, name: 'Maharaja Yadavindra Singh International Stadium, Mullanpur' },
    'holkar': { id: 1055, name: 'Holkar Cricket Stadium, Indore' },
    'indore': { id: 1055, name: 'Holkar Cricket Stadium, Indore' },
    'mca stadium': { id: 2677, name: 'MCA International Stadium, Pune' },
    'gahunje': { id: 2677, name: 'MCA International Stadium, Pune' },
    'pune': { id: 2677, name: 'MCA International Stadium, Pune' },
    'jsca': { id: 2575, name: 'JSCA International Stadium Complex, Ranchi' },
    'ranchi': { id: 2575, name: 'JSCA International Stadium Complex, Ranchi' },
    'greenfield': { id: 3400, name: 'Greenfield International Stadium, Thiruvananthapuram' },
    'the sports hub': { id: 3400, name: 'Greenfield International Stadium, Thiruvananthapuram' },
    'thiruvananthapuram': { id: 3400, name: 'Greenfield International Stadium, Thiruvananthapuram' },
    'trivandrum': { id: 3400, name: 'Greenfield International Stadium, Thiruvananthapuram' },
    // ── Australia ─────────────────────────────────────────────────────────────
    'melbourne cricket ground': { id: 61, name: 'Melbourne Cricket Ground' },
    'mcg': { id: 61, name: 'Melbourne Cricket Ground' },
    'melbourne': { id: 61, name: 'Melbourne Cricket Ground' },
    'sydney cricket ground': { id: 132, name: 'Sydney Cricket Ground' },
    'scg': { id: 132, name: 'Sydney Cricket Ground' },
    'sydney': { id: 132, name: 'Sydney Cricket Ground' },
    'gabba': { id: 209, name: 'The Gabba, Brisbane' },
    'brisbane': { id: 209, name: 'The Gabba, Brisbane' },
    'adelaide oval': { id: 131, name: 'Adelaide Oval' },
    'adelaide': { id: 131, name: 'Adelaide Oval' },
    'optus stadium': { id: 3404, name: 'Optus Stadium, Perth' },
    'perth stadium': { id: 3404, name: 'Optus Stadium, Perth' },
    'waca': { id: 213, name: 'WACA Ground, Perth' },
    'manuka oval': { id: 757, name: 'Manuka Oval, Canberra' },
    'canberra': { id: 757, name: 'Manuka Oval, Canberra' },
    'blundstone arena': { id: 905, name: 'Blundstone Arena, Hobart' },
    'bellerive oval': { id: 905, name: 'Blundstone Arena, Hobart' },
    'hobart': { id: 905, name: 'Blundstone Arena, Hobart' },
    'stadium australia': { id: 132, name: 'Stadium Australia, Sydney' },
    // ── England ───────────────────────────────────────────────────────────────
    "lord's": { id: 10, name: "Lord's Cricket Ground, London" },
    'lords': { id: 10, name: "Lord's Cricket Ground, London" },
    'the oval': { id: 45, name: 'The Oval, London' },
    'kia oval': { id: 45, name: 'The Oval, London' },
    'old trafford': { id: 75, name: 'Old Trafford, Manchester' },
    'manchester': { id: 75, name: 'Old Trafford, Manchester' },
    'edgbaston': { id: 164, name: 'Edgbaston, Birmingham' },
    'birmingham': { id: 164, name: 'Edgbaston, Birmingham' },
    'headingley': { id: 179, name: 'Headingley, Leeds' },
    'leeds': { id: 179, name: 'Headingley, Leeds' },
    'trent bridge': { id: 34, name: 'Trent Bridge, Nottingham' },
    'nottingham': { id: 34, name: 'Trent Bridge, Nottingham' },
    "riverside ground": { id: 1039, name: 'Riverside Ground, Chester-le-Street' },
    "chester-le-street": { id: 1039, name: 'Riverside Ground, Chester-le-Street' },
    'rose bowl': { id: 1184, name: 'The Rose Bowl, Southampton' },
    'southampton': { id: 1184, name: 'The Rose Bowl, Southampton' },
    "sophia gardens": { id: 644, name: 'Sophia Gardens, Cardiff' },
    'cardiff': { id: 644, name: 'Sophia Gardens, Cardiff' },
    // ── Pakistan ──────────────────────────────────────────────────────────────
    'national stadium': { id: 487, name: 'National Stadium, Karachi' },
    'karachi': { id: 487, name: 'National Stadium, Karachi' },
    'gaddafi': { id: 545, name: 'Gaddafi Stadium, Lahore' },
    'lahore': { id: 545, name: 'Gaddafi Stadium, Lahore' },
    'rawalpindi': { id: 1001, name: 'Rawalpindi Cricket Stadium' },
    'multan cricket': { id: 1597, name: 'Multan Cricket Stadium' },
    'multan': { id: 1597, name: 'Multan Cricket Stadium' },
    'iqbal stadium': { id: 639, name: 'Iqbal Stadium, Faisalabad' },
    'faisalabad': { id: 639, name: 'Iqbal Stadium, Faisalabad' },
    'pindi club': { id: 1001, name: 'Rawalpindi Cricket Stadium' },
    // ── South Africa ─────────────────────────────────────────────────────────
    'newlands': { id: 174, name: 'Newlands Cricket Ground, Cape Town' },
    'cape town': { id: 174, name: 'Newlands Cricket Ground, Cape Town' },
    'wanderers': { id: 508, name: 'The Wanderers Stadium, Johannesburg' },
    'johannesburg': { id: 508, name: 'The Wanderers Stadium, Johannesburg' },
    'kingsmead': { id: 302, name: 'Kingsmead, Durban' },
    'durban': { id: 302, name: 'Kingsmead, Durban' },
    'supersport park': { id: 902, name: 'SuperSport Park, Centurion' },
    'centurion': { id: 902, name: 'SuperSport Park, Centurion' },
    "st george's park": { id: 173, name: "St George's Park, Gqeberha" },
    'port elizabeth': { id: 173, name: "St George's Park, Gqeberha" },
    'gqeberha': { id: 173, name: "St George's Park, Gqeberha" },
    'diamond oval': { id: 703, name: 'Diamond Oval, Kimberley' },
    'kimberley': { id: 703, name: 'Diamond Oval, Kimberley' },
    // ── Sri Lanka ─────────────────────────────────────────────────────────────
    'r premadasa': { id: 1004, name: 'R Premadasa Stadium, Colombo' },
    'premadasa': { id: 1004, name: 'R Premadasa Stadium, Colombo' },
    'sinhalese': { id: 679, name: 'Sinhalese Sports Club Ground, Colombo' },
    'colombo ssc': { id: 679, name: 'Sinhalese Sports Club Ground, Colombo' },
    'galle': { id: 847, name: 'Galle International Stadium' },
    'pallekele': { id: 2503, name: 'Pallekele International Cricket Stadium' },
    'kandy': { id: 2503, name: 'Pallekele International Cricket Stadium' },
    'asgiriya': { id: 726, name: 'Asgiriya Stadium, Kandy' },
    'p sara oval': { id: 416, name: 'P Sara Oval, Colombo' },
    'p. sara': { id: 416, name: 'P Sara Oval, Colombo' },
    'dambulla': { id: 1434, name: 'Rangiri Dambulla International Stadium' },
    // ── Bangladesh ───────────────────────────────────────────────────────────
    'shere bangla': { id: 2025, name: 'Shere Bangla National Stadium, Dhaka' },
    'mirpur': { id: 2025, name: 'Shere Bangla National Stadium, Dhaka' },
    'dhaka': { id: 2025, name: 'Shere Bangla National Stadium, Dhaka' },
    'zahur ahmed': { id: 1931, name: 'Zahur Ahmed Chowdhury Stadium, Chittagong' },
    'chittagong': { id: 1931, name: 'Zahur Ahmed Chowdhury Stadium, Chittagong' },
    'zac': { id: 1931, name: 'Zahur Ahmed Chowdhury Stadium, Chittagong' },
    'sylhet': { id: 1564, name: 'Sylhet International Cricket Stadium' },
    // ── West Indies ──────────────────────────────────────────────────────────
    'kensington oval': { id: 199, name: 'Kensington Oval, Bridgetown' },
    'bridgetown': { id: 199, name: 'Kensington Oval, Bridgetown' },
    'barbados': { id: 199, name: 'Kensington Oval, Bridgetown' },
    "queen's park oval": { id: 208, name: "Queen's Park Oval, Port of Spain" },
    'port of spain': { id: 208, name: "Queen's Park Oval, Port of Spain" },
    'trinidad': { id: 208, name: "Queen's Park Oval, Port of Spain" },
    'sabina park': { id: 200, name: 'Sabina Park, Kingston' },
    'kingston': { id: 200, name: 'Sabina Park, Kingston' },
    'jamaica': { id: 200, name: 'Sabina Park, Kingston' },
    'sir vivian richards': { id: 1985, name: 'Sir Vivian Richards Stadium, Antigua' },
    'antigua': { id: 1985, name: 'Sir Vivian Richards Stadium, Antigua' },
    'providence': { id: 1986, name: 'Providence Stadium, Guyana' },
    'guyana': { id: 1986, name: 'Providence Stadium, Guyana' },
    'grenada': { id: 1131, name: 'National Cricket Stadium, Grenada' },
    'windward': { id: 629, name: 'Windsor Park, Dominica' },
    'dominica': { id: 629, name: 'Windsor Park, Dominica' },
    'daren sammy': { id: 1697, name: 'Daren Sammy Cricket Ground, St Lucia' },
    'st lucia': { id: 1697, name: 'Daren Sammy Cricket Ground, St Lucia' },
    'brian lara': { id: 2041, name: 'Brian Lara Cricket Academy, Tarouba' },
    // ── UAE ───────────────────────────────────────────────────────────────────
    'dubai international': { id: 2439, name: 'Dubai International Cricket Stadium' },
    'dubai': { id: 2439, name: 'Dubai International Cricket Stadium' },
    'sheikh zayed': { id: 1965, name: 'Sheikh Zayed Stadium, Abu Dhabi' },
    'abu dhabi': { id: 1965, name: 'Sheikh Zayed Stadium, Abu Dhabi' },
    'sharjah': { id: 848, name: 'Sharjah Cricket Stadium' },
    // ── Zimbabwe ─────────────────────────────────────────────────────────────
    'harare sports club': { id: 260, name: 'Harare Sports Club' },
    'harare': { id: 260, name: 'Harare Sports Club' },
    'queens sports club': { id: 261, name: "Queens Sports Club, Bulawayo" },
    'bulawayo': { id: 261, name: "Queens Sports Club, Bulawayo" },
    // ── New Zealand ──────────────────────────────────────────────────────────
    'eden park': { id: 283, name: 'Eden Park, Auckland' },
    'auckland': { id: 283, name: 'Eden Park, Auckland' },
    'basin reserve': { id: 116, name: 'Basin Reserve, Wellington' },
    'wellington': { id: 116, name: 'Basin Reserve, Wellington' },
    'hagley oval': { id: 93, name: 'Hagley Oval, Christchurch' },
    'christchurch': { id: 93, name: 'Hagley Oval, Christchurch' },
    'seddon park': { id: 504, name: 'Seddon Park, Hamilton' },
    'hamilton': { id: 504, name: 'Seddon Park, Hamilton' },
    'mclean park': { id: 453, name: 'McLean Park, Napier' },
    'napier': { id: 453, name: 'McLean Park, Napier' },
    'university oval': { id: 769, name: 'University Oval, Dunedin' },
    'dunedin': { id: 769, name: 'University Oval, Dunedin' },
    // ── Ireland ──────────────────────────────────────────────────────────────
    'village': { id: 974, name: 'The Village, Dublin' },
    'dublin': { id: 974, name: 'The Village, Dublin' },
    // ── Scotland ─────────────────────────────────────────────────────────────
    'grange': { id: 237, name: 'The Grange Cricket Club, Edinburgh' },
    'edinburgh': { id: 237, name: 'The Grange Cricket Club, Edinburgh' },
};

/**
 * Resolve a ground name to its ESPN ID and canonical name.
 * Returns null if no match found.
 */
export function resolveESPNGround(groundName) {
    if (!groundName) return null;
    const lower = groundName.toLowerCase().trim();

    // Exact key match first
    if (ESPN_GROUND_MAP[lower]) return { ...ESPN_GROUND_MAP[lower] };

    // Partial match — longest key that appears in the ground name wins
    let best = null, bestLen = 0;
    for (const [key, val] of Object.entries(ESPN_GROUND_MAP)) {
        if (lower.includes(key) && key.length > bestLen) {
            best = val; bestLen = key.length;
        }
    }
    return best ? { ...best } : null;
}

// ── Format → class ID ────────────────────────────────────────────────────────
const FORMAT_CLASS = { Test: '1', ODI: '2', T20: '3', 'T20I': '3', All: '11' };

// ── Dynamic ground ID resolution cache ───────────────────────────────────────
const _dynamicGroundCache = {};

/**
 * Dynamically resolve a ground ID by name using ESPN Statsguru.
 * Fetches the match list page which links to individual ground pages,
 * then extracts the ID from those links.
 * Results are cached to avoid repeated fetches.
 */
async function resolveESPNGroundDynamic(groundName) {
    if (!groundName) return null;
    const key = groundName.toLowerCase().trim();
    if (_dynamicGroundCache[key]) return _dynamicGroundCache[key];

    // Statsguru match list filtered by ground name text
    // It won't filter perfectly, but the top results will have the correct ground ID in their links
    // We search using the team match view filtered by orderby=start to get all matches
    const encoded = encodeURIComponent(groundName.trim());

    // Use the batting records page — Statsguru will show results for grounds
    // that fuzzy-match the ground name in the ordering. The key insight: 
    // The batting leaders URL with groundname= parameter works on the match-list view 
    const searchUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;groundname=${encoded};template=results;type=batting`;

    try {
        const res = await fetchESPN(searchUrl);
        if (res.status !== 200) return null;

        const $ = cheerio.load(res.html);

        // Extract all ground IDs mentioned in links on this page
        const groundIds = new Set();
        $('a[href*="ground="]').each((_, a) => {
            const href = $(a).attr('href') || '';
            const m = href.match(/ground=(\d+)/);
            if (m) groundIds.add(m[1]);
        });

        // If exactly one unique ground ID was found in results, that's our match
        const ids = [...groundIds];
        if (ids.length === 1) {
            const result = { id: parseInt(ids[0]), name: groundName };
            _dynamicGroundCache[key] = result;
            console.log(`[ESPN] Dynamic resolved: "${groundName}" → ID ${ids[0]}`);
            return result;
        }

        // If multiple IDs found, try to find the one whose ground page name best matches
        if (ids.length > 1) {
            for (const id of ids.slice(0, 5)) {
                const groundRes = await fetchESPN(`https://stats.espncricinfo.com/ci/engine/ground/${id}.html`);
                if (groundRes.status === 200) {
                    const g$ = cheerio.load(groundRes.html);
                    const title = g$('h1').first().text().trim();
                    if (title && (title.toLowerCase().includes(key) || key.includes(title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6)))) {
                        const result = { id: parseInt(id), name: title };
                        _dynamicGroundCache[key] = result;
                        console.log(`[ESPN] Dynamic resolved (multi): "${groundName}" → ID ${id} (${title})`);
                        return result;
                    }
                }
            }
            // Fall back to first ID
            const result = { id: parseInt(ids[0]), name: groundName };
            _dynamicGroundCache[key] = result;
            return result;
        }

        return null;
    } catch (e) {
        console.warn(`[ESPN] Dynamic resolution failed for "${groundName}":`, e.message);
        return null;
    }
}

// ── Core HTTP fetch (preserves raw semicolons) ────────────────────────────────
function fetchESPN(rawUrl) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(rawUrl);
        const opts = {
            hostname: urlObj.hostname,
            // Preserve path+search exactly — do NOT let URL class re-encode semicolons
            path: rawUrl.replace(`https://${urlObj.hostname}`, ''),
            headers: HEADERS,
            timeout: 15000,
        };
        let data = '';
        const req = https.get(opts, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirectUrl = res.headers.location;
                if (!redirectUrl.startsWith('http')) {
                    redirectUrl = new URL(redirectUrl, `https://${urlObj.hostname}`).href;
                }
                return fetchESPN(redirectUrl).then(resolve).catch(reject);
            }
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, html: data }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('ESPN request timeout')); });
    });
}

const BASE = 'https://stats.espncricinfo.com/ci/engine/stats/index.html';

// ── Individual parsers ────────────────────────────────────────────────────────

/**
 * Parse batting leaders table.
 * Columns: [0]Player [1]Span [2]Mat [3]Inn [4]NO [5]Runs [6]HS [7]Ave [8]100 [9]50 [10]0
 */
function parseBattingLeaders(html) {
    try {
        const $ = cheerio.load(html);
        const table = $('table.engineTable').eq(2);
        const rows = [];
        
        const headers = table.find('tr.headlinks').first().find('th').map((_, th) => $(th).text().trim()).get();
        const idx100 = headers.indexOf('100') !== -1 ? headers.indexOf('100') : 8;
        const idx50 = headers.indexOf('50') !== -1 ? headers.indexOf('50') : 9;

        table.find('tr.data1, tr.data2').each((i, row) => {
            const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
            if (!c[0] || c[0].includes('No records')) return;
            // Strip country code "(IND)" from player name
            const name = c[0].replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
            rows.push({
                rank: String(i + 1),
                name,
                span: c[1] || '',
                matches: parseInt(c[2]) || 0,
                innings: parseInt(c[3]) || 0,
                notOut: parseInt(c[4]) || 0,
                runs: parseInt(c[5]) || 0,
                hs: c[6] || '-',
                avg: parseFloat(c[7]) || 0,
                hundreds: parseInt(c[idx100]) || 0,
                fifties: parseInt(c[idx50]) || 0,
            });
        });
        return rows.slice(0, 15);
    } catch (e) {
        console.warn('[ESPN] parseBattingLeaders error:', e.message);
        return [];
    }
}

/**
 * Parse bowling leaders table.
 * Columns: [0]Player [1]Span [2]Mat [3]Inn [4]Overs [5]Mdns [6]Runs [7]Wkts [8]BBI [9]BBM [10]Ave [11]Econ [12]SR [13]5W [14]10W
 */
function parseBowlingLeaders(html) {
    try {
        const $ = cheerio.load(html);
        const table = $('table.engineTable').eq(2);
        const rows = [];
        
        const headers = table.find('tr.headlinks').first().find('th').map((_, th) => $(th).text().trim()).get();
        const idxWkts = headers.indexOf('Wkts') !== -1 ? headers.indexOf('Wkts') : 6;
        const idxBBI = headers.indexOf('BBI') !== -1 ? headers.indexOf('BBI') : 7;
        const idxBBM = headers.indexOf('BBM') !== -1 ? headers.indexOf('BBM') : 8;
        const idxAve = headers.indexOf('Ave') !== -1 ? headers.indexOf('Ave') : 9;
        const idxEcon = headers.indexOf('Econ') !== -1 ? headers.indexOf('Econ') : 10;
        const idxSR = headers.indexOf('SR') !== -1 ? headers.indexOf('SR') : 11;
        const idx5 = headers.indexOf('5') !== -1 ? headers.indexOf('5') : (headers.indexOf('5W') !== -1 ? headers.indexOf('5W') : 12);
        const idx10 = headers.indexOf('10') !== -1 ? headers.indexOf('10') : (headers.indexOf('10W') !== -1 ? headers.indexOf('10W') : 13);

        table.find('tr.data1, tr.data2').each((i, row) => {
            const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
            if (!c[0] || c[0].includes('No records')) return;
            const name = c[0].replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
            rows.push({
                rank: String(i + 1),
                name,
                span: c[1] || '',
                matches: parseInt(c[2]) || 0,
                innings: parseInt(c[3]) || 0,
                balls: parseInt(c[4]) || 0,
                runs: parseInt(c[5]) || 0,
                wickets: parseInt(c[idxWkts]) || 0,
                bbi: c[idxBBI] || '-',
                bbm: c[idxBBM] || '-',
                avg: parseFloat(c[idxAve]) || 0,
                econ: parseFloat(c[idxEcon]) || 0,
                sr: parseFloat(c[idxSR]) || 0,
                fiveWkt: parseInt(c[idx5]) || 0,
                tenWkt: parseInt(c[idx10]) || 0,
            });
        });
        return rows.slice(0, 15);
    } catch (e) {
        console.warn('[ESPN] parseBowlingLeaders error:', e.message);
        return [];
    }
}

/**
 * Parse match list table from view=results.
 * Columns: [0]Team [1]Result [2]Margin [3]Toss [4]Bat [5]'' [6]Opposition [7]Ground [8]Start Date [9]''
 */
function parseMatchList(html) {
    try {
        const $ = cheerio.load(html);
        const table = $('table.engineTable').eq(2);

        const headers = table.find('tr.headlinks').first().find('th').map((_, th) => $(th).text().trim()).get();
        const idxTeam = headers.indexOf('Team') !== -1 ? headers.indexOf('Team') : 0;
        const idxResult = headers.indexOf('Result') !== -1 ? headers.indexOf('Result') : 1;
        const idxMargin = headers.indexOf('Margin') !== -1 ? headers.indexOf('Margin') : 2;
        const idxOpp = headers.indexOf('Opposition') !== -1 ? headers.indexOf('Opposition') : 6;
        const idxDate = headers.indexOf('Start Date') !== -1 ? headers.indexOf('Start Date') : 8;

        const allRows = [];
        table.find('tr.data1, tr.data2').each((_, row) => {
            const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
            if (c[0] && !c[0].includes('No records')) allRows.push(c);
        });

        // Deduplicate by date+ground — each match appears twice (one row per team)
        const matchMap = new Map();
        for (const c of allRows) {
            const date = c[idxDate] || '';
            const opp = c[idxOpp] || '';
            const team = c[idxTeam] || '';
            const result = c[idxResult] || '';
            const margin = c[idxMargin] || '';
            
            // key using date helps deduplicate the two rows for the same match
            const key = `${date}|${opp.replace('v ', '').trim()}`;
            if (!matchMap.has(key) && !matchMap.has(`${date}|${team}`)) {
                matchMap.set(key, { date, team1: team, opp, result, margin });
            } else {
                const existingKey = matchMap.has(key) ? key : `${date}|${team}`;
                const m = matchMap.get(existingKey);
                m.team2 = team;
            }
        }

        return [...matchMap.values()].map(m => {
            let resStr = m.result;
            if (m.margin && m.margin !== '-') {
                resStr += ` by ${m.margin}`;
            }
            return {
                date: m.date,
                teams: m.team2
                    ? `${m.team1} vs ${m.team2}`
                    : `${m.team1} ${m.opp}`,
                result: resStr,
                matchUrl: null,
            };
        }).slice(0, 20);
    } catch (e) {
        console.warn('[ESPN] parseMatchList error:', e.message);
        return [];
    }
}

/**
 * Parse innings averages — compute avg 1st/2nd innings scores.
 * Returns { avgFirst, avgSecond, byYear, totalMatches,
 *           batFirstWins, batSecondWins, draws,
 *           avgRunRate, highestTotal, lowestTotal }
 */
function parseInningsAverages(htmls) {
    try {
        if (!Array.isArray(htmls)) htmls = [htmls];
        
        let totalRuns1st = 0, count1st = 0;
        let totalRuns2nd = 0, count2nd = 0;
        let batFirstWins = 0, batSecondWins = 0, draws = 0;
        const byYear = {};
        const byYear2nd = {};

        let totalRpo = 0, rpoCount = 0;
        let highest = { scoreNum: -1, score: 'N/A', team: 'N/A', year: '' };
        let lowest = { scoreNum: 9999, score: 'N/A', team: 'N/A', year: '' };

        for (const html of htmls) {
            if (!html) continue;
            const $ = cheerio.load(html);
            const table = $('table.engineTable').eq(2);

            // view=innings rows: Team | Score | Overs | RPO | ActualScore | InningsNum | Result | '' | Opposition | Ground | Date
            table.find('tr.data1, tr.data2').each((_, row) => {
            const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
            if (!c[0] || c[0].includes('No records')) return;

            const team = c[0];
            const scoreStrRaw = c[1] || '';
            const score = parseInt(scoreStrRaw) || 0;

            let innings = 0;
            let result = '';
            let dateStr = '';

            // Test format has extra column 'ActualScore' at c[4], shifting everything right
            if (c.length >= 11 && !isNaN(parseInt(c[5]))) {
                innings = parseInt(c[5]);
                result = (c[6] || '').toLowerCase();
                dateStr = c[10] || '';
            } else {
                innings = parseInt(c[4]) || 0;
                result = (c[5] || '').toLowerCase();
                dateStr = c[9] || '';
            }

            const year = dateStr.match(/\d{4}/)?.[0] || '';

            // RPO
            const rpo = parseFloat(c[3]);
            if (!isNaN(rpo) && rpo > 0) {
                totalRpo += rpo;
                rpoCount++;
            }

            // Highest & Lowest Totals (ignore DNB/absent)
            if (score > 0 && !scoreStrRaw.includes('DNB')) {
                if (score > highest.scoreNum) {
                    highest = { scoreNum: score, score: scoreStrRaw, team, year };
                }
                // For lowest total, typically we only count completed innings (no declaration, no loss of few wkts).
                // If the score string has no '/' (meaning 10 wkts fell) and no 'd' (declaration), it's a completed innings.
                // Or if it's T20/ODI and overs expired (but we can't easily tell here, so we just use no '/' heuristic)
                if (score > 10 && !scoreStrRaw.includes('/') && !scoreStrRaw.includes('d') && score < lowest.scoreNum) {
                    lowest = { scoreNum: score, score: scoreStrRaw, team, year };
                }
            }

            if (innings === 1) {
                totalRuns1st += score; count1st++;
                if (result === 'won') batFirstWins++;
                else if (result === 'lost') batSecondWins++;
                else if (result === 'draw' || result === 'drawn') draws++;
                if (year) byYear[year] = (byYear[year] || { sum: 0, cnt: 0 });
                if (year) { byYear[year].sum += score; byYear[year].cnt++; }
            } else if (innings === 2) {
                totalRuns2nd += score; count2nd++;
                if (year) byYear2nd[year] = (byYear2nd[year] || { sum: 0, cnt: 0 });
                if (year) { byYear2nd[year].sum += score; byYear2nd[year].cnt++; }
            }
        });
        }

        const avgFirst = count1st > 0 ? Math.round(totalRuns1st / count1st) : 0;
        const avgSecond = count2nd > 0 ? Math.round(totalRuns2nd / count2nd) : 0;
        const avgRunRate = rpoCount > 0 ? parseFloat((totalRpo / rpoCount).toFixed(2)) : 0;
        const byYearArr = Object.entries(byYear)
            .map(([year, { sum, cnt }]) => ({ year, score: Math.round(sum / cnt) }))
            .sort((a, b) => a.year.localeCompare(b.year));

        const byYear2ndArr = Object.entries(byYear2nd)
            .map(([year, { sum, cnt }]) => ({ year, score: Math.round(sum / cnt) }))
            .sort((a, b) => a.year.localeCompare(b.year));

        return {
            avgFirst, avgSecond,
            totalMatches: count1st,
            batFirstWins, batSecondWins, draws,
            byYear: byYearArr,
            byYear2nd: byYear2ndArr,
            avgRunRate,
            highestTotal: highest.scoreNum !== -1 ? { score: highest.score, team: highest.team, year: highest.year } : { score: 'N/A', team: 'N/A', year: '' },
            lowestTotal: lowest.scoreNum !== 9999 ? { score: lowest.score, team: lowest.team, year: lowest.year } : { score: 'N/A', team: 'N/A', year: '' },
        };
    } catch (e) {
        console.warn('[ESPN] parseInningsAverages error:', e.message);
        return {
            avgFirst: 0, avgSecond: 0, totalMatches: 0, batFirstWins: 0, batSecondWins: 0, draws: 0, byYear: [], byYear2nd: [],
            avgRunRate: 0, highestTotal: { score: 'N/A', team: 'N/A', year: '' }, lowestTotal: { score: 'N/A', team: 'N/A', year: '' }
        };
    }
}

function parseHighLow(highestHtml, lowestHtml) {
    let highest = { score: 'N/A', team: 'N/A', year: '' };
    let lowest = { score: 'N/A', team: 'N/A', year: '' };

    try {
        if (highestHtml) {
            const $ = cheerio.load(highestHtml);
            const table = $('table.engineTable').eq(2);
            table.find('tr.data1').slice(0, 5).each((_, row) => {
                const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
                if (c.length > 5 && c[1] && !c[1].includes('DNB')) {
                    const dateStr = c.length >= 11 && !isNaN(parseInt(c[5])) ? c[10] : c[9];
                    const year = dateStr.match(/\d{4}/)?.[0] || '';
                    let opposition = '';
                    const oppCol = c.find(val => val.startsWith('v '));
                    if (oppCol) opposition = oppCol.substring(2).trim();
                    highest = { score: c[1], team: c[0], year, opposition };
                    return false; // break
                }
            });
        }
        if (lowestHtml) {
            const $ = cheerio.load(lowestHtml);
            const table = $('table.engineTable').eq(2);
            table.find('tr.data1, tr.data2').each((_, row) => {
                const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
                if (c.length > 5 && c[1]) {
                    const score = parseInt(c[1]);
                    // must be completed innings (no / and no d)
                    if (score > 10 && !c[1].includes('/') && !c[1].includes('d')) {
                        const dateStr = c.length >= 11 && !isNaN(parseInt(c[5])) ? c[10] : c[9];
                        const year = dateStr.match(/\d{4}/)?.[0] || '';
                        let opposition = '';
                        const oppCol = c.find(val => val.startsWith('v '));
                        if (oppCol) opposition = oppCol.substring(2).trim();
                        lowest = { score: c[1], team: c[0], year, opposition };
                        return false; // break
                    }
                }
            });
        }
    } catch (e) {
        console.warn('[ESPN] parseHighLow error:', e.message);
    }
    return { highestTotal: highest, lowestTotal: lowest };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Scrape ESPN Statsguru for full venue analysis data.
 *
 * @param {number|string} groundId  - ESPN ground ID (e.g. 292 for Eden Gardens)
 * @param {string} format           - 'Test' | 'ODI' | 'T20' | 'T20I'
 * @param {string} [groundName]     - Human-readable name for logging
 * @returns {object|null}
 */
export async function scrapeESPNVenue(groundId, format = 'Test', groundName = '') {
    if (!groundId) return null;

    const classId = FORMAT_CLASS[format] || '1';
    const cacheKey = `espn_${groundId}_${classId}`;
    const cached = _getCached(cacheKey);
    if (cached) {
        console.log(`[ESPN] Cache hit: groundId=${groundId} (${format})`);
        return cached;
    }

    const gid = String(groundId);
    console.log(`[ESPN] Scraping groundId=${gid} (${groundName || 'unknown'}, ${format})`);

    const battingUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=batting`;
    const bowlingUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=bowling`;
    const matchUrl = `${BASE}?class=${classId};filter=advanced;ground=${gid};orderby=start;orderbyad=reverse;template=results;type=team;view=results`;
    const innings1Url = `${BASE}?class=${classId};filter=advanced;ground=${gid};groupby=innings;orderby=start;orderbyad=reverse;template=results;type=team;view=innings;innings_number=1`;
    const innings2Url = `${BASE}?class=${classId};filter=advanced;ground=${gid};groupby=innings;orderby=start;orderbyad=reverse;template=results;type=team;view=innings;innings_number=2`;
    const highestUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=team;view=innings;orderby=team_score`;
    const lowestUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=team;view=innings;orderby=team_score;orderbyad=reverse`;

    // Aggregate URLs for true stats
    const aggUrl = `${BASE}?class=${classId};ground=${gid};template=results;type=aggregate`;
    const agg1Url = `${aggUrl};innings_number=1`;
    const agg2Url = `${aggUrl};innings_number=2`;
    const aggWin1Url = `${agg1Url};result=1`;
    const aggWin2Url = `${agg2Url};result=1`;

    try {
        const [batRes, bowlRes, matchRes, innings1Res, innings2Res, highRes, lowRes, aggRes, agg1Res, agg2Res, agg1WinRes, agg2WinRes] = await Promise.all([
            fetchESPN(battingUrl).catch(e => { console.warn('[ESPN] batting fetch error:', e.message); return null; }),
            fetchESPN(bowlingUrl).catch(e => { console.warn('[ESPN] bowling fetch error:', e.message); return null; }),
            fetchESPN(matchUrl).catch(e => { console.warn('[ESPN] match fetch error:', e.message); return null; }),
            fetchESPN(innings1Url).catch(e => { console.warn('[ESPN] innings1 fetch error:', e.message); return null; }),
            fetchESPN(innings2Url).catch(e => { console.warn('[ESPN] innings2 fetch error:', e.message); return null; }),
            fetchESPN(highestUrl).catch(() => null),
            fetchESPN(lowestUrl).catch(() => null),
            fetchESPN(aggUrl).catch(() => null),
            fetchESPN(agg1Url).catch(() => null),
            fetchESPN(agg2Url).catch(() => null),
            fetchESPN(aggWin1Url).catch(() => null),
            fetchESPN(aggWin2Url).catch(() => null),
        ]);

        const battingLeaders = batRes?.status === 200 ? parseBattingLeaders(batRes.html) : [];
        const bowlingLeaders = bowlRes?.status === 200 ? parseBowlingLeaders(bowlRes.html) : [];
        const recentMatches = matchRes?.status === 200 ? parseMatchList(matchRes.html) : [];
        const inningsAvg = parseInningsAverages([
            innings1Res?.status === 200 ? innings1Res.html : null,
            innings2Res?.status === 200 ? innings2Res.html : null
        ]);
        const highLow = parseHighLow(
            highRes?.status === 200 ? highRes.html : null,
            lowRes?.status === 200 ? lowRes.html : null
        );

        const extractAgg = (html) => {
            if (!html) return [];
            const $ = cheerio.load(html);
            return $('table.engineTable').eq(2).find('tr.data1').first().find('td').map((_, el) => $(el).text().trim()).get();
        };

        const agg = extractAgg(aggRes?.html);
        const agg1 = extractAgg(agg1Res?.html);
        const agg2 = extractAgg(agg2Res?.html);
        const agg1Win = extractAgg(agg1WinRes?.html);
        const agg2Win = extractAgg(agg2WinRes?.html);

        // Overall stats (agg): Span(0), Mat(1), Won(2), Tied(3), Draw(4), Runs(5), Wkts(6), Balls(7), Ave(8), RPO(9)
        const total = parseInt(agg[1]) || inningsAvg.totalMatches;
        const draws = (parseInt(agg[4]) || 0) + (parseInt(agg[3]) || 0); // Draws + Ties
        const overallRpo = parseFloat(agg[9]) || inningsAvg.avgRunRate || 0;

        // Innings stats
        const inn1Matches = parseInt(agg1[1]) || 1;
        const inn1Runs = parseInt(agg1[5]) || 0;
        const avgFirst = inn1Runs > 0 ? Math.round(inn1Runs / inn1Matches) : inningsAvg.avgFirst;

        const inn2Matches = parseInt(agg2[1]) || 1;
        const inn2Runs = parseInt(agg2[5]) || 0;
        const avgSecond = inn2Runs > 0 ? Math.round(inn2Runs / inn2Matches) : inningsAvg.avgSecond;

        // Wins
        const batFirstWins = parseInt(agg1Win[1]) || inningsAvg.batFirstWins;
        const batSecondWins = parseInt(agg2Win[1]) || inningsAvg.batSecondWins;

        const batFirstWinPct = total > 0 ? Math.round((batFirstWins / total) * 100) : 0;
        const batSecondWinPct = total > 0 ? Math.round((batSecondWins / total) * 100) : 0;
        const drawPct = total > 0 ? Math.round((draws / total) * 100) : 0;

        const result = {
            source: 'espn_statsguru',
            espnGroundId: groundId,
            venueName: groundName,
            format,
            // Core stats
            matchesHosted: total,
            avgFirstInningsScore: avgFirst,
            avgSecondInningsScore: avgSecond,
            avgFirstInningsByYear: inningsAvg.byYear,
            avgSecondInningsByYear: inningsAvg.byYear2nd,
            avgRunRate: overallRpo,
            highestTotal: highLow.highestTotal.score !== 'N/A' ? highLow.highestTotal : inningsAvg.highestTotal,
            lowestTotal: highLow.lowestTotal.score !== 'N/A' ? highLow.lowestTotal : inningsAvg.lowestTotal,
            // Win/loss breakdown
            wonBattingFirst: batFirstWins,
            wonBattingSecond: batSecondWins,
            draws: draws,
            batFirstWinPct,
            batSecondWinPct,
            drawPct,

            // Match outcomes object (for chart compatibility)
            matchOutcomes: total > 0 ? {
                batFirstWins: batFirstWins,
                batSecondWins: batSecondWins,
                draws: draws,
                totalMatches: total,
                batFirstWinPct,
                batSecondWinPct,
                drawPct,
            } : null,
            // Leaders
            battingLeaders,
            bowlingLeaders,
            recentMatches,
            // Extra computed fields
            bowlerTypes: [], // ESPN doesn't have bowler type breakdown
            espnSource: `ESPN Statsguru (${format})`,
        };

        console.log(`[ESPN] ✓ groundId=${gid} (${format}): matches=${total}, avg1st=${inningsAvg.avgFirst}, bat=${battingLeaders.length}, bowl=${bowlingLeaders.length}, recentMatches=${recentMatches.length}`);
        _setCached(cacheKey, result);
        return result;
    } catch (err) {
        console.error(`[ESPN] Failed groundId=${gid} (${format}):`, err.message);
        return null;
    }
}

/**
 * Scrape a venue by name.
 * First tries the static map (fast), then falls back to dynamic ESPN resolution (slower but universal).
 */
export async function scrapeESPNVenueByName(groundName, format = 'Test') {
    // 1. Try static map first (instant)
    let ground = resolveESPNGround(groundName);

    // 2. Fall back to dynamic resolution via ESPN Statsguru (covers any stadium)
    if (!ground) {
        console.log(`[ESPN] Static map miss for "${groundName}", trying dynamic resolution...`);
        ground = await resolveESPNGroundDynamic(groundName);
    }

    if (!ground) {
        console.log(`[ESPN] Could not resolve ground ID for: "${groundName}"`);
        return null;
    }

    return scrapeESPNVenue(ground.id, format, ground.name);
}
