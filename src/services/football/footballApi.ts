import { footballApiClient } from './apiClient';
import api from '../api';
import { cacheManager } from '../../utils/football/cacheManager';
import { FootballMatch, FootballTransferData } from '../../types/football';
import { MOCK_LIVE_MATCHES, MOCK_RECENT_MATCHES, MOCK_UPCOMING_MATCHES, MOCK_TRANSFERS } from './mockFootballData';

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
  10, // Friendlies
  15, // FIFA World Cup Qualifiers
  21, // Friendlies - Men
];

const isMensFootball = (match: FootballMatch) => {
  const leagueName = (match.league?.name || '').toLowerCase();
  const homeName = (match.teams?.home?.name || '').toLowerCase();
  const awayName = (match.teams?.away?.name || '').toLowerCase();
  
  // RegEx to check for U-17, U17, U 17, U18, U19, U20, U21, U23, etc.
  const youthRegex = /\bu[- ]?(17|18|19|20|21|23)\b/i;
  // RegEx to check for Women, (W), or ' W' at the end
  const womenRegex = /\bwomen\b|\(w\)| w$/i;

  if (youthRegex.test(leagueName) || womenRegex.test(leagueName)) return false;
  if (youthRegex.test(homeName) || womenRegex.test(homeName)) return false;
  if (youthRegex.test(awayName) || womenRegex.test(awayName)) return false;
  
  return true;
};

export const footballApi = {
  async getLiveMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'live_matches';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      // If we cached an empty array, bypass it so we don't get stuck with 0 live matches
      if (cached && cached.length > 0) return cached;
    }

    // Fetch live matches only for the priority leagues using the id-id-id format
    const liveParam = PRIORITY_LEAGUES.join('-');
    const response = await footballApiClient.get('/fixtures', {
      params: { live: liveParam }, 
    });

    let matches: FootballMatch[] = response.data.response || [];
    
    // Filter to only prioritize leagues requested and ensure it's men's football
    const priorityMatches = matches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id) && isMensFootball(m));
    
    // Sort by most advanced time
    priorityMatches.sort((a, b) => (b.fixture?.status?.elapsed || 0) - (a.fixture?.status?.elapsed || 0));

    const hasErrors = response.data.errors && !Array.isArray(response.data.errors) && Object.keys(response.data.errors).length > 0;

    if (hasErrors) {
      cacheManager.set(cacheKey, MOCK_LIVE_MATCHES as any, 1);
      return MOCK_LIVE_MATCHES as any;
    }

    cacheManager.set(cacheKey, priorityMatches, 1); // 1 minute cache for live
    return priorityMatches;
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

    const priorityMatches = allMatches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id) && isMensFootball(m));
    const recentPriority = priorityMatches.filter(m => ['FT', 'AET', 'PEN'].includes(m.fixture?.status?.short));
    
    // Fallback to mock data only if API returned nothing at all (e.g. suspended key)
    if (recentPriority.length === 0 && allMatches.length === 0) {
      cacheManager.set(cacheKey, MOCK_RECENT_MATCHES as any, 15);
      return MOCK_RECENT_MATCHES as any;
    }

    cacheManager.set(cacheKey, recentPriority, 15);
    return recentPriority;
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

    const priorityMatches = allMatches.filter(m => PRIORITY_LEAGUES.includes(m.league?.id) && isMensFootball(m));
    const upcomingPriority = priorityMatches.filter(m => !['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'].includes(m.fixture?.status?.short));
    
    if (upcomingPriority.length === 0 && allMatches.length === 0) {
      cacheManager.set(cacheKey, MOCK_UPCOMING_MATCHES as any, 15);
      return MOCK_UPCOMING_MATCHES as any;
    }

    cacheManager.set(cacheKey, upcomingPriority, 15);
    return upcomingPriority;
  },

  // Transfers endpoint is not available on free-tier API plans — always use curated mock data
  async getRecentTransfers(_forceRefresh = false): Promise<FootballTransferData[]> {
    return MOCK_TRANSFERS as any;
  },

  async getGlobalNews(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'global_news';
    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    try {
      // Use the new RapidAPI live-news endpoint
      const response: any = await api.get('/football/live-news');
      // Because api.ts response interceptor auto-unwraps response.data,
      // response is already { success: true, data: [...] }
      const rawNews = response?.data || [];
      
      // Map RapidAPI headline to title for the sidebar component
      const news = Array.isArray(rawNews) ? rawNews.map((item: any) => ({
        ...item,
        title: item.headLine || item.headline || 'Football News',
        summary: item.summary || 'Click to read full story on SportsBuzz Football.',
        source: item.source || 'RapidAPI',
        publishedAt: item.publishedAt || new Date().toISOString(),
      })) : [];
      
      cacheManager.set(cacheKey, news, 30); // Cache for 30 minutes
      return news;
    } catch (error) {
      console.error("Failed to fetch global football news", error);
      return [];
    }
  }
};
