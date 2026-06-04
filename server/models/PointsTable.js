import mongoose from 'mongoose';

const pointsTableSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    noResult: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    nrr: { type: Number, default: 0 },
    runsScored: { type: Number, default: 0 },
    oversFaced: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    oversBowled: { type: Number, default: 0 }
}, {
    timestamps: true
});

const PointsTable = mongoose.model('PointsTable', pointsTableSchema);

export default PointsTable;
