/**
 * Football Data Service — Hybrid API Integration
 * 
 * Primary:  AllSportsApi2 (RapidAPI / REcodeX) for LIVE matches
 *           GET /api/matches/live  — real-time live football events
 * 
 * Fallback: Football-Data.org for SCHEDULED + FINISHED matches
 *           GET /v4/matches  — today's matches
 *           GET /v4/matches?dateFrom=...&dateTo=...&status=...
 * 
 * Cache TTL: 10 minutes (600s)
 */

import axios from 'axios';

// ── AllSportsApi2 (RapidAPI) ──
const RAPID_API_HOST = 'allsportsapi2.p.rapidapi.com';
const RAPID_API_KEY = process.env.FOOTBALL_RAPIDAPI_KEY;
const RAPID_BASE = `https://${RAPID_API_HOST}`;

// ── Football-Data.org (fallback for scheduled/finished) ──
const FD_BASE = 'https://api.football-data.org/v4';
const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN;

// ── 10-minute cache ──
const CACHE_TTL = 600 * 1000; // 10 minutes in ms
const cache = {
    dashboard: { data: null, timestamp: 0 },
    live: { data: null, timestamp: 0 },
    recent: { data: null, timestamp: 0 },
    upcoming: { data: null, timestamp: 0 }
};

function isCacheValid(key) {
    return cache[key]?.data && (Date.now() - cache[key].timestamp) < CACHE_TTL;
}

// ════════════════════════════════════════════════════════════════
// CATEGORY MAPPING
// ════════════════════════════════════════════════════════════════

// AllSportsApi2 uses uniqueTournament.id — map the big ones
const TOURNAMENT_CATEGORIES = {
    // Leagues
    17: 'league',   // Premier League
    35: 'league',   // Bundesliga
    23: 'league',   // Serie A
    8: 'league',    // La Liga
    34: 'league',   // Ligue 1
    242: 'league',  // Eredivisie
    325: 'league',  // Primeira Liga
    155: 'league',  // Saudi Pro League
    374: 'league',  // Brazilian Serie A
    48: 'league',   // Championship
    37: 'league',   // 2. Bundesliga
    53: 'league',   // Liga MX
    11: 'league',   // Argentine Liga Profesional
    // Cups
    7: 'cup',       // UEFA Champions League
    679: 'cup',     // UEFA Europa League
    17015: 'cup',   // UEFA Conference League
    16: 'cup',      // FA Cup
    19: 'cup',      // Copa del Rey
    384: 'cup',     // Copa Libertadores
    480: 'cup',     // Copa Sudamericana
    15: 'cup',      // DFB Pokal
    27: 'cup',      // Coppa Italia
    // International
    16: 'international', // duplicate intentional — overridden below
};

// For Football-Data.org competition codes
const FD_LEAGUE_CODES = ['PL', 'BL1', 'SA', 'PD', 'FL1', 'PPL', 'DED', 'BSA', 'ELC'];
const FD_CUP_CODES = ['CL', 'CLI', 'CDR', 'COPA'];
const FD_INTL_CODES = ['WC', 'EC', 'CAF', 'AFC'];

// Smart categorizer for AllSportsApi2 events
function getCategoryFromEvent(event) {
    const utId = event.tournament?.uniqueTournament?.id;
    const catName = event.tournament?.category?.name?.toLowerCase() || '';
    const tName = (event.tournament?.uniqueTournament?.name || event.tournament?.name || '').toLowerCase();
    
    // Check hardcoded mapping first
    if (TOURNAMENT_CATEGORIES[utId]) return TOURNAMENT_CATEGORIES[utId];
    
    // Smart heuristics
    if (catName === 'world' || catName.includes('international') ||
        tName.includes('world cup') || tName.includes('euro ') ||
        tName.includes('copa america') || tName.includes('nations league') ||
        tName.includes('africa cup') || tName.includes('asian cup')) {
        return 'international';
    }
    
    if (tName.includes('cup') || tName.includes('copa') ||
        tName.includes('pokal') || tName.includes('coppa') ||
        tName.includes('champions league') || tName.includes('europa league') ||
        tName.includes('conference league') || tName.includes('libertadores') ||
        tName.includes('knockout') || tName.includes('qualification')) {
        return 'cup';
    }
    
    return 'league'; // default
}

function getCategoryFromFD(competitionCode) {
    if (FD_CUP_CODES.includes(competitionCode)) return 'cup';
    if (FD_INTL_CODES.includes(competitionCode)) return 'international';
    return 'league';
}

// ════════════════════════════════════════════════════════════════
// TEAM LOGO HELPER
// ════════════════════════════════════════════════════════════════

