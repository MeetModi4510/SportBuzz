import { useState, useEffect } from "react";
import { getTeamAcronym } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Users, Plus, Shield, Search, UserPlus } from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { teamApi } from "@/services/api";
import { Team, PlayerEntry, PlayerRole, getPlayerName } from "@/data/scoringTypes";
import { toast } from "sonner";

const ROLES: PlayerRole[] = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];

import { EditTeamDialog } from "./EditTeamDialog";

export const TeamManager = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");
    const [captain, setCaptain] = useState("");
    const [playerInput, setPlayerInput] = useState("");
    const [playerRole, setPlayerRole] = useState<PlayerRole>("Batsman");
    const [players, setPlayers] = useState<PlayerEntry[]>([]);
    const [color, setColor] = useState("#3b82f6");

    const PRESET_COLORS = [
        { name: "Blue", value: "#3b82f6" },
        { name: "Green", value: "#10b981" },
        { name: "Red", value: "#ef4444" },
        { name: "Purple", value: "#a855f7" },
        { name: "Amber", value: "#f59e0b" },
        { name: "Pink", value: "#ec4899" },
    ];

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await teamApi.getAll();
            setTeams(response.data || []);
        } catch (error) {
            toast.error("Failed to load teams");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPlayer = () => {
        if (playerInput.trim() && !players.some(p => p.name === playerInput.trim())) {
            setPlayers([...players, { name: playerInput.trim(), role: playerRole }]);
            setPlayerInput("");
        }
    };

    const handleRemovePlayer = (playerName: string) => {
        setPlayers(players.filter(p => p.name !== playerName));
    };

    const handleCreateTeam = async () => {
        if (!name) {
            toast.error("Team name is required");
            return;
        }

        try {
            const response = await teamApi.create({
                name,
                captain,
                acronym: acronym.toUpperCase(),
                players,
                logo: "", // Placeholder for now
                color
            });

            if ((response as any).success) {
                toast.success("Team created successfully");
                setIsCreateOpen(false);
                fetchTeams();
                // Reset
                setName("");
                setAcronym("");
                setCaptain("");
                setPlayers([]);
                setColor("#3b82f6");
            }
        } catch (error) {
            toast.error("Failed to create team");
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="text-blue-500" />
                        Team Management
                    </h2>
                    <p className="text-slate-400">Manage squads and players</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <Input
                            placeholder="Search teams..."
                            className="pl-10 bg-slate-900 border-slate-700 w-full md:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus size={18} className="mr-2" />
                                New Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                            <DialogHeader>
                                <DialogTitle>Register New Team</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Add a new team to the platform.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="t-name">Team Name</Label>
                                    <Input
                                        id="t-name"
                                        placeholder="e.g. Mumbai Warriors"
                                        className="bg-slate-800 border-slate-700"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="captain">Captain Name</Label>
                                    <Input
                                        id="captain"
                                        placeholder="e.g. Rohit Sharma"
                                        className="bg-slate-800 border-slate-700"
                                        value={captain}
                                        onChange={(e) => setCaptain(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="acronym">Acronym (Max 5 chars)</Label>
                                    <Input
                                        id="acronym"
                                        placeholder="e.g. MI"
                                        maxLength={5}
                                        className="bg-slate-800 border-slate-700 uppercase"
                                        value={acronym}
                                        onChange={(e) => setAcronym(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Team Theme Color</Label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => setColor(c.value)}
                                                className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.value }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Add Players</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter player name"
                                            className="bg-slate-800 border-slate-700 flex-1"
                                            value={playerInput}
                                            onChange={(e) => setPlayerInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                                        />
                                        <Select value={playerRole} onValueChange={(v: PlayerRole) => setPlayerRole(v)}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700 w-[130px]"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAddPlayer} size="icon" className="bg-slate-800 hover:bg-slate-700 shrink-0">
                                            <UserPlus size={18} />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto pt-1">
                                        {players.map((p) => (
                                            <span key={p.name} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                                {p.name} <span className="opacity-60 text-[10px]">({p.role === "Wicket Keeper" ? "WK" : p.role === "All-Rounder" ? "AR" : p.role === "Batsman" ? "BAT" : "BOWL"})</span>
                                                <button onClick={() => handleRemovePlayer(p.name)} className="hover:text-white">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTeam} className="bg-blue-600 hover:bg-blue-700">
                                    Save Team
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-800/50 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredTeams.map((team) => (
                        <Card key={team._id} className="bg-slate-900 border-slate-700 transition-all hover:shadow-lg" style={{ borderColor: team.color ? `${team.color}50` : undefined }}>
                            <CardHeader className="pb-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 border border-slate-700 font-black text-xl tracking-wider" style={{ backgroundColor: `${team.color || '#3b82f6'}20`, color: team.color || '#3b82f6' }}>
                                    {team.acronym || getTeamAcronym(team.name)}
                                </div>
                                <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                                <CardDescription className="text-blue-400 text-xs font-medium uppercase tracking-wider">
                                    Captain: {team.captain || "Not Assigned"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-slate-500 text-sm mb-4">
                                    {team.players?.length || 0} Registered Players
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                                    onClick={() => setSelectedTeamForEdit(team)}
                                >
                                    Edit Squad
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredTeams.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-slate-500 italic">No teams found matching your search.</p>
                        </div>
                    )}
                </div>
            )}

            <EditTeamDialog
                isOpen={selectedTeamForEdit !== null}
                onClose={() => setSelectedTeamForEdit(null)}
                team={selectedTeamForEdit}
                onSave={() => {
                    fetchTeams();
                }}
            />
        </div>
    );
};
