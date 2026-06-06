import express from 'express';
import { getFeaturedMatches, getFeaturedLive, getFeaturedUpcoming, getFeaturedRecent } from '../controllers/featuredController.js';

const router = express.Router();

router.get('/matches', getFeaturedMatches);

// Lazy-load endpoints — each only calls the one Cricbuzz list it needs
router.get('/matches/live', getFeaturedLive);
router.get('/matches/upcoming', getFeaturedUpcoming);
router.get('/matches/recent', getFeaturedRecent);

export default router;
