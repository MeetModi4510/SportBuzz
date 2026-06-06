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
import { NewsSection } from "@/components/NewsSection";
import {
  matches as mockMatches,
  players,
} from "@/data/mockData";
import { useLiveCricketMatches } from "@/hooks/useCricketMatches";
import { useFeaturedCricketMatches } from "@/hooks/useFeaturedMatches";
import { useFollowedTournamentMatches } from "@/hooks/useFollowedTournamentMatches";
import { useFootballDashboard, useCategorizedFootballMatches } from "@/hooks/useFootballMatches";
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

  // Fetch featured cricket data by format (Test, ODI, T20)
  // Using backend proxy for all data - optimized for API quota
  const { data: cricketData, isLoading: cricketLoading } = useFeaturedCricketMatches();
  const { data: liveCricket } = useLiveCricketMatches();

  // Fetch REAL football data from Sofascore (15-min cache)
  const { data: footballDashboard, isLoading: footballLoading } = useFootballDashboard();
  
  // Only fetch categorized football matches when the tab is active
  const { data: categorizedFootball, isLoading: categorizedFootballLoading } = useCategorizedFootballMatches();

  // Get mock data for other sports (excluding cricket AND football — football is now real)
  const otherSportsMockMatches = mockMatches.filter(m => m.sport !== "cricket" && m.sport !== "football");

  // Build real football matches from API response (Live only)
  const realFootballMatches = useMemo(() => {
    if (!footballDashboard) return [];
    const live = (footballDashboard as any).live || [];
    // Ensure each match has Date objects for startTime
    return live.map((m: any) => ({
      ...m,
      startTime: new Date(m.startTime),
    }));
  }, [footballDashboard]);

  // Combine ALL featured cricket data + real football + other mock
  const allMatches = useMemo(() => {
    let realCricket: Match[] = [];

    if (cricketData) {
      realCricket = [
        ...(cricketData.test || []),
        ...(cricketData.odi || []),
        ...(cricketData.t20 || [])
      ];
    }

    let footballToDisplay = realFootballMatches;
    if (activeSport === "football" && categorizedFootball) {
       footballToDisplay = [
          ...((categorizedFootball as any).live || []),
          ...((categorizedFootball as any).upcoming || []),
          ...((categorizedFootball as any).completed || [])
       ].map((m: any) => ({ ...m, startTime: new Date(m.startTime) }));
    }

    return [...realCricket, ...footballToDisplay, ...otherSportsMockMatches];
  }, [cricketData, realFootballMatches, categorizedFootball, activeSport, otherSportsMockMatches]);

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
    navigate(`/match/${matchId}`, { state: { from: 'dashboard', section: 'matches' } });
  };

  const handlePlayerClick = (player: { id: string }) => {
    navigate(`/player/${player.id}`, { state: { from: 'dashboard', section: 'trending' } });
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
  const footballMatches = filteredMatches.filter((m) => m.sport === "football");
  
  // Categorized football for dashboard (from real API) - Now only Live
  const footballLiveCount = (footballDashboard as any)?.meta?.totalLive || 0;
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
    const apiLiveCount = liveCricket?.filter(m => m.status === 'live').length || 0;
    const followedLiveCount = followedLiveMatches.length;
    return apiLiveCount + followedLiveCount;
  }, [liveCricket, followedLiveMatches]);


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
          <section className="text-center py-16 space-y-6 rounded-[2.5rem] bg-gradient-to-br from-[#1c1c1c] via-[#121212] to-[#0a0a0a] border border-[#D4AF37]/20 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1),0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden mt-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tighter text-white relative z-10 leading-tight drop-shadow-sm">
              Live Sports.<br className="md:hidden" />
              <span className="bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent font-light tracking-tight ml-3">Elevated.</span>
            </h1>
            <p className="text-[#D4AF37]/60 text-lg md:text-xl max-w-2xl mx-auto font-medium tracking-wide relative z-10">
              Real-time scores, deep analytics, and performance insights across the globe's premier sporting events.
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

          <div className="sticky top-20 z-40 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#0a0a0a]/80 backdrop-blur-2xl border border-[#D4AF37]/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <SportFilter
              activeSport={activeSport}
              onSportChange={setActiveSport}
            />

            <div className="flex items-center gap-3 flex-1 md:flex-initial">
              {/* Search Bar & Category Select */}
              <div className="flex items-center gap-2 flex-1 md:flex-initial bg-[#121212] border border-[#D4AF37]/20 rounded-full p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all focus-within:ring-1 focus-within:ring-[#D4AF37]/40 focus-within:bg-[#1a1a1a]">
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
              <MatchSection
                title="Football"
                sport="football"
                matches={filteredMatches.filter(m => m.sport === "football")}
                onMatchClick={(match) => handleMatchClick(match.id)}
                onlyLive={true}
                onViewAllClick={() => setActiveSport("football")}
                isLoading={footballLoading}
              />
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
          ) : (
            <div id="match-sections">
              <MatchSection
                title={activeSport.charAt(0).toUpperCase() + activeSport.slice(1)}
                sport={activeSport as Sport}
                matches={filteredMatches}
                onMatchClick={(match) => handleMatchClick(match.id)}
                isLoading={(activeSport === "cricket" && cricketLoading) || (activeSport === "football" && categorizedFootballLoading)}
              />
            </div>
          )}


          {/* Feature Coming Soon Placeholder for Live Tab */}


          {/* Global Sports News */}
          <NewsSection />

          <div id="trending-players">
            <TrendingPlayers players={players} onPlayerClick={handlePlayerClick} />
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
