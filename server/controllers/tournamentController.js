import asyncHandler from 'express-async-handler';
import Tournament from '../models/Tournament.js';
import PointsTable from '../models/PointsTable.js';
import Match from '../models/Match.js';
import Ball from '../models/Ball.js';
import User from '../models/User.js';
// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Private/Admin
export const createTournament = asyncHandler(async (req, res) => {
    const { name, format, matchType, overs, testDays, oversPerSession, groupStructure, groupsCount, pointsRule, startDate, endDate, teams } = req.body;

    const groups = [];
    if (groupStructure !== 'None' && groupsCount > 1) {
        for (let i = 0; i < groupsCount; i++) {
            groups.push({ name: `Group ${String.fromCharCode(65 + i)}`, teams: [] });
        }
    }

    const tournament = await Tournament.create({
        name,
        format,
        matchType: matchType || 'T20',
        overs,
        testDays: testDays || 5,
        oversPerSession: oversPerSession || 30,
        groupStructure: groupStructure || 'None',
        groupsCount: groupsCount || 1,
        groups,
        pointsRule,
        startDate,
        endDate,
        teams,
        status: 'Upcoming',
        createdBy: req.user ? req.user._id : null
    });

    if (tournament) {
        // Initialize points table for each team
        if (teams && teams.length > 0) {
            const pointsEntries = teams.map(teamId => ({
                tournament: tournament._id,
                team: teamId
            }));
            await PointsTable.insertMany(pointsEntries);
        }

        res.status(201).json({
            success: true,
            data: tournament
        });
    } else {
        res.status(400);
        throw new Error('Invalid tournament data');
    }
});

// @desc    Get all tournaments (supports ?search=, ?userId= filters)
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = asyncHandler(async (req, res) => {
    const { search, userId } = req.query;
    const filter = {};

    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }
    if (userId) {
        filter.createdBy = userId;
    }

    const tournaments = await Tournament.find(filter)
        .populate('teams')
        .populate('createdBy', 'fullName email photoUrl')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: tournaments.length,
        data: tournaments
    });
});

// @desc    Get tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournamentById = asyncHandler(async (req, res) => {
    const tournament = await Tournament.findById(req.params.id)
        .populate('teams')
        .populate('createdBy', 'fullName email photoUrl');

    if (tournament) {
        const pointsTable = await PointsTable.find({ tournament: tournament._id }).populate('team');
        res.json({
            success: true,
            data: {
                ...tournament._doc,
                pointsTable
            }
        });
    } else {
        res.status(404);
        throw new Error('Tournament not found');
    }
});

// @desc    Update a tournament
// @route   PUT /api/tournaments/:id
// @access  Private/Admin
export const updateTournament = asyncHandler(async (req, res) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Ownership check
    if (tournament.createdBy && req.user && tournament.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized. You can only edit tournaments you created.');
    }

    if (tournament) {
        tournament.name = req.body.name || tournament.name;
        tournament.format = req.body.format || tournament.format;
        if (req.body.matchType) tournament.matchType = req.body.matchType;
        if (req.body.overs !== undefined) tournament.overs = req.body.overs;
        if (req.body.testDays !== undefined) tournament.testDays = req.body.testDays;
        if (req.body.oversPerSession !== undefined) tournament.oversPerSession = req.body.oversPerSession;
        tournament.pointsRule = req.body.pointsRule || tournament.pointsRule;
        tournament.startDate = req.body.startDate || tournament.startDate;
        tournament.endDate = req.body.endDate || tournament.endDate;
        tournament.status = req.body.status || tournament.status;

        // Group settings
        if (req.body.groupStructure) {
            const oldStructure = tournament.groupStructure;
            tournament.groupStructure = req.body.groupStructure;
            tournament.groupsCount = req.body.groupsCount || tournament.groupsCount;

            // Initialize groups if changing from None to structured
            if (oldStructure === 'None' && tournament.groupStructure !== 'None' && (!tournament.groups || tournament.groups.length === 0)) {
                const groups = [];
                for (let i = 0; i < tournament.groupsCount; i++) {
                    groups.push({ name: `Group ${String.fromCharCode(65 + i)}`, teams: [] });
                }
                tournament.groups = groups;
            }
        }

        const updatedTournament = await tournament.save();
        res.json({
            success: true,
            data: updatedTournament
        });
    } else {
        res.status(404);
        throw new Error('Tournament not found');
    }
});

