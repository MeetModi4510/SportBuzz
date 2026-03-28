import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    matchId: {
        type: String,
        required: true
    },
    sport: {
        type: String,
        required: true,
        enum: ['cricket', 'football', 'basketball', 'tennis']
    },
    teams: {
        team1: { type: String, required: true },
        team2: { type: String, required: true }
    },
    date: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'completed'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, matchId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
