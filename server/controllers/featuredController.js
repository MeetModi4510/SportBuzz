import { cricketService } from '../services/cricketApiService.js';
import footballService from '../services/footballApiService.js';
import { attachFlagsToMatch } from '../services/flagService.js';

// ─────────────────────────────────────────────────────────────────────────────
// FIX: Correct matchType misclassification from the API
// CricketData.org sometimes returns matchType: "odi" for T20I matches.
// We cross-reference the match name to detect and fix this.
// ─────────────────────────────────────────────────────────────────────────────
const fixMatchType = (match) => {
    if (!match) return match;
    const combined = `${match.name || ''} ${match.series || ''} ${match.seriesName || ''}`.toLowerCase();
    const currentType = (match.matchType || '').toLowerCase();

    // If name says T20I/T20 but matchType says odi/list-a → fix it
    if ((combined.includes('t20i') || combined.includes('t20 ')) && !currentType.includes('t20')) {
        match.matchType = 't20';
    }
    // If name says ODI but matchType says t20 → fix it
    if ((combined.includes(' odi ') || combined.includes('odi series')) && currentType.includes('t20')) {
        match.matchType = 'odi';
    }
    // If name says Test but matchType doesn't → fix it
    if ((combined.includes('test match') || combined.includes('test series') || combined.includes(', test,')) && !currentType.includes('test') && !currentType.includes('fclass')) {
        match.matchType = 'test';
    }
    return match;
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX: Parse score information from the status text when the API returns
// an empty score array. CricketData.org free tier sometimes withholds the
// score[] field for premium matches (e.g. IPL) while still providing chase
// information in the status text.
// ─────────────────────────────────────────────────────────────────────────────
const parseScoresFromStatus = (match) => {
    if (!match) return match;
    const scores = Array.isArray(match.score) ? match.score : [];
    const status = match.status || '';

    // Only attempt if scores are empty and match is live/in-progress
    if (scores.length > 0 || !match.matchStarted || match.matchEnded) return match;

    // Try to extract chase info: "Team need X runs in Y balls"
    const chaseMatch = status.match(/^(.+?)\s+need\s+(\d+)\s+runs?\s+in\s+(\d+)\s+balls?/i);
    if (chaseMatch) {
        const chasingTeam = chaseMatch[1].trim();
        const runsNeeded = parseInt(chaseMatch[2]);
        const ballsRemaining = parseInt(chaseMatch[3]);

        // Build the chase line from status since we have no score data
        const oversRemaining = Math.floor(ballsRemaining / 6) + '.' + (ballsRemaining % 6);
        match.chaseLine = `${chasingTeam} need ${runsNeeded} run${runsNeeded !== 1 ? 's' : ''} in ${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} (${oversRemaining} ov)`;
        // Mark that scores are API-limited so the frontend can handle display
        match._scoresUnavailable = true;
    }

    return match;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 4 – IST Time Conversion
// Converts any UTC/ISO timestamp string → IST (Asia/Kolkata)
// ─────────────────────────────────────────────────────────────────────────────
const toIST = (utcStr) => {
    if (!utcStr) return '';
    try {
        // CricketData.org often sends "2024-02-08T05:30:00" without Z → treat as UTC
        let s = String(utcStr);
        if (!s.endsWith('Z') && !s.includes('+') && s.includes('T')) s += 'Z';
        return new Date(s).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch { return String(utcStr); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 3 – Chase Line Computation
// Builds human-readable chase line from the SAME payload used for live scores.
// ─────────────────────────────────────────────────────────────────────────────
const buildChaseLine = (match) => {
    // Only relevant for live/in-progress matches with 2+ innings
    const scores = Array.isArray(match.score) ? match.score : [];

    // If the match has ended, return the final result string
    const status = (match.status || '');
    const statusLower = status.toLowerCase();
    const resultKeywords = ['won by', 'won at', 'draw', 'drawn', 'tied', 'no result', 'abandoned', 'match ended'];
    if (resultKeywords.some(k => statusLower.includes(k))) {
        return status || null; // Final result as chase line
    }

    // FIX: If scores are empty but status has chase info, use the status text directly
    if (scores.length < 2 && match.matchStarted && !match.matchEnded) {
        // Check if the status text itself contains chase info like "Team need X runs in Y balls"
        if (statusLower.includes('need') && statusLower.includes('runs')) {
            return status;
        }
        return null;
    }

    if (scores.length < 2) return null;

    // Determine if second innings is currently in progress
    const isLiveByFlag = match.matchStarted && !match.matchEnded;
    if (!isLiveByFlag || scores.length < 2) return null;

    // innings 1 = team batting first (index 0 after sort)
    const sorted = [...scores].sort((a, b) => {
        const aNum = parseInt((a.inning || '').match(/(\d+)/)?.[1] || '1');
        const bNum = parseInt((b.inning || '').match(/(\d+)/)?.[1] || '1');
        return aNum - bNum;
    });

    const inn1 = sorted[0];  // First innings (completed)
    const inn2 = sorted[1];  // Second innings (live)

    if (!inn1 || !inn2) return null;

    const target = (inn1.r || 0) + 1;
    const runs2  = inn2.r || 0;
    const wkts2  = inn2.w || 0;
    const overs2 = parseFloat(inn2.o || 0);

    const runsNeeded = target - runs2;
    if (runsNeeded <= 0) return null; // Already won or tied – result handles it

    // Format overs remaining (match type-specific max overs)
    const matchTypeLower = (match.matchType || '').toLowerCase();
    let totalOvers = 50; // ODI default
    if (matchTypeLower.includes('t20') || matchTypeLower.includes('t10')) totalOvers = 20;
    else if (matchTypeLower.includes('test') || matchTypeLower.includes('fclass')) return null; // No simple chase line for Test

    const oversUsed   = overs2;
    const fullOversUsed = Math.floor(oversUsed);
    const ballsInOver   = Math.round((oversUsed - fullOversUsed) * 10); // e.g. 18.3 → 3 balls
    const ballsBowled   = fullOversUsed * 6 + ballsInOver;
    const totalBalls    = totalOvers * 6;
    const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
    const oversRemaining = (Math.floor(ballsRemaining / 6)) + '.' + (ballsRemaining % 6);

    // Batting team name
    const bat2Name = (inn2.inning || '').replace(/\s*Inning\s*\d*/i, '').trim()
        || (match.teams?.[1] || 'Batting Team');

    return `${bat2Name} need ${runsNeeded} run${runsNeeded !== 1 ? 's' : ''} in ${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} (${oversRemaining} ov)`;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 1 – Selection Logic
// Per format:  1 Live + 1 Upcoming + 1 Completed  (exactly 3 or fewer)
// If no live:  2 Completed + 1 Upcoming
// If no live & no upcoming: 2 Completed only
// ─────────────────────────────────────────────────────────────────────────────
const VALID_SERIES_KEYWORDS = [
    'icc', 'world cup', 'world t20', 't20 world cup', 'cwc', 'champions trophy',
    'ranji', 'trophy', 'premier league', 'ipl', 'bpl', 'psl', 'bbl', 'cpl',
    'shield', 'cup', 'one-day', 'ford trophy', 'marsh', 'domestic',
    'csa', 'four-day', 'division', 'lions', 'titans', 'dolphins', 'warriors',
    'knights', 'cobras', 'boland', 'north west', 'kwazulu', 'western province',
    'eastern cape', 'free state', 'south western',
    'asia cup', 'ashes', 'border-gavaskar',
    'test match', 'test series', 'odi series', 't20i series', 'bilateral',
    'tour', 'tri-series', 'quadrangular', 'warm up', 'warmup', 'warm-up',
    'india', 'england', 'australia', 'pakistan', 'south africa', 'new zealand',
    'west indies', 'sri lanka', 'bangladesh', 'afghanistan', 'zimbabwe',
    'ireland', 'netherlands', 'scotland', 'nepal', 'uae', 'oman', 'usa', 'canada',
    'namibia', 'kenya', 'hong kong', 'italy', 'united arab emirates',
    'international', 'inter-cup', 'quarter-final', 'semi-final', 'final',
    'league', 't10', 'hundred', 'test', 'odi', 't20', 'series'
];

const isValidSeries = (m) => {
    const combined = `${m.name || ''} ${m.series || ''} ${m.seriesName || ''}`.toLowerCase();
    return VALID_SERIES_KEYWORDS.some(k => combined.includes(k));
};

const getStartTime = (m) => {
    let s = m.dateTimeGMT || m.start_time || m.scheduled_time || m.date;
    if (s && typeof s === 'string' && !s.endsWith('Z') && s.includes('T')) s += 'Z';
    return new Date(s);
};

const hasMeaningfulScores = (m) => {
    if (!Array.isArray(m.score) || m.score.length === 0) return false;
    return m.score.some(s => (s.r || 0) > 0 || (s.w || 0) > 0 || parseFloat(s.o || 0) > 0);
};

const RESULT_KEYWORDS = [
    'won by', 'won at', 'draw', 'drawn', 'tied', 'no result', 'abandoned',
    'match ended', 'completed', 'stumps - day 5'
];
const LIVE_KEYWORDS = [
    'live', 'innings break', 'stumps', 'tea', 'lunch',
    'rain', 'delay', 'need', 'trail', 'require', 'lead',
    'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'in progress'
];

/**
 * selectFeaturedMatches — strict per-format selection:
 *   Live≥1   → pick 1 live, 1 upcoming, 1 completed  (3 total)
 *   No live  → pick 1 upcoming + 2 completed          (3 total, if available)
 *   No live, No upcoming → pick 2 completed only
 */
const selectFeaturedMatches = (matches = []) => {
    if (!Array.isArray(matches) || matches.length === 0) return [];

    const livePool = [], completedPool = [], upcomingPool = [];

    for (const m of matches) {
        if (!isValidSeries(m)) continue;
        const status = (m.status || '').toLowerCase();

        const hasResult = RESULT_KEYWORDS.some(k => status.includes(k));
        if (hasResult || m.matchEnded === true) {
            completedPool.push(m);
            continue;
        }

        const isLiveByKeyword = LIVE_KEYWORDS.some(k => status.includes(k));
        const isLiveByFlags   = m.matchStarted && !m.matchEnded;
        const hasScores       = hasMeaningfulScores(m);

        if (isLiveByKeyword || isLiveByFlags || (hasScores && !m.matchEnded)) {
            livePool.push(m);
            continue;
        }

        upcomingPool.push(m);
    }

    // Sort pools
    livePool.sort((a, b)     => getStartTime(b) - getStartTime(a)); // most-recent live first
    completedPool.sort((a, b) => getStartTime(b) - getStartTime(a)); // most-recent completed first
    upcomingPool.sort((a, b)  => getStartTime(a) - getStartTime(b)); // soonest upcoming first

    console.log(`[SELECT] Pools → Live:${livePool.length} Completed:${completedPool.length} Upcoming:${upcomingPool.length}`);

    const selected = [];
    const usedIds  = new Set();

    const pick1 = (pool) => {
        for (const m of pool) {
            if (!usedIds.has(m.id)) {
                // Attach flags + IST display time
                const enriched = attachFlagsToMatch(m);
                enriched.displayTime  = toIST(m.dateTimeGMT || m.date);
                enriched.chaseLine    = buildChaseLine(m);
                selected.push(enriched);
                usedIds.add(m.id);
                return true;
            }
        }
        return false;
    };

    if (livePool.length > 0) {
        // RULE 1: 1 Live + 1 Upcoming + 1 Completed
        pick1(livePool);
        pick1(upcomingPool);
        pick1(completedPool);
    } else if (upcomingPool.length > 0) {
        // RULE 2: No live → 1 Upcoming + 2 Completed
        pick1(upcomingPool);
        pick1(completedPool);
        pick1(completedPool);
    } else {
        // RULE 3: No live, no upcoming → 2 Completed only
        pick1(completedPool);
        pick1(completedPool);
    }

    return selected;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 2 – Cache Alignment: 720 seconds backend cache TTL
// PROMPT 3 – Live enrichment from /match_info every 5 min (300s TTL for live)
// ─────────────────────────────────────────────────────────────────────────────

/** Enrich selected matches that are live with fresh /match_info data (5 min TTL on backend) */
const enrichLiveWithMatchInfo = async (featuredMatches) => {
    if (!Array.isArray(featuredMatches) || featuredMatches.length === 0) return featuredMatches;

    await Promise.all(featuredMatches.map(async (match) => {
        const isLive = match.matchStarted && !match.matchEnded;

        // Only poll /match_info for LIVE matches (5 min TTL handled inside cricketService)
        if (match.id && isLive) {
            try {
                const matchInfo = await cricketService.getMatchInfoLive(match.id);
                if (matchInfo?.data) {
                    const d = matchInfo.data;
                    // Only overwrite score if the new data actually has scores
                    if (Array.isArray(d.score) && d.score.length > 0) {
                        match.score = d.score;
                    }
                    if (d.teamInfo)     match.teamInfo    = d.teamInfo;
                    if (d.status)       match.status      = d.status;
                    if (d.matchEnded !== undefined) match.matchEnded = d.matchEnded;
                    if (d.dateTimeGMT)  match.dateTimeGMT = d.dateTimeGMT;
                    if (d.venue)        match.venue       = d.venue;

                    // Recompute chase line from updated payload (PROMPT 3)
                    match.chaseLine  = buildChaseLine(match);
                    // Recompute displayTime (PROMPT 4)
                    match.displayTime = toIST(d.dateTimeGMT || match.dateTimeGMT);
                }
            } catch (err) {
                console.warn(`[ENRICH] /match_info failed for ${match.id}:`, err.message);
            }
        } else if (match.id && match.matchEnded && (!Array.isArray(match.score) || match.score.length === 0)) {
            // Completed match missing score — fetch once with longer TTL
            try {
                const matchInfo = await cricketService.getMatchInfo(match.id);
                if (matchInfo?.data?.score && Array.isArray(matchInfo.data.score) && matchInfo.data.score.length > 0) {
                    match.score = matchInfo.data.score;
                }
                if (matchInfo?.data?.status) match.status = matchInfo.data.status;
                match.chaseLine = null; // Match finished, no chase line
                match.displayTime = toIST(match.dateTimeGMT || match.date);
            } catch (err) {
                console.warn(`[ENRICH] Completed score fetch failed for ${match.id}:`, err.message);
            }
        }

        // FIX: Parse scores from status text when API returns empty score arrays
        parseScoresFromStatus(match);

        // Always ensure displayTime is populated (PROMPT 4)
        if (!match.displayTime) {
            match.displayTime = toIST(match.dateTimeGMT || match.date);
        }
    }));

    return featuredMatches;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Controller
// ─────────────────────────────────────────────────────────────────────────────
export const getFeaturedMatches = async (req, res) => {
    try {
        // PROMPT 2: All upstream sources cached at 720s (12 min) in cricketApiService
        const [cricketData, allCricketData, activeSeriesMatches, ranjiMatches] = await Promise.all([
            cricketService.getCurrentMatches().catch(err => {
                console.error('[FEATURED] currentMatches error:', err.message);
                return { data: [] };
            }),
            cricketService.getAllMatches().catch(err => {
                console.error('[FEATURED] allMatches error:', err.message);
                return { data: [] };
            }),
            cricketService.getActiveSeriesMatches().catch(err => {
                console.error('[FEATURED] activeSeriesMatches error:', err.message);
                return [];
            }),
            cricketService.getRanjiTrophyMatches().catch(err => {
                console.error('[FEATURED] ranjiMatches error:', err.message);
                return [];
            })
        ]);

        const currentMatches  = cricketData.data || [];
        const allMatchesRaw   = allCricketData.data || [];
        const activeMatches   = Array.isArray(activeSeriesMatches) ? activeSeriesMatches : [];
        const ranji           = Array.isArray(ranjiMatches) ? ranjiMatches : [];

        // Merge & deduplicate — priority: /currentMatches > active series > ranji > /matches
        const matchMap = new Map();
        allMatchesRaw.forEach(m => matchMap.set(m.id, m));
        ranji.forEach(m => { if (m.id) matchMap.set(m.id, m); });
        activeMatches.forEach(m => { if (m.id) matchMap.set(m.id, m); });
        currentMatches.forEach(m => matchMap.set(m.id, m));

        const allMatches = Array.from(matchMap.values());
        console.log(`[FEATURED] Merged: ${allMatches.length} (current=${currentMatches.length} allRaw=${allMatchesRaw.length} active=${activeMatches.length} ranji=${ranji.length})`);

        // FIX: Correct matchType misclassification before categorizing
        allMatches.forEach(m => fixMatchType(m));

        // Categorize by format (PROMPT 1)
        const categories = { test: [], odi: [], t20: [] };
        allMatches.forEach(match => {
            const type = (match.matchType || '').toLowerCase();
            if      (type.includes('test') || type.includes('fclass'))                           categories.test.push(match);
            else if (type.includes('odi')  || type.includes('list-a'))                           categories.odi.push(match);
            else if (type.includes('t20')  || type.includes('t10') || type.includes('hundred')) categories.t20.push(match);
        });

        // PROMPT 1 – Select featured (strict 1L+1U+1C rule)
        const featuredTest = selectFeaturedMatches(categories.test);
        const featuredODI  = selectFeaturedMatches(categories.odi);
        const featuredT20  = selectFeaturedMatches(categories.t20);

        // PROMPT 3 – Enrich live matches with fresh /match_info (5 min TTL)
        const [enrichedTest, enrichedODI, enrichedT20] = await Promise.all([
            enrichLiveWithMatchInfo(featuredTest),
            enrichLiveWithMatchInfo(featuredODI),
            enrichLiveWithMatchInfo(featuredT20),
        ]);

        return res.json({
            success: true,
            data: {
                cricket: {
                    test: enrichedTest,
                    odi:  enrichedODI,
                    t20:  enrichedT20,
                },
            },
            // Tell client the server's cache TTL so it can align auto-refresh
            cacheTTL: 720,
        });

    } catch (error) {
        console.error('[FEATURED] getFeaturedMatches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured matches',
            error: error.message,
        });
    }
};

export default { getFeaturedMatches };
