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
        "group relative overflow-hidden rounded-[1.5rem] bg-card border border-white/[0.03] p-5 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-white/10 cursor-pointer",
        "w-full flex flex-col gap-5",
        className
      )}
    >
      {/* Header - Completely borderless, ultra minimal */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground tracking-[0.2em] font-semibold uppercase truncate mr-2 opacity-80" title={match.seriesName || match.matchType}>
          {showSeriesName && match.seriesName ? match.seriesName : match.matchType}
        </span>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
           <span className={cn("text-[9px] font-bold uppercase tracking-widest", getStatusColor())}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <TeamLogo logo={match.homeTeam?.logo || ''} name={match.homeTeam?.name || 'TBA'} shortName={match.homeTeam?.shortName} size="md" className="w-10 h-10 ring-1 ring-white/10 shadow-sm" />
            <span className="font-bold text-foreground text-[17px] tracking-tight">{match.homeTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'home').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-black text-[19px] tracking-tighter text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium opacity-70">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-black text-[19px] tracking-tighter text-foreground">
                   {match.homeScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
                 </span>
             )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <TeamLogo logo={match.awayTeam?.logo || ''} name={match.awayTeam?.name || 'TBA'} shortName={match.awayTeam?.shortName} size="md" className="w-10 h-10 ring-1 ring-white/10 shadow-sm" />
            <span className="font-bold text-foreground text-[17px] tracking-tight">{match.awayTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'away').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-black text-[19px] tracking-tighter text-foreground">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-muted-foreground font-medium opacity-70">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-black text-[19px] tracking-tighter text-foreground">
                   {match.awayScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
                 </span>
             )}
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary - No Borders */}
      <div className="flex flex-col gap-2 pt-2">
        {match.summaryText && (
          <span className={cn("text-xs font-semibold leading-relaxed tracking-wide", isLive ? "text-red-400" : "text-primary/90")}>
            {match.summaryText}
          </span>
        )}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold mt-1">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={10} />
            <span>{match.displayTime || formatToIST(new Date(match.startTime), 'full')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
