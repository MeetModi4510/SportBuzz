import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LiveBadge } from "@/components/LiveBadge";
import { SportIcon, getSportGradient } from "@/components/SportIcon";
import { TeamLogo } from "@/components/TeamLogo";
import { matches, players } from "@/data/mockData";
import { useCricketMatchDetails, useCricketMatchSquads, useCricbuzzSummary, useCricbuzzInfo, useAllCricketMatches } from "@/hooks/useCricketMatches";
import { useQueryClient } from "@tanstack/react-query";
import { useCricketDataMatch, useCricbuzzSquads } from "@/hooks/useCricketDataMatch";
import { useMatchFieldData } from "@/hooks/useMatchFieldData";
import { useFotmobLineups } from "@/hooks/football/useFotmobLineups";
import { cn, formatScoreString, formatOversText } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Shield,
  Monitor,
  Calendar
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadsList } from "@/components/SquadsList";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FootballPitchLineup } from "@/components/FootballPitchLineup";
import { CricketPlayerImage } from "@/components/CricketPlayerImage";
import { formatPlayerName } from "@/lib/playerNames";
import { SquadsTab } from "@/components/cricket/SquadsTab";
import { PlayerProfilePanel } from "@/components/cricket/PlayerProfilePanel";
import type { Match } from "@/data/types";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cricketApi } from '@/services/api';
import { PreMatchForecast } from '@/components/PreMatchForecast';
import { favoritesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const MatchPerformanceLab = lazy(() => import("@/components/MatchPerformanceLab"));
const CricketPerformanceLab = lazy(() => import("@/components/CricketPerformanceLab"));
const GraphsTab = lazy(() => import("@/components/cricket/GraphsTab").then(m => ({ default: m.GraphsTab })));

/** Safely converts any value to a renderable string. Prevents "Objects are not valid as React child" errors. */
const safeStr = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    // Handle common venue-like objects
    return val.name || val.ground || val.city || fallback;
  }
  return String(val) || fallback;
};

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const { data: fieldData } = useMatchFieldData(id);

  const [activeTab, setActiveTab] = useState('summary');
  const [activeInningsTab, setActiveInningsTab] = useState<number | 'preview'>(-1);
  const [activeInningsIndex, setActiveInningsIndex] = useState<number>(-1);
  const [activeCommentaryInningsId, setActiveCommentaryInningsId] = useState<number | 'all'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');

  // Reset tab & index when navigating to a different match
  useEffect(() => {
    setActiveTab('summary');
    setActiveInningsIndex(-1);
    setActiveCommentaryInningsId('all');
  }, [id]);

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
  }; useEffect(() => {
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
  // Cricbuzz matches are purely numeric (e.g. 129563)
  const isNumeric = id && /^\d+$/.test(id);
  const isCricketMatch = id?.includes("cricket") || id?.startsWith("c") || isNumeric || (id && id.includes("-") && id.length > 20);
  const isFootballMatch = id?.startsWith("football-") || id?.startsWith("f") && !isCricketMatch;

  const { lineupData: fotmobLineups } = useFotmobLineups(undefined, undefined, !isCricketMatch);

  // -- Cricket Hooks --
  const {
    data: cricketDataMatch,
    loading: cricketDataLoading
  } = useCricketDataMatch(id, true);

  const {
    data: legacyCricketMatch,
    isLoading: legacyLoading
  } = useCricketMatchDetails(isCricketMatch ? id?.replace("cricket-", "") : undefined);

  // -- Football Hook --
  // Football matches now route to /football/match/:id.
  const footballMatchData = undefined;
  const footballLoading = false;

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
  const isValidMatch = (m: any) => m && (m.id || m.matchId || m.homeTeam);
  const match: Match | undefined = [cricketDataMatch, legacyCricketMatch, footballMatch, mockMatch].find(isValidMatch) as Match | undefined;
  let isTestMatch = match?.matchType?.toLowerCase().includes("test") || (match as any)?.format?.toLowerCase().includes("test");

  const statusLower = match?.status?.toLowerCase();
  let isLive = statusLower === "live";
  let isCompleted = statusLower === "completed";
  let isUpcoming = statusLower === "upcoming";

  // Lazy-loading field data with 10-min TTL cache
  // IMPORTANT: These hooks MUST be called before any early returns
  const cleanMatchId = isCricketMatch ? id?.replace('cricket-', '') : undefined;

  // Dynamic Live Summary & Match Facts (Fetch unconditionally for live headers)
  const { data: cbSummary, isLoading: isSummaryLoading, dataUpdatedAt: summaryUpdatedAt } = useCricbuzzSummary(
    isCricketMatch ? cleanMatchId : undefined
  );

  // Force-refetch summary each time user navigates to this match page.
  // This ensures the header score is never stale vs the dashboard card.
  useEffect(() => {
    if (cleanMatchId && isCricketMatch) {
      queryClient.refetchQueries({ queryKey: ['cricket', 'summary', cleanMatchId] });
    }
  }, [cleanMatchId, isCricketMatch, queryClient]);

  // -- Helper to calculate balls bowled from overs string (e.g. "11.4" -> 70) --
  const parseBalls = useCallback((overStr: string | number | undefined): number => {
    if (!overStr) return 0;
    const str = String(overStr);
    const match = str.match(/(\d+)\.?(\d*)/);
    if (!match) return 0;
    const overs = parseInt(match[1]) || 0;
    const balls = parseInt(match[2]) || 0;
    return overs * 6 + balls;
  }, []);

  // Calculate target balls from summary (Master Target)
  let summaryBalls = 0;
  if (cbSummary?.miniscore?.overs) {
    summaryBalls = parseBalls(cbSummary.miniscore.overs);
  } else if (cbSummary?.matchScore?.team1Score?.inngs1?.overs) {
    summaryBalls = Math.max(
      parseBalls(cbSummary.matchScore.team1Score.inngs1.overs),
      parseBalls(cbSummary.matchScore.team2Score?.inngs1?.overs)
    );
  }

  // Local sync triggers for the catch-up polling loop
  const [scorecardSyncTrigger, setScorecardSyncTrigger] = useState<number | undefined>(undefined);
  const [commentarySyncTrigger, setCommentarySyncTrigger] = useState<number | undefined>(undefined);
  const [oversBalls, setOversBalls] = useState(0);
  const summaryRetries = useRef(0);
  const scorecardRetries = useRef(0);
  const commentaryRetries = useRef(0);

  // Sync to master timer initially
  useEffect(() => {
    setScorecardSyncTrigger(summaryUpdatedAt);
    setCommentarySyncTrigger(summaryUpdatedAt);
    summaryRetries.current = 0;
    scorecardRetries.current = 0;
    commentaryRetries.current = 0;
  }, [summaryUpdatedAt]);

  const matchInfoField = useMatchFieldData(
    isCricketMatch ? cleanMatchId : undefined,
    'matchInfo',
    activeTab === 'summary' || activeTab === 'scoreboard' || activeTab === 'lineups',
    undefined,
    summaryUpdatedAt
  );
  const commentaryField = useMatchFieldData(
    isCricketMatch ? cleanMatchId : undefined,
    'commentary',
    activeTab === 'commentary',
    undefined,
    commentarySyncTrigger
  );

  // Cricbuzz lazy-loading hooks
  // Build Cricbuzz URL slug from available match info.
  // e.g. "eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026"
  // The server will auto-resolve the slug if this derivation is wrong.
  const cricbuzzSlug = (() => {
    const t1 = (match?.homeTeam?.shortName || '').toLowerCase().replace(/\s+/g, '-');
    const t2 = (match?.awayTeam?.shortName || '').toLowerCase().replace(/\s+/g, '-');
    const mType = (match?.matchType || '').toLowerCase().replace(/\s+/g, '-');
    if (!t1 || !t2 || !mType) return undefined;
    // Build a minimal slug: "{t1}-vs-{t2}-{matchType}"
    return `${t1}-vs-${t2}-${mType}`.replace(/[^a-z0-9-]/g, '');
  })();

  // Build a full commentary slug that matches Cricbuzz's URL format:
  // e.g. "eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026"
  // We try to use the match id from the URL itself as it's most accurate
  const commentarySlug = (() => {
    // If this is a Cricbuzz match (numeric ID), we can build a slug from match data
    if (!cleanMatchId || !isCricketMatch) return undefined;
    const t1 = (match?.homeTeam?.shortName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const t2 = (match?.awayTeam?.shortName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const mType = (match?.matchType || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!t1 || !t2) return cricbuzzSlug;
    // Return minimal slug – server will auto-resolve
    return `${t1}-vs-${t2}${mType ? `-${mType}` : ''}`.replace(/[^a-z0-9-]/g, '');
  })();

  const cbScorecardField = useMatchFieldData(
    cleanMatchId,
    'cbScorecard',
    activeTab === 'scoreboard' || activeTab === 'performance',
    cricbuzzSlug,
    scorecardSyncTrigger
  );
  const cbSquadsField = useMatchFieldData(
    cleanMatchId,
    'cbSquads',
    activeTab === 'squads',
    undefined,
    summaryUpdatedAt
  );

  const { squads, squadsLoading, squadsError } = useCricbuzzSquads(cleanMatchId, activeTab === 'squads' || activeTab === 'scoreboard' || activeTab === 'performance');

  const getPlayerImageId = (playerName: string) => {
    if (!squads || !playerName) return undefined;

    let allPlayers: any[] = [];
    if (squads.team1) {
      if (Array.isArray(squads.team1['playing XI'])) allPlayers.push(...squads.team1['playing XI']);
      if (Array.isArray(squads.team1.bench)) allPlayers.push(...squads.team1.bench);
    }
    if (squads.team2) {
      if (Array.isArray(squads.team2['playing XI'])) allPlayers.push(...squads.team2['playing XI']);
      if (Array.isArray(squads.team2.bench)) allPlayers.push(...squads.team2.bench);
    }

    const match = allPlayers.find((p: any) => p?.name && (p.name.toLowerCase().includes(playerName.toLowerCase()) || playerName.toLowerCase().includes(p.name.toLowerCase())));
    return match?.imageDetails?.imageId || undefined;
  };
  const cbCommentaryField = useMatchFieldData(
    cleanMatchId,
    'cbCommentary',
    activeTab === 'commentary',
    undefined,
    commentarySyncTrigger
  );

  // -- Full Commentary from Cricbuzz HTML page scraper -----------------------
  const cbFullCommentaryField = useMatchFieldData(
    isCricketMatch ? cleanMatchId : undefined,
    'cbFullCommentary',
    activeTab === 'commentary',
    commentarySlug,
    commentarySyncTrigger
  );

  // -- Compute Balls for Scorecard and Commentary --
  let scorecardBalls = 0;
  if (cbScorecardField.data?.innings?.length > 0) {
    const latestInn = cbScorecardField.data.innings[cbScorecardField.data.innings.length - 1];
    const sd = latestInn?.scoreDetails || latestInn;
    const targetOvers = latestInn.overs ?? sd?.overs ?? sd?.teamOvs;
    if (targetOvers !== undefined && targetOvers !== null && targetOvers !== '') {
      scorecardBalls = parseBalls(targetOvers);
    }
  }

  let commentaryBalls = 0;
  if (cbFullCommentaryField.data) {
    const rawComm = cbFullCommentaryField.data;
    // Shape 1: { commentary: [...flatArray...], matchHeader: {...} }  ΓåÉ actual scraper output
    // Shape 2: { commentary: [{ commentaryList: [...] }] }            ΓåÉ legacy nested shape
    // Shape 3: [...flatArray...]                                       ΓåÉ array directly
    let commEntries: any[] = [];

    if (Array.isArray(rawComm)) {
      // Shape 3
      commEntries = rawComm;
    } else if (Array.isArray(rawComm?.commentary)) {
      const first = rawComm.commentary[0];
      if (Array.isArray(first?.commentaryList)) {
        // Shape 2 – nested
        commEntries = first.commentaryList;
      } else {
        // Shape 1 – flat (actual scraper output)
        commEntries = rawComm.commentary;
      }
    }

    // Find the entry with the highest overNum – that is the latest ball
    let maxOverBalls = 0;
    for (const c of commEntries) {
      if (c.overNum !== undefined && c.overNum !== null) {
        // overNum from the scraper is integer (e.g. 53), ballNbr is the ball within the over
        const entryBalls = (parseInt(String(c.overNum)) * 6) + (parseInt(String(c.ballNbr ?? 0)) || 0);
        if (entryBalls > maxOverBalls) maxOverBalls = entryBalls;
      }
    }
    commentaryBalls = maxOverBalls;
  }

  // -- Global Mismatch Detector --
  // A mismatch exists whenever ANY two of the three live sources disagree.
  // This is tab-independent: even if the user is on Commentary and it is ahead
  // of the header, we must detect it and force the header to catch up.
  const hasMismatch = isLive && (() => {
    const hasSummary = summaryBalls > 0;
    const hasScorecard = scorecardBalls > 0;
    const hasCommentary = commentaryBalls > 0;
    const hasOvers = activeTab === 'graphs' && oversBalls > 0;

    // Commentary vs Header (the exact case in the screenshot)
    if (hasSummary && hasCommentary && summaryBalls !== commentaryBalls) return true;
    // Scorecard vs Header
    if (hasSummary && hasScorecard && summaryBalls !== scorecardBalls) return true;
    // Commentary vs Scorecard
    if (hasScorecard && hasCommentary && scorecardBalls !== commentaryBalls) return true;
    // Overs vs Header
    if (hasSummary && hasOvers && summaryBalls !== oversBalls) return true;

    return false;
  })();

  const globalRetries = useRef(0);
  const lastCatchupTime = useRef(0);
  // Track the "signature" of the last mismatch to reset retries on genuinely new events
  const lastMismatchSig = useRef('');

  useEffect(() => {
    if (!hasMismatch) {
      globalRetries.current = 0;
      lastMismatchSig.current = '';
      return;
    }

    // Build a signature: the MAX ball count across all sources.
    // When a new ball is bowled, this number increases ΓåÆ new event ΓåÆ reset retries.
    const sig = `${Math.max(summaryBalls, scorecardBalls, commentaryBalls, oversBalls)}`;
    if (sig !== lastMismatchSig.current) {
      // Genuinely new event – reset retry counter
      globalRetries.current = 0;
      lastMismatchSig.current = sig;
    }

    if (globalRetries.current >= 3) return;

    // Throttle: at least 1 second between catch-up attempts
    const timeSinceLast = Date.now() - lastCatchupTime.current;
    const delay = Math.max(1000, 1000 - timeSinceLast);

    console.log(`[Catch-Up] Mismatch sig=${sig}. summary=${summaryBalls}, scorecard=${scorecardBalls}, commentary=${commentaryBalls}. Attempt ${globalRetries.current + 1}/3 in ${delay}ms`);

    const timer = setTimeout(async () => {
      globalRetries.current++;
      lastCatchupTime.current = Date.now();

      try {
        // 1. ALWAYS force-refetch the Header (Summary)
        if (cleanMatchId) {
          queryClient.invalidateQueries({ queryKey: ['cricket', 'summary', cleanMatchId] });
          // Also do a direct force-fetch to bypass server cache
          cricketApi.getCricbuzzSummary(cleanMatchId, true)
            .then((res: any) => {
              const freshData = res?.data ?? res;
              if (freshData && (freshData.miniscore || freshData.matchScore || freshData.matchHeader)) {
                queryClient.setQueryData(['cricket', 'summary', cleanMatchId], freshData);
              }
            })
            .catch(e => console.error('[Catch-Up] Summary refetch failed', e));
        }

        // 2. Refetch the active tab's data source so IT also catches up
        if (activeTab === 'scoreboard' || activeTab === 'performance') {
          setScorecardSyncTrigger(Date.now());
        } else if (activeTab === 'commentary') {
          setCommentarySyncTrigger(Date.now());
        } else if (activeTab === 'graphs') {
          // Graphs tab: refresh scorecard (for innings list) — ball map has its own sync via summaryUpdatedAt
          setScorecardSyncTrigger(Date.now());
        } else {
          // On Summary/Squads tabs, refresh scorecard (header reads from it for Test innings)
          setScorecardSyncTrigger(Date.now());
        }
      } catch (e) {
        console.error('[Catch-Up] Trigger failed', e);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [hasMismatch, summaryBalls, scorecardBalls, commentaryBalls, activeTab, cleanMatchId, queryClient]);



  const { data: cbInfo, isLoading: isInfoLoading } = useCricbuzzInfo(
    isCricketMatch ? cleanMatchId : undefined,
    !!cbSummary
  );

  // --- Dynamic Values extracted from Live API for Header ---
  const dynamicMatchInfo = cbInfo?.matchInfo || cbSummary?.matchHeader?.matchInfo || cbSummary?.matchInfo;

  const allMatchText = [
    dynamicMatchInfo?.seriesName,
    match?.tournament?.name,
    (match as any)?.name,
    (match as any)?.seriesName,
    cbInfo?.extraInfo?.Match,
    cbInfo?.matchInfo?.matchDesc,
    cbSummary?.matchHeader?.matchInfo?.seriesName
  ].filter(Boolean).join(" ").toLowerCase();

  const isIPL = allMatchText.includes('ipl') || allMatchText.includes('indian premier league');

  const dynamicVenueStr = dynamicMatchInfo?.venueInfo?.ground
    ? `${dynamicMatchInfo.venueInfo.ground}${dynamicMatchInfo.venueInfo.city ? `, ${dynamicMatchInfo.venueInfo.city}` : ''}`
    : typeof match?.venue === 'object' ? (match?.venue?.name || (match?.venue as any)?.ground || match?.venue?.city || "Unknown Venue") : match?.venue || "Unknown Venue";

  let parsedMs = dynamicMatchInfo?.matchStartTimestamp ? parseInt(dynamicMatchInfo.matchStartTimestamp) : undefined;
  if (!parsedMs && dynamicMatchInfo?.startDate) {
    parsedMs = parseInt(dynamicMatchInfo.startDate);
  }

  if (parsedMs && parsedMs < 10000000000) { // If it's less than 10 billion, it's definitely in seconds
    parsedMs *= 1000;
  }
  let dynamicStartTimeMs: any = parsedMs || match?.startTime;

  // If it's a Date object, extract the milliseconds
  if (dynamicStartTimeMs instanceof Date) {
    dynamicStartTimeMs = dynamicStartTimeMs.getTime();
  }

  // If it's STILL in seconds (less than 10 billion, which is year 1970), multiply by 1000
  if (typeof dynamicStartTimeMs === 'number' && dynamicStartTimeMs > 0 && dynamicStartTimeMs < 10000000000) {
    dynamicStartTimeMs *= 1000;
  }

  if (dynamicStartTimeMs === 0 || dynamicStartTimeMs === "0") {
    dynamicStartTimeMs = undefined;
  }

  const dynamicTimeStr = match?.displayTime && (match?.sport === 'cricket' || match?.sport === 'football')
    ? match.displayTime
    : (dynamicStartTimeMs && !isNaN(new Date(dynamicStartTimeMs).getTime())
      ? format(new Date(dynamicStartTimeMs), "MMM d, yyyy • h:mm a")
      : "Time TBA");

  if (dynamicMatchInfo?.matchFormat?.toUpperCase() === 'TEST') {
    isTestMatch = true;
  }

  const tossObj = cbInfo?.tossResults || cbSummary?.tossResults || cbInfo?.matchInfo?.tossResults || cbSummary?.matchInfo?.tossResults;
  const u1 = cbInfo?.umpire1 || cbSummary?.umpire1 || cbInfo?.matchInfo?.umpire1 || cbSummary?.matchInfo?.umpire1;
  const u2 = cbInfo?.umpire2 || cbSummary?.umpire2 || cbInfo?.matchInfo?.umpire2 || cbSummary?.matchInfo?.umpire2;
  const ref = cbInfo?.referee || cbSummary?.referee || cbInfo?.matchInfo?.referee || cbSummary?.matchInfo?.referee;
  const tossWinner = tossObj?.tossWinnerName;
  const tossChoice = tossObj?.decision;

  const dynamicTeam1 = dynamicMatchInfo?.team1;
  const dynamicTeam2 = dynamicMatchInfo?.team2;

  // -- Cache lookup: read listing data already stored by the dashboard -------------
  // The summary endpoint has no imageId on team objects and its team1/team2 order
  // may differ from the listing.  The listing cache is authoritative for completed
  // matches: same source the dashboard card used, guaranteed correct home/away order.
  const location = useLocation();
  const { data: allMatches } = useAllCricketMatches();
  
  const cachedListingMatch = (() => {
    if (!cleanMatchId) return null;

    // 1. Check router state (fastest, from dashboard click)
    const stateMatch = location.state?.match;
    if (stateMatch && String(stateMatch.id) === String(cleanMatchId)) {
      return stateMatch;
    }

    // 2. Check allMatches which actively fetches if cache is empty (handles hard reload)
    if (Array.isArray(allMatches)) {
      const found = allMatches.find((m: any) => String(m.id) === String(cleanMatchId));
      if (found) return found;
    }

    // 3. Fallback to manual query client check
    for (const key of [
      ['cricket', 'matches', 'live'],
      ['cricket', 'matches', 'recent'],
      ['cricket', 'matches', 'upcoming'],
    ]) {
      const list = queryClient.getQueryData<any[]>(key);
      if (Array.isArray(list)) {
        const found = list.find((m: any) => String(m.id) === String(cleanMatchId));
        if (found) return found;
      }
    }
    return null;
  })();

  const cachedIsCompleted = cachedListingMatch?.status === 'completed';

  // -- Team names & logos --------------------------------------------------------
  // For completed matches: use listing cache as ground truth (correct order + imageId).
  // For live/upcoming:     use cbSummary / match as before – never touches this branch.
  const team1Name = cachedIsCompleted
    ? (cachedListingMatch?.homeTeam?.name || dynamicTeam1?.teamName || match?.homeTeam?.name || 'Team 1')
    : (dynamicTeam1?.teamName || match?.homeTeam?.name || 'Team 1');

  const team1ShortName = cachedIsCompleted
    ? (cachedListingMatch?.homeTeam?.shortName || dynamicTeam1?.teamSName || match?.homeTeam?.shortName || 'T1')
    : (dynamicTeam1?.teamSName || match?.homeTeam?.shortName || 'T1');

  // Logos: for completed matches the listing cache has the imageId-based URL.
  // TeamLogo handles all rendering: local maps ΓåÆ flagcdn ΓåÆ proxy URL ΓåÆ text fallback.
  const team1Logo = cachedIsCompleted
    ? (cachedListingMatch?.homeTeam?.logo || match?.homeTeam?.logo || '')
    : ((dynamicTeam1?.imageId ? `/api/cricket/scraped/team-logo/${dynamicTeam1.imageId}` : '') || match?.homeTeam?.logo || '');

  const team2Name = cachedIsCompleted
    ? (cachedListingMatch?.awayTeam?.name || dynamicTeam2?.teamName || match?.awayTeam?.name || 'Team 2')
    : (dynamicTeam2?.teamName || match?.awayTeam?.name || 'Team 2');

  const team2ShortName = cachedIsCompleted
    ? (cachedListingMatch?.awayTeam?.shortName || dynamicTeam2?.teamSName || match?.awayTeam?.shortName || 'T2')
    : (dynamicTeam2?.teamSName || match?.awayTeam?.shortName || 'T2');

  const team2Logo = cachedIsCompleted
    ? (cachedListingMatch?.awayTeam?.logo || match?.awayTeam?.logo || '')
    : ((dynamicTeam2?.imageId ? `/api/cricket/scraped/team-logo/${dynamicTeam2.imageId}` : '') || match?.awayTeam?.logo || '');

  // -- Scores --------------------------------------------------------------------
  // For completed matches: seed immediately from the cached listing (same as dashboard).
  // Then, if cbSummary arrives, override using batTeamName matching – NOT array index –
  // because innings[0] is the team that batted first, which may be team1 OR team2.
  let dynamicHomeScoreStr: string | undefined =
    cachedIsCompleted && cachedListingMatch?.homeScore ? String(cachedListingMatch.homeScore) : undefined;
  let dynamicAwayScoreStr: string | undefined =
    cachedIsCompleted && cachedListingMatch?.awayScore ? String(cachedListingMatch.awayScore) : undefined;

  if (cbSummary) {
    const ms = cbSummary.matchScore || cbSummary.inningsScoreList || cbSummary.miniscore?.matchScoreDetails?.inningsScoreList;
    if (ms) {
      if (Array.isArray(ms)) {
        if (isCompleted) {
          // -- Completed match: assign by team name matching, not by array index --
          // innings[i].batTeamName tells us WHICH team batted in that innings.
          // team1Name/team2Name are already correctly set.
          const scoreForTeam = (teamName: string): string | undefined => {
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
            const tn = norm(teamName);
            // Collect ALL innings for this team (Test match may have 2)
            const innings = ms.filter((inn: any) => {
              const bt = norm(inn.batTeamName || inn.batTeamShortName || '');
              return bt && (bt.includes(tn.slice(0, 3)) || tn.includes(bt.slice(0, 3)));
            });
            if (!innings.length) return undefined;
            return innings.map((inn: any) =>
              `${inn.score ?? inn.runs ?? 0}/${inn.wickets ?? 0}${inn.overs ? ` (${inn.overs} ov)` : ''}`
            ).join(' & ');
          };
          const h = scoreForTeam(team1Name);
          const a = scoreForTeam(team2Name);
          if (h) dynamicHomeScoreStr = h;
          if (a) dynamicAwayScoreStr = a;
        } else {
          // Live/upcoming: use array index as before (team1 = index 0, team2 = index 1)
          const inn1 = ms[0];
          const inn2 = ms[1];
          if (inn1) dynamicHomeScoreStr = `${inn1.score}/${inn1.wickets || 0}${inn1.overs ? ` (${inn1.overs} ov)` : ''}`;
          if (inn2) dynamicAwayScoreStr = `${inn2.score}/${inn2.wickets || 0}${inn2.overs ? ` (${inn2.overs} ov)` : ''}`;
        }
      } else {
        const t1 = ms.team1Score?.inngs1;
        const t2 = ms.team2Score?.inngs1;
        if (t1) dynamicHomeScoreStr = `${t1.runs}/${t1.wickets || 0}${t1.overs ? ` (${t1.overs} ov)` : ''}`;
        if (t2) dynamicAwayScoreStr = `${t2.runs}/${t2.wickets || 0}${t2.overs ? ` (${t2.overs} ov)` : ''}`;
      }
    }
  }


  let reconciledStatusText = dynamicMatchInfo?.status || match?.summaryText;

  // Commentary reconciliation: if Commentary is the freshest, use its match status
  if (cbFullCommentaryField.data?.matchHeader?.status && commentaryBalls >= summaryBalls && commentaryBalls >= scorecardBalls) {
    reconciledStatusText = cbFullCommentaryField.data.matchHeader.status;
  }

  let reconciledInningsScores = cachedIsCompleted && cachedListingMatch?.inningsScores?.length
    ? [...cachedListingMatch.inningsScores]
    : (match?.inningsScores ? [...match.inningsScores] : []);

  // For live/upcoming Test matches, fallback to manually parsing cbSummary if match.inningsScores is insufficient
  if (isTestMatch && cbSummary && !cachedIsCompleted) {
    const summaryInnings: any[] = [];
    const ms = cbSummary.matchScore || cbSummary.inningsScoreList || cbSummary.miniscore?.matchScoreDetails?.inningsScoreList;

    if (ms) {
      if (Array.isArray(ms)) {
        // Assume array has max 4 innings for test match
        const homeInns = ms.filter(i => i.batTeamId === dynamicTeam1?.teamId || i.batTeamName === dynamicTeam1?.teamSName);
        const awayInns = ms.filter(i => i.batTeamId === dynamicTeam2?.teamId || i.batTeamName === dynamicTeam2?.teamSName);

        if (homeInns[0]) summaryInnings.push({ team: 'home', score: `${homeInns[0].score}/${homeInns[0].wickets || 0}`, overs: homeInns[0].overs });
        if (homeInns[1]) summaryInnings.push({ team: 'home', score: `${homeInns[1].score}/${homeInns[1].wickets || 0}`, overs: homeInns[1].overs });
        if (awayInns[0]) summaryInnings.push({ team: 'away', score: `${awayInns[0].score}/${awayInns[0].wickets || 0}`, overs: awayInns[0].overs });
        if (awayInns[1]) summaryInnings.push({ team: 'away', score: `${awayInns[1].score}/${awayInns[1].wickets || 0}`, overs: awayInns[1].overs });
      } else {
        if (ms.team1Score?.inngs1) summaryInnings.push({ team: 'home', score: `${ms.team1Score.inngs1.runs}/${ms.team1Score.inngs1.wickets || 0}`, overs: ms.team1Score.inngs1.overs });
        if (ms.team1Score?.inngs2) summaryInnings.push({ team: 'home', score: `${ms.team1Score.inngs2.runs}/${ms.team1Score.inngs2.wickets || 0}`, overs: ms.team1Score.inngs2.overs });

        if (ms.team2Score?.inngs1) summaryInnings.push({ team: 'away', score: `${ms.team2Score.inngs1.runs}/${ms.team2Score.inngs1.wickets || 0}`, overs: ms.team2Score.inngs1.overs });
        if (ms.team2Score?.inngs2) summaryInnings.push({ team: 'away', score: `${ms.team2Score.inngs2.runs}/${ms.team2Score.inngs2.wickets || 0}`, overs: ms.team2Score.inngs2.overs });
      }
    }

    if (summaryInnings.length > 0 && summaryInnings.length >= reconciledInningsScores.length) {
      reconciledInningsScores = summaryInnings;
    }
  }

  // Scorecard reconciliation: if Scoreboard tab has fresher data (higher run count OR higher ball count),
  // update the header score so both always match. Cricket scores only go up.
  if (!isCompleted && cbScorecardField.data?.innings?.length > 0) {
    const latestInn = cbScorecardField.data.innings[cbScorecardField.data.innings.length - 1];
    const sd = latestInn?.scoreDetails || latestInn;
    const scRuns = latestInn?.score ?? sd?.runs ?? sd?.teamScore;
    const scWkts = latestInn?.wickets ?? sd?.wickets ?? sd?.teamWkts ?? 0;
    const scOvs = latestInn?.overs ?? sd?.overs ?? sd?.teamOvs ?? '';
    const scTeamName = (latestInn?.teamName || latestInn?.batTeamDetails?.batTeamName || '').toLowerCase();
    if (scRuns !== undefined) {
      const scStr = `${scRuns}/${scWkts} (${scOvs} ov)`;
      // Determine if latest innings is home or away
      const homeMatch = scTeamName && team1Name && scTeamName.includes(team1Name.toLowerCase().split(' ')[0]);
      const existingRuns = parseInt((homeMatch ? dynamicHomeScoreStr : dynamicAwayScoreStr) || '0');

      // ALWAYS Rebuild Test Match Innings if we have Scorecard data
      if (isTestMatch) {
        reconciledInningsScores = cbScorecardField.data.innings.map((inn: any) => {
          const iSd = inn?.scoreDetails || inn;
          const iRuns = inn?.score ?? iSd?.runs ?? iSd?.teamScore ?? 0;
          const iWkts = inn?.wickets ?? iSd?.wickets ?? iSd?.teamWkts ?? 0;
          const iOvs = inn?.overs ?? iSd?.overs ?? iSd?.teamOvs ?? '';
          const iTeamName = (inn?.teamName || inn?.batTeamDetails?.batTeamName || '').toLowerCase();
          const iHome = iTeamName && team1Name && iTeamName.includes(team1Name.toLowerCase().split(' ')[0]);
          return {
            team: iHome ? 'home' : 'away',
            score: `${iRuns}/${iWkts}`,
            overs: iOvs
          };
        });
      }

      // If Scorecard is fresher (runs OR balls are higher), or if they are equal but we are viewing Scoreboard
      if (scRuns > existingRuns || scorecardBalls > summaryBalls || (scRuns === existingRuns && activeTab === 'scoreboard')) {
        // Only actually overwrite the score if Scorecard is truly ahead
        if (scRuns > existingRuns || scorecardBalls > summaryBalls) {
          if (homeMatch) dynamicHomeScoreStr = scStr;
          else dynamicAwayScoreStr = scStr;
        }
        if (cbScorecardField.data?.status && scorecardBalls >= summaryBalls && scorecardBalls >= commentaryBalls) {
          reconciledStatusText = cbScorecardField.data.status;
        }
      }
    }
  }

  // Commentary Regex Replacement: If Commentary is the absolute freshest (ahead of both Summary AND Scorecard),
  // we manually inject its updated ball count into the Header string, because Commentary lacks a native Score string!
  if (commentaryBalls > summaryBalls && commentaryBalls > scorecardBalls) {
    const newOverStr = `${Math.floor(commentaryBalls / 6)}.${commentaryBalls % 6}`;

    // Build a list of all the old over strings we might need to replace
    // Each could appear as "53.0" (decimal) or just "53" (whole number from miniscore)
    const oldStrings: string[] = [];
    const addOldStr = (balls: number) => {
      const dec = `${Math.floor(balls / 6)}.${balls % 6}`;
      const whole = `${Math.floor(balls / 6)}`;
      oldStrings.push(dec);
      // Only add whole-number variant if it won't greedily match inside a larger number
      if (!oldStrings.includes(whole)) oldStrings.push(whole);
    };
    addOldStr(summaryBalls);
    addOldStr(scorecardBalls);

    const replaceOvers = (str: string | undefined): string | undefined => {
      if (!str) return str;
      for (const old of oldStrings) {
        // Use word-boundary-like regex to avoid replacing "53" inside "530" etc.
        const pattern = new RegExp(`(\\b|(?<=\\())(${old.replace('.', '\\.')})(?=(\\s*ov|\\s*Ov|\\)|$))`, 'g');
        if (pattern.test(str)) {
          return str.replace(pattern, newOverStr);
        }
      }
      return str;
    };

    dynamicHomeScoreStr = replaceOvers(dynamicHomeScoreStr);
    dynamicAwayScoreStr = replaceOvers(dynamicAwayScoreStr);

    // Reconcile Test Matches
    if (isTestMatch) {
      reconciledInningsScores = reconciledInningsScores.map(inn => ({
        ...inn,
        overs: replaceOvers(String(inn.overs || '')) ?? inn.overs
      }));
    }
  }

  // Fallback to match object ONLY IF cbSummary hasn't produced a score
  if (!dynamicHomeScoreStr) {
    if (match?.inningsScores && Array.isArray(match.inningsScores) && match.inningsScores.some((i: any) => i.team === 'home')) {
      const homeInn = match.inningsScores.filter((i: any) => i.team === 'home').pop();
      if (homeInn && homeInn.score) dynamicHomeScoreStr = `${homeInn.score}${homeInn.overs ? ` (${homeInn.overs} ov)` : ''}`;
    } else if (match?.homeScore) {
      dynamicHomeScoreStr = match.homeScore;
    }
  }

  if (!dynamicAwayScoreStr) {
    if (match?.inningsScores && Array.isArray(match.inningsScores) && match.inningsScores.some((i: any) => i.team === 'away')) {
      const awayInn = match.inningsScores.filter((i: any) => i.team === 'away').pop();
      if (awayInn && awayInn.score) dynamicAwayScoreStr = `${awayInn.score}${awayInn.overs ? ` (${awayInn.overs} ov)` : ''}`;
    } else if (match?.awayScore) {
      dynamicAwayScoreStr = match.awayScore;
    }
  }

  // -- Completed-Match Last-Resort Fallback --------------------------------------
  // Only runs for completed matches so live/upcoming logic is never affected.
  // Extracts from cbSummary.matchScore (object shape with team1Score/team2Score)
  // when inningsScoreList was absent from the summary response.
  if (isCompleted && cbSummary) {
    const msObj = cbSummary.matchScore;
    if (msObj && !Array.isArray(msObj)) {
      if (!dynamicHomeScoreStr) {
        const i1 = msObj.team1Score?.inngs1;
        if (i1?.runs !== undefined) dynamicHomeScoreStr = `${i1.runs}/${i1.wickets || 0}${i1.overs ? ` (${i1.overs} ov)` : ''}`;
      }
      if (!dynamicAwayScoreStr) {
        const i2 = msObj.team2Score?.inngs1;
        if (i2?.runs !== undefined) dynamicAwayScoreStr = `${i2.runs}/${i2.wickets || 0}${i2.overs ? ` (${i2.overs} ov)` : ''}`;
      }
    }
  }

  if (dynamicHomeScoreStr) dynamicHomeScoreStr = formatScoreString(dynamicHomeScoreStr);
  if (dynamicAwayScoreStr) dynamicAwayScoreStr = formatScoreString(dynamicAwayScoreStr);

  const dynamicStatus = (() => {
    const st = (dynamicMatchInfo?.state || '').toLowerCase();
    if (!st) return match?.status || "upcoming";
    if (st === 'complete' || st === 'completed' || st === 'result' || st === 'abandoned' || st === 'cancelled') return 'completed';
    if (st === 'preview' || st === 'upcoming') return 'upcoming';
    return 'live';
  })();

  if (dynamicMatchInfo?.state) {
    isLive = dynamicStatus === "live";
    isCompleted = dynamicStatus === "completed";
    isUpcoming = dynamicStatus === "upcoming";
  }

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
        <title>{`${team1Name} vs ${team2Name} - ${match.matchType} | SportsBuzz`}</title>

        <meta
          name="description"
          content={`Live score and updates for ${team1Name} vs ${team2Name} - ${match.matchType} at ${cbInfo?.matchInfo?.venueInfo?.ground || (typeof match.venue === 'object' ? match.venue?.name : match.venue) || "Venue"}`}
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
                  <span className="text-xs font-semibold text-foreground uppercase tracking-widest">{safeStr(match.tournament?.name || match.matchType, 'Cricket')}</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-muted-foreground/60" /> {safeStr(dynamicVenueStr, "Unknown Venue")}</span>
                  <span className="hidden sm:flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground/60" /> {dynamicTimeStr}</span>
                </div>
              </div>

              {/* 2. Main Score Area */}
              {(() => {
                const parseScore = (raw: string | undefined) => {
                  if (!raw) return { runs: "–", overs: "" };
                  const m = raw.match(/^([\d\/]+(?:\s*\(d\))?)\s*\((.+?)\)\s*$/);
                  if (m) return { runs: m[1].trim(), overs: m[2].trim() };
                  return { runs: raw, overs: "" };
                };
                const home = parseScore(dynamicHomeScoreStr);
                const away = parseScore(dynamicAwayScoreStr);
                const showAway = away.runs !== "–" && away.runs !== "";
                const showHome = home.runs !== "–" && home.runs !== "";
                const showDualScore = showHome && showAway;
                const showTestScore = isTestMatch;

                return (
                  <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center px-6 md:px-8 lg:px-16 py-10 md:py-14 gap-8 md:gap-6 lg:gap-8 relative w-full">

                    {/* Home Team (Left Side) */}
                    <div className="flex justify-center md:justify-end z-10 w-full min-w-0">
                      <div className="flex items-center gap-4 md:gap-5 lg:gap-6 min-w-0">
                        <div className="text-right min-w-0">
                          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground tracking-tight break-words">{team1Name}</h2>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{team1ShortName}</p>
                        </div>
                        <TeamLogo logo={team1Logo} name={team1Name} size="lg" className="w-16 h-12 md:w-20 md:h-14 lg:w-24 lg:h-16 object-contain shrink-0 drop-shadow-md" />

                        {/* Score next to Home Team if only Home is batting */}
                        {!showTestScore && showHome && !showDualScore && (
                          <div className="ml-2 pl-4 md:ml-4 md:pl-4 lg:ml-6 lg:pl-6 border-l-2 border-primary/20 relative flex items-center md:w-[130px] lg:w-[150px] shrink-0">
                            <span className="text-5xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">{home.runs}</span>
                            {home.overs && (
                              <div className="absolute top-[105%] left-4 md:left-4 lg:left-6 whitespace-nowrap">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/40 px-2.5 py-0.5 rounded-md">
                                  {home.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Invisible placeholder when Away is batting to keep Flags equidistant */}
                        {!showTestScore && !showHome && showAway && !showDualScore && (
                          <div className="hidden md:block ml-2 pl-4 md:ml-4 md:pl-4 lg:ml-6 lg:pl-6 border-l-2 border-transparent md:w-[130px] lg:w-[150px] shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Center Area (Test matches, Dual Scores, VS, or empty spacer) */}
                    <div className="flex flex-col items-center justify-center shrink-0 z-10 md:min-w-[40px] my-4 md:my-0">
                      {showTestScore && match.scoreBreakdown ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-6">
                            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{match.scoreBreakdown.home.inn1 || "–"}</span>
                            <span className="text-border text-2xl font-light">-</span>
                            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{match.scoreBreakdown.away.inn1 || "–"}</span>
                          </div>
                          {(match.scoreBreakdown.home.inn2 || match.scoreBreakdown.away.inn2) && (
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span className="text-xl md:text-2xl font-bold">{match.scoreBreakdown.home.inn2 || "–"}</span>
                              <span className="text-border text-lg">-</span>
                              <span className="text-xl md:text-2xl font-bold">{match.scoreBreakdown.away.inn2 || "–"}</span>
                            </div>
                          )}
                        </div>
                      ) : showTestScore && reconciledInningsScores && reconciledInningsScores.length > 0 ? (
                        <div className="flex flex-col items-center justify-center w-full min-w-[240px] gap-4">
                          {(() => {
                            const homeInns = reconciledInningsScores.filter(i => i.team === 'home');
                            const awayInns = reconciledInningsScores.filter(i => i.team === 'away');
                            const maxInns = Math.max(homeInns.length, awayInns.length, 1);

                            return Array.from({ length: maxInns }).map((_, idx) => {
                              const hInn = homeInns[idx];
                              const aInn = awayInns[idx];
                              const isHomeLatest = idx === homeInns.length - 1;
                              const isAwayLatest = idx === awayInns.length - 1;

                              return (
                                <div key={idx} className={cn("grid grid-cols-[1fr_auto_1fr] items-center w-full", idx > 0 && "pt-4 border-t border-border/30")}>
                                  <div className="flex flex-col items-end pr-4 md:pr-6">
                                    {hInn ? (
                                      <>
                                        <span className={cn("font-black tracking-tighter transition-all", isHomeLatest ? "text-4xl md:text-5xl text-foreground" : "text-2xl md:text-3xl text-muted-foreground")}>{hInn.score}</span>
                                        {hInn.overs && <span className="text-[10px] text-muted-foreground mt-1.5 font-bold bg-secondary/40 px-2 py-0.5 rounded uppercase tracking-widest">{formatOversText(hInn.overs).replace(/ov/i, '').trim()} OVERS</span>}
                                      </>
                                    ) : <span className="text-2xl md:text-3xl text-muted-foreground/30 font-black tracking-tighter">–</span>}
                                  </div>
                                  <div className="flex items-center justify-center">
                                    <div className="px-2.5 py-1 bg-muted/40 border border-border/40 rounded-full text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] shadow-sm">
                                      INN {idx + 1}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-start pl-4 md:pl-6">
                                    {aInn ? (
                                      <>
                                        <span className={cn("font-black tracking-tighter transition-all", isAwayLatest ? "text-4xl md:text-5xl text-foreground" : "text-2xl md:text-3xl text-muted-foreground")}>{aInn.score}</span>
                                        {aInn.overs && <span className="text-[10px] text-muted-foreground mt-1.5 font-bold bg-secondary/40 px-2 py-0.5 rounded uppercase tracking-widest">{formatOversText(aInn.overs).replace(/ov/i, '').trim()} OVERS</span>}
                                      </>
                                    ) : <span className="text-2xl md:text-3xl text-muted-foreground/30 font-black tracking-tighter">–</span>}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : showDualScore ? (
                        <div className="flex items-center gap-6 md:gap-10">
                          <div className="flex flex-col items-center">
                            <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-none">{home.runs}</span>
                            {home.overs && <span className="text-[10px] text-muted-foreground font-bold mt-2.5 uppercase tracking-widest bg-secondary/40 px-3 py-1 rounded-md">{home.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                          </div>
                          <span className="text-border text-4xl font-light mb-4">-</span>
                          <div className="flex flex-col items-center">
                            <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-none">{away.runs}</span>
                            {away.overs && <span className="text-[10px] text-muted-foreground font-bold mt-2.5 uppercase tracking-widest bg-secondary/40 px-3 py-1 rounded-md">{away.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS</span>}
                          </div>
                        </div>
                      ) : (!showHome && !showAway && !showTestScore) ? (
                        <span className="text-4xl text-muted-foreground/30 font-light">–</span>
                      ) : (showHome || showAway) && !showDualScore ? null : (
                        <span className="text-2xl font-bold text-muted-foreground/30 tracking-widest">VS</span>
                      )}
                    </div>

                    {/* Away Team (Right Side) */}
                    <div className="flex justify-center md:justify-start z-10 w-full min-w-0">
                      <div className="flex items-center gap-4 md:gap-5 lg:gap-6 min-w-0">

                        {/* Invisible placeholder when Home is batting to keep Flags equidistant */}
                        {!showTestScore && showHome && !showAway && !showDualScore && (
                          <div className="hidden md:block mr-2 pr-4 md:mr-4 md:pr-4 lg:mr-6 lg:pr-6 border-r-2 border-transparent md:w-[130px] lg:w-[150px] shrink-0" />
                        )}

                        {/* Score next to Away Team if only Away is batting */}
                        {!showTestScore && showAway && !showDualScore && (
                          <div className="mr-2 pr-4 md:mr-4 md:pr-4 lg:mr-6 lg:pr-6 border-r-2 border-primary/20 relative flex items-center justify-end md:w-[130px] lg:w-[150px] shrink-0">
                            <span className="text-5xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">{away.runs}</span>
                            {away.overs && (
                              <div className="absolute top-[105%] right-4 md:right-4 lg:right-6 whitespace-nowrap">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/40 px-2.5 py-0.5 rounded-md">
                                  {away.overs.replace(/[\(\)]/g, '').replace(/ov/i, '').trim()} OVERS
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <TeamLogo logo={team2Logo} name={team2Name} size="lg" className="w-16 h-12 md:w-20 md:h-14 lg:w-24 lg:h-16 object-contain shrink-0 drop-shadow-md" />
                        <div className="text-left min-w-0">
                          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground tracking-tight break-words">{team2Name}</h2>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{team2ShortName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                  {(() => {
                    const statusText = match.sport === 'cricket' ? reconciledStatusText : match.summaryText;
                    if (!statusText && !isLive) return null;

                    return statusText ? (
                      <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{statusText}</span>
                    ) : null;
                  })()}

                  {isLive && (
                    <div className="text-[10px] font-bold text-red-500 tracking-widest uppercase flex items-center gap-2">
                      {match.sport === "cricket" && match.currentOver && <span>OVER {formatScoreString(String(match.currentOver))}</span>}
                      {match.sport === "football" && match.currentMinute && <><Clock size={12} className="animate-pulse" /> <span>{match.currentMinute}</span></>}
                      {match.sport === "basketball" && match.currentQuarter && <span>{match.currentQuarter} - {match.timeRemaining}</span>}
                      {match.sport === "tennis" && match.currentSet && <span>{match.currentSet}</span>}
                      {(!match.currentOver && !match.currentMinute && !match.currentQuarter && !match.currentSet) && (
                        <span>IN PROGRESS</span>
                      )}
                    </div>
                  )}
                  {(!reconciledStatusText && !isLive) && (
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
                  value="squads"
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Users size={16} />
                  {isCricketMatch ? "Squads" : "Lineups"}
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
              {match?.sport === 'cricket' && !isIPL && (
                <TabsTrigger
                  value="graphs"
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-all"
                >
                  <Activity size={16} />
                  Overs
                </TabsTrigger>
              )}
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
              {isUpcoming && !cbInfo && (
                <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                  <div className="text-center space-y-3 pb-4 mb-4 border-b border-border/50">
                    <Clock className="mx-auto h-10 w-10 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">Match not started yet. Stay tuned for live updates.</p>
                  </div>
                </div>
              )}


              {/* Live Match Stats (Batters & Bowlers) */}
              {!isUpcoming && cbSummary && (cbSummary.miniscore?.batsmanStriker || cbSummary.miniscore?.bowlerStriker || cbSummary.miniscore?.partnerShip) && (
                <div className="space-y-6 mt-8 animate-fade-in">
                  <div className="flex items-center gap-2 px-1">
                    <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Live Action</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Batting & Bowling */}
                    <div className="lg:col-span-2 space-y-6">

                      {/* Batters */}
                      {(cbSummary.miniscore?.batsmanStriker || cbSummary.miniscore?.batsmanNonStriker) && (
                        <div className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-[1.5rem] p-1.5 shadow-sm">
                          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/20">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Batters
                            </h4>
                            <div className="hidden sm:flex gap-6 md:gap-8 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] text-right pr-2">
                              <span className="w-8">R</span><span className="w-8">B</span><span className="w-8">4s</span><span className="w-8">6s</span><span className="w-12">SR</span>
                            </div>
                          </div>
                          <div className="p-1 space-y-1 mt-1">
                            {[cbSummary.miniscore.batsmanStriker, cbSummary.miniscore.batsmanNonStriker].filter(Boolean).map((bat: any, idx: number) => {
                              const isOnStrike = bat.id === cbSummary.miniscore.batsmanStriker?.id;
                              return (
                                <div key={idx} className={cn(
                                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all duration-300",
                                  isOnStrike ? "bg-primary/5 border border-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "hover:bg-muted/10 border border-transparent"
                                )}>
                                  <div className="flex items-center gap-3 mb-4 sm:mb-0">
                                    <span className={cn(
                                      "font-semibold tracking-tight transition-colors",
                                      isOnStrike ? "text-foreground text-lg" : "text-muted-foreground text-base"
                                    )}>{formatPlayerName(bat.name)}</span>
                                    {isOnStrike && <span className="text-[8px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-sm">Strike</span>}
                                  </div>

                                  {/* Stats Row */}
                                  <div className="flex gap-6 md:gap-8 items-center justify-between sm:justify-end text-right font-mono text-sm sm:text-base pr-2">
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">R</span><span className={cn("font-black", isOnStrike ? "text-foreground text-xl" : "text-foreground")}>{bat.runs}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">B</span><span className="text-muted-foreground font-medium">{bat.balls}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">4s</span><span className="text-muted-foreground">{bat.fours}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">6s</span><span className="text-muted-foreground">{bat.sixes}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-12 items-end"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">SR</span><span className={cn("font-bold tracking-tight", parseFloat(bat.strikeRate) > 130 ? "text-primary" : "text-muted-foreground")}>{bat.strikeRate}</span></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bowlers */}
                      {(cbSummary.miniscore?.bowlerStriker || cbSummary.miniscore?.bowlerNonStriker) && (
                        <div className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-[1.5rem] p-1.5 shadow-sm mt-6">
                          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border/20">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Bowlers
                            </h4>
                            <div className="hidden sm:flex gap-6 md:gap-8 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] text-right pr-2">
                              <span className="w-8">O</span><span className="w-8">M</span><span className="w-8">R</span><span className="w-8">W</span><span className="w-12">ECO</span>
                            </div>
                          </div>
                          <div className="p-1 space-y-1 mt-1">
                            {[cbSummary.miniscore.bowlerStriker, cbSummary.miniscore.bowlerNonStriker].filter(Boolean).map((bowl: any, idx: number) => {
                              const isBowling = bowl.id === cbSummary.miniscore.bowlerStriker?.id;
                              return (
                                <div key={idx} className={cn(
                                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all duration-300",
                                  isBowling ? "bg-red-500/5 border border-red-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "hover:bg-muted/10 border border-transparent"
                                )}>
                                  <div className="flex items-center gap-3 mb-4 sm:mb-0">
                                    <span className={cn(
                                      "font-semibold tracking-tight transition-colors",
                                      isBowling ? "text-foreground text-lg" : "text-muted-foreground text-base"
                                    )}>{formatPlayerName(bowl.name)}</span>
                                    {isBowling && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest px-2 py-0.5 bg-red-500/10 rounded-sm">Bowling</span>}
                                  </div>

                                  {/* Stats Row */}
                                  <div className="flex gap-6 md:gap-8 items-center justify-between sm:justify-end text-right font-mono text-sm sm:text-base pr-2">
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">O</span><span className="text-muted-foreground font-medium">{bowl.overs}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">M</span><span className="text-muted-foreground">{bowl.maidens}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">R</span><span className="text-foreground">{bowl.runs}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-8 items-center"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">W</span><span className={cn("font-black", isBowling ? "text-red-500 text-xl" : "text-red-500")}>{bowl.wickets}</span></div>
                                    <div className="flex flex-col sm:block w-auto sm:w-12 items-end"><span className="text-[9px] text-muted-foreground sm:hidden mb-1 font-sans font-bold uppercase tracking-widest">ECO</span><span className={cn("font-bold tracking-tight", parseFloat(bowl.economy) < 6 ? "text-green-500" : "text-muted-foreground")}>{bowl.economy}</span></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Key Stats Sidebar */}
                    <div className="space-y-6">
                      <div className="bg-card/20 backdrop-blur-sm border border-border/30 rounded-[1.5rem] shadow-sm overflow-hidden h-full">
                        <div className="px-5 py-4 border-b border-border/20 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/70"></div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Key Stats</h4>
                        </div>
                        <div className="p-4 space-y-4">

                          <div className="grid grid-cols-2 gap-3">
                            {/* Partnership */}
                            {cbSummary.miniscore?.partnerShip && (
                              <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-center transition-colors hover:bg-muted/20">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">Partnership</span>
                                <div className="flex items-baseline gap-1.5 font-mono">
                                  <span className="text-xl font-black text-foreground">{cbSummary.miniscore.partnerShip.runs}</span>
                                  <span className="text-xs text-muted-foreground font-semibold">({cbSummary.miniscore.partnerShip.balls})</span>
                                </div>
                              </div>
                            )}

                            {/* Last Wicket */}
                            {cbSummary.miniscore?.lastWkt && (
                              <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-center transition-colors hover:bg-muted/20">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">Last Wkt</span>
                                <span className="text-sm font-semibold text-foreground line-clamp-2">{cbSummary.miniscore.lastWkt}</span>
                              </div>
                            )}

                            {/* Overs Left */}
                            {cbSummary.miniscore?.oversLeft && (
                              <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-center transition-colors hover:bg-muted/20">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">Overs Left</span>
                                <span className="text-lg font-black font-mono text-foreground">{formatScoreString(String(cbSummary.miniscore.oversLeft))}</span>
                              </div>
                            )}

                            {/* Last 10 Overs */}
                            {cbSummary.miniscore?.last10Overs && (
                              <div className="bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-center transition-colors hover:bg-muted/20">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">Last 10 Ov</span>
                                <span className="text-lg font-black font-mono text-foreground">{cbSummary.miniscore.last10Overs}</span>
                              </div>
                            )}
                          </div>

                          {/* Toss */}
                          {tossWinner && (
                            <div className="bg-muted/10 border border-border/40 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors hover:bg-muted/20">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">Toss</span>
                                <span className="text-sm font-semibold text-foreground">{tossWinner} chose to <span className="text-primary">{tossChoice}</span></span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-background/50 border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-xs font-black text-muted-foreground">T</span>
                              </div>
                            </div>
                          )}

                          {/* Win Probability Bar */}
                          {cbSummary.winProbability && (cbSummary.winProbability.team1?.percent > 0 || cbSummary.winProbability.team2?.percent > 0) && (
                            <div className="bg-muted/10 border border-border/40 rounded-xl p-4 transition-colors hover:bg-muted/20">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">Win Probability</span>
                                <Activity className="w-3.5 h-3.5 text-primary opacity-80" />
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-foreground w-8">{cbSummary.winProbability.team1?.shortName || "T1"}</span>
                                <div className="flex-1 h-2 flex rounded-full overflow-hidden bg-background border border-border/50 shadow-inner">
                                  <div className="bg-primary h-full transition-all duration-1000 ease-out" style={{ width: `${cbSummary.winProbability.team1?.percent || 0}%` }} />
                                  <div className="bg-amber-500 h-full transition-all duration-1000 ease-out" style={{ width: `${cbSummary.winProbability.drawTiePercent || 0}%` }} />
                                  <div className="bg-[#1e293b] dark:bg-slate-500 h-full transition-all duration-1000 ease-out" style={{ width: `${cbSummary.winProbability.team2?.percent || 0}%` }} />
                                </div>
                                <span className="text-xs font-black text-foreground w-8 text-right">{cbSummary.winProbability.team2?.shortName || "T2"}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-bold font-mono px-11">
                                <span className="text-primary drop-shadow-sm">{cbSummary.winProbability.team1?.percent || 0}%</span>
                                {cbSummary.winProbability.drawTiePercent > 0 && <span className="text-amber-500 drop-shadow-sm">Draw {cbSummary.winProbability.drawTiePercent}%</span>}
                                <span className="text-[#1e293b] dark:text-slate-400 drop-shadow-sm">{cbSummary.winProbability.team2?.percent || 0}%</span>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Match Facts / Details Grid (From cbInfo or cbSummary) */}
              {(!isUpcoming || cbInfo) && (
                <div className="space-y-4 mt-8 animate-fade-in">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Information</h3>
                  </div>

                  {isInfoLoading ? (
                    <div className="flex justify-center p-8 bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Full Match Information & Venue Guide Tables */}
                      {cbInfo?.extraInfo && Object.keys(cbInfo.extraInfo).length > 0 && (
                        <div className="mt-8 space-y-6 animate-fade-in">
                          {/* --- THE TICKET DESIGN --- */}
                          <div className="relative w-full max-w-5xl mx-auto mt-10 filter drop-shadow-2xl animate-fade-in group">
                            {/* Outer Ticket Container */}
                            <div className="flex flex-col md:flex-row bg-card/80 backdrop-blur-2xl rounded-[2rem] overflow-hidden relative border border-border/50 group-hover:border-primary/30 transition-colors duration-500">

                              {/* Decorative Cutouts for Ticket Effect */}
                              <div className="hidden md:block absolute top-0 bottom-0 left-[65%] w-[2px] border-l-[3px] border-dashed border-border/40 z-10"></div>
                              <div className="hidden md:block absolute -top-5 left-[65%] -translate-x-1/2 w-10 h-10 rounded-full bg-background border border-border/50 z-20"></div>
                              <div className="hidden md:block absolute -bottom-5 left-[65%] -translate-x-1/2 w-10 h-10 rounded-full bg-background border border-border/50 z-20"></div>

                              {/* Main Ticket Area (Left) */}
                              <div className="w-full md:w-[65%] p-6 sm:p-10 relative overflow-hidden">
                                {/* Background Watermark Logo */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 text-primary/[0.03] group-hover:text-primary/[0.05] transition-colors duration-700 rotate-12 scale-150 pointer-events-none">
                                  <Trophy className="w-64 h-64" />
                                </div>

                                <div className="relative z-10">
                                  {/* Header badge & Series */}
                                  <div className="flex flex-wrap items-center gap-3 mb-8">
                                    <div className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-md">
                                      Official Ticket
                                    </div>
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] border-l-2 border-primary/30 pl-3">
                                      {cbInfo.matchInfo?.seriesName || cbSummary?.matchHeader?.matchInfo?.seriesName || cbSummary?.matchInfo?.seriesName || match.tournament?.name || "Cricket Match"}
                                    </span>
                                  </div>

                                  {/* Main Match Title */}
                                  <div className="mb-8">
                                    {(() => {
                                      const matchTitleStr = cbInfo.extraInfo.Match || (match as any).name || "";
                                      const titleParts = matchTitleStr.split(/(?:,|•)/).map((p: string) => p.trim()).filter(Boolean);
                                      if (titleParts.length > 1) {
                                        const mainTitle = titleParts[0];
                                        const subTitles = titleParts.slice(1).join(" • ");
                                        return (
                                          <h2 className="flex flex-col gap-1.5 sm:gap-2">
                                            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-black text-foreground uppercase tracking-tighter leading-none bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent pb-1">
                                              {mainTitle}
                                            </span>
                                            <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] leading-relaxed max-w-2xl">
                                              {subTitles}
                                            </span>
                                          </h2>
                                        );
                                      }
                                      return (
                                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter leading-[1.1] bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                          {matchTitleStr}
                                        </h2>
                                      );
                                    })()}
                                  </div>

                                  {/* Core Details Row */}
                                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8 p-5 bg-background/50 rounded-2xl border border-border/40">
                                    <div>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5"><Calendar className="w-3 h-3" /> Date</span>
                                      <span className="text-sm font-black text-foreground">{cbInfo.extraInfo.Date}</span>
                                    </div>
                                    <div className="w-px h-10 bg-border/60 hidden sm:block"></div>
                                    <div>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5"><Clock className="w-3 h-3" /> Time</span>
                                      <span className="text-sm font-black text-foreground">{cbInfo.extraInfo.Time}</span>
                                    </div>
                                  </div>

                                  {/* Secondary Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                                    <div>
                                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Venue</span>
                                      <span className="text-sm font-bold text-foreground flex items-center gap-1.5">{`${cbInfo.matchInfo?.venueInfo?.ground || cbInfo.extraInfo.Stadium}`}</span>
                                    </div>
                                    {cbInfo.extraInfo.Toss && (
                                      <div>
                                        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Toss</span>
                                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5 line-clamp-2" title={cbInfo.extraInfo.Toss || match.tossResult}>{cbInfo.extraInfo.Toss || match.tossResult}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ticket Stub (Right) */}
                              <div className="w-full md:w-[35%] bg-muted/40 p-6 sm:p-10 relative flex flex-col justify-between border-t md:border-t-0 md:border-l border-border/30 border-dashed backdrop-blur-3xl">
                                <div className="space-y-6">
                                  <div>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5"><Eye className="w-3 h-3" /> Umpires</span>
                                    <span className="text-[13px] font-bold text-foreground leading-snug">{cbInfo.extraInfo.Umpires || (u1?.name ? `${u1.name}${u2?.name ? ", " + u2.name : ''}` : "TBA")}</span>
                                  </div>
                                  {cbInfo.extraInfo['3rd Umpire'] && (
                                    <div>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5"><Monitor className="w-3 h-3" /> 3rd Umpire</span>
                                      <span className="text-[13px] font-bold text-foreground leading-snug">{cbInfo.extraInfo['3rd Umpire']}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5"><Shield className="w-3 h-3" /> Referee</span>
                                    <span className="text-[13px] font-bold text-foreground leading-snug">{cbInfo.extraInfo.Referee || ref?.name || match.referee || "TBA"}</span>
                                  </div>
                                  {([cbInfo.extraInfo.TV ? `TV: ${cbInfo.extraInfo.TV}` : null, cbInfo.extraInfo.Streaming ? `Stream: ${cbInfo.extraInfo.Streaming}` : null].filter(Boolean).length > 0) && (
                                    <div className="pt-4 border-t border-border/50">
                                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Broadcast</span>
                                      <span className="text-[11px] font-bold text-foreground leading-snug block opacity-80">{[cbInfo.extraInfo.TV ? `TV: ${cbInfo.extraInfo.TV}` : null, cbInfo.extraInfo.Streaming ? `Stream: ${cbInfo.extraInfo.Streaming}` : null].filter(Boolean).join(' • ')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Stylized Barcode Element */}
                                <div className="mt-8 opacity-40 mix-blend-overlay flex flex-col items-center">
                                  <div className="h-12 w-full bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_2px,transparent_2px,transparent_5px,currentColor_5px,currentColor_8px,transparent_8px,transparent_10px,currentColor_10px,currentColor_11px,transparent_11px,transparent_15px,currentColor_15px,currentColor_18px,transparent_18px,transparent_22px)]"></div>
                                  <div className="text-center text-[9px] font-mono mt-2 font-bold tracking-[0.4em] uppercase text-foreground/70">M-{match.id.substring(0, 8)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* --- STADIUM ACCESS PASS (Venue Guide) --- */}
                          {(cbInfo.extraInfo.Stadium || cbInfo.extraInfo.Capacity || cbInfo.extraInfo.Ends) && (
                            <div className="relative w-full max-w-5xl mx-auto mt-6 filter drop-shadow-md animate-fade-in group">
                              <div className="bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/40 flex flex-col sm:flex-row items-stretch hover:border-primary/20 transition-all duration-300">
                                {/* Color Accent Bar */}
                                <div className="w-full sm:w-3 bg-gradient-to-b from-primary/80 to-primary/40 shrink-0"></div>

                                <div className="flex-1 p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                                  {/* Icon Badge */}
                                  <div className="flex items-center justify-center w-14 h-14 rounded-[1rem] bg-primary/10 border border-primary/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <MapPin className="w-6 h-6 text-primary" />
                                  </div>

                                  {/* Venue Data Grid */}
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 w-full text-center md:text-left">
                                    <div>
                                      <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Stadium</span>
                                      <span className="text-[13px] font-black text-foreground">{cbInfo.extraInfo.Stadium}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">City</span>
                                      <span className="text-[13px] font-black text-foreground">{cbInfo.extraInfo.City || "N/A"}</span>
                                    </div>
                                    {cbInfo.extraInfo.Capacity && (
                                      <div>
                                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Capacity</span>
                                        <span className="text-[13px] font-black text-foreground">{cbInfo.extraInfo.Capacity}</span>
                                      </div>
                                    )}
                                    {cbInfo.extraInfo.Ends && (
                                      <div className="col-span-2 md:col-span-1">
                                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Ends</span>
                                        <span className="text-[12px] font-bold text-foreground/90 line-clamp-2 leading-tight" title={cbInfo.extraInfo.Ends}>{cbInfo.extraInfo.Ends}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </TabsContent>

            <TabsContent value="squads" className="space-y-6 animate-fade-in">
              {isCricketMatch ? (
                (() => {
                  const hasPlayers = (squads?.team1?.['playing XI']?.length || 0) > 0 || 
                                     (squads?.team1?.bench?.length || 0) > 0 || 
                                     (squads?.team2?.['playing XI']?.length || 0) > 0 || 
                                     (squads?.team2?.bench?.length || 0) > 0;
                                     
                  if (isUpcoming && !hasPlayers && !squadsLoading) {
                    return (
                      <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                        <Users className="mx-auto h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold text-foreground/80 mb-2">Squads not announced yet</h3>
                        <p className="text-sm opacity-80">Playing XI and squads will be updated closer to the match start time.</p>
                      </div>
                    );
                  }
                  return <SquadsTab squadsData={squads} loading={squadsLoading} error={squadsError} />;
                })()
              ) : (match.sport === 'football' ? (
                /* -- Football Lineups -- */
                <div className="bg-card border border-border rounded-[2.5rem] p-4 md:p-8 overflow-hidden relative">
                  <FootballPitchLineup
                    homeTeam={{
                      name: match.homeTeam?.name || fotmobLineups?.homeTeam?.name || "Team 1",
                      logo: match.homeTeam?.logo,
                      primaryColor: match.homeTeam?.primaryColor || '#2563eb',
                      coach: fotmobLineups?.homeTeam?.coach ? { name: fotmobLineups.homeTeam.coach.name } : undefined
                    }}
                    awayTeam={{
                      name: match.awayTeam?.name || fotmobLineups?.awayTeam?.name || "Team 2",
                      logo: match.awayTeam?.logo,
                      primaryColor: match.awayTeam?.primaryColor || '#ea580c',
                      coach: fotmobLineups?.awayTeam?.coach ? { name: fotmobLineups.awayTeam.coach.name } : undefined
                    }}
                    homePlayers={
                      fotmobLineups?.homeTeam?.starters ? [
                        ...fotmobLineups.homeTeam.starters.map((p: any) => ({
                          id: p.id.toString(),
                          name: p.name,
                          role: p.positionId === 11 ? 'Goalkeeper' : p.positionId >= 12 && p.positionId <= 14 ? 'Defender' : p.positionId >= 15 && p.positionId <= 17 ? 'Midfielder' : 'Forward',
                          number: p.shirtNumber,
                          isSubstitute: false,
                          rating: p.rating,
                          events: summarizePlayerEvents(p.name, match?.events || [], parseInt(match.awayScore as string) || 0)
                        })),
                        ...(fotmobLineups.homeTeam.subs || []).map((p: any) => ({
                          id: p.id.toString(),
                          name: p.name,
                          role: p.positionId === 11 ? 'Goalkeeper' : p.positionId >= 12 && p.positionId <= 14 ? 'Defender' : p.positionId >= 15 && p.positionId <= 17 ? 'Midfielder' : 'Forward',
                          number: p.shirtNumber,
                          isSubstitute: true,
                          rating: p.rating,
                          events: summarizePlayerEvents(p.name, match?.events || [], parseInt(match.awayScore as string) || 0)
                        }))
                      ] : [
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
                    awayPlayers={
                      fotmobLineups?.awayTeam?.starters ? [
                        ...fotmobLineups.awayTeam.starters.map((p: any) => ({
                          id: p.id.toString(),
                          name: p.name,
                          role: p.positionId === 11 ? 'Goalkeeper' : p.positionId >= 12 && p.positionId <= 14 ? 'Defender' : p.positionId >= 15 && p.positionId <= 17 ? 'Midfielder' : 'Forward',
                          number: p.shirtNumber,
                          isSubstitute: false,
                          rating: p.rating,
                          events: summarizePlayerEvents(p.name, match?.events || [], parseInt(match.homeScore as string) || 0)
                        })),
                        ...(fotmobLineups.awayTeam.subs || []).map((p: any) => ({
                          id: p.id.toString(),
                          name: p.name,
                          role: p.positionId === 11 ? 'Goalkeeper' : p.positionId >= 12 && p.positionId <= 14 ? 'Defender' : p.positionId >= 15 && p.positionId <= 17 ? 'Midfielder' : 'Forward',
                          number: p.shirtNumber,
                          isSubstitute: true,
                          rating: p.rating,
                          events: summarizePlayerEvents(p.name, match?.events || [], parseInt(match.homeScore as string) || 0)
                        }))
                      ] : [
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
                    homeFormation={fotmobLineups?.homeTeam?.formation || match.lineups?.home?.formation || match.details?.lineups?.home?.formation || "4-4-2"}
                    awayFormation={fotmobLineups?.awayTeam?.formation || match.lineups?.away?.formation || match.details?.lineups?.away?.formation || "4-3-3"}
                  />
                </div>
              ) : (cbSquadsField.loading || matchInfoField.loading) ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              ) : (cbSquadsField.data?.teams?.length || match?.homeTeam?.players?.length || match?.awayTeam?.players?.length) ? (
                /* -- Cricket Head-to-Head Lineups -- */
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
                                          <CricketPlayerImage playerId={getPlayerImageId(p1.name)} playerName={p1.name} size={40} />
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
                                          <CricketPlayerImage playerId={getPlayerImageId(p2.name)} playerName={p2.name} size={40} align="right" />
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
                /* -- Fallback to existing SquadsList -- */
                <SquadsList match={match} matchData={rawApiData} isLoading={matchInfoField.loading} />
              ))}
            </TabsContent>

            <TabsContent value="scoreboard" className="animate-fade-in">
              {match?.sport === 'football' ? (
                /* -- Football Match Stats -- */
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
                /* -- Tennis Match Stats -- */
                <div className="space-y-6">
                  {(() => {
                    const homeTeamName = match?.homeTeam?.shortName || match?.homeTeam?.name || 'P1';
                    const awayTeamName = match?.awayTeam?.shortName || match?.awayTeam?.name || 'P2';

                    // Generate realistic mock stats for tennis since API might not provide them yet
                    const tennisStatCategories = [
                      {
                        category: '≡ƒÄ╛ Service',
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
                        category: 'ΓÜí Rallies & Points',
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
                /* -- Cricket / Other Sports Scoreboard -- */
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  <h3 className="font-semibold text-foreground">Scoreboard</h3>

                  {isUpcoming ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListOrdered className="mx-auto h-12 w-12 mb-3 opacity-10" />
                      <p>Match not started yet – scoreboard will be available once play begins.</p>
                    </div>
                  ) : (cbScorecardField.loading) ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : cbScorecardField.data?.innings && cbScorecardField.data.innings.length > 0 ? (
                    /* -- Cricbuzz Detailed Scorecard -- */
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
                                <Select value={displayIndex.toString()} onValueChange={(val) => setActiveInningsIndex(Number(val))}>
                                  <SelectTrigger className="w-full bg-secondary/80 border-border/50 text-foreground text-[15px] font-bold rounded-xl px-4 py-6 outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer shadow-sm hover:bg-secondary">
                                    <SelectValue placeholder="Select Inning" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-secondary border-border/50 rounded-xl shadow-lg">
                                    {inningsList.map((inning: any, idx: number) => {
                                      // Calculate which inning this is for the team (1st, 2nd, etc)
                                      const teamOccurrences = inningsList.slice(0, idx + 1).filter((i: any) => i.teamName === inning.teamName).length;
                                      const ordinal = teamOccurrences === 1 ? '1st' : teamOccurrences === 2 ? '2nd' : teamOccurrences === 3 ? '3rd' : `${teamOccurrences}th`;
                                      const inningLabel = `${inning.teamName || `Team ${idx + 1}`} - ${ordinal} Inning`;

                                      return (
                                        <SelectItem
                                          key={idx}
                                          value={idx.toString()}
                                          className="text-[15px] font-semibold cursor-pointer py-3 focus:bg-primary/20 focus:text-primary transition-colors"
                                        >
                                          {inningLabel} {inning.isDeclared ? '(d)' : ''}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex flex-col sm:items-end">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Score</span>
                                <span className="text-2xl sm:text-3xl font-mono font-black text-primary leading-none">
                                  {inn.score}/{inn.wickets} <span className="text-sm text-muted-foreground font-medium ml-1">({formatOversText(inn.overs)})</span>
                                </span>
                              </div>
                            </div>

                            {/* Card-Based Batting Scorecard – all 11 players shown together */}
                            <div className="pt-2 pb-8">
                              <h5 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-4 px-1">Batting</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {(() => {
                                  // Build complete 11-player list:
                                  // 1. Batsmen who have batted (from inn.batsmen)
                                  // 2. Players yet to bat (from inn.yetToBat – now objects with faceImageId)
                                  const battedList = (inn.batsmen || []).map((b: any) => ({
                                    ...b,
                                    _status: 'batted' as const,
                                  }));

                                  // inn.yetToBat can be an array of objects {name, faceImageId} (new scraper)
                                  // or legacy string array
                                  const yetToBatList = (inn.yetToBat || []).map((p: any) => {
                                    if (typeof p === 'string') {
                                      return { name: p, faceImageId: null, cricbuzzPlayerId: null, isCaptain: false, isKeeper: false, _status: 'yet' as const };
                                    }
                                    return { ...p, isCaptain: false, isKeeper: false, _status: 'yet' as const };
                                  });

                                  const allPlayers = [...battedList, ...yetToBatList];

                                  // Find the 2 current batsmen at the crease (not out + batting)
                                  const activeBatterIndices = battedList
                                    .map((b: any, idx: number) => {
                                      const d = (b.dismissal || '').toLowerCase();
                                      return (d === 'batting' || d === '' || d === 'not out') ? idx : -1;
                                    })
                                    .filter((idx: number) => idx !== -1)
                                    .slice(0, 2);

                                  return allPlayers.map((b: any, bIdx: number) => {
                                    const isYetToBat = b._status === 'yet';
                                    const isActiveAtCrease = !isYetToBat && activeBatterIndices.includes(bIdx);

                                    const displayDismissal = isYetToBat ? 'Yet to Bat' :
                                      (isActiveAtCrease ? 'Batting' : (b.dismissal || 'Batting'));

                                    return (
                                      <div key={bIdx}
                                        onClick={() => {
                                          setSelectedPlayerId(b.cricbuzzPlayerId?.toString() || '0');
                                          setSelectedPlayerName(formatPlayerName(b.name));
                                        }}
                                        className={cn(
                                          "bg-card/50 backdrop-blur-sm border rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group cursor-pointer",
                                          isYetToBat
                                            ? "border-border/20 opacity-60"
                                            : isActiveAtCrease
                                              ? "border-green-500/40 shadow-[0_4px_20px_rgba(34,197,94,0.1)]"
                                              : "border-border/40 shadow-sm"
                                        )}>
                                        {/* Subtle background glow for batsmen at crease */}
                                        {isActiveAtCrease && <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/20 blur-2xl rounded-full pointer-events-none"></div>}

                                        <div className="flex items-start gap-3 relative z-10">
                                          <CricketPlayerImage
                                            playerId={getPlayerImageId(b.name)}
                                            playerName={formatPlayerName(b.name)}
                                            size={40}
                                            className="shrink-0 mt-0.5"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="flex flex-col min-w-0">
                                                <h4 className={cn("font-bold text-sm leading-tight break-words", isActiveAtCrease ? "text-foreground" : "text-foreground/80")}>{formatPlayerName(b.name)}</h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                  {isActiveAtCrease && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" title="Not Out"></span>}
                                                  {b.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">C</span>}
                                                  {b.isKeeper && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">WK</span>}
                                                </div>
                                              </div>
                                              <span className={cn(
                                                "text-3xl font-black tracking-tighter leading-none shrink-0",
                                                isYetToBat ? "text-muted-foreground/30" : isActiveAtCrease ? "text-primary" : "text-foreground"
                                              )}>
                                                {isYetToBat ? '-' : b.runs}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className={cn("mt-3 mb-4 relative z-10", isYetToBat ? "opacity-40" : "opacity-100")}>
                                          {(() => {
                                            const text = typeof displayDismissal === 'string' ? displayDismissal.trim() : String(displayDismissal);
                                            if (text === 'Batting' || text === 'Yet to Bat' || text === 'Not Out') {
                                              return <span className={cn("text-xs font-semibold px-2 py-1 rounded-md",
                                                text === 'Not Out' ? "bg-green-500/10 text-green-400" :
                                                  text === 'Yet to Bat' ? "bg-secondary/30 text-muted-foreground/60" :
                                                    "bg-primary/10 text-primary"
                                              )}>{text}</span>;
                                            }

                                            const cAndB = text.match(/^c\s+(.+?)\s+b\s+(.+)$/i);
                                            if (cAndB) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">c</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(cAndB[1])}</span>
                                                <span className="text-muted-foreground/60 font-medium">b</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(cAndB[2])}</span>
                                              </div>
                                            );

                                            const justB = text.match(/^b\s+(.+)$/i);
                                            if (justB) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">b</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(justB[1])}</span>
                                              </div>
                                            );

                                            const lbwB = text.match(/^[Il]bw\s+b\s+(.+)$/i);
                                            if (lbwB) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">lbw b</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(lbwB[1])}</span>
                                              </div>
                                            );

                                            const runOut = text.match(/^run out\s+\((.*?)\)$/i);
                                            if (runOut) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">run out</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{runOut[1].split('/').map(n => formatPlayerName(n.trim())).join(' / ')}</span>
                                              </div>
                                            );

                                            const stAndB = text.match(/^st\s+(.+?)\s+b\s+(.+)$/i);
                                            if (stAndB) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">st</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(stAndB[1])}</span>
                                                <span className="text-muted-foreground/60 font-medium">b</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(stAndB[2])}</span>
                                              </div>
                                            );

                                            const candB = text.match(/^c\s+&\s+b\s+(.+)$/i);
                                            if (candB) return (
                                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="text-muted-foreground/60 font-medium">c & b</span>
                                                <span className="bg-white/5 border border-white/10 text-foreground/90 px-1.5 py-0.5 rounded-md font-semibold shadow-sm">{formatPlayerName(candB[1])}</span>
                                              </div>
                                            );

                                            return (
                                              <div className="flex flex-wrap items-center text-[11px]">
                                                <span className="bg-white/5 border border-white/10 text-foreground/80 px-2 py-0.5 rounded-md font-medium">{text}</span>
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 text-center border-t border-border/20 pt-3 relative z-10">
                                          <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">Balls</span><span className="font-mono text-xs font-bold text-foreground/90">{isYetToBat ? '-' : b.balls}</span></div>
                                          <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">4s</span><span className="font-mono text-xs font-medium text-muted-foreground">{isYetToBat ? '-' : b.fours}</span></div>
                                          <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">6s</span><span className="font-mono text-xs font-medium text-muted-foreground">{isYetToBat ? '-' : b.sixes}</span></div>
                                          <div className="flex flex-col"><span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold mb-0.5">SR</span><span className="font-mono text-xs font-bold text-foreground/90">{isYetToBat ? '-' : b.strikeRate}</span></div>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>

                            {/* Extras Bar */}
                            {inn.extras && (
                              <div className="bg-secondary/10 border border-border/20 rounded-xl p-4 flex items-center relative overflow-hidden">
                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-secondary/30 to-transparent pointer-events-none"></div>

                                <div className="flex items-center gap-3 relative z-10">
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-bold bg-background/50 px-2 py-1 rounded">Extras</span>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-foreground">{inn.extras.total ?? 0}</span>
                                    <span className="text-xs text-muted-foreground/60 font-medium tracking-wide">
                                      (b {inn.extras.byes ?? 0}, lb {inn.extras.legbyes ?? 0}, w {inn.extras.wides ?? 0}, nb {inn.extras.noballs ?? 0})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fall of Wickets Grid */}
                            {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                              <div className="bg-secondary/5 border border-border/10 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center relative">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-bold bg-background/50 px-2 py-1 rounded shrink-0 w-max">Fall of Wickets</span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {inn.fallOfWickets.map((f: any, fIdx: number) => {
                                    let score, wicketNum, batsmanName, overNumber;

                                    if (typeof f === 'string') {
                                      // Parse string like "27-1 (Conway, 3.2 ov)"
                                      const match = f.match(/^(\d+)-(\d+)\s*\(([^,]+)(?:,\s*([^)]+))?\)/i);
                                      if (match) {
                                        score = match[1];
                                        wicketNum = match[2];
                                        batsmanName = formatPlayerName(match[3].trim());
                                        if (match[4]) overNumber = match[4].trim();
                                      } else {
                                        // Fallback if the string format is completely unexpected
                                        return <div key={fIdx} className="flex items-center shrink-0 bg-background/30 px-2.5 py-1 rounded-full border border-border/10 text-xs text-muted-foreground">{f}</div>;
                                      }
                                    } else {
                                      score = f.score;
                                      wicketNum = f.wicketNum;
                                      batsmanName = formatPlayerName(f.batsmanName);
                                    }

                                    return (
                                      <div key={fIdx} className="flex items-center shrink-0 bg-background/30 px-2.5 py-1 rounded-full border border-border/10 hover:bg-secondary/20 transition-colors">
                                        <span className="text-[11px] font-black tracking-widest text-foreground mr-1.5">{score}/{wicketNum}</span>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{batsmanName}</span>
                                        {overNumber && <span className="text-[9px] uppercase font-semibold text-muted-foreground/60 ml-1.5 bg-foreground/5 px-1.5 py-0.5 rounded">{overNumber.replace('ov', 'ovs')}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Card-Based Bowling Scorecard */}
                            <div className="pt-8 pb-4">
                              <h5 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-4 px-1">Bowling</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {inn.bowlers?.map((b: any, bIdx: number) => {
                                  const isLiveInning = isLive && displayIndex === inningsList.length - 1;
                                  const isBowling = isLiveInning && (
                                    (b.cricbuzzPlayerId && cbSummary?.miniscore?.bowlerStriker?.id === b.cricbuzzPlayerId) ||
                                    (cbSummary?.miniscore?.bowlerStriker?.name && formatPlayerName(cbSummary.miniscore.bowlerStriker.name) === formatPlayerName(b.name))
                                  );

                                  return (
                                    <div key={bIdx}
                                      onClick={() => {
                                        setSelectedPlayerId(b.cricbuzzPlayerId?.toString() || '0');
                                        setSelectedPlayerName(formatPlayerName(b.name));
                                      }}
                                      className={cn(
                                        "bg-card/50 backdrop-blur-sm border rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group cursor-pointer",
                                        isBowling ? "border-green-500/40 shadow-[0_4px_20px_rgba(34,197,94,0.1)]" : parseInt(b.wickets) >= 3 ? "border-primary/40 shadow-[0_4px_20px_rgba(var(--primary),0.1)]" : "border-border/40 shadow-sm"
                                      )}>
                                      {/* Subtle background glow for high wicket takers or active bowler */}
                                      {isBowling && <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/20 blur-2xl rounded-full pointer-events-none"></div>}
                                      {!isBowling && parseInt(b.wickets) >= 3 && <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-2xl rounded-full pointer-events-none"></div>}

                                      {/* Player photo + name + wickets row */}
                                      <div className="flex items-start gap-3 relative z-10">
                                        <CricketPlayerImage
                                          playerId={getPlayerImageId(b.name)}
                                          playerName={formatPlayerName(b.name)}
                                          size={40}
                                          className="shrink-0 mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start gap-1">
                                            <div className="flex flex-col min-w-0">
                                              <h4 className={cn("font-bold text-sm leading-tight break-words", isBowling ? "text-foreground" : "text-foreground/90")}>{formatPlayerName(b.name)}</h4>
                                              <div className="flex items-center gap-1.5 mt-1.5">
                                                {isBowling && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" title="Bowling"></span>}
                                                {b.isCaptain && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold inline-block w-max">C</span>}
                                              </div>
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
                                )})}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : rawApiData?.score && Array.isArray(rawApiData.score) && rawApiData.score.length > 0 ? (
                    /* -- CricketData.org Summary Fallback -- */
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
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground tracking-tight">Commentary</h3>
                  </div>
                  {(isLive || cbFullCommentaryField.loading) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {cbFullCommentaryField.loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      ) : (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {cbFullCommentaryField.loading ? 'Loading...' : 'Live Updates'}
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {match?.sport === 'football' ? (
                    /* -- Football events ------------------------------------ */
                    isUpcoming ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-10" />
                        <p>Match not started yet – commentary will be available once play begins.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
                          const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "Away";
                          const events: any[] = [];
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
                              events.push({ minute: inc.time, type, team: teamName, text });
                            });
                          } else if (match.goals && match.goals.length > 0) {
                            match.goals.forEach((g: any) => {
                              events.push({ minute: g.minute, type: 'goal', team: g.teamId === match.homeTeam?.id ? homeTeam : awayTeam, text: `GOAL! ${g.player} scores for ${g.teamId === match.homeTeam?.id ? homeTeam : awayTeam}! ${g.assist ? `Assist by ${g.assist}.` : 'Brilliant finish.'}` });
                            });
                          }
                          if (events.length === 0) {
                            return (
                              <div className="text-center py-12 text-muted-foreground">
                                <AlertTriangle className="h-8 w-8 mb-3 opacity-30 mx-auto" />
                                <p className="text-sm">Commentary and incidents not available for this match</p>
                              </div>
                            );
                          }
                          const sortedEvents = events.sort((a, b) => b.minute - a.minute);
                          return sortedEvents.map((evt, idx) => (
                            <div key={idx} className="relative pl-8 pb-3 last:pb-0 border-l border-border/60 last:border-l-0">
                              <div className={cn("absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full", evt.type === 'goal' ? "bg-green-500" : evt.type === 'yellow' ? "bg-yellow-400" : evt.type === 'red' ? "bg-red-500" : evt.type === 'sub' ? "bg-blue-400" : "bg-primary/60")} />
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{evt.minute}'</span>
                                <span className="text-xs font-medium text-muted-foreground">{evt.team}</span>
                              </div>
                              <p className={cn("text-sm leading-relaxed p-3 rounded-lg border", evt.type === 'goal' ? "bg-green-500/10 border-green-500/20 text-foreground font-medium" : evt.type === 'info' ? "bg-secondary/50 border-border text-foreground font-medium text-center" : "bg-secondary/30 border-border/50 text-foreground/80")}>{evt.text}</p>
                            </div>
                          ));
                        })()}
                      </div>
                    )
                  ) : isUpcoming ? (
                    /* -- Upcoming state --------------------------------------- */
                    <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                      <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-20" />
                      <h3 className="text-lg font-semibold text-foreground/80 mb-2">Match not started yet</h3>
                      <p className="text-sm opacity-80">Commentary will be available once play begins.</p>
                    </div>
                  ) : cbFullCommentaryField.loading ? (
                    /* -- Loading state --------------------------------------- */
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                          <div className="w-12 h-12 rounded-lg bg-muted/40 shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-muted/40 rounded w-24" />
                            <div className="h-4 bg-muted/30 rounded w-full" />
                            <div className="h-4 bg-muted/20 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : cbFullCommentaryField.data?.commentary && cbFullCommentaryField.data.commentary.length > 0 ? (
                    /* -- Full Cricbuzz Commentary ---------------------------- */
                    (() => {
                      const items: any[] = cbFullCommentaryField.data.commentary;
                      // Group by innings
                      const byInnings: Record<number, any[]> = {};
                      items.forEach(item => {
                        if (!byInnings[item.inningsId]) byInnings[item.inningsId] = [];
                        byInnings[item.inningsId].push(item);
                      });

                      const displayInnIds = Object.keys(byInnings).map(Number).sort((a, b) => b - a);

                      return (
                        <div className="space-y-8 mt-2">
                          {/* Innings Filter Buttons */}
                          {displayInnIds.length > 1 && (
                            <div className="flex flex-wrap items-center gap-2 mb-2 pb-4 border-b border-border/40">
                              <button
                                onClick={() => setActiveCommentaryInningsId('all')}
                                className={cn(
                                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm border",
                                  activeCommentaryInningsId === 'all'
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border/50 hover:bg-secondary hover:border-border"
                                )}
                              >
                                All Innings
                              </button>
                              {displayInnIds.map(innId => {
                                const innName = byInnings[innId][0]?.batTeamName
                                  ? `${byInnings[innId][0].batTeamName} Innings`
                                  : `Innings ${innId}`;
                                return (
                                  <button
                                    key={innId}
                                    onClick={() => setActiveCommentaryInningsId(innId)}
                                    className={cn(
                                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm border",
                                      activeCommentaryInningsId === innId
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border/50 hover:bg-secondary hover:border-border"
                                    )}
                                  >
                                    {innName}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {displayInnIds
                            .filter(innId => activeCommentaryInningsId === 'all' || activeCommentaryInningsId === innId)
                            .map((innId) => {
                              const innItems = byInnings[innId]; // Do not reverse: keep latest first for over grouping
                              // Group by over
                              const byOver: Record<number, any[]> = {};
                              innItems.forEach((item: any) => {
                                const ov = item.overNum ?? -1;
                                if (!byOver[ov]) byOver[ov] = [];
                                byOver[ov].push(item);
                              });
                              const overKeys = Object.keys(byOver).map(Number).sort((a, b) => b - a);
                              const innName = innItems[0]?.batTeamName ? `${innItems[0].batTeamName} Innings` : `Innings ${innId}`;

                              return (
                                <div key={innId} className="space-y-5">
                                  {/* Innings Header */}
                                  <div className="sticky top-0 z-10 bg-card border-b border-border/50 py-3 mb-4 backdrop-blur-md bg-opacity-90">
                                    <h4 className="font-bold text-foreground tracking-tight px-1 flex items-center gap-2">
                                      <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                      {innName}
                                    </h4>
                                  </div>

                                  {overKeys.map((ov) => {
                                    const overItems = byOver[ov];
                                    const isSpecialOver = ov < 0;

                                    return (
                                      <div key={ov} className="mb-6">
                                        {/* Over label */}
                                        {!isSpecialOver && (
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full tracking-wide shadow-sm border border-primary/20">
                                              Over {ov + 1}
                                            </div>
                                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                          </div>
                                        )}

                                        {/* Commentary items wrapped in a single premium card */}
                                        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col">
                                          {overItems.map((item: any, idx: number) => {
                                            const evt = item.event || 'NONE';
                                            const isWicket = evt === 'WICKET' || (item.commText && (/(?:,\s*out\s+.*?(?:caught|bowled|lbw|stumped|run out|hit wicket))/i.test(item.commText) || /\bWICKET\b/.test(item.commText)));
                                            const isSix = evt === 'SIX' || (item.commText && /(?:,\s*SIX\b)/.test(item.commText));
                                            const isFour = evt === 'FOUR' || (item.commText && /(?:,\s*FOUR\b)/.test(item.commText));
                                            const isNoBall = evt === 'NOBALL';
                                            const isWide = evt === 'WIDE';
                                            const isOverComplete = evt === 'OVER_BREAK';
                                            const isMilestone = evt === 'MILESTONE' ||
                                              (item.commText && /(fifty|hundred|century|half century|half-century|\b50\b|\b100\b|\b150\b|\b200\b)/i.test(item.commText) && !/(partnership|stand)/i.test(item.commText));

                                            const dotColor = isWicket ? 'bg-red-500' :
                                              isMilestone ? 'bg-purple-500' :
                                                isSix ? 'bg-amber-500' :
                                                  isFour ? 'bg-blue-500' :
                                                    isNoBall ? 'bg-orange-500' :
                                                      isWide ? 'bg-purple-400' :
                                                        isOverComplete ? 'bg-emerald-500' :
                                                          'bg-muted-foreground/30';

                                            const cardBg = isWicket ? 'bg-red-500/5 dark:bg-red-500/10' :
                                              isMilestone ? 'bg-purple-500/5 dark:bg-purple-500/10' :
                                                isSix ? 'bg-amber-500/5 dark:bg-amber-500/10' :
                                                  isFour ? 'bg-blue-500/5 dark:bg-blue-500/10' :
                                                    isOverComplete ? 'bg-emerald-500/5 dark:bg-emerald-500/10' :
                                                      'bg-transparent hover:bg-muted/30';

                                            const eventIcon = isWicket ? 'Γÿ¥∩╕Å' :
                                              isMilestone ? '≡ƒîƒ' :
                                                isSix ? '6∩╕ÅΓâú' :
                                                  isFour ? '4∩╕ÅΓâú' :
                                                    isNoBall ? '≡ƒÜ½' :
                                                      isWide ? 'Γåö∩╕Å' :
                                                        isOverComplete ? '≡ƒöä' : '';

                                            let milestoneLabel = 'MILESTONE';
                                            if (isMilestone && item.commText) {
                                              const t = item.commText.toLowerCase();
                                              if (/(hundred|century|\b100\b)/.test(t)) milestoneLabel = 'HUNDRED';
                                              else if (/(fifty|half century|half-century|\b50\b)/.test(t)) milestoneLabel = 'FIFTY';
                                            }

                                            const eventLabel = isWicket ? 'WICKET' :
                                              isMilestone ? milestoneLabel :
                                                isSix ? 'SIX' :
                                                  isFour ? 'FOUR' :
                                                    isNoBall ? 'NO BALL' :
                                                      isWide ? 'WIDE' :
                                                        isOverComplete ? 'OVER' : '';

                                            return (
                                              <div
                                                key={idx}
                                                className={cn(
                                                  "group relative flex gap-5 p-5 border-b border-border/30 last:border-0 hover:bg-card/40 transition-all duration-300",
                                                  cardBg
                                                )}
                                              >
                                                {/* Left: over.ball indicator */}
                                                <div className="shrink-0 flex flex-col items-center gap-1.5 pt-1 w-8">
                                                  <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full ring-2 ring-background shadow-sm transition-transform duration-300 group-hover:scale-125",
                                                    dotColor,
                                                    isWicket ? "shadow-[0_0_8px_rgba(239,68,68,0.6)]" :
                                                      isSix || isFour ? "shadow-[0_0_8px_rgba(245,158,11,0.4)]" : ""
                                                  )} />
                                                  {!isSpecialOver && item.ballNbr > 0 && (
                                                    <span className="text-[10px] font-bold font-mono text-muted-foreground/60 leading-none mt-1 group-hover:text-foreground/80 transition-colors">
                                                      {(() => {
                                                        const bInOver = item.ballInOver || (item.ballNbr % 6 === 0 ? 6 : item.ballNbr % 6);
                                                        return bInOver === 6 ? `${ov + 1}.0` : `${ov}.${bInOver}`;
                                                      })()}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Center: text */}
                                                <div className="flex-1 min-w-0">
                                                  {/* Event text & badges */}
                                                  <div className="flex flex-col gap-2.5">
                                                    <div className="text-[14px] text-foreground/90 leading-[1.7] font-medium tracking-tight">
                                                      {(() => {
                                                        // Remove raw markdown asterisks
                                                        let text = (item.commText || '').replace(/\*\*(.*?)\*\*/g, '$1');

                                                        // Replace names inside text
                                                        if (item.batsman) {
                                                          const rawBatsman = item.batsman.trim();
                                                          if (rawBatsman) text = text.replace(new RegExp(rawBatsman, 'g'), formatPlayerName(rawBatsman));
                                                        }
                                                        if (item.bowler) {
                                                          const rawBowler = item.bowler.trim();
                                                          if (rawBowler) text = text.replace(new RegExp(rawBowler, 'g'), formatPlayerName(rawBowler));
                                                        }

                                                        const highlightMilestones = (str: string) => {
                                                          if (!isMilestone && !/(fifty|hundred|century|half century|half-century|\b50\b|\b100\b)/i.test(str)) return str;
                                                          const parts = str.split(/(fifty|hundred|century|half century|half-century|\b50\b|\b100\b)/i);
                                                          return parts.map((part, i) =>
                                                            i % 2 === 1 ? <strong key={i} className="font-bold text-primary">{part.toUpperCase()}</strong> : part
                                                          );
                                                        };

                                                        // Format the classic "Bowler to Batsman," prefix for premium readability
                                                        const prefixMatch = text.match(/^(.*?\s+to\s+.*?,\s*)(.*)$/i);
                                                        if (prefixMatch) {
                                                          const [, prefix, rest] = prefixMatch;
                                                          return (
                                                            <>
                                                              <span className="font-semibold text-foreground/60">{prefix}</span>
                                                              <span className="text-foreground/90">{highlightMilestones(rest)}</span>
                                                            </>
                                                          );
                                                        }
                                                        return <span className="text-foreground/90">{highlightMilestones(text)}</span>;
                                                      })()}
                                                    </div>

                                                    {/* Event Badges Below */}
                                                    {eventLabel && (
                                                      <div className="flex items-center mt-1">
                                                        <span className={cn(
                                                          "inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-sm backdrop-blur-md",
                                                          isWicket ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                            isMilestone ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                                              isSix ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                                isFour ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                                                  isOverComplete ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                                    "bg-secondary/50 text-muted-foreground border border-border/40"
                                                        )}>
                                                          {eventIcon && <span className="opacity-80">{eventIcon}</span>}
                                                          {eventLabel}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Right: runs badge for scoring balls */}
                                                {item.legalRuns != null && item.legalRuns > 0 && !isWicket && (
                                                  <div className="shrink-0 self-center hidden sm:block">
                                                    <div className={cn(
                                                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border transition-all duration-300",
                                                      isSix ? "bg-amber-500/10 border-amber-500/30 text-amber-500 group-hover:bg-amber-500/20" :
                                                        isFour ? "bg-blue-500/10 border-blue-500/30 text-blue-500 group-hover:bg-blue-500/20" :
                                                          "bg-muted/20 border-border/30 text-foreground/60 group-hover:bg-muted/40"
                                                    )}>
                                                      {item.legalRuns}
                                                    </div>
                                                  </div>
                                                )}
                                                {isWicket && (
                                                  <div className="shrink-0 self-center hidden sm:block">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 transition-all duration-300">
                                                      <span className="text-lg opacity-80">≡ƒÅÅ</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}

                        </div>
                      );
                    })()
                  ) : cbCommentaryField.data?.commentary && cbCommentaryField.data.commentary.length > 0 ? (
                    /* -- Cricbuzz Highlight Commentary Fallback --------------- */
                    <div className="space-y-3">
                      {cbCommentaryField.data.commentary.map((item: any, idx: number) => {
                        const icon = item.eventType === 'WICKET' ? 'Γÿ¥∩╕Å' : item.eventType === 'SIX' ? '6∩╕ÅΓâú' : item.eventType === 'FOUR' ? '4∩╕ÅΓâú' : '•';
                        return (
                          <div key={idx} className="relative pl-8 pb-2 last:pb-0 border-l border-border/60 last:border-l-0">
                            <div className={cn("absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full", item.eventType === 'WICKET' ? "bg-red-500" : item.eventType === 'SIX' ? "bg-yellow-400" : item.eventType === 'FOUR' ? "bg-blue-400" : "bg-primary/60")} />
                            <div className="flex items-center gap-2 mb-1">
                              {item.overNum != null && (<span className="text-xs font-bold font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">Ov {item.overNum}</span>)}
                              <span className="text-sm">{icon}</span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/50">{item.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : commentaryField.data?.bpiList && commentaryField.data.bpiList.length > 0 ? (
                    /* -- CricketData.org bpiList Fallback ------------------- */
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
                              <div className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded">{over !== 'General' ? `Over ${over}` : 'Highlights'}</div>
                              <div className="h-px flex-1 bg-border/50" />
                            </div>
                            <div className="space-y-2">
                              {grouped[over].map((text: string, tIdx: number) => (
                                <div key={tIdx} className="bg-secondary/30 p-3 rounded-lg text-sm text-foreground/90 border border-border/50">{text}</div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : cbFullCommentaryField.error ? (
                    /* -- Error state ------------------------------------------ */
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="mx-auto h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">Commentary temporarily unavailable</p>
                      <p className="text-xs mt-1 opacity-60">Data will refresh shortly</p>
                    </div>
                  ) : (
                    /* -- Empty / upcoming ------------------------------------- */
                    <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                      <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-20" />
                      {isUpcoming ? (
                        <>
                          <h3 className="text-lg font-semibold text-foreground/80 mb-2">Match not started yet</h3>
                          <p className="text-sm opacity-80">Commentary will be available once play begins.</p>
                        </>
                      ) : (
                        <p>No commentary available for this match.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>


            {match?.sport === 'cricket' && !isIPL && (
              <TabsContent value="graphs" className="animate-fade-in">
                {isUpcoming ? (
                  <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                    <Activity className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold text-foreground/80 mb-2">Match not started yet</h3>
                    <p className="text-sm opacity-80">Over by over map will be available once play begins.</p>
                  </div>
                ) : (
                  <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                    <GraphsTab
                    matchId={id || ""}
                    inningsList={cbScorecardField.data?.innings?.map((inn: any) => {
                      const rawName = inn.teamName || inn.inningsName || `Innings ${inn.inningsNumber || inn.inningsId}`;
                      let formattedName = rawName;
                      if (rawName.includes(' Innings')) {
                        const [teamPart, innPart] = rawName.split(' Innings');
                        let abbr = teamPart.trim();
                        const abbrMap: Record<string, string> = { "New Zealand": "NZ", "England": "ENG", "Australia": "AUS", "India": "IND", "South Africa": "RSA", "West Indies": "WI", "Pakistan": "PAK", "Sri Lanka": "SL", "Bangladesh": "BAN", "Afghanistan": "AFG" };
                        if (abbrMap[abbr]) abbr = abbrMap[abbr];
                        formattedName = `${abbr} (${innPart.trim().split(' ')[0]} Inn)`;
                      }
                      return {
                        id: inn.inningsNumber || inn.inningsId,
                        name: formattedName
                      };
                    }) || [{ id: 1, name: 'Innings 1' }, { id: 2, name: 'Innings 2' }]}
                    syncTrigger={summaryUpdatedAt}
                    isLive={match?.status === 'live'}
                    isActive={activeTab === 'graphs'}
                    onBallsCalculated={setOversBalls}
                  />
                </Suspense>
                )}
              </TabsContent>
            )}


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

          <PlayerProfilePanel
            playerId={selectedPlayerId}
            isOpen={!!selectedPlayerId}
            onClose={() => setSelectedPlayerId(null)}
            fallbackName={selectedPlayerName}
            faceImageId={getPlayerImageId(selectedPlayerName)}
          />
        </section>
      </div>
    </>
  );
};

export default MatchDetails;