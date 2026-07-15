import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Trophy, Users, Swords, BarChart3, ArrowLeft, Plus, 
    Loader2, Calendar, Shield, Goal, CreditCard, 
    TrendingUp, UserPlus, Trash2, ChevronRight, Settings, Camera, Upload
} from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Sector, Legend, RadialBarChart, RadialBar, LineChart, Line } from "recharts";

export default function FootballTeamProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [teamData, setTeamData] = useState<any>(null);
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
    const [editTeamData, setEditTeamData] = useState({ name: "", logo: "", acronym: "" });
    const [newPlayer, setNewPlayer] = useState({ name: "", number: "", role: "Forward", isCaptain: false });
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        try {
            const res: any = await footballApi.getTeamById(id!);
            if (res.success) {
                setTeamData(res.data);
                setEditTeamData({ 
                    name: res.data.team.name, 
                    logo: res.data.team.logo || "",
                    acronym: res.data.team.acronym || ""
                });
            }
        } catch (error) {
            toast.error("Failed to load team data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleAddPlayer = async () => {
        if (!newPlayer.name) return;
        setIsUpdating(true);
        try {
            const updatedPlayers = [...(teamData.team.players || []), {
                name: newPlayer.name,
                number: Number(newPlayer.number) || 0,
                role: newPlayer.role,
                isCaptain: newPlayer.isCaptain
            }];

            const res: any = await footballApi.updateTeam(id!, { players: updatedPlayers });
            if (res.success) {
                toast.success("Player registered successfully!");
                setNewPlayer({ name: "", number: "", role: "Forward", isCaptain: false });
                setIsAddPlayerOpen(false);
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to add player");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemovePlayer = async (index: number) => {
        if (!window.confirm("Remove this player?")) return;
        setIsUpdating(true);
        try {
            const updatedPlayers = teamData.team.players.filter((_: any, i: number) => i !== index);
            const res: any = await footballApi.updateTeam(id!, { players: updatedPlayers });
            if (res.success) {
                toast.success("Player removed");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to remove player");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateTeam = async () => {
        if (!editTeamData.name) return;
        setIsUpdating(true);
        try {
            const res: any = await footballApi.updateTeam(id!, editTeamData);
            if (res.success) {
                toast.success("Team updated successfully");
                setIsEditTeamOpen(false);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update team");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setEditTeamData(prev => ({ ...prev, logo: base64 }));
            // Also update the hidden file input so a new file can be selected again
            e.target.value = "";
            toast.success("Logo uploaded successfully (preview synced)");
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );

    if (!teamData) return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-white">
            <h1 className="text-2xl font-bold">Team Not Found</h1>
            <Button onClick={() => navigate("/create")}>Back to Hub</Button>
        </div>
    );

    const { team, matches, recentForm, playerStats } = teamData;

    const squadByPosition = {
        Goalkeeper: team.players?.filter((p: any) => p.role === "Goalkeeper") || [],
        Defender: team.players?.filter((p: any) => p.role === "Defender") || [],
        Midfielder: team.players?.filter((p: any) => p.role === "Midfielder") || [],
        Forward: team.players?.filter((p: any) => p.role === "Forward") || []
    };

    const chartData = Object.entries(playerStats)
        .map(([name, stats]: [string, any]) => ({ name, goals: stats.goals || 0, assists: stats.assists || 0 }))
        .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
        .slice(0, 5);

    const totalAssists = (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.assists || 0), 0);

    const completedMatches = matches.filter((m: any) => m.status === 'Completed');
    let totalGoalsScored = 0;
    let totalGoalsConceded = 0;
    let cleanSheets = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    completedMatches.forEach((m: any) => {
        const isHome = m.homeTeam?._id === team._id || m.homeTeam?.name === team.name;
        const scored = isHome ? (m.score?.home || 0) : (m.score?.away || 0);
        const conceded = isHome ? (m.score?.away || 0) : (m.score?.home || 0);
        
        totalGoalsScored += scored;
        totalGoalsConceded += conceded;
        
        if (conceded === 0) cleanSheets++;
        if (scored > conceded) wins++;
        else if (scored === conceded) draws++;
        else losses++;
    });
    
    const winRate = completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;

    const totalYellows = (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0), 0);
    const totalReds = (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.redCards || 0), 0);

    const formTimeline = completedMatches.slice().reverse().map((m: any, i: number) => {
        const isHome = m.homeTeam?._id === team._id || m.homeTeam?.name === team.name;
        return {
            match: `M${i+1}`,
            scored: isHome ? (m.score?.home || 0) : (m.score?.away || 0),
            conceded: isHome ? (m.score?.away || 0) : (m.score?.home || 0),
        };
    });

    const radarData = [
        { subject: 'Attack', value: Math.round(Math.min(100, (totalGoalsScored / Math.max(1, completedMatches.length)) * 30 + 40)) },
        { subject: 'Defense', value: Math.round(Math.min(100, (cleanSheets * 15) + (totalGoalsConceded < completedMatches.length ? 30 : 0) + 40)) },
        { subject: 'Tactics', value: Math.round(Math.min(100, winRate + 20)) },
        { subject: 'Discipline', value: Math.round(Math.max(20, 100 - (totalYellows * 5 + totalReds * 15))) },
        { subject: 'Form', value: Math.round(Math.min(100, (recentForm.filter((f: string) => f === 'W').length * 20) + 40)) },
    ];

    const goalsByPosition = [
        { name: 'Forwards', value: squadByPosition.Forward.reduce((acc: number, p: any) => acc + (playerStats[p.name]?.goals || 0), 0) },
        { name: 'Midfielders', value: squadByPosition.Midfielder.reduce((acc: number, p: any) => acc + (playerStats[p.name]?.goals || 0), 0) },
        { name: 'Defenders', value: squadByPosition.Defender.reduce((acc: number, p: any) => acc + (playerStats[p.name]?.goals || 0), 0) },
    ].filter(d => d.value > 0);
    const positionColors = ['#3b82f6', '#10b981', '#6366f1'];

    let currentPoints = 0;
    const pointsData = formTimeline.map((m: any) => {
        if (m.scored > m.conceded) currentPoints += 3;
        else if (m.scored === m.conceded) currentPoints += 1;
        return { match: m.match, points: currentPoints, scored: m.scored, conceded: m.conceded };
    });

    let homeGoals = 0, homeConceded = 0, awayGoals = 0, awayConceded = 0;
    completedMatches.forEach((m: any) => {
        const isHome = m.homeTeam?._id === team._id || m.homeTeam?.name === team.name;
        if (isHome) {
            homeGoals += (m.score?.home || 0);
            homeConceded += (m.score?.away || 0);
        } else {
            awayGoals += (m.score?.away || 0);
            awayConceded += (m.score?.home || 0);
        }
    });

    const homeAwayData = [
        { category: 'Home', Scored: homeGoals, Conceded: homeConceded },
        { category: 'Away', Scored: awayGoals, Conceded: awayConceded }
    ];

    const topContributors = [...chartData]
        .map((d: any, index: number) => ({
            name: d.name,
            total: d.goals + d.assists,
            fill: positionColors[index % positionColors.length]
        }))
        .sort((a,b) => b.total - a.total)
        .slice(0, 5);

    const completeSquadAnalytics = Object.entries(playerStats).map(([name, stats]: [string, any]) => {
        const playerObj = team.players?.find((p:any) => p.name === name);
        const role = playerObj?.role || 'Unknown';
        const goals = stats.goals || 0;
        const assists = stats.assists || 0;
        const yellowCards = stats.yellowCards || 0;
        const redCards = stats.redCards || 0;
        
        const rawScore = (goals * 3) + (assists * 2) - (yellowCards * 1) - (redCards * 3);
        const matchCount = Math.max(1, completedMatches.length);
        const efficacy = Math.min(10, Math.max(0, 5 + (rawScore / matchCount))).toFixed(1);

        return {
            name,
            role,
            goals,
            assists,
            contributions: goals + assists,
            yellowCards,
            redCards,
            efficacy: parseFloat(efficacy)
        };
    }).sort((a,b) => b.contributions - a.contributions);

    const resultDistribution = [
        { name: 'Wins', value: wins, fill: '#3b82f6' },
        { name: 'Draws', value: draws, fill: '#64748b' },
        { name: 'Losses', value: losses, fill: '#f43f5e' }
    ].filter(d => d.value > 0);

    const differentialData = formTimeline.map((m: any) => ({
        match: m.match,
        differential: m.scored - m.conceded
    }));

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20">
            <Navbar />
            
            <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)}
                    className="w-fit mb-6 -ml-4 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                
                {/* Team Main Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group/logo w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-secondary/50 border border-border/50 overflow-hidden shadow-sm flex-shrink-0 transition-all hover:shadow-md">
                            {team.logo ? (
                                <img src={team.logo} className="w-full h-full object-contain p-3" alt={team.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                    <Trophy size={40} />
                                </div>
                            )}
                            <button 
                                onClick={() => setIsEditTeamOpen(true)}
                                className="absolute inset-0 bg-background/80 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all backdrop-blur-sm cursor-pointer"
                            >
                                <Camera className="text-foreground" size={24} />
                                <span className="text-[10px] font-bold tracking-wider text-foreground uppercase">Update</span>
                            </button>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                                {team.name}
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide rounded-full border border-primary/20">
                                    Pro Club
                                </span>
                                {team.acronym && (
                                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        {team.acronym}
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 border-l border-border/50 pl-3">
                                    <Calendar size={12} /> Established {new Date(team.createdAt || Date.now()).getFullYear()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-xl font-semibold border-border/50 hover:bg-secondary">
                                    <Settings size={16} className="mr-2" /> Team Settings
                                </Button>
                            </DialogTrigger>
                                    <DialogContent className="bg-card border-border/50 text-foreground rounded-3xl max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight">Edit Team Profile</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-5 mt-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Team Name</Label>
                                                    <Input 
                                                        className="bg-secondary/50 border-border/50 h-10 rounded-xl" 
                                                        value={editTeamData.name}
                                                        onChange={e => setEditTeamData({...editTeamData, name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Acronym</Label>
                                                    <Input 
                                                        className="bg-secondary/50 border-border/50 h-10 rounded-xl uppercase" 
                                                        maxLength={4}
                                                        placeholder="e.g. FCB"
                                                        value={editTeamData.acronym}
                                                        onChange={e => setEditTeamData({...editTeamData, acronym: e.target.value.toUpperCase()})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Logo URL</Label>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            className="bg-secondary/50 border-border/50 h-10 rounded-xl flex-1" 
                                                            placeholder="https://..." 
                                                            value={editTeamData.logo}
                                                            onChange={e => setEditTeamData({...editTeamData, logo: e.target.value})}
                                                        />
                                                        <div className="relative">
                                                            <input 
                                                                type="file" 
                                                                id="team-logo-upload" 
                                                                className="hidden" 
                                                                accept="image/*"
                                                                onChange={handleLogoUpload}
                                                            />
                                                            <Button 
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-10 w-10 border-border/50 rounded-xl hover:bg-secondary transition-all"
                                                                onClick={() => document.getElementById('team-logo-upload')?.click()}
                                                            >
                                                                <Upload size={16} className="text-primary" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {editTeamData.logo && (
                                                    <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 flex items-center justify-between group/preview">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-background border border-border/50 overflow-hidden flex items-center justify-center p-1">
                                                                <img src={editTeamData.logo} className="w-full h-full object-contain" alt="Preview" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground">Preview</p>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                                            onClick={() => {
                                                                setEditTeamData({ ...editTeamData, logo: "" });
                                                                toast.info("Logo cleared locally. Save changes to persist.");
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <Button 
                                                className="w-full rounded-xl h-12 font-bold transition-all"
                                                onClick={handleUpdateTeam}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" /> : "Save Changes"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                {/* Recent Form */}
                {recentForm.length > 0 && (
                    <div className="mt-8 flex flex-col md:flex-row items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Form</span>
                        <div className="flex gap-1.5">
                            {recentForm.map((result: string, i: number) => (
                                <div key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                                    result === 'W' ? 'bg-green-500/20 text-green-500' :
                                    result === 'L' ? 'bg-red-500/20 text-red-500' :
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                    {result}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <main className="max-w-6xl mx-auto px-4 pb-12">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-secondary/40 backdrop-blur-sm border border-border/50 p-1 h-auto rounded-full w-full overflow-x-auto hide-scrollbar flex justify-start sm:w-fit">
                        <TabsTrigger value="overview" className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground hover:text-foreground">Overview</TabsTrigger>
                        <TabsTrigger value="squad" className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground hover:text-foreground">Squad</TabsTrigger>
                        <TabsTrigger value="matches" className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground hover:text-foreground">Matches</TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground hover:text-foreground">Stats</TabsTrigger>
                    </TabsList>


                    <TabsContent value="overview" className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Matches Played", value: matches.filter((m: any) => m.status === 'Completed').length, icon: Swords, color: "text-blue-500", bgColor: "bg-blue-500/10", border: "border-blue-500/20" },
                                { label: "Goals Scored", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.goals || 0), 0), icon: Goal, color: "text-emerald-500", bgColor: "bg-emerald-500/10", border: "border-emerald-500/20" },
                                { label: "Clean Sheets", value: "0", icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-500/10", border: "border-yellow-500/20" },
                                { label: "Discipline", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0) + (s.redCards || 0), 0), icon: CreditCard, color: "text-rose-500", bgColor: "bg-rose-500/10", border: "border-rose-500/20" },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-secondary/20 border-border/50 rounded-3xl p-6 hover:bg-secondary/40 transition-colors flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`${stat.bgColor} ${stat.border} border w-12 h-12 rounded-xl flex items-center justify-center`}>
                                            <stat.icon className={stat.color} size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold tracking-tight mb-1 text-foreground">{stat.value}</h3>
                                        <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Top Scorers */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
                                    Top Scorers
                                </h4>
                                <div className="space-y-2">
                                    {chartData.length > 0 ? chartData.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-muted-foreground font-semibold text-sm w-4">{i+1}</span>
                                                <span className="font-semibold text-foreground">{p.name}</span>
                                            </div>
                                            <span className="font-bold text-primary flex items-center gap-1">
                                                {p.goals} <span className="text-xs text-muted-foreground">Goals</span>
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center border border-dashed border-border/50 rounded-2xl text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-secondary/10">
                                            No Goals Recorded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Result */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold tracking-tight text-foreground">Recent Performance</h4>
                                <div className="space-y-3">
                                    {matches.filter((m: any) => m.status === 'Completed').slice(0, 3).map((match: any) => (
                                        <Card key={match._id} className="bg-secondary/30 border-border/50 p-4 rounded-2xl hover:bg-secondary/50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1 text-center space-y-1">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Home</p>
                                                    <p className="font-bold text-sm truncate">{match.homeTeam.name}</p>
                                                </div>
                                                <div className="px-4 py-1.5 bg-background rounded-lg border border-border/50 mx-4 shadow-sm">
                                                    <span className="text-lg font-bold tracking-tight">{match.score.home} - {match.score.away}</span>
                                                </div>
                                                <div className="flex-1 text-center space-y-1">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Away</p>
                                                    <p className="font-bold text-sm truncate">{match.awayTeam.name}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {matches.filter((m: any) => m.status === 'Completed').length === 0 && (
                                        <div className="py-12 text-center border border-dashed border-border/50 rounded-2xl text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-secondary/10">
                                            No recent matches
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="squad" className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">The Squad</h3>
                                <p className="text-muted-foreground text-sm font-medium">Currently {team.players?.length || 0} players registered</p>
                            </div>
                            
                            <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-full px-6 shadow-sm">
                                            <UserPlus size={16} className="mr-2" /> Register Player
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border/50 text-foreground rounded-3xl max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight">New Registration</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-5 mt-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                                                <Input 
                                                    className="bg-secondary/50 border-border/50 h-10 rounded-xl" 
                                                    placeholder="e.g. Erling Haaland" 
                                                    value={newPlayer.name}
                                                    onChange={e => setNewPlayer({...newPlayer, name: e.target.value})}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Jersey #</Label>
                                                    <Input 
                                                        type="number" 
                                                        className="bg-secondary/50 border-border/50 h-10 rounded-xl" 
                                                        placeholder="9" 
                                                        value={newPlayer.number}
                                                        onChange={e => setNewPlayer({...newPlayer, number: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground">Position</Label>
                                                    <Select value={newPlayer.role} onValueChange={v => setNewPlayer({...newPlayer, role: v})}>
                                                        <SelectTrigger className="bg-secondary/50 border-border/50 h-10 rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-border/50">
                                                            <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                                            <SelectItem value="Defender">Defender</SelectItem>
                                                            <SelectItem value="Midfielder">Midfielder</SelectItem>
                                                            <SelectItem value="Forward">Forward</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                                                <input 
                                                    type="checkbox" 
                                                    id="isCaptain" 
                                                    checked={newPlayer.isCaptain} 
                                                    onChange={e => setNewPlayer({...newPlayer, isCaptain: e.target.checked})}
                                                    className="w-4 h-4 rounded text-primary border-border/50 bg-background" 
                                                />
                                                <Label htmlFor="isCaptain" className="text-sm font-medium cursor-pointer text-foreground">Team Captain</Label>
                                            </div>
                                            <Button 
                                                className="w-full rounded-xl h-12 font-bold transition-all"
                                                onClick={handleAddPlayer}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                        <div className="space-y-12">
                            {(Object.entries(squadByPosition) as [string, any[]][]).map(([pos, players]) => (
                                <div key={pos} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h5 className="text-lg font-bold tracking-tight text-foreground">{pos}s</h5>
                                        <div className="h-px bg-border/50 flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {players.map((p, i) => {
                                            const pStats = playerStats[p.name] || {};
                                            return (
                                            <div 
                                                key={i} 
                                                className="group flex items-center justify-between p-4 bg-secondary/20 border border-border/50 rounded-3xl hover:bg-secondary/40 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/football/player/${id}/${encodeURIComponent(p.name)}`)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground text-sm shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                        {p.number}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold tracking-tight text-foreground">{p.name}</span>
                                                            {p.isCaptain && <div className="flex items-center justify-center w-4 h-4 rounded-sm bg-yellow-500 text-[10px] font-black text-black ml-1 border border-yellow-600/50">C</div>}
                                                        </div>
                                                        <div className="flex gap-3 text-xs font-medium text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Goal size={12} /> {pStats.goals || 0}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <CreditCard size={12} /> {pStats.yellowCards || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); handleRemovePlayer(team.players.findIndex((tp: any) => tp.name === p.name && tp.number === p.number)); }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                    <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                                </div>
                                            </div>
                                            );
                                        })}
                                        {players.length === 0 && (
                                            <div className="col-span-full py-8 text-center bg-secondary/10 border border-dashed border-border/50 rounded-3xl text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                                No {pos}s registered
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="matches" className="space-y-6 mt-8">
                        <div className="grid gap-4">
                            {matches.map((match: any) => (
                                <Card key={match._id} className="relative overflow-hidden bg-secondary/20 border border-border/50 p-0 rounded-3xl group hover:-translate-y-0.5 transition-all duration-300">
                                    <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center">
                                        {/* Main Match Area */}
                                        <div className="flex-1 flex items-center justify-between p-6 md:p-8 gap-4">
                                            {/* Home Team */}
                                            <div className="flex-1 text-right flex flex-col items-end group/team">
                                                <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover/team:text-primary transition-colors line-clamp-1">{match.homeTeam.name}</span>
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Home</span>
                                            </div>
                                            
                                            {/* Score Center */}
                                            <div className="flex flex-col items-center gap-3 mx-2 md:mx-6">
                                                <div className="relative px-6 py-4 bg-background rounded-2xl border border-border/50 shadow-sm group-hover:border-primary/30 transition-all">
                                                    <span className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums flex items-center gap-3">
                                                        <span className="text-foreground">{match.score.home}</span>
                                                        <span className="text-muted-foreground/50">-</span>
                                                        <span className="text-foreground">{match.score.away}</span>
                                                    </span>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                                                    match.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 animate-pulse' :
                                                    match.status === 'Completed' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                                                    'bg-secondary border-border/50 text-muted-foreground'
                                                }`}>
                                                    {match.status}
                                                </div>
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex-1 text-left flex flex-col items-start group/team">
                                                <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover/team:text-primary transition-colors line-clamp-1">{match.awayTeam.name}</span>
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Away</span>
                                            </div>
                                        </div>

                                        {/* Metadata Sidebar */}
                                        <div className="w-full md:w-56 bg-secondary/30 md:border-l border-t md:border-t-0 border-border/50 p-6 flex flex-col md:justify-center justify-between gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0">
                                                        <Calendar size={14} className="text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Date</p>
                                                        <p className="text-xs font-bold text-foreground">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                        <Trophy size={14} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tournament</p>
                                                        <p className="text-xs font-bold text-foreground truncate">{match.tournamentId?.name || "League Match"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline"
                                                onClick={() => navigate(`/football/match/result/${match._id}`)}
                                                className="w-full h-10 rounded-xl hover:bg-primary hover:text-primary-foreground border-border/50 transition-colors group/btn"
                                            >
                                                <span className="text-xs font-bold uppercase tracking-wider flex items-center justify-center">
                                                    Report <ChevronRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {matches.length === 0 && (
                                <div className="py-24 text-center bg-secondary/10 border border-dashed border-border/50 rounded-3xl">
                                    <Swords className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                                    <p className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">No Matches Scheduled</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-6 mt-8 relative z-10 pb-20">
                        {/* Elite Top Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { title: "Win Rate", value: `${winRate}%`, icon: Trophy, bg: "bg-blue-500/10", border: "border-blue-500/20", color: "text-blue-400" },
                                { title: "Clean Sheets", value: cleanSheets, icon: Shield, bg: "bg-slate-800", border: "border-white/5", color: "text-slate-300" },
                                { title: "Goals Scored", value: totalGoalsScored, icon: Goal, bg: "bg-blue-500/10", border: "border-blue-500/20", color: "text-blue-400" },
                                { title: "Total Assists", value: totalAssists, icon: Users, bg: "bg-emerald-500/10", border: "border-emerald-500/20", color: "text-emerald-400" },
                                { title: "Goals Conceded", value: totalGoalsConceded, icon: Swords, bg: "bg-rose-500/10", border: "border-rose-500/20", color: "text-rose-400" },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-[#0f1115] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><stat.icon size={48} /></div>
                                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                                        <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                                            <stat.icon size={18} className={stat.color} />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-4xl font-bold tracking-tight text-white">{stat.value}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{stat.title}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* ROW 2: Form Trajectory & Radar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Match Form Timeline */}
                            <Card className="col-span-1 lg:col-span-2 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[400px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                        <div>
                                            <h4 className="text-lg font-bold text-white tracking-tight">Season Progression</h4>
                                            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Goals Scored vs Conceded</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex gap-4 text-xs font-medium bg-slate-900 px-4 py-2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500" /> <span className="text-slate-300">Scored</span></div>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-slate-600" /> <span className="text-slate-300">Conceded</span></div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={formTimeline} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="match" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} />
                                            <Area type="monotone" dataKey="scored" name="Scored" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGlow)" activeDot={{ r: 6, fill: "#3b82f6", stroke: "#0f1115", strokeWidth: 2 }} />
                                            <Area type="monotone" dataKey="conceded" name="Conceded" stroke="#475569" strokeWidth={3} fillOpacity={0} activeDot={{ r: 6, fill: "#475569", stroke: "#0f1115", strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Team DNA Hex Radar */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[400px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white tracking-tight">Team DNA</h4>
                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Attribute Mapping</p>
                                    </div>
                                </div>
                                <div className="w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Rating" dataKey="value" stroke="#818cf8" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} labelStyle={{ display: 'none' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* ROW 3: Points Trajectory & Differential Diverging Bar */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Cumulative Points */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[340px]">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-2 h-6 bg-cyan-500 rounded-full" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white tracking-tight">Points Trajectory</h4>
                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Cumulative Points Accumulation</p>
                                    </div>
                                </div>
                                <div className="relative z-10 w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={pointsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="match" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} />
                                            <Line type="stepAfter" dataKey="points" name="Points" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#0f1115' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Goal Difference per match (Diverging) */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[340px]">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-2 h-6 bg-purple-500 rounded-full" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white tracking-tight">Match Differential</h4>
                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Goal Difference per Match</p>
                                    </div>
                                </div>
                                <div className="w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={differentialData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="match" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 600 }} />
                                            <Bar dataKey="differential" name="Difference" radius={[4, 4, 4, 4]}>
                                                {differentialData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.differential >= 0 ? '#3b82f6' : '#f43f5e'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* ROW 4: Home/Away, Sector Donut, Output Matrix */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Home vs Away Analysis */}
                            <Card className="col-span-1 lg:col-span-2 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[340px]">
                                <div className="mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-slate-400 rounded-full" />
                                        <div>
                                            <h4 className="text-lg font-bold text-white tracking-tight">Fortress</h4>
                                            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Home vs Away Context</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={homeAwayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={6}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="category" stroke="#1e293b" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 600 }} />
                                            <Bar dataKey="Scored" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                            <Bar dataKey="Conceded" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Sector Output (Donut) */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between h-[340px]">
                                <div className="mb-2">
                                    <h4 className="text-lg font-bold text-white tracking-tight">Sector Mapping</h4>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Goal Origins</p>
                                </div>
                                {goalsByPosition.length > 0 ? (
                                    <div className="w-full flex-1 relative mt-2">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-3xl font-bold text-white">{totalGoalsScored}</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={goalsByPosition} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none">
                                                    {goalsByPosition.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={positionColors[index % positionColors.length]} className="hover:opacity-80 outline-none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="w-full flex-1 flex items-center justify-center"><p className="text-xs font-medium text-slate-600">No Goal Data</p></div>
                                )}
                            </Card>

                            {/* Match Outcomes (Pie) */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between h-[340px]">
                                <div className="mb-2">
                                    <h4 className="text-lg font-bold text-white tracking-tight">Results</h4>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Outcome Distribution</p>
                                </div>
                                {resultDistribution.length > 0 ? (
                                    <div className="w-full flex-1 relative mt-2">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-3xl font-bold text-white">{completedMatches.length}</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={resultDistribution} cx="50%" cy="50%" labelLine={false} outerRadius="90%" dataKey="value" stroke="none">
                                                    {resultDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 outline-none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="w-full flex-1 flex items-center justify-center"><p className="text-xs font-medium text-slate-600">No Matches</p></div>
                                )}
                            </Card>
                        </div>

                        {/* ROW 5: Offensive Matrix, Radial MVP */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Offensive Matrix */}
                            <Card className="col-span-1 lg:col-span-2 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col h-[340px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-slate-700 rounded-full" />
                                        <div>
                                            <h4 className="text-lg font-bold text-white tracking-tight">Output Matrix</h4>
                                            <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Player Production Profiling</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex gap-4 text-xs font-medium px-4 py-1.5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500" /> <span className="text-slate-300">Goals</span></div>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-indigo-500" /> <span className="text-slate-300">Assists</span></div>
                                    </div>
                                </div>
                                <div className="w-full flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '13px', fontWeight: 600 }} />
                                            <Bar dataKey="goals" name="Goals" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                            <Bar dataKey="assists" name="Assists" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Top 5 Contributors Radial */}
                            <Card className="col-span-1 bg-[#0f1115] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between h-[340px]">
                                <div className="mb-2">
                                    <h4 className="text-lg font-bold text-white tracking-tight">Top MVP</h4>
                                    <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Goal Contributions</p>
                                </div>
                                {topContributors.length > 0 ? (
                                    <div className="w-full flex-1 mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={8} data={topContributors}>
                                                <RadialBar
                                                    background={{ fill: 'rgba(255,255,255,0.03)' }}
                                                    dataKey="total"
                                                    cornerRadius={10}
                                                />
                                                <Legend iconSize={6} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }} />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="w-full flex-1 flex items-center justify-center"><p className="text-xs font-medium text-slate-600">No Stats Data</p></div>
                                )}
                            </Card>
                        </div>

                        {/* ROW 6: Advanced Squad Analytics Deep Engine */}
                        <Card className="bg-[#0f1115] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 bg-slate-500 rounded-full" />
                                    <div>
                                        <h4 className="text-lg font-bold text-white tracking-tight">Squad Analytics Engine</h4>
                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Comprehensive Player Efficacy Matrix</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex gap-2 text-xs font-medium px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-slate-400">
                                    <span className="text-white mx-1">{completeSquadAnalytics.length}</span> Active Players
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Player</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Role</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center">Goals</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center">Assists</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center">Yel</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center">Red</th>
                                            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-right">Efficacy Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completeSquadAnalytics.length > 0 ? (
                                            completeSquadAnalytics.map((player, idx) => (
                                                <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                                {player.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{player.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-white/5">
                                                            {player.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-white">{player.goals}</td>
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-slate-300">{player.assists}</td>
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-amber-500">{player.yellowCards}</td>
                                                    <td className="py-4 px-6 text-center text-sm font-bold text-rose-500">{player.redCards}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${player.efficacy >= 8 ? 'bg-blue-500' : player.efficacy >= 6 ? 'bg-emerald-500' : 'bg-slate-500'}`}
                                                                    style={{ width: `${(player.efficacy / 10) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-white w-8">{player.efficacy}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-medium">
                                                    No player analytics data available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
