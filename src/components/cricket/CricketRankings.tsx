import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';
import { useTeamRankings, type RankingFormat } from '@/hooks/useTeamRankings';
import { usePlayerRankings, type PlayerRankingCategory } from '@/hooks/usePlayerRankings';

type Format = 'Test' | 'ODI' | 'T20';
type Category = 'Teams' | 'Batters' | 'Bowlers' | 'All-Rounders';

const FORMAT_API_MAP: Record<Format, RankingFormat> = {
  Test: 'test',
  ODI: 'odi',
  T20: 't20',
};

const CATEGORY_API_MAP: Record<Exclude<Category, 'Teams'>, PlayerRankingCategory> = {
  Batters: 'batsmen',
  Bowlers: 'bowlers',
  'All-Rounders': 'allrounders',
};

// Medal styling for top 3
const MEDAL_STYLES: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', badge: '🥇' },
  2: { bg: 'bg-slate-400/10 border-slate-400/30', text: 'text-slate-300', badge: '🥈' },
  3: { bg: 'bg-orange-700/10 border-orange-700/30', text: 'text-orange-500', badge: '🥉' },
};

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'Up') return <TrendingUp size={11} className="text-green-400 inline" />;
  if (trend === 'Down') return <TrendingDown size={11} className="text-red-400 inline" />;
  return <Minus size={11} className="text-muted-foreground inline" />;
}

