import express from 'express';
import { body, validationResult } from 'express-validator';
import { signup, login, getMe, logout, forgotPassword, resetPassword, verifySecurityAnswer } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Validation rules
const signupValidation = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Validation middleware
const validate = (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// Routes
router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-security-answer', verifySecurityAnswer);
router.post('/reset-password/:token', resetPassword);

// OAuth Routes - Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed', session: false }),
    (req, res) => {
        const token = generateToken(req.user);
        const userData = {
            id: req.user._id,
            email: req.user.email,
            fullName: req.user.fullName,
            photoUrl: req.user.photoUrl,
        };
        res.redirect(`/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    }
);

// OAuth Routes - Discord
router.get('/discord', passport.authenticate('discord', { scope: ['identify', 'email'] }));

router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login?error=oauth_failed', session: false }),
    (req, res) => {
        const token = generateToken(req.user);
        const userData = {
            id: req.user._id,
            email: req.user.email,
            fullName: req.user.fullName,
            photoUrl: req.user.photoUrl,
        };
        res.redirect(`/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    }
);

export default router;
