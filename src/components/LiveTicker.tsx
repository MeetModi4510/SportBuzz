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

export const LiveTicker = () => {
  const mockLiveMatches = getLiveMatches().filter((m: Match) => m.sport !== "cricket");
  const { data: cricketFeatured, isLoading } = useFeaturedCricketMatches();

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
    const allPotential = [...followedAsTicker, ...cricket, ...mockLiveMatches] as any[];
    const liveOnly = allPotential.filter(m => m.status === "live");
    return liveOnly.length > 0 ? liveOnly : allPotential;
  }, [cricketFeatured, mockLiveMatches, followedAsTicker]);

  if (isLoading) {
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
    <div className="w-full bg-card border-b border-border/60 overflow-hidden flex items-center h-14 md:h-16 relative shadow-md">
       {/* "LIVE SCORES" sticky label on the left */}
       <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-card border-r border-border/60 px-4 md:px-6 shadow-[8px_0_20px_rgba(0,0,0,0.6)]">
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
              const homeScore = match.homeScore || (match.status?.includes(match.homeTeam?.name || "") ? "W" : "-");
              const awayScore = match.awayScore || (match.status?.includes(match.awayTeam?.name || "") ? "W" : "-");
              const isLive = match.status === "live";

              return (
                <div key={`${match._id}-${idx}`} className="flex items-center px-8 md:px-14 border-r border-border/40 last:border-0 cursor-pointer hover:bg-secondary/10 transition-colors h-full group">
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
                     
                     <div className="w-[1px] h-6 bg-border/50 mx-1" />

                     {/* Match Teams and Scores */}
                     <div className="flex items-center gap-4 md:gap-5">
                       <div className="flex items-center gap-3">
                         <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="sm" className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
                         <span className="font-bold text-sm md:text-base text-foreground uppercase tracking-wider">{match.homeTeam?.shortName}</span>
                         <span className="font-extrabold text-base md:text-lg text-foreground ml-1">{homeScore}</span>
                       </div>
                       
                       <span className="text-muted-foreground/40 font-medium text-xs mx-1 md:mx-2">vs</span>
                       
                       <div className="flex items-center gap-3">
                         <span className="font-extrabold text-base md:text-lg text-foreground mr-1">{awayScore}</span>
                         <span className="font-bold text-sm md:text-base text-foreground uppercase tracking-wider">{match.awayTeam?.shortName}</span>
                         <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="sm" className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
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
