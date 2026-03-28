import express from 'express';
import {
    createTournament,
    getTournaments,
    getTournamentById,
    updateTournament,
    deleteTournament,
    addTeamToTournament,
    getTournamentStats,
    shuffleTournamentGroups,
    recalculatePointsTable,
    followTournament,
    unfollowTournament
} from '../controllers/tournamentController.js';
import { protect, optionalAuth, adminOnly, adminOrScorer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(optionalAuth, getTournaments)
    .post(protect, adminOrScorer, createTournament);

router.get('/:id/stats', getTournamentStats);
router.post('/:id/teams', protect, adminOrScorer, addTeamToTournament);
router.put('/:id/shuffle', protect, adminOrScorer, shuffleTournamentGroups);
router.post('/:id/recalculate', protect, adminOrScorer, recalculatePointsTable);
router.post('/:id/follow', protect, followTournament);
router.post('/:id/unfollow', protect, unfollowTournament);

router.route('/:id')
    .get(getTournamentById)
    .put(protect, adminOrScorer, updateTournament)
    .delete(protect, adminOnly, deleteTournament);

export default router;
