import mongoose from 'mongoose';

const footballStandingSchema = new mongoose.Schema({
    leagueId:     { type: Number, required: true, index: true },
    teamId:       { type: String, required: true },
    teamName:     { type: String, required: true },
    shortName:    { type: String },
    logoUrl:      { type: String },
    position:     { type: Number },
    played:       { type: Number, default: 0 },
    wins:         { type: Number, default: 0 },
    draws:        { type: Number, default: 0 },
    losses:       { type: Number, default: 0 },
    goalsFor:     { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDiff:     { type: Number, default: 0 },
    points:       { type: Number, default: 0 },
    qualColor:    { type: String, default: null }, // e.g. "Champions League", "Relegation"
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index so we can quickly wipe + re-insert for a given league
footballStandingSchema.index({ leagueId: 1, position: 1 });

// Auto-expire documents using MongoDB TTL – this is a safety net on top of
// the application-level expiry check; documents are dropped from the collection
// automatically once `cacheExpiry` is in the past + a 1-hour buffer.
footballStandingSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

const FootballStanding = mongoose.model('FootballStanding', footballStandingSchema);

export default FootballStanding;
