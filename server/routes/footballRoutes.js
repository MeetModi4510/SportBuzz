import express from 'express';
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
import { getDashboardMatches, getMatchById as getRealMatchById, getMatchDetail, clearCache } from '../services/footballDataService.js';

const router = express.Router();

// ─── Real Football Data (Hybrid: AllSportsApi2 + Football-Data.org) ───
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

// Single real match by Football-Data.org ID
router.get('/real/:id', async (req, res) => {
    try {
        const match = await getRealMatchById(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (err) {
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

export default router;
