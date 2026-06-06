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
    <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
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

      {/* Rankings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              <th className="px-6 py-4 rounded-l-xl font-semibold">Pos</th>
              <th className="px-6 py-4 font-semibold">Team</th>
              <th className="px-6 py-4 font-semibold text-center">Points</th>
              <th className="px-6 py-4 rounded-r-xl font-semibold text-right">Rating</th>
            </tr>
          </thead>
          <tbody>
            {mockTeamRankings[activeFormat].map((row, index) => (
              <tr key={row.team} className="border-b border-border/10 last:border-0 hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-secondary/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {row.rank}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <TeamLogo logo={row.logo} name={row.team} size="sm" className="w-8 h-8 rounded-full shadow-sm" />
                  <span className="text-base text-foreground group-hover:text-primary transition-colors">{row.team}</span>
                </td>
                <td className="px-6 py-4 text-center text-muted-foreground font-medium">
                  {row.points.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {row.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
