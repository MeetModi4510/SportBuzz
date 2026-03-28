import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cricketService } from './cricketApiService.js';

// Fix for ES module hoisting: explicit .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Config ────────────────────────────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.CRICBUZZ_RAPIDAPI_KEY;
// console.log(`[DEBUG] Loaded Cricbuzz Key: ${RAPIDAPI_KEY ? RAPIDAPI_KEY.slice(0, 10) + '...' + RAPIDAPI_KEY.slice(-4) : 'UNDEFINED'}`);

const RAPIDAPI_HOST = process.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket2.p.rapidapi.com';

const CRICKETDATA_KEY = process.env.CRICKETDATA_KEY || process.env.VITE_CRICKETDATA_API_KEY;

const CB_BASE = `https://${RAPIDAPI_HOST}`;
const CD_BASE = 'https://api.cricapi.com/v1';

const cbHeaders = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
};

if (!RAPIDAPI_KEY) {
    // Don't crash immediately, but warn loudly. 
    // This allows the server to start even if this specific feature might fail later.
    console.error('[CRICBUZZ] RapidAPI key is MISSING in environment variables!');
} else {
    // console.log('[CRICBUZZ] RapidAPI key loaded');
}

// ─── Cache ─────────────────────────────────────────────────────────────────────
const cache = new NodeCache({ stdTTL: 600 }); // Default 10 minutes