// @desc    Delete a tournament (cascade: matches + balls + points table)
// @route   DELETE /api/tournaments/:id
// @access  Private/Admin
export const deleteTournament = asyncHandler(async (req, res) => {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Ownership check
    if (tournament.createdBy && req.user && tournament.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized. You can only delete tournaments you created.');
    }

    // Cascade delete: balls → matches → points table → tournament
    const matches = await Match.find({ tournament: req.params.id });
    const matchIds = matches.map(m => m._id);
    if (matchIds.length > 0) {
        await Ball.deleteMany({ match: { $in: matchIds } });
        await Match.deleteMany({ _id: { $in: matchIds } });
    }
    await PointsTable.deleteMany({ tournament: req.params.id });
    await Tournament.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Tournament deleted' });
});

// @desc    Add team to tournament
// @route   POST /api/tournaments/:id/teams
// @access  Private/Admin
export const addTeamToTournament = asyncHandler(async (req, res) => {
    const { teamId, groupIndex } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Ownership check
    if (tournament.createdBy && req.user && tournament.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized. You can only modify tournaments you created.');
    }

    if (tournament) {
        if (tournament.teams.includes(teamId)) {
            res.status(400);
            throw new Error('Team already added to tournament');
        }

        tournament.teams.push(teamId);

        // Assign to group if applicable
        if (tournament.groupStructure !== 'None' && groupIndex !== undefined && tournament.groups[groupIndex]) {
            tournament.groups[groupIndex].teams.push(teamId);
        }
        await tournament.save();

        // Create points table entry
        await PointsTable.create({
            tournament: tournament._id,
            team: teamId
        });

        res.json({
            success: true,
            data: tournament
        });
    } else {
        res.status(404);
        throw new Error('Tournament not found');
    }
});

