import { useState, useMemo, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import {
    Activity, TrendingUp, Zap, Target, Users, Clock, Flame, Shield, Swords,
    AlertTriangle, ChevronDown, ChevronUp, Star, Award, BarChart3,
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import type { Match, Player } from "@/data/types";
import { getPlayersByTeam } from "@/data/mockData";

// ─── Role Normalization ──────────────────────────────────────────
const ROLE_MAP: Record<string, string> = {
    Goalkeeper: "GK", "Goal Keeper": "GK", GK: "GK", Keeper: "GK",
    Defender: "DF", "Centre-Back": "DF", "Left-Back": "DF", "Right-Back": "DF", CB: "DF", LB: "DF", RB: "DF", DF: "DF",
    Midfielder: "MF", "Central Midfield": "MF", "Defensive Midfield": "MF", "Attacking Midfield": "MF", CM: "MF", CDM: "MF", CAM: "MF", MF: "MF",
    Forward: "FW", Striker: "FW", Winger: "FW", "Left Wing": "FW", "Right Wing": "FW", CF: "FW", ST: "FW", LW: "FW", RW: "FW", FW: "FW",
};
const normalizeRole = (role: string): string => ROLE_MAP[role] || "MF";

// ─── Colors ──────────────────────────────────────────────────────
const HOME_COLOR = "#3b82f6";
const AWAY_COLOR = "#ef4444";
const ACCENT = "#8b5cf6";
const PHASE_COLORS = ["#06b6d4", "#f59e0b", "#ef4444"];
const HEATMAP_COLORS = ["#1e293b", "#1e3a5f", "#2563eb", "#f59e0b", "#ef4444"];
const CHART_TOOLTIP_STYLE = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
};

// ─── Mock Data Types ─────────────────────────────────────────────
interface MockPlayer {
    id: string; name: string; number: number; role: string; normalizedRole: string;
    rating: number; goals: number; assists: number; passes: number; tackles: number;
    dribbles: number; shots: number; saves: number; interceptions: number;
    consistency: number; impactScore: number;
    heatmapZones: number[][]; // 4x3 grid
}

interface MatchEvent {
    minute: number; type: "goal" | "yellow" | "red" | "sub" | "save" | "chance";
    team: "home" | "away"; player: string; detail?: string;
}

interface WhatIfScenario {
    id: string; title: string; description: string;
    originalOutcome: string; altOutcome: string;
    impactLevel: "high" | "medium" | "low";
}

// ─── Heatmap patterns by role ────────────────────────────────────
const HEATMAP_BY_ROLE: Record<string, number[][]> = {
    GK: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [8, 9, 8]],
    DF: [[0, 1, 0], [1, 5, 1], [1, 6, 1], [0, 2, 0]],
    MF: [[0, 1, 0], [2, 5, 2], [2, 7, 2], [0, 2, 0]],
    FW: [[0, 0, 0], [1, 3, 1], [3, 5, 4], [4, 7, 3]],
};

// ─── Convert real Player to MockPlayer ───────────────────────────
const toMockPlayer = (p: Player, idx: number, prefix: string): MockPlayer => {
    const role = normalizeRole(p.position);
    const rating = Math.min(p.rating, 100); // normalize if >100
    const ratingNorm = rating > 10 ? rating : Math.round(rating * 10); // handle 0-10 scale
    const goals = p.stats?.goals || p.matchStats?.goals || 0;
    const assists = p.stats?.assists || p.matchStats?.assists || 0;
    const saves = p.matchStats?.saves || (role === "GK" ? Math.floor(Math.random() * 5) + 1 : 0);
    const seed = idx * 7 + p.name.length;
    return {
        id: `${prefix}${idx + 1}`,
        name: p.name,
        number: idx + 1,
        role: p.position,
        normalizedRole: role,
        rating: ratingNorm,
        goals,
        assists,
        passes: role === "GK" ? 20 + (seed % 15) : role === "DF" ? 45 + (seed % 25) : role === "MF" ? 55 + (seed % 30) : 20 + (seed % 20),
        tackles: role === "DF" ? 3 + (seed % 5) : role === "MF" ? 1 + (seed % 4) : seed % 2,
        dribbles: role === "FW" ? 3 + (seed % 6) : role === "MF" ? 2 + (seed % 4) : seed % 2,
        shots: role === "FW" ? 2 + (seed % 5) : role === "MF" ? 1 + (seed % 3) : 0,
        saves,
        interceptions: role === "DF" ? 2 + (seed % 4) : role === "MF" ? 1 + (seed % 3) : 0,
        consistency: Math.max(60, Math.min(98, ratingNorm - 5 + (seed % 15))),
        impactScore: Math.max(50, Math.min(98, ratingNorm - 3 + (seed % 10))),
        heatmapZones: HEATMAP_BY_ROLE[role] || HEATMAP_BY_ROLE.MF,
    };
};

