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
    // Hardcoded regions based on user request (India first, then others)
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
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase ml-1">Cricket Players</h2>
            
            {/* Filter by Region Dropdown */}
            <div className="relative">
                <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-[#1C2433] rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-700 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-6 overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700/50 ${selectedRegionObj.name.toLowerCase().includes('west indies') ? "rounded-full p-0.5 bg-white/10 object-contain" : "rounded-[2px]"}`}>
                            <img src={selectedRegionObj.flag} alt="Region" className={`w-full h-full ${selectedRegionObj.name.toLowerCase().includes('west indies') ? 'object-contain' : 'object-cover'}`} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Filter by Region</p>
                            <p className="text-white font-bold">{selectedRegionObj.name}</p>
                        </div>
                    </div>
                    <svg className={`w-5 h-5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-[#1C2433] border border-slate-700 rounded-xl shadow-xl z-50 max-h-[240px] overflow-y-auto custom-scrollbar">
                        {regions.map(r => (
                            <div 
                                key={r.id}
                                onClick={() => {
                                    setSelectedTeam(r.id);
                                    setIsDropdownOpen(false);
                                }}
                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800 transition-colors ${selectedTeam === r.id ? 'bg-slate-800/50' : ''}`}
                            >
                                <img src={r.flag} alt={r.name} className={`w-6 h-4 object-cover border border-slate-700/50 ${r.name.toLowerCase().includes('west indies') ? "rounded-full bg-white/10" : "rounded-[2px]"}`} />
                                <span className={`font-bold ${selectedTeam === r.id ? 'text-blue-400' : 'text-slate-200'}`}>{r.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Player List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                {isLoading && (
                    <div className="text-center p-8 text-slate-500">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs">Loading Squad...</p>
                    </div>
                )}
                
                {squadData?.players?.map((player: Player) => {
                    const isActive = activePlayerId === player.espnId;
                    // Generate a stable OVR based on espnId so it doesn't change on re-render
                    const idSum = player.espnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const stableOVR = (idSum % 16) + 80;

                    return (
                        <div 
                            key={player.espnId}
                            onClick={() => onSelectPlayer(player)}
                            className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all border ${
                                isActive 
                                    ? 'bg-[#1C2433] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] border-l-4 border-l-blue-500' 
                                    : 'bg-[#141A25] border-transparent hover:bg-[#1C2433]'
                            }`}
                        >
                            {/* Headshot */}
                            <div className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-b from-slate-700 to-slate-900 border-2 ${isActive ? 'border-blue-500' : 'border-slate-700'} flex-shrink-0 relative mr-4`}>
                                {player.imageUrl ? (
                                    <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover object-top" />
                                ) : (
                                    <svg className="w-full h-full text-slate-500 mt-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.672-10 5v1h20v-1c0-3.328-6.685-5-10-5z" />
                                    </svg>
                                )}
                            </div>
                            
                            {/* Player Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <img src={squadData.flagUrl} alt={squadData.teamName} className={`w-3 h-2 ${squadData.teamName.toLowerCase().includes('west indies') ? 'rounded-full object-contain' : 'rounded-[1px] object-cover'}`} />
                                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{squadData.teamName}</span>
                                </div>
                                <h3 className={`font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>{player.name}</h3>
                                <p className="text-xs text-slate-500">{player.role}</p>
                            </div>
                            
                            {/* Stable OVR Rating */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 font-bold">OVR</span>
                                <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                    {stableOVR}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
