import asyncHandler from 'express-async-handler';
import FootballMatch from '../models/FootballMatch.js';
import FootballTournament from '../models/FootballTournament.js';
import FootballTeam from '../models/FootballTeam.js';
import { getIO } from '../config/socket.js';
import { syncTournamentStatus } from './footballTournamentController.js';
import { createMatchReportNews, createEventNews } from './footballNewsController.js';

const calculatePerformance = (match) => {
    if (!match.performance) {
        match.performance = {
            winProbability: { home: 45, away: 30, draw: 25 },
            momentumHistory: [],
            pressureIndex: 5.0,
            labAnalysis: { 
                intensityPressing: 40, 
                counterAttackRisk: 30,
                attackThirdControl: { team: 'None', percentage: 50 }
            }
        };
    }

    const homeScore = match.score.home;
    const awayScore = match.score.away;
    const homeShots = (match.stats.shotsOnTarget.home + match.stats.shotsOffTarget.home);
    const awayShots = (match.stats.shotsOnTarget.away + match.stats.shotsOffTarget.away);
    const homeFouls = match.stats.fouls.home;
    const awayFouls = match.stats.fouls.away;

    // Win Probability (Simple heuristic)
    let homeBase = 40;
    let awayBase = 35;
    
    const scoreDiff = homeScore - awayScore;
    homeBase += scoreDiff * 20;
    awayBase -= scoreDiff * 20;
    
    const shotsDiff = (match.stats.shotsOnTarget.home - match.stats.shotsOnTarget.away);
    homeBase += shotsDiff * 5;
    awayBase -= shotsDiff * 5;
    
    const total = Math.max(homeBase + awayBase + 25, 100);
    match.performance.winProbability.home = Math.min(Math.max(Math.round((homeBase / total) * 100), 5), 90);
    match.performance.winProbability.away = Math.min(Math.max(Math.round((awayBase / total) * 100), 5), 90);
    match.performance.winProbability.draw = 100 - match.performance.winProbability.home - match.performance.winProbability.away;

    // Momentum
    const currentMinute = match.timer.currentMinute;
    let momentumValue = (shotsDiff * 8) + (scoreDiff * 15) - ((homeFouls - awayFouls) * 5);
    
    // Add time-based fluctuation
    momentumValue += Math.sin(currentMinute * 0.3) * 10;
    
    match.performance.momentumHistory.push({
        minute: currentMinute,
        value: Math.min(Math.max(Math.round(momentumValue), -100), 100)
    });

    if (match.performance.momentumHistory.length > 60) {
        match.performance.momentumHistory.shift();
    }

    // Pressure Index
    const recentEvents = match.events.filter(e => e.minute > currentMinute - 10).length;
    match.performance.pressureIndex = (recentEvents * 0.8 + 4 + Math.random()).toFixed(1);

    // Lab Analysis
    match.performance.labAnalysis.intensityPressing = Math.min(Math.max(35 + (homeFouls + awayFouls) * 1.5, 20), 85);
    match.performance.labAnalysis.counterAttackRisk = Math.min(Math.max(25 + (homeShots + awayShots) * 2, 10), 95);
    
    if (momentumValue > 15) {
        match.performance.labAnalysis.attackThirdControl.team = 'Home';
        match.performance.labAnalysis.attackThirdControl.percentage = Math.min(60 + Math.abs(momentumValue) / 2, 98);
    } else if (momentumValue < -15) {
        match.performance.labAnalysis.attackThirdControl.team = 'Away';
        match.performance.labAnalysis.attackThirdControl.percentage = Math.min(60 + Math.abs(momentumValue) / 2, 98);
    } else {
        match.performance.labAnalysis.attackThirdControl.team = 'None';
        match.performance.labAnalysis.attackThirdControl.percentage = 50;
    }

    // NEW Metrics
    match.performance.labAnalysis.expectedGoals = {
        home: (match.stats.shotsOnTarget.home * 0.3 + match.stats.shotsOffTarget.home * 0.1).toFixed(2),
        away: (match.stats.shotsOnTarget.away * 0.3 + match.stats.shotsOffTarget.away * 0.1).toFixed(2)
    };

    const intensity = Math.min(Math.round(40 + Math.random() * 40 + (homeShots + awayShots) * 2), 100);
    match.performance.labAnalysis.intensityPulse.push({
        minute: currentMinute,
        value: intensity
    });
    if (match.performance.labAnalysis.intensityPulse.length > 30) match.performance.labAnalysis.intensityPulse.shift();

    // NEW: Possession Phases (Dynamic shift)
    const factor = Math.sin(currentMinute * 0.5);
    match.performance.labAnalysis.possessionPhases = {
        buildup: Math.round(30 + factor * 5),
        attack: Math.round(40 + Math.abs(factor) * 10),
        defense: Math.round(30 - factor * 5)
    };

    // NEW ADVANCED METRICS
    const homePossession = match.stats.possession.home;
    const awayPossession = match.stats.possession.away;

    match.performance.labAnalysis.directnessIndex = {
        home: Math.round((match.stats.shotsOnTarget.home + match.stats.shotsOffTarget.home) / (homePossession / 10) * 10) || 40,
        away: Math.round((match.stats.shotsOnTarget.away + match.stats.shotsOffTarget.away) / (awayPossession / 10) * 10) || 35
    };

    match.performance.labAnalysis.defensiveLineHeight = {
        home: Math.min(Math.max(45 + (momentumValue / 5) + (recentEvents * 2), 30), 75),
        away: Math.min(Math.max(45 - (momentumValue / 5) + (recentEvents * 2), 30), 75)
    };

    match.performance.labAnalysis.finalThirdEntries = {
        home: Math.round(match.stats.shotsOnTarget.home * 2 + match.stats.corners.home * 1.5 + (momentumValue > 10 ? 5 : 0)),
        away: Math.round(match.stats.shotsOnTarget.away * 2 + match.stats.corners.away * 1.5 + (momentumValue < -10 ? 5 : 0))
    };

    match.performance.labAnalysis.highTurnovers = {
        home: Math.round(match.stats.fouls.away * 0.4 + (match.performance.labAnalysis.intensityPressing / 10)),
        away: Math.round(match.stats.fouls.home * 0.4 + (match.performance.labAnalysis.intensityPressing / 10))
    };
};

