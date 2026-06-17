import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Activity, Target } from 'lucide-react';
import { usePerformanceLabPlayerStats } from '../../hooks/usePerformanceLab';
import { StatGrid } from './StatGrid';
import { PerformanceTrend } from './charts/PerformanceTrend';
import { AttributeRadar } from './charts/AttributeRadar';
import { CrossFormatAnalysis } from './charts/CrossFormatAnalysis';
import { OppositionStats } from './charts/OppositionStats';

interface PerformanceLabProps {
    activePlayer: any | null;
}

type Format = 'test' | 'odi' | 't20i' | 'ipl' | 'all';

function PlayerTeamsDisplay({ teamsString }: { teamsString: string }) {
    // Parse the comma-separated string into an array of teams
    const teams = teamsString.split(',').map(t => t.trim()).filter(Boolean);

    if (teams.length === 0) return <span className="text-slate-400">-</span>;

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {teams.map(team => (
                <div key={team} className="flex items-center gap-2 bg-[#1C2433] border border-slate-700/50 rounded-lg px-3 py-1.5 shadow-sm hover:border-slate-600 transition-colors cursor-default group">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                            {team.slice(0,1).toUpperCase()}
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200 tracking-wide group-hover:text-white transition-colors">{team}</span>
                </div>
            ))}
        </div>
    );
}


