import { cn } from "../../lib/utils";
import { FootballMatch } from "../../types/football";
import { formatToIST } from "../../lib/dateUtils";
import { MapPin, Clock } from "lucide-react";
import { TeamLogo } from "../TeamLogo";

interface FootballMatchCardProps {
  match: FootballMatch;
  onClick?: (match: FootballMatch) => void;
  className?: string;
}

export const FootballMatchCard = ({ match, onClick, className }: FootballMatchCardProps) => {
  const isLive = match.fixture.status.short === "1H" || 
                 match.fixture.status.short === "2H" || 
                 match.fixture.status.short === "HT" || 
                 match.fixture.status.short === "ET" ||
                 match.fixture.status.short === "P";
                 
  const isUpcoming = match.fixture.status.short === "NS";

  const getStatusText = () => {
    if (isLive) return `${match.fixture.status.elapsed}'`;
    if (isUpcoming) return "Upcoming";
    return match.fixture.status.short; // FT, AET, PEN
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
        <div className="flex items-center gap-2">
           <img src={match.league.logo} alt={match.league.name} className="w-4 h-4 object-contain" />
           <span className="text-[11px] text-muted-foreground tracking-widest font-semibold uppercase truncate max-w-[150px]">
             {match.league.name}
           </span>
        </div>
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
            <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="md" className="w-11 h-11 shadow-sm" />
            <span className={cn("font-semibold text-[15px] tracking-tight", match.teams.home.winner ? "text-foreground" : "text-muted-foreground")}>
              {match.teams.home.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-bold text-[18px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.goals.home ?? 0}
             </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="md" className="w-11 h-11 shadow-sm" />
            <span className={cn("font-semibold text-[15px] tracking-tight", match.teams.away.winner ? "text-foreground" : "text-muted-foreground")}>
              {match.teams.away.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-bold text-[18px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.goals.away ?? 0}
             </span>
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary */}
      <div className="pt-3.5 border-t border-border/40 flex flex-col gap-2.5">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80 uppercase tracking-wide font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{match.fixture.venue.name || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={11} />
            <span>{formatToIST(new Date(match.fixture.date), 'full')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
