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
  9, // Copa America
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
    
    // Filter to only prioritize leagues requested
    matches = matches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id));
    
    // Cache live matches for 15 minutes to save API limits
    cacheManager.set(cacheKey, matches, 15);
    return matches;
  },

  async getRecentMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'recent_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    // Fetch last 3 days to guarantee we find *some* matches from priority leagues
    const dates = [0, 1, 2].map(daysAgo => {
      const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    let allMatches: FootballMatch[] = [];
    for (const dateStr of dates) {
      try {
        const response = await footballApiClient.get('/fixtures', {
          params: { date: dateStr, status: 'FT-AET-PEN' },
        });
        const matches: FootballMatch[] = response.data.response || [];
        allMatches = [...allMatches, ...matches];
      } catch (err) {
        console.error('Failed to fetch recent matches for', dateStr);
      }
    }

    const priorityMatches = allMatches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id));
    cacheManager.set(cacheKey, priorityMatches, 6 * 60); // Cache for 6 HOURS to save API limits
    return priorityMatches;
  },

  async getUpcomingMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'upcoming_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    // Fetch next 3 days to guarantee we find *some* scheduled matches
    const dates = [1, 2, 3].map(daysAhead => {
      const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    let allMatches: FootballMatch[] = [];
    for (const dateStr of dates) {
      try {
        const response = await footballApiClient.get('/fixtures', {
          params: { date: dateStr },
        });
        const matches: FootballMatch[] = response.data.response || [];
        allMatches = [...allMatches, ...matches];
      } catch (err) {
        console.error('Failed to fetch upcoming matches for', dateStr);
      }
    }

    const priorityMatches = allMatches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id));
    // Filter out matches that are live or finished
    const upcomingPriority = priorityMatches.filter(m => !['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'].includes(m.fixture?.status?.short));
    
    cacheManager.set(cacheKey, upcomingPriority, 6 * 60); // Cache for 6 HOURS to save API limits
    return upcomingPriority;
  }
};
