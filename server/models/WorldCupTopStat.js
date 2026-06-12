import mongoose from 'mongoose';

const worldCupTopStatSchema = new mongoose.Schema({
    competition:  { type: String, required: true }, // e.g., 'world-cup-2026'
    statType:     { type: Number, required: true }, // 1=Goals, 3=Assists, 10=Team Goals, etc
    entityType:   { type: String, required: true, enum: ['player', 'team'] },
    data:         { type: mongoose.Schema.Types.Mixed, required: true }, // Array of formatted rows
    lastFetched:  { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure uniqueness per competition + statType
worldCupTopStatSchema.index({ competition: 1, statType: 1 }, { unique: true });

const WorldCupTopStat = mongoose.model('WorldCupTopStat', worldCupTopStatSchema);
export default WorldCupTopStat;
