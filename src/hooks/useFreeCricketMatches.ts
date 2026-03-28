import { useState, useEffect } from 'react';
import axios from 'axios';
import { Match } from '@/data/types';

// Endpoints
const BASE_URL = 'https://freewebapi.com/api/matches';

export const useFreeCricketMatches = () => {
    const [data, setData] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${BASE_URL}/list`);

                // Structure is likely { matches: [...] } or { data: [...] }
                // Based on typical API
                const matchesRaw = response.data?.matches || response.data?.data || [];

                const mappedMatches: Match[] = matchesRaw.map((m: any) => ({
                    id: m.id?.toString() || Math.random().toString(),
                    sport: 'cricket',
                    nameDescription: m.series || m.matchdesc || m.name,
                    matchType: m.format ? m.format.toLowerCase() : 't20', // Default if missing
                    status: (m.status || '').toLowerCase().includes('live') ? 'live' :
                        (m.status || '').toLowerCase().includes('completed') ? 'completed' : 'upcoming',
                    startTime: new Date(m.date ? `${m.date} ${m.time}` : Date.now()),
                    homeTeam: {
                        id: m.team1_id || 't1',
                        name: m.team1_name || 'Home Team',
                        shortName: m.team1_short || 'HOM',
                        logo: m.team1_img || '',
                        sport: 'cricket',
                        primaryColor: '#1e40af'
                    },
                    awayTeam: {
                        id: m.team2_id || 't2',
                        name: m.team2_name || 'Away Team',
                        shortName: m.team2_short || 'AWY',
                        logo: m.team2_img || '',
                        sport: 'cricket',
                        primaryColor: '#15803d'
                    },
                    homeScore: m.score1 || '0/0',
                    awayScore: m.score2 || '0/0',
                    venue: {
                        id: 'v1',
                        name: m.venue || 'Unknown Venue',
                        city: m.city || '',
                        country: '',
                        capacity: 0,
                        sport: 'cricket'
                    },
                    summaryText: m.result || m.status_note || m.status
                }));

                // Filter out non-cricket if API mixes them (unlikely for FreeCricketApi but good practice)
                setData(mappedMatches);
            } catch (err: any) {
                console.error("FreeWebApi List Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();

        // Refresh every 60s
        const interval = setInterval(fetchMatches, 60000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error };
};
