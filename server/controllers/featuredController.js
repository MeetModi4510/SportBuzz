import { cricketService } from '../services/cricketApiService.js';
import footballService from '../services/footballApiService.js';
import { attachFlagsToMatch } from '../services/flagService.js';


/**
 * UTILITY: Selects featured matches per format with STRICT rules.
 *
 * Rule 1 (Live exists):    1 Live + 1 Upcoming + 1 Completed  → up to 3
 * Rule 2 (No Live):        2 Completed + 1 Upcoming           → up to 3
 * Rule 3 (No Live, No Upcoming): 2 Completed ONLY             → exactly 2
 *
 * NEVER fill extra completed matches beyond the rules above.
 * De-duplicate by match ID.
 */
const selectFeaturedMatches = (matches = []) => {
    if (!Array.isArray(matches) || matches.length === 0) return [];

    // ── Keywords for series validation ──────────────────────────────
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
        const name = (m.name || '').toLowerCase();
        const seriesName = (m.series || m.seriesName || '').toLowerCase();
        const combined = `${name} ${seriesName}`;
        return VALID_SERIES_KEYWORDS.some(keyword => combined.includes(keyword));
    };

    // ── Helpers ─────────────────────────────────────────────────────
    const getStartTime = (m) => {
        let s = m.dateTimeGMT || m.start_time || m.scheduled_time || m.date;
        // Force UTC/GMT if string implies ISO but lacks Z (common API issue)
        if (s && typeof s === 'string' && !s.endsWith('Z') && s.includes('T')) {
            s += 'Z';
        }
        return new Date(s);
    };

    // Status Classification Keywords
    const resultKeywords = [
        'won by', 'won at', 'draw', 'drawn', 'tied', 'no result', 'abandoned',
        'match ended', 'completed', 'stumps - day 5'
    ];
    const liveKeywords = [
        'live', 'innings break', 'stumps', 'tea', 'lunch',
        'rain', 'delay', 'need', 'trail', 'require', 'lead',
        'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'in progress'
    ];

    /**
     * Check if match actually has meaningful scores (not just 0/0).
     */
    const hasMeaningfulScores = (m) => {
        if (!Array.isArray(m.score) || m.score.length === 0) return false;
        return m.score.some(s => (s.r || 0) > 0 || (s.w || 0) > 0 || parseFloat(s.o || 0) > 0);
    };

    // ── Classify every match ────────────────────────────────────────
    const livePool = [];
    const completedPool = [];
    const upcomingPool = [];

    for (const m of matches) {
        if (!isValidSeries(m)) continue;

        const status = (m.status || '').toLowerCase();

        // ── PRIORITY 1: Result keywords → ALWAYS Completed ──────────
        const hasResult = resultKeywords.some(k => status.includes(k));
        if (hasResult || m.matchEnded === true) {
            completedPool.push(m);
            continue;
        }

        // ── PRIORITY 2: Live indicators (Scores/Flags) → Live ───────
        // Strictly follow API flags: matchStarted=true means LIVE regardless of scores
        const isLiveByKeyword = liveKeywords.some(k => status.includes(k));
        const isLiveByFlags = m.matchStarted && !m.matchEnded;
        const hasScores = hasMeaningfulScores(m);

        if (isLiveByKeyword || isLiveByFlags || (hasScores && !m.matchEnded)) {
            livePool.push(m);
            continue;
        }

        // ── Fallback → Upcoming ─────────────────────────────────────
        // Default bucket for scheduled matches that haven't started or ended
        upcomingPool.push(m);
    }

    // Sort strictly by dateTimeGMT (Start Time)
    // Live: Most recent start time first (Desc)
    livePool.sort((a, b) => getStartTime(b) - getStartTime(a));

    // Completed: Most recent start time first (Desc) - As requested
    completedPool.sort((a, b) => getStartTime(b) - getStartTime(a));

    // Upcoming: Soonest start time first (Asc)
    upcomingPool.sort((a, b) => getStartTime(a) - getStartTime(b));

    console.log(`[SELECT] Pools → Live: ${livePool.length}, Completed: ${completedPool.length}, Upcoming: ${upcomingPool.length}`);

    // ── GREEDY SELECTION LOGIC (Prioritize Live > Upcoming > Recent) ────
    const selected = [];
    const usedIds = new Set();

    const pickN = (pool, n) => {
        let count = 0;
        for (const m of pool) {
            if (count >= n) break;
            if (!usedIds.has(m.id)) {
                selected.push(attachFlagsToMatch(m));
                usedIds.add(m.id);
                count++;
            }
        }
        return count;
    };

    // Rule: Fill up to 3 matches per format
    // Step 1: All Live matches (up to 3)
    let pickedLive = pickN(livePool, 3);
    
    // Step 2: Fill remaining with Upcoming matches
    if (pickedLive < 3) {
        let pickedUpcoming = pickN(upcomingPool, 3 - pickedLive);
        
        // Step 3: Fill remaining with Completed matches if still less than 3
        if (pickedLive + pickedUpcoming < 3) {
            pickN(completedPool, 3 - (pickedLive + pickedUpcoming));
        }
    }

    return selected;
};

