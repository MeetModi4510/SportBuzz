import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { footballApi } from "../../services/football/footballApi";
import { footballApiClient } from "../../services/football/apiClient";
import { cacheManager } from "../../utils/football/cacheManager";
import { Loader2, ArrowLeft, Info, Zap, BarChart2, Users, Activity } from "lucide-react";
import { FootballMatch } from "../../types/football/index";
import { TeamLogo } from "../../components/TeamLogo";
import { MatchEvents } from "../../components/football/MatchEvents";
import { MatchStatistics } from "../../components/football/MatchStatistics";
import { MatchLineups } from "../../components/football/MatchLineups";
import { MatchPerformanceLab } from "../../components/football/MatchPerformanceLab";

type MatchTab = "overview" | "events" | "statistics" | "lineups" | "performance lab";

export default function MatchCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MatchTab>("overview");

  // Fetch match details. Caching 30 mins for finished, 1 min for live.
  const { data: match, isLoading, refetch } = useQuery<FootballMatch | null>({
    queryKey: ['football', 'match', id],
    queryFn: async () => {
      if (!id) return null;
      const cacheKey = `match_${id}`;

      const cached = cacheManager.get<FootballMatch>(cacheKey);

      // If cached match exists and is LIVE, we don't return it immediately so we can fetch fresh data
      // (Unless it was cached just a few seconds ago, which cacheManager handles via TTL, but let's be safe)
      const isCachedLive = cached && ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(cached.fixture.status.short);

      if (cached && !isCachedLive) {
        return cached;
      }

      const response = await footballApiClient.get('/fixtures', { params: { id } });
      const matchData = response.data.response?.[0];
      if (matchData) {
        // Cache matches for 30 minutes as requested
        cacheManager.set(cacheKey, matchData, 30);
      }
      return matchData || null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000, // 30 minute stale time
  });

  const isLive = match?.fixture?.status?.short === "1H" ||
    match?.fixture?.status?.short === "2H" ||
    match?.fixture?.status?.short === "HT" ||
    match?.fixture?.status?.short === "ET" ||
    match?.fixture?.status?.short === "P";

  // Polling for live matches
  useEffect(() => {
    if (isLive) {
      const intervalId = setInterval(() => {
        refetch();
      }, 30 * 60 * 1000); // Poll every 30 minutes
      return () => clearInterval(intervalId);
    }
  }, [isLive, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <p className="text-xl font-semibold">Match not found</p>
          <button onClick={() => navigate('/football')} className="text-primary hover:underline">
            Back to Football Home
          </button>
        </div>
      </div>
    );
  }

  const homeGoals = match.events?.filter(e => e.type === "Goal" && e.team.id === match.teams.home.id) || [];
  const awayGoals = match.events?.filter(e => e.type === "Goal" && e.team.id === match.teams.away.id) || [];

  return (
    <>
      <Helmet>
        <title>{match.teams.home.name} vs {match.teams.away.name} | Match Center</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        {/* Header / Scoreboard */}
        <div className="relative pt-8 pb-16 border-b border-border/20 overflow-hidden bg-background">
          {/* Premium Background Effects */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
            style={{ maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)' }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group w-max"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            {/* League Pill */}
            <div className="flex justify-center mb-10">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase bg-secondary/30 border border-border/40 px-6 py-2 rounded-full backdrop-blur-md shadow-sm">
                {match.league.name} {match.fixture.venue.city ? `• ${match.fixture.venue.city}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-center max-w-4xl mx-auto gap-4 md:gap-12">

              {/* Home Team */}
              <div className="flex flex-col items-center flex-1 w-0">
                <div className="w-24 h-24 md:w-36 md:h-36 flex items-center justify-center mb-4 relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10 transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                <span className="font-extrabold text-xl md:text-3xl text-center leading-tight tracking-tight text-foreground drop-shadow-sm">
                  {match.teams.home.name}
                </span>
              </div>

              {/* Score / Status */}
              <div className="flex flex-col items-center justify-center shrink-0 w-32 md:w-48">
                <div className="text-6xl md:text-8xl font-black tracking-tighter flex items-center justify-center gap-3 tabular-nums drop-shadow-2xl">
                  <span className={match.goals.home !== null && match.goals.away !== null && match.goals.home > match.goals.away ? "text-foreground" : "text-foreground/80"}>
                    {match.goals.home ?? '-'}
                  </span>
                  <span className="text-muted-foreground/30 font-light text-5xl md:text-7xl pb-2">-</span>
                  <span className={match.goals.home !== null && match.goals.away !== null && match.goals.away > match.goals.home ? "text-foreground" : "text-foreground/80"}>
                    {match.goals.away ?? '-'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 bg-secondary/40 px-5 py-1.5 rounded-md border border-border/40 backdrop-blur-md shadow-sm">
                  {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                  <span className={`font-bold tracking-[0.1em] uppercase text-[10px] md:text-xs ${isLive ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isLive ? `${match.fixture.status.elapsed}'` : match.fixture.status.short}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center flex-1 w-0">
                <div className="w-24 h-24 md:w-36 md:h-36 flex items-center justify-center mb-4 relative group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10 transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                <span className="font-extrabold text-xl md:text-3xl text-center leading-tight tracking-tight text-foreground drop-shadow-sm">
                  {match.teams.away.name}
                </span>
              </div>

            </div>

            {/* Unified Goalscorers Section */}
            {(homeGoals.length > 0 || awayGoals.length > 0) && (
              <div className="max-w-2xl mx-auto mt-10 grid grid-cols-2 gap-0 border-t border-border/20 pt-6">

                {/* Home Goals */}
                <div className="flex flex-col items-end gap-2 pr-4 md:pr-8 border-r border-border/20">
                  {homeGoals.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-foreground/80">{goal.player.name}</span>
                        {goal.assist.name && <span className="text-[10px] opacity-60">({goal.assist.name})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span className="text-primary font-bold text-xs">{goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-foreground/60">
                          <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" stroke="currentColor" />
                          <path d="M12 12l2.5-2h-5z" stroke="currentColor" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Away Goals */}
                <div className="flex flex-col items-start gap-2 pl-4 md:pl-8">
                  {awayGoals.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-foreground/60">
                          <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" stroke="currentColor" />
                          <path d="M12 12l2.5-2h-5z" stroke="currentColor" />
                        </svg>
                        <span className="text-primary font-bold text-xs">{goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-foreground/80">{goal.player.name}</span>
                        {goal.assist.name && <span className="text-[10px] opacity-60">({goal.assist.name})</span>}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>

        <main className="container mx-auto px-4 mt-8">
          {/* Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-border/40 pb-2">
            {(["overview", "events", "statistics", "lineups", "performance lab"] as MatchTab[]).map(tab => {
              const getTabIcon = (t: MatchTab) => {
                switch (t) {
                  case "overview": return <Info className="w-4 h-4 mr-2 inline-block" />;
                  case "events": return <Zap className="w-4 h-4 mr-2 inline-block" />;
                  case "statistics": return <BarChart2 className="w-4 h-4 mr-2 inline-block" />;
                  case "lineups": return <Users className="w-4 h-4 mr-2 inline-block" />;
                  case "performance lab": return <Activity className="w-4 h-4 mr-2 inline-block" />;
                }
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-t-lg text-sm font-semibold capitalize whitespace-nowrap transition-colors flex items-center justify-center ${activeTab === tab
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary/50"
                    }`}
                >
                  {getTabIcon(tab)}
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (() => {
            // Calculate Man of the Match
            let motm = null;
            if (match.players && ['FT', 'AET', 'PEN'].includes(match.fixture.status.short)) {
              let highestRating = -1;
              match.players.forEach(teamStats => {
                teamStats.players.forEach(p => {
                  const ratingStr = p.statistics[0]?.games?.rating;
                  if (ratingStr) {
                    const rating = parseFloat(ratingStr);
                    if (rating > highestRating) {
                      highestRating = rating;
                      motm = { ...p.player, rating, team: teamStats.team };
                    }
                  }
                });
              });
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="bg-secondary/10 border border-border/50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold">Match Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">League</span>
                      <span className="font-medium">{match.league.name} ({match.league.country})</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium">{match.fixture.venue.name}, {match.fixture.venue.city}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{new Date(match.fixture.date).toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between ${motm ? 'border-b border-border/20 pb-2' : 'pb-2'}`}>
                      <span className="text-muted-foreground">Referee</span>
                      <span className="font-medium">{match.fixture.referee || "N/A"}</span>
                    </div>
                    {motm && (
                      <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          Man of the Match
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{motm.name}</span>
                          <span className="text-xs font-bold bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">
                            {motm.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "events" && (
            <div className="animate-in fade-in duration-300">
              <MatchEvents events={match.events || []} homeTeam={match.teams.home} awayTeam={match.teams.away} />
            </div>
          )}

          {activeTab === "statistics" && (
            <div className="animate-in fade-in duration-300">
              <MatchStatistics statistics={match.statistics || []} homeTeam={match.teams.home} awayTeam={match.teams.away} />
            </div>
          )}

          {activeTab === "lineups" && (
            <div className="animate-in fade-in duration-300">
              <MatchLineups lineups={match.lineups || []} homeTeam={match.teams.home} awayTeam={match.teams.away} events={match.events || []} playerStats={match.players || []} />
            </div>
          )}

          {activeTab === "performance lab" && (
            <div className="animate-in fade-in duration-300">
              <MatchPerformanceLab playerStats={match.players || []} matchStatus={match.fixture.status.short} />
            </div>
          )}

        </main>
      </div>
    </>
  );
}
