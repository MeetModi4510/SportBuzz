import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeamAcronym } from "@/lib/utils";
import { ANALYSIS_PLAYERS, AnalysisPlayer, AnalysisSport } from "@/data/playerAnalysisData";
import {
    Trophy, ArrowLeft, Camera, Compass, Database, Target, User as UserIcon, Zap, CircleDot, ChevronRight, Activity, TrendingUp, Shield, Sparkles,
    Sword, ShieldAlert, ZapIcon, BarChart3, Star, Globe, Clock, Briefcase, Medal, Home, RefreshCw, Wifi, AlertTriangle, Loader2, Heart
} from "lucide-react";
import { WagonWheel } from '../components/WagonWheel';
import { usePlayerBattingStatsByName } from '@/hooks/usePlayerBattingStats';
import type { BattingFormatKey, PlayerBattingFormat } from '@/types/playerBattingTypes';
import { FORMAT_LABELS, FORMAT_COLORS } from '@/utils/playerStatsTransformer';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, PieChart, Pie, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, CartesianGrid, Legend
} from "recharts";
import { generateChartData, generateFormatBoundaryData, generateFormatRadarData } from '@/utils/playerStatsTransformer';

// Helper for flag CDN
const COUNTRY_CODE_MAP: Record<string, string> = {
    'India': 'in',
    'Australia': 'au',
    'England': 'gb',
    'South Africa': 'za',
    'New Zealand': 'nz',
    'Pakistan': 'pk',
    'Sri Lanka': 'lk',
    'Bangladesh': 'bd',
    'West Indies': 'wi', // Note: WI doesn't have a single ISO code, usually 'um' or similar is used in some APIs
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
    return `https://flagcdn.com/w80/${code}.png`;
};
import { playerApi, favoritesApi } from "@/services/api";
import { toast } from "sonner";
import { PlayerRole } from "@/data/scoringTypes";

type DetailTab = "traits" | "stats" | "awards" | "wagonwheel" | "matches";

// Format tabs for API-driven batting stats
const API_FORMAT_TABS: { key: BattingFormatKey; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'test', label: 'Test' },
    { key: 'odi', label: 'ODI' },
    { key: 't20', label: 'T20I' },
    { key: 'ipl', label: 'IPL' },
];

const CHART_TOOLTIP_STYLE = {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#e2e8f0",
    padding: "8px 12px",
};

