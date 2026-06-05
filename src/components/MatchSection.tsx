import { cn } from "@/lib/utils";
import { Match, Sport } from "@/data/types";
import { MatchCard } from "./MatchCard";
import { SportIcon } from "./SportIcon";
import { ChevronRight, Loader2 } from "lucide-react";

interface MatchSectionProps {
  title: string;
  sport: Sport;
  matches: Match[];
  onMatchClick?: (match: Match) => void;
  className?: string;
  showViewAll?: boolean;
  onViewAllClick?: () => void;
  isLoading?: boolean;
  onlyLive?: boolean;
}

export const MatchSection = ({
  title,
  sport,
  matches,
  onMatchClick,
  className,
  showViewAll = true,
  onViewAllClick,
  isLoading = false,
  onlyLive = false,
}: MatchSectionProps) => {
  // Loading state
  if (isLoading) {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SportIcon sport={sport} size={24} />
            <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading {title.toLowerCase()} matches...</span>
        </div>
      </section>
    );
  }

  const liveMatches = matches.filter((m) => m.status === "live");
  
  if (onlyLive) {
    return (
      <section className={cn("space-y-4", className)}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SportIcon sport={sport} size={24} />
            <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
          </div>
          {showViewAll && onViewAllClick && (
            <button onClick={onViewAllClick} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 text-sm text-foreground transition-all font-medium">
              View All
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {liveMatches.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-6 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">
            No Live Matches
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onClick={onMatchClick}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Not onlyLive: Show Live, Upcoming, Recent
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const completedMatches = matches.filter((m) => m.status === "completed" || m.status === "recent");

  if (matches.length === 0) {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SportIcon sport={sport} size={24} />
            <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>No {title.toLowerCase()} matches found</p>
        </div>
      </section>
    );
  }

  const renderMatchGroup = (groupMatches: Match[]) => {
    if (sport === "cricket") {
      const test = groupMatches.filter((m) => m.matchType?.toLowerCase() === "test");
      const odi = groupMatches.filter((m) => m.matchType?.toLowerCase() === "odi");
      const t20 = groupMatches.filter((m) => {
        const type = m.matchType?.toLowerCase() || '';
        return type === "t20" || type === "t20i";
      });

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TEST Matches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-red-500 pl-2">Test Matches</h3>
            <div className="flex flex-col gap-4">
              {test.length > 0 ? (
                test.map(match => (
                  <MatchCard key={match.id} match={match} onClick={onMatchClick} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
              )}
            </div>
          </div>
          {/* ODI Matches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-blue-500 pl-2">ODI Matches</h3>
            <div className="flex flex-col gap-4">
              {odi.length > 0 ? (
                odi.map(match => (
                  <MatchCard key={match.id} match={match} onClick={onMatchClick} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
              )}
            </div>
          </div>
          {/* T20 Matches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-green-500 pl-2">T20 Matches</h3>
            <div className="flex flex-col gap-4">
              {t20.length > 0 ? (
                t20.map(match => (
                  <MatchCard key={match.id} match={match} onClick={onMatchClick} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default for other sports
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupMatches.length > 0 ? (
          groupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={onMatchClick}
            />
          ))
        ) : (
          <div className="col-span-full text-sm text-muted-foreground italic py-4 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">
            No matches in this category
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={cn("space-y-8", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SportIcon sport={sport} size={24} />
          <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
          <span className="text-sm text-muted-foreground">
            ({matches.length} {matches.length === 1 ? "match" : "matches"})
          </span>
        </div>
      </div>

      <div className="space-y-10">
        {/* LIVE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
               <span className="relative inline-flex h-3 w-3 rounded-full bg-live" />
             </span>
             <h3 className="text-lg font-bold text-foreground">Live Now</h3>
          </div>
          {renderMatchGroup(liveMatches)}
        </div>

        {/* UPCOMING */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Upcoming Matches</h3>
          {renderMatchGroup(upcomingMatches)}
        </div>

        {/* RECENT / COMPLETED */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Recent Matches</h3>
          {renderMatchGroup(completedMatches)}
        </div>
      </div>
    </section>
  );
};
