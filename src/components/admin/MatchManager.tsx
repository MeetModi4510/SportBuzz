import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar, Plus, Play, Info, Trophy, MapPin, Shield, UserPlus, Zap } from "lucide-react";
import { customMatchApi, teamApi } from "@/services/api";
import { Team, Match } from "@/data/scoringTypes";
import { toast } from "sonner";

interface MatchManagerProps {
    standaloneOnly?: boolean;
}

export const MatchManager = ({ standaloneOnly = false }: MatchManagerProps) => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

    // Match form
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    const [venue, setVenue] = useState("");
    const [date, setDate] = useState("");

    // Quick team form
    const [quickTeamName, setQuickTeamName] = useState("");
    const [quickTeamAcronym, setQuickTeamAcronym] = useState("");
    const [quickTeamCaptain, setQuickTeamCaptain] = useState("");
    const [quickPlayerInput, setQuickPlayerInput] = useState("");
    const [quickPlayers, setQuickPlayers] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [mRes, teamRes] = await Promise.all([
                customMatchApi.getAll(),
                teamApi.getAll()
            ]);
            // Filter standalone matches (no tournament)
            const allMatches = mRes.data || [];
            setMatches(standaloneOnly ? allMatches.filter((m: Match) => !m.tournament) : allMatches);
            setTeams(teamRes.data || []);
        } catch {
            toast.error("Failed to load matches");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMatch = async () => {
        if (!homeTeam || !awayTeam || !date || !venue) {
            toast.error("Please fill in all match details");
            return;
        }
        if (homeTeam === awayTeam) {
            toast.error("A team cannot play against itself");
            return;
        }
        try {
            const response = await customMatchApi.create({
                homeTeam, awayTeam, venue, date, status: 'Upcoming'
            });
            if (response.success) {
                toast.success("Match created successfully!");
                setIsCreateOpen(false);
                setHomeTeam(""); setAwayTeam(""); setVenue(""); setDate("");
                fetchData();
            }
        } catch {
            toast.error("Failed to create match");
        }
    };

    const handleQuickCreateTeam = async () => {
        if (!quickTeamName) {
            toast.error("Team name is required");
            return;
        }
        try {
            const res = await teamApi.create({
                name: quickTeamName,
                acronym: quickTeamAcronym.toUpperCase(),
                captain: quickTeamCaptain,
                players: quickPlayers,
                logo: ""
            });
            if (res.success) {
                toast.success(`${quickTeamName} created!`);
                setIsCreateTeamOpen(false);
                setQuickTeamName(""); setQuickTeamAcronym(""); setQuickTeamCaptain(""); setQuickPlayers([]);
                fetchData();
            }
        } catch {
            toast.error("Failed to create team");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-green-500" />
                        {standaloneOnly ? "Single Match" : "All Matches"}
                    </h2>
                    <p className="text-slate-400">Quick standalone matches — no tournament required</p>
                </div>
                <div className="flex gap-2">
                    {/* Quick Create Team */}
                    <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                                <UserPlus size={16} className="mr-2" /> Quick Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                            <DialogHeader>
                                <DialogTitle>Quick Team Registration</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Team Name</Label>
                                    <Input placeholder="e.g. Street Boys XI" className="bg-slate-800 border-slate-700" value={quickTeamName} onChange={(e) => setQuickTeamName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Captain</Label>
                                    <Input placeholder="e.g. Rohit Sharma" className="bg-slate-800 border-slate-700" value={quickTeamCaptain} onChange={(e) => setQuickTeamCaptain(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Acronym (Max 5 chars)</Label>
                                    <Input placeholder="e.g. MI" maxLength={5} className="bg-slate-800 border-slate-700 uppercase" value={quickTeamAcronym} onChange={(e) => setQuickTeamAcronym(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Players</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="Enter name" className="bg-slate-800 border-slate-700" value={quickPlayerInput} onChange={(e) => setQuickPlayerInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (quickPlayerInput.trim()) { setQuickPlayers([...quickPlayers, quickPlayerInput.trim()]); setQuickPlayerInput(""); } } }} />
                                        <Button onClick={() => { if (quickPlayerInput.trim()) { setQuickPlayers([...quickPlayers, quickPlayerInput.trim()]); setQuickPlayerInput(""); } }} size="icon" className="bg-slate-800 shrink-0"><Plus size={16} /></Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {quickPlayers.map(p => (
                                            <span key={p} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                                {p} <button onClick={() => setQuickPlayers(quickPlayers.filter(x => x !== p))} className="hover:text-white">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateTeamOpen(false)}>Cancel</Button>
                                <Button onClick={handleQuickCreateTeam} className="bg-blue-600 hover:bg-blue-700">Create Team</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Match */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus size={18} className="mr-2" /> New Match
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white">
                            <DialogHeader>
                                <DialogTitle>Schedule Standalone Match</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {teams.length < 2 && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                                        ⚠️ You need at least 2 teams. Use "Quick Team" to create them first.
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Home Team</Label>
                                        <Select value={homeTeam} onValueChange={setHomeTeam}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select team" /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                {teams.map(t => (<SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Away Team</Label>
                                        <Select value={awayTeam} onValueChange={setAwayTeam}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select team" /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                {teams.map(t => (<SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Venue</Label>
                                    <Input placeholder="e.g. Local Ground" className="bg-slate-800 border-slate-700" value={venue} onChange={(e) => setVenue(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date & Time</Label>
                                    <Input type="datetime-local" className="bg-slate-800 border-slate-700" value={date} onChange={(e) => setDate(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateMatch} className="bg-green-600 hover:bg-green-700">Create Match</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Match List */}
            <div className="space-y-3">
                {matches.map((match) => {
                    const userStr = localStorage.getItem("user");
                    const user = userStr ? JSON.parse(userStr) : null;
                    const canScore = 
                        user?.role === 'admin' || 
                        user?.role === 'scorer' || 
                        localStorage.getItem("isAdmin") === "true" ||
                        user?.email === 'admin@sportbuzz.com';

                    return (
                        <Card key={match._id} className="bg-slate-900 border-slate-700 hover:border-slate-600 transition-colors">
                            <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    {/* Teams Section */}
                                    <div className="md:col-span-4 flex items-center justify-center gap-8">
                                        <div className="flex flex-col items-center gap-2 w-24">
                                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                                                <Shield className="text-blue-500 w-6 h-6" />
                                            </div>
                                            <p className="text-white font-bold text-[11px] truncate w-full text-center">
                                                {match.homeTeam?.name || "Home Team"}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <span className="text-slate-500 font-black text-xs tracking-tighter">VS</span>
                                            <div className={`mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] ${
                                                match.status === 'Live' ? 'bg-red-500/10 text-red-500 animate-pulse' : 
                                                match.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 
                                                'bg-slate-800 text-slate-400'
                                            }`}>
                                                {match.status}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 w-24">
                                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                                                <Shield className="text-red-500 w-6 h-6" />
                                            </div>
                                            <p className="text-white font-bold text-[11px] truncate w-full text-center">
                                                {match.awayTeam?.name || "Away Team"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Venue & Time Section */}
                                    <div className="md:col-span-5 flex flex-col justify-center gap-2 md:pl-12 border-l border-slate-800/50 md:h-12">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <MapPin size={12} className="text-slate-500" />
                                            <span className="text-[10px] font-medium truncate">{match.venue}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Calendar size={12} className="text-slate-500" />
                                            <span className="text-[10px] font-medium">{new Date(match.date).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="md:col-span-3 flex items-center justify-end gap-3">
                                        {canScore && (
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg h-9 shadow-lg shadow-green-900/20 transition-all active:scale-95"
                                                onClick={() => navigate(`/score/${match._id}`)}
                                            >
                                                <Play size={14} className="mr-2 fill-current" /> Score
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-slate-500 hover:text-white hover:bg-slate-800 h-9 w-9 rounded-lg border border-slate-800/50"
                                            onClick={() => navigate(`/live/${match._id}`)}
                                        >
                                            <Info size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {matches.length === 0 && !isLoading && (
                    <div className="py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                        <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-400">No matches yet</h3>
                        <p className="text-slate-500 mt-1">Create teams and schedule your first match.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


