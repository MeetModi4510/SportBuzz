import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Star } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

type Format = 'Test' | 'ODI' | 'T20I';

const mockTeamRankings: Record<Format, Array<{ rank: number, team: string, logo: string, rating: number, points: number }>> = {
  Test: [
    { rank: 1, team: 'Australia', logo: 'https://flagcdn.com/au.svg', rating: 124, points: 3715 },
    { rank: 2, team: 'India', logo: 'https://flagcdn.com/in.svg', rating: 120, points: 4081 },
    { rank: 3, team: 'England', logo: 'https://flagcdn.com/gb-eng.svg', rating: 105, points: 4497 },
    { rank: 4, team: 'South Africa', logo: 'https://flagcdn.com/za.svg', rating: 103, points: 2686 },
    { rank: 5, team: 'New Zealand', logo: 'https://flagcdn.com/nz.svg', rating: 96, points: 2496 },
  ],
  ODI: [
    { rank: 1, team: 'India', logo: 'https://flagcdn.com/in.svg', rating: 122, points: 6592 },
    { rank: 2, team: 'Australia', logo: 'https://flagcdn.com/au.svg', rating: 116, points: 5108 },
    { rank: 3, team: 'South Africa', logo: 'https://flagcdn.com/za.svg', rating: 112, points: 4134 },
    { rank: 4, team: 'Pakistan', logo: 'https://flagcdn.com/pk.svg', rating: 106, points: 3717 },
    { rank: 5, team: 'New Zealand', logo: 'https://flagcdn.com/nz.svg', rating: 101, points: 4048 },
  ],
  T20I: [
    { rank: 1, team: 'India', logo: 'https://flagcdn.com/in.svg', rating: 267, points: 15729 },
    { rank: 2, team: 'Australia', logo: 'https://flagcdn.com/au.svg', rating: 256, points: 10738 },
    { rank: 3, team: 'England', logo: 'https://flagcdn.com/gb-eng.svg', rating: 252, points: 10103 },
    { rank: 4, team: 'West Indies', logo: 'https://flagcdn.com/jm.svg', rating: 250, points: 11263 },
    { rank: 5, team: 'New Zealand', logo: 'https://flagcdn.com/nz.svg', rating: 247, points: 9877 },
  ]
};

export const CricketRankings = () => {
  const [activeFormat, setActiveFormat] = useState<Format>('Test');

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/40 p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">ICC Team Rankings</h2>
            <p className="text-sm text-muted-foreground">Global Men's Standings</p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex items-center p-1 bg-background/50 rounded-xl border border-border/50 self-start md:self-auto">
          {(['Test', 'ODI', 'T20I'] as Format[]).map((format) => (
            <button
              key={format}
              onClick={() => setActiveFormat(format)}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300",
                activeFormat === format
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {mockTeamRankings[activeFormat].slice(0, 5).map((row, index) => (
          <div key={row.team} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/20 border border-border/30 hover:border-border/60 hover:bg-secondary/40 transition-all duration-300 group">
            <div className="flex items-center justify-between w-full mb-3">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                row.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                row.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                row.rank === 3 ? "bg-amber-600/20 text-amber-500" :
                "bg-primary/10 text-primary"
              )}>
                #{row.rank}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{row.rating} RTG</span>
            </div>
            <TeamLogo logo={row.logo} name={row.team} size="md" className="w-12 h-12 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-bold text-foreground text-center truncate w-full">{row.team}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
