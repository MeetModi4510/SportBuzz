import React, { useState, useMemo, useEffect } from "react";
import { X, ChevronLeft, User, Zap, Target, TrendingUp, Swords, Shield, Flame, BarChart3, Users, Trophy, Loader2 } from "lucide-react";
import { Ball } from "@/data/scoringTypes";
import { playerApi } from "@/services/api";
import { WagonWheel } from "@/components/WagonWheel";

interface BatsmanStat {
    name: string; runs: number; balls: number; fours: number; sixes: number; sr: string;
    isOut: boolean; dismissalText: string;
}

interface PlayerInfo {
    name: string;
    role?: string;
    photo?: string;
}

interface Props {
    batsmanName: string;
    allBalls: Ball[];
    inning: number;
    batStat: BatsmanStat;
    teamName?: string;
    teamPlayers?: PlayerInfo[];
    onClose: () => void;
}

/* ── Ball-by-Ball chip color ── */
const chipStyle = (runs: number, isWicket: boolean, extraType: string) => {
    if (isWicket) return "bg-red-500/20 border-red-500/60 text-red-400";
    if (extraType === "wide" || extraType === "noball") return "bg-yellow-500/15 border-yellow-500/50 text-yellow-400";
    if (runs === 6) return "bg-purple-500/20 border-purple-500/60 text-purple-400";
    if (runs === 4) return "bg-blue-500/20 border-blue-500/60 text-blue-400";
    if (runs >= 1 && runs <= 3) return "bg-emerald-500/15 border-emerald-500/50 text-emerald-400";
    return "bg-slate-800 border-slate-700 text-slate-400"; // dot
};

const chipLabel = (b: Ball) => {
    if (b.wicket?.isWicket) return "W";
    if (b.extraType === "wide") return "Wd";
    if (b.extraType === "noball") return "Nb";
    return String(b.runs);
};

