import mongoose from 'mongoose';

const worldCupStandingSchema = new mongoose.Schema({
    competition:  { type: String, required: true, index: true }, // e.g. "world-cup-2026"
    groupName:    { type: String, required: true },              // e.g. "Group A"
    groupLetter:  { type: String, required: true },              // e.g. "A"
    position:     { type: Number, required: true },
    teamId:       { type: String, required: true },
    teamName:     { type: String, required: true },
    teamLogo:     { type: String },
    played:       { type: Number, default: 0 },
    wins:         { type: Number, default: 0 },
    draws:        { type: Number, default: 0 },
    losses:       { type: Number, default: 0 },
    goalsFor:     { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDiff:     { type: Number, default: 0 },
    points:       { type: Number, default: 0 },
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for fast grouped queries
worldCupStandingSchema.index({ competition: 1, groupLetter: 1, position: 1 });

// TTL safety net — auto-expire documents 1 hour after cacheExpiry
worldCupStandingSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

const WorldCupStanding = mongoose.model('WorldCupStanding', worldCupStandingSchema);

export default WorldCupStanding;
