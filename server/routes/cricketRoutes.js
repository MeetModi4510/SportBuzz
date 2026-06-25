import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cricketService } from '../services/cricketApiService.js';
import { cricbuzzService } from '../services/cricbuzzService.js';
import { scrapeScorecard } from '../services/cricbuzzScorecardScraper.js';
import { scrapeFullCommentary } from '../services/cricbuzzScraperService.js';
import { getWinProbabilityGraph } from '../services/cricbuzzWinProbabilityScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
import { fetchTeamLogo, fetchLiveMatchesScraped, fetchRecentMatchesScraped, fetchUpcomingMatchesScraped, fetchMatchDetailScraped, fetchMatchSquadsScraped, fetchBallMap, fetchPartnershipGraph } from '../services/cricbuzzScraperService.js';
import { getLocalMatchInfo, getLocalMatchScorecard, getLocalMatchSquads, getLocalMatchSummary, getLocalMatchCommentary } from '../services/localIplMapper.js';
import { getTeamAnalytics } from '../services/cricsheetService.js';
import axios from 'axios';

// ─── STAGGERED TEAM LOGO PROXY ───────────────────────────────────────────────
const teamLogoQueue = [];
let isProcessingLogoQueue = false;

async function processLogoQueue() {
    if (isProcessingLogoQueue || teamLogoQueue.length === 0) return;
    isProcessingLogoQueue = true;
    
    while (teamLogoQueue.length > 0) {
        const { imageId, res } = teamLogoQueue.shift();
        try {
            const url = `https://static.cricbuzz.com/a/img/v1/i1/c${imageId}/i.jpg`;
            const imageResponse = await axios.get(url, { responseType: 'stream', headers: { 'User-Agent': 'Mozilla/5.0' } });
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            imageResponse.data.pipe(res);
        } catch (e) {
            res.status(404).end();
        }
        // Strict 1-second interval to prevent Cricbuzz bans!
        await new Promise(r => setTimeout(r, 1000));
    }
    
    isProcessingLogoQueue = false;
}

router.get('/scraped/team-logo/:imageId', (req, res) => {
    if (!req.params.imageId || req.params.imageId === 'undefined') {
        return res.status(404).end();
    }
    teamLogoQueue.push({ imageId: req.params.imageId, res });
    processLogoQueue();
});
// ─────────────────────────────────────────────────────────────────────────────

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
        const matches = await fetchLiveMatchesScraped();
        res.json({ status: 'success', data: matches });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== SCRAPER ROUTES ======
router.get('/scraped/matches/live', async (req, res) => {
    const data = await fetchLiveMatchesScraped();
    res.json({ status: 'success', data });
});

router.get('/scraped/matches/recent', async (req, res) => {
    const data = await fetchRecentMatchesScraped();
    res.json({ status: 'success', data });
});

router.get('/scraped/matches/upcoming', async (req, res) => {
    const data = await fetchUpcomingMatchesScraped();
    res.json({ status: 'success', data });
});

router.get('/scraped/match/:id/squads', async (req, res) => {
    const data = await fetchMatchSquadsScraped(req.params.id);
    res.json({ status: 'success', data });
});

router.get('/scraped/match/:id/graphs/ballmap/:inningsId', async (req, res) => {
    const data = await fetchBallMap(req.params.id, req.params.inningsId);
    if (!data) return res.status(404).json({ status: 'error', message: 'Ball map not found' });
    res.json({ status: 'success', data });
});

router.get('/scraped/match/:id/graphs/partnerships', async (req, res) => {
    const data = await fetchPartnershipGraph(req.params.id);
    if (!data) return res.status(404).json({ status: 'error', message: 'Partnership graph not found' });
    res.json({ status: 'success', data });
});

router.get('/scraped/match/:id/graphs/win-probability', async (req, res) => {
    try {
        const data = await getWinProbabilityGraph(req.params.id);
        if (!data || !data.available) {
            return res.status(404).json({ status: 'error', message: 'Win probability graph not found or not available', data: null });
        }
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Error fetching win probability graph:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch win probability graph' });
    }
});

