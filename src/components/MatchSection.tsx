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
  isLoading?: boolean;
}

export const MatchSection = ({
  title,
  sport,
  matches,
  onMatchClick,
  className,
  showViewAll = true,
  isLoading = false,
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

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const completedMatches = matches.filter((m) => m.status === "completed");

  // Sort: live first, then upcoming, then completed
  const sortedMatches = [...liveMatches, ...upcomingMatches, ...completedMatches];

  return (
    <section className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SportIcon sport={sport} size={24} />
          <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
          <span className="text-sm text-muted-foreground">
            ({matches.length} {matches.length === 1 ? "match" : "matches"})
          </span>
        </div>
        {showViewAll && matches.length > 4 && (
          <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Live Matches Indicator */}
      {liveMatches.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-live">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          <span className="font-medium">
            {liveMatches.length} live {liveMatches.length === 1 ? "match" : "matches"}
          </span>
        </div>
      )}

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedMatches.slice(0, 8).map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={onMatchClick}
          />
        ))}
      </div>
    </section>
  );
};
