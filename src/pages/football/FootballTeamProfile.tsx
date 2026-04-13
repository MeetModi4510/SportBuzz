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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

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

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-blue-500/30">
            <Navbar />
            
            {/* Immersive Hero Section */}
            <div className="relative h-[300px] w-full overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-[#0a0a0c]" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
                
                <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-12 relative z-10">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate(-1)}
                        className="w-fit mb-8 -ml-4 text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Back to tournament
                    </Button>
                    
                    {/* Team Main Info */}
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 w-full">
                        <div className="relative group/logo">
                            <div className="absolute -inset-4 bg-blue-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-[2.5rem] bg-slate-900 border-[6px] border-white/5 overflow-hidden shadow-2xl transition-all duration-500 hover:scale-105 hover:rotate-2">
                                {team.logo ? (
                                    <img src={team.logo} className="w-full h-full object-contain p-4" alt={team.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-blue-900/40 text-blue-500">
                                        <Trophy size={80} strokeWidth={1} className="animate-pulse" />
                                    </div>
                                )}
                                <button 
                                    onClick={() => setIsEditTeamOpen(true)}
                                    className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center gap-2 transition-all backdrop-blur-md cursor-pointer"
                                >
                                    <Camera className="text-white" size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Update Identity</span>
                                </button>
                            </div>
                        </div>
                        <div className="text-center md:text-left space-y-4 flex-1">
                            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    {team.name}
                                </h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-4 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20">
                                        Pro Club
                                    </span>
                                    <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
                                                <Settings size={20} />
                                            </Button>
                                        </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2.5rem] max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Edit Team Profile</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 mt-6">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Team Name</Label>
                                                    <Input 
                                                        className="bg-slate-950 border-slate-800 h-12 rounded-xl" 
                                                        value={editTeamData.name}
                                                        onChange={e => setEditTeamData({...editTeamData, name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Acronym</Label>
                                                    <Input 
                                                        className="bg-slate-950 border-slate-800 h-12 rounded-xl uppercase" 
                                                        maxLength={4}
                                                        placeholder="e.g. FCB"
                                                        value={editTeamData.acronym}
                                                        onChange={e => setEditTeamData({...editTeamData, acronym: e.target.value.toUpperCase()})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Logo Management</Label>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            className="bg-slate-950 border-slate-800 h-12 rounded-xl flex-1" 
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
                                                                className="h-12 w-12 bg-slate-950 border-slate-800 rounded-xl hover:bg-slate-900 transition-all group"
                                                                onClick={() => document.getElementById('team-logo-upload')?.click()}
                                                            >
                                                                <Upload size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {editTeamData.logo && (
                                                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-between group/preview">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                <img src={editTeamData.logo} className="w-full h-full object-contain" alt="Preview" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logo Preview</p>
                                                                <p className="text-[8px] font-bold text-blue-500 uppercase tracking-tight mt-0.5">Active Sync</p>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover/preview:opacity-100"
                                                            onClick={() => {
                                                                setEditTeamData({ ...editTeamData, logo: "" });
                                                                toast.info("Logo cleared locally. Save changes to persist.");
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <Button 
                                                className="w-full bg-blue-600 hover:bg-blue-500 rounded-2xl h-16 font-black italic uppercase text-lg shadow-xl shadow-blue-500/20"
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
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                                    Established {new Date(team.createdAt).getFullYear()}
                                </span>
                                <div className="flex gap-1">
                                    {recentForm.map((result: string, i: number) => (
                                        <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                            result === 'W' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            result === 'L' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                        }`}>
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <Tabs defaultValue="overview" className="space-y-12">
                    <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-1 h-16 rounded-[2rem] w-full md:w-fit">
                        {["Overview", "Squad", "Matches", "Stats"].map((tab) => (
                            <TabsTrigger 
                                key={tab} 
                                value={tab.toLowerCase()} 
                                className="rounded-[1.5rem] px-10 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-12">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Matches Played", value: matches.filter((m: any) => m.status === 'Completed').length, icon: Swords, color: "text-blue-500", bgColor: "bg-blue-500/10" },
                                { label: "Goals Scored", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.goals || 0), 0), icon: Goal, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
                                { label: "Clean Sheets", value: "0", icon: Shield, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
                                { label: "Discipline", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0) + (s.redCards || 0), 0), icon: CreditCard, color: "text-rose-500", bgColor: "bg-rose-500/10" },
                            ].map((stat, i) => (
                                <Card key={i} className="glass-premium rounded-[3rem] p-10 hover:border-blue-500/50 transition-all duration-500 group relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity`} />
                                    <div className="relative z-10">
                                        <div className={`${stat.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner`}>
                                            <stat.icon className={`${stat.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`} size={32} />
                                        </div>
                                        <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-3 group-hover:text-blue-400 transition-colors">{stat.value}</h3>
                                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">{stat.label}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Top Scorers */}
                            <div className="space-y-6">
                                <h4 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                    Top Scorers
                                    <TrendingUp className="text-blue-500" size={20} />
                                </h4>
                                <div className="space-y-2">
                                    {chartData.length > 0 ? chartData.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-blue-500 font-black italic tracking-tighter">0{i+1}</span>
                                                <span className="font-bold uppercase tracking-tight">{p.name}</span>
                                            </div>
                                            <span className="font-black italic text-xl px-4 py-1 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                                                {p.goals} <span className="text-[10px] font-bold uppercase tracking-widest ml-1">Goals</span>
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 uppercase text-[10px] font-black tracking-widest">
                                            No Goals Recorded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Result */}
                            <div className="space-y-6">
                                <h4 className="text-2xl font-black italic uppercase tracking-tight">Recent Performance</h4>
                                <div className="space-y-4">
                                    {matches.filter((m: any) => m.status === 'Completed').slice(0, 3).map((match: any) => (
                                        <Card key={match._id} className="bg-slate-900/40 border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1 text-center space-y-1">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Home</p>
                                                    <p className="font-black italic uppercase leading-tight">{match.homeTeam.name}</p>
                                                </div>
                                                <div className="px-6 py-2 bg-slate-950 rounded-xl border border-white/5 mx-6">
                                                    <span className="text-2xl font-black italic tracking-tighter">{match.score.home}-{match.score.away}</span>
                                                </div>
                                                <div className="flex-1 text-center space-y-1">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Away</p>
                                                    <p className="font-black italic uppercase leading-tight">{match.awayTeam.name}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {matches.filter((m: any) => m.status === 'Completed').length === 0 && (
                                        <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 uppercase text-[10px] font-black tracking-widest">
                                            No recent matches
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="squad" className="space-y-12">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter">The Squad</h3>
                                <p className="text-slate-500 font-medium">Currently {team.players?.length || 0} players registered</p>
                            </div>
                            
                            <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-14 px-10 font-black uppercase italic tracking-tight shadow-lg shadow-blue-500/20">
                                            <UserPlus size={18} className="mr-2" /> Register Player
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2.5rem] max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">New Registration</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 mt-6">
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Full Name</Label>
                                                <Input 
                                                    className="bg-slate-950 border-slate-800 h-12 rounded-xl" 
                                                    placeholder="e.g. Erling Haaland" 
                                                    value={newPlayer.name}
                                                    onChange={e => setNewPlayer({...newPlayer, name: e.target.value})}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Jersey #</Label>
                                                    <Input 
                                                        type="number" 
                                                        className="bg-slate-950 border-slate-800 h-12 rounded-xl" 
                                                        placeholder="9" 
                                                        value={newPlayer.number}
                                                        onChange={e => setNewPlayer({...newPlayer, number: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Position</Label>
                                                    <Select value={newPlayer.role} onValueChange={v => setNewPlayer({...newPlayer, role: v})}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 h-12 rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                                            <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                                            <SelectItem value="Defender">Defender</SelectItem>
                                                            <SelectItem value="Midfielder">Midfielder</SelectItem>
                                                            <SelectItem value="Forward">Forward</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                                <input 
                                                    type="checkbox" 
                                                    id="isCaptain" 
                                                    checked={newPlayer.isCaptain} 
                                                    onChange={e => setNewPlayer({...newPlayer, isCaptain: e.target.checked})}
                                                    className="w-5 h-5 rounded-lg border-slate-800 bg-slate-900 accent-blue-500" 
                                                />
                                                <Label htmlFor="isCaptain" className="text-xs font-black uppercase tracking-widest cursor-pointer text-slate-300">Team Captain</Label>
                                            </div>
                                            <Button 
                                                className="w-full bg-blue-600 hover:bg-blue-500 rounded-2xl h-16 font-black italic uppercase text-lg shadow-xl shadow-blue-500/20"
                                                onClick={handleAddPlayer}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                        <div className="space-y-16">
                            {(Object.entries(squadByPosition) as [string, any[]][]).map(([pos, players]) => (
                                <div key={pos} className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h5 className="text-xl font-black italic uppercase tracking-tighter text-blue-500">{pos}s</h5>
                                        <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {players.map((p, i) => {
                                            const pStats = playerStats[p.name] || {};
                                            return (
                                            <div 
                                                key={i} 
                                                className="group relative bg-slate-900/30 border border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98]"
                                                onClick={() => navigate(`/football/player/${id}/${encodeURIComponent(p.name)}`)}
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/40 flex items-center justify-center border border-blue-500/20 text-2xl font-black italic text-blue-400 shadow-inner group-hover:border-blue-500/50 group-hover:from-blue-600/30 group-hover:to-blue-900/60 transition-all duration-300">
                                                        #{p.number}
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-bold uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</span>
                                                            {p.isCaptain && <Shield size={14} className="text-yellow-500 fill-yellow-500/20" />}
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                <Goal size={10} className="text-emerald-500" /> {pStats.goals || 0} Goals
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                <CreditCard size={10} className="text-yellow-500" /> {pStats.yellowCards || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="rounded-full hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePlayer(team.players.findIndex((tp: any) => tp.name === p.name && tp.number === p.number)); }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                        <ChevronRight size={18} className="text-slate-700 group-hover:text-blue-400 transition-colors mt-2" />
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })}
                                        {players.length === 0 && (
                                            <div className="col-span-full py-12 text-center bg-slate-900/10 border border-dashed border-white/5 rounded-[2rem] text-slate-700 font-black uppercase tracking-widest text-[10px]">
                                                No {pos}s registered
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="matches" className="space-y-6 mt-8">
                        <div className="grid gap-6">
                            {matches.map((match: any) => (
                                <Card key={match._id} className="relative overflow-hidden bg-[#0a0a0c] border border-white/5 p-0 rounded-[2.5rem] group hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_20px_40px_-20px_rgba(59,130,246,0.15)]">
                                    {/* Background glow effects */}
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full group-hover:bg-blue-600/10 transition-colors duration-700" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[80px] rounded-full" />
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

                                    <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center">
                                        {/* Main Match Area */}
                                        <div className="flex-1 flex items-center justify-between p-8 md:p-10 gap-4">
                                            {/* Home Team */}
                                            <div className="flex-1 text-right flex flex-col items-end group/team">
                                                <span className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter group-hover/team:text-blue-400 transition-colors drop-shadow-md line-clamp-1">{match.homeTeam.name}</span>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-2 group-hover/team:text-slate-500 transition-colors">Home</span>
                                            </div>
                                            
                                            {/* Score Center */}
                                            <div className="flex flex-col items-center gap-5 mx-2 md:mx-8">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative px-8 md:px-12 py-6 bg-slate-950/80 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md group-hover:border-blue-500/30 transition-all">
                                                        <span className="text-3xl md:text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                            <span className="text-white">{match.score.home}</span>
                                                            <span className="text-blue-500/50 mx-3 md:mx-4">-</span>
                                                            <span className="text-white">{match.score.away}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.25em] shadow-lg ${
                                                    match.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20 animate-pulse' :
                                                    match.status === 'Completed' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/10' :
                                                    'bg-slate-800/50 border-slate-700 text-slate-400'
                                                }`}>
                                                    {match.status}
                                                </div>
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex-1 text-left flex flex-col items-start group/team">
                                                <span className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter group-hover/team:text-blue-400 transition-colors drop-shadow-md line-clamp-1">{match.awayTeam.name}</span>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-2 group-hover/team:text-slate-500 transition-colors">Away</span>
                                            </div>
                                        </div>

                                        {/* Metadata Sidebar */}
                                        <div className="w-full md:w-64 bg-slate-900/50 md:border-l border-t md:border-t-0 border-white/5 p-8 flex flex-col md:justify-center justify-between gap-6 backdrop-blur-md">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center shrink-0">
                                                        <Calendar size={14} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">Date</p>
                                                        <p className="text-xs font-bold text-slate-300">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                        <Trophy size={14} className="text-blue-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">Tournament</p>
                                                        <p className="text-xs font-bold text-slate-300 truncate">{match.tournamentId?.name || "League Match"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => navigate(`/football/match/result/${match._id}`)}
                                                className="w-full h-12 rounded-[1rem] bg-white/5 hover:bg-blue-600 text-white border border-white/10 hover:border-transparent transition-all overflow-hidden group/btn relative"
                                            >
                                                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center">
                                                    Report <ChevronRight size={14} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {matches.length === 0 && (
                                <div className="py-32 text-center relative overflow-hidden bg-slate-900/30 border border-white/5 rounded-[3rem]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80" />
                                    <Swords className="mx-auto text-slate-700 mb-6 drop-shadow-lg relative z-10" size={64} />
                                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs relative z-10">No Matches Scheduled</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-8 mt-8">
                        {/* Team Performance Overview Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <Card className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(59,130,246,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Trophy size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black italic tracking-tighter text-white">{winRate}%</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">Win Rate</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(16,185,129,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Shield size={18} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black italic tracking-tighter text-white">{cleanSheets}</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1">Clean Sheets</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(99,102,241,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <Goal size={18} className="text-indigo-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div>
                                            <p className="text-4xl font-black italic tracking-tighter text-white">{totalGoalsScored}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-1">Goals Scored</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(245,158,11,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Users size={18} className="text-amber-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div>
                                            <p className="text-4xl font-black italic tracking-tighter text-white">{totalAssists}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mt-1">Total Assists</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[#0a0a0c] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_30px_-15px_rgba(244,63,94,0.1)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col justify-between h-full gap-4">
                                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                        <Swords size={18} className="text-rose-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div>
                                            <p className="text-4xl font-black italic tracking-tighter text-white">{totalGoalsConceded}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 mt-1">Goals Conceded</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* NEW ROW: Form Match History & Team DNA Radar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-2">
                            {/* Match Form Timeline */}
                            <Card className="col-span-1 lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#0c0c10] to-[#050508] border border-slate-800/60 p-8 rounded-[3rem] shadow-2xl group/timeline">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
                                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Season Progression</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Goals Scored vs Conceded Over Time</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[220px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={formTimeline} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="concedeArea" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="match" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} dy={10} />
                                                <YAxis hide />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', backdropFilter: 'blur(16px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                                    itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '14px', fontStyle: 'italic' }}
                                                    labelStyle={{ color: '#cbd5e1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold', marginBottom: '8px' }}
                                                />
                                                <Area type="monotone" dataKey="scored" name="Scored" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#scoreArea)" activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
                                                <Area type="monotone" dataKey="conceded" name="Conceded" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#concedeArea)" activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            {/* Team DNA Radar */}
                            <Card className="col-span-1 relative overflow-hidden bg-gradient-to-b from-[#0c0c10] to-[#050508] border border-slate-800/60 p-8 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                                <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Team DNA</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Attribute Matrix</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 w-full h-[220px] -mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Team Rating" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2.5} />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff', fontWeight: 900, fontStyle: 'italic' }}
                                                labelStyle={{ display: 'none' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Chart */}
                            <Card className="col-span-1 lg:col-span-2 relative overflow-hidden bg-gradient-to-b from-[#0c0c10] to-[#050508] border border-slate-800/60 p-8 md:p-12 rounded-[3rem] shadow-2xl group/chart">
                                <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-600/10 to-transparent opacity-50 transition-opacity duration-700 group-hover/chart:opacity-100" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                        <div>
                                            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Offensive Matrix</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Goals vs Assists By Player</p>
                                        </div>
                                    </div>
                                    
                                    <div className="h-[350px] w-full mt-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={6}>
                                                <defs>
                                                    <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.2} />
                                                    </linearGradient>
                                                    <linearGradient id="assistGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#78350f" stopOpacity={0.2} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#334155" 
                                                    fontSize={10} 
                                                    tickLine={false} 
                                                    axisLine={false}
                                                    tick={{ fill: '#94a3b8', fontWeight: 900 }}
                                                    dy={15}
                                                />
                                                <YAxis hide />
                                                <Tooltip 
                                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                                        border: '1px solid rgba(59, 130, 246, 0.3)', 
                                                        borderRadius: '16px',
                                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.15)',
                                                        backdropFilter: 'blur(16px)'
                                                    }}
                                                    itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '14px', fontStyle: 'italic' }}
                                                    labelStyle={{ color: '#cbd5e1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold', marginBottom: '8px' }}
                                                />
                                                <Bar 
                                                    dataKey="goals" 
                                                    name="Goals"
                                                    fill="url(#goalGradient)"
                                                    radius={[8, 8, 0, 0]}
                                                    maxBarSize={45}
                                                    className="drop-shadow-[0_0_12px_rgba(59,130,246,0.4)] hover:brightness-125 transition-all"
                                                />
                                                <Bar 
                                                    dataKey="assists" 
                                                    name="Assists"
                                                    fill="url(#assistGradient)"
                                                    radius={[8, 8, 0, 0]}
                                                    maxBarSize={45}
                                                    className="drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:brightness-125 transition-all"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            {/* Supplemental Cards */}
                            <div className="col-span-1 lg:col-span-1 space-y-6 flex flex-col">
                                <Card className="flex-1 relative overflow-hidden bg-[#0c0c10] border border-slate-800/60 p-8 rounded-[3rem] shadow-2xl flex flex-col justify-center items-center group/eff">
                                    <div className="absolute inset-0 bg-blue-600/5 group-hover/eff:bg-blue-600/10 transition-colors duration-500" />
                                    
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 relative z-10 text-center">Efficiency Rating</h5>
                                    
                                    <div className="relative w-52 h-52 flex items-center justify-center">
                                        {/* Ring background */}
                                        <div className="absolute inset-0 border-[12px] border-slate-900 rounded-full shadow-inner" />
                                        {/* Animated primary ring */}
                                        <div className="absolute inset-0 border-[12px] border-blue-500/80 rounded-full border-t-transparent border-l-transparent animate-[spin_4s_linear_infinite] shadow-[0_0_30px_rgba(59,130,246,0.2)]" />
                                        {/* Static dash ring */}
                                        <div className="absolute inset-2 border-2 border-dashed border-slate-700/50 rounded-full" />
                                        
                                        <div className="text-center relative z-10 mt-2">
                                            <p className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter drop-shadow-lg">
                                                {matches.filter((m: any) => m.status === 'Completed').length > 0 ? (
                                                    Math.round(((Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.goals || 0), 0) / matches.filter((m: any) => m.status === 'Completed').length) * 10) / 10
                                                ) : 0}
                                            </p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 mt-2">Goals/Match</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="relative overflow-hidden bg-[#0c0c10] border border-slate-800/60 p-8 rounded-[3rem] shadow-2xl space-y-6">
                                    <div className="flex justify-between items-center relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Discipline</p>
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
                                            <CreditCard size={12} className="text-slate-500/50" />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="group/card p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-[2rem] text-center hover:bg-yellow-500/20 transition-colors shadow-[0_0_30px_-10px_rgba(234,179,8,0.15)] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover/card:opacity-10 blur-[20px] transition-opacity" />
                                            <p className="text-4xl font-black italic text-yellow-400 drop-shadow-md">{(Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0), 0)}</p>
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-yellow-500/80 mt-2">Yellows</p>
                                        </div>
                                        <div className="group/card p-5 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-[2rem] text-center hover:bg-red-500/20 transition-colors shadow-[0_0_30px_-10px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-red-400 opacity-0 group-hover/card:opacity-10 blur-[20px] transition-opacity" />
                                            <p className="text-4xl font-black italic text-red-500 drop-shadow-md">{(Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.redCards || 0), 0)}</p>
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-500/80 mt-2">Reds</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
