/**
 * usePlayerBowlingStats — Custom Hook
 *
 * Fetches, caches, and transforms Cricbuzz player bowling statistics
 * using TanStack Query (React Query).
 *
 * Features:
 * - Lazy loading: only fetches when a specific player profile is opened
 * - 15-minute stale time cache (cache key: player-bowling-stats-{cricbuzzId})
 * - Automatic transformation from raw API → clean PlayerBowlingStats
 * - Loading, error, and refetch states exposed to consumers
 * - Falls back gracefully when no Cricbuzz ID exists (non-cricket or unmapped players)
 */

import { useQuery } from '@tanstack/react-query';
import { getPlayerBowlingStats } from '@/services/cricbuzzPlayerBowlingStats';
import {
  transformBowlingStats,
  generateBowlingChartData,
  generateBowlingDerivedStats,
} from '@/utils/playerBowlingStatsTransformer';
import { getCricbuzzPlayerId, getCricbuzzPlayerIdByName } from '@/data/cricbuzzPlayerIds';
import type {
  PlayerBowlingStats,
  BowlingChartData,
  DerivedBowlingStats,
  BowlingFormatKey,
} from '@/types/playerBowlingTypes';

interface UsePlayerBowlingStatsResult {
  /** Transformed bowling stats grouped by format, or null while loading/on error */
  bowlingStats: PlayerBowlingStats | null;
  /** Pre-computed chart data for all 7 bowling visualizations */
  chartData: BowlingChartData | null;
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
 * Fetch and cache player bowling stats by internal player ID.
 *
 * @param internalPlayerId - The SportBuzz internal player ID (e.g., "bumrah" for Jasprit Bumrah)
 *                           Pass null/undefined to disable the query.
 */
export function usePlayerBowlingStats(
  internalPlayerId: string | null | undefined
): UsePlayerBowlingStatsResult {
  const cricbuzzId = internalPlayerId
    ? getCricbuzzPlayerId(internalPlayerId)
    : null;

  const query = useQuery({
    queryKey: ['player-bowling-stats', cricbuzzId],
    queryFn: () => getPlayerBowlingStats(cricbuzzId!),
    enabled: !!cricbuzzId, // Only fetch if we have a valid Cricbuzz ID
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in garbage collection for 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const bowlingStats = query.data ? transformBowlingStats(query.data) : null;
  const chartData = bowlingStats ? generateBowlingChartData(bowlingStats) : null;

  return {
    bowlingStats,
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
 * Fetch and cache player bowling stats by player name.
 * Useful when the URL only provides the player name (slug).
 *
 * @param playerName - The player name or URL slug (e.g., "jasprit-bumrah")
 */
export function usePlayerBowlingStatsByName(
  playerName: string | null | undefined
): UsePlayerBowlingStatsResult {
  const cricbuzzId = playerName
    ? getCricbuzzPlayerIdByName(playerName)
    : null;

  const query = useQuery({
    queryKey: ['player-bowling-stats', cricbuzzId],
    queryFn: () => getPlayerBowlingStats(cricbuzzId!),
    enabled: !!cricbuzzId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const bowlingStats = query.data ? transformBowlingStats(query.data) : null;
  const chartData = bowlingStats ? generateBowlingChartData(bowlingStats) : null;

  return {
    bowlingStats,
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
 * Helper: get derived stats for a specific format from bowling stats.
 * Call this in components to get computed analytics for the active format tab.
 */
export function useBowlingDerivedStats(
  bowlingStats: PlayerBowlingStats | null,
  formatKey: BowlingFormatKey
): DerivedBowlingStats | null {
  if (!bowlingStats) return null;
  const format = bowlingStats[formatKey];
  if (!format) return null;
  return generateBowlingDerivedStats(format);
}
