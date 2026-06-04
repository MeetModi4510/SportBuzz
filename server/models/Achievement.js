import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievementId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '🏆'
    },
    category: {
        type: String,
        enum: ['prediction', 'engagement', 'milestone', 'special'],
        default: 'milestone'
    },
    points: {
        type: Number,
        default: 100
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate achievements per user
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Static method to get available achievements
achievementSchema.statics.getAvailableAchievements = function () {
    return [
        { id: 'first_login', title: 'Welcome Aboard', description: 'Logged in for the first time', icon: '👋', category: 'milestone', points: 50 },
        { id: 'first_favorite', title: 'Bookmark Master', description: 'Added first match to favorites', icon: '⭐', category: 'engagement', points: 50 },
        { id: 'profile_complete', title: 'Identity Revealed', description: 'Completed your profile', icon: '🎭', category: 'milestone', points: 100 },
        { id: 'cricket_fan', title: 'Cricket Enthusiast', description: 'Viewed 10 cricket matches', icon: '🏏', category: 'engagement', points: 100 },
        { id: 'prediction_streak', title: 'Oracle', description: '5 correct predictions in a row', icon: '🔮', category: 'prediction', points: 200 },
        { id: 'points_500', title: 'Rising Star', description: 'Earned 500 points', icon: '⭐', category: 'milestone', points: 100 },
        { id: 'points_2000', title: 'Pro Player', description: 'Earned 2000 points', icon: '💫', category: 'milestone', points: 200 },
        { id: 'points_5000', title: 'Elite Member', description: 'Earned 5000 points', icon: '🌟', category: 'milestone', points: 300 },
        { id: 'week_streak', title: 'Dedicated Fan', description: 'Logged in 7 days in a row', icon: '🔥', category: 'engagement', points: 150 },
        { id: 'first_prediction', title: 'Fortune Teller', description: 'Made your first prediction', icon: '🎯', category: 'prediction', points: 50 }
    ];
};

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
