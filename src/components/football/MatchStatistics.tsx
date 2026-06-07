import { FootballTeamStatistics, FootballTeam } from "../../types/football";
import { TeamLogo } from "../TeamLogo";
import { BarChart3 } from "lucide-react";

interface MatchStatisticsProps {
  statistics: FootballTeamStatistics[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
}

export function MatchStatistics({ statistics, homeTeam, awayTeam }: MatchStatisticsProps) {
  if (!statistics || statistics.length !== 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/10 rounded-xl border border-border/30">
        <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
        <p>Detailed statistics not available yet.</p>
      </div>
    );
  }

  const homeStats = statistics.find(s => s.team.id === homeTeam.id)?.statistics || [];
  const awayStats = statistics.find(s => s.team.id === awayTeam.id)?.statistics || [];

  // Group stats by type so we can compare them side by side
  const statTypes = homeStats.map(s => s.type);

  const parseStatValue = (val: string | number | null) => {
    if (val === null) return 0;
    if (typeof val === 'string') return parseInt(val.replace('%', '')) || 0;
    return val;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-xl border border-border/40">
        <div className="flex items-center gap-3">
          <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="sm" />
          <span className="font-bold">{homeTeam.name}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Team Stats</span>
        <div className="flex items-center gap-3">
          <span className="font-bold">{awayTeam.name}</span>
          <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="sm" />
        </div>
      </div>

      <div className="space-y-6">
        {statTypes.map((type, idx) => {
          const homeValRaw = homeStats.find(s => s.type === type)?.value ?? 0;
          const awayValRaw = awayStats.find(s => s.type === type)?.value ?? 0;
          
          const homeNum = parseStatValue(homeValRaw);
          const awayNum = parseStatValue(awayValRaw);
          
          const total = homeNum + awayNum;
          const homePercent = total > 0 ? (homeNum / total) * 100 : 50;
          const awayPercent = total > 0 ? (awayNum / total) * 100 : 50;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className={homeNum >= awayNum ? 'text-primary' : 'text-muted-foreground'}>{homeValRaw}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">{type}</span>
                <span className={awayNum >= homeNum ? 'text-primary' : 'text-muted-foreground'}>{awayValRaw}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                <div 
                  className="bg-primary/80 transition-all duration-1000" 
                  style={{ width: `${homePercent}%` }} 
                />
                <div 
                  className="bg-primary/20 transition-all duration-1000" 
                  style={{ width: `${awayPercent}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
