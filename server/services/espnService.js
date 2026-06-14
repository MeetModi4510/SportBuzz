import axios from 'axios';
import NodeCache from 'node-cache';

// Cache for 5 minutes (scoreboard) and 30 minutes (details)
const cache = new NodeCache({ stdTTL: 300 });

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

const TOP_LEAGUES = [
    { id: 'eng.1', name: 'Premier League' },
    { id: 'esp.1', name: 'La Liga' },
    { id: 'ger.1', name: 'Bundesliga' },
    { id: 'ita.1', name: 'Serie A' },
    { id: 'fra.1', name: 'Ligue 1' },
    { id: 'uefa.champions', name: 'Champions League' },
    { id: 'uefa.europa', name: 'Europa League' },
    { id: 'fifa.world', name: 'World Cup 2026' },
    { id: 'fifa.worldq.conmebol', name: 'World Cup Qual. CONMEBOL' },
    { id: 'fifa.worldq.uefa', name: 'World Cup Qual. UEFA' },
    { id: 'conmebol.america', name: 'Copa America' },
    { id: 'uefa.euro', name: 'Euro 2024' }
];

function formatDateParam(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}


function normalizeEspnMatch(event, leagueName) {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');

    // ESPN's status.type.name gives things like 'STATUS_FINAL', 'STATUS_IN_PROGRESS'
    const statusType = event.status.type.name;
    
    let mappedStatus = 'upcoming';
    const state = event.status?.type?.state;
    if (state === 'in') {
        mappedStatus = 'inprogress';
    } else if (state === 'post') {
        mappedStatus = 'finished';
    } else if (statusType.includes('CANCELED') || statusType.includes('POSTPONED')) {
        mappedStatus = 'canceled';
    }

    return {
        id: event.id,
        leagueName: leagueName, // Used directly by LivescoreMatchCard
        category: comp.venue?.fullName || 'TBA', // Mapped to category for venue display
        tournament: {
            name: leagueName,
            id: event.season?.type || 'league'
        },
        homeTeam: {
            name: home.team.name,
            shortName: home.team.abbreviation,
            id: home.team.id,
            logo: `https://a.espncdn.com/i/teamlogos/soccer/500/${home.team.id}.png`
        },
        awayTeam: {
            name: away.team.name,
            shortName: away.team.abbreviation,
            id: away.team.id,
            logo: `https://a.espncdn.com/i/teamlogos/soccer/500/${away.team.id}.png`
        },
        homeScore: home.score,
        awayScore: away.score,
        status: mappedStatus,
        statusCode: statusType,
        statusDetail: event.status.type.detail, // e.g. "FT", "85'", "Sat, 3:00 PM"
        startTime: event.date
    };
}

async function fetchLeagueMatches(leagueId, datesStr) {
    try {
        const res = await axios.get(`${BASE_URL}/${leagueId}/scoreboard`, {
            params: datesStr ? { dates: datesStr } : {}
        });
        const events = res.data?.events || [];
        const leagueName = res.data?.leagues?.[0]?.name || 'Unknown';
        return events.map(e => normalizeEspnMatch(e, leagueName));
    } catch (error) {
        console.error(`Error fetching ESPN scoreboard for ${leagueId}:`, error.message);
        return [];
    }
}

export async function getLiveMatches() {
    const cacheKey = `espn_live_matches`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const promises = TOP_LEAGUES.map(league => fetchLeagueMatches(league.id));
    const results = await Promise.allSettled(promises);
    
    let allMatches = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .filter(Boolean);
        
    // Filter strictly for live
    const liveMatches = allMatches.filter(m => m.status === 'inprogress');
    
    cache.set(cacheKey, liveMatches, 60); // 1 minute cache for live
    return liveMatches;
}

export async function getUpcomingMatches() {
    const cacheKey = `espn_upcoming_matches`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const now = new Date();
    // Use a 1-day buffer backwards to ensure we don't miss matches that are "Upcoming" in IST but still "Yesterday" in ESPN's timezone (EST)
    const yesterday = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    const datesStr = `${formatDateParam(yesterday)}-${formatDateParam(twoDaysFromNow)}`;

    const promises = TOP_LEAGUES.map(league => fetchLeagueMatches(league.id, datesStr));
    const results = await Promise.allSettled(promises);
    
    let allMatches = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .filter(Boolean);
        
    const upcomingMatches = allMatches
        .filter(m => m.status === 'upcoming')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 60);
        
    cache.set(cacheKey, upcomingMatches, 300);
    return upcomingMatches;
}

export async function getRecentMatches() {
    const cacheKey = `espn_recent_matches`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const now = new Date();
    // Use a 3-day window back and 1-day window forward to cover timezone differences
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const tomorrow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    
    const datesStr = `${formatDateParam(threeDaysAgo)}-${formatDateParam(tomorrow)}`;

    const promises = TOP_LEAGUES.map(league => fetchLeagueMatches(league.id, datesStr));
    const results = await Promise.allSettled(promises);
    
    let allMatches = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .filter(Boolean);
        
    const recentMatches = allMatches
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // sort desc
        .slice(0, 60);
        
    cache.set(cacheKey, recentMatches, 300);
    return recentMatches;
}

export async function getMatchDetail(matchId) {
    const cacheKey = `espn_match_${matchId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        let res;
        try {
            res = await axios.get(`${BASE_URL}/fifa.world/summary`, { params: { event: matchId } });
        } catch (e) {
            res = await axios.get(`${BASE_URL}/eng.1/summary`, { params: { event: matchId } });
        }
        
        const data = res.data;
        cache.set(cacheKey, data, 300); // Reverted back to 300 seconds as requested
        return data;
    } catch (error) {
        console.error(`Error fetching ESPN summary for ${matchId}:`, error.message);
        throw error;
    }
}
