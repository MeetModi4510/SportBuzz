import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { FootballMatchCard } from "../../components/football/FootballMatchCard";
import { TransferCard } from "../../components/football/TransferCard";
import { HeroFeaturedMatch } from "../../components/football/HeroFeaturedMatch";
import { FootballNewsSidebar } from "../../components/football/FootballNewsSidebar";
import { useLiveFootballMatches, useRecentFootballMatches, useUpcomingFootballMatches, useRecentTransfers } from "../../hooks/football/useFootballQueries";
import { Loader2, RefreshCw } from "lucide-react";
import { footballApi } from "../../services/football/footballApi";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "live" | "recent" | "upcoming" | "transfers";

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
      if (activeTab === "live") {
        await footballApi.getLiveMatches(true);
        await queryClient.invalidateQueries({ queryKey: ['football', 'live'] });
      } else if (activeTab === "recent") {
        await footballApi.getRecentMatches(true);
        await queryClient.invalidateQueries({ queryKey: ['football', 'recent'] });
      } else if (activeTab === "upcoming") {
        await footballApi.getUpcomingMatches(true);
        await queryClient.invalidateQueries({ queryKey: ['football', 'upcoming'] });
      } else if (activeTab === "transfers") {
        await footballApi.getRecentTransfers(true);
        await queryClient.invalidateQueries({ queryKey: ['football', 'transfers'] });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = 
    (activeTab === "live" && liveLoading) ||
    (activeTab === "recent" && recentLoading) ||
    (activeTab === "upcoming" && upcomingLoading) ||
    (activeTab === "transfers" && transfersLoading);

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

  // Find featured match for the hero section
  const featuredMatch = useMemo(() => {
    if (liveMatches && liveMatches.length > 0) return liveMatches[0];
    if (upcomingMatches && upcomingMatches.length > 0) return upcomingMatches[0];
    if (recentMatches && recentMatches.length > 0) return recentMatches[0];
    return undefined;
  }, [liveMatches, upcomingMatches, recentMatches]);

  return (
    <>
      <Helmet>
        <title>Football Hub | SportsBuzz</title>
        <meta name="description" content="Live football scores, recent results, upcoming fixtures, and transfers from top global leagues." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        <main className="container mx-auto px-4 py-8 space-y-10">
          
          {/* Hero Section */}
          {!isLoading && featuredMatch && (
            <HeroFeaturedMatch match={featuredMatch} />
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Main Content Column */}
            <div className="flex-1 space-y-8 min-w-0">
              
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
                <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Football Hub</h1>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex p-1 bg-secondary/30 rounded-lg border border-border/50">
                    <button
                      onClick={() => setActiveTab("live")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'live' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => setActiveTab("recent")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'recent' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setActiveTab("transfers")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'transfers' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Transfers
                    </button>
                  </div>

                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing || isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    Refresh {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </button>
                </div>
              </div>

              {/* Content Area */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                </div>
              ) : activeTab === "transfers" ? (
                !recentTransfers || recentTransfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-border/40 rounded-xl bg-secondary/10">
                    <p className="text-muted-foreground font-medium">No recent transfers available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {recentTransfers.map((transfer, idx) => (
                      <TransferCard key={idx} transferData={transfer} />
                    ))}
                  </div>
                )
              ) : currentMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-border/40 rounded-xl bg-secondary/10">
                  <p className="text-muted-foreground font-medium">No matches available for this category right now.</p>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-300">
                  {Object.entries(groupedMatches).map(([leagueName, matches]) => (
                    <section key={leagueName} className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-border/30 pb-2">
                        <img src={matches[0].league.logo} alt={leagueName} className="w-6 h-6 object-contain" />
                        <h2 className="text-xl font-bold tracking-tight">{leagueName}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Right Sidebar for News */}
            <aside className="w-full lg:w-80 xl:w-96 shrink-0">
              <FootballNewsSidebar />
            </aside>

          </div>
        </main>
      </div>
    </>
  );
}
