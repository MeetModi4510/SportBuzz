import { useQuery, useQueries } from '@tanstack/react-query';
import { getPerformanceLabSquad, getPerformanceLabPlayerStats } from '../services/cricketApi';

export function usePerformanceLabSquad(teamId: string) {
    return useQuery({
        queryKey: ['performanceLabSquad', teamId],
        queryFn: () => getPerformanceLabSquad(teamId),
        staleTime: 5 * 60 * 1000, // 5 minutes caching in React Query
        refetchOnWindowFocus: false,
    });
}

export function usePerformanceLabSquads(teamIds: string[]) {
    return useQueries({
        queries: teamIds.map((teamId) => ({
            queryKey: ['performanceLabSquad', teamId],
            queryFn: () => getPerformanceLabSquad(teamId),
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        }))
    });
}

export function usePerformanceLabPlayerStats(espnId: string | null, playerName: string) {
    return useQuery({
        queryKey: ['performanceLabPlayer', espnId],
        queryFn: () => getPerformanceLabPlayerStats(espnId!, playerName),
        enabled: !!espnId, // Lazy loading: Only fetch when espnId is provided (e.g. user clicks)
        staleTime: 0, // Force refetch immediately so new data is shown
        gcTime: 0, // Do not keep old cache
        refetchOnWindowFocus: true,
    });
}

export function useCricketTeamAnalytics(teamId: string, format: string, isTriggered: boolean) {
    return useQuery({
        queryKey: ['cricketTeamAnalytics', teamId, format],
        queryFn: async () => {
            const response = await fetch(`/api/cricket/team-analysis/${teamId}?format=${format}`);
            const json = await response.json();
            if (json.status !== 'success') throw new Error(json.message);
            return json.data;
        },
        enabled: isTriggered, // Lazy loading trigger
        staleTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
