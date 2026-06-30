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
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 relative z-10">
                {activeView === "hub" ? (
                    <>
                        {/* Hero Section */}
                        <div className="flex flex-col items-center text-center mb-16 mt-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-md">
                                <Zap size={14} className="text-primary fill-primary" />
                                <span className="text-primary text-[11px] font-bold tracking-widest uppercase">Workspace</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
                                Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Sports World</span>
                            </h1>
                            <p className="text-muted-foreground text-base md:text-lg max-w-2xl font-normal leading-relaxed">
                                Seamlessly create tournaments, schedule standalone matches, or host live auctions.
                            </p>
                        </div>

                        {/* Cards Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Cricket Card */}
                            <Card
                                onClick={() => setActiveView("tournament")}
                                className="group relative bg-card/60 backdrop-blur-xl border-border/50 hover:border-yellow-500/50 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-yellow-500/20 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                                        <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-md" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-yellow-500 transition-colors">Cricket League</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            Complete setup for points tables, knockouts, and player statistics.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mt-8 group-hover:text-yellow-500 transition-colors">
                                        Get Started <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Football Card */}
                            <Card
                                onClick={() => setActiveView("football-tournament")}
                                className="group relative bg-card/60 backdrop-blur-xl border-border/50 hover:border-blue-500/50 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                                        <Trophy className="w-8 h-8 text-blue-500 drop-shadow-md" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">Football Pro</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            Manage full football leagues, fixtures, and standings tracking.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mt-8 group-hover:text-blue-500 transition-colors">
                                        Initialize <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Match Card */}
                            <Card
                                onClick={() => setActiveView("match")}
                                className="group relative bg-card/60 backdrop-blur-xl border-border/50 hover:border-green-500/50 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-green-500/20 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                                        <Zap className="w-8 h-8 text-green-500 drop-shadow-md" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-green-500 transition-colors">Quick Match</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            Jump straight into a standalone match with our digital scorer.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mt-8 group-hover:text-green-500 transition-colors">
                                        Play Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Live Auction Card */}
                            <Card
                                onClick={() => setActiveView("auction")}
                                className="group relative bg-card/60 backdrop-blur-xl border-border/50 hover:border-purple-500/50 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardContent className="p-8 relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                                        <Gavel className="w-8 h-8 text-purple-500 drop-shadow-md" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors">Live Auction</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            Host real-time player bidding rooms for your sports leagues.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mt-8 group-hover:text-purple-500 transition-colors">
                                        Enter Room <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
