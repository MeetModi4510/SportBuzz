/**
 * Football Data Service — Sofascore Integration
 * 
 * Fetches Live, Upcoming, and Completed football matches from Sofascore.
 * Includes a robust 15-minute caching mechanism to respect API limits.
 */

import axios from 'axios';

const RAPID_API_HOST = 'sofascore.p.rapidapi.com';
const RAPID_BASE = `https://${RAPID_API_HOST}`;

// Read key dynamically so hot-reload / env changes work without restart
function getHeaders() {
    const key = process.env.FOOTBALL_RAPIDAPI_KEY || 'ea08b9a9d5msh0ce1b811a3294e7p19b61bjsnb06b82498cf2';
    return {
        'x-rapidapi-key': key,
        'x-rapidapi-host': RAPID_API_HOST
    };
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const cache = {
    dashboard: { data: null, timestamp: 0 },
    categorized: { data: null, timestamp: 0 },
    seasons: { data: {}, timestamp: 0 } // Cache current seasonId for top tournaments
};

const TOP_TOURNAMENTS = [
    17, // Premier League
    8,  // La Liga
    23, // Serie A
    35, // Bundesliga
    7   // Champions League
];

function isCacheValid(key) {
    return cache[key]?.data && (Date.now() - cache[key].timestamp) < CACHE_TTL;
}

// ════════════════════════════════════════════════════════════════
// TRANSFORMATIONS
// ════════════════════════════════════════════════════════════════

function transformSofascoreEvent(event) {
    if (!event) return null;

    let appStatus = 'upcoming';
    const type = event.status?.type?.toLowerCase() || '';
    if (type === 'inprogress') appStatus = 'live';
    else if (type === 'finished') appStatus = 'completed';

    const homeId = event.homeTeam?.id || '';
    const awayId = event.awayTeam?.id || '';
    
    const startTime = event.startTimestamp ? new Date(event.startTimestamp * 1000) : new Date();

    return {
        id: `football-${event.id}`,
        apiId: event.id,
        source: 'sofascore',
        sport: 'football',
        matchType: event.tournament?.name || 'Football',
        competitionCode: event.tournament?.uniqueTournament?.slug || '',
        competitionEmblem: event.tournament?.uniqueTournament?.id ? `https://api.sofascore.app/api/v1/unique-tournament/${event.tournament.uniqueTournament.id}/image` : null,
        category: event.tournament?.category?.name || 'league',
        homeTeam: {
            id: `ft-${homeId}`,
            name: event.homeTeam?.name || 'Home',
            shortName: event.homeTeam?.shortName || event.homeTeam?.nameCode || 'HOM',
            logo: homeId ? `https://api.sofascore.app/api/v1/team/${homeId}/image` : null,
            primaryColor: event.homeTeam?.teamColors?.primary || '#333333'
        },
        awayTeam: {
            id: `ft-${awayId}`,
            name: event.awayTeam?.name || 'Away',
            shortName: event.awayTeam?.shortName || event.awayTeam?.nameCode || 'AWY',
            logo: awayId ? `https://api.sofascore.app/api/v1/team/${awayId}/image` : null,
            primaryColor: event.awayTeam?.teamColors?.primary || '#666666'
        },
        homeScore: event.homeScore?.current !== undefined ? String(event.homeScore.current) : '',
        awayScore: event.awayScore?.current !== undefined ? String(event.awayScore.current) : '',
        status: appStatus,
        venue: {
            name: event.venue?.name || event.venue?.stadium?.name || 'Stadium',
            city: event.venue?.city?.name || ''
        },
        startTime: startTime.toISOString(),
        displayTime: startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST',
        currentMinute: event.status?.description === 'Halftime' ? 'HT' : '', // Can be enhanced based on status
        summaryText: appStatus === 'completed' ? `${event.homeScore?.current > event.awayScore?.current ? event.homeTeam?.name : event.homeScore?.current < event.awayScore?.current ? event.awayTeam?.name : 'Match'} ${event.homeScore?.current === event.awayScore?.current ? 'drawn' : 'won'} ${event.homeScore?.current}-${event.awayScore?.current}` : '',
        score: {
            home: event.homeScore?.current,
            away: event.awayScore?.current
        },
        lastUpdated: new Date().toISOString()
    };
}

// ════════════════════════════════════════════════════════════════
// API CALLS
// ════════════════════════════════════════════════════════════════

async function fetchLiveEvents() {
    try {
        const res = await axios.get(`${RAPID_BASE}/tournaments/get-live-events`, { headers: getHeaders(), params: { sport: 'football' }, timeout: 15000 });
        const events = res.data?.events || [];
        console.log(`[Sofascore] fetchLiveEvents: got ${events.length} events`);
        return events.map(transformSofascoreEvent).filter(Boolean);
    } catch (err) {
        console.error('[Sofascore] fetchLiveEvents error:', err.message);
        return [];
    }
}

async function fetchCurrentSeasons() {
    // Only fetch if cache is invalid or missing top tournaments
    if (Date.now() - cache.seasons.timestamp < CACHE_TTL && Object.keys(cache.seasons.data).length >= TOP_TOURNAMENTS.length) {
        return cache.seasons.data;
    }

    const seasons = { ...cache.seasons.data };
    for (const tId of TOP_TOURNAMENTS) {
        if (seasons[tId]) continue;
        try {
            const res = await axios.get(`${RAPID_BASE}/tournaments/get-seasons`, { headers: getHeaders(), params: { tournamentId: tId }, timeout: 10000 });
            if (res.data?.seasons?.length > 0) {
                seasons[tId] = res.data.seasons[0].id;
            }
        } catch (err) {
            console.error(`[Sofascore] fetchCurrentSeasons (${tId}) error:`, err.message);
        }
    }
    
    cache.seasons = { data: seasons, timestamp: Date.now() };
    return seasons;
}

async function fetchNextMatches(tournamentId) {
    try {
        const res = await axios.get(`${RAPID_BASE}/tournaments/get-next-matches`, { headers: getHeaders(), params: { tournamentId }, timeout: 10000 });
        return (res.data?.events || []).map(transformSofascoreEvent).filter(Boolean);
    } catch (err) {
        return [];
    }
}

async function fetchLastMatches(tournamentId, seasonId) {
    if (!seasonId) return [];
    try {
        const res = await axios.get(`${RAPID_BASE}/tournaments/get-last-matches`, { headers: getHeaders(), params: { tournamentId, seasonId }, timeout: 10000 });
        return (res.data?.events || []).map(transformSofascoreEvent).filter(Boolean);
    } catch (err) {
        return [];
    }
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

export async function getDashboardMatches() {
    if (isCacheValid('dashboard')) return cache.dashboard.data;

    const liveMatches = await fetchLiveEvents();
    
    const result = {
        live: liveMatches, // Dashboard only needs live matches
        meta: {
            totalLive: liveMatches.length,
            cachedAt: new Date().toISOString()
        }
    };

    cache.dashboard = { data: result, timestamp: Date.now() };
    return result;
}

export async function getCategorizedMatches() {
    if (isCacheValid('categorized')) return cache.categorized.data;

    const [liveMatches, seasons] = await Promise.all([
        fetchLiveEvents(),
        fetchCurrentSeasons()
    ]);

    // Fetch upcoming and completed for top tournaments
    const upcomingPromises = TOP_TOURNAMENTS.map(tId => fetchNextMatches(tId));
    const completedPromises = TOP_TOURNAMENTS.map(tId => fetchLastMatches(tId, seasons[tId]));

    const [upcomingResults, completedResults] = await Promise.all([
        Promise.all(upcomingPromises),
        Promise.all(completedPromises)
    ]);

    // Flatten arrays
    const upcomingMatches = upcomingResults.flat().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const completedMatches = completedResults.flat().sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Deduplicate (Sofascore gives us unique IDs so this is easier)
    const uniqueUpcoming = Array.from(new Map(upcomingMatches.map(m => [m.apiId, m])).values());
    const uniqueCompleted = Array.from(new Map(completedMatches.map(m => [m.apiId, m])).values());

    const result = {
        live: liveMatches,
        upcoming: uniqueUpcoming.slice(0, 50), // Limit to top 50
        completed: uniqueCompleted.slice(0, 50),
        meta: { cachedAt: new Date().toISOString() }
    };

    cache.categorized = { data: result, timestamp: Date.now() };
    return result;
}

export async function getMatchDetail(internalId) {
    if (!internalId || !internalId.startsWith('football-')) return null;
    const matchId = internalId.replace('football-', '');

    try {
        // Fetch all specific match details in parallel
        const h = getHeaders();
        const [detailRes, lineupsRes, statsRes, incidentsRes, graphRes] = await Promise.allSettled([
            axios.get(`${RAPID_BASE}/matches/detail`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-lineups`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-statistics`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-incidents`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-graph`, { headers: h, params: { matchId }, timeout: 10000 })
        ]);

        const event = detailRes.status === 'fulfilled' ? detailRes.value.data?.event : null;
        if (!event) return null;

        const baseMatch = transformSofascoreEvent(event);
        
        return {
            ...baseMatch,
            details: {
                lineups: lineupsRes.status === 'fulfilled' ? lineupsRes.value.data : null,
                statistics: statsRes.status === 'fulfilled' ? statsRes.value.data?.statistics : null,
                incidents: incidentsRes.status === 'fulfilled' ? incidentsRes.value.data?.incidents : null,
                graph: graphRes.status === 'fulfilled' ? graphRes.value.data?.graph : null
            }
        };
    } catch (err) {
        console.error(`[Sofascore] getMatchDetail(${matchId}) error:`, err.message);
        return null;
    }
}

export function clearCache() {
    for (const key of Object.keys(cache)) {
        cache[key] = { data: null, timestamp: 0 };
    }
    console.log('[Football] Cache cleared');
}

export default {
    getDashboardMatches,
    getCategorizedMatches,
    getMatchDetail,
    clearCache
};
