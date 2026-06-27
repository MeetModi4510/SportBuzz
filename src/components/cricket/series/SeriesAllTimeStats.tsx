import React, { useState } from 'react';
import { Activity, Target, Sparkles, Shield, Hand, Users, Swords } from 'lucide-react';
import { useLocalIplAllTimeStats } from '@/hooks/cricket/useCricketSeries';
import { cn } from '@/lib/utils';

const TEAM_STYLES: Record<string, { logo: string, color: string, glow: string }> = {
    'Chennai Super Kings': { logo: '/flags/ipl_2026/csk.png', color: 'text-yellow-400', glow: 'bg-yellow-500' },
    'Mumbai Indians': { logo: '/flags/ipl_2026/mi.png', color: 'text-blue-500', glow: 'bg-blue-600' },
    'Royal Challengers Bangalore': { logo: '/flags/ipl_2026/rcb.png', color: 'text-red-500', glow: 'bg-red-600' },
    'Royal Challengers Bengaluru': { logo: '/flags/ipl_2026/rcb.png', color: 'text-red-500', glow: 'bg-red-600' },
    'Rajasthan Royals': { logo: '/flags/ipl_2026/rr.png', color: 'text-pink-500', glow: 'bg-pink-600' },
    'Delhi Capitals': { logo: '/flags/ipl_2026/dc.png', color: 'text-blue-400', glow: 'bg-blue-500' },
    'Delhi Daredevils': { logo: '/flags/ipl_2026/dd.png', color: 'text-red-600', glow: 'bg-red-600' },
    'Kings XI Punjab': { logo: '/flags/ipl_2026/kxip.png', color: 'text-red-500', glow: 'bg-red-600' },
    'Punjab Kings': { logo: '/flags/ipl_2026/pbks.png', color: 'text-red-500', glow: 'bg-red-600' },
    'Kolkata Knight Riders': { logo: '/flags/ipl_2026/kkr.png', color: 'text-purple-500', glow: 'bg-purple-600' },
    'Sunrisers Hyderabad': { logo: '/flags/ipl_2026/srh.png', color: 'text-orange-500', glow: 'bg-orange-600' },
    'Deccan Chargers': { logo: '/flags/ipl_2026/dec.png', color: 'text-blue-300', glow: 'bg-blue-400' },
    'Gujarat Titans': { logo: '/flags/ipl_2026/gt.png', color: 'text-slate-300', glow: 'bg-slate-400' },
    'Lucknow Super Giants': { logo: '/flags/ipl_2026/lsg.png', color: 'text-cyan-400', glow: 'bg-cyan-500' },
    'Pune Warriors': { logo: '/flags/ipl_2026/pwi.png', color: 'text-slate-400', glow: 'bg-slate-500' },
    'Rising Pune Supergiant': { logo: '/flags/ipl_2026/rps.png', color: 'text-fuchsia-400', glow: 'bg-fuchsia-500' },
    'Rising Pune Supergiants': { logo: '/flags/ipl_2026/rps.png', color: 'text-fuchsia-400', glow: 'bg-fuchsia-500' },
    'Gujarat Lions': { logo: '/flags/ipl_2026/gl.png', color: 'text-orange-400', glow: 'bg-orange-500' },
    'Kochi Tuskers Kerala': { logo: '/flags/ipl_2026/ktk.png', color: 'text-purple-400', glow: 'bg-purple-500' }
};

const DEFAULT_STYLE = { logo: '/flags/ipl_2026/rcb.png', color: 'text-primary', glow: 'bg-primary' };

const ALL_IPL_TEAMS = [
    'Chennai Super Kings', 'Mumbai Indians', 'Royal Challengers Bengaluru', 'Kolkata Knight Riders',
    'Sunrisers Hyderabad', 'Rajasthan Royals', 'Delhi Capitals', 'Punjab Kings',
    'Gujarat Titans', 'Lucknow Super Giants'
];

