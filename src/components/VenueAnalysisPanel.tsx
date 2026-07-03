import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    MapPin, ArrowLeft, TrendingUp, Trophy, Calendar, Users, Camera,
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
    type CricketVenueStats, type FootballVenueStats, type BDFutbolVenueStats,
    type BasketballVenueStats, type TennisVenueStats,
} from "@/data/venueAnalysisData";
import type { Sport } from "@/data/types";
import {
    useCricketVenues, useCricketVenueDeepStats, useESPNVenueStats,
    type VenueFormat, type VenueDeepStats,
} from "@/hooks/cricket/useCricketVenues";
import { useBDFutbolVenueStats } from "@/hooks/football/useFootballQueries";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { DynamicLogo } from "@/components/DynamicLogo";
import { FootballTeamLogo } from "@/components/football/FootballTeamLogo";

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
    { key: "Test", label: "Test", icon: "🏏", color: "#8b5cf6" },
    { key: "ODI", label: "ODI", icon: "⚡", color: "#3b82f6" },
    { key: "T20", label: "T20", icon: "🔥", color: "#f97316" },
];

// ─── Small Stat Card ─────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }: {
    label: string; value: string | number; color?: string; icon?: React.ReactNode;
}) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
            {icon && <div className="opacity-80">{icon}</div>}
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
        </div>
        <p className="text-3xl font-bold font-mono text-gray-100">
            {value}
        </p>
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
        <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr>
                        {["#", "Player", "Inn", "Runs", "Avg", "HS"].map((h, i) => (
                            <th key={h} className={cn(
                                "pb-3 px-2 text-[10px] uppercase tracking-wider text-white/40 font-medium border-b border-white/5",
                                i > 1 ? "text-right" : ""
                            )}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {leaders.slice(0, 10).map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="py-2.5 px-2 w-8">
                                <span className={cn(
                                    "font-mono text-[11px]",
                                    i === 0 ? "text-yellow-500" :
                                        i === 1 ? "text-slate-300" :
                                            i === 2 ? "text-amber-600" :
                                                "text-white/20"
                                )}>
                                    {i < 9 ? `0${i + 1}` : i + 1}
                                </span>
                            </td>
                            <td className="py-2.5 px-2 font-medium text-[13px] text-white/90 group-hover:text-white">{p.name}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-white/40">{p.innings}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[13px] font-semibold text-white">{p.runs}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-white/40">{p.avg?.toFixed(1) || '-'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-emerald-400/80">{p.hs}</td>
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
        <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr>
                        {["#", "Player", "Inn", "Wkts", "Avg", "Econ", "BBI"].map((h, i) => (
                            <th key={h} className={cn(
                                "pb-3 px-2 text-[10px] uppercase tracking-wider text-white/40 font-medium border-b border-white/5",
                                i > 1 ? "text-right" : ""
                            )}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {leaders.slice(0, 10).map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="py-2.5 px-2 w-8">
                                <span className={cn(
                                    "font-mono text-[11px]",
                                    i === 0 ? "text-yellow-500" :
                                        i === 1 ? "text-slate-300" :
                                            i === 2 ? "text-amber-600" :
                                                "text-white/20"
                                )}>
                                    {i < 9 ? `0${i + 1}` : i + 1}
                                </span>
                            </td>
                            <td className="py-2.5 px-2 font-medium text-[13px] text-white/90 group-hover:text-white">{p.name}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-white/40">{p.innings}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[13px] font-semibold text-white">{p.wickets}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-white/40">{p.avg?.toFixed(1) || '-'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-white/40">{p.econ?.toFixed(2) || '-'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-[12px] text-red-400/80">{p.bbi}</td>
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
    if (r.includes("draw") || r.includes("tied")) return { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20" };
    if (r.includes("no result")) return { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/20" };
    return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" };
};

// ─── Recent Matches Section ───────────────────────────────────────
const getTeamFlagUrl = (teamName: string) => {
    if (!teamName) return null;
    const t = teamName.toLowerCase().trim();
    const map: Record<string, string> = {
        'india': 'in',
        'afghanistan': 'af',
        'south africa': 'za',
        'sri lanka': 'lk',
        'australia': 'au',
        'england': 'gb-eng',
        'pakistan': 'pk',
        'west indies': 'wi',
        'bangladesh': 'bd',
        'new zealand': 'nz',
        'ireland': 'ie',
        'zimbabwe': 'zw',
        'netherlands': 'nl',
        'scotland': 'gb-sct',
        'nepal': 'np',
        'uae': 'ae',
        'oman': 'om',
        'usa': 'us',
        'namibia': 'na',
        'uganda': 'ug',
        'papua new guinea': 'pg',
        'canada': 'ca'
    };
    if (t === 'west indies') return '/flags/westindies.png';
    if (t === 'sri lanka') return '/flags/srilanka.png';
    if (t === 'england') return '/flags/england.png';

    const code = map[t];
    if (code) return `https://flagcdn.com/w40/${code}.png`;
    return null;
};

const RecentMatchesSection = ({ matches, format, color, venueName }: {
    matches: VenueDeepStats["recentMatches"];
    format: VenueFormat;
    color: string;
    venueName: string;
}) => {
    if (!matches || matches.length === 0) return (
        <div className="text-center py-8 text-white/40 text-[13px]">
            No match records found for {venueName} in {format === "All" ? "any format" : format + " cricket"}.
        </div>
    );
    return (
        <div className="mt-4">
            <div className="flex flex-col border-t border-white/5">
                {matches.map((m, i) => {
                    const cleanTeams = m.teams.replace(/vs v/gi, 'v').trim();
                    const teamsArray = cleanTeams.split(/\s+vs\s+|\s+v\s+/i);
                    const team1 = teamsArray[0]?.trim();
                    const team2 = teamsArray[1]?.trim();

                    let resultText = m.result;
                    let resultType = (m.result || "").toLowerCase();

                    if (team1 && team2) {
                        if (resultType.includes('won')) {
                            const margin = m.result.substring(m.result.toLowerCase().indexOf('won') + 3).trim();
                            resultText = `${team1} won ${margin}`.trim();
                        } else if (resultType.includes('lost')) {
                            const margin = m.result.substring(m.result.toLowerCase().indexOf('lost') + 4).trim();
                            resultText = `${team2} won ${margin}`.trim();
                            resultType = 'won'; // Color it green since it's a win for someone
                        } else if (resultType.includes('draw')) {
                            resultText = `Draw`;
                        } else if (resultType.includes('tied')) {
                            resultText = `Tied`;
                        } else if (resultType.includes('no result') || resultType.includes('aban')) {
                            resultText = `No Result`;
                        }
                    }

                    const badge = resultBadgeStyle(resultType);

                    const flag1 = team1 ? getTeamFlagUrl(team1) : null;
                    const flag2 = team2 ? getTeamFlagUrl(team2) : null;

                    return (
                        <div
                            key={i}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between
                                       py-3 px-2 border-b border-white/5 hover:bg-white/[0.015] transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className="text-[11px] font-mono text-white/30 w-24 shrink-0 uppercase tracking-wider">{m.date}</span>
                                {team1 && team2 ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                        {flag1 && <img src={flag1} alt={team1} className={cn(team1.toLowerCase() === 'west indies' ? "w-5 h-5 object-contain" : "w-5 h-3.5 object-cover")} />}
                                        <p className="text-[13px] font-medium text-white/80 truncate group-hover:text-white transition-colors">
                                            {team1}
                                        </p>
                                        <span className="text-white/30 text-[11px]">vs</span>
                                        {flag2 && <img src={flag2} alt={team2} className={cn(team2.toLowerCase() === 'west indies' ? "w-5 h-5 object-contain" : "w-5 h-3.5 object-cover")} />}
                                        <p className="text-[13px] font-medium text-white/80 truncate group-hover:text-white transition-colors">
                                            {team2}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[13px] font-medium text-white/80 truncate group-hover:text-white transition-colors">
                                        {cleanTeams}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0 w-full sm:w-64">
                                <span className={cn(
                                    "text-[10px] uppercase tracking-widest font-semibold truncate flex-1",
                                    badge.text
                                )}>
                                    {resultText}
                                </span>
                                {m.matchUrl && (
                                    <a href={m.matchUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
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
    if (isLoading) return <LoadingOverlay text={`Fetching ${format} stats…`} />;
    if (!deepStats) return (
        <div className="text-center py-12 text-muted-foreground text-sm">
            Select a format above to load live venue stats.
        </div>
    );

    const { avgFirstInningsByYear, avgSecondInningsByYear, bowlerTypes, matchOutcomes: _mo,
        battingLeaders, bowlingLeaders, recentMatches } = deepStats as any;

    const totalWins = (deepStats.wonBattingFirst || 0) + (deepStats.wonBattingSecond || 0) + (deepStats.draws || 0);
    const batFirstPct = totalWins > 0 ? Math.round(((deepStats.wonBattingFirst || 0) / totalWins) * 100) : 0;
    const batSecondPct = totalWins > 0 ? Math.round(((deepStats.wonBattingSecond || 0) / totalWins) * 100) : 0;
    const drawsPct = totalWins > 0 ? Math.round(((deepStats.draws || 0) / totalWins) * 100) : 0;

    const winData = [
        { name: "Bat 1st Wins", value: batFirstPct },
        { name: "Bat 2nd Wins", value: batSecondPct },
        { name: "Draws / No Res", value: drawsPct },
    ].filter(d => d.value > 0);

    const tossData = [
        { name: "Chose Bat", value: deepStats.tossWinBatFirst },
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
            <div className="bg-[#141414] rounded-3xl p-6 md:p-8 border border-white/[0.03] shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                    <StatCard label="Matches Hosted" value={deepStats.matchesHosted || 0} color={color}
                        icon={<Calendar size={14} style={{ color }} />} />
                    <StatCard label="Avg 1st Innings" value={deepStats.avgFirstInningsScore || "—"} color={color}
                        icon={<BarChart3 size={14} style={{ color }} />} />
                    <StatCard label="Avg 2nd Innings" value={deepStats.avgSecondInningsScore || "—"} color={color}
                        icon={<BarChart3 size={14} style={{ color }} />} />
                    <StatCard label="Avg Run Rate" value={deepStats.avgRunRate || "—"} color={color}
                        icon={<TrendingUp size={14} style={{ color }} />} />
                    <StatCard label="Bat First Win %" value={`${batFirstPct}%`} color="#8b5cf6"
                        icon={<Trophy size={14} style={{ color: "#8b5cf6" }} />} />
                    <StatCard label="Bat 2nd Win %" value={`${batSecondPct}%`} color="#06b6d4"
                        icon={<Shield size={14} style={{ color: "#06b6d4" }} />} />
                    <StatCard label="Centuries" value={deepStats.centuries || 0} color="#eab308"
                        icon={<Star size={14} style={{ color: "#eab308" }} />} />
                    <StatCard label="5-Wicket Hauls" value={deepStats.fiveWicketHauls || 0} color="#ef4444"
                        icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                </div>
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
            <div className={cn("grid grid-cols-1 gap-5",
                (deepStats.tossWinBatFirst > 0 || deepStats.tossWinFieldFirst > 0) ? "md:grid-cols-3" : "md:grid-cols-2"
            )}>
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

            {/* ── Avg 1st & 2nd innings by year (line chart) ── */}
            {((avgFirstInningsByYear && avgFirstInningsByYear.length > 1) || (avgSecondInningsByYear && avgSecondInningsByYear.length > 1)) && (() => {
                // Merge data by year for the chart
                const mergedMap = new Map();
                if (avgFirstInningsByYear) {
                    avgFirstInningsByYear.forEach((d: any) => mergedMap.set(d.year, { year: d.year, first: d.score }));
                }
                if (avgSecondInningsByYear) {
                    avgSecondInningsByYear.forEach((d: any) => {
                        if (mergedMap.has(d.year)) mergedMap.get(d.year).second = d.score;
                        else mergedMap.set(d.year, { year: d.year, second: d.score });
                    });
                }
                const mergedData = Array.from(mergedMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));

                return (
                    <Section icon={<TrendingUp size={16} style={{ color }} />} title="Average Innings Score Trend"
                        subtitle="How batting conditions have evolved over recent years">
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={mergedData}
                                    margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "currentColor" }} />
                                    <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                                    <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} />
                                    <Line type="monotone" name="1st Innings" dataKey="first" stroke={color} strokeWidth={2.5}
                                        dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} connectNulls={true} />
                                    <Line type="monotone" name="2nd Innings" dataKey="second" stroke="#3b82f6" strokeWidth={2.5}
                                        dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} connectNulls={true} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-4 justify-center mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[10px] text-muted-foreground">1st Innings</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] text-muted-foreground">2nd Innings</span>
                            </div>
                        </div>
                    </Section>
                );
            })()}

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
                    subtitle={`Top run-scorers at this venue in ${format === "All" ? "all formats" : format}`}>
                    <BattingLeadersTable leaders={battingLeaders || deepStats.battingLeaders || []} color={color} />
                </Section>
                <Section icon={<Swords size={16} style={{ color: "#ef4444" }} />} title="Bowling Leaders"
                    subtitle={`Top wicket-takers at this venue in ${format === "All" ? "all formats" : format}`}>
                    <BowlingLeadersTable leaders={bowlingLeaders || deepStats.bowlingLeaders || []} color="#ef4444" />
                </Section>
            </div>



            {/* ── Highest/Lowest ── */}
            <div className="grid grid-cols-2 mt-8 border-t border-white/5">
                <div className="py-5 pr-6 border-r border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-medium">Highest Total</p>
                    <p className="text-3xl font-mono text-white">{deepStats.highestTotal?.score}</p>
                    {deepStats.highestTotal?.team && deepStats.highestTotal.team !== "—" && (
                        <div className="mt-1 flex items-center gap-2">
                            {getTeamFlagUrl(deepStats.highestTotal.team) && <img src={getTeamFlagUrl(deepStats.highestTotal.team)!} alt={deepStats.highestTotal.team} className={cn(deepStats.highestTotal.team.toLowerCase() === 'west indies' ? "w-4 h-4 object-contain" : "w-4 h-3 object-cover")} />}
                            <p className="text-[12px] text-white/60">
                                {deepStats.highestTotal.team}
                                {deepStats.highestTotal.opposition && <span className="text-white/40 ml-1">v {deepStats.highestTotal.opposition}</span>}
                                <span className="text-white/30 ml-1">({deepStats.highestTotal.year})</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="py-5 pl-6">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-medium">Lowest Total</p>
                    <p className="text-3xl font-mono text-white">{deepStats.lowestTotal?.score}</p>
                    {deepStats.lowestTotal?.team && deepStats.lowestTotal.team !== "—" && (
                        <div className="mt-1 flex items-center gap-2">
                            {getTeamFlagUrl(deepStats.lowestTotal.team) && <img src={getTeamFlagUrl(deepStats.lowestTotal.team)!} alt={deepStats.lowestTotal.team} className={cn(deepStats.lowestTotal.team.toLowerCase() === 'west indies' ? "w-4 h-4 object-contain" : "w-4 h-3 object-cover")} />}
                            <p className="text-[12px] text-white/60">
                                {deepStats.lowestTotal.team}
                                {deepStats.lowestTotal.opposition && <span className="text-white/40 ml-1">v {deepStats.lowestTotal.opposition}</span>}
                                <span className="text-white/30 ml-1">({deepStats.lowestTotal.year})</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Recent Matches ── */}
            {(() => {
                const rawMatches = recentMatches || deepStats.recentMatches || [];
                const uniqueMatches = [];
                const seenDates = new Set();
                for (const m of rawMatches) {
                    if (!seenDates.has(m.date)) {
                        uniqueMatches.push(m);
                        seenDates.add(m.date);
                    }
                }
                return (
                    <Section icon={<Calendar size={16} style={{ color }} />} title="Recent Matches"
                        subtitle={`Last ${uniqueMatches.length} matches at this venue in ${format === "All" ? "all formats" : format}`}>
                        <RecentMatchesSection
                            matches={uniqueMatches}
                            format={format}
                            color={color}
                            venueName={venueName}
                        />
                    </Section>
                );
            })()}
        </div>
    );
};
// ─── BDFutbol Premium Detail ───────────────────────────────────────
const TEAM_COLORS: Record<string, { primary: string; secondary: string; domain?: string }> = {
    "Liverpool": { primary: "#C8102E", secondary: "#F6EB61", domain: "liverpoolfc.com" },
    "Arsenal": { primary: "#EF0107", secondary: "#9C824A", domain: "arsenal.com" },
    "Man Utd": { primary: "#DA291C", secondary: "#FBE122", domain: "manutd.com" },
    "Chelsea": { primary: "#034694", secondary: "#EE242C", domain: "chelseafc.com" },
    "Tottenham": { primary: "#132257", secondary: "#ffffff", domain: "tottenhamhotspur.com" },
    "Everton": { primary: "#003399", secondary: "#ffffff", domain: "evertonfc.com" },
    "Newcastle": { primary: "#241F20", secondary: "#ffffff", domain: "nufc.co.uk" },
    "Aston Villa": { primary: "#670E36", secondary: "#95BFE5", domain: "avfc.co.uk" },
    "West Ham": { primary: "#7A263A", secondary: "#1BB1E7", domain: "whufc.com" },
    "Fulham": { primary: "#000000", secondary: "#ffffff", domain: "fulhamfc.com" },
    "Real Madrid": { primary: "#ffffff", secondary: "#FEBE10", domain: "realmadrid.com" },
    "Barcelona": { primary: "#004D98", secondary: "#A50044", domain: "fcbarcelona.com" },
    "FC Barcelona": { primary: "#004D98", secondary: "#A50044", domain: "fcbarcelona.com" },
    "Bayern Munich": { primary: "#DC052D", secondary: "#0066B2", domain: "fcbayern.com" },
    "Atletico Madrid": { primary: "#CB3524", secondary: "#272E61", domain: "atleticodemadrid.com" },
    "Atletico": { primary: "#CB3524", secondary: "#272E61", domain: "atleticodemadrid.com" },
    "PSG": { primary: "#004170", secondary: "#DA291C", domain: "psg.fr" },
    "Sevilla": { primary: "#D42A20", secondary: "#ffffff", domain: "sevillafc.es" },
    "Juventus": { primary: "#000000", secondary: "#ffffff", domain: "juventus.com" },
    "Manchester City": { primary: "#6CABDD", secondary: "#1C2C5B", domain: "mancity.com" },
    "Espanyol": { primary: "#007FC8", secondary: "#ffffff", domain: "rcdespanyol.com" },
    "Athletic Club": { primary: "#EE2523", secondary: "#ffffff", domain: "athletic-club.eus" },
    "Athletic": { primary: "#EE2523", secondary: "#ffffff", domain: "athletic-club.eus" },
    "Valencia": { primary: "#ffffff", secondary: "#000000", domain: "valenciacf.com" },
    "Real Sociedad": { primary: "#0067B1", secondary: "#ffffff", domain: "realsociedad.eus" },
    "Sociedad": { primary: "#0067B1", secondary: "#ffffff", domain: "realsociedad.eus" },
    "Zaragoza": { primary: "#005CA5", secondary: "#ffffff", domain: "realzaragoza.com" },
    "Betis": { primary: "#0BB363", secondary: "#ffffff", domain: "realbetisbalompie.es" },
    "Celta": { primary: "#8B99BA", secondary: "#E30613", domain: "rccelta.es" }
};

const COMP_DOMAINS: Record<string, string> = {
    "Premier League": "/images/logos/pl.png",
    "Champions League": "/images/logos/ucl.png",
    "Europa League": "/images/logos/uel.png",
    "FA Cup": "thefa.com",
    "League Cup": "efl.com",
    "First Division": "laliga.com",
    "King's Cup": "rfef.es",
    "Cup Winners' Cup": "uefa.com",
    "Fairs Cup": "uefa.com",
    "Spanish Super Cup": "rfef.es",
    "European Super Cup": "uefa.com",
    "Latin Cup": "uefa.com",
    "Eva Duarte Cup": "rfef.es",
};

const BDFutbolDetail = ({ stats, color }: { stats: BDFutbolVenueStats; color: string }) => {
    return (
        <div className="space-y-6">
            {/* Premium Glassmorphism Dashboard */}
            <div className="relative mb-8 p-1">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 blur-[120px] opacity-[0.15] pointer-events-none" style={{ backgroundColor: color }} />

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hero Card - Matches */}
                    <div className="md:col-span-1 relative overflow-hidden bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors duration-500 shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-10 -translate-y-1/2 translate-x-1/4 transition-opacity duration-500 group-hover:opacity-20" style={{ backgroundColor: color }} />
                        <div className="flex items-center gap-2 text-white/50 mb-8 relative z-10">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase tracking-[0.15em]">Historical Matches Hosted</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter mb-2">
                                {stats.matchesHosted}
                            </div>
                            <div className="text-[11px] font-medium text-white/40 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} /> Total recorded fixtures
                            </div>
                        </div>
                    </div>

                    {/* Secondary Card - Clubs */}
                    <div className="md:col-span-1 relative overflow-hidden bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors duration-500 shadow-2xl">
                        <div className="flex items-center gap-2 text-white/50 mb-8 relative z-10">
                            <Shield size={16} />
                            <span className="text-xs font-bold uppercase tracking-[0.15em]">Distinct Clubs</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter mb-2">
                                {stats.clubs}
                            </div>
                            <div className="text-[11px] font-medium text-white/40">
                                Teams played here
                            </div>
                        </div>
                    </div>

                    {/* Secondary Card - Seasons */}
                    <div className="md:col-span-1 relative overflow-hidden bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors duration-500 shadow-2xl">
                        <div className="flex items-center gap-2 text-white/50 mb-8 relative z-10">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold uppercase tracking-[0.15em]">Seasons Played</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tighter mb-2">
                                {stats.seasons}
                            </div>
                            <div className="text-[11px] font-medium text-white/40">
                                Years of history
                            </div>
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-center hover:bg-white/[0.04] transition-colors shadow-md">
                            <div className="flex items-center gap-1.5 text-white/30 mb-2">
                                <MapPin size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Location</span>
                            </div>
                            <span className="text-sm font-semibold text-white truncate" title={stats.locationText}>{stats.locationText || "Unknown"}</span>
                        </div>
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-center hover:bg-white/[0.04] transition-colors shadow-md">
                            <div className="flex items-center gap-1.5 text-white/30 mb-2">
                                <Users size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Architect</span>
                            </div>
                            <span className="text-sm font-semibold text-white truncate" title={stats.architect}>{stats.architect || "Unknown"}</span>
                        </div>
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-center hover:bg-white/[0.04] transition-colors shadow-md">
                            <div className="flex items-center gap-1.5 text-white/30 mb-2">
                                <Target size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Dimensions</span>
                            </div>
                            <span className="text-sm font-semibold text-white font-mono">{stats.dimensions || "N/A"}</span>
                        </div>
                        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors shadow-md">
                            <div>
                                <div className="flex items-center gap-1.5 text-white/30 mb-2">
                                    <Trophy size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Comps</span>
                                </div>
                                <span className="text-sm font-semibold text-white font-mono">{stats.competitions.length}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5 text-white/30 mb-2">
                                    <Star size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Finals</span>
                                </div>
                                <span className="text-sm font-semibold text-white font-mono">1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top Visitors Chart */}
                <Section icon={<BarChart3 size={16} style={{ color }} />} title="Top Visitors" subtitle="Matches played by visiting teams">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topVisitors} margin={{ top: 20, right: 30, left: 0, bottom: 85 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                <XAxis dataKey="equip" tick={{ fill: "#666", fontSize: 11 }} angle={-45} textAnchor="end" interval={0} />
                                <YAxis tick={{ fill: "#666", fontSize: 11 }} />
                                <Tooltip contentStyle={CHART_TOOLTIP} itemStyle={TOOLTIP_TEXT_STYLE} labelStyle={TOOLTIP_TEXT_STYLE} />
                                <Bar dataKey="partits" radius={[4, 4, 0, 0]}>
                                    {stats.topVisitors?.map((entry, index) => {
                                        const homeTeamName = stats.homeTeams?.[0]?.name;
                                        const homeColors = homeTeamName && TEAM_COLORS[homeTeamName] ? TEAM_COLORS[homeTeamName] : { primary: color, secondary: `${color}44` };
                                        return <Cell key={`cell-${index}`} fill={index % 2 === 0 ? homeColors.primary : homeColors.secondary} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                {/* Map Integration */}
                <Section icon={<MapPin size={16} style={{ color }} />} title="Location Map" subtitle={stats.locationCoords && stats.locationCoords[0] ? `${stats.locationCoords[0]}, ${stats.locationCoords[1]}` : "Location Unknown"}>
                    {stats.locationCoords && stats.locationCoords[0] && stats.locationCoords[1] ? (
                        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-white/10 relative bg-muted/20">
                            <div className="absolute inset-0 pointer-events-auto">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src={`https://maps.google.com/maps?q=${stats.locationCoords[0]},${stats.locationCoords[1]}&z=15&output=embed`}
                                    style={{ filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(85%)" }}
                                ></iframe>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] w-full rounded-xl border border-white/10 border-dashed bg-white/[0.02] flex flex-col items-center justify-center text-center p-6 gap-3">
                            <MapPin className="text-white/20" size={48} />
                            <div>
                                <p className="text-white/60 font-medium text-lg">Location Unavailable</p>
                                <p className="text-white/40 text-sm mt-1 max-w-[250px] mx-auto">We don't have the exact map coordinates for this stadium yet.</p>
                            </div>
                        </div>
                    )}
                </Section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Visiting Teams List */}
                <Section className="h-[450px] flex flex-col" icon={<Users size={16} style={{ color }} />} title="Visiting Teams" subtitle="Top 10 visiting clubs by matches">
                    <div className="mt-2 flex flex-col gap-4 flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                        {stats.visitingTeams.map((team, idx) => {
                            const teamData = TEAM_COLORS[team.name === "Manchester United" ? "Man Utd" : team.name];
                            return (
                                <div key={idx} className="flex justify-between items-center py-3.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-300 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform ${team.name === "Tottenham" ? "bg-[#132257]" : "bg-white"}`}>
                                            <DynamicLogo name={team.name} fallbackIcon={Shield} localDomain={teamData?.domain} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{team.name}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Rank {idx + 1}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 font-mono">{team.matches}</div>
                                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Matches</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {/* Competitions Hosted */}
                <Section className="h-[450px] flex flex-col" icon={<Trophy size={16} style={{ color }} />} title="Competitions Hosted" subtitle="Matches by competition">
                    <div className="mt-2 flex flex-col gap-3 flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                        {(stats.competitions || []).map((comp, idx) => {
                            // Match domains, stripping out years if present (e.g. "World Cup 1982")
                            const domain = COMP_DOMAINS[comp.name] || COMP_DOMAINS[comp.name.replace(/[0-9]/g, "").trim()];
                            const isDirectUrl = domain?.startsWith("http") || domain?.startsWith("/");
                            return (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-300 group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", domain ? "bg-white rounded-full p-1.5" : "")}>
                                            <DynamicLogo name={comp.name} isCompetition fallbackIcon={Trophy} localDomain={domain} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{comp.name}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Tournament</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 font-mono">{comp.matches}</div>
                                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Matches</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {/* Seasons List */}
                <Section className="h-[450px] flex flex-col" icon={<Calendar size={16} style={{ color }} />} title="Seasons Played" subtitle="Recent seasons and matches">
                    <div className="mt-2 flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                        {(stats.seasonsList || []).map((season, idx) => (
                            <div key={idx} className="min-h-[44px] flex justify-between items-center p-3 rounded-xl bg-secondary/15 border border-white/5 hover:bg-secondary/30 transition-colors">
                                <span className="text-sm text-foreground flex items-center gap-3">
                                    <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                                    Season {season.year}
                                </span>
                                <span className="font-mono text-sm font-semibold text-primary">{season.matches} matches</span>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Home Teams */}
                    <Section icon={<Users size={16} style={{ color }} />} title="Home Teams" subtitle="Teams that used the stadium">
                        <div className="mt-2 flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {(stats.homeTeams || []).map((team, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-secondary/15 border border-white/5 hover:bg-secondary/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            {(() => {
                                                const fallbackDomains: Record<string, string> = {
                                                    "Barcelona": "fcbarcelona.com",
                                                    "Barcelona Atlético": "fcbarcelona.com",
                                                    "Anderlecht": "rsca.be",
                                                    "Åtvidabergs": "atvidabergsff.se",
                                                    "Leeds": "leedsunited.com",
                                                    "Lyn": "lynfotball.no",
                                                    "Español": "rcdespanyol.com",
                                                    "Condal": "https://upload.wikimedia.org/wikipedia/en/7/7f/CD_Condal.gif",
                                                };
                                                const domain = TEAM_COLORS[team.name]?.domain || fallbackDomains[team.name];
                                                return <DynamicLogo name={team.name} fallbackIcon={Shield} localDomain={domain} />;
                                            })()}
                                        </div>
                                        <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{team.name}</span>
                                    </div>
                                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{team.matches} {team.matches === 1 ? 'Match' : 'Matches'}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Historical Names */}
                    <Section icon={<Building2 size={16} style={{ color }} />} title="Historical Names" subtitle="Past names of the stadium">
                        {stats.historicalNames && stats.historicalNames.length > 0 ? (
                            <div className="flex flex-col gap-3 mt-2 relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-5 bottom-5 w-px bg-white/10" />

                                {stats.historicalNames.map((name, idx) => (
                                    <div key={idx} className="relative pl-10 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                                        {/* Timeline node */}
                                        <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white/20 bg-background group-hover:border-white/60 group-hover:bg-white/20 transition-all z-10 shadow-[0_0_10px_rgba(255,255,255,0)] group-hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]" />

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{name.name}</span>
                                            <span className="text-xs font-mono text-white/40 tracking-wider bg-white/5 px-2.5 py-1 rounded-md border border-white/5">{name.period}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mt-2">
                                <p className="text-sm text-white/40 font-medium text-center">No historical names found</p>
                            </div>
                        )}
                    </Section>
                </div>

                <Section icon={<Star size={16} style={{ color: "#eab308" }} />} title="Finals Played" subtitle="Notable finals hosted">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {!stats.finalsPlayed || stats.finalsPlayed === "None" ? (
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <p className="text-sm text-white/40 font-medium">No notable finals hosted</p>
                            </div>
                        ) : (
                            stats.finalsPlayed.split(',').map((final, idx) => {
                                const trimmed = final.trim();
                                const dateMatch = trimmed.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
                                const date = dateMatch ? dateMatch[0] : "";
                                const parts = trimmed.split(/\b\d{2}\/\d{2}\/\d{4}\b/);
                                const comp = parts[0]?.trim();
                                let matchStr = parts[1]?.trim() || "";

                                // Parse "Team A X - Y Team B" or "Team A X-Y Team B"
                                const scoreRegex = /^(.*?)\s+(\d+)\s*-\s*(\d+)\s+(.*?)$/;
                                const scoreMatch = matchStr.match(scoreRegex);

                                return (
                                    <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
                                        <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-2">
                                            <span className="text-[12px] font-bold text-amber-500/90 uppercase tracking-[0.15em]">{comp || 'Final'}</span>
                                            {date && <span className="text-[11px] font-mono text-white/40 tracking-wider bg-white/5 px-2 py-1 rounded-md border border-white/5">{date}</span>}
                                        </div>

                                        {scoreMatch ? (
                                            <div className="flex items-center justify-between mt-1 relative z-10 w-full gap-2">
                                                <div className="flex-1 flex items-center justify-start gap-2">
                                                    <FootballTeamLogo name={scoreMatch[1].trim()} logo={null} size="xs" className="shrink-0" />
                                                    <span className="text-[13px] leading-tight text-white/90 font-medium text-left line-clamp-2">{scoreMatch[1].trim()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 px-2">
                                                    <span className="w-7 h-7 flex items-center justify-center bg-blue-900/60 border border-blue-500/30 text-white font-mono font-bold rounded shadow-inner text-sm">{scoreMatch[2]}</span>
                                                    <span className="w-7 h-7 flex items-center justify-center bg-blue-900/60 border border-blue-500/30 text-white font-mono font-bold rounded shadow-inner text-sm">{scoreMatch[3]}</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-end gap-2">
                                                    <span className="text-[13px] leading-tight text-white/90 font-medium text-right line-clamp-2">{scoreMatch[4].trim()}</span>
                                                    <FootballTeamLogo name={scoreMatch[4].trim()} logo={null} size="xs" className="shrink-0" />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/90 font-medium mt-1 relative z-10 text-center">
                                                {matchStr || trimmed}
                                            </p>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Section>
            </div>
        </div>
    );
};

// ─── Football ──────────────────────────────────────────────────────
const FootballDetail = ({ stats, color }: { stats: FootballVenueStats; color: string }) => {
    const resultData = [
        { name: "Home Win", value: stats.homeWinPct },
        { name: "Away Win", value: stats.awayWinPct },
        { name: "Draw", value: stats.drawPct },
    ];
    return (
        <div className="space-y-5">
            <div className="bg-[#141414] rounded-3xl p-6 md:p-8 border border-white/[0.03] shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                    <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
                    <StatCard label="Avg Goals/Match" value={stats.avgGoalsPerMatch} color={color} icon={<Target size={14} style={{ color }} />} />
                    <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981" icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                    <StatCard label="Away Win %" value={`${stats.awayWinPct}%`} color="#ef4444" icon={<Shield size={14} style={{ color: "#ef4444" }} />} />
                    <StatCard label="Draw %" value={`${stats.drawPct}%`} color="#94a3b8" icon={<Activity size={14} style={{ color: "#94a3b8" }} />} />
                    <StatCard label="Clean Sheet %" value={`${stats.cleanSheetPct}%`} color={color} icon={<Shield size={14} style={{ color }} />} />
                    <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color} icon={<Users size={14} style={{ color }} />} />
                    <StatCard label="Red Cards" value={stats.redCards} color="#ef4444" icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                </div>
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
            <div className="bg-[#141414] rounded-3xl p-6 md:p-8 border border-white/[0.03] shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                    <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
                    <StatCard label="Avg Total Points" value={stats.avgTotalPoints} color={color} icon={<TrendingUp size={14} style={{ color }} />} />
                    <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981" icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                    <StatCard label="Avg Point Diff" value={`+${stats.avgPointDifferential}`} color={color} icon={<BarChart3 size={14} style={{ color }} />} />
                    <StatCard label="Overtime Games" value={`${stats.overtimeGamesPct}%`} color="#eab308" icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                    <StatCard label="Triple Doubles" value={stats.tripleDoubles} color="#8b5cf6" icon={<Star size={14} style={{ color: "#8b5cf6" }} />} />
                    <StatCard label="Buzzer Beaters" value={stats.buzzerBeaters} color="#ec4899" icon={<Flame size={14} style={{ color: "#ec4899" }} />} />
                    <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color} icon={<Users size={14} style={{ color }} />} />
                </div>
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
            <div className="bg-[#141414] rounded-3xl p-6 md:p-8 border border-white/[0.03] shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-6">
                    <StatCard label="Surface" value={stats.surface} color={color} icon={<Activity size={14} style={{ color }} />} />
                    <StatCard label="Editions Hosted" value={stats.grandSlamEdition} color={color} icon={<Calendar size={14} style={{ color }} />} />
                    <StatCard label="Avg Sets/Match" value={stats.avgSetsPerMatch} color={color} icon={<BarChart3 size={14} style={{ color }} />} />
                    <StatCard label="Avg Duration" value={stats.avgMatchDuration} color={color} icon={<TrendingUp size={14} style={{ color }} />} />
                    <StatCard label="Tiebreak %" value={`${stats.tiebreakPct}%`} color="#eab308" icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                    <StatCard label="Aces/Match" value={stats.aceAvgPerMatch} color="#3b82f6" icon={<Target size={14} style={{ color: "#3b82f6" }} />} />
                    <StatCard label="Upset %" value={`${stats.upsetPct}%`} color="#ef4444" icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                    <StatCard label="Total Matches" value={stats.matchesHosted.toLocaleString()} color={color} icon={<Calendar size={14} style={{ color }} />} />
                </div>
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
export const VenueAnalysisPanel = ({ activeSport = "cricket" }: { activeSport?: Sport | "all" }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(searchParams.get("venue"));

    // Sync selected venue to URL so refreshing doesn't lose the active stadium
    useEffect(() => {
        const currentVenue = searchParams.get("venue");
        if (selectedVenueId === currentVenue || (!selectedVenueId && !currentVenue)) {
            return; // No need to update URL if it already matches our state
        }

        setSearchParams(prev => {
            if (selectedVenueId) {
                prev.set("venue", selectedVenueId);
            } else {
                prev.delete("venue");
            }
            return prev;
        }, { replace: true });
    }, [selectedVenueId, searchParams, setSearchParams]);
    const [selectedCountry, setSelectedCountry] = useState<string>("All");
    const [selectedLeague, setSelectedLeague] = useState<string>("All");
    const [venueSearch, setVenueSearch] = useState<string>("");
    const [activeFormat, setActiveFormat] = useState<VenueFormat>("Test");
    const [dynamicGallery, setDynamicGallery] = useState<string[]>([]);

    // Auto-fetch the dynamic gallery for the selected venue
    useEffect(() => {
        if (!selectedVenueId) {
            setDynamicGallery([]);
            return;
        }

        const fetchGallery = async () => {
            try {
                const response = await fetch(`/api/venues/${selectedVenueId}/gallery`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setDynamicGallery(data);
                    } else {
                        setDynamicGallery([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load dynamic gallery:", err);
                setDynamicGallery([]);
            }
        };
        fetchGallery();
    }, [selectedVenueId]);

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

    const bdfutbolId = useMemo(() => {
        if (!selectedVenueId) return null;
        const v = VENUE_ANALYSIS_DATA.find(x => x.id === selectedVenueId);
        if (v && v.sport === 'football' && 'isBDFutbol' in v.stats && v.stats.isBDFutbol) {
            return (v.stats as BDFutbolVenueStats).bdfutbolId || null;
        }
        return null;
    }, [selectedVenueId]);

    const [debouncedBdfutbolId, setDebouncedBdfutbolId] = useState<string | null>(bdfutbolId);

    useEffect(() => {
        // Wait 1000ms before setting the ID to prevent firing requests when rapidly clicking stadiums
        const handler = setTimeout(() => {
            setDebouncedBdfutbolId(bdfutbolId);
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [bdfutbolId]);

    const { data: bdfutbolDynamicStats, isLoading: isLoadingBDFutbolStats } = useBDFutbolVenueStats(debouncedBdfutbolId);

    const allVenues = useMemo(() => {
        const staticNonCricket = VENUE_ANALYSIS_DATA.filter(v => v.sport !== "cricket");
        const staticCricket = VENUE_ANALYSIS_DATA.filter(v => v.sport === "cricket");

        const enrichedDynamicCricket = dynamicCricketVenues.map(dynamicV => {
            const matchingStatic = staticCricket.find(staticV =>
                staticV.name.toLowerCase() === dynamicV.name.toLowerCase() ||
                (staticV.city === dynamicV.city && staticV.name.toLowerCase().includes(dynamicV.name.split(',')[0].toLowerCase())) ||
                dynamicV.name.toLowerCase().includes(staticV.name.toLowerCase()) ||
                staticV.name.toLowerCase().includes(dynamicV.name.toLowerCase())
            );

            if (matchingStatic) {
                return {
                    ...dynamicV,
                    capacity: (dynamicV.capacity && dynamicV.capacity !== 0) ? dynamicV.capacity : matchingStatic.capacity,
                    established: dynamicV.established ? dynamicV.established : matchingStatic.established,
                    image: dynamicV.image || matchingStatic.image
                };
            }
            return dynamicV;
        });

        return [...staticNonCricket, ...enrichedDynamicCricket];
    }, [dynamicCricketVenues]);

    const filteredVenues = useMemo(() => {
        let result = activeSport === "all" ? allVenues : allVenues.filter(v => v.sport === activeSport);

        if (activeSport === "football" && selectedLeague !== "All") {
            result = result.filter(v => v.league === selectedLeague);
        }

        if (venueSearch.trim()) {
            const q = venueSearch.toLowerCase();
            result = result.filter(v =>
                v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)
            );
        }
        return result;
    }, [activeSport, allVenues, venueSearch, selectedLeague]);

    const selectedVenue = useMemo(() => {
        if (!selectedVenueId) return null;
        return allVenues.find(v => v.id === selectedVenueId) || null;
    }, [selectedVenueId, allVenues]);

    const sportColor = (sport: Sport) => SPORT_CONFIG[sport].color;

    // ── Venue Grid ───────────────────────────────────────────────
    if (!selectedVenue) {
        return (
            <div className="space-y-6">
                {/* Filter and Search row */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    {(activeSport === "cricket" || activeSport === "all") && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border border-border/50 rounded-xl animate-fade-in shrink-0 w-full md:w-auto">
                            <Select
                                value={selectedCountry}
                                onValueChange={(val) => { setSelectedCountry(val); setVenueSearch(""); }}
                            >
                                <SelectTrigger className="w-full md:w-[180px] bg-transparent border-none text-sm font-semibold shadow-none focus:ring-0 px-0 h-auto gap-2">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl">
                                    <SelectItem value="All" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2">🌐 All</div></SelectItem>
                                    <SelectItem value="India" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-auto rounded-[2px] object-cover" /> India</div></SelectItem>
                                    <SelectItem value="Australia" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/au.png" alt="Australia" className="w-5 h-auto rounded-[2px] object-cover" /> Australia</div></SelectItem>
                                    <SelectItem value="England" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/gb-eng.png" alt="England" className="w-5 h-auto rounded-[2px] object-cover" /> England</div></SelectItem>
                                    <SelectItem value="Pakistan" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/pk.png" alt="Pakistan" className="w-5 h-auto rounded-[2px] object-cover" /> Pakistan</div></SelectItem>
                                    <SelectItem value="South Africa" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/za.png" alt="South Africa" className="w-5 h-auto rounded-[2px] object-cover" /> South Africa</div></SelectItem>
                                    <SelectItem value="Sri Lanka" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/lk.png" alt="Sri Lanka" className="w-5 h-auto rounded-[2px] object-cover" /> Sri Lanka</div></SelectItem>
                                    <SelectItem value="Bangladesh" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/bd.png" alt="Bangladesh" className="w-5 h-auto rounded-[2px] object-cover" /> Bangladesh</div></SelectItem>
                                    <SelectItem value="West Indies" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="/flags/westindies.png" alt="West Indies" className="w-5 h-auto rounded-[2px] object-cover" /> West Indies</div></SelectItem>
                                    <SelectItem value="New Zealand" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/nz.png" alt="New Zealand" className="w-5 h-auto rounded-[2px] object-cover" /> New Zealand</div></SelectItem>
                                    <SelectItem value="Zimbabwe" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/zw.png" alt="Zimbabwe" className="w-5 h-auto rounded-[2px] object-cover" /> Zimbabwe</div></SelectItem>
                                    <SelectItem value="Ireland" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ie.png" alt="Ireland" className="w-5 h-auto rounded-[2px] object-cover" /> Ireland</div></SelectItem>
                                    <SelectItem value="Scotland" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/gb-sct.png" alt="Scotland" className="w-5 h-auto rounded-[2px] object-cover" /> Scotland</div></SelectItem>
                                    <SelectItem value="UAE" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><img src="https://flagcdn.com/w20/ae.png" alt="UAE" className="w-5 h-auto rounded-[2px] object-cover" /> UAE</div></SelectItem>
                                </SelectContent>
                            </Select>
                            {isLoadingCricketVenues && (
                                <div className="ml-2 w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                            )}
                        </div>
                    )}

                    {activeSport === "football" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border border-border/50 rounded-xl animate-fade-in shrink-0 w-full md:w-auto">
                            <Select
                                value={selectedLeague}
                                onValueChange={(val) => { setSelectedLeague(val); setVenueSearch(""); }}
                            >
                                <SelectTrigger className="w-full md:w-[200px] bg-transparent border-none text-sm font-semibold shadow-none focus:ring-0 px-0 h-auto gap-2">
                                    <SelectValue placeholder="Select League" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl">
                                    <SelectItem value="All" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2">🌐 All Leagues</div></SelectItem>
                                    <SelectItem value="Premier League" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src="https://images.fotmob.com/image_resources/logo/leaguelogo/47.png" alt="Premier League" className="w-4 h-4 object-contain" /></div> Premier League</div></SelectItem>
                                    <SelectItem value="La Liga" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src="https://images.fotmob.com/image_resources/logo/leaguelogo/87.png" alt="La Liga" className="w-4 h-4 object-contain" /></div> La Liga</div></SelectItem>
                                    <SelectItem value="Serie A" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src="https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" alt="Serie A" className="w-4 h-4 object-contain" /></div> Serie A</div></SelectItem>
                                    <SelectItem value="Bundesliga" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src="https://images.fotmob.com/image_resources/logo/leaguelogo/54.png" alt="Bundesliga" className="w-4 h-4 object-contain" /></div> Bundesliga</div></SelectItem>
                                    <SelectItem value="Ligue 1" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src="https://images.fotmob.com/image_resources/logo/leaguelogo/53.png" alt="Ligue 1" className="w-4 h-4 object-contain" /></div> Ligue 1</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {((activeSport === "cricket" || activeSport === "all") ? dynamicCricketVenues.length > 0 : true) && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/20 border border-border/40 rounded-xl flex-1 w-full">
                            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <input
                                type="text"
                                placeholder={`Search ${filteredVenues.length} venues by name or city…`}
                                value={venueSearch}
                                onChange={(e) => setVenueSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-none outline-none min-w-0"
                            />
                            {venueSearch && (
                                <button onClick={() => setVenueSearch("")} className="text-muted-foreground hover:text-foreground text-xs px-2 shrink-0">✕ Clear</button>
                            )}
                        </div>
                    )}
                </div>

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
                                    className="bg-[#0f1115] border border-white/5 rounded-2xl cursor-pointer
                                               hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1
                                               animate-slide-up group relative overflow-hidden flex flex-col"
                                    style={{ animationDelay: `${index * 40}ms`, minHeight: '320px' }}
                                >
                                    {/* Top 65% Image fading into the card */}
                                    <div className="absolute top-0 left-0 right-0 h-[65%] z-0 pointer-events-none overflow-hidden rounded-t-2xl">
                                        <img
                                            src={venue.image || `/images/venues/${venue.id}.jpg`}
                                            alt={venue.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            style={{
                                                WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                                                maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                                            }}
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                if (target.src.endsWith('.jpg')) {
                                                    target.src = target.src.replace('.jpg', '.png');
                                                } else if (target.src.endsWith('.png')) {
                                                    target.src = target.src.replace('.png', '.jpeg');
                                                } else {
                                                    target.style.display = 'none';
                                                    target.parentElement!.classList.add('bg-gradient-to-b', 'from-white/10', 'to-transparent');
                                                }
                                            }}
                                        />
                                        {/* Dark overlay gradient only at the bottom to ensure text legibility */}
                                        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/70 to-transparent" />
                                    </div>

                                    {/* Bottom Content - Spaced to allow the top image to show */}
                                    <div className="relative z-10 p-5 flex-1 flex flex-col justify-end pt-36">

                                        <div className="mb-4">
                                            <h3 className="font-bold text-[18px] text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1">
                                                {venue.name}
                                            </h3>
                                            <p className="text-[13px] text-gray-300 flex items-center gap-1.5 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                                <MapPin size={13} />
                                                {venue.city}, {venue.country}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto mb-4 px-1">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Capacity</span>
                                                <span className="text-white font-mono font-medium tracking-wide text-[13px]">
                                                    {venue.capacity ? venue.capacity.toLocaleString() : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Est.</span>
                                                <span className="text-white font-mono font-medium tracking-wide text-[13px]">
                                                    {venue.established}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-auto">
                                            <span className="text-[12px] font-medium text-emerald-400">Click for full analysis</span>
                                            <ChevronRight size={13} className="text-emerald-400" />
                                        </div>
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
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/5 min-h-[280px] flex flex-col p-6 md:p-8 bg-[#0a0a0c] shadow-2xl">
                {/* Background Image - Right Side, Fully Bright */}
                <div className="absolute inset-y-0 right-0 w-[60%] pointer-events-none">
                    <img
                        src={selectedVenue.image || `/images/venues/${selectedVenue.id}.jpg`}
                        alt={selectedVenue.name}
                        className="w-full h-full object-cover"
                        style={{
                            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                            maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                        }}
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src.endsWith('.jpg')) {
                                target.src = target.src.replace('.jpg', '.png');
                            } else {
                                target.style.display = 'none';
                                target.parentElement!.classList.add('bg-gradient-to-br', 'from-[#0a0a0c]', 'to-[#121216]');
                                target.parentElement!.classList.remove('right-0', 'w-[60%]');
                                target.parentElement!.classList.add('inset-0');
                            }
                        }}
                    />
                </div>

                {/* Subtle gradient from left to ensure perfect dark background integration */}
                <div className="absolute inset-y-0 left-0 w-[40%] bg-[#0a0a0c] pointer-events-none" />
                <div className="absolute inset-y-0 left-[40%] w-[10%] bg-gradient-to-r from-[#0a0a0c] to-transparent pointer-events-none" />

                <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                    {/* Top Row: Title, Description, and Badges */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 max-w-[45%]">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md mb-2">
                                    {selectedVenue.name}
                                </h2>
                                <p className="text-[13px] text-gray-300 flex items-center gap-1.5 font-medium">
                                    <MapPin size={14} className="text-emerald-400" />
                                    {selectedVenue.city}, {selectedVenue.country}
                                </p>
                            </div>

                            <p className="text-[13px] text-gray-400 leading-relaxed max-w-lg mb-4">
                                {(selectedVenue as any).nickname && <span className="text-white italic mr-2 font-semibold">"{(selectedVenue as any).nickname}"</span>}
                                {(() => {
                                    if (selectedVenue.description) return selectedVenue.description;

                                    const name = selectedVenue.name || "";
                                    if (name.includes("Wankhede")) return "An iconic venue in Mumbai, famously known for hosting the 2011 Cricket World Cup final. It features a unique suspended cantilever roof.";
                                    if (name.includes("Eden Gardens")) return "Known as the 'Mecca of Indian cricket', this historic ground in Kolkata is one of the largest and most passionately supported cricket stadiums in the world.";
                                    if (name.includes("Lord's")) return "Widely regarded as the 'Home of Cricket', this historic London venue is famous for its iconic pavilion and sloping outfield.";
                                    if (name.includes("Melbourne")) return "The 'G is a colossal stadium rich in history, serving as the spiritual home of Australian cricket and hosting the traditional Boxing Day Test.";
                                    if (name.includes("Sydney")) return "A deeply historic venue known for its heritage-listed Members Pavilion and traditionally spin-friendly pitches.";
                                    if (name.includes("Chinnaswamy")) return "A vibrant stadium in the heart of Bengaluru, known for its high-scoring matches, short boundaries, and electrifying crowd atmosphere.";
                                    if (name.includes("Modi")) return "The largest cricket stadium in the world by capacity, located in Ahmedabad. It boasts state-of-the-art facilities and a massive, modern architectural design.";

                                    const adjectives = ["A renowned", "A prominent", "An esteemed", "A distinguished", "A well-known", "A major"];
                                    const adj = adjectives[name.length % adjectives.length];
                                    let desc = `${adj} ${selectedVenue.sport?.toLowerCase() || 'sporting'} venue located in ${selectedVenue.city}, ${selectedVenue.country}.`;
                                    if (selectedVenue.established) desc += ` Established in ${selectedVenue.established}, it has been the site of numerous historic sporting moments.`;
                                    if (selectedVenue.capacity) desc += ` With a seating capacity of ${selectedVenue.capacity.toLocaleString()}, it provides a brilliant atmosphere for international fixtures.`;

                                    return desc;
                                })()}
                            </p>

                            {/* Format match count stats */}
                            {isCricket && (
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    {(selectedVenue as any).tests > 0 && (
                                        <div className="flex items-center px-3 py-1.5 rounded-full bg-[#121212] border border-[#222]">
                                            <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">
                                                <span className="text-white font-bold text-[12px] mr-1.5">{(selectedVenue as any).tests}</span>
                                                Tests
                                            </span>
                                        </div>
                                    )}
                                    {(selectedVenue as any).odis > 0 && (
                                        <div className="flex items-center px-3 py-1.5 rounded-full bg-[#121212] border border-[#222]">
                                            <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">
                                                <span className="text-white font-bold text-[12px] mr-1.5">{(selectedVenue as any).odis}</span>
                                                ODIs
                                            </span>
                                        </div>
                                    )}
                                    {(selectedVenue as any).t20is > 0 && (
                                        <div className="flex items-center px-3 py-1.5 rounded-full bg-[#121212] border border-[#222]">
                                            <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">
                                                <span className="text-white font-bold text-[12px] mr-1.5">{(selectedVenue as any).t20is}</span>
                                                T20Is
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Minimal Inline Stats on the Left */}
                    <div className="flex flex-row items-center gap-6 mt-8">
                        <div className="flex flex-col">
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 font-semibold">Capacity</p>
                            <p className="text-xl font-bold font-mono text-gray-200">{selectedVenue.capacity ? selectedVenue.capacity.toLocaleString() : "N/A"}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 font-semibold">Est.</p>
                            <p className="text-xl font-bold font-mono text-gray-200">{selectedVenue.established}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1 font-semibold">Sport</p>
                            <p className="text-xl font-bold text-gray-200">
                                {config.label}
                            </p>
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
                    {selectedVenue.stats.sport === "football" && (
                        (selectedVenue.stats as any).isBDFutbol
                            ? (isLoadingBDFutbolStats
                                ? <div className="flex flex-col items-center justify-center p-12 text-muted-foreground"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />Loading stadium data (this may take up to 10-15 seconds on first load)...</div>
                                : <BDFutbolDetail stats={(() => {
                                    if (!bdfutbolDynamicStats) return selectedVenue.stats as BDFutbolVenueStats;
                                    const staticStats = selectedVenue.stats as BDFutbolVenueStats;
                                    return {
                                        ...staticStats,
                                        ...bdfutbolDynamicStats,
                                        homeTeams: bdfutbolDynamicStats.homeTeams?.length ? bdfutbolDynamicStats.homeTeams : staticStats.homeTeams,
                                        competitions: bdfutbolDynamicStats.competitions?.length ? bdfutbolDynamicStats.competitions : staticStats.competitions,
                                        seasonsList: bdfutbolDynamicStats.seasonsList?.length ? bdfutbolDynamicStats.seasonsList : staticStats.seasonsList,
                                        visitingTeams: bdfutbolDynamicStats.visitingTeams?.length ? bdfutbolDynamicStats.visitingTeams : staticStats.visitingTeams,
                                        topVisitors: bdfutbolDynamicStats.topVisitors?.length ? bdfutbolDynamicStats.topVisitors : staticStats.topVisitors,
                                    };
                                })()} color={color} />)
                            : <FootballDetail stats={selectedVenue.stats as FootballVenueStats} color={color} />
                    )}
                    {selectedVenue.stats.sport === "basketball" && <BasketballDetail stats={selectedVenue.stats as BasketballVenueStats} color={color} />}
                    {selectedVenue.stats.sport === "tennis" && <TennisDetail stats={selectedVenue.stats as TennisVenueStats} color={color} />}
                </>
            )}

            {/* ── Stadium Gallery ── */}
            {(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery) && (dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery)?.length > 0 && (
                <div className="mt-8 space-y-5">
                    <Section icon={<Camera size={16} style={{ color }} />} title="Stadium Gallery" subtitle="Local photos from the public folder">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery)?.map((src, idx) => (
                                <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer relative shadow-lg">
                                    <img src={src} alt={`${selectedVenue.name} photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>
            )}
        </div>
    );
};
