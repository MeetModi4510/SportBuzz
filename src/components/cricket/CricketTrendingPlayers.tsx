import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp, X, Loader2, AlertCircle, User as UserIcon,
  Globe, Shield, Trophy, Calendar, Zap, Star
} from 'lucide-react';
import {
  useCricketTrendingPlayers,
  useCricbuzzPlayerInfo,
  type TrendingPlayerEntry,
  type CricbuzzPlayerInfo,
} from '@/hooks/useCricketTrending';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

// Medal styling for top 3
const MEDAL = {
  1: { bg: 'from-amber-500/20 to-amber-600/5 border-amber-500/40', badge: '🥇', glow: 'shadow-amber-500/20' },
  2: { bg: 'from-slate-400/20 to-slate-500/5 border-slate-400/30', badge: '🥈', glow: 'shadow-slate-400/10' },
  3: { bg: 'from-orange-700/20 to-orange-800/5 border-orange-700/30', badge: '🥉', glow: 'shadow-orange-700/10' },
};

function PlayerFlag({
  flagCode, flagLocal, country, size = 'sm',
}: {
  flagCode: string | null;
  flagLocal: string | null;
  country: string;
  size?: 'sm' | 'md';
}) {
  const [err, setErr] = useState(false);
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  if (err) return <span className={cn(cls, 'rounded-full bg-secondary/30 inline-block flex-shrink-0')} />;
  if (flagLocal) return <img src={flagLocal} alt={country} onError={() => setErr(true)} className={cn(cls, 'rounded-full object-cover flex-shrink-0')} />;
  if (flagCode) return <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={country} onError={() => setErr(true)} className={cn(cls, 'rounded-full object-cover flex-shrink-0')} />;
  return <span className={cn(cls, 'rounded-full bg-secondary/30 inline-block flex-shrink-0')} />;
}

