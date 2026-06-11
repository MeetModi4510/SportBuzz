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
    if (isLive) return "text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full";
    if (isUpcoming) return "text-muted-foreground/80 font-medium";
    return "text-muted-foreground/80 font-medium";
  };

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-border/50 bg-foreground/[0.02] p-6 backdrop-blur-xl transition-all duration-300",
        "hover:bg-foreground/[0.04] hover:border-border cursor-pointer flex flex-col h-full",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-3xl pointer-events-none group-hover:bg-foreground/10 transition-colors" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50 relative z-10">
        <div className="flex items-center gap-2.5">
           <img src={match.league.logo} alt={match.league.name} className="w-6 h-6 object-contain" />
           <span className="text-[10px] text-muted-foreground tracking-widest font-semibold uppercase truncate max-w-[150px]">
             {match.league.name}
           </span>
        </div>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
           <span className={cn("text-[10px] uppercase tracking-widest", getStatusColor())}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-5 relative z-10 flex-1">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="md" className="w-12 h-12" />
            <span className={cn("font-bold text-[17px] tracking-tight", match.teams.home.winner ? "text-foreground" : "text-foreground/70")}>
              {match.teams.home.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-black text-[22px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.goals.home ?? 0}
             </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="md" className="w-12 h-12" />
            <span className={cn("font-bold text-[17px] tracking-tight", match.teams.away.winner ? "text-foreground" : "text-foreground/70")}>
              {match.teams.away.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-black text-[22px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.goals.away ?? 0}
             </span>
          </div>
        </div>
      </div>

      {/* Footer / Match Status Summary */}
      <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2 relative z-10">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{match.fixture.venue.name || "Venue"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={12} />
            <span>{formatToIST(new Date(match.fixture.date), 'short')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
