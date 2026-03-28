import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Calendar, Users, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";

export default function FootballTournamentCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: "",
        format: "League",
        startDate: "",
        endDate: "",
        winPoints: "3",
        drawPoints: "1",
        lossPoints: "0"
    });

    const [teams, setTeams] = useState<any[]>([]);
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newTeam, setNewTeam] = useState({
        name: "",
        logo: "",
        players: [] as any[]
    });

    const handleCreateTournament = async () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            // 1. Create teams first if any are new
            // For now, assume we are creating a tournament with existing or manually added team names
            // In a real app, we'd have a team selection or creation flow.
            
            const res: any = await footballApi.createTournament({
                ...formData,
                pointsRule: {
                    win: Number(formData.winPoints),
                    draw: Number(formData.drawPoints),
                    loss: Number(formData.lossPoints)
                }
            });

            if (res.success) {
                toast.success("Tournament created successfully!");
                navigate(`/football/tournament/${res.data._id}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create tournament");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate("/create")}
                    className="mb-8 hover:bg-white/5 text-slate-400"
                >
                    <ArrowLeft className="mr-2" size={18} /> Back to Hub
                </Button>

                <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                                <Trophy size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">New Football Tournament</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Configure your league or knockout competition</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-xl font-black italic uppercase tracking-tight">Basic Info</CardTitle>
                                <CardDescription className="text-slate-500">Tournament identity and timeline</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Tournament Name</Label>
                                    <Input 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Champions League 2024"
                                        className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6 focus:ring-2 ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Start Date</Label>
                                        <Input 
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                            className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">End Date</Label>
                                        <Input 
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                            className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-xl font-black italic uppercase tracking-tight">Format & Rules</CardTitle>
                                <CardDescription className="text-slate-500">How the competition works</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Format</Label>
                                    <Select 
                                        value={formData.format}
                                        onValueChange={(v) => setFormData({...formData, format: v})}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6">
                                            <SelectValue placeholder="Select Format" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-slate-800 rounded-2xl">
                                            <SelectItem value="League">League (Round Robin)</SelectItem>
                                            <SelectItem value="Knockout">Knockout (Single Elim)</SelectItem>
                                            <SelectItem value="Group+Knockout">Group Stage + Knockout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Win Pts</Label>
                                        <Input 
                                            type="number"
                                            value={formData.winPoints}
                                            onChange={(e) => setFormData({...formData, winPoints: e.target.value})}
                                            className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6 text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Draw Pts</Label>
                                        <Input 
                                            type="number"
                                            value={formData.drawPoints}
                                            onChange={(e) => setFormData({...formData, drawPoints: e.target.value})}
                                            className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6 text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Loss Pts</Label>
                                        <Input 
                                            type="number"
                                            value={formData.lossPoints}
                                            onChange={(e) => setFormData({...formData, lossPoints: e.target.value})}
                                            className="bg-slate-950 border-slate-800 h-14 rounded-2xl px-6 text-center"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-8">
                        <Button 
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-500 text-white h-16 rounded-[1.5rem] px-12 font-black italic uppercase tracking-tight shadow-xl shadow-blue-900/20 group transition-all"
                            onClick={handleCreateTournament}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mr-2" />
                            ) : (
                                <Trophy className="mr-2 group-hover:scale-110 transition-transform" />
                            )}
                            Initialize Tournament
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
