import crypto from 'crypto';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';
import { generateToken } from '../utils/tokenUtils.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res) => {
    const { fullName, email, password, securityQuestion, securityAnswer } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    // Validate security question for local signup
    if (!securityQuestion || !securityAnswer) {
        res.status(400);
        throw new Error('Security question and answer are required');
    }

    // Create user
    const user = await User.create({
        fullName,
        email,
        password,
        securityQuestion,
        securityAnswer,
        stats: {
            totalPoints: 50, // Bonus for signing up
            level: 'Rookie'
        }
    });

    // Log activity
    await Activity.create({
        userId: user._id,
        type: 'signup',
        description: 'Account created successfully'
    });

    // Award first achievement
    try {
        await Achievement.create({
            userId: user._id,
            achievementId: 'first_login',
            title: 'Welcome Aboard',
            description: 'Logged in for the first time',
            icon: '👋',
            category: 'milestone',
            points: 50
        });
    } catch (e) {
        // Achievement may already exist
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                preferences: user.preferences,
                stats: user.stats,
                role: user.role
            },
            token
        }
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('This email is not registered');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        res.status(401);
        throw new Error('The password is incorrect');
    }

    // Log activity
    await Activity.create({
        userId: user._id,
        type: 'login',
        description: 'Logged in successfully'
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                location: user.location,
                favoriteTeam: user.favoriteTeam,
                bio: user.bio,
                preferences: user.preferences,
                stats: user.stats,
                role: user.role
            },
            token
        }
    });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                location: user.location,
                favoriteTeam: user.favoriteTeam,
                bio: user.bio,
                preferences: user.preferences,
                stats: user.stats,
                role: user.role,
                createdAt: user.createdAt
            }
        }
    });
});

/**
 * @desc    Logout user (client should remove token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    // In a more complex implementation, we could blacklist the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * @desc    Get security question for forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('This email is not registered');
    }

    // Check if user signed up with OAuth
    if (user.provider !== 'local') {
        res.status(400);
        throw new Error(`This account uses ${user.provider} login. Please sign in with ${user.provider}.`);
    }

    // Return the security question
    res.json({
        success: true,
        message: 'Security question retrieved',
        data: {
            email: user.email,
            securityQuestion: user.securityQuestion
        }
    });
});

/**
 * @desc    Verify security answer and reset password
 * @route   POST /api/auth/verify-security-answer
 * @access  Public
 */
export const verifySecurityAnswer = asyncHandler(async (req, res) => {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
        res.status(400);
        throw new Error('Please provide email, security answer, and new password');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    // Find user with security answer
    const user = await User.findOne({ email }).select('+securityAnswer');

    if (!user) {
        res.status(404);
        throw new Error('This email is not registered');
    }

    // Check if user signed up with OAuth
    if (user.provider !== 'local') {
        res.status(400);
        throw new Error(`This account uses ${user.provider} login. Please sign in with ${user.provider}.`);
    }

    // Verify security answer
    const isMatch = await user.compareSecurityAnswer(securityAnswer);

    if (!isMatch) {
        res.status(401);
        throw new Error('Security answer is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
    });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        res.status(400);
        throw new Error('Please provide a new password');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
    });
});
