import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Home, Shield, Goal, CreditCard, Trophy,
    Swords, Calendar, TrendingUp, Star, Shirt, CircleDot,
    Footprints, BarChart3, Activity, Loader2, Target,
    User as UserIcon, ChevronRight, Zap, ShieldAlert
} from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";

export default function FootballPlayerProfile() {
    const { teamId, playerName } = useParams<{ teamId: string; playerName: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [teamData, setTeamData] = useState<any>(null);
    const [player, setPlayer] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [matchHistory, setMatchHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!teamId || !playerName) return;
            try {
                const res: any = await footballApi.getTeamById(teamId);
                if (res.success) {
                    setTeamData(res.data);
                    const decodedName = decodeURIComponent(playerName);
                    const foundPlayer = res.data.team.players?.find(
                        (p: any) => p.name.toLowerCase() === decodedName.toLowerCase()
                    );
                    if (foundPlayer) {
                        setPlayer(foundPlayer);
                        setStats(res.data.playerStats[foundPlayer.name] || { goals: 0, yellowCards: 0, redCards: 0 });

                        // Build match history for this player
                        const history = res.data.matches
                            .filter((m: any) => m.status === 'Completed')
                            .map((m: any) => {
                                const isHome = m.homeTeam._id === teamId;
                                const teamScore = isHome ? m.score.home : m.score.away;
                                const oppScore = isHome ? m.score.away : m.score.home;
                                const opponent = isHome ? m.awayTeam : m.homeTeam;
                                const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';

                                // Get events for this player in this match
                                const playerEvents = m.events.filter(
                                    (e: any) => e.player === foundPlayer.name && 
                                    (e.team?.toString() === teamId || e.team?._id?.toString() === teamId)
                                );

                                const goals = playerEvents.filter((e: any) => e.type === 'Goal').length;
                                const assists = m.events.filter(
                                    (e: any) => e.assister === foundPlayer.name
                                ).length;
                                const yellows = playerEvents.filter((e: any) => e.type === 'YellowCard').length;
                                const reds = playerEvents.filter((e: any) => e.type === 'RedCard').length;

                                return {
                                    matchId: m._id,
                                    opponent,
                                    score: `${m.score.home}-${m.score.away}`,
                                    result,
                                    date: m.matchDate,
                                    goals,
                                    assists,
                                    yellows,
                                    reds,
                                    isHome,
                                    tournament: m.tournamentId?.name || 'League'
                                };
                            })
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        setMatchHistory(history);
                    }
                }
            } catch (err) {
                toast.error("Failed to load player data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [teamId, playerName]);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c]">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <UserIcon size={20} className="text-blue-500 animate-pulse" />
                    </div>
                </div>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Scout Data...</p>
            </div>
        </div>
    );

    if (!player || !teamData) return (
        <div className="min-h-screen bg-[#0a0a0c]">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-white">
                <ShieldAlert className="text-slate-700" size={80} />
                <h1 className="text-2xl font-black uppercase tracking-wider">Player Not Found</h1>
                <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-500 rounded-2xl">Go Back</Button>
            </div>
        </div>
    );

    const { team, matches, recentForm } = teamData;
    const totalGoals = stats?.goals || 0;
    const totalAssists = matchHistory.reduce((sum, m) => sum + m.assists, 0);
    const totalYellows = stats?.yellowCards || 0;
    const totalReds = stats?.redCards || 0;
    const matchesPlayed = matchHistory.length;
    const goalsPerMatch = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(2) : '0.00';
    const wins = matchHistory.filter(m => m.result === 'W').length;
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-blue-500/30">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-7xl space-y-12 pb-20">
                {/* Header Nav */}
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 h-10 w-10">
                            <ArrowLeft size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 h-10 w-10">
                            <Home size={18} />
                        </Button>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-wide">Player Profile</h2>
                        <p className="text-slate-500 text-sm">Football Career Overview</p>
                    </div>
                </div>

                {/* ===== SCOUT REPORT HEADER ===== */}
                <div className="relative group/scout overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-700 hover:shadow-blue-500/10">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/scout:bg-blue-600/15 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-600/5 blur-[80px] rounded-full -ml-20 -mb-20" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />

                    <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row items-center gap-10">
                        {/* Jersey Number Badge */}
                        <div className="relative group/avatar">
                            <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] bg-gradient-to-br from-blue-600/30 via-blue-800/40 to-blue-950/60 p-[1px] relative overflow-hidden shadow-2xl">
                                <div className="w-full h-full rounded-[2.9rem] bg-black flex items-center justify-center overflow-hidden">
                                    <div className="text-center">
                                        <p className="text-7xl md:text-8xl font-black italic text-blue-400 drop-shadow-[0_0_40px_rgba(59,130,246,0.3)] leading-none">
                                            #{player.number}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/60 mt-2">{player.role}</p>
                                    </div>
                                </div>
                            </div>
                            {player.isCaptain && (
                                <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 border-2 border-yellow-400 rotate-12 group-hover/avatar:rotate-0 transition-transform">
                                    <Star size={22} className="text-yellow-900 fill-yellow-900" />
                                </div>
                            )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                <span className="px-5 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-900/40">
                                    Professional Athlete
                                </span>
                                <span className="px-5 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-700">
                                    ⚽ Football
                                </span>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-lg">
                                {player.name}
                            </h2>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                                <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Position</p>
                                    <p className="text-sm font-black text-white">{player.role}</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Jersey</p>
                                    <p className="text-sm font-black text-white">#{player.number}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700 overflow-hidden p-2">
                                        {team.logo ? (
                                            <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Trophy size={20} className="text-blue-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Club</p>
                                        <p className="text-lg font-black text-white uppercase tracking-wider">{team.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats column */}
                        <div className="hidden lg:flex flex-col gap-3 min-w-[200px]">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Matches Played</p>
                                <p className="text-3xl font-black text-white mt-1 leading-none">{matchesPlayed}</p>
                            </div>
                            <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Total Goals</p>
                                <p className="text-3xl font-black text-blue-100 mt-1 leading-none">{totalGoals}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== KEY STATS GRID ===== */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Goals', value: totalGoals, icon: Goal, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Assists', value: totalAssists, icon: Footprints, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { label: 'Yellow Cards', value: totalYellows, icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                        { label: 'Red Cards', value: totalReds, icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                        { label: 'Goals/Match', value: goalsPerMatch, icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] ${stat.bg} border ${stat.border} text-center space-y-3 group hover:scale-105 transition-all duration-300`}>
                            <stat.icon className={`${stat.color} mx-auto group-hover:rotate-12 transition-transform duration-300`} size={28} />
                            <p className={`text-3xl font-black italic ${stat.color}`}>{stat.value}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ===== PERFORMANCE BARS + FORM ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Breakdown */}
                    <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                            <CardTitle className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <BarChart3 size={16} /> Performance Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {[
                                { label: 'Attacking', value: Math.min((totalGoals * 10 + totalAssists * 5), 100), color: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
                                { label: 'Discipline', value: Math.max(100 - (totalYellows * 15 + totalReds * 35), 0), color: 'bg-blue-500', glow: 'shadow-blue-500/30' },
                                { label: 'Consistency', value: matchesPlayed > 0 ? Math.min(matchesPlayed * 12, 100) : 0, color: 'bg-purple-500', glow: 'shadow-purple-500/30' },
                                { label: 'Win Contribution', value: winRate, color: 'bg-yellow-500', glow: 'shadow-yellow-500/30' },
                                { label: 'Goal Threat', value: Math.min(totalGoals * 15, 100), color: 'bg-rose-500', glow: 'shadow-rose-500/30' },
                            ].map((bar, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em]">
                                        <span className="text-slate-400">{bar.label}</span>
                                        <span className="text-white">{Math.round(bar.value)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${bar.color} rounded-full shadow-lg ${bar.glow} transition-all duration-1000`}
                                            style={{ width: `${bar.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Form */}
                    <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                            <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Activity size={16} /> Form & Bio Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {/* Form Indicator */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Recent Form</p>
                                <div className="flex gap-2">
                                    {matchHistory.slice(0, 10).map((m, i) => (
                                        <div
                                            key={i}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-transform hover:scale-110 ${
                                                m.result === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                m.result === 'L' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                            }`}
                                            title={`${m.opponent?.name} (${m.score})`}
                                        >
                                            {m.result}
                                        </div>
                                    ))}
                                    {matchHistory.length === 0 && (
                                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No matches yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Bio Details */}
                            <div className="space-y-4">
                                {[
                                    { label: 'Form Index', value: winRate >= 60 ? 'High Performance' : winRate >= 40 ? 'Moderate' : 'Building', icon: <TrendingUp size={14} className={winRate >= 60 ? 'text-green-500' : 'text-yellow-500'} /> },
                                    { label: 'Match Readiness', value: matchesPlayed > 0 ? '100% Active' : 'Awaiting Debut', icon: <Zap size={14} className="text-yellow-500" /> },
                                    { label: 'Contract Status', value: 'Active Franchise', icon: <Shield size={14} className="text-blue-500" /> },
                                    { label: 'Captaincy', value: player.isCaptain ? 'Team Captain ©' : 'Squad Player', icon: <Star size={14} className={player.isCaptain ? 'text-yellow-500' : 'text-slate-500'} /> },
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
                        </CardContent>
                    </Card>
                </div>

                {/* ===== MATCH HISTORY TABLE ===== */}
                <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <CardHeader className="bg-slate-950 border-b border-slate-800 p-6">
                        <CardTitle className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <CircleDot size={16} /> Match History ({matchHistory.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {matchHistory.length > 0 ? (
                            <div className="divide-y divide-slate-800/50">
                                {matchHistory.map((m, i) => (
                                    <div
                                        key={i}
                                        className="p-5 flex items-center justify-between hover:bg-slate-800/20 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/football/match/result/${m.matchId}`)}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                                m.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
                                                m.result === 'L' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {m.result}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.isHome ? 'HOME' : 'AWAY'} vs</span>
                                                    <span className="font-black text-white uppercase tracking-tight truncate">{m.opponent?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(m.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-600">{m.tournament}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black italic tracking-tighter tabular-nums text-white">{m.score}</span>
                                            <div className="flex gap-2 ml-4 text-[10px] font-black uppercase tracking-widest">
                                                {m.goals > 0 && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">⚽ {m.goals}</span>}
                                                {m.assists > 0 && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">🅰 {m.assists}</span>}
                                                {m.yellows > 0 && <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg border border-yellow-500/20">🟨 {m.yellows}</span>}
                                                {m.reds > 0 && <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">🟥 {m.reds}</span>}
                                            </div>
                                            <ChevronRight size={16} className="text-slate-700 group-hover:text-blue-400 transition-colors ml-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <Swords className="mx-auto text-slate-800 mb-4" size={48} />
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No match history available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ===== DISCIPLINARY RECORD ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <Goal className="text-emerald-400" size={32} />
                            </div>
                            <div>
                                <p className="text-5xl font-black italic text-emerald-400">{totalGoals}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Career Goals</p>
                            </div>
                            <div className="h-px bg-slate-800" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {goalsPerMatch} per match
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                                <CreditCard className="text-yellow-400" size={32} />
                            </div>
                            <div>
                                <p className="text-5xl font-black italic text-yellow-400">{totalYellows}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Yellow Cards</p>
                            </div>
                            <div className="h-px bg-slate-800" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {matchesPlayed > 0 ? (totalYellows / matchesPlayed).toFixed(2) : '0.00'} per match
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center">
                                <ShieldAlert className="text-red-400" size={32} />
                            </div>
                            <div>
                                <p className="text-5xl font-black italic text-red-400">{totalReds}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Red Cards</p>
                            </div>
                            <div className="h-px bg-slate-800" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Discipline Record
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
