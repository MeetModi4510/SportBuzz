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
  Footprints,
  Tag,
  Coins,
  Eye,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadsList } from "@/components/SquadsList";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FootballPitchLineup } from "@/components/FootballPitchLineup";
import { CricketPlayerImage } from "@/components/CricketPlayerImage";
import type { Match } from "@/data/types";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PreMatchForecast } from '@/components/PreMatchForecast';
import { favoritesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const MatchPerformanceLab = lazy(() => import("@/components/MatchPerformanceLab"));
const CricketPerformanceLab = lazy(() => import("@/components/CricketPerformanceLab"));

const generateDynamicOfficials = (id: string, homeTeam: string, awayTeam: string) => {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) {
    hash = (id || "").charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash) || 0;
  
  const umpires = [
    "M. Erasmus, R. Kettleborough",
    "A. Dar, S. Ravi",
    "B. Oxenford, R. Tucker",
    "P. Reiffel, N. Llong",
    "J. Wilson, M. Gough",
    "C. Gaffaney, R. Illingworth",
    "R. Kettleborough, M. Gough"
  ];
  const referees = ["J. Srinath", "R. Madugalle", "C. Broad", "D. Boon", "A. Pycroft", "R. Richardson"];
  const choices = ["bat", "bowl"];
  
  const tossWinner = (absHash % 2 === 0) ? (homeTeam || "Home Team") : (awayTeam || "Away Team");
  
  return {
    umpires: umpires[absHash % umpires.length],
    referee: referees[absHash % referees.length],
    tossResult: `${tossWinner} won the toss and chose to ${choices[absHash % choices.length]}`
  };
};

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [activeInningsIndex, setActiveInningsIndex] = useState<number>(-1);

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
          const evPlayerName = event.player?.name || event.player;
          const evAssisterName = event.assist?.name || event.assister || event.assist || event.playerOut;
          const evMinute = event.time?.elapsed || event.minute || parseInt(event.time);
          const evType = event.type?.toLowerCase();

          if (evPlayerName === playerName) {
              if (evType === 'goal') playerEvents.goals++;
              if (evType === 'card' && event.detail?.toLowerCase().includes('yellow')) playerEvents.yellowCards++;
              if (evType === 'card' && event.detail?.toLowerCase().includes('red')) playerEvents.redCards++;
              if (evType === 'yellowcard') playerEvents.yellowCards++;
              if (evType === 'redcard') playerEvents.redCards++;
              if (evType === 'save') playerEvents.saves++;
              if (evType === 'foul') playerEvents.fouls++;
              if (evType === 'shotontarget') playerEvents.shotsOnTarget++;
              if (evType === 'corner') playerEvents.corners++;
          }
          if (evType === 'goal' && evAssisterName === playerName) playerEvents.assists++;
          
          if (evType === 'subst' || evType === 'substitution') {
              if (evPlayerName === playerName) {
                  playerEvents.substitution = { ...playerEvents.substitution, inMinute: evMinute };
              } else if (evAssisterName === playerName) {
                  playerEvents.substitution = { ...playerEvents.substitution, outMinute: evMinute, isInjured: event.commentary?.toLowerCase().includes('injur') };
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
        {/* Match Header */}
        <section className="bg-background pt-8 pb-12">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* The Premium Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
               
               {/* 1. Top Meta Bar */}
               <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 border-b border-border/40 bg-muted/10 gap-3">
                  <div className="flex items-center gap-3">
                     {isLive && (
                        <span className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                        </span>
                     )}
                     {isCompleted && (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-2.5 py-1 rounded-full">
                            COMPLETED
                        </span>
                     )}
                     {(!isLive && !isCompleted) && (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-2.5 py-1 rounded-full">
                            UPCOMING
                        </span>
                     )}
                     <span className="text-xs font-semibold text-foreground uppercase tracking-widest">{match.tournament?.name || match.matchType}</span>
                  </div>
                  <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
                     <span className="flex items-center gap-1.5"><MapPin size={14} className="text-muted-foreground/60" /> {typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
                     <span className="hidden sm:flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground/60" /> {match.displayTime && (match.sport === 'cricket' || match.sport === 'football') ? match.displayTime : format(match.startTime, "MMM d, yyyy • h:mm a")}</span>
                  </div>
               </div>

               {/* 2. Main Score Area */}
               <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-10 md:py-14 gap-8 relative">
                   {/* Home Team */}
                   <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-end gap-5 w-full z-10">
                       <div className="text-center md:text-right">
                           <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{match.homeTeam?.name || "Team 1"}</h2>
                           <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{match.homeTeam?.shortName}</p>
                       </div>
                       <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                   </div>

                   {/* Score Center */}
                   <div className="flex flex-col items-center justify-center shrink-0 z-10 min-w-[200px]">
                     {isTestMatch && match.scoreBreakdown ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-6">
                            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{match.scoreBreakdown.home.inn1 || "—"}</span>
                            <span className="text-border text-2xl font-light">-</span>
                            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{match.scoreBreakdown.away.inn1 || "—"}</span>
                          </div>
                          {(match.scoreBreakdown.home.inn2 || match.scoreBreakdown.away.inn2) && (
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span className="text-xl md:text-2xl font-bold">{match.scoreBreakdown.home.inn2 || "—"}</span>
                              <span className="text-border text-lg">-</span>
                              <span className="text-xl md:text-2xl font-bold">{match.scoreBreakdown.away.inn2 || "—"}</span>
                            </div>
                          )}
                        </div>
                     ) : isTestMatch && match.inningsScores && match.inningsScores.length > 0 ? (
                        <div className="flex items-start justify-center gap-8 md:gap-10">
                          <div className="flex flex-col items-center gap-3">
                            {match.inningsScores.filter(i => i.team === 'home').map((inn, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <span className={cn(
                                  "font-black tracking-tighter",
                                  idx === 0 ? "text-4xl md:text-5xl text-foreground" : "text-xl md:text-2xl text-muted-foreground"
                                )}>
                                  {inn.score || "—"}
                                </span>
                                {inn.overs && <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold bg-secondary/20 px-2 py-0.5 rounded-sm">{inn.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                              </div>
                            ))}
                          </div>
                          {match.inningsScores.filter(i => i.team === 'away').length > 0 && (
                            <span className="text-border text-2xl font-light mt-2">-</span>
                          )}
                          <div className="flex flex-col items-center gap-3">
                            {match.inningsScores.filter(i => i.team === 'away').map((inn, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <span className={cn(
                                  "font-black tracking-tighter",
                                  idx === 0 ? "text-4xl md:text-5xl text-foreground" : "text-xl md:text-2xl text-muted-foreground"
                                )}>
                                  {inn.score || "—"}
                                </span>
                                {inn.overs && <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold bg-secondary/20 px-2 py-0.5 rounded-sm">{inn.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                     ) : (
                        (() => {
                          const parseScore = (raw: string | undefined) => {
                            if (!raw) return { runs: "—", overs: "" };
                            const m = raw.match(/^([\d\/]+(?:\s*\(d\))?)\s*\((.+?)\)\s*$/);
                            if (m) return { runs: m[1].trim(), overs: m[2].trim() };
                            return { runs: raw, overs: "" };
                          };
                          const home = parseScore(match.homeScore);
                          const away = parseScore(match.awayScore);
                          const showAway = away.runs !== "—" && away.runs !== "";

                          return (
                            <div className="flex items-center gap-6 md:gap-10">
                              <div className="flex flex-col items-center">
                                <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{home.runs}</span>
                                {home.overs && <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-widest bg-secondary/30 px-3 py-1 rounded-full">{home.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                              </div>
                              {showAway && (
                                <>
                                  <span className="text-border text-4xl font-light mb-4">-</span>
                                  <div className="flex flex-col items-center">
                                    <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{away.runs}</span>
                                    {away.overs && <span className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-widest bg-secondary/30 px-3 py-1 rounded-full">{away.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()
                     )}
                   </div>

                   {/* Away Team */}
                   <div className="flex-1 flex flex-col md:flex-row items-center justify-start gap-5 w-full z-10">
                       <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                       <div className="text-center md:text-left">
                           <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{match.awayTeam?.name || "Team 2"}</h2>
                           <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{match.awayTeam?.shortName}</p>
                       </div>
                   </div>
               </div>

               {/* Football Goals Section */}
               {(() => {
                 const matchGoals = match.goals || match.events?.filter((e: any) => e.type?.toLowerCase() === 'goal').map((e: any) => ({
                   teamId: e.team?.id || (match.homeTeam?.name === e.team?.name ? match.homeTeam?.id : match.awayTeam?.id),
                   player: e.player?.name || e.player,
                   minute: e.time?.elapsed || e.minute || parseInt(e.time),
                   type: (e.detail?.toLowerCase() === 'penalty' || e.type?.toLowerCase() === 'penalty') ? 'penalty' : (e.detail?.toLowerCase() === 'own goal' || e.type?.toLowerCase() === 'own_goal') ? 'own_goal' : 'goal',
                   assist: e.assist?.name || e.assister || e.assist
                 })) || [];

                 if (match.sport !== 'football' || !matchGoals || matchGoals.length === 0) return null;

                 return (
                   <div className="border-t border-border/40 py-6 bg-muted/5">
                     <div className="max-w-lg mx-auto grid grid-cols-2 gap-x-8 gap-y-3 px-6">
                       {matchGoals.map((goal: any, idx: number) => {
                         const isHome = goal.teamId === match.homeTeam.id || goal.teamId === match.homeTeam?.name || (!goal.teamId && match.homeScore > match.awayScore); // Fallback logic
                         return (
                           <div 
                             key={idx} 
                             className={cn(
                               "flex items-start text-sm",
                               isHome ? "col-start-1 justify-end flex-row-reverse text-right pr-4 border-r border-border/30" : "col-start-2 justify-start pl-4"
                             )}
                           >
                             <span className="font-mono text-muted-foreground text-xs w-8 shrink-0 text-center mt-0.5">{goal.minute}'</span>
                             <div className={cn("flex flex-col gap-0.5 mx-2", isHome ? "items-end" : "items-start")}>
                               <span className="font-semibold text-foreground">
                                 {goal.player} 
                                 {goal.type === 'penalty' && <span className="text-muted-foreground text-[10px] ml-1 font-normal">(PEN)</span>}
                                 {goal.type === 'own_goal' && <span className="text-red-500 text-[10px] ml-1 font-normal">(OG)</span>}
                               </span>
                               {goal.assist && typeof goal.assist === 'string' && (
                                 <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                   <Footprints size={10} className="opacity-50" /> {goal.assist}
                                 </span>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })()}

               {/* 3. Bottom Footer */}
               <div className="flex flex-col sm:flex-row items-center justify-between px-6 md:px-10 py-4 bg-muted/10 border-t border-border/40 gap-4">
                   {/* Status Area */}
                   <div className="flex flex-col items-center sm:items-start gap-1">
                      {(match.sport === 'cricket' || match.sport === 'football') && match.summaryText && (
                        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{match.summaryText}</span>
                      )}
                      
                      {isLive && (
                        <div className="text-[10px] font-bold text-red-500 tracking-widest uppercase flex items-center gap-2">
                          {match.sport === "cricket" && match.currentOver && <span>OVER {match.currentOver}</span>}
                          {match.sport === "football" && match.currentMinute && <><Clock size={12} className="animate-pulse" /> <span>{match.currentMinute}</span></>}
                          {match.sport === "basketball" && match.currentQuarter && <span>{match.currentQuarter} - {match.timeRemaining}</span>}
                          {match.sport === "tennis" && match.currentSet && <span>{match.currentSet}</span>}
                          {(!match.currentOver && !match.currentMinute && !match.currentQuarter && !match.currentSet) && (
                            <span>IN PROGRESS</span>
                          )}
                        </div>
                      )}
                      {(!match.summaryText && !isLive) && (
                         <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                           {isCompleted ? "MATCH ENDED" : "MATCH UPCOMING"}
                         </span>
                      )}
                   </div>

                   {/* Actions */}
                   <div className="flex items-center gap-3">
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
                               "flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-[11px] uppercase tracking-wider transition-all border",
                               isFavorite ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" : "bg-background shadow-sm text-foreground border-border/40 hover:bg-secondary hover:border-border"
                           )}
                       >
                           <Heart size={14} className={isFavorite ? "fill-current" : ""} />
                           {isFavorite ? "Saved" : "Save"}
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
                           className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-[11px] uppercase tracking-wider transition-all border border-border/40 bg-background shadow-sm text-foreground hover:bg-secondary hover:border-border"
                       >
                           <Share2 size={14} />
                           Share
                       </button>
                   </div>
               </div>
               
            </div>
          </div>
        </section>

        {/* Match Content Tabs */}
        <section className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="w-full justify-start bg-transparent border-b border-border/30 rounded-none h-auto p-0 space-x-6 overflow-x-auto pb-px">
              <TabsTrigger 
                value="summary" 
                className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
              >
                <BarChart3 size={16} />
                Summary
              </TabsTrigger>
              {match?.sport !== 'tennis' && (
                <TabsTrigger 
                  value="lineups" 
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Users size={16} />
                  Lineups
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="scoreboard" 
                className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
              >
                <ListOrdered size={16} />
                {match?.sport === 'football' || match?.sport === 'tennis' ? 'Stats' : 'Scoreboard'}
              </TabsTrigger>

              <TabsTrigger 
                value="commentary" 
                className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
              >
                <MessageSquare size={16} />
                Commentary
              </TabsTrigger>
              {(match?.sport === 'football' || match?.sport === 'cricket') && (
                <TabsTrigger 
                  value="performance" 
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
                >
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
                <div className="relative overflow-hidden bg-card border border-border/40 rounded-2xl p-6 md:p-8 flex items-center gap-6 group shadow-sm transition-all hover:border-border/60">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 block">
                      {isCompleted ? 'Match Result' : 'Current Status'}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-snug">
                      {match.summaryText}
                    </h3>
                  </div>
                </div>
              )}

              {/* Match Details Grid */}
              {!isUpcoming && (
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-2 px-1 mb-2">
                     <Info className="w-4 h-4 text-muted-foreground" />
                     <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Information</h3>
                  </div>
                  <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                      
                      {/* Column 1: Core Details */}
                      <div className="p-6 md:p-8 space-y-8">
                        
                        {/* Match Type & Status */}
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><Tag size={18}/></div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Match Type</p>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground">{match.matchType || "T20"}</p>
                              <span className="w-1 h-1 rounded-full bg-border/60"></span>
                              <span className={cn("font-medium text-xs flex items-center gap-1.5", isLive ? "text-red-500" : "text-muted-foreground")}>
                                {isLive ? <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> In Progress</> : isCompleted ? 'Completed' : 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Venue Info */}
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><MapPin size={18}/></div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Venue</p>
                            <p className="font-semibold text-sm text-foreground leading-snug">{match.venue?.name || "Stadium"}{match.venue?.city && `, ${match.venue?.city}`}</p>
                            <p className="text-[11px] font-medium text-muted-foreground mt-1.5">Capacity: {match.venue?.capacity ? match.venue.capacity.toLocaleString() : "38,200"}</p>
                          </div>
                        </div>
                        
                        {/* Date & Time */}
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><Clock size={18}/></div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date & Time</p>
                            <p className="font-semibold text-sm text-foreground">
                              {match.displayTime && (match.sport === 'cricket' || match.sport === 'football')
                                ? match.displayTime
                                : format(match.startTime || new Date(), "MMMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Column 2: Officials & Toss */}
                      <div className="p-6 md:p-8 space-y-8 bg-muted/5">
                        
                        {(() => {
                          const dynamicInfo = generateDynamicOfficials(match.id, match.homeTeam?.name, match.awayTeam?.name);
                          return (
                            <>
                              {/* Toss */}
                              <div className="flex items-start gap-4">
                                <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><Coins size={18}/></div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Toss Result</p>
                                  <p className="font-semibold text-sm text-foreground leading-snug">
                                    {match.tossResult || (rawApiData?.tossWinner ? `${rawApiData.tossWinner} chose to ${rawApiData.tossChoice}` : dynamicInfo.tossResult)}
                                  </p>
                                </div>
                              </div>

                              {/* Umpires */}
                              <div className="flex items-start gap-4">
                                <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><Eye size={18}/></div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">On-Field Umpires</p>
                                  <p className="font-semibold text-sm text-foreground">
                                    {rawApiData?.umpire1 ? `${rawApiData.umpire1}, ${rawApiData.umpire2}` : dynamicInfo.umpires}
                                  </p>
                                </div>
                              </div>

                              {/* Referee */}
                              <div className="flex items-start gap-4">
                                <div className="p-3.5 bg-secondary/60 rounded-2xl text-foreground"><Shield size={18}/></div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Match Referee</p>
                                  <p className="font-semibold text-sm text-foreground">
                                    {match.referee || rawApiData?.referee || dynamicInfo.referee}
                                  </p>
                                </div>
                              </div>
                            </>
                          );
                        })()}

                      </div>
                    </div>

                    {/* Man of the Match (Full Width Footer) */}
                    {match.manOfTheMatch && (
                      <div className="border-t border-border/40 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-6 md:px-8 flex items-center gap-5">
                        <div className="p-3.5 bg-primary/20 rounded-2xl text-primary ring-1 ring-primary/30"><Trophy size={18}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Player of the Match</p>
                          <p className="font-bold text-base text-foreground tracking-tight">{typeof match.manOfTheMatch === 'object' ? match.manOfTheMatch?.name : match.manOfTheMatch}</p>
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
                            name: match.homeTeam?.name || "Team 1",
                            logo: match.homeTeam?.logo,
                            primaryColor: match.homeTeam?.primaryColor || '#2563eb'
                        }}
                        awayTeam={{
                            name: match.awayTeam?.name || "Team 2",
                            logo: match.awayTeam?.logo,
                            primaryColor: match.awayTeam?.primaryColor || '#ea580c'
                        }}
                        homePlayers={[
                            ...(match.lineups?.home?.startXI || match.lineups?.home?.startingXI || match.lineups?.home?.players || match.details?.lineups?.home?.startXI || match.details?.lineups?.home?.startingXI || match.details?.lineups?.home?.players || []).map((p: any) => {
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
                            ...(match.lineups?.home?.substitutes || match.details?.lineups?.home?.substitutes || []).map((p: any) => {
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
                            ...(match.lineups?.away?.startXI || match.lineups?.away?.startingXI || match.lineups?.away?.players || match.details?.lineups?.away?.startXI || match.details?.lineups?.away?.startingXI || match.details?.lineups?.away?.players || []).map((p: any) => {
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
                            ...(match.lineups?.away?.substitutes || match.details?.lineups?.away?.substitutes || []).map((p: any) => {
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
                        homeFormation={match.lineups?.home?.formation || match.details?.lineups?.home?.formation || '4-3-3'}
                        awayFormation={match.lineups?.away?.formation || match.details?.lineups?.away?.formation || '4-3-3'}
                    />
                </div>
              ) : (cbSquadsField.loading || matchInfoField.loading) ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              ) : (cbSquadsField.data?.teams?.length || match?.homeTeam?.players?.length || match?.awayTeam?.players?.length) ? (
                /* ── Cricket Head-to-Head Lineups ── */
                (() => {
                  const apiTeams = cbSquadsField.data?.teams || [];
                  const teams: any[] = [];
                  
                  // Extract Team 1 (Home)
                  const homeApiTeam = apiTeams.find((t: any) => t.teamName === match?.homeTeam?.name || t.teamId === match?.homeTeam?.id) || apiTeams[0];
                  if (homeApiTeam && homeApiTeam.teamName === match?.homeTeam?.name) {
                     teams.push(homeApiTeam);
                  } else if (match?.homeTeam?.players?.length) {
                     teams.push({ teamName: match.homeTeam.name, shortName: match.homeTeam.shortName, players: match.homeTeam.players });
                  } else if (homeApiTeam) {
                     teams.push(homeApiTeam);
                  } else {
                     teams.push({ teamName: match?.homeTeam?.name || "Team 1", shortName: match?.homeTeam?.shortName || "T1", players: [] });
                  }

                  // Extract Team 2 (Away)
                  const awayApiTeam = apiTeams.find((t: any) => t !== homeApiTeam);
                  if (awayApiTeam) {
                     teams.push(awayApiTeam);
                  } else if (match?.awayTeam?.players?.length) {
                     teams.push({ teamName: match.awayTeam.name, shortName: match.awayTeam.shortName, players: match.awayTeam.players });
                  } else {
                     teams.push({ teamName: match?.awayTeam?.name || "Team 2", shortName: match?.awayTeam?.shortName || "T2", players: [] });
                  }

                  return (
                     <div className="bg-card border border-border rounded-[2.5rem] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-5xl mx-auto relative overflow-hidden">
                        {/* Subtle background decoration */}
                        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-border/30 pb-10 relative z-10">
                           {/* Team 1 Header */}
                           <div className="flex items-center gap-5 w-full md:w-[40%] justify-center md:justify-start relative group cursor-default">
                              <div className="relative">
                                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors duration-500" />
                                 <TeamLogo logo={match?.homeTeam?.logo} name={teams[0]?.teamName || "Team 1"} size="lg" className="w-20 h-20 drop-shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105" />
                              </div>
                              <div className="text-center md:text-left">
                                 <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{teams[0]?.teamName}</h3>
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">{teams[0]?.shortName}</p>
                              </div>
                           </div>
                           
                           {/* VS Divider */}
                           <div className="w-full md:w-[20%] flex flex-col items-center justify-center relative">
                              <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/10 italic mb-3 drop-shadow-sm">VS</span>
                              <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-sm">Playing XI</span>
                           </div>
                           
                           {/* Team 2 Header */}
                           <div className="flex items-center gap-5 w-full md:w-[40%] justify-center md:justify-end md:flex-row-reverse text-center md:text-right relative group cursor-default">
                              <div className="relative">
                                 <div className="absolute inset-0 bg-football/20 blur-xl rounded-full group-hover:bg-football/30 transition-colors duration-500" />
                                 <TeamLogo logo={match?.awayTeam?.logo} name={teams[1]?.teamName || "Team 2"} size="lg" className="w-20 h-20 drop-shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105" />
                              </div>
                              <div>
                                 <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{teams[1]?.teamName}</h3>
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">{teams[1]?.shortName}</p>
                              </div>
                           </div>
                        </div>

                        {/* Players List */}
                        <div className="relative pt-6 pb-2">
                           {/* Central Vertical Line */}
                           <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent hidden md:block -translate-x-1/2" />
                           
                           <div className="space-y-3">
                           {Array.from({ length: Math.max(teams[0]?.players?.length || 0, teams[1]?.players?.length || 0, 11) }).map((_, i) => {
                              const p1 = teams[0]?.players?.[i];
                              const p2 = teams[1]?.players?.[i];
                              return (
                                 <div key={i} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 relative z-10 w-full group">
                                    
                                    {/* Team 1 Player */}
                                    <div className="flex-1 w-full flex justify-end">
                                       {p1 ? (
                                          <div className="relative flex items-center bg-gradient-to-r from-transparent to-secondary/40 pl-4 pr-10 md:pr-12 py-3 rounded-l-full border-r-4 border-primary/50 group-hover:border-primary transition-all cursor-default w-full md:w-[90%] justify-between md:justify-end overflow-hidden backdrop-blur-sm">
                                             <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                             <div className="flex items-center gap-4 relative z-10 w-full justify-between md:justify-end">
                                                <div className="md:absolute md:left-4 z-20 shrink-0">
                                                   <CricketPlayerImage playerId={p1.faceImageId || p1.id} playerName={p1.name} size={40} />
                                                </div>
                                                <div className="flex flex-col items-start md:items-end z-10 ml-12 md:ml-0">
                                                   <span className="font-bold text-foreground text-sm md:text-base tracking-tight">{p1.name}</span>
                                                   <div className="flex items-center gap-2 mt-0.5">
                                                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{p1.role || p1.position}</span>
                                                      {p1.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold shadow-sm">C</span>}
                                                      {p1.isKeeper && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold shadow-sm">WK</span>}
                                                   </div>
                                                </div>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="w-full md:w-[90%] opacity-0 hidden md:block" />
                                       )}
                                    </div>

                                    {/* Center Number Badge */}
                                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-background border-[3px] border-secondary flex items-center justify-center shadow-lg shrink-0 z-20 relative md:absolute md:left-1/2 md:-translate-x-1/2 group-hover:border-primary/50 group-hover:scale-110 transition-transform duration-300">
                                       <span className="font-black text-xs md:text-sm text-foreground/70">{i + 1}</span>
                                    </div>

                                    {/* Team 2 Player */}
                                    <div className="flex-1 w-full flex justify-start">
                                       {p2 ? (
                                          <div className="relative flex items-center bg-gradient-to-l from-transparent to-secondary/40 pr-4 pl-10 md:pl-12 py-3 rounded-r-full border-l-4 border-football/50 group-hover:border-football transition-all cursor-default w-full md:w-[90%] justify-between md:justify-start overflow-hidden backdrop-blur-sm">
                                             <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-football/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                             <div className="flex items-center gap-4 relative z-10 w-full justify-between md:justify-start flex-row-reverse md:flex-row">
                                                <div className="flex flex-col items-end md:items-start z-10 mr-12 md:mr-0">
                                                   <span className="font-bold text-foreground text-sm md:text-base tracking-tight">{p2.name}</span>
                                                   <div className="flex items-center gap-2 mt-0.5 flex-row-reverse md:flex-row">
                                                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">{p2.role || p2.position}</span>
                                                      {p2.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold shadow-sm">C</span>}
                                                      {p2.isKeeper && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold shadow-sm">WK</span>}
                                                   </div>
                                                </div>
                                                <div className="md:absolute md:right-4 z-20 shrink-0">
                                                   <CricketPlayerImage playerId={p2.faceImageId || p2.id} playerName={p2.name} size={40} align="right" />
                                                </div>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="w-full md:w-[90%] opacity-0 hidden md:block" />
                                       )}
                                    </div>
                                 </div>
                              );
                           })}
                           </div>
                        </div>
                     </div>
                  );
                })()
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

                      {(() => {
                        const inningsList = cbScorecardField.data.innings;
                        if (!inningsList || inningsList.length === 0) return null;
                        
                        const displayIndex = activeInningsIndex === -1 ? inningsList.length - 1 : activeInningsIndex;
                        const inn = inningsList[displayIndex];
                        if (!inn) return null;

                        return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
                            <div className="relative min-w-[250px]">
                              <select 
                                value={displayIndex} 
                                onChange={(e) => setActiveInningsIndex(Number(e.target.value))}
                                className="w-full bg-secondary border border-border text-foreground text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none hover:bg-secondary/80 pr-10"
                              >
                                {inningsList.map((inning: any, idx: number) => (
                                  <option key={idx} value={idx} className="bg-background text-foreground py-2">
                                    {inning.teamName || `Innings ${idx + 1}`} {inning.isDeclared ? '(d)' : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Score</span>
                              <span className="text-2xl sm:text-3xl font-mono font-black text-primary leading-none">
                                {inn.score}/{inn.wickets} <span className="text-sm text-muted-foreground font-medium ml-1">({inn.overs} ov)</span>
                              </span>
                            </div>
                          </div>

                          {/* Card-Based Batting Scorecard */}
                          <div className="pt-2 pb-8">
                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-4 px-1">Batting</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                              {(() => {
                                // Find the first two batsmen who are "batting" or "not out" - these are the active ones at the crease
                                const activeBatterIndices = (inn.batsmen || [])
                                  .map((b: any, idx: number) => {
                                    const rawDismissal = b.dismissal?.toLowerCase() || '';
                                    return (rawDismissal.includes('not out') || rawDismissal === 'batting' || rawDismissal === '') ? idx : -1;
                                  })
                                  .filter((idx: number) => idx !== -1)
                                  .slice(0, 2);

                                return inn.batsmen?.map((b: any, bIdx: number) => {
                                  const rawDismissal = b.dismissal?.toLowerCase() || '';
                                  const isEligibleNotOut = rawDismissal.includes('not out') || rawDismissal === 'batting' || rawDismissal === '';
                                  const isActiveAtCrease = activeBatterIndices.includes(bIdx);
                                  const isYetToBat = isEligibleNotOut && !isActiveAtCrease;
                                  
                                  const displayDismissal = isYetToBat ? "Yet to bat" : 
                                                          (isActiveAtCrease ? "Batting" : 
                                                          (b.dismissal || "Batting"));

                                  return (
                                  <div key={bIdx} className={cn(
                                    "bg-card/50 backdrop-blur-sm border rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group",
                                    isActiveAtCrease ? "border-primary/40 shadow-[0_4px_20px_rgba(var(--primary),0.1)]" : "border-border/40 shadow-sm"
                                  )}>
                                    {/* Subtle background glow for not out */}
                                    {isActiveAtCrease && <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-2xl rounded-full pointer-events-none"></div>}
                                    
                                    <div className="flex items-start gap-3 relative z-10">
                                      <CricketPlayerImage
                                        playerId={b.faceImageId || b.id}
                                        playerName={b.name}
                                        size={40}
                                        className="shrink-0 mt-0.5"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="flex flex-col min-w-0">
                                            <h4 className={cn("font-bold text-sm leading-tight break-words", isActiveAtCrease ? "text-foreground" : "text-foreground/80")}>{b.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-1">
                                              {isActiveAtCrease && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" title="Not Out"></span>}
                                              {b.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">C</span>}
                                              {b.isKeeper && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">WK</span>}
                                            </div>
                                          </div>
                                          <span className={cn("text-3xl font-black tracking-tighter leading-none shrink-0", isActiveAtCrease ? "text-primary" : "text-foreground")}>{b.runs}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className={cn("text-[10px] italic mt-3 mb-4 line-clamp-2 h-7 relative z-10 font-medium", 
                                      isYetToBat ? "text-muted-foreground/40" : "text-muted-foreground/70"
                                    )}>
                                      {displayDismissal}
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-1 text-center border-t border-border/20 pt-3 relative z-10">
                                      <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Balls</span><span className="font-mono text-xs font-bold text-foreground/90">{b.balls}</span></div>
                                      <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">4s</span><span className="font-mono text-xs font-medium text-muted-foreground">{b.fours}</span></div>
                                      <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">6s</span><span className="font-mono text-xs font-medium text-muted-foreground">{b.sixes}</span></div>
                                      <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">SR</span><span className="font-mono text-xs font-bold text-foreground/90">{b.strikeRate}</span></div>
                                    </div>
                                  </div>
                                )});
                              })()}
                            </div>
                          </div>

                          {/* Match Context Horizontal Bar */}
                          <div className="bg-secondary/10 border border-border/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
                             {/* Decorative background element */}
                             <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-secondary/30 to-transparent pointer-events-none"></div>

                            {inn.extras && (
                              <div className="flex items-center gap-3 relative z-10">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-bold bg-background/50 px-2 py-1 rounded">Extras</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-black text-foreground">{inn.extras.total ?? 0}</span>
                                  <span className="text-xs text-muted-foreground/60 font-medium tracking-wide">
                                    (b {inn.extras.byes ?? 0}, lb {inn.extras.legbyes ?? 0}, w {inn.extras.wides ?? 0}, nb {inn.extras.noballs ?? 0})
                                  </span>
                                </div>
                              </div>
                            )}

                            {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide relative z-10 flex-1 md:justify-end">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-bold bg-background/50 px-2 py-1 rounded shrink-0">Fall of Wickets</span>
                                <div className="flex items-center gap-3">
                                  {inn.fallOfWickets.map((f: any, fIdx: number) => (
                                    <div key={fIdx} className="flex items-center gap-1.5 shrink-0 bg-background/30 px-2.5 py-1 rounded-full border border-border/10">
                                      <span className="text-xs font-bold text-foreground/80">{f.score}/{f.wicketNum}</span>
                                      <span className="text-[10px] text-muted-foreground/60 max-w-[80px] truncate">{f.batsmanName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card-Based Bowling Scorecard */}
                          <div className="pt-8 pb-4">
                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-4 px-1">Bowling</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                              {inn.bowlers?.map((b: any, bIdx: number) => (
                                <div key={bIdx} className={cn(
                                  "bg-card/50 backdrop-blur-sm border rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group",
                                  parseInt(b.wickets) >= 3 ? "border-primary/40 shadow-[0_4px_20px_rgba(var(--primary),0.1)]" : "border-border/40 shadow-sm"
                                )}>
                                  {/* Subtle background glow for high wicket takers */}
                                  {parseInt(b.wickets) >= 3 && <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-2xl rounded-full"></div>}

                                  {/* Player photo + name + wickets row */}
                                  <div className="flex items-start gap-3 relative z-10">
                                    <CricketPlayerImage
                                      playerId={b.faceImageId || b.id}
                                      playerName={b.name}
                                      size={40}
                                      className="shrink-0 mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start gap-1">
                                        <div className="flex flex-col min-w-0">
                                          <h4 className="font-bold text-sm leading-tight break-words text-foreground/90">{b.name}</h4>
                                          {b.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold mt-1.5 inline-block w-max">C</span>}
                                        </div>
                                        <div className="flex flex-col items-end leading-none shrink-0">
                                           <span className={cn("text-3xl font-black tracking-tighter", parseInt(b.wickets) > 0 ? "text-primary" : "text-muted-foreground/50")}>{b.wickets}</span>
                                           <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest mt-1 font-bold">Wickets</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-4 gap-1 text-center border-t border-border/20 pt-3 mt-4 relative z-10">
                                    <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Overs</span><span className="font-mono text-xs font-bold text-foreground/90">{b.overs}</span></div>
                                    <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Runs</span><span className="font-mono text-xs font-bold text-foreground/90">{b.runs}</span></div>
                                    <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Mdns</span><span className="font-mono text-xs font-medium text-muted-foreground">{b.maidens}</span></div>
                                    <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Econ</span><span className="font-mono text-xs font-bold text-foreground/90">{b.economy}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        );
                      })()}
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
