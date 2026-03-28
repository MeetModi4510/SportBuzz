import { useQuery } from "@tanstack/react-query";
import { cricketApi } from "../services/api";
import { Match } from "../data/types";

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
        refetchInterval: 600000,
        staleTime: 30000,
        retry: 1,
    });
}