// ─── Generate Mock Data ──────────────────────────────────────────
const generateMockData = (match: Match) => {
    const homeTeam = match.homeTeam?.shortName || "Home";
    const awayTeam = match.awayTeam?.shortName || "Away";

    // Momentum data (minute by minute)
    const momentumData = Array.from({ length: 91 }, (_, i) => {
        const base = Math.sin(i * 0.08) * 30;
        const noise = (Math.random() - 0.5) * 20;
        const homeMomentum = Math.max(0, Math.min(100, 50 + base + noise));
        return {
            minute: i,
            [homeTeam]: Math.round(homeMomentum),
            [awayTeam]: Math.round(100 - homeMomentum),
        };
    });

    // ─── Use REAL lineups from the match data ────────────────────
    const rawHomePlayers = getPlayersByTeam(match.homeTeam?.id || "");
    const rawAwayPlayers = getPlayersByTeam(match.awayTeam?.id || "");

    const homePlayers: MockPlayer[] = rawHomePlayers.map((p, i) => toMockPlayer(p, i, "hp"));
    const awayPlayers: MockPlayer[] = rawAwayPlayers.map((p, i) => toMockPlayer(p, i, "ap"));

    // ─── Build events from actual match goals + generated extras ─
    const events: MatchEvent[] = [];
    // Add real goals from match data
    if (match.goals && match.goals.length > 0) {
        for (const g of match.goals) {
            events.push({
                minute: g.minute,
                type: "goal",
                team: g.teamId === match.homeTeam?.id ? "home" : "away",
                player: g.player,
                detail: g.type === "penalty" ? "Penalty" : g.assist ? `Assist: ${g.assist}` : "Goal",
            });
        }
    } else {
        // Fallback: generate events from players who scored in the lineup
        const scorers = [...homePlayers.filter(p => p.goals > 0), ...awayPlayers.filter(p => p.goals > 0)];
        let minute = 15;
        for (const s of scorers.slice(0, 5)) {
            events.push({
                minute, type: "goal",
                team: homePlayers.includes(s) ? "home" : "away",
                player: s.name,
                detail: "Goal",
            });
            minute += 12 + Math.floor(Math.random() * 15);
        }
    }
    // Add generated cards/subs
    const allForEvents = [...homePlayers.slice(0, 11), ...awayPlayers.slice(0, 11)];
    const dfPlayers = allForEvents.filter(p => p.normalizedRole === "DF");
    if (dfPlayers.length > 1) {
        events.push({ minute: 38, type: "yellow", team: homePlayers.includes(dfPlayers[0]) ? "home" : "away", player: dfPlayers[0].name, detail: "Tactical foul" });
        events.push({ minute: 62, type: "yellow", team: homePlayers.includes(dfPlayers[1]) ? "home" : "away", player: dfPlayers[1].name, detail: "Late challenge" });
    }
    events.sort((a, b) => a.minute - b.minute);

    // Phase breakdown
    const phaseData = [
        { phase: "0–30'", homePossession: 55, awayPossession: 45, homeShots: 5, awayShots: 3, homePassAcc: 88, awayPassAcc: 82 },
        { phase: "31–60'", homePossession: 52, awayPossession: 48, homeShots: 6, awayShots: 5, homePassAcc: 85, awayPassAcc: 80 },
        { phase: "61–90'", homePossession: 60, awayPossession: 40, homeShots: 5, awayShots: 3, homePassAcc: 84, awayPassAcc: 76 },
    ];

    // Partnership data — dynamic from home team midfielders & forwards
    const hMids = homePlayers.filter(p => p.normalizedRole === "MF").slice(0, 3);
    const hFwds = homePlayers.filter(p => p.normalizedRole === "FW").slice(0, 3);
    const hDefs = homePlayers.filter(p => p.normalizedRole === "DF").slice(0, 2);
    const lastName = (n: string) => n.split(" ").pop() || n;
    const partnershipData = [
        ...(hMids.length >= 2 ? [{ from: lastName(hMids[0].name), to: lastName(hMids[1].name), passes: 22 }] : []),
        ...(hMids.length >= 1 && hFwds.length >= 1 ? [{ from: lastName(hMids[0].name), to: lastName(hFwds[0].name), passes: 18 }] : []),
        ...(hMids.length >= 1 && hDefs.length >= 1 ? [{ from: lastName(hDefs[0].name), to: lastName(hMids[0].name), passes: 16 }] : []),
        ...(hFwds.length >= 2 ? [{ from: lastName(hFwds[0].name), to: lastName(hFwds[1].name), passes: 12 }] : []),
        ...(hMids.length >= 2 && hFwds.length >= 1 ? [{ from: lastName(hMids[1].name), to: lastName(hFwds[0].name), passes: 14 }] : []),
        ...(hDefs.length >= 2 ? [{ from: lastName(hDefs[0].name), to: lastName(hDefs[1].name), passes: 15 }] : []),
    ].filter(Boolean);

    // What-if scenarios — generated from actual match context
    const topHomeScorer = homePlayers.reduce((best, p) => p.goals > best.goals ? p : best, homePlayers[0]);
    const topAwayScorer = awayPlayers.reduce((best, p) => p.goals > best.goals ? p : best, awayPlayers[0]);
    const homeGK = homePlayers.find(p => p.normalizedRole === "GK");
    const awayGK = awayPlayers.find(p => p.normalizedRole === "GK");
    const whatIfScenarios: WhatIfScenario[] = [
        { id: "w1", title: `What if ${homeGK?.name || "the keeper"} missed a key save?`, description: `${awayTeam} could have taken an early lead, changing the entire match dynamic.`, originalOutcome: `${homeTeam} keeps clean sheet in that phase`, altOutcome: `${awayTeam} scores early, shifts momentum`, impactLevel: "high" },
        { id: "w2", title: `What if ${topAwayScorer.name} was marked out?`, description: `Tight man-marking could have neutralized their attacking threat entirely.`, originalOutcome: `${topAwayScorer.name} scores ${topAwayScorer.goals} goal(s)`, altOutcome: `${awayTeam} attack blunted, fewer chances`, impactLevel: "high" },
        { id: "w3", title: `What if ${topHomeScorer.name} was subbed at half-time?`, description: `The main goal threat removed — would have reduced ${homeTeam}'s second half output significantly.`, originalOutcome: `${topHomeScorer.name} plays full match`, altOutcome: `${homeTeam} likely scores fewer goals`, impactLevel: "medium" },
        { id: "w4", title: `What if ${awayTeam} had 55% possession?`, description: `Greater ball control could have reduced ${homeTeam}'s counter-attacking opportunities.`, originalOutcome: `${homeTeam} dominates possession`, altOutcome: `${awayTeam} controls tempo, limits counters`, impactLevel: "medium" },
    ];

    return { momentumData, homePlayers, awayPlayers, events, phaseData, partnershipData, whatIfScenarios, homeTeam, awayTeam };
};



