import mongoose from 'mongoose';

const auctionTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    captainEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    accessCode: {
        type: String, // Secure code generated for this team
        default: () => Math.random().toString(36).substring(2, 10).toUpperCase()
    },
    budgetRemaining: {
        type: Number,
        required: true
    },
    players: [{
        name: String,
        role: String,
        price: Number,
        category: String
    }],
    logo: String
});

const auctionPlayerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Unsold'],
        default: 'Available'
    },
    category: {
        type: String,
        required: true
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction.teams'
    },
    soldPrice: {
        type: Number
    },
    rating: {
        type: Number,
        default: 75
    },
    bidHistory: [{
        teamId: mongoose.Schema.Types.ObjectId,
        teamName: String,
        amount: Number,
        timestamp: { type: Date, default: Date.now }
    }]
});

const auctionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Auction name is required'],
        trim: true
    },
    budgetPerTeam: {
        type: Number,
        required: true,
        default: 50000000 // 50M default
    },
    currency: {
        type: String,
        enum: ['USD', 'INR', 'GBP', 'EUR'],
        default: 'USD'
    },
    minPlayersPerTeam: {
        type: Number,
        required: true,
        default: 11
    },
    maxPlayersPerTeam: {
        type: Number,
        default: 18
    },
    status: {
        type: String,
        enum: ['Setup', 'Live', 'Completed'],
        default: 'Setup'
    },
    teams: [auctionTeamSchema],
    playerPool: [auctionPlayerSchema],
    currentPlayer: {
        player: { type: mongoose.Schema.Types.ObjectId }, // Reference to player in playerPool
        name: String,
        role: String,
        basePrice: Number,
        category: String,
        startTime: Date
    },
    currentBid: {
        amount: { type: Number, default: 0 },
        teamId: { type: mongoose.Schema.Types.ObjectId },
        teamName: String
    },
    activeCategory: {
        type: String,
        default: null
    },
    bidHistory: [{
        teamId: mongoose.Schema.Types.ObjectId,
        teamName: String,
        amount: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    isUnsoldRound: {
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tradeDeadline: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction;
