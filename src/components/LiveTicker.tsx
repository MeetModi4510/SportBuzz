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
    <div className={cn("relative overflow-hidden rounded-xl border bg-card transition-all duration-300", themeBorder)}>
      <div className="flex items-center justify-between px-2 py-3">
        {tickerMatches.length > 1 && (
          <button
            onClick={goToPrev}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="flex-1 flex items-center justify-between px-2 sm:px-4">
          {/* Left: Meta */}
          <div className="hidden md:flex items-center gap-3 w-[25%] shrink-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                RECENT
              </span>
            )}
            <span className="w-[1px] h-3 bg-border" />
            <div className="flex items-center gap-1.5">
              {isFollowedTournament ? (
                <Bell size={12} className="text-yellow-500" />
              ) : (
                <SportIcon sport={currentMatch.sport} size={12} className="text-muted-foreground" />
              )}
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
                {currentMatch.matchType}
              </span>
            </div>
          </div>

          {/* Center: Score */}
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-6">
            <div className="flex flex-1 items-center justify-end gap-2.5">
              <span className="font-semibold text-sm text-foreground">{currentMatch.homeTeam?.shortName}</span>
              <TeamLogo logo={currentMatch.homeTeam?.logo} name={currentMatch.homeTeam?.name || "Team 1"} size="sm" className="w-5 h-5" />
              <span className="font-bold text-base text-foreground ml-1 sm:ml-2">
                {currentMatch.homeScore || (currentMatch.status?.includes(currentMatch.homeTeam?.name || "") ? "W" : "-")}
              </span>
            </div>

            <span className="text-border font-light text-lg">-</span>

            <div className="flex flex-1 items-center justify-start gap-2.5">
              <span className="font-bold text-base text-foreground mr-1 sm:mr-2">
                {currentMatch.awayScore || (currentMatch.status?.includes(currentMatch.awayTeam?.name || "") ? "W" : "-")}
              </span>
              <TeamLogo logo={currentMatch.awayTeam?.logo} name={currentMatch.awayTeam?.name || "Team 2"} size="sm" className="w-5 h-5" />
              <span className="font-semibold text-sm text-foreground">{currentMatch.awayTeam?.shortName}</span>
            </div>
          </div>

          {/* Right: Status */}
          <div className="hidden md:flex items-center justify-end gap-3 w-[25%] shrink-0">
            {currentMatch.sport === "cricket" && (currentMatch as any).currentOver && (
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Over {(currentMatch as any).currentOver}
              </span>
            )}
            {(currentMatch as any).testBreakStatus && (
              <span className="text-[10px] font-medium text-orange-400 uppercase tracking-widest">
                {(currentMatch as any).testBreakStatus}
              </span>
            )}
          </div>
        </div>

        {tickerMatches.length > 1 && (
          <button
            onClick={goToNext}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Pagination */}
      {tickerMatches.length > 1 && (
        <div className="flex items-center justify-center gap-1 pb-1.5">
          {tickerMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-[3px] rounded-full transition-all duration-300",
                index === currentIndex ? "bg-foreground w-4" : "bg-muted-foreground/20 w-1.5 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
