import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Star, TrendingUp, Target, Award, Zap, Flame,
    Calendar, BarChart3, Trophy, Shield, Swords, Activity,
    RefreshCw, Wifi, AlertTriangle, Loader2, Compass,
} from "lucide-react";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis,
    BarChart, Bar, Cell, PieChart, Pie, Legend,
    AreaChart, Area,
} from "recharts";
import {
    ANALYSIS_PLAYERS, SPORT_LABELS,
    type AnalysisSport, type AnalysisPlayer,
} from "@/data/playerAnalysisData";
import { usePlayerBattingStats } from '@/hooks/usePlayerBattingStats';
import { usePlayerBowlingStats, useBowlingDerivedStats } from '@/hooks/usePlayerBowlingStats';
import type { BattingFormatKey, PlayerBattingFormat } from '@/types/playerBattingTypes';
import type { BowlingFormatKey, PlayerBowlingFormat } from '@/types/playerBowlingTypes';
import { FORMAT_LABELS, FORMAT_COLORS, generateChartData, generateFormatBoundaryData, generateFormatRadarData } from '@/utils/playerStatsTransformer';
import { BOWLING_FORMAT_COLORS, BOWLING_FORMAT_LABELS, generateBowlingChartData, generateBowlingFormatRadarData, generateBowlingDerivedStats } from '@/utils/playerBowlingStatsTransformer';

type StatsView = 'batting' | 'bowling';

// ─── Styles ──────────────────────────────────────────────────────
const CHART_TOOLTIP = {
    backgroundColor: "#1e1e2e",
    border: "1px solid #3b3b4f",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#ffffff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    padding: "8px 12px",
};

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#10b981", "#f59e0b"];

// ─── Player Photos (local files in public/players/) ──────────────
const PLAYER_PHOTOS: Record<string, string> = {
    // Cricket
    cr1: "/players/virat_new.jpg", rohit: "/players/rohit_new.jpg", bumrah: "/players/bumrah.jpg",
    cr11: "/players/bumrah_new.png",
    gill: "/players/gill.jpg", hardik: "/players/hardik.jpg", jadeja: "/players/jadeja.jpg",
    cr4: "/players/cr4.jpg", head: "/players/head.jpg", warner: "/players/warner.jpg",
    smith: "/players/smith.jpg", maxwell: "/players/maxwell.jpg", starc: "/players/starc.jpg",
    cr5: "/players/cr5.jpg", stokes: "/players/stokes.jpg", buttler: "/players/buttler.jpg",
    bairstow: "/players/bairstow.jpg", kane: "/players/kane.jpg", boult: "/players/boult.jpg",
    ravindra: "/players/ravindra.jpg", babar: "/players/babar.jpg", rizwan: "/players/rizwan.jpg",
    shaheen: "/players/shaheen.jpg", rauf: "/players/rauf.jpg", rabada: "/players/rabada.jpg",
    dekock: "/players/dekock.jpg", jansen: "/players/jansen.jpg",
    // Cricket - extras (India)
    klrahul: "/players/klrahul.jpg", pant: "/players/pant.jpg", kuldeep: "/players/kuldeep.jpg",
    siraj: "/players/siraj.jpg", surya: "/players/surya.jpg",
    // Cricket - extras (Australia)
    marnus: "/players/marnus.jpg", hazlewood: "/players/hazlewood.jpg", carey: "/players/carey.jpg",
    cgreen: "/players/cgreen.jpg", zampa: "/players/zampa.jpg",
    // Cricket - extras (England)
    mwood: "/players/mwood.jpg", brook: "/players/brook.jpg", archer: "/players/archer.jpg",
    rashid_eng: "/players/rashid_eng.jpg", moeen: "/players/moeen.jpg",
    duckett: "/players/duckett.jpg", livingstone: "/players/livingstone.jpg",
    // Cricket - extras (NZ)
    southee: "/players/southee.jpg", latham: "/players/latham.jpg", jamieson: "/players/jamieson.jpg",
    mitchell_nz: "/players/mitchell_nz.jpg", nicholls: "/players/nicholls.jpg",
    santner: "/players/santner.jpg", henry: "/players/henry.jpg",
    // Cricket - extras (Pakistan)
    iftikhar: "/players/iftikhar.jpg", naseem: "/players/naseem.jpg", fakhar: "/players/fakhar.jpg",
    shadab: "/players/shadab.jpg", imam: "/players/imam.jpg",
    azamkhan: "/players/azamkhan.jpg", aamer: "/players/aamer.jpg",
    // Cricket - extras (SA)
    bavuma: "/players/bavuma.jpg", nortje: "/players/nortje.jpg", markram: "/players/markram.jpg",
    ngidi: "/players/ngidi.jpg", hendricks: "/players/hendricks.jpg", shamsi: "/players/shamsi.jpg",
    // Cricket - Sri Lanka
    sl1: "/players/sl1.jpg", sl2: "/players/sl2.jpg", sl3: "/players/sl3.jpg",
    sl4: "/players/sl4.jpg", sl5: "/players/sl5.jpg", sl6: "/players/sl6.jpg",
    sl7: "/players/sl7.jpg", sl8: "/players/sl8.jpg", sl9: "/players/sl9.jpg",
    sl10: "/players/sl10.jpg", sl11: "/players/sl11.jpg",
    // Cricket - Bangladesh
    bd1: "/players/bd1.jpg", bd2: "/players/bd2.jpg", bd3: "/players/bd3.jpg",
    bd4: "/players/bd4.jpg", bd5: "/players/bd5.jpg", bd6: "/players/bd6.jpg",
    bd7: "/players/bd7.jpg", bd8: "/players/bd8.jpg", bd9: "/players/bd9.jpg",
    bd10: "/players/bd10.jpg", bd11: "/players/bd11.jpg",
    // Cricket - West Indies
    wi1: "/players/wi1.jpg", wi2: "/players/wi2.jpg", wi3: "/players/wi3.jpg",
    wi4: "/players/wi4.jpg", wi5: "/players/wi5.jpg", wi6: "/players/wi6.jpg",
    wi7: "/players/wi7.jpg", wi8: "/players/wi8.jpg", wi9: "/players/wi9.jpg",
    wi10: "/players/wi10.jpg", wi11: "/players/wi11.jpg",
    // Cricket - Afghanistan
    af1: "/players/af1.jpg", af2: "/players/af2.jpg", af3: "/players/af3.jpg",
    af4: "/players/af4.jpg", af5: "/players/af5.jpg", af6: "/players/af6.jpg",
    af7: "/players/af7.jpg", af8: "/players/af8.jpg", af9: "/players/af9.jpg",
    af10: "/players/af10.jpg", af11: "/players/af11.jpg",
    // Football
    fb1: "/players/fb1.jpg", fb2: "/players/fb2.jpg", fb3: "/players/fb3.jpg",
    fb4: "/players/fb4.jpg", fb5: "/players/fb5.jpg", fb6: "/players/fb6.jpg",
    fb7: "/players/fb7.jpg", fb8: "/players/fb8.jpg", fb9: "/players/fb9.jpg",
    fb10: "/players/fb10.jpg", fb11: "/players/fb11.jpg", fb12: "/players/fb12.jpg",
    fb13: "/players/fb13.jpg", fb14: "/players/fb14.jpg", fb15: "/players/fb15.jpg",
    // Basketball
    bb1: "/players/bb1.jpg", bb2: "/players/bb2.jpg", bb3: "/players/bb3.jpg",
    bb4: "/players/bb4.jpg", bb5: "/players/bb5.jpg", bb6: "/players/bb6.jpg",
    bb7: "/players/bb7.jpg", bb8: "/players/bb8.jpg", bb9: "/players/bb9.jpg",
    bb10: "/players/bb10.jpg", bb11: "/players/bb11.jpg", bb12: "/players/bb12.jpg",
    // Tennis
    tn1: "/players/tn1.jpg", tn2: "/players/tn2.jpg", tn3: "/players/tn3.jpg",
    tn4: "/players/tn4.jpg", tn5: "/players/tn5.jpg", tn6: "/players/tn6.jpg",
    tn7: "/players/tn7.jpg", tn8: "/players/tn8.jpg", tn9: "/players/tn9.jpg",
    tn10: "/players/tn10.jpg", tn11: "/players/tn11.jpg", tn12: "/players/tn12.jpg",
};

