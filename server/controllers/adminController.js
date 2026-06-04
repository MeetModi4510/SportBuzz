import User from '../models/User.js';
import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Auction from '../models/Auction.js';


/**
 * Get platform-wide statistics
 */
export const getStats = async (req, res) => {
    try {
        console.log('[ADMIN] Fetching platform stats...');
        const [totalUsers, totalMatches, totalTournaments, activeMatches] = await Promise.all([
            User.countDocuments(),
            Match.countDocuments(),
            Tournament.countDocuments(),
            Match.countDocuments({ status: 'Live' })
        ]);

        console.log(`[ADMIN] Stats: Users=${totalUsers}, Matches=${totalMatches}, Tournaments=${totalTournaments}, Active=${activeMatches}`);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalMatches,
                totalTournaments,
                activeMatches
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

/**
 * Get all users with pagination
 */
export const getUsers = async (req, res) => {
    try {
        console.log('[ADMIN] Fetching users list...');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password -securityAnswer')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();
        console.log(`[ADMIN] Found ${users.length} users, total: ${total}`);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin', 'scorer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -securityAnswer');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role'
        });
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

/**
 * Get all players from all teams (de-duplicated)
 */
export const getPlayers = async (req, res) => {
    try {
        console.log('[ADMIN] Fetching all players...');
        const teams = await Team.find().lean();
        
        const playerMap = new Map();

        teams.forEach(team => {
            if (team.players && Array.isArray(team.players)) {
                team.players.forEach(p => {
                    let name = '';
                    let role = 'Batsman';
                    let photo = '';
                    let battingStyle = 'Right-hand Bat';
                    let bowlingStyle = 'None';

                    if (typeof p === 'string') {
                        name = p.trim();
                    } else if (typeof p === 'object' && p !== null) {
                        name = (p.name || '').trim();
                        role = p.role || 'Batsman';
                        photo = p.photo || '';
                        battingStyle = p.battingStyle || 'Right-hand Bat';
                        bowlingStyle = p.bowlingStyle || 'None';
                    }

                    if (name) {
                        const key = name.toLowerCase();
                        if (!playerMap.has(key)) {
                            playerMap.set(key, {
                                name,
                                role,
                                photo,
                                battingStyle,
                                bowlingStyle,
                                teams: [{ _id: team._id, name: team.name, color: team.color }]
                            });
                        } else {
                            // Player already exists, add this team to its team list if not already there
                            const existing = playerMap.get(key);
                            if (!existing.teams.some(t => t._id.toString() === team._id.toString())) {
                                existing.teams.push({ _id: team._id, name: team.name, color: team.color });
                            }
                        }
                    }
                });
            }
        });

        const players = Array.from(playerMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            success: true,
            data: players
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching players',
            error: error.message
        });
    }
};

/**
 * Delete a player profile platform-wide
 */
export const deletePlayer = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Player name is required' });
        }

        console.log(`[ADMIN] Deleting player: ${name}...`);

        // 1. Remove from all Teams
        // We look for teams that have this player in their 'players' array
        // Since players can be strings or objects, we use $pull with a condition
        await Team.updateMany(
            {},
            { 
                $pull: { 
                    players: { 
                        $oneOf: [
                            name,
                            { name: name } 
                        ] 
                    } 
                } 
            }
        );

        // Alternatively, if the array can contain mixed types, $pull might be tricky with objects.
        // Let's use a more robust way: fetch teams and update them if they contain the player.
        const teamsWithPlayer = await Team.find({
            $or: [
                { players: name },
                { 'players.name': name }
            ]
        });

        for (const team of teamsWithPlayer) {
            team.players = team.players.filter(p => {
                if (typeof p === 'string') return p !== name;
                if (typeof p === 'object' && p !== null) return p.name !== name;
                return true;
            });
            await team.save();
        }

        // 2. Remove from Auction player pools
        const auctionsWithPlayer = await Auction.find({
            'playerPool.name': name
        });

        for (const auction of auctionsWithPlayer) {
            auction.playerPool = auction.playerPool.filter(p => p.name !== name);
            // Also check if they are in any team within the auction
            auction.teams.forEach(t => {
                t.players = t.players.filter(p => p.name !== name);
            });
            await auction.save();
        }

        res.json({
            success: true,
            message: `Player '${name}' deleted successfully from all teams and auctions`
        });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting player',
            error: error.message
        });
    }
};
