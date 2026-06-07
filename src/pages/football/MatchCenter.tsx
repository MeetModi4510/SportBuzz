import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { footballApi } from "../../services/football/footballApi";
import { footballApiClient } from "../../services/football/apiClient";
import { cacheManager } from "../../utils/football/cacheManager";
import { Loader2, ArrowLeft } from "lucide-react";
import { FootballMatch } from "../../types/football/index";
import { TeamLogo } from "../../components/TeamLogo";
import { MatchEvents } from "../../components/football/MatchEvents";
import { MatchStatistics } from "../../components/football/MatchStatistics";
import { MatchLineups } from "../../components/football/MatchLineups";

type MatchTab = "overview" | "events" | "statistics" | "lineups" | "standings";

export default function MatchCenter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MatchTab>("overview");

  // Fetch match details. Caching 30 mins.
  const { data: match, isLoading } = useQuery<FootballMatch | null>({
    queryKey: ['football', 'match', id],
    queryFn: async () => {
      if (!id) return null;
      const cacheKey = `match_${id}`;
      const cached = cacheManager.get<FootballMatch>(cacheKey);
      if (cached) return cached;

      const response = await footballApiClient.get('/fixtures', { params: { id } });
      const matchData = response.data.response?.[0];
      if (matchData) {
        cacheManager.set(cacheKey, matchData, 30);
      }
      return matchData || null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000,
  });

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

  const isLive = match.fixture.status.short === "1H" || 
                 match.fixture.status.short === "2H" || 
                 match.fixture.status.short === "HT" || 
                 match.fixture.status.short === "ET" ||
                 match.fixture.status.short === "P";

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
        <div className="relative pt-6 pb-12 overflow-hidden border-b border-border/20 bg-gradient-to-b from-background to-secondary/5">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group w-max"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="flex flex-col items-center justify-center max-w-4xl mx-auto">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase bg-secondary/40 border border-border/40 px-5 py-2 rounded-full mb-10 backdrop-blur-md shadow-sm">
                {match.league.name} • {match.fixture.venue.city}
              </span>

              <div className="flex items-stretch justify-center w-full gap-2 md:gap-12">
                
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 w-0">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-background/50 flex items-center justify-center p-4 mb-5 border border-border/30 shadow-2xl backdrop-blur-md hover:scale-105 transition-transform duration-500">
                    <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-full h-full object-contain filter drop-shadow-xl" />
                  </div>
                  <span className="font-extrabold text-lg md:text-3xl text-center leading-tight tracking-tight mb-5">
                    {match.teams.home.name}
                  </span>
                  {homeGoals.length > 0 && (
                    <div className="flex flex-col items-center gap-2 w-full">
                      {homeGoals.map((goal, idx) => (
                        <div key={idx} className="flex items-center justify-center flex-wrap gap-1.5 text-[11px] md:text-sm text-muted-foreground text-center">
                          <span className="font-semibold text-foreground/90">{goal.player.name}</span>
                          <span className="text-primary font-bold">{goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                          {goal.assist.name && <span className="opacity-60 text-[10px] hidden md:inline">({goal.assist.name})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center justify-start pt-4 md:pt-8 px-2 md:px-6">
                  <div className="text-5xl md:text-8xl font-black tracking-tighter flex items-center gap-3 md:gap-6 drop-shadow-2xl font-display">
                    <span className={match.goals.home !== null && match.goals.away !== null && match.goals.home > match.goals.away ? "text-primary" : "text-foreground"}>
                      {match.goals.home ?? '-'}
                    </span>
                    <span className="text-muted-foreground/20 font-light text-4xl md:text-7xl pb-2">:</span>
                    <span className={match.goals.home !== null && match.goals.away !== null && match.goals.away > match.goals.home ? "text-primary" : "text-foreground"}>
                      {match.goals.away ?? '-'}
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2 bg-background/60 px-4 py-1.5 rounded-md backdrop-blur-md border border-border/40 shadow-sm">
                    {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                    <span className={`font-bold tracking-[0.15em] uppercase text-[10px] md:text-xs ${isLive ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {isLive ? `${match.fixture.status.elapsed}'` : match.fixture.status.long}
                    </span>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 w-0">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-background/50 flex items-center justify-center p-4 mb-5 border border-border/30 shadow-2xl backdrop-blur-md hover:scale-105 transition-transform duration-500">
                    <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-full h-full object-contain filter drop-shadow-xl" />
                  </div>
                  <span className="font-extrabold text-lg md:text-3xl text-center leading-tight tracking-tight mb-5">
                    {match.teams.away.name}
                  </span>
                  {awayGoals.length > 0 && (
                    <div className="flex flex-col items-center gap-2 w-full">
                      {awayGoals.map((goal, idx) => (
                        <div key={idx} className="flex items-center justify-center flex-wrap gap-1.5 text-[11px] md:text-sm text-muted-foreground text-center">
                          <span className="font-semibold text-foreground/90">{goal.player.name}</span>
                          <span className="text-primary font-bold">{goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                          {goal.assist.name && <span className="opacity-60 text-[10px] hidden md:inline">({goal.assist.name})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 mt-8">
          {/* Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-border/40 pb-2">
            {(["overview", "events", "statistics", "lineups", "standings"] as MatchTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-t-lg text-sm font-semibold capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content - Lazy Loading Data strategy applied implicitly by conditional rendering */}
          {activeTab === "overview" && (
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
                   <div className="flex justify-between pb-2">
                     <span className="text-muted-foreground">Referee</span>
                     <span className="font-medium">{match.fixture.referee || "N/A"}</span>
                   </div>
                 </div>
              </div>
            </div>
          )}

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
              <MatchLineups lineups={match.lineups || []} homeTeam={match.teams.home} awayTeam={match.teams.away} events={match.events || []} />
            </div>
          )}

        </main>
      </div>
    </>
  );
}
