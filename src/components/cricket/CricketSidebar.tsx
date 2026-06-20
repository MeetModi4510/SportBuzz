import React, { useState } from 'react';
import { usePerformanceLabSquad } from '../../hooks/usePerformanceLab';

interface Player {
    espnId: string;
    name: string;
    role: string;
    imageUrl: string;
}

interface CricketSidebarProps {
    activePlayerId: string | null;
    onSelectPlayer: (player: Player) => void;
}

export function CricketSidebar({ activePlayerId, onSelectPlayer }: CricketSidebarProps) {
    const regions = [
        { id: 'india-2', name: 'India', flag: 'https://flagcdn.com/w80/in.png' },
        { id: 'australia-4', name: 'Australia', flag: 'https://flagcdn.com/w80/au.png' },
        { id: 'england-9', name: 'England', flag: 'https://flagcdn.com/w80/gb-eng.png' },
        { id: 'south-africa-11', name: 'South Africa', flag: 'https://flagcdn.com/w80/za.png' },
        { id: 'new-zealand-13', name: 'New Zealand', flag: 'https://flagcdn.com/w80/nz.png' },
        { id: 'pakistan-3', name: 'Pakistan', flag: 'https://flagcdn.com/w80/pk.png' },
        { id: 'sri-lanka-5', name: 'Sri Lanka', flag: 'https://flagcdn.com/w80/lk.png' },
        { id: 'west-indies-10', name: 'West Indies', flag: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },
        { id: 'bangladesh-6', name: 'Bangladesh', flag: 'https://flagcdn.com/w80/bd.png' },
        { id: 'afghanistan-96', name: 'Afghanistan', flag: 'https://flagcdn.com/w80/af.png' },
        { id: 'zimbabwe-12', name: 'Zimbabwe', flag: 'https://flagcdn.com/w80/zw.png' },
        { id: 'ireland-27', name: 'Ireland', flag: 'https://flagcdn.com/w80/ie.png' },
        { id: 'scotland-23', name: 'Scotland', flag: 'https://flagcdn.com/w80/gb-sct.png' },
        { id: 'netherlands-24', name: 'Netherlands', flag: 'https://flagcdn.com/w80/nl.png' },
        { id: 'nepal-72', name: 'Nepal', flag: 'https://flagcdn.com/w80/np.png' }
    ];
    
    const [selectedTeam, setSelectedTeam] = useState('india-2');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const { data: squadData, isLoading } = usePerformanceLabSquad(selectedTeam);

    const selectedRegionObj = regions.find(r => r.id === selectedTeam) || regions[0];

    return (
        <div className="w-full flex-shrink-0 flex flex-col gap-3 relative z-50">
            <div className="flex items-center gap-4">
                
                {/* Region Dropdown (Left side of the rail) */}
                <div className="relative z-30 w-fit flex-shrink-0">
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shadow-lg h-[88px] min-w-[220px] w-fit"
                    >
                        <div className="flex items-center gap-4 pr-4">
                            <div className={`w-10 h-7 overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700/50 shadow-sm ${selectedRegionObj.name.toLowerCase().includes('west indies') ? "rounded-full p-0.5 bg-white/10 object-contain" : "rounded-[4px]"}`}>
                                <img src={selectedRegionObj.flag} alt="Region" className={`w-full h-full ${selectedRegionObj.name.toLowerCase().includes('west indies') ? 'object-contain' : 'object-cover'}`} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">National Squad</p>
                                <p className="text-white font-black text-base whitespace-nowrap">{selectedRegionObj.name}</p>
                            </div>
                        </div>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute top-full mt-3 left-0 w-full bg-[#0B1120]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] z-50 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                            {regions.map(r => (
                                <div 
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedTeam(r.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors ${selectedTeam === r.id ? 'bg-blue-500/15 border border-blue-500/30' : 'border border-transparent'}`}
                                >
                                    <div className="w-8 flex justify-center items-center flex-shrink-0">
                                        <img src={r.flag} alt={r.name} className={`w-8 h-5 object-cover shadow-sm ${r.name.toLowerCase().includes('west indies') ? "rounded-full bg-white/10" : "rounded-[3px]"}`} />
                                    </div>
                                    <span className={`font-bold text-sm tracking-wide whitespace-nowrap ${selectedTeam === r.id ? 'text-blue-400' : 'text-slate-200'}`}>{r.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Horizontal Player List */}
                <div className="flex-1 flex items-center gap-4 overflow-x-auto pb-4 pt-2 custom-scrollbar pr-4 hide-scrollbar">
                    {isLoading && (
                        <div className="flex items-center justify-center w-full h-[140px] text-zinc-500 gap-3">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span className="text-xs font-medium tracking-[0.2em] uppercase">Syncing Roster</span>
                        </div>
                    )}
                    
                    {(() => {
                        if (!squadData?.players) return null;

                        const groups = [
                            { label: 'BATSMEN', players: [] as Player[] },
                            { label: 'ALL-ROUNDERS', players: [] as Player[] },
                            { label: 'WICKET-KEEPERS', players: [] as Player[] },
                            { label: 'BOWLERS', players: [] as Player[] }
                        ];

                        squadData.players.forEach((player: Player) => {
                            const r = (player.role || '').toLowerCase();
                            if (r.includes('wicket')) groups[2].players.push(player);
                            else if (r.includes('all')) groups[1].players.push(player);
                            else if (r.includes('bowl')) groups[3].players.push(player);
                            else groups[0].players.push(player);
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
                                        {group.players.map((player: Player) => {
                                            const isActive = activePlayerId === player.espnId;
                                            const idSum = player.espnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const stableOVR = (idSum % 16) + 80;

                                            const highResUrl = player.imageUrl ? player.imageUrl.replace(/w=\d+/g, 'w=800').replace(/h=\d+/g, 'h=800') : '';

                                            return (
                                                <div 
                                                    key={player.espnId}
                                                    onClick={() => onSelectPlayer(player)}
                                                    className="group flex-shrink-0 flex flex-col items-center gap-3 w-[72px] md:w-[88px] cursor-pointer"
                                                >
                                                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden transition-all duration-500 ${
                                                        isActive 
                                                            ? 'ring-2 ring-white ring-offset-4 ring-offset-[#0A0A0B] shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-105 z-10' 
                                                            : 'ring-1 ring-white/10 opacity-50 group-hover:opacity-100 group-hover:ring-white/30 group-hover:scale-105'
                                                    }`}>
                                                        {highResUrl ? (
                                                            <img 
                                                                src={highResUrl} 
                                                                alt={player.name} 
                                                                className="w-full h-full object-cover object-top" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.672-10 5v1h20v-1c0-3.328-6.685-5-10-5z" />
                                                                </svg>
                                                            </div>
                                                        )}

                                                        <div className="absolute bottom-0 w-full flex justify-center pb-1">
                                                            <div className={`px-2 py-[1px] rounded-full text-[9px] font-black backdrop-blur-md border ${
                                                                isActive 
                                                                    ? 'bg-white text-black border-white' 
                                                                    : 'bg-black/60 border-white/20 text-white'
                                                            }`}>
                                                                {stableOVR}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center w-full truncate transition-colors ${
                                                        isActive ? 'text-white drop-shadow-md' : 'text-zinc-500 group-hover:text-zinc-300'
                                                    }`}>
                                                        {player.name.split(' ').pop()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {groupIdx < groups.length - 1 && groups[groupIdx + 1].players.length > 0 && (
                                        <div className="w-[1px] h-16 bg-white/[0.05] ml-2 mr-2 rounded-full shrink-0"></div>
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
