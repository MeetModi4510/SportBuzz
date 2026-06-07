import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { FootballMatchCard } from "../../components/football/FootballMatchCard";
import { TransferCard } from "../../components/football/TransferCard";
import { FootballNewsSidebar } from "../../components/football/FootballNewsSidebar";
import { useLiveFootballMatches, useRecentFootballMatches, useUpcomingFootballMatches, useRecentTransfers } from "../../hooks/football/useFootballQueries";
import { Loader2, RefreshCw, ArrowRightLeft } from "lucide-react";
import { footballApi } from "../../services/football/footballApi";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "live" | "recent" | "upcoming";

export default function FootballHome() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: liveMatches, isLoading: liveLoading, refetch: refetchLive } = useLiveFootballMatches();
  const { data: recentMatches, isLoading: recentLoading, refetch: refetchRecent } = useRecentFootballMatches();
  const { data: upcomingMatches, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingFootballMatches();
  const { data: recentTransfers, isLoading: transfersLoading } = useRecentTransfers();

  const handleMatchClick = (matchId: number) => {
    navigate(`/football/match/${matchId}`);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        footballApi.getLiveMatches(true).then(() => queryClient.invalidateQueries({ queryKey: ['football', 'live'] })),
        footballApi.getRecentMatches(true).then(() => queryClient.invalidateQueries({ queryKey: ['football', 'recent'] })),
        footballApi.getUpcomingMatches(true).then(() => queryClient.invalidateQueries({ queryKey: ['football', 'upcoming'] })),
        footballApi.getRecentTransfers(true).then(() => queryClient.invalidateQueries({ queryKey: ['football', 'transfers'] }))
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = 
    (activeTab === "live" && liveLoading) ||
    (activeTab === "recent" && recentLoading) ||
    (activeTab === "upcoming" && upcomingLoading);

  const currentMatches = useMemo(() => {
    if (activeTab === "live") return liveMatches || [];
    if (activeTab === "recent") return recentMatches || [];
    if (activeTab === "upcoming") return upcomingMatches || [];
    return [];
  }, [activeTab, liveMatches, recentMatches, upcomingMatches]);

  // Group by league
  const groupedMatches = useMemo(() => {
    const groups: Record<string, typeof currentMatches> = {};
    currentMatches.forEach(match => {
      const leagueName = match.league.name;
      if (!groups[leagueName]) groups[leagueName] = [];
      groups[leagueName].push(match);
    });
    return groups;
  }, [currentMatches]);

  return (
    <>
      <Helmet>
        <title>Football Hub | SportsBuzz</title>
        <meta name="description" content="Live football scores, recent results, upcoming fixtures, and transfers from top global leagues." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 selection:bg-primary/20">
        <Navbar />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl font-black font-display tracking-tight text-foreground">Football Hub</h1>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-border/50 rounded-xl hover:bg-secondary/50 transition-colors text-foreground disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              Sync Data
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Match Center (Left, spans 8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-secondary/5 border border-border/40 rounded-[2rem] p-6 md:p-8 flex-1 min-h-[500px]">
                
                {/* Tabs */}
                <div className="flex overflow-x-auto p-1.5 bg-background/60 backdrop-blur-md rounded-2xl border border-border/50 w-max max-w-full mb-8 shadow-sm hide-scrollbar">
                  <button onClick={() => setActiveTab("live")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'live' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>Live Matches</button>
                  <button onClick={() => setActiveTab("recent")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'recent' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>Recent Results</button>
                  <button onClick={() => setActiveTab("upcoming")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'upcoming' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>Upcoming</button>
                </div>

                {/* Match Grid */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                  </div>
                ) : currentMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center rounded-2xl bg-background/40 border border-border/20">
                    <p className="text-muted-foreground font-semibold">No matches available for this category right now.</p>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    {Object.entries(groupedMatches).map(([leagueName, matches]) => (
                      <section key={leagueName} className="space-y-5">
                        <div className="flex items-center gap-3 border-b-2 border-border/20 pb-3">
                          <img src={matches[0].league.logo} alt={leagueName} className="w-7 h-7 object-contain drop-shadow-sm" />
                          <h2 className="text-xl font-bold tracking-tight uppercase text-foreground/80">{leagueName}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
                          {matches.map(match => (
                            <FootballMatchCard 
                              key={match.fixture.id} 
                              match={match} 
                              onClick={() => handleMatchClick(match.fixture.id)} 
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trending News (Right, spans 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               <FootballNewsSidebar />
            </div>

            {/* Transfers Market (Bottom, spans full width) */}
            <div className="lg:col-span-12">
               <div className="bg-secondary/5 border border-border/40 rounded-[2rem] p-6 md:p-8">
                 <div className="flex items-center gap-3 mb-8 border-b border-border/20 pb-4">
                   <div className="p-2 bg-primary/10 rounded-xl text-primary">
                     <ArrowRightLeft size={24} strokeWidth={2.5} />
                   </div>
                   <h2 className="text-2xl font-black tracking-tight">Global Transfer Market</h2>
                 </div>
                 
                 {transfersLoading ? (
                   <div className="flex items-center justify-center py-20">
                     <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                   </div>
                 ) : !recentTransfers || recentTransfers.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-background/40 border border-border/20">
                     <p className="text-muted-foreground font-semibold">No recent transfers available.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in duration-500">
                     {recentTransfers.map((transfer, idx) => (
                       <TransferCard key={idx} transferData={transfer} />
                     ))}
                   </div>
                 )}
               </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
