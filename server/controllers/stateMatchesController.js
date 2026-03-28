import { cricketService } from '../services/cricketApiService.js';
import { getStateFlag, isStateTeam } from '../services/stateFlagService.js';

/**
 * Controller for State-Level Cricket Matches (Ranji Trophy, etc.)
 * Returns exactly 2 matches: 1 live (or fallback) + 1 completed
 */

/**
 * Format a single match for the API response
 * @param {Object} match - Raw match from CricketData API
 * @returns {Object} - Formatted match with team flags
 */
const formatStateMatch = (match) => {
    if (!match) return null;

    const team1Name = match.teams?.[0] || match.teamInfo?.[0]?.name || 'Team 1';
    const team2Name = match.teams?.[1] || match.teamInfo?.[1]?.name || 'Team 2';

    // Build score string from innings data
    let scoreString = '';
    if (match.score && Array.isArray(match.score) && match.score.length > 0) {
        scoreString = match.score.map((inn, idx) => {
            const teamAbbr = idx === 0 ? team1Name.substring(0, 3).toUpperCase() : team2Name.substring(0, 3).toUpperCase();
            return `${teamAbbr} ${inn.r}/${inn.w} (${inn.o})`;
        }).join(' & ');
    }

    // Determine status
    let status = 'Upcoming';
    if (match.matchStarted) {
        status = match.matchEnded ? 'Completed' : 'Live';
    }

    return {
        id: match.id,
        name: match.name || `${team1Name} vs ${team2Name}`,
        teams: [
            { name: team1Name, flag: getStateFlag(team1Name) },
            { name: team2Name, flag: getStateFlag(team2Name) }
        ],
        status: status,
        score: scoreString || 'No score available',
        venue: match.venue || 'Unknown Venue',
        date: match.dateTimeGMT || match.date,
        matchType: match.matchType || 'Ranji Trophy',
        seriesName: match.series || '',
    };
};

/**
 * Filter matches to only include state-level domestic matches
 * @param {Array} matches - All cricket matches
 * @returns {Array} - Only state-level matches
 */
const filterStateMatches = (matches) => {
    if (!Array.isArray(matches)) return [];

    return matches.filter(match => {
        const team1 = match.teams?.[0] || match.teamInfo?.[0]?.name || '';
        const team2 = match.teams?.[1] || match.teamInfo?.[1]?.name || '';

        // Include if EITHER team is a state team (domestic match)
        return isStateTeam(team1) || isStateTeam(team2);
    });
};

/**
 * GET /api/stateMatches
 * Returns state-level cricket matches with appropriate flags
 */
export const getStateMatches = async (req, res) => {
    try {
        // Fetch current matches from CricketData API
        const cricketData = await cricketService.getCurrentMatches().catch(err => {
            console.error("Error fetching cricket matches:", err.message);
            return { data: [] };
        });

        const allMatches = cricketData.data || [];

        // Filter to only state-level matches
        const stateMatches = filterStateMatches(allMatches);

        // Separate into live and completed
        const liveMatches = stateMatches.filter(m => m.matchStarted && !m.matchEnded);
        const completedMatches = stateMatches
            .filter(m => m.matchEnded)
            .sort((a, b) => new Date(b.dateTimeGMT || b.date) - new Date(a.dateTimeGMT || a.date));

        // Select featured matches
        let liveMatch = null;
        let completedMatch = null;

        if (liveMatches.length > 0) {
            // Case 1: Has live match -> 1 Live + 1 Recent Completed
            liveMatch = formatStateMatch(liveMatches[0]);
            completedMatch = completedMatches.length > 0 ? formatStateMatch(completedMatches[0]) : null;
        } else if (completedMatches.length > 0) {
            // Case 2: No live match -> 2 Most Recent Completed
            liveMatch = formatStateMatch(completedMatches[0]); // "liveMatch" slot used for most recent
            completedMatch = completedMatches.length > 1 ? formatStateMatch(completedMatches[1]) : null;
        }

        res.json({
            success: true,
            data: {
                liveMatch,
                completedMatch,
                totalStateMatches: stateMatches.length,
                hasLiveMatch: liveMatches.length > 0,
            }
        });

    } catch (error) {
        console.error("Error in getStateMatches:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch state matches",
            error: error.message
        });
    }
};

export default {
    getStateMatches
};
