import mongoose from 'mongoose';

const trendingPlayerSchema = new mongoose.Schema({
    playerId:    { type: Number, required: true, unique: true },
    playerName:  { type: String, required: true },
    position:    { type: String, default: null },
    teamName:    { type: String, default: null },
    teamId:      { type: Number, default: null },
    teamFlag:    { type: String, default: null },
    imageUrl:    { type: String, default: null },
    rating:      { type: Number, default: null },
    stats: {
        goals:   { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        passes:  { type: Number, default: 0 },
        saves:   { type: Number, default: 0 },
    },
    rawData:      { type: mongoose.Schema.Types.Mixed },
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

// TTL index — MongoDB auto-removes docs 1 hour after cacheExpiry
trendingPlayerSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

const TrendingPlayer = mongoose.model('TrendingPlayer', trendingPlayerSchema);
export default TrendingPlayer;
