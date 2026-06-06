import { cn } from "@/lib/utils";
import { Match, Sport } from "@/data/types";
import { formatToIST } from "@/lib/dateUtils";
import { MapPin, Clock } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { getSportBorderColor } from "./SportIcon";

interface MatchCardProps {
  match: Match;
  onClick?: (match: Match) => void;
  className?: string;
  showSeriesName?: boolean;
}

export const MatchCard = ({ match, onClick, className, showSeriesName }: MatchCardProps) => {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  const scoresUnavailable = (match as any)._scoresUnavailable === true || 
    (isLive && !match.homeScore && !match.awayScore);

  const getStatusText = () => {
    if (isLive) {
      if (match.sport === "football" && match.currentMinute) return `${match.currentMinute}'`;
      if (match.sport === "basketball" && match.currentQuarter) return `Q${match.currentQuarter}`;
      if (match.sport === "tennis" && match.currentSet) return `Set ${match.currentSet}`;
      if (match.sport === "cricket" && match.currentOver) return `Ov ${match.currentOver}`;
      return "Live";
    }
    if (isUpcoming) return "Upcoming";
    return "Result";
  };

  const getStatusColor = () => {
    if (isLive) return "text-foreground font-bold";
    if (isUpcoming) return "text-muted-foreground font-medium";
    return "text-muted-foreground";
  };

  const themeBorder = "border-white/5";

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-md p-4 transition-all duration-300",
        themeBorder,
        "hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-white/10 cursor-pointer",
        "w-full flex flex-col gap-4",
        className
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between pb-3 border-b", themeBorder)}>
        <span className="text-[11px] text-muted-foreground tracking-widest font-semibold uppercase truncate mr-2" title={match.seriesName || match.matchType}>
          {showSeriesName && match.seriesName ? match.seriesName : match.matchType}
        </span>
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />}
           <span className={cn("text-[9px] font-bold uppercase tracking-widest", getStatusColor())}>
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
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'home').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-[15px] tracking-tight text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-bold text-[15px] tracking-tight text-foreground">
                   {match.homeScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
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
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'away').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-[15px] tracking-tight text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-bold text-[15px] tracking-tight text-foreground">
                   {match.awayScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
                 </span>
             )}
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary */}
      <div className={cn("pt-3.5 border-t flex flex-col gap-2.5", themeBorder)}>
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
