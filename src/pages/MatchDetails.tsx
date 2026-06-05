import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LiveBadge } from "@/components/LiveBadge";
import { SportIcon, getSportGradient } from "@/components/SportIcon";
import { TeamLogo } from "@/components/TeamLogo";
import { matches, players } from "@/data/mockData";
import { useCricketMatchDetails, useCricketMatchSquads } from "@/hooks/useCricketMatches";
import { useCricketDataMatch } from "@/hooks/useCricketDataMatch";
import { useFootballMatchDetail } from "@/hooks/useFootballMatches";
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
  Activity,
  Footprints
} from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadsList } from "@/components/SquadsList";
import { FootballPitchLineup } from "@/components/FootballPitchLineup";
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

  const summarizePlayerEvents = (playerName: string, events: any[], teamGoalsConceded: number = 0) => {
      const playerEvents = {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          fouls: 0,
          shotsOnTarget: 0,
          corners: 0,
          teamGoalsConceded,
          substitution: undefined as { inMinute?: number; outMinute?: number; isInjured?: boolean } | undefined
      };

      events?.forEach(event => {
          if (event.player === playerName) {
              if (event.type === 'Goal') playerEvents.goals++;
              if (event.type === 'YellowCard') playerEvents.yellowCards++;
              if (event.type === 'RedCard') playerEvents.redCards++;
              if (event.type === 'Save') playerEvents.saves++;
              if (event.type === 'Foul') playerEvents.fouls++;
              if (event.type === 'ShotOnTarget') playerEvents.shotsOnTarget++;
              if (event.type === 'Corner') playerEvents.corners++;
          }
          if (event.type === 'Goal' && event.assister === playerName) playerEvents.assists++;
          if (event.type === 'Substitution') {
              if (event.player === playerName) {
                  playerEvents.substitution = { ...playerEvents.substitution, inMinute: event.minute };
              } else if (event.playerOut === playerName) {
                  playerEvents.substitution = { ...playerEvents.substitution, outMinute: event.minute, isInjured: event.commentary?.toLowerCase().includes('injur') };
              }
          }
      });

      return playerEvents;
  };  useEffect(() => {
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

  // Check match type
  const isCricketMatch = id?.includes("cricket") || id?.startsWith("c") || (id && id.includes("-") && id.length > 20);
  const isFootballMatch = id?.startsWith("football-");

  // ── Cricket Hooks ──
  const {
    data: cricketDataMatch,
    loading: cricketDataLoading
  } = useCricketDataMatch(id, true);

  const {
    data: legacyCricketMatch,
    isLoading: legacyLoading
  } = useCricketMatchDetails(isCricketMatch ? id?.replace("cricket-", "") : undefined);

  // ── Football Hook ──
  const { data: footballMatchData, isLoading: footballLoading } = useFootballMatchDetail(isFootballMatch ? id : undefined);

  // Find mock match for other sports
  const mockMatch = matches.find((m) => m.id === id);

  // Build football match object
  const footballMatch: Match | undefined = footballMatchData ? {
    ...footballMatchData,
    sport: 'football',
    startTime: new Date(footballMatchData.startTime || Date.now()),
    homeTeam: footballMatchData.homeTeam || { name: 'Home', shortName: 'HOM' },
    awayTeam: footballMatchData.awayTeam || { name: 'Away', shortName: 'AWY' },
    venue: footballMatchData.venue || { name: 'Stadium', city: '' },
  } as Match : undefined;

  // Priority: CricketData.org > Legacy API > Football API > Mock
  const match: Match | undefined = cricketDataMatch || legacyCricketMatch || footballMatch || mockMatch;
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

  // Loading state for cricket or football API matches
  if ((id?.startsWith("cricket-") && (cricketDataLoading || legacyLoading)) ||
      (id?.startsWith("football-") && footballLoading)) {
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
        <title>{`${match.homeTeam?.name || "Team 1"} vs ${match.awayTeam?.name || "Team 2"} - ${match.matchType} | SportsBuzz`}</title>
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
          "relative overflow-hidden pt-8 pb-12",
          "bg-[#0a0f18]"
        )}>
          {/* Animated Background */}
          <div className="absolute inset-0 bg-[#0a0f18]" />
          <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.2), transparent 70%)' }} />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1e1e12dbcb34?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-[0.03] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f18]/80 to-background" />

          <div className="relative container mx-auto px-4 max-w-6xl">
            {/* Top Meta Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2 md:px-6">
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full backdrop-blur-md">
                        <Trophy size={14} className="text-white/60" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white/80">{match.tournament?.name || match.matchType}</span>
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-red-500">Live Match</span>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Completed Match</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full backdrop-blur-md text-white/60">
                        <MapPin size={12} />
                        <span className="text-[10px] font-semibold tracking-wide">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full backdrop-blur-md text-white/60">
                        <Clock size={12} />
                        <span className="text-[10px] font-semibold tracking-wide">
                            {match.displayTime && (match.sport === 'cricket' || match.sport === 'football') ? match.displayTime : format(match.startTime, "MMM d, yyyy • h:mm a")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Premium Scoreboard Card */}
            <div className="relative bg-[#111827]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-14 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)]">
                {/* Dynamic Glows behind teams */}
                <div className="absolute top-0 left-0 w-1/2 h-full opacity-20 bg-gradient-to-r from-blue-600 to-transparent blur-[120px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 bg-gradient-to-l from-orange-600 to-transparent blur-[120px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full group-hover:bg-white/10 transition-colors" />
                            <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="lg" className="w-24 h-24 md:w-36 md:h-36 shadow-2xl border-4 border-[#1f2937]" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-2 leading-none drop-shadow-md">{match.homeTeam?.name || "Team 1"}</h2>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">{match.homeTeam?.shortName}</p>
                        </div>
                    </div>

                    {/* Center Score Area */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto z-20">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center justify-center gap-6 md:gap-12">
                          {isTestMatch && match.scoreBreakdown ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex items-center gap-6 md:gap-12">
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2">1st Inn</span>
                                  <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-xl leading-none">{match.scoreBreakdown.home.inn1 || "—"}</span>
                                </div>
                                <span className="w-6 h-1 md:w-10 md:h-2 rounded-full bg-white/10 mt-6" />
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2">1st Inn</span>
                                  <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-xl leading-none">{match.scoreBreakdown.away.inn1 || "—"}</span>
                                </div>
                              </div>
                              {(match.scoreBreakdown.home.inn2 || match.scoreBreakdown.away.inn2) && (
                                <div className="flex items-center gap-6 md:gap-12 opacity-70 scale-90">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">2nd Inn</span>
                                    <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-xl leading-none">{match.scoreBreakdown.home.inn2 || "—"}</span>
                                  </div>
                                  <span className="w-4 h-1 md:w-6 md:h-1.5 rounded-full bg-white/10 mt-4" />
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">2nd Inn</span>
                                    <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-xl leading-none">{match.scoreBreakdown.away.inn2 || "—"}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : isTestMatch && match.inningsScores && match.inningsScores.length > 0 ? (
                            /* Test match fallback using inningsScores array */
                            <div className="flex items-start justify-center gap-6 md:gap-12">
                              {/* Home innings column */}
                              <div className="flex flex-col items-center gap-4">
                                {match.inningsScores.filter(i => i.team === 'home').map((inn, idx) => (
                                  <div key={idx} className="flex flex-col items-center">
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                                      {inn.inning === '1' ? '1st' : inn.inning === '2' ? '2nd' : `${inn.inning}th`} Inn
                                    </span>
                                    <span className={cn(
                                      "font-black italic tracking-tighter text-white drop-shadow-xl leading-none",
                                      idx === 0 ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl opacity-70"
                                    )}>
                                      {inn.score || "—"}
                                    </span>
                                    {inn.overs && (
                                      <span className="text-[10px] text-white/30 font-mono mt-1 font-bold">({inn.overs} ov)</span>
                                    )}
                                  </div>
                                ))}
                                {match.inningsScores.filter(i => i.team === 'home').length === 0 && (
                                  <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-white/20 leading-none">—</span>
                                )}
                              </div>
                              <span className="w-6 h-1 md:w-10 md:h-2 rounded-full bg-white/10 mt-10" />
                              {/* Away innings column */}
                              <div className="flex flex-col items-center gap-4">
                                {match.inningsScores.filter(i => i.team === 'away').map((inn, idx) => (
                                  <div key={idx} className="flex flex-col items-center">
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                                      {inn.inning === '1' ? '1st' : inn.inning === '2' ? '2nd' : `${inn.inning}th`} Inn
                                    </span>
                                    <span className={cn(
                                      "font-black italic tracking-tighter text-white drop-shadow-xl leading-none",
                                      idx === 0 ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl opacity-70"
                                    )}>
                                      {inn.score || "—"}
                                    </span>
                                    {inn.overs && (
                                      <span className="text-[10px] text-white/30 font-mono mt-1 font-bold">({inn.overs} ov)</span>
                                    )}
                                  </div>
                                ))}
                                {match.inningsScores.filter(i => i.team === 'away').length === 0 && (
                                  <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-white/20 leading-none">—</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* ODI / T20 / Single Innings / Tennis — parse score + overs */
                            (() => {
                              const parseScore = (raw: string | undefined) => {
                                if (!raw) return { runs: "—", overs: "" };
                                const m = raw.match(/^([\d\/]+(?:\s*\(d\))?)\s*\((.+?)\)\s*$/);
                                if (m) return { runs: m[1].trim(), overs: m[2].trim() };
                                return { runs: raw, overs: "" };
                              };
                              const home = parseScore(match.homeScore);
                              const away = parseScore(match.awayScore);
                              
                              const getScoreSize = (score: string) => {
                                  if (score.length > 12) return "text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-2xl leading-none";
                                  if (score.length > 6) return "text-6xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl leading-none";
                                  return "text-7xl md:text-[8rem] font-black italic tracking-tighter text-white drop-shadow-2xl leading-none";
                              };
      
                              return (
                                <>
                                  <div className="flex flex-col items-center justify-center">
                                    <span className={cn(
                                      getScoreSize(home.runs),
                                      isLive && "animate-pulse text-blue-400"
                                    )}>
                                      {home.runs}
                                    </span>
                                    {home.overs && (
                                      <span className="text-[10px] md:text-xs text-white/40 font-black tracking-widest mt-3">
                                        ({home.overs})
                                      </span>
                                    )}
                                  </div>
                                  <span className="w-4 h-1 md:w-8 md:h-2 rounded-full bg-white/10 mt-8 mx-2 md:mx-6" />
                                  <div className="flex flex-col items-center justify-center">
                                    <span className={cn(
                                      getScoreSize(away.runs),
                                      isLive && "animate-pulse text-orange-400"
                                    )}>
                                      {away.runs}
                                    </span>
                                    {away.overs && (
                                      <span className="text-[10px] md:text-xs text-white/40 font-black tracking-widest mt-3">
                                        ({away.overs})
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()
                          )}
                        </div>
      
                        {/* Real-time status badge below score */}
                        {(match.sport === 'cricket' || match.sport === 'football') && match.summaryText && (
                          <div className="mt-6 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                            <p className="text-[10px] md:text-xs font-black tracking-widest uppercase text-emerald-400 text-center">
                              {match.summaryText}
                            </p>
                          </div>
                        )}
                        
                        {/* Live Info (Overs etc) */}
                        {isLive && (
                          <div className="text-[10px] md:text-xs font-black tracking-widest uppercase text-white/60 bg-white/5 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mt-2 border border-white/5">
                            {match.sport === "cricket" && match.currentOver && <span>Over {match.currentOver}</span>}
                            {match.sport === "football" && match.currentMinute && <span>{match.currentMinute}</span>}
                            {match.sport === "basketball" && match.currentQuarter && <span>{match.currentQuarter} - {match.timeRemaining}</span>}
                            {match.sport === "tennis" && match.currentSet && <span>{match.currentSet}</span>}
                            {(!match.currentOver && !match.currentMinute && !match.currentQuarter && !match.currentSet) && (
                              <span>In Progress</span>
                            )}
                          </div>
                        )}

                        {/* Football Goal Scorers */}
                        {match.sport === 'football' && match.goals && match.goals.length > 0 && (
                          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 md:min-w-[400px] backdrop-blur-md relative z-20">
                            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/50 mb-3 border-b border-white/10 pb-2 text-center">Match Goals</h4>
                            <div className="space-y-2">
                              {match.goals.map((goal: any, idx: number) => {
                                const isHome = goal.teamId === match.homeTeam.id;
                                return (
                                  <div key={idx} className={cn(
                                    "flex items-center gap-3 text-xs",
                                    isHome ? "justify-start" : "justify-end flex-row-reverse"
                                  )}>
                                    <span className="font-mono text-white/60 font-bold w-6 text-center">{goal.minute}'</span>
                                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">⚽</div>
                                    <div className={cn("flex flex-col", isHome ? "items-start" : "items-end")}>
                                      <span className="font-bold text-white tracking-wide">
                                        {goal.player} {goal.type === 'penalty' && <span className="text-white/40 text-[10px] ml-1">(P)</span>}
                                        {goal.type === 'own_goal' && <span className="text-red-400 text-[10px] ml-1">(OG)</span>}
                                      </span>
                                      {goal.assist && (
                                        <span className="text-[9px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                                          <Footprints size={8} className="opacity-70" /> {goal.assist}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-6 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 blur-xl rounded-full group-hover:bg-white/10 transition-colors" />
                            <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="lg" className="w-24 h-24 md:w-36 md:h-36 shadow-2xl border-4 border-[#1f2937]" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-2 leading-none drop-shadow-md">{match.awayTeam?.name || "Team 2"}</h2>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/40">{match.awayTeam?.shortName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-4 mt-8">
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
                                team1: match.homeTeam?.name || "Team 1",
                                team2: match.awayTeam?.name || "Team 2"
                              },
                              date: match.startTime instanceof Date 
                                      ? match.startTime.toISOString() 
                                      : new Date(match.startTime || Date.now()).toISOString(),
                              venue: typeof match.venue === 'object' ? match.venue?.name || "Venue" : match.venue || "Venue",
                              status: match.status
                            }) as any;
                            setIsFavorite(true);
                            setFavoriteId(response.data._id);
                            toast({ title: "Added", description: "Match added to favorites" });
                          }
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.response?.data?.message || "Failed to add to favorites.",
                            variant: "destructive"
                          });
                        }
                      }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl hover:-translate-y-1",
                        isFavorite ? "bg-red-500 text-white" : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
                    )}
                >
                    <Heart size={18} className={isFavorite ? "fill-current" : ""} />
                    {isFavorite ? "Favorited" : "Add to Favorites"}
                </button>
                <button
                    onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${match?.homeTeam?.name} vs ${match?.awayTeam?.name}`,
                            text: `Check out the match: ${match?.homeTeam?.name} vs ${match?.awayTeam?.name} on SportsBuzz`,
                            url: window.location.href,
                          });
                        }
                      }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white/80 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all shadow-xl hover:-translate-y-1"
                >
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
              {match?.sport !== 'tennis' && (
                <TabsTrigger value="lineups" className="flex items-center gap-2">
                  <Users size={16} />
                  Lineups
                </TabsTrigger>
              )}
              <TabsTrigger value="scoreboard" className="flex items-center gap-2">
                <ListOrdered size={16} />
                {match?.sport === 'football' || match?.sport === 'tennis' ? 'Stats' : 'Scoreboard'}
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
                        {match.displayTime && (match.sport === 'cricket' || match.sport === 'football')
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
              {match?.sport === 'football' ? (
                /* ── Football Lineups ── */
                <div className="bg-card border border-border rounded-[2.5rem] p-4 md:p-8 overflow-hidden relative">
                    <FootballPitchLineup 
                        homeTeam={{
                            name: match.homeTeam?.name || 'Home Team',
                            logo: match.homeTeam?.logo,
                            primaryColor: match.homeTeam?.primaryColor || '#2563eb'
                        }}
                        awayTeam={{
                            name: match.awayTeam?.name || 'Away Team',
                            logo: match.awayTeam?.logo,
                            primaryColor: match.awayTeam?.primaryColor || '#ea580c'
                        }}
                        homePlayers={[
                            ...(match.details?.lineups?.home?.startXI || match.details?.lineups?.home?.startingXI || match.details?.lineups?.home?.players || []).map((p: any) => {
                                const isString = typeof p === 'string';
                                const name = isString ? p : (p.player?.name || p.name || 'Unknown');
                                const roleCode = isString ? undefined : (p.player?.pos || p.position);
                                return {
                                    id: isString ? name : (p.player?.id?.toString() || name || Math.random().toString()),
                                    name: name,
                                    role: roleCode === 'G' ? 'Goalkeeper' : roleCode === 'D' ? 'Defender' : roleCode === 'M' ? 'Midfielder' : 'Forward',
                                    number: isString ? undefined : (p.player?.number || p.shirtNumber || p.number),
                                    isSubstitute: false,
                                    events: summarizePlayerEvents(name, match.events || [], parseInt(match.awayScore as string) || 0)
                                };
                            }),
                            ...(match.details?.lineups?.home?.substitutes || []).map((p: any) => {
                                const isString = typeof p === 'string';
                                const name = isString ? p : (p.player?.name || p.name || 'Unknown');
                                const roleCode = isString ? undefined : (p.player?.pos || p.position);
                                return {
                                    id: isString ? name : (p.player?.id?.toString() || name || Math.random().toString()),
                                    name: name,
                                    role: roleCode === 'G' ? 'Goalkeeper' : roleCode === 'D' ? 'Defender' : roleCode === 'M' ? 'Midfielder' : 'Forward',
                                    number: isString ? undefined : (p.player?.number || p.shirtNumber || p.number),
                                    isSubstitute: true,
                                    events: summarizePlayerEvents(name, match.events || [], parseInt(match.awayScore as string) || 0)
                                };
                            })
                        ]}
                        awayPlayers={[
                            ...(match.details?.lineups?.away?.startXI || match.details?.lineups?.away?.startingXI || match.details?.lineups?.away?.players || []).map((p: any) => {
                                const isString = typeof p === 'string';
                                const name = isString ? p : (p.player?.name || p.name || 'Unknown');
                                const roleCode = isString ? undefined : (p.player?.pos || p.position);
                                return {
                                    id: isString ? name : (p.player?.id?.toString() || name || Math.random().toString()),
                                    name: name,
                                    role: roleCode === 'G' ? 'Goalkeeper' : roleCode === 'D' ? 'Defender' : roleCode === 'M' ? 'Midfielder' : 'Forward',
                                    number: isString ? undefined : (p.player?.number || p.shirtNumber || p.number),
                                    isSubstitute: false,
                                    events: summarizePlayerEvents(name, match.events || [], parseInt(match.homeScore as string) || 0)
                                };
                            }),
                            ...(match.details?.lineups?.away?.substitutes || []).map((p: any) => {
                                const isString = typeof p === 'string';
                                const name = isString ? p : (p.player?.name || p.name || 'Unknown');
                                const roleCode = isString ? undefined : (p.player?.pos || p.position);
                                return {
                                    id: isString ? name : (p.player?.id?.toString() || name || Math.random().toString()),
                                    name: name,
                                    role: roleCode === 'G' ? 'Goalkeeper' : roleCode === 'D' ? 'Defender' : roleCode === 'M' ? 'Midfielder' : 'Forward',
                                    number: isString ? undefined : (p.player?.number || p.shirtNumber || p.number),
                                    isSubstitute: true,
                                    events: summarizePlayerEvents(name, match.events || [], parseInt(match.homeScore as string) || 0)
                                };
                            })
                        ]}
                        homeFormation={match.details?.lineups?.home?.formation || '4-3-3'}
                        awayFormation={match.details?.lineups?.away?.formation || '4-3-3'}
                    />
                </div>
              ) : (cbSquadsField.loading || matchInfoField.loading) ? (
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

                    let footballStatCategories: any[] = [];
                    
                    if (!match.details?.statistics?.[0]?.groups) {
                      return (
                        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">Statistics not available for this match</p>
                        </div>
                      );
                    }

                    footballStatCategories = match.details.statistics[0].groups.map((group: any) => ({
                        category: group.groupName,
                        stats: group.statisticsItems.map((item: any) => ({
                            label: item.name,
                            home: parseFloat(item.home) || 0,
                            away: parseFloat(item.away) || 0,
                            unit: item.home?.includes('%') ? '%' : ''
                        }))
                    }));

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
              ) : match?.sport === 'tennis' ? (
                /* ── Tennis Match Stats ── */
                <div className="space-y-6">
                  {(() => {
                    const homeTeamName = match?.homeTeam?.shortName || match?.homeTeam?.name || 'P1';
                    const awayTeamName = match?.awayTeam?.shortName || match?.awayTeam?.name || 'P2';

                    // Generate realistic mock stats for tennis since API might not provide them yet
                    const tennisStatCategories = [
                      {
                        category: '🎾 Service',
                        stats: [
                          { label: 'Aces', home: 12, away: 8 },
                          { label: 'Double Faults', home: 3, away: 5 },
                          { label: 'First Serve %', home: 68, away: 62, unit: '%' },
                          { label: '1st Serve Points Won', home: 78, away: 71, unit: '%' },
                          { label: '2nd Serve Points Won', home: 54, away: 48, unit: '%' },
                          { label: 'Break Points Saved', home: 4, away: 2 },
                        ],
                      },
                      {
                        category: '⚡ Rallies & Points',
                        stats: [
                          { label: 'Winners', home: 45, away: 38 },
                          { label: 'Unforced Errors', home: 28, away: 34 },
                          { label: 'Net Points Won', home: 18, away: 12 },
                          { label: 'Return Points Won', home: 36, away: 28, unit: '%' },
                          { label: 'Break Points Won', home: 5, away: 3 },
                          { label: 'Total Points Won', home: 124, away: 112 },
                        ],
                      }
                    ];

                    return tennisStatCategories.map((cat, catIdx) => (
                      <div key={catIdx} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="bg-secondary/30 px-6 py-3 border-b border-border">
                          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{cat.category}</h3>
                        </div>
                        <div className="px-6 py-2">
                          <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <span className="text-sm font-bold text-primary w-16 text-left truncate">{homeTeamName}</span>
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Stat</span>
                            <span className="text-sm font-bold text-tennis w-16 text-right truncate">{awayTeamName}</span>
                          </div>
                          {cat.stats.map((stat, sIdx) => {
                            const maxVal = Math.max(stat.home, stat.away, 1);
                            const homeWidth = (stat.home / maxVal) * 100;
                            const awayWidth = (stat.away / maxVal) * 100;
                            const homeHigher = stat.home > stat.away;
                            const awayHigher = stat.away > stat.home;
                            // For some stats like double faults or unforced errors, lower is better. We won't colorize based on "better", just raw value.
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
                                        awayHigher ? "bg-tennis" : "bg-tennis/30"
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

                {match?.sport === 'football' ? (
                  isUpcoming ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-10" />
                      <p>Match not started yet — commentary will be available once play begins.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const seed = (match.id || "").length;
                        const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
                        const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "Away";
                        
                        const events = [];
                        
                        if (match.details?.incidents) {
                          match.details.incidents.forEach((inc: any) => {
                            let type = 'info';
                            if (inc.incidentType === 'goal') type = 'goal';
                            else if (inc.incidentClass === 'yellow') type = 'yellow';
                            else if (inc.incidentClass === 'red') type = 'red';
                            else if (inc.incidentType === 'substitution') type = 'sub';

                            const teamName = inc.isHome ? homeTeam : awayTeam;
                            let text = inc.text || inc.incidentType;
                            if (inc.player?.name) {
                              text = `${inc.player.name} (${inc.incidentType})`;
                              if (inc.assist1?.name) text += ` - Assist: ${inc.assist1.name}`;
                            }

                            events.push({
                              minute: inc.time,
                              type,
                              team: teamName,
                              text
                            });
                          });
                        } else if (match.goals && match.goals.length > 0) {
                          match.goals.forEach((g: any) => {
                            events.push({ minute: g.minute, type: 'goal', team: g.teamId === match.homeTeam?.id ? homeTeam : awayTeam, text: `GOAL! ${g.player} scores for ${g.teamId === match.homeTeam?.id ? homeTeam : awayTeam}! ${g.assist ? `Assist by ${g.assist}.` : 'Brilliant finish.'}` });
                          });
                        }
                        
                        if (events.length === 0) {
                          return (
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                              <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground">Commentary and incidents not available for this match</p>
                            </div>
                          );
                        }
                        
                        // Sort events by minute descending
                        const sortedEvents = events.sort((a, b) => b.minute - a.minute);
                        
                        // If live, filter events past current minute
                        const currentMinStr = match.currentMinute ? match.currentMinute.replace(/\D/g, '') : '90';
                        const currentMin = parseInt(currentMinStr) || 90;
                        const visibleEvents = isLive ? sortedEvents.filter(e => e.minute <= currentMin) : sortedEvents;
                        
                        return visibleEvents.map((evt, idx) => (
                          <div key={idx} className="relative pl-8 pb-3 last:pb-0 border-l border-border/60 last:border-l-0">
                            <div className={cn(
                              "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full flex items-center justify-center text-[8px]",
                              evt.type === 'goal' ? "bg-green-500" :
                              evt.type === 'yellow' ? "bg-yellow-400" :
                              evt.type === 'red' ? "bg-red-500" :
                              evt.type === 'sub' ? "bg-blue-400" : "bg-primary/60"
                            )}>
                              {evt.type === 'goal' ? '⚽' : ''}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {evt.minute}'
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">{evt.team}</span>
                            </div>
                            <p className={cn(
                              "text-sm leading-relaxed p-3 rounded-lg border",
                              evt.type === 'goal' ? "bg-green-500/10 border-green-500/20 text-foreground font-medium" :
                              evt.type === 'info' ? "bg-secondary/50 border-border text-foreground font-medium text-center" :
                              "bg-secondary/30 border-border/50 text-foreground/80"
                            )}>
                              {evt.text}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  )
                ) : isUpcoming ? (
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
