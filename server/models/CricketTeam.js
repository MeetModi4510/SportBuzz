import mongoose from 'mongoose';

const cricketTeamSchema = new mongoose.Schema({
    teamId: { type: String, required: true, unique: true }, // e.g., 'india-6'
    teamName: { type: String, required: true },
    region: { type: String, required: true },
    flagUrl: { type: String },
    players: [{
        espnId: String,
        name: String,
        role: String,
        imageUrl: String
    }],
    lastUpdated: { type: Date, default: Date.now }
});

// TTL Index: Automatically expire/delete the document after 24 hours (86400 seconds)
// This ensures our cache never gets stale and we don't hold obsolete squad data.
cricketTeamSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('CricketTeam', cricketTeamSchema);
