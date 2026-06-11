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

const fetchTrendingPlayers = async (): Promise<TrendingPlayersResponse> => {
  const response = await internalApiClient.get<TrendingPlayersResponse>('/trending-players');
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
