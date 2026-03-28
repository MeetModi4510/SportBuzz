import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachFlagsToMatch } from './flagService.js';

// Fix for ES module hoisting & ensuring server/.env is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Prioritize CRICKETDATA_KEY from server/.env, fallback to VITE key if needed
const API_KEY = process.env.CRICKETDATA_KEY || process.env.VITE_CRICKETDATA_API_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

if (!API_KEY) {
    console.error('[API ERROR] CricketData API Key is MISSING in environment variables!');
} else {
    console.log('[API INFO] Using API Key (last 4 digits):', API_KEY.slice(-4));
}

// Cache configuration
// stdTTL: standard time to live in seconds
const cache = new NodeCache({ stdTTL: 600 }); // Default 10 minutes

// API Endpoints
const ENDPOINTS = {
    COUNTRIES: '/countries',
    SERIES: '/series',
    MATCHES: '/matches',
    CURRENT_MATCHES: '/currentMatches',
    SERIES_INFO: '/series_info',
    MATCH_INFO: '/match_info',
    PLAYERS: '/players',
    PLAYER_INFO: '/players_info',
};

// Helper function to fetch data with caching
const fetchWithCache = async (endpoint, params = {}, ttl = 600) => {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        console.log(`[CACHE HIT] ${endpoint}`);
        return cachedData;
    }

    console.log(`[API CALL] Fetching ${endpoint} from CricketData.org`);

    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            params: {
                apikey: API_KEY,
                offset: 0,
                ...params,
            },
        });

        const data = response.data;

        // Only cache if successful response
        if (data.status === 'success' || data.data) {
            cache.set(cacheKey, data, ttl);
            return data;
        } else {
            console.warn(`[API WARNING] ${endpoint} failed:`, data.status, '-', data.reason || 'No reason provided');
            return data;
        }

    } catch (error) {
        console.error(`[API ERROR] ${endpoint}:`, error.message);
        throw error;
    }
};