// ─── Team Name Alias Dictionary ────────────────────────────────────────────────
// Keys: lowercased CricketData.org short codes / team names
// Values: array of equivalent names (Cricbuzz full names, alternate forms)
const TEAM_ALIASES = {
    // ── ICC Full Members ──────────────────────────────────────────────────────
    'ind': ['india'],
    'aus': ['australia'],
    'eng': ['england'],
    'sa': ['south africa'],
    'nz': ['new zealand'],
    'pak': ['pakistan'],
    'sl': ['sri lanka'],
    'ban': ['bangladesh'],
    'wi': ['west indies'],
    'afg': ['afghanistan'],
    'zim': ['zimbabwe'],
    'ire': ['ireland'],

    // ── ICC Full Members — Women ──────────────────────────────────────────────
    'indw': ['india women'],
    'ausw': ['australia women'],
    'engw': ['england women'],
    'saw': ['south africa women'],
    'nzw': ['new zealand women'],
    'pakw': ['pakistan women'],
    'slw': ['sri lanka women'],
    'banw': ['bangladesh women'],
    'wiw': ['west indies women'],
    'afgw': ['afghanistan women'],
    'zimw': ['zimbabwe women'],
    'irew': ['ireland women'],

    // ── ICC Full Members — U19 ────────────────────────────────────────────────
    'indu19': ['india u19', 'india under-19'],
    'ausu19': ['australia u19', 'australia under-19'],
    'engu19': ['england u19', 'england under-19'],
    'sau19': ['south africa u19', 'south africa under-19'],
    'nzu19': ['new zealand u19', 'new zealand under-19'],
    'paku19': ['pakistan u19', 'pakistan under-19'],
    'slu19': ['sri lanka u19', 'sri lanka under-19'],
    'banu19': ['bangladesh u19', 'bangladesh under-19'],
    'wiu19': ['west indies u19', 'west indies under-19'],
    'afgu19': ['afghanistan u19', 'afghanistan under-19'],
    'zimu19': ['zimbabwe u19', 'zimbabwe under-19'],
    'ireu19': ['ireland u19', 'ireland under-19'],
    'namu19': ['namibia u19', 'namibia under-19'],
    'usau19': ['usa u19', 'united states u19'],
    'nepu19': ['nepal u19', 'nepal under-19'],
    'uaeu19': ['uae u19', 'united arab emirates u19'],
    'scou19': ['scotland u19', 'scotland under-19'],
    'canu19': ['canada u19', 'canada under-19'],
    'kenu19': ['kenya u19', 'kenya under-19'],
    'hku19': ['hong kong u19'],
    'omau19': ['oman u19'],
    'pngu19': ['papua new guinea u19'],
    'ugau19': ['uganda u19'],
    'tanu19': ['tanzania u19'],

    // ── ICC Full Members — Women U19 ─────────────────────────────────────────
    'indwu19': ['india women u19'],
    'auswu19': ['australia women u19'],
    'engwu19': ['england women u19'],
    'sawu19': ['south africa women u19'],
    'nzwu19': ['new zealand women u19'],
    'pakwu19': ['pakistan women u19'],
    'slwu19': ['sri lanka women u19'],
    'banwu19': ['bangladesh women u19'],
    'wiwu19': ['west indies women u19'],
    'afgwu19': ['afghanistan women u19'],
    'irewu19': ['ireland women u19'],
    'usaw u19': ['usa women u19'],
    'nepwu19': ['nepal women u19'],

    // ── ICC Associates ────────────────────────────────────────────────────────
    'hk': ['hong kong'],
    'can': ['canada'],
    'ken': ['kenya'],
    'mal': ['malaysia'],
    'jer': ['jersey'],
    'ita': ['italy'],
    'ger': ['germany'],
    'ned': ['netherlands'],
    'sco': ['scotland'],
    'nam': ['namibia'],
    'uae': ['united arab emirates', 'uae'],
    'oma': ['oman'],
    'usa': ['united states of america', 'usa', 'united states'],
    'nep': ['nepal'],
    'png': ['papua new guinea'],
    'ber': ['bermuda'],
    'sin': ['singapore'],
    'uga': ['uganda'],
    'tan': ['tanzania'],
    'rwa': ['rwanda'],
    'qat': ['qatar'],
    'bhr': ['bahrain'],
    'kwt': ['kuwait'],
    'sar': ['saudi arabia'],
    'thai': ['thailand'],
    'thaiw': ['thailand women'],
    'myan': ['myanmar'],
    'den': ['denmark'],
    'nor': ['norway'],
    'swe': ['sweden'],
    'fin': ['finland'],
    'fra': ['france'],
    'esp': ['spain'],
    'por': ['portugal'],
    'bel': ['belgium'],
    'aut': ['austria'],
    'lux': ['luxembourg'],
    'cze': ['czech republic'],
    'rom': ['romania'],
    'hun': ['hungary'],
    'gre': ['greece'],
    'tur': ['turkey'],
    'isr': ['israel'],
    'bot': ['botswana'],
    'gha': ['ghana'],
    'nig': ['nigeria'],
    'cam': ['cameroon'],
    'sle': ['sierra leone'],
    'mwi': ['malawi'],
    'moz': ['mozambique'],
    'zam': ['zambia'],
    'les': ['lesotho'],
    'swz': ['eswatini', 'swaziland'],
    'vanu': ['vanuatu'],
    'fiji': ['fiji'],
    'samoa': ['samoa'],
    'cook': ['cook islands'],
    'japan': ['japan'],
    'kor': ['south korea'],
    'chi': ['chile'],
    'arg': ['argentina'],
    'bra': ['brazil'],
    'per': ['peru'],
    'mex': ['mexico'],
    'pan': ['panama'],
    'crc': ['costa rica'],
    'bah': ['bahamas'],
    'cay': ['cayman islands'],
    'gibr': ['gibraltar'],
    'iom': ['isle of man'],
    'guer': ['guernsey'],
    'mald': ['maldives'],
    'bhut': ['bhutan'],

    // ── ICC Associates — Women ────────────────────────────────────────────────
    'hkw': ['hong kong women'],
    'canw': ['canada women'],
    'malw': ['malaysia women'],
    'uaew': ['uae women'],
    'nepw': ['nepal women'],
    'usaw': ['usa women', 'united states women'],
    'namw': ['namibia women'],
    'scow': ['scotland women'],
    'nedw': ['netherlands women'],
    'ugaw': ['uganda women'],
    'rwaw': ['rwanda women'],

    // ── IPL (Indian Premier League) ───────────────────────────────────────────
    'csk': ['chennai super kings'],
    'mi': ['mumbai indians'],
    'rcb': ['royal challengers bengaluru', 'royal challengers bangalore'],
    'kkr': ['kolkata knight riders'],
    'dc': ['delhi capitals'],
    'srh': ['sunrisers hyderabad'],
    'rr': ['rajasthan royals'],
    'pbks': ['punjab kings'],
    'lsg': ['lucknow super giants'],
    'gt': ['gujarat titans'],

    // ── BBL (Big Bash League) ─────────────────────────────────────────────────
    'sys': ['sydney sixers'],
    'syt': ['sydney thunder'],
    'mrs': ['melbourne renegades'],
    'mls': ['melbourne stars'],
    'bh': ['brisbane heat'],
    'ht': ['hobart hurricanes'],
    'ps': ['perth scorchers'],
    'as': ['adelaide strikers'],

    // ── WBBL (Women's Big Bash League) ────────────────────────────────────────
    'sysw': ['sydney sixers women'],
    'sytw': ['sydney thunder women'],
    'mrsw': ['melbourne renegades women'],
    'mlsw': ['melbourne stars women'],
    'bhw': ['brisbane heat women'],
    'htw': ['hobart hurricanes women'],
    'psw': ['perth scorchers women'],
    'asw': ['adelaide strikers women'],

    // ── PSL (Pakistan Super League) ───────────────────────────────────────────
    'kk': ['karachi kings'],
    'lq': ['lahore qalandars'],
    'iu': ['islamabad united'],
    'pz': ['peshawar zalmi'],
    'ms': ['multan sultans'],
    'qg': ['quetta gladiators'],

    // ── CPL (Caribbean Premier League) ────────────────────────────────────────
    'guy': ['guyana amazon warriors'],
    'tkr': ['trinbago knight riders'],
    'jam': ['jamaica tallawahs'],
    'bar': ['barbados royals'],
    'slk': ['saint lucia kings', 'st lucia kings'],
    'snp': ['st kitts and nevis patriots', 'saint kitts and nevis patriots'],

    // ── The Hundred ───────────────────────────────────────────────────────────
    'ovi': ['oval invincibles'],
    'mnr': ['manchester originals'],
    'bhp': ['birmingham phoenix'],
    'trf': ['trent rockets'],
    'lns': ['london spirit'],
    'nhs': ['northern superchargers'],
    'wef': ['welsh fire'],
    'sbs': ['southern brave'],

    // ── SA20 (South Africa) ───────────────────────────────────────────────────
    'jbg': ['joburg super kings'],
    'dur': ['durban super giants', 'durban sg'],
    'mi-ct': ['mi cape town'],
    'pre': ['pretoria capitals'],
    'paa': ['paarl royals'],
    'sec': ['sec sunrisers eastern cape', 'sunrisers eastern cape'],

    // ── ILT20 (International League T20 — UAE) ────────────────────────────────
    'dsc': ['dubai capitals'],
    'ab': ['abu dhabi knight riders'],
    'guw': ['gulf giants'],
    'shj': ['sharjah warriorz'],
    'dvl': ['desert vipers'],

    // ── BPL (Bangladesh Premier League) ───────────────────────────────────────
    'dhd': ['dhaka dominators'],
    'rr-bpl': ['rangpur riders'],
    'ck': ['comilla victorians'],
    'sk': ['sylhet strikers'],
    'ch': ['chattogram challengers'],
    'kht': ['khulna tigers'],
    'for': ['fortune barishal'],

    // ── LPL (Lanka Premier League) ────────────────────────────────────────────
    'js': ['jaffna stallions', 'jaffna kings'],
    'ck-lpl': ['colombo strikers'],
    'gall': ['galle gladiators'],
    'dkg': ['dambulla aura', 'dambulla giants'],
    'kan': ['kandy warriors', 'kandy falcons'],

    // ── MLC (Major League Cricket — USA) ──────────────────────────────────────
    'miny': ['mi new york'],
    'lat': ['los angeles knight riders'],
    'sei': ['seattle orcas'],
    'sft': ['san francisco unicorns'],
    'wsh': ['washington freedom'],
    'txs': ['texas super kings'],

    // ── Indian Domestic (Ranji Trophy / Vijay Hazare / etc.) ──────────────────
    'mum': ['mumbai'],
    'del': ['delhi'],
    'kar': ['karnataka'],
    'tn': ['tamil nadu'],
    'up': ['uttar pradesh'],
    'mp': ['madhya pradesh'],
    'raj': ['rajasthan'],
    'guj': ['gujarat'],
    'mah': ['maharashtra'],
    'pun': ['punjab'],
    'har': ['haryana'],
    'ben': ['bengal'],
    'ker': ['kerala'],
    'goa': ['goa'],
    'hp': ['himachal pradesh'],
    'jk': ['jammu and kashmir', 'jammu & kashmir'],
    'jha': ['jharkhand'],
    'asm': ['assam'],
    'odi': ['odisha'],
    'chd': ['chandigarh'],
    'meg': ['meghalaya'],
    'pud': ['puducherry', 'pondicherry'],
    'tri': ['tripura'],
    'man': ['manipur'],
    'miz': ['mizoram'],
    'nag': ['nagaland'],
    'aru': ['arunachal pradesh'],
    'sik': ['sikkim'],
    'utt': ['uttarakhand'],
    'cgr': ['chhattisgarh'],
    'tel': ['telangana', 'hyderabad'],
    'ap': ['andhra pradesh', 'andhra'],
    'sc': ['services'],
    'rlys': ['railways'],
    'vid': ['vidarbha'],
    'sau': ['saurashtra'],
    'bar-ind': ['baroda'],
    'svcs': ['services'],

    // ── County Cricket (England) ──────────────────────────────────────────────
    'surr': ['surrey'],
    'ess': ['essex'],
    'kent': ['kent'],
    'hamp': ['hampshire'],
    'lancs': ['lancashire'],
    'yorks': ['yorkshire'],
    'mdx': ['middlesex'],
    'notts': ['nottinghamshire'],
    'suss': ['sussex'],
    'warks': ['warwickshire'],
    'worcs': ['worcestershire'],
    'derb': ['derbyshire'],
    'dur-cc': ['durham'],
    'glam': ['glamorgan'],
    'glos': ['gloucestershire'],
    'leics': ['leicestershire'],
    'nhants': ['northamptonshire'],
    'somer': ['somerset'],

    // ── Misc / A-Teams ────────────────────────────────────────────────────────
    'inda': ['india a'],
    'ausa': ['australia a'],
    'enga': ['england a', 'england lions'],
    'saa': ['south africa a'],
    'nza': ['new zealand a'],
    'paka': ['pakistan a', 'pakistan shaheens'],
    'sla': ['sri lanka a'],
    'bana': ['bangladesh a'],
    'wia': ['west indies a'],
    'tit': ['titans'],
    'dol': ['dolphins'],
    'war': ['warriors'],
    'lio': ['lions'],
    'cap': ['cape cobras', 'western province'],
    'kni': ['knights'],
};

