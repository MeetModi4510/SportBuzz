import mongoose from 'mongoose';

const ballSchema = new mongoose.Schema({
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    inning: {
        type: Number,
        required: true
    },
    over: {
        type: Number,
        required: true
    },
    ball: {
        type: Number,
        required: true
    },
    batsman: {
        type: String, // Name of the batsman
        required: true
    },
    bowler: {
        type: String, // Name of the bowler
        required: true
    },
    nonStriker: {
        type: String
    },
    runs: {
        type: Number,
        default: 0
    },
    extraType: {
        type: String,
        enum: ['wide', 'noball', 'bye', 'legbye', 'none'],
        default: 'none'
    },
    extraRuns: {
        type: Number,
        default: 0
    },
    wicket: {
        isWicket: { type: Boolean, default: false },
        type: { type: String, enum: ['caught', 'caught and bowled', 'bowled', 'lbw', 'runout', 'stumped', 'hitwicket', 'others'] },
        playerOut: { type: String },
        fielder: { type: String }
    },
    totalBallRuns: {
        type: Number,
        required: true
    },
    isDroppedCatch: {
        type: Boolean,
        default: false
    },
    droppedFielder: {
        type: String
    },
    shotDirection: {
        type: String,
        enum: ['cover', 'mid-off', 'mid-on', 'midwicket', 'square-leg', 'fine-leg', 'third-man', 'point', 'straight', null],
        default: null
    },
    isCommentaryOnly: {
        type: Boolean,
        default: false
    },
    commentaryMessage: {
        type: String
    },
    insightType: {
        type: String,
        enum: ['Matchup', 'Trend', 'Milestone', 'Pressure', 'EndOver', 'Momentum', 'Efficiency', 'None'],
        default: 'None'
    },
    insightMetadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

const Ball = mongoose.model('Ball', ballSchema);

export default Ball;
