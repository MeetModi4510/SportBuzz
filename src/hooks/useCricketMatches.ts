import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '@/services/api';
import type { Match } from '@/data/types';
import { formatToIST, parseGMT } from '@/lib/dateUtils';
import { getTeamAcronym } from '@/lib/utils';

/**
 * Mapper function moved back here to ensure it's available and fix white screen.
 */
export function mapApiMatchToModel(apiMatch: any): Match {
    if (!apiMatch) return {} as Match;
    
    // Extract team names and logos
    const team1Name = apiMatch.teamInfo?.[0]?.name || apiMatch.homeTeam?.name || 'T1';
    const team2Name = apiMatch.teamInfo?.[1]?.name || apiMatch.awayTeam?.name || 'T2';
    
    const team1ImageId = apiMatch.teamInfo?.[0]?.imageId;
    const team2ImageId = apiMatch.teamInfo?.[1]?.imageId;
    
    // We use the backend proxy for Cricbuzz images, fallback to emoji
    // Use localhost in dev, or relative in prod. We can just use relative URL since proxy works on same host.
    const team1Logo = team1ImageId ? `/api/cricket/scraped/team-logo/${team1ImageId}` : '🏏';
    const team2Logo = team2ImageId ? `/api/cricket/scraped/team-logo/${team2ImageId}` : '🏏';

    // Determine status
    const getStatus = (state: string): 'live' | 'upcoming' | 'completed' => {
        const s = state?.toLowerCase() || '';
        if (s === 'in progress' || s === 'live' || s.includes('innings break')) return 'live';
        if (s === 'complete' || s === 'result') return 'completed';
        return 'upcoming';
    };

    return {
        id: apiMatch.id || String(Math.random()),
        sport: 'cricket',
        homeTeam: {
            id: `team-${team1Name}`,
            name: team1Name,
            shortName: getTeamAcronym(team1Name),
            logo: team1Logo,
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.homeTeam?.players
        },
        awayTeam: {
            id: `team-${team2Name}`,
            name: team2Name,
            shortName: getTeamAcronym(team2Name),
            logo: team2Logo,
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.awayTeam?.players
        },
        // The listing API returns score as an array [{inning, r, w, o}] per innings.
        // Fall back to legacy {team1, team2} object shape if array is not present.
        homeScore: (() => {
            const scoreArr = Array.isArray(apiMatch.score) ? apiMatch.score : null;
            if (scoreArr && scoreArr.length > 0) {
                const s = scoreArr[0];
                return s.r !== undefined ? `${s.r}/${s.w || 0}${s.o !== undefined ? ` (${s.o} ov)` : ''}` : '';
            }
            return apiMatch.score?.team1?.runs !== undefined ? `${apiMatch.score.team1.runs}/${apiMatch.score.team1.wickets || 0}` : '';
        })(),
        awayScore: (() => {
            const scoreArr = Array.isArray(apiMatch.score) ? apiMatch.score : null;
            if (scoreArr && scoreArr.length > 1) {
                const s = scoreArr[1];
                return s.r !== undefined ? `${s.r}/${s.w || 0}${s.o !== undefined ? ` (${s.o} ov)` : ''}` : '';
            }
            return apiMatch.score?.team2?.runs !== undefined ? `${apiMatch.score.team2.runs}/${apiMatch.score.team2.wickets || 0}` : '';
        })(),
        status: getStatus(apiMatch.status || apiMatch.state),
        venue: {
            id: 'v1',
            name: apiMatch.venue || 'Unknown Venue',
            city: '',
            country: '',
            capacity: 0,
            sport: 'cricket',
        },
        startTime: parseGMT(apiMatch.date || apiMatch.dateTime),
        matchType: apiMatch.matchType || apiMatch.format || 'Cricket',
        displayTime: formatToIST(apiMatch.date || apiMatch.dateTime),
        homeLineup: apiMatch.homeLineup,
        awayLineup: apiMatch.awayLineup
    };
}

export function useLiveCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'live'],
        queryFn: async (): Promise<Match[]> => {
            const response = await cricketApi.getLiveMatches();
            const data = response.data?.data || response.data || [];
            return (Array.isArray(data) ? data : []).map(mapApiMatchToModel);
        },
        refetchInterval: 60000,
        staleTime: 60000,
    });
}

