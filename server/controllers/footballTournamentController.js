import asyncHandler from 'express-async-handler';
import FootballTournament from '../models/FootballTournament.js';
import FootballTeam from '../models/FootballTeam.js';
import FootballMatch from '../models/FootballMatch.js';
import User from '../models/User.js';

// @desc    Create new football tournament
// @route   POST /api/football/tournaments
// @access  Private
export const createTournament = asyncHandler(async (req, res) => {
    const { name, format, teams, pointsRule, startDate, endDate } = req.body;

    try {
        const tournament = await FootballTournament.create({
            name,
            format,
            teams, // IDs of FootballTeam
            pointsRule,
            startDate,
            endDate,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: tournament });
    } catch (error) {
        console.error("Football Tournament Creation Error:", error);
        res.status(400).json({ 
            success: false, 
            message: error.message || "Failed to create tournament" 
        });
    }
});

// Helper to update tournament status based on dates and matches
export const syncTournamentStatus = async (tournamentOrId) => {
    let tournament = tournamentOrId;
    if (typeof tournamentOrId === 'string' || (tournamentOrId && !tournamentOrId.startDate)) {
        tournament = await FootballTournament.findById(tournamentOrId);
    }

    if (!tournament) return null;
    const now = new Date();
    let newStatus = tournament.status;

    // 1. Check Dates
    if (now >= tournament.startDate && now <= tournament.endDate) {
        if (tournament.status === 'Upcoming') newStatus = 'Live';
    } else if (now > tournament.endDate) {
        // If matches are still live, keep it Live. Otherwise Complete.
        const liveMatch = await FootballMatch.findOne({ tournamentId: tournament._id, status: 'Live' });
        if (!liveMatch && tournament.status !== 'Completed') {
            newStatus = 'Completed';
        }
    }

    // 2. Check if any match is currently Live
    const liveMatch = await FootballMatch.findOne({ tournamentId: tournament._id, status: 'Live' });
    if (liveMatch) {
        newStatus = 'Live';
    }

    if (newStatus !== tournament.status) {
        tournament.status = newStatus;
        await tournament.save();
    }
    return tournament;
};

// @desc    Get all football tournaments
// @route   GET /api/football/tournaments
// @access  Public
export const getTournaments = asyncHandler(async (req, res) => {
    const tournaments = await FootballTournament.find({}).populate('teams');
    
    // Sync statuses before returning
    const syncedTournaments = await Promise.all(
        tournaments.map(t => syncTournamentStatus(t))
    );
    
    res.json({ success: true, data: syncedTournaments });
});

// @desc    Get tournament by ID (with Table)
// @route   GET /api/football/tournaments/:id
// @access  Public
export const getTournamentById = asyncHandler(async (req, res) => {
    let tournament = await FootballTournament.findById(req.params.id).populate('teams');
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Sync status
    tournament = await syncTournamentStatus(tournament);

    // Fetch all matches for this tournament
    const matches = await FootballMatch.find({ tournamentId: req.params.id })
        .populate('homeTeam')
        .populate('awayTeam');
    
    res.json({ success: true, data: { tournament, matches } });
});

// @desc    Create Football Team
// @route   POST /api/football/teams
// @access  Private
export const createTeam = asyncHandler(async (req, res) => {
    const { name, logo, acronym, players, substitutes } = req.body;
    
    const team = await FootballTeam.create({
        name,
        logo,
        acronym,
        players,
        substitutes,
        createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: team });
});

// @desc    Get all football teams
// @route   GET /api/football/teams
// @access  Public
export const getTeams = asyncHandler(async (req, res) => {
    const teams = await FootballTeam.find({});
    res.json({ success: true, data: teams });
});

// @desc    Add existing team to tournament
// @route   POST /api/football/tournaments/:id/teams
// @access  Private
export const addTeamToTournament = asyncHandler(async (req, res) => {
    const { teamId } = req.body;
    const tournament = await FootballTournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Convert teamId to string for comparison if it's an ObjectId
    const teamIdStr = teamId.toString();
    if (tournament.teams.some(id => id.toString() === teamIdStr)) {
        res.status(400);
        throw new Error('Team already in tournament');
    }

    tournament.teams.push(teamId);
    await tournament.save();

    const populatedTournament = await FootballTournament.findById(tournament._id).populate('teams');
    res.json({ success: true, data: { tournament: populatedTournament } });
});