// Build a reverse map: lowercase full name → canonical name (for quick lookup)
const _reverseAliasMap = {};
for (const [key, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
        _reverseAliasMap[alias.toLowerCase()] = aliases[0].toLowerCase();
    }
    // Also map the short code itself
    _reverseAliasMap[key] = aliases[0].toLowerCase();
}

// ─── Team Name Normalization ───────────────────────────────────────────────────
function normalizeTeam(name) {
    if (!name) return '';
    let n = name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    // Check alias map (handles short codes like "ENGW" → "england women", "IND" → "india")
    if (_reverseAliasMap[n]) return _reverseAliasMap[n];

    // Smart suffix-aware fallback: resolve the base name while PRESERVING the qualifier.
    // e.g., "Afghanistan U19" → base "afghanistan" → resolves to "afghanistan" → final: "afghanistan u19"
    // This prevents cross-contamination: "india women" stays "india women", NOT stripped to "india".
    const suffixPatterns = [
        { regex: /\s+(women\s+u19)$/i, suffix: 'women u19' },
        { regex: /\s+(women)$/i, suffix: 'women' },
        { regex: /\s+(u19)$/i, suffix: 'u19' },
        { regex: /\s+(under-19)$/i, suffix: 'u19' },
        { regex: /\s+a$/i, suffix: 'a' },
    ];

    for (const { regex, suffix } of suffixPatterns) {
        const match = n.match(regex);
        if (match) {
            const base = n.replace(regex, '').trim();
            const resolvedBase = _reverseAliasMap[base];
            if (resolvedBase) {
                // Return "resolved base + qualifier" so identities stay separate
                return `${resolvedBase} ${suffix}`;
            }
        }
    }

    return n;
}

