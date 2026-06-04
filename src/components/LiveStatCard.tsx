import React from "react";
import { User, Activity, Zap } from "lucide-react";

interface Props {
    atCrease: any[];
    currentBowler: any;
    onBatsmanClick?: (name: string) => void;
    onBowlerClick?: (name: string) => void;
}

export const LiveStatCard = ({ atCrease, currentBowler, onBatsmanClick, onBowlerClick }: Props) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batsmen at Crease */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg group transition-all duration-300 hover:border-blue-500/30">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="p-4 pl-5">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-blue-400" />
                            <h4 className="text-slate-200 font-bold uppercase tracking-widest text-[11px]">Batsmen at Crease</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">LIVE STATS</span>
                    </div>
                    {atCrease.length > 0 ? (
                        <div className="space-y-4">
                            {atCrease.map((b, i) => (
                                <div key={b.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 shadow-inner group-hover:border-blue-500/20 transition-colors cursor-pointer hover:bg-slate-700"
                                            onClick={() => onBatsmanClick?.(b.name)}
                                        >
                                            {b.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p 
                                                className="text-white font-bold text-sm flex items-center gap-2 truncate cursor-pointer hover:text-blue-400 transition-colors"
                                                onClick={() => onBatsmanClick?.(b.name)}
                                            >
                                                {b.name}
                                                {i === 0 && (
                                                    <span className="inline-block animate-pulse">
                                                        <Zap size={10} className="text-blue-400 fill-blue-400" />
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/30">4s: <span className="text-blue-400 font-bold">{b.fours || 0}</span></span>
                                                <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/30">6s: <span className="text-purple-400 font-bold">{b.sixes || 0}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4 shrink-0">
                                        <div className="min-w-[3.5rem]">
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-0.5">RUNS (B)</p>
                                            <p className="text-xl font-black text-white leading-none">
                                                {b.runs} <span className="text-xs font-bold text-slate-500 ml-0.5">({b.balls})</span>
                                            </p>
                                        </div>
                                        <div className="min-w-[2.5rem] border-l border-slate-800 pl-3">
                                            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-0.5">SR</p>
                                            <p className="text-sm font-bold text-emerald-400 leading-none mt-1">{b.sr}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 opacity-40">
                            <Activity className="text-slate-600 mb-2" size={24} />
                            <p className="text-slate-500 text-xs font-medium italic tracking-wide">Waiting for play to resume...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Bowler */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg group transition-all duration-300 hover:border-amber-500/30">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="p-4 pl-5">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-amber-400" />
                            <h4 className="text-slate-200 font-bold uppercase tracking-widest text-[11px]">Current Bowler</h4>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-500 font-medium">IN ATTACK</span>
                        </div>
                    </div>
                    {currentBowler ? (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-11 h-11 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-amber-500 font-black text-lg shrink-0 shadow-lg group-hover:border-amber-500/20 transition-colors cursor-pointer hover:bg-slate-700"
                                        onClick={() => onBowlerClick?.(currentBowler.name)}
                                    >
                                        {currentBowler.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p 
                                            className="text-white font-black text-lg leading-tight uppercase tracking-tight cursor-pointer hover:text-amber-400 transition-colors"
                                            onClick={() => onBowlerClick?.(currentBowler.name)}
                                        >
                                            {currentBowler.name}
                                        </p>
                                        <p className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase mt-0.5">ECO: {currentBowler.economy || currentBowler.eco || '0.0'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-white leading-none tracking-tighter">
                                        {currentBowler.wickets}<span className="text-slate-500 text-sm font-bold ml-1">W</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30 flex flex-col items-center">
                                    <p className="text-slate-500 text-[8px] uppercase font-black tracking-widest mb-1">Overs Bowled</p>
                                    <p className="text-base font-black text-white leading-none">{currentBowler.overs}</p>
                                </div>
                                <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30 flex flex-col items-center">
                                    <p className="text-slate-500 text-[8px] uppercase font-black tracking-widest mb-1">Runs Conceded</p>
                                    <p className="text-base font-black text-white leading-none">{currentBowler.runs}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 opacity-40">
                            <User className="text-slate-600 mb-2" size={24} />
                            <p className="text-slate-500 text-xs font-medium italic tracking-wide">Waiting for next over...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
