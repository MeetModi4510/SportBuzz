import type { CricbuzzMatch, CricbuzzScorecard } from './cricketTypes';
import type { Match, Team, Venue, MatchStatus } from '@/data/types';

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
    'India': '🇮🇳',
    'Australia': '🇦🇺',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Pakistan': '🇵🇰',
    'New Zealand': '🇳🇿',
    'South Africa': '🇿🇦',
    'Sri Lanka': '🇱🇰',
    'Bangladesh': '🇧🇩',
    'West Indies': '🌴',
    'Afghanistan': '🇦🇫',
    'Zimbabwe': '🇿🇼',
    'Ireland': '🇮🇪',
    'Netherlands': '🇳🇱',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'UAE': '🇦🇪',
    'Nepal': '🇳🇵',
    'Oman': '🇴🇲',
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    // IPL Teams
    'Mumbai Indians': '🔵',
    'Chennai Super Kings': '💛',
    'Royal Challengers Bangalore': '🔴',
    'Kolkata Knight Riders': '💜',
    'Delhi Capitals': '🔷',
    'Punjab Kings': '❤️',
    'Rajasthan Royals': '💗',
    'Sunrisers Hyderabad': '🧡',
    'Gujarat Titans': '🩵',
    'Lucknow Super Giants': '💙',
};

// Team color mapping
const teamColors: Record<string, string> = {
    'India': '#0066B3',
    'Australia': '#FFD700',
    'England': '#CF142B',
    'Pakistan': '#01411C',
    'New Zealand': '#000000',
    'South Africa': '#007A4D',
    'Sri Lanka': '#0033A0',
    'Bangladesh': '#006A4E',
    'West Indies': '#7B3F00',
    'Afghanistan': '#000000',
};

/**
 * Get flag emoji for a team
 */
function getTeamFlag(teamName: string): string {
    // Check for exact match first
    if (countryFlags[teamName]) {
        return countryFlags[teamName];
    }
    // Check if team name contains a known country
    for (const [country, flag] of Object.entries(countryFlags)) {
        if (teamName.toLowerCase().includes(country.toLowerCase())) {
            return flag;
        }
    }
    return '🏏'; // Default cricket emoji
}

/**
 * Get color for a team
 */
function getTeamColor(teamName: string): string {
    if (teamColors[teamName]) {
        return teamColors[teamName];
    }
    for (const [country, color] of Object.entries(teamColors)) {
        if (teamName.toLowerCase().includes(country.toLowerCase())) {
            return color;
        }
    }
    return '#6366f1'; // Default indigo
}

/**
 * Convert Cricbuzz match state to app MatchStatus
 */
function getMatchStatus(state: string): MatchStatus {
    const lowerState = state.toLowerCase();
    if (lowerState === 'in progress' || lowerState === 'live' || lowerState.includes('innings break')) {
        return 'live';
    }
    if (lowerState === 'complete' || lowerState === 'result') {
        return 'completed';
    }
    return 'upcoming';
}

/**
 * Transform Cricbuzz team to app Team type
 */
function transformTeam(cricbuzzTeam: { teamId: number; teamName: string; teamSName: string }): Team {
    return {
        id: `cricket-${cricbuzzTeam.teamId}`,
        name: cricbuzzTeam.teamName,
        shortName: cricbuzzTeam.teamSName,
        logo: getTeamFlag(cricbuzzTeam.teamName),
        sport: 'cricket',
        primaryColor: getTeamColor(cricbuzzTeam.teamName),
    };
}

/**
 * Transform Cricbuzz venue to app Venue type
 */
function transformVenue(venueInfo: { id: number; ground: string; city: string }): Venue {
    return {
        id: `venue-${venueInfo.id}`,
        name: venueInfo.ground,
        city: venueInfo.city,
        country: '', // Not always available in API
        capacity: 0, // Not available in API
        sport: 'cricket',
    };
}

/**
 * Get match type display string
 */
function getMatchTypeDisplay(matchFormat: string, matchDesc: string): string {
    const format = matchFormat.toUpperCase();
    if (format === 'TEST') return 'Test Match';
    if (format === 'ODI') return 'ODI';
    if (format === 'T20') return matchDesc || 'T20';
    return matchDesc || matchFormat;
}

/**
 * Transform Cricbuzz match to app Match type
 */
export function transformCricbuzzMatch(cricbuzzMatch: CricbuzzMatch): Match {
    const status = getMatchStatus(cricbuzzMatch.state);

    return {
        id: `cricket-${cricbuzzMatch.matchId}`,
        sport: 'cricket',
        homeTeam: transformTeam(cricbuzzMatch.team1),
        awayTeam: transformTeam(cricbuzzMatch.team2),
        homeScore: '', // Will be updated from scorecard
        awayScore: '',
        status,
        venue: transformVenue(cricbuzzMatch.venueInfo),
        startTime: new Date(parseInt(cricbuzzMatch.startDate)),
        matchType: getMatchTypeDisplay(cricbuzzMatch.matchFormat, cricbuzzMatch.matchDesc),
        // Cricket-specific fields - will be populated from live data
        currentOver: undefined,
        targetScore: undefined,
        requiredRunRate: undefined,
    };
}

/**
 * Transform Cricbuzz scorecard to enhance Match with live data
 */
export function enhanceMatchWithScorecard(match: Match, scorecard: CricbuzzScorecard): Match {
    const enhanced = { ...match };

    // Update status from scorecard
    if (scorecard.matchHeader) {
        enhanced.status = getMatchStatus(scorecard.matchHeader.state);
    }

    // Get scores from innings
    if (scorecard.scoreCard && scorecard.scoreCard.length > 0) {
        const scores: Record<number, string> = {};

        for (const innings of scorecard.scoreCard) {
            const teamId = innings.batTeamDetails.batTeamId;
            const { runs, wickets, overs } = innings.scoreDetails;
            const score = innings.isCompleted
                ? `${runs}/${wickets}`
                : `${runs}/${wickets} (${overs})`;

            // Append to existing score for same team (e.g., Test match 2nd innings)
            scores[teamId] = scores[teamId]
                ? `${scores[teamId]} & ${score}`
                : score;
        }

        // Match scores to teams
        const team1Id = parseInt(match.homeTeam.id.replace('cricket-', ''));
        const team2Id = parseInt(match.awayTeam.id.replace('cricket-', ''));

        enhanced.homeScore = scores[team1Id] || '';
        enhanced.awayScore = scores[team2Id] || '';
    }

    // Get live miniscore data
    if (scorecard.miniscore) {
        const mini = scorecard.miniscore;
        enhanced.currentOver = mini.overs?.toString();

        if (mini.target) {
            enhanced.targetScore = mini.target.toString();
        }

        if (mini.requiredRunRate) {
            enhanced.requiredRunRate = mini.requiredRunRate.toFixed(2);
        }
    }

    return enhanced;
}

/**
 * Transform array of Cricbuzz matches
 */
export function transformCricbuzzMatches(cricbuzzMatches: CricbuzzMatch[]): Match[] {
    return cricbuzzMatches.map(transformCricbuzzMatch);
}
