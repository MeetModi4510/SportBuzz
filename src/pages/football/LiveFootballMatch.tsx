import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Trophy, Timer, Users, History, Activity, Zap, BarChart3, Shield, Swords, 
    PieChart, Info, Circle, Square, Flag, AlertCircle, CheckCircle2, Loader2, 
    ArrowLeft, LayoutDashboard, MapPin, User, ArrowRightLeft, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell 
} from "recharts";
import { footballApi } from "@/services/api";
import { getSocket } from "@/services/socket";
import { FootballPitchLineup } from "@/components/FootballPitchLineup";
import { toast } from "sonner";

export default function LiveFootballMatch() {
    const { id } = useParams();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const receivedSocketUpdate = useRef(false);
    const lastUpdateTimestamp = useRef<Date>(new Date());
    const [displayTime, setDisplayTime] = useState("00:00");

    const summarizePlayerEvents = (playerName: string, events: any[], teamGoalsConceded: number = 0) => {
        const playerEvents = {
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            saves: 0,
            fouls: 0,
            shotsOnTarget: 0,
            corners: 0,
            teamGoalsConceded,
            substitution: undefined as { inMinute?: number; outMinute?: number; isInjured?: boolean } | undefined
        };

        events?.forEach(event => {
            if (event.player === playerName) {
                if (event.type === 'Goal') playerEvents.goals++;
                if (event.type === 'YellowCard') playerEvents.yellowCards++;
                if (event.type === 'RedCard') playerEvents.redCards++;
                if (event.type === 'Save') playerEvents.saves++;
                if (event.type === 'Foul') playerEvents.fouls++;
                if (event.type === 'ShotOnTarget') playerEvents.shotsOnTarget++;
                if (event.type === 'Corner') playerEvents.corners++;
            }
            if (event.type === 'Goal' && event.assister === playerName) playerEvents.assists++;
            if (event.type === 'Substitution') {
                if (event.player === playerName) {
                    playerEvents.substitution = { ...playerEvents.substitution, inMinute: event.minute };
                } else if (event.playerOut === playerName) {
                    playerEvents.substitution = { ...playerEvents.substitution, outMinute: event.minute, isInjured: event.commentary?.toLowerCase().includes('injur') };
                }
            }
        });

        return playerEvents;
    };

    const formatTime = (totalSeconds: number, currentHalf: number = 1) => {
        const totalMins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;

        if (currentHalf === 1 && totalMins >= 45) {
            const extra = totalMins - 45;
            return `45:${secs < 10 ? '0' : ''}${secs} +${extra}`;
        }
        if (currentHalf === 2 && totalMins >= 90) {
            const extra = totalMins - 90;
            return `90:${secs < 10 ? '0' : ''}${secs} +${extra}`;
        }

        return `${totalMins < 10 ? '0' : ''}${totalMins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const res: any = await footballApi.getMatchById(id!);
                if (res.success && !receivedSocketUpdate.current) {
                    console.log("[DEBUG] Applying initial fetch data");
                    setMatch(res.data);
                } else if (res.success) {
                    console.log("[DEBUG] Initial fetch completed but ignored because socket update already arrived");
                }
            } catch (error) {
                console.error("Match fetch failed");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMatch();

        const socket = getSocket();
        
        const joinRoom = () => {
            console.log(`[SOCKET] Joining football match room: ${id}`);
            socket.emit("join_football_match", id);
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on("connect", joinRoom);
        
        socket.on("football_update", (updatedMatch) => {
            console.log("[SOCKET] Received football update:", updatedMatch._id);
            receivedSocketUpdate.current = true;
            lastUpdateTimestamp.current = new Date();
            setMatch(updatedMatch);
        });

        return () => {
            socket.off("connect", joinRoom);
            socket.emit("leave_football_match", id);
            socket.off("football_update");
        };
    }, [id]);

    useEffect(() => {
        let interval: any;
        if (match?.timer?.isRunning && match?.timer?.startTime) {
            interval = setInterval(() => {
                const start = new Date(match.timer.startTime).getTime();
                const now = Date.now();
                const totalSecs = (match.timer.currentMinute * 60) + Math.floor((now - start) / 1000);
                setDisplayTime(formatTime(totalSecs, match.timer.half));
            }, 1000);
        } else if (match?.timer) {
            setDisplayTime(formatTime(match.timer.currentMinute * 60, match.timer.half));
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [match?.timer?.isRunning, match?.timer?.startTime, match?.timer?.currentMinute, match?.timer?.half]);

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

    if (!match) return <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-center p-8"><h1 className="text-2xl font-bold text-white">Match Not Found</h1><p className="text-slate-500 max-w-md">The match you're looking for was not found or has been removed.</p></div>;

    // Safety check for unpopulated or missing teams
    if (!match.homeTeam || !match.awayTeam || typeof match.homeTeam === 'string' || typeof match.awayTeam === 'string') {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-3xl">
                    <Loader2 className="mx-auto text-blue-500 mb-8 animate-spin" size={48} />
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Match Setup Pending</h1>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">This match is in our system, but teams haven't been fully assigned or loaded yet. Check back soon!</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#2563eb', '#ea580c'];

    const formatEventMinute = (minute: number, half: number) => {
        if (half === 1 && minute >= 45) {
            return `45 +${minute - 45}`;
        }
        if (half === 2 && minute >= 90) {
            return `90 +${minute - 90}`;
        }
        return `${minute}'`;
    };

    return (
        <div className="min-h-screen bg-[#070709] text-white">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 py-12">
                {match.tournamentId && (
                    <Link 
                        to={`/football/tournament/${match.tournamentId}`}
                        className="inline-flex items-center gap-2 mb-8 px-6 py-2 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors group"
                    >
                        <ArrowLeft size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Back to Tournament</span>
                    </Link>
                )}

                {/* Cinema Scoreboard */}
                <div className="relative mb-12 rounded-[4rem] overflow-hidden bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-white/5 shadow-2xl backdrop-blur-3xl p-16">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
                        {/* Home */}
                        <div className="flex flex-col items-center gap-6 flex-1 group">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-700">
                                {match.homeTeam.logo ? <img src={match.homeTeam.logo} /> : <Users size={60} className="text-slate-800" />}
                            </div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-center leading-none">{match.homeTeam.name}</h2>
                            <div className="mt-2 flex flex-col items-center gap-1">
                                {match.events?.filter((e: any) => e.type === 'Goal' && String(e.team?._id || e.team) === String(match.homeTeam._id)).map((e: any, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic animate-in fade-in slide-in-from-top-2 duration-500">
                                        {e.player} {formatEventMinute(e.minute, e.half)} {e.goalType === 'Penalty' && <span className="text-blue-500">(P)</span>}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Mid Section */}
                        <div className="flex flex-col items-center gap-8">
                             <div className="px-6 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Live Transmission</div>
                             
                             <div className="flex items-center gap-12">
                                <span className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{match.score?.home ?? 0}</span>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                                </div>
                                <span className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30_rgba(255,255,255,0.2)]">{match.score?.away ?? 0}</span>
                             </div>

                             <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 text-4xl font-black italic tabular-nums tracking-tighter">
                                    <Timer className={match.timer?.isRunning ? "text-green-500 animate-pulse" : "text-slate-600"} size={28} />
                                    <span>{displayTime}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                        {match.timer?.halfStatus === 'FirstHalf' ? '1st Half' : 
                                         match.timer?.halfStatus === 'HalfTime' ? 'Half Time' :
                                         match.timer?.halfStatus === 'SecondHalf' ? '2nd Half' : 'Full Time'}
                                    </span>
                                    {match.timer?.injuryTime > 0 && <span className="text-orange-500 font-black italic text-[10px] tracking-widest">+{match.timer.injuryTime}' ET</span>}
                                </div>
                             </div>
                        </div>

                        {/* Away */}
                        <div className="flex flex-col items-center gap-6 flex-1 group">
                             <div className="w-40 h-40 rounded-[2.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] group-hover:scale-105 transition-transform duration-700">
                                {match.awayTeam.logo ? <img src={match.awayTeam.logo} /> : <Users size={60} className="text-slate-800" />}
                             </div>
                             <h2 className="text-4xl font-black italic uppercase tracking-tighter text-center leading-none">{match.awayTeam.name}</h2>
                             <div className="mt-2 flex flex-col items-center gap-1">
                                {match.events?.filter((e: any) => e.type === 'Goal' && String(e.team?._id || e.team) === String(match.awayTeam._id)).map((e: any, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic animate-in fade-in slide-in-from-top-2 duration-500">
                                        {e.player} {formatEventMinute(e.minute, e.half)} {e.goalType === 'Penalty' && <span className="text-orange-500">(P)</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="live" className="space-y-12">
                    <TabsList className="bg-slate-900/40 border border-white/5 p-1 h-14 rounded-2xl backdrop-blur-xl">
                        <TabsTrigger value="overview" className="rounded-xl px-8 h-full font-black italic uppercase tracking-widest text-[10px] data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all gap-2">
                            <LayoutDashboard size={14} /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="live" className="rounded-xl px-8 h-full font-black italic uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                            <Zap size={14} /> Live Narrative
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-xl px-8 h-full font-black italic uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                            <BarChart3 size={14} /> Data Stream
                        </TabsTrigger>
                        <TabsTrigger value="lab" className="rounded-xl px-8 h-full font-black italic uppercase tracking-widest text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all gap-2">
                            <Activity size={14} /> Performance Lab
                        </TabsTrigger>
                        <TabsTrigger value="lineups" className="rounded-xl px-8 h-full font-black italic uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                            <Users size={14} /> Tactical Lineups
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-12">
                                {/* Live Pulse Summary */}
                                <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950 border-slate-800 rounded-[3rem] p-10 border overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Zap className="text-blue-500/20 group-hover:text-blue-500/40 transition-colors" size={120} />
                                    </div>
                                    <div className="relative z-10 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                                                <Activity size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 leading-none mb-2">Match Insights</h3>
                                                <p className="text-2xl font-black italic uppercase tracking-tight">Live Pulse Index</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Winning Probability</span>
                                                <div className="flex gap-4">
                                                    <span className="text-sm font-black text-blue-500 italic">H {match.performance?.winProbability?.home || 45}%</span>
                                                    <span className="text-sm font-black text-slate-500 italic">D {match.performance?.winProbability?.draw || 25}%</span>
                                                    <span className="text-sm font-black text-orange-500 italic">A {match.performance?.winProbability?.away || 30}%</span>
                                                </div>
                                            </div>
                                            <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-white/5 p-1">
                                                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ width: `${match.performance?.winProbability?.home || 45}%` }} />
                                                <div className="h-full bg-slate-700 mx-1 rounded-full transition-all duration-1000" style={{ width: `${match.performance?.winProbability?.draw || 25}%` }} />
                                                <div className="h-full bg-orange-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(234,88,12,0.4)]" style={{ width: `${match.performance?.winProbability?.away || 30}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Match Pressure</p>
                                                <div className="flex items-end gap-3">
                                                    <p className="text-4xl font-black italic tracking-tighter text-blue-500">{match.performance?.pressureIndex || '5.0'}</p>
                                                    <span className={`text-[10px] font-black uppercase mb-1.5 ${match.performance?.pressureIndex > 7 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {match.performance?.pressureIndex > 7 ? 'High' : 'Stable'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Latest Action</p>
                                                <div className="flex items-end gap-3">
                                                    <p className="text-4xl font-black italic tracking-tighter text-orange-500">{match.events?.length || 0}</p>
                                                    <span className="text-[10px] font-black uppercase text-slate-600 mb-1.5">Total Events</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Key Statistics Grid */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 border">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
                                            <BarChart3 size={24} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight">Key Performance Stats</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {[
                                            { label: 'Possession', home: match.stats?.possession?.home, away: match.stats?.possession?.away, icon: <Activity size={16} /> },
                                            { label: 'Shots (On)', home: match.stats?.shotsOnTarget?.home, away: match.stats?.shotsOnTarget?.away, icon: <Zap size={16} /> },
                                            { label: 'Corners', home: match.stats?.corners?.home, away: match.stats?.corners?.away, icon: <Flag size={16} /> },
                                            { label: 'Total Fouls', home: match.stats?.fouls?.home, away: match.stats?.fouls?.away, icon: <AlertCircle size={16} /> },
                                            { label: 'Offsides', home: match.stats?.offsides?.home, away: match.stats?.offsides?.away, icon: <Shield size={16} /> },
                                            { label: 'Saves', home: match.stats?.saves?.home, away: match.stats?.saves?.away, icon: <CheckCircle2 size={16} /> }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all">
                                                <div className="flex items-center gap-2 mb-4 text-slate-500">
                                                    {stat.icon}
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-2xl font-black italic text-blue-500">{stat.home}</span>
                                                        <span className="text-[8px] font-bold text-slate-700 uppercase">{match.homeTeam?.name?.slice(0, 3) || 'HOM'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-2xl font-black italic text-orange-500">{stat.away}</span>
                                                        <span className="text-[8px] font-bold text-slate-700 uppercase">{match.awayTeam?.name?.slice(0, 3) || 'AWA'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Match Key Moments Timeline */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 border overflow-hidden">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                                                <History size={24} />
                                            </div>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tight">Critical Timeline</h3>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/5 px-4 py-1.5 rounded-full bg-slate-950/40">90 MINS PLAYED</span>
                                    </div>

                                    <div className="relative h-24 mt-8">
                                        {/* Timeline Base */}
                                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800/50 rounded-full -translate-y-1/2" />
                                        
                                        {/* Half-time marker */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-slate-700 rounded-full z-10" />
                                        
                                        {/* Events */}
                                        {match.events?.filter((e: any) => ['Goal', 'RedCard', 'YellowCard', 'Substitution'].includes(e.type)).map((event: any, i: number) => {
                                            const isHome = String(event.team?._id || event.team) === String(match.homeTeam._id);
                                            const position = (event.minute / 90) * 100;
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center group/event`}
                                                    style={{ left: `${Math.min(95, Math.max(5, position))}%` }}
                                                >
                                                    <div className={`mb-3 transition-transform group-hover/event:-translate-y-1 duration-300`}>
                                                        {event.type === 'Goal' && <Trophy size={16} className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                                                        {event.type === 'YellowCard' && <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm shadow-lg" />}
                                                        {event.type === 'RedCard' && <div className="w-2.5 h-3.5 bg-red-600 rounded-sm shadow-lg" />}
                                                        {event.type === 'Substitution' && <ArrowRightLeft size={14} className="text-purple-500" />}
                                                    </div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isHome ? 'bg-blue-500' : 'bg-orange-500'} ring-4 ring-slate-950`} />
                                                    <div className={`mt-3 opacity-0 group-hover/event:opacity-100 transition-opacity absolute top-full flex flex-col items-center pointer-events-none`}>
                                                        <span className="text-[8px] font-black text-white whitespace-nowrap bg-slate-900/90 px-2 py-1 rounded-md border border-white/10 uppercase italic">
                                                            {event.minute}' {event.player?.split(' ').pop() || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-widest text-slate-600 px-2">
                                        <span>KICK OFF</span>
                                        <span>HALF TIME</span>
                                        <span>FULL TIME</span>
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-12">
                                {/* Match Essentials */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 border relative overflow-hidden group">
                                    <div className="relative z-10 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-500">
                                                <Info size={24} />
                                            </div>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tight">Match Info</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-[1.5rem] border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Stadium Venue</p>
                                                    <p className="text-sm font-bold text-white uppercase">{match.venue || 'International Arena'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-[1.5rem] border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Referee</p>
                                                    <p className="text-sm font-bold text-white uppercase">{match.referee || 'Michael Oliver'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-[1.5rem] border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                                                    <Trophy size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Competition</p>
                                                    <p className="text-sm font-bold text-white uppercase">{match.tournament?.name || 'Elite Champions League'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4">Venue Capacity</p>
                                            <div className="flex items-center justify-between font-bold text-xs uppercase px-2 text-white">
                                                <span>Attendance</span>
                                                <span className="text-indigo-400">Sold Out</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Form Guide Card */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 border bg-gradient-to-br from-slate-900/40 to-slate-950/80">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8 px-2">Recent Performance</h3>
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-xs font-black uppercase tracking-widest text-blue-500">{match.homeTeam?.name?.slice(0, 12) || 'Home Team'}</span>
                                            <div className="flex gap-2">
                                                {['W', 'D', 'W', 'W', 'L'].map((r, i) => (
                                                    <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border ${r === 'W' ? 'bg-green-500/20 text-green-500 border-green-500/30' : r === 'L' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                        {r}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-xs font-black uppercase tracking-widest text-orange-500">{match.awayTeam?.name?.slice(0, 12) || 'Away Team'}</span>
                                            <div className="flex gap-2">
                                                {['L', 'L', 'D', 'W', 'L'].map((r, i) => (
                                                    <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border ${r === 'W' ? 'bg-green-500/20 text-green-500 border-green-500/30' : r === 'L' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                        {r}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="live" className="space-y-12">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <History className="text-blue-500" size={24} />
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight">Match Narrative</h3>
                                </div>
                                <div className="grid gap-4">
                                    {match.events?.length === 0 && <p className="p-20 text-center text-slate-700 italic border-2 border-dashed border-white/5 rounded-[3rem] uppercase font-black text-xs tracking-widest">Awaiting breakthrough on the field...</p>}
                                    {match.events?.slice().reverse().map((event: any, i: number) => {
                                        const isHome = String(event.team?._id || event.team) === String(match.homeTeam._id);
                                        const accentColor = isHome ? 'bg-blue-600' : 'bg-orange-600';
                                        
                                        const formatEventType = (type: string) => {
                                            const formatted = type.replace(/([A-Z])/g, ' $1').trim();
                                            return formatted;
                                        };

                                        const getEventGlow = (type: string) => {
                                            switch(type) {
                                                case 'Goal': return 'after:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0%,transparent_70%)]';
                                                case 'RedCard': return 'after:bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)]';
                                                case 'YellowCard': return 'after:bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.05)_0%,transparent_70%)]';
                                                default: return isHome ? 'after:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]' : 'after:bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.05)_0%,transparent_70%)]';
                                            }
                                        };

                                        return (
                                            <Card key={event._id || i} className={`relative bg-slate-950/40 border-white/5 rounded-2xl p-5 hover:bg-slate-900/60 transition-all duration-500 group overflow-hidden ${getEventGlow(event.type)} after:absolute after:inset-0 after:pointer-events-none after:opacity-50`}>
                                                {/* Team Accent Bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
                                                
                                                <div className="flex items-center gap-6 relative z-10 group-hover:translate-x-0.5 transition-transform duration-500">
                                                    
                                                    {/* Compact Time Tag */}
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-950/90 border border-white/5 shadow-inner-dark backdrop-blur-md shrink-0">
                                                        <span className="text-2xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                                                            {event.minute}
                                                        </span>
                                                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                                            {event.half === 1 ? '1st' : '2nd'}
                                                        </span>
                                                    </div>

                                                    {/* Sleek Icon Box */}
                                                    <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-all duration-500 ${isHome ? 'text-blue-500' : 'text-orange-500'}`}>
                                                        {event.type === 'Goal' && <Trophy size={20} className="animate-bounce" />}
                                                        {event.type === 'Save' && <Shield size={20} />}
                                                        {event.type === 'YellowCard' && <Square className="fill-yellow-500 text-yellow-500" size={20} />}
                                                        {event.type === 'RedCard' && <Square className="fill-red-500 text-red-500" size={20} />}
                                                        {event.type === 'Substitution' && <ArrowRightLeft size={20} className="text-purple-500" />}
                                                        {event.type === 'ShotOnTarget' && <Activity size={20} />}
                                                        {event.type === 'ShotOffTarget' && <Activity className="rotate-45" size={20} />}
                                                        {event.type === 'Offside' && <Flag size={20} />}
                                                        {event.type === 'Foul' && <AlertCircle size={20} />}
                                                        {event.type === 'Corner' && <Flag size={20} />}
                                                        
                                                        {/* Icon Glow */}
                                                        <div className={`absolute inset-0 rounded-xl blur-lg opacity-10 group-hover:opacity-20 transition-all duration-500 ${accentColor}`} />
                                                    </div>

                                                    {/* Streamlined Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h4 className="text-lg font-black italic uppercase tracking-tight text-white truncate">{event.player}</h4>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black italic uppercase tracking-widest ${event.type === 'Goal' ? 'text-green-500' : event.type === 'Substitution' ? 'text-purple-500' : 'text-slate-500'}`}>
                                                                    {formatEventType(event.type)}
                                                                </span>
                                                                {event.goalType === 'Penalty' && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">Penalty</span>}
                                                            </div>
                                                        </div>
                                                        
                                                        {event.type === 'Substitution' && (
                                                            <div className="mt-1 flex items-center gap-4">
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    <ArrowUpRight size={10} className="text-green-500 shrink-0" />
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                                                        IN: <span className="text-white italic">{event.player}</span>
                                                                    </span>
                                                                </div>
                                                                <div className="w-px h-3 bg-white/5" />
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    <ArrowDownLeft size={10} className="text-red-500 shrink-0" />
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                                                        OUT: <span className="text-slate-500 italic">{event.playerOut}</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {event.assister && (
                                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                                                                Assist: <span className="text-slate-400 italic lowercase font-medium">{event.assister}</span>
                                                            </p>
                                                        )}

                                                        {event.commentary && (
                                                            <div className="mt-3 p-3 bg-white/[0.02] rounded-xl border border-white/5 backdrop-blur-sm relative overflow-hidden group/commentary max-w-2xl">
                                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600/20" />
                                                                <p className="text-[10px] font-medium text-slate-400 italic leading-snug">
                                                                    "{event.commentary}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Discreet Official Marker */}
                                                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 opacity-20 group-hover:opacity-60 transition-opacity">
                                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">LIVE</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-green-500/80">
                                                            <CheckCircle2 size={10} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">OFFICIAL</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-10 flex items-center gap-3">
                                        <Activity size={16} className="animate-pulse" /> Live Pulse Index
                                    </h3>
                                    
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Win Probability</span>
                                                <div className="flex gap-4">
                                                    <span className="text-xs font-black text-blue-500 italic">H {match.performance?.winProbability?.home || 45}%</span>
                                                    <span className="text-xs font-black text-orange-500 italic">A {match.performance?.winProbability?.away || 30}%</span>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                                                <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" style={{ width: `${match.performance?.winProbability?.home || 45}%` }} />
                                                <div className="h-full bg-slate-800 transition-all duration-1000" style={{ width: `${match.performance?.winProbability?.draw || 25}%` }} />
                                                <div className="h-full bg-orange-600 transition-all duration-1000 shadow-[0_0_20px_rgba(234,88,12,0.4)]" style={{ width: `${match.performance?.winProbability?.away || 30}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                             <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-colors">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Pressure Index</p>
                                                <p className="text-4xl font-black italic tracking-tighter text-blue-500">{match.performance?.pressureIndex || '5.0'}</p>
                                             </div>
                                             <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-white/5 hover:border-orange-500/20 transition-colors">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Recent Events</p>
                                                <p className="text-4xl font-black italic tracking-tighter text-orange-500">{match.events?.filter((e: any) => e.minute > (match.timer?.currentMinute || 0) - 10).length || 0}</p>
                                             </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                         </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[4rem] p-12 border">
                                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-12 flex items-center gap-4">
                                    <BarChart3 className="text-blue-500" /> Comparison Stream
                                </h3>
                                <div className="space-y-12">
                                    {[
                                        { label: 'Possession', key: 'possession', unit: '%' },
                                        { label: 'Shots On Target', key: 'shotsOnTarget' },
                                        { label: 'Shots Off Target', key: 'shotsOffTarget' },
                                        { label: 'Corners', key: 'corners' },
                                        { label: 'Total Fouls', key: 'fouls' },
                                        { label: 'Offsides', key: 'offsides' }
                                    ].map((stat) => (
                                        <div key={stat.key} className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-3xl font-black italic text-blue-500">{match.stats[stat.key].home}{stat.unit}</span>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{match.homeTeam.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-3xl font-black italic text-orange-500">{match.stats[stat.key].away}{stat.unit}</span>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{match.awayTeam.name}</span>
                                                </div>
                                            </div>
                                            <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex p-1 border border-white/5">
                                                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: stat.key === 'possession' ? `${match.stats[stat.key].home}%` : `${(match.stats[stat.key].home / (match.stats[stat.key].home + match.stats[stat.key].away || 1)) * 100}%` }} />
                                                <div className="h-full bg-orange-600 rounded-full transition-all duration-1000 ml-1" style={{ width: stat.key === 'possession' ? `${match.stats[stat.key].away}%` : `${(match.stats[stat.key].away / (match.stats[stat.key].home + match.stats[stat.key].away || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="space-y-12">
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[4rem] p-12 border flex flex-col items-center justify-center">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-8">Possession Share</h3>
                                    <div className="w-full h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={[
                                                        { name: match.homeTeam.name, value: match.stats.possession.home },
                                                        { name: match.awayTeam.name, value: match.stats.possession.away }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={100}
                                                    outerRadius={150}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {COLORS.map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', color: '#fff' }}
                                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex gap-12 mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">HOME</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-orange-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AWAY</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="lab" className="space-y-12 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* xG Analysis */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border hover:border-green-500/20 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 text-green-500">
                                        <Swords size={18} />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Expected Goals (xG)</h3>
                                </div>
                                <div className="flex items-end justify-between gap-4 mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-4xl font-black italic text-blue-500 tabular-nums">{match.performance?.labAnalysis?.expectedGoals?.home || '0.00'}</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-right">{match.homeTeam.name}</span>
                                    </div>
                                    <div className="h-0.5 flex-1 bg-slate-800 mb-4 rounded-full relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-700 rounded-full" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-4xl font-black italic text-orange-500 tabular-nums">{match.performance?.labAnalysis?.expectedGoals?.away || '0.00'}</span>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">{match.awayTeam.name}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed italic border-t border-white/5 pt-4">
                                    Derived from quality and volume of attempts in scoring zones
                                </p>
                            </Card>

                            {/* Possession Phases */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border hover:border-blue-500/20 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
                                        <PieChart size={18} />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Style Analysis</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Build-up', value: match.performance?.labAnalysis?.possessionPhases?.buildup || 33, color: '#3b82f6' },
                                        { label: 'Attacking', value: match.performance?.labAnalysis?.possessionPhases?.attack || 34, color: '#a855f7' },
                                        { label: 'Defensive', value: match.performance?.labAnalysis?.possessionPhases?.defense || 33, color: '#64748b' }
                                    ].map((phase) => (
                                        <div key={phase.label} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-500">{phase.label}</span>
                                                <span style={{ color: phase.color }}>{phase.value}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                                <div className="h-full transition-all duration-1000" style={{ width: `${phase.value}%`, backgroundColor: phase.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Intensity Pulse */}
                            <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border overflow-hidden group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-500">
                                            <Activity size={18} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Intensity Pulse (Active/Passive)</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Stream Live</span>
                                    </div>
                                </div>
                                <div className="w-full h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={match.performance?.labAnalysis?.intensityPulse || []}>
                                            <Area 
                                                type="step" 
                                                dataKey="value" 
                                                stroke="#a855f7" 
                                                fill="#a855f7" 
                                                fillOpacity={0.1} 
                                                strokeWidth={2} 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-widest text-slate-600">
                                    <span>LOW DEMAND</span>
                                    <span className="text-purple-500/60 font-black">PHYSICAL PEAK</span>
                                    <span>CONSOLIDATION</span>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2">
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[4rem] p-12 border overflow-hidden relative">
                                    <div className="flex justify-between items-center mb-12">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-4">
                                            <Zap className="text-purple-500" /> Momentum History
                                        </h3>
                                        <div className="flex gap-4">
                                            <div className="px-5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">Home Control</div>
                                            <div className="px-5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 uppercase tracking-widest">Away Control</div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={match.performance?.momentumHistory || []}>
                                                <defs>
                                                    <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="minute" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis hide domain={[-100, 100]} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }} />
                                                <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={4} fill="url(#momentumGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                {/* NEW: Tactical Overview Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                                    <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border hover:border-red-500/20 transition-all overflow-hidden flex flex-col justify-between">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
                                                <Swords size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Tactical Positioning</h3>
                                        </div>
                                        
                                        <div className="relative aspect-[21/9] bg-emerald-900/10 border border-emerald-500/10 rounded-3xl overflow-hidden mb-6">
                                            {/* Pitch Lines */}
                                            <div className="absolute inset-0 border border-white/5 m-6 rounded-2xl" />
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/5 rounded-full" />
                                            
                                            {/* Defensive Line Visualization */}
                                            <div 
                                                className="absolute left-6 right-6 h-1 bg-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 flex items-center justify-center"
                                                style={{ bottom: `${(match.performance?.labAnalysis?.defensiveLineHeight?.home || 0) / 1.5 + 10}%` }}
                                            >
                                                <span className="text-[7px] font-black uppercase text-blue-400 -top-4 absolute whitespace-nowrap tracking-widest">HOME DEFENSIVE LINE: {Math.round(match.performance?.labAnalysis?.defensiveLineHeight?.home || 0)}m</span>
                                            </div>
                                            <div 
                                                className="absolute left-6 right-6 h-1 bg-orange-500/40 shadow-[0_0_20px_rgba(234,88,12,0.5)] transition-all duration-1000 flex items-center justify-center"
                                                style={{ top: `${(match.performance?.labAnalysis?.defensiveLineHeight?.away || 0) / 1.5 + 10}%` }}
                                            >
                                                <span className="text-[7px] font-black uppercase text-orange-400 -bottom-4 absolute whitespace-nowrap tracking-widest">AWAY DEFENSIVE LINE: {Math.round(match.performance?.labAnalysis?.defensiveLineHeight?.away || 0)}m</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center italic border-t border-white/5 pt-4">
                                            Real-time visualization of average team shape and vertical positioning
                                        </p>
                                    </Card>

                                    <Card className="lg:col-span-1 bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border hover:border-blue-400/20 transition-all flex flex-col justify-between">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
                                                <Zap size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Attack Velocity</h3>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl font-black italic text-white tabular-nums tracking-tighter">{match.performance?.labAnalysis?.directnessIndex?.home || 0}</span>
                                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">Directness Index (H)</span>
                                            </div>
                                            <div className="h-0.5 bg-slate-800 rounded-full flex overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${match.performance?.labAnalysis?.directnessIndex?.home}%` }} />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl font-black italic text-white tabular-nums tracking-tighter">{match.performance?.labAnalysis?.directnessIndex?.away || 0}</span>
                                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-1">Directness Index (A)</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="lg:col-span-1 bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 border hover:border-red-500/20 transition-all flex flex-col justify-between">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
                                                <Activity size={18} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Pressing Output</h3>
                                        </div>
                                        <div className="space-y-6 text-center">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-3xl font-black italic text-blue-500">{match.performance?.labAnalysis?.highTurnovers?.home || 0}</span>
                                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Wins High (H)</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-3xl font-black italic text-orange-500">{match.performance?.labAnalysis?.highTurnovers?.away || 0}</span>
                                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Wins High (A)</span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/10">
                                                <p className="text-[9px] text-red-400 font-bold tracking-tight italic">
                                                    Turnovers forced within 40m of opposition goal
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <Card className="bg-[#1a0b2e]/40 border-purple-500/20 rounded-[4rem] p-12 border relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                                    <Zap className="text-purple-500 mb-8" size={32} />
                                    <h3 className="text-xl font-black italic uppercase tracking-tight mb-4">Tactical Insights</h3>
                                    <div className="space-y-6">
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                            {match.performance?.labAnalysis?.attackThirdControl?.team !== 'None' ? (
                                                <><span className="text-white font-black italic uppercase">{match.performance?.labAnalysis?.attackThirdControl?.team === 'Home' ? match.homeTeam.name : match.awayTeam.name}</span> dominance has increased to {Math.round(match.performance?.labAnalysis?.attackThirdControl?.percentage || 0)}% in specialized zones.</>
                                            ) : (
                                                "Neutral tactical phase. Both teams are focusing on mid-block consolidation."
                                            )}
                                        </p>
                                        <div className="p-6 bg-slate-950/80 rounded-3xl border border-white/5 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scoring Probability</h4>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${parseFloat(match.performance?.labAnalysis?.expectedGoals?.home || '0') > parseFloat(match.performance?.labAnalysis?.expectedGoals?.away || '0') ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`} />
                                                <span className="text-xs font-black uppercase text-white italic">
                                                    {parseFloat(match.performance?.labAnalysis?.expectedGoals?.home || '0') > parseFloat(match.performance?.labAnalysis?.expectedGoals?.away || '0') ? match.homeTeam.name : match.awayTeam.name} is creating superior chances
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-slate-900/40 border-slate-800 rounded-[4rem] p-12 border">
                                    <div className="space-y-10">
                                        <div className="flex gap-6 items-start">
                                            <div className="w-1.5 h-16 bg-green-500 rounded-full" style={{ height: `${match.performance?.labAnalysis?.intensityPressing || 40}%` }} />
                                            <div>
                                                <h4 className="text-sm font-black italic uppercase tracking-tight text-white mb-1">Pressing Efficiency</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{match.performance?.labAnalysis?.intensityPressing || 40}% High Pressure</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 items-start">
                                            <div className="w-1.5 h-16 bg-orange-500 rounded-full" style={{ height: `${match.performance?.labAnalysis?.counterAttackRisk || 30}%` }} />
                                            <div>
                                                <h4 className="text-sm font-black italic uppercase tracking-tight text-white mb-1">Transition Volatility</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{match.performance?.labAnalysis?.counterAttackRisk || 30}% Counter Potential</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="lineups" className="space-y-12 animate-in fade-in duration-1000">
                        <Card className="bg-slate-900/40 border-slate-800 rounded-[4rem] p-12 border overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                                <FootballPitchLineup 
                                    homeTeam={{
                                        name: match.homeTeam?.name || 'Home Team',
                                        logo: match.homeTeam?.logo,
                                        primaryColor: match.homeTeam?.primaryColor || '#2563eb'
                                    }}
                                    awayTeam={{
                                        name: match.awayTeam?.name || 'Away Team',
                                        logo: match.awayTeam?.logo,
                                        primaryColor: match.awayTeam?.primaryColor || '#ea580c'
                                    }}
                                    homePlayers={[
                                        ...(match.lineups?.home?.startingXI?.map((name: string) => {
                                            const p = match.homeTeam?.players?.find((tp: any) => tp.name === name);
                                            return { 
                                                id: name, 
                                                name, 
                                                role: p?.role || 'Midfielder', 
                                                number: p?.number, 
                                                isSubstitute: false, 
                                                isCaptain: p?.isCaptain,
                                                events: summarizePlayerEvents(name, match.events, match.score?.away || 0)
                                            };
                                        }) || []),
                                        ...(match.lineups?.home?.substitutes?.map((name: string) => {
                                            const p = match.homeTeam?.players?.find((tp: any) => tp.name === name);
                                            return { 
                                                id: name, 
                                                name, 
                                                role: p?.role || 'Midfielder', 
                                                number: p?.number, 
                                                isSubstitute: true,
                                                events: summarizePlayerEvents(name, match.events, match.score?.away || 0)
                                            };
                                        }) || [])
                                    ].filter((p, i, self) => i === self.findIndex((t) => t.id === p.id))}
                                    awayPlayers={[
                                        ...(match.lineups?.away?.startingXI?.map((name: string) => {
                                            const p = match.awayTeam?.players?.find((tp: any) => tp.name === name);
                                            return { 
                                                id: name, 
                                                name, 
                                                role: p?.role || 'Midfielder', 
                                                number: p?.number, 
                                                isSubstitute: false, 
                                                isCaptain: p?.isCaptain,
                                                events: summarizePlayerEvents(name, match.events, match.score?.home || 0)
                                            };
                                        }) || []),
                                        ...(match.lineups?.away?.substitutes?.map((name: string) => {
                                            const p = match.awayTeam?.players?.find((tp: any) => tp.name === name);
                                            return { 
                                                id: name, 
                                                name, 
                                                role: p?.role || 'Midfielder', 
                                                number: p?.number, 
                                                isSubstitute: true,
                                                events: summarizePlayerEvents(name, match.events, match.score?.home || 0)
                                            };
                                        }) || [])
                                    ].filter((p, i, self) => i === self.findIndex((t) => t.id === p.id))}
                                    homeFormation={match.lineups?.home?.formation || '4-4-2'}
                                    awayFormation={match.lineups?.away?.formation || '4-4-2'}
                                    currentMinute={match.timer?.currentMinute || 0}
                                />
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
