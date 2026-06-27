import React, { useState, useMemo } from 'react';
import { BarChart, Activity, Users, Trophy, Award, ChevronRight, Target } from 'lucide-react';
import { useLocalIplStats, useLocalIplSquads } from '@/hooks/cricket/useCricketSeries';
import { cn } from '@/lib/utils';

const TEAM_STYLES: Record<string, { logo: string, color: string, glow: string }> = {
    'Chennai Super Kings': {
        logo: '/flags/ipl_2026/csk.png',
        color: 'text-yellow-400', glow: 'bg-yellow-500'
    },
    'Mumbai Indians': {
        logo: '/flags/ipl_2026/mi.png',
        color: 'text-blue-500', glow: 'bg-blue-600'
    },
    'Royal Challengers Bangalore': {
        logo: '/flags/ipl_2026/rcb.png',
        color: 'text-red-500', glow: 'bg-red-600'
    },
    'Royal Challengers Bengaluru': {
        logo: '/flags/ipl_2026/rcb.png',
        color: 'text-red-500', glow: 'bg-red-600'
    },
    'Rajasthan Royals': {
        logo: '/flags/ipl_2026/rr.png',
        color: 'text-pink-500', glow: 'bg-pink-600'
    },
    'Delhi Capitals': {
        logo: '/flags/ipl_2026/dc.png',
        color: 'text-blue-400', glow: 'bg-blue-500'
    },
    'Delhi Daredevils': {
        logo: '/flags/ipl_2026/dd.png',
        color: 'text-red-600', glow: 'bg-red-600'
    },
    'Kings XI Punjab': {
        logo: '/flags/ipl_2026/kxip.png',
        color: 'text-red-500', glow: 'bg-red-600'
    },
    'Punjab Kings': {
        logo: '/flags/ipl_2026/pbks.png',
        color: 'text-red-500', glow: 'bg-red-600'
    },
    'Kolkata Knight Riders': {
        logo: '/flags/ipl_2026/kkr.png',
        color: 'text-purple-500', glow: 'bg-purple-600'
    },
    'Sunrisers Hyderabad': {
        logo: '/flags/ipl_2026/srh.png',
        color: 'text-orange-500', glow: 'bg-orange-600'
    },
    'Deccan Chargers': {
        logo: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Deccan_Chargers_Logo.svg',
        color: 'text-blue-300', glow: 'bg-blue-400'
    },
    'Gujarat Titans': {
        logo: '/flags/ipl_2026/gt.png',
        color: 'text-slate-300', glow: 'bg-slate-400'
    },
    'Lucknow Super Giants': {
        logo: '/flags/ipl_2026/lsg.png',
        color: 'text-cyan-400', glow: 'bg-cyan-500'
    },
    'Pune Warriors': {
        logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Pune_Warriors_India_Logo.svg',
        color: 'text-slate-400', glow: 'bg-slate-500'
    },
    'Rising Pune Supergiant': {
        logo: '/flags/ipl_2026/rps.png',
        color: 'text-fuchsia-400', glow: 'bg-fuchsia-500'
    },
    'Rising Pune Supergiants': {
        logo: '/flags/ipl_2026/rps.png',
        color: 'text-fuchsia-400', glow: 'bg-fuchsia-500'
    },
    'Gujarat Lions': {
        logo: '/flags/ipl_2026/gl.png',
        color: 'text-orange-400', glow: 'bg-orange-500'
    },
    'Kochi Tuskers Kerala': {
        logo: 'https://upload.wikimedia.org/wikipedia/en/9/91/Kochi_Tuskers_Kerala_Logo.svg',
        color: 'text-purple-400', glow: 'bg-purple-500'
    }
};

const DEFAULT_STYLE = {
    logo: '/flags/ipl_2026/rcb.png', // Fallback to a known local logo if default fails
    color: 'text-primary', glow: 'bg-primary'
};