export function useUpcomingCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'upcoming'],
        queryFn: async (): Promise<Match[]> => {
            const response = await cricketApi.getUpcomingMatches();
            const data = response.data?.data || response.data || [];
            return (Array.isArray(data) ? data : []).map(mapApiMatchToModel);
        },
        staleTime: 600000,
    });
}

export function useRecentCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'recent'],
        queryFn: async (): Promise<Match[]> => {
            const response = await cricketApi.getRecentMatches();
            const data = response.data?.data || response.data || [];
            return (Array.isArray(data) ? data : []).map(mapApiMatchToModel);
        },
        staleTime: 600000,
    });
}

export function useAllCricketMatches() {
    const liveQuery = useLiveCricketMatches();
    const upcomingQuery = useUpcomingCricketMatches();
    const recentQuery = useRecentCricketMatches();

    const isLoading = liveQuery.isLoading || upcomingQuery.isLoading || recentQuery.isLoading;
    const isError = liveQuery.isError && upcomingQuery.isError && recentQuery.isError;
    const error = liveQuery.error || upcomingQuery.error || recentQuery.error;

    const allMatches: Match[] = [];
    const seenIds = new Set<string>();

    const addMatches = (matches: Match[] | undefined) => {
        if (!matches) return;
        for (const match of matches) {
            if (!seenIds.has(match.id)) {
                seenIds.add(match.id);
                allMatches.push(match);
            }
        }
    };

    addMatches(liveQuery.data);
    addMatches(upcomingQuery.data);
    addMatches(recentQuery.data);

    return { data: allMatches, isLoading, isError, error, refetch: () => { liveQuery.refetch(); upcomingQuery.refetch(); recentQuery.refetch(); } };
}

export function useCricketMatchDetails(matchId: string | undefined) {
    return useQuery({
        queryKey: ['cricket', 'match', matchId],
        queryFn: async (): Promise<Match | null> => {
            if (!matchId) return null;
            const response = await cricketApi.getMatchScorecard(matchId);
            return response.data ? mapApiMatchToModel(response.data) : null;
        },
        enabled: !!matchId,
        // Never show stale data from a different match — always treat as fresh query per matchId
        staleTime: 0,
        placeholderData: undefined,
    });
}

export function useCricketMatchSquads(matchId: string | undefined) {
    return useQuery({
        queryKey: ['cricket', 'match', matchId, 'squads'],
        queryFn: async () => {
            if (!matchId) return null;
            const response = await cricketApi.getMatchSquads(matchId);
            return response.data;
        },
        enabled: !!matchId,
        staleTime: 3600000, // Cache squads for 1 hour
    });
}

export function useCricbuzzSummary(matchId: string | undefined) {
    return useQuery({
        queryKey: ['cricket', 'summary', matchId],
        queryFn: async () => {
            if (!matchId) return null;
            const res = await cricketApi.getCricbuzzSummary(matchId);
            return res.data?.data || res.data || res;
        },
        enabled: !!matchId,
        refetchInterval: 60000, // 1 minute auto-refresh
        staleTime: 30000,
    });
}

export function useCricbuzzInfo(matchId: string | undefined, isSummaryLoaded: boolean) {
    return useQuery({
        queryKey: ['cricket', 'info', matchId],
        queryFn: async () => {
            if (!matchId) return null;
            const res = await cricketApi.getCricbuzzInfo(matchId);
            return res.data?.data || res.data || res;
        },
        enabled: !!matchId && isSummaryLoaded,
        staleTime: 3600000, // 1 hour cache
    });
}

export function useMatchOversGraph(matchId: string | undefined) {
    return useQuery({
        queryKey: ['cricket', 'oversGraph', matchId],
        queryFn: async () => {
            if (!matchId) return null;
            const res = await cricketApi.getOversGraph(matchId);
            return res.data?.data || res.data || res;
        },
        enabled: !!matchId,
        refetchInterval: 300000, // 5 minutes cache match backend scraper
        staleTime: 300000,
    });
}