// @desc    Get tournament stats (top run scorers, wicket takers, etc.)
// @route   GET /api/tournaments/:id/stats
// @access  Public
export const getTournamentStats = asyncHandler(async (req, res) => {
    const tournamentId = req.params.id;

    // Get all matches for this tournament
    const matches = await Match.find({ tournament: tournamentId }).populate('homeTeam awayTeam');
    const matchIds = matches.map(m => m._id);
    const matchMeta = new Map();
    matches.forEach(m => {
        matchMeta.set(m._id.toString(), {
            name: `${m.homeTeam?.name || 'Home'} vs ${m.awayTeam?.name || 'Away'}`,
            date: m.date
        });
    });

    // Get all balls for these matches
    const balls = await Ball.find({ match: { $in: matchIds } });

    const batStats = new Map(); // name -> { runs, balls, fours, sixes, outs, highestScore, fifties, hundreds, matchRuns: Map(matchId -> r), matchFours: Map(mId -> f), matchSixes: Map(mId -> s), matchOuts: Set(matchId) }
    const bowlStats = new Map(); // name -> { wickets, runsConceded, ballsBowled, matchFigures: Map(matchId -> {w, r, b}) }
    const fieldStats = new Map(); // name -> { catches, runouts, stumpings, matchFigures: Map(matchId -> {c, r, s}) }

    for (const b of balls) {
        const matchId = b.match.toString();
        // --- Batting Stats ---
        if (!batStats.has(b.batsman)) {
            batStats.set(b.batsman, {
                name: b.batsman, runs: 0, balls: 0, fours: 0, sixes: 0,
                outs: 0, highestScore: 0, fifties: 0, hundreds: 0,
                matchRuns: new Map(), matchFours: new Map(), matchSixes: new Map(), matchOuts: new Set()
            });
        }
        const bat = batStats.get(b.batsman);



        if (b.extraType !== 'wide') {
            bat.balls += 1;
        }
        if (b.extraType === 'none' || b.extraType === 'noball') {
            bat.runs += b.runs;
            const mRun = bat.matchRuns.get(matchId) || 0;
            bat.matchRuns.set(matchId, mRun + b.runs);

            if (b.runs === 4) {
                bat.fours += 1;
                const m4 = bat.matchFours.get(matchId) || 0;
                bat.matchFours.set(matchId, m4 + 1);
            }
            if (b.runs === 6) {
                bat.sixes += 1;
                const m6 = bat.matchSixes.get(matchId) || 0;
                bat.matchSixes.set(matchId, m6 + 1);
            }
        }

        // --- Bowling Stats ---
        if (!bowlStats.has(b.bowler)) {
            bowlStats.set(b.bowler, {
                name: b.bowler, wickets: 0, runsConceded: 0, ballsBowled: 0,
                fiveWickets: 0, bestFigW: 0, bestFigR: Infinity,
                matchFigures: new Map() // matchId -> {w, r, b}
            });
        }
        const bowl = bowlStats.get(b.bowler);
        const mFig = bowl.matchFigures.get(matchId) || { w: 0, r: 0, b: 0 };

        if (b.extraType !== 'wide' && b.extraType !== 'noball') {
            bowl.ballsBowled += 1;
            mFig.b += 1;
        }
        if (b.extraType !== 'legbye' && b.extraType !== 'bye') {
            bowl.runsConceded += b.runs;
            if (b.extraType !== 'none') bowl.runsConceded += 1; // Extra run for wide/noball
            mFig.r += b.runs;
            if (b.extraType !== 'none') mFig.r += 1;
        }

        // --- Wickets & Fielding Stats ---
        if (b.wicket && b.wicket.isWicket) {
            const type = b.wicket.type;

            // Batting Outs (Corrected to use playerOut)
            if (b.wicket.playerOut) {
                const playerOut = b.wicket.playerOut;
                if (!batStats.has(playerOut)) {
                    batStats.set(playerOut, {
                        name: playerOut, runs: 0, balls: 0, fours: 0, sixes: 0,
                        outs: 0, highestScore: 0, fifties: 0, hundreds: 0,
                        matchRuns: new Map(), matchFours: new Map(), matchSixes: new Map(), matchOuts: new Set()
                    });
                }
                const pOutStat = batStats.get(playerOut);
                pOutStat.outs += 1;
                pOutStat.matchOuts.add(matchId);
            }

            // Bowling Wickets
            if (['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hitwicket'].includes(type)) {
                bowl.wickets += 1;
                mFig.w += 1;
            }

            // Fielders
            const fielderName = b.wicket.fielder || (type === 'caught and bowled' ? b.bowler : null);
            if (fielderName) {
                if (!fieldStats.has(fielderName)) {
                    fieldStats.set(fielderName, { name: fielderName, catches: 0, runouts: 0, stumpings: 0, matchFigures: new Map() });
                }
                const field = fieldStats.get(fielderName);
                const mF = field.matchFigures.get(matchId) || { c: 0, r: 0, s: 0 };
                if (type === 'caught' || type === 'caught and bowled') { field.catches += 1; mF.c += 1; }
                if (type === 'runout') { field.runouts += 1; mF.r += 1; }
                if (type === 'stumped') { field.stumpings += 1; mF.s += 1; }
                field.matchFigures.set(matchId, mF);
            } else if (type === 'runout' && b.runoutBy) {
                if (!fieldStats.has(b.runoutBy)) {
                    fieldStats.set(b.runoutBy, { name: b.runoutBy, catches: 0, runouts: 0, stumpings: 0, matchFigures: new Map() });
                }
                const field = fieldStats.get(b.runoutBy);
                const mF = field.matchFigures.get(matchId) || { c: 0, r: 0, s: 0 };
                field.runouts += 1;
                mF.r += 1;
                field.matchFigures.set(matchId, mF);
            }
        }

        bowl.matchFigures.set(matchId, mFig);
    }

    // --- MVP Points Accumulation ---
    const mvpPoints = new Map(); // name -> { bat: 0, bowl: 0, field: 0, total: 0, matchHistory: Map(matchId -> {bat, bowl, field, total}) }

    const getMvp = (name) => {
        if (!mvpPoints.has(name)) mvpPoints.set(name, { name, bat: 0, bowl: 0, field: 0, total: 0, matchHistory: new Map() });
        return mvpPoints.get(name);
    };

    const getMatchPerf = (mvp, mId) => {
        if (!mvp.matchHistory.has(mId)) {
            const meta = matchMeta.get(mId) || { name: 'Match', date: new Date() };
            mvp.matchHistory.set(mId, {
                matchId: mId,
                matchName: meta.name,
                matchDate: meta.date,
                bat: 0, bowl: 0, field: 0, total: 0
            });
        }
        return mvp.matchHistory.get(mId);
    };

    // Process Batting Aggregates & Points
    for (const bat of batStats.values()) {
        const mvp = getMvp(bat.name);
        // Aggregates
        mvp.bat += bat.runs;
        mvp.bat += bat.fours;
        mvp.bat += (bat.sixes * 2);

        for (const [mId, score] of bat.matchRuns.entries()) {
            const perf = getMatchPerf(mvp, mId);
            const fours = bat.matchFours.get(mId) || 0;
            const sixes = bat.matchSixes.get(mId) || 0;

            let pts = score + fours + (sixes * 2);
            if (score > bat.highestScore) bat.highestScore = score;
            if (score >= 100) { bat.hundreds += 1; pts += 20; mvp.bat += 20; }
            else if (score >= 50) { bat.fifties += 1; pts += 10; mvp.bat += 10; }
            else if (score >= 30) { pts += 5; mvp.bat += 5; }

            if (score === 0 && bat.matchOuts.has(mId)) {
                pts -= 5;
                mvp.bat -= 5;
            }
            perf.bat += pts;
        }
        bat.avg = bat.outs > 0 ? (bat.runs / bat.outs).toFixed(2) : bat.runs > 0 ? "∞" : "0.00";
        bat.avgNum = bat.outs > 0 ? (bat.runs / bat.outs) : bat.runs > 0 ? 999 : 0;
        bat.sr = bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(2) : "0.00";
    }

    // Process Bowling Aggregates & Points
    for (const bowl of bowlStats.values()) {
        const mvp = getMvp(bowl.name);
        mvp.bowl += (bowl.wickets * 25);

        for (const [mId, fig] of bowl.matchFigures.entries()) {
            const perf = getMatchPerf(mvp, mId);
            let pts = (fig.w * 25);

            if (fig.w >= 5) { bowl.fiveWickets += 1; pts += 20; mvp.bowl += 20; }
            else if (fig.w >= 3) { pts += 10; mvp.bowl += 10; }

            if (fig.w > bowl.bestFigW || (fig.w === bowl.bestFigW && fig.r < bowl.bestFigR)) {
                bowl.bestFigW = fig.w;
                bowl.bestFigR = fig.r === Infinity ? 0 : fig.r;
            }

            // Economy bonus (Min 2 overs = 12 balls)
            if (fig.b >= 12) {
                const econ = (fig.r / fig.b) * 6;
                if (econ < 4.5) { pts += 20; mvp.bowl += 20; }
                else if (econ < 6.0) { pts += 10; mvp.bowl += 10; }
            }
            perf.bowl += pts;
        }
        bowl.econ = bowl.ballsBowled > 0 ? ((bowl.runsConceded / bowl.ballsBowled) * 6).toFixed(2) : "0.00";
        bowl.avg = bowl.wickets > 0 ? (bowl.runsConceded / bowl.wickets).toFixed(2) : "∞";
        bowl.avgNum = bowl.wickets > 0 ? (bowl.runsConceded / bowl.wickets) : 999;
        bowl.bestFigures = `${bowl.bestFigW}/${bowl.bestFigR === Infinity ? 0 : bowl.bestFigR}`;
    }

    // Process Fielding Points
    for (const field of fieldStats.values()) {
        const mvp = getMvp(field.name);
        mvp.field += (field.catches * 15);
        mvp.field += (field.stumpings * 20);
        mvp.field += (field.runouts * 20);

        for (const [mId, fig] of field.matchFigures.entries()) {
            const perf = getMatchPerf(mvp, mId);
            perf.field += (fig.c * 15) + (fig.s * 20) + (fig.r * 20);
        }
    }

    // Calculate Totals and Sort MVP
    for (const mvp of mvpPoints.values()) {
        mvp.total = mvp.bat + mvp.bowl + mvp.field;
        mvp.matchHistory = Array.from(mvp.matchHistory.values())
            .map(p => ({ ...p, total: p.bat + p.bowl + p.field }))
            .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));
    }
    const mvpRankings = Array.from(mvpPoints.values()).sort((a, b) => b.total - a.total).slice(0, 20);

    // --- Produce Sorted Arrays ---
    const bArr = Array.from(batStats.values());
    const bwArr = Array.from(bowlStats.values());
    const fArr = Array.from(fieldStats.values()).map(f => ({ ...f, total: f.catches + f.runouts + f.stumpings }));

    // Batting
    const topRuns = [...bArr].sort((a, b) => b.runs - a.runs).slice(0, 10);
    const highestSR = [...bArr].filter(b => b.runs >= 30 || b.balls >= 15).sort((a, b) => parseFloat(b.sr) - parseFloat(a.sr)).slice(0, 10);
    const bestBatAvg = [...bArr].filter(b => b.runs >= 30).sort((a, b) => b.avgNum - a.avgNum).map(b => ({ ...b, val: b.avg })).slice(0, 10);
    const highestScores = [...bArr].sort((a, b) => b.highestScore - a.highestScore).slice(0, 10);
    const topFours = [...bArr].sort((a, b) => b.fours - a.fours).slice(0, 10);
    const topSixes = [...bArr].sort((a, b) => b.sixes - a.sixes).slice(0, 10);
    const mostFifties = [...bArr].sort((a, b) => b.fifties - a.fifties).slice(0, 10);
    const mostHundreds = [...bArr].sort((a, b) => b.hundreds - a.hundreds).slice(0, 10);

    // Bowling
    const topWickets = [...bwArr].sort((a, b) => b.wickets - a.wickets).slice(0, 10);
    const bestEcon = [...bwArr].filter(b => b.ballsBowled >= 12).sort((a, b) => parseFloat(a.econ) - parseFloat(b.econ)).slice(0, 10);
    const bestBowlAvg = [...bwArr].filter(b => b.wickets >= 2).sort((a, b) => a.avgNum - b.avgNum).map(b => ({ ...b, val: b.avg })).slice(0, 10);
    const most5W = [...bwArr].sort((a, b) => b.fiveWickets - a.fiveWickets).slice(0, 10);
    const bestBowlingFigures = [...bwArr].sort((a, b) => {
        if (b.bestFigW !== a.bestFigW) return b.bestFigW - a.bestFigW;
        return a.bestFigR - b.bestFigR;
    }).slice(0, 10);

    // Fielding
    const mostDismissals = [...fArr].sort((a, b) => b.total - a.total).slice(0, 10);
    const topCatches = [...fArr].sort((a, b) => b.catches - a.catches).slice(0, 10);
    const mostRunouts = [...fArr].sort((a, b) => b.runouts - a.runouts).slice(0, 10);
    const mostStumpings = [...fArr].sort((a, b) => b.stumpings - a.stumpings).slice(0, 10);

    res.json({
        success: true,
        data: {
            topRuns, highestSR, bestBatAvg, highestScores, topFours, topSixes, mostFifties, mostHundreds,
            topWickets, bestEcon, bestBowlAvg, most5W, bestBowlingFigures,
            mostDismissals, topCatches, mostRunouts, mostStumpings,
            mvpRankings
        }
    });
});
// @desc    Shuffle teams into groups
// @route   PUT /api/tournaments/:id/shuffle
// @access  Private/Admin
export const shuffleTournamentGroups = asyncHandler(async (req, res) => {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Ownership check
    if (tournament.createdBy && req.user && tournament.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized. You can only modify tournaments you created.');
    }

    if (tournament.groupStructure === 'None' || tournament.groupsCount <= 1) {
        res.status(400);
        throw new Error('Tournament does not support multiple groups');
    }

    if (!tournament.teams || tournament.teams.length < tournament.groupsCount) {
        res.status(400);
        throw new Error(`Need at least ${tournament.groupsCount} teams to shuffle into groups`);
    }

    // Shuffle teams
    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

    // Re-initialize groups
    const newGroups = [];
    for (let i = 0; i < tournament.groupsCount; i++) {
        newGroups.push({
            name: `Group ${String.fromCharCode(65 + i)}`,
            teams: []
        });
    }

    // Distribute teams evenly
    shuffledTeams.forEach((teamId, index) => {
        const groupIdx = index % tournament.groupsCount;
        newGroups[groupIdx].teams.push(teamId);
    });

    tournament.groups = newGroups;
    await tournament.save();

    res.json({
        success: true,
        data: tournament
    });
});

