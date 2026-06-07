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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-secondary/10 p-5 rounded-2xl border border-border/20 backdrop-blur-sm mb-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-background rounded-full p-2 border border-border/30 shadow-sm flex items-center justify-center shrink-0">
            <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="md" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-base md:text-lg hidden sm:block truncate">{homeTeam.name}</span>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-4 shrink-0">
          Match Stats
        </span>
        <div className="flex items-center justify-end gap-4 flex-1 text-right">
          <span className="font-bold text-base md:text-lg hidden sm:block truncate">{awayTeam.name}</span>
          <div className="w-12 h-12 bg-background rounded-full p-2 border border-border/30 shadow-sm flex items-center justify-center shrink-0">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="md" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Stats List */}
      <div className="bg-background border border-border/20 rounded-3xl p-2 md:p-6 shadow-sm">
        <div className="flex flex-col gap-6 w-full">
          {statTypes.map((type, idx) => {
            const homeValRaw = homeStats.find(s => s.type === type)?.value ?? 0;
            const awayValRaw = awayStats.find(s => s.type === type)?.value ?? 0;
            
            const homeNum = parseStatValue(homeValRaw);
            const awayNum = parseStatValue(awayValRaw);
            
            const maxVal = Math.max(homeNum, awayNum);
            // Calculate widths relative to the max value to show clear dominance.
            // If both are 0, we don't want to divide by zero, so default to 0 width.
            const homeWidth = maxVal > 0 ? (homeNum / maxVal) * 100 : 0;
            const awayWidth = maxVal > 0 ? (awayNum / maxVal) * 100 : 0;

            return (
              <div key={idx} className="flex flex-col gap-2 px-2 md:px-4 group">
                
                {/* Text Row */}
                <div className="flex justify-between items-end">
                  <span className={`text-lg md:text-xl font-bold w-12 text-left ${homeNum >= awayNum ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {homeValRaw}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">
                    {type}
                  </span>
                  <span className={`text-lg md:text-xl font-bold w-12 text-right ${awayNum >= homeNum ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {awayValRaw}
                  </span>
                </div>

                {/* Opposing Bars */}
                <div className="flex w-full h-2 gap-1.5 items-center justify-center">
                  {/* Home Bar */}
                  <div className="flex-1 h-full bg-secondary/40 rounded-l-full flex justify-end overflow-hidden">
                    <div 
                      className={`h-full rounded-l-full transition-all duration-1000 ease-out ${homeNum >= awayNum && homeNum > 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} 
                      style={{ width: `${homeWidth}%` }} 
                    />
                  </div>
                  {/* Center Divider */}
                  <div className="w-[1px] h-3 bg-border/50 rounded-full" />
                  {/* Away Bar */}
                  <div className="flex-1 h-full bg-secondary/40 rounded-r-full flex justify-start overflow-hidden">
                    <div 
                      className={`h-full rounded-r-full transition-all duration-1000 ease-out ${awayNum >= homeNum && awayNum > 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} 
                      style={{ width: `${awayWidth}%` }} 
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
