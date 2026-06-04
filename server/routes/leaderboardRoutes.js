import express from 'express';
import { getLeaderboard, getMyStats } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getLeaderboard);
router.get('/me', getMyStats);

export default router;
