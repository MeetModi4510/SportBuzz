import asyncHandler from 'express-async-handler';
import Auction from '../models/Auction.js';

// @desc    Get auction analytics
// @route   GET /api/auctions/:id/analytics
// @access  Protected
export const getAuctionAnalytics = asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
        res.status(404);
        throw new Error('Auction not found');
    }

    const soldPlayers = auction.playerPool.filter(p => p.status === 'Sold').sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0));
    
    // Calculate global budget utilized
    const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    const globalMetrics = {
        totalSpent,
        mostExpensive: soldPlayers[0] || null,
        cheapestHighValue: soldPlayers.filter(p => (p.rating || 0) > 85).sort((a, b) => (a.soldPrice || 0) - (b.soldPrice || 0))[0] || null,
        totalSold: soldPlayers.length,
        averagePrice: soldPlayers.length > 0 ? totalSpent / soldPlayers.length : 0
    };

    const teamMetrics = auction.teams.map(team => {
        const teamPlayers = soldPlayers.filter(p => p.soldTo && p.soldTo.toString() === team._id.toString());
        const totalValue = teamPlayers.reduce((sum, p) => sum + (p.rating || 75), 0);
        const spent = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

        return {
            _id: team._id,
            name: team.name,
            totalSpent: spent,
            budgetRemaining: team.budgetRemaining,
            playerCount: team.players.length,
            efficiency: spent > 0 ? (totalValue / (spent / 1000000)).toFixed(2) : 0,
            squadRoles: team.players.reduce((acc, p) => {
                acc[p.role] = (acc[p.role] || 0) + 1;
                return acc;
            }, {})
        };
    });

    res.json({ success: true, data: { globalMetrics, teamMetrics } });
});
