import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    MapPin, ArrowLeft, TrendingUp, Trophy, Calendar, Users,
    BarChart3, Target, Star, Zap, Activity, Shield, Flame, Building2,
    Globe, ChevronRight, Award, Swords, ExternalLink,
} from "lucide-react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, CartesianGrid, XAxis, YAxis,
    LineChart, Line, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { SportIcon } from "@/components/SportIcon";
import {
    VENUE_ANALYSIS_DATA, type VenueAnalysis,
    type CricketVenueStats, type FootballVenueStats,
    type BasketballVenueStats, type TennisVenueStats,
} from "@/data/venueAnalysisData";
import type { Sport } from "@/data/types";
import {
    useCricketVenues, useCricketVenueDeepStats, useESPNVenueStats,
    type VenueFormat, type VenueDeepStats,
} from "@/hooks/cricket/useCricketVenues";

// ─── Constants ───────────────────────────────────────────────────
const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#10b981", "#f59e0b"];
const CHART_TOOLTIP: React.CSSProperties = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem", color: "hsl(var(--foreground))", fontSize: 12,
};
const TOOLTIP_TEXT_STYLE = { color: "hsl(var(--foreground))" };

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
    cricket: { label: "Cricket", icon: "🏏", color: "#10b981" },
    football: { label: "Football", icon: "⚽", color: "#3b82f6" },
    basketball: { label: "Basketball", icon: "🏀", color: "#f97316" },
    tennis: { label: "Tennis", icon: "🎾", color: "#84cc16" },
};

const FORMAT_TABS: { key: VenueFormat; label: string; icon: string; color: string }[] = [
    { key: "Test", label: "Test",  icon: "🏏", color: "#8b5cf6" },
    { key: "ODI",  label: "ODI",   icon: "⚡", color: "#3b82f6" },
    { key: "T20",  label: "T20",   icon: "🔥", color: "#f97316" },
];

// ─── Small Stat Card ─────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }: {
    label: string; value: string | number; color: string; icon?: React.ReactNode;
}) => (
    <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 transition-all hover:border-opacity-60"
        style={{ borderColor: `${color}25` }}>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        </div>
        <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
    </div>
);

// ─── Section Wrapper ─────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children, className }: {
    icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) => (
    <div className={cn("bg-card border border-border/40 rounded-xl p-5", className)}>
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground mb-4">{subtitle}</p>}
        {children}
    </div>
);

// ─── Loading Spinner ─────────────────────────────────────────────
const LoadingOverlay = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <p className="text-sm">{text}</p>
    </div>
);

// ─── Format Tab Bar ───────────────────────────────────────────────
const FormatTabs = ({ active, onChange }: { active: VenueFormat; onChange: (f: VenueFormat) => void }) => (
    <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-xl border border-border/30">
        {FORMAT_TABS.map(tab => (
            <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                    active === tab.key
                        ? "text-white shadow-md scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                style={active === tab.key ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` } : undefined}
            >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
            </button>
        ))}
    </div>
);

