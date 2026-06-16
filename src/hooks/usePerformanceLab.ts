import { useQuery } from '@tanstack/react-query';
import { getPerformanceLabSquad, getPerformanceLabPlayerStats } from '../services/cricketApi';

export function usePerformanceLabSquad(teamId: string) {
    return useQuery({
        queryKey: ['performanceLabSquad', teamId],
        queryFn: () => getPerformanceLabSquad(teamId),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours caching in React Query
        refetchOnWindowFocus: false,
    });
}

export function usePerformanceLabPlayerStats(espnId: string | null, playerName: string) {
    return useQuery({
        queryKey: ['performanceLabPlayer', espnId],
        queryFn: () => getPerformanceLabPlayerStats(espnId!, playerName),
        enabled: !!espnId, // Lazy loading: Only fetch when espnId is provided (e.g. user clicks)
        staleTime: 24 * 60 * 60 * 1000, // 24 hours caching
        refetchOnWindowFocus: false,
    });
}
