import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { FootballTeamLogo as TeamLogo } from "../../components/football/FootballTeamLogo";
import { LineupPlayerImage } from "../../components/football/LineupPlayerImage";
import { useEspnMatchDetail } from "../../hooks/football/useEspnQueries";
import { PerformanceLabTab } from "../../components/football/PerformanceLabTab";
import {
  Loader2, ArrowLeft, Clock, Activity, ListOrdered,
  Users, User, BarChart3, Info, Heart, CircleDot, ArrowDown, ArrowUp, ArrowLeftRight, PlayCircle,
  MapPin, Tv, ShieldCheck, Trophy, Calendar, Thermometer
} from "lucide-react";
import { favoritesApi } from "../../services/api";
import { useToast } from "../../hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet-async";
import { PlayerProfileDialog } from "../../components/PlayerProfileDialog";
import { Player } from "../../data/types";

const API_BASE = import.meta.env.VITE_API_URL || '';

const TEAM_COLORS: Record<string, string> = {
  'argentina': '#0284c7', 'brazil': '#ca8a04', 'france': '#002654', 'england': '#1e3a8a',
  'spain': '#C60B1E', 'italy': '#1e3a8a', 'germany': '#1c1917', 'netherlands': '#FF6F00',
  'belgium': '#7f1d1d', 'croatia': '#991b1b', 'mexico': '#14532d', 'south korea': '#7f1d1d',
  'curacao': '#0055A4', 'turkiye': '#E30A17', 'australia': '#ca8a04',
};

const getTeamColor = (teamName: string, isHome: boolean) => {
  if (!teamName) return isHome ? '#2563eb' : '#dc2626';
  const name = teamName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return TEAM_COLORS[name] || (isHome ? '#2563eb' : '#dc2626');
};

const getDepth = (pos: string) => {
  const p = (pos || "").toLowerCase();
  if (p.includes("goal")) return 0;
  if (p.includes("back") || p.includes("defend")) return 1;
  if (p.includes("attacking mid") || p.includes("winger")) return 3;
  if (p.includes("mid")) return 2;
  if (p.includes("forward") || p.includes("strik")) return 4;
  return 5;
};

const getHorizontal = (pos: string) => {
  const p = (pos || "").toLowerCase();
  if (p.includes("center right")) return 2;
  if (p.includes("center left")) return 4;
  if (p.includes("right")) return 1;
  if (p.includes("left")) return 5;
  return 3;
};

const parseFormation = (formationStr: string | undefined, starters: any[]) => {
  const formStr = formationStr || "4-4-2";
  const counts = [1, ...formStr.split('-').map(Number)]; // 1 is always the GK
  
  const sorted = [...starters].sort((a, b) => {
     const posA = a.position?.name || "";
     const posB = b.position?.name || "";
     const depthDiff = getDepth(posA) - getDepth(posB);
     if (depthDiff !== 0) return depthDiff;
     return getHorizontal(posA) - getHorizontal(posB);
  });

  const rows = [];
  let currentIndex = 0; 
  for (const count of counts) {
      if (currentIndex >= sorted.length) break;
      rows.push(sorted.slice(currentIndex, currentIndex + count));
      currentIndex += count;
  }
  return rows;
};

