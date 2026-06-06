import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

type Format = 'Test' | 'ODI' | 'T20I';
type Category = 'Teams' | 'Batters' | 'Bowlers' | 'All-Rounders';

// Updated mock data to match the API format: rank, rating, matches, points, imageId
const mockRankings = {
  Teams: [
    { rank: 1, name: 'India', imageId: 'in', matches: 52, points: 14306, rating: 275 },
    { rank: 2, name: 'England', imageId: 'gb-eng', matches: 34, points: 8904, rating: 262 },
    { rank: 3, name: 'Australia', imageId: 'au', matches: 41, points: 10500, rating: 256 },
    { rank: 4, name: 'South Africa', imageId: 'za', matches: 30, points: 7500, rating: 250 },
    { rank: 5, name: 'New Zealand', imageId: 'nz', matches: 38, points: 9386, rating: 247 },
  ],
  Batters: [
    { rank: 1, name: 'Babar Azam', imageId: 'pk', matches: 100, points: 8240, rating: 824 },
    { rank: 2, name: 'Shubman Gill', imageId: 'in', matches: 45, points: 3600, rating: 801 },
    { rank: 3, name: 'Virat Kohli', imageId: 'in', matches: 290, points: 22000, rating: 768 },
    { rank: 4, name: 'Harry Brook', imageId: 'gb-eng', matches: 30, points: 2250, rating: 753 },
    { rank: 5, name: 'Travis Head', imageId: 'au', matches: 60, points: 4400, rating: 742 },
  ],
  Bowlers: [
    { rank: 1, name: 'Jasprit Bumrah', imageId: 'in', matches: 80, points: 6800, rating: 855 },
    { rank: 2, name: 'Kagiso Rabada', imageId: 'za', matches: 90, points: 7500, rating: 834 },
    { rank: 3, name: 'Pat Cummins', imageId: 'au', matches: 85, points: 6900, rating: 812 },
    { rank: 4, name: 'Trent Boult', imageId: 'nz', matches: 105, points: 8300, rating: 799 },
    { rank: 5, name: 'Shaheen Afridi', imageId: 'pk', matches: 70, points: 5400, rating: 780 },
  ],
  'All-Rounders': [
    { rank: 1, name: 'Ravindra Jadeja', imageId: 'in', matches: 70, points: 3100, rating: 444 },
    { rank: 2, name: 'Ben Stokes', imageId: 'gb-eng', matches: 110, points: 3500, rating: 321 },
    { rank: 3, name: 'Shakib Al Hasan', imageId: 'bd', matches: 240, points: 7400, rating: 310 },
    { rank: 4, name: 'Hardik Pandya', imageId: 'in', matches: 85, points: 2380, rating: 280 },
    { rank: 5, name: 'Marcus Stoinis', imageId: 'au', matches: 65, points: 1600, rating: 255 },
  ]
};

export const CricketRankings = () => {
  const [activeFormat, setActiveFormat] = useState<Format>('Test');
  const [activeCategory, setActiveCategory] = useState<Category>('Teams');

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-5 flex flex-col gap-5 h-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Trophy size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">ICC Rankings</h2>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Global Standings</p>
        </div>
      </div>

      {/* Nested Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center p-1 bg-background/50 rounded-xl border border-border/50 self-start">
          {(['Test', 'ODI', 'T20I'] as Format[]).map((format) => (
            <button
              key={format}
              onClick={() => setActiveFormat(format)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-300",
                activeFormat === format
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {format}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none mask-edges-right">
          {(['Teams', 'Batters', 'Bowlers', 'All-Rounders'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all duration-300 whitespace-nowrap",
                activeCategory === cat
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Rankings Table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs text-left border-separate border-spacing-y-2">
          <thead className="text-[10px] text-muted-foreground uppercase tracking-widest sticky top-0 bg-card/80 backdrop-blur-sm z-10">
            <tr>
              <th className="py-2 px-2 font-semibold">Pos</th>
              <th className="py-2 px-2 font-semibold">Team/Player</th>
              <th className="py-2 px-2 font-semibold text-center">M</th>
              <th className="py-2 px-2 font-semibold text-center">PTS</th>
              <th className="py-2 px-2 font-semibold text-right">RTG</th>
            </tr>
          </thead>
          <tbody>
            {mockRankings[activeCategory].map((row) => (
              <tr key={row.name} className="group">
                <td className="py-2 px-2 rounded-l-xl bg-secondary/10 border-y border-l border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] bg-background/50 text-muted-foreground group-hover:text-primary transition-colors">
                    {row.rank}
                  </div>
                </td>
                <td className="py-2 px-2 bg-secondary/10 border-y border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30 transition-all duration-300 font-medium">
                  <div className="flex items-center gap-2 max-w-[120px]">
                    <TeamLogo logo={`https://flagcdn.com/${row.imageId}.svg`} name={row.name} size="sm" className="w-5 h-5 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                    <span className="text-foreground group-hover:text-primary transition-colors truncate">{row.name}</span>
                  </div>
                </td>
                <td className="py-2 px-2 bg-secondary/10 border-y border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30 transition-all duration-300 text-center text-muted-foreground">
                  {row.matches}
                </td>
                <td className="py-2 px-2 bg-secondary/10 border-y border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30 transition-all duration-300 text-center font-mono text-muted-foreground">
                  {row.points.toLocaleString()}
                </td>
                <td className="py-2 px-2 rounded-r-xl bg-secondary/10 border-y border-r border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30 transition-all duration-300 text-right">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
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
