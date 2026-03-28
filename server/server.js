import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';

import http from 'http';
import { Server } from 'socket.io';
import { initSocket } from './config/socket.js';

import { initializePassport } from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import cricketRoutes from './routes/cricketRoutes.js';
import footballRoutes from './routes/footballRoutes.js';
import featuredRoutes from './routes/featuredRoutes.js';
import stateMatchesRoutes from './routes/stateMatchesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Load environment variables FIRST before anything else
// Load env vars from parent directory
// Load env vars from parent directory
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Debug: Check if critical vars are loaded
console.log('GOOGLE_CLIENT_ID Loaded:', !!process.env.GOOGLE_CLIENT_ID);
console.log('MONGO_URI Loaded:', !!process.env.MONGO_URI);

// Initialize Express
const app = express();

// Force HTTPS protocol for all traffic originating from secure Ngrok domains
app.use((req, res, next) => {
    if (req.headers.host && req.headers.host.includes('ngrok')) {
        req.headers['x-forwarded-proto'] = 'https';
    }
    next();
});
app.set('trust proxy', 1);

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Call the connection function
connectDB();

// Initialize Passport strategies
initializePassport();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.19.33.75:5173',
    'http://localhost:3000',
    'http://localhost:3001'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.includes('10.19.33.75') || origin.includes('ngrok') || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'sportbuzz-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Serve static files from public folder
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log(`[SERVER] Serving static files from: ${publicPath}`);

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
console.log('[DEBUG] adminRoutes type:', typeof adminRoutes);
app.get('/api/admin-ping', (req, res) => res.json({ success: true, message: 'pong' }));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/cricket', cricketRoutes);

app.use('/api/football', footballRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stateMatches', stateMatchesRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auctions', auctionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'SportBuzz API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to SportBuzz API',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/signup': 'Register new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/me': 'Get current user (protected)',
                'POST /api/auth/logout': 'Logout user (protected)'
            },
            users: {
                'GET /api/users/profile': 'Get user profile (protected)',
                'PUT /api/users/profile': 'Update user profile (protected)',
                'GET /api/users/preferences': 'Get preferences (protected)',
                'PUT /api/users/preferences': 'Update preferences (protected)'
            },
            cricket: {
                'GET /api/cricket/matches': 'Get all matches (protected)',
                'GET /api/cricket/matches/live': 'Get live matches (protected)',
                'GET /api/cricket/matches/upcoming': 'Get upcoming matches (protected)',
                'GET /api/cricket/matches/recent': 'Get recent matches (protected)',
                'GET /api/cricket/matches/:id/scorecard': 'Get match scorecard (protected)'
            },
            football: {
                'GET /api/football/matches/:id/squads': 'Get match squads (protected)'
            },
            favorites: {
                'GET /api/favorites': 'Get all favorites (protected)',
                'POST /api/favorites': 'Add to favorites (protected)',
                'DELETE /api/favorites/:id': 'Remove from favorites (protected)'
            },
            leaderboard: {
                'GET /api/leaderboard': 'Get top 10 leaderboard (protected)',
                'GET /api/leaderboard/me': 'Get my stats (protected)'
            },
            activity: {
                'GET /api/activity': 'Get activity history (protected)',
                'GET /api/activity/achievements': 'Get achievements (protected)'
            }
        }
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║   🏏 SportBuzz API Server                                ║');
    console.log('║                                                          ║');
    console.log(`║   🚀 Running on: http://localhost:${PORT}                   ║`);
    console.log(`║   📡 Environment: ${process.env.NODE_ENV || 'development'}                       ║`);
    console.log('║                                                          ║');
    console.log('║   API Docs: http://localhost:' + PORT + '/api                    ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
});

export default app;
