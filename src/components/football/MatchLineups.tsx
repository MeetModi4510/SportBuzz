import { FootballLineup, FootballTeam } from "../../types/football";
import { TeamLogo } from "../TeamLogo";
import { Users } from "lucide-react";

interface MatchLineupsProps {
  lineups: FootballLineup[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
}

export function MatchLineups({ lineups, homeTeam, awayTeam }: MatchLineupsProps) {
  if (!lineups || lineups.length !== 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/10 rounded-xl border border-border/30">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Lineups not available yet.</p>
      </div>
    );
  }

  const homeLineup = lineups.find(l => l.team.id === homeTeam.id);
  const awayLineup = lineups.find(l => l.team.id === awayTeam.id);

  if (!homeLineup || !awayLineup) return null;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
      
      {/* Home Lineup */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-xl border border-border/40">
          <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="md" />
          <div>
            <h3 className="font-bold text-lg">{homeTeam.name}</h3>
            <p className="text-sm text-muted-foreground font-medium">Formation: {homeLineup.formation}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">Starting XI</h4>
          <div className="space-y-2">
            {homeLineup.startXI.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-secondary/10 p-2.5 rounded-lg border border-border/20 hover:bg-secondary/30 transition-colors">
                <span className="w-8 h-8 rounded-full bg-background border border-border/40 flex items-center justify-center text-xs font-bold font-display">
                  {item.player.number}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm leading-tight">{item.player.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{item.player.pos}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">Substitutes</h4>
          <div className="space-y-2">
            {homeLineup.substitutes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-secondary/5 p-2 rounded-lg border border-border/10">
                <span className="w-6 h-6 rounded-full bg-background border border-border/30 flex items-center justify-center text-[10px] font-bold opacity-70">
                  {item.player.number}
                </span>
                <p className="font-medium text-xs flex-1 opacity-80">{item.player.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Away Lineup */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-xl border border-border/40 md:flex-row-reverse md:text-right">
          <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="md" />
          <div>
            <h3 className="font-bold text-lg">{awayTeam.name}</h3>
            <p className="text-sm text-muted-foreground font-medium">Formation: {awayLineup.formation}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 md:text-right">Starting XI</h4>
          <div className="space-y-2">
            {awayLineup.startXI.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-secondary/10 p-2.5 rounded-lg border border-border/20 hover:bg-secondary/30 transition-colors md:flex-row-reverse md:text-right">
                <span className="w-8 h-8 rounded-full bg-background border border-border/40 flex items-center justify-center text-xs font-bold font-display">
                  {item.player.number}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm leading-tight">{item.player.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{item.player.pos}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 md:text-right">Substitutes</h4>
          <div className="space-y-2">
            {awayLineup.substitutes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-secondary/5 p-2 rounded-lg border border-border/10 md:flex-row-reverse md:text-right">
                <span className="w-6 h-6 rounded-full bg-background border border-border/30 flex items-center justify-center text-[10px] font-bold opacity-70">
                  {item.player.number}
                </span>
                <p className="font-medium text-xs flex-1 opacity-80">{item.player.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
