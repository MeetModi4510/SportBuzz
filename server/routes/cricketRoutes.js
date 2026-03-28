import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cricketService } from '../services/cricketApiService.js';
import { cricbuzzService } from '../services/cricbuzzService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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

// Cricbuzz Scorecard — accepts CricketData.org match ID, maps internally
router.get('/cb/scorecard/:cdMatchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getScorecard(req.params.cdMatchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Squads — extracted from scorecard data
router.get('/cb/squads/:cdMatchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getSquads(req.params.cdMatchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

// Cricbuzz Commentary — highlight commentary
router.get('/cb/commentary/:cdMatchId', async (req, res) => {
    try {
        const result = await cricbuzzService.getCommentary(req.params.cdMatchId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message, data: null });
    }
});

export default router;
