import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Activity, TrendingUp, Target, Zap, BarChart3, Award, Shield,
    Loader2, AlertTriangle, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, PieChart, Pie, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend, CartesianGrid, ScatterChart,
    Scatter, ZAxis
} from "recharts";
import type { Match } from "@/data/types";

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    muted: "#64748b",
    inn1: "#3b82f6",
    inn2: "#f59e0b",
    inn3: "#10b981",
    inn4: "#ef4444",
};

const INNINGS_COLORS = [COLORS.inn1, COLORS.inn2, COLORS.inn3, COLORS.inn4];

const TOOLTIP_STYLE = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface InningsData {
    inningsNum: number;
    teamName: string;
    teamShortName: string;
    score: number;
    wickets: number;
    overs: number;
    runRate: string;
    isDeclared: boolean;
    isFollowOn: boolean;
    batsmen: BatsmanData[];
    bowlers: BowlerData[];
    extras: ExtrasData;
    fallOfWickets: FOWData[];
}

interface BatsmanData {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
    dismissal: string;
    isCaptain: boolean;
    isKeeper: boolean;
}

interface BowlerData {
    name: string;
    overs: string;
    maidens: number;
    runs: number;
    wickets: number;
    economy: string;
    isCaptain: boolean;
    isKeeper: boolean;
}

interface ExtrasData {
    total?: number;
    byes?: number;
    legbyes?: number;
    wides?: number;
    noballs?: number;
    [key: string]: any;
}

interface FOWData {
    batsmanName: string;
    score: number;
    wicketNum: number;
    overs: number;
}

interface ScorecardData {
    innings: InningsData[];
    isMatchComplete: boolean;
    status: string;
}

interface CricketPerformanceLabProps {
    scorecardData: ScorecardData | null;
    isUpcoming: boolean;
    isLive: boolean;
    loading: boolean;
    error: string | null;
    match: Match;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 8);
    return parts[parts.length - 1].slice(0, 8);
}

