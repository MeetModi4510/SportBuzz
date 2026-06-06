import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';
import { useTeamRankings, type RankingFormat } from '@/hooks/useTeamRankings';

type Format = 'Test' | 'ODI' | 'T20';
type Category = 'Teams' | 'Batters' | 'Bowlers' | 'All-Rounders';

const FORMAT_API_MAP: Record<Format, RankingFormat> = {
  Test: 'test',
  ODI: 'odi',
  T20: 't20',
};

// Mock data for non-live categories (Batters, Bowlers, All-Rounders)
const mockPlayerRankings = {
  Batters: [
    { rank: 1, name: 'Babar Azam', flagCode: 'pk', matches: 100, points: 8240, rating: 824 },
    { rank: 2, name: 'Shubman Gill', flagCode: 'in', matches: 45, points: 3600, rating: 801 },
    { rank: 3, name: 'Virat Kohli', flagCode: 'in', matches: 290, points: 22000, rating: 768 },
    { rank: 4, name: 'Harry Brook', flagCode: 'gb-eng', matches: 30, points: 2250, rating: 753 },
    { rank: 5, name: 'Travis Head', flagCode: 'au', matches: 60, points: 4400, rating: 742 },
  ],
  Bowlers: [
    { rank: 1, name: 'Jasprit Bumrah', flagCode: 'in', matches: 80, points: 6800, rating: 855 },
    { rank: 2, name: 'Kagiso Rabada', flagCode: 'za', matches: 90, points: 7500, rating: 834 },
    { rank: 3, name: 'Pat Cummins', flagCode: 'au', matches: 85, points: 6900, rating: 812 },
    { rank: 4, name: 'Trent Boult', flagCode: 'nz', matches: 105, points: 8300, rating: 799 },
    { rank: 5, name: 'Shaheen Afridi', flagCode: 'pk', matches: 70, points: 5400, rating: 780 },
  ],
  'All-Rounders': [
    { rank: 1, name: 'Ravindra Jadeja', flagCode: 'in', matches: 70, points: 3100, rating: 444 },
    { rank: 2, name: 'Ben Stokes', flagCode: 'gb-eng', matches: 110, points: 3500, rating: 321 },
    { rank: 3, name: 'Shakib Al Hasan', flagCode: 'bd', matches: 240, points: 7400, rating: 310 },
    { rank: 4, name: 'Hardik Pandya', flagCode: 'in', matches: 85, points: 2380, rating: 280 },
    { rank: 5, name: 'Marcus Stoinis', flagCode: 'au', matches: 65, points: 1600, rating: 255 },
  ],
};

// Medal styling for top 3
const MEDAL_STYLES: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', badge: '🥇' },
  2: { bg: 'bg-slate-400/10 border-slate-400/30', text: 'text-slate-300', badge: '🥈' },
  3: { bg: 'bg-orange-700/10 border-orange-700/30', text: 'text-orange-500', badge: '🥉' },
};

