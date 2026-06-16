import React, { useState, useEffect } from 'react';
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
            <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 rounded-2xl bg-[#0B1120] text-slate-500 min-h-[600px]">
                <svg className="w-16 h-16 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xl font-bold text-slate-400">Select a Player</h2>
                <p className="text-sm mt-2">Choose a player from the sidebar to view deep performance analytics.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 rounded-2xl bg-[#0B1120] text-slate-500 min-h-[600px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-white">Extracting Deep Stats</h2>
                <p className="text-sm mt-2">Loading</p>
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
        { label: 'Matches', value: currentFormatStats?.matches },
        { label: 'Innings', value: currentFormatStats?.innings },
        { label: 'Runs', value: currentFormatStats?.runs?.toLocaleString() },
        { label: 'Highest Score', value: currentFormatStats?.highestScore },
        { label: 'Average', value: currentFormatStats?.average },
        { label: 'Strike Rate', value: currentFormatStats?.strikeRate },
        { label: '100s', value: currentFormatStats?.hundreds },
        { label: '50s', value: currentFormatStats?.fifties },
        { label: 'Fours', value: currentFormatStats?.fours },
        { label: 'Sixes', value: currentFormatStats?.sixes },
    ] : skillMode === 'bowling' ? [
        { label: 'Matches', value: currentFormatStats?.matches },
        { label: 'Innings', value: currentFormatStats?.innings },
        { label: 'Wickets', value: currentFormatStats?.wickets },
        { label: 'Best Bowling', value: currentFormatStats?.best },
        { label: 'Average', value: currentFormatStats?.average },
        { label: 'Economy', value: currentFormatStats?.economy },
        { label: 'Strike Rate', value: currentFormatStats?.strikeRate },
        { label: 'Runs Conceded', value: currentFormatStats?.runs },
    ] : [];

    return (
        <div className="flex-1 flex flex-col gap-6 pb-10">
            {/* Top Banner & Main Nav */}
            <div className="bg-gradient-to-br from-[#0F172A] to-[#0B1120] rounded-3xl p-8 border border-blue-500/10 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-slate-700 flex items-center justify-center">
                            {activePlayer?.imageUrl ? (
                                <img src={activePlayer.imageUrl} alt={activePlayer.name} className="w-full h-full object-cover object-top" />
                            ) : (
                                <svg className="w-full h-full text-slate-500 mt-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.672-10 5v1h20v-1c0-3.328-6.685-5-10-5z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-white tracking-tight">{playerData.name}</h1>
                            </div>
                            <p className="text-slate-400">{playerData.profileInfo?.role || activePlayer?.role || 'Batter'} • {playerData.team || 'International'}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-blue-500 bg-gradient-to-br from-[#0B1120] to-[#141A25] shadow-[0_0_20px_rgba(37,99,235,0.3)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 blur-md"></div>
                            <span className="text-3xl font-black text-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{stableOVR}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Overall Rating</span>
                    </div>
                </div>

                {/* Toggles and Tabs */}
                <div className="relative z-10 mt-10 flex flex-col gap-6">
                    {/* Batting vs Bowling Toggle */}
                    <div className="flex bg-[#0B1120]/80 backdrop-blur-md rounded-xl p-1.5 w-fit border border-slate-800/60 shadow-xl">
                        <button 
                            onClick={() => setSkillMode('profile')}
                            className={`flex items-center gap-2.5 px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${skillMode === 'profile' ? 'bg-blue-500/15 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            PROFILE
                        </button>
                        <button 
                            onClick={() => setSkillMode('batting')}
                            className={`flex items-center gap-2.5 px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${skillMode === 'batting' ? 'bg-emerald-500/15 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l4 4 -8 14 -4-4 8-14z"/><path d="M15 6l4-4"/></svg>
                            BATTING
                        </button>
                        <button 
                            onClick={() => setSkillMode('bowling')}
                            className={`flex items-center gap-2.5 px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 ${skillMode === 'bowling' ? 'bg-purple-500/15 text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-purple-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 3 2.5 15 0 18"/><path d="M12 3c-2.5 3-2.5 15 0 18"/></svg>
                            BOWLING
                        </button>
                    </div>

                    {/* Format Tabs & Live Tag */}
                    {skillMode !== 'profile' && (
                        <>
                            <div className="flex justify-between items-center border-t border-slate-800/50 pt-6 mt-6">
                                <div className="flex gap-2">
                                    {(['test', 'odi', 't20i', 'ipl', 'all'] as Format[]).map(format => (
                                        <button
                                            key={format}
                                            onClick={() => setActiveFormat(format)}
                                            className={`px-5 py-2 rounded-full text-xs font-bold transition uppercase ${activeFormat === format ? 'bg-[#2563EB] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white bg-[#141A25] hover:bg-[#1E293B]'}`}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    LIVE
                                </div>
                            </div>

                            {/* Main Stat Grid */}
                            <StatGrid stats={currentFormatStats} skillMode={skillMode} />
                        </>
                    )}
                </div>
            </div>

            {skillMode === 'profile' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <span className="text-blue-500">📋</span> Personal Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                <span className="text-slate-400 text-sm">Born</span>
                                <span className="text-white text-sm font-medium">{playerData.profileInfo?.born || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                <span className="text-slate-400 text-sm">Birth Place</span>
                                <span className="text-white text-sm font-medium">{playerData.profileInfo?.birthPlace || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                <span className="text-slate-400 text-sm">Role</span>
                                <span className="text-white text-sm font-medium">{playerData.profileInfo?.role || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                <span className="text-slate-400 text-sm">Batting Style</span>
                                <span className="text-white text-sm font-medium">{playerData.profileInfo?.battingStyle || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                <span className="text-slate-400 text-sm">Bowling Style</span>
                                <span className="text-white text-sm font-medium">{playerData.profileInfo?.bowlingStyle || '-'}</span>
                            </div>
                        </div>
                        
                        <h3 className="text-white font-semibold mt-6 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">🛡️</span> Teams
                        </h3>
                        <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800/50">
                            {playerData.profileInfo?.teams ? (
                                <PlayerTeamsDisplay teamsString={playerData.profileInfo.teams} />
                            ) : (
                                <span className="text-slate-400 text-sm">-</span>
                            )}
                        </div>
                    </div>

                    {/* ICC Rankings */}
                    <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg">
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <span className="text-blue-500">🏆</span> ICC Rankings
                        </h3>
                        
                        <div className="space-y-6">
                            {['batting', 'bowling', 'allrounder'].map(cat => (
                                <div key={cat}>
                                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-2 tracking-wider pl-1">{cat === 'allrounder' ? 'All-Rounder' : cat}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['test', 'odi', 't20i'].map(fmt => {
                                            const rankData = playerData.profileInfo?.iccRankings?.[cat]?.[fmt];
                                            const isObj = rankData && typeof rankData === 'object';
                                            const rankStr = isObj ? rankData.rank : rankData;
                                            const trend = isObj ? rankData.trend : '';
                                            const trendVal = isObj ? rankData.trendVal : '';
                                            const isValid = rankStr && rankStr !== '--';

                                            return (
                                                <div key={fmt} className="bg-[#0B1120] p-3 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                                                    <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">{fmt}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-xl font-black ${isValid ? 'text-white' : 'text-slate-600'}`}>
                                                            {rankStr || '--'}
                                                        </span>
                                                        {trend === 'up' && (
                                                            <span className="flex items-center text-xs font-bold text-emerald-400">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                                {trendVal}
                                                            </span>
                                                        )}
                                                        {trend === 'down' && (
                                                            <span className="flex items-center text-xs font-bold text-red-400">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                                {trendVal}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Performance Trend Chart */}
                    {playerData.recentMatches?.[skillMode] && playerData.recentMatches[skillMode].length > 0 && (
                        <PerformanceTrend data={playerData.recentMatches[skillMode]} skillMode={skillMode as any} />
                    )}

                    {/* Radar & Detailed Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AttributeRadar attributes={playerData.attributes} />
                        
                        {/* Detailed Stats Panel */}
                        <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg h-full">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-full">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Detailed Statistics</h3>
                                    <p className="text-slate-400 text-xs">Full career numbers ({activeFormat.toUpperCase()})</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {detailedStatsList.map((stat, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                        <span className="text-sm text-slate-400 font-medium">{stat.label}</span>
                                        <span className="text-sm font-bold text-white">{stat.value || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cross Format Analysis */}
                    <CrossFormatAnalysis stats={playerData.stats?.[skillMode]} />
                </>
            )}

            {/* Opposition Stats */}
            {playerData.vsOpposition && playerData.vsOpposition.length > 0 && (
                <OppositionStats data={playerData.vsOpposition} />
            )}
        </div>
    );
}
