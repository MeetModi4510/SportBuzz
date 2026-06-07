import { footballApiClient } from './apiClient';
import { cacheManager } from '../../utils/football/cacheManager';
import { FootballMatch } from '../../types/football';

// Priority League IDs as requested
export const PRIORITY_LEAGUES = [
  39, // Premier League
  140, // La Liga
  61, // Ligue 1
  78, // Bundesliga
  135, // Serie A
  253, // MLS
  307, // Saudi Pro League
  144, // Belgian Pro League
  88, // Eredivisie
  323, // ISL
  1, // World Cup
  4, // Euro
  2, // Champions League
  3, // Europa League
  848, // Conference League
];

export const footballApi = {
  async getLiveMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'live_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      // If we cached an empty array, bypass it so we don't get stuck with 0 live matches
      if (cached && cached.length > 0) return cached;
    }

    // Only fetch matches for priority leagues to save payload size if possible, or fetch all live and filter
    const response = await footballApiClient.get('/fixtures', {
      params: { live: 'all' }, // Fetching all live matches might be more efficient than multiple requests
    });

    let matches: FootballMatch[] = response.data.response || [];
    
    // Cache live matches for only 1 minute to stay real-time
    cacheManager.set(cacheKey, matches, 1);
    return matches;
  },

  async getRecentMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'recent_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached) return cached;
    }

    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = today.toISOString().split('T')[0];
    const dateFrom = lastWeek.toISOString().split('T')[0];

    // Due to API limits, we might not want to fetch EVERYTHING. 
    // We will fetch for a specific top league to limit requests if needed, or just today's past matches.
    const response = await footballApiClient.get('/fixtures', {
      params: { date: dateTo, status: 'FT-AET-PEN' },
    });

    let matches: FootballMatch[] = response.data.response || [];
    cacheManager.set(cacheKey, matches, 30); // Cache 30 mins
    return matches;
  },

  async getUpcomingMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'upcoming_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached) return cached;
    }

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateString = tomorrow.toISOString().split('T')[0];

    const response = await footballApiClient.get('/fixtures', {
      params: { date: dateString },
    });

    let matches: FootballMatch[] = response.data.response || [];
    cacheManager.set(cacheKey, matches, 60); // Cache 1 hour
    return matches;
  }
};
