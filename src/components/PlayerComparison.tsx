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
    LineChart,
    Line,
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
    Loader2,
    Info
} from "lucide-react";

import { usePlayerBattingStats } from '@/hooks/usePlayerBattingStats';
import { usePerformanceLabPlayerStats, usePerformanceLabSquad, usePerformanceLabSquads } from '@/hooks/usePerformanceLab';
import { usePlayerRecentMatches } from '@/hooks/football/usePlayerRecentMatches';
import { useFootballSquads, useFotmobPlayerProfile, useFotmobPlayerProfileByName, useFotmobPlayerTournamentStats } from '@/hooks/useFootballSquads';
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

const CustomPlayerDot = (props: any) => {
    const { cx, cy, value, stroke, playerInfo, payload, teamIdKey } = props;
    if (value === undefined || value === null) return null;
    
    let imgUrl = null;
    
    const teamId = teamIdKey && payload ? payload[teamIdKey] : null;
    if (teamId) {
        imgUrl = `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}_xsmall.png`;
    } else if (playerInfo?.countryFlag?.startsWith('http')) {
        imgUrl = playerInfo.countryFlag;
    } else if (playerInfo?.country) {
        imgUrl = getFlagUrl(playerInfo.country);
    }
    
    return (
        <g transform={`translate(${cx}, ${cy})`} className="z-50 pointer-events-none hover:scale-110 transition-transform cursor-pointer">
            <circle cx="0" cy="0" r="15" fill="#121316" stroke={stroke} strokeWidth="2" opacity="0.9" />
            {imgUrl ? (
                <image href={imgUrl} x="-10" y="-10" height="20" width="20" preserveAspectRatio="xMidYMid slice"/>
            ) : (
                <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" fontWeight="900">{playerInfo?.name?.charAt(0) || ''}</text>
            )}
        </g>
    );
};