const generateCommentary = (event) => {
    const { type, player, assister, goalType, playerOut } = event;
    const playerStr = player || 'A player';
    
    switch (type) {
        case 'Goal':
            if (goalType === 'Penalty') return `GOAL! ${playerStr} steps up and converts the penalty with absolute composure!`;
            if (goalType === 'FreeKick') return `GOAL! A stunning free-kick from ${playerStr}! Perfection in execution.`;
            if (assister) return `GOAL! ${playerStr} finds the net! A brilliant team move finished clinically after a great ball from ${assister}.`;
            return `GOAL! ${playerStr} breaks the deadlock with a powerful strike into the corner!`;
        case 'YellowCard':
            return `Yellow card! ${playerStr} is cautioned by the referee following a mistimed challenge.`;
        case 'RedCard':
            return `RED CARD! ${playerStr} is sent off! A huge moment that could change the course of this match.`;
        case 'Substitution':
            return `Tactical shift: ${playerOut} leaves the field, replaced by ${playerStr}.`;
        case 'Save':
            return `Point-blank save! ${playerStr} shows incredible reflexes to keep the scoreline unchanged.`;
        case 'ShotOnTarget':
            return `${playerStr} tests the keeper with a stinging effort from distance!`;
        case 'ShotOffTarget':
            return `Close! ${playerStr} finds some space but the shot whistles just past the post.`;
        case 'Corner':
            return `Corner awarded. The pressure is mounting as the attacking side crowds the box.`;
        case 'Foul':
            return `The whistle goes. A foul by ${playerStr} halts the play.`;
        case 'Offside':
            return `Flag up! ${playerStr} timed the run poorly and is caught in an offside position.`;
        default:
            return `An event occurred: ${type} at ${event.minute}'`;
    }
};

// @desc    Get match by ID
// @route   GET /api/football/matches/:id
export const getMatchById = asyncHandler(async (req, res) => {
    const match = await FootballMatch.findById(req.params.id)
        .populate('homeTeam')
        .populate('awayTeam');

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    res.json({ success: true, data: match });
});

