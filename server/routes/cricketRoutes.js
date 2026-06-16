import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cricketService } from '../services/cricketApiService.js';
import { cricbuzzService } from '../services/cricbuzzService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
import { fetchTeamLogo } from '../services/cricbuzzScraperService.js';

router.get('/team-logo', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: 'Team name is required' });
        const logoUrl = await fetchTeamLogo(name);
        res.json({ logoUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get list of current/live matches
router.get('/matches', async (req, res) => {
    try {
        const matches = await cricketService.getCurrentMatches();
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific match details
router.get('/match/:id', async (req, res) => {
    try {
        const match = await cricketService.getMatchInfo(req.params.id);
        res.json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

import mongoose from 'mongoose';
import Match from '../models/Match.js';

// Alias for /match/:id/info - compatibility with frontend
router.get('/match/:id/info', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Check if it's a local match (MongoDB ObjectId)
        if (mongoose.Types.ObjectId.isValid(id)) {
            const localMatch = await Match.findById(id).populate('homeTeam awayTeam tournament');
            if (localMatch) {
                // Wrap in success structure expected by frontend hooks
                return res.json({ 
                    status: 'success', 
                    data: {
                        ...localMatch.toObject(),
                        // Map internal fields to CricketData structure for frontend mapper compatibility
                        teamInfo: [
                            { name: localMatch.homeTeam?.name || 'Home' },
                            { name: localMatch.awayTeam?.name || 'Away' }
                        ],
                        matchType: localMatch.matchType,
                        dateTimeGMT: localMatch.startTime,
                        matchStarted: localMatch.status !== 'upcoming',
                        matchEnded: localMatch.status === 'completed'
                    }
                });
            }
        }

        // 2. Fallback to external API
        const match = await cricketService.getMatchInfo(id);
        res.json(match);
    } catch (error) {
        console.error("Local/External match fetch error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get series list
router.get('/series', async (req, res) => {
    try {
        const series = await cricketService.getSeriesList(req.query);
        res.json(series);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific series info
router.get('/series/:id', async (req, res) => {
    try {
        const seriesInfo = await cricketService.getSeriesInfo(req.params.id);
        res.json(seriesInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get countries list
router.get('/countries', async (req, res) => {
    try {
        const countries = await cricketService.getCountries();
        res.json(countries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get player info
router.get('/players/:id', async (req, res) => {
    try {
        const player = await cricketService.getPlayerInfo(req.params.id);

        // Enrich with local performance profile (sync ratings)
        if (player && player.data) {
            const name = player.data.name;
            const profilePath = path.resolve(__dirname, '..', 'data', 'playerProfiles.json');

            if (fs.existsSync(profilePath)) {
                try {
                    const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
                    const localProfile = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());

                    if (localProfile) {
                        player.data.localOverallRating = localProfile.overallRating;
                        player.data.formTrend = localProfile.formTrend;
                    }
                } catch (e) {
                    console.error("Error reading profiles for player enrichment:", e);
                }
            }
        }

        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== CRICBUZZ PROXY ROUTES (Scorecard, Squads, Commentary) ======

// Cricbuzz Scorecard — accepts Cricbuzz match ID directly
router.get('/cb/scorecard/:matchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getScorecard(req.params.matchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Squads — extracted from scorecard data
router.get('/cb/squads/:matchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getSquads(req.params.matchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Commentary — highlight commentary
router.get('/cb/commentary/:matchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getCommentary(req.params.matchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// ─── Cricket Player Image Proxy ────────────────────────────────────────────────
// GET /api/cricket/cb/player-image/:playerId
// Streams the player image from Cricbuzz (cricbuzz-cricket host) through our
// backend so the browser never needs the RapidAPI key.
// Images are cached for 1 hour on the service level.
router.get('/cb/player-image/:playerId', async (req, res) => {
    try {
        await cricbuzzService.streamPlayerImage(req.params.playerId, res);
    } catch (error) {
        res.status(204).end();
    }
});

// ─── Cricket Player Search ──────────────────────────────────────────────────────
// GET /api/cricket/cb/player-search?name={playerName}
// Searches for a player by name, returns id, faceImageId, teamName, dob.
// Results cached 24 hours.
router.get('/cb/player-search', async (req, res) => {
    try {
        const name = req.query.name;
        if (!name) return res.status(400).json({ error: 'Missing ?name= query param', data: [] });
        const result = await cricbuzzService.searchPlayerByName(name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: [] });
    }
});

// ─── Resolve Face Image ID (lightweight, for lazy one-by-one loading) ──────────
// GET /api/cricket/cb/resolve-face?name={playerName}
// Returns just { faceImageId } — used by frontend to resolve images sequentially.
// Uses the player search cache (24h TTL) so repeated calls are free.
router.get('/cb/resolve-face', async (req, res) => {
    try {
        const name = req.query.name;
        if (!name) return res.json({ faceImageId: null });
        const result = await cricbuzzService.searchPlayerByName(name);
        const first = result?.data?.[0];
        res.json({ faceImageId: first?.faceImageId || null });
    } catch {
        res.json({ faceImageId: null });
    }
});

// ─── Cricket News ───────────────────────────────────────────────────────────────
// GET /api/cricket/news
// Returns latest cricket news from Cricbuzz, cached 30 minutes.
router.get('/news', async (req, res) => {
    try {
        const result = await cricbuzzService.getCricketNews();
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: [], error: error.message });
    }
});

router.get('/news/:id', async (req, res) => {
    try {
        const result = await cricbuzzService.getCricketNewsDetail(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ─── ICC Team Rankings ─────────────────────────────────────────────────────────
// GET /api/cricket/rankings/:format  (format: odi | test | t20)
// Lazy loaded per tab click. Cached 1 week, force-refreshed on Wednesdays.
router.get('/rankings/:format', async (req, res) => {
    const { format } = req.params;
    const allowed = ['odi', 'test', 't20'];
    if (!allowed.includes(format.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid format. Use: odi, test, t20' });
    }
    try {
        const result = await cricbuzzService.getTeamRankings(format.toLowerCase());
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: [], error: error.message });
    }
});

// ─── ICC Player Rankings ───────────────────────────────────────────────────────
// GET /api/cricket/player-rankings/:category/:format
// category: batsmen | bowlers | allrounders
// format:   odi | test | t20
router.get('/player-rankings/:category/:format', async (req, res) => {
    const { category, format } = req.params;
    const allowedCategories = ['batsmen', 'bowlers', 'allrounders'];
    const allowedFormats = ['odi', 'test', 't20'];
    if (!allowedCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid category. Use: batsmen, bowlers, allrounders' });
    }
    if (!allowedFormats.includes(format.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid format. Use: odi, test, t20' });
    }
    try {
        const result = await cricbuzzService.getPlayerRankings(category.toLowerCase(), format.toLowerCase());
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: [], error: error.message });
    }
});

// ─── Trending Players ──────────────────────────────────────────────────────────
// GET /api/cricket/trending-players
// Scroll-triggered; cached 24 hours server-side.
router.get('/trending-players', async (req, res) => {
    try {
        const result = await cricbuzzService.getTrendingPlayers();
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: [], error: error.message });
    }
});

// GET /api/cricket/player-info/:id
// Click-triggered; cached 24 hours server-side.
router.get('/player-info/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ data: null, error: 'Invalid player ID' });
    }
    try {
        const result = await cricbuzzService.getCricbuzzPlayerInfo(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ─── PERFORMANCE LAB (STEALTH SCRAPER & IN-MEMORY CACHING) ──────────

import { fetchTeamSquad, fetchPlayerDeepStats } from '../services/cricbuzzScraperService.js';

// Local Memory Cache (1 Hour TTL)
const memCache = new Map();

function getCache(key) {
    const item = memCache.get(key);
    if (item && item.expiry > Date.now()) {
        return item.data;
    }
    return null;
}

function setCache(key, data, ttlHours = 1) {
    memCache.set(key, {
        data,
        expiry: Date.now() + (ttlHours * 60 * 60 * 1000)
    });
}

// GET /api/cricket/teams/:teamId/squad
// Uses Stealth Puppeteer to scrape the live squad from Cricbuzz and caches it for 1 hour
router.get('/teams/:teamId/squad', async (req, res) => {
    try {
        const teamId = req.params.teamId; // e.g. 'india-2'
        
        // 1. Check Local Cache
        const cachedTeam = getCache(`team_${teamId}`);
        if (cachedTeam) {
            console.log(`[Cache Hit] Returning cached squad for ${teamId}`);
            return res.json(cachedTeam);
        }
        
        console.log(`[Cache Miss] Lazy loading squad for ${teamId} via Cricbuzz Scraper...`);
        // 2. Fetch via Cricbuzz Scraper
        const players = await fetchTeamSquad(teamId);
        
        // Determine name based on slug
        const teamName = teamId.split('-')[0].charAt(0).toUpperCase() + teamId.split('-')[0].slice(1);
        
        const newTeam = {
            teamId,
            teamName: teamName,
            region: teamName,
            flagUrl: `https://flagcdn.com/w80/${teamName.toLowerCase() === 'india' ? 'in' : 'un'}.png`,
            players: players
        };
        
        // 3. Save to Local Cache
        setCache(`team_${teamId}`, newTeam, 1);
        res.json(newTeam);
        
    } catch (error) {
        console.error("Error fetching team squad:", error);
        res.status(500).json({ error: 'Failed to fetch squad' });
    }
});

// GET /api/cricket/players/:playerId/stats
// Uses Stealth Puppeteer to scrape Cricbuzz deep data and caches it for 1 hour
router.get('/players/:playerId/stats', async (req, res) => {
    try {
        const playerId = req.params.playerId; // This is now a Cricbuzz ID
        const playerName = req.query.name || 'Player'; 
        
        // 1. Check Local Cache
        const cachedStats = getCache(`player_${playerId}`);
        if (cachedStats) {
            console.log(`[Cache Hit] Returning cached stats for ${playerName} (${playerId})`);
            return res.json(cachedStats);
        }
        
        console.log(`[Cache Miss] Lazy loading stats for ${playerName} (${playerId}) via Cricbuzz Scraper...`);
        // 2. Fetch via Cricbuzz Scraper
        const deepData = await fetchPlayerDeepStats(playerId, playerName);
        
        const newStats = {
            playerId,
            name: playerName,
            profileInfo: deepData.profileInfo,
            stats: deepData.stats,
            vsOpposition: deepData.vsOpposition,
            recentMatches: deepData.recentMatches,
            attributes: deepData.attributes,
            scoringZones: deepData.scoringZones
        };
        
        // 3. Save to Local Cache
        setCache(`player_${playerId}`, newStats, 1);
        res.json(newStats);
        
    } catch (error) {
        console.error("Error fetching player stats:", error);
        res.status(500).json({ error: 'Failed to fetch player stats' });
    }
});

export default router;
