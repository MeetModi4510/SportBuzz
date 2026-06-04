import { useQuery } from "@tanstack/react-query";
import { cricketApi } from "../services/api";
import { Match } from "../data/types";

// PROMPT 2: Frontend auto-refresh = 12 minutes (720,000ms), aligned to backend cache TTL of 720s
const REFRESH_INTERVAL_MS = 720_000; // 12 minutes

export function useFeaturedCricketMatches() {
    return useQuery({
        queryKey: ['cricket', 'matches', 'featured'],
        queryFn: async (): Promise<{ test: Match[], odi: Match[], t20: Match[] }> => {
            console.log("[DEBUG] useFeaturedCricketMatches: Fetching matches...");
            try {
                const matches = await cricketApi.getFeaturedMatches();
                console.log("[DEBUG] useFeaturedCricketMatches: Received matches:", matches);
                return matches || { test: [], odi: [], t20: [] };
            } catch (error) {
                console.error("[DEBUG] useFeaturedCricketMatches: Error fetching:", error);
                return { test: [], odi: [], t20: [] };
            }
        },
        // PROMPT 2: True 12-minute cycle — frontend refresh aligned to backend cache TTL
        refetchInterval: REFRESH_INTERVAL_MS,
        // staleTime slightly less than TTL so we never serve overly stale data
        staleTime: REFRESH_INTERVAL_MS - 30_000, // 11m 30s
        retry: 1,
    });
}