// ── Dedicated Cricbuzz Scorecard Route ────────────────────────────────────────
// GET /api/cricket/scraped/match/:id/scorecard?slug=eng-vs-nz-2nd-test-...
// The slug is the path component after the matchId in the Cricbuzz URL.
// e.g. /live-cricket-scorecard/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026
//      -> matchId=129563, slug=eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026
// If slug is omitted, it will be auto-resolved from live/recent match lists.
router.get('/scraped/match/:id/scorecard', async (req, res) => {
    try {
        const { id } = req.params;
        const { slug } = req.query; // optional
        const force = req.query.force === '1' || req.query.force === 'true';

        // Intercept local IPL match
        const localData = await getLocalMatchScorecard(id);
        if (localData) return res.json({ status: 'success', data: localData });

        const data = await scrapeScorecard(id, slug || null, force);
        if (!data) {
            return res.status(200).json({ status: 'success', data: null, message: 'No scorecard data available yet — match may not have started.' });
        }
        res.json({ status: 'success', data });
    } catch (error) {
        console.error('[scorecard route] Error:', error.message);
        res.status(500).json({ status: 'error', data: null, error: error.message });
    }
});

router.get('/scraped/match/:id/:endpointType', async (req, res) => {
    const { id, endpointType } = req.params;
    
    // Intercept local IPL matches
    if (endpointType === 'info') {
        const localData = await getLocalMatchInfo(id);
        if (localData) return res.json({ status: 'success', data: localData });
    } else if (endpointType === 'squads') {
        const localData = await getLocalMatchSquads(id);
        if (localData) return res.json({ status: 'success', data: { success: true, data: localData } });
    } else if (endpointType === 'summary') {
        const localData = await getLocalMatchSummary(id);
        if (localData) return res.json({ status: 'success', data: { success: true, data: localData } });
    } else if (endpointType === 'scorecard') {
        const localData = await getLocalMatchScorecard(id);
        if (localData) return res.json({ status: 'success', data: { success: true, data: localData } });
    } else if (endpointType === 'commentary') {
        const localData = await getLocalMatchCommentary(id);
        if (localData) return res.json({ status: 'success', data: { success: true, data: localData } });
    } else if (endpointType === 'overs') {
        return res.json({ status: 'success', data: { success: true, data: { overSummaryList: [] } } });
    } else if (endpointType === 'graphs') {
        return res.json({ status: 'success', data: { success: true, data: { matchId: id } } });
    }

    const force = req.query.force === '1' || req.query.force === 'true';
    const data = await fetchMatchDetailScraped(id, endpointType, force);
    res.json({ status: 'success', data });
});
// =============================

import { getIplSeasons, fetchSeriesMatches, fetchSeriesStandings, fetchSeriesSquads, fetchSeriesStats } from '../services/cricbuzzSeriesScraper.js';