// ─── Section Wrapper ─────────────────────────────────────────────
const AnalyticsSection = ({
    icon, title, subtitle, children, className,
}: {
    icon: React.ReactNode; title: string; subtitle?: string;
    children: React.ReactNode; className?: string;
}) => (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
        <div className="px-5 py-3.5 border-b border-border bg-secondary/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
            <div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ─── Heatmap Grid Component ─────────────────────────────────────
const PlayerHeatmapGrid = ({ zones, name }: { zones: number[][]; name: string }) => {
    const maxVal = Math.max(...zones.flat(), 1);
    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">{name}</p>
            <div className="relative w-full max-w-[200px] mx-auto aspect-[3/4] bg-emerald-900/20 rounded-lg border border-emerald-500/20 overflow-hidden p-1">
                {/* Pitch lines */}
                <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-white/10" /></div>
                <div className="absolute top-0 left-1/4 right-1/4 h-[20%] border-b border-l border-r border-white/10 rounded-b-sm" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[20%] border-t border-l border-r border-white/10 rounded-t-sm" />
                <div className="grid grid-rows-4 grid-cols-3 gap-0.5 h-full relative z-10">
                    {zones.map((row, ri) =>
                        row.map((val, ci) => {
                            const intensity = val / maxVal;
                            return (
                                <div
                                    key={`${ri}-${ci}`}
                                    className="rounded-sm transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: intensity > 0.7
                                            ? `rgba(239,68,68,${intensity * 0.7})`
                                            : intensity > 0.3
                                                ? `rgba(245,158,11,${intensity * 0.7})`
                                                : `rgba(59,130,246,${Math.max(intensity * 0.5, 0.05)})`,
                                    }}
                                    title={`Zone: ${val} actions`}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Consistency Ring ────────────────────────────────────────────
const ConsistencyRing = ({ score, name, role }: { score: number; name: string; role: string }) => {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";

    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="4" />
                    <circle
                        cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="4"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {score}
                </span>
            </div>
            <div className="text-center">
                <p className="text-xs font-medium text-foreground truncate max-w-20">{name.split(' ').pop()}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">{role}</span>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
interface MatchPerformanceLabProps {
    match: Match;
}

export const MatchPerformanceLab = ({ match }: MatchPerformanceLabProps) => {
    const [selectedHeatmapPlayer, setSelectedHeatmapPlayer] = useState<string>("hp11"); // Kane
    const [radarPlayer1, setRadarPlayer1] = useState<string>("hp11"); // Kane
    const [radarPlayer2, setRadarPlayer2] = useState<string>("ap9"); // Mbappé
    const [expandedScenario, setExpandedScenario] = useState<string | null>("w1");

    // Cache mock data with useMemo (simulating 10-min TTL)
    const data = useMemo(() => generateMockData(match), [match.id]);
    const allPlayers = useMemo(() => [...data.homePlayers, ...data.awayPlayers], [data]);

    const heatmapPlayer = allPlayers.find(p => p.id === selectedHeatmapPlayer) || data.homePlayers[10];
    const rp1 = allPlayers.find(p => p.id === radarPlayer1) || data.homePlayers[10];
    const rp2 = allPlayers.find(p => p.id === radarPlayer2) || data.awayPlayers[8];

    // Impact Index — top 8 players sorted
    const impactPlayers = useMemo(
        () => [...allPlayers].sort((a, b) => b.impactScore - a.impactScore).slice(0, 8),
        [allPlayers]
    );
    const impactData = impactPlayers.map(p => ({
        name: p.name.split(' ').pop(),
        fullName: p.name,
        impact: p.impactScore,
        team: data.homePlayers.includes(p) ? "home" : "away",
    }));

    // Radar data for 2-player comparison
    const radarData = useMemo(() => {
        const metrics = ["rating", "passes", "dribbles", "shots", "tackles", "consistency"];
        const labels = ["Rating", "Passing", "Dribbles", "Shooting", "Defending", "Consistency"];
        const maxVals = [100, 90, 10, 8, 8, 100];
        return labels.map((label, i) => ({
            metric: label,
            [rp1.name]: Math.round(((rp1 as any)[metrics[i]] / maxVals[i]) * 100),
            [rp2.name]: Math.round(((rp2 as any)[metrics[i]] / maxVals[i]) * 100),
            fullMark: 100,
        }));
    }, [rp1, rp2]);

    // Phase bar data
    const phaseBarData = data.phaseData.map(p => ({
        phase: p.phase,
        [`${data.homeTeam} Shots`]: p.homeShots,
        [`${data.awayTeam} Shots`]: p.awayShots,
    }));

    const phasePieData = data.phaseData.map((p, i) => ({
        name: p.phase,
        value: p.homeShots + p.awayShots,
        fill: PHASE_COLORS[i],
    }));

    // Event icons
    const eventIcon = (type: string) => {
        switch (type) {
            case "goal": return "⚽";
            case "yellow": return "🟡";
            case "red": return "🔴";
            case "sub": return "🔄";
            case "save": return "🧤";
            case "chance": return "💥";
            default: return "📌";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">


            {/* ── 1. Momentum Graph ── */}
            <AnalyticsSection icon={<Activity size={16} />} title="Match Momentum" subtitle="Minute-by-minute momentum swings">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.momentumData}>
                            <defs>
                                <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={HOME_COLOR} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={HOME_COLOR} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={AWAY_COLOR} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={AWAY_COLOR} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "currentColor" }} tickCount={10} label={{ value: "Minute", position: "insideBottom", offset: -5, fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10, fill: "currentColor" }} domain={[0, 100]} />
                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey={data.homeTeam} stroke={HOME_COLOR} fill="url(#homeGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey={data.awayTeam} stroke={AWAY_COLOR} fill="url(#awayGrad)" strokeWidth={2} />
                            <Legend wrapperStyle={{ fontSize: "12px" }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                {/* Key moment markers */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {data.events.filter(e => e.type === "goal").map((e, i) => (
                        <span key={i} className={cn(
                            "text-[10px] px-2 py-1 rounded-full font-medium",
                            e.team === "home" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                        )}>
                            ⚽ {e.minute}' {e.player}
                        </span>
                    ))}
                </div>
            </AnalyticsSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── 2. Impact Index ── */}
                <AnalyticsSection icon={<Zap size={16} />} title="Impact Index" subtitle="Top performers by calculated impact score">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={impactData} layout="vertical" barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "currentColor" }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} width={80} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(val: number, name: string, props: any) => [`${val}/100`, `${props.payload.fullName}`]} />
                                <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                                    {impactData.map((entry, i) => (
                                        <Cell key={i} fill={entry.team === "home" ? HOME_COLOR : AWAY_COLOR} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </AnalyticsSection>

                {/* ── 3. Phase Breakdown ── */}
                <AnalyticsSection icon={<Clock size={16} />} title="Phase Breakdown" subtitle="Performance split by match phases">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-[240px]">
                            <p className="text-xs text-muted-foreground mb-2 text-center">Shots per Phase</p>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={phaseBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                    <XAxis dataKey="phase" tick={{ fontSize: 9, fill: "currentColor" }} />
                                    <YAxis tick={{ fontSize: 9, fill: "currentColor" }} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Bar dataKey={`${data.homeTeam} Shots`} fill={HOME_COLOR} radius={[3, 3, 0, 0]} />
                                    <Bar dataKey={`${data.awayTeam} Shots`} fill={AWAY_COLOR} radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="h-[240px] flex flex-col items-center">
                            <p className="text-xs text-muted-foreground mb-2">Activity Distribution</p>
                            <ResponsiveContainer width="100%" height="85%">
                                <PieChart>
                                    <Pie data={phasePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {phasePieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Phase table */}
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b border-border text-muted-foreground">
                                <th className="py-2 text-left">Phase</th>
                                <th className="py-2 text-center">Poss% (H)</th>
                                <th className="py-2 text-center">Poss% (A)</th>
                                <th className="py-2 text-center">Pass Acc (H)</th>
                                <th className="py-2 text-center">Pass Acc (A)</th>
                            </tr></thead>
                            <tbody>
                                {data.phaseData.map((p, i) => (
                                    <tr key={i} className="border-b border-border/30 hover:bg-secondary/10">
                                        <td className="py-2 font-medium">{p.phase}</td>
                                        <td className="py-2 text-center text-blue-400">{p.homePossession}%</td>
                                        <td className="py-2 text-center text-red-400">{p.awayPossession}%</td>
                                        <td className="py-2 text-center text-blue-400">{p.homePassAcc}%</td>
                                        <td className="py-2 text-center text-red-400">{p.awayPassAcc}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AnalyticsSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── 4. Player Heatmaps ── */}
                <AnalyticsSection icon={<Flame size={16} />} title="Player Heatmap" subtitle="Pitch zone presence intensity">
                    <div className="mb-4">
                        <select
                            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 appearance-none cursor-pointer"
                            style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}
                            value={selectedHeatmapPlayer}
                            onChange={(e) => setSelectedHeatmapPlayer(e.target.value)}
                        >
                            <optgroup label={data.homeTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.homePlayers.map(p => (
                                    <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0', padding: '8px' }}>{p.number}. {p.name} ({p.normalizedRole})</option>
                                ))}
                            </optgroup>
                            <optgroup label={data.awayTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.awayPlayers.map(p => (
                                    <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0', padding: '8px' }}>{p.number}. {p.name} ({p.normalizedRole})</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div className="flex items-center justify-center">
                        <PlayerHeatmapGrid zones={heatmapPlayer.heatmapZones} name={`${heatmapPlayer.name} (${heatmapPlayer.normalizedRole})`} />
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/30" /><span className="text-[10px] text-muted-foreground">Low</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500/60" /><span className="text-[10px] text-muted-foreground">Medium</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/70" /><span className="text-[10px] text-muted-foreground">High</span></div>
                    </div>
                </AnalyticsSection>

                {/* ── 5. Partnership Wheel (rendered as a pass network table) ── */}
                <AnalyticsSection icon={<Users size={16} />} title="Partnership Network" subtitle="Key passing connections (home team)">
                    <div className="space-y-2">
                        {data.partnershipData.sort((a, b) => b.passes - a.passes).map((conn, i) => {
                            const maxPasses = data.partnershipData[0]?.passes || 1;
                            const width = (conn.passes / maxPasses) * 100;
                            return (
                                <div key={i} className="group">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-medium text-foreground w-20 text-right">{conn.from}</span>
                                        <span className="text-muted-foreground text-[10px]">→</span>
                                        <span className="text-xs font-medium text-foreground w-20">{conn.to}</span>
                                        <span className="text-xs font-mono text-primary ml-auto">{conn.passes}</span>
                                    </div>
                                    <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AnalyticsSection>
            </div>

            {/* ── 6. Event Timeline ── */}
            <AnalyticsSection icon={<BarChart3 size={16} />} title="Match Timeline" subtitle="Chronological match events">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-3">
                        {data.events.map((evt, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-center gap-3",
                                    evt.team === "home" ? "flex-row" : "flex-row-reverse"
                                )}
                            >
                                <div className={cn(
                                    "flex-1 p-3 rounded-lg border transition-all hover:shadow-md",
                                    evt.team === "home"
                                        ? "bg-blue-500/5 border-blue-500/20 text-right"
                                        : "bg-red-500/5 border-red-500/20 text-left"
                                )}>
                                    <p className="text-sm font-medium text-foreground">{evt.player}</p>
                                    {evt.detail && <p className="text-[11px] text-muted-foreground mt-0.5">{evt.detail}</p>}
                                </div>
                                <div className="flex flex-col items-center z-10 flex-shrink-0">
                                    <span className="text-lg">{eventIcon(evt.type)}</span>
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground mt-0.5">{evt.minute}'</span>
                                </div>
                                <div className="flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </AnalyticsSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── 7. Player Radar ── */}
                <AnalyticsSection icon={<Target size={16} />} title="Player Radar Comparison" subtitle="Head-to-head attribute analysis">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <select
                            className="rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 appearance-none cursor-pointer"
                            style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}
                            value={radarPlayer1}
                            onChange={(e) => setRadarPlayer1(e.target.value)}
                        >
                            <optgroup label={data.homeTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.homePlayers.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>{p.name} ({p.normalizedRole})</option>)}
                            </optgroup>
                            <optgroup label={data.awayTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.awayPlayers.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>{p.name} ({p.normalizedRole})</option>)}
                            </optgroup>
                        </select>
                        <select
                            className="rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 appearance-none cursor-pointer"
                            style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}
                            value={radarPlayer2}
                            onChange={(e) => setRadarPlayer2(e.target.value)}
                        >
                            <optgroup label={data.homeTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.homePlayers.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>{p.name} ({p.normalizedRole})</option>)}
                            </optgroup>
                            <optgroup label={data.awayTeam} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>
                                {data.awayPlayers.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>{p.name} ({p.normalizedRole})</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: "currentColor", fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name={rp1.name} dataKey={rp1.name} stroke={HOME_COLOR} fill={HOME_COLOR} fillOpacity={0.25} strokeWidth={2} />
                                <Radar name={rp2.name} dataKey={rp2.name} stroke={AWAY_COLOR} fill={AWAY_COLOR} fillOpacity={0.25} strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: "11px" }} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </AnalyticsSection>

                {/* ── 8. What-If Scenarios ── */}
                <AnalyticsSection icon={<Swords size={16} />} title="What-If Scenarios" subtitle="Alternative match outcomes analysis">
                    <div className="space-y-3">
                        {data.whatIfScenarios.map((scenario) => (
                            <button
                                key={scenario.id}
                                className={cn(
                                    "w-full text-left p-3.5 rounded-lg border transition-all",
                                    expandedScenario === scenario.id
                                        ? "bg-primary/5 border-primary/30 shadow-md"
                                        : "bg-secondary/10 border-border/50 hover:bg-secondary/20"
                                )}
                                onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                                scenario.impactLevel === "high" ? "bg-red-500/20 text-red-400" :
                                                    scenario.impactLevel === "medium" ? "bg-amber-500/20 text-amber-400" :
                                                        "bg-green-500/20 text-green-400"
                                            )}>
                                                {scenario.impactLevel.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground">{scenario.title}</p>
                                    </div>
                                    {expandedScenario === scenario.id ? <ChevronUp size={14} className="text-muted-foreground mt-1" /> : <ChevronDown size={14} className="text-muted-foreground mt-1" />}
                                </div>
                                {expandedScenario === scenario.id && (
                                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                                <p className="text-[10px] text-blue-400 font-medium mb-0.5">Actual</p>
                                                <p className="text-xs text-foreground">{scenario.originalOutcome}</p>
                                            </div>
                                            <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                                <p className="text-[10px] text-amber-400 font-medium mb-0.5">What-If</p>
                                                <p className="text-xs text-foreground">{scenario.altOutcome}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </AnalyticsSection>
            </div>

            {/* ── 9. Consistency Scores ── */}
            <AnalyticsSection icon={<Award size={16} />} title="Consistency Scores" subtitle="Player reliability based on multi-match performance data">
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-medium text-blue-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> {data.homeTeam}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                            {data.homePlayers.map(p => (
                                <ConsistencyRing key={p.id} score={p.consistency} name={p.name} role={p.normalizedRole} />
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div>
                        <p className="text-xs font-medium text-red-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" /> {data.awayTeam}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                            {data.awayPlayers.map(p => (
                                <ConsistencyRing key={p.id} score={p.consistency} name={p.name} role={p.normalizedRole} />
                            ))}
                        </div>
                    </div>
                </div>
            </AnalyticsSection>
        </div>
    );
};

export default MatchPerformanceLab;
