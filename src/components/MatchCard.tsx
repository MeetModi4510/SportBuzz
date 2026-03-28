import { cn } from "@/lib/utils";
import { Match, Sport } from "@/data/types";
import { LiveBadge } from "./LiveBadge";
import { SportIcon, getSportGradient, getSportBorderColor } from "./SportIcon";
import { MapPin, Clock, Trophy, AlertCircle, Minus } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { formatToIST } from "@/lib/dateUtils";



interface MatchCardProps {
  match: Match;
  onClick?: (match: Match) => void;
  className?: string;
}

export const MatchCard = ({ match, onClick, className }: MatchCardProps) => {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const isCompleted = match.status === "completed";

  const getStatusBadge = () => {
    if (isLive) return <LiveBadge size="sm" />;
    if (isUpcoming) {
      return (
        <span className="text-xs px-2 py-1 bg-accent/50 text-accent-foreground rounded-full font-medium">
          Upcoming
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-medium">
        Completed
      </span>
    );
  };

  const getMatchTime = () => {
    if (isLive) {
      if (match.sport === "cricket" && match.currentOver) {
        return `Over ${match.currentOver}`;
      }
      if (match.sport === "football" && match.currentMinute) {
        return `${match.currentMinute}'`;
      }
      if (match.sport === "basketball" && match.currentQuarter) {
        return `Q${match.currentQuarter}`;
      }
      if (match.sport === "tennis" && match.currentSet) {
        return `Set ${match.currentSet}`;
      }
      return "In Progress";
    }
    // Use pre-formatted IST displayTime from model, fallback to formatToIST
    return match.displayTime || formatToIST(new Date(match.startTime), 'full');
  };

  // Get result styling based on summaryText
  const getResultBar = () => {
    const summary = (match.summaryText || '').toLowerCase();

    if (isLive) {
      // Live matches - show chase status or current state
      return (
        <div className="mt-3 p-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium text-center animate-pulse">
          🔴 {match.sport === 'cricket' ? (match.summaryText || 'Live') : 'Live'}
        </div>
      );
    }

    if (isCompleted && match.summaryText) {
      if (match.sport !== 'cricket') {
        return null;
      }
      return (
        <div className="mt-3 p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 font-medium text-center">
          🏆 {match.summaryText}
        </div>
      );
    }

    if (isUpcoming && match.displayTime) {
      return (
        <div className="mt-3 p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 font-medium text-center">
          📅 {match.displayTime}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 cursor-pointer",
        match.matchType === 'Test' ? "h-[380px] flex flex-col" : "h-[280px] flex flex-col", // Taller for Test matches
        `bg-gradient-to-br ${getSportGradient(match.sport)}`,
        getSportBorderColor(match.sport),
        isLive && "ring-2 ring-live/50 animate-pulse-live",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SportIcon sport={match.sport} size={16} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {match.matchType}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Teams & Score - Flex grow to fill space */}
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        {match.inningsScores && match.inningsScores.length > 0 ? (
          // Test Match Layout - Compact to fit in card
          <div className="flex flex-col flex-1 gap-1 pr-1">
            {/* Home Team Block */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} shortName={match.homeTeam.shortName} size="md" className="h-12 w-12" />
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-xl leading-none">{match.homeTeam.shortName}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{match.homeTeam.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 min-w-[90px]">
                  {match.inningsScores.filter(i => i.team === 'home').map((inn, idx) => {
                    const isLastInningOfMatch = inn === match.inningsScores![match.inningsScores!.length - 1];
                    return (
                      <div key={idx} className="flex items-center justify-end gap-2 w-full">
                        <span className="text-muted-foreground text-[10px] font-mono font-medium opacity-70">({inn.inning})</span>
                        <span className={cn("font-mono font-bold text-sm whitespace-nowrap", isLive && isLastInningOfMatch && "text-red-500")}>
                          {inn.score}{inn.overs ? `${inn.overs}` : ''}
                        </span>
                      </div>
                    );
                  })}
                  {match.inningsScores.filter(i => i.team === 'home').length === 0 && (
                    <span className="text-muted-foreground text-sm font-mono">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Partition - Match Info/Status */}
            <div className="flex items-center gap-2 my-0.5 shrink-0">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground font-medium px-2 text-center">
                {isLive ? 'In Progress' : match.displayTime || formatToIST(new Date(match.startTime), 'date')}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Away Team Block */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} shortName={match.awayTeam.shortName} size="md" className="h-12 w-12" />
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-xl leading-none">{match.awayTeam.shortName}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{match.awayTeam.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 min-w-[90px]">
                  {match.inningsScores.filter(i => i.team === 'away').map((inn, idx) => {
                    const isLastInningOfMatch = inn === match.inningsScores![match.inningsScores!.length - 1];
                    return (
                      <div key={idx} className="flex items-center justify-end gap-2 w-full">
                        <span className="text-muted-foreground text-[10px] font-mono font-medium opacity-70">({inn.inning})</span>
                        <span className={cn("font-mono font-bold text-sm whitespace-nowrap", isLive && isLastInningOfMatch && "text-red-500")}>
                          {inn.score}{inn.overs ? ` ${inn.overs}` : ''}
                        </span>
                      </div>
                    );
                  })}
                  {match.inningsScores.filter(i => i.team === 'away').length === 0 && (
                    <span className="text-muted-foreground text-sm font-mono">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Standard Match Layout (ODI/T20/etc)
          <>
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} shortName={match.homeTeam.shortName} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{match.homeTeam.shortName}</p>
                  <p className="text-xs text-muted-foreground truncate">{match.homeTeam.name}</p>
                </div>
              </div>
              <span className={cn(
                "text-lg font-bold font-mono whitespace-nowrap",
                isLive && "text-live"
              )}>
                {match.homeScore || (isUpcoming ? '-' : '0/0')}
              </span>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2">
                {getMatchTime()}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} shortName={match.awayTeam.shortName} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{match.awayTeam.shortName}</p>
                  <p className="text-xs text-muted-foreground truncate">{match.awayTeam.name}</p>
                </div>
              </div>
              <span className={cn(
                "text-lg font-bold font-mono whitespace-nowrap",
                isLive && "text-live"
              )}>
                {match.awayScore || (isUpcoming ? '-' : '0/0')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Footer - Venue */}
      <div className="pt-2 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 truncate flex-1">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Clock size={12} />
          <span>{formatToIST(new Date(match.startTime), 'time')}</span>
        </div>
      </div>

      {/* Status/Result Bar */}
      {getResultBar()}
    </div>
  );
};

