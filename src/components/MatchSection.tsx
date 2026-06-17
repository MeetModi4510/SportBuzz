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
  activeTabOverride?: 'live' | 'upcoming' | 'recent';
  onTabChange?: (tab: 'live' | 'upcoming' | 'recent') => void;
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
  activeTabOverride,
  onTabChange,
}: MatchSectionProps) => {
  const [internalTab, setInternalTab] = useState<'live' | 'upcoming' | 'recent'>('live');
  const activeTab = activeTabOverride || internalTab;

  const handleTabClick = (tab: 'live' | 'upcoming' | 'recent') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

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

  const renderMatchGroup = (groupMatches: Match[]) => {
    if (groupMatches.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic py-6 bg-secondary/10 rounded-lg text-center border border-dashed border-border/50">
          No matches in this category
        </div>
      );
    }

    if (onlyLive) {
      return (
        <div className="flex overflow-x-auto snap-x gap-6 pb-6 pt-2 scrollbar-hide">
          {groupMatches.map(match => (
            <div key={match.id} className="snap-start shrink-0 w-[300px] md:w-[380px] h-full flex flex-col transition-all hover:-translate-y-1">
              <MatchCard match={match} onClick={onMatchClick} showSeriesName={true} />
            </div>
          ))}
        </div>
      );
    }

    // Group matches by seriesName
    const grouped = groupMatches.reduce((acc, match) => {
      let series = match.seriesName || "Other Matches";
      if (typeof series !== 'string') series = "Other Matches";
      
      if (!acc[series]) {
        acc[series] = [];
      }
      acc[series].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    return (
      <div className="space-y-10">
        {Object.entries(grouped).map(([series, matchesInSeries]) => (
          <div key={series} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest border-l-4 border-primary pl-3 py-1">
              {series}
            </h3>
            <div className="flex overflow-x-auto snap-x gap-6 pb-6 pt-2">
              {matchesInSeries.map(match => (
                <div key={match.id} className="snap-start shrink-0 w-[300px] md:w-[380px] h-full flex flex-col transition-all hover:-translate-y-1">
                  <MatchCard match={match} onClick={onMatchClick} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (onlyLive) {
    return (
      <section className={cn("space-y-4", className)}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SportIcon sport={sport} size={24} />
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold font-display text-foreground">{title}</h2>
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-widest uppercase">
                All Live Matches
              </span>
            </div>
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
          renderMatchGroup(liveMatches)
        )}
      </section>
    );
  }

  // Not onlyLive: Show Live, Upcoming, Recent
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const completedMatches = matches.filter((m) => m.status === "completed");



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
          onClick={() => handleTabClick('live')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", activeTab === 'live' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
          </span>
          Live
        </button>
        <button 
          onClick={() => handleTabClick('upcoming')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'upcoming' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          Upcoming
        </button>
        <button 
          onClick={() => handleTabClick('recent')}
          className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'recent' ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary")}
        >
          Recent
        </button>
      </div>

      <div className="space-y-10">
        {/* LIVE */}
        {activeTab === 'live' && (
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
        {activeTab === 'upcoming' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-foreground">Upcoming Matches</h3>
            {renderMatchGroup(upcomingMatches)}
          </div>
        )}

        {/* RECENT / COMPLETED */}
        {activeTab === 'recent' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-foreground">Recent Matches</h3>
            {renderMatchGroup(completedMatches)}
          </div>
        )}
      </div>
    </section>
  );
};