// ─── Team / Country Colors ───────────────────────────────────────
const TEAM_COLORS: Record<string, { primary: string; gradient: string }> = {
    // Cricket
    "India": { primary: "#1d4ed8", gradient: "from-blue-600/20 to-blue-400/10" },
    "Australia": { primary: "#eab308", gradient: "from-yellow-500/20 to-amber-400/10" },
    "England": { primary: "#1e40af", gradient: "from-blue-800/20 to-blue-500/10" },
    "New Zealand": { primary: "#171717", gradient: "from-neutral-800/30 to-neutral-600/10" },
    "Pakistan": { primary: "#16a34a", gradient: "from-green-600/20 to-green-400/10" },
    "South Africa": { primary: "#15803d", gradient: "from-green-700/20 to-yellow-500/10" },
    "Sri Lanka": { primary: "#1e3a8a", gradient: "from-blue-900/20 to-yellow-400/10" },
    "Bangladesh": { primary: "#16a34a", gradient: "from-green-600/20 to-red-500/10" },
    "West Indies": { primary: "#7c1d41", gradient: "from-rose-900/20 to-yellow-400/10" },
    "Afghanistan": { primary: "#1e40af", gradient: "from-blue-800/20 to-red-500/10" },
    // Football
    "France": { primary: "#1e3a8a", gradient: "from-blue-900/20 to-blue-500/10" },
    "Norway": { primary: "#dc2626", gradient: "from-red-600/20 to-red-400/10" },
    "Argentina": { primary: "#60a5fa", gradient: "from-sky-400/20 to-white/10" },
    "Brazil": { primary: "#facc15", gradient: "from-yellow-400/20 to-green-500/10" },
    "Portugal": { primary: "#dc2626", gradient: "from-red-600/20 to-green-600/10" },
    "Belgium": { primary: "#ef4444", gradient: "from-red-500/20 to-yellow-400/10" },
    "Netherlands": { primary: "#f97316", gradient: "from-orange-500/20 to-orange-300/10" },
    "Spain": { primary: "#dc2626", gradient: "from-red-600/20 to-yellow-500/10" },
    "Nigeria": { primary: "#16a34a", gradient: "from-green-600/20 to-white/10" },
    "Morocco": { primary: "#dc2626", gradient: "from-red-600/20 to-green-600/10" },
    "Germany": { primary: "#171717", gradient: "from-neutral-900/20 to-red-500/10" },
    "Croatia": { primary: "#dc2626", gradient: "from-red-600/20 to-blue-500/10" },
    "Uruguay": { primary: "#60a5fa", gradient: "from-sky-400/20 to-sky-200/10" },
    // Basketball
    "USA": { primary: "#1d4ed8", gradient: "from-blue-600/20 to-red-500/10" },
    "Serbia": { primary: "#1e40af", gradient: "from-blue-800/20 to-red-500/10" },
    "Greece": { primary: "#2563eb", gradient: "from-blue-600/20 to-white/10" },
    "Slovenia": { primary: "#2563eb", gradient: "from-blue-600/20 to-white/10" },
    "Cameroon": { primary: "#16a34a", gradient: "from-green-600/20 to-red-500/10" },
    "Canada": { primary: "#dc2626", gradient: "from-red-600/20 to-white/10" },
    // Tennis
    "Italy": { primary: "#2563eb", gradient: "from-blue-600/20 to-green-500/10" },
    "Russia": { primary: "#dc2626", gradient: "from-red-600/20 to-blue-500/10" },
    "Poland": { primary: "#dc2626", gradient: "from-red-500/20 to-white/10" },
    "Belarus": { primary: "#dc2626", gradient: "from-red-600/20 to-green-500/10" },
};

const getTeamColor = (country: string) => TEAM_COLORS[country] || { primary: "#6b7280", gradient: "from-gray-500/20 to-gray-300/10" };

// ─── Flag Helper ─────────────────────────────────────────────────
const COUNTRY_CODES: Record<string, string> = {
    "India": "in", "Australia": "au", "England": "gb-eng", "New Zealand": "nz",
    "Pakistan": "pk", "South Africa": "za", "Sri Lanka": "lk", "Bangladesh": "bd",
    "Afghanistan": "af", "France": "fr", "Norway": "no", "Argentina": "ar",
    "Brazil": "br", "Portugal": "pt", "Belgium": "be", "Netherlands": "nl",
    "Spain": "es", "Nigeria": "ng", "Morocco": "ma", "Germany": "de",
    "Croatia": "hr", "Uruguay": "uy", "USA": "us", "Serbia": "rs",
    "Greece": "gr", "Slovenia": "si", "Cameroon": "cm", "Canada": "ca",
    "Italy": "it", "Russia": "ru", "Poland": "pl", "Belarus": "by"
};

const getCountryFlagImg = (country: string, className = "w-5 h-auto rounded-[2px] shadow-sm") => {
    if (country === "West Indies") {
        return <img src="/flags/westindies.png" alt="West Indies" className={className} />;
    }
    const code = COUNTRY_CODES[country];
    if (code) {
        return <img src={`https://flagcdn.com/w40/${code}.png`} alt={country} className={className} />;
    }
    return null; // fallback if needed
};

// ─── Section Card ────────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children, className }: {
    icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) => (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
        <div className="px-5 py-3.5 border-b border-border bg-secondary/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
            <div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ─── Rating Ring ─────────────────────────────────────────────────
const RatingRing = ({ value, size = 56, color }: { value: number; size?: number; color: string }) => {
    const r = (size - 6) / 2;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={3} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
                    strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round"
                    className="transition-all duration-700 ease-out" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{value}</span>
        </div>
    );
};

