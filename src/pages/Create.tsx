import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trophy, Zap, ChevronRight, Gavel, ArrowLeft, Activity } from "lucide-react";
import { TournamentManager } from "@/components/admin/TournamentManager";
import { FootballTournamentManager } from "@/components/admin/FootballTournamentManager";
import { MatchManager } from "@/components/admin/MatchManager";
import AuctionList from "./auction/AuctionList";

type ActiveView = "hub" | "tournament" | "match" | "auction" | "football-tournament";

const viewDetails = [
    {
        id: "tournament",
        title: "Cricket League",
        desc: "Comprehensive tournament management with points tables, team standings, and deep player statistics.",
        icon: Trophy,
        color: "from-yellow-500/20 to-orange-500/5",
        accent: "text-yellow-500",
        bgLight: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        features: ["Points Table", "Knockouts", "Player Stats"]
    },
    {
        id: "football-tournament",
        title: "Football Pro",
        desc: "Professional football league tracking. Manage fixtures, track goals, and automate league standings.",
        icon: Activity,
        color: "from-blue-500/20 to-cyan-500/5",
        accent: "text-blue-500",
        bgLight: "bg-blue-500/10",
        border: "border-blue-500/20",
        features: ["League Fixtures", "Goal Tracking", "Standings"]
    },
    {
        id: "match",
        title: "Quick Match",
        desc: "Jump instantly into action. Perfect for standalone friendly games with a live digital scoreboard.",
        icon: Zap,
        color: "from-primary/20 to-emerald-500/5",
        accent: "text-primary",
        bgLight: "bg-primary/10",
        border: "border-primary/20",
        features: ["Instant Setup", "Live Scoreboard", "Standalone"]
    },
    {
        id: "auction",
        title: "Live Auction",
        desc: "Host thrilling, real-time player bidding rooms. Complete with virtual currency and team budgets.",
        icon: Gavel,
        color: "from-purple-500/20 to-pink-500/5",
        accent: "text-purple-500",
        bgLight: "bg-purple-500/10",
        border: "border-purple-500/20",
        features: ["Real-time Bidding", "Virtual Budgets", "Player Pools"]
    }
];

const Create = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = (searchParams.get("view") as ActiveView) || "hub";
    const [hoveredView, setHoveredView] = useState<string>("tournament");

    const setActiveView = (view: ActiveView) => {
        setSearchParams(view === "hub" ? new URLSearchParams() : { view });
    };

    const activeShowcase = viewDetails.find(v => v.id === hoveredView) || viewDetails[0];

    return (
        <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden font-sans">
            {/* Elegant Background Glows */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 relative z-10">
                {activeView === "hub" ? (
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center min-h-[70vh]">
                        
                        {/* Left Side: Navigation List */}
                        <div className="w-full lg:w-5/12 flex flex-col space-y-2 relative z-20">
                            <div className="mb-12">
                                <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-4 text-white">
                                    Your Arena, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-bold">Your Rules.</span>
                                </h1>
                                <p className="text-white/40 text-lg leading-relaxed">
                                    Everything you need to run tournaments, matches, and live auctions in one unified platform.
                                </p>
                            </div>

                            <div className="flex flex-col space-y-1 relative" onMouseLeave={() => setHoveredView("tournament")}>
                                {/* Animated active indicator background */}
                                <div 
                                    className="absolute left-0 w-full h-[88px] bg-white/5 rounded-2xl transition-all duration-500 ease-out pointer-events-none"
                                    style={{
                                        transform: `translateY(${viewDetails.findIndex(v => v.id === hoveredView) * 92}px)`
                                    }}
                                />

                                {viewDetails.map((view) => (
                                    <button
                                        key={view.id}
                                        onMouseEnter={() => setHoveredView(view.id)}
                                        onClick={() => setActiveView(view.id as ActiveView)}
                                        className={`group relative flex items-center justify-between p-6 rounded-2xl transition-all duration-300 text-left h-[88px] ${
                                            hoveredView === view.id ? "text-white" : "text-white/40 hover:text-white/70"
                                        }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <view.icon className={`w-6 h-6 transition-colors duration-300 ${hoveredView === view.id ? view.accent : "text-white/20"}`} />
                                            <span className="text-xl font-semibold tracking-wide">{view.title}</span>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 transition-all duration-300 ${hoveredView === view.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Open Canvas Preview */}
                        <div className="w-full lg:w-7/12 relative h-[500px] flex items-center justify-center">
                            
                            {/* Massive Background Text */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                <span 
                                    key={activeShowcase.id + "-bg"}
                                    className="text-[14rem] font-black uppercase italic text-white/[0.02] tracking-tighter whitespace-nowrap animate-in fade-in zoom-in-50 duration-700 select-none"
                                >
                                    {activeShowcase.title.split(" ")[0]}
                                </span>
                            </div>

                            {/* Massive Glowing Orb */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br ${activeShowcase.color} opacity-40 blur-[100px] rounded-full transition-colors duration-700 pointer-events-none`} />

                            {/* Content */}
                            <div 
                                key={activeShowcase.id} 
                                className="relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-8 duration-500"
                            >
                                {/* Floating Icon Box */}
                                <div className={`w-32 h-32 rounded-[2rem] ${activeShowcase.bgLight} border ${activeShowcase.border} flex items-center justify-center mb-8 backdrop-blur-xl shadow-2xl transition-transform hover:scale-110`}>
                                    <activeShowcase.icon className={`w-14 h-14 ${activeShowcase.accent} drop-shadow-2xl`} />
                                </div>
                                
                                <h2 className="text-4xl font-bold mb-4 text-white tracking-tight drop-shadow-lg">{activeShowcase.title}</h2>
                                <p className="text-white/60 text-lg max-w-md leading-relaxed font-light mb-10">
                                    {activeShowcase.desc}
                                </p>

                                {/* Feature Pills */}
                                <div className="flex flex-wrap justify-center gap-3">
                                    {activeShowcase.features.map((feature, idx) => (
                                        <div 
                                            key={idx}
                                            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/70 backdrop-blur-md shadow-lg"
                                        >
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <button
                            onClick={() => setActiveView("hub")}
                            className="inline-flex items-center gap-3 text-white/40 hover:text-white font-medium text-sm mb-12 transition-all hover:-translate-x-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Return to Menu
                        </button>

                        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            {/* Top subtle highlight */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            {activeView === "tournament" && <TournamentManager />}
                            {activeView === "football-tournament" && <FootballTournamentManager />}
                            {activeView === "match" && <MatchManager standaloneOnly />}
                            {activeView === "auction" && (
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-white/5">
                                        <h2 className="text-3xl font-medium tracking-tight">Player Auctions</h2>
                                        <button 
                                            onClick={() => navigate("/auction/create")}
                                            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
                                        >
                                            Create New Auction
                                        </button>
                                    </div>
                                    <AuctionList />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Create;

