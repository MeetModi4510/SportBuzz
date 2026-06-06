import { useState, useEffect, useMemo } from 'react';
import { useMatchFieldData } from './useMatchFieldData';
import { Player } from '@/data/types';
import { Match } from '@/data/types';

export function useTrendingPerformers(liveMatches: Match[]) {
  // Find the first live match (prefer Test, then ODI, then T20)
  const topLiveMatch = useMemo(() => {
    if (!liveMatches || liveMatches.length === 0) return null;
    return liveMatches.find(m => m.matchType?.toLowerCase() === 'test') ||
           liveMatches.find(m => m.matchType?.toLowerCase() === 'odi') ||
           liveMatches[0];
  }, [liveMatches]);

  const matchId = topLiveMatch?.id;

  const { data: scorecard, loading, error } = useMatchFieldData(
    matchId,
    'cbScorecard',
    !!matchId
  );

  const trendingPlayers = useMemo(() => {
    if (!scorecard || !scorecard.innings || scorecard.innings.length === 0) return [];

    const playerMap = new Map<string, Player>();

    scorecard.innings.forEach((inn: any) => {
      // Process Batsmen
      inn.batsmen?.forEach((b: any) => {
        if (!b.name) return;
        const runs = Number(b.runs) || 0;
        const fours = Number(b.fours) || 0;
        const sixes = Number(b.sixes) || 0;
        const points = runs + (fours * 1) + (sixes * 2);

        if (playerMap.has(b.name)) {
          const p = playerMap.get(b.name)!;
          p.stats.runs = (p.stats.runs || 0) + runs;
          p.stats.fours = (p.stats.fours || 0) + fours;
          p.stats.sixes = (p.stats.sixes || 0) + sixes;
          p.rating += points;
        } else {
          playerMap.set(b.name, {
            id: `p-${b.name.replace(/\s+/g, '-')}`,
            name: b.name,
            teamId: inn.teamShortName,
            sport: 'cricket',
            position: 'Batsman',
            rating: points,
            stats: { runs, fours, sixes, matches: 1 },
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random`
          });
        }
      });

      // Process Bowlers
      inn.bowlers?.forEach((b: any) => {
        if (!b.name) return;
        const wickets = Number(b.wickets) || 0;
        const maidens = Number(b.maidens) || 0;
        const runsConceded = Number(b.runs) || 0;
        const overs = parseFloat(b.overs || '0');
        const points = (wickets * 25) + (maidens * 12);

        if (playerMap.has(b.name)) {
          const p = playerMap.get(b.name)!;
          p.stats.wickets = (p.stats.wickets || 0) + wickets;
          p.stats.economy = overs > 0 ? (p.stats.runsConceded + runsConceded) / (p.stats.overs + overs) : p.stats.economy;
          p.stats.runsConceded = (p.stats.runsConceded || 0) + runsConceded;
          p.stats.overs = (p.stats.overs || 0) + overs;
          p.rating += points;
          // Upgrade position if they also batted
          p.position = 'All-Rounder';
        } else {
          playerMap.set(b.name, {
            id: `p-${b.name.replace(/\s+/g, '-')}`,
            name: b.name,
            teamId: inn.teamShortName,
            sport: 'cricket',
            position: 'Bowler',
            rating: points,
            stats: { wickets, economy: b.economy || 0, runsConceded, overs, matches: 1 },
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random`
          });
        }
      });
    });

    // Convert to array and sort by fantasy points
    return Array.from(playerMap.values())
      .filter(p => p.rating > 0) // Only players who actually did something
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

  }, [scorecard]);

  return { trendingPlayers, loading, error, sourceMatch: topLiveMatch };
}
