import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

export type RankingFormat = 'odi' | 'test' | 't20';

export interface TeamRankingEntry {
  rank: number;
  id: string;
  name: string;
  rating: number;
  points: number;
  matches: number | null;
  flagCode: string | null;
  lastUpdatedOn: string | null;
}

interface RankingsResult {
  data: TeamRankingEntry[];
  hasMatches: boolean;
  lastUpdatedOn: string | null;
  error: string | null;
}

// Simple in-memory cache so switching tabs doesn't re-fetch
const cache: Record<string, RankingsResult> = {};

export function useTeamRankings() {
  const [rankings, setRankings] = useState<RankingsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<RankingFormat | null>(null);

  const fetchRankings = useCallback(async (format: RankingFormat) => {
    // Serve from in-memory cache if available (already fetched this session)
    if (cache[format]) {
      setRankings(cache[format]);
      setCurrentFormat(format);
      return;
    }

    setLoading(true);
    setCurrentFormat(format);
    try {
      const res = await fetch(`${API_BASE}/api/cricket/rankings/${format}`);
      const json: RankingsResult = await res.json();
      cache[format] = json;
      setRankings(json);
    } catch {
      setRankings({ data: [], hasMatches: false, lastUpdatedOn: null, error: 'Failed to load rankings' });
    } finally {
      setLoading(false);
    }
  }, []);

  return { rankings, loading, currentFormat, fetchRankings };
}
