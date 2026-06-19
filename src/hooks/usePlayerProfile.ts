import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '@/services/api';

export const usePlayerProfile = (playerId: string | null) => {
    return useQuery({
        queryKey: ['playerProfile', 'v2', playerId],
        queryFn: async () => {
            if (!playerId) return null;
            const response = await cricketApi.getPlayerProfile(playerId);
            if (response?.status === 'success') {
                return response.data;
            }
            throw new Error(response?.message || 'Failed to fetch player profile');
        },
        enabled: !!playerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
