import { useQuery } from '@tanstack/react-query';
import { footballApi } from '../../services/football/footballApi';

// Reusable config to prevent automatic refetching as requested
const NO_AUTO_REFETCH = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
};

export const useLiveFootballMatches = () => {
  return useQuery({
    queryKey: ['football', 'live'],
    queryFn: () => footballApi.getLiveMatches(false),
    ...NO_AUTO_REFETCH,
    staleTime: 15 * 60 * 1000, // 15 mins
  });
};

export const useRecentFootballMatches = () => {
  return useQuery({
    queryKey: ['football', 'recent'],
    queryFn: () => footballApi.getRecentMatches(false),
    ...NO_AUTO_REFETCH,
    staleTime: 30 * 60 * 1000, // 30 mins
  });
};

export const useUpcomingFootballMatches = () => {
  return useQuery({
    queryKey: ['football', 'upcoming'],
    queryFn: () => footballApi.getUpcomingMatches(false),
    ...NO_AUTO_REFETCH,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