// ─── Horizontal Legend (used below pie charts) ───────────────────
const ColorLegendList = ({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div className="space-y-2 mt-4">
            {data.map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-xs text-foreground flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-mono font-bold text-foreground">{d.value}</span>
                        <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Stat Card (for key-value displays) ──────────────────────────
const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="relative overflow-hidden p-3.5 bg-secondary/20 rounded-xl border border-border/50
                    hover:border-primary/30 transition-all group">
        <div className="absolute top-0 left-0 w-1 h-full rounded-r" style={{ backgroundColor: color }} />
        <p className="text-[11px] text-muted-foreground mb-1 pl-2">{label}</p>
        <p className="text-lg font-bold font-mono pl-2" style={{ color }}>{value}</p>
    </div>
);

// ─── API Format Tabs for Cricket ─────────────────────────────────
const API_FORMAT_TABS: { key: BattingFormatKey; label: string }[] = [
    { key: 'test', label: 'Test' },
    { key: 'odi', label: 'ODI' },
    { key: 't20', label: 'T20I' },
    { key: 'ipl', label: 'IPL' },
];

// ─── Cricket Specific Panels ─────────────────────────────────────
const CricketPanels = ({ player, teamColor, apiBattingFormat, setApiBattingFormat, statsView }: { 
    player: AnalysisPlayer; 
    teamColor: string;
    apiBattingFormat: BattingFormatKey;
    setApiBattingFormat: (fmt: BattingFormatKey) => void;
    statsView: StatsView;
}) => {
    const zones = player.specialData?.scoringZones || {};
    const formats = player.specialData?.formatBreakdown || {};
    const vsOpp = player.specialData?.vsOpposition || [];
    const zoneData = Object.entries(zones).map(([name, value]) => ({ name, value: value as number }));
    const formatData = Object.entries(formats).map(([fmt, data]: [string, any]) => ({
        format: fmt, matches: data.matches, ...(data.runs ? { runs: data.runs, avg: data.avg } : { wickets: data.wickets, avg: data.avg }),
    }));

    const isBowler = player.role.toLowerCase().includes("bowler");
    const unit = isBowler ? "wickets" : "runs";

    // ── Dynamic API batting stats ──
    const {
        battingStats: apiBattingStats,
        chartData: apiChartData,
        isLoading: isApiLoading,
        isError: isApiError,
        errorMessage: apiErrorMessage,
        refetch: refetchApiStats,
        cricbuzzId,
    } = usePlayerBattingStats(player.id);

    // ── Dynamic API bowling stats ──
    const {
        bowlingStats: apiBowlingStats,
        chartData: bowlingChartData,
        isLoading: isBowlingLoading,
        isError: isBowlingError,
        errorMessage: bowlingErrorMessage,
        refetch: refetchBowlingStats,
    } = usePlayerBowlingStats(player.id);

    const hasApiData = !!(apiBattingStats && (apiBattingStats.test || apiBattingStats.odi || apiBattingStats.t20 || apiBattingStats.ipl));
    const hasBowlingData = !!(apiBowlingStats && (apiBowlingStats.test || apiBowlingStats.odi || apiBowlingStats.t20 || apiBowlingStats.ipl));
    const currentApiFormat: PlayerBattingFormat | null = apiBattingStats?.[apiBattingFormat] || null;
    const currentBowlingFormat: PlayerBowlingFormat | null = apiBowlingStats?.[apiBattingFormat as BowlingFormatKey] || null;
    const bowlingDerived = currentBowlingFormat ? generateBowlingDerivedStats(currentBowlingFormat) : null;

    const showBowling = statsView === 'bowling';
    const isCurrentLoading = showBowling ? isBowlingLoading : isApiLoading;
    const isCurrentError = showBowling ? isBowlingError : isApiError;
    const currentErrorMessage = showBowling ? bowlingErrorMessage : apiErrorMessage;
    const currentRefetch = showBowling ? refetchBowlingStats : refetchApiStats;
    const hasCurrentData = showBowling ? hasBowlingData : hasApiData;

    return (
        <>
            {/* ── Dynamic API Stats Section ── */}
            {cricbuzzId && (
                <Section icon={<Zap size={16} style={{ color: teamColor }} />} title={showBowling ? "Bowling Cross-Format Analysis" : "Cross-Format Analysis"}
                    subtitle={showBowling ? "Bowling performance metrics and visualizations" : "Performance metrics breakdown and visualizations"}>

                    {/* Error state */}
                    {isCurrentError && !hasCurrentData && (
                        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center bg-secondary/10 rounded-xl border border-red-500/10 mb-5">
                            <AlertTriangle size={24} className="text-red-400" />
                            <p className="text-sm text-muted-foreground">{currentErrorMessage || `Failed to fetch ${showBowling ? 'bowling' : 'batting'} stats`}</p>
                            <button onClick={() => currentRefetch()} className="px-4 py-2 text-xs font-bold bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1.5">
                                <RefreshCw size={11} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Skeleton loader */}
                    {isCurrentLoading && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                        <div className="h-3 w-32 bg-secondary/30 rounded animate-pulse mb-4" />
                                        <div className="h-[160px] bg-secondary/20 rounded-lg animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── BATTING Charts ── */}
                    {!showBowling && hasApiData && currentApiFormat && !isApiLoading && (
                        <div className="space-y-5">
                            {apiChartData && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {apiChartData.runsByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <BarChart3 size={12} style={{ color: teamColor }} /> Runs by Format
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={apiChartData.runsByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Runs" radius={[6, 6, 0, 0]}>
                                                            {apiChartData.runsByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {apiChartData.averageByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <TrendingUp size={12} style={{ color: teamColor }} /> Average by Format
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={apiChartData.averageByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Average" radius={[6, 6, 0, 0]}>
                                                            {apiChartData.averageByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {apiChartData.strikeRateByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Activity size={12} style={{ color: teamColor }} /> Strike Rate
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={apiChartData.strikeRateByFormat}>
                                                        <defs>
                                                            <linearGradient id={`srGrad-${player.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={teamColor} stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor={teamColor} stopOpacity={0.02} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Area type="monotone" dataKey="value" name="SR" stroke={teamColor} strokeWidth={2.5} fill={`url(#srGrad-${player.id})`} dot={{ fill: teamColor, r: 4 }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {currentApiFormat && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Trophy size={12} style={{ color: teamColor }} /> Boundary Analysis — {FORMAT_LABELS[apiBattingFormat]}
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={generateFormatBoundaryData(currentApiFormat)} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                                            paddingAngle={3} dataKey="value" stroke="none">
                                                            {generateFormatBoundaryData(currentApiFormat).map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-center gap-4 mt-1">
                                                {generateFormatBoundaryData(currentApiFormat).map((entry, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill }} />
                                                        <span className="text-[10px] text-muted-foreground font-medium">{entry.name}: {entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentApiFormat && (
                                <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Compass size={12} style={{ color: teamColor }} /> Performance Radar — {FORMAT_LABELS[apiBattingFormat]}
                                    </p>
                                    <div className="h-[260px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={generateFormatRadarData(currentApiFormat, apiBattingFormat)}>
                                                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                                                <PolarAngleAxis dataKey="metric" tick={{ fill: 'currentColor', fontSize: 10 }} />
                                                <PolarRadiusAxis tick={{ fontSize: 9, fill: 'currentColor' }} domain={[0, 100]} />
                                                <Radar name="Performance" dataKey="value" stroke={FORMAT_COLORS[apiBattingFormat]} fill={FORMAT_COLORS[apiBattingFormat]} fillOpacity={0.25} strokeWidth={2} />
                                                <Tooltip contentStyle={CHART_TOOLTIP} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── BOWLING Charts ── */}
                    {showBowling && hasBowlingData && currentBowlingFormat && !isBowlingLoading && (
                        <div className="space-y-5">
                            {bowlingChartData && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Wickets by Format */}
                                    {bowlingChartData.wicketsByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Target size={12} style={{ color: teamColor }} /> Wickets by Format
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bowlingChartData.wicketsByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Wickets" radius={[6, 6, 0, 0]}>
                                                            {bowlingChartData.wicketsByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Economy Rate */}
                                    {bowlingChartData.economyByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <TrendingUp size={12} style={{ color: teamColor }} /> Economy Rate
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bowlingChartData.economyByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Economy" radius={[6, 6, 0, 0]}>
                                                            {bowlingChartData.economyByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bowling Average */}
                                    {bowlingChartData.averageByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <BarChart3 size={12} style={{ color: teamColor }} /> Bowling Average
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bowlingChartData.averageByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Average" radius={[6, 6, 0, 0]}>
                                                            {bowlingChartData.averageByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bowling Strike Rate */}
                                    {bowlingChartData.strikeRateByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Activity size={12} style={{ color: teamColor }} /> Bowling Strike Rate
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={bowlingChartData.strikeRateByFormat}>
                                                        <defs>
                                                            <linearGradient id={`bowlSrGrad-${player.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={teamColor} stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor={teamColor} stopOpacity={0.02} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Area type="monotone" dataKey="value" name="SR" stroke={teamColor} strokeWidth={2.5} fill={`url(#bowlSrGrad-${player.id})`} dot={{ fill: teamColor, r: 4 }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Maidens by Format */}
                                    {bowlingChartData.maidensByFormat.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Shield size={12} style={{ color: teamColor }} /> Maidens by Format
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bowlingChartData.maidensByFormat} barSize={32}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Bar dataKey="value" name="Maidens" radius={[6, 6, 0, 0]}>
                                                            {bowlingChartData.maidensByFormat.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4W vs 5W vs 10W Hauls */}
                                    {bowlingChartData.wicketHauls.length > 0 && (
                                        <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Award size={12} style={{ color: teamColor }} /> Wicket Hauls (4W / 5W / 10W)
                                            </p>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={bowlingChartData.wicketHauls} barSize={14}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                                        <XAxis dataKey="format" tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'currentColor' }} />
                                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                                        <Bar dataKey="fourWickets" name="4W" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="fiveWickets" name="5W" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="tenWickets" name="10W" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bowling Performance Radar */}
                            {currentBowlingFormat && (
                                <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Compass size={12} style={{ color: teamColor }} /> Bowling Radar — {BOWLING_FORMAT_LABELS[apiBattingFormat as BowlingFormatKey]}
                                    </p>
                                    <div className="h-[260px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={generateBowlingFormatRadarData(currentBowlingFormat, apiBattingFormat as BowlingFormatKey)}>
                                                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                                                <PolarAngleAxis dataKey="metric" tick={{ fill: 'currentColor', fontSize: 10 }} />
                                                <PolarRadiusAxis tick={{ fontSize: 9, fill: 'currentColor' }} domain={[0, 100]} />
                                                <Radar name="Bowling" dataKey="value" stroke={BOWLING_FORMAT_COLORS[apiBattingFormat as BowlingFormatKey]} fill={BOWLING_FORMAT_COLORS[apiBattingFormat as BowlingFormatKey]} fillOpacity={0.25} strokeWidth={2} />
                                                <Tooltip contentStyle={CHART_TOOLTIP} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Derived Bowling Analytics */}
                            {bowlingDerived && (
                                <div className="bg-secondary/10 rounded-xl border border-border/50 p-4">
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Flame size={12} style={{ color: teamColor }} /> Derived Analytics — {BOWLING_FORMAT_LABELS[apiBattingFormat as BowlingFormatKey]}
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="relative overflow-hidden p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                                            <div className="absolute top-0 left-0 w-1 h-full rounded-r" style={{ backgroundColor: teamColor }} />
                                            <p className="text-[11px] text-muted-foreground mb-1 pl-2">Wkts/Match</p>
                                            <p className="text-lg font-bold font-mono pl-2" style={{ color: teamColor }}>{bowlingDerived.wicketsPerMatch}</p>
                                        </div>
                                        <div className="relative overflow-hidden p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                                            <div className="absolute top-0 left-0 w-1 h-full rounded-r" style={{ backgroundColor: teamColor }} />
                                            <p className="text-[11px] text-muted-foreground mb-1 pl-2">Wkts/Inns</p>
                                            <p className="text-lg font-bold font-mono pl-2" style={{ color: teamColor }}>{bowlingDerived.wicketsPerInnings}</p>
                                        </div>
                                        <div className="relative overflow-hidden p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                                            <div className="absolute top-0 left-0 w-1 h-full rounded-r" style={{ backgroundColor: teamColor }} />
                                            <p className="text-[11px] text-muted-foreground mb-1 pl-2">Impact Score</p>
                                            <p className="text-lg font-bold font-mono pl-2" style={{ color: teamColor }}>{bowlingDerived.bowlingImpactScore}</p>
                                        </div>
                                        <div className="relative overflow-hidden p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                                            <div className="absolute top-0 left-0 w-1 h-full rounded-r" style={{ backgroundColor: teamColor }} />
                                            <p className="text-[11px] text-muted-foreground mb-1 pl-2">Haul Eff. %</p>
                                            <p className="text-lg font-bold font-mono pl-2" style={{ color: teamColor }}>{bowlingDerived.wicketHaulEfficiency}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Bowling Empty State ── */}
                    {showBowling && !hasBowlingData && !isBowlingLoading && !isBowlingError && (
                        <div className="p-10 flex flex-col items-center justify-center gap-3 text-center bg-secondary/5 rounded-xl border border-border/30">
                            <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                                <Shield size={24} className="text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No bowling records available</p>
                            <p className="text-xs text-muted-foreground/60 max-w-[280px]">
                                This player has no bowling statistics across any format, or data is not yet available from Cricbuzz.
                            </p>
                        </div>
                    )}
                </Section>
            )}

            {/* ── Existing Mock Data Panels (always shown, serve as fallback) ── */}
            {/* Scoring Zones + Format Breakdown side by side */}
            <Section icon={<Target size={16} style={{ color: teamColor }} />} title={isBowler ? "Bowling Length Analysis" : "Scoring Zones"}
                subtitle={isBowler ? "Wicket distribution by length" : "Career run distribution by zone"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Pie Chart — no inline labels, just clean donut */}
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={zoneData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {zoneData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP}
                                    formatter={(val: number, name: string) => [`${val.toLocaleString()} ${unit}`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend list with values */}
                    <div className="flex items-center">
                        <div className="w-full">
                            <ColorLegendList data={zoneData} colors={PIE_COLORS} />
                        </div>
                    </div>
                </div>
            </Section>

            <Section icon={<BarChart3 size={16} style={{ color: teamColor }} />} title="Format Breakdown"
                subtitle="Performance across Test, ODI, and T20 formats">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {formatData.map((f, i) => (
                        <div key={i} className="p-4 bg-secondary/20 rounded-xl border border-border/50 transition-all"
                            style={{ borderColor: `${teamColor}20` }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-sm text-foreground">{f.format}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: `${teamColor}15`, color: teamColor }}>
                                    {f.matches} matches
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {"runs" in f ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Runs</p>
                                            <p className="text-xl font-bold font-mono text-foreground">{f.runs}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average</p>
                                            <p className="text-xl font-bold font-mono" style={{ color: teamColor }}>{f.avg}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wickets</p>
                                            <p className="text-xl font-bold font-mono text-foreground">{(f as any).wickets}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average</p>
                                            <p className="text-xl font-bold font-mono" style={{ color: teamColor }}>{f.avg}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section icon={<Swords size={16} style={{ color: teamColor }} />} title="vs Opposition"
                subtitle="Batting/bowling average against top teams">
                <div className="space-y-3">
                    {vsOpp.map((opp: any, i: number) => {
                        const maxAvg = Math.max(...vsOpp.map((o: any) => o.avg));
                        return (
                            <div key={i} className="flex items-center gap-4 group">
                                <span className="text-xs font-semibold w-28 text-foreground">{opp.team}</span>
                                <div className="flex-1 bg-secondary/30 rounded-full h-3 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(opp.avg / maxAvg) * 100}%`, background: `linear-gradient(to right, ${teamColor}, ${teamColor}aa)` }} />
                                </div>
                                <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: teamColor }}>{opp.avg}</span>
                            </div>
                        );
                    })}
                </div>
            </Section>
        </>
    );
};

// ─── Football Specific Panels ────────────────────────────────────
const FootballPanels = ({ player, teamColor }: { player: AnalysisPlayer; teamColor: string }) => {
    const shootZones = player.specialData?.shootingZones || {};
    const seasonGoals = player.specialData?.seasonGoals || [];
    const heatmap = player.specialData?.positionHeatmap || [];
    const shootData = Object.entries(shootZones).map(([name, value]) => ({ name, value: value as number }));

    return (
        <>
            <Section icon={<Target size={16} style={{ color: teamColor }} />} title="Shooting Zones"
                subtitle="Distribution of goals by pitch zone">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={shootData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {shootData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center">
                        <div className="w-full">
                            <ColorLegendList data={shootData} colors={PIE_COLORS} />
                        </div>
                    </div>
                </div>
            </Section>

            <Section icon={<TrendingUp size={16} style={{ color: teamColor }} />} title="Season Goals Progression"
                subtitle="Goal tally over recent seasons">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seasonGoals} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="season" tick={{ fontSize: 11, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                            <Tooltip contentStyle={CHART_TOOLTIP} />
                            <Bar dataKey="goals" fill={teamColor} radius={[6, 6, 0, 0]}>
                                {seasonGoals.map((_: any, i: number) => (
                                    <Cell key={i} fill={teamColor} fillOpacity={0.6 + i * 0.08} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            <Section icon={<Flame size={16} style={{ color: teamColor }} />} title="Position Heatmap"
                subtitle="Pitch zone activity intensity">
                <div className="flex justify-center">
                    <div className="relative w-[240px] aspect-[3/4] bg-emerald-900/20 rounded-xl border border-emerald-500/20 overflow-hidden p-1.5">
                        {/* Pitch lines */}
                        <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-white/10" /></div>
                        <div className="absolute top-0 left-1/4 right-1/4 h-[20%] border-b border-l border-r border-white/10 rounded-b-sm" />
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-[20%] border-t border-l border-r border-white/10 rounded-t-sm" />
                        <div className="grid grid-rows-4 grid-cols-3 gap-1 h-full relative z-10">
                            {heatmap.map((row: number[], ri: number) =>
                                row.map((val: number, ci: number) => {
                                    const max = Math.max(...heatmap.flat(), 1);
                                    const intensity = val / max;
                                    return (
                                        <div key={`${ri}-${ci}`} className="rounded transition-all hover:scale-105"
                                            title={`${val} actions`}
                                            style={{
                                                backgroundColor: intensity > 0.7
                                                    ? `rgba(239,68,68,${intensity * 0.7})`
                                                    : intensity > 0.3
                                                        ? `rgba(245,158,11,${intensity * 0.7})`
                                                        : `rgba(59,130,246,${Math.max(intensity * 0.5, 0.05)})`,
                                            }} />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-blue-500/30" /><span className="text-[11px] text-muted-foreground">Low</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-amber-500/50" /><span className="text-[11px] text-muted-foreground">Medium</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-red-500/60" /><span className="text-[11px] text-muted-foreground">High</span></div>
                </div>
            </Section>
        </>
    );
};

// ─── Basketball Specific Panels ──────────────────────────────────
const BasketballPanels = ({ player, teamColor }: { player: AnalysisPlayer; teamColor: string }) => {
    const shotDist = player.specialData?.shotDistribution || {};
    const clutch = player.specialData?.clutchStats || {};
    const splits = player.specialData?.seasonSplits || [];
    const shotData = Object.entries(shotDist).map(([name, value]) => ({ name, value: value as number }));

    return (
        <>
            <Section icon={<Target size={16} style={{ color: teamColor }} />} title="Shot Distribution"
                subtitle="Breakdown of shot types and locations">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={shotData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                    paddingAngle={3} dataKey="value" stroke="none">
                                    {shotData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center">
                        <div className="w-full">
                            <ColorLegendList data={shotData} colors={PIE_COLORS} />
                        </div>
                    </div>
                </div>
            </Section>

            <Section icon={<Zap size={16} style={{ color: teamColor }} />} title="Clutch Performance"
                subtitle="Key stats in high-pressure moments">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(clutch).map(([key, val], i) => (
                        <StatCard key={i} label={key} value={val as number} color={teamColor} />
                    ))}
                </div>
            </Section>

            <Section icon={<TrendingUp size={16} style={{ color: teamColor }} />} title="Season PPG Trend"
                subtitle="Points per game across recent seasons">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={splits} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="season" tick={{ fontSize: 11, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                            <Tooltip contentStyle={CHART_TOOLTIP} />
                            <Bar dataKey="ppg" fill={teamColor} radius={[6, 6, 0, 0]}>
                                {splits.map((_: any, i: number) => (
                                    <Cell key={i} fill={teamColor} fillOpacity={0.6 + i * 0.08} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>
        </>
    );
};

// ─── Tennis Specific Panels ──────────────────────────────────────
const TennisPanels = ({ player, teamColor }: { player: AnalysisPlayer; teamColor: string }) => {
    const surfaces = player.specialData?.surfaceWinRate || {};
    const serve = player.specialData?.serveAnalysis || {};
    const slams = player.specialData?.grandSlamBreakdown || {};
    const surfaceData = Object.entries(surfaces).map(([name, value]) => ({ surface: name, winRate: value as number }));
    const slamData = Object.entries(slams).map(([name, value]) => ({ name, titles: value as number }));
    const surfaceColors: Record<string, string> = { Hard: "#3b82f6", Clay: "#f97316", Grass: "#22c55e", Carpet: "#a855f7" };

    return (
        <>
            <Section icon={<Activity size={16} style={{ color: teamColor }} />} title="Surface Win Rate"
                subtitle="Win percentage by court surface type">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={surfaceData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="surface" tick={{ fontSize: 12, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} domain={[60, 100]}
                                tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={CHART_TOOLTIP} formatter={(val: number) => [`${val}%`, "Win Rate"]} />
                            <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
                                {surfaceData.map((entry, i) => (
                                    <Cell key={i} fill={surfaceColors[entry.surface] || teamColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            <Section icon={<Zap size={16} style={{ color: teamColor }} />} title="Serve Analysis"
                subtitle="Key serving statistics and effectiveness">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(serve).map(([key, val], i) => (
                        <StatCard key={i} label={key} value={val as string | number} color={teamColor} />
                    ))}
                </div>
            </Section>

            <Section icon={<Trophy size={16} style={{ color: teamColor }} />} title="Grand Slam Breakdown"
                subtitle="Titles won at each major tournament">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={slamData} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} />
                            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} allowDecimals={false} />
                            <Tooltip contentStyle={CHART_TOOLTIP} />
                            <Bar dataKey="titles" radius={[8, 8, 0, 0]}>
                                {slamData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export const PlayerAnalysisPanel = () => {
    const [activeSport, setActiveSport] = useState<AnalysisSport>("cricket");
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("cr1");
    const [selectedCountry, setSelectedCountry] = useState<string>("All");
    const [apiBattingFormat, setApiBattingFormat] = useState<BattingFormatKey>('odi');
    const [statsView, setStatsView] = useState<StatsView>('batting');

    const allPlayers = ANALYSIS_PLAYERS[activeSport];

    // Get unique countries for the current sport
    const countries = useMemo(() => {
        const unique = new Map<string, string>(); // country -> flag
        allPlayers.forEach(p => unique.set(p.country, p.country));
        return Array.from(unique.entries()).map(([name]) => ({ name }));
    }, [allPlayers]);

    // Filter players
    const filteredPlayers = useMemo(() => {
        return selectedCountry === "All"
            ? allPlayers
            : allPlayers.filter(p => p.country === selectedCountry);
    }, [allPlayers, selectedCountry]);

    // Reset selection when sport changes
    const handleSportChange = (sport: AnalysisSport) => {
        setActiveSport(sport);
        setSelectedCountry("All");
        // We'll set the first player of the new list in the effect below or just derive it
        // But for safety, let's grab the first one from the new sport
        const firstPlayer = ANALYSIS_PLAYERS[sport][0];
        setSelectedPlayerId(firstPlayer.id);
    };

    // Ensure selectedPlayerId is valid for the current filtered list (if possible)
    // If the filtered list doesn't contain the selected player, switch to the first one
    const displayPlayer = useMemo(() => {
        const found = filteredPlayers.find(p => p.id === selectedPlayerId);
        if (found) return found;
        return filteredPlayers[0] || allPlayers[0];
    }, [filteredPlayers, selectedPlayerId, allPlayers]);

    // We update the hook to use displayPlayer instead of finding it again
    const selectedPlayer = displayPlayer;
    const sportConfig = SPORT_LABELS[activeSport];

    const radarData = useMemo(() =>
        Object.entries(selectedPlayer.attributes).map(([key, value]) => ({ attribute: key, value, fullMark: 100 })),
        [selectedPlayer]
    );

    const formData = useMemo(() =>
        selectedPlayer.formTrend.map((v, i) => ({ match: `M${i + 1}`, rating: v })),
        [selectedPlayer]
    );

    // Fetch API stats here as well to power the top header
    const { 
        battingStats: apiBattingStats,
        isLoading: isApiLoading,
        isError: isApiError,
    } = usePlayerBattingStats(selectedPlayer.id);
    const hasApiData = !!(apiBattingStats && (apiBattingStats.test || apiBattingStats.odi || apiBattingStats.t20 || apiBattingStats.ipl));

    // Fetch bowling stats for the header too
    const {
        bowlingStats: apiBowlingStats,
        isLoading: isBowlingLoading,
        isError: isBowlingError,
    } = usePlayerBowlingStats(selectedPlayer.id);
    const hasBowlingData = !!(apiBowlingStats && (apiBowlingStats.test || apiBowlingStats.odi || apiBowlingStats.t20 || apiBowlingStats.ipl));
    const currentApiFormat = activeSport === 'cricket' && apiBattingStats ? apiBattingStats[apiBattingFormat] : null;
    const currentBowlingFormatHeader: PlayerBowlingFormat | null = activeSport === 'cricket' && apiBowlingStats ? apiBowlingStats[apiBattingFormat as BowlingFormatKey] : null;

    // Determine which data to show in the header based on statsView
    const showBowlingInHeader = statsView === 'bowling';

    return (
        <div className="space-y-6">
            {/* ── Sport Selector ── */}
            <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(SPORT_LABELS) as AnalysisSport[]).map(sport => (
                    <button
                        key={sport}
                        onClick={() => handleSportChange(sport)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 border",
                            activeSport === sport
                                ? "text-white shadow-lg scale-105 border-transparent"
                                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border-border/50"
                        )}
                        style={activeSport === sport ? { background: `linear-gradient(135deg, ${SPORT_LABELS[sport].color}, ${SPORT_LABELS[sport].color}bb)` } : undefined}
                    >
                        <span className="text-lg">{SPORT_LABELS[sport].icon}</span>
                        {SPORT_LABELS[sport].label}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* ── Player List ── */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
                        <span className="text-lg">{sportConfig.icon}</span> {sportConfig.label} Players
                    </h3>

                    {/* Country Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                        <button
                            onClick={() => setSelectedCountry("All")}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all flex items-center gap-2",
                                selectedCountry === "All"
                                    ? "text-white border-transparent shadow-md"
                                    : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60"
                            )}
                            style={selectedCountry === "All" ? { background: sportConfig.color } : undefined}
                        >
                            <span className="text-base leading-none">🌍</span>
                            <span className="leading-none mt-[1px]">All</span>
                        </button>
                        {countries.map(c => {
                            const tc = getTeamColor(c.name);
                            return (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedCountry(c.name)}
                                    className={cn(
                                        "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all flex items-center gap-2",
                                        selectedCountry === c.name
                                            ? "text-white border-transparent shadow-md"
                                            : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60"
                                    )}
                                    style={selectedCountry === c.name ? { background: tc.primary } : undefined}
                                >
                                    {getCountryFlagImg(c.name, "w-[22px] h-[15px] object-cover rounded-[2px] shadow-sm")}
                                    <span className="leading-none mt-[1px]">{c.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {filteredPlayers.map(player => (
                            <button
                                key={player.id}
                                onClick={() => setSelectedPlayerId(player.id)}
                                className={cn(
                                    "w-full text-left p-3.5 rounded-xl border transition-all group",
                                    selectedPlayer.id === player.id
                                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                                        : "border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md overflow-hidden"
                                        style={{ background: `linear-gradient(135deg, ${getTeamColor(player.country).primary}, ${getTeamColor(player.country).primary}88)` }}>
                                        {PLAYER_PHOTOS[player.id] ? (
                                            <img src={PLAYER_PHOTOS[player.id]} alt={player.name}
                                                className="w-full h-full object-cover rounded-xl"
                                                onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; const span = el.parentElement?.querySelector('span'); if (span) span.style.display = ''; }}
                                            />
                                        ) : null}
                                        <span style={PLAYER_PHOTOS[player.id] ? { display: 'none' } : undefined}>{player.image}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm truncate">{player.name}</span>
                                            <div className="flex-shrink-0 flex items-center justify-center">
                                                {getCountryFlagImg(player.country, "w-6 h-4 object-cover rounded-[2px] shadow-sm")}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-muted-foreground">{player.role}</span>
                                            <span className="text-[11px] text-muted-foreground">• Age {player.age}</span>
                                        </div>
                                    </div>
                                    <RatingRing value={player.overallRating} size={44} color={getTeamColor(player.country).primary} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Player Profile & Analysis ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Header Card */}
                    <div className={cn("rounded-xl border border-border p-6 bg-gradient-to-br", getTeamColor(selectedPlayer.country).gradient)}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${getTeamColor(selectedPlayer.country).primary}, ${getTeamColor(selectedPlayer.country).primary}66)`, width: 72, height: 72 }}>
                                    {PLAYER_PHOTOS[selectedPlayer.id] ? (
                                        <img src={PLAYER_PHOTOS[selectedPlayer.id]} alt={selectedPlayer.name}
                                            className="w-full h-full object-cover rounded-2xl"
                                            onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; const span = el.parentElement?.querySelector('span'); if (span) span.style.display = ''; }}
                                        />
                                    ) : null}
                                    <span style={PLAYER_PHOTOS[selectedPlayer.id] ? { display: 'none' } : undefined}>{selectedPlayer.image}</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        {selectedPlayer.name}
                                        <div className="flex-shrink-0 flex items-center justify-center mt-1">
                                            {getCountryFlagImg(selectedPlayer.country, "w-8 h-[22px] object-cover rounded-[3px] shadow-sm")}
                                        </div>
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{selectedPlayer.role} • {selectedPlayer.country}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <RatingRing value={selectedPlayer.overallRating} size={68} color={getTeamColor(selectedPlayer.country).primary} />
                                <p className="text-[10px] text-muted-foreground mt-1">Overall Rating</p>
                            </div>
                        </div>

                        {/* ── Dynamic API Stats (or fallback) ── */}
                        <div className="mt-6 pt-5 border-t border-border/30">
                            {activeSport === "cricket" && (hasApiData || hasBowlingData) ? (
                                <div className="space-y-4">
                                    {/* Batting / Bowling Toggle */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 mr-2">
                                            <button
                                                onClick={() => setStatsView('batting')}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                                                    statsView === 'batting'
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                                )}
                                            >
                                                🏏 Batting
                                            </button>
                                            <button
                                                onClick={() => setStatsView('bowling')}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                                                    statsView === 'bowling'
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                                )}
                                            >
                                                🎳 Bowling
                                            </button>
                                        </div>
                                    </div>

                                    {/* Format Tabs & Status */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {API_FORMAT_TABS.map(fmt => {
                                            const battingAvailable = apiBattingStats?.[fmt.key] !== null && apiBattingStats?.[fmt.key] !== undefined;
                                            const bowlingAvailable = apiBowlingStats?.[fmt.key as BowlingFormatKey] !== null && apiBowlingStats?.[fmt.key as BowlingFormatKey] !== undefined;
                                            const isAvailable = showBowlingInHeader ? bowlingAvailable : battingAvailable;
                                            return (
                                                <button
                                                    key={fmt.key}
                                                    onClick={() => isAvailable && setApiBattingFormat(fmt.key)}
                                                    disabled={!isAvailable}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                                                        apiBattingFormat === fmt.key && isAvailable
                                                            ? "text-white border-transparent shadow-md scale-105"
                                                            : !isAvailable
                                                            ? "bg-secondary/20 text-muted-foreground/40 border-border/30 cursor-not-allowed"
                                                            : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60"
                                                    )}
                                                    style={apiBattingFormat === fmt.key && isAvailable ? { background: FORMAT_COLORS[fmt.key], boxShadow: `0 4px 15px ${FORMAT_COLORS[fmt.key]}30` } : undefined}
                                                >
                                                    {fmt.label}
                                                </button>
                                            );
                                        })}
                                        
                                        {/* Status Badges */}
                                        <div className="ml-auto flex items-center gap-2">
                                            {(showBowlingInHeader ? isBowlingLoading : isApiLoading) ? (
                                                <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-500/20 flex items-center gap-1.5">
                                                    <Loader2 size={9} className="animate-spin" /> Loading
                                                </span>
                                            ) : (showBowlingInHeader ? isBowlingError : isApiError) ? (
                                                <span className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-500/20 flex items-center gap-1.5">
                                                    <AlertTriangle size={9} /> Error
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                                    <Wifi size={9} /> Live
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stat Cards Grid */}
                                    {(showBowlingInHeader ? isBowlingLoading : isApiLoading) ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <div key={i} className="p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                                                    <div className="h-2 w-16 bg-secondary/40 rounded animate-pulse mb-2" />
                                                    <div className="h-5 w-12 bg-secondary/30 rounded animate-pulse" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : showBowlingInHeader && currentBowlingFormatHeader ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <StatCard label="Matches" value={currentBowlingFormatHeader.matches} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Innings" value={currentBowlingFormatHeader.innings} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Wickets" value={currentBowlingFormatHeader.wickets} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="BBI" value={currentBowlingFormatHeader.bbi} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Average" value={currentBowlingFormatHeader.average.toFixed(2)} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Economy" value={currentBowlingFormatHeader.economy.toFixed(2)} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Strike Rate" value={currentBowlingFormatHeader.strikeRate.toFixed(2)} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="5W Hauls" value={currentBowlingFormatHeader.fiveWickets} color={FORMAT_COLORS[apiBattingFormat]} />
                                        </div>
                                    ) : showBowlingInHeader && !currentBowlingFormatHeader ? (
                                        <div className="p-6 flex flex-col items-center justify-center gap-2 text-center bg-secondary/5 rounded-xl border border-border/30">
                                            <Shield size={20} className="text-muted-foreground/40" />
                                            <p className="text-xs text-muted-foreground">No bowling data for this format</p>
                                        </div>
                                    ) : currentApiFormat ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <StatCard label="Matches" value={currentApiFormat.matches} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Innings" value={currentApiFormat.innings} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Runs" value={currentApiFormat.runs.toLocaleString()} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Highest" value={currentApiFormat.highestScore} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Average" value={currentApiFormat.average.toFixed(2)} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="Strike Rate" value={currentApiFormat.strikeRate.toFixed(2)} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="100s / 50s" value={`${currentApiFormat.hundreds} / ${currentApiFormat.fifties}`} color={FORMAT_COLORS[apiBattingFormat]} />
                                            <StatCard label="4s / 6s" value={`${currentApiFormat.fours} / ${currentApiFormat.sixes}`} color={FORMAT_COLORS[apiBattingFormat]} />
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.entries(selectedPlayer.detailedStats).slice(0, 4).map(([key, val]) => (
                                        <div key={key} className="bg-background/60 backdrop-blur rounded-xl p-3 text-center border border-white/5">
                                            <p className="text-xl font-bold font-mono">{val}</p>
                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{key}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Trend */}
                    <Section icon={<TrendingUp size={16} style={{ color: getTeamColor(selectedPlayer.country).primary }} />} title="Performance Trend"
                        subtitle="Match-by-match rating over last 10 games">
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formData}>
                                    <defs>
                                        <linearGradient id="formGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={getTeamColor(selectedPlayer.country).primary} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={getTeamColor(selectedPlayer.country).primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                    <XAxis dataKey="match" tick={{ fontSize: 11, fill: "currentColor" }} />
                                    <YAxis tick={{ fontSize: 11, fill: "currentColor" }} domain={[50, 100]} />
                                    <Tooltip contentStyle={CHART_TOOLTIP} />
                                    <Line type="monotone" dataKey="rating" stroke={getTeamColor(selectedPlayer.country).primary} strokeWidth={3}
                                        dot={{ fill: getTeamColor(selectedPlayer.country).primary, strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    {/* Attribute Radar + Detailed Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Section icon={<Star size={16} style={{ color: getTeamColor(selectedPlayer.country).primary }} />} title="Attribute Radar"
                            subtitle="Core skill breakdown">
                            <div className="h-[290px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                                        <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                                        <PolarAngleAxis dataKey="attribute" tick={{ fill: "currentColor", fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Rating" dataKey="value" stroke={getTeamColor(selectedPlayer.country).primary}
                                            fill={getTeamColor(selectedPlayer.country).primary} fillOpacity={0.25} strokeWidth={2.5} />
                                        <Tooltip contentStyle={CHART_TOOLTIP} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </Section>

                        <Section icon={<BarChart3 size={16} style={{ color: getTeamColor(selectedPlayer.country).primary }} />} title="Detailed Statistics"
                            subtitle="Full career numbers">
                            <div className="space-y-1 max-h-[290px] overflow-y-auto pr-1">
                                {activeSport === 'cricket' && showBowlingInHeader && currentBowlingFormatHeader ? (
                                    <>
                                        {[
                                            { label: 'Matches', value: currentBowlingFormatHeader.matches },
                                            { label: 'Innings', value: currentBowlingFormatHeader.innings },
                                            { label: 'Balls', value: currentBowlingFormatHeader.balls },
                                            { label: 'Runs', value: currentBowlingFormatHeader.runs },
                                            { label: 'Maidens', value: currentBowlingFormatHeader.maidens },
                                            { label: 'Wickets', value: currentBowlingFormatHeader.wickets },
                                            { label: 'Average', value: currentBowlingFormatHeader.average.toFixed(2) },
                                            { label: 'Economy', value: currentBowlingFormatHeader.economy.toFixed(2) },
                                            { label: 'Strike Rate', value: currentBowlingFormatHeader.strikeRate.toFixed(2) },
                                            { label: 'BBI', value: currentBowlingFormatHeader.bbi },
                                            { label: 'BBM', value: currentBowlingFormatHeader.bbm },
                                            { label: '4W Hauls', value: currentBowlingFormatHeader.fourWickets },
                                            { label: '5W Hauls', value: currentBowlingFormatHeader.fiveWickets },
                                            { label: '10W Hauls', value: currentBowlingFormatHeader.tenWickets },
                                        ].map((stat, i) => (
                                            <div key={stat.label} className={cn(
                                                "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors",
                                                i % 2 === 0 ? "bg-secondary/10 hover:bg-secondary/20" : "hover:bg-secondary/10"
                                            )}>
                                                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                                                <span className="text-sm font-mono font-bold text-foreground">{stat.value}</span>
                                            </div>
                                        ))}
                                    </>
                                ) : activeSport === 'cricket' && currentApiFormat ? (
                                    <>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors bg-secondary/10 hover:bg-secondary/20")}>
                                            <span className="text-xs text-muted-foreground font-medium">Matches</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.matches}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-secondary/10")}>
                                            <span className="text-xs text-muted-foreground font-medium">Innings</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.innings}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors bg-secondary/10 hover:bg-secondary/20")}>
                                            <span className="text-xs text-muted-foreground font-medium">Runs</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.runs}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-secondary/10")}>
                                            <span className="text-xs text-muted-foreground font-medium">Highest Score</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.highestScore}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors bg-secondary/10 hover:bg-secondary/20")}>
                                            <span className="text-xs text-muted-foreground font-medium">Average</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.average.toFixed(2)}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-secondary/10")}>
                                            <span className="text-xs text-muted-foreground font-medium">Strike Rate</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.strikeRate.toFixed(2)}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors bg-secondary/10 hover:bg-secondary/20")}>
                                            <span className="text-xs text-muted-foreground font-medium">100s</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.hundreds}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-secondary/10")}>
                                            <span className="text-xs text-muted-foreground font-medium">50s</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.fifties}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors bg-secondary/10 hover:bg-secondary/20")}>
                                            <span className="text-xs text-muted-foreground font-medium">4s</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.fours}</span>
                                        </div>
                                        <div className={cn("flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:bg-secondary/10")}>
                                            <span className="text-xs text-muted-foreground font-medium">6s</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{currentApiFormat.sixes}</span>
                                        </div>
                                    </>
                                ) : (
                                    Object.entries(selectedPlayer.detailedStats).map(([key, val], i) => (
                                        <div key={key} className={cn(
                                            "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors",
                                            i % 2 === 0 ? "bg-secondary/10" : "hover:bg-secondary/10"
                                        )}>
                                            <span className="text-xs text-muted-foreground font-medium">{key}</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{val}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Section>
                    </div>

                    {/* Sport-Specific Panels — 1 column, full width for clean display */}
                    <div className="space-y-5">
                        {activeSport === "cricket" && <CricketPanels player={selectedPlayer} teamColor={getTeamColor(selectedPlayer.country).primary} apiBattingFormat={apiBattingFormat} setApiBattingFormat={setApiBattingFormat} statsView={statsView} />}
                        {activeSport === "football" && <FootballPanels player={selectedPlayer} teamColor={getTeamColor(selectedPlayer.country).primary} />}
                        {activeSport === "basketball" && <BasketballPanels player={selectedPlayer} teamColor={getTeamColor(selectedPlayer.country).primary} />}
                        {activeSport === "tennis" && <TennisPanels player={selectedPlayer} teamColor={getTeamColor(selectedPlayer.country).primary} />}
                    </div>

                    {/* Career Milestones Timeline */}
                    <Section icon={<Calendar size={16} style={{ color: getTeamColor(selectedPlayer.country).primary }} />} title="Career Milestones"
                        subtitle="Key achievements throughout their career">
                        <div className="relative ml-4">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(to bottom, ${getTeamColor(selectedPlayer.country).primary}, ${getTeamColor(selectedPlayer.country).primary}50, transparent)` }} />
                            <div className="space-y-6">
                                {selectedPlayer.milestones.map((m, i) => (
                                    <div key={i} className="flex items-start gap-4 ml-6 relative group">
                                        <div className="absolute -left-[27px] w-3.5 h-3.5 rounded-full border-2 bg-background
                                                        group-hover:scale-125 transition-all"
                                            style={{ borderColor: getTeamColor(selectedPlayer.country).primary }}
                                            onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = getTeamColor(selectedPlayer.country).primary; }}
                                            onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = ''; }} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                                                    style={{ backgroundColor: `${getTeamColor(selectedPlayer.country).primary}15`, color: getTeamColor(selectedPlayer.country).primary }}>{m.year}</span>
                                                <p className="text-sm text-foreground font-medium">{m.event}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default PlayerAnalysisPanel;
