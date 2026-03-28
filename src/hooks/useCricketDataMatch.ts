import { useState, useEffect, useCallback } from 'react';
import { Match } from '@/data/types';
import { cricketApi } from '@/services/api';
// Import the shared mapper locally or define a simple one if import fails
import { mapApiMatchToModel } from '@/services/cricketMapper';

export const useCricketDataMatch = (matchId: string | undefined, isOpen: boolean) => {
    const [data, setData] = useState<Match | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        // Poll every 5 minutes (300,000 ms)
        const interval = setInterval(fetchData, 300000);

        return () => clearInterval(interval);
    }, [isOpen, matchId, fetchData]);

    return { data, loading, error };
};
