import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import FootballStanding from '../models/FootballStanding.js';
import WorldCupStanding from '../models/WorldCupStanding.js';
import FotmobCache from '../models/FotmobCache.js';
import BDFutbolCache from '../models/BDFutbolCache.js';
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
import { getDashboardMatches, getCategorizedMatches, getMatchDetail, getGlobalFootballNews, getFootballLiveNews, clearCache, getFootballNewsArticle } from '../services/footballDataService.js';
import livescore6Service from '../services/livescore6Service.js';
import * as espnService from '../services/espnService.js';
import { fotmobService } from '../services/fotmobService.js';
import { imageQueueService } from '../services/imageQueueService.js';
import { scrapeBDFutbolVenue } from '../services/bdfutbolScraperService.js';

const router = express.Router();

// ─── FOOTBALL PLAYER IMAGE PROXY (BY NAME) ───
// GET /api/football/player-image?name=Lionel Messi
// Automatically resolves a player name to an image URL using open APIs and redirects to it.
router.get('/player-image', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: "Missing ?name= parameter" });

        const cacheKey = `/player-image/${name.toLowerCase()}`;
        const cached = await FotmobCache.findOne({ endpoint: cacheKey, cacheExpiry: { $gt: new Date() } });
        if (cached && cached.data && cached.data.url) {
            return res.redirect(cached.data.url);
        }

        let imageUrl = null;

        // 1. Try ESPN Search API (Incredible quality, huge transparent cutouts, no Cloudflare, extremely fast JSON API)
        try {
            const espnSearchUrl = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=5&type=player`;
            const espnRes = await axios.get(espnSearchUrl, { timeout: 3000 });
            
            const players = espnRes.data?.results?.find(r => r.type === 'player')?.contents;
            if (players && players.length > 0) {
                const soccerPlayer = players.find(p => p.sport === 'soccer' || p.link?.web?.includes('/soccer/'));
                if (soccerPlayer && soccerPlayer.image?.default) {
                    imageUrl = soccerPlayer.image.default;
                } else if (players[0].image?.default) {
                    imageUrl = players[0].image.default;
                }
            }
        } catch (e) {
            console.warn(`ESPN search failed for ${name}`);
        }

        // 2. Try FotMob Search API (Fast, extremely reliable, high quality transparent cutouts)
        if (!imageUrl) {
            try {
                const fotmobRes = await axios.get(`https://pub.fotmob.com/searchapi/suggest?term=${encodeURIComponent(name)}`, { timeout: 3000 });
                const suggestions = fotmobRes.data?.squadMemberSuggest?.[0]?.options;
                if (suggestions && suggestions.length > 0) {
                    const fotmobId = suggestions[0].payload?.id;
                    if (fotmobId) imageUrl = `https://images.fotmob.com/image_resources/playerimages/${fotmobId}.png`;
                }
            } catch (e) {
                console.warn(`FotMob search failed for ${name}`);
            }
        }

        // 3. Fallback to TheSportsDB API
        if (!imageUrl) {
            try {
                const tsdbRes = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`, { timeout: 3000 });
                const players = tsdbRes.data?.player;
                if (players && players.length > 0) {
                    imageUrl = players[0].strCutout || players[0].strThumb || players[0].strRender;
                }
            } catch (e) {
                console.warn(`TSDB search failed for ${name}`);
            }
        }

        // 4. Ultimate Fallback: generic silhouette
        if (!imageUrl) {
            imageUrl = 'https://www.thesportsdb.com/images/media/player/thumb/generic.png';
        }

        // Cache the result for 24 hours
        if (imageUrl) {
            await FotmobCache.findOneAndUpdate(
                { endpoint: cacheKey },
                { 
                    endpoint: cacheKey, 
                    data: { url: imageUrl }, 
                    cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    lastFetched: new Date()
                },
                { upsert: true, new: true }
            ).catch(err => console.warn(`Failed to cache image url for ${name}`, err.message));
        }

        res.redirect(imageUrl);
    } catch (error) {
        res.redirect('https://www.thesportsdb.com/images/media/player/thumb/generic.png');
    }
});

// ─── TRANSFERMARKT IMAGE PROXY ───
// GET /api/football/tm-img-proxy?url=https://tmssl.akamaized.net/...
// Fetches Transfermarkt images server-side (bypasses hotlink protection) and streams to browser.
router.get('/tm-img-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('Missing url param');

        // Only allow known Transfermarkt CDN domains for security
        const allowedDomains = ['tmssl.akamaized.net', 'img.a.transfermarkt.technology', 'transfermarkt.co.in', 'transfermarkt.com'];
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).send('Invalid URL');
        }
        const isAllowed = allowedDomains.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d));
        if (!isAllowed) return res.status(403).send('Domain not allowed');

        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Referer': 'https://www.transfermarkt.co.in/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            }
        });

        // Forward the content-type and cache headers
        const contentType = response.headers['content-type'] || 'image/png';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day in browser
        response.data.pipe(res);
    } catch (error) {
        console.warn('[TM Proxy] Failed to proxy image:', error.message);
        res.status(404).send('Image not found');
    }
});



// ─── PROXY ROUTES FOR FRONTEND ───
// These proxies ensure API keys stay hidden on the backend while the frontend can still use the API-Sports schema

router.get('/proxy/*', async (req, res) => {
    try {
        const endpoint = req.params[0];
        const response = await axios.get(`https://v3.football.api-sports.io/${endpoint}`, {
            params: req.query,
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-apisports-key': process.env.API_KEY, 
                'x-rapidapi-key': process.env.API_KEY
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error(`[Proxy] /${req.params[0]} Error:`, err.message);
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: err.message });
    }
});

