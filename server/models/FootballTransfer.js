import mongoose from 'mongoose';

const footballTransferSchema = new mongoose.Schema({
    transferId:        { type: String, required: true, unique: true }, // playerId + transferDate
    playerId:          { type: String, required: true }, // Transfermarkt URL or Name
    playerName:        { type: String, required: true },
    playerImage:       { type: String }, // Transfermarkt Image URL
    position:          { type: String }, 
    fromClub:          { type: String },
    fromClubId:        { type: Number },
    fromClubLogo:      { type: String }, // Transfermarkt Club Logo
    toClub:            { type: String },
    toClubId:          { type: Number },
    toClubLogo:        { type: String }, // Transfermarkt Club Logo
    transferDate:      { type: Date, required: true },
    fee:               { type: String }, // localizedFeeText or feeText
    feeValue:          { type: Number }, // amountEuroEstimated or fee value
    transferType:      { type: String }, // localizationKey
    marketValue:       { type: Number },
    leagueId:          { type: String }, // Used to mark "Priority" or left empty
    onLoan:            { type: Boolean, default: false },
    contractExtension: { type: Boolean, default: false },
    cacheExpiry:       { type: Date, required: true },
    lastFetched:       { type: Date, default: Date.now },
}, { timestamps: true });

// We want fast queries when retrieving the latest transfers
footballTransferSchema.index({ transferDate: -1 });
footballTransferSchema.index({ feeValue: -1 });

// Auto-expire documents using MongoDB TTL
// We set expireAfterSeconds to 3600 (1 hour buffer) after cacheExpiry
footballTransferSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 3600 });

const FootballTransfer = mongoose.model('FootballTransfer', footballTransferSchema);

export default FootballTransfer;
