import express from 'express';
import { getStateMatches } from '../controllers/stateMatchesController.js';

const router = express.Router();

/**
 * @route   GET /api/stateMatches
 * @desc    Get state-level cricket matches (Ranji Trophy, etc.)
 * @access  Public
 */
router.get('/', getStateMatches);

export default router;
