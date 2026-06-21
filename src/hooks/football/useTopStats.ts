import { useQuery } from '@tanstack/react-query';

export const API_BASE = import.meta.env.PROD
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
  imageUrl: string;
  teamBadgeUrl: string;
  sofascoreId?: string;
  photoBase64?: string;
  position?: string;
  jerseyNumber?: string;
  country?: string;
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
  isFotmob?: boolean;
  fotmobTabs?: [string, string][];
}

async function fetchTopStats(leagueId: number): Promise<TopStatsResponse> {
  if (leagueId === 734 || leagueId === 77) {
    const res = await fetch(`${API_BASE}/api/football/fotmob-stats/77`);
    if (!res.ok) throw new Error('Failed to fetch fotmob stats');
    const json = await res.json();
    
    let players: PlayerStat[] = [];
    let fotmobTabs: [string, string][] = [];
    
    if (json.data && Array.isArray(json.data)) {
      json.data.forEach((group: any, index: number) => {
        const statTyp = index + 100; // Unique stat type
        fotmobTabs.push([statTyp.toString(), group.header]);
        
        if (group.data && Array.isArray(group.data)) {
          group.data.forEach((p: any) => {
            players.push({
              _id: `${statTyp}-${p.ParticiantId}`,
              leagueId: 77,
              leagueName: "World Cup",
              statTyp: statTyp,
              rank: p.Rank,
              playerName: p.ParticipantName,
              playerId: p.ParticiantId?.toString() || "",
              teamName: p.TeamName,
              teamId: p.TeamId?.toString() || "",
              statValue: p.StatValue?.toString() || "",
              imageUrl: `https://images.fotmob.com/image_resources/playerimages/${p.ParticiantId}.png`,
              teamBadgeUrl: p.TeamId?.toString() || "",
              sofascoreId: "fotmob", 
              photoBase64: `https://images.fotmob.com/image_resources/playerimages/${p.ParticiantId}.png`, 
              country: p.ParticipantCountryCode,
              lastFetched: new Date().toISOString()
            });
          });
        }
      });
    }

    return {
      success: true,
      fromCache: false,
      leagueId: 77,
      lastFetched: new Date().toISOString(),
      players,
      teams: [],
      isFotmob: true,
      fotmobTabs
    };
  }

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
  { id: 65,  name: 'Premier League', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png' },
  { id: 75,  name: 'La Liga',        logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png' },
  { id: 67,  name: 'Bundesliga',     logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png' },
  { id: 77,  name: 'Serie A',        logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png' },
  { id: 68,  name: 'Ligue 1',        logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png' },
  { id: 734, name: 'World Cup',      logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/77.png' },
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

export function useTopStats(leagueId: number, activePlayerTyp: number, view: "players" | "teams") {
  return useQuery<TopStatsResponse>({
    queryKey: ['football', 'top-stats', leagueId],
    queryFn: () => fetchTopStats(leagueId),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime:    6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    refetchInterval: (query) => {
      // Only poll for updates if we are actively looking at players
      if (view !== "players") return false;
      
      const players = query?.state?.data?.players;
      if (!players) return false;
      
      // Only poll if players IN THE CURRENT TAB are missing images
      const activePlayers = players.filter(p => p.statTyp === activePlayerTyp);
      const needsEnrichment = activePlayers.some((p: PlayerStat) => p.sofascoreId === undefined);
      
      return needsEnrichment ? 2000 : false;
    },
  });
}
