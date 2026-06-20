import React from 'react';
import { Calendar, MapPin, Activity, Target } from 'lucide-react';
import { FootballPlayer } from '../../hooks/useFootballSquads';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface FootballPerformanceLabProps {
    activePlayer: (FootballPlayer & { country: string }) | null;
}

export function FootballPerformanceLab({ activePlayer }: FootballPerformanceLabProps) {
    if (!activePlayer) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-[60px] text-slate-500 min-h-[600px] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] relative overflow-hidden group w-full z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Glowing Radar Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent,transparent,rgba(16,185,129,0.1),transparent)] animate-[spin_8s_linear_infinite] rounded-full pointer-events-none"></div>

                <div className="relative flex items-center justify-center mb-10">
                    <div className="absolute w-40 h-40 border border-emerald-500/30 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                    <div className="absolute w-56 h-56 border border-teal-500/20 rounded-full animate-[ping_3s_ease-in-out_infinite_0.5s]"></div>
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(16,185,129,0.5)] transform rotate-3 group-hover:rotate-0 transition-transform duration-500 relative z-10">
                        <svg className="w-12 h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-4-8a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 tracking-tighter drop-shadow-lg relative z-10">The Command Center</h2>
                <p className="text-sm mt-4 text-slate-300 max-w-sm text-center leading-relaxed font-bold uppercase tracking-[0.2em] relative z-10">Select a player from the roster rail above to initialize deep analytics</p>
            </div>
        );
    }

    // Deterministic pseudo-random generation based on ID so stats stay stable for the same player
    const idSum = String(activePlayer.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const stableOVR = (idSum % 16) + 78;
    
    // Generate deterministic attributes based on role
    const pos = (activePlayer.position || '').toLowerCase();
    const isGK = pos.includes('goalkeeper') || pos.includes('keeper');
    const isDef = pos.includes('defender');
    const isMid = pos.includes('midfielder');
    
    // Base attribute modifiers based on position
    const getAttr = (base: number, variance: number, seedAdd: number) => {
        const val = base + ((idSum + seedAdd) % variance);
        return Math.min(Math.max(val, 40), 99);
    };

    let radarData = [];
    if (isGK) {
        radarData = [
            { subject: 'Diving', A: getAttr(75, 20, 1), fullMark: 100 },
            { subject: 'Handling', A: getAttr(70, 20, 2), fullMark: 100 },
            { subject: 'Kicking', A: getAttr(65, 25, 3), fullMark: 100 },
            { subject: 'Reflexes', A: getAttr(80, 15, 4), fullMark: 100 },
            { subject: 'Speed', A: getAttr(30, 25, 5), fullMark: 100 },
            { subject: 'Positioning', A: getAttr(75, 20, 6), fullMark: 100 },
        ];
    } else {
        radarData = [
            { subject: 'Pace', A: getAttr(isDef ? 60 : 75, 25, 1), fullMark: 100 },
            { subject: 'Shooting', A: getAttr(isDef ? 40 : (isMid ? 65 : 80), 20, 2), fullMark: 100 },
            { subject: 'Passing', A: getAttr(isMid ? 80 : 65, 20, 3), fullMark: 100 },
            { subject: 'Dribbling', A: getAttr(isDef ? 50 : 75, 25, 4), fullMark: 100 },
            { subject: 'Defending', A: getAttr(isDef ? 80 : (isMid ? 60 : 35), 20, 5), fullMark: 100 },
            { subject: 'Physical', A: getAttr(70, 25, 6), fullMark: 100 },
        ];
    }

    const highResUrl = `/api/football/fotmob-player-image/${activePlayer.id}`;

    return (
        <div className="flex-1 flex flex-col z-10 w-full px-4 lg:px-12 pb-16">
            
            {/* TOP HEADER: Player Identity */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 pb-10 mb-8 border-b border-white/[0.05]">
                {/* Small Crisp Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-[#0B1120] border border-white/[0.08] shadow-2xl flex-shrink-0 relative group flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                    {highResUrl && !highResUrl.includes('placeholder') ? (
                        <img 
                            src={highResUrl} 
                            alt={activePlayer.name} 
                            className="w-full h-full object-cover object-top z-10" 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activePlayer.name)}&background=0D1117&color=fff&size=256`;
                            }}
                        />
                    ) : (
                        <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activePlayer.name)}&background=0D1117&color=fff&size=256`}
                            alt={activePlayer.name}
                            className="w-full h-full object-cover z-10"
                        />
                    )}
                </div>

                {/* Name and Basic Info */}
                <div className="flex flex-col items-center md:items-start gap-3 flex-1 text-center md:text-left">
                    <span className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">
                        {activePlayer.country}
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                        {activePlayer.name}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2">
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white font-bold text-sm flex items-center gap-2 shadow-sm">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest">OVR</span>
                            {stableOVR}
                        </div>
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-zinc-300 font-medium text-sm shadow-sm">
                            {activePlayer.position}
                        </div>
                    </div>
                </div>

                {/* Number Badge */}
                <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-lg">
                    <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">No.</span>
                    <span className="text-4xl font-black text-white">{activePlayer.number || '--'}</span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="w-full relative z-20">
                <div className="flex flex-col gap-12">
                    {/* Identity Matrix */}
                    <div>
                        <h3 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">Identity Matrix</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Age</span>
                                    <span className="text-sm font-bold text-white tracking-wide">{activePlayer.age || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">National Team</span>
                                    <span className="text-sm font-bold text-white tracking-wide">{activePlayer.country}</span>
                                </div>
                            </div>
                            <div className="bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex items-center gap-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-amber-400 group-hover:text-amber-300 transition-colors">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Position</span>
                                    <span className="text-sm font-bold text-white tracking-wide">{activePlayer.position || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-4">
                        {/* Fake Form Trend */}
                        <div className="w-full">
                            <div className="bg-[#0B0D14]/80 backdrop-blur-md p-6 rounded-3xl border border-white/[0.03] shadow-lg h-full">
                                <h3 className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-[0.2em] mb-6">Recent Match Ratings</h3>
                                <div className="flex items-end gap-2 h-48 w-full">
                                    {Array.from({ length: 8 }).map((_, i) => {
                                        const rating = getAttr(60, 30, i * 10);
                                        const height = `${rating}%`;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                <div className="w-full bg-white/5 rounded-t-lg relative flex flex-col justify-end overflow-hidden transition-all duration-300 group-hover:bg-white/10" style={{ height: '100%' }}>
                                                    <div 
                                                        className={`w-full rounded-t-lg transition-all duration-1000 ${rating >= 80 ? 'bg-emerald-500' : rating >= 70 ? 'bg-teal-500' : 'bg-slate-500'}`}
                                                        style={{ height }}
                                                    ></div>
                                                </div>
                                                <span className="text-[9px] text-zinc-500 font-bold">{rating / 10}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Attribute Radar */}
                        <div className="w-full h-[320px]">
                            <div className="bg-[#0B0D14]/80 backdrop-blur-md p-5 rounded-3xl border border-white/[0.03] shadow-lg h-full relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="p-2 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-xl border border-white/[0.05]">
                                        <Activity className="w-4 h-4 text-teal-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-[0.2em]">Attribute Radar</h3>
                                        <p className="text-zinc-500 text-[9px] uppercase tracking-widest mt-0.5">Core skill breakdown</p>
                                    </div>
                                </div>

                                <div className="h-[220px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: '#27272a', borderRadius: '12px' }}
                                                itemStyle={{ color: '#34D399', fontWeight: 600 }}
                                            />
                                            <Radar
                                                name="Attributes"
                                                dataKey="A"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                fill="url(#radarGradient)"
                                                fillOpacity={0.6}
                                            />
                                            <defs>
                                                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.2}/>
                                                </linearGradient>
                                            </defs>
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
