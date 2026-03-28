import express from 'express';
import multer from 'multer';
import { 
    getPlayerStats, 
    getPlayerMatchup, 
    searchPlayers, 
    checkPlayerInTournament,
    updatePlayerPhoto,
    createPlayer
} from '../controllers/playerController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/search', searchPlayers);
router.post('/', protect, createPlayer);
router.get('/check-tournament', checkPlayerInTournament);
router.get('/:name/stats', getPlayerStats);
router.get('/matchup/:batsman/:bowler', getPlayerMatchup);
router.put('/:idOrName/photo', upload.single('photo'), updatePlayerPhoto);

export default router;
