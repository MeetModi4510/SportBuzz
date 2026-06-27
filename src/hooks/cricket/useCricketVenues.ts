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
                // Fetch dynamic venues from TheSportsDB via our backend proxy
                const res = await axios.get(`${API_BASE_URL}/cricket/venues/country/${encodeURIComponent(country)}`);
                
                if (res.data.status === 'success' && isMounted) {
                    // Map the backend data to the VenueAnalysis format expected by the UI
                    const mappedVenues: VenueAnalysis[] = res.data.data.map((v: any) => ({
                        id: v.cricbuzzId || v.id, // we use cricbuzzId as the internal id to trigger deep stats
                        name: v.name,
                        city: v.city,
                        country: v.country,
                        capacity: v.capacity,
                        sport: "cricket",
                        established: v.established,
                        description: v.description,
                        image: v.image,
                        // We put null/dummy stats for now until the user clicks to expand
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

export function useCricketVenueDeepStats(cricbuzzId: string | null) {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!cricbuzzId) return;
        
        let isMounted = true;
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch deep stats from Cricbuzz RapidAPI via our backend proxy
                const res = await axios.get(`${API_BASE_URL}/cricket/venue/${cricbuzzId}/stats`);
                if (res.data.status === 'success' && isMounted) {
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
    }, [cricbuzzId]);

    return { stats, isLoading, error };
}
