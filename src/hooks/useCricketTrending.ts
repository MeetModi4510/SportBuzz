import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

export interface TrendingPlayerEntry {
  rank: number;
  id: string;
  name: string;
  teamName: string;
  faceImageId: string | null;
  flagCode: string | null;   // ISO code for flagcdn (null if local)
  flagLocal: string | null;  // /flags/xxx.png path (null if CDN)
}

export interface CricbuzzPlayerInfo {
  id: string;
  name: string;
  country: string;
  flagCode: string | null;
  flagLocal: string | null;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  faceImageId: string | null;
  bio: string;
  dateOfBirth: string;
  rankings: {
    test: string | null;
    odi: string | null;
    t20: string | null;
  };
  teams: { id: string | null; name: string }[];
  recentBatting: { headers: string[]; rows: { values: string[] }[] } | null;
  recentBowling: { headers: string[]; rows: { values: string[] }[] } | null;
}

interface TrendingResult {
  data: TrendingPlayerEntry[];
  lastUpdatedOn: string | null;
  error: string | null;
}

interface PlayerInfoResult {
  data: CricbuzzPlayerInfo | null;
  error: string | null;
}

// Session-level caches (keyed by version so stale data is dropped after deployments)
const CACHE_VERSION = 'v2-teams-objects';
let trendingCacheData: TrendingResult | null = null;
const playerInfoCache: Record<string, CricbuzzPlayerInfo> = {};

// Wipe any stale cache from previous versions stored in sessionStorage
if (typeof sessionStorage !== 'undefined') {
  const storedVersion = sessionStorage.getItem('cricket_cache_version');
  if (storedVersion !== CACHE_VERSION) {
    sessionStorage.setItem('cricket_cache_version', CACHE_VERSION);
    // Force a fresh fetch on next render
    trendingCacheData = null;
  }
}

export function useCricketTrendingPlayers() {
  const [trending, setTrending] = useState<TrendingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchTrending = useCallback(async () => {
    // Don't re-fetch if already loaded in this session
    if (trendingCacheData) {
      setTrending(trendingCacheData);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cricket/trending-players`);
      const json: TrendingResult = await res.json();
      trendingCacheData = json;
      setTrending(json);
    } catch {
      setTrending({ data: [], lastUpdatedOn: null, error: 'Failed to load trending players' });
    } finally {
      setLoading(false);
    }
  }, []);

  return { trending, loading, fetchTrending };
}

export function useCricbuzzPlayerInfo() {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlayerInfo = useCallback(async (playerId: string) => {
    // Serve from session cache
    if (playerInfoCache[playerId]) {
      setPlayerInfo({ data: playerInfoCache[playerId], error: null });
      return;
    }

    setLoading(true);
    setPlayerInfo(null);
    try {
      const res = await fetch(`${API_BASE}/api/cricket/player-info/${playerId}`);
      const json: PlayerInfoResult = await res.json();
      if (json.data) {
        // Normalize teams to always be { id, name }[] regardless of server cache format
        const rawTeams = (json.data as any).teams;
        if (rawTeams && !Array.isArray(rawTeams)) {
          json.data.teams = String(rawTeams).split(',').map((t: string) => ({ id: null, name: t.trim() }));
        } else if (Array.isArray(rawTeams)) {
          json.data.teams = rawTeams.map((t: any) =>
            typeof t === 'string' ? { id: null, name: t.trim() } : { id: t.id ?? null, name: t.name ?? String(t) }
          );
        }
        playerInfoCache[playerId] = json.data;
      }
      setPlayerInfo(json);
    } catch {
      setPlayerInfo({ data: null, error: 'Failed to load player info' });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPlayerInfo = useCallback(() => {
    setPlayerInfo(null);
  }, []);

  return { playerInfo, loading, fetchPlayerInfo, clearPlayerInfo };
}