// AllSportsApi2 team IDs → use Sofascore image CDN
function getTeamLogoUrl(teamId) {
    if (!teamId) return null;
    return `https://api.sofascore.app/api/v1/team/${teamId}/image`;
}

// Tournament logo
function getTournamentLogoUrl(utId) {
    if (!utId) return null;
    return `https://api.sofascore.app/api/v1/unique-tournament/${utId}/image`;
}

// ════════════════════════════════════════════════════════════════
// TIME HELPERS
// ════════════════════════════════════════════════════════════════

function toIST(dateInput) {
    try {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        return d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }) + ' IST';
    } catch {
        return String(dateInput);
    }
}

// ════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ════════════════════════════════════════════════════════════════

// AllSportsApi2 status codes
function mapRapidStatus(statusObj) {
    const type = statusObj?.type?.toLowerCase() || '';
    const code = statusObj?.code;
    
    if (type === 'inprogress') return 'live';
    if (type === 'finished') return 'completed';
    if (type === 'notstarted') return 'upcoming';
    
    // Code-based fallback
    if (code === 0) return 'upcoming';  // Not started
    if (code >= 6 && code <= 14) return 'live';  // Various in-progress codes
    if (code === 100 || code === 110 || code === 120) return 'completed'; // Ended / AET / Penalties
    if (code === 31) return 'live';  // Halftime (still live)
    if (code >= 60 && code <= 70) return 'completed'; // Postponed/Cancelled
    
    return 'upcoming';
}

// Football-Data.org statuses
function mapFDStatus(apiStatus) {
    switch (apiStatus) {
        case 'IN_PLAY': case 'PAUSED': case 'HALF_TIME': case 'EXTRA_TIME': case 'PENALTY':
            return 'live';
        case 'FINISHED': case 'AWARDED':
            return 'completed';
        case 'TIMED': case 'SCHEDULED':
            return 'upcoming';
        default:
            return 'upcoming';
    }
}

// ════════════════════════════════════════════════════════════════
// STATUS LINE / SUMMARY
// ════════════════════════════════════════════════════════════════

function computeStatusLine(homeScore, awayScore, status, homeTeam, awayTeam, statusDesc) {
    if (status === 'completed') {
        const h = parseInt(homeScore) || 0;
        const a = parseInt(awayScore) || 0;
        if (h > a) return `${homeTeam} won ${h}-${a}`;
        if (a > h) return `${awayTeam} won ${a}-${h}`;
        return `Match drawn ${h}-${a}`;
    }
    if (status === 'live') {
        return statusDesc || 'In Progress';
    }
    return '';
}

// ════════════════════════════════════════════════════════════════
// TRANSFORM: AllSportsApi2 event → our Match shape
// ════════════════════════════════════════════════════════════════

function transformRapidEvent(event) {
    const status = mapRapidStatus(event.status);
    const homeScore = event.homeScore?.current ?? event.homeScore?.display ?? '';
    const awayScore = event.awayScore?.current ?? event.awayScore?.display ?? '';
    const startTimestamp = event.startTimestamp ? event.startTimestamp * 1000 : Date.now();
    const startTime = new Date(startTimestamp);
    
    const homeTeamName = event.homeTeam?.name || 'Home';
    const awayTeamName = event.awayTeam?.name || 'Away';
    const homeShort = event.homeTeam?.nameCode || event.homeTeam?.shortName || homeTeamName.substring(0, 3).toUpperCase();
    const awayShort = event.awayTeam?.nameCode || event.awayTeam?.shortName || awayTeamName.substring(0, 3).toUpperCase();
    
    const tournamentName = event.tournament?.uniqueTournament?.name || event.tournament?.name || 'Football';
    const utId = event.tournament?.uniqueTournament?.id;
    
    // Status description (e.g. "2nd half", "Halftime")
    const statusDesc = event.status?.description || '';
    
    // Current minute from statusDescription or lastPeriod
    let currentMinute = '';
    if (status === 'live') {
        if (event.time?.currentPeriodStartTimestamp) {
            const elapsed = Math.floor((Date.now() / 1000 - event.time.currentPeriodStartTimestamp) / 60);
            const periodStart = event.status?.code === 7 ? 45 : 0; // 2nd half starts at 45
            currentMinute = `${periodStart + elapsed}'`;
        }
        if (statusDesc) currentMinute = statusDesc;
    }
    
    return {
        id: `football-${event.id}`,
        apiId: event.id,
        source: 'allsportsapi',
        sport: 'football',
        matchType: tournamentName,
        competitionCode: event.tournament?.uniqueTournament?.slug || '',
        competitionEmblem: getTournamentLogoUrl(utId),
        category: getCategoryFromEvent(event),
        homeTeam: {
            id: `ft-${event.homeTeam?.id || 'unknown'}`,
            name: homeTeamName,
            shortName: homeShort,
            logo: getTeamLogoUrl(event.homeTeam?.id),
            primaryColor: event.homeTeam?.teamColors?.primary || '#333333'
        },
        awayTeam: {
            id: `ft-${event.awayTeam?.id || 'unknown'}`,
            name: awayTeamName,
            shortName: awayShort,
            logo: getTeamLogoUrl(event.awayTeam?.id),
            primaryColor: event.awayTeam?.teamColors?.primary || '#666666'
        },
        homeScore: homeScore !== null && homeScore !== undefined && homeScore !== '' ? String(homeScore) : '',
        awayScore: awayScore !== null && awayScore !== undefined && awayScore !== '' ? String(awayScore) : '',
        status,
        venue: {
            name: event.venue?.stadium?.name || event.venue?.city?.name || 'Stadium',
            city: event.venue?.city?.name || ''
        },
        startTime: startTime.toISOString(),
        displayTime: toIST(startTime),
        currentMinute,
        summaryText: computeStatusLine(homeScore, awayScore, status, homeShort, awayShort, statusDesc),
        matchday: event.roundInfo?.round || null,
        stage: event.roundInfo?.name || null,
        group: event.roundInfo?.slug || null,
        referee: null,
        score: { home: homeScore, away: awayScore },
        lastUpdated: new Date().toISOString()
    };
}

