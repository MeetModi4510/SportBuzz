import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    MapPin, ArrowLeft, TrendingUp, Trophy, Calendar, Users,
    BarChart3, Target, Star, Zap, Activity, Shield, Flame, Building2,
} from "lucide-react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from "recharts";
import { SportIcon } from "@/components/SportIcon";
import {
    VENUE_ANALYSIS_DATA, type VenueAnalysis,
    type CricketVenueStats, type FootballVenueStats,
    type BasketballVenueStats, type TennisVenueStats,
} from "@/data/venueAnalysisData";
import type { Sport } from "@/data/types";

// ─── Constants ───────────────────────────────────────────────────
const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#10b981", "#f59e0b"];
const CHART_TOOLTIP: React.CSSProperties = {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem", color: "hsl(var(--foreground))", fontSize: 12,
};

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
    cricket: { label: "Cricket", icon: "🏏", color: "#10b981" },
    football: { label: "Football", icon: "⚽", color: "#3b82f6" },
    basketball: { label: "Basketball", icon: "🏀", color: "#f97316" },
    tennis: { label: "Tennis", icon: "🎾", color: "#84cc16" },
};

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
const Section = ({ icon, title, subtitle, children }: {
    icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) => (
    <div className="bg-card border border-border/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">{subtitle}</p>
        {children}
    </div>
);

// ═════════════════════════════════════════════════════════════════
//  SPORT-SPECIFIC DETAIL PANELS
// ═════════════════════════════════════════════════════════════════

const CricketDetail = ({ stats, color }: { stats: CricketVenueStats; color: string }) => {
    const winData = [
        { name: "Bat First Wins", value: stats.wonBattingFirst },
        { name: "Bat Second Wins", value: stats.wonBattingSecond },
        { name: "Draws / No Result", value: stats.draws },
    ];
    const tossData = [
        { name: "Chose to Bat", value: stats.tossWinBatFirst },
        { name: "Chose to Field", value: stats.tossWinFieldFirst },
    ];
    const inningsComparison = [
        { label: "1st Innings", avg: stats.avgFirstInningsScore },
        { label: "2nd Innings", avg: stats.avgSecondInningsScore },
    ];

    return (
        <div className="space-y-5">
            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Avg 1st Innings" value={stats.avgFirstInningsScore} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg 2nd Innings" value={stats.avgSecondInningsScore} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg Run Rate" value={stats.avgRunRate} color={color}
                    icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Matches Hosted" value={stats.matchesHosted} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Centuries" value={stats.centuries} color="#eab308"
                    icon={<Star size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="5-Wicket Hauls" value={stats.fiveWicketHauls} color="#ef4444"
                    icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                <StatCard label="Avg Wickets/Match" value={stats.avgWicketsFallen} color={color}
                    icon={<Target size={14} style={{ color }} />} />
                <StatCard label="Bat First Win %" value={`${stats.wonBattingFirst}%`} color={color}
                    icon={<Trophy size={14} style={{ color }} />} />
            </div>

            {/* Pitch Info */}
            <div className="p-4 bg-secondary/15 rounded-xl border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} style={{ color }} />
                    <span className="text-xs font-semibold text-foreground">Pitch Characteristics</span>
                </div>
                <p className="text-sm text-muted-foreground">{stats.pitchType}</p>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Innings Comparison */}
                <Section icon={<BarChart3 size={16} style={{ color }} />} title="Innings Average"
                    subtitle="Avg score comparison: 1st vs 2nd innings">
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inningsComparison} barSize={48}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} />
                                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                                <Tooltip contentStyle={CHART_TOOLTIP} />
                                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                                    <Cell fill={color} />
                                    <Cell fill={`${color}88`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                {/* Win Distribution */}
                <Section icon={<Trophy size={16} style={{ color }} />} title="Win Distribution"
                    subtitle="Teams winning batting first vs second">
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={winData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {winData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                        {winData.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                <span className="text-[11px] text-muted-foreground">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Toss Decision */}
                <Section icon={<Zap size={16} style={{ color }} />} title="Toss Decision"
                    subtitle="What captains prefer after winning the toss">
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={tossData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#f97316" />
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-[11px] text-muted-foreground">Bat First</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-[11px] text-muted-foreground">Field First</span>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Format Breakdown */}
            <Section icon={<BarChart3 size={16} style={{ color }} />} title="Format Breakdown"
                subtitle="Matches hosted by format">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stats.formatBreakdown.map((f, i) => (
                        <div key={i} className="p-3 bg-secondary/20 rounded-lg text-center border border-border/30">
                            <span className="text-xs text-muted-foreground">{f.format}</span>
                            <p className="text-lg font-bold font-mono mt-1" style={{ color }}>{f.matches}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Highest / Lowest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/15 rounded-xl border border-green-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Highest Total</p>
                    <p className="text-2xl font-bold font-mono text-green-400">{stats.highestTotal.score}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.highestTotal.team} ({stats.highestTotal.year})</p>
                </div>
                <div className="p-4 bg-secondary/15 rounded-xl border border-red-500/20">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">Lowest Total</p>
                    <p className="text-2xl font-bold font-mono text-red-400">{stats.lowestTotal.score}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.lowestTotal.team} ({stats.lowestTotal.year})</p>
                </div>
            </div>
        </div>
    );
};

const FootballDetail = ({ stats, color }: { stats: FootballVenueStats; color: string }) => {
    const resultData = [
        { name: "Home Win", value: stats.homeWinPct },
        { name: "Away Win", value: stats.awayWinPct },
        { name: "Draw", value: stats.drawPct },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Goals/Match" value={stats.avgGoalsPerMatch} color={color}
                    icon={<Target size={14} style={{ color }} />} />
                <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981"
                    icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                <StatCard label="Away Win %" value={`${stats.awayWinPct}%`} color="#ef4444"
                    icon={<Shield size={14} style={{ color: "#ef4444" }} />} />
                <StatCard label="Draw %" value={`${stats.drawPct}%`} color="#94a3b8"
                    icon={<Activity size={14} style={{ color: "#94a3b8" }} />} />
                <StatCard label="Clean Sheet %" value={`${stats.cleanSheetPct}%`} color={color}
                    icon={<Shield size={14} style={{ color }} />} />
                <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color}
                    icon={<Users size={14} style={{ color }} />} />
                <StatCard label="Red Cards" value={stats.redCards} color="#ef4444"
                    icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Result Distribution */}
                <Section icon={<Trophy size={16} style={{ color }} />} title="Result Distribution"
                    subtitle="Home wins vs away wins vs draws">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={resultData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#94a3b8" />
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
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

                {/* Key Records */}
                <Section icon={<Star size={16} style={{ color }} />} title="Notable Records"
                    subtitle="Biggest wins and competition history">
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
                                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/40 text-foreground border border-border/40">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
};

const BasketballDetail = ({ stats, color }: { stats: BasketballVenueStats; color: string }) => {
    const winSplit = [
        { name: "Home Win", value: stats.homeWinPct },
        { name: "Away Win", value: stats.awayWinPct },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Matches Hosted" value={stats.matchesHosted.toLocaleString()} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Total Points" value={stats.avgTotalPoints} color={color}
                    icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Home Win %" value={`${stats.homeWinPct}%`} color="#10b981"
                    icon={<Trophy size={14} style={{ color: "#10b981" }} />} />
                <StatCard label="Avg Point Diff" value={`+${stats.avgPointDifferential}`} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Overtime Games" value={`${stats.overtimeGamesPct}%`} color="#eab308"
                    icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="Triple Doubles" value={stats.tripleDoubles} color="#8b5cf6"
                    icon={<Star size={14} style={{ color: "#8b5cf6" }} />} />
                <StatCard label="Buzzer Beaters" value={stats.buzzerBeaters} color="#ec4899"
                    icon={<Flame size={14} style={{ color: "#ec4899" }} />} />
                <StatCard label="Avg Attendance" value={stats.avgAttendance.toLocaleString()} color={color}
                    icon={<Users size={14} style={{ color }} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section icon={<Trophy size={16} style={{ color }} />} title="Home vs Away"
                    subtitle="Win distribution at this venue">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={winSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                    paddingAngle={4} dataKey="value" stroke="none">
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[11px] text-muted-foreground">Home ({stats.homeWinPct}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-[11px] text-muted-foreground">Away ({stats.awayWinPct}%)</span>
                        </div>
                    </div>
                </Section>

                <Section icon={<Star size={16} style={{ color }} />} title="Notable Records"
                    subtitle="All-time venue records">
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

const TennisDetail = ({ stats, color }: { stats: TennisVenueStats; color: string }) => {
    const setsData = [
        { name: "3-Set Matches", value: 100 - stats.fiveSetter },
        { name: "5-Set Matches", value: stats.fiveSetter },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard label="Surface" value={stats.surface} color={color}
                    icon={<Activity size={14} style={{ color }} />} />
                <StatCard label="Editions Hosted" value={stats.grandSlamEdition} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
                <StatCard label="Avg Sets/Match" value={stats.avgSetsPerMatch} color={color}
                    icon={<BarChart3 size={14} style={{ color }} />} />
                <StatCard label="Avg Duration" value={stats.avgMatchDuration} color={color}
                    icon={<TrendingUp size={14} style={{ color }} />} />
                <StatCard label="Tiebreak %" value={`${stats.tiebreakPct}%`} color="#eab308"
                    icon={<Zap size={14} style={{ color: "#eab308" }} />} />
                <StatCard label="Aces/Match" value={stats.aceAvgPerMatch} color="#3b82f6"
                    icon={<Target size={14} style={{ color: "#3b82f6" }} />} />
                <StatCard label="Upset %" value={`${stats.upsetPct}%`} color="#ef4444"
                    icon={<Flame size={14} style={{ color: "#ef4444" }} />} />
                <StatCard label="Total Matches" value={stats.matchesHosted.toLocaleString()} color={color}
                    icon={<Calendar size={14} style={{ color }} />} />
            </div>

            {/* Most Titles + Longest Match */}
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

            {/* Sets Distribution */}
            <Section icon={<BarChart3 size={16} style={{ color }} />} title="Match Length"
                subtitle="Percentage of 3-set vs 5-set matches">
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={setsData} barSize={60}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, ""]} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                <Cell fill={color} />
                                <Cell fill="#f97316" />
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
    const [activeSport, setActiveSport] = useState<Sport | "all">("all");
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

    const filteredVenues = useMemo(() => {
        if (activeSport === "all") return VENUE_ANALYSIS_DATA;
        return VENUE_ANALYSIS_DATA.filter(v => v.sport === activeSport);
    }, [activeSport]);

    const selectedVenue = useMemo(() => {
        if (!selectedVenueId) return null;
        return VENUE_ANALYSIS_DATA.find(v => v.id === selectedVenueId) || null;
    }, [selectedVenueId]);

    const sportColor = (sport: Sport) => SPORT_CONFIG[sport].color;

    // ── Venue Grid ───────────────────────────────────────────────
    if (!selectedVenue) {
        return (
            <div className="space-y-6">
                {/* Sport Filter */}
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

                {/* Venue Cards Grid */}
                <div className="grid md:grid-cols-3 gap-5">
                    {filteredVenues.map((venue, index) => {
                        const color = sportColor(venue.sport);
                        return (
                            <div
                                key={venue.id}
                                onClick={() => setSelectedVenueId(venue.id)}
                                className="bg-card border border-border rounded-xl p-6 space-y-4 cursor-pointer
                                           hover:border-opacity-80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                                           animate-slide-up group"
                                style={{ animationDelay: `${index * 80}ms`, borderColor: `${color}20` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-foreground group-hover:text-white transition-colors">
                                            {venue.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <MapPin size={12} />
                                            {venue.city}, {venue.country}
                                        </p>
                                    </div>
                                    <SportIcon sport={venue.sport} size={20} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Capacity</span>
                                        <span className="text-foreground font-medium font-mono">{venue.capacity.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Established</span>
                                        <span className="text-foreground font-medium font-mono">{venue.established}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Matches</span>
                                        <span className="font-medium font-mono" style={{ color }}>
                                            {venue.stats.matchesHosted.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {venue.nickname && (
                                    <p className="text-[11px] italic text-muted-foreground/70 border-t border-border/30 pt-3">
                                        "{venue.nickname}"
                                    </p>
                                )}

                                <div className="text-xs text-center py-1.5 rounded-lg bg-secondary/30 border border-border/30
                                              group-hover:text-white transition-colors" style={{ color }}>
                                    Click to view detailed analysis →
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Expanded Venue Detail ────────────────────────────────────
    const color = sportColor(selectedVenue.sport);
    const config = SPORT_CONFIG[selectedVenue.sport];

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
                style={{ background: `linear-gradient(135deg, ${color}18, ${color}08, transparent)` }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Building2 size={28} style={{ color }} />
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{selectedVenue.name}</h2>
                                {selectedVenue.nickname && (
                                    <p className="text-sm italic text-muted-foreground">"{selectedVenue.nickname}"</p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin size={14} />
                            {selectedVenue.city}, {selectedVenue.country}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-2xl">{selectedVenue.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="text-center px-5 py-3 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Capacity</p>
                            <p className="text-xl font-bold font-mono text-foreground">{selectedVenue.capacity.toLocaleString()}</p>
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

            {/* Sport-Specific Detail Panel */}
            {selectedVenue.stats.sport === "cricket" && <CricketDetail stats={selectedVenue.stats} color={color} />}
            {selectedVenue.stats.sport === "football" && <FootballDetail stats={selectedVenue.stats} color={color} />}
            {selectedVenue.stats.sport === "basketball" && <BasketballDetail stats={selectedVenue.stats} color={color} />}
            {selectedVenue.stats.sport === "tennis" && <TennisDetail stats={selectedVenue.stats} color={color} />}

            {/* Recent Matches at Venue */}
            <Section icon={<Calendar size={16} style={{ color }} />} title="Recent Matches"
                subtitle={`Latest results at ${selectedVenue.name}`}>
                <div className="space-y-2">
                    {selectedVenue.recentMatches.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/15
                                    hover:bg-secondary/30 transition-colors border border-border/20">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground font-mono w-20">{m.date}</span>
                                <span className="text-sm text-foreground font-medium">{m.teams}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground font-mono">{m.score}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: `${color}15`, color }}>
                                    {m.result}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Top Performers */}
            <Section icon={<Trophy size={16} style={{ color }} />} title="Top Performers"
                subtitle={`All-time greats at ${selectedVenue.name}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedVenue.topPerformers.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-secondary/15 rounded-xl
                                    border border-border/20 hover:border-opacity-60 transition-all"
                            style={{ borderColor: `${color}20` }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: `${color}20`, color }}>
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                                <p className="text-[11px] text-muted-foreground">{p.country}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold font-mono" style={{ color }}>{p.stat}</p>
                                <p className="text-[10px] text-muted-foreground">{p.highlight}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
};
