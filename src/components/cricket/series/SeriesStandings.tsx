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
        <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[2rem] p-4 sm:p-6 shadow-2xl relative animate-in fade-in duration-700">
            <div className="overflow-x-auto pb-2">
                <div className="min-w-[750px]">
                    {/* Minimalist Header */}
                    <div className="grid grid-cols-[3rem_minmax(200px,1fr)_3rem_3rem_3rem_3rem_5rem_4rem] gap-4 px-6 py-4 border-b border-white/[0.05] mb-2 items-center">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">Pos</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Franchise</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">P</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">W</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">L</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">T/NR</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Net RR</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Pts</div>
                    </div>

                    {/* Standings Rows */}
                    <div className="flex flex-col gap-1">
                        {standings.map((team: any, index: number) => {
                            const isTop4 = index < 4;
                            const nr = team.noResult !== undefined ? team.noResult : team.nr;
                            const tnr = team.tied + nr;
                            
                            return (
                                <div key={index} className="relative grid grid-cols-[3rem_minmax(200px,1fr)_3rem_3rem_3rem_3rem_5rem_4rem] gap-4 px-6 py-4 items-center group hover:bg-white/[0.02] transition-colors rounded-[1rem] border border-transparent hover:border-white/[0.02]">
                                    
                                    {/* Qualification Indicator */}
                                    {isTop4 && <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)] opacity-80 group-hover:opacity-100 transition-opacity"></div>}

                                    {/* Rank */}
                                    <div className={cn("text-xl font-black text-center tabular-nums tracking-tighter", isTop4 ? "text-primary" : "text-white/40")}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>

                                    {/* Team */}
                                    <div className="flex items-center gap-5">
                                        <TeamLogo season={season} logo="" name={team.teamName || team.team} size="sm" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-xl" />
                                        <span className="text-base sm:text-lg font-bold text-white/90 tracking-wide truncate">{team.teamName || team.team}</span>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-center font-mono font-medium text-white/50 text-sm">{team.matches}</div>
                                    <div className="text-center font-mono font-bold text-emerald-400 text-sm">{team.won}</div>
                                    <div className="text-center font-mono font-bold text-red-400 text-sm">{team.lost}</div>
                                    <div className="text-center font-mono font-medium text-white/30 text-sm">{tnr > 0 ? tnr : '-'}</div>

                                    {/* NRR */}
                                    <div className={cn("text-right font-mono text-sm font-medium tracking-tight", parseFloat(team.nrr) >= 0 ? "text-emerald-400/80" : "text-red-400/80")}>
                                        {parseFloat(team.nrr) > 0 ? '+' : ''}{team.nrr}
                                    </div>

                                    {/* Points */}
                                    <div className={cn("text-right text-3xl font-black tabular-nums tracking-tighter", isTop4 ? "text-white" : "text-white/70")}>
                                        {team.points}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
