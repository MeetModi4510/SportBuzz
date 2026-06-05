
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
 * Hook to fetch REAL football dashboard data (Live only) from Sofascore
 * Auto-refreshes every 15 minutes (900,000 ms)
 */
export function useFootballDashboard() {
    return useQuery({
        queryKey: ['football', 'dashboard'],
        queryFn: async () => {
            try {
                const response = await footballApi.getDashboard();
                return response as any; // Axios interceptor already unwraps response.data
            } catch (err) {
                console.error('[useFootballDashboard] Error:', err);
                return { live: [], meta: { error: 'Failed to fetch' } };
            }
        },
        staleTime: 900_000, // 15 minutes
        refetchInterval: 900_000, // Auto-refresh every 15 minutes
        refetchOnWindowFocus: false,
        retry: 2,
    });
}

/**
 * Hook to fetch Categorized football matches (Live, Upcoming, Completed)
 * Auto-refreshes every 15 minutes
 */
export function useCategorizedFootballMatches() {
    return useQuery({
        queryKey: ['football', 'categorized'],
        queryFn: async () => {
            try {
                const response = await footballApi.getCategorizedMatches();
                return response as any;
            } catch (err) {
                console.error('[useCategorizedFootballMatches] Error:', err);
                return { live: [], upcoming: [], completed: [], meta: { error: 'Failed to fetch' } };
            }
        },
        staleTime: 900_000, // 15 minutes
        refetchInterval: 900_000,
        refetchOnWindowFocus: false,
        retry: 2,
    });
}

/**
 * Hook to fetch a single football match detail by ID
 * Uses Sofascore aggregated endpoints.
 * Lazy loaded on click, cached for 2 mins if live, otherwise 15 mins.
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
        enabled: !!matchId && matchId.startsWith('football-'),
        staleTime: (query) => {
            const data = query.state?.data as any;
            return data?.status === 'live' ? 120_000 : 900_000;
        },
        refetchInterval: (query) => {
            const data = query.state?.data as any;
            return data?.status === 'live' ? 120_000 : false;
        },
        refetchOnWindowFocus: false,
        retry: 1,
    });
}
