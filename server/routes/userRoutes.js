import express from 'express';
import {
    getProfile,
    updateProfile,
    getPreferences,
    updatePreferences,
    getUserStats
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Profile routes
router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

// Preferences routes
router.route('/preferences')
    .get(getPreferences)
    .put(updatePreferences);

// Stats route
router.get('/stats', getUserStats);

export default router;
