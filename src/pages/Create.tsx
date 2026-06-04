import { Navbar } from "@/components/Navbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Zap, ChevronRight, Gavel } from "lucide-react";
import { TournamentManager } from "@/components/admin/TournamentManager";
import { FootballTournamentManager } from "@/components/admin/FootballTournamentManager";
import { MatchManager } from "@/components/admin/MatchManager";
import AuctionList from "./auction/AuctionList";

type ActiveView = "hub" | "tournament" | "match" | "auction" | "football-tournament";

const Create = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = (searchParams.get("view") as ActiveView) || "hub";

    const setActiveView = (view: ActiveView) => {
        setSearchParams(view === "hub" ? new URLSearchParams() : { view });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {activeView === "hub" ? (
                    <>
                        {/* Hero */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                <Zap size={14} className="text-primary" />
                                <span className="text-primary text-sm font-medium">Create & Manage</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground font-display mb-4">
                                Build Your Sports World
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                                Create tournaments or schedule standalone matches for Cricket & Football.
                            </p>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card
                                onClick={() => setActiveView("tournament")}
                                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-500/60 border cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group"
                            >
                                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Cricket League</h2>
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                        Full Tournament Setup
                                    </p>
                                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-medium mt-2 group-hover:gap-2 transition-all">
                                        Get Started <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                onClick={() => setActiveView("football-tournament")}
                                className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-600/30 hover:border-blue-600/60 border cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group"
                            >
                                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Football Pro</h2>
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                        League & Knockout
                                    </p>
                                    <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-2 group-hover:gap-2 transition-all">
                                        Initialize <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                onClick={() => setActiveView("match")}
                                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/60 border cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group"
                            >
                                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Zap className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Quick Match</h2>
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                        Standalone Scorer
                                    </p>
                                    <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-2 group-hover:gap-2 transition-all">
                                        Play Now <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                onClick={() => setActiveView("auction")}
                                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/60 border cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group"
                            >
                                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Gavel className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Live Auction</h2>
                                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                        Real-time Bidding
                                    </p>
                                    <div className="flex items-center gap-1 text-purple-500 text-xs font-medium mt-2 group-hover:gap-2 transition-all">
                                        Enter Room <ChevronRight size={14} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div>
                        <button
                            onClick={() => setActiveView("hub")}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
                        >
                            ← Back to Create Hub
                        </button>

                        {activeView === "tournament" && <TournamentManager />}
                        {activeView === "football-tournament" && <FootballTournamentManager />}
                        {activeView === "match" && <MatchManager standaloneOnly />}
                        {activeView === "auction" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-foreground">Player Auctions</h2>
                                    <button 
                                        onClick={() => navigate("/auction/create")}
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        + New Auction
                                    </button>
                                </div>
                                <AuctionList />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Create;
