import { useState, useEffect, useRef, useCallback } from 'react';
import { cricketApi } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
export type FieldType = 'matchInfo' | 'commentary' | 'cbScorecard' | 'cbSquads' | 'cbCommentary';

interface CacheEntry {
    data: any;
    timestamp: number;
}

interface FieldDataResult {
    data: any | null;
    loading: boolean;
    error: string | null;
}

// ── Cache (module-level, survives across component mounts) ─────────────────────
// Keyed by "matchId:field"
const fieldCache = new Map<string, CacheEntry>();

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms

function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
/**
 * Lazy-loading hook with 10-minute TTL cache for match detail fields.
 *
 * @param matchId  - The cricket match ID (e.g. "cricket-xxxxx")
 * @param field    - Which data to fetch: 'matchInfo' (summary/lineups/scoreboard)
 *                   or 'commentary' (currentMatches endpoint)
 * @param enabled  - true when the relevant tab is active; false to skip fetch
 */
export function useMatchFieldData(
    matchId: string | undefined,
    field: FieldType,
    enabled: boolean
): FieldDataResult {
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        if (!matchId) return;

        const cacheKey = `${matchId}:${field}`;

        // Check cache first
        const cached = fieldCache.get(cacheKey);
        if (isCacheValid(cached)) {
            setData(cached.data);
            setLoading(false);
            setError(null);
            return;
        }

        // Fetch from API
        setLoading(true);
        setError(null);

        // Abort any previous in-flight request for this field
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            let result: any = null;
            const cleanId = matchId.startsWith('cricket-')
                ? matchId.replace('cricket-', '')
                : matchId;

            if (field === 'matchInfo') {
                // match_info endpoint — serves Summary, Lineups, Scoreboard
                const response = await cricketApi.getMatchInfo(cleanId);
                result = response?.data || response;
            } else if (field === 'commentary') {
                // currentMatches endpoint — serves Commentary (bpiList)
                const response = await cricketApi.getCurrentMatches();
                // Find this specific match in the response list
                const matches = response?.data || [];
                result = matches.find?.(
                    (m: any) => m.id === cleanId || m.id === matchId
                ) || null;
            } else if (field === 'cbScorecard') {
                // Cricbuzz scorecard via backend proxy
                const response = await cricketApi.getCricbuzzScorecard(cleanId);
                result = response?.data || null;
            } else if (field === 'cbSquads') {
                // Cricbuzz squads (extracted from scorecard)
                const response = await cricketApi.getCricbuzzSquads(cleanId);
                result = response?.data || null;
            } else if (field === 'cbCommentary') {
                // Cricbuzz highlight commentary
                const response = await cricketApi.getCricbuzzCommentary(cleanId);
                result = response?.data || null;
            }

            // Only update if this request wasn't aborted
            if (!controller.signal.aborted) {
                if (result) {
                    fieldCache.set(cacheKey, { data: result, timestamp: Date.now() });
                    setData(result);
                } else {
                    setError('No data found');
                }
                setLoading(false);
            }
        } catch (err: any) {
            if (!controller.signal.aborted) {
                console.error(`[useMatchFieldData] ${field} fetch error:`, err);
                setError(err.message || 'Failed to fetch data');
                setLoading(false);
            }
        }
    }, [matchId, field]);

    useEffect(() => {
        if (!enabled || !matchId) {
            return;
        }

        // On activation: check cache, else fetch
        const cacheKey = `${matchId}:${field}`;
        const cached = fieldCache.get(cacheKey);
        if (isCacheValid(cached)) {
            setData(cached.data);
            setLoading(false);
            setError(null);
        } else {
            fetchData();
        }

        // Cleanup: abort in-flight requests on unmount (dashboard navigation)
        return () => {
            abortRef.current?.abort();
        };
    }, [enabled, matchId, field, fetchData]);

    return { data, loading, error };
}
