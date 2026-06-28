import React, { useState, useMemo } from 'react';
import { BarChart, Activity, Users, Trophy, Award, ChevronRight, Target } from 'lucide-react';
import { useLocalIplStats, useLocalIplSquads } from '@/hooks/cricket/useCricketSeries';
import { cn } from '@/lib/utils';
import { formatPlayerName } from '@/lib/playerNames';

const PremiumCapIcon = ({ size = 36, color = "#f97316", className = "" }: { size?: number, color?: string, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0px 4px 6px ${color}40)` }}>
    {/* Button */}
    <circle cx="11" cy="3" r="1.5" fill={color} />
    
    {/* Cap Body (Dome) */}
    <path d="M3 15V11C3 6.58 6.58 3 11 3C15.42 3 19 6.58 19 11V15H3Z" fill={color} />
    
    {/* Band */}
    <path d="M3 13.5H19V15C19 15 11 15 3 15V13.5Z" fill="black" fillOpacity="0.1" />
    
    {/* Brim */}
    <path d="M11 14.5C11 14.5 15 17.5 20 17.5C22 17.5 24 16.5 24 15.5C24 14.5 19 14 15 14H11V14.5Z" fill={color} />
    <path d="M11 14.5C11 14.5 15 17.5 20 17.5C22 17.5 24 16.5 24 15.5C24 14.5 19 14 15 14H11V14.5Z" fill="black" fillOpacity="0.2" />
    
    {/* Seams */}
    <path d="M11 3V15" stroke="black" strokeOpacity="0.15" strokeWidth="1.2" />
    <path d="M7 4.5C8 8.5 8 11 8 15" stroke="black" strokeOpacity="0.15" strokeWidth="1.2" />
    <path d="M15 4.5C14 8.5 14 11 14 15" stroke="black" strokeOpacity="0.15" strokeWidth="1.2" />
  </svg>
);

const TEAM_STYLES: Record<string, { logo: string, color: string, glow: string }> = {
    'Chennai Super Kings': {
        logo: '/flags/ipl_2026/csk.png',
        color: 'text-[#F9CD05]', glow: 'bg-[#F9CD05]'
    },
    'Mumbai Indians': {
        logo: '/flags/ipl_2026/mi.png',
        color: 'text-[#005DAA]', glow: 'bg-[#005DAA]'
    },
    'Royal Challengers Bangalore': {
        logo: '/flags/ipl_2026/rcb.png',
        color: 'text-[#D71920]', glow: 'bg-[#D71920]'
    },
    'Royal Challengers Bengaluru': {
        logo: '/flags/ipl_2026/rcb.png',
        color: 'text-[#D71920]', glow: 'bg-[#D71920]'
    },
    'Rajasthan Royals': {
        logo: '/flags/ipl_2026/rr.png',
        color: 'text-[#EA1A85]', glow: 'bg-[#EA1A85]'
    },
    'Delhi Capitals': {
        logo: '/flags/ipl_2026/dc.png',
        color: 'text-[#2561AE]', glow: 'bg-[#2561AE]'
    },
    'Delhi Daredevils': {
        logo: '/flags/ipl_2026/dd.png',
        color: 'text-[#2561AE]', glow: 'bg-[#2561AE]'
    },
    'Kings XI Punjab': {
        logo: '/flags/ipl_2026/kxip.png',
        color: 'text-[#ED1B24]', glow: 'bg-[#ED1B24]'
    },
    'Punjab Kings': {
        logo: '/flags/ipl_2026/pbks.png',
        color: 'text-[#ED1B24]', glow: 'bg-[#ED1B24]'
    },
    'Kolkata Knight Riders': {
        logo: '/flags/ipl_2026/kkr.png',
        color: 'text-[#3A225D]', glow: 'bg-[#3A225D]'
    },
    'Sunrisers Hyderabad': {
        logo: '/flags/ipl_2026/srh.png',
        color: 'text-[#F47A20]', glow: 'bg-[#F47A20]'
    },
    'Deccan Chargers': {
        logo: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Deccan_Chargers_Logo.svg',
        color: 'text-blue-300', glow: 'bg-blue-400'
    },
    'Gujarat Titans': {
        logo: '/flags/ipl_2026/gt.png',
        color: 'text-[#1B2133]', glow: 'bg-[#1B2133]'
    },
    'Lucknow Super Giants': {
        logo: '/flags/ipl_2026/lsg.png',
        color: 'text-[#00AEEF]', glow: 'bg-[#00AEEF]'
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
                                {formatPlayerName(player.name || player.player)}
                            </h4>
                            <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
                                {isRuns ? (
                                    <>{player.balls || player.matches} {player.balls ? 'Balls' : 'Matches'}</>
                                ) : (
                                    <>{player.overs != null ? player.overs : (player.ballsBowled ? `${Math.floor(player.ballsBowled / 6)}${player.ballsBowled % 6 > 0 ? `.${player.ballsBowled % 6}` : ''}` : player.matches)} {player.overs != null || player.ballsBowled ? 'Overs' : 'Matches'}</>
                                )}
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
                        <div className="flex items-center gap-5 mb-8 group cursor-default">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/5 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-center border border-orange-500/30 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                                <PremiumCapIcon size={38} color="#f97316" className="relative z-10 -ml-1 mt-1" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-white tracking-tight leading-none mb-1">Orange Cap</h3>
                                <p className="text-orange-400/80 text-xs font-bold uppercase tracking-widest">Top Run Scorers</p>
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
                        <div className="flex items-center gap-5 mb-8 group cursor-default">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center border border-purple-500/30 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                                <PremiumCapIcon size={38} color="#a855f7" className="relative z-10 -ml-1 mt-1" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-white tracking-tight leading-none mb-1">Purple Cap</h3>
                                <p className="text-purple-400/80 text-xs font-bold uppercase tracking-widest">Top Wicket Takers</p>
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
                            let style = { ...(TEAM_STYLES[teamName] || DEFAULT_STYLE) };
                            const seasonNum = parseInt(season, 10);
                            
                            // Show legacy RCB logo for 2016-2019 seasons
                            if (
                                (teamName === 'Royal Challengers Bengaluru' || teamName === 'Royal Challengers Bangalore') &&
                                !isNaN(seasonNum) && seasonNum >= 2016 && seasonNum <= 2019
                            ) {
                                style.logo = '/flags/ipl_2026/rcb2016.png';
                            }

                            // Show legacy RR logo & color (blue) for 2009-2018 seasons
                            if (
                                teamName === 'Rajasthan Royals' &&
                                !isNaN(seasonNum) && seasonNum >= 2009 && seasonNum <= 2018
                            ) {
                                style.logo = '/flags/ipl_2026/rr2018.png';
                                style.color = 'text-[#004B8C]';
                                style.glow = 'bg-[#004B8C]';
                            }

                            // Show updated LSG logo for 2026 onwards
                            if (
                                teamName === 'Lucknow Super Giants' &&
                                !isNaN(seasonNum) && seasonNum >= 2026
                            ) {
                                style.logo = '/flags/ipl_2026/lsg2026.png';
                            }
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        {/* Batting Section */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-5">
                                                <div className="w-1 h-3 rounded-full bg-primary/60" />
                                                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em]">Top Batters</h4>
                                            </div>
                                            
                                            {runs.length > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    {/* Rank 1 Hero */}
                                                    <div className="relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group/card">
                                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                                            <div>
                                                                <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-1">Top Scorer</div>
                                                                <div className="text-base font-medium text-white/90 truncate max-w-[150px]">{runs[0].name || runs[0].player}</div>
                                                            </div>
                                                            <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/50 text-xs font-medium">
                                                                1
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline gap-2 relative z-10">
                                                            <span className="text-3xl font-bold text-white tracking-tighter tabular-nums">{runs[0].runs}</span>
                                                            <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Runs</span>
                                                        </div>
                                                    </div>

                                                    {/* Ranks 2-5 List */}
                                                    {runs.length > 1 && (
                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {runs.slice(1, 5).map((p: any, i: number) => (
                                                                <div key={`bat-${i}`} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.02]">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-white/20 font-mono text-[10px] w-4 shrink-0">#{i + 2}</span>
                                                                        <span className="font-medium text-white/70 text-sm truncate max-w-[120px]">{p.name || p.player}</span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-white/90 tabular-nums">{p.runs}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center text-white/20 text-xs font-medium uppercase tracking-widest bg-white/[0.01] rounded-2xl border border-white/[0.02]">No Data</div>
                                            )}
                                        </div>

                                        {/* Bowling Section */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-5">
                                                <div className="w-1 h-3 rounded-full bg-emerald-500/60" />
                                                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em]">Top Bowlers</h4>
                                            </div>
                                            
                                            {wickets.length > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    {/* Rank 1 Hero */}
                                                    <div className="relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group/card">
                                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                                            <div>
                                                                <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-1">Leading Wicket Taker</div>
                                                                <div className="text-base font-medium text-white/90 truncate max-w-[150px]">{wickets[0].name || wickets[0].player}</div>
                                                            </div>
                                                            <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/50 text-xs font-medium">
                                                                1
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline gap-2 relative z-10">
                                                            <span className="text-3xl font-bold text-white tracking-tighter tabular-nums">{wickets[0].wickets}</span>
                                                            <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Wkts</span>
                                                        </div>
                                                    </div>

                                                    {/* Ranks 2-5 List */}
                                                    {wickets.length > 1 && (
                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {wickets.slice(1, 5).map((p: any, i: number) => (
                                                                <div key={`bowl-${i}`} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.02]">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-white/20 font-mono text-[10px] w-4 shrink-0">#{i + 2}</span>
                                                                        <span className="font-medium text-white/70 text-sm truncate max-w-[120px]">{p.name || p.player}</span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-white/90 tabular-nums">{p.wickets}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center text-white/20 text-xs font-medium uppercase tracking-widest bg-white/[0.01] rounded-2xl border border-white/[0.02]">No Data</div>
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
