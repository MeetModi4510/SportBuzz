import mongoose from 'mongoose';

const footballNewsSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballTournament',
        required: true
    },
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FootballMatch'
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['MatchReport', 'Milestone', 'TournamentUpdate', 'General'],
        default: 'General'
    },
    image: {
        type: String
    },
    generatingEvent: {
        type: String // e.g. 'FinalizeMatch', 'HatTrick'
    }
}, {
    timestamps: true
});

const FootballNews = mongoose.model('FootballNews', footballNewsSchema);

export default FootballNews;
