import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Star } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

type Format = 'Test' | 'ODI' | 'T20I';
type Category = 'Teams' | 'Batters' | 'Bowlers' | 'All-Rounders';

const mockRankings = {
  Teams: [
    { rank: 1, name: 'India', logo: 'https://flagcdn.com/in.svg', rating: 124 },
    { rank: 2, name: 'Australia', logo: 'https://flagcdn.com/au.svg', rating: 120 },
    { rank: 3, name: 'England', logo: 'https://flagcdn.com/gb-eng.svg', rating: 105 },
    { rank: 4, name: 'South Africa', logo: 'https://flagcdn.com/za.svg', rating: 103 },
    { rank: 5, name: 'New Zealand', logo: 'https://flagcdn.com/nz.svg', rating: 96 },
  ],
  Batters: [
    { rank: 1, name: 'Babar Azam', logo: 'https://flagcdn.com/pk.svg', rating: 824 },
    { rank: 2, name: 'Shubman Gill', logo: 'https://flagcdn.com/in.svg', rating: 801 },
    { rank: 3, name: 'Virat Kohli', logo: 'https://flagcdn.com/in.svg', rating: 768 },
    { rank: 4, name: 'Harry Brook', logo: 'https://flagcdn.com/gb-eng.svg', rating: 753 },
    { rank: 5, name: 'Travis Head', logo: 'https://flagcdn.com/au.svg', rating: 742 },
  ],
  Bowlers: [
    { rank: 1, name: 'Jasprit Bumrah', logo: 'https://flagcdn.com/in.svg', rating: 855 },
    { rank: 2, name: 'Kagiso Rabada', logo: 'https://flagcdn.com/za.svg', rating: 834 },
    { rank: 3, name: 'Pat Cummins', logo: 'https://flagcdn.com/au.svg', rating: 812 },
    { rank: 4, name: 'Trent Boult', logo: 'https://flagcdn.com/nz.svg', rating: 799 },
    { rank: 5, name: 'Shaheen Afridi', logo: 'https://flagcdn.com/pk.svg', rating: 780 },
  ],
  'All-Rounders': [
    { rank: 1, name: 'Ravindra Jadeja', logo: 'https://flagcdn.com/in.svg', rating: 444 },
    { rank: 2, name: 'Ben Stokes', logo: 'https://flagcdn.com/gb-eng.svg', rating: 321 },
    { rank: 3, name: 'Shakib Al Hasan', logo: 'https://flagcdn.com/bd.svg', rating: 310 },
    { rank: 4, name: 'Hardik Pandya', logo: 'https://flagcdn.com/in.svg', rating: 280 },
    { rank: 5, name: 'Marcus Stoinis', logo: 'https://flagcdn.com/au.svg', rating: 255 },
  ]
};

export const CricketRankings = () => {
  const [activeFormat, setActiveFormat] = useState<Format>('Test');
  const [activeCategory, setActiveCategory] = useState<Category>('Teams');

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col gap-6 h-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Trophy size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">ICC Rankings</h2>
          <p className="text-xs text-muted-foreground">Global Standings</p>
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
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300",
                activeFormat === format
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {format}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-edges-right">
          {(['Teams', 'Batters', 'Bowlers', 'All-Rounders'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border transition-all duration-300 whitespace-nowrap",
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

      {/* Rankings List (Vertical) */}
      <div className="flex flex-col gap-3">
        {mockRankings[activeCategory].map((row, index) => (
          <div key={row.name} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10 border border-border/20 hover:border-border/50 hover:bg-secondary/30 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full",
                row.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                row.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                row.rank === 3 ? "bg-amber-600/20 text-amber-500" :
                "bg-secondary/50 text-muted-foreground"
              )}>
                {row.rank}
              </span>
              <div className="flex items-center gap-2">
                <TeamLogo logo={row.logo} name={row.name} size="sm" className="w-6 h-6 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{row.name}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">{row.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
