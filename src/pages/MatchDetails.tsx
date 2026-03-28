import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LiveBadge } from "@/components/LiveBadge";
import { SportIcon, getSportGradient } from "@/components/SportIcon";
import { TeamLogo } from "@/components/TeamLogo";
import { matches, players } from "@/data/mockData";
import { useCricketMatchDetails, useCricketMatchSquads } from "@/hooks/useCricketMatches";
import { useCricketDataMatch } from "@/hooks/useCricketDataMatch";
import { useMatchFieldData } from "@/hooks/useMatchFieldData";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  BarChart3,
  Trophy,
  Heart,
  Share2,
  Loader2,
  Flag,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Hand,
  Info,
  ListOrdered,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadsList } from "@/components/SquadsList";
import type { Match } from "@/data/types";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreMatchForecast } from '@/components/PreMatchForecast';
import { favoritesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const MatchPerformanceLab = lazy(() => import("@/components/MatchPerformanceLab"));
const CricketPerformanceLab = lazy(() => import("@/components/CricketPerformanceLab"));

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const checkFav = async () => {
      if (id) {
        try {
          const response = await favoritesApi.check(id) as any;
          if (response.success) {
            setIsFavorite(response.data.isFavorited);
            setFavoriteId(response.data.favoriteId);
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };
    checkFav();
  }, [id]);

  // Check if this is a cricket match
  const isCricketMatch = id?.includes("cricket") || id?.startsWith("c") || (id && id.includes("-") && id.length > 20);

  // New Hook for CricketData.org
  // Assuming 'isOpen' is true since we are on the page. In a modal context, this would be passed as a prop.
  // For this page component, we always want to fetch when mounted.
  const {
    data: cricketDataMatch,
    loading: cricketDataLoading
  } = useCricketDataMatch(id, true);

  // For legacy/mock cricket matches or other sources
  const {
    data: legacyCricketMatch,
    isLoading: legacyLoading
  } = useCricketMatchDetails(isCricketMatch ? id?.replace("cricket-", "") : undefined);

  // Find mock match for other sports
  const mockMatch = matches.find((m) => m.id === id);

  // Priority: CricketData.org > Legacy API > Mock
  const match: Match | undefined = cricketDataMatch || legacyCricketMatch || mockMatch;
  const isTestMatch = match?.matchType?.toLowerCase().includes("test");

  const statusLower = match?.status?.toLowerCase();
  const isLive = statusLower === "live";
  const isCompleted = statusLower === "completed";
  const isUpcoming = statusLower === "upcoming";

  // Lazy-loading field data with 10-min TTL cache
  // IMPORTANT: These hooks MUST be called before any early returns
  const matchInfoField = useMatchFieldData(
    match?.sport === 'cricket' ? match.id : undefined,
    'matchInfo',
    activeTab === 'summary' || activeTab === 'scoreboard' || activeTab === 'lineups'
  );
  const commentaryField = useMatchFieldData(
    match?.sport === 'cricket' ? match.id : undefined,
    'commentary',
    activeTab === 'commentary'
  );

  // Cricbuzz lazy-loading hooks — only fetch when tab active
  const cleanMatchId = match?.sport === 'cricket' ? match.id?.replace('cricket-', '') : undefined;
  const cbScorecardField = useMatchFieldData(
    cleanMatchId,
    'cbScorecard',
    activeTab === 'scoreboard' || activeTab === 'performance'
  );
  const cbSquadsField = useMatchFieldData(
    cleanMatchId,
    'cbSquads',
    activeTab === 'lineups'
  );
  const cbCommentaryField = useMatchFieldData(
    cleanMatchId,
    'cbCommentary',
    activeTab === 'commentary'
  );

  // Extract raw API data from the field hook
  const rawApiData = matchInfoField.data;

  // Loading state for cricket API matches
  if (id?.startsWith("cricket-") && (cricketDataLoading || legacyLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match Not Found</h1>
          <p className="text-muted-foreground mb-8">The match you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>{`${match.homeTeam?.name || "Team 1"} vs ${match.awayTeam?.name || "Team 2"} - ${match.matchType} | SportBuzz`}</title>
        <meta
          name="description"
          content={`Live score and updates for ${match.homeTeam?.name || "Team 1"} vs ${match.awayTeam?.name || "Team 2"} - ${match.matchType} at ${typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Back Button */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        {/* Match Header */}
        <section className={cn(
          "relative overflow-hidden py-8 md:py-12",
          "bg-gradient-to-br",
          getSportGradient(match.sport)
        )}>
          <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />

          <div className="relative container mx-auto px-4">
            {/* Match Type & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <SportIcon sport={match.sport} size={24} />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {match.matchType}
                </span>
                {/* Match state indicator - status-aware */}
                {match.sport === 'cricket' && isLive && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse-live">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                    </span>
                    Live Data
                  </span>
                )}
                {match.sport === 'cricket' && isCompleted && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    Completed Match
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isLive && <LiveBadge />}
                {isCompleted && (
                  <span className="px-3 py-1 bg-completed/20 text-completed rounded-full text-sm font-medium">
                    Completed
                  </span>
                )}
                {match.status === "upcoming" && (
                  <span className="px-3 py-1 bg-upcoming/20 text-upcoming rounded-full text-sm font-medium">
                    Upcoming
                  </span>
                )}
              </div>
            </div>

            {/* Teams & Score */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 items-center">
              {/* Home Team */}
              <div className="text-center space-y-3">
                <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="lg" className="mx-auto" />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground">{match.homeTeam?.name || "Team 1"}</h2>
                  <p className="text-sm text-muted-foreground">{match.homeTeam?.shortName}</p>
                </div>
              </div>

              {/* Score & Details Column */}
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-4 md:gap-8">
                    {isTestMatch && match.scoreBreakdown ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-1">1st Inn</span>
                            <span className="text-3xl md:text-5xl font-bold font-mono score-text">{match.scoreBreakdown.home.inn1 || "—"}</span>
                          </div>
                          <span className="text-2xl text-muted-foreground mt-4">:</span>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-1">1st Inn</span>
                            <span className="text-3xl md:text-5xl font-bold font-mono score-text">{match.scoreBreakdown.away.inn1 || "—"}</span>
                          </div>
                        </div>
                        {(match.scoreBreakdown.home.inn2 || match.scoreBreakdown.away.inn2) && (
                          <div className="flex items-center gap-4 md:gap-6 opacity-80 scale-90">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-1">2nd Inn</span>
                              <span className="text-2xl md:text-4xl font-bold font-mono score-text">{match.scoreBreakdown.home.inn2 || "—"}</span>
                            </div>
                            <span className="text-xl text-muted-foreground mt-4">:</span>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-1">2nd Inn</span>
                              <span className="text-2xl md:text-4xl font-bold font-mono score-text">{match.scoreBreakdown.away.inn2 || "—"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isTestMatch && match.inningsScores && match.inningsScores.length > 0 ? (
                      /* Test match fallback using inningsScores array */
                      <div className="flex items-start justify-center gap-6 md:gap-10">
                        {/* Home innings column */}
                        <div className="flex flex-col items-center gap-2">
                          {match.inningsScores.filter(i => i.team === 'home').map((inn, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-0.5">
                                {inn.inning === '1' ? '1st' : inn.inning === '2' ? '2nd' : `${inn.inning}th`} Inn
                              </span>
                              <span className={cn(
                                "font-bold font-mono score-text",
                                idx === 0 ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl opacity-80"
                              )}>
                                {inn.score || "—"}
                              </span>
                              {inn.overs && (
                                <span className="text-[11px] text-muted-foreground font-mono mt-0.5">({inn.overs} ov)</span>
                              )}
                            </div>
                          ))}
                          {match.inningsScores.filter(i => i.team === 'home').length === 0 && (
                            <span className="text-3xl md:text-5xl font-bold font-mono score-text text-muted-foreground">—</span>
                          )}
                        </div>
                        <span className="text-2xl text-muted-foreground mt-6">vs</span>
                        {/* Away innings column */}
                        <div className="flex flex-col items-center gap-2">
                          {match.inningsScores.filter(i => i.team === 'away').map((inn, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <span className="text-[10px] uppercase text-muted-foreground/70 font-bold mb-0.5">
                                {inn.inning === '1' ? '1st' : inn.inning === '2' ? '2nd' : `${inn.inning}th`} Inn
                              </span>
                              <span className={cn(
                                "font-bold font-mono score-text",
                                idx === 0 ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl opacity-80"
                              )}>
                                {inn.score || "—"}
                              </span>
                              {inn.overs && (
                                <span className="text-[11px] text-muted-foreground font-mono mt-0.5">({inn.overs} ov)</span>
                              )}
                            </div>
                          ))}
                          {match.inningsScores.filter(i => i.team === 'away').length === 0 && (
                            <span className="text-3xl md:text-5xl font-bold font-mono score-text text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ODI / T20 / Single Innings — parse score + overs */
                      (() => {
                        const parseScore = (raw: string | undefined) => {
                          if (!raw) return { runs: "—", overs: "" };
                          const m = raw.match(/^([\d\/]+(?:\s*\(d\))?)\s*\((.+?)\)\s*$/);
                          if (m) return { runs: m[1].trim(), overs: m[2].trim() };
                          return { runs: raw, overs: "" };
                        };
                        const home = parseScore(match.homeScore);
                        const away = parseScore(match.awayScore);
                        return (
                          <>
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "text-4xl md:text-5xl font-bold font-mono score-text leading-none",
                                isLive && "animate-score-update"
                              )}>
                                {home.runs}
                              </span>
                              {home.overs && (
                                <span className="text-sm md:text-base text-muted-foreground font-mono mt-1">
                                  ({home.overs})
                                </span>
                              )}
                            </div>
                            <span className="text-2xl text-muted-foreground self-center">:</span>
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "text-4xl md:text-5xl font-bold font-mono score-text leading-none",
                                isLive && "animate-score-update"
                              )}>
                                {away.runs}
                              </span>
                              {away.overs && (
                                <span className="text-sm md:text-base text-muted-foreground font-mono mt-1">
                                  ({away.overs})
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>

                  {/* Real-time status badge below score for Cricket */}
                  {match.sport === 'cricket' && match.summaryText && (
                    <div className="mt-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                      <p className="text-xs md:text-sm font-semibold text-primary text-center">
                        {match.summaryText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Info (Overs etc) */}
                {isLive && (
                  <div className="text-sm font-mono text-muted-foreground bg-secondary/30 px-3 py-1 rounded-md inline-block">
                    {match.sport === "cricket" && match.currentOver && `Over ${match.currentOver}`}
                    {match.sport === "football" && match.currentMinute}
                    {match.sport === "basketball" && `${match.currentQuarter} - ${match.timeRemaining}`}
                    {match.sport === "tennis" && match.currentSet}
                    {!match.currentOver && !match.currentMinute && "In Progress"}
                  </div>
                )}

                {/* Football Goal Details */}
                {match.sport === "football" && match.goals && match.goals.length > 0 && (
                  <div className="mt-4 space-y-1 md:min-w-[300px]">
                    {match.goals.map((goal, idx) => {
                      const isHome = goal.teamId === match.homeTeam.id;
                      return (
                        <div key={idx} className={cn("flex items-center text-xs md:text-sm gap-2", isHome ? "justify-start text-left" : "justify-end text-right")}>
                          {isHome ? (
                            <>
                              <span className="text-green-400">⚽</span>
                              <span className="font-mono text-muted-foreground opacity-75">{goal.minute}'</span>
                              <span className="font-medium text-foreground">{goal.player}</span>
                              {goal.assist && <span className="text-muted-foreground hidden md:inline">({goal.assist})</span>}
                            </>
                          ) : (
                            <>
                              {goal.assist && <span className="text-muted-foreground hidden md:inline">({goal.assist})</span>}
                              <span className="font-medium text-foreground">{goal.player}</span>
                              <span className="font-mono text-muted-foreground opacity-75">{goal.minute}'</span>
                              <span className="text-green-400">⚽</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center space-y-3">
                <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="lg" className="mx-auto" />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground">{match.awayTeam?.name || "Team 2"}</h2>
                  <p className="text-sm text-muted-foreground">{match.awayTeam?.shortName}</p>
                </div>
              </div>
            </div>

            {/* Match Info Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} />
                <span>{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}{(typeof match.venue === 'object' && match.venue?.city) && `, ${match.venue.city}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={16} />
                <span>
                  {match.displayTime && match.sport === 'cricket'
                    ? match.displayTime // "08 Feb 2024, 05:30 AM"
                    : format(match.startTime, "EEEE, MMM d, yyyy • h:mm a")
                  }
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={async () => {
                  if (!match) return;
                  try {
                    if (isFavorite && favoriteId) {
                      await favoritesApi.remove(favoriteId);
                      setIsFavorite(false);
                      setFavoriteId(null);
                      toast({ title: "Removed", description: "Match removed from favorites" });
                    } else {
                      const response = await favoritesApi.add({
                        matchId: match.id,
                        sport: match.sport,
                        teams: {
                          team1: match.homeTeam.name,
                          team2: match.awayTeam.name
                        },
                        date: match.startTime.toISOString(),
                        venue: match.venue.name,
                        status: match.status
                      });
                      setIsFavorite(true);
                      setFavoriteId(response.data._id);
                      toast({ title: "Added", description: "Match added to favorites" });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Authentication required or server error",
                      variant: "destructive"
                    });
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  isFavorite
                    ? "bg-red-500/20 text-red-500"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </section>

        {/* Match Content Tabs */}
        <section className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-lg overflow-x-auto">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <BarChart3 size={16} />
                Summary
              </TabsTrigger>
              <TabsTrigger value="lineups" className="flex items-center gap-2">
                <Users size={16} />
                Lineups
              </TabsTrigger>
              <TabsTrigger value="scoreboard" className="flex items-center gap-2">
                <ListOrdered size={16} />
                {match?.sport === 'football' ? 'Stats' : 'Scoreboard'}
              </TabsTrigger>

              <TabsTrigger value="commentary" className="flex items-center gap-2">
                <MessageSquare size={16} />
                Commentary
              </TabsTrigger>
              {(match?.sport === 'football' || match?.sport === 'cricket') && (
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <Activity size={16} />
                  Performance Lab
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="summary" className="space-y-6 animate-fade-in">
              {/* Loading state for API data */}
              {match.sport === 'cricket' && matchInfoField.loading && (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Upcoming match placeholder */}
              {isUpcoming && (
                <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                  <div className="text-center space-y-3 pb-4 mb-4 border-b border-border/50">
                    <Clock className="mx-auto h-10 w-10 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">Match not started yet. See the forecast below.</p>
                  </div>
                  <PreMatchForecast match={match} />
                </div>
              )}

              {/* Match Status & Result (Live + Completed) */}
              {!isUpcoming && match.summaryText && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{isCompleted ? 'Match Result' : 'Match Status'}</h3>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-lg font-bold text-foreground leading-relaxed text-center italic">
                      "{match.summaryText}"
                    </p>
                  </div>
                </div>
              )}

              {/* Match Details Card */}
              {!isUpcoming && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Match Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Match Type</span>
                      <span className="text-foreground font-medium">{match.matchType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="text-foreground font-medium">{match.venue.name}{match.venue.city && `, ${match.venue.city}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date & Time</span>
                      <span className="text-foreground font-medium">
                        {match.displayTime && match.sport === 'cricket'
                          ? match.displayTime
                          : format(match.startTime, "MMM d, yyyy • h:mm a")}
                      </span>
                    </div>
                    {/* Toss result from API */}
                    {(match.tossResult || rawApiData?.tossWinner) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Toss</span>
                        <span className="text-foreground font-medium">
                          {match.tossResult || `${rawApiData.tossWinner} chose to ${rawApiData.tossChoice}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={cn(
                        "font-medium",
                        isLive ? "text-green-500" : "text-foreground"
                      )}>
                        {isLive ? 'In Progress' : isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    {match.referee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Umpire / Referee</span>
                        <span className="text-foreground font-medium">{match.referee}</span>
                      </div>
                    )}
                    {match.manOfTheMatch && (
                      <div className="pt-2 mt-2 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Man of the Match</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">MOM</span>
                            <span className="text-foreground font-medium">{match.manOfTheMatch.name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming: minimal info card */}
              {isUpcoming && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Match Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Match Type</span>
                      <span className="text-foreground font-medium">{match.matchType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="text-foreground font-medium">{match.venue.name}{match.venue.city && `, ${match.venue.city}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date & Time</span>
                      <span className="text-foreground font-medium">
                        {match.displayTime && match.sport === 'cricket'
                          ? match.displayTime
                          : format(match.startTime, "MMM d, yyyy • h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teams</span>
                      <span className="text-foreground font-medium">{match.homeTeam.name} vs {match.awayTeam.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lineups" className="space-y-6 animate-fade-in">
              {(cbSquadsField.loading || matchInfoField.loading) ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              ) : cbSquadsField.data?.teams && cbSquadsField.data.teams.length > 0 ? (
                /* ── Cricbuzz Squads (from Scorecard data) ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cbSquadsField.data.teams.map((team: any, tIdx: number) => (
                    <div key={tIdx} className="bg-card border border-border rounded-xl p-6 space-y-4">
                      <h4 className="font-semibold text-foreground text-lg flex items-center gap-2">
                        <Users size={18} className="text-primary" />
                        {team.teamName}
                        {team.shortName && <span className="text-xs text-muted-foreground">({team.shortName})</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Playing XI</p>
                      <div className="space-y-1">
                        {team.players.map((p: any, pIdx: number) => (
                          <div key={pIdx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/20 transition-colors">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {pIdx + 1}
                              </span>
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {p.isCaptain && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">C</span>}
                              {p.isKeeper && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">WK</span>}
                              <span className="text-xs text-muted-foreground ml-1">{p.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── Fallback to existing SquadsList ── */
                <SquadsList match={match} matchData={rawApiData} isLoading={matchInfoField.loading} />
              )}
            </TabsContent>

            <TabsContent value="scoreboard" className="animate-fade-in">
              {match?.sport === 'football' ? (
                /* ── Football Match Stats ── */
                <div className="space-y-6">
                  {(() => {
                    const homeTeamName = match?.homeTeam?.shortName || 'Home';
                    const awayTeamName = match?.awayTeam?.shortName || 'Away';

                    const footballStatCategories = [
                      {
                        category: '⚽ General',
                        stats: [
                          { label: 'Possession (%)', home: 58, away: 42, unit: '%' },
                          { label: 'Total Shots', home: 16, away: 11 },
                          { label: 'Shots on Target', home: 7, away: 4 },
                          { label: 'Shots off Target', home: 6, away: 5 },
                          { label: 'Blocked Shots', home: 3, away: 2 },
                          { label: 'Corners', home: 8, away: 4 },
                          { label: 'Offsides', home: 3, away: 2 },
                          { label: 'Pass Accuracy (%)', home: 87, away: 79, unit: '%' },
                          { label: 'Total Passes', home: 542, away: 398 },
                        ],
                      },
                      {
                        category: '🎯 Attacking',
                        stats: [
                          { label: 'Goals', home: parseInt(match?.homeScore || '0'), away: parseInt(match?.awayScore || '0') },
                          { label: 'Expected Goals (xG)', home: 2.1, away: 1.3 },
                          { label: 'Big Chances Created', home: 4, away: 2 },
                          { label: 'Big Chances Missed', home: 2, away: 1 },
                          { label: 'Touches in Box', home: 32, away: 21 },
                          { label: 'Dribbles Attempted', home: 14, away: 9 },
                          { label: 'Dribbles Succeeded', home: 9, away: 5 },
                          { label: 'Crosses', home: 18, away: 12 },
                          { label: 'Cross Accuracy (%)', home: 33, away: 25, unit: '%' },
                          { label: 'Long Balls', home: 38, away: 45 },
                        ],
                      },
                      {
                        category: '🛡️ Defending',
                        stats: [
                          { label: 'Tackles', home: 18, away: 23 },
                          { label: 'Tackles Won', home: 13, away: 16 },
                          { label: 'Interceptions', home: 11, away: 14 },
                          { label: 'Clearances', home: 15, away: 28 },
                          { label: 'Blocked Shots', home: 3, away: 5 },
                          { label: 'Aerial Duels Won', home: 12, away: 15 },
                          { label: 'Ground Duels Won', home: 48, away: 39 },
                          { label: 'Recovery', home: 42, away: 38 },
                        ],
                      },
                      {
                        category: '🧤 Goalkeeping',
                        stats: [
                          { label: 'Saves', home: 3, away: 5 },
                          { label: 'Punches', home: 1, away: 2 },
                          { label: 'Goal Kicks', home: 7, away: 12 },
                          { label: 'Catches', home: 4, away: 3 },
                          { label: 'Sweeper Actions', home: 2, away: 1 },
                          { label: 'Throws', home: 6, away: 8 },
                          { label: 'High Claims', home: 2, away: 3 },
                        ],
                      },
                      {
                        category: '📋 Discipline',
                        stats: [
                          { label: 'Fouls Committed', home: 12, away: 15 },
                          { label: 'Fouls Won', home: 15, away: 12 },
                          { label: 'Yellow Cards', home: 2, away: 3 },
                          { label: 'Red Cards', home: 0, away: 0 },
                          { label: 'Free Kicks', home: 15, away: 12 },
                          { label: 'Throw-ins', home: 22, away: 18 },
                        ],
                      },
                    ];

                    return footballStatCategories.map((cat, catIdx) => (
                      <div key={catIdx} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="bg-secondary/30 px-6 py-3 border-b border-border">
                          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{cat.category}</h3>
                        </div>
                        <div className="px-6 py-2">
                          {/* Team header row */}
                          <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <span className="text-sm font-bold text-primary w-16 text-left">{homeTeamName}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Stat</span>
                            <span className="text-sm font-bold text-football w-16 text-right">{awayTeamName}</span>
                          </div>
                          {cat.stats.map((stat, sIdx) => {
                            const maxVal = Math.max(stat.home, stat.away, 1);
                            const homeWidth = (stat.home / maxVal) * 100;
                            const awayWidth = (stat.away / maxVal) * 100;
                            const homeHigher = stat.home > stat.away;
                            const awayHigher = stat.away > stat.home;
                            return (
                              <div key={sIdx} className="py-2.5 border-b border-border/20 last:border-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={cn(
                                    "text-sm font-mono w-16 text-left",
                                    homeHigher ? "font-bold text-foreground" : "text-muted-foreground"
                                  )}>
                                    {stat.home}{stat.unit || ''}
                                  </span>
                                  <span className="text-xs text-muted-foreground text-center flex-1">{stat.label}</span>
                                  <span className={cn(
                                    "text-sm font-mono w-16 text-right",
                                    awayHigher ? "font-bold text-foreground" : "text-muted-foreground"
                                  )}>
                                    {stat.away}{stat.unit || ''}
                                  </span>
                                </div>
                                {/* Comparison bars */}
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 flex justify-end">
                                    <div
                                      className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        homeHigher ? "bg-primary" : "bg-primary/30"
                                      )}
                                      style={{ width: `${homeWidth}%` }}
                                    />
                                  </div>
                                  <div className="w-1" />
                                  <div className="flex-1">
                                    <div
                                      className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        awayHigher ? "bg-football" : "bg-football/30"
                                      )}
                                      style={{ width: `${awayWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                /* ── Cricket / Other Sports Scoreboard ── */
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  <h3 className="font-semibold text-foreground">Scoreboard</h3>

                  {isUpcoming ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListOrdered className="mx-auto h-12 w-12 mb-3 opacity-10" />
                      <p>Match not started yet — scoreboard will be available once play begins.</p>
                    </div>
                  ) : (cbScorecardField.loading || matchInfoField.loading) ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : cbScorecardField.data?.innings && cbScorecardField.data.innings.length > 0 ? (
                    /* ── Cricbuzz Detailed Scorecard ── */
                    <div className="space-y-8">
                      {cbScorecardField.data.status && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <Trophy size={16} className="text-primary" />
                          <span className="font-medium text-foreground">{cbScorecardField.data.status}</span>
                        </div>
                      )}

                      {cbScorecardField.data.innings.map((inn: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <h4 className="font-semibold text-foreground uppercase tracking-wider">
                              {inn.teamName || `Innings ${idx + 1}`}
                              {inn.isDeclared && <span className="text-xs text-muted-foreground ml-2">(d)</span>}
                            </h4>
                            <span className="text-sm font-mono font-bold text-primary">
                              {inn.score}/{inn.wickets} ({inn.overs} ov)
                            </span>
                          </div>

                          {/* Batting Table */}
                          <div className="overflow-x-auto bg-secondary/10 rounded-lg border border-border/50">
                            <table className="w-full text-sm">
                              <thead className="bg-secondary/30 text-muted-foreground text-xs uppercase">
                                <tr>
                                  <th className="py-2 px-3 text-left">Batter</th>
                                  <th className="py-2 px-2 text-right">R</th>
                                  <th className="py-2 px-2 text-right">B</th>
                                  <th className="py-2 px-2 text-right">4s</th>
                                  <th className="py-2 px-2 text-right">6s</th>
                                  <th className="py-2 px-2 text-right">SR</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {inn.batsmen?.map((b: any, bIdx: number) => (
                                  <tr key={bIdx} className="hover:bg-secondary/20">
                                    <td className="py-2 px-3 font-medium">
                                      <span className="flex items-center gap-1">
                                        {b.name}
                                        {b.isCaptain && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-bold">C</span>}
                                        {b.isKeeper && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded font-bold">WK</span>}
                                      </span>
                                      {b.dismissal && <span className="block text-xs text-muted-foreground font-normal">{b.dismissal}</span>}
                                    </td>
                                    <td className="py-2 px-2 text-right font-bold text-foreground">{b.runs}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.balls}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.fours}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.sixes}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.strikeRate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Extras */}
                          {inn.extras && (
                            <div className="text-xs text-muted-foreground px-3 py-2 bg-secondary/10 rounded-lg">
                              <span className="font-medium text-foreground">Extras: </span>
                              {inn.extras.total ?? 0} (b {inn.extras.byes ?? 0}, lb {inn.extras.legbyes ?? 0}, w {inn.extras.wides ?? 0}, nb {inn.extras.noballs ?? 0})
                            </div>
                          )}

                          {/* Bowling Table */}
                          <div className="overflow-x-auto bg-secondary/10 rounded-lg border border-border/50">
                            <table className="w-full text-sm">
                              <thead className="bg-secondary/30 text-muted-foreground text-xs uppercase">
                                <tr>
                                  <th className="py-2 px-3 text-left">Bowler</th>
                                  <th className="py-2 px-2 text-right">O</th>
                                  <th className="py-2 px-2 text-right">M</th>
                                  <th className="py-2 px-2 text-right">R</th>
                                  <th className="py-2 px-2 text-right">W</th>
                                  <th className="py-2 px-2 text-right">Eco</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30">
                                {inn.bowlers?.map((b: any, bIdx: number) => (
                                  <tr key={bIdx} className="hover:bg-secondary/20">
                                    <td className="py-2 px-3 font-medium">
                                      <span className="flex items-center gap-1">
                                        {b.name}
                                        {b.isCaptain && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-bold">C</span>}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.overs}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.maidens}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.runs}</td>
                                    <td className="py-2 px-2 text-right font-bold text-primary">{b.wickets}</td>
                                    <td className="py-2 px-2 text-right text-muted-foreground">{b.economy}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Fall of Wickets */}
                          {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                            <div className="text-xs text-muted-foreground px-3 py-2 bg-secondary/10 rounded-lg">
                              <span className="font-medium text-foreground">Fall of Wickets: </span>
                              {inn.fallOfWickets.map((f: any, fIdx: number) => (
                                <span key={fIdx}>
                                  {f.score}/{f.wicketNum} ({f.batsmanName}, {f.overs} ov)
                                  {fIdx < inn.fallOfWickets.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : rawApiData?.score && Array.isArray(rawApiData.score) && rawApiData.score.length > 0 ? (
                    /* ── CricketData.org Summary Fallback ── */
                    <div className="space-y-6">
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm flex items-center gap-2">
                        <Info size={16} className="text-amber-500" />
                        <span className="text-muted-foreground">Detailed stats not available. Showing summary.</span>
                      </div>
                      {rawApiData.score.map((inn: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                            {inn.inning || `Innings ${idx + 1}`}
                          </h4>
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b border-border/30">
                                <td className="py-2 pr-4 text-foreground">Score</td>
                                <td className="py-2 px-2 text-center font-mono font-bold text-primary">{inn.r}/{inn.w}</td>
                              </tr>
                              <tr className="border-b border-border/30">
                                <td className="py-2 pr-4 text-foreground">Overs</td>
                                <td className="py-2 px-2 text-center font-mono">{inn.o}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListOrdered className="mx-auto h-12 w-12 mb-3 opacity-10" />
                      <p>No scoreboard data available for this match.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>



            <TabsContent value="commentary" className="animate-fade-in">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Commentary</h3>
                  {isLive && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Live Updates
                    </div>
                  )}
                </div>

                {isUpcoming ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-10" />
                    <p>Match not started yet — commentary will be available once play begins.</p>
                  </div>
                ) : (cbCommentaryField.loading || commentaryField.loading) ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : cbCommentaryField.data?.commentary && cbCommentaryField.data.commentary.length > 0 ? (
                  /* ── Cricbuzz Highlight Commentary ── */
                  <div className="space-y-3">
                    {cbCommentaryField.data.commentary.map((item: any, idx: number) => {
                      const icon = item.eventType === 'WICKET' ? '🏏' :
                        item.eventType === 'SIX' ? '🔥' :
                          item.eventType === 'FOUR' ? '➖' : '•';
                      return (
                        <div key={idx} className="relative pl-8 pb-2 last:pb-0 border-l border-border/60 last:border-l-0">
                          <div className={cn(
                            "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full",
                            item.eventType === 'WICKET' ? "bg-red-500" :
                              item.eventType === 'SIX' ? "bg-yellow-400" :
                                item.eventType === 'FOUR' ? "bg-blue-400" : "bg-primary/60"
                          )} />
                          <div className="flex items-center gap-2 mb-1">
                            {item.overNum != null && (
                              <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Ov {item.overNum}
                              </span>
                            )}
                            <span className="text-sm">{icon}</span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/50">
                            {item.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : commentaryField.data?.bpiList && commentaryField.data.bpiList.length > 0 ? (
                  /* ── CricketData.org bpiList Fallback ── */
                  <div className="space-y-6">
                    {(() => {
                      const grouped = commentaryField.data.bpiList.reduce((acc: any, item: string) => {
                        const matchResult = item.match(/^(\d+)\./);
                        const over = matchResult ? parseInt(matchResult[1]) + 1 : 'General';
                        if (!acc[over]) acc[over] = [];
                        acc[over].push(item);
                        return acc;
                      }, {});

                      const overs = Object.keys(grouped).sort((a, b) => {
                        if (a === 'General') return 1;
                        if (b === 'General') return -1;
                        return parseInt(b) - parseInt(a);
                      });

                      return overs.map((over) => (
                        <div key={over} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded">
                              {over !== 'General' ? `Over ${over}` : 'Highlights'}
                            </div>
                            <div className="h-px flex-1 bg-border/50"></div>
                          </div>
                          <div className="space-y-2">
                            {grouped[over].map((text: string, tIdx: number) => (
                              <div key={tIdx} className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/90 border border-border/50">
                                {text}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-10" />
                    <p>No commentary available for this match.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            {(match?.sport === 'football' || match?.sport === 'cricket') && (
              <TabsContent value="performance" className="animate-fade-in">
                <Suspense fallback={
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }>
                  {match?.sport === 'cricket' ? (
                    <CricketPerformanceLab
                      scorecardData={cbScorecardField.data}
                      isUpcoming={isUpcoming || false}
                      isLive={isLive || false}
                      loading={cbScorecardField.loading}
                      error={cbScorecardField.error}
                      match={match}
                    />
                  ) : (
                    <MatchPerformanceLab match={match} />
                  )}
                </Suspense>
              </TabsContent>
            )}
          </Tabs>
        </section>
      </div>
    </>
  );
};

export default MatchDetails;
