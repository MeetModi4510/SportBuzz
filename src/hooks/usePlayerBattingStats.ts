/**
 * usePlayerBattingStats — Custom Hook
 *
 * Fetches, caches, and transforms Cricbuzz player batting statistics
 * using TanStack Query (React Query).
 *
 * Features:
 * - Lazy loading: only fetches when a specific player profile is opened
 * - 15-minute stale time cache (cache key: player-batting-stats-{cricbuzzId})
 * - Automatic transformation from raw API → clean PlayerBattingStats
 * - Loading, error, and refetch states exposed to consumers
 * - Falls back gracefully when no Cricbuzz ID exists (non-cricket or unmapped players)
 */

import { useQuery } from '@tanstack/react-query';
import { getPlayerBattingStats } from '@/services/cricbuzzPlayerStats';
import { transformBattingStats, generateChartData } from '@/utils/playerStatsTransformer';
import { getCricbuzzPlayerId, getCricbuzzPlayerIdByName } from '@/data/cricbuzzPlayerIds';
import type { PlayerBattingStats, PlayerChartData } from '@/types/playerBattingTypes';

interface UsePlayerBattingStatsResult {
  /** Transformed batting stats grouped by format, or null while loading/on error */
  battingStats: PlayerBattingStats | null;
  /** Pre-computed chart data for all 6 visualizations */
  chartData: PlayerChartData | null;
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Whether the query encountered an error */
  isError: boolean;
  /** Error message if isError is true */
  errorMessage: string | null;
  /** Refetch function for retry UI */
  refetch: () => void;
  /** Whether the data is from cache (not a fresh request) */
  isFetched: boolean;
  /** The Cricbuzz player ID resolved for this player (null if no mapping) */
  cricbuzzId: number | null;
}

/**
 * Fetch and cache player batting stats by internal player ID.
 *
 * @param internalPlayerId - The SportBuzz internal player ID (e.g., "cr1" for Virat Kohli)
 *                           Pass null/undefined to disable the query.
 */
export function usePlayerBattingStats(
  internalPlayerId: string | null | undefined
): UsePlayerBattingStatsResult {
  const cricbuzzId = internalPlayerId
    ? getCricbuzzPlayerId(internalPlayerId)
    : null;

  const query = useQuery({
    queryKey: ['player-batting-stats', cricbuzzId],
    queryFn: () => getPlayerBattingStats(cricbuzzId!),
    enabled: !!cricbuzzId, // Only fetch if we have a valid Cricbuzz ID
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in garbage collection for 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const battingStats = query.data ? transformBattingStats(query.data) : null;
  const chartData = battingStats ? generateChartData(battingStats) : null;

  return {
    battingStats,
    chartData,
    isLoading: query.isLoading && query.fetchStatus !== 'idle',
    isError: query.isError,
    errorMessage: query.error?.message || null,
    refetch: query.refetch,
    isFetched: query.isFetched,
    cricbuzzId,
  };
}

/**
 * Fetch and cache player batting stats by player name.
 * Useful when the URL only provides the player name (slug).
 *
 * @param playerName - The player name or URL slug (e.g., "virat-kohli")
 */
export function usePlayerBattingStatsByName(
  playerName: string | null | undefined
): UsePlayerBattingStatsResult {
  const cricbuzzId = playerName
    ? getCricbuzzPlayerIdByName(playerName)
    : null;

  const query = useQuery({
    queryKey: ['player-batting-stats', cricbuzzId],
    queryFn: () => getPlayerBattingStats(cricbuzzId!),
    enabled: !!cricbuzzId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const battingStats = query.data ? transformBattingStats(query.data) : null;
  const chartData = battingStats ? generateChartData(battingStats) : null;

  return {
    battingStats,
    chartData,
    isLoading: query.isLoading && query.fetchStatus !== 'idle',
    isError: query.isError,
    errorMessage: query.error?.message || null,
    refetch: query.refetch,
    isFetched: query.isFetched,
    cricbuzzId,
  };
}