// @desc    Create/Schedule match
// @route   POST /api/football/matches
export const createMatch = asyncHandler(async (req, res) => {
    const { tournamentId, homeTeam, awayTeam, matchDate, venue } = req.body;
    const tournament = await FootballTournament.findById(tournamentId);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    if (String(tournament.createdBy) !== String(req.user._id) && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to create matches for this tournament');
    }

    try {
        const match = await FootballMatch.create({
            tournamentId,
            homeTeam,
            awayTeam,
            matchDate,
            venue
        });

        const populatedMatch = await FootballMatch.findById(match._id)
            .populate('homeTeam')
            .populate('awayTeam');

        res.status(201).json({ success: true, data: populatedMatch });
    } catch (error) {
        console.error("Match Creation Error:", error);
        res.status(400).json({ success: false, message: error.message || "Failed to create match" });
    }
});

// @desc    Update Match Events (Goal, Card, Sub)
// @route   POST /api/football/matches/:id/events
export const addMatchEvent = asyncHandler(async (req, res) => {
    const { type, minute, team, player, playerOut, assister, goalType, details } = req.body;
    const match = await FootballMatch.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const tournament = await FootballTournament.findById(match.tournamentId);
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    const isTournamentCreator = tournament && String(tournament.createdBy) === String(req.user._id);

    if (!isTournamentCreator && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to add events to this match');
    }

    const event = { 
        type, 
        minute: minute !== undefined ? minute : match.timer.currentMinute, 
        half: match.timer.half,
        team, 
        player, 
        playerOut, 
        assister, 
        goalType, 
        details,
        commentary: req.body.commentary 
    };

    if (!event.commentary) {
        event.commentary = generateCommentary(event);
    }
    
    match.events.push(event);

    // Update score if Goal
    if (type === 'Goal') {
        if (String(team) === String(match.homeTeam)) {
            match.score.home += 1;
        } else {
            match.score.away += 1;
        }

        // Check for Hat-trick (3 goals)
        const playerGoals = match.events.filter(e => e.type === 'Goal' && e.player === player).length;
        if (playerGoals === 3) {
            createEventNews(match._id, player, 'HatTrick');
        }
    }

    // NEW: Lineup Substitution Logic
    if (type === 'Substitution') {
        const side = String(team) === String(match.homeTeam._id || match.homeTeam) ? 'home' : 'away';
        
        // Ensure lineup arrays exist
        if (!match.lineups[side]) {
            match.lineups[side] = { startingXI: [], substitutes: [], substitutionCount: 0 };
        }

        // Check substitution limit
        if (match.lineups[side].substitutionCount >= 5) {
            res.status(400);
            throw new Error(`Maximum 5 substitutions allowed for ${side === 'home' ? 'Home' : 'Away'} team`);
        }

        // Update Starting XI
        // Filter out the player leaving the pitch
        match.lineups[side].startingXI = (match.lineups[side].startingXI || []).filter(p => p !== playerOut);
        // Add the player entering the pitch
        match.lineups[side].startingXI.push(player);
        
        // Remove the new player from substitutes bench
        match.lineups[side].substitutes = (match.lineups[side].substitutes || []).filter(p => p !== player);
        
        // Add the subbed out player back to the substitutes bench (to show as "Out")
        if (playerOut && !match.lineups[side].substitutes.includes(playerOut)) {
            match.lineups[side].substitutes.push(playerOut);
        }
        
        // Increment substitution count
        match.lineups[side].substitutionCount += 1;
        
        // Ensure modification is tracked
        match.markModified('lineups');
    }

    // Update statistics
    const teamSide = String(team) === String(match.homeTeam) ? 'home' : 'away';
    if (type === 'ShotOnTarget' || type === 'Goal') match.stats.shotsOnTarget[teamSide] += 1;
    if (type === 'ShotOffTarget') match.stats.shotsOffTarget[teamSide] += 1;
    if (type === 'Foul') match.stats.fouls[teamSide] += 1;
    if (type === 'Corner') match.stats.corners[teamSide] += 1;
    if (type === 'Offside') match.stats.offsides[teamSide] += 1;
    if (type === 'YellowCard') match.stats.yellowCards[teamSide] += 1;
    if (type === 'RedCard') match.stats.redCards[teamSide] += 1;

    calculatePerformance(match);

    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam');

    // Broadcast update
    const io = getIO();
    console.log(`[BROADCAST] Sending football_update for match ${match._id} with ${populatedMatch.events?.length} events`);
    io.to(`football_match_${match._id}`).emit('football_update', populatedMatch);

    res.json({ success: true, data: populatedMatch });
});

