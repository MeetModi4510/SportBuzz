import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, X, Bell } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SportFilter } from "@/components/SportFilter";
import { StatusFilter } from "@/components/StatusFilter";
import { MatchSection } from "@/components/MatchSection";
import { LiveTicker } from "@/components/LiveTicker";
import { TrendingPlayers } from "@/components/TrendingPlayers";
import { SportIcon } from "@/components/SportIcon";
import { MatchCard } from "@/components/MatchCard";
import { CreatorsSection } from "@/components/CreatorsSection";
import { CricketNewsSection } from '@/components/cricket/CricketNewsSection';
import { CricketRankings } from '@/components/cricket/CricketRankings';
import { CricketTrendingPlayers } from '@/components/cricket/CricketTrendingPlayers';
import { NewsSection } from "@/components/NewsSection";
import {
  matches as mockMatches,
  players,
} from "@/data/mockData";
import { useFeaturedLiveCricketMatches, useFeaturedUpcomingCricketMatches, useFeaturedRecentCricketMatches } from "@/hooks/useFeaturedMatches";
import { useFollowedTournamentMatches } from "@/hooks/useFollowedTournamentMatches";
import { useLiveCricketMatches } from "@/hooks/useCricketMatches";
import { useTrendingPlayers as useFootballTrendingPlayers } from "@/hooks/football/useTrendingPlayers";
import { FootballMatchesLivescore } from "@/components/football/FootballMatchesLivescore";
import { useCricketTrendingPlayers, useCricbuzzPlayerInfo } from "@/hooks/useCricketTrending";
import { tournamentApi } from "@/services/api";
import { Sport, MatchStatus, Match } from "@/data/types";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialSport = (searchParams.get("sport") as Sport | null) || "all";
  const [activeSport, setActiveSport] = useState<Sport | "all">(initialSport);
  const [activeStatus, setActiveStatus] = useState<MatchStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"all" | "team" | "venue" | "type">("all");
  const [cricketTab, setCricketTab] = useState<'live' | 'upcoming' | 'recent'>('live');

  // ─── Cricket: lazy-load by filter ───────────────────────────────────────────
  // Live: always on (initial load). Upcoming/Recent: load when cricket is in scope AND tab is active.
  const { data: liveData,     isLoading: liveLoading     } = useFeaturedLiveCricketMatches();
  const { data: upcomingData, isLoading: upcomingLoading } = useFeaturedUpcomingCricketMatches(
    (activeSport === 'cricket' || activeSport === 'all') && cricketTab === 'upcoming'
  );
  const { data: recentData,   isLoading: recentLoading   } = useFeaturedRecentCricketMatches(
    (activeSport === 'cricket' || activeSport === 'all') && cricketTab === 'recent'
  );

  // Merge whichever slices are loaded — live always, others when fetched
  const cricketData = useMemo(() => {
    const dedupe = (arrs: (Match[] | undefined)[]) => {
      const all = arrs.flat().filter(Boolean) as Match[];
      const unique: Match[] = [];
      const seen = new Set<string>();
      for (const m of all) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          unique.push(m);
        }
      }
      return unique;
    };
    return {
      test: dedupe([liveData?.test, upcomingData?.test, recentData?.test]),
      odi: dedupe([liveData?.odi, upcomingData?.odi, recentData?.odi]),
      t20: dedupe([liveData?.t20, upcomingData?.t20, recentData?.t20]),
    };
  }, [liveData, upcomingData, recentData]);
  const cricketLoading = liveLoading || upcomingLoading || recentLoading;

  const liveCricketMatches = useMemo(() => {
    return [...(liveData?.test || []), ...(liveData?.odi || []), ...(liveData?.t20 || [])]
      .filter(m => m.status === 'live');
  }, [liveData]);

  const { trending: cricketTrending, fetchTrending: fetchCricketTrending } = useCricketTrendingPlayers();
  const { playerInfo: cricketPlayerInfo, loading: cricketPlayerLoading, fetchPlayerInfo: fetchCricketPlayerInfo, clearPlayerInfo: clearCricketPlayerInfo } = useCricbuzzPlayerInfo();

  const { data: footballTrendingPlayers } = useFootballTrendingPlayers();

  // Get mock data for other sports (excluding cricket AND football — football is now real)
  const otherSportsMockMatches = mockMatches.filter(m => m.sport !== "cricket" && m.sport !== "football");

  // Combine ALL featured cricket data + other mock
  const allMatches = useMemo(() => {
    let realCricket: Match[] = [];

    if (cricketData) {
      realCricket = [
        ...(cricketData.test || []),
        ...(cricketData.odi || []),
        ...(cricketData.t20 || [])
      ];
    }

    return [...realCricket, ...otherSportsMockMatches];
  }, [cricketData, activeSport, otherSportsMockMatches]);

  const filteredMatches = useMemo(() => {
    let filtered = [...allMatches];

    if (activeSport !== "all") {
      filtered = filtered.filter((m) => m.sport === activeSport);
    }

    if (activeStatus !== "all") {
      filtered = filtered.filter((m) => m.status === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => {
        const hName = typeof m.homeTeam === 'object' ? m.homeTeam?.name || "" : String(m.homeTeam || "");
        const aName = typeof m.awayTeam === 'object' ? m.awayTeam?.name || "" : String(m.awayTeam || "");
        const vName = typeof m.venue === 'object' ? m.venue?.name || "" : String(m.venue || "");

        const matchesTeam = hName.toLowerCase().includes(query) || aName.toLowerCase().includes(query);
        const matchesVenue = vName.toLowerCase().includes(query);
        const matchesType = m.matchType.toLowerCase().includes(query);

        if (searchCategory === "team") return matchesTeam;
        if (searchCategory === "venue") return matchesVenue;
        if (searchCategory === "type") return matchesType;

        return matchesTeam || matchesVenue || matchesType;
      });
    }

    return filtered;
  }, [allMatches, activeSport, activeStatus, searchQuery, searchCategory]);

  const handleMatchClick = (matchId: string) => {
    const match = filteredMatches.find(m => m.id === matchId);
    if (match?.sport === 'football') {
      navigate(`/football/match/${matchId}`);
    } else {
      navigate(`/match/${matchId}`, { state: { from: 'dashboard', section: 'matches' } });
    }
  };

  const handlePlayerClick = (player: { id: string, name?: string }) => {
    const routeId = player.name ? player.name.replace(/\s+/g, '-') : player.id;
    navigate(`/player/${routeId}`, { state: { from: 'dashboard', section: 'trending' } });
  };

  // Scroll to section when navigating back using React Router hash
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const tryScroll = (attemptsLeft: number) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Clear hash from URL without adding a history entry
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryScroll(attemptsLeft - 1), 200);
      }
    };
    const timer = setTimeout(() => tryScroll(15), 150);
    return () => clearTimeout(timer);
  }, [location.hash]);

  // Group matches by sport for display
  const basketballMatches = filteredMatches.filter((m) => m.sport === "basketball");
  const tennisMatches = filteredMatches.filter((m) => m.sport === "tennis");
  
  // Group cricket matches by format from filteredMatches so search/filters apply
  const cricketFilteredMatches = filteredMatches.filter((m) => m.sport === "cricket");
  const testMatches = cricketFilteredMatches.filter((m) => m.matchType?.toLowerCase() === "test");
  const odiMatches = cricketFilteredMatches.filter((m) => m.matchType?.toLowerCase() === "odi");
  const t20Matches = cricketFilteredMatches.filter((m) => {
    const type = m.matchType?.toLowerCase() || '';
    return type === "t20" || type === "t20i";
  });

  // Calculate live count - Include real cricket data + followed tournament matches (Strict Real-Time)
  const [tournamentList, setTournamentList] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await tournamentApi.getAll();
        setTournamentList(res.data || []);
      } catch (err) {
        console.error("Failed to load tournaments in Index", err);
      }
    };
    fetchTournaments();
  }, []);

  const followedLiveMatches = useFollowedTournamentMatches(tournamentList);
  
  const liveCount = useMemo(() => {
    const apiLiveCount = liveCricketMatches?.length || 0;
    const followedLiveCount = followedLiveMatches.length;
    return apiLiveCount + followedLiveCount;
  }, [liveCricketMatches, followedLiveMatches]);


  return (
    <>
      <Helmet>
        <title>SportsBuzz - Live Sports Scores & Performance Analytics</title>
        <meta
          name="description"
          content="Track live scores, match updates, and in-depth performance analytics for Cricket, Football, Basketball, and Tennis. Your ultimate sports companion."
        />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />

        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Hero Section */}
          <section className="text-center py-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-display">
              <span className="gradient-text">Live Sports</span>
              <span className="text-foreground"> at Your Fingertips</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time scores, deep analytics, and performance insights across Cricket, Football, Basketball, and Tennis.
            </p>
            {/* Live match badge hidden per user request */}
            {/* 
            {liveCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-live/10 text-live px-4 py-2 rounded-full animate-pulse-live">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-live" />
                </span>
                <span className="font-semibold">{liveCount} Live {liveCount === 1 ? "Match" : "Matches"}</span>
              </div>
            )}
            */}
          </section>

          {/* Live Ticker */}
          <LiveTicker />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <SportFilter 
              activeSport={activeSport} 
              onSportChange={(sport) => {
                if (sport === "cricket") {
                  navigate("/cricket");
                } else if (sport === "football") {
                  navigate("/football");
                } else {
                  setActiveSport(sport);
                }
              }} 
            />

            <div className="flex items-center gap-3 flex-1 md:flex-initial">
              {/* Search Bar & Category Select */}
              <div className="flex items-center gap-2 flex-1 md:flex-initial bg-secondary/30 border border-border/50 rounded-lg p-1">
                <div className="relative flex-1 md:w-64 flex items-center">
                  <Search className="absolute left-3 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder={`Search ${activeSport === 'all' ? 'matches' : activeSport}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="h-6 w-[1px] bg-border/50" />

                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value as any)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <option className="bg-popover text-foreground" value="all">All Fields</option>
                  <option className="bg-popover text-foreground" value="team">Teams</option>
                  <option className="bg-popover text-foreground" value="venue">Venues</option>
                  <option className="bg-popover text-foreground" value="type">Match Type</option>
                </select>
              </div>

              <StatusFilter
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
              />
            </div>
          </div>

          {/* Matches Display - Hide if Live Status is active (showing custom placeholder instead) */}

          {activeSport === "all" ? (
            <div id="match-sections" className="space-y-10">
              <MatchSection
                title="Cricket"
                sport="cricket"
                matches={filteredMatches.filter(m => m.sport === "cricket")}
                onMatchClick={(match) => handleMatchClick(match.id)}
                onlyLive={true}
                onViewAllClick={() => setActiveSport("cricket")}
                isLoading={cricketLoading}
              />
              <div className="py-4">
                 <FootballMatchesLivescore />
              </div>
              <MatchSection
                title="Basketball"
                sport="basketball"
                matches={filteredMatches.filter(m => m.sport === "basketball")}
                onMatchClick={(match) => handleMatchClick(match.id)}
                onlyLive={true}
                onViewAllClick={() => setActiveSport("basketball")}
              />
              <MatchSection
                title="Tennis"
                sport="tennis"
                matches={filteredMatches.filter(m => m.sport === "tennis")}
                onMatchClick={(match) => handleMatchClick(match.id)}
                onlyLive={true}
                onViewAllClick={() => setActiveSport("tennis")}
              />
            </div>
          ) : activeSport === "football" ? (
            <div id="match-sections" className="py-4">
              <FootballMatchesLivescore />
            </div>
          ) : (
            <div id="match-sections">
              <MatchSection
                title={activeSport.charAt(0).toUpperCase() + activeSport.slice(1)}
                sport={activeSport as Sport}
                matches={filteredMatches}
                onMatchClick={(match) => handleMatchClick(match.id)}
                isLoading={(activeSport === "cricket" && cricketLoading)}
                activeTabOverride={activeSport === "cricket" ? cricketTab : undefined}
                onTabChange={activeSport === "cricket" ? setCricketTab : undefined}
              />
            </div>
          )}


          {/* Feature Coming Soon Placeholder for Live Tab */}

          {/* Dynamic Sport-Specific Components */}
          {activeSport === "cricket" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12">
              <div className="lg:col-span-3">
                <CricketNewsSection />
              </div>
              <div className="lg:col-span-2">
                <CricketRankings />
              </div>
            </div>
          )}

          {/* Global Sports News - Only on 'All' Tab */}
          {activeSport === "all" && <NewsSection />}

          {/* Trending Players */}
          <div id="trending-players" className="mt-8">
            {activeSport === "cricket" ? (
              <CricketTrendingPlayers />
            ) : (
              <TrendingPlayers 
                players={activeSport === "all" ? players : players.filter(p => p.sport === activeSport)}
                cricketTrending={activeSport === "all" ? cricketTrending?.data : undefined}
                onCricketPlayerClick={(player) => fetchCricketPlayerInfo(player.id)}
                cricketPlayerInfo={cricketPlayerInfo?.data}
                cricketPlayerLoading={cricketPlayerLoading}
                clearCricketPlayerInfo={clearCricketPlayerInfo}
                onPlayerClick={handlePlayerClick} 
                fetchCricketTrending={activeSport === "all" ? fetchCricketTrending : undefined}
                footballTrending={activeSport === "all" || activeSport === "football" ? footballTrendingPlayers?.data : undefined}
              />
            )}
          </div>

          {/* Creators Section */}
          <CreatorsSection />
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 SportsBuzz. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
