import asyncHandler from 'express-async-handler';
import Auction from '../models/Auction.js';
import TradeRequest from '../models/TradeRequest.js';
import { getIO } from '../config/socket.js';

// @desc    Create a trade offer
// @route   POST /api/auctions/:id/trade
// @access  Protected (Owner)
export const createTrade = asyncHandler(async (req, res) => {
    const { fromTeamId, toTeamId, fromPlayers, toPlayers, cash, tradeType } = req.body;
    const auctionId = req.params.id;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // 1. Auction Phase Check
    if (auction.status !== 'Completed') {
        res.status(400);
        throw new Error('Trading is only available after the auction is completed');
    }

    // 2. Deadline Check
    if (auction.tradeDeadline && new Date() > new Date(auction.tradeDeadline)) {
        res.status(400);
        throw new Error('The trade deadline has passed');
    }

    // Basic validation
    const fromTeam = auction.teams.id(fromTeamId);
    const toTeam = auction.teams.id(toTeamId);

    if (!fromTeam || !toTeam) {
        res.status(400);
        throw new Error('Teams not found in this auction');
    }

    // Logic: Budget check (pro-active)
    if (tradeType === 'CashOnly' || tradeType === 'PlayerCash') {
        if (cash > 0 && fromTeam.budgetRemaining < cash) {
            res.status(400);
            throw new Error('Insufficient budget for this trade');
        }
        if (cash < 0 && toTeam.budgetRemaining < Math.abs(cash)) {
            res.status(400);
            throw new Error('Target team has insufficient budget');
        }
    }

    const trade = await TradeRequest.create({
        auctionId,
        fromTeamId,
        fromTeamName: fromTeam.name,
        toTeamId,
        toTeamName: toTeam.name,
        fromPlayers,
        toPlayers,
        cash,
        tradeType,
        status: 'Pending',
        proposingCaptainEmail: req.user.email
    });

    // Notify all participants
    try {
        const io = getIO();
        io.to(`auction_${auctionId}`).emit('trade_update', { auctionId });
    } catch (err) {}

    res.status(201).json({ success: true, data: trade });
});

// @desc    Respond to a trade offer
// @route   POST /api/auctions/:id/trade/:tradeId/respond
// @access  Protected (Owner)
export const respondToTrade = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const trade = await TradeRequest.findById(req.params.tradeId);

    if (!trade) {
        res.status(404);
        throw new Error('Trade request not found');
    }

    if (!['Accepted', 'Rejected'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status response');
    }

    trade.status = status;
    await trade.save();

    // Notify all participants
    try {
        const io = getIO();
        io.to(`auction_${trade.auctionId}`).emit('trade_update', { auctionId: trade.auctionId });
    } catch (err) {}

    res.json({ success: true, data: trade });
});

// @desc    Approve and Execute trade (By Auctioneer)
// @route   POST /api/auctions/:id/trade/:tradeId/approve
// @access  Protected (Admin/Creator)
export const approveTrade = asyncHandler(async (req, res) => {
    const trade = await TradeRequest.findById(req.params.tradeId);
    if (!trade || trade.status !== 'Accepted') {
        res.status(400);
        throw new Error('Trade not available for approval');
    }

    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    const fromTeam = auction.teams.id(trade.fromTeamId);
    const toTeam = auction.teams.id(trade.toTeamId);

    // 1. Validate constraints again
    // Squad size check
    const newFromSize = fromTeam.players.length - (trade.fromPlayers?.length || 0) + (trade.toPlayers?.length || 0);
    const newToSize = toTeam.players.length - (trade.toPlayers?.length || 0) + (trade.fromPlayers?.length || 0);

    if (newFromSize < auction.minPlayersPerTeam || newToSize < auction.minPlayersPerTeam) {
        res.status(400);
        throw new Error('Trade would violate minimum player requirement');
    }

    if (trade.cash > 0 && fromTeam.budgetRemaining < trade.cash) {
        res.status(400);
        throw new Error('Proposer has insufficient budget');
    }

    if (trade.cash < 0 && toTeam.budgetRemaining < Math.abs(trade.cash)) {
        res.status(400);
        throw new Error('Recipient has insufficient budget');
    }

    // 2. Execute Transfer
    // Move Players
    if (trade.fromPlayers?.length > 0) {
        trade.fromPlayers.forEach(tp => {
            const playerIdx = fromTeam.players.findIndex(p => p.name === tp.name);
            if (playerIdx > -1) {
                const playerData = fromTeam.players[playerIdx];
                toTeam.players.push(playerData);
                fromTeam.players.splice(playerIdx, 1);

                // Update original player record in playerPool
                const poolPlayer = auction.playerPool.find(p => p.name === tp.name);
                if (poolPlayer) poolPlayer.soldTo = toTeam._id;
            }
        });
    }

    if (trade.toPlayers?.length > 0) {
        trade.toPlayers.forEach(tp => {
            const playerIdx = toTeam.players.findIndex(p => p.name === tp.name);
            if (playerIdx > -1) {
                const playerData = toTeam.players[playerIdx];
                fromTeam.players.push(playerData);
                toTeam.players.splice(playerIdx, 1);

                // Update original player record in playerPool
                const poolPlayer = auction.playerPool.find(p => p.name === tp.name);
                if (poolPlayer) poolPlayer.soldTo = fromTeam._id;
            }
        });
    }

    // 3. Move Cash
    if (trade.cash !== 0) {
        fromTeam.budgetRemaining -= trade.cash;
        toTeam.budgetRemaining += trade.cash;
    }

    auction.markModified('teams');
    auction.markModified('playerPool');
    await auction.save();

    trade.status = 'Approved';
    await trade.save();

    // Broadcast full auction update for rosters/budgets
    try {
        const io = getIO();
        io.to(`auction_${req.params.id}`).emit('auction_update', auction);
        io.to(`auction_${req.params.id}`).emit('trade_update', { auctionId: req.params.id });
    } catch (err) {}

    res.json({ success: true, message: 'Trade executed successfully', data: auction });
});

// @desc    Get trades for an auction
// @route   GET /api/auctions/:id/trades
// @access  Protected
export const getAuctionTrades = asyncHandler(async (req, res) => {
    const trades = await TradeRequest.find({ auctionId: req.params.id }).sort('-createdAt');
    res.json({ success: true, data: trades });
});
