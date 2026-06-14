import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

const STALE_30_MIN = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: 30 * 60 * 1000, // 30 mins
  gcTime:    30 * 60 * 1000,
};

// ─── Match List Hooks ──────────────────────────────────────────────────────────

export const useEspnLiveMatches = (enabled: boolean = true) => {
  return useQuery<any>({
    queryKey: ['espn', 'v3', 'live'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v3/matches/live`);
      return res.data;
    },
    ...STALE_30_MIN,
    enabled,
  });
};

export const useEspnUpcomingMatches = (enabled: boolean = false) => {
  return useQuery<any>({
    queryKey: ['espn', 'v3', 'upcoming'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v3/matches/upcoming`);
      return res.data;
    },
    ...STALE_30_MIN,
    enabled,
  });
};

export const useEspnRecentMatches = (enabled: boolean = false) => {
  return useQuery<any>({
    queryKey: ['espn', 'v3', 'recent'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/api/football/v3/matches/recent`);
      return res.data;
    },
    ...STALE_30_MIN,
    enabled,
  });
};

// ─── Match Detail Hook (ESPN single summary endpoint) ──────────────────────

export const useEspnMatchDetail = (
  matchId: string,
  enabled: boolean = false
) => {
  return useQuery<any>({
    queryKey: ['espn', 'v3', 'detail', matchId],
    queryFn: async () => {
      const res = await axios.get(
        `${API_BASE}/api/football/v3/matches/detail/${matchId}`
      );
      return res.data;
    },
    ...STALE_30_MIN,
    staleTime: 1 * 60 * 1000, // Reduce stale time to 1 min for live updates
    refetchInterval: 310 * 1000, // Auto-fetch every 310 seconds (slightly longer than backend cache)
    enabled: enabled && !!matchId,
  });
};
