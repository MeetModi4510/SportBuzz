import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tournament name is required'],
        trim: true
    },
    visibility: {
        type: String,
        enum: ['Public', 'Private'],
        default: 'Public'
    },
    passcode: {
        type: String
    },
    locationName: {
        type: String,
        trim: true
    },
    locationCoordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    format: {
        type: String,
        enum: ['League', 'Knockout'],
        default: 'League',
        required: true
    },
    matchType: {
        type: String,
        enum: ['T10', 'T20', 'ODI', 'Test', 'Custom'],
        default: 'T20'
    },
    overs: {
        type: Number,
        default: 20
    },
    testDays: {
        type: Number,
        default: 5
    },
    oversPerSession: {
        type: Number,
        default: 30
    },
    groupStructure: {
        type: String,
        enum: ['None', 'Same Group', 'Cross Group'],
        default: 'None'
    },
    groupsCount: {
        type: Number,
        default: 1
    },
    groups: [{
        name: { type: String, required: true },
        teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
    }],
    pointsRule: {
        win: { type: Number, default: 2 },
        tie: { type: Number, default: 1 }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    status: {
        type: String,
        enum: ['Upcoming', 'Live', 'Completed'],
        default: 'Upcoming'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    knockedOutTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

tournamentSchema.index({ locationCoordinates: '2dsphere' });

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
