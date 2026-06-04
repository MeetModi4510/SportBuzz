import { useState, useMemo, useEffect } from "react";
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
    Search,
    X,
    Swords,
    BarChart3
} from "lucide-react";

// ─── Colors ──────────────────────────────────────────────────────
const PLAYER_A_COLOR = "#6366f1"; // indigo
const PLAYER_B_COLOR = "#f43f5e"; // rose

const TOOLTIP_STYLE = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const COUNTRY_CODE_MAP: Record<string, string> = {
    'India': 'in',
    'Australia': 'au',
    'England': 'gb',
    'South Africa': 'za',
    'New Zealand': 'nz',
    'Pakistan': 'pk',
    'Sri Lanka': 'lk',
    'Bangladesh': 'bd',
    'West Indies': 'wi',
    'Afghanistan': 'af',
    'France': 'fr',
    'Norway': 'no',
    'Argentina': 'ar',
    'Brazil': 'br',
    'Portugal': 'pt',
    'Belgium': 'be',
    'Netherlands': 'nl',
    'Spain': 'es',
    'Nigeria': 'ng',
    'Morocco': 'ma',
    'Germany': 'de',
    'Croatia': 'hr',
    'Uruguay': 'uy',
    'USA': 'us',
    'Serbia': 'rs',
    'Slovenia': 'si',
    'Cameroon': 'cm',
    'Canada': 'ca',
    'Italy': 'it',
    'Poland': 'pl',
    'Belarus': 'by',
    'Greece': 'gr'
};

