import express from 'express';
import axios from 'axios';
import FootballStanding from '../models/FootballStanding.js';
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
        transferDate:      new Date(t.transferDate || t.fromDate || now),
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

// Background worker to enrich player stats with Sofascore data sequentially
async function enrichPlayersBackground(leagueId) {
    const apiKey = process.env.sofascore_api_footballtopstats_playerimages;
    if (!apiKey) return;

    try {
        // Find players missing sofascoreId
        const playersToEnrich = await PlayerTopStat.find({ leagueId, sofascoreId: { $exists: false } }).lean();
        if (!playersToEnrich.length) return;

        console.log(`[TopStats] Starting background enrichment for ${playersToEnrich.length} players in league ${leagueId}`);

        for (const p of playersToEnrich) {
            if (!p.playerName) continue;

            let photoBase64 = '';
            let sofascoreId = 'NOT_FOUND';
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
                        await sleep(250);
                        const imgRes = await axios.get(`https://sofascore.p.rapidapi.com/players/get-image?playerId=${sofascoreId}`, {
                            headers: { 'x-rapidapi-host': 'sofascore.p.rapidapi.com', 'x-rapidapi-key': apiKey },
                            responseType: 'arraybuffer',
                            timeout: 8000
                        });
                        
                        if (imgRes.headers['content-type']?.includes('image') && imgRes.data) {
                            photoBase64 = `data:${imgRes.headers['content-type']};base64,${Buffer.from(imgRes.data).toString('base64')}`;
                        }
                    }
                }
            } catch (err) {
                console.log(`[TopStats] Background Sofascore fetch failed for ${p.playerName}:`, err.message);
            }

            await PlayerTopStat.updateOne(
                { _id: p._id },
                { $set: { sofascoreId, photoBase64, position, jerseyNumber, country } }
            );

            await sleep(350); // Be gentle with the API rate limits to avoid 5000ms timeout stalls
        }
        console.log(`[TopStats] Background enrichment finished for league ${leagueId}`);
    } catch (err) {
        console.error(`[TopStats] Background enrichment error for league ${leagueId}:`, err.message);
    }
}

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

        // Kick off background image fetching so the client can render the table instantly
        enrichPlayersBackground(leagueId).catch(console.error);

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

export default router;
