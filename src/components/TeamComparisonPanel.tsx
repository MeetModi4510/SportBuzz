import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    ANALYSIS_PLAYERS,
    SPORT_LABELS,
    AnalysisSport,
    AnalysisPlayer,
} from "@/data/playerAnalysisData";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    Legend,
} from "recharts";
import {
    Users,
    ChevronDown,
    Trophy,
    TrendingUp,
    Target,
    Zap,
    Shield,
    Star,
    Activity,
} from "lucide-react";

// ─── Country ISO code map for Flagpedia API ─────────────────────
const COUNTRY_ISO: Record<string, string> = {
    "India": "in",
    "Australia": "au",
    "England": "gb-eng",
    "New Zealand": "nz",
    "Pakistan": "pk",
    "South Africa": "za",
    "Sri Lanka": "lk",
    "Bangladesh": "bd",
    "Afghanistan": "af",
    "France": "fr",
    "Norway": "no",
    "Argentina": "ar",
    "Brazil": "br",
    "Portugal": "pt",
    "Belgium": "be",
    "Netherlands": "nl",
    "Spain": "es",
    "Germany": "de",
    "Croatia": "hr",
    "Uruguay": "uy",
    "Nigeria": "ng",
    "Morocco": "ma",
    "USA": "us",
    "Serbia": "rs",
    "Greece": "gr",
    "Slovenia": "si",
    "Canada": "ca",
    "Cameroon": "cm",
    "Italy": "it",
};

/**
 * TeamFlag — renders a real flag image.
 * For West Indies: uses the local /flags/westindies.png asset.
 * For all others: fetches from Flagpedia CDN via ISO country code.
 * Falls back silently to nothing if neither is available.
 */
function TeamFlag({ country, size = 48 }: { country: string; size?: number }) {
    // West Indies has no ISO country code — use stored image
    if (country === "West Indies") {
        return (
            <img
                src="/flags/westindies.png"
                alt="West Indies"
                width={size}
                height={size}
                className="object-contain rounded-md"
                style={{ width: size, height: size }}
            />
        );
    }

    const iso = COUNTRY_ISO[country];
    if (!iso) {
        // Unknown country — render nothing (keeps layout intact)
        return <span className="text-2xl">🏏</span>;
    }

    // Flagpedia CDN: /w40/{iso}.png  (40px wide, auto height)
    return (
        <img
            src={`https://flagcdn.com/w40/${iso}.png`}
            srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
            alt={country}
            width={size}
            height={Math.round(size * 0.66)}
            className="object-contain rounded-md"
            style={{ width: size, height: Math.round(size * 0.66) }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
    );
}

// ─── Tooltip style ───────────────────────────────────────────────
const TOOLTIP_STYLE = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

// ─── Country data builder ────────────────────────────────────────
interface CountryTeam {
    country: string;
    flag: string;
    players: AnalysisPlayer[];
    avgRating: number;
    avgAttributes: Record<string, number>;
    avgForm: number[];
    roleDistribution: Record<string, number>;
}

function buildCountryTeams(sport: AnalysisSport): CountryTeam[] {
    const players = ANALYSIS_PLAYERS[sport];
    const grouped: Record<string, AnalysisPlayer[]> = {};
    players.forEach((p) => {
        if (!grouped[p.country]) grouped[p.country] = [];
        grouped[p.country].push(p);
    });

    return Object.entries(grouped).map(([country, pls]) => {
        // avg rating
        const avgRating = Math.round(
            pls.reduce((s, p) => s + p.overallRating, 0) / pls.length
        );

        // avg attributes (union of all keys)
        const attrKeys = new Set<string>();
        pls.forEach((p) => Object.keys(p.attributes).forEach((k) => attrKeys.add(k)));
        const avgAttributes: Record<string, number> = {};
        attrKeys.forEach((k) => {
            const vals = pls.filter((p) => p.attributes[k] !== undefined).map((p) => p.attributes[k]);
            avgAttributes[k] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        });

        // avg form trend
        const maxLen = Math.max(...pls.map((p) => p.formTrend.length));
        const avgForm = Array.from({ length: maxLen }, (_, i) => {
            const vals = pls.filter((p) => p.formTrend[i] !== undefined).map((p) => p.formTrend[i]);
            return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        });

        // role distribution
        const roleDistribution: Record<string, number> = {};
        pls.forEach((p) => {
            roleDistribution[p.role] = (roleDistribution[p.role] || 0) + 1;
        });

        return {
            country,
            flag: pls[0].countryFlag,
            players: pls,
            avgRating,
            avgAttributes,
            avgForm,
            roleDistribution,
        };
    });
}

// ─── Sport-specific stat keys ────────────────────────────────────
const SPORT_STAT_KEYS: Record<AnalysisSport, string[]> = {
    cricket: ["Matches", "Runs", "Average", "Strike Rate", "Centuries", "Half Centuries"],
    football: ["Goals", "Assists", "Appearances", "Goals/90", "Shots/90", "Dribbles/90"],
    basketball: ["PPG", "RPG", "APG", "FG%", "3P%", "FT%"],
    tennis: ["Titles", "Grand Slams", "Win%", "Aces", "1st Serve%", "Weeks at No.1"],
};

// ─── Colors ──────────────────────────────────────────────────────
const TEAM_A_COLOR = "#6366f1"; // indigo
const TEAM_A_LIGHT = "#818cf8";
const TEAM_B_COLOR = "#f43f5e"; // rose
const TEAM_B_LIGHT = "#fb7185";
const PIE_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

// ─── Section wrapper ─────────────────────────────────────────────
function SectionCard({
    icon,
    title,
    children,
    className,
    gradient = false
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0f1e]/60 backdrop-blur-xl p-8",
                "shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-primary/20",
                className
            )}
        >
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            )}
            <div className="relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                            {icon}
                        </div>
                        <h3 className="font-black text-white text-xl uppercase tracking-tighter">{title}</h3>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Dynamic Form Indicator ──────────────────────────────────────
