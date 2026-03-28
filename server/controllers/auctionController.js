import asyncHandler from 'express-async-handler';
import Auction from '../models/Auction.js';
import Notification from '../models/Notification.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { getIO } from '../config/socket.js';

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Admin
export const createAuction = asyncHandler(async (req, res) => {
    const { name, budgetPerTeam, minPlayersPerTeam, maxPlayersPerTeam, teamCount, currency } = req.body;

    // Create empty team slots
    const teams = [];
    for (let i = 0; i < teamCount; i++) {
        teams.push({
            name: `Team ${i + 1}`,
            captainEmail: `pending-${i + 1}@sportbuzz.com`,
            budgetRemaining: budgetPerTeam,
            players: []
        });
    }

    const auction = await Auction.create({
        name,
        currency: currency || 'USD',
        budgetPerTeam,
        minPlayersPerTeam,
        maxPlayersPerTeam,
        teams,
        createdBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: auction
    });
});

// @desc    Update auction settings
// @route   PUT /api/auctions/:id
// @access  Protected (Creator only)
export const updateAuction = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    if (String(auction.createdBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to update this auction');
    }

    const { name, budgetPerTeam, minPlayersPerTeam, maxPlayersPerTeam, currency, tradeDeadline } = req.body;

    // Update basic fields
    if (name) auction.name = name;
    if (currency) auction.currency = currency;
    if (minPlayersPerTeam) auction.minPlayersPerTeam = minPlayersPerTeam;
    if (maxPlayersPerTeam) auction.maxPlayersPerTeam = maxPlayersPerTeam;
    if (tradeDeadline !== undefined) auction.tradeDeadline = tradeDeadline;

    // If budget changes, recalculate all teams
    if (budgetPerTeam && budgetPerTeam !== auction.budgetPerTeam) {
        const diff = budgetPerTeam - auction.budgetPerTeam;
        auction.budgetPerTeam = budgetPerTeam;
        auction.teams.forEach(team => {
            team.budgetRemaining += diff;
        });
    }

    await auction.save();
    res.json({ success: true, data: auction });
});

// @desc    Update auction teams
// @route   PUT /api/auctions/:id/teams
// @access  Admin
export const updateAuctionTeams = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    const { teams } = req.body; // Expect array of { index, name, captainEmail }
    
    teams.forEach(t => {
        if (auction.teams[t.index]) {
            auction.teams[t.index].name = t.name;
            auction.teams[t.index].captainEmail = t.captainEmail;
            if (t.logo !== undefined) auction.teams[t.index].logo = t.logo;
        }
    });

    await auction.save();
    res.json({ success: true, data: auction });
});

// @desc    Add players to auction pool
// @route   POST /api/auctions/:id/players
// @access  Admin
export const addAuctionPlayers = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    const { players } = req.body; // Array of { name, role, basePrice, category }
    auction.playerPool.push(...players);

    await auction.save();
    res.json({ success: true, data: auction });
});

// @desc    Start auction (Live)
// @route   POST /api/auctions/:id/start
// @access  Admin
export const startAuction = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    auction.status = 'Live';
    await auction.save();
    
    // Emit real-time update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('auction_update', auction);
    
    res.json({ success: true, data: auction });
});

// @desc    Team Owner Login
// @route   POST /api/auctions/:id/owner-login
// @access  Public
export const ownerLogin = asyncHandler(async (req, res) => {
    const { email, accessCode } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    const team = auction.teams.find(t => 
        t.captainEmail === email.toLowerCase() && t.accessCode === accessCode
    );

    if (!team) {
        res.status(401);
        throw new Error('Invalid email or access code for this team');
    }

    res.json({
        success: true,
        auction,
        team
    });
});

// @desc    Get next random player from category
// @route   POST /api/auctions/:id/next-player
// @access  Admin
export const getNextPlayer = asyncHandler(async (req, res) => {
    const { category } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    // Filter available players in category
    const availablePlayers = auction.playerPool.filter(p => 
        p.status === 'Available' && (!category || p.category === category)
    );

    if (availablePlayers.length === 0) {
        res.status(400);
        throw new Error(`No available players in category: ${category || 'All'}`);
    }

    // Pick random
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const player = availablePlayers[randomIndex];

    auction.currentPlayer = {
        player: player._id,
        name: player.name,
        role: player.role,
        basePrice: player.basePrice,
        category: player.category,
        startTime: new Date()
    };
    auction.currentBid = {
        amount: player.basePrice,
        teamId: null,
        teamName: null
    };
    auction.activeCategory = category;
    auction.bidHistory = [];

    await auction.save();
    
    // Emit real-time update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('auction_update', auction);
    
    res.json({ success: true, data: auction });
});

