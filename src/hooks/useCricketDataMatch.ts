import { useState, useEffect, useCallback } from 'react';
import { Match } from '@/data/types';
import { cricketApi } from '@/services/api';
// Import the shared mapper locally or define a simple one if import fails
import { mapApiMatchToModel } from '@/services/cricketMapper';

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
            // Use the backend proxy instead of direct calls
            // This ensures we use the correct keys and endpoints managed by the server
            const response = await cricketApi.getMatchInfo(matchId);

            if (response && response.data) {
                // Map the backend response to our Match model
                // The backend returns { success: true, data: { ...rawAPIdata } }
                const matchData = mapApiMatchToModel(response.data);
                setData(matchData);
            } else if (response && (response as any).id) {
                // Handle case where response IS the data (direct return)
                const matchData = mapApiMatchToModel(response);
                setData(matchData);
            } else {
                // Fallback if data is missing
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
