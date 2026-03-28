import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function () {
            // Password is only required if not using OAuth
            return !this.googleId && !this.discordId;
        },
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password in queries by default
    },
    // OAuth fields
    googleId: { type: String, unique: true, sparse: true },
    discordId: { type: String, unique: true, sparse: true },
    provider: {
        type: String,
        enum: ['local', 'google', 'discord'],
        required: true,
        default: 'local'
    },
    photoUrl: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    securityQuestion: {
        type: String,
        required: function () {
            return this.provider === 'local';
        }
    },
    securityAnswer: {
        type: String,
        required: function () {
            return this.provider === 'local';
        },
        select: false // Don't return answer in queries by default
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    favoriteTeam: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    battingStyle: {
        type: String,
        default: 'Right-hand Bat'
    },
    bowlingStyle: {
        type: String,
        default: 'None'
    },
    preferences: {
        darkMode: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        matchUpdates: { type: Boolean, default: true },
        playerNews: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true }
    },
    stats: {
        totalPoints: { type: Number, default: 0 },
        correctPredictions: { type: Number, default: 0 },
        totalPredictions: { type: Number, default: 0 },
        level: { type: String, default: 'Rookie' }
    },
    followedTournaments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }],
    role: {
        type: String,
        enum: ['user', 'admin', 'scorer'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Hash password and security answer before saving
userSchema.pre('save', async function (next) {
    // Hash password if modified
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Hash security answer if modified
    if (this.isModified('securityAnswer') && this.securityAnswer) {
        const salt = await bcrypt.genSalt(10);
        this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), salt);
    }

    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Compare security answer method
userSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
    return await bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer);
};

// Calculate user level based on points
userSchema.methods.calculateLevel = function () {
    const points = this.stats.totalPoints;
    if (points >= 10000) return 'Legend';
    if (points >= 5000) return 'Expert';
    if (points >= 2000) return 'Pro';
    if (points >= 500) return 'Intermediate';
    return 'Rookie';
};

const User = mongoose.model('User', userSchema);

export default User;
