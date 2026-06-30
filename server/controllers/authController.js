import crypto from 'crypto';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';
import { generateToken } from '../utils/tokenUtils.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendOtpEmail } from '../services/emailService.js';

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

        // Add points and update level
        user.stats.totalPoints += 50;
        user.stats.level = user.calculateLevel();
        await user.save();
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

    // Check if the user has a password (they might have signed up via OAuth)
    if (!user.password) {
        res.status(401);
        throw new Error(`This account was registered using ${user.provider || 'a third-party provider'}. Please sign in with that provider.`);
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

/**
 * @desc    Send password reset OTP via email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendPasswordOtp = asyncHandler(async (req, res) => {
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

    if (user.provider !== 'local') {
        res.status(400);
        throw new Error(`This account uses ${user.provider} login. Please sign in with ${user.provider}.`);
    }

    // Rate limiting (1 OTP per minute)
    // Instead of throwing an error, return a flag so the frontend can
    // always open the OTP screen and show a helpful countdown message.
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    if (user.passwordOtpLastSent && user.passwordOtpLastSent > oneMinAgo) {
        const msRemaining = 60 * 1000 - (Date.now() - new Date(user.passwordOtpLastSent).getTime());
        const secondsRemaining = Math.ceil(msRemaining / 1000);
        return res.status(200).json({
            success: true,
            rateLimitActive: true,
            secondsRemaining,
            message: `You requested an OTP recently. Please try again in ${secondsRemaining} seconds.`
        });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before saving to DB
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Save to user
    user.passwordOtp = hashedOtp;
    user.passwordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.passwordOtpUsed = false;
    user.passwordOtpLastSent = Date.now();

    await user.save();

    // Send email
    const emailSent = await sendOtpEmail(user.email, otp);

    if (!emailSent) {
        user.passwordOtp = undefined;
        user.passwordOtpExpires = undefined;
        await user.save();
        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }

    res.json({
        success: true,
        message: 'OTP sent successfully to your email.'
    });
});

/**
 * @desc    Verify OTP and generate reset token
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyPasswordOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Please provide email and OTP');
    }

    // Find user with unexpired OTP
    const user = await User.findOne({
        email,
        passwordOtpExpires: { $gt: Date.now() }
    }).select('+passwordOtp');

    if (!user) {
        res.status(400);
        throw new Error('OTP has expired or email is invalid');
    }

    if (user.passwordOtpUsed) {
        res.status(400);
        throw new Error('OTP has already been used');
    }

    // Verify OTP hash
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    
    if (user.passwordOtp !== hashedOtp) {
        res.status(401);
        throw new Error('Invalid OTP');
    }

    // Mark OTP as used
    user.passwordOtpUsed = true;
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token on user
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins to reset password
    
    await user.save();

    res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
            resetToken // Send back to client to use in the actual reset-password endpoint
        }
    });
});

/**
 * @desc    Resend password reset OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendPasswordOtp = asyncHandler(async (req, res) => {
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

    // Rate limiting check
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    if (user.passwordOtpLastSent && user.passwordOtpLastSent > oneMinAgo) {
        const msRemaining = 60 * 1000 - (Date.now() - new Date(user.passwordOtpLastSent).getTime());
        const secondsRemaining = Math.ceil(msRemaining / 1000);
        return res.status(200).json({
            success: true,
            rateLimitActive: true,
            secondsRemaining,
            message: `You requested an OTP recently. Please try again in ${secondsRemaining} seconds.`
        });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Update user
    user.passwordOtp = hashedOtp;
    user.passwordOtpExpires = Date.now() + 10 * 60 * 1000;
    user.passwordOtpUsed = false;
    user.passwordOtpLastSent = Date.now();

    await user.save();

    const emailSent = await sendOtpEmail(user.email, otp);

    if (!emailSent) {
        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }

    res.json({
        success: true,
        message: 'OTP resent successfully to your email.'
    });
});
