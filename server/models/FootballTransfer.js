import mongoose from 'mongoose';

const footballTransferSchema = new mongoose.Schema({
    playerId:     { type: Number, required: true },
    playerName:   { type: String, required: true },
    position:     { type: String }, // e.g., "LW", "CB", "GK"
    fromClub:     { type: String },
    fromClubId:   { type: Number },
    toClub:       { type: String },
    toClubId:     { type: Number },
    transferDate: { type: Date, required: true },
    feeText:      { type: String }, // e.g., "undisclosed", "free transfer", "loan"
    feeValue:     { type: Number }, // e.g., 8500000 (amountEuroEstimated)
    transferType: { type: String }, // e.g., "contract", "loan"
    marketValue:  { type: Number },
    cacheExpiry:  { type: Date, required: true },
    lastFetched:  { type: Date, default: Date.now },
}, { timestamps: true });

// We want fast queries when retrieving the latest transfers
footballTransferSchema.index({ transferDate: -1 });

// Auto-expire documents using MongoDB TTL (4 days = 96 hours)
// We set expireAfterSeconds to 3600 (1 hour buffer) after cacheExpiry
footballTransferSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

const FootballTransfer = mongoose.model('FootballTransfer', footballTransferSchema);

export default FootballTransfer;
