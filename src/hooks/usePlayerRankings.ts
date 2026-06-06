import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

export type PlayerRankingCategory = 'batsmen' | 'bowlers' | 'allrounders';
export type RankingFormat = 'odi' | 'test' | 't20';

export interface PlayerRankingEntry {
  rank: number;
  id: string;
  name: string;
  country: string;
  flagCode: string | null;   // ISO code for flagcdn (null if local)
  flagLocal: string | null;  // /flags/xxx.png path (null if CDN)
  faceImageId: string | null;
  rating: number;
  points: number;
  trend: 'Up' | 'Down' | 'Flat';
  lastUpdatedOn: string | null;
}

interface PlayerRankingsResult {
  data: PlayerRankingEntry[];
  lastUpdatedOn: string | null;
  error: string | null;
}

// Session-level in-memory cache — avoids re-fetching on tab switch
const cache: Record<string, PlayerRankingsResult> = {};

export function usePlayerRankings() {
  const [rankings, setRankings] = useState<PlayerRankingsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const fetchRankings = useCallback(async (
    category: PlayerRankingCategory,
    format: RankingFormat
  ) => {
    const key = `${category}_${format}`;

    // Serve from session cache if already fetched
    if (cache[key]) {
      setRankings(cache[key]);
      setCurrentKey(key);
      return;
    }

    setLoading(true);
    setCurrentKey(key);
    try {
      const res = await fetch(
        `${API_BASE}/api/cricket/player-rankings/${category}/${format}`
      );
      const json: PlayerRankingsResult = await res.json();
      cache[key] = json;
      setRankings(json);
    } catch {
      setRankings({ data: [], lastUpdatedOn: null, error: 'Failed to load rankings' });
    } finally {
      setLoading(false);
    }
  }, []);

  return { rankings, loading, currentKey, fetchRankings };
}