function PlayerAvatar({
  faceImageId, name, size = 'sm',
}: {
  faceImageId: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [err, setErr] = useState(false);
  const cls = size === 'sm' ? 'w-16 h-16' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32';

  if (!faceImageId || err) {
    return (
      <div className={cn(cls, 'rounded-2xl bg-secondary/30 flex items-center justify-center border border-border/30 flex-shrink-0')}>
        <UserIcon className="text-muted-foreground w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={`https://static.cricbuzz.com/a/img/v1/192x192/i1/c${faceImageId}/i.jpg`}
      alt={name}
      onError={() => setErr(true)}
      className={cn(cls, 'rounded-2xl object-cover border border-border/30 flex-shrink-0')}
    />
  );
}

// ─── Player Profile Modal ─────────────────────────────────────────────────────
export function PlayerProfileModal({
  player,
  info,
  loadingInfo,
  onClose,
}: {
  player: TrendingPlayerEntry;
  info: any;
  loadingInfo: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border/50 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all"
        >
          <X size={16} />
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/30 p-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <PlayerAvatar faceImageId={info?.faceImageId || player.faceImageId} name={player.name} size="lg" />

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                  Cricket · Trending
                </span>
                {info?.role && (
                  <span className="px-3 py-1 bg-secondary/30 text-foreground text-[10px] font-black uppercase tracking-widest rounded-full border border-border/30">
                    {info.role}
                  </span>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
                {info?.name || player.name}
              </h2>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm">
                {(info?.country || player.teamName) && (
                  <div className="flex items-center gap-2">
                    <PlayerFlag
                      flagCode={info?.flagCode ?? player.flagCode}
                      flagLocal={info?.flagLocal ?? player.flagLocal}
                      country={info?.country || player.teamName}
                      size="md"
                    />
                    <span className="font-semibold text-foreground">{info?.country || player.teamName}</span>
                  </div>
                )}
                {info?.dateOfBirth && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Calendar size={11} />
                    <span>{info.dateOfBirth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loadingInfo && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading player profile…</p>
          </div>
        )}

        {!loadingInfo && info && (
          <div className="p-6 space-y-6">
            {(info.battingStyle || info.bowlingStyle) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {info.battingStyle && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/10 border border-border/30">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Batting Style</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{info.battingStyle}</p>
                    </div>
                  </div>
                )}
                {info.bowlingStyle && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/10 border border-border/30">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0">
                      <Shield size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Bowling Style</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{info.bowlingStyle}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(info?.rankings?.test || info?.rankings?.odi || info?.rankings?.t20) && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Trophy size={12} className="text-amber-400" /> ICC Rankings
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['test', 'odi', 't20'] as const).map((fmt) => {
                    const rank = info?.rankings?.[fmt];
                    return (
                      <div
                        key={fmt}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-2xl border',
                          rank ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/20 opacity-50'
                        )}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {fmt.toUpperCase()}
                        </span>
                        {rank ? (
                          <span className="text-xl font-black text-primary">#{rank}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {info.teams && info.teams.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={12} className="text-blue-400" /> Teams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {info.teams.map((team, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-[11px] font-semibold bg-secondary/20 border border-border/30 rounded-full text-foreground"
                    >
                      {typeof team === 'string' ? team : (team as any).name || String(team)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {info.bio && (
              <div className="p-4 rounded-2xl bg-secondary/10 border border-border/30">
                <p className="text-xs text-muted-foreground leading-relaxed">{info.bio}</p>
              </div>
            )}
          </div>
        )}

        {!loadingInfo && !info && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <AlertCircle size={24} className="text-destructive/70" />
            <p className="text-sm text-muted-foreground">Could not load player profile.</p>
            <p className="text-xs text-muted-foreground/60">API quota may be exhausted. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────
export function TrendingCard({
  player,
  index,
  onClick,
}: {
  player: TrendingPlayerEntry;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative w-full h-full flex flex-col text-left overflow-hidden rounded-2xl transition-all duration-500 ease-out',
        'bg-card/40 border border-border/30 backdrop-blur-sm',
        'hover:bg-card/80 hover:border-primary/30 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Subtle Rank Indicator */}
      <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary/60 transition-colors z-10">
        #{player.rank}
      </span>

      {/* Avatar Container */}
      <div className="relative pt-8 px-4 pb-3 flex justify-center items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:-translate-y-1">
          <PlayerAvatar faceImageId={player.faceImageId} name={player.name} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-5 text-center space-y-1.5 flex-1 flex flex-col justify-end relative z-10">
        <p className="text-[13px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {player.name}
        </p>
        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
          <PlayerFlag flagCode={player.flagCode} flagLocal={player.flagLocal} country={player.teamName} size="sm" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] truncate max-w-[80px]">
            {player.teamName}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CricketTrendingPlayers({ className }: { className?: string }) {
  const { trending, loading, fetchTrending } = useCricketTrendingPlayers();
  const { playerInfo, loading: loadingInfo, fetchPlayerInfo, clearPlayerInfo } = useCricbuzzPlayerInfo();

  const [selectedPlayer, setSelectedPlayer] = useState<TrendingPlayerEntry | null>(null);

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchTrending();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [fetchTrending]);

  const handlePlayerClick = (player: TrendingPlayerEntry) => {
    setSelectedPlayer(player);
    fetchPlayerInfo(player.id);
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
    clearPlayerInfo();
  };

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section ref={observerRef} className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <TrendingUp className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Trending Players</h2>
          <p className="text-sm text-muted-foreground">Top performers of the moment</p>
        </div>
        {trending?.data?.length ? (
          <span className="ml-auto text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            LIVE
          </span>
        ) : null}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading trending players…</p>
        </div>
      )}

      {/* Error */}
      {!loading && trending?.error && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <AlertCircle size={22} className="text-destructive/70" />
          <p className="text-sm text-muted-foreground">Could not load trending players.</p>
          <p className="text-xs text-muted-foreground/60">API quota may be exhausted. Try again later.</p>
        </div>
      )}

      {/* Player grid */}
      {!loading && trending?.data && trending.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.data.slice(0, 6).map((player, i) => (
            <TrendingCard
              key={player.id}
              player={player}
              index={i}
              onClick={() => handlePlayerClick(player)}
            />
          ))}
        </div>
      )}

      {/* Last updated */}
      {!loading && trending?.lastUpdatedOn && !trending.error && (
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Last updated on {formatLastUpdated(trending.lastUpdatedOn)}
        </p>
      )}

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          info={playerInfo?.data}
          loadingInfo={loadingInfo}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
}
