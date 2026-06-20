import { useQuery } from '@tanstack/react-query';

export interface FootballPlayer {
    id: string;
    name: string;
    age: number;
    number: string;
    position: string;
    photo: string;
}

export interface FootballTeamInfo {
    id: string;
    name: string;
    logo: string;
}

export interface FootballSquad {
    teamInfo: FootballTeamInfo;
    players: FootballPlayer[];
}

export type NationalTeamsData = Record<string, FootballSquad>;

const fetchNationalTeams = async (): Promise<NationalTeamsData> => {
    const res = await fetch('/data/national_teams_players.json');
    if (!res.ok) {
        throw new Error('Failed to fetch football squads');
    }
    return res.json();
};

export function useFootballSquads() {
    return useQuery({
        queryKey: ['footballNationalSquads'],
        queryFn: fetchNationalTeams,
        staleTime: 60 * 60 * 1000, // 1 hour caching
        refetchOnWindowFocus: false,
    });
}

export interface FotmobPlayer {
    id: number;
    name: string;
    position: string;
    photo: string;
    cname: string;
    role?: any;
}

const fetchFotmobSquad = async (countryName: string): Promise<FotmobPlayer[]> => {
    const res = await fetch(`/api/football/fotmob-squad/${encodeURIComponent(countryName)}`);
    if (!res.ok) {
        throw new Error('Failed to fetch fotmob squad');
    }
    const data = await res.json();
    return data.data;
};

export function useFotmobSquad(countryName: string) {
    return useQuery({
        queryKey: ['fotmobSquad', countryName],
        queryFn: () => fetchFotmobSquad(countryName),
        enabled: !!countryName,
        staleTime: 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: false,
    });
}

const fetchFotmobPlayerProfile = async (playerId: string | number): Promise<any> => {
    const res = await fetch(`/api/football/fotmob-player/${playerId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch fotmob player profile');
    }
    const data = await res.json();
    return data.data;
};

export function useFotmobPlayerProfile(playerId: string | number | null) {
    return useQuery({
        queryKey: ['fotmobPlayerProfile', playerId],
        queryFn: () => fetchFotmobPlayerProfile(playerId!),
        enabled: !!playerId,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours caching
        refetchOnWindowFocus: false,
    });
}
