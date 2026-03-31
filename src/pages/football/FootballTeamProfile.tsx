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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

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
        .map(([name, stats]: [string, any]) => ({ name, goals: stats.goals }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);

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
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full">
                        <div className="relative group/logo w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-slate-900 border-4 border-slate-800 overflow-hidden shadow-2xl transition-transform hover:scale-105">
                            {team.logo ? (
                                <img src={team.logo} className="w-full h-full object-contain" alt={team.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-500">
                                    <Trophy size={64} />
                                </div>
                            )}
                            <button 
                                onClick={() => setIsEditTeamOpen(true)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center gap-2 transition-all backdrop-blur-sm cursor-pointer"
                            >
                                <Camera className="text-white" size={32} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Change Logo</span>
                            </button>
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <div className="flex items-center gap-4">
                                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                                    {team.name}
                                </h1>
                                <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white mt-4">
                                            <Settings size={24} />
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: "Matches Played", value: matches.filter((m: any) => m.status === 'Completed').length, icon: Swords, color: "text-blue-500" },
                                { label: "Goals Scored", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.goals || 0), 0), icon: Goal, color: "text-green-500" },
                                { label: "Clean Sheets", value: "0", icon: Shield, color: "text-yellow-500" },
                                { label: "Discipline", value: (Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0) + (s.redCards || 0), 0), icon: CreditCard, color: "text-red-500" },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-slate-900/20 border-white/5 rounded-[2.5rem] p-8 hover:bg-slate-900/40 transition-all border group">
                                    <stat.icon className={`${stat.color} mb-6 transition-transform group-hover:scale-110`} size={32} />
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{stat.value}</h3>
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-2">{stat.label}</p>
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
                                        {players.map((p, i) => (
                                            <div key={i} className="group relative bg-slate-900/30 border border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 text-2xl font-black italic text-blue-500 shadow-inner group-hover:border-blue-500/50 transition-colors">
                                                        #{p.number}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl font-bold uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</span>
                                                            {p.isCaptain && <Shield size={14} className="text-yellow-500 fill-yellow-500/20" />}
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                <Goal size={10} className="text-blue-500" /> {playerStats[p.name]?.goals || 0} Goals
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                <CreditCard size={10} className="text-yellow-500" /> {playerStats[p.name]?.yellowCards || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="rounded-full hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => handleRemovePlayer(team.players.findIndex((tp: any) => tp.name === p.name && tp.number === p.number))}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
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

                    <TabsContent value="matches" className="space-y-8">
                        <div className="grid gap-4">
                            {matches.map((match: any) => (
                                <Card key={match._id} className="bg-slate-900/40 border-white/5 p-8 rounded-[3rem] hover:border-white/10 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-12 flex-1">
                                        <div className="flex-1 text-right flex flex-col items-end">
                                            <span className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors line-clamp-1">{match.homeTeam.name}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Home</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="px-10 py-5 bg-slate-950 rounded-[2rem] border border-white/10 shadow-inner group-hover:border-blue-500/20 transition-all">
                                                <span className="text-4xl font-black italic leading-none tracking-tighter tabular-nums">
                                                    {match.score.home}<span className="text-slate-700 mx-3">-</span>{match.score.away}
                                                </span>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                                match.status === 'Live' ? 'bg-green-500/10 border-green-500/20 text-green-400 animate-pulse' :
                                                match.status === 'Completed' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                            }`}>
                                                {match.status}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-left flex flex-col items-start">
                                            <span className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors line-clamp-1">{match.awayTeam.name}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Away</span>
                                        </div>
                                    </div>
                                    <div className="ml-12 pl-12 border-l border-white/5 hidden lg:block space-y-2">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{new Date(match.matchDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Trophy size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{match.tournamentId?.name || "League"}</span>
                                        </div>
                                        <Button 
                                            onClick={() => navigate(`/football/match/result/${match._id}`)}
                                            size="sm" 
                                            variant="outline" 
                                            className="w-full rounded-xl border-white/5 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase"
                                        >
                                            View Report <ChevronRight size={12} className="ml-1" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {matches.length === 0 && (
                                <div className="py-40 text-center bg-slate-900/10 border border-white/5 rounded-[4rem]">
                                    <Swords className="mx-auto text-slate-800 mb-6 opacity-20" size={80} />
                                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">No matches scheduled</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <Card className="col-span-1 lg:col-span-2 bg-slate-900/30 border-white/5 p-10 rounded-[3rem]">
                                <h4 className="text-2xl font-black italic uppercase tracking-tight mb-8">Scoring Distribution</h4>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="#475569" 
                                                fontSize={12} 
                                                tickLine={false} 
                                                axisLine={false}
                                                tick={{ fill: '#475569', fontWeight: 'bold' }}
                                            />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="goals" radius={[12, 12, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`rgba(59, 130, 246, ${1 - (index * 0.15)})`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <Card className="bg-slate-900/30 border-white/5 p-10 rounded-[3rem]">
                                    <h5 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8 text-center">Efficiency Rating</h5>
                                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                                        <div className="absolute inset-0 border-[16px] border-white/5 rounded-full" />
                                        <div className="absolute inset-0 border-[16px] border-blue-500 rounded-full border-t-transparent border-r-transparent animate-spin-slow rotate-45" />
                                        <div className="text-center">
                                            <p className="text-5xl font-black italic text-blue-500 tracking-tighter">
                                                {matches.filter((m: any) => m.status === 'Completed').length > 0 ? (
                                                    Math.round(((Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.goals || 0), 0) / matches.filter((m: any) => m.status === 'Completed').length) * 10) / 10
                                                ) : 0}
                                            </p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Goals / Match</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-slate-900/30 border-white/5 p-8 rounded-[3rem] space-y-6">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disciplinary Record</p>
                                        <CreditCard size={14} className="text-red-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-center">
                                            <p className="text-3xl font-black italic text-yellow-500">{(Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.yellowCards || 0), 0)}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-yellow-600">Yellows</p>
                                        </div>
                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
                                            <p className="text-3xl font-black italic text-red-500">{(Object.values(playerStats) as any[]).reduce((acc: number, s: any) => acc + (s.redCards || 0), 0)}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-red-600">Reds</p>
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

const style = document.createElement("style");
style.innerHTML = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;
document.head.appendChild(style);