function teamsMatch(cdTeams, cbTeam1Name, cbTeam2Name) {
    if (!cdTeams || cdTeams.length < 2) return false;
    const cdNorm = cdTeams.map(normalizeTeam).sort();
    const cbNorm = [normalizeTeam(cbTeam1Name), normalizeTeam(cbTeam2Name)].sort();

    // Direct match (after alias resolution)
    if (cdNorm[0] === cbNorm[0] && cdNorm[1] === cbNorm[1]) return true;

    // Fuzzy: check if one contains the other, BUT block cross-gender/age matches
    // e.g. "india" must NOT match "india women" or "india u19"
    const qualifiers = /\b(women|u19|under-19)\b/i;
    const fuzzyOk = (a, b) => {
        if ((a.includes(b) || b.includes(a)) && a !== b) {
            // If one has a qualifier and the other doesn't, reject
            if (qualifiers.test(a) !== qualifiers.test(b)) return false;
            return true;
        }
        return a === b;
    };

    return fuzzyOk(cdNorm[0], cbNorm[0]) && fuzzyOk(cdNorm[1], cbNorm[1]);
}


function dateMatch(cdDateTimeGMT, cbStartDate, toleranceMs = 5 * 60 * 1000) {
    let cdEpoch;
    if (typeof cdDateTimeGMT === 'string') {
        let ts = cdDateTimeGMT;
        if (!ts.endsWith('Z') && !ts.includes('+')) ts += 'Z';
        cdEpoch = new Date(ts).getTime();
    } else {
        cdEpoch = cdDateTimeGMT;
    }
    const cbEpoch = typeof cbStartDate === 'string' ? parseInt(cbStartDate) : cbStartDate;
    return Math.abs(cdEpoch - cbEpoch) <= toleranceMs;
}

