import type {
    CricbuzzMatchesResponse,
    CricbuzzScorecard,
    CricbuzzMatch
} from './cricketTypes';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
};

const BASE_URL = `https://${RAPIDAPI_HOST}`;

/**
 * Fetch wrapper with error handling
 */
async function fetchCricbuzz<T>(endpoint: string): Promise<T> {
    if (!RAPIDAPI_KEY) {
        throw new Error('VITE_RAPIDAPI_KEY is not configured');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw new Error(`Cricbuzz API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get live cricket matches
 */
export async function getLiveCricketMatches(): Promise<CricbuzzMatch[]> {
    const data = await fetchCricbuzz<CricbuzzMatchesResponse>('/matches/v1/live');
    return extractMatches(data);
}

/**
 * Get upcoming cricket matches
 */
export async function getUpcomingCricketMatches(): Promise<CricbuzzMatch[]> {
    const data = await fetchCricbuzz<CricbuzzMatchesResponse>('/matches/v1/upcoming');
    return extractMatches(data);
}

/**
 * Get recent/completed cricket matches
 */
export async function getRecentCricketMatches(): Promise<CricbuzzMatch[]> {
    const data = await fetchCricbuzz<CricbuzzMatchesResponse>('/matches/v1/recent');
    return extractMatches(data);
}

/**
 * Get match scorecard/details
 */
export async function getCricketMatchScorecard(matchId: number): Promise<CricbuzzScorecard> {
    return fetchCricbuzz<CricbuzzScorecard>(`/mcenter/v1/${matchId}/hscard`);
}

/**
 * Get match mini scorecard (for live updates)
 */
export async function getCricketMatchMini(matchId: number): Promise<CricbuzzScorecard> {
    return fetchCricbuzz<CricbuzzScorecard>(`/mcenter/v1/${matchId}/scard`);
}

/**
 * Extract matches from the nested API response structure
 */
function extractMatches(data: CricbuzzMatchesResponse): CricbuzzMatch[] {
    const matches: CricbuzzMatch[] = [];

    if (!data.typeMatches) {
        return matches;
    }

    for (const typeMatch of data.typeMatches) {
        for (const seriesMatch of typeMatch.seriesMatches) {
            if (seriesMatch.seriesAdWrapper?.matches) {
                matches.push(...seriesMatch.seriesAdWrapper.matches);
            }
        }
    }

    return matches;
}