const FormIndicator = ({ form }: { form: number[] }) => {
    return (
        <div className="flex gap-1.5">
            {form.slice(-5).map((val, i) => {
                const isWin = val > 80;
                return (
                    <div 
                        key={i}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all",
                            isWin 
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                : "bg-slate-800/50 border-slate-700 text-slate-500"
                        )}
                    >
                        {isWin ? "W" : "L"}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Country selector HUD ───────────────────────────────────────
function CountrySelectHUD({
    teams,
    selected,
    onChange,
    accentColor,
    side,
}: {
    teams: CountryTeam[];
    selected: string;
    onChange: (c: string) => void;
    accentColor: string;
    side: "left" | "right";
}) {
    const [open, setOpen] = useState(false);
    const current = teams.find((t) => t.country === selected);

    return (
        <div className="relative group/hud">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative w-full overflow-hidden transition-all duration-500",
                    "rounded-[2.5rem] border-2 bg-[#020617]/40 backdrop-blur-xl group-hover/hud:translate-y-[-4px]",
                    open ? "border-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-white/5"
                )}
                style={{ borderColor: open ? accentColor : undefined }}
            >
                {/* HUD Scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-20 pointer-events-none" />
                
                <div className={cn(
                    "flex items-center gap-6 p-6",
                    side === "right" && "flex-row-reverse"
                )}>
                    {/* Flag Unit */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover/hud:scale-105 transition-transform">
                            <TeamFlag country={current?.country || ""} size={52} />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
                        </div>
                        <div className="absolute -inset-2 rounded-[2.5rem] border border-white/5 animate-[spin_10s_linear_infinite]" />
                    </div>

                    {/* Data Unit */}
                    <div className={cn("flex-1 min-w-0", side === "right" ? "text-right" : "text-left")}>
                        <h4 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                            {current?.country}
                        </h4>
                        <div className={cn("flex items-center gap-3", side === "right" && "flex-row-reverse")}>
                            <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                AVG {current?.avgRating}
                            </span>
                            <FormIndicator form={current?.avgForm || []} />
                        </div>
                    </div>
                    
                    <ChevronDown size={24} className={cn("text-slate-500 transition-transform duration-500", open && "rotate-180")} />
                </div>
            </button>

            {open && (
                <div className="absolute z-[100] mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-[#0a0f1e]/95 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none rounded-[2rem]" />
                    {teams.map((t) => (
                        <button
                            key={t.country}
                            onClick={() => {
                                onChange(t.country);
                                setOpen(false);
                            }}
                            className={cn(
                                "relative flex items-center gap-4 p-4 rounded-2xl transition-all group/item",
                                t.country === selected ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <span className="shrink-0 group-hover/item:scale-110 transition-transform flex items-center justify-center w-10 h-8">
                                <TeamFlag country={t.country} size={36} />
                            </span>
                            <div className="flex-1 min-w-0 text-left">
                                <span className="font-black text-white text-sm block uppercase tracking-tight">{t.country}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rating: {t.avgRating}</span>
                            </div>
                            {t.country === selected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#3b82f6]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Stat comparison bar ─────────────────────────────────────────
function StatComparisonSegment({
    label,
    valA,
    valB,
    maxVal,
}: {
    label: string;
    valA: number;
    valB: number;
    maxVal: number;
}) {
    const pctA = maxVal > 0 ? (valA / maxVal) * 100 : 0;
    const pctB = maxVal > 0 ? (valB / maxVal) * 100 : 0;
    const aWins = valA > valB;

    return (
        <div className="group/stat relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("text-2xl font-black transition-all", aWins ? "text-indigo-400 scale-110" : "text-slate-600")}>
                    {typeof valA === "number" && valA % 1 !== 0 ? valA.toFixed(1) : valA}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                    {label}
                </div>
                <div className={cn("text-2xl font-black transition-all", !aWins ? "text-rose-400 scale-110" : "text-slate-600")}>
                    {typeof valB === "number" && valB % 1 !== 0 ? valB.toFixed(1) : valB}
                </div>
            </div>
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden flex">
                <div className="flex-1 flex justify-end">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{
                            width: `${pctA}%`,
                            background: `linear-gradient(90deg, ${TEAM_A_COLOR}00, ${TEAM_A_COLOR})`,
                        }}
                    />
                </div>
                <div className="w-1 bg-white/10 z-10" />
                <div className="flex-1">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                        style={{
                            width: `${pctB}%`,
                            background: `linear-gradient(90deg, ${TEAM_B_COLOR}, ${TEAM_B_COLOR}00)`,
                        }}
                    />
                </div>
            </div>
            
            {/* Winning Marker */}
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full blur-[2px] transition-all duration-1000",
                aWins ? "left-4 bg-indigo-500 shadow-[0_0_10px_indigo]" : "right-4 bg-rose-500 shadow-[0_0_10px_rose]"
            )} />
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export function TeamComparisonPanel() {
    const [selectedSport, setSelectedSport] = useState<AnalysisSport>("cricket");
    const countryTeams = useMemo(() => buildCountryTeams(selectedSport), [selectedSport]);

    const [teamACountry, setTeamACountry] = useState(countryTeams[0]?.country || "");
    const [teamBCountry, setTeamBCountry] = useState(
        countryTeams.length > 1 ? countryTeams[1].country : countryTeams[0]?.country || ""
    );

    // Reset selections when sport changes
    const handleSportChange = (sport: AnalysisSport) => {
        setSelectedSport(sport);
        const teams = buildCountryTeams(sport);
        setTeamACountry(teams[0]?.country || "");
        setTeamBCountry(teams.length > 1 ? teams[1].country : teams[0]?.country || "");
    };

    const teamA = countryTeams.find((t) => t.country === teamACountry);
    const teamB = countryTeams.find((t) => t.country === teamBCountry);
    const sportMeta = SPORT_LABELS[selectedSport];

    // ─── Chart data ──────────────────────────────────────────────
    // Radar data: union of attribute keys
    const radarData = useMemo(() => {
        if (!teamA || !teamB) return [];
        const allKeys = new Set([
            ...Object.keys(teamA.avgAttributes),
            ...Object.keys(teamB.avgAttributes),
        ]);
        return Array.from(allKeys).map((key) => ({
            attribute: key,
            teamA: teamA.avgAttributes[key] || 0,
            teamB: teamB.avgAttributes[key] || 0,
            fullMark: 100,
        }));
    }, [teamA, teamB]);

    // Bar chart: sport-specific stats
    const barData = useMemo(() => {
        if (!teamA || !teamB) return [];
        const keys = SPORT_STAT_KEYS[selectedSport];
        return keys.map((key) => {
            const valsA = teamA.players
                .map((p) => {
                    const v = p.detailedStats[key];
                    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
                });
            const valsB = teamB.players
                .map((p) => {
                    const v = p.detailedStats[key];
                    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
                });
            const avgA = valsA.length ? valsA.reduce((s, v) => s + v, 0) / valsA.length : 0;
            const avgB = valsB.length ? valsB.reduce((s, v) => s + v, 0) / valsB.length : 0;
            return {
                stat: key.length > 12 ? key.slice(0, 10) + "…" : key,
                fullKey: key,
                teamA: Math.round(avgA * 10) / 10,
                teamB: Math.round(avgB * 10) / 10,
            };
        });
    }, [teamA, teamB, selectedSport]);

    // Area chart: form trend
    const formData = useMemo(() => {
        if (!teamA || !teamB) return [];
        const len = Math.max(teamA.avgForm.length, teamB.avgForm.length);
        return Array.from({ length: len }, (_, i) => ({
            match: `M${i + 1}`,
            teamA: teamA.avgForm[i] || 0,
            teamB: teamB.avgForm[i] || 0,
        }));
    }, [teamA, teamB]);

    // Pie data: role distribution for each team
    const pieDataA = useMemo(() => {
        if (!teamA) return [];
        return Object.entries(teamA.roleDistribution).map(([name, value]) => ({
            name,
            value,
        }));
    }, [teamA]);

    const pieDataB = useMemo(() => {
        if (!teamB) return [];
        return Object.entries(teamB.roleDistribution).map(([name, value]) => ({
            name,
            value,
        }));
    }, [teamB]);

    // Head-to-head stat bars
    const h2hStats = useMemo(() => {
        if (!teamA || !teamB) return [];
        const keys = SPORT_STAT_KEYS[selectedSport];
        return keys.map((key) => {
            const valsA = teamA.players.map((p) => {
                const v = p.detailedStats[key];
                return typeof v === "number" ? v : parseFloat(String(v)) || 0;
            });
            const valsB = teamB.players.map((p) => {
                const v = p.detailedStats[key];
                return typeof v === "number" ? v : parseFloat(String(v)) || 0;
            });
            const avgA = valsA.length ? valsA.reduce((s, v) => s + v, 0) / valsA.length : 0;
            const avgB = valsB.length ? valsB.reduce((s, v) => s + v, 0) / valsB.length : 0;
            return { label: key, valA: Math.round(avgA * 10) / 10, valB: Math.round(avgB * 10) / 10 };
        });
    }, [teamA, teamB, selectedSport]);

    if (!teamA || !teamB) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ═══ Sport Selector ═══ */}
            <div className="flex flex-wrap gap-2 justify-center">
                {(Object.keys(SPORT_LABELS) as AnalysisSport[]).map((sport) => {
                    const meta = SPORT_LABELS[sport];
                    const active = sport === selectedSport;
                    return (
                        <button
                            key={sport}
                            onClick={() => handleSportChange(sport)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300",
                                "border-2",
                                active
                                    ? "text-white shadow-lg scale-105"
                                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:scale-[1.02]"
                            )}
                            style={
                                active
                                    ? {
                                        background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                                        borderColor: meta.color,
                                        boxShadow: `0 4px 20px ${meta.color}40`,
                                    }
                                    : undefined
                            }
                        >
                            <span className="text-lg">{meta.icon}</span>
                            {meta.label}
                        </button>
                    );
                })}
            </div>

            {/* ═══ Team Selection HUD ═══ */}
            <div
                className="relative rounded-[3rem] border border-white/5 p-12 overflow-visible"
                style={{
                    background: `linear-gradient(135deg, ${sportMeta.color}15, transparent)`,
                }}
            >
                <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-3xl" />
                <div className="absolute inset-0 cyber-grid opacity-10" />
                
                <div className="relative z-10 grid lg:grid-cols-[1fr,80px,1fr] gap-12 items-center">
                    <CountrySelectHUD
                        teams={countryTeams}
                        selected={teamACountry}
                        onChange={setTeamACountry}
                        accentColor={TEAM_A_COLOR}
                        side="left"
                    />
                    
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20 rounded-full bg-slate-900 border-4 border-white/10 flex items-center justify-center font-black text-2xl text-white shadow-2xl">
                            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                            <span className="relative z-10">VS</span>
                        </div>
                        <div className="h-20 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent mt-4" />
                    </div>

                    <CountrySelectHUD
                        teams={countryTeams}
                        selected={teamBCountry}
                        onChange={setTeamBCountry}
                        accentColor={TEAM_B_COLOR}
                        side="right"
                    />
                </div>

                {/* Insight Comparison Strip */}
                <div className="relative z-10 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "Avg Rating", valA: teamA.avgRating, valB: teamB.avgRating, icon: <Star size={14} /> },
                        { label: "Star Player", valA: teamA.players[0].overallRating, valB: teamB.players[0].overallRating, icon: <Zap size={14} /> },
                        { label: "Consistency", valA: Math.round(teamA.avgForm.reduce((a,b)=>a+b,0)/teamA.avgForm.length), valB: Math.round(teamB.avgForm.reduce((a,b)=>a+b,0)/teamB.avgForm.length), icon: <Activity size={14} /> },
                        { label: "Elite Potential", valA: teamA.players.filter(p=>p.overallRating > 90).length, valB: teamB.players.filter(p=>p.overallRating > 90).length, icon: <Trophy size={14} /> },
                    ].map((insight, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group/insight">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                                {insight.icon} {insight.label}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className={cn("text-xl font-black", insight.valA > insight.valB ? "text-indigo-400" : "text-white/40")}>
                                    {insight.valA}
                                </span>
                                <div className="h-[1px] flex-1 mx-4 bg-white/5 relative">
                                    <div className={cn(
                                        "absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full",
                                        insight.valA > insight.valB ? "left-0 bg-indigo-500" : "right-0 bg-rose-500"
                                    )} />
                                </div>
                                <span className={cn("text-xl font-black", insight.valB > insight.valA ? "text-rose-400" : "text-white/40")}>
                                    {insight.valB}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ Charts Grid ═══ */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* ── Radar Chart: Attribute Comparison ── */}
                <SectionCard icon={<Target size={20} />} title="Attribute Comparison">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                <PolarAngleAxis
                                    dataKey="attribute"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, 100]}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                />
                                <Radar
                                    name={teamA.country}
                                    dataKey="teamA"
                                    stroke={TEAM_A_COLOR}
                                    fill={TEAM_A_COLOR}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                                <Radar
                                    name={teamB.country}
                                    dataKey="teamB"
                                    stroke={TEAM_B_COLOR}
                                    fill={TEAM_B_COLOR}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                {/* ── Grouped Bar Chart: Key Stats ── */}
                <SectionCard icon={<Zap size={20} />} title={`${sportMeta.label} Stats Comparison`}>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                                <XAxis
                                    dataKey="stat"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Bar
                                    dataKey="teamA"
                                    name={teamA.country}
                                    fill={TEAM_A_COLOR}
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="teamB"
                                    name={teamB.country}
                                    fill={TEAM_B_COLOR}
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                {/* ── Area Chart: Form Trend ── */}
                <SectionCard icon={<TrendingUp size={20} />} title="Form Trend Comparison">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                                <defs>
                                    <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TEAM_A_COLOR} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={TEAM_A_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TEAM_B_COLOR} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={TEAM_B_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                                <XAxis dataKey="match" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                <YAxis domain={[50, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Area
                                    type="monotone"
                                    dataKey="teamA"
                                    name={teamA.country}
                                    stroke={TEAM_A_COLOR}
                                    fill="url(#gradA)"
                                    strokeWidth={2.5}
                                    dot={{ fill: TEAM_A_COLOR, r: 3 }}
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="teamB"
                                    name={teamB.country}
                                    stroke={TEAM_B_COLOR}
                                    fill="url(#gradB)"
                                    strokeWidth={2.5}
                                    dot={{ fill: TEAM_B_COLOR, r: 3 }}
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                {/* ── Donut Charts: Role Distribution ── */}
                <SectionCard icon={<Users size={20} />} title="Role Distribution">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Team A pie */}
                        <div className="text-center">
                            <p className="text-sm font-medium text-indigo-400 mb-2 flex items-center justify-center gap-2">
                                <TeamFlag country={teamA.country} size={24} /> {teamA.country}
                            </p>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieDataA}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieDataA.map((_entry, i) => (
                                                <Cell key={`a-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                                {pieDataA.map((d, i) => (
                                    <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span
                                            className="w-2 h-2 rounded-full inline-block"
                                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                        />
                                        {d.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {/* Team B pie */}
                        <div className="text-center">
                            <p className="text-sm font-medium text-rose-400 mb-2 flex items-center justify-center gap-2">
                                <TeamFlag country={teamB.country} size={24} /> {teamB.country}
                            </p>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieDataB}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieDataB.map((_entry, i) => (
                                                <Cell key={`b-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                                {pieDataB.map((d, i) => (
                                    <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span
                                            className="w-2 h-2 rounded-full inline-block"
                                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                        />
                                        {d.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ═══ Head-to-Head Stat Breakdown ═══ */}
            <SectionCard icon={<Shield size={20} />} title="Tactical Attribute Breakdown" gradient>
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                    {h2hStats.map((stat, i) => (
                        <div key={stat.label} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                            <StatComparisonSegment
                                label={stat.label}
                                valA={stat.valA}
                                valB={stat.valB}
                                maxVal={Math.max(stat.valA, stat.valB) * 1.1 || 1}
                            />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* ═══ Star Player Contrast ═══ */}
            <div className="grid md:grid-cols-2 gap-8">
                {[teamA, teamB].map((team, idx) => {
                    const star = team?.players[0];
                    if (!star) return null;
                    const isTeamA = idx === 0;

                    return (
                        <div 
                            key={team.country}
                            className={cn(
                                "group/star relative overflow-hidden rounded-[2.5rem] border border-white/5 p-8 transition-all duration-700 hover:scale-[1.02]",
                                isTeamA ? "bg-indigo-500/5 hover:border-indigo-500/30" : "bg-rose-500/5 hover:border-rose-500/30"
                            )}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/star:opacity-20 transition-opacity">
                                <Trophy size={120} className={isTeamA ? "text-indigo-400" : "text-rose-400"} />
                            </div>

                            <div className={cn("relative flex items-center gap-8", !isTeamA && "flex-row-reverse")}>
                                {/* Player Image/Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-32 h-32 rounded-[2rem] bg-slate-900 border-2 border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden">
                                        {star.photo ? (
                                            <img src={star.photo} alt={star.name} className="w-full h-full object-cover" />
                                        ) : star.image}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                    </div>
                                    <div className={cn(
                                        "absolute -bottom-2 right-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-xl border-2 border-[#020617]",
                                        isTeamA ? "bg-indigo-500" : "bg-rose-500"
                                    )}>
                                        {star.overallRating}
                                    </div>
                                </div>

                                {/* Player Info */}
                                <div className={cn(!isTeamA && "text-right")}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Primary Asset</p>
                                    <h4 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                                        {star.name}
                                    </h4>
                                    <p className="text-sm font-bold text-slate-400 mb-4">{star.role} • {star.country}</p>
                                    <div className={cn("flex gap-2", !isTeamA && "justify-end")}>
                                        {Object.entries(star.attributes).slice(0, 3).map(([k, v]) => (
                                            <div key={k} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-300 uppercase">
                                                {k}: {v}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ Dominance Index ═══ */}
            <SectionCard icon={<Activity size={20} />} title="Tactics Dominance Index" gradient>
                <div className="relative h-24 bg-[#020617]/40 rounded-[2rem] border border-white/5 p-4 flex items-center overflow-hidden">
                    <div className="absolute inset-0 cyber-grid opacity-5" />
                    
                    {/* Meter Labels */}
                    <div className="absolute inset-x-8 top-2 flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{teamA?.country} Control</span>
                        <span>Equilibrium</span>
                        <span>{teamB?.country} Control</span>
                    </div>

                    <div className="relative flex-1 h-3 bg-slate-900 rounded-full overflow-hidden flex">
                        <div 
                            className="h-full transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                            style={{ 
                                width: `${(teamA?.avgRating || 0) / ((teamA?.avgRating || 0) + (teamB?.avgRating || 0)) * 100}%`,
                                background: `linear-gradient(90deg, ${TEAM_A_COLOR}, #3b82f6)`
                            }}
                        />
                        <div 
                            className="h-full transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                            style={{ 
                                width: `${(teamB?.avgRating || 0) / ((teamA?.avgRating || 0) + (teamB?.avgRating || 0)) * 100}%`,
                                background: `linear-gradient(90deg, #f43f5e, ${TEAM_B_COLOR})`
                            }}
                        />
                        
                        {/* Cursor Pulse */}
                        <div 
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_white] transition-all duration-1000"
                            style={{ 
                                left: `${(teamA?.avgRating || 0) / ((teamA?.avgRating || 0) + (teamB?.avgRating || 0)) * 100}%`
                            }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* ═══ Player Rosters ═══ */}
            <div className="grid md:grid-cols-2 gap-6">
                {[
                    { team: teamA, color: TEAM_A_COLOR, lightColor: TEAM_A_LIGHT },
                    { team: teamB, color: TEAM_B_COLOR, lightColor: TEAM_B_LIGHT },
                ].map(({ team, color, lightColor }) => (
                    <div
                        key={team.country}
                        className="rounded-2xl border border-border/50 overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${color}08, transparent)`,
                        }}
                    >
                        <div
                            className="px-6 py-4 flex items-center gap-3"
                            style={{
                                background: `linear-gradient(90deg, ${color}15, transparent)`,
                                borderBottom: `1px solid ${color}20`,
                            }}
                        >
                            <span className="text-2xl">{team.flag}</span>
                            <div>
                                <h4 className="font-semibold text-foreground">{team.country}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {team.players.length} players • Avg Rating: {team.avgRating}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Trophy size={18} style={{ color }} />
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {team.players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${color}, ${lightColor})`,
                                        }}
                                    >
                                        {player.image}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">{player.name}</p>
                                        <p className="text-xs text-muted-foreground">{player.role}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div
                                            className="text-sm font-bold"
                                            style={{ color }}
                                        >
                                            {player.overallRating}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">RATING</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TeamComparisonPanel;