const CustomGraphTooltip = ({ active, payload, label, selectedSport, statCategory }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0f1e] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[200px]">
                <p className="font-black text-white/50 text-xs mb-2 uppercase tracking-widest">{label}</p>
                
                <div className="space-y-3">
                    {payload.map((entry: any, i: number) => {
                        const isPlayerA = entry.dataKey === 'A';
                        const oppName = isPlayerA ? entry.payload.oppA : entry.payload.oppB;
                        const oppId = isPlayerA ? entry.payload.oppIdA : entry.payload.oppIdB;
                        const result = isPlayerA ? entry.payload.resultA : entry.payload.resultB;
                        const isHome = isPlayerA ? entry.payload.isHomeA : entry.payload.isHomeB;
                        
                        let valText = "";
                        if (selectedSport === 'football') {
                            valText = `${(Number(entry.value) / 10).toFixed(1)} Rating`;
                        } else {
                            valText = `${entry.value} ${statCategory === 'batting' ? 'Runs' : 'Wickets/Rating'}`;
                        }

                        return (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-sm" style={{ color: entry.color }}>
                                        {entry.name}
                                    </span>
                                    <span className="font-black text-white">
                                        {valText}
                                    </span>
                                </div>
                                {selectedSport === 'football' && oppName && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 rounded-md px-2 py-1">
                                        <span className="font-medium">{isHome ? 'vs' : '@'}</span>
                                        {oppId && (
                                            <img 
                                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${oppId}_xsmall.png`} 
                                                className="w-3.5 h-3.5 object-contain" 
                                                alt=""
                                                onError={(e: any) => e.target.style.display = 'none'}
                                            />
                                        )}
                                        <span className="font-bold truncate max-w-[100px] text-white/80">{oppName}</span>
                                        {result && (
                                            <span className="ml-auto font-black text-[10px] tracking-wider border-l border-white/10 pl-1.5">{result}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
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

const FormIndicator = ({ form, matches, sport }: { form: number[], matches?: any[], sport?: string }) => {
    let items: string[] = [];

    if (sport === 'football' && matches && matches.length > 0) {
        items = matches.slice(0, 5).map((m: any) => {
            const isHome = m.isHomeTeam;
            const teamScore = isHome ? m.homeScore : m.awayScore;
            const oppScore = isHome ? m.awayScore : m.homeScore;
            if (teamScore > oppScore) return 'W';
            if (teamScore < oppScore) return 'L';
            return 'D';
        }).reverse();
    } else {
        items = form.slice(-5).map(val => val > 80 ? 'W' : 'L');
    }

    return (
        <div className="flex gap-1.5">
            {items.map((res, i) => {
                let bgClass = "bg-slate-800/50 border-slate-700 text-slate-500";
                if (res === 'W') bgClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
                if (res === 'D') bgClass = "bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
                if (res === 'L') bgClass = "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]";

                return (
                    <div 
                        key={i}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all",
                            bgClass
                        )}
                    >
                        {res}
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
        return Array.from(countries.entries())
            .map(([name, flag]) => ({ name, flag }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [players]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCountry = !selectedCountry || p.country === selectedCountry;
            return matchesSearch && matchesCountry;
        });
    }, [players, searchQuery, selectedCountry]);

    const groupedPlayers = useMemo(() => {
        const groups: Record<string, AnalysisPlayer[]> = {};
        filteredPlayers.forEach(p => {
            let roleCategory = p.role || 'Other';
            const r = roleCategory.toLowerCase();
            
            if (r.includes('goalkeeper') || r.includes('keeper')) roleCategory = 'Goalkeepers';
            else if (r.includes('defender')) roleCategory = 'Defenders';
            else if (r.includes('midfielder')) roleCategory = 'Midfielders';
            else if (r.includes('forward') || r.includes('attacker') || r.includes('striker') || r.includes('winger')) roleCategory = 'Attackers';
            else if (r.includes('batsman') || r.includes('batter')) roleCategory = 'Batsmen';
            else if (r.includes('bowler')) roleCategory = 'Bowlers';
            else if (r.includes('allrounder') || r.includes('all-rounder')) roleCategory = 'All-Rounders';
            else roleCategory = 'Other';

            if (!groups[roleCategory]) groups[roleCategory] = [];
            groups[roleCategory].push(p);
        });

        // Desired order for both football and cricket
        const order = ['Goalkeepers', 'Defenders', 'Midfielders', 'Attackers', 'Batsmen', 'All-Rounders', 'Bowlers', 'Wicket Keepers', 'Other'];
        
        return Object.entries(groups).sort(([a], [b]) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [filteredPlayers]);

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
                                <img 
                                    src={current.photo} 
                                    alt={current.name} 
                                    className="w-full h-full object-cover scale-[1.02] group-hover/hud:scale-110 transition-transform duration-500 ease-out" 
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent && !parent.querySelector('.fallback-text')) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'fallback-text w-full h-full flex items-center justify-center text-2xl font-bold text-white/50';
                                            const parts = current.name.split(' ');
                                            fallback.innerText = parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : current.name.substring(0, 2).toUpperCase();
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
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
                            ) : current?.countryFlag?.startsWith('http') ? (
                                <img src={current.countryFlag} alt={current?.country} className="w-5 h-3.5 object-cover rounded-[2px]" />
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
                                    ) : c.flag?.startsWith('http') ? (
                                        <img src={c.flag} alt={c.name} className="w-4 h-3 object-cover rounded-sm" />
                                    ) : (
                                        <span>{c.flag}</span>
                                    )}
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        {groupedPlayers.length > 0 ? groupedPlayers.map(([category, categoryPlayers]) => (
                            <div key={category} className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-[1px] flex-1 bg-white/[0.05]"></div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        {category}
                                    </div>
                                    <div className="h-[1px] flex-1 bg-white/[0.05]"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {categoryPlayers.map((p) => (
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
                                                {p.photo && (selectedCountry || searchQuery) ? (
                                                    <img 
                                                        src={p.photo} 
                                                        alt={p.name} 
                                                        loading="lazy"
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                            const parent = (e.target as HTMLElement).parentElement;
                                                            if (parent && !parent.querySelector('.fallback-text')) {
                                                                const fallback = document.createElement('div');
                                                                fallback.className = 'fallback-text w-full h-full flex items-center justify-center text-xs font-bold text-white';
                                                                const parts = p.name.split(' ');
                                                                fallback.innerText = parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : p.name.substring(0, 2).toUpperCase();
                                                                parent.appendChild(fallback);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{p.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <span className="font-black text-white text-sm block uppercase tracking-tight truncate">{p.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {getFlagUrl(p.country) ? (
                                                        <img src={getFlagUrl(p.country)!} alt={p.country} className="w-4 h-3 object-cover rounded-sm" />
                                                    ) : p.countryFlag?.startsWith('http') ? (
                                                        <img src={p.countryFlag} alt={p.country} className="w-4 h-3 object-cover rounded-sm" />
                                                    ) : (
                                                        <span className="text-lg">{p.countryFlag}</span>
                                                    )}
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rating: {p.overallRating}</span>
                                                </div>
                                            </div>
                                            {p.id === selectedId && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#3b82f6]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center text-slate-500 font-bold">
                                No players found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────
export const PlayerComparison = ({ activeSport = "cricket" }: { activeSport?: "cricket" | "football" | "all" }) => {
    const [selectedSport, setSelectedSport] = useState<AnalysisSport>(
        (activeSport === "all" ? "cricket" : activeSport) as AnalysisSport
    );
    const [playerAId, setPlayerAId] = useState<string>("");
    const [playerBId, setPlayerBId] = useState<string>("");

    useEffect(() => {
        if (activeSport === "cricket" || activeSport === "football") {
            setSelectedSport(activeSport as AnalysisSport);
            setPlayerAId("");
            setPlayerBId("");
        }
    }, [activeSport]);

    const CRICKET_TEAMS = useMemo(() => [
        'india-2', 'australia-4', 'england-9', 'south-africa-11', 'new-zealand-13', 'pakistan-3',
        'sri-lanka-5', 'west-indies-10', 'bangladesh-6', 'afghanistan-96', 'zimbabwe-12', 'ireland-27',
        'scotland-23', 'netherlands-24', 'nepal-72'
    ], []);
    const squadQueries = usePerformanceLabSquads(selectedSport === 'cricket' ? CRICKET_TEAMS : []);
    const { data: footballSquadData } = useFootballSquads();
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
            return players.sort((a, b) => a.name.localeCompare(b.name));
        } else if (selectedSport === 'football' && footballSquadData) {
            const analysisMap = new Map();
            (ANALYSIS_PLAYERS['football'] || []).forEach((p: any) => {
                analysisMap.set(p.name, p);
            });

            const players: any[] = [];
            Object.values(footballSquadData).forEach((squad: any) => {
                const meta = { name: squad?.teamInfo?.name || '', iso: squad?.teamInfo?.logo || '' };
                squad?.players?.forEach((p: any) => {
                    const idSum = String(p.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const stableOVR = (idSum % 16) + 78;
                    const existingAnalysis = analysisMap.get(p.name);
                    players.push({
                        id: String(p.id),
                        name: p.name,
                        country: meta.name,
                        countryFlag: meta.iso, // logo URL
                        role: existingAnalysis?.role || p.position || 'Player',
                        photo: `/api/football/fotmob-player-image-by-name/${encodeURIComponent(p.name)}`,
                        overallRating: existingAnalysis?.overallRating || stableOVR,
                        attributes: existingAnalysis?.attributes || {
                            Pace: 75 + (idSum % 20),
                            Shooting: 70 + (idSum % 25),
                            Passing: 70 + (idSum % 20),
                            Dribbling: 75 + (idSum % 15),
                            Defending: 60 + (idSum % 30),
                            Physical: 65 + (idSum % 25),
                            Clutch: 70 + (idSum % 25),
                        },
                        formTrend: existingAnalysis?.formTrend || [
                            60 + (idSum % 40),
                            50 + (idSum % 50),
                            70 + (idSum % 30),
                            55 + (idSum % 45),
                            65 + (idSum % 35)
                        ],
                        detailedStats: existingAnalysis?.detailedStats || {
                            'Goals': idSum % 25,
                            'Assists': idSum % 15,
                            'Matches Played': 30 + (idSum % 10),
                            'Shot Accuracy %': 60 + (idSum % 30),
                            'Pass Accuracy %': 70 + (idSum % 25),
                            'Tackles Won': 10 + (idSum % 40),
                            'Interceptions': 5 + (idSum % 20),
                            'Clean Sheets': idSum % 12
                        }
                    });
                });
            });
            return players.sort((a, b) => a.name.localeCompare(b.name));
        }
        return ANALYSIS_PLAYERS[selectedSport] || [];
    }, [selectedSport, squadQueries, squadFilters, footballSquadData]);

    const playerA = sportPlayers.find(p => p.id === playerAId || String(p.id) === String(playerAId)) || null;
    const playerB = useMemo(() => sportPlayers.find(p => p.id === playerBId) || sportPlayers[1], [sportPlayers, playerBId]);

    const { data: profileA } = useFotmobPlayerProfileByName(selectedSport === 'football' ? playerA?.name : null);
    const { data: profileB } = useFotmobPlayerProfileByName(selectedSport === 'football' ? playerB?.name : null);

    const fotmobIdA = profileA?.id || null;
    const fotmobIdB = profileB?.id || null;

    const getFallbackSeasonId = (seasonName: string | undefined, tournamentId: string | number | undefined) => {
        if (!seasonName || !tournamentId) return undefined;
        const yearMatch = seasonName.match(/^(\d{4})/);
        return yearMatch ? `${yearMatch[1]}-${tournamentId}` : `${seasonName}-${tournamentId}`;
    };

    const tournamentA = profileA?.statSeasons?.[0]?.tournaments?.[0];
    const tournamentB = profileB?.statSeasons?.[0]?.tournaments?.[0];

    const { data: fotmobStatsA } = useFotmobPlayerTournamentStats(
        fotmobIdA,
        tournamentA?.entryId || getFallbackSeasonId(profileA?.statSeasons?.[0]?.seasonName, tournamentA?.tournamentId),
        tournamentA?.tournamentId
    );
    
    const { data: fotmobStatsB } = useFotmobPlayerTournamentStats(
        fotmobIdB,
        tournamentB?.entryId || getFallbackSeasonId(profileB?.statSeasons?.[0]?.seasonName, tournamentB?.tournamentId),
        tournamentB?.tournamentId
    );

    const [apiFormat, setApiFormat] = useState<BattingFormatKey>('all');
    const [statCategory, setStatCategory] = useState<'batting'|'bowling'>('batting');

    const { battingStats: statsA, isLoading: loadingA } = usePlayerBattingStats(playerA?.id || "");
    const { battingStats: statsB, isLoading: loadingB } = usePlayerBattingStats(playerB?.id || "");

    const cricbuzzIdA = playerA ? (/^\d+$/.test(String(playerA.id).trim()) ? String(playerA.id).trim() : getCricbuzzPlayerId(playerA.id)?.toString()) || null : null;
    const cricbuzzIdB = playerB ? (/^\d+$/.test(String(playerB.id).trim()) ? String(playerB.id).trim() : getCricbuzzPlayerId(playerB.id)?.toString()) || null : null;

    const { data: deepStatsA, isLoading: loadingDeepA } = usePerformanceLabPlayerStats(cricbuzzIdA, playerA?.name || "");
    const { data: deepStatsB, isLoading: loadingDeepB } = usePerformanceLabPlayerStats(cricbuzzIdB, playerB?.name || "");

    const { data: fotmobRecentA } = usePlayerRecentMatches(selectedSport === 'football' ? playerA?.name : undefined);
    const { data: fotmobRecentB } = usePlayerRecentMatches(selectedSport === 'football' ? playerB?.name : undefined);

    const recentMatchesA_football = (fotmobRecentA && fotmobRecentA.length > 0) ? fotmobRecentA : profileA?.recentMatches;
    const recentMatchesB_football = (fotmobRecentB && fotmobRecentB.length > 0) ? fotmobRecentB : profileB?.recentMatches;

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

    const extractFootballRatings = (matches: any[]) => {
        if (!matches || matches.length === 0) return [];
        return [...matches]
            .map((m: any) => {
                let r = 0;
                if (m.ratingProps) {
                    r = parseFloat(m.ratingProps.num || m.ratingProps.rating || '0');
                } else if (m.rating) {
                    r = parseFloat(typeof m.rating === 'object' ? m.rating.rating : m.rating);
                }
                const result = m.homeScore !== undefined ? `${m.homeScore} - ${m.awayScore}` : '';
                return {
                    rating: (!isNaN(r) && r > 0) ? r * 10 : null,
                    teamId: m.teamId,
                    opponentId: m.opponentTeamId,
                    opponentName: m.opponentTeamName || m.opponentName,
                    result,
                    isHome: m.isHomeTeam,
                };
            })
            .filter((m: any) => m.rating !== null)
            .slice(0, 10)
            .reverse();
    };

    const formData = Array.from({ length: 10 }).map((_, i) => {
        if (selectedSport === 'football') {
             const ratingsA = extractFootballRatings(recentMatchesA_football || []);
             const ratingsB = extractFootballRatings(recentMatchesB_football || []);
             
             const idxA = ratingsA.length - 10 + i;
             const idxB = ratingsB.length - 10 + i;
             
             const matchA = idxA >= 0 && idxA < ratingsA.length ? ratingsA[idxA] : null;
             const matchB = idxB >= 0 && idxB < ratingsB.length ? ratingsB[idxB] : null;
             
             return {
                 match: `M${i + 1}`,
                 A: matchA?.rating ?? null,
                 B: matchB?.rating ?? null,
                 teamIdA: matchA?.teamId,
                 teamIdB: matchB?.teamId,
                 oppA: matchA?.opponentName,
                 oppIdA: matchA?.opponentId,
                 resultA: matchA?.result,
                 isHomeA: matchA?.isHome,
                 oppB: matchB?.opponentName,
                 oppIdB: matchB?.opponentId,
                 resultB: matchB?.result,
                 isHomeB: matchB?.isHome,
             };
        }
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

        if (selectedSport === 'football') {
            const extractVal = (statsData: any, category: string, title: string, finalFallback: number) => {
                if (statsData?.topStatCard?.items) {
                    const topItem = statsData.topStatCard.items.find((i: any) => i.title?.toLowerCase() === title.toLowerCase());
                    if (topItem && topItem.statValue !== undefined && topItem.statValue !== null) {
                        const parsed = parseFloat(topItem.statValue);
                        if (!isNaN(parsed)) return parsed;
                    }
                }
                if (statsData?.statsSection?.items) {
                    const cat = statsData.statsSection.items.find((c: any) => c.title?.toLowerCase() === category.toLowerCase());
                    if (cat?.items) {
                        const item = cat.items.find((i: any) => i.title?.toLowerCase() === title.toLowerCase());
                        if (item && item.statValue !== undefined && item.statValue !== null) {
                            const parsed = parseFloat(item.statValue);
                            if (!isNaN(parsed)) return parsed;
                        }
                    }
                }
                return finalFallback;
            };

        if (playerA && playerB && (fotmobStatsA || fotmobStatsB)) {
            const aPlayer = ANALYSIS_PLAYERS['football']?.find((p: any) => p.name === playerA?.name) || playerA;
            const bPlayer = ANALYSIS_PLAYERS['football']?.find((p: any) => p.name === playerB?.name) || playerB;

            return [
                { label: 'Goals', valA: extractVal(fotmobStatsA, '', 'Goals', playerA?.detailedStats?.['Goals'] ?? aPlayer?.detailedStats?.['Goals'] ?? 0), valB: extractVal(fotmobStatsB, '', 'Goals', playerB?.detailedStats?.['Goals'] ?? bPlayer?.detailedStats?.['Goals'] ?? 0) },
                { label: 'Assists', valA: extractVal(fotmobStatsA, '', 'Assists', playerA?.detailedStats?.['Assists'] ?? aPlayer?.detailedStats?.['Assists'] ?? 0), valB: extractVal(fotmobStatsB, '', 'Assists', playerB?.detailedStats?.['Assists'] ?? bPlayer?.detailedStats?.['Assists'] ?? 0) },
                { label: 'Matches', valA: extractVal(fotmobStatsA, '', 'Matches', aPlayer?.detailedStats?.['Appearances'] ?? 0), valB: extractVal(fotmobStatsB, '', 'Matches', bPlayer?.detailedStats?.['Appearances'] ?? 0) },
                { label: 'Shots/90', valA: extractVal(fotmobStatsA, 'Attacking', 'Shots on target', aPlayer?.detailedStats?.['Shots/90'] ?? 0), valB: extractVal(fotmobStatsB, 'Attacking', 'Shots on target', bPlayer?.detailedStats?.['Shots/90'] ?? 0) },
                { label: 'Pass %', valA: extractVal(fotmobStatsA, 'Passing', 'Passes accurate', aPlayer?.detailedStats?.['Pass Accuracy %'] ?? 0), valB: extractVal(fotmobStatsB, 'Passing', 'Passes accurate', bPlayer?.detailedStats?.['Pass Accuracy %'] ?? 0) },
                { label: 'Tackles', valA: extractVal(fotmobStatsA, 'Defending', 'Tackles won', aPlayer?.detailedStats?.['Tackles Won'] ?? 0), valB: extractVal(fotmobStatsB, 'Defending', 'Tackles won', bPlayer?.detailedStats?.['Tackles Won'] ?? 0) },
                { label: 'Intercepts', valA: extractVal(fotmobStatsA, 'Defending', 'Interceptions', aPlayer?.detailedStats?.['Interceptions'] ?? 0), valB: extractVal(fotmobStatsB, 'Defending', 'Interceptions', bPlayer?.detailedStats?.['Interceptions'] ?? 0) },
                { label: 'Clean Sht', valA: extractVal(fotmobStatsA, 'Defending', 'Clean sheets', aPlayer?.detailedStats?.['Clean Sheets'] ?? 0), valB: extractVal(fotmobStatsB, 'Defending', 'Clean sheets', bPlayer?.detailedStats?.['Clean Sheets'] ?? 0) },
            ];
        }

        if (playerA && playerB) {
            return Object.keys(playerA.detailedStats || {}).map(key => ({
                label: key,
                valA: playerA.detailedStats[key] || 0,
                valB: playerB.detailedStats[key] || 0,
            }));
        }
        
        return [];
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

    if (selectedSport === 'football') {
        const isReady = playerA && playerB;

        const getPositionAbbr = (role: string, primaryPos: string) => {
            const p = (primaryPos || role || 'ATT').toLowerCase();
            if (p.includes('striker') || p.includes('center forward')) return 'ST';
            if (p.includes('right winger')) return 'RW';
            if (p.includes('left winger')) return 'LW';
            if (p.includes('forward')) return 'CF';
            if (p.includes('attacking mid')) return 'CAM';
            if (p.includes('defensive mid')) return 'CDM';
            if (p.includes('center mid') || p.includes('midfielder')) return 'CM';
            if (p.includes('center back') || p.includes('defender')) return 'CB';
            if (p.includes('right back')) return 'RB';
            if (p.includes('left back')) return 'LB';
            if (p.includes('keeper')) return 'GK';
            return p.substring(0, 3).toUpperCase();
        };

        const getFutAttributes = (p: any) => {
            const seed = p?.name?.length || 5;
            const base = p?.overallRating || 85;
            return [
                { label: 'PAC', val: p?.attributes?.Pace || Math.min(99, base - 5 + (seed % 10)) },
                { label: 'SHO', val: p?.attributes?.Shooting || Math.min(99, base - 2 + (seed % 8)) },
                { label: 'PAS', val: p?.attributes?.Passing || Math.min(99, base - 4 + (seed % 7)) },
                { label: 'DRI', val: p?.attributes?.Dribbling || Math.min(99, base - 3 + (seed % 9)) },
                { label: 'DEF', val: p?.attributes?.Defending || Math.min(99, base - 20 + (seed % 15)) },
                { label: 'PHY', val: p?.attributes?.Physical || Math.min(99, base - 10 + (seed % 12)) },
            ];
        };

        const FutCard = ({ player, profile, stats, isA }: { player: any, profile: any, stats: any[], isA: boolean }) => {
            const theme = isA ? 'from-[#fef08a] via-[#ca8a04] to-[#713f12]' : 'from-[#fecdd3] via-[#e11d48] to-[#881337]';
            const textColor = isA ? 'text-[#fef08a]' : 'text-[#fecdd3]';
            const borderColor = isA ? 'border-[#ca8a04]' : 'border-[#e11d48]';

            const photoUrl = player?.photo || `https://images.fotmob.com/image_resources/playerimages/${profile?.id}.png`;

            return (
                <div className="relative w-[280px] md:w-[320px] aspect-[2/3] group transition-transform duration-500 hover:scale-105 hover:z-50 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 mx-auto">
                    {/* Outer Glow */}
                    <div className={cn("absolute inset-0 blur-3xl opacity-40 transition-opacity duration-500 group-hover:opacity-80 bg-gradient-to-br", theme)} />
                    
                    {/* The Shield Body */}
                    <div className={cn("w-full h-full relative bg-gradient-to-br p-[3px] shadow-2xl", theme)} style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 8%, 100% 80%, 50% 100%, 0% 80%, 0% 8%)" }}>
                        <div className="w-full h-full bg-gradient-to-b from-[#1a1a1a] via-[#111] to-[#050505] relative overflow-hidden flex flex-col items-center pt-8" style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 8%, 100% 80%, 50% 100%, 0% 80%, 0% 8%)" }}>
                            {/* Card Texture */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay" />
                            <div className={cn("absolute top-0 w-full h-1/2 bg-gradient-to-b opacity-20 pointer-events-none", theme)} />
                            
                            {/* Top Section */}
                            <div className="w-full flex justify-center px-4 relative z-10">
                                {/* Rating & Flag */}
                                <div className="absolute left-6 top-0 flex flex-col items-center">
                                    <span className={cn("text-4xl md:text-5xl font-black tracking-tighter drop-shadow-md", textColor)}>{player.overallRating || 88}</span>
                                    <span className="text-sm font-bold text-white/80 mt-1 uppercase tracking-wider">{getPositionAbbr(player.role, profile?.primaryPosition)}</span>
                                    
                                    {/* Nation Flag */}
                                    {(() => {
                                        const countryInfo = profile?.playerInformation?.find((i: any) => i.title === 'Country');
                                        const countryCode = countryInfo?.countryCode; // e.g., 'ARG'
                                        const aPlayer = ANALYSIS_PLAYERS['football']?.find((p: any) => p.name === player?.name);
                                        
                                        if (countryCode) {
                                            return <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${countryCode.toLowerCase()}.png`} className="w-8 h-auto mt-3 shadow-md" alt="Flag" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
                                        } else if (aPlayer?.countryFlag) {
                                            return <span className="text-2xl mt-2 drop-shadow-md">{aPlayer.countryFlag}</span>;
                                        }
                                        return null;
                                    })()}

                                    {/* Club Logo */}
                                    {(() => {
                                        const teamId = profile?.primaryTeam?.teamId;
                                        if (teamId) {
                                            return <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`} className="w-8 h-8 object-contain mt-3 shadow-md drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" alt="Club" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
                                        }
                                        return null;
                                    })()}
                                </div>
                                
                                {/* Photo */}
                                <div className={cn("w-32 h-32 md:w-36 md:h-36 rounded-full border-4 overflow-hidden bg-black relative ml-8 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center", borderColor)}>
                                    <img 
                                        src={photoUrl} 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                        className="w-full h-full object-cover" 
                                        alt={player.name} 
                                    />
                                    <div className="hidden w-full h-full flex items-center justify-center text-5xl font-black text-white/30">{player.name[0]}</div>
                                </div>
                            </div>
                            
                            {/* Name */}
                            <div className="w-full text-center mt-4 px-4 relative z-10">
                                <h2 className={cn("text-xl md:text-2xl font-black uppercase tracking-widest border-b pb-2", textColor, borderColor)}>
                                    {player.name}
                                </h2>
                            </div>
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-8 relative z-10">
                                {stats.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className={cn("text-xl md:text-2xl font-black", textColor)}>{s.val}</span>
                                        <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Bottom Decal */}
                            <div className="absolute bottom-6 w-full flex justify-center opacity-30">
                                <div className={cn("h-px w-24 bg-gradient-to-r", theme)} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const mappedStatsA = getFutAttributes(playerA);
        const mappedStatsB = getFutAttributes(playerB);

        return (
            <div className="space-y-0 animate-fade-in text-white w-full relative font-sans overflow-hidden min-h-[1000px]">
                {/* Massive Pitch Background */}
                <div className="absolute inset-0 bg-[#061e0e] -z-30" />
                <div className="absolute inset-0 opacity-15 -z-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(255,255,255,1) 80px, rgba(255,255,255,1) 160px)' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020a05] via-transparent to-[#020a05] opacity-90 -z-10 pointer-events-none" />
                
                {/* Pitch Linings */}
                <div className="absolute inset-4 md:inset-8 border-[3px] border-white/20 -z-10 pointer-events-none rounded-lg" />
                <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-white/20 -z-10 -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border-[3px] border-white/20 rounded-full -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white/20 rounded-full -z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="max-w-[1400px] mx-auto pb-24 px-4 pt-12 relative z-10">
                    
                    {/* Header Selectors */}
                    <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 md:gap-16 items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative z-50">
                        <div className="w-full">
                            <PlayerSelectorHUD players={sportPlayers} selectedId={playerAId} onChange={setPlayerAId} accentColor="#eab308" side="left" />
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#111] to-black border border-white/10 flex items-center justify-center shadow-inner">
                                <Swords size={24} className="text-white/50" />
                            </div>
                        </div>
                        <div className="w-full">
                            <PlayerSelectorHUD players={sportPlayers} selectedId={playerBId} onChange={setPlayerBId} accentColor="#e11d48" side="right" />
                        </div>
                    </div>

                    {!isReady && (
                        <div className="text-center py-40">
                            <h2 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-white/10 drop-shadow-xl">Tactical Analysis</h2>
                        </div>
                    )}

                    {isReady && (
                        <>
                            {/* FUT CARDS */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 mt-20 mb-20 relative z-30">
                                <FutCard player={playerA} profile={profileA} stats={mappedStatsA} isA={true} />
                                <div className="text-6xl font-black italic text-white/20 hidden md:block">VS</div>
                                <FutCard player={playerB} profile={profileB} stats={mappedStatsB} isA={false} />
                            </div>

                            {/* LOCKER ROOM HUD */}
                            <div className="grid lg:grid-cols-2 gap-8 relative z-20">
                                {/* Tactical Radar */}
                                <div className="bg-[#0b1410]/80 backdrop-blur-md border border-emerald-900/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-mamba.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                                    
                                    <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center justify-center gap-4 border-b border-emerald-900/50 pb-4 mb-8">
                                        <Target size={18} /> Tactical Radar
                                    </h3>
                                    
                                    <div className="w-full h-[400px] flex items-center justify-center drop-shadow-2xl">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                <PolarGrid stroke="#10b981" strokeOpacity={0.2} />
                                                <PolarAngleAxis dataKey="attribute" tick={{ fill: 'rgba(16,185,129,0.8)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name={playerA.name} dataKey="A" stroke="#eab308" strokeWidth={3} fill="#eab308" fillOpacity={0.2} activeDot={{ r: 6, fill: '#fff', stroke: '#eab308', strokeWidth: 3 }} />
                                                <Radar name={playerB.name} dataKey="B" stroke="#e11d48" strokeWidth={3} fill="#e11d48" fillOpacity={0.2} activeDot={{ r: 6, fill: '#fff', stroke: '#e11d48', strokeWidth: 3 }} />
                                                <Tooltip content={(props: any) => <CustomGraphTooltip {...props} selectedSport={selectedSport} />} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Form Curve */}
                                <div className="bg-[#0b1410]/80 backdrop-blur-md border border-emerald-900/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-mamba.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                                    
                                    <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center justify-center gap-4 border-b border-emerald-900/50 pb-4 mb-8">
                                        <Activity size={18} /> Form Curve
                                    </h3>
                                    
                                    <div className="flex justify-between items-center mb-8 bg-[#040806] p-4 rounded-2xl border border-emerald-900/30">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[#eab308]">{playerA.name}</span>
                                            <FormIndicator form={playerA.formTrend} matches={recentMatchesA_football} sport={selectedSport} />
                                        </div>
                                        <div className="w-px h-10 bg-emerald-900/50" />
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[#e11d48]">{playerB.name}</span>
                                            <FormIndicator form={playerB.formTrend} matches={recentMatchesB_football} sport={selectedSport} />
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={formData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" vertical={false} />
                                                <XAxis dataKey="match" tick={{ fill: 'rgba(16,185,129,0.5)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dy={10} />
                                                <YAxis domain={[0, 10]} tick={{ fill: 'rgba(16,185,129,0.5)', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={(props: any) => <CustomGraphTooltip {...props} selectedSport={selectedSport} />} cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1 }} />
                                                
                                                <Line type="monotone" dataKey="A" stroke="#eab308" strokeWidth={4} dot={<CustomPlayerDot playerInfo={playerA} stroke="#eab308" teamIdKey="oppIdA" />} activeDot={{ r: 8, fill: "#fff", stroke: "#eab308", strokeWidth: 3 }} />
                                                <Line type="monotone" dataKey="B" stroke="#e11d48" strokeWidth={4} dot={<CustomPlayerDot playerInfo={playerB} stroke="#e11d48" teamIdKey="oppIdB" />} activeDot={{ r: 8, fill: "#fff", stroke: "#e11d48", strokeWidth: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* CAREER STATS PANEL */}
                            <div className="mt-8 mb-20 bg-[#050907]/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group z-20">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                                
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.4em] flex items-center justify-center gap-4 mb-16">
                                    <BarChart3 size={18} className="text-emerald-500" /> Career Overview
                                </h3>

                                {/* Head to Head Header */}
                                <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16 relative border-b border-white/5 pb-12">
                                    {/* Player A */}
                                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full md:w-auto">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#eab308]/30 to-black border border-[#eab308]/40 shadow-[0_0_40px_rgba(234,179,8,0.15)] p-1.5 transition-transform duration-500 hover:scale-105 hover:-rotate-3">
                                            <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-black/50 backdrop-blur-md">
                                                <img 
                                                    src={playerA?.photo} 
                                                    alt={playerA?.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 drop-shadow-sm">{playerA.name}</span>
                                            <span className="text-[#eab308] font-black tracking-[0.3em] uppercase text-xs md:text-sm mt-2">{playerA.role || 'Player'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -bottom-6 w-12 h-12 bg-[#0a110e] border border-white/10 rounded-full items-center justify-center text-xs font-black italic text-white/30 z-10 shadow-xl">VS</div>

                                    {/* Player B */}
                                    <div className="flex flex-col md:flex-row-reverse items-center gap-6 text-center md:text-right w-full md:w-auto">
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden bg-gradient-to-bl from-[#e11d48]/30 to-black border border-[#e11d48]/40 shadow-[0_0_40px_rgba(225,29,72,0.15)] p-1.5 transition-transform duration-500 hover:scale-105 hover:rotate-3">
                                            <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-black/50 backdrop-blur-md">
                                                <img 
                                                    src={playerB?.photo} 
                                                    alt={playerB?.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-bl from-white to-white/60 drop-shadow-sm">{playerB.name}</span>
                                            <span className="text-[#e11d48] font-black tracking-[0.3em] uppercase text-xs md:text-sm mt-2">{playerB.role || 'Player'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Bars */}
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {statComparison.map((stat, i) => {
                                        const numA = parseFloat(stat.valA as string) || 0;
                                        const numB = parseFloat(stat.valB as string) || 0;
                                        const max = Math.max(numA, numB) || 1;
                                        const pctA = (numA / max) * 100;
                                        const pctB = (numB / max) * 100;
                                        const isAWinner = numA > numB;
                                        const isBWinner = numB > numA;
                                        const isTie = numA === numB && numA !== 0;

                                        return (
                                            <div key={i} className="flex flex-col gap-3 group/row">
                                                <div className="flex justify-between items-center text-sm md:text-base font-black uppercase tracking-widest px-2">
                                                    <span className={`w-20 md:w-24 text-right transition-colors duration-300 ${isAWinner ? 'text-[#eab308] text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : isTie ? 'text-white/80' : 'text-white/30'}`}>
                                                        {stat.valA}
                                                    </span>
                                                    <span className="text-white/40 text-[10px] md:text-xs px-4 text-center group-hover/row:text-white/80 transition-colors duration-300">
                                                        {stat.label}
                                                    </span>
                                                    <span className={`w-20 md:w-24 text-left transition-colors duration-300 ${isBWinner ? 'text-[#e11d48] text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]' : isTie ? 'text-white/80' : 'text-white/30'}`}>
                                                        {stat.valB}
                                                    </span>
                                                </div>
                                                <div className="flex justify-center items-center gap-3 md:gap-6">
                                                    <div className="flex-1 h-3 md:h-4 bg-black/40 rounded-l-full overflow-hidden flex justify-end shadow-inner border-y border-l border-white/5 relative">
                                                        <div 
                                                            className="h-full bg-gradient-to-l from-[#eab308] to-[#ca8a04]/20 rounded-l-full transition-all duration-1000 ease-out relative overflow-hidden" 
                                                            style={{ width: `${pctA}%` }}
                                                        >
                                                            {isAWinner && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />}
                                                        </div>
                                                    </div>
                                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white/10" />
                                                    <div className="flex-1 h-3 md:h-4 bg-black/40 rounded-r-full overflow-hidden flex justify-start shadow-inner border-y border-r border-white/5 relative">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-[#e11d48] to-[#be123c]/20 rounded-r-full transition-all duration-1000 ease-out relative overflow-hidden" 
                                                            style={{ width: `${pctB}%` }}
                                                        >
                                                            {isBWinner && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-full animate-shimmer" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

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

                {/* Line Chart: Performance Trend */}
                <SectionCard icon={<Activity size={24} />} title="Form Trend Analysis">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="match" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={[0, 'auto']} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => selectedSport === 'football' ? (val / 10).toString() : val} />
                                <Tooltip content={<CustomGraphTooltip selectedSport={selectedSport} statCategory={statCategory} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                <Line
                                    type="monotone"
                                    dataKey="A"
                                    stroke={PLAYER_A_COLOR}
                                    strokeWidth={3}
                                    name={playerA.name}
                                    dot={<CustomPlayerDot playerInfo={playerA} stroke={PLAYER_A_COLOR} teamIdKey="teamIdA" />}
                                    activeDot={{ r: 16, strokeWidth: 2, fill: PLAYER_A_COLOR, stroke: "#fff" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="B"
                                    stroke={PLAYER_B_COLOR}
                                    strokeWidth={3}
                                    name={playerB.name}
                                    dot={<CustomPlayerDot playerInfo={playerB} stroke={PLAYER_B_COLOR} teamIdKey="teamIdB" />}
                                    activeDot={{ r: 16, strokeWidth: 2, fill: PLAYER_B_COLOR, stroke: "#fff" }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 900, fontSize: '12px' }} />
                            </LineChart>
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
                            <FormIndicator form={playerA.formTrend} matches={recentMatchesA_football} sport={selectedSport} />
                        </div>
                        <div className="text-center">
                            <Swords size={32} className="text-primary opacity-20 mx-auto mb-4" />
                            <p className="text-sm font-black text-white uppercase tracking-widest italic">Face-Off Metrics</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Form {playerB.name}</span>
                            <FormIndicator form={playerB.formTrend} matches={recentMatchesB_football} sport={selectedSport} />
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

                            if (selectedSport === 'football') {
                                let ratioA = 50;
                                if (!stat.isString) {
                                    const numA = valA as number;
                                    const numB = valB as number;
                                    if (numA === 0 && numB === 0) {
                                        ratioA = 50;
                                    } else if (stat.lowerIsBetter) {
                                        ratioA = (numB / (numA + numB)) * 100;
                                    } else {
                                        ratioA = (numA / (numA + numB)) * 100;
                                    }
                                    ratioA = Math.max(5, Math.min(95, ratioA));
                                }

                                return (
                                    <div key={i} className="py-6 px-4 md:px-12 relative group overflow-hidden bg-gradient-to-r from-[#031B0F] via-[#062c18] to-[#031B0F] my-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-emerald-900/40 hover:border-emerald-500/40 transition-all duration-500">
                                        {/* Pitch Markings Overlay */}
                                        <div className="absolute inset-0 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700">
                                            {/* Pitch lines */}
                                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-[2px] border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                            {/* Penalty boxes */}
                                            <div className="absolute top-1/4 bottom-1/4 left-0 w-32 border-[2px] border-l-0 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                            <div className="absolute top-1/4 bottom-1/4 right-0 w-32 border-[2px] border-r-0 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                                        </div>

                                        <div className="flex flex-col gap-6 relative z-10">
                                            {/* Stat Values & Label */}
                                            <div className="flex justify-between items-end px-2 md:px-6">
                                                <span className={cn(
                                                    "text-4xl md:text-5xl font-black tabular-nums tracking-tighter transition-all duration-500 drop-shadow-md",
                                                    aWins ? "text-emerald-400" : "text-emerald-800/80"
                                                )} style={aWins ? { textShadow: '0 0 25px rgba(52,211,153,0.6)' } : {}}>{stat.valA}</span>
                                                
                                                <div className="flex flex-col items-center gap-1 mb-2">
                                                    <span className="text-[11px] md:text-sm font-black text-emerald-100 uppercase tracking-[0.4em] text-center shadow-lg bg-black/30 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                                        {stat.label}
                                                    </span>
                                                </div>
                                                
                                                <span className={cn(
                                                    "text-4xl md:text-5xl font-black tabular-nums tracking-tighter transition-all duration-500 drop-shadow-md",
                                                    bWins ? "text-emerald-400" : "text-emerald-800/80"
                                                )} style={bWins ? { textShadow: '0 0 25px rgba(52,211,153,0.6)' } : {}}>{stat.valB}</span>
                                            </div>

                                            {/* Tug of War / Possession Track Container */}
                                            <div className="relative w-full h-12 md:h-14 flex items-center">
                                                {/* The Track */}
                                                <div className="relative w-full h-4 md:h-5 bg-[#010a05] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-400 rounded-l-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                                                        style={{ width: `${ratioA}%` }} 
                                                    />
                                                    <div 
                                                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-800 via-rose-500 to-rose-400 rounded-r-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                                                        style={{ width: `${100 - ratioA}%` }} 
                                                    />
                                                </div>
                                                
                                                {/* The Football Icon sitting on the track */}
                                                <div 
                                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#f8fafc] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.9)] border-4 border-[#031B0F]"
                                                    style={{ left: `${ratioA}%` }}
                                                >
                                                    <div className="w-6 h-6 md:w-7 md:h-7 text-slate-900 drop-shadow-sm">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.61 14.85l-1.61-2.42-1.61 2.42-2.74-1.22 1.4-2.81-2.18-2.22 3.01-.66 1.12-2.67 1.12 2.67 3.01.66-2.18 2.22 1.4 2.81-2.74 1.22z"/>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
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
