import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['match', 'team', 'player', 'league'],
        default: 'match'
    },
    itemId: {
        type: String
    },
    name: {
        type: String
    },
    image: {
        type: String
    },
    matchId: {
        type: String
    },
    sport: {
        type: String,
        required: true,
        enum: ['cricket', 'football', 'basketball', 'tennis']
    },
    teams: {
        team1: { type: String },
        team2: { type: String }
    },
    date: {
        type: Date
    },
    venue: {
        type: String
    },
    status: {
        type: String,
        enum: ['upcoming', 'live', 'completed'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate favorites per user
favoriteSchema.index({ userId: 1, type: 1, matchId: 1, itemId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
