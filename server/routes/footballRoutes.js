import express from 'express';
import axios from 'axios';
import FootballStanding from '../models/FootballStanding.js';
import FootballTransfer from '../models/FootballTransfer.js';
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
// Serves transfers from MongoDB cache (4-day TTL).

const TRANSFERS_API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const TRANSFERS_CACHE_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

const PRIORITY_CLUBS = [
    // Premier League
    'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'liverpool', 'luton', 'man city', 'manchester city', 'man united', 'manchester united', 'newcastle', 'nottm forest', 'nottingham forest', 'sheff utd', 'sheffield united', 'tottenham', 'spurs', 'west ham', 'wolves',
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

    const res = await axios.get(
        `https://${TRANSFERS_API_HOST}/football-get-all-transfers`,
        {
            params: { page: 1 },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': TRANSFERS_API_HOST,
            },
            timeout: 10000,
        }
    );

    const raw = res.data?.response?.transfers || [];
    const rows = Array.isArray(raw) ? raw : [];

    if (rows.length === 0) throw new Error('Empty transfers response from API');

    // Filter using the PRIORITY_CLUBS list
    const priorityTransfers = rows.filter(t => {
        const outName = (t.fromClub || t.fromClubFullName || '').toLowerCase();
        const inName = (t.toClub || t.toClubFullName || '').toLowerCase();
        
        return PRIORITY_CLUBS.some(club => outName.includes(club) || inName.includes(club));
    });

    const cacheExpiry = new Date(Date.now() + TRANSFERS_CACHE_MS);
    const now = new Date();

    // Wipe stale records before bulk-inserting fresh ones
    await FootballTransfer.deleteMany({});

    const docs = priorityTransfers.map(t => ({
        playerId:     t.playerId,
        playerName:   t.name || '',
        position:     t.position?.label || t.position?.key || '',
        fromClub:     t.fromClub || t.fromClubFullName || '',
        fromClubId:   t.fromClubId,
        toClub:       t.toClub || t.toClubFullName || '',
        toClubId:     t.toClubId,
        transferDate: new Date(t.transferDate || t.fromDate || now),
        feeText:      t.fee?.feeText || t.fee?.localizedFeeText || t.transferType?.text || '',
        feeValue:     t.amountEuroEstimated || 0,
        transferType: t.transferType?.text || t.transferType?.localizationKey || '',
        marketValue:  t.marketValue || 0,
        cacheExpiry,
        lastFetched:  now,
    }));

    if (docs.length > 0) {
        await FootballTransfer.insertMany(docs);
        console.log(`[Transfers] Stored ${docs.length} filtered transfers.`);
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

export default router;

