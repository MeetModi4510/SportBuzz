import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Swords, BarChart3, Settings, Play, ArrowLeft, Plus, Loader2, Calendar, Trash2, UserPlus, Shield, Circle, Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { footballApi } from "@/services/api";
import { toast } from "sonner";
import { getSocket } from "@/services/socket";

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
                if (updatedMatch.tournamentId === id || matches.some(m => m._id === updatedMatch._id)) {
                    fetchDetails();
                    fetchNews();
                }
            });

            return () => {
                socket.off('football_update');
            };
        }
    }, [id, matches]);

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
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 text-blue-400">
                                <Trophy size={32} />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{tournament.name}</h1>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Football {tournament.format} • {new Date(tournament.startDate).getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {isTournamentOwner && (
                            <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-black hover:bg-slate-200 rounded-[1.25rem] font-black uppercase italic tracking-tight px-8 h-12">
                                        <Plus size={18} className="mr-2" /> Add Team
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
                                    <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-white hover:bg-slate-800 rounded-[1.25rem] font-black uppercase italic tracking-tight px-8 h-12">
                                        <Settings size={18} className="mr-2" /> Settings
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
                    <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-1 h-14 rounded-2xl">
                        <TabsTrigger value="overview" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Overview</TabsTrigger>
                        <TabsTrigger value="teams" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Teams</TabsTrigger>
                        <TabsTrigger value="matches" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Matches</TabsTrigger>
                        <TabsTrigger value="table" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Points Table</TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 border hover:border-blue-500/20 transition-all">
                                <Users className="text-blue-500 mb-4" size={32} />
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter">{tournament.teams?.length || 0}</h3>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">Competing Teams</p>
                            </Card>
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 border hover:border-orange-500/20 transition-all">
                                <Swords className="text-orange-500 mb-4" size={32} />
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter">{matches.filter(m => m.status === 'Completed').length}</h3>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">Matches Played</p>
                            </Card>
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] p-8 border hover:border-green-500/20 transition-all">
                                <BarChart3 className="text-green-500 mb-4" size={32} />
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter">
                                    {matches.reduce((sum, m) => sum + (m.score?.home || 0) + (m.score?.away || 0), 0)}
                                </h3>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">Goals Scored</p>
                            </Card>
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
                    <TabsContent value="matches" className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-6 rounded-3xl">
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">Match Schedule</h3>
                            {isTournamentOwner && (
                                <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl h-11 px-8 font-bold italic uppercase tracking-tight">
                                            <Plus size={18} className="mr-2" /> Schedule Match
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
                            <TabsList className="bg-slate-950/50 border border-white/5 p-1 h-12 rounded-xl mb-6">
                                <TabsTrigger value="live" className="rounded-lg px-6 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[9px]">Live</TabsTrigger>
                                <TabsTrigger value="upcoming" className="rounded-lg px-6 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[9px]">Upcoming</TabsTrigger>
                                <TabsTrigger value="recent" className="rounded-lg px-6 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[9px]">Recent</TabsTrigger>
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
                                            className="bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] hover:border-blue-500/30 transition-all group cursor-pointer relative overflow-hidden"
                                            onClick={() => navigate(`/football/live/${match._id}`)}
                                        >
                                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            
                                            <div className="flex items-center justify-between relative z-10 w-full">
                                                {/* Home Team */}
                                                <div className="flex-1 text-right pr-6">
                                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors leading-none">{match.homeTeam?.name}</h4>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Home</p>
                                                </div>

                                                {/* Score & Status */}
                                                <div className="flex flex-col items-center gap-3 shrink-0">
                                                    <div className="px-10 py-4 bg-slate-950/80 rounded-[2rem] border border-slate-800 shadow-2xl shadow-black/50">
                                                        <span className="text-4xl font-black italic text-white leading-none tracking-tighter tabular-nums">
                                                            {match.score?.home || 0}
                                                            <span className="text-slate-800 mx-4">-</span>
                                                            {match.score?.away || 0}
                                                        </span>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${
                                                        match.status === 'Live' ? 'bg-red-500/10 border-red-500/20' : 
                                                        match.status === 'Paused' ? 'bg-orange-500/10 border-orange-500/20' : 
                                                        'bg-slate-500/10 border-slate-500/20'
                                                    }`}>
                                                        {match.status === 'Live' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                                            match.status === 'Live' ? 'text-red-400' : 
                                                            match.status === 'Paused' ? 'text-orange-400' : 
                                                            'text-slate-400'
                                                        }`}>
                                                            {match.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex-1 text-left pl-6">
                                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors leading-none">{match.awayTeam?.name}</h4>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Away</p>
                                                </div>

                                                {/* Info & Actions */}
                                                <div className="flex items-center gap-6 pl-12 border-l border-white/5">
                                                    <div className="text-right hidden xl:block min-w-[120px]">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date(match.matchDate).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-600 mt-0.5 truncate max-w-[120px]">{match.venue || "Stadium"}</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-3">
                                                        {isTournamentOwner && match.status !== 'Completed' && (
                                                            <Button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/football/score/football/${match._id}`, '_blank');
                                                                }} 
                                                                className="bg-blue-600 hover:bg-blue-500 rounded-3xl h-16 w-16 p-0 shadow-xl shadow-blue-600/20 group/btn transition-transform hover:scale-105 active:scale-95"
                                                            >
                                                                <Play size={28} className="fill-white text-white translate-x-0.5 group-hover/btn:scale-110 transition-transform" />
                                                            </Button>
                                                        )}
                                                        {match.status === 'Completed' && (
                                                            <Button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/football/match/result/${match._id}`);
                                                                }} 
                                                                variant="outline" 
                                                                className="border-slate-800 rounded-3xl h-16 w-16 p-0 hover:bg-slate-800 transition-all"
                                                            >
                                                                <BarChart3 size={28} className="text-slate-400" />
                                                            </Button>
                                                        )}
                                                        {isTournamentOwner && (
                                                            <div className="flex items-center">
                                                                <Button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteMatch(match._id);
                                                                    }} 
                                                                    variant="ghost" 
                                                                    className="text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl h-12 w-12 p-0 transition-colors"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </Button>
                                                            </div>
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
                                    <Card key={article._id} className="group relative overflow-hidden bg-slate-900/40 border-white/5 hover:border-blue-500/30 transition-all duration-500 rounded-[2.5rem] flex flex-col">
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
                                            
                                            <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                                                {article.content}
                                            </p>

                                            <div className="pt-6 border-t border-white/5 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">SportBuzz News Room</span>
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
                    </TabsContent>
                    </TabsContent>

                    <TabsContent value="table">
                        <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] overflow-hidden border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/80 border-b border-white/5">
                                        <tr className="text-slate-500 font-black uppercase text-[10px] tracking-[0.25em]">
                                            <th className="px-10 py-8">Team Standings</th>
                                            <th className="px-6 py-8 text-center">P</th>
                                            <th className="px-6 py-8 text-center text-green-500">W</th>
                                            <th className="px-6 py-8 text-center text-slate-300">D</th>
                                            <th className="px-6 py-8 text-center text-red-500">L</th>
                                            <th className="px-6 py-8 text-center">GD</th>
                                            <th className="px-10 py-8 text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pointsTable.map((entry: any, idx: number) => (
                                            <tr key={entry.team._id} className="hover:bg-white/[0.03] transition-colors group">
                                                <td className="px-10 py-6 flex items-center gap-6 cursor-pointer" onClick={() => navigate(`/football/team/${entry.team._id}`)}>
                                                    <span className={`text-lg font-black italic w-6 ${idx < 3 ? 'text-blue-500' : 'text-slate-600'}`}>{idx + 1}</span>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 overflow-hidden group-hover:border-blue-500/30 transition-colors">
                                                        {entry.team.logo ? <img src={entry.team.logo} className="w-full h-full object-contain p-1.5" /> : <Users size={18} className="text-slate-700" />}
                                                    </div>
                                                    <span className="font-black italic uppercase tracking-tight text-lg group-hover:text-blue-400 transition-colors">{entry.team.name}</span>
                                                </td>
                                                <td className="px-6 py-6 text-center font-bold text-slate-300">{entry.played}</td>
                                                <td className="px-6 py-6 text-center text-green-400 font-bold">{entry.won}</td>
                                                <td className="px-6 py-6 text-center text-slate-500 font-bold">{entry.draw}</td>
                                                <td className="px-6 py-6 text-center text-red-400 font-bold">{entry.lost}</td>
                                                <td className="px-6 py-6 text-center text-slate-400 font-medium">{(entry.goalsFor - entry.goalsAgainst) > 0 ? `+${entry.goalsFor - entry.goalsAgainst}` : entry.goalsFor - entry.goalsAgainst}</td>
                                                <td className="px-10 py-6 text-center">
                                                    <span className="font-black italic text-2xl text-white bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">{entry.points}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pointsTable.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-32 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-[10px]">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Top Scorers */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden border">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                        <Circle className="text-green-500 fill-current" size={20} /> Top Scorers
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {stats?.topScorers?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
                                                <div>
                                                    <p className="font-black italic uppercase tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-black italic text-blue-400">{p.goals}</span>
                                        </div>
                                    ))}
                                    {(!stats?.topScorers || stats.topScorers.length === 0) && (
                                        <p className="text-center py-8 text-slate-600 uppercase font-black text-[10px] tracking-widest">No goals yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Top Assisters */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden border">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                        <Users className="text-blue-500" size={20} /> Top Assisters
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {stats?.topAssisters?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
                                                <div>
                                                    <p className="font-black italic uppercase tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-black italic text-blue-400">{p.assists}</span>
                                        </div>
                                    ))}
                                    {(!stats?.topAssisters || stats.topAssisters.length === 0) && (
                                        <p className="text-center py-8 text-slate-600 uppercase font-black text-[10px] tracking-widest">No assists yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Golden Glove */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden border">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                        <Shield className="text-orange-500" size={20} /> Golden Glove
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {stats?.topKeepers?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
                                                <div>
                                                    <p className="font-black italic uppercase tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black italic text-orange-400">{p.saves}</span>
                                                <p className="text-[8px] font-black text-slate-600 uppercase">Saves</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topKeepers || stats.topKeepers.length === 0) && (
                                        <p className="text-center py-8 text-slate-600 uppercase font-black text-[10px] tracking-widest">No saves yet</p>
                                    )}
                                </div>
                            </Card>

                            {/* Discipline */}
                            <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden border">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                        <Plus className="text-red-500" size={20} /> Discipline
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {stats?.mostCards?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-600 font-black italic w-4">{i + 1}</span>
                                                <div>
                                                    <p className="font-black italic uppercase tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.teamName}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {p.yellowCards > 0 && (
                                                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                                        <div className="w-2 h-3 bg-yellow-500 rounded-[1px]" />
                                                        <span className="text-xs font-black text-yellow-500">{p.yellowCards}</span>
                                                    </div>
                                                )}
                                                {p.redCards > 0 && (
                                                    <div className="flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                                                        <div className="w-2 h-3 bg-red-500 rounded-[1px]" />
                                                        <span className="text-xs font-black text-red-500">{p.redCards}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.mostCards || stats.mostCards.length === 0) && (
                                        <p className="text-center py-8 text-slate-600 uppercase font-black text-[10px] tracking-widest">Clean record</p>
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
