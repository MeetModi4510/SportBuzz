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

      <div className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-white/20">
        <Navbar />

        <main className="container mx-auto px-4 py-12 max-w-7xl space-y-16">
          
          {/* Minimalist Header */}
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">Football.</h1>
            <div className="flex items-center gap-4">
              {/* Sleek pill-shaped tabs */}
              <div className="flex p-1 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10">
                <button onClick={() => setActiveTab("live")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'live' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>Live</button>
                <button onClick={() => setActiveTab("recent")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'recent' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>Recent</button>
                <button onClick={() => setActiveTab("upcoming")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>Upcoming</button>
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white disabled:opacity-50 backdrop-blur-md"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                Sync
              </button>
            </div>
          </div>

          {/* Match Center (Horizontal Scroll) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight text-white/90">Matches</h2>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : currentMatches.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-white/40 font-medium">No matches to display.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(groupedMatches).map(([leagueName, matches]) => (
                  <div key={leagueName} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <img src={matches[0].league.logo} alt={leagueName} className="w-5 h-5 object-contain opacity-80" />
                      <h3 className="text-sm font-semibold tracking-wider uppercase text-white/60">{leagueName}</h3>
                    </div>
                    {/* Horizontal scroll container */}
                    <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {matches.map(match => (
                        <div key={match.fixture.id} className="snap-start shrink-0 w-[300px] md:w-[350px]">
                          <FootballMatchCard 
                            match={match} 
                            onClick={() => handleMatchClick(match.fixture.id)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-white/5" />

          {/* Transfers Market (Horizontal Scroll) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <ArrowRightLeft size={18} className="text-white/80" />
              <h2 className="text-xl font-bold tracking-tight text-white/90">Transfer Intel</h2>
            </div>
            
            {transfersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : !recentTransfers || recentTransfers.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-white/40 font-medium">No transfers available.</p>
              </div>
            ) : (
              <div className="relative overflow-hidden w-full group py-4 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex w-max animate-[marquee_120s_linear_infinite] hover:[animation-play-state:paused] gap-6">
                  {/* Duplicate the array twice to ensure a seamless infinite scroll loop */}
                  {[...recentTransfers, ...recentTransfers, ...recentTransfers, ...recentTransfers].map((transfer, idx) => (
                    <div key={idx} className="shrink-0">
                      <TransferCard transferData={transfer} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr className="border-white/5" />

          {/* Latest News */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <h2 className="text-xl font-bold tracking-tight text-white/90">Latest News</h2>
            </div>
            <FootballNewsSidebar />
          </section>

        </main>
      </div>
    </>
  );
}
