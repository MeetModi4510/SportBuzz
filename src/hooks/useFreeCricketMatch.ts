import { useState, useEffect } from 'react';
import axios from 'axios';
import { Match } from '@/data/types';

// Endpoints
const BASE_URL = 'https://freewebapi.com/api/matches';

export const useFreeCricketMatch = (matchId: string | undefined) => {
    const [data, setData] = useState<Match | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!matchId || !matchId.match(/^\d+$/)) { // Ensure numeric ID for FreeWebApi
            // Silent return if ID format doesn't match, to allow fallback
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Parallel fetching for rich details
                const [infoRes, lineupRes, scoreRes, commsRes, oversRes] = await Promise.all([
                    axios.get(`${BASE_URL}/get-info`, { params: { matchId } }).catch(() => ({ data: {} })),
                    axios.get(`${BASE_URL}/get-team`, { params: { matchId } }).catch(() => ({ data: {} })),
                    axios.get(`${BASE_URL}/get-scorecard`, { params: { matchId } }).catch(() => ({ data: {} })),
                    axios.get(`${BASE_URL}/get-commentaries`, { params: { matchId } }).catch(() => ({ data: {} })),
                    axios.get(`${BASE_URL}/get-overs`, { params: { matchId } }).catch(() => ({ data: {} }))
                ]);

                // Robust Data Extraction (Handle various nesting patterns)
                const info = infoRes.data?.match || infoRes.data?.data || infoRes.data || {};
                const squads = lineupRes.data?.squads || lineupRes.data?.data?.squads || lineupRes.data || {};
                const score = scoreRes.data?.scorecard || scoreRes.data?.data?.scorecard || scoreRes.data || {};
                const comms = commsRes.data?.commentaries || commsRes.data?.data?.commentaries || commsRes.data?.commentary || [];
                const oversDetail = oversRes.data?.overs || oversRes.data?.data?.overs || oversRes.data || {};

                // Determine Status
                let status: 'live' | 'upcoming' | 'completed' = 'upcoming';
                const statusText = (info.status || info.matchStatus || '').toLowerCase();
                if (statusText.includes('live') || statusText.includes('in progress')) status = 'live';
                else if (statusText.includes('completed') || statusText.includes('won') || statusText.includes('draw') || statusText.includes('result')) status = 'completed';

                // Map Squads with Deep Nesting Support
                const mapPlayer = (p: any, teamId: string): any => ({
                    id: p.id || p.playerId || Math.random().toString(),
                    name: p.name || p.playerName || p.fullName || "Unknown Player",
                    teamId: teamId,
                    sport: 'cricket',
                    position: p.role || p.playerRole || 'Unknown',
                    rating: 0,
                    stats: {},
                    isSubstitute: false
                });

                // Detect players array in various locations (squads.team1 or squads.team1.players)
                const getPlayers = (teamObj: any) => {
                    if (Array.isArray(teamObj)) return teamObj;
                    if (teamObj && Array.isArray(teamObj.players)) return teamObj.players;
                    if (teamObj && Array.isArray(teamObj.player)) return teamObj.player;
                    return [];
                };

                const homeSquad = getPlayers(squads.team1 || squads.homeTeam)
                    .map((p: any) => mapPlayer(p, info.team1_id || 't1'));

                const awaySquad = getPlayers(squads.team2 || squads.awayTeam)
                    .map((p: any) => mapPlayer(p, info.team2_id || 't2'));

                // Stats Logic based on Status and New Endpoint
                let matchStats: any[] = [];
                if (status !== 'upcoming') {
                    // Scorecard Snapshot
                    const homeRuns = parseInt(score.score1 || score.homeScore?.split('/')[0] || 0);
                    const awayRuns = parseInt(score.score2 || score.awayScore?.split('/')[0] || 0);

                    const homeWkts = parseInt(score.wickets1 || score.score1?.split('/')[1] || score.homeWickets || 0);
                    const awayWkts = parseInt(score.wickets2 || score.score2?.split('/')[1] || score.awayWickets || 0);

                    const homeOvers = parseFloat(score.overs1 || oversDetail.homeOvers || 0);
                    const awayOvers = parseFloat(score.overs2 || oversDetail.awayOvers || 0);

                    const homeRR = parseFloat(score.rr1 || score.homeRR || (homeOvers > 0 ? (homeRuns / homeOvers).toFixed(2) : 0));
                    const awayRR = parseFloat(score.rr2 || score.awayRR || (awayOvers > 0 ? (awayRuns / awayOvers).toFixed(2) : 0));

                    matchStats = [
                        {
                            category: "Match Statistics",
                            stats: [
                                { label: "Runs", home: homeRuns, away: awayRuns, unit: "" },
                                { label: "Wickets", home: homeWkts, away: awayWkts, unit: "" },
                                { label: "Overs", home: homeOvers, away: awayOvers, unit: "" },
                                { label: "Run Rate", home: homeRR, away: awayRR, unit: "" }
                            ]
                        }
                    ];
                }

                const mappedMatch: Match = {
                    id: matchId,
                    sport: 'cricket',
                    nameDescription: info.series || info.seriesName || info.matchdesc || info.matchDescription,
                    matchType: info.format || info.matchFormat || 'Unknown',
                    status: status,
                    startTime: new Date(info.date ? `${info.date} ${info.time}` : (info.startDate || Date.now())),
                    homeTeam: {
                        id: info.team1_id || info.homeTeamId || 't1',
                        name: info.team1_name || info.homeTeamName || 'Home Team',
                        shortName: info.team1_short || info.homeTeamShort || 'HOM',
                        logo: info.team1_img || info.homeTeamLogo || '',
                        sport: 'cricket',
                        primaryColor: '#1e40af'
                    },
                    awayTeam: {
                        id: info.team2_id || info.awayTeamId || 't2',
                        name: info.team2_name || info.awayTeamName || 'Away Team',
                        shortName: info.team2_short || info.awayTeamShort || 'AWY',
                        logo: info.team2_img || info.awayTeamLogo || '',
                        sport: 'cricket',
                        primaryColor: '#15803d'
                    },
                    homeScore: score.score1 || score.homeScore || (status === 'upcoming' ? '-' : '0/0'),
                    awayScore: score.score2 || score.awayScore || (status === 'upcoming' ? '-' : '0/0'),
                    venue: {
                        id: 'v1',
                        name: info.venue || info.groundName || 'Unknown Venue',
                        city: info.city || info.town || '',
                        country: info.country || '',
                        capacity: 0,
                        sport: 'cricket'
                    },
                    // Commentary: Flexible mapping
                    events: (status !== 'upcoming' && Array.isArray(comms)) ? comms.map((c: any) => ({
                        id: c.id?.toString() || c.commentaryId?.toString() || Math.random().toString(),
                        matchId: matchId,
                        time: c.over || c.overs || '',
                        type: (c.wicket || c.isWicket) ? 'wicket' : (c.boundary || c.isBoundary) ? 'boundary' : 'info',
                        description: c.comm || c.text || c.commentary || '',
                        shortDescription: c.headline || c.title || ''
                    })) : [],
                    summaryText: info.result || info.status_note || info.statusText || info.status,
                    squads: {
                        homeTeam: homeSquad,
                        awayTeam: awaySquad
                    },
                    detailedStats: matchStats
                };

                setData(mappedMatch);
            } catch (err: any) {
                console.error("FreeWebApi Fetch Error:", err);
                setError(err.message || "Failed to fetch match data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Poll for live matches every 30s
        let interval: NodeJS.Timeout;
        if (data?.status === 'live') {
            interval = setInterval(fetchData, 30000);
        }

        return () => clearInterval(interval);
    }, [matchId, data?.status]);

    return { data, loading, error };
};
