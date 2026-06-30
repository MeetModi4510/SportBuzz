import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';
import Team from '../models/Team.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('teams');

    if (!user) {
        res.status(401);
        throw new Error('User not found or session expired');
    }

    res.json({
        success: true,
        data: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            location: user.location,
            favoriteTeam: user.favoriteTeam,
            bio: user.bio,
            battingStyle: user.battingStyle || 'Right-hand Bat',
            bowlingStyle: user.bowlingStyle || 'Right-arm Fast',
            playingRole: user.playingRole || 'Batsman',
            teams: user.teams || [],
            photoUrl: user.photoUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, phone, location, favoriteTeam, bio, photoUrl } = req.body;

    const user = await User.findById(req.user._id);

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (favoriteTeam !== undefined) user.favoriteTeam = favoriteTeam;
    if (bio !== undefined) user.bio = bio;
    if (req.body.battingStyle !== undefined) user.battingStyle = req.body.battingStyle;
    if (req.body.bowlingStyle !== undefined) user.bowlingStyle = req.body.bowlingStyle;
    if (req.body.playingRole !== undefined) user.playingRole = req.body.playingRole;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;

    await user.save();

    // Sync player details across all teams they belong to
    if (fullName !== undefined || photoUrl !== undefined || req.body.playingRole !== undefined || req.body.battingStyle !== undefined || req.body.bowlingStyle !== undefined) {
        try {
            const teams = await Team.find({
                $or: [
                    { "players.userId": user._id },
                    { "players.userId": user._id.toString() },
                    { "captainId": user._id },
                    { "captainId": user._id.toString() }
                ]
            });
            
            for (const team of teams) {
                let teamChanged = false;
                
                if (team.players && Array.isArray(team.players)) {
                    team.players = team.players.map(p => {
                        const isCaptainMatch = team.captainId && team.captainId.toString() === user._id.toString() && (!p.userId ? p.name === user.fullName || p.name === team.captain : p.userId.toString() === user._id.toString());
                        const isPlayerMatch = (p.userId && p.userId.toString() === user._id.toString()) || (!p.userId && p.name === user.fullName);
                        
                        if (isPlayerMatch || isCaptainMatch) {
                            teamChanged = true;
                            return {
                                ...p,
                                userId: p.userId || user._id, // Add userId if it was missing (like for captain)
                                name: user.fullName || p.name,
                                photo: user.photoUrl !== undefined ? user.photoUrl : p.photo,
                                role: user.playingRole || p.role,
                                battingStyle: user.battingStyle || p.battingStyle,
                                bowlingStyle: user.bowlingStyle || p.bowlingStyle
                            };
                        }
                        return p;
                    });
                }
                
                if (teamChanged) {
                    team.markModified('players');
                    
                    // Sync captain name if they are the captain
                    if (team.captainId && team.captainId.toString() === user._id.toString() && fullName) {
                        team.captain = user.fullName;
                    }
                    
                    await team.save();
                }
            }
        } catch (error) {
            console.error('Error syncing player profile to teams:', error);
        }
    }

    // Log activity
    await Activity.create({
        userId: user._id,
        type: 'profile_update',
        description: 'Profile updated'
    });

    // Check for profile complete achievement
    if (user.fullName && user.phone && user.location && user.bio) {
        try {
            await Achievement.create({
                userId: user._id,
                achievementId: 'profile_complete',
                title: 'Identity Revealed',
                description: 'Completed your profile',
                icon: '🎭',
                category: 'milestone',
                points: 100
            });

            // Add points
            user.stats.totalPoints += 100;
            user.stats.level = user.calculateLevel();
            await user.save();
        } catch (e) {
            // Achievement already exists
        }
    }

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            location: user.location,
            favoriteTeam: user.favoriteTeam,
            bio: user.bio,
            battingStyle: user.battingStyle,
            bowlingStyle: user.bowlingStyle,
            photoUrl: user.photoUrl
        }
    });
});

/**
 * @desc    Get user preferences
 * @route   GET /api/users/preferences
 * @access  Private
 */
export const getPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.json({
        success: true,
        data: user.preferences
    });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Update preferences
    const allowedFields = [
        'darkMode', 'emailNotifications', 'pushNotifications',
        'smsNotifications', 'matchUpdates', 'playerNews', 'weeklyDigest'
    ];

    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            user.preferences[field] = req.body[field];
        }
    });

    await user.save();

    res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: user.preferences
    });
});

/**
 * @desc    Get user stats for leaderboard
 * @route   GET /api/users/stats
 * @access  Private
 */
export const getUserStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Calculate rank
    const higherRankedCount = await User.countDocuments({
        'stats.totalPoints': { $gt: user.stats.totalPoints }
    });

    const rank = higherRankedCount + 1;

    res.json({
        success: true,
        data: {
            ...user.stats.toObject(),
            rank,
            accuracy: user.stats.totalPredictions > 0
                ? ((user.stats.correctPredictions / user.stats.totalPredictions) * 100).toFixed(1)
                : 0
        }
    });
});
