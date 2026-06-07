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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-xl border border-border/30 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3 w-[120px]">
          <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="sm" />
          <span className="font-bold text-sm hidden sm:block truncate">{homeTeam.name}</span>
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Match Stats</span>
        <div className="flex items-center justify-end gap-3 w-[120px]">
          <span className="font-bold text-sm hidden sm:block truncate">{awayTeam.name}</span>
          <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="sm" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statTypes.map((type, idx) => {
          const homeValRaw = homeStats.find(s => s.type === type)?.value ?? 0;
          const awayValRaw = awayStats.find(s => s.type === type)?.value ?? 0;
          
          const homeNum = parseStatValue(homeValRaw);
          const awayNum = parseStatValue(awayValRaw);
          
          const total = homeNum + awayNum;
          // Avoid division by zero
          const homePercent = total > 0 ? (homeNum / total) * 100 : 50;
          
          // Circular SVG calculations
          const size = 64;
          const strokeWidth = 5;
          const radius = (size - strokeWidth) / 2;
          const circumference = 2 * Math.PI * radius;
          const homeStroke = (homePercent / 100) * circumference;

          return (
            <div key={idx} className="flex flex-col items-center justify-between bg-background border border-border/30 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-300 group relative overflow-hidden">
              
              {/* Stat Name */}
              <span className="text-[10px] font-bold tracking-[0.1em] text-center text-muted-foreground uppercase mb-3 h-8 flex items-center justify-center w-full leading-tight">
                {type}
              </span>

              {/* Center Visualization */}
              <div className="relative flex items-center justify-center w-full mb-2">
                {/* Home Stat */}
                <div className="absolute left-0 flex items-center justify-center w-8">
                  <span className={`text-lg md:text-xl font-black ${homeNum >= awayNum ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {homeValRaw}
                  </span>
                </div>

                {/* Circular Dominance Ring */}
                <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500" style={{ width: size, height: size }}>
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Away (Background) Track */}
                    <circle 
                      cx={size / 2} cy={size / 2} r={radius} 
                      stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" 
                      className="text-secondary" 
                    />
                    {/* Home (Foreground) Track */}
                    <circle 
                      cx={size / 2} cy={size / 2} r={radius} 
                      stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" 
                      className="text-foreground transition-all duration-1000 ease-out" 
                      strokeDasharray={`${homeStroke} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Subtle center indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${homeNum > awayNum ? 'bg-foreground' : (awayNum > homeNum ? 'bg-secondary-foreground/40' : 'bg-muted')}`} />
                  </div>
                </div>

                {/* Away Stat */}
                <div className="absolute right-0 flex items-center justify-center w-8">
                  <span className={`text-lg md:text-xl font-black ${awayNum >= homeNum ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {awayValRaw}
                  </span>
                </div>
              </div>
              
              {/* Subtle accent line at bottom based on dominance */}
              <div className="absolute bottom-0 left-0 h-1 bg-foreground transition-all duration-500" style={{ width: `${homePercent}%` }} />
              <div className="absolute bottom-0 right-0 h-1 bg-secondary transition-all duration-500" style={{ width: `${100 - homePercent}%` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
