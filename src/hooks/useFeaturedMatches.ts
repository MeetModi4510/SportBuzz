import { useQuery } from "@tanstack/react-query";
import { cricketApi } from "../services/api";
import { Match } from "../data/types";

type CricketFormatData = { test: Match[], odi: Match[], t20: Match[] };
const EMPTY: CricketFormatData = { test: [], odi: [], t20: [] };

// ─── LIVE (always fetched on load, auto-refresh 15 min) ────────────────────────
export function useFeaturedLiveCricketMatches() {
    return useQuery<CricketFormatData>({
        queryKey: ['cricket', 'featured', 'live'],
        queryFn: async () => {
            try {
                return await cricketApi.getLiveCricketFeatured();
            } catch {
                return EMPTY;
            }
        },
        refetchInterval: 900_000,   // 15 min
        staleTime:       870_000,   // 14.5 min
        retry: 1,
    });
}

// ─── UPCOMING (lazy — only fetched when user selects filter) ───────────────────
export function useFeaturedUpcomingCricketMatches(enabled: boolean) {
    return useQuery<CricketFormatData>({
        queryKey: ['cricket', 'featured', 'upcoming'],
        queryFn: async () => {
            try {
                return await cricketApi.getUpcomingCricketFeatured();
            } catch {
                return EMPTY;
            }
        },
        enabled,
        staleTime: 1_800_000,  // 30 min — upstream cache is 30 min
        retry: 1,
    });
}

// ─── RECENT/COMPLETED (lazy — only fetched when user selects filter) ───────────
export function useFeaturedRecentCricketMatches(enabled: boolean) {
    return useQuery<CricketFormatData>({
        queryKey: ['cricket', 'featured', 'recent'],
        queryFn: async () => {
            try {
                return await cricketApi.getRecentCricketFeatured();
            } catch {
                return EMPTY;
            }
        },
        enabled,
        staleTime: 1_800_000,  // 30 min
        retry: 1,
    });
}

// ─── LEGACY: backward-compat alias ────────────────────────────────────────────
export function useFeaturedCricketMatches() {
    return useFeaturedLiveCricketMatches();
}
