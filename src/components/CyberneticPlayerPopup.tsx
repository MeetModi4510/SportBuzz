import React, { useState, useMemo, useEffect } from "react";
import { X, User, Zap, Target, TrendingUp, Swords, Shield, Flame, BarChart3, Users, Trophy, Loader2, Gauge, Activity, Radio, Cpu, Fingerprint, Scan, Boxes, Crosshair, Sparkles } from "lucide-react";
import { Ball } from "@/data/scoringTypes";
import { playerApi } from "@/services/api";

interface PlayerInfo {
    name: string;
    role?: string;
    photo?: string;
}

interface Props {
    playerName: string;
    type: "batsman" | "bowler";
    allBalls: Ball[];
    inning: number;
    teamName?: string;
    teamPlayers?: PlayerInfo[];
    onClose: () => void;
    matchStats?: any; // To allow passing pre-computed stats
}

// ════════════════════════════════════════════
// SHOCKER UI COMPONENTS (CYBERNETIC HUD)
// ════════════════════════════════════════════

const DNAHelix = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 200" className={className}>
    <defs>
      <linearGradient id="dna-grad-p" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {[...Array(10)].map((_, i) => (
      <g key={i} className="animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
        <circle cx={50 + Math.sin(i) * 20} cy={20 * i + 10} r="2" fill="url(#dna-grad-p)" />
        <circle cx={50 - Math.sin(i) * 20} cy={20 * i + 10} r="2" fill="url(#dna-grad-p)" />
        <line 
          x1={50 + Math.sin(i) * 20} y1={20 * i + 10} 
          x2={50 - Math.sin(i) * 20} y2={20 * i + 10} 
          stroke="url(#dna-grad-p)" strokeWidth="0.5" strokeDasharray="2 2"
        />
      </g>
    ))}
  </svg>
);

