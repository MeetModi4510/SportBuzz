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
    <div className={cn("relative overflow-hidden rounded-[2rem] border bg-secondary/10 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-xl hover:border-primary/30 group", themeBorder)}>
      {/* Subtle Background Lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-football/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between p-3 md:py-4 md:px-5 z-10">
        <div className="flex items-center w-full justify-between">
            {tickerMatches.length > 1 && (
              <button
                onClick={goToPrev}
                className="p-1.5 md:p-2 rounded-full bg-background/50 hover:bg-secondary border border-border/30 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 px-2 md:px-4">
              {/* Match Meta */}
              <div className="flex items-center gap-3 shrink-0">
                  {isLive && (currentMatch as any).testBreakStatus ? (
                    <span className="bg-orange-500/10 text-orange-400 text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-orange-500/20 shadow-inner">
                      {(currentMatch as any).testBreakStatus}
                    </span>
                  ) : isLive ? (
                    <LiveBadge size="sm" />
                  ) : (
                    <span className="bg-secondary/50 text-[9px] font-black px-2.5 py-1 rounded-full text-muted-foreground uppercase tracking-[0.2em] border border-border/40 shadow-inner">
                      Recent
                    </span>
                  )}

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-background/40 border border-border/30 backdrop-blur-sm shadow-inner">
                    {isFollowedTournament ? (
                      <Bell size={12} className="text-yellow-400 flex-shrink-0 drop-shadow-md" />
                    ) : (
                      <SportIcon sport={currentMatch.sport} size={14} className="opacity-80" />
                    )}
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] max-w-[120px] truncate">
                      {currentMatch.matchType}
                    </span>
                  </div>
              </div>

              {/* The Score Section */}
              <div className="flex items-center gap-3 sm:gap-6 bg-background/50 backdrop-blur-md px-4 sm:px-6 py-2 rounded-[1.5rem] border border-border/40 shadow-inner group-hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TeamLogo logo={currentMatch.homeTeam?.logo} name={currentMatch.homeTeam?.name || "Team 1"} size="sm" className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-lg bg-background border border-border/20" />
                  <span className="font-bold text-sm sm:text-base text-foreground tracking-tight">{currentMatch.homeTeam?.shortName}</span>
                  <span className="font-black text-lg sm:text-2xl text-foreground ml-1 drop-shadow-sm">
                    {currentMatch.homeScore || (currentMatch.status?.includes(currentMatch.homeTeam?.name || "") ? "W" : "-")}
                  </span>
                </div>

                <span className="text-muted-foreground/30 font-black italic text-lg sm:text-2xl drop-shadow-sm">-</span>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-black text-lg sm:text-2xl text-foreground mr-1 drop-shadow-sm">
                    {currentMatch.awayScore || (currentMatch.status?.includes(currentMatch.awayTeam?.name || "") ? "W" : "-")}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-foreground tracking-tight">{currentMatch.awayTeam?.shortName}</span>
                  <TeamLogo logo={currentMatch.awayTeam?.logo} name={currentMatch.awayTeam?.name || "Team 2"} size="sm" className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-lg bg-background border border-border/20" />
                </div>
              </div>

              {/* Match Over/Status text */}
              {currentMatch.sport === "cricket" && (currentMatch as any).currentOver && (
                <span className="hidden md:block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-background/30 px-3 py-1 rounded-full border border-border/20 shrink-0">
                  Over {(currentMatch as any).currentOver}
                </span>
              )}
            </div>

            {tickerMatches.length > 1 && (
              <button
                onClick={goToNext}
                className="p-1.5 md:p-2 rounded-full bg-background/50 hover:bg-secondary border border-border/30 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            )}
        </div>
        
        {/* Dots */}
        {tickerMatches.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4 md:mt-0 md:absolute md:bottom-2 md:left-1/2 md:-translate-x-1/2 z-20">
              {tickerMatches.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentIndex ? "bg-primary w-5 shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
        )}
      </div>
    </div>
  );
};
