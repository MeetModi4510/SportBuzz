import { cn, formatScoreString, formatOversText } from "@/lib/utils";
import { Match } from "@/data/types";
import { formatToIST } from "@/lib/dateUtils";
import { MapPin, Clock } from "lucide-react";
import { TeamLogo } from "./TeamLogo";

interface MinimalCricketCardProps {
  match: Match;
  onClick?: (match: Match) => void;
  className?: string;
}

export const MinimalCricketCard = ({ match, onClick, className }: MinimalCricketCardProps) => {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  const scoresUnavailable = (match as any)._scoresUnavailable === true || 
    (isLive && !match.homeScore && !match.awayScore);

  const getStatusText = () => {
    if (isLive) return "Live";
    if (isUpcoming) return "Upcoming";
    return "Result";
  };

  const getStatusColor = () => {
    if (isLive) return "text-red-500 font-semibold";
    if (isUpcoming) return "text-blue-500 font-medium";
    return "text-muted-foreground";
  };

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-secondary/30 p-4 transition-all duration-200",
        "hover:border-primary/50 hover:bg-secondary/50 hover:shadow-md cursor-pointer",
        "w-full flex flex-col gap-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <span className="text-[11px] text-muted-foreground tracking-widest font-semibold uppercase">
          {match.matchType}
        </span>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
           <span className={cn("text-[11px] uppercase tracking-widest", getStatusColor())}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-3.5">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.homeTeam?.logo || ''} name={match.homeTeam?.name || 'TBA'} shortName={match.homeTeam?.shortName} size="md" className="w-11 h-11 shadow-sm" />
            <span className="font-semibold text-foreground text-[15px] tracking-tight">{match.homeTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.filter(i => i?.team === 'home').map((inn, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="font-bold text-[15px] tracking-tight text-foreground">
                    {inn.score}
                  </span>
                  {inn.overs && (
                    <span className="text-xs text-muted-foreground font-medium">
                      ({formatOversText(inn.overs)})
                    </span>
                  )}
                </div>
             ))}
             {(!Array.isArray(match.inningsScores) || match.inningsScores.filter(i => i?.team === 'home').length === 0) && (
               <span className="font-bold text-[15px] tracking-tight text-foreground">
                 {formatScoreString(match.homeScore) || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
               </span>
             )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.awayTeam?.logo || ''} name={match.awayTeam?.name || 'TBA'} shortName={match.awayTeam?.shortName} size="md" className="w-11 h-11 shadow-sm" />
            <span className="font-semibold text-foreground text-[15px] tracking-tight">{match.awayTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.filter(i => i?.team === 'away').map((inn, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="font-bold text-[15px] tracking-tight text-foreground">
                    {inn.score}
                  </span>
                  {inn.overs && (
                    <span className="text-xs text-muted-foreground font-medium">
                      ({formatOversText(inn.overs)})
                    </span>
                  )}
                </div>
             ))}
             {(!Array.isArray(match.inningsScores) || match.inningsScores.filter(i => i?.team === 'away').length === 0) && (
               <span className="font-bold text-[15px] tracking-tight text-foreground">
                 {formatScoreString(match.awayScore) || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
               </span>
             )}
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary */}
      <div className="pt-3.5 border-t border-border/40 flex flex-col gap-2.5">
        {match.summaryText && (
          <span className={cn("text-xs font-semibold leading-relaxed", isLive ? "text-red-400" : "text-primary/90")}>
            {match.summaryText}
          </span>
        )}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80 uppercase tracking-wide font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={11} />
            <span>{match.displayTime || formatToIST(new Date(match.startTime), 'full')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
