import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, Plus, ArrowRight, Loader2, Search, Trophy as TrophyIcon, Bell, BellOff, Trash2, Lock } from "lucide-react";
import { footballApi } from "@/services/api";
import { useTournamentFollow } from "@/hooks/useTournamentFollow";
import { toast } from "sonner";

export const FootballTournamentManager = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toggle: toggleFollow, isFollowed } = useTournamentFollow();
    
    // Private tournament logic
    const [passcodePromptTournament, setPasscodePromptTournament] = useState<any>(null);
    const [passcodeAttempt, setPasscodeAttempt] = useState("");
    const [passcodeError, setPasscodeError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    
    const getCurrentUserId = () => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                return user._id || user.id || null;
            }
        } catch { }
        return null;
    };
    const currentUserId = getCurrentUserId();

    // Get granted tournaments from localStorage
    const getGrantedTournaments = () => {
        try {
            return JSON.parse(localStorage.getItem('footballGrantedTournamentIds') || '[]');
        } catch {
            return [];
        }
    };

    const addGrantedTournament = (id: string) => {
        const granted = getGrantedTournaments();
        if (!granted.includes(id)) {
            granted.push(id);
            localStorage.setItem('footballGrantedTournamentIds', JSON.stringify(granted));
        }
    };

    useEffect(() => {
        fetchTournamentsWithLocation();
    }, []);

    const fetchTournamentsWithLocation = () => {
        setIsLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchTournaments(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn("Geolocation denied or error, fetching default discovery:", error);
                    fetchTournaments();
                },
                { timeout: 10000, maximumAge: 60000 }
            );
        } else {
            fetchTournaments();
        }
    };

    const fetchTournaments = async (lat?: number, lng?: number) => {
        try {
            const params: any = {};
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }
            // Always pass userId so the backend returns the creator's own private tournaments
            if (currentUserId) {
                params.userId = currentUserId;
            }
            const res: any = await footballApi.getTournaments(params);
            setTournaments(res.data || []);
        } catch (err) {
            console.error("Failed to fetch football tournaments:", err);
            toast.error("Failed to load tournaments");
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch when search query changes (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTournamentsWithLocation();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleTournamentClick = (tournament: any) => {
        const granted = getGrantedTournaments();
        // If public, or user created it, or user already granted access
        if (tournament.visibility !== 'Private' || 
            (currentUserId && tournament.createdBy === currentUserId) ||
            granted.includes(tournament._id)) {
            navigate(`/football/tournament/${tournament._id}`);
        } else {
            setPasscodePromptTournament(tournament);
            setPasscodeAttempt("");
            setPasscodeError("");
        }
    };

    const handleVerifyPasscode = async () => {
        if (!passcodeAttempt) {
            setPasscodeError("Passcode is required");
            return;
        }
        setIsVerifying(true);
        setPasscodeError("");
        try {
            const res: any = await footballApi.verifyPasscode(passcodePromptTournament._id, passcodeAttempt);
            if (res.success) {
                addGrantedTournament(passcodePromptTournament._id);
                toast.success("Access granted!");
                navigate(`/football/tournament/${passcodePromptTournament._id}`);
                setPasscodePromptTournament(null);
            }
        } catch (err: any) {
            setPasscodeError(err.response?.data?.message || "Invalid passcode");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDeleteTournament = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await footballApi.deleteTournament(id);
            toast.success(`"${name}" deleted`);
            fetchTournaments();
        } catch (err) {
            toast.error("Failed to delete tournament");
        }
    };

    const handleToggleFollow = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toggleFollow(id, true); // true for football
    };

    const filteredTournaments = tournaments.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ongoing = filteredTournaments.filter(t => t.status === 'Live');
    const upcoming = filteredTournaments.filter(t => t.status === 'Upcoming');
    const recent = filteredTournaments.filter(t => t.status === 'Completed');

    const TournamentList = ({ list }: { list: any[] }) => (
        <div className="flex overflow-x-auto gap-6 pb-8 pt-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 mt-2">
            {list.map((tournament) => (
                <div key={tournament._id} className="snap-start shrink-0 w-[300px] md:w-[360px]">
                    <Card 
                        onClick={() => handleTournamentClick(tournament)}
                        className="bg-secondary/30 backdrop-blur-md border-border/50 rounded-3xl overflow-hidden hover:bg-secondary/50 hover:border-border transition-all duration-300 cursor-pointer group h-full flex flex-col shadow-sm hover:shadow-md"
                    >
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="p-6 space-y-5 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                                        <Trophy size={20} className="text-primary" />
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide flex items-center gap-1 ${
                                        tournament.status === 'Live' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                        tournament.status === 'Upcoming' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                        'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                                    }`}>
                                        {tournament.visibility === 'Private' && <Lock size={10} />}
                                        {tournament.status}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleToggleFollow(e, tournament._id)}
                                            className={`p-2 rounded-xl transition-all ${isFollowed(tournament._id)
                                                ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                                }`}
                                            title={isFollowed(tournament._id) ? "Unfollow tournament" : "Follow tournament"}
                                        >
                                            {isFollowed(tournament._id) ? <BellOff size={16} /> : <Bell size={16} />}
                                        </button>
                                        {(() => {
                                            const ownerId = typeof tournament.createdBy === 'object' ? tournament.createdBy?._id : tournament.createdBy;
                                            const user = JSON.parse(localStorage.getItem("user") || "{}");
                                            const isOwner = (ownerId && currentUserId && ownerId.toString() === currentUserId.toString()) || 
                                                           user.role?.toLowerCase() === 'admin' || 
                                                           user.email?.toLowerCase() === 'admin@sportbuzz.com';
                                            
                                            return isOwner && (
                                                <button
                                                    onClick={(e) => handleDeleteTournament(e, tournament._id, tournament.name)}
                                                    className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Delete tournament"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                        {tournament.name}
                                    </h3>
                                    <div className="flex items-center gap-5 mt-3 text-muted-foreground">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Users size={14} className="opacity-70" /> 
                                            <span>{tournament.teams?.length || 0} Teams</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Calendar size={14} className="opacity-70" /> 
                                            <span>{new Date(tournament.startDate).getFullYear()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex justify-between items-center group-hover:bg-muted/50 transition-colors mt-auto">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase group-hover:text-foreground transition-colors">
                                    {tournament.format}
                                </span>
                                <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
            {list.length === 0 && (
                <div className="w-full py-24 text-center bg-secondary/20 border border-border/50 rounded-3xl flex flex-col items-center justify-center">
                    <div className="p-4 bg-secondary rounded-full mb-4">
                        <TrophyIcon size={32} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium text-sm">No tournaments found in this category.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Trophy size={18} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Tournaments
                        </h2>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm mt-2 ml-11">Manage your leagues and knockout competitions</p>
                </div>
                
                <div className="flex gap-3">
                    <Button 
                        onClick={() => navigate("/football/match/create")}
                        variant="secondary"
                        className="rounded-full font-semibold px-6 h-12 shadow-sm transition-all hover:shadow-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                    >
                        <Plus size={18} className="mr-2" /> New Match
                    </Button>
                    <Button 
                        onClick={() => navigate("/football/tournament/create")}
                        className="rounded-full font-semibold px-6 h-12 shadow-sm transition-all hover:shadow-md"
                    >
                        <Plus size={18} className="mr-2" /> New Tournament
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary/40 backdrop-blur-sm border border-border rounded-full h-14 pl-14 pr-6 focus:ring-2 ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/70 font-medium shadow-sm"
                />
            </div>

            <div className="space-y-4">
                <Tabs defaultValue="ongoing" className="w-full">
                    <div className="flex p-1.5 bg-secondary/60 backdrop-blur-xl rounded-full border border-border/50 overflow-x-auto max-w-max hide-scrollbar shadow-inner">
                        <TabsList className="bg-transparent border-0 p-0 h-auto">
                            <TabsTrigger 
                                value="ongoing" 
                                className="shrink-0 px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                            >
                                Ongoing ({ongoing.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="upcoming" 
                                className="shrink-0 px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                            >
                                Upcoming ({upcoming.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="recent" 
                                className="shrink-0 px-6 py-2 rounded-full text-xs font-bold tracking-wide transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                            >
                                Recent ({recent.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="mt-6">
                        {isLoading ? (
                            <div className="py-24 flex justify-center items-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="ongoing" className="mt-0 outline-none">
                                    <TournamentList list={ongoing} />
                                </TabsContent>
                                <TabsContent value="upcoming" className="mt-0 outline-none">
                                    <TournamentList list={upcoming} />
                                </TabsContent>
                                <TabsContent value="recent" className="mt-0 outline-none">
                                    <TournamentList list={recent} />
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </div>

            {passcodePromptTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-3xl border border-border/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">Private Tournament</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                "{passcodePromptTournament.name}" is a private tournament. Please enter the passcode to access it.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="password"
                                        placeholder="Enter Passcode"
                                        value={passcodeAttempt}
                                        onChange={(e) => setPasscodeAttempt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasscode()}
                                        className="w-full bg-secondary/50 border border-border rounded-xl h-12 px-4 focus:ring-2 ring-primary/20 focus:border-primary outline-none transition-all"
                                        autoFocus
                                    />
                                    {passcodeError && (
                                        <p className="text-red-500 text-sm mt-2">{passcodeError}</p>
                                    )}
                                </div>
                                
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPasscodePromptTournament(null)}
                                        className="flex-1 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleVerifyPasscode}
                                        disabled={!passcodeAttempt || isVerifying}
                                        className="flex-1 rounded-xl"
                                    >
                                        {isVerifying ? <Loader2 className="animate-spin" size={18} /> : "Verify & Enter"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
