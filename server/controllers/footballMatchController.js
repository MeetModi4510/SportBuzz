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
            momentumHistory: [{ minute: 0, value: 0, home: 50, away: 50 }],
            xGHistory: [{ minute: 0, home: 0, away: 0 }],
            pressureIndex: 5.0,
            labAnalysis: { 
                intensityPressing: 40, 
                counterAttackRisk: 30,
                attackThirdControl: { team: 'None', percentage: 50 },
                intensityPulse: [{ minute: 0, value: 30 }],
                possessionPhases: { buildup: 33, attack: 33, defense: 34 },
                territoryOccupancy: { defensive: 33, middle: 34, attacking: 33 },
                phaseStats: [
                    { phase: '0-30', homeShots: 0, awayShots: 0 },
                    { phase: '31-60', homeShots: 0, awayShots: 0 },
                    { phase: '61-90', homeShots: 0, awayShots: 0 }
                ],
                expectedGoals: { home: 0, away: 0 },
                directnessIndex: { home: 40, away: 35 },
                defensiveLineHeight: { home: 45, away: 45 },
                finalThirdEntries: { home: 0, away: 0 },
                highTurnovers: { home: 0, away: 0 },
                radarData: [] 
            },
            topPerformers: []
        };
    }

    const homeScore = match.score.home;
    const awayScore = match.score.away;
    const homeShots = (match.stats.shotsOnTarget.home + match.stats.shotsOffTarget.home);
    const awayShots = (match.stats.shotsOnTarget.away + match.stats.shotsOffTarget.away);
    const homeFouls = match.stats.fouls.home;
    const awayFouls = match.stats.fouls.away;
    const currentMinute = match.timer.currentMinute;

    // 0. Ensure history starts at 0
    if (match.performance.momentumHistory.length === 0) {
        match.performance.momentumHistory.push({ minute: 0, value: 0, home: 50, away: 50 });
    }
    if (match.performance.xGHistory.length === 0) {
        match.performance.xGHistory.push({ minute: 0, home: 0, away: 0 });
    }

    // 1. Win Probability (Improved heuristic)
    let homeBase = 45;
    let awayBase = 40;
    
    homeBase += (homeScore - awayScore) * 25;
    awayBase -= (homeScore - awayScore) * 25;
    
    const shotsOnTargetDiff = (match.stats.shotsOnTarget.home - match.stats.shotsOnTarget.away);
    homeBase += shotsOnTargetDiff * 6;
    awayBase -= shotsOnTargetDiff * 6;
    
    const total = Math.max(homeBase + awayBase + 30, 100);
    match.performance.winProbability.home = Math.min(Math.max(Math.round((homeBase / total) * 100), 5), 90);
    match.performance.winProbability.away = Math.min(Math.max(Math.round((awayBase / total) * 100), 5), 90);
    match.performance.winProbability.draw = 100 - match.performance.winProbability.home - match.performance.winProbability.away;

    // 2. Momentum History
    const lastMomentum = match.performance.momentumHistory.length > 0 ? match.performance.momentumHistory[match.performance.momentumHistory.length - 1].value : 0;
    let currentEventMomentum = 0;
    
    const superRecent = match.events.filter(e => e.minute === currentMinute);
    superRecent.forEach(e => {
        const side = String(e.team?._id || e.team) === String(match.homeTeam?._id || match.homeTeam) ? 1 : -1;
        if (e.type === 'Goal') currentEventMomentum += 50 * side;
        if (e.type === 'ShotOnTarget') currentEventMomentum += 20 * side;
        if (e.type === 'Corner') currentEventMomentum += 12 * side;
        if (e.type === 'Foul') currentEventMomentum -= 8 * side;
    });

    let momentumValue = (lastMomentum * 0.9) + currentEventMomentum;
    momentumValue = Math.max(-100, Math.min(100, momentumValue));

    // Only push if minute changed or event happened
    if (match.performance.momentumHistory.length === 0 || match.performance.momentumHistory.slice(-1)[0]?.minute !== currentMinute || currentEventMomentum !== 0) {
        match.performance.momentumHistory.push({
            minute: currentMinute,
            value: Number(momentumValue.toFixed(1)),
            home: Number((50 + (momentumValue / 2) + Math.random() * 2).toFixed(1)), // Subtle jitter for visibility
            away: Number((50 - (momentumValue / 2) + Math.random() * 2).toFixed(1))
        });
    }
    if (match.performance.momentumHistory.length > 90) match.performance.momentumHistory.shift();

    // 3. xG History
    const currentXG = {
        home: parseFloat((match.stats.shotsOnTarget.home * 0.35 + match.stats.shotsOffTarget.home * 0.12).toFixed(2)),
        away: parseFloat((match.stats.shotsOnTarget.away * 0.35 + match.stats.shotsOffTarget.away * 0.12).toFixed(2))
    };
    match.performance.labAnalysis.expectedGoals = currentXG;
    
    if (match.performance.xGHistory.slice(-1)[0]?.minute !== currentMinute || 
        match.performance.xGHistory.slice(-1)[0]?.home !== currentXG.home ||
        match.performance.xGHistory.slice(-1)[0]?.away !== currentXG.away) {
        match.performance.xGHistory.push({
            minute: currentMinute,
            home: currentXG.home,
            away: currentXG.away
        });
    }
    if (match.performance.xGHistory.length > 90) match.performance.xGHistory.shift();

    // 4. Pressure & Intensity Pulse
    const recentEvents = match.events.filter(e => e.minute > currentMinute - 10).length;
    match.performance.pressureIndex = parseFloat((recentEvents * 0.9 + 3.5 + (Math.random() * 2)).toFixed(1));
    
    const pulseVal = Math.min(95, 30 + (recentEvents * 5) + (Math.random() * 10));
    match.performance.labAnalysis.intensityPulse.push({ minute: currentMinute, value: Math.round(pulseVal) });
    if (match.performance.labAnalysis.intensityPulse.length > 20) match.performance.labAnalysis.intensityPulse.shift();

    // 5. Territory
    const momentumInfluence = (momentumValue / 100) * 20;
    match.performance.labAnalysis.territoryOccupancy = {
        defensive: Math.round(Math.max(10, 33 - momentumInfluence)),
        middle: Math.round(34 + Math.abs(momentumInfluence / 2)),
        attacking: Math.round(Math.max(10, 33 + momentumInfluence))
    };
    const territoryTotal = match.performance.labAnalysis.territoryOccupancy.defensive + 
                           match.performance.labAnalysis.territoryOccupancy.middle + 
                           match.performance.labAnalysis.territoryOccupancy.attacking;
    if (territoryTotal !== 100) match.performance.labAnalysis.territoryOccupancy.middle += (100 - territoryTotal);

    // 6. Phase Stats
    const phases = [
        { name: '0-30', start: 0, end: 30 },
        { name: '31-60', start: 31, end: 60 },
        { name: '61-90', start: 61, end: 120 }
    ];
    match.performance.labAnalysis.phaseStats = phases.map(p => {
        const hShots = (match.events || []).filter(e => e.type === 'ShotOnTarget' && e.minute >= p.start && e.minute <= p.end && String(e.team?._id || e.team) === String(match.homeTeam?._id || match.homeTeam)).length;
        const aShots = (match.events || []).filter(e => e.type === 'ShotOnTarget' && e.minute >= p.start && e.minute <= p.end && String(e.team?._id || e.team) === String(match.awayTeam?._id || match.awayTeam)).length;
        return { phase: p.name, homeShots: hShots, awayShots: aShots };
    });

    // 7. Possession Phases (Style Profile) - FIXED NORMALIZATION
    const factor = Math.sin(currentMinute * 0.4);
    let buildup = Math.round(25 + factor * 8 + (momentumValue > 0 ? 5 : -5));
    let attack = Math.round(41 + factor * 12 + (momentumValue > 0 ? 10 : -10));
    
    if (buildup + attack > 90) {
        const over = (buildup + attack) - 90;
        attack -= over;
    }
    
    let defense = 100 - buildup - attack;
    match.performance.labAnalysis.possessionPhases = { buildup, attack, defense };
    
    // NEW: Intensity Pressing
    match.performance.labAnalysis.intensityPressing = Math.round(50 + factor * 10 + (momentumValue > 0 ? 15 : -15));

    // 8. Dynamic Radar Data
    const radarMetrics = ['Attack', 'Defense', 'Passing', 'Hazard', 'Press'];
    match.performance.labAnalysis.radarData = radarMetrics.map(metric => {
        let hVal = 50, aVal = 50;
        if (metric === 'Attack') {
            hVal = 40 + ((match.stats?.shotsOnTarget?.home || 0) * 5);
            aVal = 40 + ((match.stats?.shotsOnTarget?.away || 0) * 5);
        } else if (metric === 'Defense') {
            hVal = Math.max(30, 80 - ((match.stats?.fouls?.home || 0) * 3) + ((match.stats?.saves?.home || 0) * 5));
            aVal = Math.max(30, 80 - ((match.stats?.fouls?.away || 0) * 3) + ((match.stats?.saves?.away || 0) * 5));
        } else if (metric === 'Passing') {
            hVal = 30 + ((match.stats?.possession?.home || 50) * 0.8);
            aVal = 30 + ((match.stats?.possession?.away || 50) * 0.8);
        } else if (metric === 'Hazard') {
            const lastPulse = (match.performance?.labAnalysis?.intensityPulse || []).slice(-1)[0]?.value || 50;
            hVal = lastPulse;
            aVal = lastPulse * 0.8 + (Math.random() * 10);
        } else if (metric === 'Press') {
            hVal = match.performance?.labAnalysis?.intensityPressing || 50;
            aVal = Math.max(20, (match.performance?.labAnalysis?.intensityPressing || 50) - 10 + (Math.random() * 20));
        }
        return { subject: metric, A: Math.round(hVal), B: Math.round(aVal), fullMark: 100 };
    });

    match.markModified('performance');

    // 9. Top Performers
    const playerScores = {};
    match.events.forEach(event => {
        const pName = event.player;
        if (!pName) return;
        if (!playerScores[pName]) {
            const side = String(event.team?._id || event.team) === String(match.homeTeam?._id || match.homeTeam) ? 'H' : 'A';
            playerScores[pName] = { name: pName, score: 0, team: side };
        }
        if (event.type === 'Goal') playerScores[pName].score += 4.5;
        if (event.assister) {
            if (!playerScores[event.assister]) {
                const side = String(event.team?._id || event.team) === String(match.homeTeam?._id || match.homeTeam) ? 'H' : 'A';
                playerScores[event.assister] = { name: event.assister, score: 0, team: side };
            }
            playerScores[event.assister].score += 2.5;
        }
        if (event.type === 'ShotOnTarget') playerScores[pName].score += 1.2;
        if (event.type === 'Save') playerScores[pName].score += 2.2;
        if (event.type === 'YellowCard') playerScores[pName].score -= 1.0;
        if (event.type === 'RedCard') playerScores[pName].score -= 4.0;
    });

    match.performance.topPerformers = Object.values(playerScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    match.markModified('performance');
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
        .populate('awayTeam')
        .populate('tournamentId');

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

    // Detect Second Yellow -> Red
    let finalType = type;
    if (type === 'YellowCard') {
        const previousYellows = match.events.filter(e => e.player === player && e.type === 'YellowCard').length;
        if (previousYellows >= 1) {
            finalType = 'RedCard';
        }
    }

    const event = { 
        type: finalType, 
        minute: minute !== undefined ? minute : match.timer.currentMinute, 
        half: match.timer.half,
        team, 
        player, 
        playerOut, 
        assister, 
        goalType, 
        details: finalType === 'RedCard' && type === 'YellowCard' ? 'Second Yellow Card' : details,
        commentary: req.body.commentary 
    };

    if (!event.commentary) {
        event.commentary = generateCommentary(event);
    }
    
    match.events.push(event);

    // Update score if Goal
    if (finalType === 'Goal') {
        if (String(team) === String(match.homeTeam._id || match.homeTeam)) {
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
    if (finalType === 'Substitution') {
        const side = String(team) === String(match.homeTeam._id || match.homeTeam) ? 'home' : 'away';
        
        if (!match.lineups[side]) {
            match.lineups[side] = { startingXI: [], substitutes: [], sentOff: [], substitutionCount: 0 };
        }

        if (match.lineups[side].substitutionCount >= 5) {
            res.status(400);
            throw new Error(`Maximum 5 substitutions allowed for ${side === 'home' ? 'Home' : 'Away'} team`);
        }

        match.lineups[side].startingXI = (match.lineups[side].startingXI || []).filter(p => p !== playerOut);
        match.lineups[side].startingXI.push(player);
        match.lineups[side].substitutes = (match.lineups[side].substitutes || []).filter(p => p !== player);
        
        if (playerOut && !match.lineups[side].substitutes.includes(playerOut)) {
            match.lineups[side].substitutes.push(playerOut);
        }
        
        match.lineups[side].substitutionCount += 1;
        match.markModified('lineups');
    }

    // NEW: Handle Red Card (Team Reduction & Suspension)
    if (finalType === 'RedCard') {
        const side = String(team) === String(match.homeTeam._id || match.homeTeam) ? 'home' : 'away';
        
        if (!match.lineups[side]) {
            match.lineups[side] = { startingXI: [], substitutes: [], sentOff: [], substitutionCount: 0 };
        }

        // Remove from current play
        match.lineups[side].startingXI = (match.lineups[side].startingXI || []).filter(p => p !== player);
        // Add to sentOff
        if (!match.lineups[side].sentOff) match.lineups[side].sentOff = [];
        if (!match.lineups[side].sentOff.includes(player)) {
            match.lineups[side].sentOff.push(player);
        }
        match.markModified('lineups');

        // Add to Tournament Suspensions
        if (tournament) {
            if (!tournament.suspensions) tournament.suspensions = [];
            const alreadySuspended = tournament.suspensions.some(s => s.player === player && String(s.matchId) === String(match._id));
            if (!alreadySuspended) {
                tournament.suspensions.push({
                    player,
                    teamId: team,
                    matchId: match._id
                });
                await tournament.save();
            }
        }
    }

    // Update statistics
    const teamSide = String(team) === String(match.homeTeam._id || match.homeTeam) ? 'home' : 'away';
    if (finalType === 'ShotOnTarget' || finalType === 'Goal') match.stats.shotsOnTarget[teamSide] += 1;
    if (finalType === 'ShotOffTarget') match.stats.shotsOffTarget[teamSide] += 1;
    if (finalType === 'Foul') match.stats.fouls[teamSide] += 1;
    if (finalType === 'Corner') match.stats.corners[teamSide] += 1;
    if (finalType === 'Offside') match.stats.offsides[teamSide] += 1;
    if (finalType === 'YellowCard') match.stats.yellowCards[teamSide] += 1;
    if (finalType === 'RedCard') match.stats.redCards[teamSide] += 1;

    calculatePerformance(match);

    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam')
        .populate('tournamentId');

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

    if (isRunning !== undefined) {
        if (isRunning) {
            match.timer.startTime = new Date();
            match.status = 'Live';
        } else {
            match.status = 'Paused';
        }
    }

    // Sync tournament status if match is part of one
    if (match.tournamentId) {
        await syncTournamentStatus(match.tournamentId);
    }

    calculatePerformance(match);

    await match.save();

    const populatedMatch = await FootballMatch.findById(match._id)
        .populate('homeTeam')
        .populate('awayTeam')
        .populate('tournamentId');

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
        .populate('awayTeam')
        .populate('tournamentId');

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
        .populate('awayTeam')
        .populate('tournamentId');

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
