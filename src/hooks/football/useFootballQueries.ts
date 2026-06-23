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
    staleTime: 15 * 60 * 1000, // 15 mins to preserve API limits
  });
};

export const useRecentFootballMatches = () => {
  return useQuery({
    queryKey: ['football', 'recent'],
    queryFn: () => footballApi.getRecentMatches(false),
    ...NO_AUTO_REFETCH,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

export const useUpcomingFootballMatches = () => {
  return useQuery({
    queryKey: ['football', 'upcoming'],
    queryFn: () => footballApi.getUpcomingMatches(false),
    ...NO_AUTO_REFETCH,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

export const useRecentTransfers = () => {
  return useQuery({
    queryKey: ['football', 'transfers', 'v2'],
    queryFn: () => footballApi.getRecentTransfers(true),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: 1,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours — match server cache TTL
  });
};

export const useFootballNews = () => {
  return useQuery({
    queryKey: ['football', 'news'],
    queryFn: () => footballApi.getGlobalNews(false),
    ...NO_AUTO_REFETCH,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useFootballNewsDetail = (url: string | null) => {
  return useQuery({
    queryKey: ['football', 'newsDetail_v2', url],
    queryFn: () => url ? footballApi.getNewsArticle(url) : Promise.resolve([]),
    enabled: !!url,
    ...NO_AUTO_REFETCH,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
