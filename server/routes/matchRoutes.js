import express from 'express';
import {
    createMatch,
    getMatches,
    getMatchById,
    updateMatch,
    deleteMatch,
    recordBall,
    getMatchBalls,
    undoLastBall,
    getMatchForecast
} from '../controllers/matchController.js';
import { protect, adminOnly, adminOrScorer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getMatches)
    .post(protect, adminOrScorer, createMatch);

router.get('/:id/forecast', getMatchForecast);

router.route('/:id')
    .get(getMatchById)
    .put(protect, adminOrScorer, updateMatch)
    .delete(protect, adminOnly, deleteMatch);

router.post('/:id/balls', protect, adminOrScorer, recordBall);
router.get('/:id/balls', getMatchBalls);
router.delete('/:id/balls/last', protect, adminOrScorer, undoLastBall);

export default router;
