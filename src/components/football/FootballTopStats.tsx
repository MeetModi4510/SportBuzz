import { useState } from "react";
import { Loader2, AlertTriangle, ChevronDown, BarChart3, Trophy, Users, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useTopStats,
  PLAYER_STAT_LABELS,
  TEAM_STAT_LABELS,
  TOPSTATS_LEAGUES,
  playerPhotoUrl,
  teamBadgeUrl,
  PlayerStat,
  TeamStat,
} from "../../hooks/football/useTopStats";

// ── Small helpers ──────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/30">
        <Trophy size={13} className="text-amber-400" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-[11px] font-black text-slate-300">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-[11px] font-black text-amber-700/90">
        3
      </span>
    );
  return (
    <span className="w-7 h-7 flex items-center justify-center text-[11px] font-semibold text-white/30">
      {rank}
    </span>
  );
}

function PlayerAvatar({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [err, setErr] = useState(false);
  const src = playerPhotoUrl(imageUrl);
  if (!src || err) {
    return (
      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-black text-white/50">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      loading="lazy"
      className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-white/5 border border-white/10"
    />
  );
}

function TeamBadge({ img, name }: { img: string; name: string }) {
  const [err, setErr] = useState(false);
  const src = teamBadgeUrl(img);
  if (!src || err) {
    return (
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[8px] font-black text-white/50">{name.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      loading="lazy"
      className="w-6 h-6 rounded-full object-contain flex-shrink-0 bg-white/5"
    />
  );
}

// ── Player rows table ──────────────────────────────────────────────────────────
function PlayerStatTable({ rows }: { rows: PlayerStat[] }) {
  if (!rows.length)
    return <p className="text-center text-white/30 text-sm py-8">No data available.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-black text-white/25 uppercase tracking-widest border-b border-white/5">
            <th className="pl-4 pr-2 py-3 text-left w-10">#</th>
            <th className="px-3 py-3 text-left min-w-[160px]">Player</th>
            <th className="px-3 py-3 text-left hidden sm:table-cell">Club</th>
            <th className="pr-4 pl-3 py-3 text-center font-black text-white/50">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rows.map((p) => (
            <tr
              key={p._id}
              className={cn(
                "transition-colors group",
                p.rank === 1
                  ? "bg-gradient-to-r from-amber-500/10 to-transparent"
                  : "hover:bg-white/5"
              )}
            >
              {/* Rank */}
              <td className="pl-4 pr-2 py-3">
                <RankBadge rank={p.rank} />
              </td>

              {/* Player */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar imageUrl={p.playerId} name={p.playerName} />
                  <div>
                    <p className={cn("font-semibold leading-tight whitespace-nowrap", p.rank === 1 ? "text-amber-400" : "text-white/90")}>
                      {p.playerName}
                    </p>
                    <p className="text-[10px] text-white/30 sm:hidden">{p.teamName}</p>
                  </div>
                </div>
              </td>

              {/* Club */}
              <td className="px-3 py-3 hidden sm:table-cell">
                <div className="flex items-center gap-2">
                  <TeamBadge img={p.teamBadgeUrl} name={p.teamName} />
                  <span className="text-xs text-white/50">{p.teamName}</span>
                </div>
              </td>

              {/* Stat Value */}
              <td className="pr-4 pl-3 py-3 text-center">
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[2.25rem] h-7 rounded-lg font-black text-sm tabular-nums",
                  p.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  p.rank === 2 ? "bg-white/8 text-slate-300" :
                  p.rank === 3 ? "bg-white/8 text-amber-700/90" :
                  "bg-white/5 text-white/70"
                )}>
                  {p.statValue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Team rows table ────────────────────────────────────────────────────────────
function TeamStatTable({ rows }: { rows: TeamStat[] }) {
  if (!rows.length)
    return <p className="text-center text-white/30 text-sm py-8">No data available.</p>;

  const hasPrGm = rows.some(r => r.statPerGame);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-black text-white/25 uppercase tracking-widest border-b border-white/5">
            <th className="pl-4 pr-2 py-3 text-left w-10">#</th>
            <th className="px-3 py-3 text-left min-w-[160px]">Club</th>
            {hasPrGm && <th className="px-3 py-3 text-center hidden sm:table-cell text-white/30">Per Game</th>}
            <th className="pr-4 pl-3 py-3 text-center font-black text-white/50">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rows.map((t) => (
            <tr
              key={t._id}
              className={cn(
                "transition-colors group",
                t.rank === 1
                  ? "bg-gradient-to-r from-amber-500/10 to-transparent"
                  : "hover:bg-white/5"
              )}
            >
              <td className="pl-4 pr-2 py-3">
                <RankBadge rank={t.rank} />
              </td>

              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <TeamBadge img={t.teamBadgeUrl} name={t.teamName} />
                  <span className={cn("font-semibold leading-tight whitespace-nowrap", t.rank === 1 ? "text-amber-400" : "text-white/90")}>
                    {t.teamName}
                  </span>
                </div>
              </td>

              {hasPrGm && (
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs text-white/40 tabular-nums">{t.statPerGame}</span>
                </td>
              )}

              <td className="pr-4 pl-3 py-3 text-center">
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[2.25rem] h-7 rounded-lg font-black text-sm tabular-nums",
                  t.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  t.rank === 2 ? "bg-white/8 text-slate-300" :
                  t.rank === 3 ? "bg-white/8 text-amber-700/90" :
                  "bg-white/5 text-white/70"
                )}>
                  {t.statValue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function FootballTopStats() {
  const [leagueId, setLeagueId]   = useState(65);
  const [view, setView]           = useState<"players" | "teams">("players");
  const [playerTyp, setPlayerTyp] = useState(1);
  const [teamTyp, setTeamTyp]     = useState(10);

  const { data, isLoading, isError } = useTopStats(leagueId);

  const selectedLeague = TOPSTATS_LEAGUES.find((l) => l.id === leagueId) || TOPSTATS_LEAGUES[0];

  // Filter rows to current tab + type
  const playerRows = (data?.players || []).filter((p) => p.statTyp === playerTyp);
  const teamRows   = (data?.teams   || []).filter((t) => t.statTyp === teamTyp);

  const playerTypes = Object.entries(PLAYER_STAT_LABELS);
  const teamTypes   = Object.entries(TEAM_STAT_LABELS);

  return (
    <section className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight text-white/90">Top Stats</h2>
          </div>
          {data?.lastFetched && (
            <p className="text-[10px] text-white/30 mt-1 ml-9">
              Last updated on{" "}
              {new Date(data.lastFetched).toLocaleDateString("en-US", {
                month: "short",
                day:   "numeric",
                hour:  "2-digit",
                minute:"2-digit",
              })}
            </p>
          )}
        </div>

        {/* League Dropdown — same design as FootballStandings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all shadow-sm">
              <img src={selectedLeague.flag} alt="" className="w-5 h-3.5 rounded-[2px] object-cover shadow-sm" />
              <span className="text-sm font-medium text-white/90">{selectedLeague.name}</span>
              <ChevronDown size={16} className="text-white/50 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 min-w-[180px] p-1.5 rounded-xl shadow-2xl">
            {TOPSTATS_LEAGUES.map((l) => (
              <DropdownMenuItem
                key={l.id}
                onClick={() => setLeagueId(l.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2 transition-colors",
                  leagueId === l.id ? "bg-white/10 text-white" : "text-white/70 focus:bg-white/5 focus:text-white"
                )}
              >
                <img src={l.flag} alt={l.name} className="w-5 h-3.5 rounded-[2px] object-cover shadow-sm" />
                <span className="text-sm font-medium">{l.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-white/30" />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="flex items-center justify-center gap-3 py-12 text-white/40">
          <AlertTriangle size={18} />
          <span className="text-sm">Could not load top stats. Please try again later.</span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {data && !isLoading && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          {/* ── Player / Team toggle ─ */}
          <div className="flex items-center gap-1 p-3 border-b border-white/5">
            <button
              onClick={() => setView("players")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                view === "players"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Users size={14} />
              Players
            </button>
            <button
              onClick={() => setView("teams")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                view === "teams"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Shield size={14} />
              Teams
            </button>
          </div>

          {/* ── Category chips ─────── */}
          <div className="flex overflow-x-auto gap-2 px-3 py-3 border-b border-white/5 hide-scrollbar">
            {view === "players"
              ? playerTypes.map(([typ, label]) => {
                  const t = Number(typ);
                  return (
                    <button
                      key={t}
                      onClick={() => setPlayerTyp(t)}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                        playerTyp === t
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "border-white/8 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  );
                })
              : teamTypes.map(([typ, label]) => {
                  const t = Number(typ);
                  return (
                    <button
                      key={t}
                      onClick={() => setTeamTyp(t)}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                        teamTyp === t
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "border-white/8 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
          </div>

          {/* ── Table ──────────────── */}
          {view === "players" ? (
            <PlayerStatTable rows={playerRows} />
          ) : (
            <TeamStatTable rows={teamRows} />
          )}

          {/* ── Footer ─────────────── */}
          <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] text-white/20">
              {data.stale ? "⚠ Showing cached data" : data.fromCache ? "Served from cache" : "Live data"}
            </p>
            <span className="text-[10px] text-white/20 font-semibold">{selectedLeague.name} · Top Stats</span>
          </div>
        </div>
      )}
    </section>
  );
}
