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
import {
  matches as mockMatches,
  players,
} from "@/data/mockData";
import { useLiveCricketMatches } from "@/hooks/useCricketMatches";
import { useFeaturedCricketMatches } from "@/hooks/useFeaturedMatches";
import { useFollowedTournamentMatches } from "@/hooks/useFollowedTournamentMatches";
import { useFootballDashboard } from "@/hooks/useFootballMatches";
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

  // Fetch REAL football data from Football-Data.org (12-min cache)
  const { data: footballDashboard, isLoading: footballLoading } = useFootballDashboard();

  // Get mock data for other sports (excluding cricket AND football — football is now real)
  const otherSportsMockMatches = mockMatches.filter(m => m.sport !== "cricket" && m.sport !== "football");

  // Build real football matches from API response
  const realFootballMatches = useMemo(() => {
    if (!footballDashboard) return [];
    const all = footballDashboard.all || [];
    // Ensure each match has Date objects for startTime
    return all.map((m: any) => ({
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

    return [...realCricket, ...realFootballMatches, ...otherSportsMockMatches];
  }, [cricketData, realFootballMatches, otherSportsMockMatches]);

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
  
  // Categorized football for dashboard (from real API)
  const footballLeague = useMemo(() => 
    footballDashboard?.league?.map((m: any) => ({ ...m, startTime: new Date(m.startTime) })) || [], 
    [footballDashboard]
  );
  const footballCup = useMemo(() => 
    footballDashboard?.cup?.map((m: any) => ({ ...m, startTime: new Date(m.startTime) })) || [], 
    [footballDashboard]
  );
  const footballInternational = useMemo(() => 
    footballDashboard?.international?.map((m: any) => ({ ...m, startTime: new Date(m.startTime) })) || [], 
    [footballDashboard]
  );
  const footballLiveCount = footballDashboard?.meta?.liveCount || 0;
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
        <title>SportBuzz - Live Sports Scores & Performance Analytics</title>
        <meta
          name="description"
          content="Track live scores, match updates, and in-depth performance analytics for Cricket, Football, Basketball, and Tennis. Your ultimate sports companion."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
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

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <SportFilter
              activeSport={activeSport}
              onSportChange={setActiveSport}
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
                  <option className="bg-slate-950 text-white" value="all">All Fields</option>
                  <option className="bg-slate-950 text-white" value="team">Teams</option>
                  <option className="bg-slate-950 text-white" value="venue">Venues</option>
                  <option className="bg-slate-950 text-white" value="type">Match Type</option>
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
              {/* Cricket Section with Subsections */}
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-live/10 rounded-lg">
                    <SportIcon sport="cricket" className="w-5 h-5 text-live" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Cricket</h2>
                  {cricketLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* TEST Matches */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-live pl-2">Test Matches</h3>
                    <div className="flex flex-col gap-4">
                      {testMatches.length ? (
                        testMatches.map(match => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic pl-1 py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No featured Test matches</div>
                      )}
                    </div>
                  </div>

                  {/* ODI Matches */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-blue-500 pl-2">ODI Matches</h3>
                    <div className="flex flex-col gap-4">
                      {odiMatches.length ? (
                        odiMatches.map(match => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic pl-1 py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No featured ODI matches</div>
                      )}
                    </div>
                  </div>

                  {/* T20 Matches */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-green-500 pl-2">T20 Matches</h3>
                    <div className="flex flex-col gap-4">
                      {t20Matches.length ? (
                        t20Matches.map(match => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic pl-1 py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No featured T20 matches</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ─── FOOTBALL (Real Data from Football-Data.org) ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <SportIcon sport="football" size={24} />
                  <h2 className="text-xl font-bold text-foreground">Football</h2>
                </div>

                {footballLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : footballMatches.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-6 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">
                    No football matches available right now
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* League Matches */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-green-500 pl-2">League</h3>
                      <div className="flex flex-col gap-4">
                        {footballLeague.length > 0 ? footballLeague.map((match: any) => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        )) : (
                          <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
                        )}
                      </div>
                    </div>

                    {/* Cup Matches */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-yellow-500 pl-2">Cup</h3>
                      <div className="flex flex-col gap-4">
                        {footballCup.length > 0 ? footballCup.map((match: any) => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        )) : (
                          <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
                        )}
                      </div>
                    </div>

                    {/* International Matches */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-2 border-blue-500 pl-2">International</h3>
                      <div className="flex flex-col gap-4">
                        {footballInternational.length > 0 ? footballInternational.map((match: any) => (
                          <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                        )) : (
                          <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
                        )}
                      </div>
                    </div>

                    {/* Fallback: if no categorization, show all */}
                    {footballLeague.length === 0 && footballCup.length === 0 && footballInternational.length === 0 && footballMatches.length > 0 && (
                      <div className="col-span-1 lg:col-span-3">
                        <div className="flex flex-col gap-4">
                          {footballMatches.map((match: any) => (
                            <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
              <MatchSection
                title="Basketball"
                sport="basketball"
                matches={basketballMatches}
                onMatchClick={(match) => handleMatchClick(match.id)}
              />
              <MatchSection
                title="Tennis"
                sport="tennis"
                matches={tennisMatches}
                onMatchClick={(match) => handleMatchClick(match.id)}
              />
            </div>
          ) : (
            <div id="match-sections">
              <MatchSection
                title={activeSport.charAt(0).toUpperCase() + activeSport.slice(1)}
                sport={activeSport as Sport}
                matches={filteredMatches}
                onMatchClick={(match) => handleMatchClick(match.id)}
                isLoading={activeSport === "cricket" && cricketLoading}
              />
            </div>
          )}


          {/* Feature Coming Soon Placeholder for Live Tab */}


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
                © 2024 SportBuzz. All rights reserved.
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