const generateRating = (id: string | number) => {
   const seed = String(id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
   const random = Math.sin(seed) * 10000;
   const val = random - Math.floor(random);
   return (6.0 + val * 3.5).toFixed(1);
};

const getRatingColor = (r: string) => {
  const val = parseFloat(r);
  if (val >= 8.0) return 'bg-green-500 text-white border-green-700';
  if (val >= 7.0) return 'bg-emerald-500 text-white border-emerald-700';
  if (val >= 6.0) return 'bg-yellow-500 text-white border-yellow-700';
  return 'bg-red-500 text-white border-red-700';
};

const getStatValue = (stats: any[], name: string) => {
  return stats?.find((s: any) => s.name === name)?.value || 0;
};

export default function MatchCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "events" | "lineups" | "statistics" | "performance">("summary");
  const [activeStatCategory, setActiveStatCategory] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerClick = (p: any, teamId: string) => {
    const goals = getStatValue(p.stats, "totalGoals");
    const assists = getStatValue(p.stats, "goalAssists");
    const yellowCards = getStatValue(p.stats, "yellowCards");
    const redCards = getStatValue(p.stats, "redCards");
    const saves = getStatValue(p.stats, "saves");
    
    const mappedPlayer: Player = {
      id: p.athlete.id,
      name: p.athlete.displayName,
      teamId: teamId,
      sport: "football",
      position: p.position?.name || "Unknown",
      rating: parseFloat(generateRating(p.athlete.id)),
      leagueId: matchData?.header?.league?.slug || "eng.1",
      stats: {
        Goals: goals,
        Assists: assists,
        "Yellow Cards": yellowCards,
        "Red Cards": redCards,
        Saves: saves,
      },
      matchStats: {
        goals,
        assists,
        yellowCards,
        redCards,
        saves,
        rating: parseFloat(generateRating(p.athlete.id)),
        substitutedIn: p.subbedIn ? "Yes" : undefined,
        substitutedOut: p.subbedOut ? "Yes" : undefined,
      },
      rawMatchStats: p.stats?.reduce((acc: any, s: any) => {
        acc[s.name] = s.value;
        return acc;
      }, {}),
      personalInfo: {
        height: p.athlete.height,
        weight: p.athlete.weight,
        age: p.athlete.age,
        jersey: p.athlete.jersey,
        country: p.athlete.flag?.alt,
      },
      image: `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete.id}.png`,
    };
    setSelectedPlayer(mappedPlayer);
  };

  const { data: matchData, isLoading, error } = useEspnMatchDetail(id || "", !!id);

  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-10 h-10 animate-spin text-emerald-500 mb-4"
          >
            <circle cx="12" cy="12" r="10"/>
            <polygon points="12 6 8.5 9.5 10 14.5 14 14.5 15.5 9.5"/>
            <line x1="12" y1="6" x2="12" y2="2"/>
            <line x1="8.5" y1="9.5" x2="2.5" y2="9"/>
            <line x1="10" y1="14.5" x2="6.5" y2="19"/>
            <line x1="14" y1="14.5" x2="17.5" y2="19"/>
            <line x1="15.5" y1="9.5" x2="21.5" y2="9"/>
          </svg>
          <p className="text-muted-foreground animate-pulse font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Match Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't load the details for this match.</p>
          <button onClick={() => navigate('/football')} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-colors">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const header = matchData.header;
  if (!header || !header.competitions || header.competitions.length === 0) return null;
  
  const comp = header.competitions[0];
  const homeTeamObj = comp.competitors.find((c: any) => c.homeAway === 'home');
  const awayTeamObj = comp.competitors.find((c: any) => c.homeAway === 'away');
  
  const homeTeam = homeTeamObj?.team || {};
  const awayTeam = awayTeamObj?.team || {};
  const status = comp.status?.type?.detail || "Scheduled";
  const statusState = comp.status?.type?.state || "pre"; // pre, in, post
  const date = comp.date || "";
  
  // Merge keyEvents with important commentary events
  const rawKeyEvents = matchData.keyEvents || [];
  const commentaries = matchData.commentary || [];
  
  const importantPlayTypes = ['Shot On Target', 'VAR', 'Missed Penalty', 'Penalty', 'Shot Hit Woodwork', 'Shot Off Target', 'Corner', 'Save', 'Foul', 'Offside'];
  const additionalEvents = commentaries
    .map((c: any) => c.play)
    .filter((play: any) => play && importantPlayTypes.some(t => play.type?.text?.toLowerCase().includes(t.toLowerCase())));
    
  const allEventsMap = new Map();
  [...rawKeyEvents, ...additionalEvents].forEach((evt: any) => {
      if (evt && evt.id) {
          allEventsMap.set(evt.id, evt);
      }
  });
  
  let keyEvents = Array.from(allEventsMap.values());
  keyEvents = keyEvents.filter((evt: any) => {
      const typeText = (evt.type?.text || "").toLowerCase();
      const text = (evt.text || "").toLowerCase();
      
      const isStartEnd = typeText.includes('end regular time') || 
                         typeText.includes('start of') || 
                         typeText.includes('end of') ||
                         typeText.includes('match ends') ||
                         text.includes('match ends') ||
                         text.includes('first half begins') ||
                         text.includes('second half begins') ||
                         text.includes('match starts') ||
                         text.includes('end regular time');
      const isDelay = typeText.includes('delay') || text.includes('delay');
      
      return !isStartEnd && !isDelay;
  });
  
  // Sort events by period and clock (ascending, same as ESPN default for summary)
  keyEvents.sort((a: any, b: any) => {
      const pA = a.period?.number || Math.floor((a.clock?.value || 0) / 2700) + 1;
      const pB = b.period?.number || Math.floor((b.clock?.value || 0) / 2700) + 1;
      if (pA !== pB) return pA - pB;
      const timeA = a.clock?.value || 0;
      const timeB = b.clock?.value || 0;
      return timeA - timeB;
  });
  const homeStats = matchData.boxscore?.teams?.find((t: any) => t.team.id === homeTeam.id)?.statistics || [];
  const awayStats = matchData.boxscore?.teams?.find((t: any) => t.team.id === awayTeam.id)?.statistics || [];
  
  const homeRoster = matchData.rosters?.find((r: any) => r.team.id === homeTeam.id)?.roster || [];
  const awayRoster = matchData.rosters?.find((r: any) => r.team.id === awayTeam.id)?.roster || [];

  const gameInfo = matchData.gameInfo || {};
  const venue = gameInfo.venue || comp.venue || {};
  const officials = gameInfo.officials || [];
  const attendance = gameInfo.attendance;
  const weather = gameInfo.weather;
  const broadcasts = matchData.broadcasts || [];

  const details = matchData.details || matchData.keyEvents || [];
  const homeGoals = details.filter((d: any) => d.scoringPlay && d.team?.id === homeTeam.id);
  const awayGoals = details.filter((d: any) => d.scoringPlay && d.team?.id === awayTeam.id);

  const getFlagUrl = (team: any) => {
    if (!team.abbreviation) return team.logo;
    const FIFAToISO: Record<string, string> = { 'GER': 'de', 'CUW': 'cw', 'CUR': 'cw', 'TUR': 'tr', 'ENG': 'gb-eng', 'FRA': 'fr', 'ESP': 'es', 'ITA': 'it', 'NED': 'nl', 'POR': 'pt', 'BRA': 'br', 'ARG': 'ar', 'USA': 'us', 'MEX': 'mx', 'BEL': 'be', 'CRO': 'hr', 'URU': 'uy', 'COL': 'co', 'SEN': 'sn', 'MAR': 'ma', 'JPN': 'jp', 'KOR': 'kr', 'AUS': 'au', 'CAN': 'ca' };
    const iso = FIFAToISO[team.abbreviation.toUpperCase()];
    if (iso) return `https://flagcdn.com/w160/${iso}.png`;
    return team.logo;
  };

  const renderGoals = (goals: any[], isHome: boolean) => {
    if (!goals.length) return <div className="mt-4 flex flex-col gap-1.5 w-full"></div>;
    return (
      <div className={cn("flex flex-col gap-1.5 mt-4 w-full", isHome ? "items-end" : "items-start")}>
        {goals.map((g: any, i: number) => {
          const scorer = g.participants?.find((p: any) => p.type === 'scorer' || !p.type)?.athlete?.displayName || g.text?.split(' ')[0] || "Goal";
          let assist = g.participants?.find((p: any) => p.type === 'assist')?.athlete?.displayName || "";
          
          if (!assist && g.text) {
             const assistMatch = g.text.match(/Assisted by ([A-Za-z\s\-]+)[\.\,]/);
             if (assistMatch) {
                 assist = assistMatch[1].split(' with ')[0].split(' following ')[0].split(' from ')[0].trim();
             }
          }
          
          const time = g.clock?.displayValue || g.time || "";
          
          return (
            <div key={i} className={cn("flex items-center gap-2 text-xs", isHome ? "flex-row" : "flex-row-reverse")}>
               <span className="font-semibold text-foreground/90">{scorer} {assist && <span className="text-muted-foreground font-normal ml-1">({assist})</span>}</span>
               <span className="text-[10px] text-emerald-500 font-bold">{time}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPitchPlayer = (p: any, teamColor: string, teamId: string) => {
    const rating = generateRating(p.athlete.id);
    const goals = getStatValue(p.stats, "totalGoals");
    const assists = getStatValue(p.stats, "goalAssists");
    const yellowCards = getStatValue(p.stats, "yellowCards");
    const redCards = getStatValue(p.stats, "redCards");
    const isRedCarded = redCards > 0;
    
    return (
      <div 
        key={p.athlete.id} 
        onClick={() => handlePlayerClick(p, teamId)}
        className={cn("flex flex-col items-center justify-center w-20 md:w-24 group z-10 transition-transform hover:scale-110 relative cursor-pointer", isRedCarded && "opacity-50 grayscale")}
      >
        <div className="relative mt-0.5">
          <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.6)] border-[3px] overflow-hidden bg-secondary" style={{ borderColor: teamColor }}>
            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground font-black text-xl z-0 drop-shadow-md">{p.jersey}</span>
            <LineupPlayerImage playerId={p.athlete.id} playerName={p.athlete.displayName} className="absolute inset-0 w-full h-full object-cover z-10 bg-secondary" />
          </div>

          {goals > 0 && (
            <div className="absolute -top-1.5 -left-1.5 z-30 flex items-center justify-center w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title={`Goal (${goals})`}>
              <span className="text-lg md:text-xl absolute">⚽</span>
              {goals > 1 && <span className="absolute -bottom-0.5 -right-0.5 z-10 text-[9px] leading-none font-black text-white bg-[#e11d48] rounded-full w-[14px] h-[14px] flex items-center justify-center border border-white shadow-sm">{goals}</span>}
            </div>
          )}

          {assists > 0 && (
            <div className="absolute -top-1.5 -right-1.5 z-30 flex items-center justify-center w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title={`Assist (${assists})`}>
              <span className="text-lg md:text-xl absolute">👟</span>
              {assists > 1 && <span className="absolute -bottom-0.5 -right-0.5 z-10 text-[9px] leading-none font-black text-white bg-[#e11d48] rounded-full w-[14px] h-[14px] flex items-center justify-center border border-white shadow-sm">{assists}</span>}
            </div>
          )}

          {(yellowCards > 0 || redCards > 0) && (
            <div className="absolute top-1/2 -translate-y-1/2 -right-2 flex flex-col gap-0.5 z-30 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
               {yellowCards > 0 && <div className="w-2.5 h-3.5 bg-[#FFCC00] shadow-sm rounded-none border border-black/20" title="Yellow Card" />}
               {redCards > 0 && <div className="w-2.5 h-3.5 bg-[#FF3333] shadow-sm rounded-none border border-black/20" title="Red Card" />}
            </div>
          )}

          {(p.subbedOut || p.subbedIn) && (
            <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 flex flex-col gap-1 z-30">
               {p.subbedOut && <div className="bg-red-500 rounded-full border-[1.5px] border-white shadow-md p-0.5" title="Subbed Out"><ArrowDown className="w-2.5 h-2.5 md:w-3 md:h-3 text-white stroke-[3]" /></div>}
               {p.subbedIn && <div className="bg-emerald-500 rounded-full border-[1.5px] border-white shadow-md p-0.5" title="Subbed In"><ArrowUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-white stroke-[3]" /></div>}
            </div>
          )}
        </div>
        
        <div className="mt-1.5 text-[11px] md:text-xs text-white/90 font-bold tracking-wide text-center truncate w-full z-20 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] px-1">
          {(() => {
            const parts = p.athlete.displayName.trim().split(/\s+/);
            if (parts.length <= 1) return p.athlete.displayName;
            return `${parts[0][0].toUpperCase()}.${parts.slice(1).join(' ')}`;
          })()}
        </div>
      </div>
    );
  };

  const renderSubstituteRow = (p: any, teamColor: string, teamId: string) => {
    const rating = generateRating(p.athlete.id);
    const goals = getStatValue(p.stats, "totalGoals");
    const assists = getStatValue(p.stats, "goalAssists");
    const yellowCards = getStatValue(p.stats, "yellowCards");
    const redCards = getStatValue(p.stats, "redCards");
    
    return (
      <div 
        key={p.athlete.id} 
        onClick={() => handlePlayerClick(p, teamId)}
        className="flex items-center gap-3 py-2 border-b border-border/10 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded-md cursor-pointer"
      >
        <div className="w-5 text-right shrink-0">
          <span className="text-xs font-mono font-semibold text-muted-foreground">{p.jersey}</span>
        </div>
        <div className="relative w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center font-bold text-xs border-[2px] overflow-hidden shrink-0 shadow-sm" style={{ borderColor: teamColor }}>
          <span className="absolute z-0">{p.jersey}</span>
          <LineupPlayerImage playerId={p.athlete.id} playerName={p.athlete.displayName} className="absolute inset-0 w-full h-full object-cover z-10 bg-background" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span className="font-semibold text-sm tracking-tight text-foreground truncate leading-tight">
            {(() => {
              const parts = p.athlete.displayName.trim().split(/\s+/);
              if (parts.length <= 1) return p.athlete.displayName;
              return `${parts[0][0].toUpperCase()}.${parts.slice(1).join(' ')}`;
            })()}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{p.position?.name || "Sub"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {goals > 0 && <span title="Goal" className="text-xs drop-shadow-md">⚽</span>}
          {assists > 0 && <span title="Assist" className="text-xs drop-shadow-md">👟</span>}
          {yellowCards > 0 && <div className="w-2.5 h-3.5 bg-[#FFCC00] shadow-sm rounded-sm" />}
          {redCards > 0 && <div className="w-2.5 h-3.5 bg-[#FF3333] shadow-sm rounded-sm" />}
          {p.subbedIn && <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />}
        </div>
      </div>
    );
  };

  const homeFormation = matchData.rosters?.find((r: any) => r.team.id === homeTeam.id)?.formation || "4-4-2";
  const awayFormation = matchData.rosters?.find((r: any) => r.team.id === awayTeam.id)?.formation || "4-4-2";
  const homeStarters = homeRoster.filter((p:any) => p.starter);
  const awayStarters = awayRoster.filter((p:any) => p.starter);
  const homeSubs = homeRoster.filter((p:any) => !p.starter);
  const awaySubs = awayRoster.filter((p:any) => !p.starter);
  const homeRows = parseFormation(homeFormation, homeStarters);
  const awayRows = parseFormation(awayFormation, awayStarters);
  const homeTeamColor = getTeamColor(homeTeam.name, true);
  const awayTeamColor = getTeamColor(awayTeam.name, false);

  const homeCoach = matchData.rosters?.find((r: any) => r.team.id === homeTeam.id)?.coach?.[0];
  const awayCoach = matchData.rosters?.find((r: any) => r.team.id === awayTeam.id)?.coach?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Helmet>
        <title>{homeTeam.name} vs {awayTeam.name} - SportBuzz</title>
      </Helmet>
      
      <Navbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-10 flex flex-col gap-8">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold tracking-wide uppercase">Back</span>
        </button>

        {/* Redesigned Match Header Card (Screenshot Style) */}
        <div className="w-full bg-[#131313] md:bg-secondary/20 rounded-[2rem] border border-border/10 flex flex-col p-6 md:p-8 relative overflow-hidden shadow-2xl">
          
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/10 pb-4 md:pb-6 gap-4 text-xs md:text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-4">
              {statusState === 'in' ? (
                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="uppercase tracking-widest font-bold text-[10px]">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-foreground/50 bg-secondary px-2 py-1 rounded-md">
                  <span className="uppercase tracking-widest font-bold text-[10px]">{statusState === 'post' ? 'FINISHED' : 'PRE-MATCH'}</span>
                </div>
              )}
              <span className="uppercase tracking-widest">{matchData.header?.league?.name || matchData.header?.season?.name || "Match"}</span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 flex-wrap">
              {venue && (
                 <div className="flex items-center gap-1.5">
                   <MapPin className="w-4 h-4" />
                   <span>{venue.fullName}</span>
                 </div>
              )}
              {date && (
                 <div className="flex items-center gap-1.5">
                   <Clock className="w-4 h-4" />
                   <span>{new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                 </div>
              )}
            </div>
          </div>

          {/* Middle Section: Teams & Score */}
          <div className="flex flex-col md:flex-row items-start justify-center py-12 md:py-16 gap-6 md:gap-16 relative">
            
            {/* Home Team */}
            <div className="flex flex-col flex-1 items-end w-full md:w-auto mt-4 md:mt-0">
               <div className="flex items-center gap-5 md:gap-6 justify-end w-full">
                  <div className="flex flex-col items-end text-right">
                     <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{homeTeam.name}</h2>
                     <span className="text-sm md:text-base text-muted-foreground tracking-widest mt-1 uppercase">{homeTeam.abbreviation}</span>
                  </div>
                  <div className="shrink-0 hidden md:block relative">
                     <TeamLogo logo={getFlagUrl(homeTeam)} name={homeTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                  </div>
               </div>
               <div className="w-full text-right pr-2 mt-2">
                  {renderGoals(homeGoals, true)}
               </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 md:gap-8 font-black tracking-tighter shrink-0 pt-2 md:pt-4">
               <span className={cn("text-5xl md:text-[5rem] leading-none", statusState === 'post' && homeTeamObj.winner ? "text-emerald-500" : "text-foreground")}>
                 {homeTeamObj?.score || "0"}
               </span>
               <span className="text-3xl md:text-5xl text-muted-foreground/20 font-light pb-2">-</span>
               <span className={cn("text-5xl md:text-[5rem] leading-none", statusState === 'post' && awayTeamObj.winner ? "text-emerald-500" : "text-foreground")}>
                 {awayTeamObj?.score || "0"}
               </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col flex-1 items-start w-full md:w-auto mt-4 md:mt-0">
               <div className="flex items-center gap-5 md:gap-6 justify-start w-full flex-row-reverse md:flex-row">
                  <div className="shrink-0 hidden md:block relative">
                     <TeamLogo logo={getFlagUrl(awayTeam)} name={awayTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                     <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{awayTeam.name}</h2>
                     <span className="text-sm md:text-base text-muted-foreground tracking-widest mt-1 uppercase">{awayTeam.abbreviation}</span>
                  </div>
               </div>
               <div className="w-full text-left pl-2 mt-2">
                  {renderGoals(awayGoals, false)}
               </div>
            </div>

            {/* Mobile Logos (hidden on desktop, replaces the side logos) */}
            <div className="flex items-center justify-center gap-12 w-full md:hidden mt-6 mb-4">
               <div className="shrink-0 relative">
                  <TeamLogo logo={getFlagUrl(homeTeam)} name={homeTeam.name} className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
               </div>
               <div className="shrink-0 relative">
                  <TeamLogo logo={getFlagUrl(awayTeam)} name={awayTeam.name} className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
               </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between border-t border-border/10 pt-4 md:pt-6 gap-4">
            <div className="flex flex-col items-start gap-1">
               <span className={cn("text-sm font-black tracking-widest uppercase", statusState === 'in' ? "text-red-500" : "text-emerald-500")}>
                  {statusState === 'in' ? 'MATCH IN PROGRESS' : status}
               </span>
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {statusState === 'in' ? status : (matchData.header?.season?.name || 'Football Match')}
               </span>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                  onClick={async () => {
                    if (!matchData) return;
                    try {
                      if (isFavorite && favoriteId) {
                        await favoritesApi.remove(favoriteId);
                        setIsFavorite(false);
                        setFavoriteId(null);
                        toast({ title: "Removed", description: "Match removed from favorites" });
                      } else {
                        const header = matchData.header;
                        const comp = header?.competitions?.[0];
                        const dateStr = comp?.date || header?.season?.year?.toString() || new Date().toISOString();
                        const homeTeam = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team || { name: 'Home' };
                        const awayTeam = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team || { name: 'Away' };
                        const venue = matchData.gameInfo?.venue;

                        const statusMap: Record<string, string> = { 'pre': 'upcoming', 'in': 'live', 'post': 'completed' };
                        const dbStatus = statusMap[statusState] || 'upcoming';

                        const response = await favoritesApi.add({
                          matchId: id,
                          sport: 'football',
                          teams: {
                            team1: homeTeam.name,
                            team2: awayTeam.name
                          },
                          date: new Date(dateStr).toISOString(),
                          venue: venue?.fullName || venue?.address?.city || "Unknown Venue",
                          status: dbStatus
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
                    "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-colors",
                    isFavorite ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" : "border-border/30 text-foreground hover:bg-secondary"
                  )}
               >
                  <Heart className={cn("w-4 h-4", isFavorite ? "fill-current" : "")} /> {isFavorite ? "Saved" : "Save"}
               </button>
               <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/30 text-sm font-bold text-foreground hover:bg-secondary transition-colors">
                  <Tv className="w-4 h-4" /> Share
               </button>
            </div>
          </div>

        </div>

        {/* Tabs */}
        <div className="px-4 md:px-0 mt-4">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="w-full bg-transparent border-b border-border/50 rounded-none p-0 h-auto flex flex-wrap gap-8 justify-start">
              <TabsTrigger value="summary" className="rounded-none py-3 px-1 text-sm font-bold border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"><Info className="w-4 h-4 mr-2" />Summary</TabsTrigger>
              <TabsTrigger value="events" className="rounded-none py-3 px-1 text-sm font-bold border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"><ListOrdered className="w-4 h-4 mr-2" />Key Events</TabsTrigger>
              <TabsTrigger value="statistics" className="rounded-none py-3 px-1 text-sm font-bold border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"><BarChart3 className="w-4 h-4 mr-2" />Stats</TabsTrigger>
              <TabsTrigger value="lineups" className="rounded-none py-3 px-1 text-sm font-bold border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"><Users className="w-4 h-4 mr-2" />Lineups</TabsTrigger>
              <TabsTrigger value="performance" className="rounded-none py-3 px-1 text-sm font-bold border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 text-emerald-500/60 hover:text-emerald-500 transition-colors"><Activity className="w-4 h-4 mr-2" />Performance Lab</TabsTrigger>
            </TabsList>

            {/* SUMMARY TAB */}
            <TabsContent value="summary" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-12">
                
                {/* MATCH INFO BENTO CARD */}
                <div className="md:col-span-8 bg-secondary/20 border border-border/50 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Trophy className="w-40 h-40 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Info className="w-5 h-5 text-blue-500"/> Match Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                     {/* Venue */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-emerald-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-emerald-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-0.5">Venue</p>
                              <p className="font-bold text-sm leading-tight">{venue.fullName || "TBD"}</p>
                           </div>
                        </div>
                        <div className="mt-1 space-y-1">
                           {venue.address && <p className="text-xs text-foreground/70">{venue.address.city}{venue.address.country ? `, ${venue.address.country}` : ''}</p>}
                           {venue.capacity > 0 && <p className="text-xs text-foreground/50">Capacity: {venue.capacity.toLocaleString()}</p>}
                        </div>
                     </div>

                     {/* Date & Time */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-blue-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5 text-blue-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-0.5">Date & Time</p>
                              <p className="font-bold text-sm leading-tight">{new Date(comp.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                           </div>
                        </div>
                        <div className="mt-1 space-y-1">
                           <p className="text-xs text-foreground/70">{new Date(comp.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                     </div>

                     {/* Referee */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-purple-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5 text-purple-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-purple-500/80 uppercase tracking-widest mb-0.5">Match Official</p>
                              <p className="font-bold text-sm leading-tight">{officials.length > 0 ? officials[0].displayName : "TBD"}</p>
                           </div>
                        </div>
                        <div className="mt-1 space-y-1">
                           {officials.length > 0 && <p className="text-xs text-foreground/70">{officials[0].position?.displayName || "Referee"}</p>}
                        </div>
                     </div>

                     {/* Pitch Surface */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-emerald-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-emerald-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-0.5">Pitch Surface</p>
                              <p className="font-bold text-sm leading-tight">
                                {venue.grass !== undefined ? (venue.grass ? "Natural Grass" : (venue.indoor ? "Indoor" : "Artificial")) : "Unknown Surface"}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Tournament Phase */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-orange-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                              <Trophy className="w-5 h-5 text-orange-500" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest mb-0.5">Tournament Phase</p>
                              <p className="font-bold text-sm leading-tight">
                                {comp.type?.abbreviation || comp.type?.name || "Regular Stage"}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Attendance & Weather */}
                     <div className="flex flex-col gap-3 bg-secondary/30 rounded-2xl p-4 border border-border/30 hover:border-yellow-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-yellow-500" />
                           </div>
                           <div>
                              {attendance > 0 ? (
                                <>
                                  <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-0.5">Match Crowd</p>
                                  <p className="font-bold text-sm leading-tight">{attendance.toLocaleString()} Attending</p>
                                </>
                              ) : venue?.capacity ? (
                                <>
                                  <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-0.5">Stadium Capacity</p>
                                  <p className="font-bold text-sm leading-tight">{venue.capacity.toLocaleString()} Seats</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-0.5">Location</p>
                                  <p className="font-bold text-sm leading-tight">{venue?.address?.city || venue?.fullName || "Unknown Location"}</p>
                                </>
                              )}
                           </div>
                        </div>
                        <div className="mt-1 space-y-1">
                           {weather && (
                              <div className="flex items-center gap-1 text-xs text-foreground/70">
                                <Thermometer className="w-3.5 h-3.5" />
                                <span>{weather.displayValue || `${weather.temperature}°`}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                </div>

                {/* SIDE COLUMN: BROADCASTS & FORM */}
                <div className="md:col-span-4 flex flex-col gap-6">
                   
                   {/* Form Guide */}
                   <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6 hover:border-orange-500/30 transition-colors">
                      <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500"/> Form Guide</h3>
                      {matchData.lastFiveGames && matchData.lastFiveGames.length > 0 ? (
                         <div className="space-y-4">
                            {matchData.lastFiveGames.map((teamForm: any, i: number) => {
                               const teamData = teamForm.team || {};
                               const events = teamForm.events || [];
                               const isHome = teamData.id === homeTeam.id;
                               const t = isHome ? homeTeam : (teamData.id === awayTeam.id ? awayTeam : teamData);
                               
                               return (
                                 <div key={i} className="flex items-center justify-between p-2 rounded-2xl hover:bg-secondary/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                       <TeamLogo logo={t.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${t.id}.png`} name={t.name || t.abbreviation} className="w-8 h-8 drop-shadow-md" />
                                       <span className="font-bold text-sm truncate max-w-[80px]">{t.abbreviation || t.name}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                       {events.slice(0, 5).map((ev: any, j: number) => {
                                          const resultColors: any = { W: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50", D: "bg-gray-500/20 text-gray-400 border-gray-500/50", L: "bg-red-500/20 text-red-500 border-red-500/50" };
                                          const c = resultColors[ev.gameResult] || "bg-secondary/80 text-foreground border-border/50";
                                          return (
                                             <div key={j} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border hover:scale-110 transition-transform shadow-sm cursor-help ${c}`} title={`${ev.gameResult} vs ${ev.opponent?.abbreviation || 'Opp'} (${ev.score})`}>
                                                {ev.gameResult || "•"}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      ) : (
                         <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-6 opacity-60">
                            <Activity className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs font-semibold uppercase tracking-widest">No Form Data</p>
                         </div>
                      )}
                   </div>

                   {/* Head-to-Head */}
                   {(() => {
                      const h2hData = matchData.headToHeadGames?.[0];
                      if (!h2hData || !h2hData.events) return null;

                      let allH2HEvents = [...h2hData.events];

                      // If the match is completed, inject it into the historical H2H array if not already present
                      if (statusState === 'post' && matchData.header) {
                         const currentMatchId = matchData.header.id;
                         if (!allH2HEvents.some((e: any) => e.id === currentMatchId)) {
                            const h2hTeamId = h2hData.team?.id;
                            const isHomeTeam = homeTeam.id === h2hTeamId;
                            const homeS = parseInt(homeTeamObj?.score || '0');
                            const awayS = parseInt(awayTeamObj?.score || '0');
                            
                            let result = 'D';
                            if (homeS > awayS) result = isHomeTeam ? 'W' : 'L';
                            if (awayS > homeS) result = isHomeTeam ? 'L' : 'W';

                            allH2HEvents.unshift({
                               id: currentMatchId,
                               gameDate: matchData.header.competitions?.[0]?.date || new Date().toISOString(),
                               homeTeamScore: homeTeamObj?.score,
                               awayTeamScore: awayTeamObj?.score,
                               homeTeamId: homeTeam.id,
                               awayTeamId: awayTeam.id,
                               gameResult: result
                            });
                         }
                      }

                      if (allH2HEvents.length === 0) return null;

                      // Tally up the aggregate record based on the injected unified array
                      let w = 0, d = 0, l = 0;
                      allH2HEvents.forEach((ev: any) => {
                         if (ev.gameResult === 'W') w++;
                         else if (ev.gameResult === 'D') d++;
                         else if (ev.gameResult === 'L') l++;
                      });

                      const isH2HTeamHome = h2hData.team?.id === homeTeam.id;
                      const homeWins = isH2HTeamHome ? w : l;
                      const awayWins = isH2HTeamHome ? l : w;

                      return (
                         <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6 hover:border-blue-500/30 transition-colors">
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-blue-500"/> Head-to-Head</h3>
                            
                            {/* Overall Record */}
                            <div className="flex items-center justify-between mb-6 bg-secondary/30 p-4 rounded-2xl border border-border/30">
                               <div className="text-center w-1/3">
                                  <span className="text-2xl font-black text-foreground">{homeWins}</span>
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{homeTeam.abbreviation || "HOME"}</p>
                               </div>
                               <div className="text-center w-1/3 border-x border-border/30">
                                  <span className="text-2xl font-black text-gray-500">{d}</span>
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Draws</p>
                               </div>
                               <div className="text-center w-1/3">
                                  <span className="text-2xl font-black text-foreground">{awayWins}</span>
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{awayTeam.abbreviation || "AWAY"}</p>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 px-1">Recent Encounters</h4>
                               {allH2HEvents.slice(0, 4).map((h2h: any, i: number) => {
                                  const dateStr = new Date(h2h.gameDate).getFullYear();
                                  const h2hHomeScore = h2h.homeTeamScore;
                                  const h2hAwayScore = h2h.awayTeamScore;
                                  
                                  const isH2hHomeCurrentHome = h2h.homeTeamId === homeTeam.id;
                                  const h2hHomeObj = isH2hHomeCurrentHome ? homeTeam : awayTeam;
                                  const h2hAwayObj = isH2hHomeCurrentHome ? awayTeam : homeTeam;
                                  
                                  return (
                                     <div key={i} className="flex items-center justify-between p-2 rounded-2xl bg-secondary/30 border border-border/30 hover:border-blue-500/20 transition-colors">
                                        <div className="text-xs font-bold text-muted-foreground w-10 text-center">{dateStr}</div>
                                        <div className="flex items-center gap-2 flex-1 justify-center">
                                           <TeamLogo logo={h2hHomeObj.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${h2hHomeObj.id}.png`} name={h2hHomeObj.name} size="xs" className="w-5 h-5 object-contain" />
                                           <span className="font-black text-sm w-12 text-center">{h2hHomeScore} - {h2hAwayScore}</span>
                                           <TeamLogo logo={h2hAwayObj.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${h2hAwayObj.id}.png`} name={h2hAwayObj.name} size="xs" className="w-5 h-5 object-contain" />
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      );
                   })()}

                </div>
              </div>
            </TabsContent>

            {/* KEY EVENTS TAB */}
            <TabsContent value="events" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
               <div className="bg-transparent">
                  {keyEvents.length === 0 ? (
                    <div className="text-center py-16 bg-secondary/10 rounded-3xl border border-border/30">
                       <ListOrdered className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4"/>
                       <p className="text-muted-foreground font-medium">No key events recorded yet.</p>
                    </div>
                  ) : (
                    <div className="relative max-w-4xl mx-auto py-8">
                      {/* Center Line */}
                      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent -translate-x-1/2"></div>
                      
                      <div className="space-y-8">
                        {keyEvents.map((evt: any, i: number) => {
                          const homeName = homeTeam.name || "";
                          const awayName = awayTeam.name || "";
                          const evtTeamName = evt.team?.displayName || "";
                          const participantName = evt.participants?.[0]?.athlete?.displayName || "";
                          const isHomeByRoster = participantName && homeRoster.some((r: any) => r.athlete?.displayName === participantName);
                          const isAwayByRoster = participantName && awayRoster.some((r: any) => r.athlete?.displayName === participantName);
                          
                          let isHome = evt.team?.id === homeTeam.id || (evtTeamName && (homeName.includes(evtTeamName) || evtTeamName.includes(homeName)));
                          let isAway = evt.team?.id === awayTeam.id || (evtTeamName && (awayName.includes(evtTeamName) || evtTeamName.includes(awayName)));
                          
                          // 1. Prioritize explicit text mention like "(Egypt)"
                          const textMatch = (evt.text || "").match(/\(([A-Za-z\s]+)\)/);
                          if (textMatch) {
                              const textTeam = textMatch[1].trim().toLowerCase();
                              if (homeName.toLowerCase().includes(textTeam) || textTeam.includes(homeName.toLowerCase())) {
                                  isHome = true;
                                  isAway = false;
                              } else if (awayName.toLowerCase().includes(textTeam) || textTeam.includes(awayName.toLowerCase())) {
                                  isAway = true;
                                  isHome = false;
                              }
                          } 
                          // 2. Prioritize roster match over evt.team (which may be the fouling team)
                          else if (isHomeByRoster && !isAwayByRoster) {
                              isHome = true;
                              isAway = false;
                          } else if (isAwayByRoster && !isHomeByRoster) {
                              isAway = true;
                              isHome = false;
                          }

                          const isNeutral = !isHome && !isAway;
                          
                          const isGoal = evt.type?.text?.toLowerCase().includes("goal");
                          let scorer = "";
                          let assist = "";
                          let description = evt.text || "";
                          
                          if (isGoal) {
                            scorer = evt.participants?.find((p: any) => p.type === 'scorer' || !p.type)?.athlete?.displayName || "";
                            assist = evt.participants?.find((p: any) => p.type === 'assist')?.athlete?.displayName || "";
                            
                            // Fallback parser for scorer
                            if (!scorer && evt.text) {
                               const parts = evt.text.split('. ');
                               if (parts.length >= 2) {
                                  scorer = parts[1].split('(')[0].trim();
                               }
                            }
                            // Fallback parser for assist
                            if (!assist && evt.text) {
                               const assistMatch = evt.text.match(/Assisted by ([A-Za-z\s\-]+)[\.\,]/);
                               if (assistMatch) {
                                   assist = assistMatch[1].split(' with ')[0].split(' following ')[0].split(' from ')[0].trim();
                               }
                            }

                            // Clean description string by removing the scoreline (e.g., "Goal! Germany 4, Curaçao 1. ")
                            if (description) {
                               const parts = description.split('. ');
                               if (parts.length > 1 && parts[0].includes('Goal!')) {
                                  description = parts.slice(1).join('. ');
                               }
                            }
                          }

                          const isSub = evt.type?.text?.toLowerCase().includes("substitution");
                          let inPlayer = "";
                          let outPlayer = "";
                          if (isSub) {
                            inPlayer = evt.participants?.find((p: any) => p.type === 'in')?.athlete?.displayName || "";
                            outPlayer = evt.participants?.find((p: any) => p.type === 'out')?.athlete?.displayName || "";
                            
                            if (!inPlayer && !outPlayer && evt.text) {
                               const parts = evt.text?.split('replaces');
                               if (parts && parts.length === 2) {
                                 inPlayer = parts[0].split('.').pop()?.trim() || "";
                                 outPlayer = parts[1].split(' due ')[0].replace('.','').trim() || "";
                               } else {
                                 // Fallback for single player mentions like "Deniz Undav (Germany) Substitution at 64'"
                                 const nameMatch = evt.text.match(/^([A-Za-z\s\-]+)\s+\(/);
                                 if (nameMatch) {
                                    inPlayer = nameMatch[1].trim();
                                 }
                               }
                            }
                          }

                          const renderCard = (align: "left" | "right" | "center") => (
                            <div className={cn(
                              "relative p-4 md:p-6 rounded-3xl transition-all w-full md:max-w-[85%]",
                              isGoal 
                                ? (align === "left" ? "bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                                   : align === "right" ? "bg-gradient-to-bl from-blue-500/10 to-transparent border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                                   : "bg-white/[0.05] border border-white/20")
                                : "bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]",
                              align === "left" ? "md:ml-auto md:mr-0 text-left md:text-right" : 
                              align === "right" ? "md:mr-auto md:ml-0 text-left" : 
                              "mx-auto text-center md:max-w-lg"
                            )}>
                               <div className={cn("flex items-center gap-2 mb-2", align === "left" ? "justify-start md:justify-end md:flex-row-reverse" : align === "right" ? "justify-start" : "justify-center")}>
                                 {evt.clock?.displayValue && (
                                   <span className={cn(
                                      "text-sm font-black",
                                      align === "left" ? "text-emerald-500" : 
                                      align === "right" ? "text-blue-500" : 
                                      "text-muted-foreground"
                                   )}>{evt.clock.displayValue}</span>
                                 )}
                                 <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest">{evt.type?.text}</span>
                               </div>
                               
                               {isSub && (inPlayer || outPlayer) ? (
                                 <div className={cn("flex flex-col gap-2 mt-2", align === "left" ? "items-start md:items-end" : align === "right" ? "items-start" : "items-center")}>
                                   {inPlayer && (
                                     <div className={cn("flex items-center gap-2 text-sm font-semibold", align==="left" ? "md:flex-row-reverse" : "")}>
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500"><ArrowUp className="w-3 h-3" /></div>
                                        <span className="text-foreground/90"><span className="text-muted-foreground font-normal mr-1">IN:</span> {inPlayer}</span>
                                     </div>
                                   )}
                                   {outPlayer && (
                                     <div className={cn("flex items-center gap-2 text-sm font-semibold", align==="left" ? "md:flex-row-reverse" : "")}>
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 text-red-500"><ArrowDown className="w-3 h-3" /></div>
                                        <span className="text-foreground/90"><span className="text-muted-foreground font-normal mr-1">OUT:</span> {outPlayer}</span>
                                     </div>
                                   )}
                                 </div>
                               ) : isGoal ? (
                                 <div className={cn("flex flex-col mt-1", align === "left" ? "items-start md:items-end" : align === "right" ? "items-start" : "items-center")}>
                                   <div className={cn("flex items-center gap-2 mb-1", align === "left" ? "md:flex-row-reverse" : "")}>
                                      <span className="font-bold text-xl tracking-tight text-foreground">{scorer || "Goal"}</span>
                                   </div>
                                   {assist && (
                                      <div className={cn("flex items-center gap-1.5 mb-3", align === "left" ? "md:flex-row-reverse" : "")}>
                                         <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Assist</span>
                                         <span className="text-sm font-medium text-muted-foreground/90">{assist}</span>
                                      </div>
                                   )}
                                   {description && (
                                      <p className={cn("text-[11px] text-muted-foreground/40 italic leading-relaxed", align === "left" ? "md:text-right" : align === "right" ? "text-left" : "text-center")}>
                                         "{description}"
                                      </p>
                                   )}
                                 </div>
                               ) : (
                                 <p className="text-sm text-foreground/70 leading-relaxed font-medium">{evt.text}</p>
                               )}
                            </div>
                          );

                          return (
                            <div key={i} className="relative flex items-center justify-center w-full group">
                              
                              {isNeutral ? (
                                <div className="hidden md:flex w-full px-16 z-20 justify-center">
                                  {renderCard("center")}
                                </div>
                              ) : (
                                <>
                                  {/* Left Side (Home) */}
                                  <div className="hidden md:flex flex-col w-1/2 pr-10 items-end justify-center">
                                     {isHome && renderCard("left")}
                                  </div>

                                  {/* Right Side (Away) */}
                                  <div className="hidden md:flex flex-col w-1/2 pl-10 items-start justify-center">
                                     {isAway && renderCard("right")}
                                  </div>
                                </>
                              )}

                              {/* Center Timeline Icon */}
                              <div className={cn(
                                 "absolute left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-background bg-secondary/80 backdrop-blur shrink-0",
                                 isNeutral ? "md:hidden z-0" : "z-10"
                              )}>
                                {evt.type?.text?.includes("Goal") ? <CircleDot className="w-4 h-4 text-emerald-500"/> :
                                 isSub ? <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" /> :
                                 evt.type?.text?.includes("Yellow") ? <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm" /> :
                                 evt.type?.text?.includes("Red") ? <div className="w-2.5 h-3.5 bg-red-500 rounded-sm" /> :
                                 <PlayCircle className="w-4 h-4 text-muted-foreground/50"/>}
                              </div>

                              {/* Mobile View */}
                              <div className="md:hidden flex flex-col w-full pl-16 pr-4">
                                 {renderCard(isHome ? "left" : isAway ? "right" : "center")}
                              </div>
                              
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
               </div>
            </TabsContent>

            {/* STATS TAB */}
            <TabsContent value="statistics" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-8 px-4">
                  <TeamLogo logo={getFlagUrl(homeTeam)} name={homeTeam.name} size="sm" className="drop-shadow-sm" />
                  <h3 className="text-lg font-black"><BarChart3 className="w-5 h-5 inline-block mr-2 text-purple-500"/> Match Statistics</h3>
                  <TeamLogo logo={getFlagUrl(awayTeam)} name={awayTeam.name} size="sm" className="drop-shadow-sm" />
                </div>
                
                {/* Stats Categories */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                  {[
                    { id: "all", label: "All" },
                    { id: "general", label: "General", matchers: ["possession", "corner", "offside", "pass"] },
                    { id: "attack", label: "Attack", matchers: ["shot", "goal", "attack", "cross"] },
                    { id: "defense", label: "Defense", matchers: ["save", "tackle", "clear", "intercept", "block", "defen"] },
                    { id: "discipline", label: "Discipline", matchers: ["card", "foul", "discipl"] }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveStatCategory(cat.id)}
                      className={cn(
                        "px-5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold transition-all duration-300",
                        activeStatCategory === cat.id
                          ? "bg-foreground text-background shadow-md"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {homeStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 font-medium">Statistics not available.</p>
                ) : (
                  <div className="space-y-6">
                    {homeStats.filter((hStat: any) => {
                      if (activeStatCategory === "all") return true;
                      const cat = [
                        { id: "general", matchers: ["possession", "corner", "offside", "pass"] },
                        { id: "attack", matchers: ["shot", "goal", "attack", "cross"] },
                        { id: "defense", matchers: ["save", "tackle", "clear", "intercept", "block", "defen"] },
                        { id: "discipline", matchers: ["card", "foul", "discipl"] }
                      ].find(c => c.id === activeStatCategory);
                      
                      if (!cat) return true;
                      const searchStr = `${hStat.name || ''} ${hStat.label || ''}`.toLowerCase();
                      return cat.matchers.some(m => searchStr.includes(m));
                    }).map((hStat: any, idx: number) => {
                      const aStat = awayStats.find((s:any) => s.name === hStat.name);
                      if (!aStat) return null;
                      
                      const hValStr = hStat.displayValue || hStat.value?.toString() || "0";
                      const aValStr = aStat.displayValue || aStat.value?.toString() || "0";
                      const hVal = parseFloat(hValStr.replace('%','')) || 0;
                      const aVal = parseFloat(aValStr.replace('%','')) || 0;
                      
                      const maxVal = Math.max(hVal, aVal);
                      const hWidth = maxVal === 0 ? 0 : (hVal / maxVal) * 100;
                      const aWidth = maxVal === 0 ? 0 : (aVal / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-3 px-2 md:px-8">
                          <div className="flex justify-between items-center font-bold">
                            <span className={cn("text-base md:text-xl font-black w-16 text-left", hVal > aVal ? "text-emerald-400 drop-shadow-sm" : "text-muted-foreground")}>{hValStr}</span>
                            <span className="uppercase tracking-[0.2em] text-[10px] md:text-[11px] text-muted-foreground/80 font-black text-center flex-1">{hStat.label || hStat.name}</span>
                            <span className={cn("text-base md:text-xl font-black w-16 text-right", aVal > hVal ? "text-blue-400 drop-shadow-sm" : "text-muted-foreground")}>{aValStr}</span>
                          </div>
                          <div className="flex h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                            <div className="w-1/2 flex justify-end border-r border-background/30 pr-0.5">
                              <div style={{ width: `${hWidth}%` }} className={cn("h-full rounded-l-full transition-all duration-1000", hVal > aVal ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-emerald-500/40")} />
                            </div>
                            <div className="w-1/2 flex justify-start border-l border-background/30 pl-0.5">
                              <div style={{ width: `${aWidth}%` }} className={cn("h-full rounded-r-full transition-all duration-1000", aVal > hVal ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-blue-500/40")} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* LINEUPS TAB */}
            <TabsContent value="lineups" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Unified Pitch Card */}
                <div className="rounded-[2rem] overflow-hidden border border-border/20 shadow-2xl bg-background flex flex-col">
                  
                  {/* Away Team Header (Top) */}
                  <div className="flex justify-between items-center bg-secondary/30 p-4 px-6 border-b border-border/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <TeamLogo logo={getFlagUrl(awayTeam)} name={awayTeam.name} size="sm" className="drop-shadow-sm" />
                      <h3 className="font-bold text-sm md:text-base leading-tight text-foreground">{awayTeam.name}</h3>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase font-bold bg-background/60 px-3 py-1 rounded-full border border-border/20 shadow-sm">
                      {awayFormation}
                    </span>
                  </div>

                  {/* The Pitch */}
                  <div className="relative w-full aspect-[4/5] bg-[#113A20] shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] border-y-[6px] border-[#0a2613] overflow-hidden">
                    {/* Grass Stripes */}
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, #000 50px, #000 100px)' }} />
                    
                    {/* Pitch Markings */}
                    <div className="absolute inset-0 border-[2px] border-white/30 m-4 md:m-8 rounded-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    <div className="absolute top-1/2 left-4 right-4 md:left-8 md:right-8 h-0 border-t-[2px] border-white/30 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-[2px] border-white/30 rounded-full drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/40 rounded-full drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    
                    {/* Penalty Areas */}
                    <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-48 md:w-64 h-24 border-[2px] border-white/30 border-t-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-48 md:w-64 h-24 border-[2px] border-white/30 border-b-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    
                    {/* Goal Areas */}
                    <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-20 md:w-28 h-8 md:h-10 border-[2px] border-white/30 border-t-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-20 md:w-28 h-8 md:h-10 border-[2px] border-white/30 border-b-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" />

                    {/* Players Container */}
                    <div className="absolute inset-0 flex flex-col m-1 md:m-2 mx-4 md:mx-8 py-2 md:py-4">
                      {/* Away Team (Top Half) */}
                      <div className="flex-1 flex flex-col justify-evenly pb-4 md:pb-6">
                        {awayRows.map((row, idx) => (
                          <div key={`away-row-${idx}`} className="flex justify-around items-center w-full">
                            {row.map(item => renderPitchPlayer(item, awayTeamColor))}
                          </div>
                        ))}
                      </div>

                      {/* Spacer between halves */}
                      <div className="h-0 shrink-0" />

                      {/* Home Team (Bottom Half) */}
                      <div className="flex-1 flex flex-col justify-evenly pt-4 md:pt-6">
                        {[...homeRows].reverse().map((row, idx) => (
                          <div key={`home-row-${idx}`} className="flex justify-around items-center w-full">
                            {[...row].reverse().map(item => renderPitchPlayer(item, homeTeamColor))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Home Team Header (Bottom) */}
                  <div className="flex justify-between items-center bg-secondary/30 p-4 px-6 border-t border-border/20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <TeamLogo logo={getFlagUrl(homeTeam)} name={homeTeam.name} size="sm" className="drop-shadow-sm" />
                      <h3 className="font-bold text-sm md:text-base leading-tight text-foreground">{homeTeam.name}</h3>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase font-bold bg-background/60 px-3 py-1 rounded-full border border-border/20 shadow-sm">
                      {homeFormation}
                    </span>
                  </div>
                </div>

                {/* Substitutes & Manager */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
                  {/* Home Subs */}
                  <div className="flex flex-col h-full space-y-6 bg-secondary/10 border border-border/20 p-6 rounded-[2rem]">
                    <div className="flex-1 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-500 border-b border-white/10 pb-2 flex items-center gap-2">
                        <img src={homeTeam.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${homeTeam.id}.png`} alt={homeTeam.name} className="w-4 h-4 object-contain" />
                        Substitutes
                      </h4>
                      <div className="flex flex-col">
                        {homeSubs.map((item: any) => renderSubstituteRow(item, homeTeamColor))}
                        {homeSubs.length === 0 && <p className="text-xs text-muted-foreground py-2">No substitutes.</p>}
                      </div>
                    </div>
                    {homeCoach && (
                      <div className="bg-secondary/20 p-4 rounded-2xl border border-border/40 flex items-center gap-4 mt-auto">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Manager</p>
                          <p className="font-medium text-sm">{homeCoach.fullName || homeCoach.firstName + ' ' + homeCoach.lastName}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away Subs */}
                  <div className="flex flex-col h-full space-y-6 bg-secondary/10 border border-border/20 p-6 rounded-[2rem]">
                    <div className="flex-1 space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-blue-500 border-b border-white/10 pb-2 md:text-right flex items-center md:justify-end gap-2">
                        Substitutes
                        <img src={awayTeam.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${awayTeam.id}.png`} alt={awayTeam.name} className="w-4 h-4 object-contain" />
                      </h4>
                      <div className="flex flex-col">
                        {awaySubs.map((item: any) => renderSubstituteRow(item, awayTeamColor))}
                        {awaySubs.length === 0 && <p className="text-xs text-muted-foreground py-2 md:text-right">No substitutes.</p>}
                      </div>
                    </div>
                    {awayCoach && (
                      <div className="bg-secondary/20 p-4 rounded-2xl border border-border/40 flex items-center gap-4 md:flex-row-reverse md:text-right mt-auto">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Manager</p>
                          <p className="font-medium text-sm">{awayCoach.fullName || awayCoach.firstName + ' ' + awayCoach.lastName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* PERFORMANCE LAB TAB */}
            <TabsContent value="performance" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              {activeTab === 'performance' && matchData && (
                 <PerformanceLabTab 
                    espnMatchId={id || ""}
                    matchDate={matchData.header?.competitions?.[0]?.date || ""}
                    homeTeamName={homeTeam.name || homeTeam.displayName || homeTeam.shortDisplayName || "Home"}
                    awayTeamName={awayTeam.name || awayTeam.displayName || awayTeam.shortDisplayName || "Away"}
                    matchStatus={
                       ['live', 'in-progress', '1h', '2h', 'ht'].includes(matchData.header?.competitions?.[0]?.status?.type?.state?.toLowerCase()) ? 'live' :
                       ['post', 'finished', 'ft'].includes(matchData.header?.competitions?.[0]?.status?.type?.state?.toLowerCase()) ? 'finished' : 'upcoming'
                    }
                    matchData={matchData}
                 />
              )}
            </TabsContent>

          </Tabs>
        </div>

      </main>
      
      <PlayerProfileDialog
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
