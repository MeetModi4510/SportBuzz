import { useState, useEffect, useCallback } from 'react';
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
            const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${BACKEND}/cricket/scraped/match/${matchId}/summary`);
            const json = await response.json();
            const raw = json?.data;

            if (raw && (raw.matchInfo || raw.matchId)) {
                // Map scraped summary to our Match model
                const info = raw.matchInfo || {};
                const score = raw.matchScore || {};

                // Build innings scores from matchScore
                const inningsScores: any[] = [];
                const t1Score = score.team1Score?.inngs1;
                const t2Score = score.team2Score?.inngs1;
                if (t1Score) inningsScores.push({ team: 'home', score: `${t1Score.runs}/${t1Score.wickets}`, overs: t1Score.overs });
                if (t2Score) inningsScores.push({ team: 'away', score: `${t2Score.runs}/${t2Score.wickets}`, overs: t2Score.overs });

                const team1Info = Array.isArray(info.matchTeamInfo) ? info.matchTeamInfo[0] : null;
                const home = info.team1 || {};
                const away = info.team2 || {};

                const matchData: any = {
                    id: String(raw.matchId || matchId),
                    sport: 'cricket',
                    matchType: info.matchFormat || info.matchType || 'T20',
                    seriesName: info.series?.name || raw.seriesName || '',
                    status: (() => {
                        const st = (info.state || raw.state || '').toLowerCase();
                        if (st === 'inprogress') return 'live';
                        if (st === 'complete' || st === 'completed') return 'completed';
                        return 'upcoming';
                    })(),
                    summaryText: info.status || raw.status || '',
                    startTime: info.matchStartTimestamp ? new Date(parseInt(info.matchStartTimestamp)) : new Date(),
                    homeTeam: {
                        name: home.name || raw.team1 || 'TBA',
                        shortName: home.shortName || raw.team1 || '',
                        logo: home.imageId ? `/api/cricket/scraped/team-logo/${home.imageId}` : '',
                    },
                    awayTeam: {
                        name: away.name || raw.team2 || 'TBA',
                        shortName: away.shortName || raw.team2 || '',
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
    const [squads, setSquads] = useState<any>(null);
    const [squadsLoading, setSquadsLoading] = useState(false);
    const [squadsError, setSquadsError] = useState<string | null>(null);

    useEffect(() => {
        if (!matchId || !enabled) return;
        
        let isMounted = true;

        const fetchSquads = async () => {
            setSquadsLoading(true);
            setSquadsError(null);
            
            try {
                // Call our proxy endpoint which falls back through both cricbuzz squad URLs and caches for 1 hour
                const res = await fetch(`http://localhost:5000/api/cricket/scraped/match/${matchId}/squads`);
                const json = await res.json();
                
                if (isMounted) {
                    if (json.status === 'success' && json.data?.success) {
                        setSquads(json.data.data);
                    } else {
                        setSquadsError(json.data?.message || 'Failed to fetch squads');
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Squads Fetch Error:", err);
                    setSquadsError(err.message || 'Error fetching squads');
                }
            } finally {
                if (isMounted) {
                    setSquadsLoading(false);
                }
            }
        };

        fetchSquads();

        return () => {
            isMounted = false;
        };
    }, [matchId, enabled]);

    return { squads, squadsLoading, squadsError };
};