// ─── BDFUTBOL SCRAPER ────────────────────────────────────────────────────────
router.get('/venue/bdfutbol/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: 'Venue ID is required' });
        
        const data = await scrapeBDFutbolVenue(id);
        res.json({ success: true, data });
    } catch (error) {
        console.error(`Error in /venue/bdfutbol/${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server Error fetching BDFutbol data' });
    }
});

// ─── FOTMOB MATCH DETAILS ──────────────────────────────────────────────────────
router.get('/fotmob-matchDetails/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: 'Match ID is required' });
        
        const matchDetails = await fotmobService.fetchMatchDetails(id);
        if (!matchDetails) {
            return res.status(404).json({ success: false, message: 'Match details not found or failed to fetch' });
        }
        res.json({ success: true, data: matchDetails });
    } catch (error) {
        console.error(`Error in /fotmob-matchDetails/${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server Error fetching fotmob match details' });
    }
});

// ─── NEWS ARTICLE ────────────────────────────────────────────────────────────
router.post('/news-article', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: 'URL is required' });
        
        const paragraphs = await getFootballNewsArticle(url);
        res.json({ success: true, data: paragraphs });
    } catch (error) {
        console.error('News Article Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch news article', message: error.message, stack: error.stack });
    }
});

// ─── FOTMOB RESOLVE MATCH ID ──────────────────────────────────────────────────
// GET /api/football/fotmob-resolveMatchId?homeTeam=Spain&awayTeam=Saudi%20Arabia
router.get('/fotmob-resolveMatchId', async (req, res) => {
    try {
        const { homeTeam, awayTeam } = req.query;
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({ success: false, message: 'homeTeam and awayTeam query params required' });
        }

        const term = encodeURIComponent(`${homeTeam} ${awayTeam}`);
        const url = `https://apigw.fotmob.com/searchapi/suggest?term=${term}`;
        console.log(`[FotmobResolve] Searching: ${url}`);

        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        const matchSuggest = response.data?.matchSuggest;
        if (!matchSuggest || matchSuggest.length === 0) {
            return res.status(404).json({ success: false, message: 'No match found on Fotmob' });
        }

        // Find the best match — prefer one with both team names
        const homeNorm = homeTeam.toLowerCase();
        const awayNorm = awayTeam.toLowerCase();
        let bestMatch = null;
        for (const group of matchSuggest) {
            for (const opt of (group.options || [])) {
                const p = opt.payload;
                const hN = (p.homeName || '').toLowerCase();
                const aN = (p.awayName || '').toLowerCase();
                if ((hN.includes(homeNorm) || homeNorm.includes(hN)) &&
                    (aN.includes(awayNorm) || awayNorm.includes(aN))) {
                    bestMatch = p;
                    break;
                }
            }
            if (bestMatch) break;
        }

        // Fallback: just take first option
        if (!bestMatch) {
            bestMatch = matchSuggest[0]?.options?.[0]?.payload;
        }

        if (!bestMatch || !bestMatch.id) {
            return res.status(404).json({ success: false, message: 'Could not resolve Fotmob match ID' });
        }

        console.log(`[FotmobResolve] Resolved to Fotmob match ID: ${bestMatch.id} (${bestMatch.homeName} vs ${bestMatch.awayName})`);
        res.json({ success: true, fotmobMatchId: bestMatch.id, homeName: bestMatch.homeName, awayName: bestMatch.awayName });
    } catch (error) {
        console.error('[FotmobResolve] Error:', error.message);
        res.status(500).json({ success: false, message: 'Error resolving Fotmob match ID' });
    }
});


