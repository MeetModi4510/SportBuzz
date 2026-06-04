
import footballService from '../services/footballApiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get match squads
 * @route   GET /api/football/matches/:id/squads
 * @access  Private
 */
export const getMatchSquads = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Extract numeric/string ID if needed (for now, direct pass)
    const matchId = id.startsWith('football-')
        ? id.replace('football-', '')
        : id;

    const squads = await footballService.getMatchSquads(matchId);

    res.json({
        success: true,
        data: squads
    });
});
