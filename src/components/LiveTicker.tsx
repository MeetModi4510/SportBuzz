import { cn, getTeamAcronym } from "@/lib/utils";
import { getLiveMatches } from "@/data/mockData";
import { useFeaturedCricketMatches } from "@/hooks/useFeaturedMatches";
import { useFollowedTournamentMatches } from "@/hooks/useFollowedTournamentMatches";
import { tournamentApi } from "@/services/api";
import { LiveBadge } from "./LiveBadge";
import { SportIcon, getSportBorderColor } from "./SportIcon";
import { ChevronLeft, ChevronRight, Loader2, Bell } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Match } from "@/data/types";
import { TeamLogo } from "./TeamLogo";
import { FootballTeamLogo } from "./football/FootballTeamLogo";

import { useEspnLiveMatches } from "@/hooks/football/useEspnQueries";

export const LiveTicker = () => {
  // Remove both cricket AND football from mock matches (since we fetch them dynamically)
  const mockLiveMatches = getLiveMatches().filter((m: Match) => m.sport !== "cricket" && m.sport !== "football");
  const { data: cricketFeatured, isLoading: isCricketLoading } = useFeaturedCricketMatches();
  
  // Pass `false` to prevent direct API fetches! This will purely read from the shared cache.
  // When other components (like the Match Center) fetch/update the data, this ticker will instantly sync!
  const { data: espnLiveMatches } = useEspnLiveMatches(false);

  // Followed tournament live matches
  const [tournamentList, setTournamentList] = useState<{ _id: string; name: string; isFootball?: boolean }[]>([]);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cricket, football] = await Promise.all([
          tournamentApi.getAll(),
          import("@/services/api").then(m => m.footballApi.getTournaments())
        ]);
        const cList = (cricket as any)?.data || [];
        const fList = ((football as any)?.data || []).map((t: any) => ({ ...t, isFootball: true }));
        setTournamentList([...cList, ...fList]);
      } catch (err) {
        console.error("Failed to fetch tournament lists", err);
      }
    };
    fetchAll();
  }, []);
  const followedMatches = useFollowedTournamentMatches(tournamentList);

  // Convert followed tournament matches to a ticker-compatible shape
  const followedAsTicker = useMemo(() =>
    followedMatches.map(m => {
      const isFootball = tournamentList.find(t => t._id === m.tournamentId)?.isFootball;
      return {
        _id: m._id,
        sport: (isFootball ? "football" : "cricket") as any,
        matchType: m.tournamentName,
        status: "live" as const,
        isFollowedTournament: true,
        homeTeam: {
          name: m.homeTeamName,
          shortName: m.homeTeamAcronym || getTeamAcronym(m.homeTeamName),
          logo: m.homeTeamLogo || "",
        },
        awayTeam: {
          name: m.awayTeamName,
          shortName: m.awayTeamAcronym || getTeamAcronym(m.awayTeamName),
          logo: m.awayTeamLogo || "",
        },
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      };
    }),
    [followedMatches, tournamentList]
  );

  const tickerMatches = useMemo(() => {
    let cricket: Match[] = [];
    if (cricketFeatured) {
      cricket = [
        ...(cricketFeatured.test || []),
        ...(cricketFeatured.odi || []),
        ...(cricketFeatured.t20 || []),
      ];
    }
    
    let football: any[] = [];
    const actualFootballMatches = espnLiveMatches?.data || (Array.isArray(espnLiveMatches) ? espnLiveMatches : []);
    
    if (actualFootballMatches && actualFootballMatches.length > 0) {
      football = actualFootballMatches.map((m: any) => ({
        _id: m.id,
        sport: "football",
        matchType: m.leagueName || "Football Match",
        status: "live",
        homeTeam: {
          name: m.homeTeam?.name || "Team 1",
          shortName: getTeamAcronym(m.homeTeam?.name || ""),
          logo: m.homeTeam?.logo || "",
        },
        awayTeam: {
          name: m.awayTeam?.name || "Team 2",
          shortName: getTeamAcronym(m.awayTeam?.name || ""),
          logo: m.awayTeam?.logo || "",
        },
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      }));
    }

    const allPotential = [...followedAsTicker, ...football, ...cricket, ...mockLiveMatches] as any[];
    const liveOnly = allPotential.filter(m => m.status === "live");
    return liveOnly.length > 0 ? liveOnly : allPotential;
  }, [cricketFeatured, espnLiveMatches, mockLiveMatches, followedAsTicker]);

  // Only check cricket loading so we don't hang if football is just waiting for cache
  if (isCricketLoading) {
    return (
      <div className="relative overflow-hidden border-b bg-card/40 border-border/30 backdrop-blur-sm h-10 flex items-center transition-all duration-200">
        <div className="relative flex items-center justify-center p-4 gap-3 w-full">
          <Loader2 className="h-4 w-4 animate-spin text-live" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Loading Live Scores...</span>
        </div>
      </div>
    );
  }

  if (tickerMatches.length === 0) return null;

  return (
    <div className="w-full bg-card border-b border-primary/20 overflow-hidden flex items-center h-14 md:h-16 relative shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
       {/* "LIVE SCORES" sticky label on the left */}
       <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-card border-r border-primary/20 px-4 md:px-6 shadow-[8px_0_20px_rgba(0,0,0,0.6)]">
         <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-[0.15em] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" /> LIVE SCORES
         </span>
       </div>

       {/* Scrolling Marquee */}
       <div className="flex-1 overflow-hidden relative ml-[120px] md:ml-[160px] h-full flex items-center">
          <style>{`
            @keyframes ticker {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-ticker {
              animation: ticker 45s linear infinite;
            }
            .animate-ticker:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="flex whitespace-nowrap animate-ticker w-max items-center h-full">
            {/* Render list twice for infinite smooth scrolling */}
            {[...tickerMatches, ...tickerMatches].map((match, idx) => {
              const homeScoreRaw = match.homeScore || (match.status?.includes(match.homeTeam?.name || "") ? "W" : "-");
              const awayScoreRaw = match.awayScore || (match.status?.includes(match.awayTeam?.name || "") ? "W" : "-");
              const homeScore = typeof homeScoreRaw === 'string' ? homeScoreRaw.trim() : homeScoreRaw;
              const awayScore = typeof awayScoreRaw === 'string' ? awayScoreRaw.trim() : awayScoreRaw;
              const isLive = match.status === "live";

              return (
                <div key={`${match._id}-${idx}`} className="flex items-center h-full">
                  <div className="flex items-center px-6 md:px-8 py-1.5 md:py-2 mx-3 md:mx-4 bg-secondary/20 border border-border/50 rounded-full hover:bg-secondary/40 transition-colors cursor-pointer group shadow-sm">
                     <div className="flex items-center gap-5 md:gap-8">
                       
                       {/* Match type / Status */}
                       <div className="flex flex-col justify-center gap-1">
                         <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                            {isLive && match.sport === "cricket" && (match as any).currentOver && (
                              <span className="text-red-400 font-bold">OVER {(match as any).currentOver}</span>
                            )}
                            {isLive && (match as any).testBreakStatus && (
                              <span className="text-orange-400 font-bold">{(match as any).testBreakStatus}</span>
                            )}
                            {match.matchType}
                         </span>
                       </div>
                       
                       <div className="w-[1px] h-6 bg-border/80 mx-1" />

                       {/* Match Teams and Scores */}
                       <div className="flex items-center">
                         <div className="flex items-center justify-end gap-2 md:gap-3 pr-4 md:pr-5 border-r border-transparent">
                           {match.sport === 'football' ? (
                             <FootballTeamLogo logo={match.homeTeam?.logo || null} name={match.homeTeam?.name || "Team 1"} size="md" className="w-7 h-7 md:w-8 md:h-8 drop-shadow-md" />
                           ) : (
                             <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="md" className="w-7 h-7 md:w-8 md:h-8 drop-shadow-md" />
                           )}
                           <span className="font-bold text-sm md:text-base text-foreground uppercase tracking-wider">{match.homeTeam?.shortName}</span>
                           <span className="font-extrabold text-base md:text-lg text-foreground ml-1">{homeScore}</span>
                         </div>
                         
                         <div className="flex items-center justify-center min-w-[32px] md:min-w-[40px] shrink-0">
                           <span className="text-muted-foreground/40 font-medium text-xs tracking-wider uppercase">vs</span>
                         </div>
                         
                         <div className="flex items-center justify-start gap-2 md:gap-3 pl-4 md:pl-5 pr-2 md:pr-3 border-l border-transparent">
                           <span className="font-extrabold text-base md:text-lg text-foreground mr-1">{awayScore}</span>
                           <span className="font-bold text-sm md:text-base text-foreground uppercase tracking-wider">{match.awayTeam?.shortName}</span>
                           {match.sport === 'football' ? (
                             <FootballTeamLogo logo={match.awayTeam?.logo || null} name={match.awayTeam?.name || "Team 2"} size="md" className="w-7 h-7 md:w-8 md:h-8 drop-shadow-md shrink-0" />
                           ) : (
                             <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="md" className="w-7 h-7 md:w-8 md:h-8 drop-shadow-md shrink-0" />
                           )}
                         </div>
                       </div>

                     </div>
                  </div>
                </div>
              );
            })}
          </div>
       </div>
    </div>
  );
};