// ─── FOTMOB SQUAD DATA ───────────────────────────────────────────────────────
router.get('/fotmob-squad/:countryName', async (req, res) => {
    try {
        const { countryName } = req.params;
        if (!countryName) {
            return res.status(400).json({ success: false, message: 'Country name is required' });
        }

        const squad = await fotmobService.fetchSquadData(countryName);
        
        if (!squad || squad.length === 0) {
             return res.status(404).json({ success: false, message: 'Squad not found' });
        }

        res.json({
            success: true,
            data: squad
        });

    } catch (error) {
        console.error(`[Fotmob Route] Error:`, error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch squad data' });
    }
});

// ─── FOTMOB PLAYER DATA ───
router.get('/fotmob-player/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const player = await fotmobService.fetchPlayerData(id);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player data not found' });
        }
        res.json({ success: true, data: player });
    } catch (error) {
        console.error(`[Fotmob Player Route] Error:`, error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch fotmob player' });
    }
});

router.get('/fotmob-player-by-name/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;
        const playerInfo = await fotmobService.resolvePlayerId(playerName);
        if (!playerInfo || !playerInfo.id) {
            return res.status(404).json({ success: false, message: 'Player not found on Fotmob' });
        }
        
        const player = await fotmobService.fetchPlayerData(playerInfo.id);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player data not found' });
        }
        
        // Ensure ID is attached for frontend photo fetching
        player.id = playerInfo.id;
        
        res.json({ success: true, data: player });
    } catch (error) {
        console.error(`[Fotmob Player By Name Route] Error:`, error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch fotmob player by name' });
    }
});

// GET /api/football/fotmob-player-image-by-name/:playerName
router.get('/fotmob-player-image-by-name/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;
        const playerInfo = await fotmobService.resolvePlayerId(playerName);
        if (playerInfo && playerInfo.id) {
            return res.redirect(`https://images.fotmob.com/image_resources/playerimages/${playerInfo.id}.png`);
        }
        // Fallback transparent image
        return res.redirect('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
    } catch (error) {
        return res.redirect('https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png');
    }
});

router.get('/fotmob-player-stats', async (req, res) => {
    try {
        const { id, seasonId, tournamentId } = req.query;
        if (!id || !seasonId || !tournamentId) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }
        
        const cacheKey = `/fotmob-player-stats/${id}/${seasonId}/${tournamentId}`;
        const cached = await FotmobCache.findOne({ endpoint: cacheKey, cacheExpiry: { $gt: new Date() } });
        if (cached) {
            return res.json({ success: true, data: cached.data });
        }

        const url = `https://www.fotmob.com/api/data/playerStats?playerId=${id}&seasonId=${encodeURIComponent(seasonId)}&isFirstSeason=false`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const statsData = response.data;
        if (!statsData || Object.keys(statsData).length === 0) {
            return res.status(404).json({ success: false, message: 'Stats not found' });
        }
        
        await FotmobCache.findOneAndUpdate(
            { endpoint: cacheKey },
            { 
                endpoint: cacheKey, 
                data: statsData, 
                cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                lastFetched: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: statsData });
    } catch (error) {
        console.error(`[Fotmob Player Stats Route] Error:`, error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch fotmob player stats' });
    }
});