// ─── Status Normalization ───────────────────────────────────────────────────────
// Converts raw CricketData.org status strings into LIVE / UPCOMING / COMPLETED / UNKNOWN
function normalizeStatus(rawStatus) {
    if (!rawStatus) return 'UNKNOWN';
    const status = rawStatus.toLowerCase();

    // ── Live indicators ─────────────────────────────────────────────────────────
    if (
        status.includes('live') ||
        status.includes('match started') ||
        status.includes('in progress') ||
        status.includes('innings break') ||
        status.includes('tea break') ||
        status.includes('lunch break') ||
        status.includes('dinner break') ||
        status.includes('drinks break') ||
        status.includes('stumps') ||
        status.includes('rain delay') ||
        status.includes('bad light') ||
        status.includes('wet outfield') ||
        status.includes('delayed') ||
        status.includes('strategic timeout') ||
        status.includes('timeout') ||
        status.includes('play suspended') ||
        status.includes('day ') ||           // "Day 2 - Session 1" etc.
        status.includes('session') ||
        status.includes('bowling') ||
        status.includes('batting') ||
        status.includes('break')
    ) {
        return 'LIVE';
    }

    // ── Upcoming indicators ─────────────────────────────────────────────────────
    if (
        status.includes('not started') ||
        status.includes('scheduled') ||
        status.includes('starts at') ||
        status.includes('fixture') ||
        status.includes('match begins') ||
        status.includes('match starts') ||
        status.includes('yet to start') ||
        status.includes('upcoming') ||
        status.includes('toss') ||           // Toss hasn't happened = upcoming
        status.includes('preview')
    ) {
        return 'UPCOMING';
    }

    // ── Completed indicators ────────────────────────────────────────────────────
    if (
        status.includes('ended') ||
        status.includes('completed') ||
        status.includes('won by') ||
        status.includes('lost by') ||
        status.includes('match tied') ||
        status.includes('tie') ||
        status.includes('drawn') ||
        status.includes('draw') ||
        status.includes('no result') ||
        status.includes('abandoned') ||
        status.includes('match finished') ||
        status.includes('result') ||
        status.includes('wickets') ||        // "India won by 6 wickets"
        status.includes('runs') ||           // "India won by 243 runs"
        status.includes('innings and') ||    // "won by an innings and 90 runs"
        status.includes('super over') ||
        status.includes('dls') ||
        status.includes('d/l')
    ) {
        return 'COMPLETED';
    }

    return 'UNKNOWN';
}

// ─── Endpoint Order by Normalized Status ────────────────────────────────────────
function getEndpointOrder(normalized) {
    switch (normalized) {
        case 'LIVE': return ['live', 'recent', 'upcoming'];
        case 'UPCOMING': return ['upcoming', 'live', 'recent'];
        case 'COMPLETED': return ['recent', 'live', 'upcoming'];
        default: return ['live', 'recent', 'upcoming']; // UNKNOWN
    }
}

