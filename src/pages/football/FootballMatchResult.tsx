import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, ArrowLeft, Share2, Zap, BarChart3, Clock, CheckCircle2 } from "lucide-react";
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

    if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center font-medium tracking-widest text-slate-500 animate-pulse">Loading Match Data...</div>;

    if (!match) return <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-4"><h1 className="text-2xl font-bold text-white">Result Not Found</h1><Button onClick={() => navigate("/")}>Home</Button></div>;

    const isDraw = match.score.home === match.score.away;
    const winner = match.score.home > match.score.away ? match.homeTeam : match.awayTeam;

    return (
        <div className="min-h-screen bg-[#050507] text-white selection:bg-blue-500/30">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                
                {/* Navigation */}
                <div className="mb-8">
                    {match.tournamentId ? (
                        <Link 
                            to={`/football/tournament/${match.tournamentId._id || match.tournamentId}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/30 border border-white/5 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium">Back to Tournament</span>
                        </Link>
                    ) : (
                        <Button 
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium">Go Back</span>
                        </Button>
                    )}
                </div>

                {/* Result Hero - Premium & Minimalistic */}
                <div className="relative mb-10 rounded-[2.5rem] overflow-hidden bg-[#0A0A0E] border border-white/5 shadow-2xl p-10 md:p-14 text-center backdrop-blur-xl">
                    {/* Subtle top glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    
                    {/* Status Pill */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-300 text-xs font-medium tracking-[0.2em] uppercase">
                            <CheckCircle2 size={14} className="text-green-500" />
                            Full Time
                        </div>
                    </div>

                    {/* Score and Teams Layout */}
                    <div className="flex items-center justify-center gap-8 md:gap-20">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-5 flex-1">
                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-[#0D0D12] flex items-center justify-center border border-white/5 shadow-inner p-4 transition-transform hover:scale-105 duration-500">
                                {match.homeTeam.logo ? <img src={match.homeTeam.logo} className="w-full h-full object-contain drop-shadow-md" /> : <Users size={32} className="text-slate-600" />}
                            </div>
                            <span className="text-lg md:text-2xl font-bold text-white tracking-tight truncate w-full">{match.homeTeam.name}</span>
                        </div>

                        {/* Scoreline */}
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <h1 className="text-6xl md:text-[5.5rem] font-bold tracking-tighter text-white tabular-nums drop-shadow-sm leading-none">
                                {match.score.home} - {match.score.away}
                            </h1>
                            <div className="px-5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-semibold tracking-wide">
                                {isDraw ? "Match Drawn" : `${winner.name} Victory`}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-5 flex-1">
                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-[#0D0D12] flex items-center justify-center border border-white/5 shadow-inner p-4 transition-transform hover:scale-105 duration-500">
                                {match.awayTeam.logo ? <img src={match.awayTeam.logo} className="w-full h-full object-contain drop-shadow-md" /> : <Users size={32} className="text-slate-600" />}
                            </div>
                            <span className="text-lg md:text-2xl font-bold text-white tracking-tight truncate w-full">{match.awayTeam.name}</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Key Events */}
                    <Card className="bg-[#0A0A0E] border-white/5 rounded-[2rem] p-8 md:p-10 shadow-xl">
                         <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between border-b border-white/5 pb-6">
                            <CardTitle className="text-xl font-semibold tracking-tight text-white/90">Key Events</CardTitle>
                            <Trophy size={18} className="text-blue-500" />
                         </CardHeader>
                         <div className="space-y-4">
                            {match.events?.filter((e:any) => e.type === 'Goal').length > 0 ? (
                                match.events?.filter((e:any) => e.type === 'Goal').map((goal:any, i:number) => {
                                    const isHome = String(goal.team?._id || goal.team) === String(match.homeTeam._id);
                                    return (
                                        <div key={i} className="flex items-center gap-5 bg-slate-900/30 p-4 rounded-xl border border-white/5 hover:bg-slate-900/50 transition-colors">
                                            <div className="w-12 h-12 rounded-lg bg-[#0D0D12] border border-white/5 flex items-center justify-center shrink-0">
                                                <span className="text-blue-400 font-semibold">{goal.minute}'</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="text-yellow-500 shrink-0" size={14} />
                                                    <p className="text-sm font-semibold tracking-tight text-white truncate">{goal.player}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">{isHome ? match.homeTeam.name : match.awayTeam.name}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <Clock className="w-6 h-6 opacity-40" />
                                    <span className="text-sm font-medium">No goals recorded</span>
                                </div>
                            )}
                         </div>
                    </Card>

                    {/* Match Stats */}
                    <Card className="bg-[#0A0A0E] border-white/5 rounded-[2rem] p-8 md:p-10 shadow-xl">
                         <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between border-b border-white/5 pb-6">
                            <CardTitle className="text-xl font-semibold tracking-tight text-white/90">Match Statistics</CardTitle>
                            <BarChart3 size={18} className="text-blue-500" />
                         </CardHeader>
                         <div className="space-y-8">
                            {[
                                { label: "Possession", key: "possession", suffix: "%" },
                                { label: "Shots On Target", key: "shotsOnTarget", suffix: "" },
                                { label: "Corners", key: "corners", suffix: "" },
                                { label: "Fouls", key: "fouls", suffix: "" }
                            ].map((stat) => (
                                <div key={stat.key} className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-semibold tracking-wide">
                                        <span className={(match.stats?.[stat.key]?.home || 0) > (match.stats?.[stat.key]?.away || 0) ? "text-blue-400 text-sm" : "text-slate-400"}>
                                            {match.stats?.[stat.key]?.home || 0}{stat.suffix}
                                        </span>
                                        <span className="text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                        <span className={(match.stats?.[stat.key]?.away || 0) > (match.stats?.[stat.key]?.home || 0) ? "text-blue-400 text-sm" : "text-slate-400"}>
                                            {match.stats?.[stat.key]?.away || 0}{stat.suffix}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-[#0D0D12] rounded-full overflow-hidden flex p-0.5 border border-white/5">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${((match.stats?.[stat.key]?.home || 0) / Math.max(1, (match.stats?.[stat.key]?.home || 0) + (match.stats?.[stat.key]?.away || 0))) * 100}%` }} 
                                        />
                                        <div 
                                            className="h-full bg-slate-700 rounded-full ml-1 transition-all duration-1000" 
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
                        className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium tracking-wide px-8 shadow-lg shadow-blue-900/20"
                    >
                        <Share2 size={16} className="mr-2" /> Share Result
                    </Button>
                </div>
            </div>
        </div>
    );
}

