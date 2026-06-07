import { footballApiClient, transfersApiClient } from './apiClient';
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

// Top clubs for filtering transfers since FotMob doesn't provide League IDs
export const PRIORITY_CLUBS = [
  // Premier League
  'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'liverpool', 'luton', 'man city', 'manchester city', 'man united', 'manchester united', 'newcastle', 'nottm forest', 'nottingham forest', 'sheff utd', 'sheffield united', 'tottenham', 'spurs', 'west ham', 'wolves',
  // La Liga
  'athletic club', 'atletico madrid', 'barcelona', 'real madrid', 'real sociedad', 'sevilla', 'valencia', 'villarreal', 'girona', 'betis',
  // Serie A
  'ac milan', 'inter', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'bologna',
  // Bundesliga
  'bayern munich', 'dortmund', 'bayer leverkusen', 'rb leipzig', 'eintracht frankfurt', 'stuttgart',
  // Ligue 1
  'psg', 'paris saint-germain', 'monaco', 'marseille', 'lyon', 'lille', 'lens',
  // Others
  'al nassr', 'al hilal', 'al ittihad', 'al ahli',
  'inter miami', 'lafc', 'la galaxy',
  'ajax', 'psv', 'feyenoord',
  'porto', 'benfica', 'sporting cp', 'sporting lisbon',
  'celtic', 'rangers', 'galatasaray', 'fenerbahce', 'besiktas'
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

  async getRecentTransfers(forceRefresh = false): Promise<FootballTransferData[]> {
    const cacheKey = 'recent_transfers_v3';
    const CACHE_TTL_MINUTES = 24 * 60; // 24 hours

    if (!forceRefresh) {
      const cached = cacheManager.get<FootballTransferData[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    try {
      // Use the dedicated FotMob API endpoint for transfers
      const response = await transfersApiClient.get('/api/v1/transfers');
      
      const rawTransfers = response.data?.transfers || [];

      // Map FotMob response to our FootballTransferData interface
      const allTransfers: FootballTransferData[] = rawTransfers.map((t: any) => {
        // Price formatting
        let priceStr = t.fee?.feeText || t.transferType?.text || 'Transfer';
        if (t.fee?.value && t.fee.value > 0) {
          const valueInM = (t.fee.value / 1000000).toFixed(1);
          priceStr = `€${valueInM}M`;
        } else if (t.fee?.localizedFeeText === 'on_loan' || t.transferType?.text === 'on loan') {
          priceStr = 'LOAN';
        } else if (t.fee?.localizedFeeText === 'free_transfer' || t.transferType?.text === 'free') {
          priceStr = 'FREE';
        }

        return {
          player: {
            id: t.playerId,
            name: t.name,
            photo: t.playerId ? `https://images.fotmob.com/image_resources/playerimages/${t.playerId}.png` : undefined
          },
          update: t.transferDate,
          transfers: [
            {
              date: t.transferDate,
              type: t.transferType?.text || t.fee?.feeText || 'Transfer',
              price: priceStr,
              teams: {
                out: {
                  id: t.fromClubId,
                  name: t.fromClub || t.fromClubFullName || 'Unknown',
                  logo: t.fromClubId > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${t.fromClubId}.png` : 'https://images.fotmob.com/image_resources/logo/teamlogo/default.png'
                },
                in: {
                  id: t.toClubId,
                  name: t.toClub || t.toClubFullName || 'Unknown',
                  logo: t.toClubId > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${t.toClubId}.png` : 'https://images.fotmob.com/image_resources/logo/teamlogo/default.png'
                }
              }
            }
          ]
        };
      });

      // Filter using the PRIORITY_CLUBS list since FotMob lacks league info
      const priorityTransfers = allTransfers.filter(t => {
        const outName = t.transfers[0].teams.out.name.toLowerCase();
        const inName = t.transfers[0].teams.in.name.toLowerCase();
        
        return PRIORITY_CLUBS.some(club => outName.includes(club) || inName.includes(club));
      });

      // Show transfers from the last 30 days
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      
      const recentPriorityTransfers = priorityTransfers.filter(t => {
        if (!t.transfers || t.transfers.length === 0) return false;
        const transferDate = new Date(t.transfers[0].date);
        return transferDate >= pastDate;
      });

      if (recentPriorityTransfers.length > 0) {
        cacheManager.set(cacheKey, recentPriorityTransfers, CACHE_TTL_MINUTES);
        return recentPriorityTransfers;
      }
      
      // Fallback if empty (e.g., no transfers in the last week)
      return MOCK_TRANSFERS as any;

    } catch (err) {
      console.error('Failed to fetch transfers', err);
      // Ensure we don't crash the app if the rapidapi limit is reached
      return MOCK_TRANSFERS as any;
    }
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
      
      // Map FotMob response for the sidebar component
      const news = Array.isArray(rawNews) ? rawNews.map((item: any) => ({
        ...item,
        title: item.title || item.headLine || item.headline || 'Football News',
        summary: item.summary || 'Click to read full story on SportsBuzz Football.',
        source: item.sourceStr || item.source || 'FotMob',
        publishedAt: item.gmtTime || item.publishedAt || new Date().toISOString(),
      })) : [];
      
      cacheManager.set(cacheKey, news, 60); // Cache for 60 minutes
      return news;
    } catch (error) {
      console.error("Failed to fetch global football news", error);
      return [];
    }
  }
};