// Helper: Convert UTC to IST
const convertUTCtoIST = (utcDateTime) => {
    if (!utcDateTime) return "";
    try {
        // CricketData sometimes sends "2024-02-08T05:30:00" without Z.
        // If we parse this locally, it treats it as local time (IST already).
        // We MUST force it to be treated as UTC by appending Z if missing.
        let timeStr = utcDateTime;
        if (typeof timeStr === 'string' && !timeStr.endsWith('Z') && !timeStr.includes('+')) {
            timeStr += 'Z';
        }

        return new Date(timeStr).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch (e) {
        return utcDateTime;
    }
};

// Helper: Enrich match object with displayTime
const enrichMatch = (match) => {
    if (!match) return match;
    // User Requirement: Always prioritize dateTimeGMT for accurate IST start time
    const utcTime = match.dateTimeGMT || match.start_time || match.scheduled_time || match.dateTime || match.date;

    // Attach flags using consistent logic (State -> API / Intl -> Flagpedia)
    const matchWithFlags = attachFlagsToMatch(match);

    return {
        ...matchWithFlags,
        displayTime: convertUTCtoIST(utcTime)
    };
};

// Helper: Enrich a list of matches
const enrichMatches = (matches) => {
    if (!Array.isArray(matches)) return matches;
    return matches.map(enrichMatch);
};


// Service methods
export const cricketService = {
    // Cache for 24 hours (86400 seconds)
    getCountries: async () => {
        return await fetchWithCache(ENDPOINTS.COUNTRIES, {}, 86400);
    },

    // Cache for 1 hour
    getSeriesList: async (searchParams = {}) => {
        return await fetchWithCache(ENDPOINTS.SERIES, searchParams, 3600);
    },

    // Cache for 10 minutes (600 seconds)
    getCurrentMatches: async () => {
        const data = await fetchWithCache(ENDPOINTS.CURRENT_MATCHES, {}, 600);
        if (data && data.data) {
            data.data = enrichMatches(data.data);
        }
        return data;
    },

    // Cache for 10 minutes (600 seconds)
    getAllMatches: async () => {
        const data = await fetchWithCache(ENDPOINTS.MATCHES, {}, 600);
        if (data && data.data) {
            data.data = enrichMatches(data.data);
        }
        return data;
    },

    // Cache for 10 minutes (600 seconds)
    getMatchInfo: async (id) => {
        // 1. Check if it's a local MongoDB match
        if (id && typeof id === 'string' && id.length >= 24 && /^[0-9a-fA-F]+$/.test(id)) {
            try {
                // Import dynamically to avoid circular dependencies if any
                const { default: mongoose } = await import('mongoose');
                const { default: Match } = await import('../models/Match.js');

                if (mongoose.Types.ObjectId.isValid(id)) {
                    const localMatch = await Match.findById(id).populate('homeTeam awayTeam tournament');
                    if (localMatch) {
                        const obj = localMatch.toObject();
                        // Format for compatibility with frontend mapper
                        const data = {
                            id: obj._id.toString(),
                            status: obj.status,
                            matchType: obj.matchType || 'Cricket',
                            venue: obj.venue,
                            dateTimeGMT: obj.date,
                            teams: [obj.homeTeam?.name || 'Home', obj.awayTeam?.name || 'Away'],
                            teamInfo: [
                                { name: obj.homeTeam?.name || 'Home', shortname: obj.homeTeam?.acronym },
                                { name: obj.awayTeam?.name || 'Away', shortname: obj.awayTeam?.acronym }
                            ],
                            matchStarted: obj.status !== 'Upcoming',
                            matchEnded: obj.status === 'Completed',
                            homeLineup: obj.homeLineup,
                            awayLineup: obj.awayLineup,
                            score: [
                                { inning: 'Innings 1', r: obj.score?.team1?.runs, w: obj.score?.team1?.wickets, o: obj.score?.team1?.overs },
                                { inning: 'Innings 2', r: obj.score?.team2?.runs, w: obj.score?.team2?.wickets, o: obj.score?.team2?.overs }
                            ]
                        };
                        return { status: 'success', data: enrichMatch(data) };
                    }
                }
            } catch (err) {
                console.warn(`[API INFO] Local match fetch failed for ${id}, falling back to external...`, err.message);
            }
        }

        const data = await fetchWithCache(ENDPOINTS.MATCH_INFO, { id }, 600);

        // If match is completed, update cache TTL to 1 hour (hacky way to extend TTL for completed matches)
        if (data?.data?.status === 'Match Ended') {
            const cacheKey = `${ENDPOINTS.MATCH_INFO}_${JSON.stringify({ id })}`;
            cache.ttl(cacheKey, 3600);
        }

        if (data && data.data) {
            data.data = enrichMatch(data.data);
        }
        return data;
    },

    // Cache for 24 hours
    getPlayerInfo: async (id) => {
        return await fetchWithCache(ENDPOINTS.PLAYER_INFO, { id }, 86400);
    },

    // Cache for 24 hours
    getSeriesInfo: async (id) => {
        const data = await fetchWithCache(ENDPOINTS.SERIES_INFO, { id }, 86400);
        if (data && data.data && data.data.matchList) {
            data.data.matchList = enrichMatches(data.data.matchList);
        }
        return data;
    },

    // T20 World Cup 2026 - Cache for 1 minute (live data)
    getWorldCupMatches: async () => {
        const WORLD_CUP_SERIES_ID = '0cdf6736-ad9b-4e95-a647-5ee3a99c5510';
        const data = await fetchWithCache(ENDPOINTS.SERIES_INFO, { id: WORLD_CUP_SERIES_ID }, 600);
        return enrichMatches(data?.data?.matchList || []);
    },

    // U19 World Cup (ODI)
    getU19WorldCupMatches: async () => {
        const U19_WC_SERIES_ID = '49595b4b-3f70-4be4-917a-ca3492bea793';
        const data = await fetchWithCache(ENDPOINTS.SERIES_INFO, { id: U19_WC_SERIES_ID }, 600);
        return enrichMatches(data?.data?.matchList || []);
    },

    // Ranji Trophy (Test)
    getRanjiTrophyMatches: async () => {
        const RANJI_SERIES_ID = '29820ef2-3cb5-46fe-9c1e-962377d11174';
        const data = await fetchWithCache(ENDPOINTS.SERIES_INFO, { id: RANJI_SERIES_ID }, 600);
        return enrichMatches(data?.data?.matchList || []);
    },

    // Dynamically discover and fetch matches from active international/major series
    getActiveSeriesMatches: async () => {
        try {
            console.log('[DEBUG] getActiveSeriesMatches: Starting discovery...');
            
            // 1. Fetch current matches list (standard endpoint)
            const currentMatchesRes = await fetchWithCache(ENDPOINTS.CURRENT_MATCHES, {}, 600);
            const currentMatches = Array.isArray(currentMatchesRes?.data) ? currentMatchesRes.data : [];

            // 2. Fetch series list to find other active series (offset 0 and 25 to cover major ones)
            const [page1, page2] = await Promise.all([
                fetchWithCache(ENDPOINTS.SERIES, { offset: 0 }, 3600),
                fetchWithCache(ENDPOINTS.SERIES, { offset: 25 }, 3600)
            ]);

            const allSeries = [...(page1?.data || []), ...(page2?.data || [])];
            const today = new Date();
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            const oneWeekFromNow = new Date(today);
            oneWeekFromNow.setDate(today.getDate() + 7);
            
            // Filter for series that are active "near" today or match priority keywords
            const PRIORITY_KEYWORDS = ['pakistan', 'bangladesh', 'india', 'australia', 'england', 'south africa', 'west indies', 'sri lanka', 'afghanistan', 'world cup', 't20 world cup', 'trophy'];

            const targetSeries = allSeries.filter(s => {
                const name = (s.name || '').toLowerCase();
                const isPriority = PRIORITY_KEYWORDS.some(k => name.includes(k));
                
                const start = new Date(s.startDate);
                let endDateStr = s.endDate || s.startDate;
                
                // If endDate doesn't have a year (e.g., "Mar 15"), append the year from startDate
                if (endDateStr && !endDateStr.match(/\d{4}/)) {
                    const startYear = start.getFullYear();
                    endDateStr = `${endDateStr}, ${startYear}`;
                }
                
                const end = new Date(endDateStr);
                
                // Broaden active window: series start/end within +/- 15 days of today
                const broadStart = new Date(today);
                broadStart.setDate(today.getDate() - 15);
                const broadEnd = new Date(today);
                broadEnd.setDate(today.getDate() + 15);
                
                const isRecent = (start <= broadEnd && end >= broadStart);
                
                return isPriority && isRecent;
            });

            console.log(`[DEBUG] Found ${targetSeries.length} potential series to check.`);

            // 3. Fetch matches for these target series
            const seriesMatches = await Promise.all(targetSeries.map(async (s) => {
                const res = await fetchWithCache(ENDPOINTS.SERIES_INFO, { id: s.id }, 600);
                return (res?.data?.matchList || []).map(m => ({ ...m, series_id: s.id, series_name: s.name }));
            }));

            // Flatten
            const flattenedMatches = seriesMatches.flat();
            
            // Filter matches to those near today (within +/- 3 days) to avoid too much future/past data
            const matchDiscoveryWindow = 3; // days
            const recentMatches = flattenedMatches.filter(m => {
                const mDate = new Date(m.date);
                const diffDays = Math.abs((mDate - today) / (1000 * 60 * 60 * 24));
                return diffDays <= matchDiscoveryWindow;
            });

            console.log(`[DEBUG] Flattened ${flattenedMatches.length} matches, filtered to ${recentMatches.length} near today.`);

            // 4. Merge and Deduplicate by ID
            const matchMap = new Map();
            [...currentMatches, ...recentMatches].forEach(m => {
                if (m.id) {
                    const existing = matchMap.get(m.id);
                    // Prioritize currentMatches for live data if available
                    matchMap.set(m.id, { ...(existing || {}), ...m });
                }
            });

            return enrichMatches(Array.from(matchMap.values()));
        } catch (error) {
            console.error('[API ERROR] getActiveSeriesMatches failed:', error.message);
            return [];
        }
    }
}