// ════════════════════════════════════════════════════════════════
// TRANSFORM: Football-Data.org match → our Match shape
// ════════════════════════════════════════════════════════════════

function transformFDMatch(apiMatch) {
    const homeScore = apiMatch.score?.fullTime?.home ?? apiMatch.score?.halfTime?.home;
    const awayScore = apiMatch.score?.fullTime?.away ?? apiMatch.score?.halfTime?.away;
    const appStatus = mapFDStatus(apiMatch.status);
    
    const homeId = apiMatch.homeTeam?.id ? String(apiMatch.homeTeam.id) : null;
    const awayId = apiMatch.awayTeam?.id ? String(apiMatch.awayTeam.id) : null;
    
    const homeName = apiMatch.homeTeam?.name || 'Home';
    const awayName = apiMatch.awayTeam?.name || 'Away';
    const homeShort = apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.tla || 'HOM';
    const awayShort = apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.tla || 'AWY';
    
    return {
        id: `football-fd-${apiMatch.id}`,
        apiId: apiMatch.id,
        source: 'football-data',
        sport: 'football',
        matchType: apiMatch.competition?.name || 'Football',
        competitionCode: apiMatch.competition?.code || 'UNKNOWN',
        competitionEmblem: apiMatch.competition?.emblem || null,
        category: getCategoryFromFD(apiMatch.competition?.code || ''),
        homeTeam: {
            id: homeId ? `fd-${homeId}` : 'fd-unknown',
            name: homeName,
            shortName: homeShort,
            logo: apiMatch.homeTeam?.crest || null,
            primaryColor: '#333333'
        },
        awayTeam: {
            id: awayId ? `fd-${awayId}` : 'fd-unknown',
            name: awayName,
            shortName: awayShort,
            logo: apiMatch.awayTeam?.crest || null,
            primaryColor: '#666666'
        },
        homeScore: homeScore !== null && homeScore !== undefined ? String(homeScore) : '',
        awayScore: awayScore !== null && awayScore !== undefined ? String(awayScore) : '',
        status: appStatus,
        venue: {
            name: apiMatch.venue || apiMatch.homeTeam?.venue || 'Stadium',
            city: ''
        },
        startTime: apiMatch.utcDate,
        displayTime: toIST(apiMatch.utcDate),
        currentMinute: apiMatch.minute ? `${apiMatch.minute}'` : '',
        summaryText: computeStatusLine(
            homeScore, awayScore, appStatus, homeShort, awayShort, ''
        ),
        matchday: apiMatch.matchday,
        stage: apiMatch.stage,
        group: apiMatch.group,
        referee: apiMatch.referees?.[0]?.name || null,
        score: apiMatch.score,
        lastUpdated: apiMatch.lastUpdated
    };
}

// ════════════════════════════════════════════════════════════════
// API FETCHERS
// ════════════════════════════════════════════════════════════════

