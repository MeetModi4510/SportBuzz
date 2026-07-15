import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Swords, BarChart3, Settings, Play, ArrowLeft, Plus, Loader2, Calendar, Trash2, UserPlus, Shield, Circle, Newspaper, TrendingUp, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { footballApi } from "@/services/api";
import { toast } from "sonner";
import { getSocket } from "@/services/socket";

const LiveMatchTimer = ({ match }: { match: any }) => {
    const [displayTime, setDisplayTime] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            if (!match?.timer) {
                setDisplayTime(match?.status || "Live");
                return;
            }
            
            let totalSecs = (match.timer.currentMinute || 0) * 60;
            if (match.timer.isRunning && match.timer.startTime) {
                const start = new Date(match.timer.startTime).getTime();
                const now = Date.now();
                totalSecs += Math.floor((now - start) / 1000);
            }

            const halfDur = match.tournamentId?.matchConfig?.halfDuration || match.matchConfig?.halfDuration || 45;
            const fullDur = match.tournamentId?.matchConfig?.duration || match.matchConfig?.duration || 90;
            const currentHalf = match.timer.half || 1;

            if (match.timer.halfStatus === 'HalfTime') {
                setDisplayTime("HT");
                return;
            }
            if (match.timer.halfStatus === 'FullTime') {
                setDisplayTime("FT");
                return;
            }

            const totalMins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;

            if (currentHalf === 1 && totalMins >= halfDur) {
                setDisplayTime(`${halfDur}:${secs < 10 ? '0' : ''}${secs} +${totalMins - halfDur}`);
            } else if (currentHalf === 2 && totalMins >= fullDur) {
                setDisplayTime(`${fullDur}:${secs < 10 ? '0' : ''}${secs} +${totalMins - fullDur}`);
            } else {
                setDisplayTime(`${totalMins < 10 ? '0' : ''}${totalMins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        };

        updateTimer();
        let interval: any;
        if (match?.timer?.isRunning) {
            interval = setInterval(updateTimer, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [match]);

    return <>{displayTime}</>;
};

export default function FootballTournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [selectedExistingTeam, setSelectedExistingTeam] = useState("");
    const [newTeam, setNewTeam] = useState({ name: "", logo: "", acronym: "" });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [matchData, setMatchData] = useState({ homeTeam: "", awayTeam: "", venue: "", date: "" });
    const [settingsData, setSettingsData] = useState({ name: "", format: "", startDate: "", endDate: "" });
    const [news, setNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user._id || user.id || '';
    const isAdmin = user.role === 'admin' || user.email === 'admin@sportbuzz.com';
    const isTournamentOwner = isAdmin || (tournament && (tournament.createdBy === currentUserId || tournament.createdBy?._id === currentUserId));

    const fetchDetails = async () => {
        try {
            const res: any = await footballApi.getTournamentById(id!);
            if (res.success) {
                setTournament(res.data.tournament);
                setMatches(res.data.matches || []);
                setSettingsData({
                    name: res.data.tournament.name,
                    format: res.data.tournament.format,
                    startDate: res.data.tournament.startDate?.split('T')[0] || "",
                    endDate: res.data.tournament.endDate?.split('T')[0] || ""
                });
                
                // Fetch stats separately for the Stats tab
                const statsRes: any = await footballApi.getTournamentStats(id!);
                if (statsRes.success) {
                    setStats(statsRes.data.stats);
                }
            }
        } catch (error) {
            toast.error("Failed to load tournament details");
        } finally {
            setLoading(false);
        }
    };

    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const res: any = await footballApi.getTournamentNews(id!);
            if (res.success) {
                setNews(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch news:", error);
        } finally {
            setNewsLoading(false);
        }
    };

    const fetchAllTeams = async () => {
        try {
            const res: any = await footballApi.getTeams();
            if (res.success) setAllTeams(res.data.data || res.data);
        } catch (error) {}
    };

    useEffect(() => {
        if (id) {
            fetchDetails();
            fetchAllTeams();
            fetchNews();

            const socket = getSocket();
            socket.on('football_update', (updatedMatch) => {
                if (updatedMatch.tournamentId === id) {
                    fetchDetails();
                    fetchNews();
                }
            });

            return () => {
                socket.off('football_update');
            };
        }
    }, [id]);

    const handleAddExistingTeam = async () => {
        if (!selectedExistingTeam) return;
        try {
            const res: any = await footballApi.addTeamToTournament(id!, selectedExistingTeam);
            if (res.success) {
                toast.success("Team added to tournament!");
                fetchDetails();
                setIsAddTeamOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add team");
        }
    };

    const handleCreateAddTeam = async () => {
        if (!newTeam.name) return;
        try {
            const res: any = await footballApi.createTeam(newTeam);
            if (res.success) {
                await footballApi.addTeamToTournament(id!, res.data._id);
                toast.success("Team created and added!");
                fetchDetails();
                setIsAddTeamOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create team");
        }
    };

    const handleUpdateTournament = async () => {
        try {
            const res: any = await footballApi.updateTournament(id!, settingsData);
            if (res.success) {
                toast.success("Tournament updated!");
                setTournament(res.data.tournament);
                setIsSettingsOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update tournament");
        }
    };

    const handleDeleteTournament = async () => {
        if (!window.confirm("Are you sure you want to delete this tournament? This action is irreversible.")) return;
        try {
            const res: any = await footballApi.deleteTournament(id!);
            if (res.success) {
                toast.success("Tournament deleted!");
                navigate("/create");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete tournament");
        }
    };

    const handleScheduleMatch = async () => {
        if (!matchData.homeTeam || !matchData.awayTeam || !matchData.date) {
            toast.error("Please fill in all fields (Teams and Date)");
            return;
        }
        try {
            const res: any = await footballApi.createMatch({
                tournamentId: id,
                homeTeam: matchData.homeTeam,
                awayTeam: matchData.awayTeam,
                venue: matchData.venue,
                matchDate: matchData.date
            });
            if (res.success) {
                toast.success("Match scheduled!");
                fetchDetails();
                setIsScheduleOpen(false);
                setMatchData({ homeTeam: "", awayTeam: "", venue: "", date: "" });
            }
        } catch (error: any) {
            console.error("Schedule Error:", error);
            const msg = error.response?.data?.message || error.message || "Failed to schedule match";
            toast.error(msg);
        }
    };

    const handleDeleteMatch = async (matchId: string) => {
        if (!window.confirm("Are you sure you want to delete this match? All match data and events will be lost.")) return;
        try {
            const res: any = await footballApi.deleteMatch(matchId);
            if (res.success) {
                toast.success("Match deleted successfully");
                fetchDetails();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete match");
        }
    };

    const calculatePointsTable = () => {
        const table: any = {};
        tournament?.teams?.forEach((team: any) => {
            table[team._id] = {
                team,
                played: 0,
                won: 0,
                draw: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0
            };
        });

        matches.filter(m => m.status === 'Completed').forEach(match => {
            const homeId = typeof match.homeTeam === 'object' ? match.homeTeam._id : match.homeTeam;
            const awayId = typeof match.awayTeam === 'object' ? match.awayTeam._id : match.awayTeam;

            if (table[homeId] && table[awayId]) {
                table[homeId].played++;
                table[awayId].played++;
                table[homeId].goalsFor += match.score.home;
                table[homeId].goalsAgainst += match.score.away;
                table[awayId].goalsFor += match.score.away;
                table[awayId].goalsAgainst += match.score.home;

                if (match.score.home > match.score.away) {
                    table[homeId].won++;
                    table[homeId].points += (tournament.pointsRule?.win || 3);
                    table[awayId].lost++;
                } else if (match.score.home < match.score.away) {
                    table[awayId].won++;
                    table[awayId].points += (tournament.pointsRule?.win || 3);
                    table[homeId].lost++;
                } else {
                    table[homeId].draw++;
                    table[awayId].draw++;
                    table[homeId].points += (tournament.pointsRule?.draw || 1);
                    table[awayId].points += (tournament.pointsRule?.draw || 1);
                }
            }
        });

        return Object.values(table).sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.goalsFor - a.goalsAgainst;
            const gdB = b.goalsFor - b.goalsAgainst;
            return gdB - gdA;
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );

    if (!tournament) return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold text-white">Tournament Not Found</h1>
            <Button onClick={() => navigate("/create")}>Back to Hub</Button>
        </div>
    );

    const pointsTable = calculatePointsTable();

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-2">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate("/create")}
                            className="mb-2 p-0 h-auto hover:bg-transparent text-slate-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="mr-2" size={16} /> All Tournaments
                        </Button>
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 text-blue-400">
                                <Trophy size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-white/95 leading-none">{tournament.name}</h1>
                                <p className="text-slate-400 font-medium tracking-wide text-xs mt-2 uppercase">Football {tournament.format} • {new Date(tournament.startDate).getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {isTournamentOwner && (
                            <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-black hover:bg-slate-200 rounded-xl font-medium px-6 h-11 shadow-sm">
                                        <Plus size={16} className="mr-2" /> Add Team
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Add Team to {tournament.name}</DialogTitle>
                                    </DialogHeader>
                                    <Tabs defaultValue="existing" className="mt-4">
                                        <TabsList className="bg-slate-950 border-slate-800 w-full rounded-xl">
                                            <TabsTrigger value="existing" className="flex-1 rounded-lg italic font-bold">Existing Team</TabsTrigger>
                                            <TabsTrigger value="new" className="flex-1 rounded-lg italic font-bold">Create New</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="existing" className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label>Select Team</Label>
                                                <Select value={selectedExistingTeam} onValueChange={setSelectedExistingTeam}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl h-12">
                                                        <SelectValue placeholder="Choose a team" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                                        {allTeams.filter((t: any) => !tournament.teams?.some((tt: any) => tt._id === t._id)).map((team: any) => (
                                                            <SelectItem key={team._id} value={team._id}>{team.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold italic" onClick={handleAddExistingTeam}>Add to Tournament</Button>
                                        </TabsContent>
                                        <TabsContent value="new" className="space-y-4 pt-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <Label>Team Name</Label>
                                                    <Input className="bg-slate-950 border-slate-800 rounded-xl h-12" placeholder="e.g. Manchester United" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Acronym</Label>
                                                    <Input className="bg-slate-950 border-slate-800 rounded-xl h-12 uppercase" maxLength={4} placeholder="e.g. MU" value={newTeam.acronym} onChange={e => setNewTeam({...newTeam, acronym: e.target.value.toUpperCase()})} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Logo URL (Optional)</Label>
                                                <Input className="bg-slate-950 border-slate-800 rounded-xl h-12" placeholder="https://..." value={newTeam.logo} onChange={e => setNewTeam({...newTeam, logo: e.target.value})} />
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold italic" onClick={handleCreateAddTeam}>Create & Add</Button>
                                        </TabsContent>
                                    </Tabs>
                                </DialogContent>
                            </Dialog>
                        )}

                        {isTournamentOwner && (
                            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-white/10 bg-slate-900/30 text-white hover:bg-slate-800 rounded-xl font-medium px-6 h-11">
                                        <Settings size={16} className="mr-2" /> Settings
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Tournament Settings</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label>Tournament Name</Label>
                                            <Input className="bg-slate-950 border-slate-800 rounded-xl h-12" value={settingsData.name} onChange={e => setSettingsData({...settingsData, name: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input type="date" className="bg-slate-950 border-slate-800 rounded-xl h-12" value={settingsData.startDate} onChange={e => setSettingsData({...settingsData, startDate: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input type="date" className="bg-slate-950 border-slate-800 rounded-xl h-12" value={settingsData.endDate} onChange={e => setSettingsData({...settingsData, endDate: e.target.value})} />
                                            </div>
                                        </div>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold italic" onClick={handleUpdateTournament}>Save Changes</Button>
                                        <Button variant="destructive" className="w-full rounded-xl h-12 font-bold italic" onClick={handleDeleteTournament}>
                                            <Trash2 size={16} className="mr-2" /> Delete Tournament
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-slate-950/50 border border-white/5 p-1.5 rounded-2xl h-14 w-full md:w-auto justify-start gap-2 shadow-inner overflow-x-auto no-scrollbar">
                        <TabsTrigger value="overview" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Overview</TabsTrigger>
                        <TabsTrigger value="teams" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Teams</TabsTrigger>
                        <TabsTrigger value="matches" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Matches</TabsTrigger>
                        <TabsTrigger value="table" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Points Table</TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Stats</TabsTrigger>
                        <TabsTrigger value="newsroom" className="rounded-xl px-6 h-full font-medium text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-sm transition-all gap-2">Newsroom</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* Key Metrics Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Users className="text-blue-500" size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teams</span>
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-white/95">{tournament.teams?.length || 0}</h3>
                                <p className="text-slate-400 font-medium text-xs mt-2">Total Competing</p>
                            </Card>

                            <Card className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <Swords className="text-orange-500" size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Matches</span>
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-white/95">{matches.filter(m => m.status === 'Completed').length}</h3>
                                <p className="text-slate-400 font-medium text-xs mt-2">Games Played</p>
                            </Card>

                            <Card className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <BarChart3 className="text-green-500" size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Goals</span>
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-white/95">
                                    {matches.reduce((sum, m) => sum + (m.score?.home || 0) + (m.score?.away || 0), 0)}
                                </h3>
                                <p className="text-slate-400 font-medium text-xs mt-2">Total Scored</p>
                            </Card>

                            <Card className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                        <Clock className="text-purple-500" size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-white/95 capitalize">{tournament.status || 'Active'}</h3>
                                <p className="text-slate-400 font-medium text-[11px] mt-2 truncate">
                                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                                </p>
                            </Card>
                        </div>

                        {/* Middle Row: Matches & Performers */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Col: Matches & News */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Recent Results */}
                                    <Card className="bg-slate-950/30 border border-white/5 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-semibold tracking-tight text-white/95">Recent Results</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {matches.filter(m => m.status === 'Completed').slice(0, 3).length > 0 ? (
                                                matches.filter(m => m.status === 'Completed').slice(0, 3).map((match: any) => (
                                                    <div key={match._id} onClick={() => navigate(`/football/live/${match._id}`)} className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors rounded-xl border border-white/5 cursor-pointer group">
                                                        <div className="flex-1 flex justify-end items-center gap-3">
                                                            <span className="font-semibold text-sm text-white/90 group-hover:text-blue-400 transition-colors truncate">{match.homeTeam?.name}</span>
                                                            {match.homeTeam?.logo ? <img src={match.homeTeam.logo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center"><Users size={10} className="text-slate-500"/></div>}
                                                        </div>
                                                        <div className="px-4">
                                                            <div className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg shadow-inner">
                                                                <span className="font-bold text-white tracking-tight">{match.score?.home ?? 0} - {match.score?.away ?? 0}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex justify-start items-center gap-3">
                                                            {match.awayTeam?.logo ? <img src={match.awayTeam.logo} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center"><Users size={10} className="text-slate-500"/></div>}
                                                            <span className="font-semibold text-sm text-white/90 group-hover:text-blue-400 transition-colors truncate">{match.awayTeam?.name}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-slate-500 text-sm font-medium">No recent matches found.</div>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Upcoming Fixtures */}
                                    <Card className="bg-slate-950/30 border border-white/5 rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-semibold tracking-tight text-white/95">Upcoming Fixtures</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {matches.filter(m => m.status === 'Scheduled').slice(0, 3).length > 0 ? (
                                                matches.filter(m => m.status === 'Scheduled').slice(0, 3).map((match: any) => (
                                                    <div key={match._id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5">
                                                        <div className="flex-1 flex justify-end items-center gap-3">
                                                            <span className="font-semibold text-sm text-white/90 truncate">{match.homeTeam?.name}</span>
                                                        </div>
                                                        <div className="px-4 flex flex-col items-center">
                                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">VS</span>
                                                            <span className="text-[10px] font-medium text-slate-400 mt-1">{new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex-1 flex justify-start items-center gap-3">
                                                            <span className="font-semibold text-sm text-white/90 truncate">{match.awayTeam?.name}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-slate-500 text-sm font-medium">No upcoming matches scheduled.</div>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                {/* Latest News */}
                                <Card className="bg-slate-950/30 border border-white/5 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold tracking-tight text-white/95">Latest Buzz</h3>
                                    </div>
                                    {news?.length > 0 ? (
                                        <div className="space-y-4">
                                            {news.slice(0, 2).map((item: any) => (
                                                <div key={item._id} className="p-4 bg-slate-900/40 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-colors cursor-pointer">
                                                    <h4 className="font-semibold text-sm text-white/95 leading-tight mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                                                    <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>
                                                    <div className="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 text-sm font-medium">No news buzz available.</div>
                                    )}
                                </Card>
                            </div>

                            {/* Right Col: Top Performers */}
                            <div className="space-y-6">
                                {/* Top Performers */}
                                <Card className="bg-slate-950/30 border border-white/5 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold tracking-tight text-white/95">Top Performers</h3>
                                    </div>
                                    {stats?.topScorers?.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-blue-500/20 flex items-center justify-center">
                                                        <Trophy size={16} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white/90 text-sm">{stats.topScorers[0].player}</p>
                                                        <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wider mt-0.5">Top Scorer</p>
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold tabular-nums text-white">{stats.topScorers[0].goals}</div>
                                            </div>
                                            {stats?.topAssists?.length > 0 && (
                                                <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-purple-500/20 flex items-center justify-center">
                                                            <TrendingUp size={16} className="text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-white/90 text-sm">{stats.topAssists[0].player}</p>
                                                            <p className="text-[10px] font-medium text-purple-400 uppercase tracking-wider mt-0.5">Top Assister</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-2xl font-bold tabular-nums text-white">{stats.topAssists[0].assists}</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 text-sm font-medium">Player stats not available yet.</div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="teams">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournament.teams?.map((team: any) => (
                                <Card 
                                    key={team._id} 
                                    onClick={() => navigate(`/football/team/${team._id}`)}
                                    className="bg-slate-900/40 border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 overflow-hidden group-hover:border-blue-500/50 transition-colors">
                                            {team.logo ? <img src={team.logo} className="w-full h-full object-contain p-2" /> : <Users size={24} className="text-slate-600" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">{team.name}</h4>
                                            <p className="text-slate-500 text-xs font-bold uppercase">{team.players?.length || 0} Players</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {(!tournament.teams || tournament.teams.length === 0) && (
                                <div className="col-span-full text-center py-20 bg-slate-900/20 border border-white/5 rounded-[3rem]">
                                    <Users className="mx-auto text-slate-800 mb-4" size={64} />
                                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No teams added yet</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="matches" className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-lg font-semibold tracking-tight text-white/95">Match Schedule</h3>
                            {isTournamentOwner && (
                                <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl h-10 px-6 font-medium shadow-sm">
                                            <Plus size={16} className="mr-2" /> Schedule Match
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Schedule New Match</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 mt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Home Team</Label>
                                                    <Select value={matchData.homeTeam} onValueChange={v => setMatchData({...matchData, homeTeam: v})}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl h-12"><SelectValue placeholder="Team 1" /></SelectTrigger>
                                                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                                            {tournament.teams?.map((t: any) => (
                                                                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Away Team</Label>
                                                    <Select value={matchData.awayTeam} onValueChange={v => setMatchData({...matchData, awayTeam: v})}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl h-12"><SelectValue placeholder="Team 2" /></SelectTrigger>
                                                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                                            {tournament.teams?.map((t: any) => (
                                                                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Date & Time</Label>
                                                <Input type="datetime-local" className="bg-slate-950 border-slate-800 rounded-xl h-12" value={matchData.date} onChange={e => setMatchData({...matchData, date: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Venue</Label>
                                                <Input className="bg-slate-950 border-slate-800 rounded-xl h-12" placeholder="Stadium Name" value={matchData.venue} onChange={e => setMatchData({...matchData, venue: e.target.value})} />
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl h-14 font-black italic uppercase text-lg mt-4 shadow-lg shadow-blue-500/20" onClick={handleScheduleMatch}>Confirm Schedule</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <Tabs defaultValue="live" className="w-full">
                            <TabsList className="bg-transparent h-12 mb-6 gap-6 justify-start border-b border-white/5 w-full rounded-none px-0">
                                <TabsTrigger value="live" className="px-1 h-full data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white font-medium text-sm text-slate-400 rounded-none shadow-none">Live Matches</TabsTrigger>
                                <TabsTrigger value="upcoming" className="px-1 h-full data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white font-medium text-sm text-slate-400 rounded-none shadow-none">Upcoming</TabsTrigger>
                                <TabsTrigger value="recent" className="px-1 h-full data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-white font-medium text-sm text-slate-400 rounded-none shadow-none">Recent</TabsTrigger>
                            </TabsList>

                            {[
                                { id: "live", data: matches.filter(m => m.status === 'Live' || m.status === 'Paused'), emptyMsg: "No matches currently live" },
                                { id: "upcoming", data: matches.filter(m => m.status === 'Scheduled'), emptyMsg: "No upcoming matches scheduled" },
                                { id: "recent", data: matches.filter(m => m.status === 'Completed'), emptyMsg: "No recently completed matches" }
                            ].map(tab => (
                                <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                                    {tab.data.map((match: any) => (
                                        <Card 
                                            key={match._id} 
                                            className="bg-slate-900/20 border border-white/5 p-6 rounded-2xl hover:bg-slate-900/40 transition-all group cursor-pointer relative overflow-hidden"
                                            onClick={() => navigate(`/football/live/${match._id}`)}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            
                                            <div className="flex items-center justify-between relative z-10 w-full">
                                                {/* Home Team */}
                                                <div className="flex-1 flex justify-end items-center gap-4 pr-6">
                                                    <h4 className="text-xl font-bold tracking-tight group-hover:text-blue-400 transition-colors text-white/95">{match.homeTeam?.name}</h4>
                                                    {match.homeTeam?.logo ? <img src={match.homeTeam.logo} className="w-10 h-10 object-contain drop-shadow-lg" /> : <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"><Users size={16} className="text-slate-500" /></div>}
                                                </div>

                                                {/* Score & Status */}
                                                <div className="flex flex-col items-center gap-3 shrink-0 px-6">
                                                    <div className="flex items-center justify-center min-w-[120px]">
                                                        <span className="text-4xl font-bold text-white tabular-nums tracking-tight">{match.score?.home ?? 0}</span>
                                                        <span className="text-xl text-slate-600 font-light mx-4">-</span>
                                                        <span className="text-4xl font-bold text-white tabular-nums tracking-tight">{match.score?.away ?? 0}</span>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                                        match.status === 'Live' ? 'bg-red-500/10 border-red-500/20' : 
                                                        match.status === 'Paused' ? 'bg-orange-500/10 border-orange-500/20' : 
                                                        'bg-slate-500/10 border-slate-500/20'
                                                    }`}>
                                                        {match.status === 'Live' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                                                        <span className={`text-[11px] font-medium tracking-wider ${
                                                            match.status === 'Live' ? 'text-red-400' : 
                                                            match.status === 'Paused' ? 'text-orange-400' : 
                                                            'text-slate-400'
                                                        }`}>
                                                            {match.status === 'Live' || match.status === 'Paused' ? <LiveMatchTimer match={match} /> : match.status}
                                                        </span>
                                                    </div>
                                                </div>                                                {/* Away Team */}
                                                <div className="flex-1 flex justify-start items-center gap-4 pl-6">
                                                    {match.awayTeam?.logo ? <img src={match.awayTeam.logo} className="w-10 h-10 object-contain drop-shadow-lg" /> : <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"><Users size={16} className="text-slate-500" /></div>}
                                                    <h4 className="text-xl font-bold tracking-tight group-hover:text-blue-400 transition-colors text-white/95">{match.awayTeam?.name}</h4>
                                                </div>

                                                {/* Info & Actions */}
                                                <div className="flex items-center gap-4 pl-12 border-l border-white/5">
                                                    <div className="text-right hidden xl:block min-w-[120px]">
                                                        <p className="text-[11px] font-medium text-slate-400 tracking-wider">{new Date(match.matchDate).toLocaleDateString()}</p>
                                                        <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate max-w-[120px]">{match.venue || "Stadium"}</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        {isTournamentOwner && match.status !== 'Completed' && (
                                                            <Button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/football/score/football/${match._id}`, '_blank');
                                                                }} 
                                                                className="bg-blue-600 hover:bg-blue-500 rounded-xl h-10 w-10 p-0 shadow-sm group/btn"
                                                            >
                                                                <Play size={16} className="fill-white text-white group-hover/btn:scale-110 transition-transform" />
                                                            </Button>
                                                        )}
                                                        {match.status === 'Completed' && (
                                                            <Button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/football/live/${match._id}`);
                                                                }} 
                                                                className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl h-10 w-10 p-0 shadow-sm group/btn"
                                                            >
                                                                <BarChart3 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                            </Button>
                                                        )}
                                                        {isTournamentOwner && (
                                                            <Button 
                                                                variant="destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteMatch(match._id);
                                                                }} 
                                                                className="rounded-xl h-10 w-10 p-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {tab.data.length === 0 && (
                                        <div className="text-center py-24 bg-slate-900/20 border border-dashed border-white/5 rounded-[3rem]">
                                            <Calendar className="mx-auto text-slate-800/50 mb-6" size={64} strokeWidth={1.5} />
                                            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">{tab.emptyMsg}</p>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </TabsContent>

                    {/* Newsroom Tab */}
                    <TabsContent value="newsroom" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {newsLoading ? (
                                <div className="col-span-full py-20 text-center">
                                    <Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={40} />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Generating latest reports...</p>
                                </div>
                            ) : news.length > 0 ? (
                                news.map((article: any) => (
                                    <Card 
                                        key={article._id} 
                                        onClick={() => setSelectedArticle(article)}
                                        className="group relative overflow-hidden bg-slate-900/40 border-white/5 hover:border-blue-500/30 transition-all duration-500 rounded-[2.5rem] flex flex-col cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="p-8 relative z-10 flex flex-col h-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    article.type === 'MatchReport' ? 'bg-blue-500/10 text-blue-400' :
                                                    article.type === 'Milestone' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-slate-500/10 text-slate-400'
                                                }`}>
                                                    {article.type?.replace(/([A-Z])/g, ' $1').trim() || 'General'}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                    {new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors mb-4 leading-tight">
                                                {article.title}
                                            </h3>
                                            
                                            <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow line-clamp-4">
                                                {article.content}
                                            </p>

                                            <div className="pt-6 border-t border-white/5 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">SportsBuzz News Room</span>
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                        <Newspaper size={14} className="text-slate-400 group-hover:text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-32 text-center bg-slate-900/20 border border-dashed border-white/5 rounded-[3rem]">
                                    <Newspaper className="mx-auto text-slate-800/30 mb-6" size={64} strokeWidth={1} />
                                    <h3 className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">No news reports yet</h3>
                                    <p className="text-slate-600 text-xs mt-2 uppercase tracking-widest font-bold">Finish matches to see auto-generated reports</p>
                                </div>
                            )}
                        </div>

                        {/* Article Detail Dialog */}
                        <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                            {selectedArticle && (
                                <DialogContent className="bg-slate-950 border-white/5 text-white max-w-4xl max-h-[85vh] overflow-y-auto rounded-[3rem] p-0 gap-0 border shadow-2xl">
                                    <div className="relative h-64 bg-slate-900 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                                        <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay" />
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                        
                                        <div className="absolute bottom-0 left-0 p-12 z-20 w-full">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                                                    selectedArticle.type === 'MatchReport' ? 'bg-blue-600 text-white' :
                                                    selectedArticle.type === 'Milestone' ? 'bg-purple-600 text-white' :
                                                    'bg-slate-700 text-slate-300'
                                                }`}>
                                                    {selectedArticle.type?.replace(/([A-Z])/g, ' $1').trim() || 'General News'}
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {new Date(selectedArticle.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-[0.9] text-white">
                                                {selectedArticle.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="p-12 md:p-16">
                                        <div className="prose prose-invert max-w-none">
                                            {selectedArticle.content.split('\n').filter((p: string) => p.trim()).map((paragraph: string, idx: number) => (
                                                <p key={idx} className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8 font-medium">
                                                    {paragraph.trim()}
                                                </p>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                                    <Newspaper size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none mb-1">Generated by</p>
                                                    <p className="text-sm font-black italic uppercase text-white tracking-widest">SportsBuzz AI Newsroom</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                <span>#FOOTBALL</span>
                                                <span>#LIVEUPDATE</span>
                                                <span>#SPORTBUZZ</span>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            )}
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="table">
                        <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/50 border-b border-white/5">
                                        <tr className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                                            <th className="px-8 py-5">Team Standings</th>
                                            <th className="px-6 py-5 text-center">P</th>
                                            <th className="px-6 py-5 text-center text-green-400">W</th>
                                            <th className="px-6 py-5 text-center text-slate-400">D</th>
                                            <th className="px-6 py-5 text-center text-red-400">L</th>
                                            <th className="px-6 py-5 text-center">GD</th>
                                            <th className="px-8 py-5 text-center font-bold text-white">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pointsTable.map((entry: any, idx: number) => (
                                            <tr key={entry.team._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/football/team/${entry.team._id}`)}>
                                                    <span className={`text-sm font-semibold w-6 ${idx < 3 ? 'text-blue-400' : 'text-slate-500'}`}>{idx + 1}</span>
                                                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                        {entry.team.logo ? <img src={entry.team.logo} className="w-full h-full object-contain p-1" /> : <Users size={14} className="text-slate-500" />}
                                                    </div>
                                                    <span className="font-semibold text-white/90 text-sm group-hover:text-blue-400 transition-colors">{entry.team.name}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-medium text-slate-300">{entry.played}</td>
                                                <td className="px-6 py-5 text-center text-green-400 font-medium">{entry.won}</td>
                                                <td className="px-6 py-5 text-center text-slate-400 font-medium">{entry.draw}</td>
                                                <td className="px-6 py-5 text-center text-red-400 font-medium">{entry.lost}</td>
                                                <td className="px-6 py-5 text-center text-slate-400 font-medium">{(entry.goalsFor - entry.goalsAgainst) > 0 ? `+${entry.goalsFor - entry.goalsAgainst}` : entry.goalsFor - entry.goalsAgainst}</td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="font-bold text-lg text-white bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">{entry.points}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pointsTable.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center text-slate-500 font-medium text-sm">
                                                    Standings will populate after teams start playing
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Top Scorers */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Circle className="text-blue-500 fill-current" size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Top Scorers</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.topScorers?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 ${i === 0 ? 'text-blue-400' : 'text-slate-500'}`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-blue-400 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:border-blue-500/30 transition-colors">{p.goals}</span>
                                        </div>
                                    ))}
                                    {(!stats?.topScorers || stats.topScorers.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">No goals yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Top Assisters */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Users className="text-purple-500" size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Top Assisters</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.topAssisters?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 ${i === 0 ? 'text-purple-400' : 'text-slate-500'}`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-purple-400 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:border-purple-500/30 transition-colors">{p.assists}</span>
                                        </div>
                                    ))}
                                    {(!stats?.topAssisters || stats.topAssisters.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">No assists yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Goal Contributions */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <TrendingUp className="text-emerald-500" size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Goal Contributions</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.topContributors?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 ${i === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-emerald-400 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.goals}G {p.assists}A</span>
                                                <span className="text-lg font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:border-emerald-500/30 transition-colors">{p.goals + p.assists}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topContributors || stats.topContributors.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">No contributions yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Golden Glove */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <Shield className="text-orange-500" size={14} />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Golden Glove</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.topKeepers?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 ${i === 0 ? 'text-orange-400' : 'text-slate-500'}`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-orange-400 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:border-orange-500/30 transition-colors">{p.saves}</span>
                                        </div>
                                    ))}
                                    {(!stats?.topKeepers || stats.topKeepers.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">No saves yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Most Yellows */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <div className="w-3 h-4 bg-yellow-500 rounded-[2px]" />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Yellow Cards</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.mostYellows?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 text-slate-500`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-yellow-500 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">{p.yellowCards}</span>
                                        </div>
                                    ))}
                                    {(!stats?.mostYellows || stats.mostYellows.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">Clean record</p>
                                    )}
                                </div>
                            </Card>

                            {/* Most Reds */}
                            <Card className="bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/20">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <div className="w-3 h-4 bg-red-500 rounded-[2px]" />
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">Red Cards</h3>
                                </div>
                                <div className="p-2">
                                    {stats?.mostReds?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-semibold w-4 text-slate-500`}>{i + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-white/90 text-sm group-hover:text-red-500 transition-colors">{p.name}</p>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">{p.redCards}</span>
                                        </div>
                                    ))}
                                    {(!stats?.mostReds || stats.mostReds.length === 0) && (
                                        <p className="text-center py-8 text-slate-500 font-medium text-xs">Clean record</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}
