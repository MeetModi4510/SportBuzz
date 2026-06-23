/**
 * Football Data Service — Sofascore Integration
 * 
 * Fetches Live, Upcoming, and Completed football matches from Sofascore.
 * Includes a robust 15-minute caching mechanism to respect API limits.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const RAPID_API_HOST = 'sofascore.p.rapidapi.com';
const RAPID_BASE = `https://${RAPID_API_HOST}`;

// Read key dynamically so hot-reload / env changes work without restart
function getHeaders() {
    const key = process.env.FOOTBALL_RAPIDAPI_KEY;
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
    17,   // Premier League
    8,    // LaLiga
    23,   // Serie A
    35,   // Bundesliga
    34,   // Ligue 1
    37,   // Eredivisie
    38,   // Belgian Pro League
    1900, // Indian Super League
    851,  // International Friendly Games
    242,  // MLS
    955   // Saudi Pro League
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
        const allEvents = res.data?.events || [];
        // Filter strictly by the requested TOP_TOURNAMENTS
        const filteredEvents = allEvents.filter(event => TOP_TOURNAMENTS.includes(event.tournament?.uniqueTournament?.id));
        console.log(`[Sofascore] fetchLiveEvents: got ${allEvents.length} events, filtered to ${filteredEvents.length}`);
        return filteredEvents.map(transformSofascoreEvent).filter(Boolean);
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

    // Fetch upcoming and completed exclusively for top tournaments
    const nextMatchesPromises = TOP_TOURNAMENTS.map(tId => fetchNextMatches(tId));
    const completedPromises = TOP_TOURNAMENTS.map(tId => fetchLastMatches(tId, seasons[tId]));

    const [nextResults, completedResults] = await Promise.all([
        Promise.all(nextMatchesPromises),
        Promise.all(completedPromises)
    ]);

    // Flatten arrays
    const upcomingMatches = nextResults.flat().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
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
    // Basic cache implementation for match details (15 min TTL)
    const cacheKey = `detail_${internalId}`;
    if (isCacheValid(cacheKey)) return cache[cacheKey].data;

    if (!internalId || !internalId.startsWith('football-')) return null;
    const matchId = internalId.replace('football-', '');

    try {
        // Fetch all specific match details in parallel
        const h = getHeaders();
        const [detailRes, lineupsRes, statsRes, incidentsRes, graphRes, playerStatsRes, playerHeatmapRes] = await Promise.allSettled([
            axios.get(`${RAPID_BASE}/matches/detail`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-lineups`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-statistics`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-incidents`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-graph`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-player-statistics`, { headers: h, params: { matchId }, timeout: 10000 }),
            axios.get(`${RAPID_BASE}/matches/get-player-heatmap`, { headers: h, params: { matchId }, timeout: 10000 })
        ]);

        const event = detailRes.status === 'fulfilled' ? detailRes.value.data?.event : null;
        if (!event) return null;

        const baseMatch = transformSofascoreEvent(event);
        
        const matchData = {
            ...baseMatch,
            details: {
                lineups: lineupsRes.status === 'fulfilled' ? lineupsRes.value.data : null,
                statistics: statsRes.status === 'fulfilled' ? statsRes.value.data?.statistics : null,
                incidents: incidentsRes.status === 'fulfilled' ? incidentsRes.value.data?.incidents : null,
                graph: graphRes.status === 'fulfilled' ? graphRes.value.data?.graph : null,
                playerStatistics: playerStatsRes.status === 'fulfilled' ? playerStatsRes.value.data?.statistics : null,
                playerHeatmap: playerHeatmapRes.status === 'fulfilled' ? playerHeatmapRes.value.data?.heatmap : null
            }
        };

        // Store in cache
        cache[cacheKey] = { data: matchData, timestamp: Date.now() };
        
        return matchData;
    } catch (err) {
        console.error(`[Sofascore] getMatchDetail(${matchId}) error:`, err.message);
        return null;
    }
}

export async function getGlobalFootballNews() {
    // Return high-quality mock data for the UI
    return [
        {
            id: 1,
            title: "Real Madrid secure stunning comeback victory in Champions League",
            summary: "Los Blancos score two late goals to overcome a resilient defensive display, securing their spot in the next round.",
            image: "https://images.unsplash.com/photo-1518605368461-1e1e127cc481?q=80&w=600&auto=format&fit=crop",
            source: "Football Daily",
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            title: "Premier League Title Race Heats Up as Top Three Win",
            summary: "Arsenal, Liverpool, and Manchester City all secure crucial victories this weekend to keep the title race wide open.",
            image: "https://images.unsplash.com/photo-1486286701208-1d58e82b7db5?q=80&w=600&auto=format&fit=crop",
            source: "Sports Buzz",
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            title: "Managerial Shakeup: Historic Club Parts Ways with Head Coach",
            summary: "Following a string of disappointing results, the board has decided to make a change ahead of the crucial derby.",
            image: "https://images.unsplash.com/photo-1516731415730-0c37489ebce9?q=80&w=600&auto=format&fit=crop",
            source: "Global Soccer News",
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 4,
            title: "Record Breaking Transfer Almost Complete",
            summary: "The highly anticipated move of the summer is reportedly in its final stages with medicals scheduled for tomorrow.",
            image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
            source: "Transfer Expert",
            publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ];
}


export async function getFootballLiveNews() {
    const cacheKey = 'footballLiveNews';
    const TTL = 60 * 60 * 1000; // 1 hour cache
    if (cache[cacheKey]?.data && (Date.now() - cache[cacheKey].timestamp) < TTL) {
        return cache[cacheKey].data;
    }

    try {
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
        
        // Fetch page 1 (latest) and page 2 (for "show more" functionality)
        const [page1Res, page2Res] = await Promise.all([
            axios.get('https://www.fotmob.com/api/worldnews?page=1', { headers, timeout: 10000 }),
            axios.get('https://www.fotmob.com/api/worldnews?page=2', { headers, timeout: 10000 })
        ]);
        
        const page1Data = Array.isArray(page1Res.data) ? page1Res.data : [];
        const page2Data = Array.isArray(page2Res.data) ? page2Res.data : [];
        
        // Combine arrays and ensure it's sorted timeline fashion (latest first)
        let newsData = [...page1Data, ...page2Data];
        newsData.sort((a, b) => new Date(b.gmtTime).getTime() - new Date(a.gmtTime).getTime());
        
        cache[cacheKey] = { data: newsData, timestamp: Date.now() };
        return newsData;
    } catch (err) {
        console.error('[Football Live News] Error fetching:', err.message);
        // Fallback to cache if exists even if expired
        if (cache[cacheKey]?.data) return cache[cacheKey].data;
        return [];
    }
}

export async function getFootballNewsArticle(url) {
    if (!url) return [];
    const cacheKey = `football_news_article_${url}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp) < 24 * 60 * 60 * 1000) {
        return cache[cacheKey].data;
    }

    try {
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
        let targetUrl = url.startsWith('/') ? `https://www.fotmob.com${url}` : url;

        // If it's a FotMob embed URL, we need to extract the actual external source URL
        if (targetUrl.includes('fotmob.com/embed/news/')) {
            try {
                const { data: embedData } = await axios.get(targetUrl, { headers, timeout: 8000 });
                const $ = cheerio.load(embedData);
                const nextDataStr = $('#__NEXT_DATA__').html();
                if (nextDataStr) {
                    const nextData = JSON.parse(nextDataStr);
                    if (nextData.props?.pageProps?.data?.src) {
                        targetUrl = nextData.props.pageProps.data.src;
                    }
                }
            } catch (e) {
                console.warn('[Football News Article] Failed to unwrap FotMob embed URL', e.message);
            }
        }

        // Fetch the actual article (whether it's the external site or direct link)
        const { data: articleHtml } = await axios.get(targetUrl, { headers, timeout: 8000 });
        const $ = cheerio.load(articleHtml);

        const paragraphs = [];
        $('p').each((i, el) => {
            const text = $(el).text().trim();
            const lowerText = text.toLowerCase();
            // Filter out short UI elements, copyright notices, and generic nav/promo text
            const isPromo = lowerText.includes('sign up') || 
                            lowerText.includes('subscribe') || 
                            lowerText.includes('exclusive stats') ||
                            lowerText.includes('updates from');
                            
            if (text.length > 50 && !lowerText.includes('copyright') && !isPromo) {
                paragraphs.push(text);
            }
        });

        cache[cacheKey] = { data: paragraphs, timestamp: Date.now() };
        return paragraphs;
    } catch (err) {
        console.error('[Football News Article] Error fetching article:', err.message);
        if (cache[cacheKey]) return cache[cacheKey].data;
        return [];
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
    getGlobalFootballNews,
    getFootballLiveNews,
    clearCache
};