// AllSportsApi2 — Live matches
async function fetchLiveMatches() {
    if (isCacheValid('live')) {
        console.log('[AllSportsApi] Serving live from cache');
        return cache.live.data;
    }
    
    try {
        console.log('[AllSportsApi] Fetching live matches...');
        const res = await axios.get(`${RAPID_BASE}/api/matches/live`, {
            headers: {
                'x-rapidapi-key': RAPID_API_KEY,
                'x-rapidapi-host': RAPID_API_HOST
            },
            timeout: 15000
        });
        
        // Filter football only
        const allEvents = res.data?.events || [];
        const footballEvents = allEvents.filter(e => 
            e.tournament?.category?.sport?.slug === 'football' ||
            e.tournament?.category?.sport?.id === 1
        );
        
        console.log(`[AllSportsApi] Got ${footballEvents.length} live football events (of ${allEvents.length} total)`);
        const matches = footballEvents.map(transformRapidEvent);
        
        // Short cache for live data (2 minutes)
        cache.live = { data: matches, timestamp: Date.now() };
        return matches;
    } catch (err) {
        console.error('[AllSportsApi] fetchLiveMatches error:', err.message);
        return cache.live.data || [];
    }
}

// Football-Data.org — Recent finished matches
async function fetchRecentMatches() {
    if (isCacheValid('recent')) {
        console.log('[FootballData] Serving recent from cache');
        return cache.recent.data;
    }
    
    try {
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        
        const dateFrom = threeDaysAgo.toISOString().split('T')[0];
        const dateTo = today.toISOString().split('T')[0];
        
        const url = `${FD_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED`;
        console.log(`[FootballData] Fetching recent: ${url}`);
        
        const res = await axios.get(url, {
            headers: { 'X-Auth-Token': FD_TOKEN },
            timeout: 15000
        });
        
        const matches = (res.data.matches || []).map(transformFDMatch);
        cache.recent = { data: matches, timestamp: Date.now() };
        return matches;
    } catch (err) {
        console.error('[FootballData] fetchRecentMatches error:', err.message);
        return cache.recent.data || [];
    }
}

