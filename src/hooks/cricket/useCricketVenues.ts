import { useState, useEffect } from 'react';
import axios from 'axios';
import type { VenueAnalysis } from '@/data/venueAnalysisData';

const API_BASE_URL = import.meta.env.PROD ? 'https://sportbuzz-backend.onrender.com/api' : '/api';

export function useCricketVenues(country: string = 'India') {
    const [venues, setVenues] = useState<VenueAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchVenues = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE_URL}/cricket/venues/country/${encodeURIComponent(country)}`);
                if (res.data.status === 'success' && isMounted) {
                    const mappedVenues: VenueAnalysis[] = res.data.data.map((v: any) => ({
                        id: v.id,
                        cricbuzzId: v.cricbuzzId,
                        name: v.name,
                        city: v.city,
                        country: v.country,
                        capacity: v.capacity,
                        sport: "cricket",
                        established: v.established,
                        description: v.description,
                        image: v.image,
                        espnGroundId: v.espnGroundId ?? null,
                        tests: v.tests || 0,
                        odis: v.odis || 0,
                        t20is: v.t20is || 0,
                        stats: {
                            sport: "cricket",
                            matchesHosted: 0,
                            avgFirstInningsScore: 0,
                            avgSecondInningsScore: 0,
                            highestTotal: { score: "N/A", team: "N/A", year: 0 },
                            lowestTotal: { score: "N/A", team: "N/A", year: 0 },
                            wonBattingFirst: 0,
                            wonBattingSecond: 0,
                            draws: 0,
                            avgRunRate: 0,
                            pitchType: "Click to load deep stats",
                            tossWinBatFirst: 0,
                            tossWinFieldFirst: 0,
                            avgWicketsFallen: 0,
                            centuries: 0,
                            fiveWicketHauls: 0,
                            formatBreakdown: [],
                        },
                        recentMatches: [],
                        topPerformers: []
                    }));
                    setVenues(mappedVenues);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchVenues();
        return () => { isMounted = false; };
    }, [country]);

    return { venues, isLoading, error };
}


export type VenueFormat = 'Test' | 'ODI' | 'T20' | 'All';

export interface VenueDeepStats {
    format: string;
    matchesHosted: number;
    avgFirstInningsScore: number;
    avgSecondInningsScore: number;
    wonBattingFirst: number;
    wonBattingSecond: number;
    draws: number;
    avgRunRate: number;
    tossWinBatFirst: number;
    tossWinFieldFirst: number;
    avgWicketsFallen: number;
    centuries: number;
    fiveWicketHauls: number;
    pitchType: string;
    highestTotal: { score: string; team: string; year: string | number };
    lowestTotal: { score: string; team: string; year: string | number };
    formatBreakdown: Array<{ format: string; matches: number; won: number; lost: number; winPct: number }>;
    bowlerTypes: Array<{ type: string; economy: number; average: number }>;
    avgFirstInningsByYear: Array<{ year: string; score: number }>;
    battingLeaders: Array<{ rank: string; name: string; innings: number; runs: number; avg: number; hs: string; sr: number }>;
    bowlingLeaders: Array<{ rank: string; name: string; innings: number; wickets: number; avg: number; econ: number; bbi: string }>;
    recentMatches: Array<{ date: string; teams: string; result: string; matchUrl: string | null }>;
    cricmetricSource: string;
}

export function useCricketVenueDeepStats(
    venueName: string | null,
    country: string | null,
    format: VenueFormat = 'Test'
) {
    const [stats, setStats] = useState<VenueDeepStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!venueName || !country) return;

        let isMounted = true;
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            setStats(null);
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/cricket/venue/statsguru-stats`,
                    { params: { ground: venueName, country, format } }
                );
                if ((res.data.status === 'success' || res.data.status === 'not_found') && isMounted) {
                    setStats(res.data.data);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, [venueName, country, format]);

    return { stats, isLoading, error };
}

/**
 * useESPNVenueStats — Primary hook for venue deep stats using ESPN Statsguru.
 * Accepts espnGroundId (from venue list) for a direct, accurate lookup.
 * Falls back to name-based resolution if groundId is null.
 */
export function useESPNVenueStats(
    espnGroundId: number | null,
    venueName: string | null,
    format: VenueFormat = 'Test'
) {
    const [stats, setStats] = useState<VenueDeepStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!espnGroundId && !venueName) return;

        let isMounted = true;
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            setStats(null);
            try {
                const params: Record<string, any> = { format };
                if (espnGroundId) {
                    params.groundId = espnGroundId;
                    params.ground = venueName || '';
                } else {
                    params.ground = venueName;
                }
                const res = await axios.get(
                    `${API_BASE_URL}/cricket/venue/espn-stats`,
                    { params }
                );
                if ((res.data.status === 'success' || res.data.status === 'not_found') && isMounted) {
                    setStats(res.data.data);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, [espnGroundId, venueName, format]);

    return { stats, isLoading, error };
}

export function useCricketVenueMatches(
    venueName: string | null,
    country: string | null,
    format: VenueFormat = 'Test'
) {
    const [matches, setMatches] = useState<Array<{ date: string; teams: string; result: string; matchUrl: string | null }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!venueName || !country) return;
        let isMounted = true;
        const fetch = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/cricket/venue/matches`,
                    { params: { ground: venueName, country, format } }
                );
                if (res.data.status === 'success' && isMounted) {
                    setMatches(res.data.data || []);
                }
            } catch { /* silent */ }
            finally { if (isMounted) setIsLoading(false); }
        };
        fetch();
        return () => { isMounted = false; };
    }, [venueName, country, format]);

    return { matches, isLoading };
}