export function PerformanceLab({ activePlayer }: PerformanceLabProps) {
    const [activeFormat, setActiveFormat] = useState<Format>('odi');
    const [skillMode, setSkillMode] = useState<'profile' | 'batting' | 'bowling'>('profile');

    const activePlayerId = activePlayer?.espnId;
    const activePlayerName = activePlayer?.name || '';
    
    const { data: playerData, isLoading, error } = usePerformanceLabPlayerStats(activePlayerId, activePlayerName);

    const idSum = activePlayerId ? activePlayerId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
    const stableOVR = activePlayerId ? (idSum % 16) + 80 : 90;

    if (!activePlayerId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-[60px] text-slate-500 min-h-[600px] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] relative overflow-hidden group w-full z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Glowing Radar Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent,transparent,rgba(59,130,246,0.1),transparent)] animate-[spin_8s_linear_infinite] rounded-full pointer-events-none"></div>

                <div className="relative flex items-center justify-center mb-10">
                    <div className="absolute w-40 h-40 border border-fuchsia-500/30 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                    <div className="absolute w-56 h-56 border border-cyan-500/20 rounded-full animate-[ping_3s_ease-in-out_infinite_0.5s]"></div>
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(59,130,246,0.5)] transform rotate-3 group-hover:rotate-0 transition-transform duration-500 relative z-10">
                        <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-4-8a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter drop-shadow-lg relative z-10">The Command Center</h2>
                <p className="text-sm mt-4 text-slate-300 max-w-sm text-center leading-relaxed font-bold uppercase tracking-[0.2em] relative z-10">Select a player from the roster rail above to initialize deep analytics</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl text-slate-500 min-h-[600px] shadow-2xl">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-white tracking-tight">Extracting Deep Stats</h2>
                <p className="text-sm mt-2 text-blue-400 animate-pulse">Processing data streams...</p>
            </div>
        );
    }

    if (error || !playerData || playerData.error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-red-900/30 rounded-2xl bg-[#0B1120] text-red-500 min-h-[600px]">
                <h2 className="text-xl font-bold">Error Fetching Data</h2>
                <p className="text-sm mt-2">Failed to scrape player statistics.</p>
            </div>
        );
    }

    const currentFormatStats = (skillMode !== 'profile') ? (playerData.stats?.[skillMode]?.[activeFormat] || {}) : {};

    const detailedStatsList = skillMode === 'batting' ? [
        // Top 5 line stats
        { label: 'Matches', value: currentFormatStats?.matches },
        { label: 'Innings', value: currentFormatStats?.innings },
        { label: 'Runs', value: currentFormatStats?.runs?.toLocaleString() },
        { label: 'Highest Score', value: currentFormatStats?.highestScore },
        { label: 'Average', value: currentFormatStats?.average },
        
        // Detailed 10 stats
        { label: 'Strike Rate', value: currentFormatStats?.strikeRate },
        { label: 'Balls Faced', value: currentFormatStats?.balls },
        { label: 'Not Outs', value: currentFormatStats?.notOuts },
        { label: 'Ducks', value: currentFormatStats?.ducks },
        { label: '100s', value: currentFormatStats?.hundreds },
        
        { label: '50s', value: currentFormatStats?.fifties },
        { label: '200s', value: currentFormatStats?.doubleHundreds },
        { label: '300s', value: currentFormatStats?.tripleHundreds },
        { label: 'Fours', value: currentFormatStats?.fours },
        { label: 'Sixes', value: currentFormatStats?.sixes },
    ] : skillMode === 'bowling' ? [
        // Top 5 line stats
        { label: 'Matches', value: currentFormatStats?.matches },
        { label: 'Innings', value: currentFormatStats?.innings },
        { label: 'Wickets', value: currentFormatStats?.wickets },
        { label: 'Average', value: currentFormatStats?.average },
        { label: 'Best Inngs (BBI)', value: currentFormatStats?.bbi },

        // Detailed stats
        { label: 'Economy', value: currentFormatStats?.economy },
        { label: 'Strike Rate', value: currentFormatStats?.strikeRate },
        { label: 'Runs Conceded', value: currentFormatStats?.runs?.toLocaleString() },
        { label: 'Balls Bowled', value: currentFormatStats?.balls?.toLocaleString() },
        { label: 'Maidens', value: currentFormatStats?.maidens },
        { label: 'Best Match (BBM)', value: currentFormatStats?.bbm },
        { label: '4 Wickets', value: currentFormatStats?.fourWickets },
        { label: '5 Wickets', value: currentFormatStats?.fiveWickets },
        { label: '10 Wickets', value: currentFormatStats?.tenWickets },
    ] : [];

    // Fetch a reasonably sized image so it doesn't blur
    const crispImageUrl = activePlayer?.imageUrl ? activePlayer.imageUrl.replace(/w=\d+/g, 'w=300').replace(/h=\d+/g, 'h=300') : '';

    return (
        <div className="flex-1 flex flex-col z-10 w-full px-4 lg:px-12 pb-16">
            
            {/* TOP HEADER: Player Identity */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 pb-10 mb-8 border-b border-white/[0.05]">
                {/* Small Crisp Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-[#0A0A0B] border border-white/[0.08] shadow-2xl flex-shrink-0 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {crispImageUrl ? (
                        <img src={crispImageUrl} alt={activePlayer?.name} className="w-full h-full object-cover object-top" />
                    ) : (
                        <svg className="w-full h-full text-zinc-800 p-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.672-10 5v1h20v-1c0-3.328-6.685-5-10-5z" />
                        </svg>
                    )}
                </div>

                {/* Name and Basic Info */}
                <div className="flex flex-col items-center md:items-start gap-3 flex-1 text-center md:text-left">
                    <span className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">
                        {playerData.team || 'International'}
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                        {playerData.name}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2">
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white font-bold text-sm flex items-center gap-2 shadow-sm">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest">OVR</span>
                            {stableOVR}
                        </div>
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-zinc-300 font-medium text-sm shadow-sm">
                            {playerData.profileInfo?.role || activePlayer?.role || 'Batter'}
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="flex bg-white/[0.02] border border-white/[0.05] rounded-xl p-1 shadow-lg w-full md:w-auto mt-6 md:mt-0">
                    <button 
                        onClick={() => setSkillMode('profile')}
                        className={`flex-1 md:w-28 py-3 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${skillMode === 'profile' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Profile
                    </button>
                    <button 
                        onClick={() => setSkillMode('batting')}
                        className={`flex-1 md:w-28 py-3 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${skillMode === 'batting' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Batting
                    </button>
                    <button 
                        onClick={() => setSkillMode('bowling')}
                        className={`flex-1 md:w-28 py-3 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${skillMode === 'bowling' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Bowling
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="w-full relative z-20">
                {skillMode !== 'profile' ? (
                    <div className="flex flex-col gap-16">
                        {/* Format Tabs & Live */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.08] pb-4 gap-4">
                            <div className="flex gap-8 overflow-x-auto hide-scrollbar w-full sm:w-auto">
                                {(['test', 'odi', 't20i', 'ipl', 'all'] as Format[]).map(format => (
                                    <button
                                        key={format}
                                        onClick={() => setActiveFormat(format)}
                                        className={`pb-4 -mb-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border-b-2 whitespace-nowrap ${
                                            activeFormat === format 
                                                ? 'border-white text-white' 
                                                : 'border-transparent text-zinc-600 hover:text-zinc-300'
                                        }`}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold tracking-widest uppercase flex-shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                Live Sync
                            </div>
                        </div>

                        {/* Top Line Stats (No Boxes) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {detailedStatsList.slice(0, 5).map((stat, idx) => (
                                <div key={idx} className="flex flex-col gap-3">
                                    <span className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">{stat.label}</span>
                                    <span className="text-4xl lg:text-5xl font-black text-white tracking-tight">{stat.value || '-'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Performance Trend Chart */}
                            {playerData.recentMatches?.[skillMode] && playerData.recentMatches[skillMode].length > 0 && (
                                <div className="w-full">
                                    <PerformanceTrend data={playerData.recentMatches[skillMode]} skillMode={skillMode as any} />
                                </div>
                            )}

                            {/* Attribute Radar */}
                            <div className="w-full">
                                <AttributeRadar attributes={playerData.attributes} />
                            </div>
                        </div>
                        
                        {/* Detailed Stats Panel (Full Width Row) */}
                        <div className="pt-8 border-t border-white/[0.05]">
                            <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-8">Detailed Career Stats</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                                {detailedStatsList.slice(5).map((stat, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 border-b md:border-b-0 border-white/[0.05] pb-4 md:pb-0">
                                        <span className="text-[11px] text-zinc-500 font-medium tracking-widest uppercase">{stat.label}</span>
                                        <span className="text-2xl font-black text-white leading-none">{stat.value || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cross Format Analysis (Full Width Matrix) */}
                        <div className="w-full">
                            <CrossFormatAnalysis stats={playerData.stats?.[skillMode]} skillMode={skillMode as any} />
                        </div>
                        
                        {/* Opposition Stats */}
                        {playerData.vsOpposition && playerData.vsOpposition.length > 0 && (
                            <div className="pt-8 border-t border-white/[0.05]">
                                <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-8">Vs Opposition</h3>
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8">
                                    <OppositionStats data={playerData.vsOpposition} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                        <div className="flex flex-col gap-12">
                            {/* Profile Mode Canvas - FULL WIDTH */}
                            {/* 1. Identity Matrix (Personal Information) */}
                            <div>
                                <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">Identity Matrix</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Born</span>
                                            <span className="text-sm font-bold text-white tracking-wide">{playerData.profileInfo?.born || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Birth Place</span>
                                            <span className="text-sm font-bold text-white tracking-wide">{playerData.profileInfo?.birthPlace || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-amber-400 group-hover:text-amber-300 transition-colors">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Batting Style</span>
                                            <span className="text-sm font-bold text-white tracking-wide">{playerData.profileInfo?.battingStyle || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-rose-400 group-hover:text-rose-300 transition-colors">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Bowling Style</span>
                                            <span className="text-sm font-bold text-white tracking-wide">{playerData.profileInfo?.bowlingStyle || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Affiliations (Teams) */}
                            {(() => {
                                const teamsRaw = playerData.profileInfo?.teams;
                                if (!teamsRaw) return null;
                                const teamsList = (typeof teamsRaw === 'string' ? teamsRaw.split(',') : (Array.isArray(teamsRaw) ? teamsRaw : []))
                                    .map((t: string) => t.trim())
                                    .filter(Boolean);
                                if (teamsList.length === 0) return null;
                                return (
                                    <div className="pt-8 border-t border-white/[0.05]">
                                        <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">Teams</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {teamsList.map((team: string, idx: number) => (
                                                <span key={idx} className="relative overflow-hidden px-4 py-2 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-300 shadow-sm hover:border-white/[0.2] hover:text-white transition-all duration-300 cursor-default group">
                                                    <span className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                                    {team}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 3. Global Standings (ICC Rankings) */}
                            {(() => {
                                const icc = playerData.profileInfo?.iccRankings;
                                if (!icc) return null;

                                const validRankings: any[] = [];
                                Object.entries(icc).forEach(([category, formats]: [string, any]) => {
                                    Object.entries(formats).forEach(([format, data]: [string, any]) => {
                                        const rankStr = typeof data === 'object' && data !== null ? data.rank : data;
                                        if (rankStr && rankStr !== '--') {
                                            validRankings.push({
                                                category,
                                                format,
                                                rank: rankStr,
                                                trend: typeof data === 'object' ? data.trend : undefined,
                                                trendVal: typeof data === 'object' ? data.trendVal : undefined
                                            });
                                        }
                                    });
                                });

                                if (validRankings.length === 0) return null;

                                return (
                                    <div className="pt-8 border-t border-white/[0.05]">
                                        <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">ICC Rankings</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                            {validRankings.map((ranking: any, idx: number) => {
                                                const rankNum = parseInt(ranking.rank);
                                                let gradient = "from-zinc-800 to-zinc-900";
                                                let shadow = "shadow-none";
                                                let textGrad = "from-zinc-100 to-zinc-400";
                                                if (!isNaN(rankNum)) {
                                                    if (rankNum <= 3) {
                                                        gradient = "from-amber-500/10 to-amber-700/5";
                                                        shadow = "shadow-[0_0_20px_rgba(245,158,11,0.05)]";
                                                        textGrad = "from-amber-200 to-yellow-500";
                                                    } else if (rankNum <= 10) {
                                                        gradient = "from-slate-400/10 to-slate-600/5";
                                                        textGrad = "from-slate-200 to-slate-400";
                                                    } else if (rankNum <= 20) {
                                                        gradient = "from-orange-500/10 to-orange-800/5";
                                                        textGrad = "from-orange-200 to-orange-400";
                                                    }
                                                }

                                                return (
                                                    <div key={idx} className={`relative flex flex-col gap-2 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.05] p-6 rounded-3xl overflow-hidden group ${shadow} transition-all duration-500 hover:scale-[1.02] hover:border-white/[0.1]`}>
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`}></div>
                                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors"></div>
                                                        <span className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase z-10">{ranking.category} • {ranking.format}</span>
                                                        <div className="flex items-end gap-3 z-10 mt-2">
                                                            <span className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b ${textGrad} leading-none tracking-tighter`}>#{ranking.rank}</span>
                                                            <div className="mb-2 flex flex-col">
                                                                {ranking.trend === 'up' && <span className="text-emerald-400 text-xs font-black tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">▲ {ranking.trendVal}</span>}
                                                                {ranking.trend === 'down' && <span className="text-red-400 text-xs font-black tracking-widest drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">▼ {ranking.trendVal}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                )}
            </div>
        </div>
    );
}
