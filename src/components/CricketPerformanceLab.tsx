import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, Loader2, AlertTriangle, Activity, TrendingUp, Target, Zap, Shield, ChevronDown, ChevronUp, BarChart3, Award } from "lucide-react";
import { formatScoreString, formatOversText } from "@/lib/utils";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, PieChart, Pie, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend, CartesianGrid, ScatterChart,
    Scatter, ZAxis, RadialBarChart, RadialBar, ComposedChart, Line, LabelList, Treemap, ReferenceLine
} from "recharts";
import type { Match } from "@/data/types";
import { useMatchFieldData } from "@/hooks/useMatchFieldData";
import { WinProbabilityGraph } from "./cricket/graphs/WinProbabilityGraph";
import { OversGraph } from "./cricket/graphs/OversGraph";

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

    const allMatchText = [match?.tournament?.name, (match as any)?.name, (match as any)?.seriesName, match?.matchType].filter(Boolean).join(" ").toLowerCase();
    const isTheHundred = allMatchText.includes('the hundred');

    const formatOversForHundred = (oversStr: string | number) => {
        const oversNum = parseFloat(oversStr.toString());
        if (isNaN(oversNum)) return oversStr.toString();
        return `${oversNum}`;
    };

    // ── Auto-select latest innings if live ────────────────────────────────────
    const innings = scorecardData?.innings || [];
    useEffect(() => {
        if (isLive && innings.length > 0) {
            setSelectedInnings(innings.length - 1);
        }
    }, [isLive, innings.length]);

    // ── Fetch extra partnership data ──────────────────────────────────────────
    const { 
        data: partnershipsData, 
        loading: loadingPartnerships, 
        error: partnershipsError 
    } = useMatchFieldData(match.id, 'cbPartnershipGraph', true, undefined, undefined);

    const { 
        data: winProbData, 
    } = useMatchFieldData(match.id, 'cbWinProbability', true, undefined, undefined);

    const { 
        data: oversGraphData, 
    } = useMatchFieldData(match.id, 'cbOversGraph', true, undefined, undefined);

    // ── Derived data ──────────────────────────────────────────────────────────
    const currentInnings = innings[selectedInnings] || innings[0];

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

    // ── Run progression (FOW-based + Interpolation) ───────────────────────────
    const runProgression = useMemo(() => {
        if (!currentInnings) return [];
        
        const basePts: { over: number; runs: number; wicket?: string }[] = [{ over: 0, runs: 0 }];
        const parsedFow = (currentInnings.fallOfWickets || []).map((f: any, idx: number) => {
            if (typeof f === 'string') {
                const match = f.match(/^(\d+)-(\d+)\s*\(([^,]+)(?:,\s*([\d.]+)\s*ov)?\)/i);
                if (match) {
                    return {
                        score: Number(match[1]),
                        wicketNum: Number(match[2]),
                        batsmanName: match[3].trim(),
                        overs: match[4] ? Number(match[4]) : undefined
                    };
                }
                return { wicketNum: idx + 1, score: 0 };
            }
            return f;
        }).sort((a: any, b: any) => a.wicketNum - b.wicketNum);
        
        for (const f of parsedFow) {
            let overVal = Number(f.overs);
            if (isNaN(overVal) && (f as any).over) overVal = Number((f as any).over);
            
            // If the API failed to provide the over for this wicket, estimate it mathematically
            if ((isNaN(overVal) || !overVal) && f.score > 0 && currentInnings.score > 0 && currentInnings.overs > 0) {
                overVal = (f.score / currentInnings.score) * currentInnings.overs;
            }
            overVal = overVal || 0;
            
            basePts.push({ over: overVal, runs: Number(f.score) || 0, wicket: f.batsmanName || `Wicket ${f.wicketNum}` });
        }
        
        const currentOvers = Number(currentInnings.overs) || 0;
        const currentRuns = Number(currentInnings.score) || 0;
        
        if (currentOvers > 0) {
            basePts.push({ over: currentOvers, runs: currentRuns });
        }
        
        basePts.sort((a, b) => a.over - b.over);

        // Interpolate to generate a hover point for EVERY integer over
        const interpolatedPts: { over: number; runs: number; wicket?: string }[] = [];
        const maxOver = Math.ceil(currentOvers);
        
        for (let o = 0; o <= maxOver; o++) {
            // Find if there's a base point exactly on this integer over
            const exactPts = basePts.filter(p => p.over === o);
            if (exactPts.length > 0) {
                // If there's a wicket at this exact integer over, make sure we use it!
                const wicketPt = exactPts.find(p => p.wicket);
                interpolatedPts.push(wicketPt || exactPts[0]);
            } else {
                const prev = [...basePts].reverse().find(p => p.over < o) || basePts[0];
                const next = basePts.find(p => p.over > o) || basePts[basePts.length - 1];
                
                if (prev && next && next.over !== prev.over) {
                    const progress = (o - prev.over) / (next.over - prev.over);
                    const interpolatedRuns = Math.round(prev.runs + (next.runs - prev.runs) * progress);
                    interpolatedPts.push({ over: o, runs: interpolatedRuns });
                } else {
                    interpolatedPts.push({ over: o, runs: prev.runs });
                }
            }
        }
        
        // Merge ANY missing wicket points back into the final array (fractional overs, or missed integer overs)
        const allPts = [...interpolatedPts];
        for (const bp of basePts) {
            if (bp.wicket) {
                const existing = allPts.find(p => p.over === bp.over);
                if (existing) {
                    // Inject the wicket marker into the existing point
                    existing.wicket = bp.wicket;
                } else {
                    allPts.push(bp);
                }
            }
        }
        
        return allPts.sort((a, b) => a.over - b.over);
    }, [currentInnings]);

    // ── Wicket distribution by over ───────────────────────────────────────────
    const wicketDistribution = useMemo(() => {
        if (!currentInnings?.fallOfWickets?.length) return [];
        const overMap: Record<number, number> = {};
        for (const f of currentInnings.fallOfWickets) {
            const parsedOvers = parseFloat(String(f.overs || '').replace(/[^0-9.]/g, ''));
            if (isNaN(parsedOvers)) continue;
            const ov = Math.ceil(parsedOvers) || 1;
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

    // ── 1. Bowler Workload & Efficiency (Radar) ──────────────────────────────
    const bowlerRadarData = useMemo(() => {
        if (!currentInnings?.bowlers?.length) return [];
        // Get top 4 bowlers by overs
        const topBowlers = [...currentInnings.bowlers].sort((a, b) => parseOvers(b.overs) - parseOvers(a.overs)).slice(0, 4);
        
        const maxOvers = Math.max(...topBowlers.map(b => parseOvers(b.overs)), 1);
        const maxMaidens = Math.max(...topBowlers.map(b => b.maidens), 1);
        const maxEcon = Math.max(...topBowlers.map(b => parseFloat(b.economy) || 0), 1);
        const maxWickets = Math.max(...topBowlers.map(b => b.wickets), 1);

        // Normalize stats
        return topBowlers.map(b => ({
            name: shortName(b.name),
            Overs: Math.round((parseOvers(b.overs) / maxOvers) * 100),
            Maidens: Math.round((b.maidens / maxMaidens) * 100),
            Economy: Math.round((1 - (parseFloat(b.economy) || 0) / (maxEcon * 1.5)) * 100), // Inverse: lower is better
            Wickets: Math.round((b.wickets / maxWickets) * 100),
            fullObj: b
        }));
    }, [currentInnings]);

    // ── 2. Batsman Aggression Index (Scatter Plot) ───────────────────────────
    const batsmanAggressionData = useMemo(() => {
        if (!currentInnings?.batsmen?.length) return [];
        return currentInnings.batsmen
            .filter(b => b.balls > 0 && b.runs > 0)
            .map(b => {
                const boundaries = b.fours + b.sixes;
                const sr = parseFloat(b.strikeRate) || 0;
                return {
                    name: shortName(b.name),
                    sr: sr,
                    boundaries: boundaries,
                    runs: b.runs,
                    balls: b.balls
                };
            })
            .sort((a, b) => b.runs - a.runs); // Larger runs rendered later for z-index
    }, [currentInnings]);

    // ── 3. Batter Contribution Treemap ────────────────────────────────────────
    const treemapData = useMemo(() => {
        if (!currentInnings?.batsmen?.length) return [];
        const PALETTE = [COLORS.primary, COLORS.info, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger];
        const data = currentInnings.batsmen
            .filter(b => b.runs > 0)
            .map((b, i) => ({
                name: shortName(b.name),
                size: b.runs,
                balls: b.balls,
                fill: PALETTE[i % PALETTE.length]
            }));
        // Need a root wrapper for recharts treemap
        return [{ name: "Innings", children: data }];
    }, [currentInnings]);

    // ── 4. Bowling Impact Bubble Chart (Threat Matrix) ────────────────────────
    const threatMatrixData = useMemo(() => {
        if (!currentInnings?.bowlers?.length) return [];
        return currentInnings.bowlers
            .filter(b => parseOvers(b.overs) > 0)
            .map(b => {
                const overs = parseOvers(b.overs);
                const balls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
                const ballsPerWicket = b.wickets > 0 ? balls / b.wickets : balls * 1.5; // Penalty for 0 wickets
                const econ = parseFloat(b.economy) || 0;
                return {
                    name: shortName(b.name),
                    econ: econ,
                    bpw: Math.round(ballsPerWicket * 10) / 10,
                    wickets: b.wickets,
                    runs: b.runs,
                    balls: balls
                };
            });
    }, [currentInnings]);

    // ── 5. Boundary Dependency Index (Stacked Bar) ────────────────────────────
    const boundaryDependencyData = useMemo(() => {
        if (!currentInnings?.batsmen?.length) return [];
        return currentInnings.batsmen
            .filter(b => b.runs > 0)
            .map(b => {
                const boundaryRuns = (b.fours * 4) + (b.sixes * 6);
                const runningRuns = b.runs - boundaryRuns;
                
                // For 100% stacked
                const total = b.runs;
                const boundaryPct = Math.round((boundaryRuns / total) * 100);
                const runningPct = Math.round((runningRuns / total) * 100);

                return {
                    name: shortName(b.name),
                    boundaryPct,
                    runningPct,
                    boundaryRuns,
                    runningRuns,
                    total
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 8); // Top 8 contributors
    }, [currentInnings]);

    // ── 6. Bowling Control vs Leakage (Dual Metric) ───────────────────────────
    const bowlingControlData = useMemo(() => {
        if (!currentInnings?.bowlers?.length) return [];
        return currentInnings.bowlers
            .filter(b => parseOvers(b.overs) > 0)
            .map(b => ({
                name: shortName(b.name),
                maidens: b.maidens,
                economy: parseFloat(b.economy) || 0,
                overs: parseOvers(b.overs)
            }))
            .sort((a, b) => b.economy - a.economy); // Highest econ first
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
                    <StatCard label="Total Runs" value={`${quickStats.totalRuns}/${quickStats.totalWickets}`} sub={`${formatOversText(quickStats.overs)}`} color={COLORS.primary} />
                    <StatCard label="Run Rate" value={quickStats.runRate} color={COLORS.accent} />
                    <StatCard label="Boundaries" value={quickStats.totalBoundaries} sub={`${quickStats.boundaryPercent}% of runs`} color={COLORS.warning} />
                    <StatCard label="Top Scorer" value={quickStats.topScorer?.runs ?? 0} sub={shortName(quickStats.topScorer?.name || "")} color={COLORS.secondary} />
                    <StatCard label="Best Bowler" value={`${quickStats.topWicketTaker?.wickets ?? 0}w`} sub={shortName(quickStats.topWicketTaker?.name || "")} color={COLORS.danger} />
                </div>
            )}

            {/* ── 2. Run Rate Dynamics (Cross-Innings) ─────────────────────── */}
            {rrComparison.length > 1 && (
                <AnalyticsSection
                    icon={<TrendingUp size={18} className="text-blue-500" />}
                    title="Run Rate Dynamics"
                    subtitle="Pacing comparison across all innings"
                >
                    <div className="pt-2">
                        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm mt-2">
                            <ResponsiveContainer width="100%" height={Math.max(180, rrComparison.length * 70)}>
                                <BarChart 
                                    data={rrComparison} 
                                    layout="vertical" 
                                    margin={{ top: 10, right: 60, left: 20, bottom: 10 }}
                                    barSize={32}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 700 }} 
                                        width={80}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 8 }} 
                                        contentStyle={TOOLTIP_STYLE}
                                        formatter={(value: number, name: string, props: any) => {
                                            const data = props.payload;
                                            return [
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg leading-none" style={{ color: data.fill }}>{value.toFixed(2)} Run Rate</span>
                                                    <span className="text-xs text-muted-foreground mt-1">
                                                        {data.score}/{data.wickets} <span className="opacity-50 mx-1">•</span> {formatOversText(data.overs)}
                                                    </span>
                                                </div>,
                                                "" // empty name so it doesn't show "Run Rate: X"
                                            ];
                                        }}
                                    />
                                    <Bar dataKey="rr" radius={[0, 8, 8, 0]} isAnimationActive={false}>
                                        {rrComparison.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList 
                                            dataKey="rr" 
                                            position="right" 
                                            formatter={(value: number) => value.toFixed(2)}
                                            style={{ fill: 'hsl(var(--foreground))', fontSize: 15, fontWeight: 800 }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </AnalyticsSection>
            )}

            {/* --- Win Probability Graph --- */}
            {winProbData?.available && winProbData.data && winProbData.data.length > 1 && (
                <AnalyticsSection
                    icon={<Activity size={18} className="text-blue-500" />}
                    title="Win Probability"
                    subtitle="Live match win probability predictions"
                >
                    <WinProbabilityGraph data={winProbData} />
                </AnalyticsSection>
            )}

            {/* --- Overs Graph --- */}
            {oversGraphData?.available && oversGraphData.data && oversGraphData.data.length > 0 && (
                <AnalyticsSection
                    icon={<BarChart3 size={18} className="text-purple-500" />}
                    title="Overs Graph"
                    subtitle="Runs scored over by over"
                >
                    <OversGraph data={oversGraphData} />
                </AnalyticsSection>
            )}

            {/* --- 3. Run Progression (Momentum via FOW) --- */}
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
                            <XAxis 
                                type="number" 
                                domain={[0, 'dataMax']} 
                                dataKey="over" 
                                tickFormatter={(tick) => isTheHundred ? formatOversForHundred(tick) : tick}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                                label={{ value: isTheHundred ? "Balls" : "Overs", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                                label={{ value: "Runs", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value: number, name: string) => [`${value} runs`, "Score"]}
                                labelFormatter={(label) => isTheHundred ? `Ball ${formatOversForHundred(label)}` : `Over ${label}`}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const item = payload[0]?.payload;
                                    return (
                                        <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
                                            <p className="font-medium">{isTheHundred ? 'Ball' : 'Over'} {isTheHundred ? formatOversForHundred(item.over) : item.over}</p>
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

            {/* ── 4.5. Partnership Contributions ────────────────────────────── */}
            {(() => {
                if (loadingPartnerships) {
                    return (
                        <div className="bg-card border border-border rounded-xl p-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Loading Partnership Contributions...</p>
                        </div>
                    );
                }

                if (partnershipsError || !partnershipsData || !Array.isArray(partnershipsData)) {
                    return null;
                }

                const currentInningsNum = currentInnings?.inningsNum || selectedInnings + 1;
                const inningData = partnershipsData.find((p: any) => p.inningsID === currentInningsNum);
                
                if (!inningData || !inningData.partnershipDataDTO || inningData.partnershipDataDTO.length === 0) {
                    return null;
                }

                return (
                    <AnalyticsSection
                        icon={<Target size={18} className="text-emerald-500" />}
                        title="Partnership Contributions"
                        subtitle={`${currentInnings?.teamShortName || ''} — Individual runs per partnership`}
                    >
                        <div className="space-y-4">
                            {inningData.partnershipDataDTO.map((p: any, i: number) => {
                                const total = p.totalRuns || 1;
                                const p1Pct = Math.max(5, (p.bat1Runs / total) * 100);
                                const p2Pct = Math.max(5, (p.bat2Runs / total) * 100);

                                return (
                                    <div key={i} className="bg-muted/5 hover:bg-muted/10 transition-colors border border-border/30 rounded-[1.5rem] p-5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            {/* Bat 1 */}
                                            <div className="flex items-center gap-3.5 w-[35%]">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0.5 bg-blue-500/20 shrink-0">
                                                    <img 
                                                        src={`https://static.cricbuzz.com/a/img/v1/152x152/i1/c${p.bat1ImageID}/player.jpg`} 
                                                        className="w-full h-full rounded-full object-cover bg-card" 
                                                        onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.bat1Name)}&background=random`} 
                                                        alt={p.bat1Name}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate text-foreground">{p.bat1Name}</p>
                                                    <p className="text-xs font-semibold text-blue-500">{p.bat1Runs} <span className="text-muted-foreground font-medium">({p.bat1balls})</span></p>
                                                </div>
                                            </div>
                                            
                                            {/* Center Total */}
                                            <div className="flex flex-col items-center justify-center w-[20%]">
                                                <span className="text-2xl md:text-3xl font-black text-foreground drop-shadow-sm">{p.totalRuns}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{p.totalBalls} balls</span>
                                            </div>

                                            {/* Bat 2 */}
                                            <div className="flex items-center justify-end gap-3.5 w-[35%] text-right">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate text-foreground">{p.bat2Name}</p>
                                                    <p className="text-xs font-semibold text-orange-500">{p.bat2Runs} <span className="text-muted-foreground font-medium">({p.bat2balls})</span></p>
                                                </div>
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0.5 bg-orange-500/20 shrink-0">
                                                    <img 
                                                        src={`https://static.cricbuzz.com/a/img/v1/152x152/i1/c${p.bat2ImageID}/player.jpg`} 
                                                        className="w-full h-full rounded-full object-cover bg-card" 
                                                        onError={e => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.bat2Name)}&background=random`} 
                                                        alt={p.bat2Name}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stacked Bar Indicator */}
                                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex relative z-10 shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" style={{ width: `${p1Pct}%` }} />
                                            <div className="h-full bg-gradient-to-l from-orange-600 to-orange-400 transition-all duration-700" style={{ width: `${p2Pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </AnalyticsSection>
                );
            })()}

            {/* ── 5. Boundary Landscape (Composed Area/Bar Chart) ───────────── */}
            {boundaryData.length > 0 && (
                <AnalyticsSection
                    icon={<Zap size={18} className="text-amber-500" />}
                    title="Boundary Landscape"
                    subtitle="Volume of Fours (Area) vs Sixes (Bars)"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={boundaryData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                            <defs>
                                <linearGradient id="colorFours" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSixes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ ...TOOLTIP_STYLE, backgroundColor: "#1e1e24", borderColor: "rgba(255,255,255,0.1)", color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                            
                            <Area type="monotone" dataKey="sixes" name="Sixes" stroke={COLORS.warning} strokeWidth={3} fillOpacity={1} fill="url(#colorSixes)" />
                            <Area type="monotone" dataKey="fours" name="Fours" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorFours)" />
                        </ComposedChart>
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
                    <div className="flex flex-col gap-4">
                        <div className="pt-6 pb-2">
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={extrasData}
                                        cx="50%"
                                        cy="100%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={0}
                                        outerRadius={130}
                                        paddingAngle={1}
                                        cornerRadius={0}
                                        dataKey="value"
                                        stroke="hsl(var(--background))"
                                        strokeWidth={3}
                                        label={(props: any) => {
                                            const { cx, cy, midAngle, outerRadius, value, name, fill } = props;
                                            const RADIAN = Math.PI / 180;
                                            const radius = outerRadius + 20;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            if (value === 0) return null;
                                            return (
                                                <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-black tracking-widest uppercase">
                                                    {name} <tspan fill="hsl(var(--foreground))" className="font-bold">({value})</tspan>
                                                </text>
                                            );
                                        }}
                                        labelLine={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "2 2" }}
                                    >
                                        {extrasData.map((e, i) => (
                                            <Cell key={`cell-${i}`} fill={e.fill} opacity={0.85} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ ...TOOLTIP_STYLE, backgroundColor: "#1e1e24", borderColor: "rgba(255,255,255,0.1)", color: "#ffffff" }} itemStyle={{ color: "#ffffff" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-secondary/10 rounded-xl border border-border/20">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Match Extras</span>
                            <span className="text-xl font-black text-foreground">{currentInnings?.extras?.total || 0}</span>
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
            {/* ── 12. Bowler Workload & Efficiency (Radar) ──────────────────── */}
            {bowlerRadarData.length > 2 && (
                <AnalyticsSection
                    icon={<Target size={18} className="text-cyan-500" />}
                    title="Bowler Workload & Efficiency"
                    subtitle="Multi-axis comparison of the top bowlers (0-100 normalized score)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={bowlerRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" opacity={0.6} />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            
                            <Radar name="Wickets" dataKey="Wickets" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.4} strokeWidth={2} />
                            <Radar name="Economy (Inv)" dataKey="Economy" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="Overs" dataKey="Overs" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.1} strokeWidth={2} />
                            
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 13. Batsman Aggression Index (Scatter Plot) ───────────────── */}
            {batsmanAggressionData.length > 0 && (
                <AnalyticsSection
                    icon={<Zap size={18} className="text-amber-500" />}
                    title="Batsman Aggression Index"
                    subtitle="Strike Rate vs Boundaries (Bubble size = Runs scored)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis 
                                type="number" 
                                dataKey="sr" 
                                name="Strike Rate" 
                                unit="" 
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                domain={['auto', 'auto']}
                                label={{ value: "Strike Rate", position: "insideBottom", offset: -10, fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="boundaries" 
                                name="Boundaries" 
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                label={{ value: "Boundaries (4s+6s)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <ZAxis type="number" dataKey="runs" range={[50, 400]} name="Runs" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-card/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-lg min-w-[140px]">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <span className="font-bold text-sm text-foreground uppercase tracking-wider">{data.name}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 text-xs">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Runs</span>
                                                        <span className="font-bold text-foreground text-sm">{data.runs}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Strike Rate</span>
                                                        <span className="font-medium text-foreground">{data.sr}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Boundaries</span>
                                                        <span className="font-medium text-foreground">{data.boundaries}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Batsmen" data={batsmanAggressionData} fill={COLORS.primary}>
                                {batsmanAggressionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.primary} opacity={0.8} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 14. Batter Contribution Treemap ───────────────────────────── */}
            {treemapData[0].children && treemapData[0].children.length > 0 && (
                <AnalyticsSection
                    icon={<BarChart3 size={18} className="text-indigo-400" />}
                    title="Batter Contribution Treemap"
                    subtitle="Visual hierarchy of run scorers (Box size = Runs)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <Treemap
                            data={treemapData}
                            dataKey="size"
                            stroke="hsl(var(--background))"
                            fill={COLORS.primary}
                            aspectRatio={4 / 3}
                            content={((props: any) => {
                                const { x, y, width, height, name, size, fill } = props;
                                if (width < 40 || height < 30) return <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--background))" />;
                                return (
                                    <g>
                                        <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--background))" />
                                        <text x={x + width / 2} y={y + height / 2 - 2} textAnchor="middle" fill="#ffffff" stroke="none" fontSize={13} fontWeight="bold" dominantBaseline="middle" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.4)' }}>
                                            {name}
                                        </text>
                                        {height > 45 && (
                                            <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="#ffffff" stroke="none" fontSize={11} fontWeight="600" dominantBaseline="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.4)' }}>
                                                {size} Runs
                                            </text>
                                        )}
                                    </g>
                                );
                            }) as any}
                        >
                            <Tooltip 
                                contentStyle={TOOLTIP_STYLE}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                                formatter={(value: number, name: string, props: any) => [`${value} Runs`, props.payload.name]}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 15. Bowling Impact Bubble Chart (Threat Matrix) ───────────── */}
            {threatMatrixData.length > 0 && (
                <AnalyticsSection
                    icon={<Shield size={18} className="text-rose-500" />}
                    title="Threat Matrix (Bowling Impact)"
                    subtitle="Economy vs Balls per Wicket (Bubble size = Wickets)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis 
                                type="number" 
                                dataKey="econ" 
                                name="Economy Rate" 
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                domain={['auto', 'auto']}
                                label={{ value: "Economy Rate", position: "insideBottom", offset: -10, fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="bpw" 
                                name="Balls per Wicket" 
                                reversed // Lower balls per wicket is better, so it goes up
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                label={{ value: "Balls per Wicket", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <ZAxis type="number" dataKey="wickets" range={[50, 600]} name="Wickets" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-card/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-lg min-w-[140px]">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="font-bold text-sm text-foreground uppercase tracking-wider">{data.name}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 text-xs">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Wickets</span>
                                                        <span className="font-bold text-rose-500 text-sm">{data.wickets}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Economy</span>
                                                        <span className="font-medium text-foreground">{data.econ}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-muted-foreground">Balls/Wicket</span>
                                                        <span className="font-medium text-foreground">{data.bpw}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Bowlers" data={threatMatrixData} fill={COLORS.danger}>
                                {threatMatrixData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.danger} opacity={entry.wickets > 0 ? 0.8 : 0.3} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 16. Boundary Dependency Index ─────────────────────────────── */}
            {boundaryDependencyData.length > 0 && (
                <AnalyticsSection
                    icon={<TrendingUp size={18} className="text-fuchsia-500" />}
                    title="Boundary Dependency Index"
                    subtitle="Runs from boundaries vs running (100% normalized)"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart 
                            data={boundaryDependencyData} 
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600 }} 
                                width={70}
                            />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 4 }} 
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value: number, name: string) => [`${value}%`, name === 'boundaryPct' ? 'Boundaries' : 'Running']}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="boundaryPct" name="Boundary Runs" stackId="a" fill={COLORS.primary} radius={[0, 0, 0, 4]}>
                                <LabelList dataKey="boundaryPct" position="inside" formatter={(v: number) => v > 10 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight={600} />
                            </Bar>
                            <Bar dataKey="runningPct" name="Running Runs" stackId="a" fill={COLORS.muted} radius={[0, 4, 4, 0]}>
                                <LabelList dataKey="runningPct" position="inside" formatter={(v: number) => v > 10 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight={600} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}

            {/* ── 17. Bowling Control vs Leakage ────────────────────────────── */}
            {bowlingControlData.length > 0 && (
                <AnalyticsSection
                    icon={<Activity size={18} className="text-emerald-500" />}
                    title="Bowling Control vs Leakage"
                    subtitle="Maiden overs bowled vs Economy Rate"
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={bowlingControlData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis 
                                dataKey="name" 
                                scale="band" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                            />
                            <YAxis 
                                yAxisId="left" 
                                orientation="left" 
                                tick={{ fill: COLORS.accent, fontSize: 11 }} 
                                label={{ value: 'Maiden Overs', angle: -90, position: 'insideLeft', fill: COLORS.accent, fontSize: 12 }} 
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                tick={{ fill: COLORS.danger, fontSize: 11 }} 
                                label={{ value: 'Economy Rate', angle: 90, position: 'insideRight', fill: COLORS.danger, fontSize: 12 }} 
                            />
                            <Tooltip 
                                contentStyle={TOOLTIP_STYLE} 
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar yAxisId="left" dataKey="maidens" name="Maidens" fill={COLORS.accent} barSize={20} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="economy" name="Economy Rate" stroke={COLORS.danger} strokeWidth={3} dot={{ r: 4, fill: COLORS.danger }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </AnalyticsSection>
            )}
        </div>
    );
}