// ─── Batting Leaders Table ────────────────────────────────────────
const BattingLeadersTable = ({ leaders, color }: { leaders: VenueDeepStats["battingLeaders"]; color: string }) => {
    if (!leaders || leaders.length === 0) return (
        <p className="text-sm text-muted-foreground text-center py-6">No batting data available for this format.</p>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/40">
                        {["#", "Player", "Inn", "Runs", "Avg", "SR", "HS"].map(h => (
                            <th key={h} className="py-2 px-3 text-[11px] text-muted-foreground font-medium text-left">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leaders.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                            <td className="py-2.5 px-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                                    i === 0 ? "text-yellow-400 bg-yellow-400/15" :
                                    i === 1 ? "text-slate-400 bg-slate-400/15" :
                                    i === 2 ? "text-orange-400 bg-orange-400/15" :
                                    "text-muted-foreground bg-secondary/30"
                                )}>
                                    {i + 1}
                                </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{p.name}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.innings}</td>
                            <td className="py-2.5 px-3 font-mono font-bold" style={{ color }}>{p.runs}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.avg?.toFixed(1) || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.sr?.toFixed(1) || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{p.hs}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Bowling Leaders Table ────────────────────────────────────────
const BowlingLeadersTable = ({ leaders, color }: { leaders: VenueDeepStats["bowlingLeaders"]; color: string }) => {
    if (!leaders || leaders.length === 0) return (
        <p className="text-sm text-muted-foreground text-center py-6">No bowling data available for this format.</p>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/40">
                        {["#", "Player", "Inn", "Wkts", "Avg", "Econ", "BBI"].map(h => (
                            <th key={h} className="py-2 px-3 text-[11px] text-muted-foreground font-medium text-left">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leaders.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                            <td className="py-2.5 px-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                                    i === 0 ? "text-yellow-400 bg-yellow-400/15" :
                                    i === 1 ? "text-slate-400 bg-slate-400/15" :
                                    i === 2 ? "text-orange-400 bg-orange-400/15" :
                                    "text-muted-foreground bg-secondary/30"
                                )}>
                                    {i + 1}
                                </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{p.name}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.innings}</td>
                            <td className="py-2.5 px-3 font-mono font-bold" style={{ color }}>{p.wickets}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.avg?.toFixed(1) || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.econ?.toFixed(2) || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-red-400 font-semibold">{p.bbi}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Match Result Badge ───────────────────────────────────────────
const resultBadgeStyle = (result: string) => {
    const r = result.toLowerCase();
    if (r.includes("won") || r.includes("win")) return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20" };
    if (r.includes("draw") || r.includes("tied")) return { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/20"   };
    if (r.includes("no result"))                  return { bg: "bg-slate-500/15",  text: "text-slate-400",  border: "border-slate-500/20"  };
    return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" };
};

// ─── Recent Matches Section ───────────────────────────────────────
const RecentMatchesSection = ({ matches, format, color, venueName }: {
    matches: VenueDeepStats["recentMatches"];
    format: VenueFormat;
    color: string;
    venueName: string;
}) => {
    if (!matches || matches.length === 0) return (
        <div className="text-center py-8 text-muted-foreground text-sm">
            No match records found for {venueName} in {format === "All" ? "any format" : format + " cricket"}.
        </div>
    );
    return (
        <div className="space-y-2.5">
            {matches.map((m, i) => {
                const badge = resultBadgeStyle(m.result);
                return (
                    <div
                        key={i}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between
                                   gap-2 p-4 rounded-xl border border-border/30 bg-secondary/10
                                   hover:bg-secondary/20 hover:border-border/50 transition-all duration-200"
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                                style={{ background: `${color}15`, color }}>
                                🏏
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{m.teams}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{m.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                                "text-[11px] font-medium px-2.5 py-1 rounded-full border",
                                badge.bg, badge.text, badge.border
                            )}>
                                {m.result || "No Result"}
                            </span>
                            {m.matchUrl && (
                                <a href={m.matchUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ═════════════════════════════════════════════════════════════════
//  CRICKET DEEP STATS PANEL
// ═════════════════════════════════════════════════════════════════
const CricketDeepStatsPanel = ({
    deepStats, format, isLoading, color, venueName,
}: {
    deepStats: VenueDeepStats | null;
    format: VenueFormat;
    isLoading: boolean;
    color: string;
    venueName: string;
}) => {
    if (isLoading) return <LoadingOverlay text={`Fetching ${format} stats from Cricmetric…`} />;
    if (!deepStats) return (
        <div className="text-center py-12 text-muted-foreground text-sm">
            Select a format above to load live venue stats.
        </div>
    );

    const { avgFirstInningsByYear, bowlerTypes, matchOutcomes: _mo,
            battingLeaders, bowlingLeaders, recentMatches } = deepStats as any;

    const totalWins = (deepStats.wonBattingFirst || 0) + (deepStats.wonBattingSecond || 0) + (deepStats.draws || 0);
    const batFirstPct = totalWins > 0 ? Math.round(((deepStats.wonBattingFirst || 0) / totalWins) * 100) : 0;
    const batSecondPct = totalWins > 0 ? Math.round(((deepStats.wonBattingSecond || 0) / totalWins) * 100) : 0;
    const drawsPct = totalWins > 0 ? Math.round(((deepStats.draws || 0) / totalWins) * 100) : 0;

    const winData = [
        { name: "Bat 1st Wins",   value: batFirstPct },
        { name: "Bat 2nd Wins",   value: batSecondPct },
        { name: "Draws / No Res", value: drawsPct },
    ].filter(d => d.value > 0);

    const tossData = [
        { name: "Chose Bat",   value: deepStats.tossWinBatFirst },
        { name: "Chose Field", value: deepStats.tossWinFieldFirst },
    ];

    const inningsComparison = [
        { label: "1st Inn", avg: deepStats.avgFirstInningsScore },
        { label: "2nd Inn", avg: deepStats.avgSecondInningsScore },
    ];

    const scatterColors: Record<string, string> = {
        Fast: "#ef4444", Medium: "#f97316", Offbreak: "#3b82f6",
        Orthodox: "#8b5cf6", Chinaman: "#06b6d4", Legbreak: "#ec4899",
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Key stats grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Matches Hosted" value={deepStats.matchesHosted || 0} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg 1st Innings"  value={deepStats.avgFirstInningsScore  || "—"} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg 2nd Innings"  value={deepStats.avgSecondInningsScore || "—"} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg Run Rate"      value={deepStats.avgRunRate || "—"}            color={color}
                    icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Bat First Win %"   value={`${batFirstPct}%`}   color="#8b5cf6"
                    icon={<Trophy size={14} style={{ color: "#8b5cf6" }} />} />
                <StatCard label="Bat 2nd Win %"     value={`${batSecondPct}%`}  color="#06b6d4"
                    icon={<Shield size={14} style={{ color: "#06b6d4" }} />} />
                <StatCard label="Centuries"         value={deepStats.centuries || 0}               color="#eab308"
                    icon={<Star size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="5-Wicket Hauls"    value={deepStats.fiveWicketHauls || 0}         color="#ef4444"
                    icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
            </div>

            {/* ── Format breakdown pills ── */}
            {deepStats.formatBreakdown && deepStats.formatBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {deepStats.formatBreakdown.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/30
                                                bg-secondary/20 hover:bg-secondary/30 transition-colors">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wide">{f.format}</span>
                            <span className="text-xs font-mono text-muted-foreground">{f.matches} Matches</span>
                            <span className="text-xs font-mono" style={{ color }}>W:{f.won} L:{f.lost}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                                style={{ background: color }}>{f.winPct}% W</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Charts row: Innings avg, Win dist, Toss ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Section icon={<BarChart3 size={16} style={{ color }} />} title="Innings Comparison"
                    subtitle="Avg score: 1st vs 2nd innings">
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inningsComparison} barSize={48}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} />
                                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} />
                                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                                    <Cell fill={color} />
                                    <Cell fill={`${color}88`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                <Section icon={<Trophy size={16} style={{ color }} />} title="Win Distribution"
                    subtitle="Who wins batting first vs second">
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={winData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {winData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} formatter={(val: number, name: string) => [`${val}%`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {winData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value}%)</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {(deepStats.tossWinBatFirst > 0 || deepStats.tossWinFieldFirst > 0) && (
                    <Section icon={<Zap size={16} style={{ color }} />} title="Toss Preference"
                        subtitle="Captain's choice after winning toss">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={tossData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                        paddingAngle={3} dataKey="value" stroke="none">
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#f97316" />
                                    </Pie>
                                    <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} formatter={(val: number, name: string) => [`${val}%`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-4 justify-center mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] text-muted-foreground">Bat ({deepStats.tossWinBatFirst}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] text-muted-foreground">Field ({deepStats.tossWinFieldFirst}%)</span>
                            </div>
                        </div>
                    </Section>
                )}
            </div>

            {/* ── Avg 1st innings by year (line chart) ── */}
            {avgFirstInningsByYear && avgFirstInningsByYear.length > 1 && (
                <Section icon={<TrendingUp size={16} style={{ color }} />} title="Average 1st Innings Score Trend"
                    subtitle="How batting conditions have evolved year by year (Cricmetric)">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={[...avgFirstInningsByYear].sort((a: any, b: any) => parseInt(a.year) - parseInt(b.year))}
                                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "currentColor" }} />
                                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE}
                                    formatter={(val: number) => [`${val} runs`, "Avg 1st Innings"]} />
                                <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5}
                                    dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Section>
            )}

            {/* ── Bowler type scatter chart ── */}
            {bowlerTypes && bowlerTypes.length > 0 && (
                <Section icon={<Target size={16} style={{ color }} />} title="Bowler Type Analysis"
                    subtitle="Economy vs Average for different bowling types (Cricmetric)">
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                                <XAxis type="number" dataKey="economy" name="Economy" label={{ value: "Economy Rate", position: "insideBottom", offset: -15, fontSize: 11 }}
                                    tick={{ fontSize: 11, fill: "currentColor" }} domain={["auto", "auto"]} />
                                <YAxis type="number" dataKey="average" name="Average" label={{ value: "Bowling Avg", angle: -90, position: "insideLeft", fontSize: 11 }}
                                    tick={{ fontSize: 11, fill: "currentColor" }} domain={["auto", "auto"]} />
                                <ZAxis range={[80, 80]} />
                                <Tooltip contentStyle={CHART_TOOLTIP}
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div style={CHART_TOOLTIP} className="p-3">
                                                    <p className="font-bold text-foreground mb-1">{d.type}</p>
                                                    <p className="text-muted-foreground text-[11px]">Economy: {d.economy}</p>
                                                    <p className="text-muted-foreground text-[11px]">Average: {d.average}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {bowlerTypes.map((bt: any, i: number) => (
                                    <Scatter key={i} name={bt.type}
                                        data={[{ economy: bt.economy, average: bt.average, type: bt.type }]}
                                        fill={scatterColors[bt.type] || PIE_COLORS[i % PIE_COLORS.length]}>
                                    </Scatter>
                                ))}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                        {bowlerTypes.map((bt: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scatterColors[bt.type] || PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-[11px] text-muted-foreground">{bt.type}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Batting & Bowling Leaders ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Section icon={<Award size={16} style={{ color }} />} title="Batting Leaders"
                    subtitle={`Top run-scorers at this venue in ${format === "All" ? "all formats" : format} (ESPN)`}>
                    <BattingLeadersTable leaders={battingLeaders || deepStats.battingLeaders || []} color={color} />
                </Section>
                <Section icon={<Swords size={16} style={{ color: "#ef4444" }} />} title="Bowling Leaders"
                    subtitle={`Top wicket-takers at this venue in ${format === "All" ? "all formats" : format} (ESPN)`}>
                    <BowlingLeadersTable leaders={bowlingLeaders || deepStats.bowlingLeaders || []} color="#ef4444" />
                </Section>
            </div>

            {/* ── Pitch info ── */}
            <div className="p-4 bg-secondary/15 rounded-xl border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} style={{ color }} />
                    <span className="text-xs font-semibold text-foreground">Pitch Characteristics</span>
                </div>
                <p className="text-sm text-muted-foreground">{deepStats.pitchType}</p>
            </div>

            {/* ── Highest/Lowest ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/15 rounded-xl border border-green-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Highest Total</p>
                    <p className="text-2xl font-bold font-mono text-green-400">{deepStats.highestTotal?.score}</p>
                    {deepStats.highestTotal?.team && deepStats.highestTotal.team !== "—" && (
                        <p className="text-xs text-muted-foreground mt-1">{deepStats.highestTotal.team} ({deepStats.highestTotal.year})</p>
                    )}
                </div>
                <div className="p-4 bg-secondary/15 rounded-xl border border-red-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Lowest Total</p>
                    <p className="text-2xl font-bold font-mono text-red-400">{deepStats.lowestTotal?.score}</p>
                    {deepStats.lowestTotal?.team && deepStats.lowestTotal.team !== "—" && (
                        <p className="text-xs text-muted-foreground mt-1">{deepStats.lowestTotal.team} ({deepStats.lowestTotal.year})</p>
                    )}
                </div>
            </div>

            {/* ── Recent Matches ── */}
            <Section icon={<Calendar size={16} style={{ color }} />} title="Recent Matches"
                subtitle={`Last ${(recentMatches || deepStats.recentMatches || []).length} matches at this venue in ${format === "All" ? "all formats" : format} (ESPN)`}>
                <RecentMatchesSection
                    matches={recentMatches || deepStats.recentMatches || []}
                    format={format}
                    color={color}
                    venueName={venueName}
                />
            </Section>
        </div>
    );
};

// ─── Football ──────────────────────────────────────────────────────
const FootballDetail = ({ stats, color }: { stats: FootballVenueStats; color: string }) => {
    const resultData = [
        { name: "Home Win", value: stats.homeWinPct },
        { name: "Away Win", value: stats.awayWinPct },
        { name: "Draw",     value: stats.drawPct     },
    ];
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Goals/Match" value={stats.avgGoalsPerMatch} color={color} icon={<Target size={14} style={{ color }} />} />
                <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981" icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                <StatCard label="Away Win %" value={`${stats.awayWinPct}%`} color="#ef4444" icon={<Shield size={14} style={{ color: "#ef4444" }} />} />
                <StatCard label="Draw %" value={`${stats.drawPct}%`} color="#94a3b8" icon={<Activity size={14} style={{ color: "#94a3b8" }} />} />
                <StatCard label="Clean Sheet %" value={`${stats.cleanSheetPct}%`} color={color} icon={<Shield size={14} style={{ color }} />} />
                <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color} icon={<Users size={14} style={{ color }} />} />
                <StatCard label="Red Cards" value={stats.redCards} color="#ef4444" icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section icon={<Trophy size={16} style={{ color }} />} title="Result Distribution" subtitle="Home wins vs away wins vs draws">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={resultData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                    <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#94a3b8" />
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} formatter={(val: number, name: string) => [`${val}%`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center">
                        {resultData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#10b981", "#ef4444", "#94a3b8"][i] }} />
                                <span className="text-[11px] text-muted-foreground">{d.name} ({d.value}%)</span>
                            </div>
                        ))}
                    </div>
                </Section>
                <Section icon={<Star size={16} style={{ color }} />} title="Notable Records" subtitle="Biggest wins and competition history">
                    <div className="space-y-4">
                        <div className="p-3 bg-secondary/15 rounded-lg border border-green-500/20">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Biggest Home Win</p>
                            <p className="text-xl font-bold font-mono text-green-400">{stats.biggestHomeWin.score}</p>
                            <p className="text-xs text-muted-foreground">{stats.biggestHomeWin.teams} ({stats.biggestHomeWin.year})</p>
                        </div>
                        <div className="p-3 bg-secondary/15 rounded-lg border border-red-500/20">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Biggest Away Win</p>
                            <p className="text-xl font-bold font-mono text-red-400">{stats.biggestAwayWin.score}</p>
                            <p className="text-xs text-muted-foreground">{stats.biggestAwayWin.teams} ({stats.biggestAwayWin.year})</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Competitions Hosted</p>
                            <div className="flex flex-wrap gap-2">
                                {stats.competitionsHosted.map((c, i) => (
                                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/40 text-foreground border border-border/40">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};

// ─── Basketball ───────────────────────────────────────────────────
const BasketballDetail = ({ stats, color }: { stats: BasketballVenueStats; color: string }) => {
    const winSplit = [
        { name: "Home Win", value: stats.homeWinPct },
        { name: "Away Win", value: stats.awayWinPct },
    ];
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Total Points" value={stats.avgTotalPoints} color={color} icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981" icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                <StatCard label="Avg Point Diff" value={`+${stats.avgPointDifferential}`} color={color} icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Overtime Games" value={`${stats.overtimeGamesPct}%`} color="#eab308" icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="Triple Doubles" value={stats.tripleDoubles} color="#8b5cf6" icon={<Star size={14} style={{ color: "#8b5cf6" }} />} />
                <StatCard label="Buzzer Beaters" value={stats.buzzerBeaters} color="#ec4899" icon={<Flame size={14} style={{ color: "#ec4899" }} />} />
                <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color} icon={<Users size={14} style={{ color }} />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section icon={<Trophy size={16} style={{ color }} />} title="Home vs Away" subtitle="Win distribution at this venue">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={winSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                                    <Cell fill="#10b981" /><Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[11px] text-muted-foreground">Home ({stats.homeWinPct}%)</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[11px] text-muted-foreground">Away ({stats.awayWinPct}%)</span></div>
                    </div>
                </Section>
                <Section icon={<Star size={16} style={{ color }} />} title="Notable Records" subtitle="All-time venue records">
                    <div className="space-y-4">
                        <div className="p-3 bg-secondary/15 rounded-lg border border-green-500/20">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Highest Scoring Game</p>
                            <p className="text-xl font-bold font-mono text-green-400">{stats.highestScoringGame.score}</p>
                            <p className="text-xs text-muted-foreground">{stats.highestScoringGame.teams} ({stats.highestScoringGame.year})</p>
                        </div>
                        <div className="p-3 bg-secondary/15 rounded-lg border border-blue-500/20">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Lowest Scoring Game</p>
                            <p className="text-xl font-bold font-mono text-blue-400">{stats.lowestScoringGame.score}</p>
                            <p className="text-xs text-muted-foreground">{stats.lowestScoringGame.teams} ({stats.lowestScoringGame.year})</p>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};

// ─── Tennis ────────────────────────────────────────────────────────
const TennisDetail = ({ stats, color }: { stats: TennisVenueStats; color: string }) => {
    const setsData = [
        { name: "3-Set Matches", value: 100 - stats.fiveSetter },
        { name: "5-Set Matches", value: stats.fiveSetter },
    ];
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Surface" value={stats.surface} color={color} icon={<Activity size={14} style={{ color }} />} />
                <StatCard label="Editions Hosted" value={stats.grandSlamEdition} color={color} icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Sets/Match" value={stats.avgSetsPerMatch} color={color} icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg Duration" value={stats.avgMatchDuration} color={color} icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Tiebreak %" value={`${stats.tiebreakPct}%`} color="#eab308" icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="Aces/Match" value={stats.aceAvgPerMatch} color="#3b82f6" icon={<Target size={14} style={{ color: "#3b82f6" }} />} />
                <StatCard label="Upset %" value={`${stats.upsetPct}%`} color="#ef4444" icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                <StatCard label="Total Matches" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/15 rounded-xl border border-yellow-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Most Titles</p>
                    <p className="text-2xl font-bold font-mono text-yellow-400">{stats.mostTitles.titles}</p>
                    <p className="text-sm text-foreground mt-1">{stats.mostTitles.player}</p>
                </div>
                <div className="p-4 bg-secondary/15 rounded-xl border border-purple-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Longest Match</p>
                    <p className="text-2xl font-bold font-mono text-purple-400">{stats.longestMatch.duration}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.longestMatch.players} ({stats.longestMatch.year})</p>
                </div>
            </div>
            <Section icon={<BarChart3 size={16} style={{ color }} />} title="Match Length" subtitle="Percentage of 3-set vs 5-set matches">
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={setsData} barSize={60}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                <Cell fill={color} /><Cell fill="#f97316" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>
        </div>
    );
};

// ═════════════════════════════════════════════════════════════════
//  MAIN PANEL
// ═════════════════════════════════════════════════════════════════
export const VenueAnalysisPanel = () => {
    const [activeSport,     setActiveSport]     = useState<Sport | "all">("all");
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>("India");
    const [venueSearch,     setVenueSearch]     = useState<string>("");
    const [activeFormat,    setActiveFormat]    = useState<VenueFormat>("Test");

    const { venues: dynamicCricketVenues, isLoading: isLoadingCricketVenues, error: errorCricketVenues } = useCricketVenues(selectedCountry);

    const selectedCricketVenue = useMemo(() => {
        if (!selectedVenueId) return null;
        return dynamicCricketVenues.find(v => v.id === selectedVenueId) || null;
    }, [selectedVenueId, dynamicCricketVenues]);

    // Use ESPN Statsguru — passes espnGroundId directly for fast, accurate lookup
    const { stats: dynamicDeepStats, isLoading: isLoadingDeepStats } = useESPNVenueStats(
        (selectedCricketVenue as any)?.espnGroundId ?? null,
        selectedCricketVenue?.name || null,
        activeFormat
    );

    const allVenues = useMemo(() => {
        const staticNonCricket = VENUE_ANALYSIS_DATA.filter(v => v.sport !== "cricket");
        return [...staticNonCricket, ...dynamicCricketVenues];
    }, [dynamicCricketVenues]);

    const filteredVenues = useMemo(() => {
        let result = activeSport === "all" ? allVenues : allVenues.filter(v => v.sport === activeSport);
        if (venueSearch.trim()) {
            const q = venueSearch.toLowerCase();
            result = result.filter(v =>
                v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
            );
        }
        return result;
    }, [activeSport, allVenues, venueSearch]);

    const selectedVenue = useMemo(() => {
        if (!selectedVenueId) return null;
        return allVenues.find(v => v.id === selectedVenueId) || null;
    }, [selectedVenueId, allVenues]);

    const sportColor = (sport: Sport) => SPORT_CONFIG[sport].color;

    // ── Venue Grid ───────────────────────────────────────────────
    if (!selectedVenue) {
        return (
            <div className="space-y-6">
                {/* Sport + Country Filter row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setActiveSport("all")}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                                activeSport === "all"
                                    ? "text-white shadow-lg scale-105 border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                    : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border-border/50"
                            )}
                        >
                            🌐 All
                        </button>
                        {(Object.keys(SPORT_CONFIG) as Sport[]).map(sport => (
                            <button
                                key={sport}
                                onClick={() => setActiveSport(sport)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 border",
                                    activeSport === sport
                                        ? "text-white shadow-lg scale-105 border-transparent"
                                        : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border-border/50"
                                )}
                                style={activeSport === sport
                                    ? { background: `linear-gradient(135deg, ${SPORT_CONFIG[sport].color}, ${SPORT_CONFIG[sport].color}bb)` }
                                    : undefined}
                            >
                                <span className="text-lg">{SPORT_CONFIG[sport].icon}</span>
                                {SPORT_CONFIG[sport].label}
                            </button>
                        ))}
                    </div>

                    {(activeSport === "cricket" || activeSport === "all") && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border/50 rounded-xl animate-fade-in">
                            <Globe size={16} className="text-emerald-500" />
                            <select
                                value={selectedCountry}
                                onChange={(e) => { setSelectedCountry(e.target.value); setVenueSearch(""); }}
                                className="bg-transparent text-sm font-semibold text-foreground border-none outline-none focus:ring-0 cursor-pointer"
                            >
                                <option value="India">🇮🇳 India</option>
                                <option value="Australia">🇦🇺 Australia</option>
                                <option value="England">🏴󠁧󠁢󠁥󠁮󠁧󠁿 England</option>
                                <option value="Pakistan">🇵🇰 Pakistan</option>
                                <option value="South Africa">🇿🇦 South Africa</option>
                                <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
                                <option value="Bangladesh">🇧🇩 Bangladesh</option>
                                <option value="West Indies">🌴 West Indies</option>
                                <option value="UAE">🇦🇪 UAE</option>
                                <option value="Afghanistan">🇦🇫 Afghanistan</option>
                            </select>
                            {isLoadingCricketVenues && (
                                <div className="ml-2 w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                            )}
                        </div>
                    )}
                </div>

                {/* Search */}
                {(activeSport === "cricket" || activeSport === "all") && dynamicCricketVenues.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/20 border border-border/40 rounded-xl">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                            type="text"
                            placeholder={`Search ${filteredVenues.length} venues by name or city…`}
                            value={venueSearch}
                            onChange={(e) => setVenueSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-none outline-none"
                        />
                        {venueSearch && (
                            <button onClick={() => setVenueSearch("")} className="text-muted-foreground hover:text-foreground text-xs px-2">✕ Clear</button>
                        )}
                    </div>
                )}

                {/* Venue Cards Grid */}
                <div className="grid md:grid-cols-3 gap-5 min-h-[300px]">
                    {errorCricketVenues ? (
                        <div className="col-span-3 flex flex-col items-center justify-center text-red-500 p-12 space-y-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <p className="font-bold">Error fetching venues: {errorCricketVenues}</p>
                            <p className="text-sm">Please make sure the backend server is running.</p>
                        </div>
                    ) : isLoadingCricketVenues && filteredVenues.length === 0 ? (
                        <div className="col-span-3 flex flex-col items-center justify-center text-muted-foreground p-12 space-y-4">
                            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                            <p>Loading venues from Wikipedia…</p>
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="col-span-3 flex items-center justify-center text-muted-foreground p-12">
                            No venues found for the selected criteria.
                        </div>
                    ) : (
                        filteredVenues.map((venue, index) => {
                            const color = sportColor(venue.sport);
                            return (
                                <div
                                    key={venue.id}
                                    onClick={() => { setSelectedVenueId(venue.id); setActiveFormat("Test"); }}
                                    className="bg-card border border-border rounded-xl p-6 space-y-4 cursor-pointer
                                               hover:border-opacity-80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5
                                               animate-slide-up group relative overflow-hidden"
                                    style={{ animationDelay: `${index * 40}ms`, borderColor: `${color}20` }}
                                >
                                    {venue.image && (
                                        <div
                                            className="absolute top-0 right-0 w-40 h-40 opacity-10 group-hover:opacity-20 transition-opacity blur-[2px] rounded-bl-full"
                                            style={{ backgroundImage: `url(${venue.image})`, backgroundSize: "cover" }}
                                        />
                                    )}

                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-white transition-colors line-clamp-1">
                                                {venue.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <MapPin size={12} />
                                                {venue.city}, {venue.country}
                                            </p>
                                        </div>
                                        <SportIcon sport={venue.sport} size={20} />
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span className="text-foreground font-medium font-mono">
                                                {venue.capacity ? venue.capacity.toLocaleString() : "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Established</span>
                                            <span className="text-foreground font-medium font-mono">{venue.established}</span>
                                        </div>
                                        {venue.sport === "cricket" && (venue as any).tests !== undefined && (
                                            <div className="flex gap-2 pt-1 flex-wrap">
                                                {(venue as any).tests > 0 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-mono">
                                                        {(venue as any).tests} Tests
                                                    </span>
                                                )}
                                                {(venue as any).odis > 0 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-mono">
                                                        {(venue as any).odis} ODIs
                                                    </span>
                                                )}
                                                {(venue as any).t20is > 0 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-mono">
                                                        {(venue as any).t20is} T20Is
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {(venue as any).nickname && (
                                        <p className="text-[11px] italic text-muted-foreground/70 border-t border-border/30 pt-3 relative z-10">
                                            "{(venue as any).nickname}"
                                        </p>
                                    )}

                                    <div className="flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-secondary/30 border border-border/30
                                                  group-hover:text-white transition-colors relative z-10" style={{ color }}>
                                        Click for full analysis <ChevronRight size={12} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // ── Expanded Venue Detail ────────────────────────────────────
    const color = sportColor(selectedVenue.sport);
    const config = SPORT_CONFIG[selectedVenue.sport];
    const isCricket = selectedVenue.sport === "cricket";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => setSelectedVenueId(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors
                           px-4 py-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/40"
            >
                <ArrowLeft size={16} />
                Back to all venues
            </button>

            {/* Venue Header Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 p-6 md:p-8"
                style={{ background: `linear-gradient(135deg, ${color}18, ${color}06, transparent)` }}>
                {selectedVenue.image && (
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `url(${selectedVenue.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            maskImage: "linear-gradient(to left, black, transparent)",
                        }}
                    />
                )}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Building2 size={28} style={{ color }} />
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{selectedVenue.name}</h2>
                                {(selectedVenue as any).nickname && (
                                    <p className="text-sm italic text-muted-foreground">"{(selectedVenue as any).nickname}"</p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin size={14} />
                            {selectedVenue.city}, {selectedVenue.country}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{selectedVenue.description}</p>

                        {/* Format match count badges */}
                        {isCricket && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(selectedVenue as any).tests > 0 && (
                                    <span className="text-[11px] px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-semibold">
                                        🏏 {(selectedVenue as any).tests} Tests
                                    </span>
                                )}
                                {(selectedVenue as any).odis > 0 && (
                                    <span className="text-[11px] px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold">
                                        ⚡ {(selectedVenue as any).odis} ODIs
                                    </span>
                                )}
                                {(selectedVenue as any).t20is > 0 && (
                                    <span className="text-[11px] px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold">
                                        🔥 {(selectedVenue as any).t20is} T20Is
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 shrink-0">
                        <div className="text-center px-5 py-3 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Capacity</p>
                            <p className="text-xl font-bold font-mono text-foreground">{selectedVenue.capacity ? selectedVenue.capacity.toLocaleString() : "N/A"}</p>
                        </div>
                        <div className="text-center px-5 py-3 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Est.</p>
                            <p className="text-xl font-bold font-mono text-foreground">{selectedVenue.established}</p>
                        </div>
                        <div className="text-center px-5 py-3 rounded-xl border border-border/40 backdrop-blur-sm"
                            style={{ backgroundColor: `${color}15` }}>
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Sport</p>
                            <p className="text-xl font-bold" style={{ color }}>{config.icon} {config.label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Cricket Format Tabs + Deep Stats ── */}
            {isCricket ? (
                <div className="space-y-5">
                    {/* Format tab bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <FormatTabs active={activeFormat} onChange={(f) => { setActiveFormat(f); }} />
                        {dynamicDeepStats?.cricmetricSource && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live data from <span className="text-emerald-400 font-semibold">ESPN Statsguru</span> ({activeFormat})
                            </p>
                        )}
                        {!dynamicDeepStats?.cricmetricSource && !isLoadingDeepStats && (selectedCricketVenue as any)?.espnGroundId && (
                            <p className="text-[11px] text-amber-400/70 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Fetching ESPN Statsguru…
                            </p>
                        )}
                        {!dynamicDeepStats?.cricmetricSource && !isLoadingDeepStats && !(selectedCricketVenue as any)?.espnGroundId && (
                            <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5">
                                No ESPN ground ID for this venue
                            </p>
                        )}

                    </div>

                    <CricketDeepStatsPanel
                        deepStats={dynamicDeepStats}
                        format={activeFormat}
                        isLoading={isLoadingDeepStats}
                        color={color}
                        venueName={selectedVenue.name}
                    />
                </div>
            ) : (
                /* Non-cricket panels */
                <>
                    {selectedVenue.stats.sport === "football"   && <FootballDetail   stats={selectedVenue.stats as FootballVenueStats}   color={color} />}
                    {selectedVenue.stats.sport === "basketball" && <BasketballDetail stats={selectedVenue.stats as BasketballVenueStats} color={color} />}
                    {selectedVenue.stats.sport === "tennis"     && <TennisDetail     stats={selectedVenue.stats as TennisVenueStats}     color={color} />}
                </>
            )}
        </div>
    );
};
