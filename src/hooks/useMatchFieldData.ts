import { useState, useEffect, useRef, useCallback } from 'react';
import { cricketApi } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
export type FieldType = 'matchInfo' | 'commentary' | 'cbScorecard' | 'cbSquads' | 'cbCommentary' | 'cbFullCommentary';

interface CacheEntry {
    data: any;
    timestamp: number;
}

interface FieldDataResult {
    data: any | null;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null; // epoch ms — for "Updated X ago" display
}

// ── Cache (module-level, survives across component mounts) ─────────────────────
// Keyed by "matchId:field" or "matchId:field:slug"
const fieldCache = new Map<string, CacheEntry>();

// ── Per-field TTL ──────────────────────────────────────────────────────────────
// Volatile (live data) → 60 s | Stable (static info) → 30 min
const FIELD_TTL: Record<FieldType, number> = {
    matchInfo:          30 * 60 * 1000, // 30 min — not volatile
    cbSquads:           30 * 60 * 1000, // 30 min — not volatile
    commentary:              60 * 1000, // 1 min — live
    cbScorecard:             60 * 1000, // 1 min — live
    cbCommentary:            60 * 1000, // 1 min — live
    cbFullCommentary:        60 * 1000, // 1 min — live
};

function isCacheValid(entry: CacheEntry | undefined, ttl: number): entry is CacheEntry {
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttl;
}

function getCacheKey(matchId: string, field: FieldType, slug?: string): string {
    return field === 'cbScorecard' && slug
        ? `${matchId}:${field}:${slug}`
        : `${matchId}:${field}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
/**
 * Lazy-loading hook with per-field TTL cache for match detail fields.
 *
 * TTLs:
 *   - Scorecard / Commentary / Overs (volatile): 60 s
 *   - Match Info / Squads (stable):              30 min
 *
 * Auto-refresh: while `enabled=true`, the hook schedules a setTimeout to
 * re-fetch once the current TTL expires. The timer is cleared when the user
 * navigates away (`enabled` becomes false) or the component unmounts.
 *
 * @param matchId  - The cricket match ID (e.g. "cricket-xxxxx" or raw numeric id)
 * @param field    - Which data to fetch
 * @param enabled  - true when the relevant tab is active; false to skip fetch
 * @param slug     - Optional slug (used for cbScorecard cache key differentiation)
 */
export function useMatchFieldData(
    matchId: string | undefined,
    field: FieldType,
    enabled: boolean,
    slug?: string
): FieldDataResult {
    const [data, setData]               = useState<any | null>(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const abortRef      = useRef<AbortController | null>(null);
    const prevMatchRef  = useRef<string | undefined>(undefined);
    const autoRefreshId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchData = useCallback(async (bypassCache = false) => {
        if (!matchId) return;

        const cacheKey = getCacheKey(matchId, field, slug);
        const ttl      = FIELD_TTL[field];

        // Check cache unless caller explicitly bypasses (auto-refresh timer)
        if (!bypassCache) {
            const cached = fieldCache.get(cacheKey);
            if (isCacheValid(cached, ttl)) {
                setData(cached.data);
                setLastUpdated(cached.timestamp);
                setLoading(false);
                setError(null);
                return;
            }
        }

        // Abort any previous in-flight request for this field
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        // When bypassCache=true (timer-triggered refresh), pass force=true to also
        // bypass the backend NodeCache — otherwise we'd get the same old data back
        const force = bypassCache;

        try {
            let result: any = null;
            const cleanId = matchId.startsWith('cricket-')
                ? matchId.replace('cricket-', '')
                : matchId;

            if (field === 'matchInfo') {
                const response = await cricketApi.getMatchInfo(cleanId);
                result = response?.data || response;
            } else if (field === 'commentary') {
                const response = await cricketApi.getCricbuzzCommentary(cleanId, force);
                result = response?.data || null;
            } else if (field === 'cbScorecard') {
                const response = await cricketApi.getCricbuzzScorecard(cleanId, slug, force);
                result = response?.data || null;
            } else if (field === 'cbSquads') {
                const response = await cricketApi.getCricbuzzSquads(cleanId);
                result = response?.data || null;
            } else if (field === 'cbCommentary') {
                const response = await cricketApi.getCricbuzzCommentary(cleanId, force);
                result = response?.data || null;
            } else if (field === 'cbFullCommentary') {
                const response = await cricketApi.getCricbuzzFullCommentary(cleanId, slug, force);
                result = response?.data || null;
            }

            if (!controller.signal.aborted) {
                if (result) {
                    const ts = Date.now();
                    fieldCache.set(cacheKey, { data: result, timestamp: ts });
                    setData(result);
                    setLastUpdated(ts);
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
    }, [matchId, field, slug]);

    // ── Auto-refresh scheduler ────────────────────────────────────────────────
    const scheduleAutoRefresh = useCallback(() => {
        // Clear any existing timer
        if (autoRefreshId.current !== null) {
            clearTimeout(autoRefreshId.current);
            autoRefreshId.current = null;
        }

        const ttl = FIELD_TTL[field];
        autoRefreshId.current = setTimeout(async () => {
            // Only refresh if still enabled (user is still on this tab)
            await fetchData(true); // bypass cache — forced fresh fetch
            scheduleAutoRefresh(); // reschedule for the next cycle
        }, ttl);
    }, [field, fetchData]);

    // ── Reset on matchId change ───────────────────────────────────────────────
    useEffect(() => {
        if (prevMatchRef.current !== matchId) {
            prevMatchRef.current = matchId;
            setData(null);
            setError(null);
            setLastUpdated(null);
            abortRef.current?.abort();
            if (autoRefreshId.current !== null) {
                clearTimeout(autoRefreshId.current);
                autoRefreshId.current = null;
            }
        }
    }, [matchId]);

    // ── Main effect: activate / deactivate ───────────────────────────────────
    useEffect(() => {
        if (!enabled || !matchId) {
            // User navigated away — stop the auto-refresh timer
            if (autoRefreshId.current !== null) {
                clearTimeout(autoRefreshId.current);
                autoRefreshId.current = null;
            }
            return;
        }

        // On activation: serve from cache if still valid, else fetch fresh
        const cacheKey = getCacheKey(matchId, field, slug);
        const ttl      = FIELD_TTL[field];
        const cached   = fieldCache.get(cacheKey);

        if (isCacheValid(cached, ttl)) {
            setData(cached.data);
            setLastUpdated(cached.timestamp);
            setLoading(false);
            setError(null);
            // Schedule refresh for when this cache entry expires
            const remaining = ttl - (Date.now() - cached.timestamp);
            autoRefreshId.current = setTimeout(async () => {
                await fetchData(true);
                scheduleAutoRefresh();
            }, remaining);
        } else {
            fetchData().then(() => scheduleAutoRefresh());
        }

        return () => {
            // Cleanup on unmount or when enabled → false
            abortRef.current?.abort();
            if (autoRefreshId.current !== null) {
                clearTimeout(autoRefreshId.current);
                autoRefreshId.current = null;
            }
        };
    }, [enabled, matchId, field, slug, fetchData, scheduleAutoRefresh]);

    return { data, loading, error, lastUpdated };
}
