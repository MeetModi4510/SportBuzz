import express from 'express';
import {
    getActivityHistory,
    getAchievements,
    getActivitySummary
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getActivityHistory);
router.get('/achievements', getAchievements);
router.get('/summary', getActivitySummary);

export default router;
