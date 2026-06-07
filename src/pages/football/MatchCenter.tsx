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
        <div className="bg-secondary/20 border-b border-border/40 pb-6 pt-4">
          <div className="container mx-auto px-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase bg-secondary px-3 py-1 rounded-full">
                {match.league.name}
              </span>

              <div className="flex items-center justify-center gap-8 md:gap-16 mt-4 w-full max-w-2xl">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-3 flex-1">
                  <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-20 h-20 md:w-24 md:h-24 shadow-md" />
                  <span className="font-bold text-lg md:text-xl text-center leading-tight">
                    {match.teams.home.name}
                  </span>
                  {homeGoals.length > 0 && (
                    <div className="flex flex-col items-center text-xs text-muted-foreground mt-1 space-y-1">
                      {homeGoals.map((goal, idx) => (
                        <div key={idx} className="flex flex-wrap justify-center items-center gap-1 text-center">
                          <span className="font-medium text-foreground/80">{goal.player.name} {goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                          {goal.assist.name && <span className="text-[10px] opacity-70">({goal.assist.name})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums font-display">
                    {match.goals.home ?? '-'}<span className="text-muted-foreground/30 mx-2">:</span>{match.goals.away ?? '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    <span className={`font-semibold tracking-wide uppercase text-sm ${isLive ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {isLive ? `${match.fixture.status.elapsed}'` : match.fixture.status.long}
                    </span>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-3 flex-1">
                  <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-20 h-20 md:w-24 md:h-24 shadow-md" />
                  <span className="font-bold text-lg md:text-xl text-center leading-tight">
                    {match.teams.away.name}
                  </span>
                  {awayGoals.length > 0 && (
                    <div className="flex flex-col items-center text-xs text-muted-foreground mt-1 space-y-1">
                      {awayGoals.map((goal, idx) => (
                        <div key={idx} className="flex flex-wrap justify-center items-center gap-1 text-center">
                          <span className="font-medium text-foreground/80">{goal.player.name} {goal.time.elapsed}'{goal.time.extra ? `+${goal.time.extra}` : ''}</span>
                          {goal.assist.name && <span className="text-[10px] opacity-70">({goal.assist.name})</span>}
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
              <MatchLineups lineups={match.lineups || []} homeTeam={match.teams.home} awayTeam={match.teams.away} />
            </div>
          )}

        </main>
      </div>
    </>
  );
}
