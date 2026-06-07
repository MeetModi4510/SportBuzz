import { FootballTransferData } from "../../types/football";
import { ArrowRight, CalendarDays, ArrowRightLeft } from "lucide-react";
import { TeamLogo } from "../TeamLogo";

interface TransferCardProps {
  transferData: FootballTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const { player, transfers } = transferData;
  // Get the most recent transfer from the array
  const latestTransfer = transfers[0];

  if (!latestTransfer) return null;

  return (
    <div className="bg-secondary/10 border border-border/20 rounded-2xl p-5 hover:bg-secondary/20 transition-all duration-300 group shadow-sm hover:shadow-md relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header: Date & Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/50 px-2.5 py-1 rounded-md border border-border/30">
            <CalendarDays size={12} />
            {new Date(latestTransfer.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
            <ArrowRightLeft size={10} />
            {latestTransfer.type || 'Transfer'}
          </div>
        </div>

        {/* Player Name */}
        <h3 className="text-xl font-bold tracking-tight text-foreground truncate mt-1">
          {player.name}
        </h3>

        {/* Teams Flow */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/20">
          
          {/* Team OUT */}
          <div className="flex flex-col items-center flex-1 w-0">
            <div className="w-12 h-12 bg-background rounded-full p-2 border border-border/30 flex items-center justify-center mb-2 shadow-sm">
              <TeamLogo logo={latestTransfer.teams.out.logo} name={latestTransfer.teams.out.name} size="sm" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-semibold text-center truncate w-full text-muted-foreground">
              {latestTransfer.teams.out.name}
            </span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center shrink-0 w-12 text-muted-foreground/40 group-hover:text-primary transition-colors">
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Team IN */}
          <div className="flex flex-col items-center flex-1 w-0">
            <div className="w-12 h-12 bg-background rounded-full p-2 border border-border/30 flex items-center justify-center mb-2 shadow-sm">
              <TeamLogo logo={latestTransfer.teams.in.logo} name={latestTransfer.teams.in.name} size="sm" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-semibold text-center truncate w-full text-foreground">
              {latestTransfer.teams.in.name}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
