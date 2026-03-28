
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
            return response.data;
        },
        enabled: !!matchId,
        staleTime: 0, // Disable caching for debugging
    });
}
