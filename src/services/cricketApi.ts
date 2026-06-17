import type {
    CricbuzzScorecard,
    CricbuzzMatch
} from './cricketTypes';

/**
 * Fetch wrapper to communicate with our custom Node.js Scraper backend
 */
async function fetchScraper<T>(endpoint: string): Promise<T> {
    const response = await fetch(`/api/cricket${endpoint}`);
    if (!response.ok) {
        throw new Error(`Scraper API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || data; // Backend wraps in { status: 'success', data }
}

/**
 * Get live cricket matches
 */
export async function getLiveCricketMatches(): Promise<CricbuzzMatch[]> {
    return fetchScraper<CricbuzzMatch[]>('/scraped/matches/live');
}

/**
 * Get upcoming cricket matches
 */
export async function getUpcomingCricketMatches(): Promise<CricbuzzMatch[]> {
    return fetchScraper<CricbuzzMatch[]>('/scraped/matches/upcoming');
}

/**
 * Get recent/completed cricket matches
 */
export async function getRecentCricketMatches(): Promise<CricbuzzMatch[]> {
    return fetchScraper<CricbuzzMatch[]>('/scraped/matches/recent');
}

/**
 * Get match deep detail dynamically
 * Supported types: summary, scorecard, info, commentary, overs, squads, highlights, graphs
 */
export async function getMatchDetailDynamic(matchId: number | string, endpointType: string): Promise<any> {
    return fetchScraper<any>(`/scraped/match/${matchId}/${endpointType}`);
}

/**
 * Legacy support for specific scorecard fetching
 */
export async function getCricketMatchScorecard(matchId: number): Promise<any> {
    return fetchScraper<any>(`/scraped/match/${matchId}/scorecard`);
}

/**
 * Legacy support for mini scorecard
 */
export async function getCricketMatchMini(matchId: number): Promise<any> {
    return fetchScraper<any>(`/scraped/match/${matchId}/summary`);
}

// ─── PERFORMANCE LAB (STEALTH BACKEND) ──────────────────────────

/**
 * Fetch a team's squad list (Lazy loaded, stealth scraped, cached 24h)
 */
export async function getPerformanceLabSquad(teamId: string = 'india-6') {
    const response = await fetch(`/api/cricket/teams/${teamId}/squad`);
    if (!response.ok) {
        throw new Error('Failed to fetch squad');
    }
    return response.json();
}

/**
 * Fetch a player's deep statistics (Lazy loaded, stealth scraped, cached 24h)
 */
export async function getPerformanceLabPlayerStats(espnId: string, name: string) {
    const response = await fetch(`/api/cricket/players/${espnId}/stats?name=${encodeURIComponent(name)}`);
    if (!response.ok) {
        throw new Error('Failed to fetch player stats');
    }
    return response.json();
}
