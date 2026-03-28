import express from 'express';
import {
    createAuction,
    updateAuctionTeams,
    addAuctionPlayers,
    startAuction,
    ownerLogin,
    getNextPlayer,
    placeBid,
    sellPlayer,
    finalizeAuction,
    clearAuctionPlayers,
    deleteAuction,
    followAuction,
    updateAuction,
    deleteAuctionPlayer,
    undoBid,
    updateTeamLogo
} from '../controllers/auctionController.js';
import {
    createTrade,
    respondToTrade,
    approveTrade,
    getAuctionTrades
} from '../controllers/tradeController.js';
import { getAuctionAnalytics } from '../controllers/analyticsController.js';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import Auction from '../models/Auction.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protected routes (Any logged-in user can create/view)
router.post('/', protect, createAuction);
router.get('/', protect, asyncHandler(async (req, res) => {
    // Show all auctions so others can watch/bid
    const auctions = await Auction.find({}).sort('-createdAt').populate('createdBy', 'name email');
    res.json({ success: true, data: auctions });
}));

// Public routes
router.post('/:id/owner-login', ownerLogin);
router.put('/:id/teams/:teamId/logo', protect, upload.single('logo'), updateTeamLogo);
router.get('/:id', asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id).populate('createdBy', 'name email');
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }
    res.json({ success: true, data: auction });
}));

router.put('/:id/teams', protect, updateAuctionTeams);
router.post('/:id/players', protect, addAuctionPlayers);
router.post('/:id/start', protect, startAuction);
router.post('/:id/next-player', protect, getNextPlayer);
router.post('/:id/sell', protect, sellPlayer);
router.post('/:id/finalize', protect, finalizeAuction);
router.post('/:id/clear-players', protect, clearAuctionPlayers);
router.post('/:id/follow', protect, followAuction);
router.put('/:id', protect, updateAuction);
router.delete('/:id', protect, deleteAuction);
router.delete('/:id/players/:playerId', protect, deleteAuctionPlayer);

// Bidding can be done by Admin or Owner (using protect middleware with owner check logic eventually)
router.post('/:id/bid', protect, placeBid);
router.post('/:id/undo-bid', protect, undoBid);

// Trade & Analytics
router.get('/:id/analytics', protect, getAuctionAnalytics);
router.get('/:id/trades', protect, getAuctionTrades);
router.post('/:id/trade', protect, createTrade);
router.post('/:id/trade/:tradeId/respond', protect, respondToTrade);
router.post('/:id/trade/:tradeId/approve', protect, approveTrade);

export default router;