function formatLastUpdated(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const CricketRankings = () => {
  const [activeFormat, setActiveFormat] = useState<Format>('Test');
  const [activeCategory, setActiveCategory] = useState<Category>('Teams');
  const { rankings, loading, fetchRankings } = useTeamRankings();

  // Fetch teams rankings when format tab changes (lazy: only if Teams category is active)
  useEffect(() => {
    if (activeCategory === 'Teams') {
      fetchRankings(FORMAT_API_MAP[activeFormat]);
    }
  }, [activeFormat, activeCategory, fetchRankings]);

  const isTeams = activeCategory === 'Teams';
  const teamsData = rankings?.data || [];
  const hasMatches = rankings?.hasMatches ?? true;
  const lastUpdatedOn = rankings?.lastUpdatedOn || null;

  // Use live data for Teams, mock for rest
  const displayData = isTeams
    ? teamsData.map(t => ({ ...t, flagCode: t.flagCode }))
    : mockPlayerRankings[activeCategory as keyof typeof mockPlayerRankings];

  const showMatchesCol = isTeams ? hasMatches : true;

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 p-5 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">ICC Rankings</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Global Standings
            </p>
          </div>
        </div>
        {isTeams && loading && (
          <Loader2 size={16} className="text-muted-foreground animate-spin" />
        )}
        {isTeams && !loading && rankings && (
          <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
            LIVE
          </span>
        )}
      </div>

      {/* Format Tabs: Test / ODI / T20 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center p-1 bg-background/50 rounded-xl border border-border/50 self-start">
          {(['Test', 'ODI', 'T20'] as Format[]).map((format) => (
            <button
              key={format}
              onClick={() => setActiveFormat(format)}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-300',
                activeFormat === format
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {format}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['Teams', 'Batters', 'Bowlers', 'All-Rounders'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all duration-300 whitespace-nowrap',
                activeCategory === cat
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="overflow-y-auto overflow-x-auto -mx-2 px-2 flex-1 max-h-[250px] scrollbar-thin">
        {isTeams && loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Fetching {activeFormat} rankings…</p>
          </div>
        ) : isTeams && rankings?.error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <AlertCircle size={24} className="text-destructive/70" />
            <p className="text-xs text-muted-foreground">Could not load live rankings.</p>
            <button
              onClick={() => fetchRankings(FORMAT_API_MAP[activeFormat])}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-separate border-spacing-y-1.5 relative">
            <thead className="text-[10px] text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <tr>
                <th className="py-2 px-2 font-semibold w-8">Pos</th>
                <th className="py-2 px-2 font-semibold">
                  {isTeams ? 'Team' : 'Player'}
                </th>
                {showMatchesCol && (
                  <th className="py-2 px-2 font-semibold text-center">M</th>
                )}
                <th className="py-2 px-2 font-semibold text-center">Pts</th>
                <th className="py-2 px-2 font-semibold text-center">Rtg</th>
              </tr>
            </thead>
            <tbody>
              {(displayData as any[]).map((row) => {
                const medal = MEDAL_STYLES[row.rank];
                return (
                  <tr
                    key={row.name}
                    className={cn(
                      'group transition-all duration-300',
                      medal ? '' : ''
                    )}
                  >
                    {/* Rank */}
                    <td className={cn(
                      'py-2 px-2 rounded-l-xl border-y border-l transition-all duration-300',
                      medal
                        ? `${medal.bg} group-hover:border-border/50`
                        : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px]">
                        {medal ? (
                          <span className="text-sm leading-none">{medal.badge}</span>
                        ) : (
                          <span className="bg-background/50 text-muted-foreground group-hover:text-primary transition-colors w-full h-full flex items-center justify-center rounded-full">
                            {row.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team/Player */}
                    <td className={cn(
                      'py-2 px-2 border-y transition-all duration-300 font-medium',
                      medal
                        ? `${medal.bg} group-hover:border-border/50`
                        : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center gap-2 max-w-[130px]">
                        <TeamLogo
                          logo={row.flagCode || ''}
                          name={row.name}
                          size="sm"
                          className="w-5 h-5 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                        />
                        <span className={cn(
                          'group-hover:text-primary transition-colors truncate',
                          medal ? medal.text : 'text-foreground'
                        )}>
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Matches */}
                    {showMatchesCol && (
                      <td className={cn(
                        'py-2 px-2 border-y transition-all duration-300 text-center text-muted-foreground',
                        medal
                          ? `${medal.bg} group-hover:border-border/50`
                          : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                      )}>
                        {row.matches ?? '—'}
                      </td>
                    )}

                    {/* Points */}
                    <td className={cn(
                      'py-2 px-2 border-y transition-all duration-300 text-center font-mono text-muted-foreground',
                      medal
                        ? `${medal.bg} group-hover:border-border/50`
                        : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      {typeof row.points === 'number' ? row.points.toLocaleString() : row.points}
                    </td>

                    {/* Rating */}
                    <td className={cn(
                      'py-2 px-2 rounded-r-xl border-y border-r transition-all duration-300 text-center',
                      medal
                        ? `${medal.bg} group-hover:border-border/50`
                        : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <span className={cn(
                        'inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold',
                        medal ? `bg-background/40 ${medal.text}` : 'bg-primary/10 text-primary'
                      )}>
                        {row.rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Last updated footer */}
      {isTeams && !loading && lastUpdatedOn && (
        <p className="text-[10px] text-muted-foreground/60 text-center pt-1 border-t border-border/20">
          Last updated on {formatLastUpdated(lastUpdatedOn)}
        </p>
      )}
      {isTeams && !loading && !lastUpdatedOn && rankings && !rankings.error && (
        <p className="text-[10px] text-muted-foreground/60 text-center pt-1 border-t border-border/20">
          Source: Cricbuzz / ICC · Refreshes every Wednesday
        </p>
      )}
    </div>
  );
};
