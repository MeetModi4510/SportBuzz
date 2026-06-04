import mongoose from 'mongoose';

const tradeRequestSchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    fromTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    fromTeamName: String,
    toTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    toTeamName: String,
    fromPlayers: [{
        playerId: mongoose.Schema.Types.ObjectId,
        name: String,
        role: String
    }],
    toPlayers: [{
        playerId: mongoose.Schema.Types.ObjectId,
        name: String,
        role: String
    }],
    cash: {
        type: Number,
        default: 0 
    },
    tradeType: {
        type: String,
        enum: ['PlayerSwap', 'PlayerCash', 'CashOnly'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Approved', 'Cancelled'],
        default: 'Pending'
    },
    proposingCaptainEmail: String
}, {
    timestamps: true
});

const TradeRequest = mongoose.model('TradeRequest', tradeRequestSchema);

export default TradeRequest;