// @desc    Update tournament
// @route   PUT /api/football/tournaments/:id
// @access  Private
export const updateTournament = asyncHandler(async (req, res) => {
    const tournament = await FootballTournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    // Only creator or admin can update
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    if (String(tournament.createdBy) !== String(req.user._id) && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to update this tournament');
    }

    const { name, startDate, endDate, format } = req.body;
    tournament.name = name || tournament.name;
    tournament.startDate = startDate || tournament.startDate;
    tournament.endDate = endDate || tournament.endDate;
    tournament.format = format || tournament.format;

    await tournament.save();
    const updated = await FootballTournament.findById(tournament._id).populate('teams');
    res.json({ success: true, data: { tournament: updated } });
});

// @desc    Delete tournament
// @route   DELETE /api/football/tournaments/:id
// @access  Private
export const deleteTournament = asyncHandler(async (req, res) => {
    const tournament = await FootballTournament.findById(req.params.id);

    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    if (String(tournament.createdBy) !== String(req.user._id) && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to delete this tournament');
    }

    // Remove from users' followed lists
    await User.updateMany(
        { followedFootballTournaments: req.params.id },
        { $pull: { followedFootballTournaments: req.params.id } }
    );

    await tournament.deleteOne();
    res.json({ success: true, message: "Tournament deleted successfully" });
});

// @desc    Follow a football tournament
// @route   POST /api/football/tournaments/:id/follow
// @access  Private
export const followTournament = asyncHandler(async (req, res) => {
    const tournament = await FootballTournament.findById(req.params.id);
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    const userId = req.user._id;
    const tournamentId = req.params.id;

    const user = await User.findById(userId);
    
    if (!user.followedFootballTournaments.some(id => id.toString() === tournamentId)) {
        user.followedFootballTournaments.push(tournamentId);
        await user.save();
    }

    if (!tournament.followers) tournament.followers = [];
    if (!tournament.followers.some(id => id.toString() === userId.toString())) {
        tournament.followers.push(userId);
        await tournament.save();
    }

    res.json({ success: true, message: 'Successfully followed tournament' });
});

// @desc    Unfollow a football tournament
// @route   POST /api/football/tournaments/:id/unfollow
// @access  Private
export const unfollowTournament = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const tournamentId = req.params.id;

    const user = await User.findById(userId);
    user.followedFootballTournaments = user.followedFootballTournaments.filter(
        id => id.toString() !== tournamentId
    );
    await user.save();

    const tournament = await FootballTournament.findById(tournamentId);
    if (tournament && tournament.followers) {
        tournament.followers = tournament.followers.filter(
            id => id.toString() !== userId.toString()
        );
        await tournament.save();
    }

    res.json({ success: true, message: 'Successfully unfollowed tournament' });
});
// @desc    Update football team
// @route   PUT /api/football/teams/:id
// @access  Private
export const updateTeam = asyncHandler(async (req, res) => {
    const team = await FootballTeam.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Only creator or admin can update
    const isAdmin = req.user.role === 'admin' || req.user.email === 'meetmodi451013@gmail.com' || req.user.email === 'admin@sportbuzz.com';
    if (String(team.createdBy) !== String(req.user._id) && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to update this team');
    }

    const { name, logo, acronym, players, substitutes } = req.body;
    team.name = name || team.name;
    team.logo = logo || (logo === "" ? "" : team.logo); // Allow clearing logo
    team.acronym = acronym !== undefined ? acronym : team.acronym;
    if (players) team.players = players;
    if (substitutes) team.substitutes = substitutes;

    await team.save();
    res.json({ success: true, data: team });
});
// @desc    Get football team by ID with stats and matches
// @route   GET /api/football/teams/:id
// @access  Public
export const getTeamById = asyncHandler(async (req, res) => {
    const team = await FootballTeam.findById(req.params.id);
    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Fetch all matches involving this team
    const matches = await FootballMatch.find({
        $or: [
            { homeTeam: req.params.id },
            { awayTeam: req.params.id }
        ]
    }).populate('homeTeam awayTeam tournamentId');

    // Categorize matches into Win, Draw, Loss (for Recent Form)
    const recentForm = matches
        .filter(m => m.status === 'Completed')
        .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))
        .slice(0, 5)
        .map(m => {
            const isHome = m.homeTeam._id.toString() === req.params.id;
            const teamScore = isHome ? m.score.home : m.score.away;
            const oppScore = isHome ? m.score.away : m.score.home;
            
            if (teamScore > oppScore) return 'W';
            if (teamScore < oppScore) return 'L';
            return 'D';
        });

    // Aggregate player stats from matches
    const playerStats = {};
    matches.forEach(match => {
        match.events.forEach(event => {
            if (event.team?.toString() === req.params.id || (typeof event.team === 'object' && event.team?._id?.toString() === req.params.id)) {
                const playerName = event.player;
                if (!playerStats[playerName]) {
                    playerStats[playerName] = { goals: 0, yellowCards: 0, redCards: 0 };
                }
                if (event.type === 'Goal') playerStats[playerName].goals++;
                if (event.type === 'YellowCard') playerStats[playerName].yellowCards++;
                if (event.type === 'RedCard') playerStats[playerName].redCards++;
            }
        });
    });

    res.json({ 
        success: true, 
        data: { 
            team, 
            matches, 
            recentForm,
            playerStats 
        } 
    });
});

