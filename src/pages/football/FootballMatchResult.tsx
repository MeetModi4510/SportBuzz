import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, History, Users, Activity, ArrowLeft, Share2, Download, Zap, BarChart3 } from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";

export default function FootballMatchResult() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const res: any = await (footballApi as any).getMatchById?.(id!) || { success: false };
                if (res.success) {
                    setMatch(res.data);
                }
            } catch (error) {
                toast.error("Failed to load match results");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMatch();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-black italic uppercase tracking-widest text-blue-500 animate-pulse">Retaining Match Archives...</div>;

    if (!match) return <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4"><h1 className="text-2xl font-bold text-white">Result Not Found</h1><Button onClick={() => navigate("/")}>Home</Button></div>;

    const isDraw = match.score.home === match.score.away;
    const winner = match.score.home > match.score.away ? match.homeTeam : match.awayTeam;

    return (
        <div className="min-h-screen bg-[#070709] text-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Result Hero */}
                <div className="relative mb-12 rounded-[4rem] overflow-hidden bg-gradient-to-b from-slate-900 to-[#0a0a0c] border border-white/5 shadow-2xl p-16 text-center">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Final Scoreboard</div>
                        <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            {match.score.home} - {match.score.away}
                        </h1>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-3xl font-black italic uppercase tracking-tight text-white/90">
                                {isDraw ? "Match Drawn" : `${winner.name} Wins!`}
                            </p>
                            <div className="w-12 h-1 bg-blue-600 rounded-full" />
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-12 text-slate-400 font-black italic uppercase tracking-widest text-sm">
                         <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-blue-500/30 transition-all">
                                {match.homeTeam.logo ? <img src={match.homeTeam.logo} /> : <Users size={24} />}
                            </div>
                            <span className="text-white text-xl">{match.homeTeam.name}</span>
                         </div>
                         <span className="text-slate-700 italic">VS</span>
                         <div className="flex items-center gap-4 group cursor-pointer">
                            <span className="text-white text-xl">{match.awayTeam.name}</span>
                            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:border-blue-500/30 transition-all">
                                {match.awayTeam.logo ? <img src={match.awayTeam.logo} /> : <Users size={24} />}
                            </div>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Goal Scorers */}
                    <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 backdrop-blur-3xl overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16" />
                         <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tight">Key Events</CardTitle>
                            <Trophy size={20} className="text-yellow-500" />
                         </CardHeader>
                         <div className="space-y-4">
                            {match.events?.filter((e:any) => e.type === 'Goal').map((goal:any, i:number) => (
                                <div key={i} className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                    <span className="text-blue-500 font-black italic w-12">{goal.minute}'</span>
                                    <Zap className="text-yellow-500" size={16} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold uppercase tracking-tight text-white">Goal</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">{goal.player}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </Card>

                    {/* Match Stats */}
                    <Card className="bg-slate-900/40 border-slate-800 rounded-[3rem] p-10 backdrop-blur-3xl overflow-hidden relative">
                         <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tight">Performance Data</CardTitle>
                            <BarChart3 size={20} className="text-blue-500" />
                         </CardHeader>
                         <div className="space-y-8">
                            {[
                                { label: "Shots On Target", key: "shotsOnTarget" },
                                { label: "Possession %", key: "possession" },
                                { label: "Corners", key: "corners" },
                                { label: "Fouls", key: "fouls" }
                            ].map((stat) => (
                                <div key={stat.key} className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest px-1">
                                        <span className={(match.stats?.[stat.key]?.home || 0) > (match.stats?.[stat.key]?.away || 0) ? "text-blue-400" : "text-slate-500"}>
                                            {match.stats?.[stat.key]?.home || 0}
                                        </span>
                                        <span className="text-slate-400">{stat.label}</span>
                                        <span className={(match.stats?.[stat.key]?.away || 0) > (match.stats?.[stat.key]?.home || 0) ? "text-orange-400" : "text-slate-500"}>
                                            {match.stats?.[stat.key]?.away || 0}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                            style={{ width: `${((match.stats?.[stat.key]?.home || 0) / Math.max(1, (match.stats?.[stat.key]?.home || 0) + (match.stats?.[stat.key]?.away || 0))) * 100}%` }} 
                                        />
                                        <div 
                                            className="h-full bg-orange-600 rounded-full ml-0.5 transition-all duration-1000" 
                                            style={{ width: `${((match.stats?.[stat.key]?.away || 0) / Math.max(1, (match.stats?.[stat.key]?.home || 0) + (match.stats?.[stat.key]?.away || 0))) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                         </div>
                    </Card>
                </div>

                <div className="mt-12 flex justify-center gap-4">
                    <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate("/")}
                        className="h-14 border-slate-800 bg-slate-900/50 text-white hover:bg-slate-800 rounded-2xl font-black uppercase italic tracking-widest px-12"
                    >
                        Return Home
                    </Button>
                    <Button 
                        size="lg"
                        className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase italic tracking-widest px-12 shadow-xl shadow-blue-900/20"
                    >
                        <Share2 size={20} className="mr-2" /> Share Result
                    </Button>
                </div>
            </div>
        </div>
    );
}
