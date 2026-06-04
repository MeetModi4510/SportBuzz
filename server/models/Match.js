import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    homeTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    awayTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    venue: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Live', 'Completed', 'Abandoned'],
        default: 'Upcoming'
    },
    matchType: {
        type: String,
        enum: ['League', 'Semi Final', 'Final'],
        default: 'League'
    },
    testDay: {
        type: Number,
        default: 1
    },
    testSession: {
        type: Number,
        default: 1
    },
    toss: {
        win: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        decision: { type: String, enum: ['Batting', 'Bowling'] }
    },
    currentInnings: {
        type: Number,
        default: 1
    },
    score: {
        team1: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        },
        team2: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        }
    },
    result: {
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        margin: { type: String },
        isTie: { type: Boolean, default: false },
        isNoResult: { type: Boolean, default: false }
    },
    impactPlayers: {
        team1: {
            playerOut: { type: String },
            playerIn: { type: String }
        },
        team2: {
            playerOut: { type: String },
            playerIn: { type: String }
        }
    },
    homeLineup: [String],
    awayLineup: [String]
}, {
    timestamps: true
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
