import express from 'express';
import { getFeaturedMatches } from '../controllers/featuredController.js';

const router = express.Router();

router.get('/matches', getFeaturedMatches);

export default router;
