import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get user activity history
 * @route   GET /api/activity
 * @access  Private
 */
export const getActivityHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Activity.countDocuments({ userId: req.user.id });

    res.json({
        success: true,
        count: activities.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: activities
    });
});

/**
 * @desc    Get user achievements
 * @route   GET /api/activity/achievements
 * @access  Private
 */
export const getAchievements = asyncHandler(async (req, res) => {
    // Get unlocked achievements
    const unlockedAchievements = await Achievement.find({ userId: req.user.id })
        .sort({ unlockedAt: -1 });

    // Get all available achievements
    const allAchievements = Achievement.getAvailableAchievements();

    // Mark which ones are unlocked
    const achievementsWithStatus = allAchievements.map(achievement => {
        const unlocked = unlockedAchievements.find(
            ua => ua.achievementId === achievement.id
        );
        return {
            ...achievement,
            unlocked: !!unlocked,
            unlockedAt: unlocked?.unlockedAt || null
        };
    });

    // Calculate total points from achievements
    const totalAchievementPoints = unlockedAchievements.reduce(
        (sum, a) => sum + (a.points || 0),
        0
    );

    res.json({
        success: true,
        data: {
            unlocked: unlockedAchievements.length,
            total: allAchievements.length,
            totalPoints: totalAchievementPoints,
            achievements: achievementsWithStatus
        }
    });
});

/**
 * @desc    Get recent activity summary
 * @route   GET /api/activity/summary
 * @access  Private
 */
export const getActivitySummary = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get activity counts by type for last week
    const activityCounts = await Activity.aggregate([
        {
            $match: {
                userId: req.user._id,
                createdAt: { $gte: weekAgo }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get daily activity for last 7 days
    const dailyActivity = await Activity.aggregate([
        {
            $match: {
                userId: req.user._id,
                createdAt: { $gte: weekAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            byType: activityCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            daily: dailyActivity
        }
    });
});
