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
    
    // Extract team names
    const team1Name = apiMatch.teamInfo?.[0]?.name || apiMatch.homeTeam?.name || 'T1';
    const team2Name = apiMatch.teamInfo?.[1]?.name || apiMatch.awayTeam?.name || 'T2';

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
            logo: '🏏',
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.homeTeam?.players
        },
        awayTeam: {
            id: `team-${team2Name}`,
            name: team2Name,
            shortName: getTeamAcronym(team2Name),
            logo: '🏏',
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.awayTeam?.players
        },
        homeScore: apiMatch.score?.team1?.runs !== undefined ? `${apiMatch.score.team1.runs}/${apiMatch.score.team1.wickets || 0}` : '',
        awayScore: apiMatch.score?.team2?.runs !== undefined ? `${apiMatch.score.team2.runs}/${apiMatch.score.team2.wickets || 0}` : '',
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
            return response.data?.data || response.data || [];
        },
        refetchInterval: 720000,
        staleTime: 720000,
    });
}

export function useUpcomingCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'upcoming'],
        queryFn: async (): Promise<Match[]> => {
            const response = await cricketApi.getUpcomingMatches();
            return response.data?.data || response.data || [];
        },
        staleTime: 600000,
    });
}

export function useRecentCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'recent'],
        queryFn: async (): Promise<Match[]> => {
            const response = await cricketApi.getRecentMatches();
            return response.data?.data || response.data || [];
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
    });
}