// ─── Mapping: CricketData.org ID → Cricbuzz ID ────────────────────────────────
async function getCricbuzzMatchId(cdMatchId) {
    // 0. Skip if it's a local MongoDB match
    if (cdMatchId && typeof cdMatchId === 'string' && cdMatchId.length >= 24 && /^[0-9a-fA-F]+$/.test(cdMatchId)) {
        // console.log(`[CRICBUZZ] Skipping mapping for local match: ${cdMatchId}`);
        return null;
    }

    const cacheKey = `cb_map_${cdMatchId}`;
    const cached = cache.get(cacheKey);

    // Check cache: if we have a valid ID, use it.
    // If we have 'NOT_FOUND', it means we recently tried and failed, so skip retrying.
    if (cached) {
        if (cached === 'NOT_FOUND') {
            // console.log(`[CRICBUZZ] Mapping cache HIT (Negative) for ${cdMatchId}`);
            return null;
        }
        // console.log(`[CRICBUZZ] Mapping cache HIT for ${cdMatchId} → ${cached}`);
        return cached;
    }

    console.log(`[CRICBUZZ] Building mapping for ${cdMatchId}...`);

    try {
        // 1. Get CricketData.org match info for teams + date (Use internal service to hit CACHE)
        // This prevents hitting the API limit repeatedly for the same match
        const cdRes = await cricketService.getMatchInfo(cdMatchId);
        const cdMatch = cdRes?.data;
        if (!cdMatch) {
            console.warn(`[CRICBUZZ] No CD match data for ${cdMatchId}`);
            return null;
        }

        // 2. Normalize status and determine endpoint order (primary + fallbacks)
        const normalized = normalizeStatus(cdMatch.status);
        const endpointOrder = getEndpointOrder(normalized);

        console.log(`[CRICBUZZ] Status: '${cdMatch.status}' → Normalized: ${normalized} → Trying: [${endpointOrder.join(', ')}]`);

        // 3. Try endpoints sequentially: primary first, then fallbacks
        //    Stop as soon as we find a match — this is the key optimization
        const tolerance = 24 * 60 * 60 * 1000; // 24 hours for broader matching

        for (const endpoint of endpointOrder) {
            const cbMatches = [];
            try {
                const res = await axios.get(`${CB_BASE}/matches/v1/${endpoint}`, { headers: cbHeaders });
                if (res.data?.typeMatches) {
                    res.data.typeMatches.forEach(tm => {
                        tm.seriesMatches?.forEach(sm => {
                            sm.seriesAdWrapper?.matches?.forEach(m => {
                                if (m.matchInfo) cbMatches.push(m.matchInfo);
                            });
                        });
                    });
                }
            } catch (err) {
                console.warn(`[CRICBUZZ] Failed to fetch ${endpoint}:`, err.message);
                continue; // Try next fallback endpoint
            }

            // Find best match by teams + date in this endpoint's results
            let best = null;
            let bestTimeDiff = Infinity;

            for (const cb of cbMatches) {
                const tm = teamsMatch(cdMatch.teams, cb.team1?.teamName, cb.team2?.teamName);
                if (!tm) continue;

                let cdEpoch;
                let ts = cdMatch.dateTimeGMT;
                if (typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+')) ts += 'Z';
                cdEpoch = new Date(ts).getTime();
                const cbEpoch = parseInt(cb.startDate);
                const diff = Math.abs(cdEpoch - cbEpoch);

                if (diff <= tolerance && diff < bestTimeDiff) {
                    best = cb;
                    bestTimeDiff = diff;
                }
            }

            if (best) {
                const cbId = String(best.matchId);
                console.log(`[CRICBUZZ] Mapped ${cdMatchId} → ${cbId} (${best.team1?.teamName} vs ${best.team2?.teamName}) via '${endpoint}' endpoint`);
                cache.set(cacheKey, cbId, 600); // Cache success for 10 minutes

                // Rate-limit guard: wait 1.1s after a fresh mapping before returning
                // This prevents the subsequent scorecard/squads/commentary request from
                // firing back-to-back and triggering a 429 (burst rate limit) error.
                // Note: This delay only applies when a REAL API call was made for mapping.
                // Cached mappings (cache hit at the top) return instantly with no delay.
                await new Promise(resolve => setTimeout(resolve, 1100));

                return cbId;
            }

            console.log(`[CRICBUZZ] No match found in '${endpoint}', trying next fallback...`);
        }

        // All endpoints exhausted — no mapping found

        console.warn(`[CRICBUZZ] No mapping found for ${cdMatchId} (${cdMatch.teams?.join(' vs ')})`);

        // NEGATIVE CACHING: Cache the failure for 5 minutes (300 seconds)
        // This prevents the "retry storm" where every refresh triggers 3 API calls
        cache.set(cacheKey, 'NOT_FOUND', 300);

        return null;
    } catch (err) {
        console.error(`[CRICBUZZ] Mapping error for ${cdMatchId}:`, err.message);
        return null;
    }
}

// ─── Scorecard ─────────────────────────────────────────────────────────────────
async function getScorecard(cdMatchId) {
    const cacheKey = `cb_scard_${cdMatchId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const cbId = await getCricbuzzMatchId(cdMatchId);
    if (!cbId) return { error: 'No Cricbuzz mapping found', data: null };

    try {
        const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/scard`, { headers: cbHeaders });
        const raw = res.data;

        if (!raw?.scorecard || !Array.isArray(raw.scorecard)) {
            return { error: 'No scorecard data from Cricbuzz', data: null };
        }

        // Normalize scorecard into a clean structure
        const innings = raw.scorecard.map((inn, idx) => {
            // fow can be either an array or an object { fow: [...] }
            const fowArray = Array.isArray(inn.fow) ? inn.fow : (inn.fow?.fow || []);

            return {
                inningsNum: idx + 1,
                teamName: inn.batteamname || `Team ${idx + 1}`,
                teamShortName: inn.batteamsname || '',
                score: inn.score ?? 0,
                wickets: inn.wickets ?? 0,
                overs: inn.overs ?? 0,
                runRate: inn.runrate || '0.00',
                isDeclared: inn.isdeclared || false,
                isFollowOn: inn.isfollowon || false,
                batsmen: (inn.batsman || []).map(b => ({
                    name: b.name || b.nickname || 'Unknown',
                    runs: b.runs ?? 0,
                    balls: b.balls ?? 0,
                    fours: b.fours ?? 0,
                    sixes: b.sixes ?? 0,
                    strikeRate: b.strkrate || '0.00',
                    dismissal: b.outdec || 'not out',
                    isCaptain: b.iscaptain || false,
                    isKeeper: b.iskeeper || false,
                })),
                bowlers: (inn.bowler || []).map(b => ({
                    name: b.name || b.nickname || 'Unknown',
                    overs: b.overs || '0',
                    maidens: b.maidens ?? 0,
                    runs: b.runs ?? 0,
                    wickets: b.wickets ?? 0,
                    economy: b.economy || '0.00',
                    isCaptain: b.iscaptain || false,
                    isKeeper: b.iskeeper || false,
                })),
                extras: inn.extras || {},
                fallOfWickets: fowArray.map(f => ({
                    batsmanName: f.batsmanname || f.batname || 'Unknown',
                    score: f.runs ?? f.score ?? 0,
                    wicketNum: f.wktnbr ?? 0,
                    overs: f.overnbr ?? f.overs ?? 0,
                })),
            };
        });

        const isComplete = raw.ismatchcomplete || raw.status?.toLowerCase().includes('match ended');
        // STRICT REQUIREMENT: All valid data cached for 10 mins (600s), regardless of status
        const ttl = 600;

        const result = {
            data: {
                innings,
                isMatchComplete: isComplete,
                status: raw.status || '',
            },
            error: null,
        };

        // console.log(`[CRICBUZZ] Caching scorecard for ${cdMatchId} (TTL: ${ttl}s)`);
        cache.set(cacheKey, result, ttl);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Scorecard error for ${cdMatchId}:`, err.message);

        // NEGATIVE CACHING: Cache the error for 60 seconds to prevent polling storms
        cache.set(cacheKey, { error: 'Failed to fetch Cricbuzz scorecard (API Limit)', data: null }, 60);

        return { error: 'Failed to fetch Cricbuzz scorecard', data: null };
    }
}

// ─── Squads (Extracted from Scorecard + Player Info) ────────────────────────────
async function getSquads(cdMatchId) {
    const cacheKey = `cb_squads_${cdMatchId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const cbId = await getCricbuzzMatchId(cdMatchId);
    if (!cbId) return { error: 'No Cricbuzz mapping found', data: null };

    try {
        const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/scard`, { headers: cbHeaders });
        const raw = res.data;

        if (!raw?.scorecard || raw.scorecard.length === 0) {
            return { error: 'No scorecard data to extract squads from', data: null };
        }

        // Helper: fetch role for a single player (with 24h cache)
        async function getPlayerRole(playerId) {
            if (!playerId) return null;
            const roleKey = `cb_role_${playerId}`;
            const cachedRole = cache.get(roleKey);
            if (cachedRole) return cachedRole;

            try {
                const pRes = await axios.get(`${CB_BASE}/stats/v1/player/${playerId}`, { headers: cbHeaders });
                const role = pRes.data?.role || null;
                if (role) cache.set(roleKey, role, 86400); // Cache 24 hours
                return role;
            } catch {
                return null;
            }
        }

        // Normalize Cricbuzz role strings for display
        function normalizeRole(role) {
            if (!role) return 'Batsman';
            const r = role.toLowerCase();
            if (r.includes('wk') || r.includes('keeper')) return 'WK-Batsman';
            if (r === 'bowler') return 'Bowler';
            if (r.includes('allrounder') || r.includes('all-rounder') || r.includes('all rounder')) return 'All-rounder';
            if (r.includes('batter') || r.includes('batsman')) return 'Batsman';
            return role; // Return as-is if unknown
        }

        // Extract unique players per team from all innings
        const teams = {};

        raw.scorecard.forEach(inn => {
            const teamName = inn.batteamname || 'Unknown';
            if (!teams[teamName]) {
                teams[teamName] = {
                    teamName,
                    shortName: inn.batteamsname || '',
                    players: new Map(),
                };
            }

            // Add batsmen to batting team
            (inn.batsman || []).forEach(b => {
                const name = b.name || b.nickname;
                if (!name) return;
                const existing = teams[teamName].players.get(name);
                if (existing) {
                    if (b.iscaptain) existing.isCaptain = true;
                    if (b.iskeeper) existing.isKeeper = true;
                } else {
                    teams[teamName].players.set(name, {
                        name,
                        id: b.id,
                        isCaptain: b.iscaptain || false,
                        isKeeper: b.iskeeper || false,
                    });
                }
            });
        });

        // Add bowlers to the opposing team
        raw.scorecard.forEach(inn => {
            const batTeam = inn.batteamname || 'Unknown';
            const otherTeamName = Object.keys(teams).find(t => t !== batTeam);
            if (otherTeamName && teams[otherTeamName]) {
                (inn.bowler || []).forEach(b => {
                    const name = b.name || b.nickname;
                    if (!name) return;
                    const existing = teams[otherTeamName].players.get(name);
                    if (existing) {
                        if (b.iscaptain) existing.isCaptain = true;
                        if (b.iskeeper) existing.isKeeper = true;
                        if (!existing.id && b.id) existing.id = b.id;
                    } else {
                        teams[otherTeamName].players.set(name, {
                            name,
                            id: b.id,
                            isCaptain: b.iscaptain || false,
                            isKeeper: b.iskeeper || false,
                        });
                    }
                });
            }
        });

        // Fetch real roles from player info API for all players
        const allPlayers = [];
        for (const t of Object.values(teams)) {
            for (const p of t.players.values()) {
                allPlayers.push(p);
            }
        }

        // Batch fetch roles (max 22 players typically)
        const rolePromises = allPlayers.map(p => getPlayerRole(p.id));
        const roles = await Promise.all(rolePromises);
        allPlayers.forEach((p, i) => {
            p.resolvedRole = normalizeRole(roles[i]);
        });

        // Convert Maps to arrays
        const teamsArray = Object.values(teams).map(t => ({
            teamName: t.teamName,
            shortName: t.shortName,
            players: Array.from(t.players.values()).map(p => ({
                name: p.name,
                isCaptain: p.isCaptain,
                isKeeper: p.isKeeper,
                role: p.resolvedRole || 'Batsman',
            })),
        }));

        const result = {
            data: { teams: teamsArray },
            error: null,
        };

        cache.set(cacheKey, result, 600);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Squads error for ${cdMatchId}:`, err.message);
        return { error: 'Failed to fetch Cricbuzz squads', data: null };
    }
}