// Skeleton loader component for stats cards
const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                    <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                        {[1, 2, 3, 4, 5, 6].map(j => (
                            <div key={j} className="p-5 flex flex-col items-center justify-center text-center gap-2">
                                <div className="h-2 w-16 bg-slate-800 rounded animate-pulse" />
                                <div className="h-6 w-12 bg-slate-700 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

// Error state component
const StatsError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="bg-slate-900/50 border border-rose-500/20 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-rose-500" />
        </div>
        <div>
            <p className="text-white font-black uppercase tracking-widest text-sm mb-1">Unable to load player statistics</p>
            <p className="text-slate-500 text-xs">{message}</p>
        </div>
        <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all flex items-center gap-2"
        >
            <RefreshCw size={12} />
            Retry
        </button>
    </div>
);

const PlayerProfilePage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine where to go back to
    const locationState = location.state as { from?: string; section?: string } | null;
    const handleBack = () => {
        if (locationState?.from === 'dashboard' && locationState?.section) {
            // Navigate back to dashboard with a hash so it scrolls to the right section
            const sectionId = locationState.section === 'trending' ? 'trending-players' : 'match-sections';
            navigate({ pathname: '/', hash: `#${sectionId}` });
        } else {
            navigate(-1);
        }
    };

    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [playerStats, setPlayerStats] = useState<any>(null);
    const [playerSport, setPlayerSport] = useState<AnalysisSport>("cricket");
    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get("ptab") as DetailTab | null;
    const [playerDetailTab, setPlayerDetailTab] = useState<DetailTab>(urlTab || "traits");
    const [playerStatsFormat, setPlayerStatsFormat] = useState<string>("All");
    const [apiBattingFormat, setApiBattingFormat] = useState<BattingFormatKey>('odi');
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(null);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // ── Dynamic Cricbuzz Batting Stats (lazy loaded, 15-min cache) ──
    const {
        battingStats: apiBattingStats,
        chartData: apiChartData,
        isLoading: isApiLoading,
        isError: isApiError,
        errorMessage: apiErrorMessage,
        refetch: refetchApiStats,
        cricbuzzId,
    } = usePlayerBattingStatsByName(name || null);

    // Determine if we have API data available
    const hasApiData = !!(apiBattingStats && (apiBattingStats.test || apiBattingStats.odi || apiBattingStats.t20 || apiBattingStats.ipl));

    // Get the currently selected API format data
    const currentApiFormat: PlayerBattingFormat | null = useMemo(() => {
        if (!apiBattingStats) return null;
        return apiBattingStats[apiBattingFormat] || null;
    }, [apiBattingStats, apiBattingFormat]);

    useEffect(() => {
        if (!selectedPlayer) return;
        
        const checkFav = async () => {
            try {
                const allFavs = await favoritesApi.get();
                if (allFavs.success) {
                    const fav = allFavs.data.find((f: any) => f.type === 'player' && f.name === selectedPlayer.name);
                    if (fav) {
                        setIsFavorite(true);
                        setFavoriteId(fav._id);
                    } else {
                        setIsFavorite(false);
                        setFavoriteId(null);
                    }
                }
            } catch (e) {
                console.error('Failed to check favorite status', e);
            }
        };
        checkFav();
    }, [selectedPlayer?.name]);

    const toggleFavorite = async () => {
        if (!selectedPlayer) return;
        setIsTogglingFavorite(true);
        
        try {
            if (isFavorite && favoriteId) {
                await favoritesApi.remove(favoriteId);
                setIsFavorite(false);
                setFavoriteId(null);
                toast.success('Removed from Favorites');
            } else {
                let imageUrl = selectedPlayer.photo ? getImageUrl(selectedPlayer.photo) : undefined;
                if (!imageUrl) {
                    // Try to get photo from ANALYSIS_PLAYERS fallback if possible
                    const mockPlayer = Object.values(ANALYSIS_PLAYERS).flat().find(p => p.name === selectedPlayer.name);
                    if (mockPlayer && mockPlayer.photo) {
                         imageUrl = mockPlayer.photo;
                    }
                }
                const res = await favoritesApi.add({
                    type: 'player',
                    itemId: selectedPlayer._id || selectedPlayer.name,
                    name: selectedPlayer.name,
                    sport: playerSport,
                    image: imageUrl
                });
                if (res.success) {
                    setIsFavorite(true);
                    setFavoriteId(res.data._id);
                    toast.success('Added to Favorites');
                }
            }
        } catch (e) {
            toast.error('Failed to update favorites');
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    // Auto-select first available format when API data arrives
    useEffect(() => {
        if (hasApiData && apiBattingStats) {
            const order: BattingFormatKey[] = ['all', 'odi', 'test', 't20', 'ipl'];
            const firstAvailable = order.find(k => apiBattingStats[k] !== null);
            if (firstAvailable) {
                setApiBattingFormat(firstAvailable);
            }
        }
    }, [hasApiData, apiBattingStats]);

    const BASE_URL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : (import.meta.env.PROD ? '' : 'http://localhost:5000');

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (path.startsWith('fp-')) {
            const id = path.split('-')[1];
            return `https://media.api-sports.io/football/players/${id}.png`;
        }
        // Use relative path directly as Vite serves the public folder at root
        return path;
    };

    const handleTabChange = (tab: DetailTab) => {
        setPlayerDetailTab(tab);
        const next = new URLSearchParams(searchParams);
        next.set("ptab", tab);
        setSearchParams(next, { replace: true });
    };

    const fetchPlayerStats = useCallback(async (playerName: string) => {
        setIsLoadingStats(true);
        try {
            // Priority 1: Check ANALYSIS_PLAYERS (Rich Mock Data)
            // It's a Record<AnalysisSport, AnalysisPlayer[]>, so we flatten it
            const allMockPlayers = Object.values(ANALYSIS_PLAYERS).flat();
            const mockPlayer = allMockPlayers.find(p => 
                p.id.toLowerCase() === playerName.toLowerCase() || 
                p.name.toLowerCase().replace(/\s+/g, '-') === playerName.toLowerCase() ||
                p.name.toLowerCase() === playerName.toLowerCase()
            );

            if (mockPlayer) {
                setPlayerSport(mockPlayer.sport);
                setPlayerStats({
                    ...mockPlayer,
                    isMock: true
                });
                
                setSelectedPlayer({
                    name: mockPlayer.name,
                    role: mockPlayer.role,
                    country: mockPlayer.country,
                    countryFlag: mockPlayer.countryFlag,
                    photo: mockPlayer.photo || mockPlayer.image,
                    rating: mockPlayer.overallRating,
                    _id: mockPlayer.id,
                    sport: mockPlayer.sport,
                    age: mockPlayer.age,
                    photo2: mockPlayer.photo2,
                    photo3: mockPlayer.photo3
                });

                if (mockPlayer.sport !== 'cricket' && playerDetailTab === 'wagonwheel') {
                    setPlayerDetailTab('traits');
                }
                return;
            }

            // Priority 2: Fallback to Backend API
            const res = await playerApi.getStats(playerName) as any;
            if (res.success || res.overall) {
                const data = res.data || res;
                setPlayerStats({
                    ...data,
                    ...(data.playerInfo || {})
                });
                
                const basicInfo = {
                    name: playerName,
                    role: data.playerInfo?.role || data.role || data.overall?.role || "Batsman",
                    battingStyle: data.playerInfo?.battingStyle || data.battingStyle || data.overall?.battingStyle || "Right-hand Bat",
                    bowlingStyle: data.playerInfo?.bowlingStyle || data.bowlingStyle || data.overall?.bowlingStyle || "None",
                    photo: data.playerInfo?.photo || data.photo || data.overall?.photo,
                    _id: data.playerInfo?._id || data._id || data.overall?._id,
                    sport: data.playerInfo?.sport || 'cricket',
                    country: data.playerInfo?.country,
                    countryFlag: data.playerInfo?.countryFlag,
                    photo2: data.playerInfo?.photo2,
                    photo3: data.playerInfo?.photo3
                };
                setSelectedPlayer(basicInfo);
                setPlayerSport(data.playerInfo?.sport || 'cricket');
            } else {
                toast.error("Could not find stats for " + playerName);
            }
        } catch (err: any) {
            console.error("Fetch player err:", err);
            toast.error(err.response?.data?.message || "Failed to load player stats");
        } finally {
            setIsLoadingStats(false);
        }
    }, [playerDetailTab]);

    useEffect(() => {
        if (name) {
            fetchPlayerStats(name);
        }
    }, [name, fetchPlayerStats]);

    if (!name) {
        return <div className="p-8 text-center text-red-500 max-w-7xl mx-auto mt-20">No player name provided</div>;
    }

    const statsRaw = playerStats?.formats?.[playerStatsFormat] ?? (playerStatsFormat === 'All' ? (playerStats?.overall || playerStats) : null) ?? playerStats?.formats?.['All'] ?? {};
    const currentStats = {
        traits: statsRaw.traits || [],
        matchesPlayed: statsRaw.matchesPlayed || playerStats?.detailedStats?.Matches || playerStats?.detailedStats?.Appearances || 0,
        batting: statsRaw.batting || { innings: 0, runs: 0, average: '0.0', strikeRate: '0.0', highestScore: '0', hundreds: 0, fifties: 0, fours: 0, sixes: 0 },
        bowling: statsRaw.bowling || { wickets: 0, economy: '0.00', average: '0.0', bestFigures: '0/0' },
        fielding: statsRaw.fielding || { catches: 0, stumpings: 0, runouts: 0, total: 0 },
        recentPerformances: statsRaw.recentPerformances || playerStats?.recentPerformances || [],
        awardsList: statsRaw.awardsList?.length > 0 ? statsRaw.awardsList : (playerStats?.milestones || []),
        awardsCount: statsRaw.awardsCount || (playerStats?.milestones?.length || 0),
        wagonWheel: statsRaw.wagonWheel || playerStats?.wagonWheel || [],
        teamsPlayedFor: playerStats?.teamsPlayedFor || []
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 h-10 w-10">
                        <ArrowLeft size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 h-10 w-10">
                        <Home size={18} />
                    </Button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">Player Profile Tracker</h2>
                    <p className="text-slate-500 text-sm">Global Career Overview</p>
                </div>
            </div>

            {selectedPlayer && (
                <div className="space-y-12 pb-20 animate-in fade-in duration-700">
                    {isLoadingStats ? (
                        <div className="h-[600px] flex flex-col items-center justify-center space-y-4 bg-slate-900/50 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Database size={20} className="text-blue-500 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Scout Data...</p>
                        </div>
                    ) : (
                        <>
                            {/* SCOUT REPORT HEADER */}
                            <div className="relative group/scout overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-700 hover:shadow-blue-500/10">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/scout:bg-blue-600/15 transition-all duration-700" />
                                <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />

                                <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="relative group/avatar">
                                        <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] bg-gradient-to-tr from-slate-700 via-slate-900 to-slate-800 p-[1px] relative overflow-hidden shadow-2xl">
                                            <div className="w-full h-full rounded-[2.9rem] bg-black flex items-center justify-center overflow-hidden">
                                                {selectedPlayer.photo ? (
                                                    <img 
                                                        src={getImageUrl(selectedPlayer.photo)} 
                                                        alt={selectedPlayer.name} 
                                                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = ""; 
                                                            (e.target as any).onerror = null;
                                                        }}
                                                    />
                                                ) : (
                                                    <UserIcon size={80} className="text-slate-900 group-hover/avatar:scale-110 transition-transform duration-700" />
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => document.getElementById(`upload-photo-${selectedPlayer.name}`)?.click()}
                                            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center shadow-xl border-4 border-slate-950 transition-all hover:scale-110 active:scale-95 z-40"
                                        >
                                            <Camera size={20} />
                                        </button>
                                        <input
                                            type="file"
                                            id={`upload-photo-${selectedPlayer.name}`}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('photo', file);
                                                    const res = await playerApi.updatePhoto(selectedPlayer._id || selectedPlayer.name, formData) as any;
                                                    if (res.data) {
                                                        setSelectedPlayer({ ...selectedPlayer, ...res.data });
                                                        toast.success("Identity visual updated");
                                                    }
                                                } catch { toast.error("Visual override failed"); }
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                            <span className="px-5 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-900/40">
                                                Professional Athlete
                                            </span>
                                            <span className="px-5 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-700">
                                                ID: {selectedPlayer._id?.toUpperCase() || 'N/A'}
                                            </span>
                                            <button 
                                                onClick={toggleFavorite}
                                                disabled={isTogglingFavorite}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border transition-all ${
                                                    isFavorite 
                                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                                                }`}
                                            >
                                                <Heart size={14} fill={isFavorite ? "currentColor" : "none"} className={isTogglingFavorite ? "animate-pulse" : ""} />
                                                {isFavorite ? 'Saved' : 'Favorite'}
                                            </button>
                                        </div>

                                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-lg">
                                            {selectedPlayer.name}
                                        </h2>

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                                            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                                                    {playerSport === 'football' ? 'Position' : playerSport === 'basketball' ? 'Position' : playerSport === 'tennis' ? 'Handedness' : 'Batting Profile'}
                                                </p>
                                                <p className="text-sm font-black text-white">
                                                    {playerSport === 'cricket' ? (selectedPlayer.battingStyle || 'Right-hand Bat') : (selectedPlayer.role || 'Professional')}
                                                </p>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                                                    {playerSport === 'football' ? 'Pref. Foot' : playerSport === 'basketball' ? 'Age' : playerSport === 'tennis' ? 'Backhand' : 'Bowling Action'}
                                                </p>
                                                <p className="text-sm font-black text-white">
                                                    {playerSport === 'cricket' ? (selectedPlayer.bowlingStyle || 'Right-arm Fast') : 
                                                     playerSport === 'basketball' ? (selectedPlayer.age || 'N/A') :
                                                     playerSport === 'tennis' ? 'Two-handed' : 'Right'}
                                                </p>
                                            </div>
                                            {playerStats.country && (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700 p-2">
                                                        {getFlagUrl(playerStats.country) ? (
                                                            <img 
                                                                src={getFlagUrl(playerStats.country)!} 
                                                                alt={playerStats.country}
                                                                className="w-full h-auto rounded-sm shadow-sm"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">{playerStats.countryFlag}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">National Origin</p>
                                                        <p className="text-lg font-black text-white uppercase tracking-wider">{playerStats.country}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="hidden lg:flex flex-col gap-3 min-w-[200px]">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                {playerSport === 'tennis' ? 'Career Titles' : playerSport === 'basketball' ? 'NBA Games' : 'Matches Played'}
                                            </p>
                                            <p className="text-3xl font-black text-white mt-1 leading-none">
                                                {playerSport === 'tennis' ? (playerStats.detailedStats?.Titles || 0) : 
                                                 playerSport === 'basketball' ? (playerStats.detailedStats?.Matches || playerStats.detailedStats?.Appearances || 0) : 
                                                 currentStats.matchesPlayed}
                                            </p>
                                        </div>
                                        <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                                                {playerSport === 'football' ? 'Total Goals' : 
                                                 playerSport === 'tennis' ? 'Grand Slams' : 
                                                 playerSport === 'basketball' ? 'Career PPG' : 'Total Runs'}
                                            </p>
                                            <p className="text-3xl font-black text-blue-100 mt-1 leading-none">
                                                {playerSport === 'football' ? (playerStats.detailedStats?.Goals || 0) : 
                                                 playerSport === 'tennis' ? (playerStats.detailedStats?.['Grand Slams'] || 0) : 
                                                 playerSport === 'basketball' ? (playerStats.detailedStats?.PPG || 0) : 
                                                 currentStats.batting.runs}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FORMAT SELECTOR & TEAMS */}
                            {playerStats && playerSport === 'cricket' && (
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-3xl relative z-20 shadow-2xl">
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                        {/* API-driven format tabs when Cricbuzz data is available */}
                                        {hasApiData ? (
                                            <>
                                                {API_FORMAT_TABS.map(fmt => {
                                                    const isAvailable = apiBattingStats?.[fmt.key] !== null;
                                                    return (
                                                        <button
                                                            key={fmt.key}
                                                            onClick={() => isAvailable && setApiBattingFormat(fmt.key)}
                                                            disabled={!isAvailable}
                                                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                                                apiBattingFormat === fmt.key && isAvailable
                                                                    ? 'text-white shadow-lg scale-105'
                                                                    : !isAvailable
                                                                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                            }`}
                                                            style={apiBattingFormat === fmt.key && isAvailable ? { backgroundColor: FORMAT_COLORS[fmt.key], boxShadow: `0 8px 25px ${FORMAT_COLORS[fmt.key]}30` } : undefined}
                                                        >
                                                            {fmt.label}
                                                        </button>
                                                    );
                                                })}
                                                {/* Data source badge */}
                                                <span className="ml-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                                    <Wifi size={8} /> Live API
                                                </span>
                                            </>
                                        ) : (
                                            /* Fallback: original mock data format tabs */
                                            ['All', 'T20', 'ODI', 'Test'].map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setPlayerStatsFormat(fmt)}
                                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${playerStatsFormat === fmt ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                                >
                                                    {fmt === 'All' ? 'Career Total' : fmt}
                                                </button>
                                            ))
                                        )}
                                        {isApiLoading && cricbuzzId && (
                                            <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                                                <Loader2 size={8} className="animate-spin" /> Loading Stats
                                            </div>
                                        )}
                                    </div>

                                    {currentStats.teamsPlayedFor?.length > 0 && (
                                        <div className="flex items-center gap-4 border-l border-slate-800 pl-6 h-10">
                                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 whitespace-nowrap">Franchises ({currentStats.teamsPlayedFor.length})</span>
                                            <div className="flex -space-x-4 hover:space-x-2 transition-all duration-300">
                                                {currentStats.teamsPlayedFor.map((team: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="group flex flex-col items-center p-0 transition-transform active:scale-95 relative"
                                                        title={team.name}
                                                    >
                                                        {team.logo ? (
                                                            <img src={getImageUrl(team.logo)} alt={team.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-900 shadow-xl group-hover:scale-110 group-hover:z-10 transition-all" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border-2 border-slate-900 shadow-xl group-hover:scale-110 group-hover:z-10 transition-all relative z-0">
                                                                {team.name ? getTeamAcronym(team.name) : '?'}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                            {team.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PLAYER NAV TABS */}
                            <div className="flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative z-20 overflow-x-auto scrollbar-hide">
                                    {[
                                        { id: 'traits', label: 'Scout Summary', icon: <Compass size={16} /> },
                                        { id: 'stats', label: 'Performance', icon: <Database size={16} /> },
                                        { id: 'matches', label: 'Match History', icon: <CircleDot size={16} /> },
                                        { id: 'awards', label: 'Milestones', icon: <Trophy size={16} /> },
                                        ...(playerSport === 'cricket' ? [{ id: 'wagonwheel', label: 'Wagon Wheel', icon: <Target size={16} /> }] : [])
                                    ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id as DetailTab)}
                                        className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 relative group overflow-hidden min-w-[140px] ${playerDetailTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {playerDetailTab === tab.id && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-in fade-in zoom-in duration-500" />
                                        )}
                                        <div className="relative z-10 flex items-center gap-3">
                                            <span className={`${playerDetailTab === tab.id ? 'scale-110 rotate-12' : 'group-hover:scale-110'} transition-all duration-500`}>
                                                {tab.icon}
                                            </span>
                                            {tab.label}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* TABS CONTENT AREA */}
                            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                                {playerDetailTab === 'traits' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-3 space-y-6">
                                            {/* Media Gallery */}
                                            {(selectedPlayer.photo || selectedPlayer.photo2 || selectedPlayer.photo3) && (
                                                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group/gallery">
                                                    <div className="relative z-10">
                                                        <h4 className="text-white text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                                            <Camera size={12} className="text-blue-500" /> Career Visuals
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            {Array.from(new Set([selectedPlayer.photo, selectedPlayer.photo2, selectedPlayer.photo3].filter(Boolean))).map((p, idx) => (
                                                                <div key={idx} className="aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden group/img relative">
                                                                    <img src={getImageUrl(p)} alt={`${selectedPlayer.name} ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                                                                        <span className="text-[8px] text-white font-black uppercase tracking-widest">Photo {idx + 1}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* STRENGTHS / ATTRIBUTES */}
                                                <Card className="bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all rounded-[2rem] overflow-hidden group/swot shadow-2xl">
                                                    <CardHeader className="bg-emerald-500/5 p-6 border-b border-emerald-500/10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                                <Zap size={20} />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest">
                                                                    {playerStats.isMock ? 'Technical Attributes' : 'Tactical Strengths'}
                                                                </CardTitle>
                                                                <CardDescription className="text-[9px] font-bold text-emerald-500/60 uppercase">Elite Scouting Observations</CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-6 space-y-4">
                                                        {playerStats.isMock && playerStats.attributes ? (
                                                            Object.entries(playerStats.attributes).map(([attr, val], i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                        <span className="text-slate-500">{attr}</span>
                                                                        <span className="text-white">{String(val)}</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : currentStats.traits.filter((t: any) => t.type === 'strength').length > 0 ? (
                                                            currentStats.traits.filter((t: any) => t.type === 'strength').map((t: any, i: number) => (
                                                                <div key={i} className="group/trait flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 hover:bg-slate-950 transition-colors">
                                                                    <span className="text-xl mt-0.5">{t.icon || '⚡'}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-white tracking-wide">{t.title}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-6 pb-2">
                                                                <CircleDot size={20} className="text-slate-700 mb-2" />
                                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed">System accumulating<br />performance data markers</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>

                                                {/* WEAKNESSES / FORM TREND */}
                                                <Card className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/40 transition-all rounded-[2rem] overflow-hidden group/swot shadow-2xl">
                                                    <CardHeader className="bg-blue-500/5 p-6 border-b border-blue-500/10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                                <Activity size={20} />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest">
                                                                    {playerStats.isMock ? 'Performance Trend' : 'Vulnerabilities'}
                                                                </CardTitle>
                                                                <CardDescription className="text-[9px] font-bold text-blue-500/60 uppercase">Historical Consistency Data</CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        {playerStats.isMock && playerStats.formTrend ? (
                                                            <div className="space-y-6">
                                                                <div className="flex items-end justify-between gap-1 h-32">
                                                                    {playerStats.formTrend.map((val: number, i: number) => (
                                                                        <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                                                                            <div 
                                                                                className="w-full bg-blue-500/40 group-hover:bg-blue-500 transition-all rounded-t-sm relative" 
                                                                                style={{ height: `${val}%` }} 
                                                                            >
                                                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-[8px] text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                                    {val}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-widest">
                                                                    <span>Past Matches</span>
                                                                    <span>Recent</span>
                                                                </div>
                                                            </div>
                                                        ) : currentStats.traits.filter((t: any) => t.type === 'weakness').length > 0 ? (
                                                            <div className="space-y-4">
                                                                {currentStats.traits.filter((t: any) => t.type === 'weakness').map((t: any, i: number) => (
                                                                    <div key={i} className="group/trait flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 hover:bg-slate-950 transition-colors">
                                                                        <span className="text-xl mt-0.5">{t.icon || '⚠️'}</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-white tracking-wide">{t.title}</p>
                                                                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-6 pb-2">
                                                                <CircleDot size={20} className="text-slate-700 mb-2" />
                                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed">Stable performance<br />trajectory maintained</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* GROWTH AREAS */}
                                            {currentStats.traits.filter((t: any) => t.type === 'growth' || t.type === 'potential').length > 0 && (
                                                <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group/dy shadow-2xl">
                                                    <div className="absolute top-0 right-0 p-20 bg-blue-600/5 blur-[100px] rounded-full -mr-10 -mt-10" />
                                                    <div className="relative z-10">
                                                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                                            <Compass size={12} /> Technical Growth Vectors
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                                                            {currentStats.traits.filter((t: any) => t.type === 'growth' || t.type === 'potential').map((t: any, idx: number) => (
                                                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border border-white/5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                                    <div>
                                                                        <p className="text-[11px] text-white font-black uppercase tracking-tight">{t.title}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-0.5">{t.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <Card className="bg-slate-900/50 border-slate-800 rounded-[2rem] p-6 h-fit">
                                            <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Activity size={12} className="text-blue-500" /> Bio-Analytics
                                            </h4>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Form Index', value: 'High Performance', icon: <TrendingUp size={14} className="text-green-500" /> },
                                                    { label: 'Match Readiness', value: '100% Elite', icon: <Zap size={14} className="text-yellow-500" /> },
                                                    { label: 'Contract Status', value: 'Active Franchise', icon: <Shield size={14} className="text-blue-500" /> }
                                                ].map((stat, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            {stat.icon}
                                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</span>
                                                        </div>
                                                        <span className="text-[10px] text-white font-black uppercase">{stat.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {playerDetailTab === 'stats' && (
                                    <div className="space-y-6">
                                        {playerSport === 'cricket' ? (
                                            <>
                                                {/* API loading state */}
                                                {isApiLoading && cricbuzzId && <StatsSkeleton />}

                                                {/* API error state */}
                                                {isApiError && cricbuzzId && !hasApiData && (
                                                    <StatsError message={apiErrorMessage || 'Failed to fetch stats'} onRetry={refetchApiStats} />
                                                )}

                                                {/* API-driven batting stats */}
                                                {hasApiData && currentApiFormat && !isApiLoading && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3" style={{ color: FORMAT_COLORS[apiBattingFormat] }}>
                                                                    <Zap size={16} /> {FORMAT_LABELS[apiBattingFormat]} Batting
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-0">
                                                                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                                    {[
                                                                        { label: 'Matches', value: currentApiFormat.matches },
                                                                        { label: 'Innings', value: currentApiFormat.innings },
                                                                        { label: 'Runs', value: currentApiFormat.runs.toLocaleString() },
                                                                        { label: 'Highest', value: currentApiFormat.highestScore },
                                                                        { label: 'Average', value: currentApiFormat.average.toFixed(2) },
                                                                        { label: 'Strike Rate', value: currentApiFormat.strikeRate.toFixed(2) },
                                                                        { label: 'Not Outs', value: currentApiFormat.notOuts },
                                                                        { label: 'Balls Faced', value: currentApiFormat.balls.toLocaleString() },
                                                                    ].map((stat, i) => (
                                                                        <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{stat.label}</span>
                                                                            <span className="text-2xl font-black text-white">{stat.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                    <Star size={16} /> Milestones & Boundaries
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-0">
                                                                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                                    {[
                                                                        { label: 'Hundreds', value: currentApiFormat.hundreds },
                                                                        { label: 'Double 100s', value: currentApiFormat.twoHundreds },
                                                                        { label: 'Fifties', value: currentApiFormat.fifties },
                                                                        { label: 'Ducks', value: currentApiFormat.ducks },
                                                                        { label: 'Fours', value: currentApiFormat.fours },
                                                                        { label: 'Sixes', value: currentApiFormat.sixes },
                                                                    ].map((stat, i) => (
                                                                        <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{stat.label}</span>
                                                                            <span className="text-2xl font-black text-white">{stat.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* Boundary Analysis Pie Chart */}
                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black text-violet-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                    <BarChart3 size={16} /> Boundary Analysis
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-4">
                                                                <ResponsiveContainer width="100%" height={200}>
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={generateFormatBoundaryData(currentApiFormat)}
                                                                            cx="50%" cy="50%"
                                                                            innerRadius={50} outerRadius={80}
                                                                            paddingAngle={3}
                                                                            dataKey="value"
                                                                            stroke="none"
                                                                        >
                                                                            {generateFormatBoundaryData(currentApiFormat).map((entry, i) => (
                                                                                <Cell key={i} fill={entry.fill} />
                                                                            ))}
                                                                        </Pie>
                                                                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                                <div className="flex justify-center gap-6 mt-2">
                                                                    {generateFormatBoundaryData(currentApiFormat).map((entry, i) => (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{entry.name}: {entry.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}

                                                {/* Cross-format charts when API data is available */}
                                                {hasApiData && apiChartData && !isApiLoading && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in fade-in duration-700">
                                                        {/* Runs by Format */}
                                                        {apiChartData.runsByFormat.length > 0 && (
                                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                                <CardHeader className="bg-slate-950 border-b border-slate-800 p-5">
                                                                    <CardTitle className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <BarChart3 size={14} /> Runs by Format
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-4">
                                                                    <ResponsiveContainer width="100%" height={220}>
                                                                        <BarChart data={apiChartData.runsByFormat} barSize={36}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                                                                            <XAxis dataKey="format" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                            <Bar dataKey="value" name="Runs" radius={[8, 8, 0, 0]}>
                                                                                {apiChartData.runsByFormat.map((entry, i) => (
                                                                                    <Cell key={i} fill={entry.fill} />
                                                                                ))}
                                                                            </Bar>
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        )}

                                                        {/* Average by Format */}
                                                        {apiChartData.averageByFormat.length > 0 && (
                                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                                <CardHeader className="bg-slate-950 border-b border-slate-800 p-5">
                                                                    <CardTitle className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <TrendingUp size={14} /> Average by Format
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-4">
                                                                    <ResponsiveContainer width="100%" height={220}>
                                                                        <BarChart data={apiChartData.averageByFormat} barSize={36}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                                                                            <XAxis dataKey="format" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                            <Bar dataKey="value" name="Average" radius={[8, 8, 0, 0]}>
                                                                                {apiChartData.averageByFormat.map((entry, i) => (
                                                                                    <Cell key={i} fill={entry.fill} />
                                                                                ))}
                                                                            </Bar>
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        )}

                                                        {/* Strike Rate Comparison (Area) */}
                                                        {apiChartData.strikeRateByFormat.length > 0 && (
                                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                                <CardHeader className="bg-slate-950 border-b border-slate-800 p-5">
                                                                    <CardTitle className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <Activity size={14} /> Strike Rate Comparison
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-4">
                                                                    <ResponsiveContainer width="100%" height={220}>
                                                                        <AreaChart data={apiChartData.strikeRateByFormat}>
                                                                            <defs>
                                                                                <linearGradient id="srGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                                                                                </linearGradient>
                                                                            </defs>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                                                                            <XAxis dataKey="format" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                            <Area type="monotone" dataKey="value" name="Strike Rate" stroke="#06b6d4" strokeWidth={2.5} fill="url(#srGrad)" dot={{ fill: '#06b6d4', r: 5 }} />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        )}

                                                        {/* 50s vs 100s */}
                                                        {apiChartData.fiftyVsHundred.length > 0 && (
                                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                                <CardHeader className="bg-slate-950 border-b border-slate-800 p-5">
                                                                    <CardTitle className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <Trophy size={14} /> Fifties vs Hundreds
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-4">
                                                                    <ResponsiveContainer width="100%" height={220}>
                                                                        <BarChart data={apiChartData.fiftyVsHundred} barSize={20}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                                                                            <XAxis dataKey="format" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                                                                            <Bar dataKey="fifties" name="Fifties" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                                                            <Bar dataKey="hundreds" name="Hundreds" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        )}

                                                        {/* Performance Radar */}
                                                        {currentApiFormat && (
                                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl md:col-span-2">
                                                                <CardHeader className="bg-slate-950 border-b border-slate-800 p-5">
                                                                    <CardTitle className="text-xs font-black text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <Compass size={14} /> Performance Radar — {FORMAT_LABELS[apiBattingFormat]}
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="p-4 flex justify-center">
                                                                    <ResponsiveContainer width="100%" height={300}>
                                                                        <RadarChart data={generateFormatRadarData(currentApiFormat, apiBattingFormat)}>
                                                                            <PolarGrid stroke="#1e293b" />
                                                                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                                            <PolarRadiusAxis tick={{ fontSize: 9, fill: '#475569' }} domain={[0, 100]} />
                                                                            <Radar name="Performance" dataKey="value" stroke={FORMAT_COLORS[apiBattingFormat]} fill={FORMAT_COLORS[apiBattingFormat]} fillOpacity={0.25} strokeWidth={2} />
                                                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                                                        </RadarChart>
                                                                    </ResponsiveContainer>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Fallback: Original mock data stats (when no API data) */}
                                                {!hasApiData && !isApiLoading && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                    <Zap size={16} /> Batting Summary
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-0">
                                                                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                                    {[
                                                                        { label: 'Innings', value: currentStats.batting.innings },
                                                                        { label: 'Runs', value: currentStats.batting.runs },
                                                                        { label: 'Highest', value: currentStats.batting.highestScore },
                                                                        { label: 'Average', value: currentStats.batting.average },
                                                                        { label: 'Strike Rate', value: currentStats.batting.strikeRate },
                                                                        { label: '100s/50s', value: `${currentStats.batting.hundreds}/${currentStats.batting.fifties}` },
                                                                        { label: 'Fours', value: currentStats.batting.fours },
                                                                        { label: 'Sixes', value: currentStats.batting.sixes }
                                                                    ].map((stat, i) => (
                                                                        <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{stat.label}</span>
                                                                            <span className="text-2xl font-black text-white">{stat.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                    <Target size={16} /> Bowling Summary
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-0">
                                                                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                                    {[
                                                                        { label: 'Innings', value: currentStats.bowling.innings || 0 },
                                                                        { label: 'Wickets', value: currentStats.bowling.wickets },
                                                                        { label: 'Economy', value: currentStats.bowling.economy },
                                                                        { label: 'Average', value: currentStats.bowling.average },
                                                                        { label: 'Best', value: currentStats.bowling.bestFigures }
                                                                    ].map((stat, i) => (
                                                                        <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{stat.label}</span>
                                                                            <span className="text-2xl font-black text-white">{stat.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                                <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                    <Shield size={16} /> Fielding / Misc
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="p-0">
                                                                <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                                    {[
                                                                        { label: 'Catches', value: currentStats.fielding.catches },
                                                                        { label: 'Stumpings', value: currentStats.fielding.stumpings },
                                                                        { label: 'Run Outs', value: currentStats.fielding.runouts },
                                                                        { label: 'Total', value: currentStats.fielding.total }
                                                                    ].map((stat, i) => (
                                                                        <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{stat.label}</span>
                                                                            <span className="text-2xl font-black text-white">{stat.value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </>
                                        ) : playerSport === 'football' ? (
                                            <>
                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Sword size={16} /> Attacking Output
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['Goals', 'Assists', 'Goals/90', 'xG', 'Shots/90'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Compass size={16} /> Clinical Precision
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        <div className="space-y-4">
                                                            {Object.entries(playerStats.specialData?.shootingZones || {}).map(([zone, val], i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                        <span className="text-slate-500">{zone}</span>
                                                                        <span className="text-white">{String(val)}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${String(val)}%` }} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <ZapIcon size={16} /> Playmaking
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['Key Passes/90', 'Dribbles/90', 'Appearances'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        ) : playerSport === 'basketball' ? (
                                            <>
                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Zap size={16} /> Scoring Metrics
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['PPG', 'FG%', '3P%', 'FT%'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Target size={16} /> Floor Presence
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['RPG', 'APG', 'SPG', 'BPG'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Clock size={16} /> Clutch Factor
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.specialData?.clutchStats || {}).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        ) : (
                                            <>
                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Trophy size={16} /> Career Success
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['Titles', 'Grand Slams', 'Win%', 'Weeks at No.1'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Activity size={16} /> Service Stats
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/50">
                                                            {Object.entries(playerStats.detailedStats || {}).filter(([k]) => ['Aces', '1st Serve%', 'Break Pts Won%', 'Prize Money ($M)'].includes(k)).map(([label, value], i) => (
                                                                <div key={i} className="p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/20 transition-colors">
                                                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{label}</span>
                                                                    <span className="text-2xl font-black text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                                                        <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                            <Compass size={16} /> Surface Win Rates
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        <div className="space-y-4">
                                                            {Object.entries(playerStats.specialData?.surfaceWinRate || {}).map(([surface, val]: [any, any], i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                        <span className="text-slate-500">{surface}</span>
                                                                        <span className="text-white">{val}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        )}
                                    </div>
                                )}

                                {playerDetailTab === 'matches' && (
                                    <div className="space-y-4">
                                        {currentStats.recentPerformances.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {currentStats.recentPerformances.map((perf: any, i: number) => (
                                                    <div key={i} className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm overflow-hidden relative">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
                                                        
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] font-black tracking-tighter shadow-xl ${perf.result === 'Win' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'}`}>
                                                                    <span className="leading-none mb-1">M{currentStats.recentPerformances.length - i}</span>
                                                                    <span className="uppercase text-[8px] tracking-widest">{perf.result || 'PLAYED'}</span>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                                                        {perf.opponent ? `vs ${perf.opponent}` : "Competition Match"}
                                                                        {perf.matchType && <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[8px] tracking-[0.2em]">{perf.matchType}</span>}
                                                                    </h5>
                                                                    <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{perf.date || 'Recent Encounter'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-8 md:gap-12 bg-slate-950/50 px-8 py-4 rounded-2xl border border-white/5">
                                                                {perf.batting && (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black text-white">{perf.batting.runs ?? 0}</span>
                                                                            <span className="text-[10px] font-black text-slate-600">({perf.batting.balls ?? 0})</span>
                                                                        </div>
                                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Batting Performance</p>
                                                                    </div>
                                                                )}
                                                                {perf.bowling && (
                                                                    <div className="flex flex-col items-center border-l border-slate-800 pl-8 md:pl-12">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black text-blue-400">{perf.bowling.wickets ?? 0}</span>
                                                                            <span className="text-[10px] font-black text-slate-600">W</span>
                                                                        </div>
                                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Bowling Spells</p>
                                                                    </div>
                                                                )}
                                                                {perf.stats && (
                                                                    <div className="flex items-center gap-8 border-l border-slate-800 pl-8 md:pl-12">
                                                                        {Object.entries(perf.stats).map(([k, v], idx) => (
                                                                            <div key={idx} className="flex flex-col items-center">
                                                                                <span className="text-xl font-black text-white">{String(v)}</span>
                                                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">{k}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col items-center border-l border-slate-800 pl-8 md:pl-12">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-xl font-black text-yellow-500">{perf.impactScore || 'L-1'}</span>
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Impact Rating</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800">
                                                <CircleDot size={40} className="text-slate-700 mb-4 opacity-50" />
                                                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No Match Log Data</p>
                                                <p className="text-slate-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Awaiting synchronization with live scorecards</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {playerDetailTab === 'awards' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Card className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center text-center shadow-lg relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                                                <Database size={24} className="text-yellow-500 mx-auto mb-3 opacity-50" />
                                                <p className="text-4xl font-black text-white mb-1 relative z-10">{currentStats.awardsCount}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold relative z-10">Total Accolades</p>
                                            </Card>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentStats.awardsList.length > 0 ? (
                                                currentStats.awardsList.map((award: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 transition-transform shadow-inner">
                                                            {award.icon || (award.year ? (award.year > 2020 ? '🏆' : '🏅') : '⭐')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-sm font-black text-white uppercase tracking-wider truncate">
                                                                    {award.title || award.event}
                                                                </p>
                                                                {award.title && (
                                                                    <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest rounded border border-yellow-500/20">
                                                                        Major
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-tight">
                                                                {award.title ? award.event : (award.reason || `Achieved in ${award.year}`)}
                                                            </p>
                                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                                                <Clock size={10} /> {award.year} Season
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-20 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center">
                                                    <Trophy size={40} className="text-slate-700 mb-4 opacity-50" />
                                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Honors synchronization pending</p>
                                                    <p className="text-slate-600 mt-2 text-[10px] font-black uppercase tracking-widest leading-relaxed">System awaiting first milestone triggers<br />from regional tournaments</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {playerDetailTab === 'wagonwheel' && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 min-h-[600px] flex items-center justify-center overflow-hidden">
                                        {currentStats.wagonWheel && currentStats.wagonWheel.length > 0 ? (
                                            <div className="w-full max-w-4xl h-[750px]">
                                                <WagonWheel
                                                    balls={currentStats.wagonWheel}
                                                    playerName={selectedPlayer?.name}
                                                    size={550}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-500 h-full py-20">
                                                <Target size={40} className="mb-4 opacity-50" />
                                                <p className="font-black uppercase tracking-widest text-sm text-slate-400">Tactical Map Unavailable</p>
                                                <p className="text-[10px] mt-2 font-bold uppercase tracking-widest text-slate-600 text-center leading-relaxed">Spatial hitting data markers will synchronize<br />once ball-by-ball analysis is complete</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerProfilePage;
