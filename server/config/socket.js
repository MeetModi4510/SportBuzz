import { Server } from 'socket.io';
import { verifyToken } from '../utils/tokenUtils.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware (Optional for public access)
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            // Allow public access without token
            return next();
        }

        try {
            const decoded = verifyToken(token);
            socket.user = decoded;
            next();
        } catch (err) {
            // Only error if token is provided but invalid
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        console.log(`[SOCKET] User connected: ${socket.id} (User: ${userId})`);

        if (userId) {
            const roomName = userId.toString();
            socket.join(roomName);
            console.log(`[DEBUG] Socket ${socket.id} joined room: ${roomName}`);
        }

        socket.on('join_match', (matchId) => {
            socket.join(matchId);
            console.log(`[SOCKET] User ${socket.id} joined match: ${matchId}`);
        });

        socket.on('leave_match', (matchId) => {
            socket.leave(matchId);
            console.log(`[SOCKET] User ${socket.id} left match: ${matchId}`);
        });

        // Football Match Handlers
        socket.on('join_football_match', (matchId) => {
            socket.join(`football_match_${matchId}`);
            console.log(`[SOCKET] User ${socket.id} joined football match: ${matchId}`);
        });

        socket.on('leave_football_match', (matchId) => {
            socket.leave(`football_match_${matchId}`);
            console.log(`[SOCKET] User ${socket.id} left football match: ${matchId}`);
        });

        // Auction Handlers
        socket.on('join_auction', (auctionId) => {
            socket.join(`auction_${auctionId}`);
            console.log(`[SOCKET] User ${socket.id} joined auction: ${auctionId}`);
        });

        socket.on('leave_auction', (auctionId) => {
            socket.leave(`auction_${auctionId}`);
            console.log(`[SOCKET] User ${socket.id} left auction: ${auctionId}`);
        });

        socket.on('auction_bid', (data) => {
            const { auctionId, teamId, teamName, amount } = data;
            io.to(`auction_${auctionId}`).emit('bid_update', {
                teamId,
                teamName,
                amount,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitScoreUpdate = (matchId, data) => {
    if (io) {
        io.to(matchId).emit('score_updated', data);
        // Also emit to a general 'live_matches' room if needed
        io.emit('live_matches_update', { matchId, ...data });
    }
};
