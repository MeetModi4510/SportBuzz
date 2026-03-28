import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Player name is required'],
        trim: true,
        unique: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'],
        default: 'Batsman'
    },
    battingStyle: {
        type: String,
        default: 'Right-hand Bat'
    },
    bowlingStyle: {
        type: String,
        default: 'None'
    },
    photo: {
        type: String
    },
    country: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Case-insensitive search optimization
playerSchema.index({ name: 'text' });

const Player = mongoose.model('Player', playerSchema);

export default Player;
