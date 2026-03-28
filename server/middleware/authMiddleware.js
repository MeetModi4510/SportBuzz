import User from '../models/User.js';
import { verifyToken, extractToken } from '../utils/tokenUtils.js';

/**
 * Middleware to protect routes - verifies JWT token
 */
export const protect = async (req, res, next) => {
    try {
        // Get token from header
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token is invalid.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token is invalid or expired.'
        });
    }
};

/**
 * Middleware to check if user is admin
 * (Temporarily granting access to all authenticated users for portfolio presentation)
 */
export const adminOnly = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }
};

/**
 * Middleware to check if user is a scorer
 * (Temporarily granting access to all authenticated users for portfolio presentation)
 */
export const scorerOnly = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }
};

/**
 * Middleware to allow both admin and scorer
 * (Temporarily granting access to all authenticated users for portfolio presentation)
 */
export const adminOrScorer = (req, res, next) => {
    if (req.user) {
        // Universal access for demo
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Please login first.'
        });
    }
};


/**
 * Optional auth - attaches user if token exists, but doesn't fail if not
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Token invalid, but continue without user
        next();
    }
};
