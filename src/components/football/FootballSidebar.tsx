import React, { useState, useEffect, useMemo } from 'react';
import { useFootballSquads, useFotmobSquad, FootballPlayer, FotmobPlayer } from '../../hooks/useFootballSquads';

interface FootballSidebarProps {
    activePlayerId: string | null;
    initialTeamName?: string;
    onSelectPlayer: (player: FootballPlayer & { country: string }) => void;
}

export function FootballSidebar({ activePlayerId, initialTeamName, onSelectPlayer }: FootballSidebarProps) {
    const { data: squadData } = useFootballSquads();
    
    // Default to a popular team to start if available
    const [selectedTeamName, setSelectedTeamName] = useState<string>(initialTeamName || 'Argentina');
    const { data: fotmobPlayers, isLoading } = useFotmobSquad(selectedTeamName);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // If squadData loads and selectedTeamName isn't in it, pick the first one
    useEffect(() => {
        if (squadData && !squadData[selectedTeamName]) {
            const firstTeam = Object.keys(squadData)[0];
            if (firstTeam) {
                setSelectedTeamName(firstTeam);
            }
        }
    }, [squadData, selectedTeamName]);

    const regions = useMemo(() => {
        if (!squadData) return [];
        return Object.values(squadData).map(squad => ({
            id: squad.teamInfo.name,
            name: squad.teamInfo.name,
            flag: squad.teamInfo.logo
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [squadData]);

    const selectedSquad = fotmobPlayers ? { players: fotmobPlayers } : null;
    const selectedRegionObj = regions.find(r => r.name === selectedTeamName) || regions[0];

    return (
        <div className="w-full flex-shrink-0 flex flex-col gap-3 relative z-50">
            <div className="flex items-center gap-4">
                
                {/* Region Dropdown (Left side of the rail) */}
                <div className="relative z-30 w-fit flex-shrink-0">
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="dark:bg-white/5 bg-slate-50 backdrop-blur-xl border dark:border-white/10 border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer dark:hover:bg-white/10 hover:bg-slate-100 dark:hover:border-white/20 hover:border-slate-300 transition-all shadow-lg h-[88px] min-w-[220px] w-fit"
                    >
                        {selectedRegionObj ? (
                            <div className="flex items-center gap-4 pr-4">
                                <div className="w-12 h-8 overflow-hidden flex items-center justify-center rounded-[4px]">
                                    <img src={selectedRegionObj.flag} alt="Region" className="w-full h-full object-cover shadow-sm" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">National Squad</p>
                                    <p className="dark:text-white text-slate-800 font-black text-base whitespace-nowrap">{selectedRegionObj.name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 pr-4">
                                <div className="w-10 h-7 dark:bg-slate-800 bg-slate-200 animate-pulse rounded-[4px]" />
                                <div>
                                    <div className="w-20 h-3 dark:bg-slate-800 bg-slate-200 animate-pulse mb-1 rounded" />
                                    <div className="w-16 h-4 dark:bg-slate-700 bg-slate-300 animate-pulse rounded" />
                                </div>
                            </div>
                        )}
                        <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute top-full mt-3 left-0 w-full dark:bg-[#0B1120]/95 bg-white/95 backdrop-blur-3xl border dark:border-white/10 border-slate-200 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] z-50 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                            {regions.map(r => (
                                <div 
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedTeamName(r.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer dark:hover:bg-white/10 hover:bg-slate-50 transition-colors ${selectedTeamName === r.id ? 'bg-blue-500/15 border border-blue-500/30' : 'border border-transparent'}`}
                                >
                                    <div className="w-10 flex justify-center items-center flex-shrink-0">
                                        <img src={r.flag} alt={r.name} className="w-10 h-7 object-cover shadow-sm rounded-[4px]" />
                                    </div>
                                    <span className={`font-bold text-sm tracking-wide whitespace-nowrap ${selectedTeamName === r.id ? 'text-blue-400' : 'dark:text-slate-200 text-slate-700'}`}>{r.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Horizontal Player List */}
                <div className="flex-1 flex items-center gap-4 overflow-x-auto pb-4 pt-2 custom-scrollbar pr-4 hide-scrollbar">
                    {isLoading && (
                        <div className="flex items-center justify-center w-full h-[140px] text-zinc-500 gap-3">
                            <div className="w-5 h-5 border-2 dark:border-white/20 border-slate-300 dark:border-t-white border-t-slate-800 rounded-full animate-spin"></div>
                            <span className="text-xs font-medium tracking-[0.2em] uppercase">Syncing Roster</span>
                        </div>
                    )}
                    
                    {(() => {
                        if (!selectedSquad?.players) return null;

                        const groups = [
                            { label: 'COACH', players: [] as FootballPlayer[] },
                            { label: 'FORWARDS', players: [] as FootballPlayer[] },
                            { label: 'MIDFIELDERS', players: [] as FootballPlayer[] },
                            { label: 'DEFENDERS', players: [] as FootballPlayer[] },
                            { label: 'GOALKEEPERS', players: [] as FootballPlayer[] }
                        ];

                        selectedSquad.players.forEach((player: FotmobPlayer) => {
                            const r = (player.position || '').toLowerCase();
                            if (r.includes('coach') || r.includes('manager')) groups[0].players.push(player as any);
                            else if (r.includes('goalkeeper') || r.includes('keeper')) groups[4].players.push(player as any);
                            else if (r.includes('defender')) groups[3].players.push(player as any);
                            else if (r.includes('midfielder')) groups[2].players.push(player as any);
                            else groups[1].players.push(player as any); // Forwards fallback
                        });

                        return groups.map((group, groupIdx) => {
                            if (group.players.length === 0) return null;
                            return (
                                <React.Fragment key={group.label}>
                                    <div className="flex items-center gap-4 pl-2">
                                        <div className="flex flex-col items-center justify-center shrink-0">
                                            <span 
                                                className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em] whitespace-nowrap" 
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                            >
                                                {group.label}
                                            </span>
                                        </div>
                                        {group.players.map((player: FootballPlayer) => {
                                            const isActive = activePlayerId === String(player.id);
                                            // Deterministic OVR base
                                            const idSum = String(player.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const stableOVR = (idSum % 16) + 78;

                                            // Use the proxy API endpoint to get the cached image
                                            const highResUrl = `/api/football/fotmob-player-image/${player.id}`;

                                            return (
                                                <div 
                                                    key={player.id}
                                                    onClick={() => onSelectPlayer({ ...player, country: selectedTeamName })}
                                                    className="group flex-shrink-0 flex flex-col items-center gap-3 w-[72px] md:w-[88px] cursor-pointer"
                                                >
                                                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-500 dark:bg-[#0B1120] bg-slate-100 flex items-center justify-center ${
                                                        isActive 
                                                            ? 'ring-2 dark:ring-white ring-blue-500 dark:ring-offset-[#0A0A0B] ring-offset-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-105 z-10' 
                                                            : 'ring-1 dark:ring-white/10 ring-slate-200 opacity-70 group-hover:opacity-100 dark:group-hover:ring-white/30 group-hover:ring-slate-300 group-hover:scale-105'
                                                    }`}>
                                                        {/* Blurred Flag Background */}
                                                        {selectedRegionObj && (
                                                            <img 
                                                                src={selectedRegionObj.flag} 
                                                                alt={`${selectedRegionObj.name} Flag`}
                                                                className="absolute inset-0 w-full h-full object-cover opacity-60 blur-[4px] scale-[2.5] z-0"
                                                            />
                                                        )}

                                                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                                                            {highResUrl && !highResUrl.includes('placeholder') && highResUrl !== selectedRegionObj?.flag ? (
                                                                <img 
                                                                    src={highResUrl} 
                                                                    alt={player.name} 
                                                                    className="w-full h-full object-cover object-top"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = 'none';
                                                                        const parent = (e.target as HTMLElement).parentElement;
                                                                        if (parent) {
                                                                            const fallback = document.createElement('div');
                                                                            fallback.className = 'w-full h-full flex items-center justify-center bg-black/40 text-white font-black text-xl tracking-widest drop-shadow-md';
                                                                            const parts = player.name.split(' ');
                                                                            fallback.innerText = parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : player.name.substring(0, 2).toUpperCase();
                                                                            parent.appendChild(fallback);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center dark:bg-black/40 bg-slate-200 dark:text-white text-slate-600 font-black text-xl tracking-widest drop-shadow-md">
                                                                    {(() => {
                                                                        const parts = player.name.split(' ');
                                                                        if (parts.length > 1) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
                                                                        return player.name.substring(0, 2).toUpperCase();
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="absolute bottom-0 w-full flex justify-center pb-1 z-20">
                                                            <div className={`px-2 py-[1px] rounded-full text-[9px] font-black backdrop-blur-md border ${
                                                                isActive 
                                                                    ? 'dark:bg-white bg-blue-500 dark:text-black text-white dark:border-white border-blue-500' 
                                                                    : 'dark:bg-black/60 bg-white/80 dark:border-white/20 border-slate-200 dark:text-white text-slate-600'
                                                            }`}>
                                                                {stableOVR}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center w-full truncate transition-colors ${
                                                        isActive ? 'dark:text-white text-slate-800 drop-shadow-md' : 'text-zinc-500 dark:group-hover:text-zinc-300 group-hover:text-slate-800'
                                                    }`}>
                                                        {player.name.split(' ').pop()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {groupIdx < groups.length - 1 && groups[groupIdx + 1].players.length > 0 && (
                                        <div className="w-[1px] h-16 dark:bg-white/[0.05] bg-slate-200 ml-2 mr-2 rounded-full shrink-0"></div>
                                    )}
                                </React.Fragment>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
}
