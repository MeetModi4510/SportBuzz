import React, { useState } from 'react';
import { Users, Activity, ChevronLeft, User } from 'lucide-react';
import { useLocalIplSquads } from '@/hooks/cricket/useCricketSeries';
import { TeamLogo } from '@/components/TeamLogo';

export default function SeriesSquads({ season }: { season: string }) {
    const { data: squads, isLoading, error } = useLocalIplSquads(season);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Activity className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading squads...</p>
            </div>
        );
    }

    const squadEntries = squads ? Object.entries(squads) : [];

    if (error || !squads || squadEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Squads Found</h3>
                <p className="text-muted-foreground">Squad information is not available.</p>
            </div>
        );
    }

    if (selectedTeam) {
        const teamPlayers = squads[selectedTeam] as string[];
        
        // Helper to mock player roles since local data only has names
        const getPlayerRole = (name: string) => {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('kock') || lowerName.includes('rickelton') || lowerName.includes('kisan') || lowerName.includes('pant') || lowerName.includes('rahul') || lowerName.includes('samson') || lowerName.includes('dhoni') || lowerName.includes('karthik') || lowerName.includes('saha') || lowerName.includes('baarstow') || lowerName.includes('buttler') || lowerName.includes('klassen') || lowerName.includes('poor') || lowerName.includes('gurbaz') || lowerName.includes('salt')) return 'Wicket Keeper';
            if (lowerName.includes('sharma') || lowerName.includes('yadav') || lowerName.includes('varma') || lowerName.includes('kohli') || lowerName.includes('gill') || lowerName.includes('iyer') || lowerName.includes('jaiswal') || lowerName.includes('gaikwad') || lowerName.includes('sudharsan') || lowerName.includes('agarwal') || lowerName.includes('faf') || lowerName.includes('dhir') || lowerName.includes('rutherford') || lowerName.includes('malewar')) return 'Batsman';
            if (lowerName.includes('bumrah') || lowerName.includes('chahar') || lowerName.includes('boult') || lowerName.includes('siraj') || lowerName.includes('shami') || lowerName.includes('natarajan') || lowerName.includes('bhuvi') || lowerName.includes('kuldeep') || lowerName.includes('chahal') || lowerName.includes('rashid') || lowerName.includes('nortje') || lowerName.includes('rabada') || lowerName.includes('starc') || lowerName.includes('cummins') || lowerName.includes('sharma') || lowerName.includes('markande') || lowerName.includes('ghazanfar') || lowerName.includes('sharma')) return 'Bowler';
            if (lowerName.includes('pandya') || lowerName.includes('santner') || lowerName.includes('jacks') || lowerName.includes('jadeja') || lowerName.includes('axar') || lowerName.includes('maxwell') || lowerName.includes('russell') || lowerName.includes('narine') || lowerName.includes('stoinis') || lowerName.includes('marsh') || lowerName.includes('green') || lowerName.includes('curran') || lowerName.includes('thakur') || lowerName.includes('bosch')) return 'All Rounder';
            
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const mod = Math.abs(hash) % 100;
            if (mod < 40) return 'Batsman';
            if (mod < 75) return 'Bowler';
            if (mod < 90) return 'All Rounder';
            return 'Wicket Keeper';
        };

        const groupedPlayers = {
            'Batsman': [] as string[],
            'All Rounder': [] as string[],
            'Wicket Keeper': [] as string[],
            'Bowler': [] as string[]
        };

        teamPlayers.forEach(player => {
            groupedPlayers[getPlayerRole(player)].push(player);
        });

        const roleOrder = ['Batsman', 'All Rounder', 'Wicket Keeper', 'Bowler'] as const;

        return (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedTeam(null)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="flex items-center gap-4">
                        <TeamLogo logo="" name={selectedTeam} size="md" className="w-16 h-16 drop-shadow-md" />
                        <h2 className="text-2xl font-black tracking-tight">{selectedTeam}</h2>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    {roleOrder.map(role => {
                        const players = groupedPlayers[role];
                        if (players.length === 0) return null;
                        
                        return (
                            <div key={role} className="flex flex-col gap-4">
                                <h3 className="text-lg font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                                    {role}s <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full ml-2">{players.length}</span>
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {players.map((player, idx) => (
                                        <div key={idx} className="bg-card hover:bg-card/80 transition-all border border-border rounded-xl p-5 flex flex-col items-center gap-3 text-center group cursor-pointer shadow-sm hover:shadow-md hover:border-primary/30">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors overflow-hidden">
                                                <User className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                                            </div>
                                            <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{player}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {squadEntries.map(([teamName, players], index) => (
                <div 
                    key={index} 
                    onClick={() => setSelectedTeam(teamName)}
                    className="bg-card hover:bg-card/80 transition-all border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer group shadow-sm hover:shadow-md hover:border-primary/50 text-center"
                >
                    <TeamLogo logo="" name={teamName} size="lg" className="w-24 h-24 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-2">{teamName}</h4>
                    <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border/50">
                        {(players as string[]).length} Players
                    </div>
                </div>
            ))}
        </div>
    );
}
