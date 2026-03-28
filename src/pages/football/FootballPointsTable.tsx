import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Trophy, Activity, ArrowRight, Loader2, Users } from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";

export default function FootballPointsTable() {
    const { id } = useParams();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res: any = await footballApi.getTournamentStats(id!);
                if (res.success) {
                    setStats(res.data.pointsTable);
                }
            } catch (error) {
                toast.error("Failed to load points table");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchStats();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex flex-col gap-4 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                            <Trophy size={24} />
                        </div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">League Standings</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Updated Real-time • Official Statistics</p>
                </div>

                <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <th className="py-8 pl-12 text-left">Pos</th>
                                    <th className="py-8 text-left">Team Name</th>
                                    <th className="py-8 text-center">P</th>
                                    <th className="py-8 text-center">W</th>
                                    <th className="py-8 text-center">D</th>
                                    <th className="py-8 text-center">L</th>
                                    <th className="py-8 text-center">GF</th>
                                    <th className="py-8 text-center">GA</th>
                                    <th className="py-8 text-center">GD</th>
                                    <th className="py-8 text-center pr-12 text-blue-400">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {stats.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-24 text-center text-slate-600 italic">No matches played yet. The competition is waiting to begin.</td>
                                    </tr>
                                )}
                                {stats.sort((a,b) => b.points - a.points || b.goalDifference - a.goalDifference).map((entry, idx) => (
                                    <tr key={entry.team._id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-8 pl-12 font-black italic text-xl text-slate-700 group-hover:text-blue-500 transition-colors">
                                            {idx + 1}
                                        </td>
                                        <td className="py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                                                    {entry.team.logo ? <img src={entry.team.logo} /> : <Users size={20} className="text-slate-700" />}
                                                </div>
                                                <span className="font-black italic uppercase text-lg tracking-tight group-hover:translate-x-1 transition-transform">{entry.team.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-8 text-center font-bold text-slate-300">{entry.played}</td>
                                        <td className="py-8 text-center font-bold text-green-500">{entry.won}</td>
                                        <td className="py-8 text-center font-bold text-slate-400">{entry.draw}</td>
                                        <td className="py-8 text-center font-bold text-red-500">{entry.lost}</td>
                                        <td className="py-8 text-center font-bold text-slate-400">{entry.goalsFor}</td>
                                        <td className="py-8 text-center font-bold text-slate-400">{entry.goalsAgainst}</td>
                                        <td className="py-8 text-center font-bold text-slate-300">{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</td>
                                        <td className="py-8 text-center pr-12">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 font-black italic text-2xl shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                                                {entry.points}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
