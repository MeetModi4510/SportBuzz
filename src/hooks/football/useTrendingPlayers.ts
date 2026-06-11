import { useQuery } from '@tanstack/react-query';
import { internalApiClient } from '../../services/football/apiClient';

export interface TrendingPlayerStats {
  goals: number;
  assists: number;
  passes: number;
  saves: number;
}

export interface TrendingPlayerData {
  _id: string;
  playerId: number;
  playerName: string;
  position: string | null;
  teamName: string | null;
  teamId?: number | null;
  teamFlag: string | null;
  imageUrl: string | null;
  rating: number | null;
  stats: TrendingPlayerStats;
  rawData: Record<string, unknown>;
  lastFetched: string;
}

interface TrendingPlayersResponse {
  success: boolean;
  fromCache: boolean;
  lastFetched: string | null;
  data: TrendingPlayerData[];
}

import { PRIORITY_CLUBS } from '../../services/football/footballApi';

const NATIONAL_TEAMS = [
  'argentina', 'france', 'england', 'belgium', 'brazil', 'netherlands', 'portugal', 'spain', 'italy', 'croatia',
  'uruguay', 'colombia', 'usa', 'united states', 'mexico', 'germany', 'senegal', 'japan', 'switzerland', 'morocco',
  'iran', 'denmark', 'korea republic', 'south korea', 'australia', 'ukraine', 'austria', 'sweden', 'poland', 'wales',
  'hungary', 'serbia', 'peru', 'ecuador', 'chile', 'turkey', 'scotland', 'nigeria', 'romania', 'costa rica',
  'cameroon', 'algeria', 'canada', 'egypt', 'norway', 'czech republic', 'slovakia', 'paraguay', 'venezuela', 'bolivia'
];

const fetchTrendingPlayers = async (): Promise<TrendingPlayersResponse> => {
  const response = await internalApiClient.get<TrendingPlayersResponse>('/trending-players');
  
  if (response.data?.data) {
    response.data.data = response.data.data.filter(p => {
      const teamName = (p.teamName || '').toLowerCase();
      
      const youthRegex = /\bu[- ]?(17|18|19|20|21|23)\b/i;
      const womenRegex = /\bwomen\b|\(w\)| w$/i;

      if (youthRegex.test(teamName) || womenRegex.test(teamName)) return false;

      // Check for exact word matches to prevent substring bugs (e.g. "como" in "locomotive")
      const matchesPriorityClub = PRIORITY_CLUBS.some(club => {
        const regex = new RegExp(`\\b${club}\\b`, 'i');
        return regex.test(teamName);
      });

      const matchesNationalTeam = NATIONAL_TEAMS.some(team => {
         const regex = new RegExp(`\\b${team}\\b`, 'i');
         return regex.test(teamName);
      });

      return matchesPriorityClub || matchesNationalTeam;
    });
  }
  
  return response.data;
};

export const useTrendingPlayers = () => {
  return useQuery({
    queryKey: ['football', 'trending-players'],
    queryFn: fetchTrendingPlayers,
    staleTime: 3 * 60 * 60 * 1000, // 3 hours to match backend cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });
};