// @desc    Control Match Timer
// @route   POST /api/football/matches/:id/timer
export const updateTimer = asyncHandler(async (req, res) => {
    const { isRunning, currentMinute, injuryTime, half, halfStatus } = req.body;
    const match = await FootballMatch.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const tournament = await FootballTournament.findById(match.tournamentId);
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    const isTournamentCreator = tournament && String(tournament.createdBy) === String(req.user._id);

    if (!isTournamentCreator && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to update match timer');
    }

    if (isRunning !== undefined) match.timer.isRunning = isRunning;
    if (currentMinute !== undefined) match.timer.currentMinute = currentMinute;
    if (injuryTime !== undefined) match.timer.injuryTime = injuryTime;
    if (half !== undefined) match.timer.half = half;
    if (halfStatus !== undefined) match.timer.halfStatus = halfStatus;

    if (isRunning) {
        match.timer.startTime = new Date();
        match.status = 'Live';
    } else {
        match.status = 'Paused';
    }

    // Sync tournament status if match is part of one
    if (match.tournamentId) {
        await syncTournamentStatus(match.tournamentId);
    }

    calculatePerformance(match);

    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam');

    const io = getIO();
    io.to(`football_match_${match._id}`).emit('football_update', populatedMatch);

    res.json({ success: true, data: populatedMatch });
});

// @desc    Finalize Match
// @route   POST /api/football/matches/:id/finalize
export const finalizeMatch = asyncHandler(async (req, res) => {
    const match = await FootballMatch.findById(req.params.id);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const tournament = await FootballTournament.findById(match.tournamentId);
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    const isTournamentCreator = tournament && String(tournament.createdBy) === String(req.user._id);

    if (!isTournamentCreator && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to finalize this match');
    }

    match.status = 'Completed';
    match.timer.isRunning = false;
    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam');

    // If part of a tournament, update points table logic here
    if (match.tournamentId) {
        await syncTournamentStatus(match.tournamentId);
        // Generate match report news
        createMatchReportNews(match._id);
    }

    const io = getIO();
    io.to(`football_match_${match._id}`).emit('football_update', populatedMatch);

    res.json({ success: true, data: populatedMatch });
});

// @desc    Update Match Lineups
// @route   POST /api/football/matches/:id/lineups
export const updateMatchLineups = asyncHandler(async (req, res) => {
    const { homeLineup, awayLineup } = req.body;
    const match = await FootballMatch.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const tournament = await FootballTournament.findById(match.tournamentId);
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    const isTournamentCreator = tournament && String(tournament.createdBy) === String(req.user._id);

    if (!isTournamentCreator && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to update lineups');
    }

    match.lineups = {
        home: {
            startingXI: homeLineup.startingXI,
            substitutes: homeLineup.substitutes,
            substitutionCount: 0,
            formation: homeLineup.formation || '4-4-2'
        },
        away: {
            startingXI: awayLineup.startingXI,
            substitutes: awayLineup.substitutes,
            substitutionCount: 0,
            formation: awayLineup.formation || '4-4-2'
        }
    };

    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam');

    const io = getIO();
    io.to(`football_match_${match._id}`).emit('football_update', populatedMatch);

    res.json({ success: true, data: populatedMatch });
});

// @desc    Delete Match
// @route   DELETE /api/football/matches/:id
export const deleteMatch = asyncHandler(async (req, res) => {
    const match = await FootballMatch.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const tournament = await FootballTournament.findById(match.tournamentId);
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    const isTournamentCreator = tournament && String(tournament.createdBy) === String(req.user._id);

    if (!isTournamentCreator && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to delete this match');
    }

    await FootballMatch.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Match deleted successfully' });
});
