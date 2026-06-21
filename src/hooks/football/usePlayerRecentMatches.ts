import { useQuery } from '@tanstack/react-query';
import { footballApi } from '../../services/football/footballApi';

export function usePlayerRecentMatches(playerName: string | undefined) {
    return useQuery({
        queryKey: ['playerRecentMatches', playerName],
        queryFn: () => footballApi.getPlayerRecentMatches(playerName!),
        enabled: !!playerName, // Only fetch when a player name is provided (e.g. card is open)
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1
    });
}