/**
 * Controller to get featured matches for all sports
 */
export const getFeaturedMatches = async (req, res) => {
    try {
        // Fetch ALL data sources in parallel (all cached 10 min)
        const [cricketData, allCricketData, activeSeriesMatches, ranjiMatches] = await Promise.all([
            cricketService.getCurrentMatches().catch(err => {
                console.error("Error fetching current matches:", err.message);
                return { data: [] };
            }),
            cricketService.getAllMatches().catch(err => {
                console.error("Error fetching all matches:", err.message);
                return { data: [] };
            }),
            cricketService.getActiveSeriesMatches().catch(err => {
                console.error("Error fetching active series matches:", err.message);
                return [];
            }),
            cricketService.getRanjiTrophyMatches().catch(err => {
                console.error("Error fetching Ranji matches:", err.message);
                return [];
            })
        ]);

        const currentMatches = cricketData.data || [];
        const allMatchesRaw = allCricketData.data || [];
        const activeMatches = Array.isArray(activeSeriesMatches) ? activeSeriesMatches : [];
        const ranji = Array.isArray(ranjiMatches) ? ranjiMatches : [];

        // ── Merge & dedup ──────────────────────────────────────────
        // Priority: /currentMatches > Dynamic Active Series > Ranji > /matches
        const matchMap = new Map();
        allMatchesRaw.forEach(m => matchMap.set(m.id, m));
        ranji.forEach(m => { if (m.id) matchMap.set(m.id, m); });
        activeMatches.forEach(m => { if (m.id) matchMap.set(m.id, m); });
        currentMatches.forEach(m => matchMap.set(m.id, m));

        const allMatches = Array.from(matchMap.values());
        console.log(`[FEATURED] Merged: ${allMatches.length} total (current=${currentMatches.length}, matches=${allMatchesRaw.length}, activeSeries=${activeMatches.length}, ranji=${ranji.length})`);

        // ── Categorize by format ───────────────────────────────────
        const categories = { test: [], odi: [], t20: [] };
        allMatches.forEach(match => {
            const type = (match.matchType || '').toLowerCase();
            if (type.includes('test') || type.includes('fclass')) categories.test.push(match);
            else if (type.includes('odi') || type.includes('list-a')) categories.odi.push(match);
            else if (type.includes('t20') || type.includes('t10') || type.includes('hundred')) categories.t20.push(match);
        });

        // ── Select featured (max 3 per format) ────────────────────
        const featuredTest = selectFeaturedMatches(categories.test);
        const featuredODI = selectFeaturedMatches(categories.odi);
        const featuredT20 = selectFeaturedMatches(categories.t20);

        // ── Enrich live matches with /match_info for fresh scores ──
        const enrichWithScores = async (featuredMatches) => {
            if (!Array.isArray(featuredMatches)) return [];

            await Promise.all(featuredMatches.map(async (match) => {
                // Only enrich matches that have a valid ID and are active
                const isActive = match.matchStarted && !match.matchEnded;
                const isCompletedButNoScore = match.matchEnded && !match.score;

                if (match.id && (isActive || isCompletedButNoScore)) {
                    try {
                        const matchInfo = await cricketService.getMatchInfo(match.id);
                        if (matchInfo?.data) {
                            if (matchInfo.data.score) match.score = matchInfo.data.score;
                            if (matchInfo.data.teamInfo) match.teamInfo = matchInfo.data.teamInfo;
                            if (matchInfo.data.start_time) match.start_time = matchInfo.data.start_time;
                            if (matchInfo.data.scheduled_time) match.scheduled_time = matchInfo.data.scheduled_time;
                            if (matchInfo.data.end_time) match.end_time = matchInfo.data.end_time;
                            if (matchInfo.data.endDate) match.endDate = matchInfo.data.endDate;
                            if (matchInfo.data.dateTimeGMT) {
                                match.dateTimeGMT = matchInfo.data.dateTimeGMT;
                                if (matchInfo.data.displayTime) {
                                    match.displayTime = matchInfo.data.displayTime;
                                }
                            }
                            if (matchInfo.data.status) match.status = matchInfo.data.status;
                            if (matchInfo.data.matchEnded !== undefined) match.matchEnded = matchInfo.data.matchEnded;
                        }
                    } catch (err) {
                        console.warn(`[SCORE] Failed to fetch score for ${match.id}:`, err.message);
                    }
                }
            }));

            return featuredMatches;
        };

        // ── Enrich all formats in parallel ─────────────────────────
        const [enrichedTest, enrichedODI, enrichedT20] = await Promise.all([
            enrichWithScores(featuredTest),
            enrichWithScores(featuredODI),
            enrichWithScores(featuredT20)
        ]);

        res.json({
            success: true,
            data: {
                cricket: {
                    test: enrichedTest,
                    odi: enrichedODI,
                    t20: enrichedT20
                }
            }
        });

    } catch (error) {
        console.error("Error in getFeaturedMatches:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch featured matches",
            error: error.message
        });
    }
};

export default {
    getFeaturedMatches
};
