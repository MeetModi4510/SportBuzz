import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'recent'>('all');

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
      const other = groupMatches.filter((m) => {
        const type = m.matchType?.toLowerCase() || '';
        return type !== "test" && type !== "odi" && type !== "t20" && type !== "t20i";
      });

      const activeFormats = [
        { name: "Test Matches", key: "test", data: test, color: "border-red-500" },
        { name: "ODI Matches", key: "odi", data: odi, color: "border-blue-500" },
        { name: "T20 Matches", key: "t20", data: t20, color: "border-green-500" },
        { name: "Other Matches", key: "other", data: other, color: "border-purple-500" },
      ].filter(format => format.data.length > 0);

      if (activeFormats.length === 0) {
        return <div className="text-sm text-muted-foreground italic py-6 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">No matches in this category</div>;
      }

      // Determine grid columns based on active formats
      // For 4 formats, we can use a 2x2 grid or just 4 cols. Let's use up to 3 cols max for balance.
      const gridCols = activeFormats.length === 1 ? "lg:grid-cols-1" : activeFormats.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

      return (
        <div className={cn("grid grid-cols-1 gap-6", gridCols)}>
          {activeFormats.map(format => (
            <div key={format.key} className="space-y-3">
              <h3 className={cn("text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 pl-2", format.color)}>
                {format.name}
              </h3>
              <div className="flex flex-col gap-4">
                {format.data.map(match => (
                  <MatchCard key={match.id} match={match} onClick={onMatchClick} />
                ))}
              </div>
            </div>
          ))}
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

      {/* Tab Buttons */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <button 
          onClick={() => setActiveTab('all')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          All Matches
        </button>
        <button 
          onClick={() => setActiveTab('live')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'live' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          Live
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'upcoming' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('recent')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'recent' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          Recent
        </button>
      </div>

      <div className="space-y-10">
        {/* LIVE */}
        {(activeTab === 'all' || activeTab === 'live') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                 <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
                 <span className="relative inline-flex h-3 w-3 rounded-full bg-live" />
               </span>
               <h3 className="text-lg font-bold text-foreground">Live Now</h3>
            </div>
            {renderMatchGroup(liveMatches)}
          </div>
        )}

        {/* UPCOMING */}
        {(activeTab === 'all' || activeTab === 'upcoming') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-foreground">Upcoming Matches</h3>
            {renderMatchGroup(upcomingMatches)}
          </div>
        )}

        {/* RECENT / COMPLETED */}
        {(activeTab === 'all' || activeTab === 'recent') && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-foreground">Recent Matches</h3>
            {renderMatchGroup(completedMatches)}
          </div>
        )}
      </div>
    </section>
  );
};
