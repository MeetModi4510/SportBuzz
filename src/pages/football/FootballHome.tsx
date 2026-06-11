import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { FootballMatchCard } from "../../components/football/FootballMatchCard";
import { TransferCard } from "../../components/football/TransferCard";
import { FootballNewsSidebar } from "../../components/football/FootballNewsSidebar";
import { FootballStandings } from "../../components/football/FootballStandings";
import { FootballTopStats } from "../../components/football/FootballTopStats";
import { useLiveFootballMatches, useRecentFootballMatches, useUpcomingFootballMatches } from "../../hooks/football/useFootballQueries";
import { useRecentTransfers } from "../../hooks/football/useFootballQueries";
import { useTrendingPlayers, TrendingPlayerData } from "../../hooks/football/useTrendingPlayers";
import { TrendingPlayerCard } from "../../components/football/TrendingPlayerCard";
import { TrendingPlayerModal } from "../../components/football/TrendingPlayerModal";
import { Loader2, RefreshCw, ArrowRightLeft, TrendingUp } from "lucide-react";
import { footballApi, PRIORITY_CLUBS } from "../../services/football/footballApi";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "live" | "recent" | "upcoming";
type TransferFilter = "all" | "transfers" | "loans" | "free_transfers" | "free_agents" | "contracts" | "contract_extensions";
type TransferSort = "newest" | "highest_fee";