// @desc    Place bid on current player
// @route   POST /api/auctions/:id/bid
// @access  Team Owner / Admin
export const placeBid = asyncHandler(async (req, res) => {
    const { teamId, amount } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction || auction.status !== 'Live') {
        res.status(404);
        throw new Error('Active auction not found');
    }

    if (!auction.currentPlayer || !auction.currentPlayer.name) {
        res.status(400);
        throw new Error('No player currently under auction');
    }

    const team = auction.teams.id(teamId);
    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Validation
    if (amount <= auction.currentBid.amount) {
        res.status(400);
        throw new Error(`Bid must be higher than current bid: ${auction.currentBid.amount}`);
    }

    if (amount > team.budgetRemaining) {
        res.status(400);
        throw new Error(`Insufficient budget. Remaining: ${team.budgetRemaining}`);
    }

    // Update current bid
    auction.currentBid = {
        amount,
        teamId,
        teamName: team.name
    };

    // Add to history
    auction.bidHistory.push({
        teamId,
        teamName: team.name,
        amount,
        timestamp: new Date()
    });

    await auction.save();

    // Emit real-time bid update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('bid_update', {
        teamId: team._id,
        teamName: team.name,
        teamLogo: team.logo,
        amount,
        timestamp: new Date()
    });

    res.json({ success: true, data: auction });
});

// @desc    Sell current player to high bidder
// @route   POST /api/auctions/:id/sell
// @access  Admin
export const sellPlayer = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    const { amount, teamId } = auction.currentBid;

    if (!teamId) {
        // Player is UNSOLD
        const playerIndex = auction.playerPool.findIndex(p => p._id.toString() === auction.currentPlayer.player.toString());
        if (playerIndex !== -1) {
            auction.playerPool[playerIndex].status = 'Unsold';
        }
        auction.currentPlayer = null;
        await auction.save();
        return res.json({ success: true, message: 'Player marked as Unsold', data: auction });
    }

    // Player is SOLD
    const team = auction.teams.id(teamId);
    const playerIndex = auction.playerPool.findIndex(p => p._id.toString() === auction.currentPlayer.player.toString());
    
    if (playerIndex !== -1) {
        auction.playerPool[playerIndex].status = 'Sold';
        auction.playerPool[playerIndex].soldTo = teamId;
        auction.playerPool[playerIndex].soldPrice = amount;
        auction.playerPool[playerIndex].bidHistory = [...auction.bidHistory];
    }

    team.budgetRemaining -= amount;
    team.players.push({
        name: auction.currentPlayer.name,
        role: auction.currentPlayer.role,
        price: amount,
        category: auction.currentPlayer.category
    });

    const soldPlayerName = auction.currentPlayer?.name;
    const soldAmount = amount;
    const soldTeamName = team.name;
    const soldTeamId = teamId;

    auction.currentPlayer = null;
    auction.currentBid = { amount: 0, teamId: null, teamName: null };
    auction.bidHistory = [];

    await auction.save();

    // Emit real-time update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('auction_update', auction);
    
    // Emit special sale event for popups
    io.to(`auction_${auction._id}`).emit('player_sold', {
        playerName: soldPlayerName,
        teamName: soldTeamName,
        teamLogo: team.logo,
        amount: soldAmount,
        teamId: soldTeamId,
        bidHistory: [...auction.bidHistory]
    });

    res.json({ success: true, message: 'Player sold successfully', data: auction });
});

