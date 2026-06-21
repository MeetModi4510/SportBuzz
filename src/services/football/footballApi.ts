import { footballApiClient, transfersApiClient, internalApiClient } from './apiClient';
import api from '../api';
import { cacheManager } from '../../utils/football/cacheManager';
import { FootballMatch } from '../../types/football';
import { NewTransferData } from '../../types/football/transfers';

export interface TransfersResponse {
  data: NewTransferData[];
  lastFetched: string | null;
}

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
  // Premier League (First Division Only)
  'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'liverpool', 'man city', 'manchester city', 'man united', 'manchester united', 'newcastle', 'nottm forest', 'nottingham forest', 'tottenham', 'spurs', 'west ham', 'wolves', 'leicester', 'southampton',
  // La Liga (First Division Only)
  'athletic club', 'atletico madrid', 'barcelona', 'real madrid', 'real sociedad', 'sevilla', 'valencia', 'villarreal', 'girona', 'betis', 'alaves', 'celta vigo', 'getafe', 'las palmas', 'mallorca', 'osasuna', 'rayo vallecano', 'valladolid', 'leganes', 'espanyol',
  // Serie A (First Division Only)
  'ac milan', 'inter', 'inter milan', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'bologna', 'torino', 'verona', 'genoa', 'lecce', 'udinese', 'empoli', 'cagliari', 'monza', 'como', 'parma', 'venezia',
  // Bundesliga (First Division Only)
  'bayern munich', 'bayern', 'dortmund', 'bayer leverkusen', 'leverkusen', 'rb leipzig', 'leipzig', 'eintracht frankfurt', 'stuttgart', 'freiburg', 'hoffenheim', 'werder bremen', 'wolfsburg', 'augsburg', 'mönchengladbach', 'monchengladbach', 'bochum', 'union berlin', 'mainz', 'st pauli', 'holstein kiel', 'heidenheim',
  // Ligue 1 (First Division Only)
  'psg', 'paris saint-germain', 'monaco', 'marseille', 'lyon', 'lille', 'lens', 'rennes', 'nice', 'reims', 'toulouse', 'strasbourg', 'montpellier', 'nantes', 'le havre', 'auxerre', 'angers', 'st etienne', 'brest',
  // MLS
  'inter miami', 'lafc', 'la galaxy', 'columbus crew', 'cincinnati', 'philadelphia union', 'seattle sounders', 'atlanta united', 'new york city fc', 'nycfc', 'new york red bulls', 'orlando city', 'nashville', 'portland timbers', 'portland hearts of pine', 'portland', 'houston dynamo', 'houston', 'real salt lake', 'sporting kansas city', 'dallas', 'austin', 'san jose earthquakes', 'toronto fc', 'montreal', 'vancouver whitecaps', 'chicago fire', 'colorado rapids', 'dc united', 'minnesota united', 'new england revolution', 'st. louis city', 'charlotte fc', 'san diego',
  // Saudi Pro
  'al nassr', 'al hilal', 'al ittihad', 'al ahli', 'al shabab', 'al taawoun', 'al ettifaq', 'al fateh', 'al wehda', 'al fayha', 'al riyadh', 'damac', 'al okhdood', 'al qadsiah', 'al kholood',
  // Eredivisie
  'ajax', 'psv', 'feyenoord', 'az alkmaar', 'twente', 'sparta rotterdam', 'utrecht', 'heerenveen', 'nec nijmegen', 'go ahead eagles', 'pec zwolle', 'almere city', 'heracles', 'rkc waalwijk', 'fortuna sittard', 'nac breda', 'willem ii', 'groningen',
  // Belgian Pro League
  'club brugge', 'anderlecht', 'union sg', 'antwerp', 'genk', 'gent', 'standard liege', 'mechelen', 'cercle brugge', 'charleroi', 'st truiden', 'westerlo', 'oh leuven', 'kortrijk', 'dender', 'beerschot',
  // ISL
  'mohun bagan', 'mumbai city', 'fc goa', 'odisha', 'kerala blasters', 'chennaiyin', 'northeast united', 'punjab fc', 'east bengal', 'bengaluru fc', 'jamshedpur', 'hyderabad', 'mohammedan'
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
  
  // Exclude MLS Next Pro matches
  if (leagueName.includes('mls next pro')) return false;
  if (homeName.includes(' ii ') || awayName.includes(' ii ') || homeName.endsWith(' ii') || awayName.endsWith(' ii')) return false;
  if (homeName.includes(' 2') || awayName.includes(' 2') || homeName.endsWith(' 2') || awayName.endsWith(' 2')) return false;
  
  return true;
};

