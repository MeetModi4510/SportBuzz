import React from 'react';
import { Trophy, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalIplStandings } from '@/hooks/cricket/useCricketSeries';
import { TeamLogo } from '@/components/TeamLogo';

export default function SeriesStandings({ season }: { season: string }) {
    const { data: standings, isLoading, error } = useLocalIplStandings(season);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Activity className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading standings...</p>
            </div>
        );
    }

    if (error || !standings || standings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Standings Available</h3>
                <p className="text-muted-foreground">The points table is not available for this series.</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Team</th>
                            <th className="px-4 py-4 text-center">M</th>
                            <th className="px-4 py-4 text-center text-emerald-500">W</th>
                            <th className="px-4 py-4 text-center text-red-500">L</th>
                            <th className="px-4 py-4 text-center">T</th>
                            <th className="px-4 py-4 text-center">NR</th>
                            <th className="px-4 py-4 text-center font-bold text-primary">Pts</th>
                            <th className="px-6 py-4 text-right">NRR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {standings.map((team: any, index: number) => (
                            <tr key={index} className={cn("hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0", index < 4 ? "bg-primary/5" : "")}>
                                <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                                    <div className="flex items-center gap-4">
                                        <span className={cn("w-6 text-center text-xs font-black", index < 4 ? "text-primary" : "text-muted-foreground")}>{index + 1}</span>
                                        <TeamLogo logo="" name={team.teamName || team.team} size="sm" className="w-10 h-10 shadow-none drop-shadow-md" />
                                        <span className="tracking-tight text-base">{team.teamName || team.team}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.matches}</td>
                                <td className="px-4 py-4 text-center font-bold text-emerald-500">{team.won}</td>
                                <td className="px-4 py-4 text-center font-bold text-red-500">{team.lost}</td>
                                <td className="px-4 py-4 text-center text-muted-foreground">{team.tied}</td>
                                <td className="px-4 py-4 text-center text-muted-foreground">{team.noResult !== undefined ? team.noResult : team.nr}</td>
                                <td className="px-4 py-4 text-center font-black text-primary text-base">{team.points}</td>
                                <td className={cn("px-6 py-4 text-right font-mono font-medium", parseFloat(team.nrr) >= 0 ? "text-emerald-500" : "text-red-500")}>
                                    {parseFloat(team.nrr) > 0 ? '+' : ''}{team.nrr}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