function parseOvers(o: string | number): number {
    return typeof o === "number" ? o : parseFloat(o) || 0;
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function AnalyticsSection({
    icon, title, subtitle, children, defaultOpen = true,
}: {
    icon: React.ReactNode; title: string; subtitle?: string;
    children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <div className="text-left">
                        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
        </div>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="bg-secondary/30 rounded-lg p-3 text-center border border-border/50">
            <p className="text-2xl font-bold font-mono" style={color ? { color } : {}}>{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function CricketPerformanceLab({
    scorecardData, isUpcoming, isLive, loading, error, match
}: CricketPerformanceLabProps) {

    const [selectedInnings, setSelectedInnings] = useState(0);

    // ── Derived data ──────────────────────────────────────────────────────────
    const innings = scorecardData?.innings || [];
    const currentInnings = innings[selectedInnings];

    // ── Partnership data ──────────────────────────────────────────────────────
    const partnerships = useMemo(() => {
        if (!currentInnings?.fallOfWickets?.length) return [];
        const fow = [...currentInnings.fallOfWickets].sort((a, b) => a.wicketNum - b.wicketNum);
        const result: { label: string; runs: number; over: number; wktNum: number }[] = [];
        let prevScore = 0;
        fow.forEach((f, idx) => {
            result.push({
                label: `W${idx}`,
                runs: f.score - prevScore,
                over: f.overs,
                wktNum: idx,
            });
            prevScore = f.score;
        });
        // Unbeaten partnership
        if (currentInnings.score > prevScore) {
            result.push({
                label: `Unb.`,
                runs: currentInnings.score - prevScore,
                over: currentInnings.overs,
                wktNum: fow.length + 1,
            });
        }
        return result;
    }, [currentInnings]);

    // ── Run progression (FOW-based) ───────────────────────────────────────────
    const runProgression = useMemo(() => {
        if (!currentInnings) return [];
        const pts: { over: number; runs: number; wicket?: string }[] = [{ over: 0, runs: 0 }];
        const fow = [...(currentInnings.fallOfWickets || [])].sort((a, b) => a.wicketNum - b.wicketNum);
        for (const f of fow) {
            pts.push({ over: f.overs, runs: f.score, wicket: f.batsmanName });
        }
        // Final score point
        if (currentInnings.overs > 0) {
            pts.push({ over: currentInnings.overs, runs: currentInnings.score });
        }
        return pts;
    }, [currentInnings]);

    // ── Wicket distribution by over ───────────────────────────────────────────
    const wicketDistribution = useMemo(() => {
        if (!currentInnings?.fallOfWickets?.length) return [];
        const overMap: Record<number, number> = {};
        for (const f of currentInnings.fallOfWickets) {
            const ov = Math.ceil(f.overs);
            overMap[ov] = (overMap[ov] || 0) + 1;
        }
        return Object.entries(overMap)
            .map(([over, count]) => ({ over: `Ov ${over}`, wickets: count, overNum: parseInt(over) }))
            .sort((a, b) => a.overNum - b.overNum);
    }, [currentInnings]);

    // ── Boundary analysis ─────────────────────────────────────────────────────
    const boundaryData = useMemo(() => {
        if (!currentInnings?.batsmen?.length) return [];
        return currentInnings.batsmen
            .filter(b => b.fours > 0 || b.sixes > 0)
            .map(b => ({
                name: shortName(b.name),
                fours: b.fours,
                sixes: b.sixes,
                total: b.fours * 4 + b.sixes * 6,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [currentInnings]);

    // ── Batting order efficiency ──────────────────────────────────────────────
    const battingEfficiency = useMemo(() => {
        if (!currentInnings?.batsmen?.length) return [];
        return currentInnings.batsmen
            .filter(b => b.balls > 0)
            .map((b, idx) => ({
                pos: `#${idx + 1}`,
                name: shortName(b.name),
                sr: parseFloat(b.strikeRate) || 0,
                runs: b.runs,
                balls: b.balls,
            }));
    }, [currentInnings]);

    // ── Bowling analysis ──────────────────────────────────────────────────────
    const bowlingData = useMemo(() => {
        if (!currentInnings?.bowlers?.length) return [];
        return currentInnings.bowlers.map(b => ({
            name: shortName(b.name),
            economy: parseFloat(b.economy) || 0,
            wickets: b.wickets,
            overs: parseOvers(b.overs),
            runs: b.runs,
            maidens: b.maidens,
        }));
    }, [currentInnings]);

    // ── Bowler pressure index ─────────────────────────────────────────────────
    const bowlerPressure = useMemo(() => {
        if (!bowlingData.length) return [];
        return bowlingData
            .filter(b => b.overs > 0)
            .map(b => {
                // Approx dot balls = total balls - (runs scored / 1 average per scoring ball)
                // Since we don't have exact dot balls, approximate using maidens
                const totalBalls = Math.floor(b.overs) * 6 + Math.round((b.overs % 1) * 10);
                const approxDots = Math.max(0, totalBalls - b.runs + b.maidens * 6);
                const pressure = (approxDots + b.wickets * 2) / b.overs;
                return {
                    name: b.name,
                    pressure: Math.round(pressure * 100) / 100,
                    wickets: b.wickets,
                    economy: b.economy,
                };
            })
            .sort((a, b) => b.pressure - a.pressure);
    }, [bowlingData]);

    // ── Extras impact ─────────────────────────────────────────────────────────
    const extrasData = useMemo(() => {
        if (!currentInnings?.extras) return [];
        const e = currentInnings.extras;
        const total = e.total || 0;
        if (total === 0) return [];
        const items = [
            { name: "Wides", value: e.wides || 0, fill: COLORS.warning },
            { name: "No Balls", value: e.noballs || 0, fill: COLORS.danger },
            { name: "Leg Byes", value: e.legbyes || 0, fill: COLORS.info },
            { name: "Byes", value: e.byes || 0, fill: COLORS.muted },
        ].filter(i => i.value > 0);
        return items;
    }, [currentInnings]);

    const extrasPercent = useMemo(() => {
        if (!currentInnings) return 0;
        const total = currentInnings.extras?.total || 0;
        return currentInnings.score > 0 ? Math.round((total / currentInnings.score) * 1000) / 10 : 0;
    }, [currentInnings]);

    // ── Player radar (top batter + top bowler from current innings) ────────
    const radarData = useMemo(() => {
        if (!currentInnings) return { batter: null, bowler: null, data: [] };
        const topBat = currentInnings.batsmen?.reduce((a, b) => a.runs > b.runs ? a : b, currentInnings.batsmen[0]);
        const topBowl = currentInnings.bowlers?.reduce((a, b) => a.wickets > b.wickets ? a : b, currentInnings.bowlers[0]);
        if (!topBat || !topBowl) return { batter: null, bowler: null, data: [] };

        // Normalize to 0-100 scale
        const maxRuns = Math.max(...currentInnings.batsmen.map(b => b.runs), 1);
        const maxBalls = Math.max(...currentInnings.batsmen.map(b => b.balls), 1);
        const maxSR = Math.max(...currentInnings.batsmen.map(b => parseFloat(b.strikeRate) || 0), 1);
        const maxBoundaries = Math.max(...currentInnings.batsmen.map(b => b.fours + b.sixes), 1);
        const maxWickets = Math.max(...currentInnings.bowlers.map(b => b.wickets), 1);
        const maxEcon = Math.max(...currentInnings.bowlers.map(b => parseFloat(b.economy) || 0), 1);

        const data = [
            {
                stat: "Runs",
                batter: Math.round((topBat.runs / maxRuns) * 100),
                bowler: 0,
            },
            {
                stat: "SR",
                batter: Math.round(((parseFloat(topBat.strikeRate) || 0) / maxSR) * 100),
                bowler: 0,
            },
            {
                stat: "Boundaries",
                batter: Math.round(((topBat.fours + topBat.sixes) / maxBoundaries) * 100),
                bowler: 0,
            },
            {
                stat: "Wickets",
                batter: 0,
                bowler: Math.round((topBowl.wickets / maxWickets) * 100),
            },
            {
                stat: "Economy",
                batter: 0,
                bowler: Math.round((1 - (parseFloat(topBowl.economy) || 0) / maxEcon) * 100),
            },
            {
                stat: "Balls",
                batter: Math.round((topBat.balls / maxBalls) * 100),
                bowler: 0,
            },
        ];

        return { batter: topBat, bowler: topBowl, data };
    }, [currentInnings]);

    // ── Quick stats ───────────────────────────────────────────────────────────
    const quickStats = useMemo(() => {
        if (!currentInnings) return null;
        const totalBoundaries = currentInnings.batsmen.reduce((s, b) => s + b.fours + b.sixes, 0);
        const boundaryRuns = currentInnings.batsmen.reduce((s, b) => s + b.fours * 4 + b.sixes * 6, 0);
        const topScorer = currentInnings.batsmen.reduce((a, b) => a.runs > b.runs ? a : b, currentInnings.batsmen[0]);
        const topWicketTaker = currentInnings.bowlers?.length
            ? currentInnings.bowlers.reduce((a, b) => a.wickets > b.wickets ? a : b, currentInnings.bowlers[0])
            : null;
        return {
            totalRuns: currentInnings.score,
            totalWickets: currentInnings.wickets,
            runRate: currentInnings.runRate,
            overs: currentInnings.overs,
            totalBoundaries,
            boundaryRuns,
            boundaryPercent: currentInnings.score > 0 ? Math.round((boundaryRuns / currentInnings.score) * 100) : 0,
            topScorer,
            topWicketTaker,
        };
    }, [currentInnings]);

    // ── Cross-innings run rate comparison ─────────────────────────────────────
    const rrComparison = useMemo(() => {
        return innings.map((inn, idx) => ({
            name: inn.teamShortName || `Inn ${idx + 1}`,
            rr: parseFloat(inn.runRate) || 0,
            score: inn.score,
            wickets: inn.wickets,
            overs: inn.overs,
            fill: INNINGS_COLORS[idx] || COLORS.muted,
        }));
    }, [innings]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Loading Performance Lab data...</p>
            </div>
        );
    }

    // ── Upcoming state ────────────────────────────────────────────────────────
    if (isUpcoming) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-medium">Analytics will be available once the match starts.</p>
            </div>
        );
    }

    // ── Error / mapping failure ───────────────────────────────────────────────
    if (error) {
        const isMapping = error.toLowerCase().includes("mapping");
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
                <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 opacity-60" />
                <p className="text-muted-foreground font-medium">
                    {isMapping
                        ? "Performance Lab unavailable — team mapping failed. Please retry later."
                        : "Performance Lab unavailable — scorecard could not be fetched. Please retry later."}
                </p>
            </div>
        );
    }

    // ── No data ───────────────────────────────────────────────────────────────
    if (!scorecardData || !innings.length) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-medium">Analytics are not available for this match.</p>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Performance Lab</h3>
                        <p className="text-xs text-muted-foreground">
                            Derived analytics from scorecard data
                            {isLive && <span className="ml-2 text-green-500 animate-pulse">● Live</span>}
                        </p>
                    </div>
                </div>

                {/* Innings selector */}
                {innings.length > 1 && (
                    <div className="flex gap-1 bg-secondary/30 rounded-lg p-1">
                        {innings.map((inn, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedInnings(idx)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    selectedInnings === idx
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                {inn.teamShortName || `Inn ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 1. Quick Stats ──────────────────────────────────────────────── */}
            {quickStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <StatCard label="Total Runs" value={`${quickStats.totalRuns}/${quickStats.totalWickets}`} sub={`${quickStats.overs} overs`} color={COLORS.primary} />
                    <StatCard label="Run Rate" value={quickStats.runRate} color={COLORS.accent} />
                    <StatCard label="Boundaries" value={quickStats.totalBoundaries} sub={`${quickStats.boundaryPercent}% of runs`} color={COLORS.warning} />
                    <StatCard label="Top Scorer" value={quickStats.topScorer?.runs ?? 0} sub={shortName(quickStats.topScorer?.name || "")} color={COLORS.secondary} />
                    <StatCard label="Best Bowler" value={`${quickStats.topWicketTaker?.wickets ?? 0}w`} sub={shortName(quickStats.topWicketTaker?.name || "")} color={COLORS.danger} />
                </div>
            )}

            {/* ── 2. Run Rate Comparison (Cross-Innings) ─────────────────────── */}
            {rrComparison.length > 1 && (
                <AnalyticsSection
                    icon={<TrendingUp size={18} className="text-blue-500" />}
                    title="Run Rate Comparison"
                    subtitle="Across all innings"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {rrComparison.map((r, i) => (
                            <div key={i} className="bg-secondary/20 rounded-lg p-3 text-center border border-border/40">
                                <p className="text-xs text-muted-foreground font-medium mb-1">{r.name}</p>
                                <p className="text-xl font-bold font-mono" style={{ color: r.fill }}>{r.rr}</p>
                                <p className="text-[10px] text-muted-foreground">{r.score}/{r.wickets} ({r.overs} ov)</p>
                            </div>
                        ))}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={rrComparison} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} />
                            <Bar dataKey="rr" name="Run Rate" radius={[6, 6, 0, 0]}>
                                {rrComparison.map((r, i) => (
                                    <Cell key={i} fill={r.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 3. Run Progression (Momentum via FOW) ─────────────────────── */}
            {runProgression.length > 2 && (
                <AnalyticsSection
                    icon={<TrendingUp size={18} className="text-emerald-500" />}
                    title="Run Progression & Wicket Flow"
                    subtitle={`${currentInnings?.teamShortName || ''} — Score progression with wicket markers`}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={runProgression}>
                            <defs>
                                <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={INNINGS_COLORS[selectedInnings]} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={INNINGS_COLORS[selectedInnings]} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="over" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Overs", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Runs", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value: number, name: string) => [`${value} runs`, "Score"]}
                                labelFormatter={(label) => `Over ${label}`}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const item = payload[0]?.payload;
                                    return (
                                        <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
                                            <p className="font-medium">Over {item.over}</p>
                                            <p className="text-primary font-bold">{item.runs} runs</p>
                                            {item.wicket && <p className="text-red-400">🏏 {item.wicket} out</p>}
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="runs"
                                stroke={INNINGS_COLORS[selectedInnings]}
                                strokeWidth={2.5}
                                fill="url(#runGrad)"
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.wicket) {
                                        return (
                                            <g key={`wicket-${payload.over}`}>
                                                <circle cx={cx} cy={cy} r={6} fill={COLORS.danger} stroke="white" strokeWidth={2} />
                                                <text x={cx} y={cy - 12} textAnchor="middle" fill={COLORS.danger} fontSize={9} fontWeight="bold">
                                                    W
                                                </text>
                                            </g>
                                        );
                                    }
                                    return <circle key={`dot-${payload.over}`} cx={cx} cy={cy} r={3} fill={INNINGS_COLORS[selectedInnings]} />;
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 4. Partnership Analysis ───────────────────────────────────── */}
            {partnerships.length > 0 && (
                <AnalyticsSection
                    icon={<Target size={18} className="text-violet-500" />}
                    title="Partnership Breakdown"
                    subtitle={`${currentInnings?.teamShortName || ''} — Runs scored between each wicket`}
                >
                    <ResponsiveContainer width="100%" height={Math.max(180, partnerships.length * 36)}>
                        <BarChart data={partnerships} layout="vertical" barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={40} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} formatter={(v: number) => [`${v} runs`, "Partnership"]} />
                            <Bar dataKey="runs" name="Runs" radius={[0, 6, 6, 0]}>
                                {partnerships.map((p, i) => (
                                    <Cell key={i} fill={p.runs > 50 ? COLORS.accent : p.runs > 25 ? COLORS.primary : COLORS.muted} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 5. Boundary Analysis ──────────────────────────────────────── */}
            {boundaryData.length > 0 && (
                <AnalyticsSection
                    icon={<Zap size={18} className="text-amber-500" />}
                    title="Boundary Analysis"
                    subtitle="Fours and sixes per batsman"
                >
                    <ResponsiveContainer width="100%" height={Math.max(200, boundaryData.length * 40)}>
                        <BarChart data={boundaryData} layout="vertical" barSize={16}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                            <Bar dataKey="fours" name="Fours" stackId="a" fill={COLORS.primary} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="sixes" name="Sixes" stackId="a" fill={COLORS.warning} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 6. Batting Order Efficiency ────────────────────────────────── */}
            {battingEfficiency.length > 0 && (
                <AnalyticsSection
                    icon={<Award size={18} className="text-cyan-500" />}
                    title="Batting Order Efficiency"
                    subtitle="Strike rate by batting position"
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={battingEfficiency} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="pos" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Strike Rate", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0]?.payload;
                                    return (
                                        <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
                                            <p className="font-medium">{d.name} ({d.pos})</p>
                                            <p className="text-primary">{d.runs} runs ({d.balls} balls)</p>
                                            <p className="text-emerald-400 font-bold">SR: {d.sr.toFixed(1)}</p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="sr" name="Strike Rate" radius={[6, 6, 0, 0]}>
                                {battingEfficiency.map((b, i) => (
                                    <Cell key={i} fill={b.sr >= 150 ? COLORS.accent : b.sr >= 100 ? COLORS.primary : COLORS.muted} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 7. Bowling Economy ─────────────────────────────────────────── */}
            {bowlingData.length > 0 && (
                <AnalyticsSection
                    icon={<Shield size={18} className="text-red-500" />}
                    title="Bowling Analysis"
                    subtitle="Economy rate per bowler"
                >
                    <ResponsiveContainer width="100%" height={Math.max(200, bowlingData.length * 40)}>
                        <BarChart data={bowlingData} layout="vertical" barSize={18}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0]?.payload;
                                    return (
                                        <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
                                            <p className="font-medium">{d.name}</p>
                                            <p>{d.overs} ov | {d.runs} runs | {d.wickets}w</p>
                                            <p className="text-primary font-bold">Economy: {d.economy.toFixed(2)}</p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="economy" name="Economy" radius={[0, 6, 6, 0]}>
                                {bowlingData.map((b, i) => (
                                    <Cell key={i} fill={b.economy <= 6 ? COLORS.accent : b.economy <= 8 ? COLORS.warning : COLORS.danger} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 8. Bowler Pressure Index ──────────────────────────────────── */}
            {bowlerPressure.length > 0 && (
                <AnalyticsSection
                    icon={<BarChart3 size={18} className="text-orange-500" />}
                    title="Bowler Pressure Index"
                    subtitle="Higher = more pressure on batsmen (approx. dots + wickets×2 / overs)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={Math.max(180, bowlerPressure.length * 36)}>
                        <BarChart data={bowlerPressure} layout="vertical" barSize={18}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} formatter={(v: number) => [v.toFixed(2), "Pressure"]} />
                            <Bar dataKey="pressure" name="Pressure Index" radius={[0, 6, 6, 0]}>
                                {bowlerPressure.map((b, i) => (
                                    <Cell key={i} fill={b.pressure >= 5 ? COLORS.accent : b.pressure >= 3 ? COLORS.primary : COLORS.muted} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 9. Wicket Distribution ────────────────────────────────────── */}
            {wicketDistribution.length > 0 && (
                <AnalyticsSection
                    icon={<Target size={18} className="text-red-400" />}
                    title="Wicket Distribution by Over"
                    subtitle="When wickets fell during the innings"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={wicketDistribution} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="over" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} wicket(s)`, "Wickets"]} />
                            <Bar dataKey="wickets" name="Wickets" fill={COLORS.danger} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 10. Extras Impact ─────────────────────────────────────────── */}
            {extrasData.length > 0 && (
                <AnalyticsSection
                    icon={<AlertTriangle size={18} className="text-yellow-500" />}
                    title="Extras Impact"
                    subtitle={`${extrasPercent}% of total runs came from extras`}
                    defaultOpen={false}
                >
                    <div className="flex items-center gap-6 flex-wrap">
                        <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                                <Pie
                                    data={extrasData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {extrasData.map((e, i) => (
                                        <Cell key={i} fill={e.fill} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                            {extrasData.map((e, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.fill }} />
                                    <span className="text-muted-foreground">{e.name}:</span>
                                    <span className="font-bold text-foreground">{e.value}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 text-sm border-t border-border/50 pt-2 mt-2">
                                <span className="text-muted-foreground font-medium">Total:</span>
                                <span className="font-bold text-foreground">{currentInnings?.extras?.total || 0}</span>
                            </div>
                        </div>
                    </div>
                </AnalyticsSection>
            )}

            {/* ── 11. Player Radar Chart ────────────────────────────────────── */}
            {radarData.batter && radarData.bowler && radarData.data.length > 0 && (
                <AnalyticsSection
                    icon={<Award size={18} className="text-purple-500" />}
                    title="Player Spotlight"
                    subtitle={`${radarData.batter.name} (bat) vs ${radarData.bowler.name} (bowl)`}
                    defaultOpen={false}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData.data}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                <Radar name={shortName(radarData.batter.name)} dataKey="batter" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.25} strokeWidth={2} />
                                <Radar name={shortName(radarData.bowler.name)} dataKey="bowler" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.25} strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                            </RadarChart>
                        </ResponsiveContainer>
                        <div className="space-y-3 min-w-[180px]">
                            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Top Batter</p>
                                <p className="font-bold text-foreground">{radarData.batter.name}</p>
                                <p className="text-xs text-primary font-mono">{radarData.batter.runs}({radarData.batter.balls}) SR:{radarData.batter.strikeRate}</p>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                                <p className="text-xs text-muted-foreground">Top Bowler</p>
                                <p className="font-bold text-foreground">{radarData.bowler.name}</p>
                                <p className="text-xs text-red-400 font-mono">{radarData.bowler.wickets}w | {radarData.bowler.overs}ov | Eco:{radarData.bowler.economy}</p>
                            </div>
                        </div>
                    </div>
                </AnalyticsSection>
            )}
        </div>
    );
}
