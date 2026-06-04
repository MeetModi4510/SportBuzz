import express from 'express';
import {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite
} from '../controllers/favoritesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getFavorites)
    .post(addFavorite);

router.get('/check/:matchId', checkFavorite);

router.delete('/:id', removeFavorite);

export default router;