export default function SeriesAllTimeStats({ teams }: { teams: any[] }) {
    const [selectedTeam, setSelectedTeam] = useState<string>('Chennai Super Kings');
    const [activeTab, setActiveTab] = useState<'batters' | 'bowlers' | 'fielding' | 'partnerships' | 'rivalries'>('batters');
    
    const { data: stats, isLoading, error } = useLocalIplAllTimeStats(selectedTeam);

    const style = TEAM_STYLES[selectedTeam] || DEFAULT_STYLE;

    const runsList = stats?.players?.topRunScorers || [];
    const wicketsList = stats?.players?.topWicketTakers || [];
    const fieldersList = stats?.players?.topFielders || [];
    const partnershipsList = stats?.players?.partnerships || [];
    const headToHeadList = stats?.players?.headToHead || [];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Rich Team Selector */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-primary w-5 h-5" />
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">All Time Archives</h2>
                </div>
                
                <div className="w-full relative max-w-7xl mx-auto">
                    <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar snap-x snap-mandatory">
                        <div className="flex w-max mx-auto gap-3 md:gap-5 px-8 md:px-16">
                            {ALL_IPL_TEAMS.map(team => {
                                const tStyle = TEAM_STYLES[team];
                                const isSelected = selectedTeam === team;
                                return (
                                    <button
                                        key={team}
                                        onClick={() => setSelectedTeam(team)}
                                        className={cn(
                                            "snap-center shrink-0 flex flex-col items-center justify-center gap-3 w-28 h-28 md:w-36 md:h-36 rounded-3xl border transition-all duration-700 relative overflow-hidden group",
                                            isSelected 
                                                ? "border-white/20 bg-white/[0.08] shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-105 z-10 ring-1 ring-white/10" 
                                                : "border-white/[0.02] bg-[#0A0A0A] hover:bg-white/[0.04] hover:border-white/10 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        {/* Dynamic Glow for Selected Team */}
                                        {isSelected && (
                                            <div className={cn("absolute inset-0 opacity-20 blur-2xl transition-opacity duration-1000", tStyle.glow)}></div>
                                        )}
                                        
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <img 
                                                src={tStyle?.logo} 
                                                alt={team} 
                                                className={cn(
                                                    "w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-2xl transition-all duration-700",
                                                    isSelected ? "scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                                                )} 
                                            />
                                            <span className={cn(
                                                "text-[10px] md:text-xs font-black text-center leading-tight px-3 transition-colors duration-500",
                                                isSelected ? "text-white" : "text-white/40 group-hover:text-white/80"
                                            )}>
                                                {team}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Display (Sleek Table Layout) */}
            <div className="bg-[#050505] border border-white/[0.05] rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl max-w-6xl mx-auto">
                <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] opacity-[0.03] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3", style.glow)}></div>

                <div className="relative z-10">
                    {/* Header with glowing logo and colored text */}
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 shrink-0 relative">
                                <div className={cn("absolute inset-0 blur-xl opacity-40 transition-colors duration-500", style.glow)}></div>
                                <img src={style.logo} alt="" className="relative z-10 w-full h-full object-contain filter drop-shadow-lg" />
                            </div>
                            <div>
                                <h3 className={cn("text-2xl md:text-3xl font-light tracking-wide transition-colors duration-500", style.color)}>
                                    {selectedTeam}
                                </h3>
                                <div className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mt-1">
                                    Hall of Fame Statistics
                                </div>
                            </div>
                        </div>

                        {/* Minimalist Tabs */}
                        <div className="flex flex-wrap items-center bg-white/[0.02] rounded-xl p-1 border border-white/[0.03] gap-1">
                            <button
                                onClick={() => setActiveTab('batters')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase tracking-widest",
                                    activeTab === 'batters' 
                                        ? "bg-white/[0.08] text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                )}
                            >
                                <Activity size={14} />
                                Batting
                            </button>
                            <button
                                onClick={() => setActiveTab('bowlers')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase tracking-widest",
                                    activeTab === 'bowlers' 
                                        ? "bg-white/[0.08] text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                )}
                            >
                                <Target size={14} />
                                Bowling
                            </button>
                            <button
                                onClick={() => setActiveTab('fielding')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase tracking-widest",
                                    activeTab === 'fielding' 
                                        ? "bg-white/[0.08] text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                )}
                            >
                                <Hand size={14} />
                                Fielding
                            </button>
                            <button
                                onClick={() => setActiveTab('partnerships')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase tracking-widest",
                                    activeTab === 'partnerships' 
                                        ? "bg-white/[0.08] text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                )}
                            >
                                <Users size={14} />
                                Partnerships
                            </button>
                            <button
                                onClick={() => setActiveTab('rivalries')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 text-xs font-medium uppercase tracking-widest",
                                    activeTab === 'rivalries' 
                                        ? "bg-white/[0.08] text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                )}
                            >
                                <Swords size={14} />
                                Rivalries
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Activity className="w-8 h-8 text-white/20 animate-spin mb-4" />
                            <div className="text-white/30 font-medium tracking-[0.2em] uppercase text-xs animate-pulse">Loading Archives...</div>
                        </div>
                    ) : error || (!runsList.length && !wicketsList.length && !fieldersList.length) ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <Shield className="w-10 h-10 text-white/10 mb-4" />
                            <div className="text-white/60 font-medium mb-2">No Records Found</div>
                            <div className="text-white/30 text-xs">The archives for this franchise are currently unavailable.</div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-700">
                            
                            {/* BATTING LEGENDS SECTION */}
                            {activeTab === 'batters' && runsList.length > 0 && (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="border-b border-white/[0.05]">
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] w-16">Rank</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">Player</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Mat</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-24">Runs</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Avg</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">SR</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">100s</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">50s</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">6s</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">4s</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {runsList.map((player: any, index: number) => (
                                                <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                    <td className="py-4 px-4 text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                                        {player.name || player.player}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.matches || '-'}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-base font-bold text-white group-hover:text-primary transition-colors tabular-nums">{player.runs}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.avg}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.sr}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.hundreds}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.fifties}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.sixes}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.fours}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* BOWLING LEGENDS SECTION */}
                            {activeTab === 'bowlers' && wicketsList.length > 0 && (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="border-b border-white/[0.05]">
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] w-16">Rank</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">Player</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Mat</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-24">Wickets</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Econ</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Avg</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">BBI</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">4W</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">5W</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">SR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wicketsList.map((player: any, index: number) => (
                                                <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                    <td className="py-4 px-4 text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                                        {player.name || player.player}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.matches || '-'}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors tabular-nums">{player.wickets}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.econ}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.avg}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.bbi}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.fourWickets}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.fiveWickets}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.sr}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* FIELDING LEGENDS SECTION */}
                            {activeTab === 'fielding' && fieldersList.length > 0 && (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="border-b border-white/[0.05]">
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] w-16">Rank</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">Player</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Mat</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-24">Dismissals</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Catches</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Stumpings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fieldersList.map((player: any, index: number) => (
                                                <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                    <td className="py-4 px-4 text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                                        {player.name || player.player}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.matches || '-'}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-base font-bold text-white group-hover:text-amber-500 transition-colors tabular-nums">{player.dismissals}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.catches}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{player.stumpings}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* PARTNERSHIPS SECTION */}
                            {activeTab === 'partnerships' && partnershipsList.length > 0 && (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-white/[0.05]">
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] w-16">Rank</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">Partners</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">Inns</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-24">Runs</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Highest</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Average</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">100s</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-16">50s</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partnershipsList.map((partnership: any, index: number) => (
                                                <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                    <td className="py-4 px-4 text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors">
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                                        {partnership.partners}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{partnership.inns}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className="text-base font-bold text-white group-hover:text-primary transition-colors tabular-nums">{partnership.runs}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{partnership.highest}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{partnership.avg}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{partnership.hundreds}</td>
                                                    <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{partnership.fifties}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* RIVALRIES / HEAD-TO-HEAD SECTION */}
                            {activeTab === 'rivalries' && headToHeadList.length > 0 && (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-white/[0.05]">
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] w-16">#</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">Opposition</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Mat</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Won</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Lost</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">Tied</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-20">NR</th>
                                                <th className="py-4 px-4 text-[10px] font-medium text-white/30 uppercase tracking-[0.2em] text-right w-24">Win %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {headToHeadList.map((h2h: any, index: number) => {
                                                const winPct = h2h.matches > 0 ? ((h2h.won / h2h.matches) * 100).toFixed(1) : '0.0';
                                                return (
                                                    <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                                        <td className="py-4 px-4 text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors">
                                                            {(index + 1).toString().padStart(2, '0')}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {TEAM_STYLES[h2h.opposition]?.logo ? (
                                                                    <img src={TEAM_STYLES[h2h.opposition].logo} alt={h2h.opposition} className="w-6 h-6 object-contain drop-shadow-md" />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-white/10" />
                                                                )}
                                                                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                                                                    {h2h.opposition}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums font-medium">{h2h.matches}</td>
                                                        <td className="py-4 px-4 text-right text-sm text-emerald-400/80 font-bold tabular-nums">{h2h.won}</td>
                                                        <td className="py-4 px-4 text-right text-sm text-red-400/80 font-bold tabular-nums">{h2h.lost}</td>
                                                        <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{h2h.tied}</td>
                                                        <td className="py-4 px-4 text-right text-sm text-white/50 tabular-nums">{h2h.nr}</td>
                                                        <td className="py-4 px-4 text-right">
                                                            <span className={cn(
                                                                "text-sm font-bold tabular-nums",
                                                                parseFloat(winPct) >= 50 ? "text-emerald-400" : "text-amber-500"
                                                            )}>{winPct}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
