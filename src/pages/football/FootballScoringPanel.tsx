import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Trophy, 
    Timer, 
    Play, 
    Pause, 
    CheckCircle2, 
    AlertTriangle, 
    History, 
    TrendingUp, 
    Users, 
    Settings,
    ArrowLeft,
    Loader2,
    Plus,
    Minus,
    Zap,
    Flag,
    Shield,
    ShieldAlert,
    X,
    BarChart3,
    Clock,
    LayoutDashboard,
    ListFilter,
    Target,
    Activity,
    ArrowRightLeft,
    AlertCircle,
    Circle,
    Square,
    Layout,
    Swords,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    ArrowDownLeft,
    ArrowUpRight
} from "lucide-react";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import { VENUE_ANALYSIS_DATA } from "@/data/venueAnalysisData";
import { footballApi } from "@/services/api";
import { getSocket } from "@/services/socket";
import { FootballPitchLineup } from '@/components/FootballPitchLineup';
import { toast } from "sonner";

export default function FootballScoringPanel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // Timer state
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [displayTime, setDisplayTime] = useState("00:00");
    const timerInterval = useRef<any>(null);
    const isUpdatingTimer = useRef(false);
    
    // Event Dialog State
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [eventType, setEventType] = useState<'Goal' | 'YellowCard' | 'RedCard' | 'Substitution' | 'Save' | 'ShotOnTarget' | 'ShotOffTarget' | 'Corner' | 'Foul' | 'Offside'>('Goal');
    const [eventTeam, setEventTeam] = useState<any>(null);
    const [goalStep, setGoalStep] = useState(0); // 0: Scorer, 1: Type, 2: Assister
    const [subStep, setSubStep] = useState(0); // 0: Player Out, 1: Player In
    const [selectedScorer, setSelectedScorer] = useState<string>("");
    const [selectedPlayerOut, setSelectedPlayerOut] = useState<string>("");
    const [selectedGoalType, setSelectedGoalType] = useState<string>("OpenPlay");
    const [saveInquiryStep, setSaveInquiryStep] = useState(false);
    const [foulInquiryStep, setFoulInquiryStep] = useState(false);
    const [pendingEvent, setPendingEvent] = useState<any>(null);
    const [isInjured, setIsInjured] = useState(false);

    // Injury Time States
    const [showInjuryPrompt, setShowInjuryPrompt] = useState(false);
    const [injuryMatchMinute, setInjuryMatchMinute] = useState(0); 
    const [tempInjuryTime, setTempInjuryTime] = useState(0);
    const [lastPromptedHalf, setLastPromptedHalf] = useState(0); 

    // Lineup Selection State
    const [homeXI, setHomeXI] = useState<string[]>([]);
    const [homeSubs, setHomeSubs] = useState<string[]>([]);
    const [awayXI, setAwayXI] = useState<string[]>([]);
    const [awaySubs, setAwaySubs] = useState<string[]>([]);
    const [homeFormation, setHomeFormation] = useState<string>('4-4-2');
    const [awayFormation, setAwayFormation] = useState<string>('4-4-2');
    const [isFinalizingLineups, setIsFinalizingLineups] = useState(false);

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

    const updateTimerDisplay = (currentMatch: any) => {
        if (!currentMatch?.timer) return;
        
        let totalSecs = (currentMatch.timer.currentMinute || 0) * 60;
        if (currentMatch.timer.isRunning && currentMatch.timer.startTime) {
            const start = new Date(currentMatch.timer.startTime).getTime();
            const now = Date.now();
            totalSecs += Math.floor((now - start) / 1000);
        }
        setSecondsElapsed(totalSecs);
        setDisplayTime(formatTime(totalSecs, currentMatch.timer.half));
    };

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const res: any = await footballApi.getMatchById(id!);
                if (res.success) {
                    setMatch(res.data);
                    updateTimerDisplay(res.data);

                    /* Authorization Check */
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const currentUserId = user._id || user.id || '';
                    const isAdmin = user.role === 'admin';

                    const tournamentData = res.data.tournamentId;
                    const creatorId = typeof tournamentData === 'object' ? tournamentData.createdBy : null;
                    const actualCreatorId = typeof creatorId === 'object' ? creatorId?._id : creatorId;

                    if (actualCreatorId && String(actualCreatorId) !== String(currentUserId) && !isAdmin) {
                        toast.error("Access Denied: You are not authorized to score matches in this tournament.");
                        navigate("/admin");
                        return;
                    }
                }
            } catch (error) {
                toast.error("Failed to load match");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMatch();

        const socket = getSocket();
        
        const joinRoom = () => {
            console.log(`[SOCKET] Scorer joining football match room: ${id}`);
            socket.emit("join_football_match", id);
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on("connect", joinRoom);

        socket.on("football_update", (updatedMatch) => {
            console.log("[SOCKET] Scorer received update for match:", updatedMatch._id);
            setMatch(updatedMatch);
            updateTimerDisplay(updatedMatch);
        });

        return () => {
            socket.off("connect", joinRoom);
            socket.emit("leave_football_match", id);
            socket.off("football_update");
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [id]);

    useEffect(() => {
        if (match?.timer?.isRunning) {
            timerInterval.current = setInterval(() => {
                const start = new Date(match.timer.startTime).getTime();
                const now = Date.now();
                const totalSecs = (match.timer.currentMinute * 60) + Math.floor((now - start) / 1000);
                const currentMin = Math.floor(totalSecs / 60);

                setSecondsElapsed(totalSecs);
                setDisplayTime(formatTime(totalSecs, match.timer.half));

                // Injury Time Prompt Logic
                if (match.timer.half === 1 && currentMin === 43 && !showInjuryPrompt && match.timer.injuryTime === 0 && lastPromptedHalf !== 1) {
                    setInjuryMatchMinute(43);
                    setShowInjuryPrompt(true);
                    setLastPromptedHalf(1);
                } else if (match.timer.half === 2 && currentMin === 88 && !showInjuryPrompt && match.timer.injuryTime === 0 && lastPromptedHalf !== 2) {
                    setInjuryMatchMinute(88);
                    setShowInjuryPrompt(true);
                    setLastPromptedHalf(2);
                }

                // Auto-Stop / Transition Logic
                const limit = match.timer.half === 1 ? 45 : 90;
                const isEndTime = currentMin >= limit + (match.timer.injuryTime || 0);

                if (isEndTime && !isUpdatingTimer.current) {
                    if (match.timer.half === 1) {
                        if (match.timer.halfStatus !== 'HalfTime') {
                            handleTimerControl(false, limit, 'HalfTime', true); // Use limit to keep it clean (45:00)
                            toast.info("End of First Half", { id: "half-time-toast" }); // Unique ID to prevent loop
                        }
                    } else if (match.timer.half === 2) {
                        if (match.timer.halfStatus !== 'FullTime' && match.status !== 'Completed') {
                            console.log("[TIMER] Auto-finalizing second half...");
                            autoFinalizeMatch();
                            toast.info("Match Time Ended - Finalizing Results...", { id: "full-time-toast" });
                        }
                    }
                }
            }, 1000); 
        } else {
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
    }, [match?.timer?.isRunning, match?.timer?.startTime, match?.timer?.currentMinute, match?.timer?.half, match?.timer?.injuryTime, showInjuryPrompt]);

    const handleTimerControl = async (isRunning: boolean, minuteOverride?: number, statusOverride?: string, silent: boolean = false) => {
        if (isUpdatingTimer.current) return;
        
        try {
            isUpdatingTimer.current = true;
            const minute = minuteOverride !== undefined ? minuteOverride : Math.floor(secondsElapsed / 60);
            const res: any = await footballApi.updateTimer(id!, { 
                isRunning, 
                currentMinute: minute,
                halfStatus: statusOverride || (isRunning ? (match.timer.half === 1 ? 'FirstHalf' : 'SecondHalf') : match.timer.halfStatus)
            });
            if (res.success) {
                if (!silent) {
                    toast.success(isRunning ? "Timer Started" : "Timer Paused");
                }
                setMatch(res.data);
                updateTimerDisplay(res.data);
            }
        } catch (error) {
            console.error("Timer update failed:", error);
            if (!silent) toast.error("Failed to update timer");
        } finally {
            isUpdatingTimer.current = false;
        }
    };

    const handleSetInjuryTime = async () => {
        try {
            const res: any = await footballApi.updateTimer(id!, { injuryTime: tempInjuryTime });
            if (res.success) {
                toast.success(`Injury Time set to ${tempInjuryTime} mins`);
                setMatch(res.data);
                setShowInjuryPrompt(false);
            }
        } catch (error) {
            toast.error("Failed to set injury time");
        }
    };

    const handleStartSecondHalf = async () => {
        try {
            const res: any = await footballApi.updateTimer(id!, { 
                half: 2, 
                currentMinute: 45, 
                halfStatus: 'SecondHalf', 
                isRunning: true,
                injuryTime: 0 // Reset for 2nd half
            });
            if (res.success) {
                toast.success("Second Half Started!");
                setMatch(res.data);
                updateTimerDisplay(res.data);
            }
        } catch (error) {
            toast.error("Failed to start second half");
        }
    };

    const handleAddEvent = async (type: string, teamId: string, player: string, assister?: string, goalType?: string, playerOut?: string) => {
        // Handle Shot on Target and Corner inquiries
        if ((type === 'ShotOnTarget' || type === 'Corner') && !saveInquiryStep) {
            setPendingEvent({ type, teamId, player, assister, goalType, playerOut });
            setSaveInquiryStep(true);
            return;
        }

        // Handle Foul card inquiry
        if (type === 'Foul' && !foulInquiryStep) {
            setPendingEvent({ type, teamId, player });
            setFoulInquiryStep(true);
            return;
        }

        try {
            setUpdating(true);
            const res: any = await footballApi.addEvent(id!, {
                type,
                minute: Math.floor(secondsElapsed / 60),
                team: teamId,
                player,
                assister,
                goalType,
                playerOut,
                isInjured: type === 'Substitution' ? isInjured : undefined
            });
            if (res.success) {
                toast.success(`${type} recorded!`);
                setMatch(res.data);
                setIsEventDialogOpen(false);
                setSaveInquiryStep(false);
                setPendingEvent(null);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add event");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveDecision = async (isSave: boolean) => {
        try {
            setUpdating(true);
            if (!pendingEvent) return;

            // 1. Record the original event
            const originalRes: any = await footballApi.addEvent(id!, {
                type: pendingEvent.type,
                minute: Math.floor(secondsElapsed / 60),
                team: pendingEvent.teamId,
                player: pendingEvent.player
            });

            if (originalRes.success) {
                // 2. If it's a save, record a SAVE for the opposing team's goalkeeper
                if (isSave) {
                    const opposingTeam = String(pendingEvent.teamId) === String(match.homeTeam._id) ? match.awayTeam : match.homeTeam;
                    const side = String(opposingTeam._id) === String(match.homeTeam._id) ? 'home' : 'away';
                    const playingXI = match.lineups?.[side]?.startingXI || [];
                    
                    // Prefer active keeper from starting XI
                    const goalkeeper = opposingTeam.players?.find((p: any) => 
                        playingXI.includes(p.name) && p.role?.toLowerCase().includes('goalkeeper')
                    ) || opposingTeam.players?.find((p: any) => p.role?.toLowerCase().includes('goalkeeper')) || { name: `GK (${opposingTeam.name})` };
                    
                    await footballApi.addEvent(id!, {
                        type: 'Save',
                        minute: Math.floor(secondsElapsed / 60),
                        team: opposingTeam._id,
                        player: goalkeeper.name
                    });
                    toast.success(`${pendingEvent.type} and Save recorded!`);
                } else {
                    toast.success(`${pendingEvent.type} recorded!`);
                }

                // Refresh match data from the last event or re-fetch
                const finalRes: any = await footballApi.getMatchById(id!);
                if (finalRes.success) {
                    setMatch(finalRes.data);
                }
                
                setIsEventDialogOpen(false);
                setSaveInquiryStep(false);
                setPendingEvent(null);
            }
        } catch (error: any) {
            toast.error("Failed to record save sequence");
        } finally {
            setUpdating(false);
        }
    };

    const handleFoulDecision = async (cardType: 'None' | 'YellowCard' | 'RedCard') => {
        try {
            setUpdating(true);
            if (!pendingEvent) return;

            // 1. Record the Foul
            const foulRes: any = await footballApi.addEvent(id!, {
                type: 'Foul',
                minute: Math.floor(secondsElapsed / 60),
                team: pendingEvent.teamId,
                player: pendingEvent.player
            });

            if (foulRes.success) {
                // 2. If a card was selected, record the card event
                if (cardType !== 'None') {
                    await footballApi.addEvent(id!, {
                        type: cardType,
                        minute: Math.floor(secondsElapsed / 60),
                        team: pendingEvent.teamId,
                        player: pendingEvent.player
                    });
                    toast.success(`Foul and ${cardType.replace('Card', ' Card')} recorded!`);
                } else {
                    toast.success("Foul recorded!");
                }

                // Refresh match data
                const finalRes: any = await footballApi.getMatchById(id!);
                if (finalRes.success) {
                    setMatch(finalRes.data);
                }
                
                setIsEventDialogOpen(false);
                setFoulInquiryStep(false);
                setPendingEvent(null);
            }
        } catch (error: any) {
            toast.error("Failed to record foul sequence");
        } finally {
            setUpdating(false);
        }
    };

    const openEventDialog = (type: any, team: any) => {
        setEventType(type);
        setEventTeam(team);
        setGoalStep(0);
        setSubStep(0);
        setSaveInquiryStep(false);
        setFoulInquiryStep(false);
        setPendingEvent(null);
        setSelectedScorer("");
        setSelectedPlayerOut("");
        setSelectedGoalType("OpenPlay");
        setIsInjured(false);
        setIsEventDialogOpen(true);
    };

    const handleFinalize = async () => {
        if (!window.confirm("Are you sure you want to end the match? This will finalize the scores.")) return;
        await autoFinalizeMatch();
    };

    const autoFinalizeMatch = async () => {
        if (isUpdatingTimer.current) return;
        try {
            isUpdatingTimer.current = true;
            const res: any = await footballApi.finalizeMatch(id!);
            if (res.success) {
                toast.success("Match Finalized!");
                navigate(`/football/match/result/${id}`);
            }
        } catch (error) {
            console.error("Finalize error:", error);
            toast.error("Failed to finalize match");
        } finally {
            isUpdatingTimer.current = false;
        }
    };

    const handleSaveLineups = async () => {
        if (homeXI.length !== 11 || awayXI.length !== 11) {
            toast.error("Each team must have exactly 11 players in the Starting XI");
            return;
        }

        try {
            setIsFinalizingLineups(true);
            const res: any = await footballApi.updateMatchLineups(id!, {
                homeLineup: { startingXI: homeXI, substitutes: homeSubs, formation: homeFormation },
                awayLineup: { startingXI: awayXI, substitutes: awaySubs, formation: awayFormation }
            });

            if (res.success) {
                toast.success("Lineups finalized!");
                setMatch(res.data);
                if (res.data?.homeTeam && res.data?.awayTeam) {
                    // Automatically start the timer/match
                    handleTimerControl(true, 0, 'FirstHalf');
                } else {
                    toast.error("Match teams are missing in the updated data");
                }
            }
        } catch (error) {
            toast.error("Failed to save lineups");
        } finally {
            setIsFinalizingLineups(false);
        }
    };

    const togglePlayerLineup = (team: 'home' | 'away', playerName: string, type: 'XI' | 'Sub') => {
        if (team === 'home') {
            if (type === 'XI') {
                if (homeXI.includes(playerName)) {
                    setHomeXI(homeXI.filter(p => p !== playerName));
                } else {
                    if (homeXI.length >= 11) {
                        toast.warning("Home Starting XI is full (11 players)");
                        return;
                    }
                    setHomeXI([...homeXI, playerName]);
                    setHomeSubs(homeSubs.filter(p => p !== playerName));
                }
            } else {
                if (homeSubs.includes(playerName)) {
                    setHomeSubs(homeSubs.filter(p => p !== playerName));
                } else {
                    setHomeSubs([...homeSubs, playerName]);
                    setHomeXI(homeXI.filter(p => p !== playerName));
                }
            }
        } else {
            if (type === 'XI') {
                if (awayXI.includes(playerName)) {
                    setAwayXI(awayXI.filter(p => p !== playerName));
                } else {
                    if (awayXI.length >= 11) {
                        toast.warning("Away Starting XI is full (11 players)");
                        return;
                    }
                    setAwayXI([...awayXI, playerName]);
                    setAwaySubs(awaySubs.filter(p => p !== playerName));
                }
            } else {
                if (awaySubs.includes(playerName)) {
                    setAwaySubs(awaySubs.filter(p => p !== playerName));
                } else {
                    setAwaySubs([...awaySubs, playerName]);
                    setAwayXI(awayXI.filter(p => p !== playerName));
                }
            }
        }
    };

    const renderLineupSetup = () => {
        return (
            <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Pre-Match Team Sheet</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Configure Playing XI & Substitutes</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Home Selection */}
                    <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase text-blue-500">{match.homeTeam?.name || 'Home Team'}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Starting XI: {homeXI.length}/11</p>
                                    <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5" />
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subs: {homeSubs.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Layout size={14} className="text-slate-500" />
                                <select 
                                    value={homeFormation}
                                    onChange={(e) => setHomeFormation(e.target.value)}
                                    className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    {['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3', '4-5-1', '4-1-2-1-2'].map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {match.homeTeam.players?.map((player: any) => (
                                <div key={player.name} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
                                    <span className="font-bold text-slate-300">{player.name} <span className="text-[9px] text-slate-600 ml-2">({player.role})</span></span>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm"
                                            onClick={() => togglePlayerLineup('home', player.name, 'XI')}
                                            variant={homeXI.includes(player.name) ? "default" : "outline"}
                                            className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${homeXI.includes(player.name) ? 'bg-blue-600' : 'border-white/5 text-slate-500'}`}
                                        >
                                            Starters
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => togglePlayerLineup('home', player.name, 'Sub')}
                                            variant={homeSubs.includes(player.name) ? "default" : "outline"}
                                            className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${homeSubs.includes(player.name) ? 'bg-slate-700' : 'border-white/5 text-slate-500'}`}
                                        >
                                            Bench
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Away Selection */}
                    <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase text-orange-500">{match.awayTeam?.name || 'Away Team'}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Starting XI: {awayXI.length}/11</p>
                                    <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5" />
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subs: {awaySubs.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Layout size={14} className="text-slate-500" />
                                <select 
                                    value={awayFormation}
                                    onChange={(e) => setAwayFormation(e.target.value)}
                                    className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors"
                                >
                                    {['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3', '4-5-1', '4-1-2-1-2'].map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {match.awayTeam.players?.map((player: any) => (
                                <div key={player.name} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-colors">
                                    <span className="font-bold text-slate-300">{player.name} <span className="text-[9px] text-slate-600 ml-2">({player.role})</span></span>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm"
                                            onClick={() => togglePlayerLineup('away', player.name, 'XI')}
                                            variant={awayXI.includes(player.name) ? "default" : "outline"}
                                            className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${awayXI.includes(player.name) ? 'bg-orange-600' : 'border-white/5 text-slate-500'}`}
                                        >
                                            Starters
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => togglePlayerLineup('away', player.name, 'Sub')}
                                            variant={awaySubs.includes(player.name) ? "default" : "outline"}
                                            className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest ${awaySubs.includes(player.name) ? 'bg-slate-700' : 'border-white/5 text-slate-500'}`}
                                        >
                                            Bench
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="flex justify-center pt-8">
                    <Button 
                        size="lg"
                        className="h-20 px-20 bg-green-600 hover:bg-green-500 rounded-[2rem] font-black italic uppercase tracking-tighter text-2xl shadow-2xl shadow-green-500/20"
                        onClick={handleSaveLineups}
                        disabled={isFinalizingLineups || homeXI.length !== 11 || awayXI.length !== 11}
                    >
                        {isFinalizingLineups ? <Loader2 className="animate-spin mr-3" /> : <Play className="mr-3 fill-current" />}
                        Finalize & Kick Off
                    </Button>
                </div>
            </div>
        );
    };

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
            substitution: undefined as any
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
                    playerEvents.substitution = { 
                        ...playerEvents.substitution,
                        inMinute: event.minute, 
                        isInjured: event.isInjured || playerEvents.substitution?.isInjured 
                    };
                } else if (event.playerOut === playerName) {
                    playerEvents.substitution = { 
                        ...playerEvents.substitution,
                        outMinute: event.minute, 
                        isInjured: event.isInjured || playerEvents.substitution?.isInjured 
                    };
                }
            }
        });

        return playerEvents;
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

    if (!match) return <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-center p-8"><h1 className="text-2xl font-bold text-white">Match Not Found</h1><p className="text-slate-500 max-w-md">The match ID you're looking for was not found in our database.</p></div>;

    // Safety check for unpopulated or missing teams
    if (!match.homeTeam || !match.awayTeam) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2.5rem]">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Match Data Corrupted</h1>
                    <p className="text-slate-500 mt-2 max-w-md">One or both teams for this match could not be loaded. Please ensure teams are correctly assigned to the match.</p>
                </div>
                <Button onClick={() => navigate(-1)} className="h-12 px-8 rounded-xl font-black italic uppercase tracking-tight">Go Back</Button>
            </div>
        );
    }

    const isMatchSetupNeeded = match.status === 'Scheduled' || (!match.lineups?.home?.startingXI?.length && !match.lineups?.away?.startingXI?.length);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-12">
                {match.tournamentId && (
                    <Link 
                        to={`/football/tournament/${match.tournamentId}`}
                        className="inline-flex items-center gap-2 mb-8 px-6 py-2 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors group"
                    >
                        <ArrowLeft size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Back to Tournament</span>
                    </Link>
                )}
                {isMatchSetupNeeded ? (
                    renderLineupSetup()
                ) : (
                    <>
                        {/* Header / Scoreboard */}
                <div className="relative mb-12 overflow-hidden rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl p-12">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-orange-600 to-red-600" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        {/* Home Team */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative group transition-transform hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {match.homeTeam?.logo ? <img src={match.homeTeam.logo} alt={match.homeTeam.name} /> : <Users size={40} className="text-slate-700" />}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-500 transition-colors">{match.homeTeam?.name || 'Home Team'}</h2>
                            
                            {/* Scorers List */}
                            <div className="mt-4 flex flex-col items-center gap-1">
                                {match.events?.filter((e: any) => e.type === 'Goal' && String(e.team) === String(match.homeTeam?._id)).map((e: any, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                                        {e.player} {e.minute}' {e.goalType === 'Penalty' && <span className="text-blue-500">(P)</span>}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Score & Timer */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-8">
                                <span className="text-8xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{match.score?.home ?? 0}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                <span className="text-8xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{match.score?.away ?? 0}</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <div className="px-8 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center gap-1 min-w-[180px]">
                                    <div className="flex items-center gap-3">
                                        <Timer className={match.timer?.isRunning ? "text-green-500 animate-pulse" : "text-slate-500"} size={20} />
                                        <span className="text-3xl font-black italic tabular-nums tracking-tighter">
                                            {displayTime}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                            {match.timer?.halfStatus === 'FirstHalf' ? '1st Half' : 
                                             match.timer?.halfStatus === 'HalfTime' ? 'Half Time' :
                                             match.timer?.halfStatus === 'SecondHalf' ? '2nd Half' : 'Full Time'}
                                        </span>
                                        {(match.timer?.injuryTime || 0) > 0 && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                                                +{match.timer.injuryTime}' ET
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Live Match Timer</p>
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative group transition-transform hover:scale-105">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {match.awayTeam?.logo ? <img src={match.awayTeam.logo} alt={match.awayTeam.name} /> : <Users size={40} className="text-slate-700" />}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors">{match.awayTeam?.name || 'Away Team'}</h2>
                            
                            {/* Scorers List */}
                            <div className="mt-4 flex flex-col items-center gap-1">
                                {match.events?.filter((e: any) => e.type === 'Goal' && String(e.team) === String(match.awayTeam?._id)).map((e: any, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                                        {e.player} {e.minute}' {e.goalType === 'Penalty' && <span className="text-orange-500">(P)</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <Tabs defaultValue="live" className="space-y-8">
                    <TabsList className="bg-slate-900/60 border border-white/5 p-1 rounded-2xl h-14 w-full justify-start gap-2">
                        <TabsTrigger value="live" className="rounded-xl px-8 data-[state=active]:bg-blue-600 font-black italic uppercase tracking-tight gap-2">
                            <Zap size={16} /> Live
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="rounded-xl px-8 data-[state=active]:bg-slate-800 font-black italic uppercase tracking-tight gap-2">
                            <LayoutDashboard size={16} /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="lineups" className="rounded-xl px-8 data-[state=active]:bg-slate-800 font-black italic uppercase tracking-tight gap-2">
                            <Users size={16} /> Lineups
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-xl px-8 data-[state=active]:bg-slate-800 font-black italic uppercase tracking-tight gap-2">
                            <BarChart3 size={16} /> Stats
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="rounded-xl px-8 data-[state=active]:bg-purple-600 font-black italic uppercase tracking-tight gap-2">
                            <TrendingUp size={16} /> Performance Lab
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="live" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Primary Controls */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Home Actions */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8">
                                    <CardHeader className="px-0 pt-0 mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Home Actions</h3>
                                    </CardHeader>
                                    <div className="grid gap-3">
                                        <Button 
                                            onClick={() => openEventDialog('Goal', match.homeTeam)}
                                            className="h-16 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black italic uppercase tracking-tight"
                                        >
                                            <Circle className="mr-2 fill-current" size={18} /> Record Goal
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                onClick={() => openEventDialog('YellowCard', match.homeTeam)}
                                                variant="outline"
                                                className="h-14 border-slate-800 bg-slate-950 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-2xl font-black"
                                            >
                                                <Flag size={16} className="mr-2" /> Yellow
                                            </Button>
                                            <Button 
                                                onClick={() => openEventDialog('RedCard', match.homeTeam)}
                                                variant="outline"
                                                className="h-14 border-slate-800 bg-slate-950 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black"
                                            >
                                                <ShieldAlert size={16} className="mr-2" /> Red Card
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={() => openEventDialog('Save', match.homeTeam)}
                                            variant="outline"
                                            className="h-14 mt-3 border-slate-800 bg-slate-950 text-blue-400 hover:bg-blue-600 hover:text-white rounded-2xl font-black w-full"
                                        >
                                            <Shield size={16} className="mr-2" /> Record Save
                                        </Button>

                                        {/* Advanced Home Actions */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                                            <Button onClick={() => openEventDialog('ShotOnTarget', match.homeTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-blue-500/10 hover:text-blue-400">
                                                <Target size={14} /> SOT
                                            </Button>
                                            <Button onClick={() => openEventDialog('ShotOffTarget', match.homeTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Circle size={14} /> Shot
                                            </Button>
                                            <Button onClick={() => openEventDialog('Corner', match.homeTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Flag size={14} /> Corner
                                            </Button>
                                            <Button onClick={() => openEventDialog('Foul', match.homeTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-red-500/10 hover:text-red-400">
                                                <AlertCircle size={14} /> Foul
                                            </Button>
                                            <Button onClick={() => openEventDialog('Offside', match.homeTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Flag size={14} className="rotate-45" /> Offside
                                            </Button>
                                            <Button 
                                                onClick={() => openEventDialog('Substitution', match.homeTeam)} 
                                                variant="ghost" 
                                                disabled={match.lineups?.home?.substitutionCount >= 5}
                                                className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-purple-500/10 hover:text-purple-400 disabled:opacity-20"
                                            >
                                                <ArrowRightLeft size={14} /> 
                                                <span className="flex flex-col">
                                                    <span>Sub</span>
                                                    {match.lineups?.home?.substitutionCount > 0 && <span className="text-[7px] text-purple-600">{match.lineups.home.substitutionCount}/5</span>}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Away Actions */}
                                <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8">
                                    <CardHeader className="px-0 pt-0 mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Away Actions</h3>
                                    </CardHeader>
                                    <div className="grid gap-3">
                                        <Button 
                                            onClick={() => openEventDialog('Goal', match.awayTeam)}
                                            className="h-16 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black italic uppercase tracking-tight"
                                        >
                                            <Circle className="mr-2 fill-current" size={18} /> Record Goal
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                onClick={() => openEventDialog('YellowCard', match.awayTeam)}
                                                variant="outline"
                                                className="h-14 border-slate-800 bg-slate-950 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-2xl font-black"
                                            >
                                                <Flag size={16} className="mr-2" /> Yellow
                                            </Button>
                                            <Button 
                                                onClick={() => openEventDialog('RedCard', match.awayTeam)}
                                                variant="outline"
                                                className="h-14 border-slate-800 bg-slate-950 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black"
                                            >
                                                <ShieldAlert size={16} className="mr-2" /> Red Card
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={() => openEventDialog('Save', match.awayTeam)}
                                            variant="outline"
                                            className="h-14 mt-3 border-slate-800 bg-slate-950 text-blue-400 hover:bg-blue-600 hover:text-white rounded-2xl font-black w-full"
                                        >
                                            <Shield size={16} className="mr-2" /> Record Save
                                        </Button>

                                        {/* Advanced Away Actions */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                                            <Button onClick={() => openEventDialog('ShotOnTarget', match.awayTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-blue-500/10 hover:text-blue-400">
                                                <Target size={14} /> SOT
                                            </Button>
                                            <Button onClick={() => openEventDialog('ShotOffTarget', match.awayTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Circle size={14} /> Shot
                                            </Button>
                                            <Button onClick={() => openEventDialog('Corner', match.awayTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Flag size={14} /> Corner
                                            </Button>
                                            <Button onClick={() => openEventDialog('Foul', match.awayTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-red-500/10 hover:text-red-400">
                                                <AlertCircle size={14} /> Foul
                                            </Button>
                                            <Button onClick={() => openEventDialog('Offside', match.awayTeam)} variant="ghost" className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-800">
                                                <Flag size={14} className="rotate-45" /> Offside
                                            </Button>
                                            <Button 
                                                onClick={() => openEventDialog('Substitution', match.awayTeam)} 
                                                variant="ghost" 
                                                disabled={match.lineups?.away?.substitutionCount >= 5}
                                                className="h-12 flex-col gap-1 text-[10px] font-black uppercase tracking-tighter hover:bg-purple-500/10 hover:text-purple-400 disabled:opacity-20"
                                            >
                                                <ArrowRightLeft size={14} /> 
                                                <span className="flex flex-col">
                                                    <span>Sub</span>
                                                    {match.lineups?.away?.substitutionCount > 0 && <span className="text-[7px] text-purple-600">{match.lineups.away.substitutionCount}/5</span>}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Timeline / Events */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 min-h-[400px]">
                                <CardHeader className="px-0 pt-0 mb-6 flex flex-row items-center justify-between">
                                    <h3 className="text-xl font-black uppercase tracking-tight italic">Match Timeline</h3>
                                    <History size={20} className="text-slate-500" />
                                </CardHeader>
                                <div className="space-y-4">
                                    {match.events?.length === 0 && (
                                        <p className="text-slate-600 italic text-center py-12">No events recorded yet.</p>
                                    )}
                                    {match.events?.slice().reverse().map((event: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <span className="text-blue-500 font-black italic w-12">{event.minute}'</span>
                                            <div className={`p-2 rounded-lg 
                                                ${event.type === 'Goal' ? 'bg-green-500/20 text-green-400' : 
                                                  event.type === 'YellowCard' ? 'bg-yellow-500/20 text-yellow-500' :
                                                  event.type === 'RedCard' ? 'bg-red-500/20 text-red-500' :
                                                  event.type === 'Save' ? 'bg-blue-500/20 text-blue-400' :
                                                  'bg-slate-800 text-slate-300'}`}>
                                                {event.type === 'Goal' && <Trophy size={14} />}
                                                {event.type === 'YellowCard' && <Flag size={14} />}
                                                {event.type === 'RedCard' && <ShieldAlert size={14} />}
                                                {event.type === 'Save' && <Shield size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold uppercase tracking-tight text-white">
                                                    {event.type} {event.goalType === 'Penalty' && <span className="text-red-500 text-[10px] ml-2">(PEN)</span>}
                                                </p>
                                                <p className={`text-[10px] uppercase font-black ${event.isInjured ? 'text-red-400' : 'text-slate-500'}`}>
                                                    {event.player} {event.assister && <span className="text-blue-400 normal-case font-medium ml-1">Assist: {event.assister}</span>}
                                                    {event.isInjured && <span className="ml-2 flex inline-flex items-center gap-1 text-red-500"><AlertCircle size={10} /> Injury Case</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="space-y-6">
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Match Controls</h3>
                                <div className="grid gap-4">
                                    {match.timer.halfStatus === 'HalfTime' ? (
                                        <Button 
                                            onClick={handleStartSecondHalf}
                                            size="lg"
                                            className="h-16 rounded-2xl font-black uppercase italic tracking-widest bg-blue-600 hover:bg-blue-500 text-white animate-pulse"
                                        >
                                            <Play className="mr-2" size={20} /> Start 2nd Half
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => handleTimerControl(!match.timer.isRunning)}
                                            size="lg"
                                            disabled={match.timer.halfStatus === 'FullTime'}
                                            className={`h-16 rounded-2xl font-black uppercase italic tracking-widest ${match.timer.isRunning ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                        >
                                            {match.timer.isRunning ? <Pause className="mr-2" size={20} /> : <Play className="mr-2" size={20} />}
                                            {match.timer.isRunning ? 'Pause Engine' : 'Resume Engine'}
                                        </Button>
                                    )}

                                    <Button 
                                        onClick={handleFinalize}
                                        variant="outline"
                                        className="h-16 border-slate-800 bg-slate-950 text-white hover:bg-slate-800 rounded-2xl font-black uppercase italic tracking-widest"
                                    >
                                        <CheckCircle2 size={20} className="mr-2 text-green-500" /> End Match
                                    </Button>
                                </div>
                            </Card>

                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 overflow-hidden relative">
                                <div className="absolute -right-4 -bottom-4 opacity-5">
                                    <ShieldAlert size={120} />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Live Insights</h3>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                    <p className="text-blue-400 text-xs font-bold italic uppercase tracking-tight">
                                        {match.score.home > match.score.away 
                                            ? `${match.homeTeam.name} is dominating possession and scoreline.`
                                            : match.score.away > match.score.home
                                            ? `${match.awayTeam.name} looking dangerous on the counter.`
                                            : "Balanced tactical battle in progress."}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="overview" className="space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {/* Match Info */}
                             <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 overflow-hidden relative">
                                 <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <LayoutDashboard size={120} />
                                 </div>
                                 <h3 className="text-xl font-black italic uppercase mb-6">Match Information</h3>
                                 <div className="space-y-4">
                                     <div className="flex justify-between items-center py-3 border-b border-white/5">
                                         <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Venue</span>
                                         <span className="font-bold">{match.venue || "Stadium Neutral"}</span>
                                     </div>
                                     <div className="flex justify-between items-center py-3 border-b border-white/5">
                                         <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Kick-off</span>
                                         <span className="font-bold">{new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                     </div>
                                     <div className="flex justify-between items-center py-3">
                                         <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Referee</span>
                                         <span className="font-bold text-slate-400 italic">TBD</span>
                                     </div>
                                 </div>
                             </Card>

                             {/* Venue Analysis */}
                             {(() => {
                                 const venueInfo = VENUE_ANALYSIS_DATA.find(v => v.name.toLowerCase().includes(match.venue?.toLowerCase() || ""));
                                 if (!venueInfo) return (
                                     <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center">
                                         <Clock size={48} className="text-slate-700 mb-4" />
                                         <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Venue data unavailable for this location</p>
                                     </Card>
                                 );
                                 const fbStats = venueInfo.stats as any;
                                 return (
                                     <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border-blue-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                                         <div className="absolute top-0 right-0 p-4">
                                             <div className="px-3 py-1 bg-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-lg">Official Venue</div>
                                         </div>
                                         <h4 className="text-xs font-black uppercase text-blue-400 mb-2 tracking-[0.2em]">Stadium Insight</h4>
                                         <h3 className="text-xl font-black italic uppercase mb-6 truncate">{venueInfo.name}</h3>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                 <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">Avg Goals</p>
                                                 <p className="text-2xl font-black italic text-white">{fbStats.avgGoalsPerMatch}</p>
                                             </div>
                                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                 <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">Home Win</p>
                                                 <p className="text-2xl font-black italic text-green-500">{fbStats.homeWinPct}%</p>
                                             </div>
                                         </div>
                                         <p className="mt-6 text-[10px] font-medium text-slate-400 line-clamp-2 italic leading-relaxed">
                                             {venueInfo.description}
                                         </p>
                                     </Card>
                                 );
                             })()}

                             {/* Recent Form */}
                             <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8">
                                 <h3 className="text-xl font-black italic uppercase mb-6">Recent Form</h3>
                                 <div className="space-y-6">
                                     <div>
                                         <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{match.homeTeam.name}</p>
                                            <span className="text-[8px] font-bold text-slate-500">LAST 5</span>
                                         </div>
                                         <div className="flex gap-2">
                                             {['W', 'W', 'D', 'W', 'L'].map((r, i) => (
                                                 <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${r === 'W' ? 'bg-green-500/20 text-green-500' : r === 'L' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                                                     {r}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                     <div>
                                         <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{match.awayTeam.name}</p>
                                            <span className="text-[8px] font-bold text-slate-500">LAST 5</span>
                                         </div>
                                         <div className="flex gap-2">
                                             {['L', 'D', 'W', 'L', 'L'].map((r, i) => (
                                                 <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${r === 'W' ? 'bg-green-500/20 text-green-500' : r === 'L' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                                                     {r}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </Card>
                         </div>
                    </TabsContent>

                     <TabsContent value="lineups" className="space-y-8 animate-in fade-in duration-700">
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex gap-4">
                                 <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                     <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Home: {match.lineups?.home?.formation}</span>
                                 </div>
                                 <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                     <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Away: {match.lineups?.away?.formation}</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 italic text-[10px] font-bold">
                                 <Users size={12} />
                                 <span>Click player to view live match stats</span>
                             </div>
                        </div>

                        <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-8 sm:p-12 overflow-hidden shadow-2xl relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <FootballPitchLineup 
                                homeTeam={{
                                    name: match.homeTeam?.name || 'Home Team',
                                    logo: match.homeTeam?.logo,
                                    primaryColor: '#2563eb'
                                }}
                                awayTeam={{
                                    name: match.awayTeam?.name || 'Away Team',
                                    logo: match.awayTeam?.logo,
                                    primaryColor: '#ea580c'
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

                    <TabsContent value="stats" className="space-y-8">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-12">
                                 <div className="max-w-3xl mx-auto space-y-12">
                                     {[
                                         { label: "Possession", home: match.stats.possession.home, away: match.stats.possession.away, suffix: "%" },
                                         { label: "Shots on Target", home: match.stats.shotsOnTarget.home, away: match.stats.shotsOnTarget.away },
                                         { label: "Fouls", home: match.stats.fouls.home, away: match.stats.fouls.away },
                                         { label: "Corners", home: match.stats.corners.home, away: match.stats.corners.away },
                                         { label: "Yellow Cards", home: match.stats.yellowCards?.home || 0, away: match.stats.yellowCards?.away || 0 },
                                         { label: "Red Cards", home: match.stats.redCards?.home || 0, away: match.stats.redCards?.away || 0 }
                                     ].map((stat, i) => (
                                         <div key={i} className="space-y-4">
                                             <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-3xl font-black italic text-white leading-none">{stat.home}{stat.suffix}</span>
                                                    <span className="text-[10px] uppercase font-black text-slate-500 mt-2 tracking-widest">{match.homeTeam?.name || 'Home'}</span>
                                                </div>
                                                <span className="font-black uppercase italic tracking-tighter text-slate-400">{stat.label}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-3xl font-black italic text-white leading-none">{stat.away}{stat.suffix}</span>
                                                    <span className="text-[10px] uppercase font-black text-slate-500 mt-2 tracking-widest">{match.awayTeam?.name || 'Away'}</span>
                                                </div>
                                             </div>
                                             <div className="h-3 bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
                                                 <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(stat.home / (stat.home + stat.away)) * 100 || 50}%` }} />
                                                 <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(stat.away / (stat.home + stat.away)) * 100 || 50}%` }} />
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </Card>

                             <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
                                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 w-full">Possession Share</h3>
                                 <div className="h-[300px] w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <PieChart>
                                             <Pie
                                                data={[
                                                    { name: 'Home', value: match.stats?.possession?.home || 50 },
                                                    { name: 'Away', value: match.stats?.possession?.away || 50 }
                                                ]}
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                             >
                                                 <Cell fill="#2563eb" />
                                                 <Cell fill="#ea580c" />
                                             </Pie>
                                             <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                         </PieChart>
                                     </ResponsiveContainer>
                                 </div>
                                 <div className="flex gap-8 mt-4">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full bg-blue-600" />
                                         <span className="text-xs font-bold uppercase tracking-widest">Home</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full bg-orange-600" />
                                         <span className="text-xs font-bold uppercase tracking-widest">Away</span>
                                     </div>
                                 </div>
                             </Card>
                         </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-10 animate-in fade-in zoom-in duration-700">
                         {/* TOP ROW: xG, Style, Intensity */}
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Expected Goals (xG) Module */}
                            <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center justify-between min-h-[350px] relative overflow-hidden group">
                                <div className="absolute top-8 left-10 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                        <Swords size={20} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Expected Goals (xG)</span>
                                </div>
                                <div className="flex items-center gap-12 mt-12 mb-8">
                                    <div className="flex flex-col items-center">
                                        <span className="text-7xl font-black italic tracking-tighter text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] tabular-nums">{match.performance?.labAnalysis?.expectedGoals?.home || '0.0'}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">{match.homeTeam?.name || 'Home'}</span>
                                    </div>
                                    <div className="text-4xl font-light text-slate-700">+</div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-7xl font-black italic tracking-tighter text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] tabular-nums">{match.performance?.labAnalysis?.expectedGoals?.away || '0.0'}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">{match.awayTeam?.name || 'Away'}</span>
                                    </div>
                                </div>
                                <div className="text-center px-10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 leading-relaxed italic">
                                        DERIVED FROM QUALITY AND VOLUME<br/>OF ATTEMPTS IN SCORING ZONES
                                    </p>
                                </div>
                            </div>

                            {/* Style Analysis Module */}
                            <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-between min-h-[350px]">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                        <PieChartIcon size={20} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Style Analysis</span>
                                </div>
                                <div className="space-y-10 px-2 flex-grow flex flex-col justify-center">
                                    {[
                                        { label: 'Build-up', val: match.performance?.labAnalysis?.possessionPhases?.buildup || 27, color: 'bg-blue-500' },
                                        { label: 'Attacking', val: match.performance?.labAnalysis?.possessionPhases?.attack || 45, color: 'bg-purple-500' },
                                        { label: 'Defensive', val: match.performance?.labAnalysis?.possessionPhases?.defense || 33, color: 'bg-slate-400' }
                                    ].map(phase => (
                                        <div key={phase.label} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{phase.label}</span>
                                                <span className="text-sm font-black italic text-white tabular-nums">{phase.val}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full ${phase.color} shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-1000`} style={{ width: `${phase.val}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Intensity Pulse Module */}
                            <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-between min-h-[350px] relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                                            <Activity size={20} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Intensity Pulse (Active/Passive)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Stream Live</span>
                                    </div>
                                </div>
                                <div className="h-[180px] w-full bg-purple-950/5 rounded-2xl overflow-hidden mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={match.performance?.labAnalysis?.intensityPulse || []}>
                                            <defs>
                                                <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Area 
                                                type="step" 
                                                dataKey="value" 
                                                stroke="#a855f7" 
                                                fill="url(#intensityGrad)" 
                                                strokeWidth={3} 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-between items-center mt-6 px-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Low Demand</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 italic">Physical Peak</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Consolidation</span>
                                </div>
                            </div>
                         </div>

                         {/* BOTTOM ROW: Momentum History with Event Pins */}
                         <div className="bg-[#050505] border border-white/5 rounded-[4rem] p-12 relative overflow-hidden group">
                             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-8">
                                 <div className="flex items-center gap-6">
                                     <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                                         <Activity size={28} />
                                     </div>
                                     <div>
                                        <h3 className="text-4xl font-black italic uppercase tracking-tight text-white mb-1">Match Momentum</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Minute by minute momentum swings</p>
                                     </div>
                                 </div>
                                 <div className="flex flex-wrap items-center gap-6">
                                     <div className="flex items-center gap-3">
                                         <div className="w-3 h-3 rounded-full bg-blue-500" />
                                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{match.homeTeam?.name?.slice(0, 3) || 'HOM'}</span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="w-3 h-3 rounded-full bg-orange-500" />
                                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{match.awayTeam?.name?.slice(0, 3) || 'AWA'}</span>
                                     </div>
                                     <div className="flex gap-4 ml-4">
                                         <div className="px-6 py-2 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Home Control</div>
                                         <div className="px-6 py-2 bg-orange-900/20 border border-orange-500/30 rounded-xl text-orange-400 text-[9px] font-black uppercase tracking-[0.2em]">Away Control</div>
                                     </div>
                                 </div>
                             </div>

                             <div className="h-[300px] w-full relative">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={match.performance?.momentumHistory || []}>
                                         <defs>
                                             <linearGradient id="homeMomGrad" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                             </linearGradient>
                                             <linearGradient id="awayMomGrad" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                             </linearGradient>
                                         </defs>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                         <XAxis dataKey="minute" hide />
                                         <YAxis hide domain={[0, 100]} />
                                         <Tooltip 
                                            contentStyle={{ backgroundColor: '#050505', border: '1px solid #1e293b', borderRadius: '1.5rem', padding: '1rem' }}
                                            itemStyle={{ fontWeight: '900', fontSize: '10px' }}
                                         />
                                         <Area 
                                            type="monotone" 
                                            dataKey="home" 
                                            stroke="#3b82f6" 
                                            fill="url(#homeMomGrad)" 
                                            strokeWidth={4}
                                            animationDuration={2000}
                                         />
                                         <Area 
                                            type="monotone" 
                                            dataKey="away" 
                                            stroke="#ef4444" 
                                            fill="url(#awayMomGrad)" 
                                            strokeWidth={4}
                                            animationDuration={2000}
                                         />
                                     </AreaChart>
                                 </ResponsiveContainer>
                             </div>

                             {/* EVENT PINS ROW */}
                             <div className="flex flex-wrap items-center gap-3 mt-8 pb-4 border-t border-white/5 pt-8">
                                 {match.events?.filter((e: any) => ['Goal', 'YellowCard', 'RedCard'].includes(e.type)).map((e: any, i: number) => {
                                     const homeId = typeof match.homeTeam === 'object' ? match.homeTeam?._id : match.homeTeam;
                                     const eventTeamId = typeof e.team === 'object' ? e.team?._id : e.team;
                                     const isHome = String(eventTeamId) === String(homeId);
                                     
                                     return (
                                         <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-slate-900/40 backdrop-blur-md transition-all hover:scale-105 cursor-default ${isHome ? 'border-blue-500/20 text-blue-400' : 'border-orange-500/20 text-orange-400'}`}>
                                             <span className="text-[10px] font-black italic">{e.minute}'</span>
                                             {e.type === 'Goal' ? <Trophy size={10} /> : <div className={`w-2 h-2.5 rounded-[1px] ${e.type === 'YellowCard' ? 'bg-yellow-400' : 'bg-red-600'}`} />}
                                             <span className="text-[10px] font-black uppercase tracking-widest">{e.player?.split(' ').pop()}</span>
                                         </div>
                                     );
                                 })}
                                 {match.events?.filter((e: any) => ['Goal', 'YellowCard', 'RedCard'].includes(e.type)).length === 0 && (
                                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 italic">No major tactical breakthroughs recorded yet...</p>
                                 )}
                             </div>
                         </div>

                         {/* PERFORMANCE ANALYTICS GRID: Impact and Phases */}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Impact Index Hub */}
                             <div className="bg-[#050505] border border-white/5 rounded-[4rem] p-12">
                                 <div className="flex items-center gap-6 mb-12">
                                     <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                         <Zap size={28} />
                                     </div>
                                     <div>
                                        <h3 className="text-4xl font-black italic uppercase tracking-tight text-white mb-1">Impact Index</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top performers by calculated impact score</p>
                                     </div>
                                 </div>
                                 <div className="h-[300px] w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <BarChart 
                                            layout="vertical" 
                                            data={(match.performance?.topPerformers || []).slice(0, 6).map((p: any) => ({
                                                name: p.name?.split(' ').pop() || 'N/A',
                                                score: p.score || 0,
                                                team: p.team
                                            }))}
                                            margin={{ left: 20, right: 30 }}
                                         >
                                             <XAxis type="number" hide domain={[0, 10]} />
                                             <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} width={80} />
                                             <Tooltip 
                                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                contentStyle={{ backgroundColor: '#050505', border: '1px solid #1e293b', borderRadius: '1rem' }}
                                             />
                                             <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                                {(match.performance?.topPerformers || []).slice(0, 6).map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.team === 'H' ? '#3b82f6' : '#ef4444'} />
                                                ))}
                                             </Bar>
                                         </BarChart>
                                     </ResponsiveContainer>
                                 </div>
                             </div>

                             {/* Phase Breakdown Hub */}
                             <div className="bg-[#050505] border border-white/5 rounded-[4rem] p-12 relative overflow-hidden group">
                                 <div className="flex items-center gap-6 mb-12">
                                     <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                                         <Clock size={28} />
                                     </div>
                                     <div>
                                        <h3 className="text-4xl font-black italic uppercase tracking-tight text-white mb-1">Phase Breakdown</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Performance split by match phases</p>
                                     </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-8">
                                     <div className="space-y-4">
                                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center">Shots per Phase</p>
                                         <div className="h-[200px] w-full">
                                             <ResponsiveContainer width="100%" height="100%">
                                                 <BarChart data={[
                                                     { name: '0-30', home: match.stats?.shotsOnTarget?.home || 4, away: match.stats?.shotsOnTarget?.away || 2 },
                                                     { name: '31-60', home: (match.stats?.shotsOnTarget?.home || 4) + 1, away: (match.stats?.shotsOnTarget?.away || 2) + 2 },
                                                     { name: '61-90', home: (match.stats?.shotsOnTarget?.home || 4) + 2, away: (match.stats?.shotsOnTarget?.away || 2) + 1 }
                                                 ]}>
                                                     <XAxis dataKey="name" fontSize={9} stroke="#475569" axisLine={false} tickLine={false} />
                                                     <Bar dataKey="home" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                                     <Bar dataKey="away" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                                 </BarChart>
                                             </ResponsiveContainer>
                                         </div>
                                     </div>
                                     <div className="space-y-4">
                                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center">Activity Distribution</p>
                                         <div className="h-[200px] w-full">
                                             <ResponsiveContainer width="100%" height="100%">
                                                 <PieChart>
                                                     <Pie
                                                        data={[
                                                            { name: '0-30', value: 30 },
                                                            { name: '31-60', value: 45 },
                                                            { name: '61-90', value: 25 }
                                                        ]}
                                                        innerRadius={40}
                                                        outerRadius={65}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                     >
                                                         {['#06b6d4', '#f59e0b', '#ef4444'].map((color, i) => (
                                                             <Cell key={`cell-${i}`} fill={color} />
                                                         ))}
                                                     </Pie>
                                                     <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                                                 </PieChart>
                                             </ResponsiveContainer>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </TabsContent>
                </Tabs>
                    </>
                )}
            </div>

            {/* Event Selection Dialog */}
            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <span className={
                                eventType === 'Goal' ? 'text-green-500' : 
                                eventType === 'YellowCard' ? 'text-yellow-500' : 
                                eventType === 'RedCard' ? 'text-red-500' :
                                eventType === 'Substitution' ? 'text-purple-500' :
                                eventType === 'Save' ? 'text-blue-400' :
                                eventType === 'ShotOnTarget' ? 'text-blue-500' :
                                'text-slate-400'
                            }>
                                {eventType === 'Goal' && <Circle className="fill-current" />}
                                {eventType === 'YellowCard' && <Flag />}
                                {eventType === 'RedCard' && <ShieldAlert />}
                                {eventType === 'Save' && <Shield />}
                                {eventType === 'Substitution' && <ArrowRightLeft />}
                                {eventType === 'ShotOnTarget' && <Target />}
                                {eventType === 'ShotOffTarget' && <Circle />}
                                {eventType === 'Corner' && <Flag className="rotate-45" />}
                                {eventType === 'Foul' && <AlertCircle />}
                                {eventType === 'Offside' && <Flag className="rotate-45" />}
                            </span>
                            Record {eventType.replace(/([A-Z])/g, ' $1').trim()}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                            Team: {eventTeam?.name} • Minute: {Math.floor(secondsElapsed / 60)}'
                            {goalStep > 0 && ` • Scorer: ${selectedScorer}`}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="max-h-[350px] overflow-y-auto mt-6 pr-2 custom-scrollbar">
                           {/* Step 5: Foul Card Inquiry */}
                           {foulInquiryStep && (
                               <div className="grid gap-6 p-4 text-center animate-in zoom-in-95 duration-300">
                                   <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                                       <AlertTriangle size={40} className="animate-pulse" />
                                   </div>
                                   <div className="space-y-2">
                                       <h3 className="text-xl font-black italic uppercase tracking-tight">Disciplinary Action?</h3>
                                       <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                                           Does this foul by {pendingEvent?.player} deserve a card?
                                       </p>
                                   </div>
                                   <div className="grid gap-3">
                                       <div className="grid grid-cols-2 gap-3">
                                           <Button 
                                               onClick={() => handleFoulDecision('YellowCard')}
                                               className="h-16 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-tight flex items-center justify-center gap-2"
                                           >
                                               <Flag size={18} /> Yellow
                                           </Button>
                                           <Button 
                                               onClick={() => handleFoulDecision('RedCard')}
                                               className="h-16 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black italic uppercase tracking-tight flex items-center justify-center gap-2"
                                           >
                                               <ShieldAlert size={18} /> Red Card
                                           </Button>
                                       </div>
                                       <Button 
                                           onClick={() => handleFoulDecision('None')}
                                           variant="outline"
                                           className="h-14 border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-xl font-black italic uppercase tracking-tight text-slate-500"
                                       >
                                           No Card (Foul Only)
                                       </Button>
                                   </div>
                               </div>
                           )}

                          {/* Step 4: Goalkeeper Save Inquiry (Shot/Corner) */}
                          {saveInquiryStep && (
                              <div className="grid gap-6 p-4 text-center animate-in zoom-in-95 duration-300">
                                  <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                      <Shield size={40} className="animate-pulse" />
                                  </div>
                                  <div className="space-y-2">
                                      <h3 className="text-xl font-black italic uppercase tracking-tight">Goalkeeper Save?</h3>
                                      <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                                          Was this {pendingEvent?.type.replace(/([A-Z])/g, ' $1').trim()} saved by the opposing keeper?
                                      </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <Button 
                                          onClick={() => handleSaveDecision(true)}
                                          className="h-16 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black italic uppercase tracking-tight flex flex-col gap-1"
                                      >
                                          <CheckCircle2 size={16} />
                                          <span>Yes, Saved</span>
                                      </Button>
                                      <Button 
                                          onClick={() => handleSaveDecision(false)}
                                          variant="outline"
                                          className="h-16 border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-2xl font-black italic uppercase tracking-tight flex flex-col gap-1 text-slate-400"
                                      >
                                          <X size={16} />
                                          <span>No Save</span>
                                      </Button>
                                  </div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                      Selecting "Yes" will record two events simultaneously.
                                  </p>
                              </div>
                          )}

                          {/* Step 0: Select Scorer / Player */}
                          {goalStep === 0 && subStep === 0 && !saveInquiryStep && !foulInquiryStep && (
                             <div className="grid gap-2">
                                 {eventType === 'Substitution' && (
                                     <div 
                                        className={`mb-4 p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isInjured ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-950/50 border-white/5 text-slate-500'}`}
                                        onClick={() => setIsInjured(!isInjured)}
                                     >
                                         <div className="flex items-center gap-3">
                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isInjured ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-900'}`}>
                                                 <Activity size={18} />
                                             </div>
                                             <div>
                                                 <p className="text-xs font-black uppercase tracking-tight">Injury Case?</p>
                                                 <p className="text-[9px] opacity-60">Tick if substitution is due to player injury</p>
                                             </div>
                                         </div>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isInjured ? 'bg-red-500 border-red-500 text-white' : 'border-white/20'}`}>
                                             {isInjured && <CheckCircle2 size={12} />}
                                         </div>
                                     </div>
                                 )}

                                 <h4 className="text-[10px] font-black uppercase text-slate-500 px-2 mb-1">
                                     {eventType === 'Substitution' ? 'Step 1: Select Player Coming OUT' : 'Select Player'}
                                 </h4>

                                 {eventTeam?.players?.filter((p: any) => {
                                     const side = String(eventTeam?._id) === String(match.homeTeam?._id || match.homeTeam) ? 'home' : 'away';
                                     const startingXI = match.lineups?.[side]?.startingXI || [];
                                     const events = match.events || [];
                                     const isSubbedOut = events.some((e: any) => e.type === 'Substitution' && e.playerOut === p.name);
                                     const isSubbedIn = events.some((e: any) => e.type === 'Substitution' && e.player === p.name);
                                     const pEvents = summarizePlayerEvents(p.name, events);
                                     const hasRedCard = pEvents.redCards > 0 || pEvents.yellowCards >= 2;
                                     const isOnField = (startingXI.includes(p.name) || isSubbedIn) && !isSubbedOut;
                                     return isOnField && !hasRedCard;
                                 })?.map((player: any) => (
                                     <Button 
                                        key={player.number}
                                        onClick={() => {
                                            if (eventType === 'Goal') {
                                                setSelectedScorer(player.name);
                                                setGoalStep(1);
                                            } else if (eventType === 'Substitution') {
                                                setSelectedPlayerOut(player.name);
                                                setSubStep(1);
                                            } else {
                                                handleAddEvent(eventType, eventTeam._id, player.name);
                                            }
                                        }}
                                        variant="outline"
                                        className="justify-start h-12 border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-xl group"
                                     >
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mr-3 border border-white/5 font-black text-xs text-slate-500 group-hover:text-blue-400">
                                            {player.number}
                                        </div>
                                        <span className="font-bold flex-1 text-left">{player.name}</span>
                                        <ArrowRightLeft size={16} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                     </Button>
                                 ))}
                                 <Button 
                                    onClick={() => {
                                        if (eventType === 'Goal') {
                                             setSelectedScorer("Unknown Player");
                                             setGoalStep(1);
                                         } else if (eventType === 'Substitution') {
                                             setSelectedPlayerOut("Unknown Player");
                                             setSubStep(1);
                                         } else {
                                             handleAddEvent(eventType, eventTeam._id, "Unknown Player");
                                         }
                                    }}
                                    variant="ghost"
                                    className="justify-start h-12 rounded-xl text-slate-500 hover:text-white"
                                 >
                                     Record for "Unknown Player"
                                 </Button>
                             </div>
                         )}

                         {/* Step 1: Select Goal Type */}
                         {goalStep === 1 && (
                             <div className="grid gap-3 p-2">
                                 <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Select Goal Type</h4>
                                 {[
                                     { id: 'OpenPlay', label: 'Open Play Goal', icon: <Play size={16} /> },
                                     { id: 'Assisted', label: 'Assisted Goal', icon: <Users size={16} /> },
                                     { id: 'Penalty', label: 'Penalty', icon: <Target size={16} /> },
                                     { id: 'FreeKick', label: 'Free Kick', icon: <Circle size={16} className="fill-current" /> }
                                 ].map((type) => (
                                     <Button
                                        key={type.id}
                                        onClick={() => {
                                            if (type.id === 'Assisted') {
                                                setSelectedGoalType('Assisted');
                                                setGoalStep(2);
                                            } else {
                                                handleAddEvent('Goal', eventTeam._id, selectedScorer, undefined, type.id);
                                            }
                                        }}
                                        variant="outline"
                                        className="h-16 justify-start gap-4 border-slate-800 bg-slate-950 rounded-2xl hover:border-blue-500/50"
                                     >
                                         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-500">
                                             {type.icon}
                                         </div>
                                         <span className="font-black italic uppercase tracking-tight">{type.label}</span>
                                     </Button>
                                 ))}
                             </div>
                         )}

                         {/* Step 2: Select Assister */}
                         {goalStep === 2 && (
                             <div className="grid gap-2">
                                 <h4 className="text-xs font-black uppercase text-slate-500 mb-4 px-2">Select Assister</h4>
                                 {eventTeam?.players?.filter((p: any) => {
                                     const side = String(eventTeam?._id) === String(match.homeTeam?._id || match.homeTeam) ? 'home' : 'away';
                                     const startingXI = match.lineups?.[side]?.startingXI || [];
                                     const events = match.events || [];
                                     const isSubbedOut = events.some((e: any) => e.type === 'Substitution' && e.playerOut === p.name);
                                     const isSubbedIn = events.some((e: any) => e.type === 'Substitution' && e.player === p.name);
                                     const pEvents = summarizePlayerEvents(p.name, events);
                                     const hasRedCard = pEvents.redCards > 0 || pEvents.yellowCards >= 2;
                                     const isOnField = (startingXI.includes(p.name) || isSubbedIn) && !isSubbedOut;
                                     return isOnField && p.name !== selectedScorer && !hasRedCard;
                                 }).map((player: any) => (
                                     <Button 
                                        key={player.number}
                                        onClick={() => handleAddEvent('Goal', eventTeam._id, selectedScorer, player.name, 'Assisted')}
                                        variant="outline"
                                        className="justify-start h-12 border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-xl group"
                                     >
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mr-3 border border-white/5 font-black text-xs text-slate-500 group-hover:text-blue-400">
                                            {player.number}
                                        </div>
                                        <span className="font-bold flex-1 text-left">{player.name}</span>
                                        <Circle size={16} className="text-blue-500 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                                     </Button>
                                 ))}
                                 <Button 
                                    onClick={() => handleAddEvent('Goal', eventTeam._id, selectedScorer, "No Assist", 'Assisted')}
                                    variant="ghost"
                                    className="justify-start h-12 rounded-xl text-slate-500 hover:text-white"
                                 >
                                     No official assist
                                 </Button>
                             </div>
                          )}

                          {/* Step 3: Substitution - Select Player In */}
                          {eventType === 'Substitution' && subStep === 1 && (
                              <div className="grid gap-2 animate-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center justify-between px-2 mb-4">
                                      <h4 className="text-xs font-black uppercase text-slate-500">Step 2: Select Player Coming IN</h4>
                                      <Button variant="ghost" size="sm" onClick={() => setSubStep(0)} className="h-6 text-[10px] uppercase font-black text-blue-400">Back</Button>
                                  </div>

                                  <div className="p-3 bg-slate-950/80 border border-white/5 rounded-2xl mb-4 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                          <ArrowDownLeft size={16} />
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-black uppercase text-slate-500 leading-none mb-1">Coming Out</p>
                                          <p className="text-sm font-bold text-white">{selectedPlayerOut}</p>
                                      </div>
                                      {isInjured && (
                                          <div className="ml-auto px-3 py-1 bg-red-600 rounded-full text-[8px] font-black uppercase text-white shadow-lg animate-pulse">
                                              Injury Case
                                          </div>
                                      )}
                                  </div>

                                  {eventTeam?.players?.filter((p: any) => {
                                      const side = String(eventTeam?._id) === String(match.homeTeam?._id || match.homeTeam) ? 'home' : 'away';
                                      const substitutes = match.lineups?.[side]?.substitutes || [];
                                      const events = match.events || [];
                                      const isSubbedIn = events.some((e: any) => e.type === 'Substitution' && e.player === p.name);
                                      const pEvents = summarizePlayerEvents(p.name, events);
                                     const hasRedCard = pEvents.redCards > 0 || pEvents.yellowCards >= 2;
                                      return substitutes.includes(p.name) && !isSubbedIn && !hasRedCard;
                                  }).map((player: any) => (
                                      <Button 
                                         key={player.number}
                                         onClick={() => handleAddEvent('Substitution', eventTeam._id, player.name, undefined, undefined, selectedPlayerOut)}
                                         variant="outline"
                                         className="justify-start h-12 border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-xl group"
                                      >
                                         <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mr-3 border border-white/5 font-black text-xs text-slate-500 group-hover:text-green-400">
                                             {player.number}
                                         </div>
                                         <span className="font-bold flex-1 text-left">{player.name}</span>
                                         <ArrowUpRight size={16} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Button>
                                  ))}
                              </div>
                          )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Injury Time Dialog */}
            <Dialog open={showInjuryPrompt} onOpenChange={setShowInjuryPrompt}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                            <Clock className="text-orange-500" />
                            Stoppage Time
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                            Approaching the end of the {match?.timer?.half === 1 ? '1st' : '2nd'} half.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-4">
                        <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Extra Minutes to Add</Label>
                        <div className="flex items-center gap-4">
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl border-slate-800 bg-slate-950"
                                onClick={() => setTempInjuryTime(Math.max(0, tempInjuryTime - 1))}
                             >
                                <Minus size={16} />
                             </Button>
                             <div className="flex-1 text-center bg-slate-950 border border-slate-800 rounded-xl h-12 flex items-center justify-center text-2xl font-black italic">
                                {tempInjuryTime}
                             </div>
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl border-slate-800 bg-slate-950"
                                onClick={() => setTempInjuryTime(tempInjuryTime + 1)}
                             >
                                <Plus size={16} />
                             </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full h-12 bg-orange-600 hover:bg-orange-500 rounded-xl font-black uppercase italic"
                            onClick={handleSetInjuryTime}
                        >
                            Confirm Extra Time
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
