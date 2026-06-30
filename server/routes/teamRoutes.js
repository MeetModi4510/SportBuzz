import express from 'express';
import {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    joinTeam,
    generateCodes,
    deleteTeam
} from '../controllers/teamController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getTeams)
    .post(createTeam);

router.post('/join', protect, joinTeam);
router.post('/:id/generate-codes', generateCodes);

router.route('/:id')
    .get(getTeamById)
    .put(protect, updateTeam)
    .delete(protect, deleteTeam);

export default router;
