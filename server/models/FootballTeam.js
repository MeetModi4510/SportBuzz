import mongoose from 'mongoose';

const footballTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true
    },
    logo: String,
    acronym: {
        type: String,
        maxLength: 4,
        uppercase: true,
        trim: true
    },
    players: [{
        name: { type: String, required: true },
        number: { type: Number },
        role: { type: String, enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'], required: true },
        isCaptain: { type: Boolean, default: false }
    }],
    substitutes: [{
        name: { type: String, required: true },
        number: { type: Number },
        role: { type: String, enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'], required: true }
    }],
    stats: {
        played: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        goalsFor: { type: Number, default: 0 },
        goalsAgainst: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const FootballTeam = mongoose.model('FootballTeam', footballTeamSchema);

export default FootballTeam;
