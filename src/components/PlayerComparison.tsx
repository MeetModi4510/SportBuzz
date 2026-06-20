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
    BarChart3,
    Loader2
} from "lucide-react";

import { usePlayerBattingStats } from '@/hooks/usePlayerBattingStats';
import { usePerformanceLabPlayerStats, usePerformanceLabSquad, usePerformanceLabSquads } from '@/hooks/usePerformanceLab';
import { getCricbuzzPlayerId } from '@/data/cricbuzzPlayerIds';
import type { BattingFormatKey } from '@/types/playerBattingTypes';
import { FORMAT_COLORS, FORMAT_LABELS } from '@/utils/playerStatsTransformer';

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
    'England': 'gb-eng',
    'South Africa': 'za',
    'New Zealand': 'nz',
    'Pakistan': 'pk',
    'Sri Lanka': 'lk',
    'Bangladesh': 'bd',
    'West Indies': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'Afghanistan': 'af',
    'Zimbabwe': 'zw',
    'Ireland': 'ie',
    'Scotland': 'gb-sct',
    'Nepal': 'np',
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
    if (code.startsWith('http')) return code;
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
                    "relative w-full overflow-hidden transition-all duration-300",
                    "rounded-3xl border bg-white/[0.01] backdrop-blur-md group-hover/hud:bg-white/[0.03]",
                    open ? "border-white/20 shadow-lg" : "border-white/[0.05]"
                )}
                style={{ 
                    boxShadow: open ? `0 0 30px ${accentColor}15` : undefined,
                    borderColor: open ? `${accentColor}50` : undefined
                }}
            >
                <div className={cn(
                    "flex items-center gap-5 p-4 md:p-5",
                    side === "right" && "flex-row-reverse"
                )}>
                    {/* Minimalist Image Avatar */}
                    <div className="relative shrink-0">
                        <div className={cn(
                            "w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900 flex items-center justify-center shadow-inner relative overflow-hidden transition-transform duration-500",
                            "ring-2 ring-white/5 group-hover/hud:ring-white/10"
                        )}>
                            {current?.photo ? (
                                <img src={current.photo} alt={current.name} className="w-full h-full object-cover scale-[1.02] group-hover/hud:scale-110 transition-transform duration-500 ease-out" />
                            ) : (
                                <span className="text-2xl font-bold text-white/50">{current?.name.charAt(0)}</span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover/hud:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {/* Typography & Badges */}
                    <div className={cn("flex-1 min-w-0", side === "right" ? "text-right" : "text-left")}>
                        <h4 className="text-lg md:text-xl font-bold text-white/90 uppercase tracking-wide mb-1.5 truncate">
                            {current?.name || "Select Player"}
                        </h4>
                        <div className={cn("flex items-center gap-2.5 opacity-80", side === "right" && "flex-row-reverse")}>
                            {getFlagUrl(current?.country || "") ? (
                                <img src={getFlagUrl(current?.country || "")!} alt={current?.country} className="w-5 h-3.5 object-cover rounded-[2px]" />
                            ) : current?.countryFlag ? (
                                <span className="text-sm shrink-0">{current.countryFlag}</span>
                            ) : null}
                            
                            {current?.overallRating && (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    RTG {current.overallRating}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <ChevronDown size={20} className={cn("text-slate-500 transition-transform duration-300", open && "rotate-180")} />
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

    const CRICKET_TEAMS = useMemo(() => [
        'india-2', 'australia-4', 'england-9', 'south-africa-11', 'new-zealand-13', 'pakistan-3',
        'sri-lanka-5', 'west-indies-10', 'bangladesh-6', 'afghanistan-96', 'zimbabwe-12', 'ireland-27',
        'scotland-23', 'netherlands-24', 'nepal-72'
    ], []);
    const squadQueries = usePerformanceLabSquads(selectedSport === 'cricket' ? CRICKET_TEAMS : []);
    const [squadFilters, setSquadFilters] = useState<string[]>([]);
    
    const toggleSquadFilter = (teamId: string) => {
        setSquadFilters(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    };

    const sportPlayers = useMemo(() => {
        if (selectedSport === 'cricket' && squadQueries.some(q => q.data?.players)) {
            const players: any[] = [];
            squadQueries.forEach((query, index) => {
                if (!query.data?.players) return;
                const teamId = CRICKET_TEAMS[index];
                if (squadFilters.length > 0 && !squadFilters.includes(teamId)) return;
                
                const TEAM_META: Record<string, {name: string, iso: string}> = {
                    'india-2': {name: 'India', iso: 'in'},
                    'australia-4': {name: 'Australia', iso: 'au'},
                    'england-9': {name: 'England', iso: 'gb-eng'},
                    'south-africa-11': {name: 'South Africa', iso: 'za'},
                    'new-zealand-13': {name: 'New Zealand', iso: 'nz'},
                    'pakistan-3': {name: 'Pakistan', iso: 'pk'},
                    'sri-lanka-5': {name: 'Sri Lanka', iso: 'lk'},
                    'west-indies-10': {name: 'West Indies', iso: 'wi'},
                    'bangladesh-6': {name: 'Bangladesh', iso: 'bd'},
                    'afghanistan-96': {name: 'Afghanistan', iso: 'af'},
                    'zimbabwe-12': {name: 'Zimbabwe', iso: 'zw'},
                    'ireland-27': {name: 'Ireland', iso: 'ie'},
                    'scotland-23': {name: 'Scotland', iso: 'gb-sct'},
                    'netherlands-24': {name: 'Netherlands', iso: 'nl'},
                    'nepal-72': {name: 'Nepal', iso: 'np'}
                };
                const meta = TEAM_META[teamId] || {name: teamId, iso: 'un'};

                query.data.players.forEach((p: any) => {
                    players.push({
                        id: p.espnId || p.id,
                        name: p.name,
                        country: meta.name,
                        countryFlag: meta.iso,
                        role: p.role || 'Player',
                        photo: p.imageUrl,
                        overallRating: 85,
                        attributes: {},
                        formTrend: [],
                        detailedStats: {}
                    });
                });
            });
            return players;
        }
        return ANALYSIS_PLAYERS[selectedSport] || [];
    }, [selectedSport, squadQueries, squadFilters]);

    const playerA = sportPlayers.find(p => p.id === playerAId || String(p.id) === String(playerAId)) || null;
    const playerB = sportPlayers.find(p => p.id === playerBId || String(p.id) === String(playerBId)) || null;

    const [apiFormat, setApiFormat] = useState<BattingFormatKey>('all');
    const [statCategory, setStatCategory] = useState<'batting'|'bowling'>('batting');

    const { battingStats: statsA, isLoading: loadingA } = usePlayerBattingStats(playerA?.id || "");
    const { battingStats: statsB, isLoading: loadingB } = usePlayerBattingStats(playerB?.id || "");

    const cricbuzzIdA = playerA ? (/^\d+$/.test(String(playerA.id).trim()) ? String(playerA.id).trim() : getCricbuzzPlayerId(playerA.id)?.toString()) || null : null;
    const cricbuzzIdB = playerB ? (/^\d+$/.test(String(playerB.id).trim()) ? String(playerB.id).trim() : getCricbuzzPlayerId(playerB.id)?.toString()) || null : null;

    const { data: deepStatsA, isLoading: loadingDeepA } = usePerformanceLabPlayerStats(cricbuzzIdA, playerA?.name || "");
    const { data: deepStatsB, isLoading: loadingDeepB } = usePerformanceLabPlayerStats(cricbuzzIdB, playerB?.name || "");

    const formatA = selectedSport === 'cricket' && statsA ? statsA[apiFormat] : null;
    const formatB = selectedSport === 'cricket' && statsB ? statsB[apiFormat] : null;

    // ─── Chart Data ──────────────────────────────────────────────
    const radarData = useMemo(() => {
        if (selectedSport !== 'cricket' || (!deepStatsA?.stats && !deepStatsB?.stats)) {
            return playerA && playerB ? Object.keys(playerA.attributes || {}).map(key => ({
                attribute: key,
                A: playerA.attributes[key],
                B: playerB.attributes[key],
                fullMark: 100,
            })) : [];
        }

        const getA = (key: any) => deepStatsA?.stats?.batting?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;
        const getB = (key: any) => deepStatsB?.stats?.batting?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;

        const calcPower = (sr: number) => Math.min(Math.round((sr / 200) * 100), 100);
        const calcConsistency = (avg: number) => Math.min(Math.round((avg / 60) * 100), 100);
        const calcTechnique = (avg: number, sr: number) => Math.min(Math.round(((avg * sr) / 8000) * 100), 100);
        const calcClutch = (hundreds: number) => Math.min(Math.round((hundreds / 40) * 100), 100);
        const calcImpact = (sixes: number) => Math.min(Math.round((sixes / 200) * 100), 100);

        return [
            { attribute: 'Power', A: calcPower(getA('strikeRate')), B: calcPower(getB('strikeRate')), fullMark: 100 },
            { attribute: 'Consistency', A: calcConsistency(getA('average')), B: calcConsistency(getB('average')), fullMark: 100 },
            { attribute: 'Technique', A: calcTechnique(getA('average'), getA('strikeRate')), B: calcTechnique(getB('average'), getB('strikeRate')), fullMark: 100 },
            { attribute: 'Clutch', A: calcClutch(getA('hundreds')), B: calcClutch(getB('hundreds')), fullMark: 100 },
            { attribute: 'Impact', A: calcImpact(getA('sixes')), B: calcImpact(getB('sixes')), fullMark: 100 },
        ];
    }, [selectedSport, deepStatsA, deepStatsB, apiFormat, playerA, playerB]);

    const recentMatchesA = statCategory === 'batting' ? (deepStatsA?.recentMatches?.batting || []) : (deepStatsA?.recentMatches?.bowling || []);
    const recentMatchesB = statCategory === 'batting' ? (deepStatsB?.recentMatches?.batting || []) : (deepStatsB?.recentMatches?.bowling || []);

    const getStatSafe = (recentArr: any[], fallbackArr: number[], i: number) => {
        if (!recentArr || recentArr.length === 0) return fallbackArr ? (fallbackArr[i] || 0) : 0;
        const match = recentArr[i];
        if (!match) return 0;
        const val = match.runs;
        const r = typeof val === 'number' ? val : parseInt(val);
        return isNaN(r) ? 0 : r;
    };

    const formData = Array.from({ length: 10 }).map((_, i) => {
        return {
            match: `M${i + 1}`,
            A: getStatSafe(recentMatchesA, playerA?.formTrend || [], i),
            B: getStatSafe(recentMatchesB, playerB?.formTrend || [], i),
        };
    });

    const statComparison = useMemo(() => {
        if (selectedSport === 'cricket' && (deepStatsA?.stats || deepStatsB?.stats)) {
            const getA = (key: any) => deepStatsA?.stats?.[statCategory]?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;
            const getB = (key: any) => deepStatsB?.stats?.[statCategory]?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;
            
            if (statCategory === 'batting') {
                return [
                    { label: 'Matches', valA: getA('matches'), valB: getB('matches') },
                    { label: 'Innings', valA: getA('innings'), valB: getB('innings') },
                    { label: 'Runs', valA: getA('runs'), valB: getB('runs') },
                    { label: 'Highest', valA: getA('highestScore'), valB: getB('highestScore') },
                    { label: 'Average', valA: getA('average'), valB: getB('average') },
                    { label: 'Strike Rate', valA: getA('strikeRate'), valB: getB('strikeRate') },
                    { label: '100s', valA: getA('hundreds'), valB: getB('hundreds') },
                    { label: '50s', valA: getA('fifties'), valB: getB('fifties') },
                    { label: '4s', valA: getA('fours'), valB: getB('fours') },
                    { label: '6s', valA: getA('sixes'), valB: getB('sixes') },
                ];
            } else {
                return [
                    { label: 'Matches', valA: getA('matches'), valB: getB('matches') },
                    { label: 'Innings', valA: getA('innings'), valB: getB('innings') },
                    { label: 'Wickets', valA: getA('wickets'), valB: getB('wickets') },
                    { label: 'BBI', valA: getA('bbi'), valB: getB('bbi'), isString: true },
                    { label: 'Average', valA: getA('average'), valB: getB('average'), lowerIsBetter: true },
                    { label: 'Economy', valA: getA('economy'), valB: getB('economy'), lowerIsBetter: true },
                    { label: 'Strike Rate', valA: getA('strikeRate'), valB: getB('strikeRate'), lowerIsBetter: true },
                    { label: '4W', valA: getA('fourWickets'), valB: getB('fourWickets') },
                    { label: '5W', valA: getA('fiveWickets'), valB: getB('fiveWickets') },
                    { label: 'Maidens', valA: getA('maidens'), valB: getB('maidens') },
                ];
            }
        }

        if (playerA && playerB) {
            return Object.keys(playerA.detailedStats || {}).map(key => ({
                label: key,
                valA: playerA.detailedStats[key] || 0,
                valB: playerB.detailedStats[key] || 0,
            }));
        }
        
        return [];
    }, [selectedSport, deepStatsA, deepStatsB, apiFormat, statCategory, playerA, playerB]);

    const insightsData = useMemo(() => {
        if (selectedSport === 'cricket' && (deepStatsA?.stats || deepStatsB?.stats)) {
            const getA = (key: any) => deepStatsA?.stats?.batting?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;
            const getB = (key: any) => deepStatsB?.stats?.batting?.[apiFormat === 't20' ? 't20i' : apiFormat]?.[key] || 0;
            
            const calcOvr = (avg: number, sr: number) => Math.min(Math.round(((avg * sr) / 6000) * 100), 99);
            const ovrA = calcOvr(getA('average'), getA('strikeRate'));
            const ovrB = calcOvr(getB('average'), getB('strikeRate'));

            const isBowling = statCategory === 'bowling';
            const recentA = isBowling ? (deepStatsA?.recentMatches?.bowling || []) : (deepStatsA?.recentMatches?.batting || []);
            const recentB = isBowling ? (deepStatsB?.recentMatches?.bowling || []) : (deepStatsB?.recentMatches?.batting || []);
            
            const formA = recentA.length > 0 ? Math.round(recentA.slice(0,5).reduce((acc: number, m: any) => acc + (parseInt(m.runs) || 0), 0) / Math.min(recentA.length, 5)) : 0;
            const formB = recentB.length > 0 ? Math.round(recentB.slice(0,5).reduce((acc: number, m: any) => acc + (parseInt(m.runs) || 0), 0) / Math.min(recentB.length, 5)) : 0;
            
            const clutchA = Math.min(Math.round((getA('hundreds') / 40) * 100), 99);
            const clutchB = Math.min(Math.round((getB('hundreds') / 40) * 100), 99);

            const total = (ovrA + ovrB) || 1;
            const winA = Math.round((ovrA / total) * 100);
            
            return [
                { label: "Overall Rating", valA: ovrA, valB: ovrB, icon: <Trophy size={14} /> },
                { label: `Recent Form (${isBowling ? 'Wickets' : 'Runs'})`, valA: formA, valB: formB, icon: <Activity size={14} /> },
                { label: "Clutch Peak", valA: clutchA, valB: clutchB, icon: <Zap size={14} /> },
                { label: "Win Probability", valA: `${winA}%`, valB: `${100 - winA}%`, icon: <TrendingUp size={14} /> },
            ];
        }

        const ovrA = playerA?.overallRating || 80;
        const ovrB = playerB?.overallRating || 80;
        const winA = Math.round((ovrA / ((ovrA + ovrB) || 1)) * 100);

        return [
            { label: "Overall Rating", valA: ovrA, valB: ovrB, icon: <Trophy size={14} /> },
            { label: "Recent Form", valA: playerA?.formTrend ? Math.round(playerA.formTrend.reduce((a,b)=>a+b,0)/playerA.formTrend.length) : 0, valB: playerB?.formTrend ? Math.round(playerB.formTrend.reduce((a,b)=>a+b,0)/playerB.formTrend.length) : 0, icon: <Activity size={14} /> },
            { label: "Clutch Peak", valA: playerA?.attributes?.["Clutch"] || 85, valB: playerB?.attributes?.["Clutch"] || 82, icon: <Zap size={14} /> },
            { label: "Win Probability", valA: `${winA}%`, valB: `${100 - winA}%`, icon: <TrendingUp size={14} /> },
        ];
    }, [selectedSport, deepStatsA, deepStatsB, apiFormat, statCategory, playerA, playerB]);

    return (
        <div className="space-y-8 animate-fade-in overflow-visible pb-20">
            {/* ═══ Player Selection HUD ═══ */}
            <div className="relative z-50 rounded-3xl border border-white/[0.05] p-8 md:p-12 bg-white/[0.01] backdrop-blur-2xl shadow-2xl">
                <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none rounded-3xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-slate-900 border border-white/10 rounded-full text-[9px] font-bold text-white/70 uppercase tracking-[0.2em] shadow-lg">
                    Face-Off Analysis
                </div>

                <div className="relative grid lg:grid-cols-[1fr,80px,1fr] gap-8 md:gap-12 items-center">
                    <PlayerSelectorHUD
                        players={sportPlayers}
                        selectedId={playerAId}
                        onChange={setPlayerAId}
                        accentColor={PLAYER_A_COLOR}
                        side="left"
                    />

                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900/80 border border-white/[0.05] flex items-center justify-center shadow-inner group transition-transform duration-500 hover:scale-105 backdrop-blur-sm">
                            <span className="text-xl md:text-2xl font-bold text-white/50 group-hover:text-white/90 transition-colors duration-300">VS</span>
                        </div>
                        <div className="h-16 w-px bg-gradient-to-b from-white/10 to-transparent mt-6" />
                    </div>

                    <PlayerSelectorHUD
                        players={sportPlayers}
                        selectedId={playerBId}
                        onChange={setPlayerBId}
                        accentColor={PLAYER_B_COLOR}
                        side="right"
                    />
                </div>

                {(!playerA || !playerB) ? (
                    <div className="mt-16 flex flex-col items-center justify-center py-20 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                            <Swords size={40} className="text-white/20" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Awaiting Challengers</h3>
                        <p className="text-slate-500 max-w-sm text-sm">Select two players from the dropdowns above to unlock live Face-Off Metrics, Career History, and detailed Matchup Analysis.</p>
                    </div>
                ) : (
                    <>
                        {/* API Format Selector (Cricket Only) */}
                        {selectedSport === 'cricket' && (
                            <div className="flex flex-col items-center justify-center mt-8 gap-4">
                                <div className="flex items-center bg-slate-900/80 border border-white/5 p-1 rounded-2xl shadow-inner">
                                    <button
                                        onClick={() => setStatCategory('batting')}
                                        className={cn(
                                            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                            statCategory === 'batting' ? "bg-indigo-500/20 text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        Batting
                                    </button>
                                    <button
                                        onClick={() => setStatCategory('bowling')}
                                        className={cn(
                                            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                            statCategory === 'bowling' ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        Bowling
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    {(['all', 'test', 'odi', 't20', 'ipl'] as BattingFormatKey[]).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setApiFormat(fmt)}
                                            className={cn(
                                                "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                                                apiFormat === fmt
                                                    ? "text-white border-transparent shadow-lg scale-105"
                                                    : "bg-[#0a0f1e]/80 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                                            )}
                                            style={apiFormat === fmt ? { background: FORMAT_COLORS[fmt], boxShadow: `0 4px 20px ${FORMAT_COLORS[fmt]}40` } : undefined}
                                        >
                                            {FORMAT_LABELS[fmt]}
                                        </button>
                                    ))}
                                </div>
                                {(loadingDeepA || loadingDeepB || loadingA || loadingB) && (
                                    <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                        <Loader2 size={12} className="animate-spin" /> Syncing Live Stats...
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Quick Insight Strip */}
                        <div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                            {insightsData.map((insight, i) => (
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
                    </>
                )}
            </div>

            {playerA && playerB && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-8">
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
                                <YAxis domain={[0, 'auto']} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value} ${statCategory === 'batting' ? 'Runs' : 'Wickets'}`, '']} />
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

                    {/* LED Segmented Face-Off List */}
                    <div className="space-y-2 pt-8 pb-4">
                        {statComparison.map((stat, i) => {
                            let valA, valB;
                            if (stat.isString) {
                                valA = stat.valA || '-';
                                valB = stat.valB || '-';
                            } else {
                                valA = typeof stat.valA === 'number' ? stat.valA : parseFloat(String(stat.valA)) || 0;
                                valB = typeof stat.valB === 'number' ? stat.valB : parseFloat(String(stat.valB)) || 0;
                            }
                            
                            const isATie = valA === valB;
                            
                            let aWins = false;
                            let bWins = false;
                            
                            if (!stat.isString && !isATie) {
                                if (stat.lowerIsBetter) {
                                    aWins = valA < valB;
                                    bWins = valB < valA;
                                    if (valA === 0) { aWins = false; bWins = true; } // Handle 0 as worst for lowerIsBetter
                                    if (valB === 0) { bWins = false; aWins = true; }
                                } else {
                                    aWins = valA > valB;
                                    bWins = valB > valA;
                                }
                            }

                            let segmentsA = 20;
                            let segmentsB = 20;

                            if (!stat.isString) {
                                if (valA === 0 && valB === 0) {
                                    segmentsA = 0;
                                    segmentsB = 0;
                                } else if (stat.lowerIsBetter) {
                                    const minVal = Math.min(valA as number, valB as number);
                                    segmentsA = valA === 0 ? 0 : Math.round((minVal / (valA as number)) * 20);
                                    segmentsB = valB === 0 ? 0 : Math.round((minVal / (valB as number)) * 20);
                                } else {
                                    const maxVal = Math.max(valA as number, valB as number);
                                    segmentsA = Math.round(((valA as number) / maxVal) * 20);
                                    segmentsB = Math.round(((valB as number) / maxVal) * 20);
                                }
                            }

                            return (
                                <div key={i} className="py-4 md:py-6 border-b border-white/5 last:border-0 relative group">
                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />

                                    <div className="flex flex-col gap-4 relative z-10">
                                        <div className="flex justify-between items-end px-2 md:px-6">
                                            <span className={cn(
                                                "text-2xl md:text-3xl font-black tabular-nums tracking-tighter transition-all duration-300",
                                                aWins ? "text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "text-slate-500 group-hover:text-slate-400"
                                            )}>{stat.valA}</span>
                                            
                                            <span className="text-[10px] md:text-xs font-black text-slate-400 group-hover:text-white uppercase tracking-[0.3em] transition-colors">
                                                {stat.label}
                                            </span>
                                            
                                            <span className={cn(
                                                "text-2xl md:text-3xl font-black tabular-nums tracking-tighter transition-all duration-300",
                                                bWins ? "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "text-slate-500 group-hover:text-slate-400"
                                            )}>{stat.valB}</span>
                                        </div>

                                        {/* LED Meter */}
                                        <div className="flex gap-1 md:gap-[3px] w-full items-center justify-center px-2 md:px-6">
                                            {/* Player A Meter */}
                                            <div className="flex-1 flex justify-end gap-1 md:gap-[3px]">
                                                {Array.from({ length: 20 }).map((_, idx) => {
                                                    const isLit = idx >= (20 - segmentsA);
                                                    let colorClass = "bg-slate-800/40";
                                                    if (isLit) {
                                                        if (stat.isString) colorClass = "bg-slate-600";
                                                        else if (aWins) colorClass = "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.7)]";
                                                        else if (isATie) colorClass = "bg-indigo-700/50";
                                                        else colorClass = "bg-indigo-900/60";
                                                    }
                                                    return <div key={`a-${idx}`} className={cn("h-2 md:h-2.5 w-1.5 md:w-2.5 rounded-[1px] skew-x-[-15deg] transition-all duration-500", colorClass)} />
                                                })}
                                            </div>

                                            <div className="w-6 md:w-10 flex justify-center">
                                                <div className="w-1 h-1 rounded-full bg-slate-700 shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                                            </div>

                                            {/* Player B Meter */}
                                            <div className="flex-1 flex justify-start gap-1 md:gap-[3px]">
                                                {Array.from({ length: 20 }).map((_, idx) => {
                                                    const isLit = idx < segmentsB;
                                                    let colorClass = "bg-slate-800/40";
                                                    if (isLit) {
                                                        if (stat.isString) colorClass = "bg-slate-600";
                                                        else if (bWins) colorClass = "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]";
                                                        else if (isATie) colorClass = "bg-rose-700/50";
                                                        else colorClass = "bg-rose-900/60";
                                                    }
                                                    return <div key={`b-${idx}`} className={cn("h-2 md:h-2.5 w-1.5 md:w-2.5 rounded-[1px] skew-x-[-15deg] transition-all duration-500", colorClass)} />
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SectionCard>
                </div>
            )}
        </div>
    );
};
