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
        "group relative overflow-hidden rounded-[1.5rem] p-5 transition-all duration-500",
        "bg-gradient-to-br from-[#1c1c1c] via-[#121212] to-[#0a0a0a] border border-[#D4AF37]/20",
        "shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1),0_8px_20px_rgba(0,0,0,0.5)]",
        "hover:-translate-y-1.5 hover:shadow-[inset_0_1px_0_0_rgba(212,175,55,0.2),0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#D4AF37]/40 cursor-pointer",
        "w-full flex flex-col gap-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#D4AF37]/70 tracking-[0.2em] font-semibold uppercase truncate mr-2" title={match.seriesName || match.matchType}>
          {showSeriesName && match.seriesName ? match.seriesName : match.matchType}
        </span>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />}
           <span className={cn("text-[9px] font-bold uppercase tracking-widest", isLive ? "text-[#D4AF37]" : "text-muted-foreground")}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-0.5 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-transparent">
              <TeamLogo logo={match.homeTeam?.logo || ''} name={match.homeTeam?.name || 'TBA'} shortName={match.homeTeam?.shortName} size="md" className="w-10 h-10 rounded-full bg-[#0a0a0a]" />
            </div>
            <span className="font-bold text-white/90 text-[17px] tracking-tight">{match.homeTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'home').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-black text-[20px] tracking-tighter bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-[#D4AF37]/50 font-medium">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-black text-[20px] tracking-tighter bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                   {match.homeScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
                 </span>
             )}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-0.5 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-transparent">
              <TeamLogo logo={match.awayTeam?.logo || ''} name={match.awayTeam?.name || 'TBA'} shortName={match.awayTeam?.shortName} size="md" className="w-10 h-10 rounded-full bg-[#0a0a0a]" />
            </div>
            <span className="font-bold text-white/90 text-[17px] tracking-tight">{match.awayTeam?.name || 'TBA'}</span>
          </div>
          <div className="flex flex-col items-end">
             {Array.isArray(match.inningsScores) && match.inningsScores.length > 0 ? (
                 match.inningsScores.filter(i => i?.team === 'away').map((inn, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-black text-[20px] tracking-tighter bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                        {inn.score}
                      </span>
                      {inn.overs && (
                        <span className="text-xs text-[#D4AF37]/50 font-medium">
                          ({inn.overs})
                        </span>
                      )}
                    </div>
                 ))
             ) : (
                 <span className="font-black text-[20px] tracking-tighter bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                   {match.awayScore || (isUpcoming ? '-' : (scoresUnavailable ? '-' : '0/0'))}
                 </span>
             )}
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#D4AF37]/10">
        {match.summaryText && (
          <span className={cn("text-xs font-semibold leading-relaxed tracking-wide", isLive ? "text-[#D4AF37]" : "text-[#D4AF37]/80")}>
            {match.summaryText}
          </span>
        )}
        <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-1">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={10} className="flex-shrink-0 text-[#D4AF37]/50" />
            <span className="truncate">{typeof match.venue === 'object' ? match.venue?.name : match.venue || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={10} className="text-[#D4AF37]/50" />
            <span>{match.displayTime || formatToIST(new Date(match.startTime), 'full')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
