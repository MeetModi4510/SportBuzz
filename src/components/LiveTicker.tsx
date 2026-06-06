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

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (tickerMatches.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tickerMatches.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tickerMatches.length]);

  useEffect(() => {
    if (currentIndex >= tickerMatches.length && tickerMatches.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, tickerMatches.length]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-secondary/30 border-border/60 transition-all duration-200">
        <div className="relative flex items-center justify-center p-4 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-live" />
          <span className="text-sm text-muted-foreground">Loading matches...</span>
        </div>
      </div>
    );
  }

  if (tickerMatches.length === 0) return null;

  const currentMatch = tickerMatches[currentIndex] || tickerMatches[0];
  const isLive = currentMatch.status === "live";
  const isFollowedTournament = (currentMatch as any).isFollowedTournament;

  const goToPrev = () =>
    setCurrentIndex(prev => (prev - 1 + tickerMatches.length) % tickerMatches.length);
  const goToNext = () =>
    setCurrentIndex(prev => (prev + 1) % tickerMatches.length);

  const themeBorder = currentMatch ? (getSportBorderColor(currentMatch.sport) || "border-border/60") : "border-border/60";

  return (
    <div className="w-full bg-card/40 border-b border-border/30 overflow-hidden backdrop-blur-sm">
      <div className="flex items-center overflow-x-auto scrollbar-hide snap-x px-2 py-2.5 gap-2.5">
        {tickerMatches.map((match, idx) => {
          const isLive = match.status === "live";
          const isFollowedTournament = (match as any).isFollowedTournament;

          return (
            <div 
              key={match._id || idx}
              className="flex-shrink-0 snap-start flex flex-col justify-center min-w-[200px] max-w-[240px] bg-secondary/10 border border-border/40 rounded-lg px-3.5 py-2.5 hover:bg-secondary/30 hover:border-border transition-all cursor-pointer group"
            >
              {/* Top Meta */}
              <div className="flex items-center justify-between mb-2.5 border-b border-border/30 pb-2">
                <div className="flex items-center gap-1.5">
                   {isLive ? (
                     <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_4px_rgba(239,68,68,0.8)]" /> LIVE
                     </span>
                   ) : (
                     <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">RECENT</span>
                   )}
                </div>
                <div className="flex items-center gap-1">
                  {isFollowedTournament ? (
                    <Bell size={10} className="text-yellow-500" />
                  ) : (
                    <SportIcon sport={match.sport} size={10} className="text-muted-foreground" />
                  )}
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest truncate max-w-[80px]">
                    {match.matchType}
                  </span>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TeamLogo logo={match.homeTeam?.logo} name={match.homeTeam?.name || "Team 1"} size="sm" className="w-4 h-4 drop-shadow-sm" />
                    <span className="font-semibold text-xs text-foreground">{match.homeTeam?.shortName}</span>
                  </div>
                  <span className="font-bold text-[13px] text-foreground tracking-tight">
                    {match.homeScore || (match.status?.includes(match.homeTeam?.name || "") ? "W" : "-")}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TeamLogo logo={match.awayTeam?.logo} name={match.awayTeam?.name || "Team 2"} size="sm" className="w-4 h-4 drop-shadow-sm" />
                    <span className="font-semibold text-xs text-foreground">{match.awayTeam?.shortName}</span>
                  </div>
                  <span className="font-bold text-[13px] text-foreground tracking-tight">
                    {match.awayScore || (match.status?.includes(match.awayTeam?.name || "") ? "W" : "-")}
                  </span>
                </div>
              </div>

              {/* Optional Footer Status (e.g. Over, test break) */}
              {(match.sport === "cricket" && (match as any).currentOver || (match as any).testBreakStatus) && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  {match.sport === "cricket" && (match as any).currentOver ? (
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Over {(match as any).currentOver}
                    </span>
                  ) : (match as any).testBreakStatus ? (
                    <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-widest">
                      {(match as any).testBreakStatus}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
