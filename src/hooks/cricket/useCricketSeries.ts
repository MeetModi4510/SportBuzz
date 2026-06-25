import { useQuery } from '@tanstack/react-query';
import { cricketApi } from '@/services/api';

export function useIplSeasons() {
    return useQuery({
        queryKey: ['ipl-seasons'],
        queryFn: async () => {
            const res = await cricketApi.getIplSeasons() as any;
            if (res.status === 'success') {
                return res.data;
            }
            throw new Error(res.message || 'Failed to fetch IPL seasons');
        },
        staleTime: 24 * 60 * 60 * 1000 // 24 hours
    });
}

export function useSeriesMatches(id: string, slug: string) {
    return useQuery({
        queryKey: ['series-matches', id, slug],
        queryFn: async () => {
            if (!id || !slug) return null;
            const res = await cricketApi.getSeriesMatches(id, slug) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!id && !!slug,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useSeriesStandings(id: string, slug: string) {
    return useQuery({
        queryKey: ['series-standings', id, slug],
        queryFn: async () => {
            if (!id || !slug) return null;
            const res = await cricketApi.getSeriesStandings(id, slug) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!id && !!slug,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useSeriesSquads(id: string, slug: string) {
    return useQuery({
        queryKey: ['series-squads', id, slug],
        queryFn: async () => {
            if (!id || !slug) return null;
            const res = await cricketApi.getSeriesSquads(id, slug) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!id && !!slug,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useSeriesStats(id: string, slug: string) {
    return useQuery({
        queryKey: ['series-stats', id, slug],
        queryFn: async () => {
            if (!id || !slug) return null;
            const res = await cricketApi.getSeriesStats(id, slug) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!id && !!slug,
        staleTime: 12 * 60 * 60 * 1000
    });
}

// ====== LOCAL IPL HOOKS ======

export function useLocalIplSeasons() {
    return useQuery({
        queryKey: ['local-ipl-seasons'],
        queryFn: async () => {
            const res = await cricketApi.getLocalIplSeasons() as any;
            if (res.status === 'success') {
                return res.data;
            }
            throw new Error(res.message || 'Failed to fetch local IPL seasons');
        },
        staleTime: 24 * 60 * 60 * 1000
    });
}

export function useLocalIplMatches(season: string) {
    return useQuery({
        queryKey: ['local-ipl-matches', season],
        queryFn: async () => {
            if (!season) return null;
            const res = await cricketApi.getLocalIplMatches(season) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!season,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useLocalIplStandings(season: string) {
    return useQuery({
        queryKey: ['local-ipl-standings', season],
        queryFn: async () => {
            if (!season) return null;
            const res = await cricketApi.getLocalIplStandings(season) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!season,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useLocalIplSquads(season: string) {
    return useQuery({
        queryKey: ['local-ipl-squads', season],
        queryFn: async () => {
            if (!season) return null;
            const res = await cricketApi.getLocalIplSquads(season) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!season,
        staleTime: 12 * 60 * 60 * 1000
    });
}

export function useLocalIplStats(season: string) {
    return useQuery({
        queryKey: ['local-ipl-stats', season],
        queryFn: async () => {
            if (!season) return null;
            const res = await cricketApi.getLocalIplStats(season) as any;
            if (res.status === 'success') return res.data;
            throw new Error(res.message);
        },
        enabled: !!season,
        staleTime: 12 * 60 * 60 * 1000
    });
}