// @desc    Recalculate points table from scratch using all completed matches
// @route   POST /api/tournaments/:id/recalculate
// @access  Private/Admin
export const recalculatePointsTable = asyncHandler(async (req, res) => {
    const tournamentId = req.params.id;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Ownership check
    if (tournament.createdBy && req.user && tournament.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized. You can only modify tournaments you created.');
    }

    const maxOvers = tournament.overs || 20;

    // Helper: convert cricket overs notation to decimal overs
    const oversToDecimal = (ov) => {
        if (!ov || ov === 0) return 0;
        const full = Math.floor(ov);
        const balls = Math.round((ov - full) * 10);
        return full + (balls / 6);
    };

    // Reset all points table entries for this tournament
    await PointsTable.updateMany(
        { tournament: tournamentId },
        { $set: { played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, nrr: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0 } }
    );

    // Get all completed matches
    const matches = await Match.find({ tournament: tournamentId, status: 'Completed' });

    for (const match of matches) {
        if (!match.result) continue;
        const { winner, isTie } = match.result;

        if (isTie) {
            await PointsTable.updateMany(
                { tournament: tournamentId, team: { $in: [match.homeTeam, match.awayTeam] } },
                { $inc: { played: 1, tied: 1, points: tournament.pointsRule?.tie || 1 } }
            );
        } else if (winner) {
            const loser = winner.toString() === match.homeTeam.toString() ? match.awayTeam : match.homeTeam;

            await PointsTable.findOneAndUpdate(
                { tournament: tournamentId, team: winner },
                { $inc: { played: 1, won: 1, points: tournament.pointsRule?.win || 2 } }
            );
            await PointsTable.findOneAndUpdate(
                { tournament: tournamentId, team: loser },
                { $inc: { played: 1, lost: 1 } }
            );
        }

        // NRR
        const score1 = match.score?.team1 || { runs: 0, overs: 0, wickets: 0 };
        const score2 = match.score?.team2 || { runs: 0, overs: 0, wickets: 0 };

        let overs1 = oversToDecimal(score1.overs);
        let overs2 = oversToDecimal(score2.overs);
        if (score1.wickets >= 10 || overs1 >= maxOvers) overs1 = maxOvers;
        if (score2.wickets >= 10 || overs2 >= maxOvers) overs2 = maxOvers;

        if (overs1 > 0 && overs2 > 0) {
            // HomeTeam batted first
            await PointsTable.findOneAndUpdate(
                { tournament: tournamentId, team: match.homeTeam },
                { $inc: { runsScored: score1.runs, oversFaced: overs1, runsConceded: score2.runs, oversBowled: overs2 } }
            );
            await PointsTable.findOneAndUpdate(
                { tournament: tournamentId, team: match.awayTeam },
                { $inc: { runsScored: score2.runs, oversFaced: overs2, runsConceded: score1.runs, oversBowled: overs1 } }
            );
        }
    }

    // Recalculate NRR for all entries
    const entries = await PointsTable.find({ tournament: tournamentId });
    for (const entry of entries) {
        entry.nrr = (entry.oversFaced > 0 && entry.oversBowled > 0)
            ? (entry.runsScored / entry.oversFaced) - (entry.runsConceded / entry.oversBowled)
            : 0;
        await entry.save();
    }

    const updatedTable = await PointsTable.find({ tournament: tournamentId }).populate('team');

    res.json({
        success: true,
        message: `Points table recalculated from ${matches.length} completed matches`,
        data: updatedTable
    });
});

// @desc    Follow a tournament
// @route   POST /api/tournaments/:id/follow
// @access  Private
export const followTournament = asyncHandler(async (req, res) => {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    const user = await User.findById(req.user.id);
    const tournamentIdStr = req.params.id;
    
    // Check if already followed - use toString() for robust comparison
    const isAlreadyFollowed = user.followedTournaments.some(id => id.toString() === tournamentIdStr);
    
    if (!isAlreadyFollowed) {
        user.followedTournaments.push(tournamentIdStr);
        await user.save();
    }

    res.json({
        success: true,
        message: 'Successfully followed tournament'
    });
});

// @desc    Unfollow a tournament
// @route   POST /api/tournaments/:id/unfollow
// @access  Private
export const unfollowTournament = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    user.followedTournaments = user.followedTournaments.filter(
        id => id.toString() !== req.params.id
    );
    await user.save();

    res.json({
        success: true,
        message: 'Successfully unfollowed tournament'
    });
});
