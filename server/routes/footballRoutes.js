import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FootballStanding from '../models/FootballStanding.js';
import WorldCupStanding from '../models/WorldCupStanding.js';
import FootballTransfer from '../models/FootballTransfer.js';
import TrendingPlayer from '../models/TrendingPlayer.js';
import { PlayerTopStat, TeamTopStat } from '../models/FootballTopStat.js';
import { 
    createTournament,
    getTournaments,
    getTournamentById, 
    createTeam,
    addTeamToTournament,
    getTeams,
    updateTournament,
    deleteTournament,
    updateTeam,
    getTeamById,
    getTournamentStats,
    followTournament,
    unfollowTournament,
    getTournamentNews
} from '../controllers/footballTournamentController.js';
import { 
    getMatchById,
    createMatch,
    addMatchEvent,
    updateTimer, 
    finalizeMatch,
    updateMatchLineups,
    deleteMatch
} from '../controllers/footballMatchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { getDashboardMatches, getCategorizedMatches, getMatchDetail, getGlobalFootballNews, getFootballLiveNews, clearCache } from '../services/footballDataService.js';
import livescore6Service from '../services/livescore6Service.js';
import * as espnService from '../services/espnService.js';

const router = express.Router();

// ─── PROXY ROUTES FOR FRONTEND ───
// These proxies ensure API keys stay hidden on the backend while the frontend can still use the API-Sports schema

router.get('/proxy/fixtures', async (req, res) => {
    try {
        const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
            params: req.query,
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-apisports-key': process.env.API_KEY, 
                'x-rapidapi-key': process.env.API_KEY
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error('[Proxy] Fixtures Error:', err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: err.message });
    }
});

// ─── LATEST TRANSFERS ─────────────────────────────────────────────────────────
// Serves transfers from MongoDB cache (2-day TTL).

const TRANSFERS_API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const TRANSFERS_CACHE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const PRIORITY_CLUBS = [
    // Premier League
    'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'liverpool', 'man city', 'manchester city', 'man united', 'manchester united', 'newcastle', 'nottm forest', 'nottingham forest', 'tottenham', 'spurs', 'west ham', 'wolves',
    // La Liga
    'athletic club', 'atletico madrid', 'barcelona', 'real madrid', 'real sociedad', 'sevilla', 'valencia', 'villarreal', 'girona', 'betis',
    // Serie A
    'ac milan', 'inter', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'bologna',
    // Bundesliga
    'bayern munich', 'dortmund', 'bayer leverkusen', 'rb leipzig', 'eintracht frankfurt', 'stuttgart',
    // Ligue 1
    'psg', 'paris saint-germain', 'monaco', 'marseille', 'lyon', 'lille', 'lens',
    // Others
    'al nassr', 'al hilal', 'al ittihad', 'al ahli',
    'inter miami', 'lafc', 'la galaxy',
    'ajax', 'psv', 'feyenoord',
    'porto', 'benfica', 'sporting cp', 'sporting lisbon',
    'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'besiktas'
];

