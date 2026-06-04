import Favorite from '../models/Favorite.js';
import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get all favorites for user
 * @route   GET /api/favorites
 * @access  Private
 */
export const getFavorites = asyncHandler(async (req, res) => {
    const favorites = await Favorite.find({ userId: req.user.id })
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: favorites.length,
        data: favorites
    });
});

/**
 * @desc    Add a match to favorites
 * @route   POST /api/favorites
 * @access  Private
 */
export const addFavorite = asyncHandler(async (req, res) => {
    const { matchId, sport, teams, date, venue, status } = req.body;

    // Check if already favorited
    const existing = await Favorite.findOne({
        userId: req.user.id,
        matchId
    });

    if (existing) {
        res.status(400);
        throw new Error('Match is already in favorites');
    }

    const favorite = await Favorite.create({
        userId: req.user.id,
        matchId,
        sport,
        teams,
        date,
        venue,
        status
    });

    // Log activity
    await Activity.create({
        userId: req.user.id,
        type: 'favorite_add',
        description: `Added ${teams.team1} vs ${teams.team2} to favorites`,
        metadata: { matchId, sport }
    });

    // Check for first favorite achievement
    const favCount = await Favorite.countDocuments({ userId: req.user.id });
    if (favCount === 1) {
        try {
            await Achievement.create({
                userId: req.user.id,
                achievementId: 'first_favorite',
                title: 'Bookmark Master',
                description: 'Added first match to favorites',
                icon: '⭐',
                category: 'engagement',
                points: 50
            });

            // Add points
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { 'stats.totalPoints': 50 }
            });
        } catch (e) {
            // Achievement already exists
        }
    }

    res.status(201).json({
        success: true,
        message: 'Added to favorites',
        data: favorite
    });
});

/**
 * @desc    Remove a match from favorites
 * @route   DELETE /api/favorites/:id
 * @access  Private
 */
export const removeFavorite = asyncHandler(async (req, res) => {
    const favorite = await Favorite.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!favorite) {
        res.status(404);
        throw new Error('Favorite not found');
    }

    await favorite.deleteOne();

    // Log activity
    await Activity.create({
        userId: req.user.id,
        type: 'favorite_remove',
        description: `Removed ${favorite.teams.team1} vs ${favorite.teams.team2} from favorites`,
        metadata: { matchId: favorite.matchId }
    });

    res.json({
        success: true,
        message: 'Removed from favorites'
    });
});

/**
 * @desc    Check if a match is favorited
 * @route   GET /api/favorites/check/:matchId
 * @access  Private
 */
export const checkFavorite = asyncHandler(async (req, res) => {
    const favorite = await Favorite.findOne({
        userId: req.user.id,
        matchId: req.params.matchId
    });

    res.json({
        success: true,
        data: {
            isFavorited: !!favorite,
            favoriteId: favorite?._id
        }
    });
});
