
import { useQuery } from '@tanstack/react-query';
import { footballApi } from '@/services/api';

/**
 * Hook to fetch football match squads
 */
export function useFootballMatchSquads(matchId: string | undefined) {
    return useQuery({
        queryKey: ['football', 'match', matchId, 'squads'],
        queryFn: async () => {
            if (!matchId) return null;
            const response = await footballApi.getMatchSquads(matchId);
            return response; // Axios interceptor already unwraps response.data
        },
        enabled: !!matchId,
        staleTime: 0, // Disable caching for debugging
    });
}

/**
 * Hook to fetch REAL football dashboard data from Football-Data.org
 * Auto-refreshes every 12 minutes (720,000 ms)
 * Returns categorized matches: league, cup, international, all
 */
export function useFootballDashboard() {
    return useQuery({
        queryKey: ['football', 'dashboard'],
        queryFn: async () => {
            try {
                const response = await footballApi.getDashboard();
                return response; // Axios interceptor already unwraps response.data
            } catch (err) {
                console.error('[useFootballDashboard] Error:', err);
                return { league: [], cup: [], international: [], all: [], meta: { error: 'Failed to fetch' } };
            }
        },
        staleTime: 720_000, // 12 minutes — matches backend cache TTL
        refetchInterval: 720_000, // Auto-refresh every 12 minutes
        refetchOnWindowFocus: false,
        retry: 2,
    });
}

/**
 * Hook to fetch a single football match detail by ID
 * Uses the hybrid backend: AllSportsApi2 (live) + Football-Data.org (scheduled/completed)
 * Auto-refreshes every 2 minutes for live matches
 */
export function useFootballMatchDetail(matchId: string | undefined) {
    return useQuery({
        queryKey: ['football', 'match-detail', matchId],
        queryFn: async () => {
            if (!matchId) return null;
            try {
                const response = await footballApi.getMatchDetail(matchId);
                return (response as any)?.data || response;
            } catch (err) {
                console.error('[useFootballMatchDetail] Error:', err);
                return null;
            }
        },
        enabled: !!matchId && (matchId.startsWith('football-')),
        staleTime: 120_000, // 2 minutes
        refetchInterval: (query) => {
            // Auto-refresh every 2 minutes for live matches
            const data = query.state.data;
            return data?.status === 'live' ? 120_000 : false;
        },
        refetchOnWindowFocus: true,
        retry: 1,
    });
}