// ─── Commentary ────────────────────────────────────────────────────────────────
async function getCommentary(cdMatchId) {
    const cacheKey = `cb_comm_${cdMatchId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const cbId = await getCricbuzzMatchId(cdMatchId);
    if (!cbId) return { error: 'No Cricbuzz mapping found', data: null };

    // Helper to clean commentary text (strip Cricbuzz formatting tokens)
    const cleanText = (txt) => {
        if (!txt) return '';
        return txt
            .replace(/B\d\$/g, '')   // Remove B0$, B1$ etc.
            .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
            .trim();
    };

    // Helper to extract items from a comwrapper array
    const extractItems = (comwrapper) => {
        if (!Array.isArray(comwrapper)) return [];
        return comwrapper
            .filter(c => c.commentary && c.commentary.commtxt)
            .map(c => {
                const comm = c.commentary;
                const text = cleanText(comm.commtxt);
                return {
                    text,
                    overNum: comm.overnum ?? null,
                    inningsId: comm.inningsid ?? 0,
                    timestamp: comm.timestamp || 0,
                    eventType: comm.eventtype || 'NONE',
                    ballNum: comm.ballnbr ?? 0,
                    batTeamScore: comm.batteamscore ?? 0,
                };
            })
            .filter(item => item.text.length > 0); // Remove items with empty text after cleanup
    };

    try {
        // Try full commentary first (has ball-by-ball data, works for live matches)
        let items = [];
        let inningsId = 0;

        try {
            const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/comm`, { headers: cbHeaders });
            const raw = res.data;
            items = extractItems(raw?.comwrapper);
            inningsId = raw?.inningsid ?? 0;
        } catch (_) {
            // /comm failed, will try /hcomm below
        }

        // Fallback to highlight commentary if full comm returned no data
        if (items.length === 0) {
            try {
                const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/hcomm`, { headers: cbHeaders });
                const raw = res.data;
                items = extractItems(raw?.comwrapper);
                inningsId = raw?.inningsid ?? 0;
            } catch (_) {
                // /hcomm also failed
            }
        }

        // Return whatever we have (even if empty)
        const result = {
            data: {
                commentary: items,
                inningsId,
            },
            error: null,
        };

        // STRICT REQUIREMENT: 10 mins (600s) cache for commentary
        // console.log(`[CRICBUZZ] Caching commentary for ${cdMatchId} (TTL: 600s)`);
        cache.set(cacheKey, result, 600);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Commentary error for ${cdMatchId}:`, err.message);

        // NEGATIVE CACHING: Cache the error for 60 seconds to prevent polling storms
        cache.set(cacheKey, { error: 'Failed to fetch Cricbuzz commentary (API Limit)', data: null }, 60);

        return { error: 'Failed to fetch Cricbuzz commentary', data: null };
    }
}


// ─── Export ────────────────────────────────────────────────────────────────────
export const cricbuzzService = {
    getCricbuzzMatchId,
    getScorecard,
    getSquads,
    getCommentary,
};
