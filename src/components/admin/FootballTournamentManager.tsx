import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, Plus, ArrowRight, Loader2, Search, Trophy as TrophyIcon } from "lucide-react";
import { footballApi } from "@/services/api";
import { toast } from "sonner";

export const FootballTournamentManager = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setIsLoading(true);
        try {
            const res: any = await footballApi.getTournaments();
            setTournaments(res.data || []);
        } catch (err) {
            console.error("Failed to fetch football tournaments:", err);
            toast.error("Failed to load tournaments");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTournaments = tournaments.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ongoing = filteredTournaments.filter(t => t.status === 'Live');
    const upcoming = filteredTournaments.filter(t => t.status === 'Upcoming');
    const recent = filteredTournaments.filter(t => t.status === 'Completed');

    const TournamentList = ({ list }: { list: any[] }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {list.map((tournament) => (
                <Card 
                    key={tournament._id}
                    onClick={() => navigate(`/football/tournament/${tournament._id}`)}
                    className="bg-slate-900/40 border-slate-800 rounded-[2rem] overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                    <CardContent className="p-0">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                                    <Trophy size={20} />
                                </div>
                                <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                    tournament.status === 'Live' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    tournament.status === 'Upcoming' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                }`}>
                                    {tournament.status}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {tournament.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-slate-500">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <Users size={12} /> {tournament.teams?.length || 0} Teams
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <Calendar size={12} /> {new Date(tournament.startDate).getFullYear()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800/50 flex justify-between items-center group-hover:bg-blue-500/5 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-blue-500/60 transition-colors">
                                {tournament.format}
                            </span>
                            <ArrowRight size={16} className="text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                        </div>
                    </CardContent>
                </Card>
            ))}
            {list.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-900/20 border border-white/5 rounded-[3rem]">
                    <TrophyIcon size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No tournaments found</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        Football Tournaments
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage your leagues and knockout competitions</p>
                </div>
                
                <Button 
                    onClick={() => navigate("/football/tournament/create")}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase italic tracking-tight px-8 h-12 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} className="mr-2" /> New Tournament
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl h-14 pl-12 pr-6 focus:ring-2 ring-blue-500/20 outline-none transition-all placeholder:text-slate-600 font-medium"
                />
            </div>

            <Tabs defaultValue="ongoing" className="w-full">
                <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-1 h-14 rounded-2xl">
                    <TabsTrigger value="ongoing" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                        Ongoing ({ongoing.length})
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                        Upcoming ({upcoming.length})
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                        Recent ({recent.length})
                    </TabsTrigger>
                </TabsList>

                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                    </div>
                ) : (
                    <>
                        <TabsContent value="ongoing">
                            <TournamentList list={ongoing} />
                        </TabsContent>
                        <TabsContent value="upcoming">
                            <TournamentList list={upcoming} />
                        </TabsContent>
                        <TabsContent value="recent">
                            <TournamentList list={recent} />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
};