const IdentityScanner = ({ id }: { id?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
    <div className="absolute inset-0 bg-blue-500/5" />
    
    {id && (
      <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/80 text-white text-[7px] font-black rounded border border-emerald-400/50 backdrop-blur-sm z-10">
        REF_{id}
      </div>
    )}

    <div className="absolute bottom-3 left-3 font-mono text-[7px] text-blue-400 opacity-60 space-y-0.5">
      <div className="flex gap-2"><span>[SYNC_STAT]</span> <span>STABLE</span></div>
      <div className="flex gap-2"><span>[HOLO_LINK]</span> <span>ACTIVE</span></div>
    </div>
  </div>
);

const QuantumStatCard = ({ icon: Icon, label, value, subValue, color }: any) => (
  <div className="relative group/stat p-4 rounded-[1.5rem] bg-slate-900/60 border border-slate-800/50 hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-inner">
    <div className="absolute top-0 right-0 p-2 opacity-[0.05] group-hover/stat:opacity-10 transition-opacity">
      <Icon size={40} />
    </div>
    <div className="relative z-10 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${color} shadow-lg`}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-[7px] uppercase font-black tracking-widest text-slate-500">{label}</p>
          {subValue && <span className="text-[7px] font-mono text-blue-400 animate-pulse">{subValue}</span>}
        </div>
      </div>
    </div>
  </div>
);

export const CyberneticPlayerPopup: React.FC<Props> = ({
    playerName, type, allBalls, inning, teamName, teamPlayers, onClose, matchStats
}) => {
    const [view, setView] = useState<"summary" | "profile">("summary");
    const [careerStats, setCareerStats] = useState<any>(null);
    const [careerLoading, setCareerLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 15;
        const y = (clientY / window.innerHeight - 0.5) * 15;
        setMousePos({ x, y });
    };

    useEffect(() => {
        if (view === "profile" && !careerStats) {
            setCareerLoading(true);
            playerApi.getStats(playerName)
                .then((res: any) => {
                    if (res?.data?.formats) setCareerStats(res.data.formats);
                })
                .catch(err => console.error('Failed to load career stats:', err))
                .finally(() => setCareerLoading(false));
        }
    }, [view, playerName, careerStats]);

    const playerBalls = useMemo(() => {
        return allBalls.filter(
            b => b.inning === inning && !b.isCommentaryOnly && (type === "batsman" ? b.batsman === playerName : b.bowler === playerName)
        );
    }, [allBalls, inning, playerName, type]);

    const stats = useMemo(() => {
        if (matchStats) return matchStats;
        
        if (type === "batsman") {
            let runs = 0, balls = 0, fours = 0, sixes = 0;
            for (const b of playerBalls) {
                if (b.extraType !== "wide") balls++;
                if (b.extraType === "none" || b.extraType === "noball") {
                    runs += b.runs;
                    if (b.runs === 4) fours++;
                    if (b.runs === 6) sixes++;
                }
            }
            return { runs, balls, fours, sixes, sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0" };
        } else {
            let runs = 0, legalBalls = 0, wickets = 0, dots = 0;
            for (const b of playerBalls) {
                runs += b.totalBallRuns;
                if (b.wicket?.isWicket) wickets++;
                if (b.totalBallRuns === 0) dots++;
                if (b.extraType !== "wide" && b.extraType !== "noball") legalBalls++;
            }
            const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
            const econ = legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(1) : "0.0";
            return { runs, overs, wickets, economy: econ, dots };
        }
    }, [playerBalls, matchStats, type]);

    const playerInfo = useMemo(() => teamPlayers?.find(p => p.name === playerName) || null, [teamPlayers, playerName]);
    const initials = playerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose} onMouseMove={handleMouseMove}>
            <style>
              {`
                @keyframes scan {
                  0%, 100% { top: 0%; opacity: 0; }
                  50% { top: 100%; opacity: 1; }
                }
                .perspective-1000 { perspective: 1000px; }
              `}
            </style>
            
            <div 
                className="relative w-full max-w-2xl perspective-1000"
                onClick={e => e.stopPropagation()}
                style={{ 
                    transform: `rotateX(${-mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)`
                }}
            >
                {/* ── Cybernetic Backdrop ── */}
                <div className="relative overflow-hidden bg-[#020617]/90 border border-slate-700/50 rounded-[3rem] shadow-[0_0_80px_rgba(30,58,138,0.3)] backdrop-blur-3xl group/popup">
                    <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />

                    {/* ── Header Area ── */}
                    <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8 items-center border-b border-slate-800/80">
                        <button onClick={onClose} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-red-500/50 transition-all">
                            <X size={20} />
                        </button>

                        {/* Avatar Unit */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-tr from-blue-600/20 via-slate-800 to-purple-600/20 p-[2px] shadow-2xl overflow-hidden relative group/avatar">
                                <div className="w-full h-full rounded-[2.4rem] bg-[#020617] flex items-center justify-center overflow-hidden border border-white/5">
                                    {playerInfo?.photo ? 
                                        <img src={playerInfo.photo} className="w-full h-full object-cover opacity-80 group-hover/avatar:opacity-100 transition-opacity" /> : 
                                        <User size={60} className="text-slate-800 group-hover/avatar:text-blue-500/50 transition-colors" />
                                    }
                                    <IdentityScanner id={playerName.substring(0,3).toUpperCase()} />
                                </div>
                            </div>
                        </div>

                        {/* Text Unit */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20 animate-pulse">
                                      Neural Link Active
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">{type.toUpperCase()} // UNIT_{initials}</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight italic">
                                    {playerName}
                                </h2>
                                {teamName && <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 justify-center md:justify-start">
                                    <Boxes size={10} className="text-blue-500" /> {teamName}
                                </p>}
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={12} className="text-emerald-500" /> STABLE
                                </div>
                                <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Radio size={12} className="text-blue-500 animate-pulse" /> SYNCED
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Main Content Area ── */}
                    <div className="relative z-10 p-8">
                        {view === "summary" ? (
                            <div className="space-y-8">
                                {/* Quantum Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {type === "batsman" ? (
                                        <>
                                            <QuantumStatCard icon={Zap} label="Runs" value={stats.runs} subValue={`SR ${stats.sr}`} color="text-yellow-400" />
                                            <QuantumStatCard icon={Target} label="Balls" value={stats.balls} color="text-blue-400" />
                                            <QuantumStatCard icon={Swords} label="Fours" value={stats.fours} color="text-emerald-400" />
                                            <QuantumStatCard icon={Flame} label="Sixes" value={stats.sixes} color="text-orange-400" />
                                        </>
                                    ) : (
                                        <>
                                            <QuantumStatCard icon={Crosshair} label="Wickets" value={stats.wickets} subValue={`Econ ${stats.economy}`} color="text-red-400" />
                                            <QuantumStatCard icon={Activity} label="Overs" value={stats.overs} color="text-blue-400" />
                                            <QuantumStatCard icon={Shield} label="Dots" value={stats.dots} color="text-emerald-400" />
                                            <QuantumStatCard icon={Zap} label="Runs" value={stats.runs} color="text-yellow-400" />
                                        </>
                                    )}
                                </div>

                                {/* Dynamic Skill DNA & Insight Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 relative overflow-hidden group/dna">
                                        <div className="absolute top-4 left-6 z-10">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Trait Analysis</p>
                                            <p className="text-lg font-black text-white italic">Neural Map</p>
                                        </div>
                                        <DNAHelix className="h-48 w-full opacity-40 group-hover/dna:opacity-60 transition-opacity" />
                                    </div>

                                    <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8 flex flex-col justify-center gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                                    <Cpu size={14} className="text-blue-400" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tactical Insight</h4>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                                {type === "batsman" ? 
                                                    `Neural analysis indicates high striking precision of ${stats.sr}% in the current simulation. Skill markers for power hitting are spiking.` :
                                                    `Spatial analytics demonstrate a high dot-ball suppression rate. Efficiency markers suggest stable trajectory control at ${stats.economy} ER.`
                                                }
                                            </p>
                                        </div>

                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setView("profile")}
                                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/20"
                                            >
                                                Archive Access
                                            </button>
                                            <button className="p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl hover:bg-slate-700 transition-colors">
                                                <Sparkles size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-black text-white italic flex items-center gap-3">
                                        <Trophy className="text-yellow-400" /> Career Frequency
                                    </h4>
                                    <button onClick={() => setView("summary")} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">
                                        Back to Tactical
                                    </button>
                                </div>
                                
                                {careerLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Archive...</p>
                                    </div>
                                ) : careerStats ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Simplified career view for the popup */}
                                        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Matches Parsed</p>
                                                <p className="text-4xl font-black text-white">{careerStats.All?.matchesPlayed || 0}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900">
                                                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">Role XP</p>
                                                    <p className="text-lg font-black text-blue-400">
                                                        {type === "batsman" ? (careerStats.All?.batting?.runs || 0) : (careerStats.All?.bowling?.wickets || 0)}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900">
                                                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">Precision</p>
                                                    <p className="text-lg font-black text-purple-400">
                                                        {type === "batsman" ? (careerStats.All?.batting?.average || 0) : (careerStats.All?.bowling?.economy || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 p-8 flex flex-col items-center justify-center text-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                                                <Fingerprint size={32} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="text-white font-black italic">Biometric Confirmed</p>
                                                <p className="text-xs text-slate-500 mt-1">Full profile available in main terminal.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center py-20 text-slate-600 italic">No archive data found for this unit.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer HUD Decor */}
                    <div className="p-4 border-t border-slate-800/50 flex justify-between items-center text-[#334155]">
                        <div className="flex gap-1.5 items-center">
                           {[...Array(3)].map((_, i) => (
                             <div key={i} className="w-1 h-1 bg-slate-800 rounded-full" />
                           ))}
                           <span className="text-[7px] font-black uppercase tracking-[0.4em] ml-2">SportBuzz HQ Verified Simulation</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-[7px] font-black uppercase tracking-[0.4em]">VER_09.4X</span>
                            <span className="text-[7px] font-black uppercase tracking-[0.4em]">LOCAL_NODE_{Math.floor(Math.random() * 99)}</span>
                        </div>
                    </div>
                </div>

                {/* Cursor Following HUD Glow (Decorative) */}
                <div 
                    className="absolute -inset-20 pointer-events-none opacity-20 bg-blue-500/10 blur-[100px] rounded-full"
                    style={{ 
                        transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`
                    }}
                />
            </div>
        </div>
    );
};