// @desc    Get tournament standings/points table
// @route   GET /api/football/tournaments/:id/stats
// @access  Public
export const getTournamentStats = asyncHandler(async (req, res) => {
    const tournament = await FootballTournament.findById(req.params.id).populate('teams');
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found');
    }

    const matches = await FootballMatch.find({ 
        tournamentId: req.params.id, 
        status: { $in: ['Completed', 'Live'] }
    });
    
    const pointsTable = tournament.teams.map(team => {
        const teamStats = {
            team,
            played: 0,
            won: 0,
            draw: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        };

        matches.forEach(match => {
            const isHome = match.homeTeam.toString() === team._id.toString();
            const isAway = match.awayTeam.toString() === team._id.toString();

            if (isHome || isAway) {
                teamStats.played++;
                const tf = isHome ? match.score.home : match.score.away;
                const ta = isHome ? match.score.away : match.score.home;
                teamStats.goalsFor += tf;
                teamStats.goalsAgainst += ta;

                if (tf > ta) {
                    teamStats.won++;
                    teamStats.points += (tournament.pointsRule?.win || 3);
                } else if (tf === ta) {
                    teamStats.draw++;
                    teamStats.points += (tournament.pointsRule?.draw || 1);
                } else {
                    teamStats.lost++;
                    teamStats.points += (tournament.pointsRule?.loss || 0);
                }
            }
        });

        teamStats.goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;
        return teamStats;
    });

    const teamMap = {};
    tournament.teams.forEach(t => teamMap[t._id.toString()] = t.name);

    const playerStats = {};
    const getPlayer = (name, teamId) => {
        if (!playerStats[name]) {
            playerStats[name] = {
                name,
                teamName: teamMap[teamId?.toString()] || 'Unknown',
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                saves: 0
            };
        }
        return playerStats[name];
    };

    matches.forEach(match => {
        match.events.forEach(event => {
            if (event.player) {
                const p = getPlayer(event.player, event.team);
                if (event.type === 'Goal') p.goals++;
                if (event.type === 'YellowCard') p.yellowCards++;
                if (event.type === 'RedCard') p.redCards++;
                if (event.type === 'Save') p.saves++;
            }
            if (event.assister && event.assister !== 'No Assist' && event.assister !== 'Unknown Player') {
                const a = getPlayer(event.assister, event.team);
                a.assists++;
            }
        });
    });

    const stats = {
        topScorers: Object.values(playerStats).filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10),
        topAssisters: Object.values(playerStats).filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10),
        mostCards: Object.values(playerStats).filter(p => p.yellowCards > 0 || p.redCards > 0).sort((a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2)).slice(0, 10),
        topKeepers: Object.values(playerStats).filter(p => p.saves > 0).sort((a, b) => b.saves - a.saves).slice(0, 10)
    };

    res.json({ success: true, data: { pointsTable, stats } });
});
