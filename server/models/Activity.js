import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['login', 'signup', 'prediction', 'favorite_add', 'favorite_remove', 'profile_update', 'achievement', 'match_view']
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for efficient querying by user
activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
