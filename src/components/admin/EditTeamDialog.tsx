import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { teamApi } from "@/services/api";
import { Team, PlayerEntry, PlayerRole } from "@/data/scoringTypes";
import { toast } from "sonner";

const ROLES: PlayerRole[] = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];

const PRESET_COLORS = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Purple", value: "#a855f7" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Pink", value: "#ec4899" },
];

export const EditTeamDialog = ({
    isOpen,
    onClose,
    team,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    onSave: () => void;
}) => {
    // Form states
    const [name, setName] = useState("");
    const [acronym, setAcronym] = useState("");
    const [captain, setCaptain] = useState("");
    const [playerInput, setPlayerInput] = useState("");
    const [playerRole, setPlayerRole] = useState<PlayerRole>("Batsman");
    const [players, setPlayers] = useState<PlayerEntry[]>([]);
    const [color, setColor] = useState("#3b82f6");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (team && isOpen) {
            setName(team.name || "");
            setAcronym(team.acronym || "");
            setCaptain(team.captain || "");
            setColor(team.color || "#3b82f6");

            // Map team.players properly
            if (team.players && Array.isArray(team.players)) {
                const mappedPlayers = team.players.map(p => {
                    if (typeof p === 'string') return { name: p, role: 'Batsman' as PlayerRole };
                    return p as PlayerEntry;
                });
                setPlayers(mappedPlayers);
            } else {
                setPlayers([]);
            }
        }
    }, [team, isOpen]);

    const handleAddPlayer = () => {
        if (playerInput.trim() && !players.some(p => p.name === playerInput.trim())) {
            setPlayers([...players, { name: playerInput.trim(), role: playerRole }]);
            setPlayerInput("");
        }
    };

    const handleRemovePlayer = (playerName: string) => {
        setPlayers(players.filter(p => p.name !== playerName));
    };

    const handleEditTeam = async () => {
        if (!team?._id) return;
        if (!name) {
            toast.error("Team name is required");
            return;
        }

        setIsSaving(true);
        try {
            const response = await teamApi.update(team._id, {
                name,
                captain,
                acronym: acronym.toUpperCase(),
                players,
                color,
                // keep the existing logo if any, backend or frontend should ensure this
                logo: team.logo || ""
            });

            if (response.success) {
                toast.success("Team updated successfully");
                onSave();
                onClose();
            }
        } catch (error) {
            toast.error("Failed to update team");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update {team?.name}'s details and roster.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-t-name">Team Name</Label>
                        <Input
                            id="edit-t-name"
                            placeholder="e.g. Mumbai Warriors"
                            className="bg-slate-800 border-slate-700"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-captain">Captain Name</Label>
                        <Input
                            id="edit-captain"
                            placeholder="e.g. Rohit Sharma"
                            className="bg-slate-800 border-slate-700"
                            value={captain}
                            onChange={(e) => setCaptain(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-acronym">Acronym (Max 5 chars)</Label>
                        <Input
                            id="edit-acronym"
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
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleEditTeam} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
