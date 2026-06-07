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
        <div className="relative pt-8 pb-12 border-b border-border/20 bg-background">
          <div className="container mx-auto px-4 relative z-10">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group w-max"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            {/* League Pill */}
            <div className="flex justify-center mb-8">
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase bg-secondary/30 border border-border/40 px-6 py-2 rounded-full backdrop-blur-sm">
                {match.league.name} {match.fixture.venue.city ? `• ${match.fixture.venue.city}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-center max-w-4xl mx-auto gap-4 md:gap-12">
              
              {/* Home Team */}
              <div className="flex flex-col items-center flex-1 w-0">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-secondary/20 flex items-center justify-center p-3 mb-4 border border-border/30 shadow-md">
                  <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-full h-full object-contain filter drop-shadow-lg" />
                </div>
                <span className="font-bold text-lg md:text-2xl text-center leading-tight tracking-tight text-foreground/90">
                  {match.teams.home.name}
                </span>
              </div>

              {/* Score / Status */}
              <div className="flex flex-col items-center justify-center shrink-0 w-32 md:w-48">
                <div className="text-5xl md:text-7xl font-black tracking-tighter flex items-center justify-center gap-3 tabular-nums drop-shadow-md">
                  <span className={match.goals.home !== null && match.goals.away !== null && match.goals.home > match.goals.away ? "text-foreground" : "text-foreground/80"}>
                    {match.goals.home ?? '-'}
                  </span>
                  <span className="text-muted-foreground/30 font-light text-4xl md:text-6xl pb-2">-</span>
                  <span className={match.goals.home !== null && match.goals.away !== null && match.goals.away > match.goals.home ? "text-foreground" : "text-foreground/80"}>
                    {match.goals.away ?? '-'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 bg-secondary/40 px-4 py-1 rounded-md border border-border/40 backdrop-blur-sm">
                  {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                  <span className={`font-bold tracking-[0.1em] uppercase text-[10px] md:text-xs ${isLive ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {isLive ? `${match.fixture.status.elapsed}'` : match.fixture.status.short}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center flex-1 w-0">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-secondary/20 flex items-center justify-center p-3 mb-4 border border-border/30 shadow-md">
                  <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-full h-full object-contain filter drop-shadow-lg" />
                </div>
                <span className="font-bold text-lg md:text-2xl text-center leading-tight tracking-tight text-foreground/90">
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
                          <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" stroke="currentColor"/>
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
                          <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" stroke="currentColor"/>
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