export default function FootballHome() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [transferFilter, setTransferFilter] = useState<TransferFilter>("all");
  const [transferSort, setTransferSort] = useState<TransferSort>("newest");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: liveMatches, isLoading: liveLoading, refetch: refetchLive } = useLiveFootballMatches();
  const { data: recentMatches, isLoading: recentLoading, refetch: refetchRecent } = useRecentFootballMatches();
  const { data: upcomingMatches, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingFootballMatches();
  const { data: recentTransfers, isLoading: transfersLoading } = useRecentTransfers();
  const { data: trendingPlayersData, isLoading: trendingLoading } = useTrendingPlayers();

  const [selectedTrendingPlayer, setSelectedTrendingPlayer] = useState<TrendingPlayerData | null>(null);


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
        queryClient.invalidateQueries({ queryKey: ['football', 'latest-transfers'] })
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

  // Process Transfers
  const processedTransfers = useMemo(() => {
    if (!recentTransfers?.data) return [];
    
    // Filter by priority clubs
    const priorityFiltered = recentTransfers.data.filter(t => {
      const outName = (t.fromClub || t.fromClubFullName || '').toLowerCase();
      const inName = (t.toClub || t.toClubFullName || '').toLowerCase();
      return PRIORITY_CLUBS.some(club => outName.includes(club) || inName.includes(club));
    });

    let result = [...priorityFiltered];

    // Filter
    if (transferFilter !== "all") {
      result = result.filter(t => {
        if (transferFilter === "loans") return t.onLoan;
        if (transferFilter === "free_transfers") return t.fee?.feeText?.toLowerCase() === "free transfer";
        if (transferFilter === "free_agents") return t.fromClubId === 2 || t.toClubId === 2 || t.fromClub.toLowerCase().includes('free agent') || t.toClub.toLowerCase().includes('free agent');
        if (transferFilter === "contracts") return t.transferType?.localizationKey === "contract";
        if (transferFilter === "contract_extensions") return t.contractExtension;
        if (transferFilter === "transfers") return !t.onLoan && t.fee?.feeText?.toLowerCase() !== "free transfer" && !t.contractExtension && t.transferType?.localizationKey !== "contract";
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (transferSort === "newest") {
        return new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime();
      } else if (transferSort === "highest_fee") {
        const feeA = a.fee?.value || 0;
        const feeB = b.fee?.value || 0;
        return feeB - feeA;
      }
      return 0;
    });

    return result;
  }, [recentTransfers, transferFilter, transferSort]);

  const isCustomTransferView = transferFilter !== "all" || transferSort !== "newest";

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

          {/* Transfers Market (Horizontal Scroll) */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft size={18} className="text-white/80" />
                  <h2 className="text-xl font-bold tracking-tight text-white/90">Latest Transfers</h2>
                </div>
                {recentTransfers?.lastFetched && (
                  <p className="text-xs text-white/40 font-medium ml-8">
                    Last updated on {new Date(recentTransfers.lastFetched).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex p-1 bg-white/5 backdrop-blur-3xl rounded-lg border border-white/10 overflow-x-auto max-w-[80vw] hide-scrollbar flex-nowrap">
                  <button onClick={() => setTransferFilter("all")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'all' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}>All</button>
                  <button onClick={() => setTransferFilter("transfers")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'transfers' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-[#d4af37]/60 hover:text-[#d4af37]'}`}>Transfers</button>
                  <button onClick={() => setTransferFilter("loans")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'loans' ? 'bg-blue-500 text-black shadow-lg' : 'text-blue-500/60 hover:text-blue-500'}`}>Loans</button>
                  <button onClick={() => setTransferFilter("free_transfers")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'free_transfers' ? 'bg-emerald-500 text-black shadow-lg' : 'text-emerald-500/60 hover:text-emerald-500'}`}>Free Transfers</button>
                  <button onClick={() => setTransferFilter("free_agents")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'free_agents' ? 'bg-purple-500 text-black shadow-lg' : 'text-purple-500/60 hover:text-purple-500'}`}>Free Agents</button>
                  <button onClick={() => setTransferFilter("contracts")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'contracts' ? 'bg-orange-500 text-black shadow-lg' : 'text-orange-500/60 hover:text-orange-500'}`}>Contracts</button>
                  <button onClick={() => setTransferFilter("contract_extensions")} className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferFilter === 'contract_extensions' ? 'bg-pink-500 text-black shadow-lg' : 'text-pink-500/60 hover:text-pink-500'}`}>Contract Extensions</button>
                </div>
                
                <div className="flex p-1 bg-white/5 backdrop-blur-3xl rounded-lg border border-white/10">
                  <button onClick={() => setTransferSort("newest")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferSort === 'newest' ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Newest First</button>
                  <button onClick={() => setTransferSort("highest_fee")} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${transferSort === 'highest_fee' ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Highest Fee</button>
                </div>
              </div>
            </div>
            
            {transfersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : !processedTransfers || processedTransfers.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-white/40 font-medium">No transfers match your filters.</p>
              </div>
            ) : (
              <div className={isCustomTransferView ? "flex overflow-x-auto gap-6 pb-6 pt-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0" : "relative overflow-hidden w-full group py-4 -mx-4 px-4 md:mx-0 md:px-0"}>
                <div className={isCustomTransferView ? "flex gap-6" : "flex w-max animate-[marquee_300s_linear_infinite] hover:[animation-play-state:paused] gap-6"}>
                  {isCustomTransferView ? (
                    processedTransfers.map((transfer, idx) => (
                      <div key={idx} className="snap-start shrink-0">
                        <TransferCard transferData={transfer} />
                      </div>
                    ))
                  ) : (
                    /* Duplicate the array twice to ensure a seamless infinite scroll loop */
                    [...processedTransfers, ...processedTransfers, ...processedTransfers, ...processedTransfers].map((transfer, idx) => (
                      <div key={idx} className="shrink-0">
                        <TransferCard transferData={transfer} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ─── Premier League Standings ─────────────────────── */}
          <FootballStandings />

          {/* ─── Top Stats ─────────────────────────────────────── */}
          <FootballTopStats />

          {/* Latest News */}
          <section className="space-y-6">
            <FootballNewsSidebar />
          </section>

          {/* ─── Trending Players ─────────────────────────────── */}
          <section className="space-y-6">
            <div className="flex flex-col gap-1 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#d4af37]/10 rounded-lg backdrop-blur-sm border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <TrendingUp size={22} className="text-[#d4af37]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#d4af37] via-amber-200 to-[#d4af37] bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] text-transparent bg-clip-text">
                  Trending Players
                </h2>
              </div>
              <p className="text-sm text-[#d4af37]/70 font-medium ml-14">Top performers of the moment</p>
            </div>

            {trendingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : !trendingPlayersData?.data || trendingPlayersData.data.length === 0 ? (
              <div className="py-16 text-center">
                <TrendingUp size={32} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/40 font-medium text-sm">Trending players will appear once the API key is configured.</p>
                <p className="text-white/20 text-xs mt-1">Set ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS in server/.env</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-5 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {trendingPlayersData.data.map((player) => (
                  <div key={player.playerId} className="snap-start shrink-0 w-48 h-full">
                    <TrendingPlayerCard player={player} onClick={setSelectedTrendingPlayer} />
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

      <TrendingPlayerModal
        player={selectedTrendingPlayer}
        onClose={() => setSelectedTrendingPlayer(null)}
      />
    </>
  );
}
