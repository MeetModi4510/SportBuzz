import mongoose from 'mongoose';

const formatStatsSchema = new mongoose.Schema({
    matches: String,
    innings: String,
    runs: String,
    highestScore: String,
    average: String,
    strikeRate: String,
    hundreds: String,
    fifties: String,
    fours: String,
    sixes: String
}, { _id: false });

const oppositionStatSchema = new mongoose.Schema({
    team: String,
    average: Number
}, { _id: false });

const recentMatchSchema = new mongoose.Schema({
    match: String,
    runs: Number
}, { _id: false });

const cricketPlayerStatSchema = new mongoose.Schema({
    espnId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    team: { type: String },
    role: { type: String },
    
    // Core Formats
    stats: {
        test: formatStatsSchema,
        odi: formatStatsSchema,
        t20i: formatStatsSchema,
        ipl: formatStatsSchema // Keeping IPL as an option if scraped
    },
    
    // Cross-format / Deep charts data
    vsOpposition: [oppositionStatSchema],
    recentMatches: [recentMatchSchema], // Last 10 innings runs
    
    // Automatically computed for the Attribute Radar (0-100 scale)
    attributes: {
        batting: Number,
        fielding: Number, // Simulated or default
        running: Number,  // Simulated based on 1s/2s ratio
        temperament: Number, // Simulated based on average
        fitness: Number,
        leadership: Number
    },
    
    // Scoring Zones (Simulated wagon wheel percentages)
    scoringZones: {
        v: Number,
        cover: Number,
        midWicket: Number,
        square: Number
    },

    lastUpdated: { type: Date, default: Date.now }
});

// TTL Index for 24-hour caching
cricketPlayerStatSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('CricketPlayerStat', cricketPlayerStatSchema);