function PlayerFlag({
  flagCode,
  flagLocal,
  country,
}: {
  flagCode: string | null;
  flagLocal: string | null;
  country: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className="w-4 h-4 rounded-full bg-secondary/30 flex-shrink-0 inline-block" />
    );
  }

  if (flagLocal) {
    return (
      <img
        src={flagLocal}
        alt={country}
        onError={() => setError(true)}
        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  if (flagCode) {
    return (
      <img
        src={`https://flagcdn.com/w40/${flagCode}.png`}
        alt={country}
        onError={() => setError(true)}
        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return <span className="w-4 h-4 rounded-full bg-secondary/30 flex-shrink-0 inline-block" />;
}

function PlayerAvatar({ faceImageId, name }: { faceImageId: string | null; name: string }) {
  const [error, setError] = useState(false);

  if (!faceImageId || error) {
    // Silhouette fallback
    return (
      <div className="w-7 h-7 rounded-full bg-secondary/40 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/30">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted-foreground fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={`${API_BASE}/api/cricket/cb/player-image/${faceImageId}`}
      alt={name}
      onError={() => setError(true)}
      className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border/30"
    />
  );
}

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

  const { rankings: teamRankings, loading: teamLoading, fetchRankings: fetchTeamRankings } = useTeamRankings();
  const { rankings: playerRankings, loading: playerLoading, fetchRankings: fetchPlayerRankings } = usePlayerRankings();

  // Lazy-load based on active tab combination
  useEffect(() => {
    const format = FORMAT_API_MAP[activeFormat];
    if (activeCategory === 'Teams') {
      fetchTeamRankings(format);
    } else {
      const cat = CATEGORY_API_MAP[activeCategory as Exclude<Category, 'Teams'>];
      fetchPlayerRankings(cat, format);
    }
  }, [activeFormat, activeCategory, fetchTeamRankings, fetchPlayerRankings]);

  const isTeams = activeCategory === 'Teams';
  const loading = isTeams ? teamLoading : playerLoading;

  // Current data to render
  const teamsData = teamRankings?.data || [];
  const hasMatches = teamRankings?.hasMatches ?? true;
  const playersData = playerRankings?.data || [];
  const lastUpdatedOn = isTeams
    ? (teamRankings?.lastUpdatedOn || null)
    : (playerRankings?.lastUpdatedOn || null);
  const hasError = isTeams ? !!teamRankings?.error : !!playerRankings?.error;

  const handleRetry = () => {
    const format = FORMAT_API_MAP[activeFormat];
    if (isTeams) {
      fetchTeamRankings(format);
    } else {
      const cat = CATEGORY_API_MAP[activeCategory as Exclude<Category, 'Teams'>];
      fetchPlayerRankings(cat, format);
    }
  };

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
        {loading && <Loader2 size={16} className="text-muted-foreground animate-spin" />}
        {!loading && (isTeams ? !!teamRankings : !!playerRankings) && !hasError && (
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
      <div className="overflow-y-auto overflow-x-auto -mx-2 px-2 flex-1 max-h-[360px] scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Fetching {activeFormat} {activeCategory} rankings…</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <AlertCircle size={24} className="text-destructive/70" />
            <p className="text-xs text-muted-foreground">Could not load live rankings.</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : isTeams ? (
          /* ── TEAMS TABLE ── */
          <table className="w-full text-sm text-left border-separate border-spacing-y-2 relative">
            <thead className="text-xs text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <tr>
                <th className="py-3 px-3 font-semibold w-10">Pos</th>
                <th className="py-3 px-3 font-semibold">Team</th>
                {hasMatches && <th className="py-3 px-3 font-semibold text-center">M</th>}
                <th className="py-3 px-3 font-semibold text-center">PTS</th>
                <th className="py-3 px-3 font-semibold text-center">RTG</th>
              </tr>
            </thead>
            <tbody>
              {teamsData.map((row) => {
                const medal = MEDAL_STYLES[row.rank];
                return (
                  <tr key={row.name} className="group transition-all duration-300">
                    <td className={cn(
                      'py-3 px-3 rounded-l-xl border-y border-l transition-all duration-300',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs">
                        {medal ? (
                          <span className="text-base leading-none">{medal.badge}</span>
                        ) : (
                          <span className="bg-background/50 text-muted-foreground group-hover:text-primary transition-colors w-full h-full flex items-center justify-center rounded-full">
                            {row.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={cn(
                      'py-3 px-3 border-y transition-all duration-300 font-medium',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center gap-3">
                        <TeamLogo
                          logo={row.flagCode || ''}
                          name={row.name}
                          size="sm"
                          className="w-6 h-6 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                        />
                        <span className={cn('group-hover:text-primary transition-colors truncate', medal ? medal.text : 'text-foreground')}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {hasMatches && (
                      <td className={cn(
                        'py-3 px-3 border-y transition-all duration-300 text-center text-muted-foreground',
                        medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                      )}>
                        {row.matches ?? '—'}
                      </td>
                    )}
                    <td className={cn(
                      'py-3 px-3 border-y transition-all duration-300 text-center font-mono text-muted-foreground',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      {typeof row.points === 'number' ? row.points.toLocaleString() : row.points}
                    </td>
                    <td className={cn(
                      'py-3 px-3 rounded-r-xl border-y border-r transition-all duration-300 text-center',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <span className={cn(
                        'inline-flex items-center justify-center px-2 py-1 rounded-md font-bold',
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
        ) : (
          /* ── PLAYERS TABLE ── */
          <table className="w-full text-sm text-left border-separate border-spacing-y-2 relative">
            <thead className="text-xs text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <tr>
                <th className="py-3 px-3 font-semibold w-10">Pos</th>
                <th className="py-3 px-3 font-semibold">Player</th>
                <th className="py-3 px-3 font-semibold">Country</th>
                <th className="py-3 px-3 font-semibold text-center">RTG</th>
                <th className="py-3 px-3 font-semibold text-center">↕</th>
              </tr>
            </thead>
            <tbody>
              {playersData.map((row) => {
                const medal = MEDAL_STYLES[row.rank];
                return (
                  <tr key={`${row.id}_${row.rank}`} className="group transition-all duration-300">
                    {/* Rank */}
                    <td className={cn(
                      'py-2.5 px-3 rounded-l-xl border-y border-l transition-all duration-300',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs">
                        {medal ? (
                          <span className="text-base leading-none">{medal.badge}</span>
                        ) : (
                          <span className="bg-background/50 text-muted-foreground group-hover:text-primary transition-colors w-full h-full flex items-center justify-center rounded-full">
                            {row.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Player name + photo */}
                    <td className={cn(
                      'py-2.5 px-3 border-y transition-all duration-300 font-medium',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerAvatar faceImageId={row.faceImageId} name={row.name} className="w-6 h-6" />
                        <span className={cn(
                          'group-hover:text-primary transition-colors truncate max-w-[130px]',
                          medal ? medal.text : 'text-foreground'
                        )}>
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Country + flag */}
                    <td className={cn(
                      'py-2.5 px-3 border-y transition-all duration-300',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerFlag
                          flagCode={row.flagCode}
                          flagLocal={row.flagLocal}
                          country={row.country}
                          className="w-5 h-3.5"
                        />
                        <span className="text-muted-foreground truncate max-w-[80px] text-xs">
                          {row.country}
                        </span>
                      </div>
                    </td>



                    {/* Rating */}
                    <td className={cn(
                      'py-2.5 px-3 border-y transition-all duration-300 text-center',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <span className={cn(
                        'inline-flex items-center justify-center px-2 py-1 rounded-md font-bold',
                        medal ? `bg-background/40 ${medal.text}` : 'bg-primary/10 text-primary'
                      )}>
                        {row.rating}
                      </span>
                    </td>

                    {/* Trend */}
                    <td className={cn(
                      'py-1.5 px-2 rounded-r-xl border-y border-r transition-all duration-300 text-center',
                      medal ? `${medal.bg} group-hover:border-border/50` : 'bg-secondary/10 border-border/20 group-hover:border-border/50 group-hover:bg-secondary/30'
                    )}>
                      <TrendIcon trend={row.trend} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Last updated footer */}
      {!loading && lastUpdatedOn && (
        <p className="text-[10px] text-muted-foreground/60 text-center pt-1 border-t border-border/20">
          Last updated on {formatLastUpdated(lastUpdatedOn)}
        </p>
      )}
      {!loading && !lastUpdatedOn && (isTeams ? !!teamRankings : !!playerRankings) && !hasError && (
        <p className="text-[10px] text-muted-foreground/60 text-center pt-1 border-t border-border/20">
          Source: Cricbuzz / ICC · Refreshes every Wednesday at 6 PM
        </p>
      )}
    </div>
  );
};
