import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get top leaderboard
 * @route   GET /api/leaderboard
 * @access  Private
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await User.find()
        .select('fullName stats')
        .sort({ 'stats.totalPoints': -1 })
        .limit(limit);

    const formattedLeaderboard = leaderboard.map((user, index) => ({
        rank: index + 1,
        name: user.fullName,
        points: user.stats.totalPoints,
        predictions: user.stats.totalPredictions,
        accuracy: user.stats.totalPredictions > 0
            ? Math.round((user.stats.correctPredictions / user.stats.totalPredictions) * 100)
            : 0,
        level: user.stats.level
    }));

    res.json({
        success: true,
        count: formattedLeaderboard.length,
        data: formattedLeaderboard
    });
});

/**
 * @desc    Get current user's leaderboard stats
 * @route   GET /api/leaderboard/me
 * @access  Private
 */
export const getMyStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    // Calculate rank
    const higherRankedCount = await User.countDocuments({
        'stats.totalPoints': { $gt: user.stats.totalPoints }
    });

    const rank = higherRankedCount + 1;
    const totalUsers = await User.countDocuments();

    const accuracy = user.stats.totalPredictions > 0
        ? ((user.stats.correctPredictions / user.stats.totalPredictions) * 100).toFixed(1)
        : 0;

    res.json({
        success: true,
        data: {
            rank,
            totalUsers,
            percentile: Math.round(((totalUsers - rank + 1) / totalUsers) * 100),
            totalPoints: user.stats.totalPoints,
            correctPredictions: user.stats.correctPredictions,
            totalPredictions: user.stats.totalPredictions,
            accuracy: parseFloat(accuracy),
            level: user.stats.level
        }
    });
});

/**
 * @desc    Update user points (internal use)
 */
export const addPoints = async (userId, points, reason) => {
    const user = await User.findById(userId);
    if (!user) return null;

    user.stats.totalPoints += points;
    user.stats.level = user.calculateLevel();
    await user.save();

    return user.stats;
};
