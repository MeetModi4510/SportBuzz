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

    if (priorityMatches.length === 0) {
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
    
    if (recentPriority.length === 0) {
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
    
    if (upcomingPriority.length === 0) {
      cacheManager.set(cacheKey, MOCK_UPCOMING_MATCHES as any, 15);
      return MOCK_UPCOMING_MATCHES as any;
    }

    cacheManager.set(cacheKey, upcomingPriority, 15);
    return upcomingPriority;
  },

  async getRecentTransfers(forceRefresh = false): Promise<FootballTransferData[]> {
    const cacheKey = 'recent_transfers';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballTransferData[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    const PRIORITY_TEAMS = [
      541, // Real Madrid
      529, // Barcelona
      50, // Man City
      42, // Arsenal
      40, // Liverpool
      33, // Man Utd
      157, // Bayern Munich
      85, // PSG
      496, // Juventus
      505, // Inter Milan
    ];

    let allTransfers: FootballTransferData[] = [];
    
    // We fetch them concurrently
    const promises = PRIORITY_TEAMS.map(teamId => 
      footballApiClient.get('/transfers', { params: { team: teamId } })
        .then(res => res.data.response || [])
        .catch(() => [])
    );

    const results = await Promise.all(promises);
    results.forEach(teamTransfers => {
      allTransfers = [...allTransfers, ...teamTransfers];
    });

    // Deduplicate by player ID since multiple teams might report the same transfer
    const uniqueTransfersMap = new Map<number, FootballTransferData>();
    allTransfers.forEach(t => {
      if (!uniqueTransfersMap.has(t.player.id)) {
        uniqueTransfersMap.set(t.player.id, t);
      }
    });

    let uniqueTransfers = Array.from(uniqueTransfersMap.values());

    // Sort by latest transfer date.
    uniqueTransfers.sort((a, b) => {
      const dateA = new Date(a.transfers[0]?.date || a.update || 0).getTime();
      const dateB = new Date(b.transfers[0]?.date || b.update || 0).getTime();
      return dateB - dateA; // Descending
    });

    if (uniqueTransfers.length === 0) {
      cacheManager.set(cacheKey, MOCK_TRANSFERS as any, 60);
      return MOCK_TRANSFERS as any;
    }

    cacheManager.set(cacheKey, uniqueTransfers, 60); // Cache for 1 hour
    return uniqueTransfers;
  },

  async getGlobalNews(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'global_news';
    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    try {
      const response = await api.get('/football/news');
      const news = response.data || [];
      cacheManager.set(cacheKey, news, 30); // Cache for 30 minutes
      return news;
    } catch (error) {
      console.error("Failed to fetch global football news", error);
      return [];
    }
  }
};
