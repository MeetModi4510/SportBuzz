import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachFlagsToMatch } from './flagService.js';
import { cricbuzzService } from './cricbuzzService.js';

// Fix for ES module hoisting
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Helper: Convert UTC to IST
const convertUTCtoIST = (utcDateTime) => {
    if (!utcDateTime) return "";
    try {
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

// Helper: Enrich match object with displayTime and flags
const enrichMatch = (match) => {
    if (!match) return match;
    const matchWithFlags = attachFlagsToMatch(match);

    return {
        ...matchWithFlags,
        displayTime: convertUTCtoIST(match.dateTimeGMT)
    };
};

// Helper: Enrich a list of matches
const enrichMatches = (matches) => {
    if (!Array.isArray(matches)) return matches;
    return matches.map(enrichMatch);
};

// Service methods mapping to cricbuzzService under the hood
export const cricketService = {
    // Cache for 24 hours (86400 seconds)
    getCountries: async () => {
        return { status: 'success', data: [] };
    },

    // Cache for 1 hour
    getSeriesList: async (searchParams = {}) => {
        return { status: 'success', data: [] };
    },

    // Get live matches
    getCurrentMatches: async () => {
        const matches = await cricketService.getLiveMatches();
        return { status: 'success', data: enrichMatches(matches) };
    },

    // Get all matches
    getAllMatches: async () => {
        const matches = await cricbuzzService.getAllMatches();
        return { status: 'success', data: enrichMatches(matches) };
    },

    // Get match info (support local DB matches & fallback to Cricbuzz)
    getMatchInfo: async (id) => {
        // 1. Check if it's a local MongoDB match
        if (id && typeof id === 'string' && id.length >= 24 && /^[0-9a-fA-F]+$/.test(id)) {
            try {
                const { default: mongoose } = await import('mongoose');
                const { default: Match } = await import('../models/Match.js');
                const { computeCricketLiveDetails } = await import('../utils/cricketLiveDetails.js');

                if (mongoose.Types.ObjectId.isValid(id)) {
                    const localMatch = await Match.findById(id).populate('homeTeam awayTeam tournament');
                    if (localMatch) {
                        const obj = localMatch.toObject();
                        const liveDetails = await computeCricketLiveDetails(localMatch);

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
                            ],
                            cricketLiveDetails: liveDetails
                        };
                        return { status: 'success', data: enrichMatch(data) };
                    }
                }
            } catch (err) {
                console.warn(`[API INFO] Local match fetch failed for ${id}, falling back to Cricbuzz...`, err.message);
            }
        }

        // 2. Fetch from Cricbuzz directly
        const res = await cricbuzzService.getMatchInfo(id);
        if (res?.data) {
            res.data = enrichMatch(res.data);
        }
        return res;
    },

    // Poll live matches info directly from Cricbuzz
    getMatchInfoLive: async (id) => {
        return await cricketService.getMatchInfo(id);
    },

    // Get player details from Cricbuzz
    getPlayerInfo: async (id) => {
        return await cricbuzzService.getPlayerInfo(id);
    },

    // Series info fallback
    getSeriesInfo: async (id) => {
        return { status: 'success', data: { matchList: [] } };
    },

    // World Cup matches from Cricbuzz
    getWorldCupMatches: async () => {
        const all = await cricbuzzService.getAllMatches();
        const wc = all.filter(m => {
            const series = (m.series || '').toLowerCase();
            return series.includes('world cup') || series.includes('t20 world cup') || series.includes('cwc');
        });
        return enrichMatches(wc);
    },

    // U19 World Cup matches
    getU19WorldCupMatches: async () => {
        const all = await cricbuzzService.getAllMatches();
        const u19 = all.filter(m => {
            const series = (m.series || '').toLowerCase();
            return series.includes('u19') || series.includes('under-19');
        });
        return enrichMatches(u19);
    },

    // Ranji Trophy (Domestic)
    getRanjiTrophyMatches: async () => {
        const all = await cricbuzzService.getAllMatches();
        const ranji = all.filter(m => {
            const series = (m.series || '').toLowerCase();
            return series.includes('ranji') || series.includes('trophy');
        });
        return enrichMatches(ranji);
    },

    // Active Series Matches
    getActiveSeriesMatches: async () => {
        const matches = await cricbuzzService.getLiveMatches();
        return enrichMatches(matches);
    },

    // Legacy Controller methods
    getLiveMatches: async () => {
        const cricbuzzLive = await cricbuzzService.getLiveMatches();
        let localLive = [];
        try {
            const { default: Match } = await import('../models/Match.js');
            const { computeCricketLiveDetails } = await import('../utils/cricketLiveDetails.js');
            
            const localLiveMatches = await Match.find({ status: 'Live', matchType: { $ne: 'Football' } })
                .populate('homeTeam awayTeam tournament');
                
            localLive = await Promise.all(localLiveMatches.map(async (m) => {
                const obj = m.toObject();
                const liveDetails = await computeCricketLiveDetails(m);
                const team1Name = obj.homeTeam?.name || 'Home';
                const team2Name = obj.awayTeam?.name || 'Away';
                const tName = obj.tournament?.name || 'Local Tournament T20';

                return {
                    id: obj._id.toString(),
                    name: `${team1Name} vs ${team2Name}, ${tName}`,
                    series: tName,
                    seriesName: tName,
                    status: obj.status,
                    matchType: obj.matchType || 'Cricket',
                    venue: obj.venue,
                    dateTimeGMT: obj.date,
                    teams: [team1Name, team2Name],
                    teamInfo: [
                        { name: team1Name, shortname: obj.homeTeam?.acronym },
                        { name: team2Name, shortname: obj.awayTeam?.acronym }
                    ],
                    matchStarted: obj.status !== 'Upcoming',
                    matchEnded: obj.status === 'Completed',
                    homeLineup: obj.homeLineup,
                    awayLineup: obj.awayLineup,
                    score: [
                        { inning: 'Innings 1', r: obj.score?.team1?.runs, w: obj.score?.team1?.wickets, o: obj.score?.team1?.overs },
                        { inning: 'Innings 2', r: obj.score?.team2?.runs, w: obj.score?.team2?.wickets, o: obj.score?.team2?.overs }
                    ],
                    cricketLiveDetails: liveDetails
                };
            }));
        } catch (err) {
            console.error('Failed to fetch local live matches:', err);
        }
        return [...cricbuzzLive, ...localLive];
    },

    getUpcomingMatches: async () => {
        return await cricbuzzService.getUpcomingMatches();
    },

    getRecentMatches: async () => {
        return await cricbuzzService.getRecentMatches();
    },

    getMatchScorecard: async (id) => {
        const scorecard = await cricbuzzService.getScorecard(id);
        return scorecard?.data || null;
    },

    getPlayerAnalysis: async (id) => {
        return { message: 'Analysis not implemented for single API setup' };
    },

    getTeamComparison: async (t1, t2) => {
        return { message: 'Comparison not implemented for single API setup' };
    },

    clearCache: () => {
        // Cache is self-clearing, dummy function to prevent crashes
        return true;
    }
};

export default cricketService;