router.get('/scraped/series/ipl-seasons', async (req, res) => {
    try {
        const data = await getIplSeasons();
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/scraped/series/:id/:slug/matches', async (req, res) => {
    try {
        const data = await fetchSeriesMatches(req.params.id, req.params.slug);
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/scraped/series/:id/:slug/standings', async (req, res) => {
    try {
        const data = await fetchSeriesStandings(req.params.id, req.params.slug);
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/scraped/series/:id/:slug/squads', async (req, res) => {
    try {
        const data = await fetchSeriesSquads(req.params.id, req.params.slug);
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/scraped/series/:id/:slug/stats', async (req, res) => {
    try {
        const data = await fetchSeriesStats(req.params.id, req.params.slug);
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// Get specific match details - now uses scraper
router.get('/match/:id', async (req, res) => {
    try {
        const data = await fetchMatchDetailScraped(req.params.id, 'info');
        res.json(data);
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

        // 2. Check if it's a local IPL file match
        const localInfo = await getLocalMatchInfo(id);
        if (localInfo) {
            return res.json({ status: 'success', data: localInfo });
        }

        // 3. Fallback to Scraper API instead of RapidAPI
        const matchInfo = await fetchMatchDetailScraped(id, 'info');
        res.json({ status: 'success', data: matchInfo });
    } catch (error) {
        console.error("Local/Scraper match fetch error:", error);
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

// Cricbuzz Scorecard (uses dedicated HTML scraper)
router.get('/cb/scorecard/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { slug } = req.query;
        const force = req.query.force === '1' || req.query.force === 'true';
        const data = await scrapeScorecard(matchId, slug || null, force);
        if (!data) {
            return res.status(200).json({ status: 'success', data: null, message: 'No scorecard data available yet.' });
        }
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Squads
router.get('/cb/squads/:matchId', async (req, res) => {
    try {
        const data = await fetchMatchDetailScraped(req.params.matchId, 'squads');
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Commentary (legacy RSC endpoint - used as fallback)
router.get('/cb/commentary/:matchId', async (req, res) => {
    try {
        const force = req.query.force === '1' || req.query.force === 'true';
        const data = await fetchMatchDetailScraped(req.params.matchId, 'commentary', force);
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// ── Full Commentary Scraper (Cricbuzz HTML page → RSC payload extraction)
// GET /api/cricket/cb/full-commentary/:matchId?slug=eng-vs-nz-2nd-test-...
// The slug is the URL path segment after the matchId on Cricbuzz's full-commentary page.
// Example: /live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026
//   → matchId=129563, slug=eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026
// If slug is omitted, the server attempts auto-resolution from cached live match data.
router.get('/cb/full-commentary/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { slug } = req.query; // optional
        const force = req.query.force === '1' || req.query.force === 'true';

        // Intercept local IPL match
        const localData = await getLocalMatchCommentary(matchId);
        if (localData) return res.json({ status: 'success', data: { success: true, data: localData } });

        const data = await scrapeFullCommentary(matchId, slug || null, force);
        if (!data) {
            return res.status(200).json({
                status: 'success',
                data: null,
                message: 'No commentary data available — match may not have started or page structure changed.'
            });
        }
        res.json({ status: 'success', data });
    } catch (error) {
        console.error('[full-commentary route] Error:', error.message);
        res.status(500).json({ status: 'error', data: null, error: error.message });
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

// ─── PERFORMANCE LAB (STEALTH SCRAPER & IN-MEMORY CACHING) ──────────

import { fetchTeamSquad, fetchPlayerDeepStats } from '../services/cricbuzzScraperService.js';

// GET /api/cricket/team-analysis/:teamId
// Uses Cricsheet Service to lazy-load, aggregate, and cache Deep Dive Analytics
router.get('/team-analysis/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const format = req.query.format || 't20i'; // t20i, odi, test, all
        
        // Lazy loads data: checks cache, if missing -> downloads, parses, and caches
        const data = await getTeamAnalytics(teamId, format);
        res.json({ status: 'success', data });
    } catch (error) {
        console.error("Error fetching team analytics:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

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

// ====== LOCAL IPL DATA ROUTES ======
let localIplCache = null;
function getLocalIplData() {
    if (localIplCache) return localIplCache;
    try {
        const dataPath = path.join(__dirname, '..', 'data', 'ipl_local_data.json');
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8');
            localIplCache = JSON.parse(raw);
            return localIplCache;
        }
    } catch (e) {
        console.error("Error reading local IPL data:", e);
    }
    return {};
}

router.get('/local/ipl-seasons', (req, res) => {
    try {
        const data = getLocalIplData();
        const seasons = Object.keys(data)
            .map(k => ({ id: k, year: k, name: `IPL ${k}`, slug: `ipl-${k}` }))
            .sort((a, b) => parseInt(b.year) - parseInt(a.year));
        res.json({ status: 'success', data: seasons });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/local/ipl-matches/:season', (req, res) => {
    try {
        const data = getLocalIplData();
        const seasonData = data[req.params.season];
        res.json({ status: 'success', data: seasonData ? seasonData.matches : [] });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/local/ipl-standings/:season', (req, res) => {
    try {
        const data = getLocalIplData();
        const seasonData = data[req.params.season];
        res.json({ status: 'success', data: seasonData ? seasonData.standings : [] });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/local/ipl-squads/:season', (req, res) => {
    try {
        const data = getLocalIplData();
        const seasonData = data[req.params.season];
        res.json({ status: 'success', data: seasonData ? seasonData.squads : {} });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/local/ipl-stats/:season', (req, res) => {
    try {
        const data = getLocalIplData();
        const seasonData = data[req.params.season];
        res.json({ status: 'success', data: seasonData ? seasonData.stats : { topRunScorers: [], topWicketTakers: [] } });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

export default router;
