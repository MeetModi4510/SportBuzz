import mongoose from 'mongoose';

const footballMatchSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTournament'
    },
    homeTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTeam',
        required: true
    },
    awayTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTeam',
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Live', 'Completed', 'Paused'],
        default: 'Scheduled'
    },
    score: {
        home: { type: Number, default: 0 },
        away: { type: Number, default: 0 }
    },
    events: [{
        type: { type: String, enum: ['Goal', 'YellowCard', 'RedCard', 'Substitution', 'Penalty', 'Save', 'ShotOnTarget', 'ShotOffTarget', 'Corner', 'Foul', 'Offside'], required: true },
        minute: { type: Number, required: true },
        half: { type: Number, default: 1 },
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' },
        player: { type: String }, // Player name or ID
        playerOut: { type: String }, // For substitutions
        assister: { type: String }, // For goals
        goalType: { type: String, enum: ['OpenPlay', 'Penalty', 'FreeKick', 'Assisted'] },
        details: { type: String }, // For penalty result etc.
        commentary: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    stats: {
        possession: {
            home: { type: Number, default: 50 },
            away: { type: Number, default: 50 }
        },
        shotsOnTarget: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        shotsOffTarget: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        fouls: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        corners: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        offsides: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        yellowCards: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        },
        redCards: {
            home: { type: Number, default: 0 },
            away: { type: Number, default: 0 }
        }
    },
    timer: {
        currentMinute: { type: Number, default: 0 },
        isRunning: { type: Boolean, default: false },
        startTime: { type: Date },
        injuryTime: { type: Number, default: 0 },
        extraTime: { type: Boolean, default: false },
        half: { type: Number, default: 1 },
        halfStatus: { type: String, enum: ['FirstHalf', 'HalfTime', 'SecondHalf', 'FullTime'], default: 'FirstHalf' }
    },
    penaltyShootout: {
        enabled: { type: Boolean, default: false },
        homePenalties: [{ status: { type: String, enum: ['Goal', 'Miss'] } }],
        awayPenalties: [{ status: { type: String, enum: ['Goal', 'Miss'] } }],
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' }
    },
    lineups: {
        home: {
            startingXI: [{ type: String }],
            substitutes: [{ type: String }],
            substitutionCount: { type: Number, default: 0 },
            formation: { type: String, default: '4-4-2' }
        },
        away: {
            startingXI: [{ type: String }],
            substitutes: [{ type: String }],
            substitutionCount: { type: Number, default: 0 },
            formation: { type: String, default: '4-4-2' }
        }
    },
    venue: String,
    matchDate: { type: Date, required: true },
    performance: {
        winProbability: {
            home: { type: Number, default: 45 },
            away: { type: Number, default: 30 },
            draw: { type: Number, default: 25 }
        },
        momentumHistory: [{
            minute: Number,
            value: Number,
            home: Number,
            away: Number
        }],
        pressureIndex: { type: Number, default: 5.0 },
        labAnalysis: {
            intensityPressing: { type: Number, default: 40 },
            counterAttackRisk: { type: Number, default: 30 },
            attackThirdControl: {
                team: { type: String, default: 'None' },
                percentage: { type: Number, default: 50 }
            },
            expectedGoals: {
                home: { type: Number, default: 0.0 },
                away: { type: Number, default: 0.0 }
            },
            intensityPulse: [{
                minute: Number,
                value: Number
            }],
            possessionPhases: {
                buildup: { type: Number, default: 33 },
                attack: { type: Number, default: 33 },
                defense: { type: Number, default: 34 }
            },
            directnessIndex: {
                home: { type: Number, default: 0 },
                away: { type: Number, default: 0 }
            },
            defensiveLineHeight: {
                home: { type: Number, default: 50 },
                away: { type: Number, default: 50 }
            },
            finalThirdEntries: {
                home: { type: Number, default: 0 },
                away: { type: Number, default: 0 }
            },
            highTurnovers: {
                home: { type: Number, default: 0 },
                away: { type: Number, default: 0 }
            }
        },
        topPerformers: [{
            name: { type: String },
            score: { type: Number, default: 0 },
            team: { type: String } // 'H' or 'A'
        }]
    }
}, {
    timestamps: true
});

const FootballMatch = mongoose.model('FootballMatch', footballMatchSchema);

export default FootballMatch;
