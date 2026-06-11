import mongoose from 'mongoose';

const playerTopStatSchema = new mongoose.Schema({
    leagueId:     { type: Number, required: true, index: true },
    leagueName:   { type: String, required: true },
    statTyp:      { type: Number, required: true },   // Typ from API (1=Goals, 3=Assists, etc.)
    rank:         { type: Number, required: true },
    playerName:   { type: String, required: true },
    playerId:     { type: String },
    teamName:     { type: String },
    teamId:       { type: String },
    statValue:    { type: String },                    // raw Scrs value
    imageUrl:     { type: String },                    // partial path e.g. "29179241.png"
    teamBadgeUrl: { type: String },                    // partial path e.g. "enet/8456.png"
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

playerTopStatSchema.index({ leagueId: 1, statTyp: 1, rank: 1 });
playerTopStatSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

export const PlayerTopStat = mongoose.model('PlayerTopStat', playerTopStatSchema);

// ─────────────────────────────────────────────────────────────────────────────

const teamTopStatSchema = new mongoose.Schema({
    leagueId:     { type: Number, required: true, index: true },
    leagueName:   { type: String, required: true },
    statTyp:      { type: Number, required: true },
    rank:         { type: Number, required: true },
    teamName:     { type: String, required: true },
    teamId:       { type: String },
    statValue:    { type: String },  // Total value
    statPerGame:  { type: String },  // Per game value (PrGm)
    teamBadgeUrl: { type: String },
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

teamTopStatSchema.index({ leagueId: 1, statTyp: 1, rank: 1 });
teamTopStatSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

export const TeamTopStat = mongoose.model('TeamTopStat', teamTopStatSchema);
