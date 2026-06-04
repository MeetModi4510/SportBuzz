import { useQueries } from '@tanstack/react-query';
import { getPlayerBattingStats } from '@/services/cricbuzzPlayerStats';
import { transformBattingStats } from '@/utils/playerStatsTransformer';
import { getCricbuzzPlayerId } from '@/data/cricbuzzPlayerIds';
import type { PlayerBattingStats } from '@/types/playerBattingTypes';

export interface TeamBattingStatsResult {
  battingStats: PlayerBattingStats | null;
  cricbuzzId: number | null;
  playerId: string;
}

export function useTeamBattingStats(playerIds: string[]) {
  const queries = useQueries({
    queries: playerIds.map((id) => {
      const cricbuzzId = getCricbuzzPlayerId(id);
      return {
        queryKey: ['player-batting-stats', cricbuzzId],
        queryFn: async () => {
          if (!cricbuzzId) return null;
          // Add a small artificial delay based on index to stagger requests and avoid 429
          // Note: in a real app, a queue would be better, but this is a simple mitigation
          const delay = Math.random() * 2000; 
          await new Promise(resolve => setTimeout(resolve, delay));
          return getPlayerBattingStats(cricbuzzId);
        },
        enabled: !!cricbuzzId,
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        meta: { playerId: id, cricbuzzId }
      };
    }),
  });

  const isLoading = queries.some((q) => q.isLoading && q.fetchStatus !== 'idle');
  
  const results = queries.map((q, i) => {
    const cricbuzzId = getCricbuzzPlayerId(playerIds[i]);
    const battingStats = q.data ? transformBattingStats(q.data) : null;
    return {
      playerId: playerIds[i],
      cricbuzzId,
      battingStats,
    };
  });

  return {
    results,
    isLoading
  };
}