router.get('/fotmob-player-image/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        req.on('close', () => {
            if (!res.headersSent) {
                imageQueueService.cancelRequest(id);
            }
        });

        const buffer = await imageQueueService.getImage(id);
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (err) {
        if (!res.headersSent) {
            res.status(404).send('Not found');
        }
    }
});

// ─── FOTMOB TABLE SCRAPER ───────────────────────────────────────────────────
router.get('/fotmob-table/:leagueId', async (req, res) => {
    try {
        const { leagueId } = req.params;
        const cacheKey = `/fotmob-table/${leagueId}`;
        
        // Check cache (1 hour TTL)
        const cached = await FotmobCache.findOne({ endpoint: cacheKey, cacheExpiry: { $gt: new Date() } });
        if (cached) {
            return res.json({ success: true, data: cached.data });
        }

        const url = `https://www.fotmob.com/leagues/${leagueId}/table`;
        console.log(`[FotMob Scraper] Fetching ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        
        if (!nextData) {
            return res.status(404).json({ success: false, message: 'Could not find next data' });
        }
        
        const json = JSON.parse(nextData);
        const tables = json.props?.pageProps?.table?.[0]?.data?.tables;
        
        if (!tables) {
            return res.status(404).json({ success: false, message: 'Could not find tables in next data' });
        }
        
        // Save to cache
        await FotmobCache.findOneAndUpdate(
            { endpoint: cacheKey },
            { 
                endpoint: cacheKey, 
                data: tables, 
                cacheExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                lastFetched: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: tables });
    } catch (err) {
        console.error('[FotMob Scraper] Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch table' });
    }
});

// ─── FOTMOB STATS SCRAPER ───────────────────────────────────────────────────
router.get('/fotmob-stats/:leagueId', async (req, res) => {
    try {
        const { leagueId } = req.params;
        const cacheKey = `/fotmob-stats/${leagueId}`;
        
        // Check cache (1 hour TTL)
        const cached = await FotmobCache.findOne({ endpoint: cacheKey, cacheExpiry: { $gt: new Date() } });
        if (cached) {
            return res.json({ success: true, data: cached.data });
        }

        const url = `https://www.fotmob.com/leagues/${leagueId}/stats/world-cup/players`;
        console.log(`[FotMob Scraper] Fetching ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        
        if (!nextData) return res.status(404).json({ success: false, message: 'Could not find next data' });
        
        const json = JSON.parse(nextData);
        const playersStats = json.props?.pageProps?.stats?.players;
        const teamsStats = json.props?.pageProps?.stats?.teams;
        
        if (!playersStats || !Array.isArray(playersStats)) {
            return res.status(404).json({ success: false, message: 'Could not find player stats' });
        }
        
        // Fetch details sequentially with a 300ms delay (Throttling)
        const delay = ms => new Promise(res => setTimeout(res, ms));
        const results = [];

        for (const statGroup of playersStats) {
            if (statGroup.fetchAllUrl) {
                try {
                    const fetchUrl = statGroup.fetchAllUrl.startsWith('http') ? statGroup.fetchAllUrl : `https://data.fotmob.com${statGroup.fetchAllUrl}`;
                    const statRes = await axios.get(fetchUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });
                    results.push({
                        header: statGroup.header,
                        data: statRes.data?.TopLists?.[0]?.StatList || []
                    });
                } catch (e) {
                    console.warn(`[FotMob Scraper] Failed to fetch full stats for ${statGroup.header}:`, e.message);
                    results.push({ header: statGroup.header, data: statGroup.topThree || [] });
                }
                
                // Add the 400ms human-like browsing delay
                await delay(400);
            } else {
                results.push({ header: statGroup.header, data: statGroup.topThree || [] });
            }
        }

        const teamResults = [];
        if (teamsStats && Array.isArray(teamsStats)) {
            for (const statGroup of teamsStats) {
                if (statGroup.fetchAllUrl) {
                    try {
                        const fetchUrl = statGroup.fetchAllUrl.startsWith('http') ? statGroup.fetchAllUrl : `https://data.fotmob.com${statGroup.fetchAllUrl}`;
                        const statRes = await axios.get(fetchUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                        });
                        teamResults.push({
                            header: statGroup.header,
                            data: statRes.data?.TopLists?.[0]?.StatList || []
                        });
                    } catch (e) {
                        console.warn(`[FotMob Scraper] Failed to fetch full stats for team ${statGroup.header}:`, e.message);
                        teamResults.push({ header: statGroup.header, data: statGroup.topThree || [] });
                    }
                    await delay(400);
                } else {
                    teamResults.push({ header: statGroup.header, data: statGroup.topThree || [] });
                }
            }
        }
        
        // Save to cache
        await FotmobCache.findOneAndUpdate(
            { endpoint: cacheKey },
            { 
                endpoint: cacheKey, 
                data: { players: results, teams: teamResults }, 
                cacheExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                lastFetched: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: { players: results, teams: teamResults } });
    } catch (err) {
        console.error('[FotMob Scraper] Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});
// ─── LATEST TRANSFERS ─────────────────────────────────────────────────────────
// Serves transfers from MongoDB cache (2-hour TTL).
import { scrapeFotmobTransfers } from '../services/fotmobTransfersScraper.js';

const TRANSFERS_CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours

async function updateTransfersCache() {
    const combined = [];
    
    // Fetch from Fotmob service
    console.log('[Transfers] Scraping latest transfers from FotMob...');
    const fotmobTransfers = await scrapeFotmobTransfers();
    
    combined.push(...fotmobTransfers);

    if (combined.length === 0) throw new Error('Empty transfers response from scraper');

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

    const cacheExpiry = new Date(Date.now() + TRANSFERS_CACHE_MS);
    const now = new Date();

    const docs = uniqueTransfers.map(t => ({
        transferId:        `${t.playerId}_${t.transferDate}`,
        playerId:          t.playerId,
        playerName:        t.name || '',
        playerImage:       t.playerImage || '',
        position:          t.position?.label || t.position?.key || '',
        fromClub:          t.fromClub || t.fromClubFullName || '',
        fromClubId:        t.fromClubId,
        fromClubLogo:      t.fromClubLogo || '',
        toClub:            t.toClub || t.toClubFullName || '',
        toClubId:          t.toClubId,
        toClubLogo:        t.toClubLogo || '',
        transferDate:      new Date(t.transferDate || now),
        fee:               t.fee || '',
        feeValue:          t.feeValue || 0,
        transferType:      t.transferType || '',
        marketValue:       t.marketValue || 0,
        leagueId:          t.leagueId || '',
        onLoan:            t.onLoan || false,
        contractExtension: t.contractExtension || false,
        isPopular:         t.isPopular || false,
        cacheExpiry,
        lastFetched:       now,
    }));

    if (docs.length > 0) {
        // Only wipe old records AFTER we have confirmed new data — prevents data loss if scraper is blocked
        await FootballTransfer.deleteMany({});
        await FootballTransfer.insertMany(docs);
        console.log(`[Transfers] Stored ${docs.length} transfers from FotMob.`);
    } else {
        console.warn('[Transfers] Scraper returned 0 docs — keeping existing data in DB to avoid data loss.');
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
        console.log('[Transfers] Cache expired or empty – fetching from FotMob…');
        const { rows, lastFetched } = await updateTransfersCache();

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

// Seed transfers cache on server startup so the first user request is fast.
// Runs in the background — does not block the server boot.
(async () => {
    try {
        const existing = await FootballTransfer.findOne({ cacheExpiry: { $gt: new Date() } });
        if (!existing) {
            console.log('[Transfers] No valid cache found on startup — seeding in background...');
            await updateTransfersCache();
            console.log('[Transfers] Startup seed complete.');
        } else {
            console.log('[Transfers] Cache already warm on startup — skipping seed.');
        }
    } catch (err) {
        console.warn('[Transfers] Startup seed failed (non-fatal):', err.message);
    }
})();

// Start a background silent updater that runs every 2 hours
setInterval(async () => {
    try {
        console.log('[Transfers] Running scheduled background update (every 2 hours)...');
        await updateTransfersCache();
    } catch (err) {
        console.error('[Transfers] Scheduled background update failed:', err.message);
    }
}, TRANSFERS_CACHE_MS);

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
// Fetches player image sequentially, caches it in browser for 1 hour
router.get('/player-image/:playerName', async (req, res) => {
    const { playerName } = req.params;
    const { team } = req.query;
    if (!playerName) return res.status(400).json({ success: false, message: 'Player name required' });

    const apiKey = process.env.sofascore_api_footballtopstats_playerimages;

    try {
        if (!apiKey) {
            // Serve placeholder if no API key
            return res.status(404).send('No API key');
        }

        // Fetch from Sofascore
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
                const contentType = imgRes.headers['content-type'];
                res.set('Content-Type', contentType);
                res.set('Cache-Control', 'public, max-age=3600');
                return res.send(imgRes.data);
            }
        }
        
        // No player or image found
        res.status(404).send('Not found');

    } catch (err) {
        console.error(`[Football Player Image] Error for ${playerName}:`, err.message);
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
// ESPN Player Profile
// ESPN Player Profile
router.get('/v3/player-profile/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const leagueId = req.query.leagueId || 'eng.1';
        const profile = await espnService.getPlayerProfile(playerId, leagueId);
        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('[ESPN] Player profile error:', err.message);
        res.status(404).json({ success: false, message: 'Player profile not found' });
    }
});

// Fotmob Player Recent Matches
router.get('/v3/player-recent-matches/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;
        const playerInfo = await fotmobService.resolvePlayerId(playerName);
        if (!playerInfo) {
             return res.status(404).json({ success: false, message: 'Player not found on Fotmob' });
        }
        
        const playerData = await fotmobService.fetchPlayerData(playerInfo.id);
        if (!playerData || !playerData.recentMatches) {
             return res.status(404).json({ success: false, message: 'Recent matches not found' });
        }

        res.json({ success: true, data: playerData.recentMatches });
    } catch (err) {
        console.error('[Fotmob] Recent matches error:', err.message);
        res.status(500).json({ success: false, message: 'Error fetching recent matches' });
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
        const { name, fotmobId } = req.query;
        if (fotmobId) {
            const fotmobUrl = `https://images.fotmob.com/image_resources/playerimages/${fotmobId}.png`;
            try {
                const imgRes = await axios.get(fotmobUrl, { responseType: 'arraybuffer', timeout: 5000 });
                const base64 = Buffer.from(imgRes.data).toString('base64');
                const contentType = imgRes.headers['content-type'] || 'image/png';
                const dataUri = `data:${contentType};base64,${base64}`;
                return res.json({ success: true, base64: dataUri, url: fotmobUrl });
            } catch (e) {
                return res.status(404).json({ success: false, message: 'Fotmob image not found' });
            }
        }
        
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

// FIFA Men's Rankings
router.get('/fifa-rankings/men', async (req, res) => {
    try {
        const cacheKey = '/fifa-rankings/men';
        // Check cache (valid for 24 hours)
        const cached = await FotmobCache.findOne({ endpoint: cacheKey, cacheExpiry: { $gt: new Date() } });
        if (cached) {
            return res.json({ success: true, data: cached.data });
        }

        // Fetch latest period ID
        const periodRes = await axios.get('https://www.fotmob.com/api/data/fifarankings/period?gender=men', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        if (!periodRes.data || !periodRes.data.length) {
            return res.status(404).json({ success: false, message: 'Could not fetch ranking periods' });
        }
        
        const latestPeriodId = periodRes.data[0].periodId;

        // Fetch rankings for that period
        const rankingRes = await axios.get(`https://www.fotmob.com/api/data/fifarankings/ranking?gender=men&periodId=${latestPeriodId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        if (!rankingRes.data || !Array.isArray(rankingRes.data)) {
            return res.status(404).json({ success: false, message: 'Could not fetch rankings' });
        }

        const rankings = rankingRes.data;

        // Save to cache (24 hours expiry)
        await FotmobCache.findOneAndUpdate(
            { endpoint: cacheKey },
            {
                data: rankings,
                cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                lastFetched: new Date()
            },
            { upsert: true }
        );

        res.json({ success: true, data: rankings });
    } catch (error) {
        console.error('[FIFA Rankings] Error:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching FIFA rankings' });
    }
});

export default router;

// touch