import { useState, useEffect, useRef, useCallback } from 'react';
import { cricketApi } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
export type FieldType = 'matchInfo' | 'commentary' | 'cbScorecard' | 'cbSquads' | 'cbCommentary' | 'cbFullCommentary' | 'cbBallMap' | 'cbPartnershipGraph' | 'cbWinProbability' | 'cbOversGraph';

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
    cbBallMap:               60 * 1000, // 1 min — live
    cbPartnershipGraph:      60 * 1000, // 1 min — live
    cbWinProbability:        5 * 60 * 1000, // 5 min
    cbOversGraph:            5 * 60 * 1000, // 5 min
};

function isCacheValid(entry: CacheEntry | undefined, ttl: number): entry is CacheEntry {
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttl;
}

function getCacheKey(matchId: string, field: FieldType, slug?: string): string {
    return slug
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
    matchId?: string, 
    field: FieldType = 'matchInfo', 
    enabled: boolean = true, 
    slug?: string, 
    syncTrigger?: number,
    disableAutoRefresh: boolean = false
): FieldDataResult {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    
    const abortRef = useRef<AbortController | null>(null);
    const prevMatchRef  = useRef<string | undefined>(undefined);
    const prevSyncRef   = useRef<number | undefined>(syncTrigger);
    const autoRefreshId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchData = useCallback(async (bypassCache = false) => {
        if (!matchId) return;

        const cacheKey = getCacheKey(matchId, field, slug);
        let ttl      = FIELD_TTL[field] || 60000;
        
        // Upgrade cache to 24 hours if match is completed/upcoming
        if (disableAutoRefresh && ['cbScorecard', 'cbCommentary', 'commentary', 'cbFullCommentary', 'cbBallMap', 'cbPartnershipGraph'].includes(field)) {
            ttl = 24 * 60 * 60 * 1000;
        }

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

        // Silent refresh: don't show loading spinner if we already have data
        const hasExistingData = fieldCache.has(cacheKey) && fieldCache.get(cacheKey)?.data;
        if (!hasExistingData) {
            setLoading(true);
        }
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
            } else if (field === 'cbBallMap') {
                // For Ball Map, we use the slug parameter to pass the inningsId
                const response = await cricketApi.getBallMap(cleanId, slug || '1', force);
                result = response?.data || response;
            } else if (field === 'cbPartnershipGraph') {
                const response = await cricketApi.getPartnershipGraph(cleanId);
                result = response?.data || response;
            } else if (field === 'cbWinProbability') {
                const response = await cricketApi.getWinProbability(cleanId);
                result = response?.data || response;
            } else if (field === 'cbOversGraph') {
                const response = await cricketApi.getOversGraph(cleanId);
                result = response?.data || response;
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
                console.error(`[useMatchFieldData] Error fetching ${field}:`, err);
                if (!hasExistingData) {
                    setError(err.message || 'Failed to fetch data');
                }
                setLoading(false);
            }
        }
    }, [matchId, field, slug]);

    // ── Auto-refresh scheduler ────────────────────────────────────────────────
    const scheduleAutoRefresh = useCallback(() => {
        if (autoRefreshId.current !== null) {
            clearTimeout(autoRefreshId.current);
            autoRefreshId.current = null;
        }

        if (syncTrigger !== undefined || disableAutoRefresh) return;

        const ttl = FIELD_TTL[field] || 60000;
        autoRefreshId.current = setTimeout(async () => {
            await fetchData(true);
            scheduleAutoRefresh();
        }, ttl);
    }, [field, fetchData, syncTrigger]);

    // ── Sync with external trigger (e.g. Header refresh) ─────────────────────
    useEffect(() => {
        if (syncTrigger !== undefined && prevSyncRef.current !== syncTrigger) {
            prevSyncRef.current = syncTrigger;
            if (enabled) {
                fetchData(true);
            }
        }
    }, [syncTrigger, enabled, fetchData]);

    // ── Reset on matchId change ───────────────────────────────────────────────
    useEffect(() => {
        if (prevMatchRef.current !== matchId) {
            prevMatchRef.current = matchId;
            setData(null);
            setError(null);
            setLastUpdated(Date.now());
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
            if (autoRefreshId.current !== null) {
                clearTimeout(autoRefreshId.current);
                autoRefreshId.current = null;
            }
            return;
        }

        const cacheKey = getCacheKey(matchId, field, slug);
        let ttl      = FIELD_TTL[field] || 60000;
        
        if (disableAutoRefresh && ['cbScorecard', 'cbCommentary', 'commentary', 'cbFullCommentary', 'cbBallMap', 'cbPartnershipGraph'].includes(field)) {
            ttl = 24 * 60 * 60 * 1000;
        }
        
        const cached   = fieldCache.get(cacheKey);

        if (isCacheValid(cached, ttl)) {
            setData(cached.data);
            setLastUpdated(cached.timestamp);
            setLoading(false);
            setError(null);
            const remaining = ttl - (Date.now() - cached.timestamp);
            autoRefreshId.current = setTimeout(async () => {
                await fetchData(true);
                scheduleAutoRefresh();
            }, remaining);
        } else {
            fetchData().then(() => scheduleAutoRefresh());
        }

        return () => {
            abortRef.current?.abort();
            if (autoRefreshId.current !== null) {
                clearTimeout(autoRefreshId.current);
                autoRefreshId.current = null;
            }
        };
    }, [enabled, matchId, field, slug, fetchData, scheduleAutoRefresh]);

    return { data, loading, error, lastUpdated };
}
