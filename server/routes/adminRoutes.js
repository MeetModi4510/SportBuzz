import express from 'express';
import {
    getStats,
    getUsers,
    getPlayers,
    updateUserRole,
    deleteUser,
    deletePlayer
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and require admin role
router.use((req, res, next) => {
    console.log(`[ADMIN-ROUTE] Accessing ${req.method} ${req.url} as user ${req.user?._id} (${req.user?.role})`);
    next();
});
router.use(protect);
router.use((req, res, next) => {
    console.log(`[ADMIN-AUTH] Authenticated as user ${req.user?._id} (${req.user?.role})`);
    next();
});
router.use(adminOnly);
router.use((req, res, next) => {
    console.log(`[ADMIN-ACCESS] Admin access granted`);
    next();
});

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/players', getPlayers);
router.post('/players/delete', deletePlayer);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
