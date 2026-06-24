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
    const { type = 'match', itemId, name, image, matchId, sport, teams, date, venue, status } = req.body;

    // Check if already favorited
    let existingQuery = { userId: req.user.id, type };
    if (type === 'match') existingQuery.matchId = matchId;
    else existingQuery.itemId = itemId;

    const existing = await Favorite.findOne(existingQuery);

    if (existing) {
        res.status(400);
        throw new Error(`${type} is already in favorites`);
    }

    const favorite = await Favorite.create({
        userId: req.user.id,
        type,
        itemId,
        name,
        image,
        matchId,
        sport,
        teams,
        date,
        venue,
        status
    });

    // Log activity
    const activityDesc = type === 'match' 
        ? `Added ${teams?.team1} vs ${teams?.team2} to favorites`
        : `Added ${name} to favorites`;

    await Activity.create({
        userId: req.user.id,
        type: 'favorite_add',
        description: activityDesc,
        metadata: { type, itemId, matchId, sport }
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
    const activityDesc = favorite.type === 'match'
        ? `Removed ${favorite.teams?.team1} vs ${favorite.teams?.team2} from favorites`
        : `Removed ${favorite.name} from favorites`;

    await Activity.create({
        userId: req.user.id,
        type: 'favorite_remove',
        description: activityDesc,
        metadata: favorite.type === 'match' ? { matchId: favorite.matchId } : { type: favorite.type, itemId: favorite.itemId }
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
    const { type = 'match', itemId } = req.query;
    
    let query = { userId: req.user.id, type: type };
    if (type === 'match') {
        query.matchId = req.params.id;
    } else {
        query.itemId = req.params.id;
    }

    const favorite = await Favorite.findOne(query);

    res.json({
        success: true,
        isFavorite: !!favorite,
        favoriteId: favorite?._id
    });
});