const getFlagUrl = (countryName: string) => {
    const code = COUNTRY_CODE_MAP[countryName];
    if (!code) return null;
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

// ─── Components ──────────────────────────────────────────────────
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
                "relative overflow-visible rounded-[2rem] border border-white/5 bg-[#0a0f1e]/60 backdrop-blur-xl p-8",
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

// ─── Player Selector HUD ────────────────────────────────────────
function PlayerSelectorHUD({
    players,
    selectedId,
    onChange,
    accentColor,
    side,
}: {
    players: AnalysisPlayer[];
    selectedId: string;
    onChange: (id: string) => void;
    accentColor: string;
    side: "left" | "right";
}) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    const current = players.find((p) => p.id === selectedId);

    const uniqueCountries = useMemo(() => {
        const countries = new Map<string, string>();
        players.forEach(p => {
            if (p.country && p.countryFlag) {
                countries.set(p.country, p.countryFlag);
            }
        });
        return Array.from(countries.entries()).map(([name, flag]) => ({ name, flag }));
    }, [players]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCountry = !selectedCountry || p.country === selectedCountry;
            return matchesSearch && matchesCountry;
        });
    }, [players, searchQuery, selectedCountry]);

    return (
        <div className={cn("relative group/hud", open ? "z-[150]" : "z-10")}>
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative w-full overflow-visible transition-all duration-500",
                    "rounded-[2.5rem] border-2 bg-[#020617]/40 backdrop-blur-xl group-hover/hud:translate-y-[-4px]",
                    open ? "border-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-white/5"
                )}
                style={{ borderColor: open ? accentColor : undefined }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-20 pointer-events-none" />
                
                <div className={cn(
                    "flex items-center gap-6 p-6",
                    side === "right" && "flex-row-reverse"
                )}>
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group-hover/hud:scale-105 transition-transform">
                            {current?.photo ? (
                                <img src={current.photo} alt={current.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-white">{current?.name.charAt(0)}</span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
                        </div>
                        <div className="absolute -inset-2 rounded-[2.5rem] border border-white/5 animate-[spin_10s_linear_infinite]" />
                    </div>

                    <div className={cn("flex-1 min-w-0", side === "right" ? "text-right" : "text-left")}>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase mb-1 truncate">
                            {current?.name}
                        </h4>
                        <div className={cn("flex items-center gap-3", side === "right" && "flex-row-reverse")}>
                            {getFlagUrl(current?.country || "") ? (
                                <img src={getFlagUrl(current?.country || "")!} alt={current?.country} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                            ) : (
                                <span className="text-xl shrink-0">{current?.countryFlag}</span>
                            )}
                            <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                RTG {current?.overallRating}
                            </span>
                        </div>
                    </div>
                    
                    <ChevronDown size={24} className={cn("text-slate-500 transition-transform duration-500", open && "rotate-180")} />
                </div>
            </button>

            {open && (
                <div className={cn(
                    "absolute z-[200] mt-4 w-[120%] max-h-[400px] overflow-y-auto scrollbar-thin p-4",
                    "bg-[#0a0f1e]/95 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-500",
                    side === "right" ? "right-0" : "left-0"
                )}>
                    <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none rounded-[2rem]" />
                    
                    <div className="relative z-10 flex flex-col gap-4 mb-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search athlete..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Country Filter Bar */}
                        <div className="flex gap-2 p-1 overflow-x-auto scrollbar-none bg-slate-950/30 rounded-xl border border-white/5">
                            <button
                                onClick={() => setSelectedCountry(null)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                    !selectedCountry ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                All
                            </button>
                            {uniqueCountries.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setSelectedCountry(c.name)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border",
                                        selectedCountry === c.name 
                                            ? "bg-white/10 border-white/20 text-white shadow-xl" 
                                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {getFlagUrl(c.name) ? (
                                        <img src={getFlagUrl(c.name)!} alt={c.name} className="w-4 h-3 object-cover rounded-sm" />
                                    ) : (
                                        <span>{c.flag}</span>
                                    )}
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 relative z-10">
                        {filteredPlayers.length > 0 ? filteredPlayers.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    onChange(p.id);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "relative flex items-center gap-4 p-4 rounded-2xl transition-all group/item",
                                    p.id === selectedId ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-white/10">
                                    {p.photo ? (
                                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{p.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="font-black text-white text-sm block uppercase tracking-tight truncate">{p.name}</span>
                                    <div className="flex items-center gap-2">
                                        {getFlagUrl(p.country) ? (
                                            <img src={getFlagUrl(p.country)!} alt={p.country} className="w-4 h-3 object-cover rounded-sm" />
                                        ) : (
                                            <span className="text-lg">{p.countryFlag}</span>
                                        )}
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rating: {p.overallRating}</span>
                                    </div>
                                </div>
                                {p.id === selectedId && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#3b82f6]" />}
                            </button>
                        )) : (
                            <div className="py-8 text-center bg-slate-950/20 rounded-2xl border border-dashed border-white/5">
                                <Search className="mx-auto text-slate-800 mb-2" size={24} />
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No athletes found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────
export const PlayerComparison = () => {
    const [selectedSport, setSelectedSport] = useState<AnalysisSport>("cricket");
    const [playerAId, setPlayerAId] = useState<string>("");
    const [playerBId, setPlayerBId] = useState<string>("");

    const sportPlayers = useMemo(() => 
        ANALYSIS_PLAYERS[selectedSport] || [],
    [selectedSport]);

    // Initial player selection when sport changes
    useEffect(() => {
        if (sportPlayers.length >= 2) {
            setPlayerAId(sportPlayers[0].id);
            setPlayerBId(sportPlayers[1].id);
        }
    }, [selectedSport, sportPlayers]);

    const playerA = sportPlayers.find(p => p.id === playerAId) || sportPlayers[0];
    const playerB = sportPlayers.find(p => p.id === playerBId) || sportPlayers[1];

    if (!playerA || !playerB) return null;

    // ─── Chart Data ──────────────────────────────────────────────
    const radarData = Object.keys(playerA.attributes).map(key => ({
        attribute: key,
        A: playerA.attributes[key],
        B: playerB.attributes[key],
        fullMark: 100,
    }));

    const formData = playerA.formTrend.map((val, i) => ({
        match: `M${i + 1}`,
        A: val,
        B: playerB.formTrend[i] || 0,
    }));

    const statComparison = Object.keys(playerA.detailedStats).map(key => ({
        label: key,
        valA: playerA.detailedStats[key],
        valB: playerB.detailedStats[key],
    }));

    return (
        <div className="space-y-8 animate-fade-in overflow-visible pb-20">
            {/* ═══ Sport Selector ═══ */}
            <div className="flex flex-wrap gap-3 justify-center mb-12">
                {(Object.keys(SPORT_LABELS) as AnalysisSport[]).map((sport) => {
                    const meta = SPORT_LABELS[sport];
                    const active = sport === selectedSport;
                    return (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-500",
                                "border-2 uppercase tracking-tighter",
                                active
                                    ? "text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] scale-105"
                                    : "border-white/5 bg-slate-900/40 text-slate-500 hover:bg-slate-900/60 hover:border-white/10 hover:translate-y-[-2px]"
                            )}
                            style={active ? {
                                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)`,
                                borderColor: meta.color,
                                boxShadow: `0 0 20px ${meta.color}30`
                            } : undefined}
                        >
                            <span className="text-xl">{meta.icon}</span>
                            {meta.label}
                        </button>
                    );
                })}
            </div>

            {/* ═══ Player Selection HUD ═══ */}
            <div className="relative z-50 rounded-[4rem] border border-white/5 p-12 overflow-visible bg-[#020617]/40 backdrop-blur-3xl shadow-2xl">
                <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none rounded-[4rem]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-primary rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    Elite Matchup Analysis
                </div>

                <div className="relative grid lg:grid-cols-[1fr,100px,1fr] gap-12 items-center">
                    <PlayerSelectorHUD
                        players={sportPlayers}
                        selectedId={playerAId}
                        onChange={setPlayerAId}
                        accentColor={PLAYER_A_COLOR}
                        side="left"
                    />

                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-white/10 flex items-center justify-center font-black text-3xl text-white shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                            <span className="relative z-10 group-hover:scale-110 transition-transform duration-500">VS</span>
                        </div>
                        <div className="h-24 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent mt-4" />
                    </div>

                    <PlayerSelectorHUD
                        players={sportPlayers}
                        selectedId={playerBId}
                        onChange={setPlayerBId}
                        accentColor={PLAYER_B_COLOR}
                        side="right"
                    />
                </div>

                {/* Quick Insight Strip */}
                <div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "Overall Rating", valA: playerA.overallRating, valB: playerB.overallRating, icon: <Trophy size={14} /> },
                        { label: "Recent Form", valA: Math.round(playerA.formTrend.reduce((a,b)=>a+b,0)/playerA.formTrend.length), valB: Math.round(playerB.formTrend.reduce((a,b)=>a+b,0)/playerB.formTrend.length), icon: <Activity size={14} /> },
                        { label: "Clutch Peak", valA: playerA.attributes["Clutch"] || 85, valB: playerB.attributes["Clutch"] || 82, icon: <Zap size={14} /> },
                        { label: "Win Probability", valA: playerA.overallRating > playerB.overallRating ? "54%" : "46%", valB: playerB.overallRating > playerA.overallRating ? "54%" : "46%", icon: <TrendingUp size={14} /> },
                    ].map((insight, i) => (
                        <div key={i} className="bg-[#0a0f1e]/60 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group/insight shadow-xl">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                                {insight.icon} {insight.label}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className={cn("text-xl font-black", insight.valA > insight.valB ? "text-indigo-400" : "text-white/40")}>
                                    {insight.valA}
                                </span>
                                <div className="h-[2px] flex-1 mx-4 bg-white/5 relative overflow-hidden rounded-full">
                                    <div className={cn(
                                        "absolute inset-y-0 w-1/2 rounded-full",
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

            {/* ═══ Stats & Analytics Grid ═══ */}
            <div className="relative z-10 grid lg:grid-cols-2 gap-8">
                {/* Radar: Attribute Comparison */}
                <SectionCard icon={<Target size={24} />} title="Technical Attribute Radar" gradient>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis
                                    dataKey="attribute"
                                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 900 }}
                                />
                                <Radar
                                    name={playerA.name}
                                    dataKey="A"
                                    stroke={PLAYER_A_COLOR}
                                    fill={PLAYER_A_COLOR}
                                    fillOpacity={0.2}
                                    strokeWidth={3}
                                />
                                <Radar
                                    name={playerB.name}
                                    dataKey="B"
                                    stroke={PLAYER_B_COLOR}
                                    fill={PLAYER_B_COLOR}
                                    fillOpacity={0.2}
                                    strokeWidth={3}
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 900, fontSize: '12px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                {/* Area Chart: Performance Trend */}
                <SectionCard icon={<Activity size={24} />} title="Form Trend Analysis">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={PLAYER_A_COLOR} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={PLAYER_A_COLOR} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={PLAYER_B_COLOR} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={PLAYER_B_COLOR} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="match" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[50, 100]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Area
                                    type="monotone"
                                    dataKey="A"
                                    stroke={PLAYER_A_COLOR}
                                    fillOpacity={1}
                                    fill="url(#colorA)"
                                    strokeWidth={4}
                                    name={playerA.name}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="B"
                                    stroke={PLAYER_B_COLOR}
                                    fillOpacity={1}
                                    fill="url(#colorB)"
                                    strokeWidth={4}
                                    name={playerB.name}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 900, fontSize: '12px' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>
            </div>

            {/* ═══ Detailed Breakdown ═══ */}
            <SectionCard icon={<BarChart3 size={24} />} title="Complete Statistical Breakdown">
                <div className="space-y-6">
                    {/* Recent Result Indicator */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 py-8 border-b border-white/5">
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{playerA.name} Recent Form</span>
                            <FormIndicator form={playerA.formTrend} />
                        </div>
                        <div className="text-center">
                            <Swords size={32} className="text-primary opacity-20 mx-auto mb-4" />
                            <p className="text-sm font-black text-white uppercase tracking-widest italic">Face-Off Metrics</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Form {playerB.name}</span>
                            <FormIndicator form={playerB.formTrend} />
                        </div>
                    </div>

                    {/* Stat Rows */}
                    <div className="space-y-4 pt-4">
                        {statComparison.map((stat, i) => {
                            const valA = typeof stat.valA === 'number' ? stat.valA : parseFloat(String(stat.valA)) || 0;
                            const valB = typeof stat.valB === 'number' ? stat.valB : parseFloat(String(stat.valB)) || 0;
                            const total = valA + valB || 1;
                            const pctA = (valA / total) * 100;

                            return (
                                <div key={i} className="group/stat">
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <div className="flex flex-col">
                                            <span className={cn("text-lg font-black", valA > valB ? "text-indigo-400" : "text-white/40")}>{stat.valA}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/stat:text-white transition-colors uppercase">{stat.label}</span>
                                        <div className="flex flex-col items-end">
                                            <span className={cn("text-lg font-black", valB > valA ? "text-rose-400" : "text-white/40")}>{stat.valB}</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                                        <div 
                                            className="h-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${pctA}%`, background: `linear-gradient(90deg, #4f46e5, ${PLAYER_A_COLOR})` }}
                                        />
                                        <div 
                                            className="h-full transition-all duration-1000 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                            style={{ width: `${100 - pctA}%`, background: `linear-gradient(90deg, ${PLAYER_B_COLOR}, #e11d48)` }}
                                        />
                                        <div className="absolute top-0 bottom-0 w-1 bg-white/40 left-1/2 -translate-x-1/2 z-10" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};
