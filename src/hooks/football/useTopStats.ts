import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

export interface PlayerStat {
  _id: string;
  leagueId: number;
  leagueName: string;
  statTyp: number;
  rank: number;
  playerName: string;
  playerId: string;
  teamName: string;
  teamId: string;
  statValue: string;
  imageUrl: string;       // partial, e.g. "29179241.png"
  teamBadgeUrl: string;   // partial, e.g. "enet/8456.png"
  lastFetched: string;
}

export interface TeamStat {
  _id: string;
  leagueId: number;
  leagueName: string;
  statTyp: number;
  rank: number;
  teamName: string;
  teamId: string;
  statValue: string;    // Total
  statPerGame: string;  // Per game
  teamBadgeUrl: string;
  lastFetched: string;
}

export interface TopStatsResponse {
  success: boolean;
  fromCache: boolean;
  stale?: boolean;
  leagueId: number;
  lastFetched: string | null;
  players: PlayerStat[];
  teams: TeamStat[];
}

async function fetchTopStats(leagueId: number): Promise<TopStatsResponse> {
  const res = await fetch(`${API_BASE}/api/football/top-stats?leagueId=${leagueId}`);
  if (!res.ok) throw new Error('Failed to fetch top stats');
  return res.json();
}

export const PLAYER_STAT_LABELS: Record<number, string> = {
  1: 'Goals',
  3: 'Assists',
  4: 'Defenders',
  6: 'Midfielders',
  8: 'Overall',
};

export const TEAM_STAT_LABELS: Record<number, string> = {
  10: 'Goals Scored',
  7:  'Goals Conceded',
  1:  'Possession',
  21: 'Shots',
  22: 'Passes',
  16: 'Clean Sheets',
  23: 'Discipline',
};

export const TOPSTATS_LEAGUES = [
  { id: 65, name: 'Premier League', flag: 'https://flagcdn.com/w40/gb-eng.png' },
  { id: 75, name: 'La Liga',        flag: 'https://flagcdn.com/w40/es.png'     },
  { id: 67, name: 'Bundesliga',     flag: 'https://flagcdn.com/w40/de.png'     },
  { id: 77, name: 'Serie A',        flag: 'https://flagcdn.com/w40/it.png'     },
  { id: 68, name: 'Ligue 1',        flag: 'https://flagcdn.com/w40/fr.png'     },
];

/** Build player photo URL using the numeric player ID (Pid from API) */
export function playerPhotoUrl(playerId: string): string {
  if (!playerId) return '';
  return `https://media.api-sports.io/football/players/${playerId}.png`;
}

/** Build the full team badge URL from the partial Img field */
export function teamBadgeUrl(img: string): string {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `https://lsm-static-prod.livescore.com/medium/${img}`;
}

export function useTopStats(leagueId: number) {
  return useQuery<TopStatsResponse>({
    queryKey: ['football', 'top-stats', leagueId],
    queryFn: () => fetchTopStats(leagueId),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime:    6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}