// @desc    Finalize auction and generate tournament
// @route   POST /api/auctions/:id/finalize
// @access  Admin
export const finalizeAuction = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    // Check minimum players requirement
    const underSizedTeams = auction.teams.filter(t => t.players.length < auction.minPlayersPerTeam);
    if (underSizedTeams.length > 0) {
        res.status(400);
        throw new Error(`Some teams have not met the minimum player requirement (${auction.minPlayersPerTeam}): ${underSizedTeams.map(t => t.name).join(', ')}`);
    }

    // Create Teams and Players in the system
    const systemTeamIds = [];
    for (const aTeam of auction.teams) {
        // Here we could either use existing Team model or create new ones
        // For simplicity and to match the "pre-filled" requirement:
        const newTeam = await Team.create({
            name: aTeam.name,
            players: aTeam.players.map(p => ({
                name: p.name,
                role: p.role,
                battingStyle: 'Right-hand Bat', // Defaults
                bowlingStyle: 'None'
            })),
            color: '#3b82f6'
        });
        systemTeamIds.push(newTeam._id);
    }

    // Create Tournament
    const tournament = await Tournament.create({
        name: `${auction.name} - Official Tournament`,
        format: 'League',
        matchType: 'T20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week duration
        teams: systemTeamIds,
        status: 'Upcoming',
        createdBy: auction.createdBy
    });

    auction.status = 'Completed';
    await auction.save();

    // Notify followers
    if (auction.followers && auction.followers.length > 0) {
        const notifications = auction.followers.map(followerId => ({
            userId: followerId,
            title: 'Auction Finalized! 🎉',
            message: `The auction "${auction.name}" has ended. A new tournament "${tournament.name}" has been created!`,
            type: 'system',
            relatedId: tournament._id.toString()
        }));
        await Notification.insertMany(notifications);
    }

    res.json({ 
        success: true, 
        message: 'Auction finalized and tournament generated!', 
        data: { auction, tournamentId: tournament._id } 
    });
});

export const clearAuctionPlayers = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    if (String(auction.createdBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    auction.playerPool = [];
    await auction.save();
    res.json({ success: true, data: auction });
});

export const followAuction = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    const userId = req.user._id;
    const isFollowing = auction.followers.includes(userId);

    if (isFollowing) {
        auction.followers = auction.followers.filter(id => id.toString() !== userId.toString());
    } else {
        auction.followers.push(userId);
    }

    await auction.save();
    res.json({ success: true, data: auction, isFollowing: !isFollowing });
});

export const deleteAuction = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    if (String(auction.createdBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to delete this auction');
    }

    await auction.deleteOne();
    res.json({ success: true, message: 'Auction deleted successfully' });
});
export const deleteAuctionPlayer = asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    if (String(auction.createdBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    // Filter out the player
    const originalLength = auction.playerPool.length;
    auction.playerPool = auction.playerPool.filter(p => p._id.toString() !== playerId);

    if (auction.playerPool.length === originalLength) {
        res.status(404);
        throw new Error('Player not found in pool');
    }

    await auction.save();
    
    // Emit real-time update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('auction_update', auction);

    res.json({ success: true, data: auction });
});
export const undoBid = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction || auction.status !== 'Live') {
        res.status(404);
        throw new Error('Active auction not found');
    }

    if (String(auction.createdBy) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    if (!auction.bidHistory || auction.bidHistory.length === 0) {
        res.status(400);
        throw new Error('No bids to undo');
    }

    // Remove latest bid
    auction.bidHistory.pop();

    if (auction.bidHistory.length > 0) {
        // Set current bid to the previous one
        const prevBid = auction.bidHistory[auction.bidHistory.length - 1];
        auction.currentBid = {
            amount: prevBid.amount,
            teamId: prevBid.teamId,
            teamName: prevBid.teamName
        };
    } else {
        // Reset to base price
        const player = auction.playerPool.find(p => p._id.toString() === auction.currentPlayer.player.toString());
        auction.currentBid = {
            amount: player?.basePrice || 0,
            teamId: null,
            teamName: null
        };
    }

    await auction.save();

    // Emit real-time update
    const io = getIO();
    io.to(`auction_${auction._id}`).emit('auction_update', auction);

    res.json({ success: true, data: auction });
});

// @desc    Update team logo via file upload
// @route   PUT /api/auctions/:id/teams/:teamId/logo
// @access  Protected (Creator)
export const updateTeamLogo = asyncHandler(async (req, res) => {
    const { id, teamId } = req.params;
    const auction = await Auction.findById(id);
    
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    // Authorization check
    if (auction.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to manage this auction');
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Determine the public path for the logo
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const publicDir = path.join(process.cwd(), '..', 'public', 'images', 'teams');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const logoUrl = `/images/teams/${fileName}`;

    const team = auction.teams.id(teamId);
    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    team.logo = logoUrl;
    await auction.save();

    res.json({
        success: true,
        message: 'Team logo updated successfully',
        data: { logo: logoUrl }
    });
});
