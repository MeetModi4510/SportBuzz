import { useState, useEffect } from 'react';
import axios from 'axios';
import { Match, MatchStatus } from '@/data/types';
import { getTeamAcronym } from '@/lib/utils';

// API Configuration
const API_KEY = import.meta.env.VITE_CRICKETDATA_API_KEY;
const BASE_URL = 'https://api.cricapi.com/v1/matches';

export const useCricketDataList = () => {
    const [data, setData] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            if (!API_KEY || API_KEY === 'your_api_key_here') {
                console.warn("CricketData API Key missing or default.");
                return;
            }

            setLoading(true);
            try {
                // Fetch upcoming and live matches
                // offset=0 because we want the latest
                const response = await axios.get(`${BASE_URL}`, {
                    params: {
                        apikey: API_KEY,
                        offset: 0
                    }
                });

                const matchesRaw = response.data?.data || [];

                const mappedMatches: Match[] = matchesRaw.map((m: any) => {
                    let status: MatchStatus = 'upcoming';
                    const statusText = (m.status || '').toLowerCase();

                    if (statusText.includes('live') || statusText.includes('in progress')) {
                        status = 'live';
                    } else if (statusText.includes('completed') || statusText.includes('result') || statusText.includes('won')) {
                        status = 'completed';
                    }

                    return {
                        id: m.id,
                        sport: 'cricket',
                        nameDescription: m.name || `${m.t1} vs ${m.t2}`,
                        matchType: m.matchType || 'Unknown',
                        status: status,
                        startTime: new Date(m.dateTimeGMT || Date.now()),
                        homeTeam: {
                            id: m.t1img ? 't1_' + m.id : 't1', // Use diverse IDs if possible
                            name: m.t1 || 'Home Team',
                            shortName: m.t1s || getTeamAcronym(m.t1 || '') || 'HOM',
                            logo: m.t1img || '',
                            sport: 'cricket',
                            primaryColor: '#1e40af'
                        },
                        awayTeam: {
                            id: m.t2img ? 't2_' + m.id : 't2',
                            name: m.t2 || 'Away Team',
                            shortName: m.t2s || getTeamAcronym(m.t2 || '') || 'AWY',
                            logo: m.t2img || '',
                            sport: 'cricket',
                            primaryColor: '#15803d'
                        },
                        homeScore: m.t1s || (status === 'upcoming' ? '-' : ''),
                        awayScore: m.t2s || (status === 'upcoming' ? '-' : ''),
                        venue: {
                            id: 'v1',
                            name: m.venue || 'Unknown Venue',
                            city: '',
                            country: '',
                            capacity: 0,
                            sport: 'cricket'
                        },
                        summaryText: m.status || ''
                    };
                });

                // Prioritize International and T20 Leagues if possible, or just strict date sorting
                // Sorting by startTime (ascending for upcoming, descending for live/completed is tricky in one list)
                // For now, let's just reverse to show newest/closest first if the API returns oldest first
                // API usually returns upcoming sorted by date.
                setData(mappedMatches);
            } catch (err: any) {
                console.error("CricketData List Fetch Error:", err);
                setError(err.message || 'Failed to fetch match list');
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();

        // Refresh every 5 minutes
        const interval = setInterval(fetchMatches, 600000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error };
};