export const footballApi = {
  async getLiveMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'live_matches_v2';
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
    const cacheKey = 'recent_matches_v2';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    // Free plan only allows Yesterday, Today, and Tomorrow.
    // Fetch last 2 days (Today = 0, Yesterday = 1)
    const dates = [0, 1].map(daysAgo => {
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
    
    // Fallback to mock data if there are no priority matches to display (keeps UI looking good)
    if (recentPriority.length === 0) {
      cacheManager.set(cacheKey, MOCK_RECENT_MATCHES as any, 15);
      return MOCK_RECENT_MATCHES as any;
    }

    cacheManager.set(cacheKey, recentPriority, 15);
    return recentPriority;
  },

  async getUpcomingMatches(forceRefresh = false): Promise<FootballMatch[]> {
    const cacheKey = 'upcoming_matches_v2';
    if (!forceRefresh) {
      const cached = cacheManager.get<FootballMatch[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    // Free plan only allows Yesterday, Today, and Tomorrow.
    // Fetch next 1 day (Tomorrow = 1)
    const dates = [1].map(daysAhead => {
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
    
    // Fallback to mock data if there are no upcoming priority matches to display
    if (upcomingPriority.length === 0) {
      cacheManager.set(cacheKey, MOCK_UPCOMING_MATCHES as any, 15);
      return MOCK_UPCOMING_MATCHES as any;
    }

    cacheManager.set(cacheKey, upcomingPriority, 15);
    return upcomingPriority;
  },

  async getRecentTransfers(forceRefresh = false): Promise<TransfersResponse> {
    const cacheKey = 'recent_transfers_v4';

    if (!forceRefresh) {
      const cached = cacheManager.get<TransfersResponse>(cacheKey);
      if (cached && cached.data?.length > 0) return cached;
    }

    try {
      // Use our internal backend endpoint which caches transfers in MongoDB
      const response = await internalApiClient.get('/transfers');
      
      const rawTransfers = response.data?.data || [];
      const lastFetched = response.data?.lastFetched || null;

      // Map our new MongoDB FootballTransfer schema to the frontend interface (NewTransferData)
      const allTransfers: NewTransferData[] = rawTransfers.map((t: any) => {
        return {
          name: t.playerName,
          playerId: t.playerId,
          position: t.position ? { label: t.position, key: t.position.toLowerCase() } : null,
          transferDate: t.transferDate,
          fromClub: t.fromClub,
          fromClubFullName: t.fromClub,
          fromClubId: t.fromClubId || 0,
          toClub: t.toClub,
          toClubFullName: t.toClub,
          toClubId: t.toClubId || 0,
          fee: {
            feeText: t.fee,
            value: t.feeValue
          },
          transferType: {
            text: t.transferType
          },
          contractExtension: t.contractExtension,
          onLoan: t.onLoan,
          fromDate: t.transferDate,
          toDate: null,
          marketValue: t.marketValue
        };
      });

      const result: TransfersResponse = {
        data: allTransfers,
        lastFetched
      };

      cacheManager.set(cacheKey, result, 15);
      return result;

    } catch (error) {
      console.error('Failed to fetch transfers', error);
      return { data: [], lastFetched: null };
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
  },

  async getPlayerRecentMatches(playerName: string): Promise<any[]> {
    try {
      const response: any = await api.get(`/football/v3/player-recent-matches/${encodeURIComponent(playerName)}`);
      return response?.data || [];
    } catch (error) {
      console.error(`Failed to fetch recent matches for player: ${playerName}`, error);
      return [];
    }
  }
};
