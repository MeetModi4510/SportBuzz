import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.PROD ? '/api' : (import.meta.env.PROD ? '' : '') + '/api');

export interface FotmobPlayer {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    shirtNumber: string;
    positionId: number;
    rating: number | undefined;
    countryCode: string;
    verticalLayout?: { x: number; y: number; height: number; width: number; } | null;
    events?: any[];
    substitutionEvents?: any[];
}

export interface FotmobLineupTeam {
    id: number;
    name: string;
    formation: string;
    starters: FotmobPlayer[];
    subs: FotmobPlayer[];
    coach: { id: number; name: string; } | null;
}

export interface FotmobLineupData {
    homeTeam: FotmobLineupTeam;
    awayTeam: FotmobLineupTeam;
}

function mapPlayer(p: any): FotmobPlayer {
    return {
        id: p.id,
        name: p.name,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        shirtNumber: p.shirtNumber?.toString() || '?',
        positionId: p.positionId || 0,
        rating: p.performance?.rating ?? undefined,
        countryCode: p.countryCode || '',
        verticalLayout: p.verticalLayout || null,
        events: p.performance?.events || [],
        substitutionEvents: p.performance?.substitutionEvents || [],
    };
}

// In-memory cache for resolved fotmob IDs so we don't re-resolve on tab switches
const resolvedIdCache = new Map<string, string>();

export const useFotmobLineups = (
    homeTeamName: string | undefined,
    awayTeamName: string | undefined,
    isFootball: boolean = true
) => {
    const [lineupData, setLineupData] = useState<FotmobLineupData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fotmobMatchId, setFotmobMatchId] = useState<string | null>(null);
    const [matchDetails, setMatchDetails] = useState<any>(null);

    useEffect(() => {
        if (!isFootball || !homeTeamName || !awayTeamName) {
            setLoading(false);
            return;
        }

        const cacheKey = `${homeTeamName}__${awayTeamName}`;

        const fetchLineups = async () => {
            try {
                setLoading(true);
                setError(null);

                // Step 1: Resolve Fotmob match ID from team names (with in-memory cache)
                let resolvedId = resolvedIdCache.get(cacheKey);
                if (!resolvedId) {
                    console.log(`[useFotmobLineups] Resolving Fotmob ID for: ${homeTeamName} vs ${awayTeamName}`);
                    const resolveRes = await fetch(
                        `${API_URL}/football/fotmob-resolveMatchId?homeTeam=${encodeURIComponent(homeTeamName)}&awayTeam=${encodeURIComponent(awayTeamName)}`
                    );
                    const resolveJson = await resolveRes.json();
                    if (!resolveJson.success || !resolveJson.fotmobMatchId) {
                        console.warn('[useFotmobLineups] Could not resolve Fotmob match ID:', resolveJson);
                        setError('Could not find match on Fotmob');
                        return;
                    }
                    resolvedId = resolveJson.fotmobMatchId;
                    resolvedIdCache.set(cacheKey, resolvedId!);
                    console.log(`[useFotmobLineups] Resolved Fotmob ID: ${resolvedId}`);
                }

                setFotmobMatchId(resolvedId!);

                // Step 2: Fetch lineup data using the resolved Fotmob match ID
                const lineupRes = await fetch(`${API_URL}/football/fotmob-matchDetails/${resolvedId}`);
                const lineupJson = await lineupRes.json();
                
                if (lineupJson.success && lineupJson.data?.content?.lineup) {
                    setMatchDetails(lineupJson.data);
                    const lineup = lineupJson.data.content.lineup;
                    const home = lineup.homeTeam;
                    const away = lineup.awayTeam;

                    setLineupData({
                        homeTeam: {
                            id: home.id,
                            name: home.name,
                            formation: home.formation,
                            starters: (home.starters || []).map(mapPlayer),
                            subs: (home.subs || []).map(mapPlayer),
                            coach: home.coach ? { id: home.coach.id, name: home.coach.name } : null,
                        },
                        awayTeam: {
                            id: away.id,
                            name: away.name,
                            formation: away.formation,
                            starters: (away.starters || []).map(mapPlayer),
                            subs: (away.subs || []).map(mapPlayer),
                            coach: away.coach ? { id: away.coach.id, name: away.coach.name } : null,
                        }
                    });
                } else {
                    console.warn('[useFotmobLineups] Lineup data not found:', lineupJson);
                    setError('Lineup data not available');
                }
            } catch (err) {
                console.error('[useFotmobLineups] Error:', err);
                setError('Failed to load lineup');
            } finally {
                setLoading(false);
            }
        };

        fetchLineups();
    }, [homeTeamName, awayTeamName, isFootball]);

    return { lineupData, loading, error, fotmobMatchId, matchDetails };
};