export const BatsmanDetailPopup: React.FC<Props> = ({
    batsmanName, allBalls, inning, batStat, teamName, teamPlayers, onClose
}) => {
    const [view, setView] = useState<"summary" | "profile">("summary");
    const [careerStats, setCareerStats] = useState<any>(null);
    const [careerLoading, setCareerLoading] = useState(false);

    /* ── Fetch career stats when profile view is opened ── */
    useEffect(() => {
        if (view === "profile" && !careerStats) {
            setCareerLoading(true);
            playerApi.getStats(batsmanName)
                .then(res => {
                    if (res?.data?.formats) setCareerStats(res.data.formats);
                })
                .catch(err => console.error('Failed to load career stats:', err))
                .finally(() => setCareerLoading(false));
        }
    }, [view, batsmanName, careerStats]);

    /* ── Compute detailed ball-by-ball for THIS batsman in THIS innings ── */
    const batsmanBalls = useMemo(() => {
        return allBalls.filter(
            b => b.inning === inning && !b.isCommentaryOnly && b.batsman === batsmanName
        );
    }, [allBalls, inning, batsmanName]);

    /* ── Detailed stats ── */
    const detailedStats = useMemo(() => {
        let dots = 0, singles = 0, doubles = 0, threes = 0;
        for (const b of batsmanBalls) {
            if (b.extraType === "wide" || b.extraType === "bye" || b.extraType === "legbye") continue;
            if (b.runs === 0) dots++;
            else if (b.runs === 1) singles++;
            else if (b.runs === 2) doubles++;
            else if (b.runs === 3) threes++;
        }
        const ballsFaced = batsmanBalls.filter(b => b.extraType !== "wide").length;
        const dotPct = ballsFaced > 0 ? ((dots / ballsFaced) * 100).toFixed(0) : "0";
        const boundaryPct = ballsFaced > 0 ? (((batStat.fours + batStat.sixes) / ballsFaced) * 100).toFixed(0) : "0";
        const boundaryRuns = (batStat.fours * 4) + (batStat.sixes * 6);
        const rotationRuns = batStat.runs - boundaryRuns;

        return { dots, singles, doubles, threes, dotPct, boundaryPct, boundaryRuns, rotationRuns, ballsFaced };
    }, [batsmanBalls, batStat]);

    /* ── Scoring zones bar segments ── */
    const scoringZones = useMemo(() => {
        const total = detailedStats.ballsFaced || 1;
        return [
            { label: "0s", count: detailedStats.dots, color: "bg-slate-600", pct: (detailedStats.dots / total * 100) },
            { label: "1s", count: detailedStats.singles, color: "bg-emerald-500", pct: (detailedStats.singles / total * 100) },
            { label: "2s", count: detailedStats.doubles, color: "bg-teal-500", pct: (detailedStats.doubles / total * 100) },
            { label: "3s", count: detailedStats.threes, color: "bg-cyan-500", pct: (detailedStats.threes / total * 100) },
            { label: "4s", count: batStat.fours, color: "bg-blue-500", pct: (batStat.fours / total * 100) },
            { label: "6s", count: batStat.sixes, color: "bg-purple-500", pct: (batStat.sixes / total * 100) },
        ];
    }, [detailedStats, batStat]);

    /* ── Runs vs Each Bowler ── */
    const bowlerBreakdown = useMemo(() => {
        const map = new Map<string, { runs: number; balls: number; dots: number; fours: number; sixes: number }>();
        for (const b of batsmanBalls) {
            if (!b.bowler) continue;
            if (!map.has(b.bowler)) map.set(b.bowler, { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0 });
            const entry = map.get(b.bowler)!;
            if (b.extraType !== "wide") entry.balls++;
            if (b.extraType === "none" || b.extraType === "noball") {
                entry.runs += b.runs;
                if (b.runs === 4) entry.fours++;
                if (b.runs === 6) entry.sixes++;
                if (b.runs === 0 && b.extraType === "none") entry.dots++;
            }
        }
        return [...map.entries()]
            .map(([name, s]) => ({
                name,
                ...s,
                sr: s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "0.0",
            }))
            .sort((a, b) => b.runs - a.runs);
    }, [batsmanBalls]);

    /* ── Phase-wise Analysis ── */
    const phaseStats = useMemo(() => {
        const phases = [
            { label: "Powerplay", icon: "⚡", range: [0, 5], color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Middle", icon: "🎯", range: [6, 14], color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
            { label: "Death", icon: "🔥", range: [15, 19], color: "from-red-500/20 to-red-600/10 border-red-500/30" },
        ];
        return phases.map(ph => {
            const pBalls = batsmanBalls.filter(b => b.over >= ph.range[0] && b.over <= ph.range[1]);
            let runs = 0, balls = 0, dots = 0, boundaries = 0;
            for (const b of pBalls) {
                if (b.extraType !== "wide") balls++;
                if (b.extraType === "none" || b.extraType === "noball") {
                    runs += b.runs;
                    if (b.runs >= 4) boundaries++;
                    if (b.runs === 0 && b.extraType === "none") dots++;
                }
            }
            return {
                ...ph,
                runs,
                balls,
                dots,
                boundaries,
                sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "-",
            };
        });
    }, [batsmanBalls]);

    /* ── Pressure Index ── */
    const pressureStats = useMemo(() => {
        const ballsFaced = detailedStats.ballsFaced || 1;
        const dotPct = Number(detailedStats.dotPct);

        // Max consecutive dots
        let maxConsecDots = 0, currentStreak = 0;
        for (const b of batsmanBalls) {
            if (b.extraType === "wide") continue;
            if (b.runs === 0 && b.extraType === "none") {
                currentStreak++;
                if (currentStreak > maxConsecDots) maxConsecDots = currentStreak;
            } else {
                currentStreak = 0;
            }
        }

        // Control percentage = balls where batter scored / total balls faced
        const scoringBalls = batsmanBalls.filter(b =>
            b.extraType !== "wide" && (b.runs > 0 || b.extraType !== "none")
        ).length;
        const controlPct = ballsFaced > 0 ? ((scoringBalls / ballsFaced) * 100).toFixed(0) : "0";

        // Scoring rate acceleration (first half vs second half SR)
        const half = Math.floor(batsmanBalls.length / 2);
        const firstHalfBalls = batsmanBalls.slice(0, half).filter(b => b.extraType !== "wide");
        const secondHalfBalls = batsmanBalls.slice(half).filter(b => b.extraType !== "wide");
        const firstHalfRuns = firstHalfBalls.reduce((s, b) => s + (b.extraType === "none" || b.extraType === "noball" ? b.runs : 0), 0);
        const secondHalfRuns = secondHalfBalls.reduce((s, b) => s + (b.extraType === "none" || b.extraType === "noball" ? b.runs : 0), 0);
        const firstHalfSR = firstHalfBalls.length > 0 ? (firstHalfRuns / firstHalfBalls.length * 100) : 0;
        const secondHalfSR = secondHalfBalls.length > 0 ? (secondHalfRuns / secondHalfBalls.length * 100) : 0;
        const acceleration = secondHalfSR - firstHalfSR;

        return { dotPct, maxConsecDots, controlPct, acceleration, firstHalfSR, secondHalfSR };
    }, [batsmanBalls, detailedStats]);

    /* ── All innings stats for profile view ── */
    const allInningsStats = useMemo(() => {
        const innings = [1, 2];
        return innings.map(inn => {
            const innBalls = allBalls.filter(b => b.inning === inn && !b.isCommentaryOnly && b.batsman === batsmanName);
            if (innBalls.length === 0) return null;
            let runs = 0, fours = 0, sixes = 0, balls = 0, isOut = false, dismissalText = "";
            for (const b of innBalls) {
                if (b.extraType !== "wide") balls++;
                if (b.extraType === "none" || b.extraType === "noball") {
                    runs += b.runs;
                    if (b.runs === 4) fours++;
                    if (b.runs === 6) sixes++;
                }
                if (b.wicket?.isWicket && (b.wicket.playerOut === batsmanName || b.batsman === batsmanName)) {
                    isOut = true;
                    dismissalText = b.wicket.type || "out";
                }
            }
            const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
            return { inning: inn, runs, balls, fours, sixes, sr, isOut, dismissalText };
        }).filter(Boolean);
    }, [allBalls, batsmanName]);

    /* ── Player info from team data ── */
    const playerInfo = useMemo(() => {
        if (!teamPlayers) return null;
        return teamPlayers.find(p => p.name === batsmanName) || null;
    }, [teamPlayers, batsmanName]);

    const initials = batsmanName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    // Max runs among bowlers for bar width calculation
    const maxBowlerRuns = bowlerBreakdown.length > 0 ? Math.max(...bowlerBreakdown.map(b => b.runs)) : 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
                {/* ── Close Button ── */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <X size={16} />
                </button>

                {view === "summary" ? (
                    /* ═══════════════════════════════════════
                       INNINGS SUMMARY VIEW
                       ═══════════════════════════════════════ */
                    <div>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-5 pb-4 border-b border-slate-700/60">
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                                    {playerInfo?.photo
                                        ? <img src={playerInfo.photo} className="w-full h-full object-cover" />
                                        : <span className="text-sm font-bold text-slate-300">{initials}</span>
                                    }
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-bold text-lg leading-tight truncate">{batsmanName}</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        {batStat.isOut
                                            ? <span className="text-red-400">{batStat.dismissalText}</span>
                                            : <span className="text-green-400 font-medium">Not Out</span>
                                        }
                                        {teamName && <span className="text-slate-600 ml-2">• {teamName}</span>}
                                    </p>
                                </div>
                                <div className="ml-auto text-right shrink-0">
                                    <p className="text-3xl font-black text-white leading-none">{batStat.runs}</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">({batStat.balls})</p>
                                </div>
                            </div>
                        </div>

                        {/* Key Stats Grid */}
                        <div className="grid grid-cols-3 gap-px bg-slate-800 mx-4 mt-4 rounded-xl overflow-hidden border border-slate-700/60">
                            {[
                                { label: "Strike Rate", value: batStat.sr, color: "text-emerald-400" },
                                { label: "Fours", value: batStat.fours, color: "text-blue-400" },
                                { label: "Sixes", value: batStat.sixes, color: "text-purple-400" },
                                { label: "Dots", value: detailedStats.dots, color: "text-slate-400" },
                                { label: "Singles", value: detailedStats.singles, color: "text-emerald-400" },
                                { label: "2s & 3s", value: detailedStats.doubles + detailedStats.threes, color: "text-teal-400" },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-900 p-3 text-center">
                                    <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">{s.label}</p>
                                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Scoring Zones Bar */}
                        <div className="mx-4 mt-4">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-2">Scoring Breakdown</p>
                            <div className="flex h-3 rounded-full overflow-hidden bg-slate-800 border border-slate-700/40">
                                {scoringZones.filter(s => s.pct > 0).map(s => (
                                    <div
                                        key={s.label}
                                        className={`${s.color} transition-all duration-500`}
                                        style={{ width: `${Math.max(s.pct, 3)}%` }}
                                        title={`${s.label}: ${s.count}`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                {scoringZones.filter(s => s.count > 0).map(s => (
                                    <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                        <span className="text-slate-400">{s.label}: <span className="text-white font-bold">{s.count}</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Boundary vs Rotation */}
                        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40 text-center">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">Boundary Runs</p>
                                <p className="text-xl font-black text-blue-400">{detailedStats.boundaryRuns}</p>
                                <p className="text-slate-600 text-[10px]">{detailedStats.boundaryPct}% of balls</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40 text-center">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">Rotation Runs</p>
                                <p className="text-xl font-black text-emerald-400">{detailedStats.rotationRuns}</p>
                                <p className="text-slate-600 text-[10px]">{batStat.runs > 0 ? ((detailedStats.rotationRuns / batStat.runs) * 100).toFixed(0) : 0}% of runs</p>
                            </div>
                        </div>

                        {/* ═══ RUNS vs EACH BOWLER ═══ */}
                        {bowlerBreakdown.length > 0 && (
                            <div className="mx-4 mt-5">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                    <Swords size={11} className="text-orange-400" />
                                    Runs vs Each Bowler
                                </p>
                                <div className="space-y-2">
                                    {bowlerBreakdown.map(bw => (
                                        <div key={bw.name} className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/30">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-slate-300 text-xs font-medium truncate pr-2">{bw.name}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-white text-sm font-black">{bw.runs}</span>
                                                    <span className="text-slate-600 text-[10px]">({bw.balls}b)</span>
                                                </div>
                                            </div>
                                            {/* Runs bar */}
                                            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden mb-1.5">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                                                    style={{ width: `${Math.max((bw.runs / maxBowlerRuns) * 100, 5)}%` }}
                                                />
                                            </div>
                                            <div className="flex gap-3 text-[10px]">
                                                <span className="text-slate-500">SR <span className={`font-bold ${Number(bw.sr) >= 150 ? 'text-emerald-400' : Number(bw.sr) >= 100 ? 'text-blue-400' : 'text-red-400'}`}>{bw.sr}</span></span>
                                                <span className="text-slate-500">Dots <span className="text-slate-300 font-bold">{bw.dots}</span></span>
                                                {bw.fours > 0 && <span className="text-blue-400 font-bold">{bw.fours}×4</span>}
                                                {bw.sixes > 0 && <span className="text-purple-400 font-bold">{bw.sixes}×6</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ PHASE-WISE ANALYSIS ═══ */}
                        {batsmanBalls.length > 0 && (
                            <div className="mx-4 mt-5">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                    <BarChart3 size={11} className="text-cyan-400" />
                                    Phase Analysis
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {phaseStats.map(ph => (
                                        <div key={ph.label} className={`bg-gradient-to-b ${ph.color} rounded-lg p-2.5 border text-center`}>
                                            <p className="text-[10px] font-bold mb-0.5">{ph.icon} {ph.label}</p>
                                            {ph.balls > 0 ? (
                                                <>
                                                    <p className="text-lg font-black text-white leading-tight">{ph.runs}</p>
                                                    <p className="text-[9px] text-slate-400">({ph.balls}b) SR {ph.sr}</p>
                                                    <div className="flex justify-center gap-1.5 mt-1 text-[9px]">
                                                        {ph.boundaries > 0 && <span className="text-blue-400 font-bold">{ph.boundaries} bdry</span>}
                                                        <span className="text-slate-500">{ph.dots} dots</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-slate-600 text-[10px] mt-1">—</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ PRESSURE & MOMENTUM ═══ */}
                        {batsmanBalls.length >= 3 && (
                            <div className="mx-4 mt-5">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                    <Flame size={11} className="text-rose-400" />
                                    Pressure & Momentum
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Dot Ball Gauge */}
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 text-center">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Dot Ball %</p>
                                        <div className="relative w-16 h-16 mx-auto mb-1">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none" stroke="#334155" strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke={Number(pressureStats.dotPct) > 50 ? "#ef4444" : Number(pressureStats.dotPct) > 30 ? "#f59e0b" : "#22c55e"}
                                                    strokeWidth="3"
                                                    strokeDasharray={`${pressureStats.dotPct}, 100`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-sm font-black ${Number(pressureStats.dotPct) > 50 ? 'text-red-400' : Number(pressureStats.dotPct) > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {pressureStats.dotPct}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-[9px]">Max streak: <span className="text-slate-300 font-bold">{pressureStats.maxConsecDots}</span> dots</p>
                                    </div>

                                    {/* Acceleration */}
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 text-center">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Acceleration</p>
                                        <div className="space-y-1.5 mb-2">
                                            <div>
                                                <p className="text-[9px] text-slate-500">1st Half SR</p>
                                                <p className="text-sm font-bold text-slate-300">{pressureStats.firstHalfSR.toFixed(1)}</p>
                                            </div>
                                            <div className="flex items-center justify-center gap-1">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pressureStats.acceleration > 0 ? 'bg-emerald-500/20 text-emerald-400' : pressureStats.acceleration < 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {pressureStats.acceleration > 0 ? '▲' : pressureStats.acceleration < 0 ? '▼' : '–'}
                                                </div>
                                                <span className={`text-xs font-bold ${pressureStats.acceleration > 0 ? 'text-emerald-400' : pressureStats.acceleration < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {pressureStats.acceleration > 0 ? '+' : ''}{pressureStats.acceleration.toFixed(1)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500">2nd Half SR</p>
                                                <p className="text-sm font-bold text-slate-300">{pressureStats.secondHalfSR.toFixed(1)}</p>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-[9px]">Control: <span className="text-emerald-400 font-bold">{pressureStats.controlPct}%</span></p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ball-by-Ball Timeline */}
                        <div className="mx-4 mt-4 mb-2">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-2">Ball-by-Ball</p>
                            <div className="flex flex-wrap gap-1.5">
                                {batsmanBalls.map((b, i) => (
                                    <div
                                        key={b._id || i}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all hover:scale-110 ${chipStyle(b.runs, !!b.wicket?.isWicket, b.extraType)}`}
                                        title={`Over ${b.over}.${b.ball} — ${b.runs} run${b.runs !== 1 ? "s" : ""}${b.wicket?.isWicket ? " (W)" : ""}`}
                                    >
                                        {chipLabel(b)}
                                    </div>
                                ))}
                                {batsmanBalls.length === 0 && (
                                    <p className="text-slate-600 text-xs italic">No balls faced yet</p>
                                )}
                            </div>
                        </div>

                        {/* Cumulative Run Graph */}
                        {batsmanBalls.length > 1 && (
                            <div className="mx-4 mt-3 mb-2">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-2">Run Progression</p>
                                <div className="h-16 flex items-end gap-[2px]">
                                    {(() => {
                                        let cum = 0;
                                        const points = batsmanBalls.map(b => {
                                            if (b.extraType === "none" || b.extraType === "noball") cum += b.runs;
                                            return cum;
                                        });
                                        const max = Math.max(...points, 1);
                                        return points.map((p, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-gradient-to-t from-blue-500/60 to-blue-400/30 rounded-t-sm min-w-[3px] transition-all hover:from-blue-400 hover:to-blue-300"
                                                style={{ height: `${Math.max((p / max) * 100, 4)}%` }}
                                                title={`Ball ${i + 1}: ${p} runs`}
                                            />
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* ═══ WAGON WHEEL ═══ */}
                        {batsmanBalls.some(b => b.shotDirection) && (
                            <div className="mx-4 mt-4 mb-2">
                                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
                                    <Target size={11} className="text-emerald-400" />
                                    Wagon Wheel
                                </p>
                                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 flex justify-center">
                                    <WagonWheel
                                        balls={batsmanBalls.filter(b => b.shotDirection).map(b => ({ runs: b.runs, direction: b.shotDirection! }))}
                                        playerName={batsmanName}
                                        size={300}
                                    />
                                </div>
                            </div>
                        )}

                        {/* View Full Profile Button */}
                        <div className="px-4 pb-4 pt-3">
                            <button
                                onClick={() => setView("profile")}
                                className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <User size={14} />
                                View Full Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ═══════════════════════════════════════
                       FULL PROFILE VIEW (Matching PlayerProfileDialog style)
                       ═══════════════════════════════════════ */
                    <div>
                        {/* Back Button */}
                        <button
                            onClick={() => setView("summary")}
                            className="absolute top-3 left-3 z-10 flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>

                        {/* ── Banner Header (matching PlayerProfileDialog) ── */}
                        <div className="relative h-32 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent">
                            {/* Team badge in corner */}
                            {teamName && (
                                <div className="absolute top-4 right-12 z-10">
                                    <span className="bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        {teamName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Profile Content */}
                        <div className="relative px-6 pb-6">
                            {/* Avatar overlapping banner */}
                            <div className="relative -mt-16 mb-4 flex justify-between items-end">
                                <div className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-lg">
                                    {playerInfo?.photo
                                        ? <img src={playerInfo.photo} className="w-full h-full object-cover" alt={batsmanName} />
                                        : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                                                <span className="text-2xl font-black text-slate-400">{initials}</span>
                                            </div>
                                        )
                                    }
                                </div>

                                {/* Match Rating Badge */}
                                <div className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm mb-2 ring-1 ${Number(batStat.sr) >= 150 ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30'
                                    : Number(batStat.sr) >= 100 ? 'text-blue-400 bg-blue-500/10 ring-blue-500/30'
                                        : 'text-amber-400 bg-amber-500/10 ring-amber-500/30'
                                    }`}>
                                    <div className="flex items-center gap-1.5">
                                        <Target size={14} />
                                        <span className="text-lg">{batStat.sr}</span>
                                    </div>
                                    <span className="text-[9px] uppercase tracking-tighter opacity-70">Strike Rate</span>
                                </div>
                            </div>

                            {/* Name & Title */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white">{batsmanName}</h3>
                                <div className="flex items-center gap-2 text-slate-400 mt-1 text-sm">
                                    {playerInfo?.role && <span className="font-medium text-slate-300">{playerInfo.role}</span>}
                                    {playerInfo?.role && teamName && <span>•</span>}
                                    {teamName && <span>{teamName}</span>}
                                </div>
                            </div>

                            {/* ── This Match Performance ── */}
                            <div className="mb-6 space-y-3">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-400" /> This Match Performance
                                </h4>
                                <div className="space-y-3">
                                    {allInningsStats.map((s: any) => (
                                        <div key={s.inning} className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/40">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-slate-400 text-xs font-medium">Innings {s.inning}</span>
                                                <span className={`text-xs font-bold ${s.isOut ? "text-red-400" : "text-green-400"}`}>
                                                    {s.isOut ? s.dismissalText : "Not Out"}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-4">
                                                <p className="text-3xl font-black text-white leading-none">{s.runs}</p>
                                                <div className="flex gap-3 mb-0.5">
                                                    <span className="text-slate-500 text-xs">({s.balls}b)</span>
                                                    <span className="text-blue-400 text-xs font-medium">{s.fours}×4</span>
                                                    <span className="text-purple-400 text-xs font-medium">{s.sixes}×6</span>
                                                    <span className="text-emerald-400 text-xs font-medium">SR {s.sr}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {allInningsStats.length === 0 && (
                                        <p className="text-slate-600 text-xs italic text-center py-4">No batting data in this match</p>
                                    )}
                                </div>
                            </div>

                            {/* ── Career Stats (from API) ── */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Trophy size={14} className="text-yellow-400" /> Career Stats
                                </h4>
                                {careerLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                        <span className="text-slate-500 text-xs ml-2">Loading career stats...</span>
                                    </div>
                                ) : careerStats?.All ? (
                                    <div className="space-y-4">
                                        {/* Batting Career */}
                                        {careerStats.All.batting?.innings > 0 && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                                    🏏 Batting Career
                                                </p>
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    {[
                                                        { label: "Innings", value: careerStats.All.batting.innings, color: "text-white" },
                                                        { label: "Runs", value: careerStats.All.batting.runs, color: "text-emerald-400" },
                                                        { label: "Avg", value: careerStats.All.batting.average, color: "text-blue-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {[
                                                        { label: "SR", value: careerStats.All.batting.strikeRate, color: "text-emerald-400" },
                                                        { label: "HS", value: careerStats.All.batting.highestScore, color: "text-white" },
                                                        { label: "50s", value: careerStats.All.batting.fifties, color: "text-cyan-400" },
                                                        { label: "100s", value: careerStats.All.batting.hundreds, color: "text-yellow-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: "4s", value: careerStats.All.batting.fours, color: "text-blue-400" },
                                                        { label: "6s", value: careerStats.All.batting.sixes, color: "text-purple-400" },
                                                        { label: "Not Outs", value: careerStats.All.batting.notOuts, color: "text-green-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bowling Career */}
                                        {careerStats.All.bowling?.innings > 0 && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                                    🎳 Bowling Career
                                                </p>
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    {[
                                                        { label: "Innings", value: careerStats.All.bowling.innings, color: "text-white" },
                                                        { label: "Wickets", value: careerStats.All.bowling.wickets, color: "text-red-400" },
                                                        { label: "Best", value: careerStats.All.bowling.bestFigures, color: "text-yellow-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { label: "Overs", value: careerStats.All.bowling.overs, color: "text-white" },
                                                        { label: "Econ", value: careerStats.All.bowling.economy, color: "text-emerald-400" },
                                                        { label: "Avg", value: careerStats.All.bowling.average, color: "text-blue-400" },
                                                        { label: "SR", value: careerStats.All.bowling.strikeRate, color: "text-cyan-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recent Performances */}
                                        {careerStats.All.recentPerformances?.length > 0 && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                                    📊 Recent Performances
                                                </p>
                                                <div className="space-y-2">
                                                    {careerStats.All.recentPerformances.slice(0, 5).map((perf: any, pi: number) => (
                                                        <div key={pi} className="flex items-center justify-between bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                                                            <div className="min-w-0">
                                                                <p className="text-slate-300 text-xs font-medium truncate">{perf.opponent}</p>
                                                                <p className="text-slate-600 text-[10px]">{perf.date ? new Date(perf.date).toLocaleDateString() : ''}</p>
                                                            </div>
                                                            <div className="flex gap-3 shrink-0">
                                                                {perf.batting && (
                                                                    <span className="text-white text-xs font-bold">
                                                                        {perf.batting.runs}<span className="text-slate-500 font-normal">({perf.batting.balls})</span>
                                                                    </span>
                                                                )}
                                                                {perf.bowling && (
                                                                    <span className="text-emerald-400 text-xs font-bold">
                                                                        {perf.bowling.wickets}/{perf.bowling.runs}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Matches Played */}
                                        <div className="flex justify-between items-center p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/40">
                                            <span className="text-sm text-slate-500">Matches Played</span>
                                            <span className="font-bold font-mono text-white">{careerStats.All.matchesPlayed}</span>
                                        </div>

                                        {/* ═══ CAREER WAGON WHEEL ═══ */}
                                        {allBalls.some(b => !b.isCommentaryOnly && b.batsman === batsmanName && b.shotDirection) && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                                    🎯 Career Wagon Wheel
                                                </p>
                                                <div className="flex justify-center">
                                                    <WagonWheel
                                                        balls={allBalls.filter(b => !b.isCommentaryOnly && b.batsman === batsmanName && b.shotDirection).map(b => ({ runs: b.runs, direction: b.shotDirection! }))}
                                                        playerName={batsmanName}
                                                        size={300}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-xs italic text-center py-4">No career data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
