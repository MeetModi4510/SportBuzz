import cricketService from '../services/cricketApiService.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get live cricket matches
 * @route   GET /api/cricket/matches/live
 * @access  Private
 */
export const getLiveMatches = asyncHandler(async (req, res) => {
    const matches = await cricketService.getLiveMatches();

    res.json({
        success: true,
        count: matches.length,
        data: matches
    });
});

/**
 * @desc    Get upcoming cricket matches
 * @route   GET /api/cricket/matches/upcoming
 * @access  Private
 */
export const getUpcomingMatches = asyncHandler(async (req, res) => {
    const matches = await cricketService.getUpcomingMatches();

    res.json({
        success: true,
        count: matches.length,
        data: matches
    });
});

/**
 * @desc    Get recent/completed cricket matches
 * @route   GET /api/cricket/matches/recent
 * @access  Private
 */
export const getRecentMatches = asyncHandler(async (req, res) => {
    const matches = await cricketService.getRecentMatches();

    res.json({
        success: true,
        count: matches.length,
        data: matches
    });
});

/**
 * @desc    Get all cricket matches (combined)
 * @route   GET /api/cricket/matches
 * @access  Private
 */
export const getAllMatches = asyncHandler(async (req, res) => {
    const [live, upcoming, recent] = await Promise.all([
        cricketService.getLiveMatches(),
        cricketService.getUpcomingMatches(),
        cricketService.getRecentMatches()
    ]);

    // Remove duplicates by match ID
    const allMatches = [...live, ...upcoming, ...recent];
    const uniqueMatches = allMatches.filter((match, index, self) =>
        index === self.findIndex(m => m.id === match.id)
    );

    res.json({
        success: true,
        count: uniqueMatches.length,
        data: {
            live: live.length,
            upcoming: upcoming.length,
            recent: recent.length,
            matches: uniqueMatches
        }
    });
});

/**
 * @desc    Get match scorecard
 * @route   GET /api/cricket/matches/:id/scorecard
 * @access  Private
 */
export const getMatchScorecard = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Extract numeric ID from cricket-12345 format
    const matchId = id.startsWith('cricket-')
        ? id.replace('cricket-', '')
        : id;

    const scorecard = await cricketService.getMatchScorecard(matchId);

    // Log match view activity
    if (req.user) {
        await Activity.create({
            userId: req.user._id,
            type: 'match_view',
            description: `Viewed match scorecard`,
            metadata: { matchId: id }
        });
    }

    res.json({
        success: true,
        data: scorecard
    });
});

/**
 * @desc    Get player analysis
 * @route   GET /api/cricket/analysis/player/:id
 * @access  Private
 */
export const getPlayerAnalysis = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const analysis = await cricketService.getPlayerAnalysis(id);

    res.json({
        success: true,
        data: analysis
    });
});

/**
 * @desc    Get team comparison
 * @route   GET /api/cricket/analysis/team/compare
 * @access  Private
 */
export const getTeamComparison = asyncHandler(async (req, res) => {
    const { team1, team2 } = req.query;

    if (!team1 || !team2) {
        res.status(400);
        throw new Error('Please provide team1 and team2 query parameters');
    }

    const comparison = await cricketService.getTeamComparison(team1, team2);

    res.json({
        success: true,
        data: comparison
    });
});

/**
 * @desc    Clear API cache (admin only)
 * @route   POST /api/cricket/cache/clear
 * @access  Private/Admin
 */
export const clearCache = asyncHandler(async (req, res) => {
    cricketService.clearCache();

    res.json({
        success: true,
        message: 'Cache cleared successfully'
    });
});
