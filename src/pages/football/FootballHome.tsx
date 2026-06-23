import { useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { FootballMatchesLivescore } from "../../components/football/FootballMatchesLivescore";
import { TransferCard } from "../../components/football/TransferCard";
import { FootballNewsSidebar } from "../../components/football/FootballNewsSidebar";
import { FootballStandings } from "../../components/football/FootballStandings";
import { FootballTopStats } from "../../components/football/FootballTopStats";
import { useRecentTransfers } from "../../hooks/football/useFootballQueries";
import { useTrendingPlayers, TrendingPlayerData } from "../../hooks/football/useTrendingPlayers";
import { TrendingPlayerCard } from "../../components/football/TrendingPlayerCard";
import { TrendingPlayerModal } from "../../components/football/TrendingPlayerModal";

import { Loader2, ArrowRightLeft, TrendingUp, ChevronDown } from "lucide-react";
import { useWorldCupTheme } from "../../hooks/football/useWorldCupTheme";

type TransferFilter = "all" | "transfers" | "loans" | "free_transfers" | "free_agents" | "contracts" | "contract_extensions";
type TransferSort = "newest" | "highest_fee";

export default function FootballHome() {
  const [transferFilter, setTransferFilter] = useState<TransferFilter>("all");
  const [transferSort, setTransferSort] = useState<TransferSort>("newest");
  const [transferLeague, setTransferLeague] = useState<string>("all");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const isWorldCup = useWorldCupTheme();

  const { data: recentTransfers, isLoading: transfersLoading } = useRecentTransfers();
  const { data: trendingPlayersData, isLoading: trendingLoading } = useTrendingPlayers();

  const [selectedTrendingPlayer, setSelectedTrendingPlayer] = useState<TrendingPlayerData | null>(null);

  // Process Transfers
  const processedTransfers = useMemo(() => {
    if (!recentTransfers?.data) return [];
    
    // Backend scraper already filters to top leagues — no need to re-filter by club name here.
    // A second client-side club filter was silently dropping valid transfers due to name mismatches
    // (e.g. Transfermarkt sends "Man. City" but the list had "man city").
    let result = [...recentTransfers.data];

    // Filter
    if (transferFilter !== "all") {
      result = result.filter(t => {
        const feeText = typeof t.fee === 'string' ? t.fee : t.fee?.feeText;
        const typeText = typeof t.transferType === 'string' ? t.transferType : t.transferType?.localizationKey;

        if (transferFilter === "loans") return t.onLoan;
        if (transferFilter === "free_transfers") return feeText?.toLowerCase() === "free transfer";
        if (transferFilter === "free_agents") return t.fromClubId === 2 || t.toClubId === 2 || t.fromClub.toLowerCase().includes('free agent') || t.toClub.toLowerCase().includes('free agent') || t.fromClub.toLowerCase().includes('without') || t.toClub.toLowerCase().includes('without') || t.fromClub.toLowerCase().includes('retired') || t.toClub.toLowerCase().includes('retired');
        if (transferFilter === "contracts") return typeText === "contract";
        if (transferFilter === "contract_extensions") return t.contractExtension;
        if (transferFilter === "transfers") return !t.onLoan && feeText?.toLowerCase() !== "free transfer" && !t.contractExtension && typeText !== "contract";
        return true;
      });
    }

    // Filter by League
    if (transferLeague !== "all") {
      result = result.filter(t => String(t.leagueId) === transferLeague);
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

    // Cap at 50 to keep marquee performant and readable
    return result.slice(0, 50);
  }, [recentTransfers, transferFilter, transferSort, transferLeague]);

  const isCustomTransferView = transferFilter !== "all" || transferSort !== "newest" || transferLeague !== "all";

  return (
    <>
      <Helmet>
        <title>Football Hub | SportsBuzz</title>
        <meta name="description" content="Live football scores, recent results, upcoming fixtures, and transfers from top global leagues." />
      </Helmet>

      <div className={cn("min-h-screen pb-24 transition-colors duration-1000", isWorldCup ? "bg-background text-foreground" : "bg-background text-foreground selection:bg-primary/20")}>
        {/* Thematic full page background element for World Cup */}
        {isWorldCup && (
          <div className="fixed inset-0 pointer-events-none -z-20 opacity-[0.03] dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        )}
        <Navbar />

        <main className="container mx-auto px-4 py-12 max-w-7xl space-y-16">
          
          {/* Minimalist Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
                Football.
              </h1>
              {isWorldCup && (
                <div className="text-emerald-500 font-bold tracking-[0.2em] text-sm md:text-base uppercase flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
                  Tournament Hub
                </div>
              )}
            </div>
            {isWorldCup && (
              <div className="hidden sm:flex relative items-center justify-center w-32 h-40 shrink-0 mr-4 group cursor-default">
                {/* Glowing Aura */}
                <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 blur-[30px] rounded-full group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 transition-colors duration-700" />
                
                {/* Background 26 (Official Logo Style) */}
                <span className="absolute text-[90px] font-black text-slate-900/5 dark:text-white/5 tracking-tighter select-none z-0">
                  26
                </span>
                
                {/* Trophy Image (True Transparent PNG) */}
                <img 
                  src="/world-cup-trophy-transparent.png" 
                  alt="World Cup 2026 Logo" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)] brightness-90 dark:brightness-100 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
          </div>
          
          {/* Match Center - Replaced with New Livescore6 Component */}
          <FootballMatchesLivescore variant="hub" />

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

                {/* League Filter - Premium Custom Dropdown */}
                <div className="relative">
                  <div 
                    onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-secondary/60 hover:bg-secondary/80 backdrop-blur-xl rounded-full border border-border/50 shadow-inner cursor-pointer transition-all duration-300"
                  >
                    <span className="text-[11px] font-bold tracking-wide uppercase text-foreground">
                      {(() => {
                        const list = [
                          { id: 'all', name: 'All Leagues' },
                          { id: '47', name: 'Premier League' },
                          { id: '87', name: 'La Liga' },
                          { id: '53', name: 'Ligue 1' },
                          { id: '54', name: 'Bundesliga' },
                          { id: '55', name: 'Serie A' },
                          { id: '130', name: 'MLS' },
                          { id: '536', name: 'Saudi Pro League' },
                          { id: '40', name: 'Belgian Pro League' },
                          { id: '57', name: 'Eredivisie' },
                          { id: '9435', name: 'ISL' },
                        ];
                        return list.find(l => l.id === transferLeague)?.name || 'All Leagues';
                      })()}
                    </span>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isLeagueDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isLeagueDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsLeagueDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 py-2 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col gap-0.5">
                        {[
                          { id: 'all', name: 'All Leagues' },
                          { id: '47', name: 'Premier League' },
                          { id: '87', name: 'La Liga' },
                          { id: '53', name: 'Ligue 1' },
                          { id: '54', name: 'Bundesliga' },
                          { id: '55', name: 'Serie A' },
                          { id: '130', name: 'MLS' },
                          { id: '536', name: 'Saudi Pro League' },
                          { id: '40', name: 'Belgian Pro League' },
                          { id: '57', name: 'Eredivisie' },
                          { id: '9435', name: 'ISL' },
                        ].map(league => (
                          <div 
                            key={league.id}
                            onClick={() => {
                              setTransferLeague(league.id);
                              setIsLeagueDropdownOpen(false);
                            }}
                            className={`px-4 py-2 mx-1 rounded-xl text-[11px] font-bold tracking-wide uppercase cursor-pointer transition-colors flex items-center ${transferLeague === league.id ? 'bg-[#00c6ff]/15 text-[#00c6ff]' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
                          >
                            {league.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
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
                <div
                  className={isCustomTransferView ? "flex gap-6" : "flex w-max gap-6 animate-marquee hover:[animation-play-state:paused]"}
                  style={!isCustomTransferView ? { animationDuration: `${Math.max(60, processedTransfers.length * 5)}s` } : undefined}
                >
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
