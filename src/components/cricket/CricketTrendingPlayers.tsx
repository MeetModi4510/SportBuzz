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
      <div className={cn(cls, 'rounded-full bg-secondary flex items-center justify-center border-2 border-border flex-shrink-0 overflow-hidden')}>
        <UserIcon className="text-muted-foreground" size={28} />
      </div>
    );
  }

  return (
    <img
      src={`https://static.cricbuzz.com/a/img/v1/192x192/i1/c${faceImageId}/i.jpg`}
      alt={name}
      onError={() => setErr(true)}
      className={cn(cls, 'rounded-full object-cover border-2 border-border flex-shrink-0 bg-secondary')}
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
          <div className="p-6 space-y-8">
            
            {/* Sleek Stats Grid Area */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm">
              <div className="p-4 border-b border-border/30 bg-secondary/20">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-primary" /> Technical Profile
                </h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-border/30">
                
                {info.battingStyle && (
                  <div className="p-5 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Batting Style</span>
                    <span className="text-lg font-bold text-foreground">{info.battingStyle}</span>
                  </div>
                )}
                
                {info.bowlingStyle && (
                  <div className="p-5 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Bowling Style</span>
                    <span className="text-lg font-bold text-foreground">{info.bowlingStyle}</span>
                  </div>
                )}

                {(info?.rankings?.test || info?.rankings?.odi || info?.rankings?.t20) && (
                  <div className="col-span-2 p-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                      <Trophy size={12} className="text-amber-400" /> ICC Rankings
                    </span>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {(['test', 'odi', 't20'] as const).map((fmt) => {
                        const rank = info?.rankings?.[fmt];
                        return (
                          <div key={fmt} className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">{fmt}</span>
                            {rank ? (
                              <span className="text-2xl font-black text-primary">#{rank}</span>
                            ) : (
                              <span className="text-xl font-bold text-muted-foreground/30">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Form Stats */}
            {(info.recentBatting?.rows?.length > 0 || info.recentBowling?.rows?.length > 0) && (
              <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm">
                <div className="p-4 border-b border-border/30 bg-secondary/20">
                  <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Recent Form
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto scrollbar-thin">
                  {info.recentBatting?.rows?.length > 0 && (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-secondary/10 border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-black pl-6">Batting</th>
                          {info.recentBatting.headers.map((h: string, i: number) => <th key={i} className="px-4 py-2 font-black">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {info.recentBatting.rows.slice(0, 3).map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-4 py-3 font-semibold text-muted-foreground/40 text-xs pl-6">Match {i+1}</td>
                            {row.values.slice(1).map((v: string, j: number) => <td key={j} className={cn("px-4 py-3", j===0 ? "font-bold text-foreground" : "text-muted-foreground")}>{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {info.recentBowling?.rows?.length > 0 && (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className={cn("bg-secondary/10 border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground", info.recentBatting?.rows?.length > 0 ? "border-t border-border/50" : "")}>
                        <tr>
                          <th className="px-4 py-2 font-black pl-6">Bowling</th>
                          {info.recentBowling.headers.map((h: string, i: number) => <th key={i} className="px-4 py-2 font-black">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {info.recentBowling.rows.slice(0, 3).map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-4 py-3 font-semibold text-muted-foreground/40 text-xs pl-6">Match {i+1}</td>
                            {row.values.slice(1).map((v: string, j: number) => <td key={j} className={cn("px-4 py-3", j===0 ? "font-bold text-foreground" : "text-muted-foreground")}>{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {info.teams && info.teams.length > 0 && (() => {
              // Normalize: server may return string (old cache) or array of {id,name} objects (new)
              const teamsArr: { id: string | null; name: string }[] = Array.isArray(info.teams)
                ? info.teams.map((t: any) =>
                    typeof t === 'string' ? { id: null, name: t.trim() } : { id: t.id ?? null, name: t.name ?? String(t) }
                  )
                : String(info.teams).split(',').map((t: string) => ({ id: null, name: t.trim() }));
              return (
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={14} className="text-blue-400" /> Professional Teams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teamsArr.map((team, i) => {
                    const tName = team.name;
                    const tId = team.id;
                    if (!tName) return null;
                    return (
                      <span
                        key={i}
                        className="px-4 py-2 text-xs font-bold bg-secondary/30 border border-border/40 rounded-xl text-foreground hover:bg-secondary/50 transition-colors cursor-default"
                      >
                        {tName}
                      </span>
                    );
                  })}
                </div>
              </div>
              );
            })()}

            {info.bio && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <UserIcon size={14} className="text-primary" /> Biography
                </h3>
                <div className="p-6 rounded-2xl bg-secondary/10 border border-border/30">
                  <div className="text-sm text-muted-foreground leading-relaxed text-justify space-y-4">
                    {info.bio.split(/<br\s*\/?>/ig).map((paragraph: string, i: number) => {
                      const cleanText = paragraph.replace(/&nbsp;/g, ' ').trim();
                      return cleanText ? <p key={i}>{cleanText}</p> : null;
                    })}
                  </div>
                </div>
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
  const flagSrc = player.flagLocal || (player.flagCode ? `https://flagcdn.com/w320/${player.flagCode}.png` : undefined);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border h-full flex flex-col",
        "cursor-pointer transition-all duration-300 card-hover"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="relative h-28 bg-slate-900 overflow-hidden">
        {/* Flag Background */}
        {flagSrc && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-150 transition-transform duration-700 group-hover:scale-[1.7]"
            style={{ backgroundImage: `url(${flagSrc})` }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent/10" />
      </div>

      {/* Profile Image Container (Overlapping) */}
      <div className="relative -mt-10 flex justify-center z-10">
        <div className="rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md group-hover:-translate-y-1 transition-transform duration-300">
          <PlayerAvatar faceImageId={player.faceImageId} name={player.name} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-3 space-y-3 flex-1 flex flex-col text-center">
        <div>
          <h3 className="font-semibold text-foreground text-lg truncate" title={player.name}>{player.name}</h3>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <PlayerFlag flagCode={player.flagCode} flagLocal={player.flagLocal} country={player.teamName} size="sm" />
            <p className="text-sm text-muted-foreground truncate">{player.teamName}</p>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
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
