import asyncHandler from 'express-async-handler';
import Team from '../models/Team.js';

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
        color
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
