import { cn, getTeamAcronym } from "@/lib/utils";
import { getLiveMatches } from "@/data/mockData";
import { useFeaturedCricketMatches } from "@/hooks/useFeaturedMatches";
import { useFollowedTournamentMatches } from "@/hooks/useFollowedTournamentMatches";
import { tournamentApi } from "@/services/api";
import { LiveBadge } from "./LiveBadge";
import { SportIcon } from "./SportIcon";
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
          shortName: getTeamAcronym(m.homeTeamName),
          logo: m.homeTeamLogo || "",
        },
        awayTeam: {
          name: m.awayTeamName,
          shortName: getTeamAcronym(m.awayTeamName),
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-live/10 via-card to-live/10 border border-live/30">
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

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-live/10 via-card to-live/10 border border-live/30">
      <div className="absolute inset-0 bg-shimmer animate-shimmer" />

      <div className="relative flex items-center justify-between p-4">
        {tickerMatches.length > 1 && (
          <button
            onClick={goToPrev}
            className="p-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="flex-1 flex items-center justify-center gap-6 px-4">
          {isLive && (currentMatch as any).testBreakStatus ? (
            <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-orange-500/30">
              {(currentMatch as any).testBreakStatus}
            </span>
          ) : isLive ? (
            <LiveBadge size="sm" />
          ) : (
            <span className="bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded text-white/70 uppercase tracking-wider">
              Recent Result
            </span>
          )}

          <div className="flex items-center gap-2">
            {isFollowedTournament ? (
              <Bell size={14} className="text-yellow-400 flex-shrink-0" />
            ) : (
              <SportIcon sport={currentMatch.sport} size={16} />
            )}
            <span className="text-xs text-muted-foreground uppercase tracking-wide max-w-[120px] truncate">
              {currentMatch.matchType}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TeamLogo logo={currentMatch.homeTeam?.logo} name={currentMatch.homeTeam?.name || "Team 1"} size="sm" />
              <span className="font-semibold text-foreground">{currentMatch.homeTeam?.shortName}</span>
              <span className="font-bold text-xl text-foreground font-mono">
                {currentMatch.homeScore || (currentMatch.status?.includes(currentMatch.homeTeam?.name || "") ? "Win" : "-")}
              </span>
            </div>

            <span className="text-muted-foreground">-</span>

            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-foreground font-mono">
                {currentMatch.awayScore || (currentMatch.status?.includes(currentMatch.awayTeam?.name || "") ? "Win" : "-")}
              </span>
              <span className="font-semibold text-foreground">{currentMatch.awayTeam?.shortName}</span>
              <TeamLogo logo={currentMatch.awayTeam?.logo} name={currentMatch.awayTeam?.name || "Team 2"} size="sm" />
            </div>
          </div>

          {currentMatch.sport === "cricket" && (currentMatch as any).currentOver && (
            <span className="text-sm text-muted-foreground">
              Over {(currentMatch as any).currentOver}
            </span>
          )}
        </div>

        {tickerMatches.length > 1 && (
          <button
            onClick={goToNext}
            className="p-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {tickerMatches.length > 1 && (
        <div className="flex items-center justify-center gap-1 pb-3">
          {tickerMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-live w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
