import mongoose from 'mongoose';

const footballTournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tournament name is required'],
        trim: true
    },
    format: {
        type: String,
        enum: ['League', 'Knockout', 'Group+Knockout'],
        default: 'League',
        required: true
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTeam'
    }],
    pointsRule: {
        win: { type: Number, default: 3 },
        draw: { type: Number, default: 1 },
        loss: { type: Number, default: 0 }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Live', 'Completed'],
        default: 'Upcoming'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTeam'
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    suspensions: [{
        player: String,
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballMatch' },
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

const FootballTournament = mongoose.model('FootballTournament', footballTournamentSchema);

export default FootballTournament;