async function fetchAndStoreTransfers() {
    const apiKey = process.env.TRANSFERS_API_KEY;
    if (!apiKey) throw new Error('TRANSFERS_API_KEY env key not set');

    const headers = {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': TRANSFERS_API_HOST,
    };

    // Fetch from both endpoints
    const [allRes, mvRes] = await Promise.all([
        axios.get(`https://${TRANSFERS_API_HOST}/football-get-all-transfers`, { params: { page: 1 }, headers, timeout: 10000 }).catch(e => { console.error('All transfers error:', e.message); return { data: null }; }),
        axios.get(`https://${TRANSFERS_API_HOST}/football-get-market-value-transfers`, { params: { page: 1 }, headers, timeout: 10000 }).catch(e => { console.error('MV transfers error:', e.message); return { data: null }; })
    ]);

    const allRaw = allRes.data?.response?.transfers || [];
    const mvRaw = mvRes.data?.response?.transfers || [];

    const combined = [...(Array.isArray(allRaw) ? allRaw : []), ...(Array.isArray(mvRaw) ? mvRaw : [])];

    if (combined.length === 0) throw new Error('Empty transfers response from API');

    // Deduplicate based on playerId + transferDate
    const uniqueTransfers = [];
    const seen = new Set();
    for (const t of combined) {
        if (!t || !t.playerId || !t.transferDate) continue;
        const key = `${t.playerId}_${t.transferDate}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueTransfers.push(t);
        }
    }

    // Filter using the PRIORITY_CLUBS list
    const priorityTransfers = uniqueTransfers.filter(t => {
        const outName = (t.fromClub || t.fromClubFullName || '').toLowerCase();
        const inName = (t.toClub || t.toClubFullName || '').toLowerCase();
        
        return PRIORITY_CLUBS.some(club => outName.includes(club) || inName.includes(club));
    });

    const cacheExpiry = new Date(Date.now() + TRANSFERS_CACHE_MS);
    const now = new Date();

    // Wipe stale records before bulk-inserting fresh ones
    await FootballTransfer.deleteMany({});

    const docs = priorityTransfers.map(t => ({
        transferId:        `${t.playerId}_${t.transferDate}`,
        playerId:          t.playerId,
        playerName:        t.name || '',
        position:          t.position?.label || t.position?.key || '',
        fromClub:          t.fromClub || t.fromClubFullName || '',
        fromClubId:        t.fromClubId,
        toClub:            t.toClub || t.toClubFullName || '',
        toClubId:          t.toClubId,
        transferDate:      new Date(t.fromDate || t.transferDate || now),
        fee:               t.fee?.feeText || t.fee?.localizedFeeText || t.transferType?.text || '',
        feeValue:          t.fee?.value || t.amountEuroEstimated || 0,
        transferType:      t.transferType?.localizationKey || t.transferType?.text || '',
        marketValue:       t.marketValue || 0,
        leagueId:          'Priority',
        onLoan:            t.onLoan || false,
        contractExtension: t.contractExtension || false,
        cacheExpiry,
        lastFetched:       now,
    }));

    if (docs.length > 0) {
        await FootballTransfer.insertMany(docs);
        console.log(`[Transfers] Stored ${docs.length} filtered transfers from both endpoints.`);
    }
    
    return { rows: docs, lastFetched: now };
}

router.get('/transfers', async (req, res) => {
    try {
        // 1. Check if we have valid cached data
        const sample = await FootballTransfer.findOne({
            cacheExpiry: { $gt: new Date() },
        });

        if (sample) {
            // Cache hit
            const transfers = await FootballTransfer
                .find({})
                .sort({ transferDate: -1 })
                .lean();

            return res.json({
                success: true,
                fromCache: true,
                lastFetched: transfers[0]?.lastFetched || null,
                data: transfers,
            });
        }

        // 2. Cache miss – fetch, persist, respond
        console.log('[Transfers] Cache expired or empty – fetching from API…');
        const { rows, lastFetched } = await fetchAndStoreTransfers();

        return res.json({
            success: true,
            fromCache: false,
            lastFetched,
            data: rows,
        });

    } catch (err) {
        console.error('[Transfers] Error:', err.message);
        // Fallback: try to serve stale data
        const stale = await FootballTransfer
            .find({})
            .sort({ transferDate: -1 })
            .lean();

        if (stale.length > 0) {
            return res.json({ success: true, fromCache: true, stale: true, lastFetched: stale[0]?.lastFetched || null, data: stale });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── Real Football Data (Hybrid: AllSportsApi2 + Football-Data.org) ───

router.get('/news', async (req, res) => {
    try {
        const data = await getGlobalFootballNews();
        res.json({ success: true, data });
    } catch (err) {
        console.error('[Football News] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Live Football News (from RapidAPI)
router.get('/live-news', async (req, res) => {
    try {
        const data = await getFootballLiveNews();
        res.json({ success: true, data });
    } catch (err) {
        console.error('[Football Live News] Route Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Dashboard: returns categorized matches (league/cup/international) with 10-min cache
router.get('/dashboard', async (req, res) => {
    try {
        const data = await getDashboardMatches();
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('[Football Dashboard] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Match detail by internal ID (football-{id} or football-fd-{id})
router.get('/detail/:id', async (req, res) => {
    try {
        const match = await getMatchDetail(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (err) {
        console.error('[Football Detail] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Partitioned matches (Live, Upcoming, Completed) for the Football Tab
router.get('/matches/categorized', async (req, res) => {
    try {
        const data = await getCategorizedMatches();
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('[Football Categorized] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Clear cache (for debug)
router.post('/cache/clear', async (req, res) => {
    clearCache();
    res.json({ success: true, message: 'Football cache cleared' });
});

// Tournament Routes
router.post('/tournaments', protect, createTournament);
router.get('/tournaments', getTournaments);
router.get('/tournaments/:id', getTournamentById);
router.put('/tournaments/:id', protect, updateTournament);
router.delete('/tournaments/:id', protect, deleteTournament);
router.post('/tournaments/:id/teams', protect, addTeamToTournament);
router.get('/tournaments/:id/stats', getTournamentStats);
router.post('/tournaments/:id/follow', protect, followTournament);
router.post('/tournaments/:id/unfollow', protect, unfollowTournament);
router.get('/tournaments/:id/news', getTournamentNews);

// Team Routes
router.get('/teams', getTeams);
router.get('/teams/:id', getTeamById);
router.post('/teams', protect, createTeam);
router.put('/teams/:id', protect, updateTeam);

// Match Routes
router.get('/matches/:id', getMatchById);
router.post('/matches', protect, createMatch);
router.post('/matches/:id/events', protect, addMatchEvent);
router.post('/matches/:id/timer', protect, updateTimer);
router.post('/matches/:id/finalize', protect, finalizeMatch);
router.post('/matches/:id/lineups', protect, updateMatchLineups);
router.delete('/matches/:id', protect, deleteMatch);

// ─── STANDINGS (MULTI-LEAGUE) ─────────────────────────────────────────────────
// Serves standings from MongoDB cache (1-week TTL).
// On first request (or after cache expires) it fetches live from the external API
// and persists the result – every subsequent user gets instant DB reads.

const STANDINGS_API_HOST  = 'free-api-live-football-data.p.rapidapi.com';
const STANDINGS_CACHE_MS  = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

async function fetchAndStoreStandings(leagueId) {
    const apiKey = process.env.FOOTBALL_STANDINGS;
    if (!apiKey) throw new Error('FOOTBALL_STANDINGS env key not set');

    const res = await axios.get(
        `https://${STANDINGS_API_HOST}/football-get-standing-all`,
        {
            params: { leagueid: leagueId },
            headers: {
                'x-rapidapi-key':  apiKey,
                'x-rapidapi-host': STANDINGS_API_HOST,
            },
            timeout: 10000,
        }
    );

    // API returns { response: { standing: [...] } }
    const raw = res.data?.response?.standing || res.data?.response || res.data?.data || res.data || [];
    const rows = Array.isArray(raw) ? raw : [];

    if (rows.length === 0) throw new Error('Empty standings response from API');

    // Map hex qual colours to readable labels (used by the UI for conditional styling)
    const QUAL_COLOR_MAP = {
        '#2AD572': 'Champions League',
        '#0046A7': 'Europa League',
        '#02CCF0': 'Conference League',
        '#FF4646': 'Relegation',
    };

    const cacheExpiry = new Date(Date.now() + STANDINGS_CACHE_MS);
    const now = new Date();

    // Wipe stale records for this league, then bulk-insert fresh ones
    await FootballStanding.deleteMany({ leagueId });

    const docs = rows.map((t) => {
        const [gf, ga] = String(t.scoresStr || '0-0').split('-').map(Number);
        return {
            leagueId:     leagueId,
            teamId:       String(t.id || ''),
            teamName:     t.name || t.shortName || '',
            shortName:    t.shortName || '',
            logoUrl:      `https://images.fotmob.com/image_resources/logo/teamlogo/${t.id}_xsmall.png`,
            position:     Number(t.idx || 0),
            played:       Number(t.played || 0),
            wins:         Number(t.wins || 0),
            draws:        Number(t.draws || 0),
            losses:       Number(t.losses || 0),
            goalsFor:     gf || 0,
            goalsAgainst: ga || 0,
            goalDiff:     Number(t.goalConDiff || 0),
            points:       Number(t.pts || 0),
            qualColor:    QUAL_COLOR_MAP[t.qualColor] || null,
            cacheExpiry,
            lastFetched:  now,
        };
    });

    await FootballStanding.insertMany(docs);
    console.log(`[Standings] Stored ${docs.length} teams for league ${leagueId}.`);
    return { rows: docs, lastFetched: now };
}

