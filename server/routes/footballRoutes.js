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
    unfollowTournament
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

const router = express.Router();

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
