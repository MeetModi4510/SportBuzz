import React from 'react';
import { cn } from "../../lib/utils";
import { LivescoreMatch } from "../../hooks/football/useLivescore6Queries";
import { MapPin, Clock } from "lucide-react";
import { TeamLogo } from "../TeamLogo";

interface LivescoreMatchCardProps {
  match: LivescoreMatch;
  onClick?: (match: LivescoreMatch) => void;
  className?: string;
}

export const LivescoreMatchCard = ({ match, onClick, className }: LivescoreMatchCardProps) => {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden border bg-foreground/[0.02] p-6 backdrop-blur-xl transition-all duration-500 cursor-pointer flex flex-col h-full",
        "rounded-[2rem] border-border/50 hover:bg-foreground/[0.04] hover:border-border",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-3xl pointer-events-none group-hover:bg-foreground/10 transition-colors" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 relative z-10">
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-muted-foreground tracking-widest font-semibold uppercase truncate max-w-[200px]">
             {match.category} - {match.leagueName}
           </span>
        </div>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
           <span className={cn(
               "text-[10px] uppercase tracking-widest font-bold", 
               isLive ? "text-emerald-500" : "text-muted-foreground/80"
           )}>
             {isLive ? match.displayTime : (isUpcoming ? 'Upcoming' : match.displayTime || 'FT')}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col gap-5 py-2 relative z-10 flex-1 justify-center">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.homeTeam.logo || ''} name={match.homeTeam.name} size="md" className="w-12 h-12" />
            <span className="font-bold text-[17px] tracking-tight text-foreground">
              {match.homeTeam.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-black text-[22px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.homeScore || 0}
             </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TeamLogo logo={match.awayTeam.logo || ''} name={match.awayTeam.name} size="md" className="w-12 h-12" />
            <span className="font-bold text-[17px] tracking-tight text-foreground">
              {match.awayTeam.name}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-black text-[22px] tracking-tight text-foreground">
               {isUpcoming ? '-' : match.awayScore || 0}
             </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 flex flex-col gap-2 relative z-10 border-t border-border/50">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-muted-foreground/60">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock size={14} />
            <span>
                {new Date(match.startTime).toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata', 
                    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true 
                }) + ' IST'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
