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
        const feeText = typeof t.fee === 'string' ? t.fee : t.fee?.feeText;
        const typeText = typeof t.transferType === 'string' ? t.transferType : t.transferType?.localizationKey;

        if (transferFilter === "loans") return t.onLoan;
        if (transferFilter === "free_transfers") return feeText?.toLowerCase() === "free transfer";
        if (transferFilter === "free_agents") return t.fromClubId === 2 || t.toClubId === 2 || t.fromClub.toLowerCase().includes('free agent') || t.toClub.toLowerCase().includes('free agent');
        if (transferFilter === "contracts") return typeText === "contract";
        if (transferFilter === "contract_extensions") return t.contractExtension;
        if (transferFilter === "transfers") return !t.onLoan && feeText?.toLowerCase() !== "free transfer" && !t.contractExtension && typeText !== "contract";
        return true;
      });
    }

    // Sort
    result.sort((t_a, t_b) => {
      if (transferSort === "newest") {
        return new Date(t_b.transferDate).getTime() - new Date(t_a.transferDate).getTime();
      } else if (transferSort === "highest_fee") {
        const feeA = t_a.feeValue || (typeof t_a.fee === 'object' ? t_a.fee?.value : 0) || 0;
        const feeB = t_b.feeValue || (typeof t_b.fee === 'object' ? t_b.fee?.value : 0) || 0;
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

      <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
        <Navbar />

        <main className="container mx-auto px-4 py-12 max-w-7xl space-y-16">
          
          {/* Minimalist Header */}
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">Football.</h1>
            <div className="flex items-center gap-4">
              {/* Sleek pill-shaped tabs */}
              <div className="flex p-1 bg-secondary/50 backdrop-blur-3xl rounded-full border border-border">
                <button onClick={() => setActiveTab("live")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'live' ? 'bg-background text-foreground shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Live</button>
                <button onClick={() => setActiveTab("recent")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'recent' ? 'bg-background text-foreground shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Recent</button>
                <button onClick={() => setActiveTab("upcoming")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-background text-foreground shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>Upcoming</button>
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-full hover:bg-secondary transition-colors text-foreground disabled:opacity-50 backdrop-blur-md"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                Sync
              </button>
            </div>
          </div>

          {/* Match Center (Horizontal Scroll) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center justify-center relative w-6 h-6">
                <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
                <div className="relative w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">
                Match Center.
              </h2>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentMatches.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground font-medium">No matches to display.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(groupedMatches).map(([leagueName, matches]) => (
                  <div key={leagueName} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <img src={matches[0].league.logo} alt={leagueName} className="w-5 h-5 object-contain opacity-80" />
                      <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">{leagueName}</h3>
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
                  <ArrowRightLeft size={24} className="text-[#00c6ff] drop-shadow-md" />
                  <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00c6ff] to-blue-400">
                    Transfer Center.
                  </h2>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex p-1 bg-secondary/60 backdrop-blur-xl rounded-full border border-border/50 overflow-x-auto max-w-full hide-scrollbar flex-nowrap shadow-inner">
                  <button onClick={() => setTransferFilter("all")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'all' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>All</button>
                  <button onClick={() => setTransferFilter("transfers")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'transfers' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Transfers</button>
                  <button onClick={() => setTransferFilter("loans")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'loans' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Loans</button>
                  <button onClick={() => setTransferFilter("free_transfers")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'free_transfers' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Free Transfers</button>
                  <button onClick={() => setTransferFilter("free_agents")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'free_agents' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Free Agents</button>
                  <button onClick={() => setTransferFilter("contracts")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'contracts' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Contracts</button>
                  <button onClick={() => setTransferFilter("contract_extensions")} className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferFilter === 'contract_extensions' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Contract Extensions</button>
                </div>
                
                <div className="flex p-1 bg-secondary/60 backdrop-blur-xl rounded-full border border-border/50 shadow-inner">
                  <button onClick={() => setTransferSort("newest")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferSort === 'newest' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Newest First</button>
                  <button onClick={() => setTransferSort("highest_fee")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 ${transferSort === 'highest_fee' ? 'bg-[#d4af37] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>Highest Fee</button>
                </div>
              </div>
            </div>
            
            {transfersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#00c6ff]" />
              </div>
            ) : !processedTransfers || processedTransfers.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-foreground/5 rounded-2xl border border-border">
                <ArrowRightLeft size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium text-sm">No transfers match your current filters.</p>
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
                    [...processedTransfers, ...processedTransfers].map((transfer, idx) => (
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
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !trendingPlayersData?.data || trendingPlayersData.data.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-foreground/5 rounded-2xl border border-border">
                <TrendingUp size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium text-sm">Trending players will appear once the API key is configured.</p>
                <p className="text-muted-foreground/40 text-xs mt-1">Set ALLSPORTS_API_FOOTBALL_TRENDING_PLAYERS in server/.env</p>
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