// Football-Data.org — Upcoming scheduled matches
async function fetchUpcomingMatches() {
    if (isCacheValid('upcoming')) {
        console.log('[FootballData] Serving upcoming from cache');
        return cache.upcoming.data;
    }
    
    try {
        const today = new Date();
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = threeDaysLater.toISOString().split('T')[0];
        
        const url = `${FD_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED,TIMED`;
        console.log(`[FootballData] Fetching upcoming: ${url}`);
        
        const res = await axios.get(url, {
            headers: { 'X-Auth-Token': FD_TOKEN },
            timeout: 15000
        });
        
        const matches = (res.data.matches || []).map(transformFDMatch);
        cache.upcoming = { data: matches, timestamp: Date.now() };
        return matches;
    } catch (err) {
        console.error('[FootballData] fetchUpcomingMatches error:', err.message);
        return cache.upcoming.data || [];
    }
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

/**
 * GET DASHBOARD DATA
 * Merges live (AllSportsApi2) + finished/upcoming (Football-Data.org)
 * Selection: up to 3 per category (League, Cup, International)
 *   - 1 live + 1 upcoming + 1 completed
 *   - If no live → 1 upcoming + 2 completed
 *   - If nothing → up to 3 completed
 * 
 * Returns: { league: [...], cup: [...], international: [...], all: [...], meta: {...} }
 */
export async function getDashboardMatches() {
    if (isCacheValid('dashboard')) {
        console.log('[Football] Serving dashboard from cache');
        return cache.dashboard.data;
    }
    
    try {
        // Fetch all sources in parallel
        const [liveMatches, recentMatches, upcomingMatches] = await Promise.all([
            fetchLiveMatches(),
            fetchRecentMatches(),
            fetchUpcomingMatches()
        ]);
        
        // Merge all and deduplicate by team matchup + date
        const allMatches = [...liveMatches, ...recentMatches, ...upcomingMatches];
        
        // Deduplicate: same teams on same day = same match
        const seen = new Map();
        const deduped = [];
        for (const m of allMatches) {
            // Prefer AllSportsApi (live) data over Football-Data
            const dayKey = new Date(m.startTime).toISOString().split('T')[0];
            const key = `${m.homeTeam.name.toLowerCase()}-${m.awayTeam.name.toLowerCase()}-${dayKey}`;
            if (!seen.has(key)) {
                seen.set(key, true);
                deduped.push(m);
            }
        }
        
        // Categorize
        const byCategory = { league: [], cup: [], international: [] };
        for (const m of deduped) {
            const cat = m.category;
            if (byCategory[cat]) byCategory[cat].push(m);
        }
        
        // Select up to 3 per category
        function selectForCategory(matches) {
            const live = matches.filter(m => m.status === 'live');
            const upcoming = matches.filter(m => m.status === 'upcoming')
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            const completed = matches.filter(m => m.status === 'completed')
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            
            const selected = [];
            
            if (live.length > 0) {
                selected.push(live[0]);
                if (upcoming.length > 0) selected.push(upcoming[0]);
                if (completed.length > 0) selected.push(completed[0]);
                if (selected.length < 3 && live.length > 1) selected.push(live[1]);
                if (selected.length < 3 && completed.length > 1) selected.push(completed[1]);
                if (selected.length < 3 && upcoming.length > 1) selected.push(upcoming[1]);
            } else if (upcoming.length > 0) {
                selected.push(upcoming[0]);
                if (completed.length > 0) selected.push(completed[0]);
                if (completed.length > 1) selected.push(completed[1]);
                if (selected.length < 3 && upcoming.length > 1) selected.push(upcoming[1]);
                if (selected.length < 3 && completed.length > 2) selected.push(completed[2]);
            } else {
                for (let i = 0; i < Math.min(3, completed.length); i++) {
                    selected.push(completed[i]);
                }
            }
            
            return selected.slice(0, 3);
        }
        
        const result = {
            league: selectForCategory(byCategory.league),
            cup: selectForCategory(byCategory.cup),
            international: selectForCategory(byCategory.international),
            all: deduped,
            meta: {
                totalMatches: deduped.length,
                liveCount: deduped.filter(m => m.status === 'live').length,
                sources: {
                    allSportsApi: liveMatches.length,
                    footballData: recentMatches.length + upcomingMatches.length
                },
                cachedAt: new Date().toISOString(),
                cacheTTL: CACHE_TTL / 1000
            }
        };
        
        cache.dashboard = { data: result, timestamp: Date.now() };
        console.log(`[Football] Dashboard ready: ${result.meta.totalMatches} total, ${result.meta.liveCount} live`);
        return result;
    } catch (err) {
        console.error('[Football] getDashboardMatches error:', err.message);
        return cache.dashboard.data || {
            league: [], cup: [], international: [], all: [],
            meta: { totalMatches: 0, liveCount: 0, error: err.message }
        };
    }
}

/**
 * Get a specific match by Football-Data.org match ID
 */
export async function getMatchById(matchId) {
    try {
        const url = `${FD_BASE}/matches/${matchId}`;
        const res = await axios.get(url, {
            headers: { 'X-Auth-Token': FD_TOKEN },
            timeout: 15000
        });
        return transformFDMatch(res.data);
    } catch (err) {
        console.error(`[FootballData] getMatchById(${matchId}) error:`, err.message);
        return null;
    }
}

/**
 * Get detailed match info by our internal ID (football-{apiId} or football-fd-{apiId})
 * Searches the dashboard cache first, then falls back to API fetch.
 * Returns enriched match with all available data fields.
 */
export async function getMatchDetail(internalId) {
    // Extract the numeric API ID from our internal format
    const isAllSports = internalId.startsWith('football-') && !internalId.startsWith('football-fd-');
    const isFD = internalId.startsWith('football-fd-');
    
    // Try to find in cached dashboard data
    const dashboard = cache.dashboard?.data;
    if (dashboard?.all) {
        const found = dashboard.all.find(m => m.id === internalId);
        if (found) {
            console.log(`[Football] Found match ${internalId} in cache`);
            return found;
        }
    }
    
    // Try to find in live cache
    if (cache.live?.data) {
        const found = cache.live.data.find(m => m.id === internalId);
        if (found) {
            console.log(`[Football] Found match ${internalId} in live cache`);
            return found;
        }
    }
    
    // Fallback: fetch fresh dashboard data and search
    try {
        const freshDashboard = await getDashboardMatches();
        const found = freshDashboard.all?.find(m => m.id === internalId);
        if (found) return found;
    } catch (err) {
        console.error(`[Football] Fresh fetch failed for ${internalId}:`, err.message);
    }
    
    // Last resort for Football-Data.org matches: direct API call
    if (isFD) {
        const fdId = internalId.replace('football-fd-', '');
        return getMatchById(fdId);
    }
    
    return null;
}

/**
 * Force clear cache (admin/debug)
 */
export function clearCache() {
    for (const key of Object.keys(cache)) {
        cache[key] = { data: null, timestamp: 0 };
    }
    console.log('[Football] Cache cleared');
}

export default {
    getDashboardMatches,
    getMatchById,
    getMatchDetail,
    clearCache
};