router.get('/standings', async (req, res) => {
    try {
        const leagueId = Number(req.query.leagueId) || 47; // Default to Premier League

        // 1. Check if we have valid cached data
        const sample = await FootballStanding.findOne({
            leagueId: leagueId,
            cacheExpiry: { $gt: new Date() },
        });

        if (sample) {
            // Cache hit – serve all rows from DB sorted by position
            const standings = await FootballStanding
                .find({ leagueId: leagueId })
                .sort({ position: 1 })
                .lean();

            return res.json({
                success: true,
                fromCache: true,
                lastFetched: standings[0]?.lastFetched || null,
                data: standings,
            });
        }

        // 2. Cache miss – fetch from API, persist, respond
        console.log(`[Standings] Cache expired or empty for league ${leagueId} – fetching from API…`);
        const { rows, lastFetched } = await fetchAndStoreStandings(leagueId);

        return res.json({
            success: true,
            fromCache: false,
            lastFetched,
            data: rows,
        });

    } catch (err) {
        console.error('[Standings] Error:', err.message);
        const leagueId = Number(req.query.leagueId) || 47;
        // Fallback: try to serve stale data rather than returning nothing
        const stale = await FootballStanding
            .find({ leagueId: leagueId })
            .sort({ position: 1 })
            .lean();

        if (stale.length > 0) {
            return res.json({ success: true, fromCache: true, stale: true, lastFetched: stale[0]?.lastFetched || null, data: stale });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});



// ─── WORLD CUP STANDINGS (LIVESCORE6 API) ────────────────────────────────────

const WC_STANDINGS_API_HOST = 'livescore6.p.rapidapi.com';

async function fetchAndStoreWorldCupStandings(competitionCode) {
    const apiKey = process.env.livescore_football_worldcupstandings;
    if (!apiKey) throw new Error('livescore_football_worldcupstandings env key not set');

    const compIdMap = {
        'world-cup': '54',
        'world-cup-2026': '734'
    };
    const compId = compIdMap[competitionCode] || '734';

    const res = await axios.get(
        `https://${WC_STANDINGS_API_HOST}/competitions/get-table`,
        {
            params: { CompId: compId },
            headers: {
                'x-rapidapi-key':  apiKey,
                'x-rapidapi-host': WC_STANDINGS_API_HOST,
            },
            timeout: 10000,
        }
    );

    const stages = res.data?.Stages || [];
    if (stages.length === 0) throw new Error('Empty or invalid response from API');

    // getNextTopStatsRefresh() returns Sat/Sun/Mon 09:30 IST
    const cacheExpiry = getNextTopStatsRefresh();
    const now = new Date();

    // Wipe stale records for this competition
    await WorldCupStanding.deleteMany({ competition: competitionCode });

    const docs = [];

    for (const stage of stages) {
        // e.g. "Group A"
        const groupName = stage.Snm || stage.CompN || 'Group';
        // Extract letter, e.g. "A" from "Group A"
        const groupLetterMatch = groupName.match(/(?:Group\s+)([A-Z])/i);
        const groupLetter = groupLetterMatch ? groupLetterMatch[1].toUpperCase() : '';

        const tables = stage.LeagueTable?.L?.[0]?.Tables;
        if (!tables) continue;

        for (const tbl of tables) {
            const teams = tbl.team || [];
            for (const t of teams) {
                docs.push({
                    competition:  competitionCode,
                    groupName:    groupName,
                    groupLetter:  groupLetter,
                    position:     Number(t.rnk || 0),
                    teamId:       String(t.Tid || ''),
                    teamName:     t.Tnm || '',
                    teamLogo:     t.Img ? `https://lsm-static-prod.livescore.com/medium/${t.Img}` : '',
                    played:       Number(t.pld || 0),
                    wins:         Number(t.win || 0),
                    draws:        Number(t.drw || 0),
                    losses:       Number(t.lst || 0),
                    goalsFor:     Number(t.gf || 0),
                    goalsAgainst: Number(t.ga || 0),
                    goalDiff:     Number(t.gd || 0),
                    points:       Number(t.pts || 0),
                    cacheExpiry,
                    lastFetched:  now,
                });
            }
        }
    }

    if (docs.length > 0) {
        await WorldCupStanding.insertMany(docs);
        console.log(`[WorldCupStandings] Stored ${docs.length} teams for ${competitionCode}.`);
    }

    return { rows: docs, lastFetched: now };
}

router.get('/world-cup-standings', async (req, res) => {
    try {
        const competitionCode = req.query.competition || 'world-cup-2026';

        // 1. Check if we have valid cached data
        const sample = await WorldCupStanding.findOne({
            competition: competitionCode,
            cacheExpiry: { $gt: new Date() },
        });

        if (sample) {
            // Cache hit – serve from DB sorted by group letter then position
            const standings = await WorldCupStanding
                .find({ competition: competitionCode })
                .sort({ groupLetter: 1, position: 1 })
                .lean();

            // Group by groupName for the frontend
            const grouped = standings.reduce((acc, row) => {
                const grp = row.groupName || 'Group';
                if (!acc[grp]) acc[grp] = [];
                acc[grp].push(row);
                return acc;
            }, {});

            return res.json({
                success: true,
                fromCache: true,
                lastFetched: standings[0]?.lastFetched || null,
                data: grouped,
            });
        }

        // 2. Cache miss – fetch from API, persist, respond
        console.log(`[WorldCupStandings] Cache expired or empty for ${competitionCode} – fetching from API…`);
        const { rows, lastFetched } = await fetchAndStoreWorldCupStandings(competitionCode);

        const grouped = rows.reduce((acc, row) => {
            const grp = row.groupName || 'Group';
            if (!acc[grp]) acc[grp] = [];
            acc[grp].push(row);
            return acc;
        }, {});

        return res.json({
            success: true,
            fromCache: false,
            lastFetched,
            data: grouped,
        });

    } catch (err) {
        console.error('[WorldCupStandings] Error:', err.message);
        const competitionCode = req.query.competition || 'world-cup-2026';
        
        // Fallback: try to serve stale data
        const stale = await WorldCupStanding
            .find({ competition: competitionCode })
            .sort({ groupLetter: 1, position: 1 })
            .lean();

        if (stale.length > 0) {
            const grouped = stale.reduce((acc, row) => {
                const grp = row.groupName || 'Group';
                if (!acc[grp]) acc[grp] = [];
                acc[grp].push(row);
                return acc;
            }, {});
            return res.json({ success: true, fromCache: true, stale: true, lastFetched: stale[0]?.lastFetched || null, data: grouped });
        }
        
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── TRENDING PLAYERS (AllSports API, 3-hour cache) ──────────────────────────

// Force wipe cache (for debugging)
router.delete('/trending-players/cache', async (req, res) => {
    try {
        await TrendingPlayer.deleteMany({});
        res.json({ success: true, message: 'Trending players cache cleared.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/football/trending-players
router.get('/trending-players', async (req, res) => {
    try {
        const THREE_HOURS = 3 * 60 * 60 * 1000;
        const now = new Date();

        // --- Cache hit: return DB records if they haven't expired ---
        const cached = await TrendingPlayer.find({}).lean();
        if (cached.length > 0) {
            const lastFetched = cached[0]?.lastFetched || null;
            return res.json({ success: true, fromCache: true, lastFetched, data: cached });
        }

        // --- Cache miss: fetch from AllSports API ---
        const apiKey = process.env.ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS;
        if (!apiKey) {
            return res.status(503).json({
                success: false,
                message: 'AllSports API key not configured. Set ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS in server/.env'
            });
        }

        const response = await axios.get('https://allsportsapi2.p.rapidapi.com/api/player/trending', {
            headers: {
                'x-rapidapi-host': 'allsportsapi2.p.rapidapi.com',
                'x-rapidapi-key': apiKey,
            },
        });

        const players = response.data?.topPlayers || response.data?.players || response.data?.data || [];
        if (!Array.isArray(players) || players.length === 0) {
            return res.json({ success: true, fromCache: false, lastFetched: now, data: [] });
        }

        const cacheExpiry = new Date(now.getTime() + THREE_HOURS);

        // Build and upsert each player into MongoDB
        const ops = players.map((p) => {
            const player = p.player || p;
            const team   = p.team   || {};
            
            // Stats are often directly on the root object 'p' or occasionally nested
            const goals = p.goals || p.statistics?.goals || 0;
            const assists = p.goalAssist || p.assists || p.statistics?.assists || p.statistics?.goalAssist || 0;
            const passes = p.accuratePass || p.passes || p.statistics?.accuratePass || p.statistics?.passes || 0;
            const saves = p.saves || p.statistics?.saves || 0;
            const rating = p.rating || p.statistics?.rating ? parseFloat(p.rating || p.statistics?.rating) : null;

            return {
                updateOne: {
                    filter: { playerId: player.id },
                    update: {
                        $set: {
                            playerId:   player.id,
                            playerName: player.name || player.shortName || 'Unknown',
                            position:   player.position || null,
                            teamName:   team.name || null,
                            teamId:     team.id || null,
                            teamFlag:   team.flag || null,
                            imageUrl:   null, // fetched on-demand via the image proxy below
                            rating:     rating,
                            stats: {
                                goals:   goals,
                                assists: assists,
                                passes:  passes,
                                saves:   saves,
                            },
                            rawData:     p,
                            cacheExpiry,
                            lastFetched: now,
                        }
                    },
                    upsert: true,
                }
            };
        });

        await TrendingPlayer.bulkWrite(ops);

        const saved = await TrendingPlayer.find({}).lean();
        return res.json({ success: true, fromCache: false, lastFetched: now, data: saved });

    } catch (err) {
        console.error('[TrendingPlayers] Error:', err.message);
        // Fallback: return stale cached data if available
        const stale = await TrendingPlayer.find({}).lean();
        if (stale.length > 0) {
            return res.json({ success: true, fromCache: true, stale: true, lastFetched: stale[0]?.lastFetched || null, data: stale });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// Simple queue to prevent hitting RapidAPI rate limits when the frontend requests many images at once
let imageQueuePromise = Promise.resolve();
const enqueueImageFetch = (fetchFn) => {
    return new Promise((resolve, reject) => {
        imageQueuePromise = imageQueuePromise
            .then(async () => {
                try {
                    const result = await fetchFn();
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            })
            // Add a 500ms delay between consecutive requests to RapidAPI
            .then(() => new Promise(r => setTimeout(r, 500)));
    });
};

// GET /api/football/trending-players/:id/image
// Proxies the player image so the API key stays on the server
router.get('/trending-players/:id/image', async (req, res) => {
    try {
        const apiKey = process.env.FOOTBALL_IMAGE_ALLSPORTS_API || process.env.ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS;
        if (!apiKey) {
            return res.status(503).json({ success: false, message: 'Image API key not configured.' });
        }

        const imageResponse = await enqueueImageFetch(() => axios.get(
            `https://allsportsapi2.p.rapidapi.com/api/player/${req.params.id}/image`,
            {
                headers: {
                    'x-rapidapi-host': 'allsportsapi2.p.rapidapi.com',
                    'x-rapidapi-key': apiKey,
                },
                responseType: 'arraybuffer',
            }
        ));

        const contentType = imageResponse.headers['content-type'] || 'image/png';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // cache image 24hrs in browser
        res.send(imageResponse.data);
    } catch (err) {
        console.error('[TrendingPlayerImage] Error:', err.message);
        res.status(404).json({ success: false, message: 'Image not available.' });
    }
});

// GET /api/football/trending-players/team/:id/image
// Proxies the team image so the API key stays on the server
router.get('/trending-players/team/:id/image', async (req, res) => {
    try {
        const apiKey = process.env.FOOTBALL_IMAGE_ALLSPORTS_API || process.env.ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS;
        if (!apiKey) {
            return res.status(503).json({ success: false, message: 'Image API key not configured.' });
        }

        const imageResponse = await enqueueImageFetch(() => axios.get(
            `https://allsportsapi2.p.rapidapi.com/api/team/${req.params.id}/image`,
            {
                headers: {
                    'x-rapidapi-host': 'allsportsapi2.p.rapidapi.com',
                    'x-rapidapi-key': apiKey,
                },
                responseType: 'arraybuffer',
            }
        ));

        const contentType = imageResponse.headers['content-type'] || 'image/png';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // cache image 24hrs in browser
        res.send(imageResponse.data);
    } catch (err) {
        console.error('[TrendingTeamImage] Error:', err.message);
        res.status(404).json({ success: false, message: 'Image not available.' });
    }
});

// ─── TOP STATS (Livescore API, schedule-based cache) ──────────────────────────
// Player stat categories returned by the API
const PLAYER_STAT_TYPES = [
    { typ: 1, label: 'Goals' },
    { typ: 3, label: 'Assists' },
    { typ: 4, label: 'Defenders' },
    { typ: 6, label: 'Midfielders' },
    { typ: 8, label: 'Overall' },
];

// Team stat categories returned by the API
const TEAM_STAT_TYPES = [
    { typ: 10, label: 'Goals Scored' },
    { typ: 7,  label: 'Goals Conceded' },
    { typ: 1,  label: 'Possession' },
    { typ: 21, label: 'Shots' },
    { typ: 22, label: 'Passes' },
    { typ: 16, label: 'Clean Sheets' },
    { typ: 23, label: 'Discipline' },
];

const TOPSTATS_LEAGUES = [
    { id: 65, name: 'Premier League', flag: 'https://flagcdn.com/w40/gb-eng.png' },
    { id: 75, name: 'La Liga',         flag: 'https://flagcdn.com/w40/es.png'    },
    { id: 67, name: 'Bundesliga',      flag: 'https://flagcdn.com/w40/de.png'    },
    { id: 77, name: 'Serie A',         flag: 'https://flagcdn.com/w40/it.png'    },
    { id: 68, name: 'Ligue 1',         flag: 'https://flagcdn.com/w40/fr.png'    },
    { id: 734, name: 'World Cup',      flag: 'https://flagcdn.com/w40/us.png'    },
];

const LIVESCORE_HOST = 'livescore6.p.rapidapi.com';

/**
 * Computes the next cache expiry time: next Sat, Sun, or Mon after 09:30 IST.
 * IST = UTC+5:30
 */
function getNextTopStatsRefresh() {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const refresh = new Date(nowIST);
    refresh.setHours(9, 30, 0, 0);

    // Days that trigger a refresh: 0=Sun, 1=Mon, 6=Sat
    const refreshDays = [0, 1, 6];

    // Check if today is a refresh day and it hasn't passed 09:30 yet
    if (refreshDays.includes(nowIST.getDay()) && nowIST < refresh) {
        // Return today at 09:30 IST converted back to UTC
        return new Date(refresh.getTime() - IST_OFFSET_MS);
    }

    // Otherwise find next Sat, Sun, or Mon
    for (let d = 1; d <= 7; d++) {
        const candidate = new Date(nowIST);
        candidate.setDate(nowIST.getDate() + d);
        if (refreshDays.includes(candidate.getDay())) {
            candidate.setHours(9, 30, 0, 0);
            return new Date(candidate.getTime() - IST_OFFSET_MS);
        }
    }
    // Fallback: 4 days from now
    return new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
}

/** Sequential delay helper */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Fetch + store all player and team stats for a single league */
async function fetchAndStoreTopStatsForLeague(league, apiKey) {
    const cacheExpiry = getNextTopStatsRefresh();
    const now = new Date();

    // ── Player stats ─────────────────────────────────────────────────────────
    const playerRes = await axios.get(`https://${LIVESCORE_HOST}/competitions/get-player-stats`, {
        params: { CompId: league.id },
        headers: { 'x-rapidapi-host': LIVESCORE_HOST, 'x-rapidapi-key': apiKey },
        timeout: 12000,
    });
    await sleep(350);

    const playerStats = playerRes.data?.Stat || [];
    const playerDocs = [];

    for (const stat of playerStats) {
        const typInfo = PLAYER_STAT_TYPES.find(t => t.typ === stat.Typ);
        if (!typInfo) continue;
        const plrs = stat.Plrs || [];
        for (const p of plrs) {
            // Scrs is an object like { "1": "27" } — take the first value
            const statVal = p.Scrs ? Object.values(p.Scrs)[0] : '0';
            
            playerDocs.push({
                leagueId:     league.id,
                leagueName:   league.name,
                statTyp:      stat.Typ,
                rank:         p.Rnk || 0,
                playerName:   p.Pnm || '',
                playerId:     p.Pid || p.Aid || '',
                teamName:     p.Tnm || '',
                teamId:       p.Tid || '',
                statValue:    statVal,
                imageUrl:     p.imageUrl || '',
                teamBadgeUrl: p.Img || '',
                cacheExpiry,
                lastFetched:  now,
            });
        }
    }
    if (playerDocs.length > 0) {
        await PlayerTopStat.deleteMany({ leagueId: league.id });
        await PlayerTopStat.insertMany(playerDocs);
    }

    // ── Team stats ────────────────────────────────────────────────────────────
    const teamRes = await axios.get(`https://${LIVESCORE_HOST}/competitions/get-team-stats`, {
        params: { CompId: league.id },
        headers: { 'x-rapidapi-host': LIVESCORE_HOST, 'x-rapidapi-key': apiKey },
        timeout: 12000,
    });
    await sleep(350);

    const teamStats = teamRes.data?.Stat || [];
    const teamDocs = [];

    for (const stat of teamStats) {
        const typInfo = TEAM_STAT_TYPES.find(t => t.typ === stat.Typ);
        if (!typInfo) continue;
        // API returns teams under 'Tids' key (not 'Tms'/'Teams'/'Plrs')
        const teams = stat.Tids || [];
        let rank = 1;
        for (const t of teams) {
            // Scrs is an array: [{PrGm: '2', Ttl: '77'}] — extract both
            const scrsArr = Array.isArray(t.Scrs) ? t.Scrs[0] : null;
            const statValue   = scrsArr?.Ttl   || (scrsArr ? Object.values(scrsArr)[0] : '0');
            const statPerGame = scrsArr?.PrGm  || '';
            teamDocs.push({
                leagueId:     league.id,
                leagueName:   league.name,
                statTyp:      stat.Typ,
                rank:         t.Rnk || rank,
                teamName:     t.Tnm || '',
                teamId:       t.Tid || '',
                statValue,
                statPerGame,
                teamBadgeUrl: t.Img || '',
                cacheExpiry,
                lastFetched:  now,
            });
            rank++;
        }
    }
    if (teamDocs.length > 0) {
        await TeamTopStat.deleteMany({ leagueId: league.id });
        await TeamTopStat.insertMany(teamDocs);
    }

    console.log(`[TopStats] ${league.name}: ${playerDocs.length} player rows, ${teamDocs.length} team rows stored.`);
    return { leagueId: league.id, playerCount: playerDocs.length, teamCount: teamDocs.length, lastFetched: now };
}

// DELETE /api/football/top-stats/cache  (debug wipe)
router.delete('/top-stats/cache', async (req, res) => {
    try {
        await Promise.all([PlayerTopStat.deleteMany({}), TeamTopStat.deleteMany({})]);
        res.json({ success: true, message: 'Top stats cache cleared.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Global lock to prevent concurrent API fetches for the same league
const activeFetches = new Map();
const activeEnrichments = new Set();

// Background worker to enrich player stats with Sofascore data sequentially
async function enrichPlayersBackground(leagueId, statTyp) {
    const apiKey = process.env.sofascore_api_footballtopstats_playerimages;
    if (!apiKey || !statTyp) return;

    // Prevent concurrent background loops for the same league and stat type
    const lockKey = `${leagueId}_${statTyp}`;
    if (activeEnrichments.has(lockKey)) return;
    activeEnrichments.add(lockKey);

    try {
        // Find players missing sofascoreId ONLY in the specific requested tab
        const playersToEnrich = await PlayerTopStat.find({ leagueId, statTyp, sofascoreId: { $exists: false } }).lean();
        if (!playersToEnrich.length) return;

        console.log(`[TopStats] Starting background enrichment for ${playersToEnrich.length} players in league ${leagueId}`);

        for (const p of playersToEnrich) {
            if (!p.playerName) continue;

            let photoBase64 = '';
            let sofascoreId = undefined; // Don't default to NOT_FOUND, so errors allow retries
            let position = '';
            let jerseyNumber = '';
            let country = '';

            try {
                const searchRes = await axios.get(`https://sofascore.p.rapidapi.com/players/search?name=${encodeURIComponent(p.playerName)}`, {
                    headers: { 'x-rapidapi-host': 'sofascore.p.rapidapi.com', 'x-rapidapi-key': apiKey },
                    timeout: 8000
                });
                
                const sofaPlayer = searchRes.data?.players?.[0];
                if (sofaPlayer) {
                    sofascoreId = sofaPlayer.id?.toString() || 'NOT_FOUND';
                    position = sofaPlayer.position || '';
                    jerseyNumber = sofaPlayer.jerseyNumber?.toString() || '';
                    country = sofaPlayer.country?.name || sofaPlayer.country?.alpha2 || '';

                    if (sofascoreId !== 'NOT_FOUND') {
                        await sleep(400); // 400ms pause to respect rate limits
                        const imgRes = await axios.get(`https://sofascore.p.rapidapi.com/players/get-image?playerId=${sofascoreId}`, {
                            headers: { 'x-rapidapi-host': 'sofascore.p.rapidapi.com', 'x-rapidapi-key': apiKey },
                            responseType: 'arraybuffer',
                            timeout: 8000
                        });
                        
                        if (imgRes.headers['content-type']?.includes('image') && imgRes.data) {
                            photoBase64 = `data:${imgRes.headers['content-type']};base64,${Buffer.from(imgRes.data).toString('base64')}`;
                        }
                    }
                } else {
                    sofascoreId = 'NOT_FOUND'; // Search succeeded, but no player found
                }

                // Only update the database if the API sequence succeeded without throwing
                await PlayerTopStat.updateOne(
                    { _id: p._id },
                    { $set: { sofascoreId, photoBase64, position, jerseyNumber, country } }
                );

            } catch (err) {
                console.log(`[TopStats] Background Sofascore fetch failed for ${p.playerName}:`, err.message);
                // We do NOT update the database here.
                // This guarantees the player is picked up again on the next enrichment cycle.
            }

            await sleep(600); // 600ms delay between players to absolutely avoid 429 errors
        }
        console.log(`[TopStats] Background enrichment finished for league ${leagueId}`);
    } catch (err) {
        console.error(`[TopStats] Background enrichment error for league ${leagueId} tab ${statTyp}:`, err.message);
    } finally {
        activeEnrichments.delete(`${leagueId}_${statTyp}`);
    }
}

// Ensure local cache directory for player images exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGE_CACHE_DIR = path.join(__dirname, '..', 'cache', 'player-images');
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

// GET /api/football/player-image/:playerName
// Fetches player image sequentially, caches it locally for 30 minutes
router.get('/player-image/:playerName', async (req, res) => {
    const { playerName } = req.params;
    const { team } = req.query;
    if (!playerName) return res.status(400).json({ success: false, message: 'Player name required' });

    const safeName = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeTeam = team ? team.toString().replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'unk';
    const imagePath = path.join(IMAGE_CACHE_DIR, `${safeName}_${safeTeam}.png`);
    const apiKey = process.env.sofascore_api_footballtopstats_playerimages;

    try {
        // Check local cache
        if (fs.existsSync(imagePath)) {
            const stats = fs.statSync(imagePath);
            const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);
            
            // If less than 30 minutes old, serve from cache
            if (ageMinutes < 30) {
                return res.sendFile(imagePath);
            }
        }

        if (!apiKey) {
            // Serve placeholder if no API key and no valid cache
            return res.status(404).send('No API key');
        }

        // Cache miss or expired: fetch from Sofascore
        const searchRes = await axios.get(`https://sofascore.p.rapidapi.com/players/search?name=${encodeURIComponent(playerName)}`, {
            headers: { 'x-rapidapi-host': 'sofascore.p.rapidapi.com', 'x-rapidapi-key': apiKey },
            timeout: 8000
        });

        const reqTeam = team ? team.toString().toLowerCase() : '';
        const allPlayers = searchRes.data?.players || [];
        
        // 1. Filter out non-football players
        const footballPlayers = allPlayers.filter(p => p.sport?.slug === 'football');

        let sofaPlayer = null;
        
        if (footballPlayers.length > 0) {
            // 2. Try to match team name
            if (reqTeam) {
                sofaPlayer = footballPlayers.find(p => p.team?.name?.toLowerCase().includes(reqTeam) || reqTeam.includes(p.team?.name?.toLowerCase() || 'impossible_match'));
            }
            // 3. Fallback to first football player
            if (!sofaPlayer) {
                sofaPlayer = footballPlayers[0];
            }
        } else {
            // 4. Edge case: no football players found
            sofaPlayer = allPlayers[0];
        }

        if (sofaPlayer && sofaPlayer.id) {
            const sofascoreId = sofaPlayer.id;

            const imgRes = await axios.get(`https://sofascore.p.rapidapi.com/players/get-image?playerId=${sofascoreId}`, {
                headers: { 'x-rapidapi-host': 'sofascore.p.rapidapi.com', 'x-rapidapi-key': apiKey },
                responseType: 'arraybuffer',
                timeout: 8000
            });

            if (imgRes.headers['content-type']?.includes('image') && imgRes.data) {
                // Save locally
                fs.writeFileSync(imagePath, Buffer.from(imgRes.data));
                return res.sendFile(imagePath);
            }
        }
        
        // No player or image found
        res.status(404).send('Not found');

    } catch (err) {
        console.error(`[Football Player Image] Error for ${playerName}:`, err.message);
        // If error but we have a stale cache, serve the stale cache as fallback
        if (fs.existsSync(imagePath)) {
            return res.sendFile(imagePath);
        }
        res.status(500).send('Error');
    }
});

// POST /api/football/top-stats/enrich
// On-demand endpoint to trigger enrichment for a specific league and tab
router.post('/top-stats/enrich', async (req, res) => {
    const { leagueId, statTyp } = req.body;
    if (!leagueId || !statTyp) {
        return res.status(400).json({ success: false, message: 'leagueId and statTyp required' });
    }
    
    // Kick off the background worker safely without blocking the response
    enrichPlayersBackground(leagueId, statTyp).catch(console.error);
    res.json({ success: true, message: 'Enrichment triggered' });
});

// GET /api/football/top-stats?leagueId=65
router.get('/top-stats', async (req, res) => {
    try {
        const leagueId = parseInt(req.query.leagueId) || 65;
        const league = TOPSTATS_LEAGUES.find(l => l.id === leagueId) || TOPSTATS_LEAGUES[0];

        // Check cache
        const [cachedPlayer, cachedTeam] = await Promise.all([
            PlayerTopStat.findOne({ leagueId, cacheExpiry: { $gt: new Date() } }),
            TeamTopStat.findOne({ leagueId, cacheExpiry: { $gt: new Date() } }),
        ]);

        if (cachedPlayer || cachedTeam) {
            const [players, teams] = await Promise.all([
                PlayerTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
                TeamTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
            ]);
            const lastFetched = (cachedPlayer || cachedTeam)?.lastFetched || null;

            // We no longer trigger enrichment automatically here.
            // The frontend must explicitly hit POST /top-stats/enrich for the active tab.

            return res.json({ success: true, fromCache: true, leagueId, lastFetched, players, teams });
        }

        // Cache miss — fetch from API
        const apiKey = process.env.livescore_api_footballtopstats;
        if (!apiKey) {
            return res.status(503).json({ success: false, message: 'livescore_api_footballtopstats env key not set.' });
        }

        // Concurrency lock: If another request is already fetching this league, wait for it instead of duplicating
        if (activeFetches.has(leagueId)) {
            console.log(`[TopStats] Concurrent request waiting for existing fetch for league ${leagueId}...`);
            await activeFetches.get(leagueId);
            const [players, teams] = await Promise.all([
                PlayerTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
                TeamTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
            ]);
            return res.json({ success: true, fromCache: false, leagueId, lastFetched: new Date(), players, teams });
        }

        console.log(`[TopStats] Cache miss for league ${leagueId} — fetching from Livescore API…`);
        const fetchPromise = fetchAndStoreTopStatsForLeague(league, apiKey);
        activeFetches.set(leagueId, fetchPromise);
        
        let result;
        try {
            result = await fetchPromise;
        } finally {
            activeFetches.delete(leagueId);
        }

        const [players, teams] = await Promise.all([
            PlayerTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
            TeamTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
        ]);

        // We no longer trigger enrichment automatically here.

        return res.json({ success: true, fromCache: false, leagueId, lastFetched: result.lastFetched, players, teams });

    } catch (err) {
        console.error('[TopStats] Error:', err.message);
        // Fallback: serve stale data if available
        const leagueId = parseInt(req.query.leagueId) || 65;
        const [players, teams] = await Promise.all([
            PlayerTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
            TeamTopStat.find({ leagueId }).sort({ statTyp: 1, rank: 1 }).lean(),
        ]);
        if (players.length > 0 || teams.length > 0) {
            return res.json({ success: true, fromCache: true, stale: true, leagueId, lastFetched: players[0]?.lastFetched || null, players, teams });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── LIVESCORE6 API ENDPOINTS (V2) ──────────────────────────────────────────

router.get('/v2/matches/live', async (req, res) => {
    try {
        const result = await livescore6Service.getLiveMatches();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch live matches' });
    }
});

router.get('/v2/matches/date/:date', async (req, res) => {
    try {
        const result = await livescore6Service.getMatchesByDate(req.params.date);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch matches by date' });
    }
});

router.get('/v2/matches/detail/:endpoint/:matchId', async (req, res) => {
    try {
        const { endpoint, matchId } = req.params;
        const result = await livescore6Service.getMatchDetail(endpoint, matchId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch match details' });
    }
});

// ─── PERFORMANCE LAB (AGGREGATED MATCH DATA, SEQUENTIAL FETCH) ──────────────
// In-memory cache for performance data (keyed by matchId)
const performanceCache = new Map();
const PERFORMANCE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

router.get('/v2/matches/performance/:matchId', async (req, res) => {
    const { matchId } = req.params;
    const cacheKey = `match_${matchId}_performance`;

    // Check cache first
    const cached = performanceCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < PERFORMANCE_CACHE_TTL)) {
        console.log(`[PerformanceLab] Cache hit for match ${matchId}`);
        return res.json({ success: true, fromCache: true, data: cached.data });
    }

    try {
        console.log(`[PerformanceLab] Fetching data sequentially for match ${matchId}...`);

        // Fetch sequentially with delays to protect API rate limits
        const scoreboard = await livescore6Service.getMatchDetail('get-scoreboard', matchId);
        await sleep(500);

        const incidents = await livescore6Service.getMatchDetail('get-incidents', matchId);
        await sleep(500);

        const lineups = await livescore6Service.getMatchDetail('get-lineups', matchId);
        await sleep(500);

        const statistics = await livescore6Service.getMatchDetail('get-statistics', matchId);

        const performanceData = {
            scoreboard: scoreboard?.data || null,
            incidents: incidents?.data || null,
            lineups: lineups?.data || null,
            statistics: statistics?.data || null,
        };

        // Cache the aggregated data
        performanceCache.set(cacheKey, { data: performanceData, timestamp: Date.now() });
        console.log(`[PerformanceLab] Data cached for match ${matchId}`);

        return res.json({ success: true, fromCache: false, data: performanceData });
    } catch (err) {
        console.error(`[PerformanceLab] Error for match ${matchId}:`, err.message);

        // Try to serve stale cache if available
        if (cached) {
            return res.json({ success: true, fromCache: true, stale: true, data: cached.data });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});


// ─── SOFASCORE API ENDPOINTS (V3) ────────────────────────────────────────────

// Live matches — called on page load, cached 30 min
router.get('/v3/matches/live', async (req, res) => {
    try {
        const result = await espnService.getLiveMatches();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Sofascore] Live error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch live matches', error: err.message });
    }
});

// Upcoming matches — all top leagues in parallel
router.get('/v3/matches/upcoming', async (req, res) => {
    try {
        const result = await espnService.getUpcomingMatches();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Sofascore] Upcoming error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming matches', error: err.message });
    }
});

// Match detail
router.get('/v3/matches/detail/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const result = await espnService.getMatchDetail(matchId);
        res.json(result);
    } catch (err) {
        console.error('[Sofascore] Detail error:', err.message);
        res.status(500).json({ success: false, message: 'Detail API failed' });
    }
});

// Recent (completed) matches — all top leagues in parallel
router.get('/v3/matches/recent', async (req, res) => {
    try {
        const result = await espnService.getRecentMatches();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Sofascore] Recent error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch recent matches', error: err.message });
    }
});

// Detail handled by /v3/matches/detail/:matchId above

// Player image — sequential fetch proxied through backend (caches 30 min)
router.get('/v3/player-image/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const result = await espnService.getPlayerImage(playerId);
        res.set('Content-Type', result.contentType);
        res.set('Cache-Control', 'public, max-age=1800');
        res.send(result.buffer);
    } catch (err) {
        console.error('[Sofascore] Player image error:', err.message);
        res.status(404).json({ success: false, message: 'Player image not found' });
    }
});

// Team logo — sequential fetch proxied through backend (caches 30 min)
router.get('/v3/team-logo/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const result = await espnService.getTeamLogo(teamId);
        res.set('Content-Type', result.contentType);
        res.set('Cache-Control', 'public, max-age=1800');
        res.send(result.buffer);
    } catch (err) {
        console.error('[Sofascore] Team logo error:', err.message);
        res.status(404).json({ success: false, message: 'Team logo not found' });
    }
});

// Tournament logo — sequential fetch proxied through backend (caches 30 min)
router.get('/v3/tournament-logo/:tournamentId', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const result = await espnService.getTournamentLogo(tournamentId);
        res.set('Content-Type', result.contentType);
        res.set('Cache-Control', 'public, max-age=1800');
        res.send(result.buffer);
    } catch (err) {
        console.error('[Sofascore] Tournament logo error:', err.message);
        res.status(404).json({ success: false, message: 'Tournament logo not found' });
    }
});
import * as thesportsdbService from '../services/thesportsdbService.js';

// TheSportsDB Team Crest
router.get('/v3/image/team', async (req, res) => {
    try {
        const { name } = req.query;
        const imageUrl = await thesportsdbService.getTeamBadge(name);
        if (imageUrl) {
            res.json({ success: true, url: imageUrl });
        } else {
            res.status(404).json({ success: false, message: 'Team badge not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Image fetch error' });
    }
});

// TheSportsDB Player Cutout
router.get('/v3/image/player', async (req, res) => {
    try {
        const { name } = req.query;
        const imageUrl = await thesportsdbService.getPlayerCutout(name);
        if (imageUrl) {
            res.json({ success: true, url: imageUrl });
        } else {
            res.status(404).json({ success: false, message: 'Player image not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Image fetch error' });
    }
});

export default router;
