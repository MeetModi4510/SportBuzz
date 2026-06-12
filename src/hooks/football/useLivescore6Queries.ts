import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

const NO_AUTO_REFETCH = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: 30 * 60 * 1000, // 30 mins
  gcTime: 30 * 60 * 1000,    // 30 mins
};

export interface LivescoreMatch {
  id: string;
  apiId: string;
  sport: string;
  matchType: string;
  category: string;
  leagueName: string;
  homeTeam: { id: string; name: string; logo: string | null };
  awayTeam: { id: string; name: string; logo: string | null };
  homeScore: string;
  awayScore: string;
  status: 'live' | 'upcoming' | 'completed';
  startTime: string;
  displayTime: string;
}

export interface LivescoreResponse {
  success: boolean;
  fromCache: boolean;
  data: LivescoreMatch[];
  lastFetched: string;
}

export const useLivescoreLiveMatches = (enabled: boolean = true) => {
  return useQuery<LivescoreResponse>({
    queryKey: ['football', 'v2', 'live'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v2/matches/live`);
      return res.data;
    },
    ...NO_AUTO_REFETCH,
    enabled,
  });
};

export const useLivescoreMatchesByDate = (dateYYYYMMDD: string, enabled: boolean = false) => {
  return useQuery<LivescoreResponse>({
    queryKey: ['football', 'v2', 'date', dateYYYYMMDD],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v2/matches/date/${dateYYYYMMDD}`);
      return res.data;
    },
    ...NO_AUTO_REFETCH,
    enabled,
  });
};

export const useLivescoreMatchDetail = (endpoint: string, matchId: string, enabled: boolean = false) => {
  return useQuery<any>({
    queryKey: ['football', 'v2', 'detail', matchId, endpoint],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v2/matches/detail/${endpoint}/${matchId}`);
      return res.data;
    },
    ...NO_AUTO_REFETCH,
    enabled,
  });
};
