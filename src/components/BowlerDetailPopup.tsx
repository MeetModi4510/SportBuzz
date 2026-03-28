import React, { useState, useMemo, useEffect } from "react";
import { X, ChevronLeft, User, Zap, Target, TrendingUp, Swords, Shield, Flame, BarChart3, Users, Trophy, Loader2, Gauge, Activity } from "lucide-react";
import { Ball } from "@/data/scoringTypes";
import { playerApi } from "@/services/api";

interface BowlerStat {
    name: string; overs: string; maidens: number; runs: number; wickets: number; economy: string;
    legalBalls: number;
}

interface PlayerInfo {
    name: string;
    role?: string;
    photo?: string;
}

interface Props {
    bowlerName: string;
    allBalls: Ball[];
    inning: number;
    bowlStat: BowlerStat;
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

export const BowlerDetailPopup: React.FC<Props> = ({
    bowlerName, allBalls, inning, bowlStat, teamName, teamPlayers, onClose
}) => {
    const [view, setView] = useState<"summary" | "profile">("summary");
    const [careerStats, setCareerStats] = useState<any>(null);
    const [careerLoading, setCareerLoading] = useState(false);

    useEffect(() => {
        if (view === "profile" && !careerStats) {
            setCareerLoading(true);
            playerApi.getStats(bowlerName)
                .then((res: any) => {
                    if (res?.data?.formats) setCareerStats(res.data.formats);
                })
                .catch(err => console.error('Failed to load career stats:', err))
                .finally(() => setCareerLoading(false));
        }
    }, [view, bowlerName, careerStats]);

    const bowlerBalls = useMemo(() => {
        return allBalls.filter(
            b => b.inning === inning && !b.isCommentaryOnly && b.bowler === bowlerName
        );
    }, [allBalls, inning, bowlerName]);

    const detailedStats = useMemo(() => {
        let dots = 0, ones = 0, twos = 0, threes = 0, fours = 0, sixes = 0, wides = 0, noballs = 0;
        const overMap = new Map<number, { runs: number; dots: number; wickets: number; balls: number }>();

        for (const b of bowlerBalls) {
            if (b.extraType === "wide") wides++;
            if (b.extraType === "noball") noballs++;
            
            if (b.totalBallRuns === 0) dots++;
            else if (b.totalBallRuns === 1) ones++;
            else if (b.totalBallRuns === 2) twos++;
            else if (b.totalBallRuns === 3) threes++;
            else if (b.totalBallRuns >= 4 && b.totalBallRuns < 6) fours++;
            else if (b.totalBallRuns >= 6) sixes++;

            if (!overMap.has(b.over)) overMap.set(b.over, { runs: 0, dots: 0, wickets: 0, balls: 0 });
            const ov = overMap.get(b.over)!;
            ov.runs += b.totalBallRuns;
            if (b.totalBallRuns === 0) ov.dots++;
            if (b.wicket?.isWicket) ov.wickets++;
            if (b.extraType !== "wide" && b.extraType !== "noball") ov.balls++;
        }

        const dotPct = bowlStat.legalBalls > 0 ? ((dots / bowlerBalls.length) * 100).toFixed(0) : "0";
        const oversList = [...overMap.entries()].map(([over, stat]) => ({ over, ...stat })).sort((a,b) => a.over - b.over);

        return { dots, ones, twos, threes, fours, sixes, wides, noballs, dotPct, oversList };
    }, [bowlerBalls, bowlStat]);

    const batsmanBreakdown = useMemo(() => {
        const map = new Map<string, { runs: number; balls: number; dots: number; wickets: number }>();
        for (const b of bowlerBalls) {
            if (!b.batsman) continue;
            if (!map.has(b.batsman)) map.set(b.batsman, { runs: 0, balls: 0, dots: 0, wickets: 0 });
            const entry = map.get(b.batsman)!;
            if (b.extraType !== "wide") entry.balls++;
            entry.runs += b.totalBallRuns;
            if (b.totalBallRuns === 0) entry.dots++;
            if (b.wicket?.isWicket && (b.wicket.playerOut === b.batsman || b.batsman === b.wicket.playerOut)) {
                entry.wickets++;
            }
        }
        return [...map.entries()]
            .map(([name, s]) => ({
                name,
                ...s,
                economy: s.balls > 0 ? ((s.runs / (s.balls / 6))).toFixed(2) : "0.00",
            }))
            .sort((a, b) => b.wickets - a.wickets || b.runs - a.runs);
    }, [bowlerBalls]);

    const phaseStats = useMemo(() => {
        const phases = [
            { label: "Powerplay", icon: "⚡", range: [0, 5], color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Middle", icon: "🎯", range: [6, 14], color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
            { label: "Death", icon: "🔥", range: [15, 19], color: "from-red-500/20 to-red-600/10 border-red-500/30" },
        ];
        return phases.map(ph => {
            const pBalls = bowlerBalls.filter(b => b.over >= ph.range[0] && b.over <= ph.range[1]);
            let runs = 0, legalBalls = 0, wickets = 0;
            for (const b of pBalls) {
                runs += b.totalBallRuns;
                if (b.extraType !== "wide" && b.extraType !== "noball") legalBalls++;
                if (b.wicket?.isWicket) wickets++;
            }
            return {
                ...ph,
                runs,
                overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
                wickets,
                economy: legalBalls > 0 ? (runs / (legalBalls / 6)).toFixed(1) : "-",
            };
        });
    }, [bowlerBalls]);

    const initials = bowlerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const playerInfo = useMemo(() => teamPlayers?.find(p => p.name === bowlerName) || null, [teamPlayers, bowlerName]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <X size={16} />
                </button>

                {view === "summary" ? (
                    <div>
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-5 pb-4 border-b border-slate-700/60">
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                                    {playerInfo?.photo ? <img src={playerInfo.photo} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-slate-300">{initials}</span>}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-bold text-lg leading-tight truncate">{bowlerName}</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        <span className="text-blue-400 font-medium">{bowlStat.overs} Overs</span>
                                        {teamName && <span className="text-slate-600 ml-2">• {teamName}</span>}
                                    </p>
                                </div>
                                <div className="ml-auto text-right shrink-0">
                                    <p className="text-3xl font-black text-white leading-none">{bowlStat.wickets}-{bowlStat.runs}</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">Econ: {bowlStat.economy}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-px bg-slate-800 mx-4 mt-4 rounded-xl overflow-hidden border border-slate-700/60">
                            {[
                                { label: "Economy", value: bowlStat.economy, color: "text-emerald-400" },
                                { label: "Dots", value: detailedStats.dots, color: "text-blue-400" },
                                { label: "Maidens", value: bowlStat.maidens, color: "text-purple-400" },
                                { label: "Dot %", value: detailedStats.dotPct + "%", color: "text-slate-400" },
                                { label: "Wides", value: detailedStats.wides, color: "text-amber-400" },
                                { label: "No Balls", value: detailedStats.noballs, color: "text-red-400" },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-900 p-3 text-center">
                                    <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">{s.label}</p>
                                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mx-4 mt-5">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                <Swords size={11} className="text-orange-400" /> Performance vs Batsmen
                            </p>
                            <div className="space-y-2">
                                {batsmanBreakdown.map(bt => (
                                    <div key={bt.name} className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/30 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-slate-300 text-xs font-medium truncate">{bt.name}</p>
                                            <p className="text-slate-500 text-[10px]">Econ: {bt.economy} • Dots: {bt.dots}</p>
                                        </div>
                                        <div className="text-right flex gap-3">
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase">Runs</p>
                                                <p className="text-white text-xs font-bold">{bt.runs}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase">Wkts</p>
                                                <p className={`text-xs font-bold ${bt.wickets > 0 ? "text-red-400" : "text-slate-400"}`}>{bt.wickets}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mx-4 mt-5">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                <BarChart3 size={11} className="text-cyan-400" /> Over-by-Over Analysis
                            </p>
                            <div className="space-y-2">
                                {detailedStats.oversList.map(ov => (
                                    <div key={ov.over} className="bg-slate-800/40 rounded-lg h-8 flex items-center px-3 border border-slate-700/30 gap-3">
                                        <span className="text-slate-500 text-[10px] font-bold w-6">OV {ov.over + 1}</span>
                                        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500/60" style={{ width: `${Math.min((ov.runs / 12) * 100, 100)}%` }} />
                                        </div>
                                        <span className="text-white text-[10px] font-bold w-12 text-right">{ov.runs} runs</span>
                                        {ov.wickets > 0 && <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded ring-1 ring-red-500/30">{ov.wickets} W</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mx-4 mt-5">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                <Activity size={11} className="text-rose-400" /> Phase Analysis
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {phaseStats.map(ph => (
                                    <div key={ph.label} className={`bg-gradient-to-b ${ph.color} rounded-lg p-2.5 border text-center`}>
                                        <p className="text-[10px] font-bold mb-0.5">{ph.icon} {ph.label}</p>
                                        {ph.overs !== "0.0" ? (
                                            <>
                                                <p className="text-lg font-black text-white leading-tight">{ph.wickets}-{ph.runs}</p>
                                                <p className="text-[9px] text-slate-400">({ph.overs} ov) ER {ph.economy}</p>
                                            </>
                                        ) : <p className="text-slate-600 text-[10px] mt-1">—</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mx-4 mt-5 mb-4">
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-2">Ball-by-Ball Timeline</p>
                            <div className="flex flex-wrap gap-1.5">
                                {bowlerBalls.map((b, i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all hover:scale-110 ${chipStyle(b.totalBallRuns, !!b.wicket?.isWicket, b.extraType)}`}>
                                        {chipLabel(b)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 pb-4">
                            <button onClick={() => setView("profile")} className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                                <User size={14} /> View Full Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => setView("summary")} className="absolute top-3 left-3 z-10 flex items-center gap-1 text-slate-400 hover:text-white text-xs font-medium transition-colors">
                            <ChevronLeft size={14} /> Back
                        </button>
                        <div className="relative h-32 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent" />
                        <div className="relative px-6 pb-6">
                            <div className="relative -mt-16 mb-4 flex justify-between items-end">
                                <div className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-lg">
                                    {playerInfo?.photo ? <img src={playerInfo.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800"><span className="text-2xl font-black text-slate-400">{initials}</span></div>}
                                </div>
                                <div className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm mb-2 ring-1 text-emerald-400 bg-emerald-500/10 ring-emerald-500/30`}>
                                    <div className="flex items-center gap-1.5"><Gauge size={14} /><span className="text-lg">{bowlStat.economy}</span></div>
                                    <span className="text-[9px] uppercase tracking-tighter opacity-70">Economy</span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-6 pr-12">{bowlerName}</h3>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /> Career Stats</h4>
                                {careerLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /><span className="text-slate-500 text-xs ml-2">Loading career stats...</span></div> : careerStats?.All ? (
                                    <div className="space-y-4">
                                        {careerStats.All.bowling?.innings > 0 && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    {[
                                                        { label: "Wickets", value: careerStats.All.bowling.wickets, color: "text-red-400" },
                                                        { label: "Overs", value: careerStats.All.bowling.overs, color: "text-white" },
                                                        { label: "Best", value: careerStats.All.bowling.bestFigures, color: "text-yellow-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                                                            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: "Avg", value: careerStats.All.bowling.average, color: "text-blue-400" },
                                                        { label: "Econ", value: careerStats.All.bowling.economy, color: "text-emerald-400" },
                                                        { label: "SR", value: careerStats.All.bowling.strikeRate, color: "text-cyan-400" },
                                                    ].map(s => (
                                                        <div key={s.label} className="bg-slate-900/60 rounded-lg p-2 text-center border border-slate-800">
                                                            <p className="text-[10px] text-slate-500 font-bold">{s.label}</p>
                                                            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {careerStats.All.batting?.innings > 0 && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Batting Stats</span>
                                                    <span className="text-xs text-white uppercase font-bold">{careerStats.All.batting.runs} runs</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="text-[10px] text-slate-500">Innings: <span className="text-white">{careerStats.All.batting.innings}</span></span>
                                                    <span className="text-[10px] text-slate-500">Avg: <span className="text-blue-400">{careerStats.All.batting.average}</span></span>
                                                    <span className="text-[10px] text-slate-500">SR: <span className="text-emerald-400">{careerStats.All.batting.strikeRate}</span></span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/40">
                                            <span className="text-sm text-slate-500">Matches Played</span>
                                            <span className="font-bold font-mono text-white">{careerStats.All.matchesPlayed}</span>
                                        </div>
                                    </div>
                                ) : <p className="text-slate-600 text-xs italic text-center py-4">No career data available</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
