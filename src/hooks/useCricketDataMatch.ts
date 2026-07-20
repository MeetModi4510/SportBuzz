import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Match } from '@/data/types';


export const useCricketDataMatch = (matchId: string | undefined, isOpen: boolean) => {
    const [data, setData] = useState<Match | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state immediately when matchId changes to avoid stale data from previous match
    useEffect(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, [matchId]);

    const fetchData = useCallback(async () => {
        if (!matchId) return;

        setLoading(true);
        setError(null);

        try {
            // Use the scraped summary endpoint — this reliably identifies the match by its
            // Cricbuzz numeric ID without any slug-redirect issues that /info had.
            let BACKEND = import.meta.env.VITE_API_URL || '';
            if (import.meta.env.PROD) {
                if (!BACKEND || BACKEND.includes('localhost') || BACKEND.includes('127.0.0.1')) {
                    BACKEND = '/api';
                }
            } else {
                if (!BACKEND) BACKEND = (import.meta.env.PROD ? '' : '') + '/api';
            }
            const response = await fetch(`${BACKEND}/cricket/scraped/match/${matchId}/summary`);
            const json = await response.json();
            const raw = json?.data;
            const matchDetails = raw?.matchScoreDetails || raw;

            if (matchDetails && (matchDetails.matchInfo || matchDetails.matchId)) {
                // Map scraped summary to our Match model
                const info = matchDetails.matchInfo || {};
                const score = matchDetails.matchScore || matchDetails.inningsScoreList || raw?.miniscore?.matchScoreDetails?.inningsScoreList || {};

                // Build innings scores from matchScore
                const inningsScores: any[] = [];
                let t1Score: any;
                let t2Score: any;

                if (Array.isArray(score)) {
                    // It's an array of innings objects
                    // We assign the first element to t1Score and the second to t2Score
                    // They have format { batTeamName, score, wickets, overs }
                    const inn1 = score[0];
                    const inn2 = score[1];
                    if (inn1) t1Score = { runs: inn1.score, wickets: inn1.wickets, overs: inn1.overs };
                    if (inn2) t2Score = { runs: inn2.score, wickets: inn2.wickets, overs: inn2.overs };
                } else {
                    t1Score = score.team1Score?.inngs1;
                    t2Score = score.team2Score?.inngs1;
                }

                if (t1Score) inningsScores.push({ team: 'home', score: `${t1Score.runs}/${t1Score.wickets}`, overs: t1Score.overs });
                if (t2Score) inningsScores.push({ team: 'away', score: `${t2Score.runs}/${t2Score.wickets}`, overs: t2Score.overs });

                const team1Info = Array.isArray(info.matchTeamInfo) ? info.matchTeamInfo[0] : null;
                const home = info.team1 || {};
                const away = info.team2 || {};

                const matchData: any = {
                    id: String(matchDetails.matchId || matchId),
                    sport: 'cricket',
                    matchType: info.matchFormat || info.matchType || 'T20',
                    seriesName: info.series?.name || matchDetails.seriesName || '',
                    status: (() => {
                        const st = (info.state || matchDetails.state || '').toLowerCase();
                        if (st === 'complete' || st === 'completed' || st === 'result' || st === 'abandoned' || st === 'cancelled') return 'completed';
                        if (st === 'preview' || st === 'upcoming' || st === '') return 'upcoming';
                        // Stumps, Lunch, Tea, Innings Break, Rain, In Progress, Live, etc.
                        return 'live';
                    })(),
                    summaryText: info.status || matchDetails.status || '',
                    startTime: info.matchStartTimestamp ? new Date(parseInt(info.matchStartTimestamp)) : new Date(),
                    homeTeam: {
                        name: home.name || matchDetails.team1 || 'TBA',
                        shortName: home.shortName || matchDetails.team1 || '',
                        logo: home.imageId ? `/api/cricket/scraped/team-logo/${home.imageId}` : '',
                    },
                    awayTeam: {
                        name: away.name || matchDetails.team2 || 'TBA',
                        shortName: away.shortName || matchDetails.team2 || '',
                        logo: away.imageId ? `/api/cricket/scraped/team-logo/${away.imageId}` : '',
                    },
                    venue: info.venue ? `${info.venue.name || ''}, ${info.venue.city || ''}`.trim().replace(/^,|,$/g, '') : '',
                    homeScore: t1Score ? `${t1Score.runs}/${t1Score.wickets}` : '',
                    awayScore: t2Score ? `${t2Score.runs}/${t2Score.wickets}` : '',
                    inningsScores,
                };
                setData(matchData);
            } else {
                setError('Match data not found');
            }

        } catch (err: any) {
            console.error("Match Detail Fetch Error:", err);
            setError(err.message || 'Failed to fetch match details');
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    // Polling Logic
    useEffect(() => {
        if (!isOpen || !matchId) return;

        // Initial fetch
        fetchData();

        // Poll every 12 minutes (720,000 ms) — aligned with backend cache TTL
        const interval = setInterval(fetchData, 720000);

        return () => clearInterval(interval);
    }, [isOpen, matchId, fetchData]);

    return { data, loading, error };
};

export const useCricbuzzSquads = (matchId: string | number | undefined, enabled: boolean) => {
    const { data: squads, isLoading: squadsLoading, error } = useQuery({
        queryKey: ['cricket', 'squads', matchId],
        queryFn: async () => {
            let BACKEND = import.meta.env.VITE_API_URL || '';
            if (import.meta.env.PROD) {
                if (!BACKEND || BACKEND.includes('localhost') || BACKEND.includes('127.0.0.1')) {
                    BACKEND = '/api';
                }
            } else {
                if (!BACKEND) BACKEND = (import.meta.env.PROD ? '' : '') + '/api';
            }
            const res = await fetch(`${BACKEND}/cricket/scraped/match/${matchId}/squads`);
            if (!res.ok) throw new Error('Network response was not ok');
            const json = await res.json();
            if (json.status === 'success' && json.data?.success) {
                return json.data.data;
            }
            throw new Error(json.data?.message || 'Failed to fetch squads');
        },
        enabled: !!matchId && enabled,
        staleTime: 1000 * 60 * 60 * 3, // 3 hours
        gcTime: 1000 * 60 * 60 * 3, // 3 hours cache retention
    });

    return { squads, squadsLoading, squadsError: error ? (error as Error).message : null };
};