export default function SeriesStats({ season }: { season: string }) {
    const { data: stats, isLoading: isStatsLoading, error: statsError } = useLocalIplStats(season);
    const { data: squads, isLoading: isSquadsLoading } = useLocalIplSquads(season);
    
    const [viewMode, setViewMode] = useState<'tournament' | 'teams'>('teams');

    const isLoading = isStatsLoading || isSquadsLoading;

    // Build player-to-team map
    const playerToTeamMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!squads) return map;
        Object.entries(squads).forEach(([teamName, players]) => {
            (players as string[]).forEach(player => {
                map.set(player.trim(), teamName);
            });
        });
        return map;
    }, [squads]);

    // Group stats by team
    const teamStats = useMemo(() => {
        if (!stats || (!stats.topRunScorers && !stats.topWicketTakers)) return {};
        
        const teamsData: Record<string, { runs: any[], wickets: any[] }> = {};
        
        const addPlayer = (player: any, type: 'runs' | 'wickets') => {
            const name = (player.name || player.player || '').trim();
            let team = playerToTeamMap.get(name);
            if (!team) {
                const lastName = name.split(' ').pop();
                if (lastName) {
                   for (const [squadName, teamName] of Array.from(playerToTeamMap.entries())) {
                       if (squadName.includes(lastName)) {
                           team = teamName;
                           break;
                       }
                   }
                }
            }
            team = team || 'Other';
            
            if (!teamsData[team]) teamsData[team] = { runs: [], wickets: [] };
            teamsData[team][type].push(player);
        };

        if (stats.topRunScorers) stats.topRunScorers.forEach((p: any) => addPlayer(p, 'runs'));
        if (stats.topWicketTakers) stats.topWicketTakers.forEach((p: any) => addPlayer(p, 'wickets'));

        return teamsData;
    }, [stats, playerToTeamMap]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse scale-150"></div>
                    <Activity className="w-10 h-10 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground animate-pulse uppercase">Compiling Data</p>
            </div>
        );
    }

    if (statsError || !stats || (stats.topRunScorers.length === 0 && stats.topWicketTakers.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-[#0A0A0A] rounded-[2rem] border border-white/[0.03]">
                <BarChart className="w-12 h-12 text-white/20 mb-6" />
                <h3 className="text-xl font-medium text-white mb-2">Data Unavailable</h3>
                <p className="text-white/40 text-sm">Statistics for this series are currently not found in the database.</p>
            </div>
        );
    }

    const renderPremiumPlayerRow = (player: any, index: number, isRuns: boolean, maxVal: number) => {
        const val = isRuns ? parseInt(player.runs) : parseInt(player.wickets);
        const percent = Math.min((val / (maxVal || 1)) * 100, 100);
        const isTop3 = index < 3;
        const rankClass = index === 0 ? 'text-yellow-500 font-black' : 
                          index === 1 ? 'text-slate-300 font-bold' : 
                          index === 2 ? 'text-amber-600 font-bold' : 
                          'text-white/30 font-medium';

        return (
            <div key={index} className="group relative flex flex-col py-3.5 hover:bg-white/[0.02] -mx-4 px-4 rounded-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-5 text-sm shrink-0 text-center", rankClass)}>
                            {index + 1}
                        </div>
                        <div>
                            <h4 className="font-medium text-white/90 text-sm tracking-wide group-hover:text-white transition-colors">
                                {player.name || player.player}
                            </h4>
                            <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
                                {player.balls || player.matches} {player.balls || player.ballsBowled ? (isRuns ? 'Balls' : 'Overs') : 'Matches'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end flex-col justify-center">
                        <span className={cn(
                            "text-lg font-black tracking-tighter tabular-nums",
                            isRuns ? "text-primary" : "text-emerald-500"
                        )}>
                            {val}
                        </span>
                    </div>
                </div>
                {/* Data Visualization Bar */}
                <div className="w-full h-[3px] bg-white/[0.03] rounded-full overflow-hidden ml-9 max-w-[calc(100%-2.25rem)]">
                    <div 
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", isRuns ? "bg-primary" : "bg-emerald-500")}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Minimalist Tab Toggle */}
            <div className="flex justify-center md:justify-end">
                <div className="inline-flex bg-[#0A0A0A] border border-white/[0.05] rounded-full p-1 shadow-2xl">
                    <button
                        onClick={() => setViewMode('tournament')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300",
                            viewMode === 'tournament' 
                                ? "bg-white/10 text-white shadow-sm" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Trophy size={16} className={viewMode === 'tournament' ? "text-primary" : ""} />
                        Tournament Leaders
                    </button>
                    <button
                        onClick={() => setViewMode('teams')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300",
                            viewMode === 'teams' 
                                ? "bg-white/10 text-white shadow-sm" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Users size={16} className={viewMode === 'teams' ? "text-primary" : ""} />
                        Team Breakdown
                    </button>
                </div>
            </div>

            {viewMode === 'tournament' ? (
                /* TOURNAMENT VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Overall Batting */}
                    <div className="bg-[#0D0D0D] border border-white/[0.05] rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <BarChart size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white tracking-tight">Orange Cap</h3>
                                <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-0.5">Top Run Scorers</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {(() => {
                                const maxR = Math.max(...stats.topRunScorers.slice(0, 10).map((p: any) => parseInt(p.runs) || 0), 1);
                                return stats.topRunScorers.slice(0, 10).map((p: any, i: number) => renderPremiumPlayerRow(p, i, true, maxR));
                            })()}
                        </div>
                    </div>
                    
                    {/* Overall Bowling */}
                    <div className="bg-[#0D0D0D] border border-white/[0.05] rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white tracking-tight">Purple Cap</h3>
                                <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-0.5">Top Wicket Takers</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {(() => {
                                const maxW = Math.max(...stats.topWicketTakers.slice(0, 10).map((p: any) => parseInt(p.wickets) || 0), 1);
                                return stats.topWicketTakers.slice(0, 10).map((p: any, i: number) => renderPremiumPlayerRow(p, i, false, maxW));
                            })()}
                        </div>
                    </div>
                </div>
            ) : (
                /* TEAMS VIEW */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {Object.entries(teamStats)
                        .filter(([teamName]) => teamName !== 'Other' || (teamStats[teamName].runs.length > 0 || teamStats[teamName].wickets.length > 0))
                        .sort(([teamA], [teamB]) => teamA.localeCompare(teamB))
                        .map(([teamName, { runs, wickets }]) => {
                            const style = TEAM_STYLES[teamName] || DEFAULT_STYLE;
                            const maxTeamRuns = Math.max(...runs.slice(0, 5).map((r: any) => parseInt(r.runs) || 0), 1);
                            const maxTeamWickets = Math.max(...wickets.slice(0, 5).map((w: any) => parseInt(w.wickets) || 0), 1);
                            
                            return (
                                <div key={teamName} className="relative bg-[#0D0D0D] border border-white/[0.03] hover:border-white/[0.08] rounded-[2rem] p-8 shadow-2xl transition-colors duration-500 overflow-hidden group">
                                    <div className="relative h-36 sm:h-44 bg-gradient-to-r from-black/80 to-transparent rounded-[1.5rem] overflow-hidden flex items-center px-6 sm:px-10 border border-white/[0.05] mb-6">
                                        {/* Giant Logo Watermark */}
                                        <div className="absolute -right-10 -top-20 w-80 h-80 opacity-5 pointer-events-none transform -rotate-12 transition-transform duration-1000 group-hover:scale-110">
                                            <img src={style.logo} alt="" className="w-full h-full object-contain filter grayscale" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                        
                                        {/* Ambient Team Color Glow */}
                                        <div className={cn("absolute left-0 top-0 w-64 h-full blur-[80px] opacity-20 pointer-events-none", style.glow)}></div>

                                        <div className="flex items-center gap-6 sm:gap-8 relative z-10 w-full">
                                            <div className="w-20 h-20 sm:w-24 sm:h-28 shrink-0 drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-500">
                                                <img src={style.logo} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_STYLE.logo; }} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={cn("text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter drop-shadow-lg leading-[1.1]", style.color)}>
                                                    {teamName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                                    <div className={cn("w-2 h-2 rounded-full animate-pulse", style.glow)}></div>
                                                    <span className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                                                        Season Analytics
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Visualization Dashboard */}
                                    <div className="flex flex-col md:flex-row xl:flex-col 2xl:flex-row gap-6 relative z-10">
                                        {/* Batting Bento */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Activity size={18} className="text-primary" />
                                                <h4 className="text-primary text-xs sm:text-sm font-black uppercase tracking-[0.2em]">Top Batters</h4>
                                            </div>
                                            
                                            {runs.length > 0 ? (
                                                <div className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Hero Block (Rank 1) */}
                                                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2rem] p-6 sm:p-8 border border-primary/20 flex flex-col justify-end overflow-hidden min-h-[220px] group">
                                                            <div className="absolute -right-6 -bottom-6 text-primary opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                                                                <Activity size={180} />
                                                            </div>
                                                            <div className="absolute top-6 left-6 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                                                                <span className="text-primary font-black text-sm">1</span>
                                                            </div>
                                                            
                                                            <div className="relative z-10 mt-12">
                                                                <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-1">Star Batter</div>
                                                                <div className="text-xl sm:text-2xl font-black text-white leading-tight mb-2 truncate pr-2">{runs[0].name || runs[0].player}</div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-4xl sm:text-5xl font-black text-primary tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                                                                        {runs[0].runs}
                                                                    </span>
                                                                    <span className="text-xs text-primary/60 font-bold uppercase tracking-widest">Runs</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mid Blocks (Rank 2 & 3) */}
                                                        {runs.length > 1 && (
                                                            <div className="flex flex-col gap-4">
                                                                {runs.slice(1, 3).map((p: any, i: number) => (
                                                                    <div key={`bat-mid-${i}`} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-[1.5rem] p-5 border border-white/[0.02] flex flex-col justify-center relative overflow-hidden group">
                                                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-white/30 font-mono text-[10px] mb-1">#{i + 2}</span>
                                                                                <span className="font-bold text-white/90 text-sm sm:text-base truncate leading-tight">{p.name || p.player}</span>
                                                                            </div>
                                                                            <span className="text-xl sm:text-2xl font-black text-white tabular-nums shrink-0">{p.runs}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Low Blocks (Rank 4 & 5) */}
                                                    {runs.length > 3 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {runs.slice(3, 5).map((p: any, i: number) => (
                                                                <div key={`bat-low-${i}`} className="bg-black/40 rounded-[1.2rem] p-4 border border-white/[0.02] flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-white/20 font-mono text-xs shrink-0">#{i + 4}</span>
                                                                        <span className="font-bold text-white/70 text-sm truncate leading-tight">{p.name || p.player}</span>
                                                                    </div>
                                                                    <span className="text-lg font-black text-white/80 tabular-nums shrink-0">{p.runs}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center text-white/20 text-sm font-medium uppercase tracking-widest bg-white/[0.01] rounded-[2rem] border border-white/[0.02]">No Batting Data</div>
                                            )}
                                        </div>

                                        {/* Bowling Bento */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Target size={18} className="text-emerald-500" />
                                                <h4 className="text-emerald-500 text-xs sm:text-sm font-black uppercase tracking-[0.2em]">Top Bowlers</h4>
                                            </div>
                                            
                                            {wickets.length > 0 ? (
                                                <div className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Hero Block (Rank 1) */}
                                                        <div className="relative bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-[2rem] p-6 sm:p-8 border border-emerald-500/20 flex flex-col justify-end overflow-hidden min-h-[220px] group">
                                                            <div className="absolute -right-6 -bottom-6 text-emerald-500 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                                                                <Target size={180} />
                                                            </div>
                                                            <div className="absolute top-6 left-6 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                                                <span className="text-emerald-400 font-black text-sm">1</span>
                                                            </div>
                                                            
                                                            <div className="relative z-10 mt-12">
                                                                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-1">Star Bowler</div>
                                                                <div className="text-xl sm:text-2xl font-black text-white leading-tight mb-2 truncate pr-2">{wickets[0].name || wickets[0].player}</div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                                                        {wickets[0].wickets}
                                                                    </span>
                                                                    <span className="text-xs text-emerald-500/60 font-bold uppercase tracking-widest">Wkts</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Mid Blocks (Rank 2 & 3) */}
                                                        {wickets.length > 1 && (
                                                            <div className="flex flex-col gap-4">
                                                                {wickets.slice(1, 3).map((p: any, i: number) => (
                                                                    <div key={`bowl-mid-${i}`} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-[1.5rem] p-5 border border-white/[0.02] flex flex-col justify-center relative overflow-hidden group">
                                                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-white/30 font-mono text-[10px] mb-1">#{i + 2}</span>
                                                                                <span className="font-bold text-white/90 text-sm sm:text-base truncate leading-tight">{p.name || p.player}</span>
                                                                            </div>
                                                                            <span className="text-xl sm:text-2xl font-black text-white tabular-nums shrink-0">{p.wickets}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Low Blocks (Rank 4 & 5) */}
                                                    {wickets.length > 3 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {wickets.slice(3, 5).map((p: any, i: number) => (
                                                                <div key={`bowl-low-${i}`} className="bg-black/40 rounded-[1.2rem] p-4 border border-white/[0.02] flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="text-white/20 font-mono text-xs shrink-0">#{i + 4}</span>
                                                                        <span className="font-bold text-white/70 text-sm truncate leading-tight">{p.name || p.player}</span>
                                                                    </div>
                                                                    <span className="text-lg font-black text-white/80 tabular-nums shrink-0">{p.wickets}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center text-white/20 text-sm font-medium uppercase tracking-widest bg-white/[0.01] rounded-[2rem] border border-white/[0.02]">No Bowling Data</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            )}
        </div>
    );
}
