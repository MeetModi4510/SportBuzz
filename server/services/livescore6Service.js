import axios from 'axios';

const RAPID_HOST = 'livescore6.p.rapidapi.com';
const BASE_URL = `https://${RAPID_HOST}`;

// 30 Minutes TTL
const CACHE_TTL = 30 * 60 * 1000;

// Simple in-memory cache to protect the API quota
const cache = new Map();

function getHeaders() {
    const key = process.env.LIVESCORE6_API_KEY || process.env.API_KEY;
    if (!key) throw new Error('Livescore6 API Key not configured');
    
    return {
        'x-rapidapi-host': RAPID_HOST,
        'x-rapidapi-key': key
    };
}

function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

// Map the livescore6 event object into a consistent format for our frontend
function transformEvent(e) {
    if (!e) return null;
    
    const startTime = e.Esd ? new Date(
        e.Esd.toString().replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6Z")
    ) : new Date();

    let status = 'upcoming';
    // Eps (Event progress status): "NS" = Not Started, "FT" = Full Time, "AP" = After Penalties, 
    // Numbers ("45", "90") or strings ("HT") indicate Live
    const eps = (e.Eps || '').toUpperCase();
    if (['FT', 'AP', 'AET'].includes(eps)) {
        status = 'completed';
    } else if (eps !== 'NS' && eps !== 'POSTP' && eps !== 'CANC') {
        status = 'live';
    }

    return {
        id: e.Eid,
        apiId: e.Eid,
        sport: 'football',
        matchType: e.Tr1C1 ? e.Tr1C1.toString() : 'Football Match', // Tournament code or name
        category: e.Stg?.Cnm || 'Unknown', // Country
        leagueName: e.Stg?.Snm || 'Unknown League', // Stage Name
        homeTeam: {
            id: e.T1?.[0]?.ID,
            name: e.T1?.[0]?.Nm,
            logo: e.T1?.[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${e.T1[0].Img}` : null
        },
        awayTeam: {
            id: e.T2?.[0]?.ID,
            name: e.T2?.[0]?.Nm,
            logo: e.T2?.[0]?.Img ? `https://lsm-static-prod.livescore.com/medium/${e.T2[0].Img}` : null
        },
        homeScore: e.Tr1 || '0',
        awayScore: e.Tr2 || '0',
        status,
        startTime: startTime.toISOString(),
        displayTime: eps === 'NS' 
            ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : eps, // 'FT', '45', 'HT', etc.
    };
}

export async function getLiveMatches() {
    const cacheKey = 'matches_live';
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/matches/v2/list-live`, {
            params: { Category: 'soccer', Timezone: '0' },
            headers: getHeaders(),
            timeout: 10000
        });

        const stages = response.data?.Stages || [];
        let allMatches = [];
        for (const stage of stages) {
            if (stage.Events) {
                // Attach stage info to events so transformEvent can use it
                const events = stage.Events.map(e => ({ ...e, Stg: { Cnm: stage.Cnm, Snm: stage.Snm } }));
                allMatches = allMatches.concat(events);
            }
        }

        const isPriority = (m) => {
            if (!m) return false;
            const league = m.leagueName.toLowerCase();
            const category = m.category.toLowerCase();
            const home = m.homeTeam?.name?.toLowerCase() || '';
            const away = m.awayTeam?.name?.toLowerCase() || '';

            // Exclude Youth and Women
            const excludeKeywords = ['u20', 'u21', 'u19', 'u18', 'u17', 'women', '(w)', 'wfc'];
            for (const word of excludeKeywords) {
                if (league.includes(word) || category.includes(word) || home.includes(word) || away.includes(word)) {
                    return false;
                }
            }

            // Strict checks for priority leagues
            if (league === 'premier league' && category === 'england') return true;
            if ((league.includes('laliga') || league === 'la liga') && category === 'spain') return true;
            if (league === 'ligue 1' && category === 'france') return true;
            if (league === 'bundesliga' && category === 'germany') return true;
            if (league === 'serie a' && category === 'italy') return true;
            if ((league.includes('mls') || league.includes('major league soccer')) && (category === 'usa' || category === 'canada')) return true;
            if (league.includes('saudi pro league')) return true;
            if ((league.includes('pro league') || league.includes('first division a')) && category === 'belgium') return true;
            if (league === 'eredivisie' && category === 'netherlands') return true;
            if (league.includes('indian super league') || league === 'isl') return true;
            
            // International / UEFA
            if (league.includes('champions league')) return true;
            if (league.includes('europa league')) return true;
            if (league.includes('conference league')) return true;
            if (league.includes('world cup') || category.includes('world cup')) return true;
            if (league.includes('euro ') || league === 'euro') return true;
            if (league.includes('copa america')) return true;
            if (league.includes('friendly') || league.includes('friendlies')) return true;

            return false;
        };

        const transformed = allMatches.map(transformEvent).filter(isPriority);
        
        const result = { success: true, fromCache: false, data: transformed, lastFetched: new Date().toISOString() };
        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.error('[Livescore6] getLiveMatches Error:', err.message);
        throw err;
    }
}

export async function getMatchesByDate(dateYYYYMMDD) {
    const cacheKey = `matches_date_${dateYYYYMMDD}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/matches/v2/list-by-date`, {
            params: { Category: 'soccer', Date: dateYYYYMMDD, Timezone: '0' },
            headers: getHeaders(),
            timeout: 15000
        });

        const stages = response.data?.Stages || [];
        let allMatches = [];
        for (const stage of stages) {
            if (stage.Events) {
                // Attach stage info
                const events = stage.Events.map(e => ({ ...e, Stg: { Cnm: stage.Cnm, Snm: stage.Snm } }));
                allMatches = allMatches.concat(events);
            }
        }

        const isPriority = (m) => {
            if (!m) return false;
            const league = m.leagueName.toLowerCase();
            const category = m.category.toLowerCase();
            const home = m.homeTeam?.name?.toLowerCase() || '';
            const away = m.awayTeam?.name?.toLowerCase() || '';

            // Exclude Youth and Women
            const excludeKeywords = ['u20', 'u21', 'u19', 'u18', 'u17', 'women', '(w)', 'wfc'];
            for (const word of excludeKeywords) {
                if (league.includes(word) || category.includes(word) || home.includes(word) || away.includes(word)) {
                    return false;
                }
            }

            // Strict checks for priority leagues
            if (league === 'premier league' && category === 'england') return true;
            if ((league.includes('laliga') || league === 'la liga') && category === 'spain') return true;
            if (league === 'ligue 1' && category === 'france') return true;
            if (league === 'bundesliga' && category === 'germany') return true;
            if (league === 'serie a' && category === 'italy') return true;
            if ((league.includes('mls') || league.includes('major league soccer')) && (category === 'usa' || category === 'canada')) return true;
            if (league.includes('saudi pro league')) return true;
            if ((league.includes('pro league') || league.includes('first division a')) && category === 'belgium') return true;
            if (league === 'eredivisie' && category === 'netherlands') return true;
            if (league.includes('indian super league') || league === 'isl') return true;
            
            // International / UEFA
            if (league.includes('champions league')) return true;
            if (league.includes('europa league')) return true;
            if (league.includes('conference league')) return true;
            if (league.includes('world cup') || category.includes('world cup')) return true;
            if (league.includes('euro ') || league === 'euro') return true;
            if (league.includes('copa america')) return true;
            if (league.includes('friendly') || league.includes('friendlies')) return true;

            return false;
        };

        const transformed = allMatches.map(transformEvent).filter(isPriority);
        
        const result = { success: true, fromCache: false, data: transformed, lastFetched: new Date().toISOString() };
        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.error(`[Livescore6] getMatchesByDate(${dateYYYYMMDD}) Error:`, err.message);
        throw err;
    }
}

export async function getMatchDetail(endpoint, matchId) {
    const validEndpoints = ['get-info', 'get-commentary', 'get-incidents', 'get-lineups', 'get-statistics', 'get-scoreboard'];
    if (!validEndpoints.includes(endpoint)) {
        throw new Error('Invalid endpoint');
    }

    const cacheKey = `match_${matchId}_${endpoint}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/matches/v2/${endpoint}`, {
            params: { Category: 'soccer', Eid: matchId },
            headers: getHeaders(),
            timeout: 10000
        });

        const result = { success: true, fromCache: false, data: response.data, lastFetched: new Date().toISOString() };
        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.error(`[Livescore6] ${endpoint}(${matchId}) Error:`, err.message);
        throw err;
    }
}

export default {
    getLiveMatches,
    getMatchesByDate,
    getMatchDetail
};
