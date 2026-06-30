import asyncHandler from 'express-async-handler';
import Team from '../models/Team.js';
import User from '../models/User.js';
import crypto from 'crypto';

// Helper to generate 6-character alphanumeric code
const generateJoinCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private/Admin
export const createTeam = asyncHandler(async (req, res) => {
    const { name, captain, acronym, players, logo, color } = req.body;

    const teamExists = await Team.findOne({ name });

    if (teamExists) {
        res.status(400);
        throw new Error('Team already exists');
    }

    const team = await Team.create({
        name,
        captain,
        acronym,
        players,
        logo,
        color,
        captainJoinCode: generateJoinCode(),
        playerJoinCode: generateJoinCode()
    });

    if (team) {
        res.status(201).json({
            success: true,
            data: team
        });
    } else {
        res.status(400);
        throw new Error('Invalid team data');
    }
});

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
export const getTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({});
    res.json({
        success: true,
        count: teams.length,
        data: teams
    });
});

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public
export const getTeamById = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (team) {
        res.json({
            success: true,
            data: team
        });
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});

// @desc    Update a team
// @route   PUT /api/teams/:id
// @access  Private/Admin
export const updateTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (team) {
        // Authorization check: User must be admin or the team's captain
        const isCaptain = team.captainId && team.captainId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isCaptain && !isAdmin) {
            res.status(403);
            throw new Error('Not authorized to update this team. You must be the captain.');
        }

        team.name = req.body.name || team.name;
        team.captain = req.body.captain || team.captain;
        team.acronym = req.body.acronym || team.acronym;
        team.players = req.body.players || team.players;
        team.logo = req.body.logo || team.logo;
        team.color = req.body.color || team.color;

        const updatedTeam = await team.save();
        res.json({
            success: true,
            data: updatedTeam
        });
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});

// @desc    Generate new join codes for a team
// @route   POST /api/teams/:id/generate-codes
// @access  Private
export const generateCodes = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    team.captainJoinCode = generateJoinCode();
    team.playerJoinCode = generateJoinCode();
    await team.save();

    res.json({
        success: true,
        data: {
            captainJoinCode: team.captainJoinCode,
            playerJoinCode: team.playerJoinCode
        }
    });
});

// @desc    Join a team using a code
// @route   POST /api/teams/join
// @access  Private
export const joinTeam = asyncHandler(async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        res.status(400);
        throw new Error('Please provide a join code');
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    // Find team by either code
    const team = await Team.findOne({
        $or: [
            { captainJoinCode: code },
            { playerJoinCode: code }
        ]
    });

    if (!team) {
        res.status(404);
        throw new Error('Invalid join code');
    }

    // Check if user is already in this team
    if (user.teams && user.teams.includes(team._id)) {
        res.status(400);
        throw new Error('You are already in this team');
    }

    const isCaptainCode = team.captainJoinCode === code;

    if (isCaptainCode) {
        team.captainId = userId;
        team.captain = user.fullName; // Update legacy field too
    }

    // Create player object from user profile
    const newPlayer = {
        userId: userId,
        name: user.fullName,
        role: user.playingRole || 'Batsman',
        battingStyle: user.battingStyle || 'Right-hand Bat',
        bowlingStyle: user.bowlingStyle || 'Right-arm Fast',
        photo: user.photoUrl || ''
    };

    // Add player to team if not already in the array by name
    const existingPlayerIndex = team.players.findIndex(p => p.name === user.fullName || (p.userId && p.userId.toString() === userId.toString()));
    
    if (existingPlayerIndex === -1) {
        team.players.push(newPlayer);
    } else {
        // Update existing guest entry with real user details
        team.players[existingPlayerIndex] = { ...team.players[existingPlayerIndex], ...newPlayer };
    }

    // Save team
    // Mongoose mixed types sometimes don't trigger save for arrays properly, markModified helps
    team.markModified('players');
    await team.save();

    // Add team to user's teams
    if (!user.teams) {
        user.teams = [];
    }
    user.teams.push(team._id);
    await user.save();

    res.json({
        success: true,
        message: isCaptainCode ? 'Joined successfully as Captain' : 'Joined successfully',
        data: team
    });
});

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private/Captain/Admin
export const deleteTeam = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (team) {
        // Authorization check
        const isCaptain = team.captainId && team.captainId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isCaptain && !isAdmin) {
            res.status(403);
            throw new Error('Not authorized to delete this team.');
        }

        // Remove team from all users who have it in their profile
        await User.updateMany(
            { teams: team._id },
            { $pull: { teams: team._id } }
        );

        // Delete the team document
        await Team.findByIdAndDelete(team._id);

        res.json({
            success: true,
            message: 'Team removed'
        });
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});
