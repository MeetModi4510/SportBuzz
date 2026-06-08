import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const API_BASE = import.meta.env.PROD
  ? "https://sportbuzz-backend.onrender.com"
  : "http://localhost:5000";

interface StandingRow {
  _id: string;
  teamId: string;
  teamName: string;
  shortName: string;
  logoUrl: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  qualColor: string | null;
  lastFetched: string;
}

interface StandingsResponse {
  success: boolean;
  fromCache: boolean;
  stale?: boolean;
  lastFetched: string | null;
  data: StandingRow[];
}

const LEAGUES = [
  { id: 47, name: "Premier League" },
  { id: 87, name: "La Liga" },
  { id: 54, name: "Bundesliga" },
  { id: 55, name: "Serie A" },
  { id: 53, name: "Ligue 1" },
];

async function fetchStandings(leagueId: number): Promise<StandingsResponse> {
  const res = await fetch(`${API_BASE}/api/football/standings?leagueId=${leagueId}`);
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}

/** Maps the raw qualColor string to a Tailwind colour set */
function getQualStyle(qualColor: string | null): {
  bar: string;
  row: string;
  badge: string;
  label: string;
} {
  if (!qualColor) return { bar: "bg-transparent", row: "", badge: "bg-white/5 text-white/30", label: "" };

  const q = qualColor.toLowerCase();
  if (q.includes("champions") || q.includes("ucl"))
    return { bar: "bg-emerald-500", row: "bg-emerald-500/5 hover:bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Champions League" };
  if (q.includes("europa") || q.includes("uel") || q.includes("conference"))
    return { bar: "bg-orange-400", row: "bg-orange-400/5 hover:bg-orange-400/10", badge: "bg-orange-400/20 text-orange-300 border-orange-400/30", label: "Europa League" };
  if (q.includes("relegat"))
    return { bar: "bg-rose-500", row: "bg-rose-500/5 hover:bg-rose-500/10", badge: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "Relegation" };

  return { bar: "bg-transparent", row: "hover:bg-white/5", badge: "", label: "" };
}

function TeamLogo({ src, name }: { src: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[9px] font-black text-white/50 leading-none">
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
      className="w-6 h-6 rounded-full object-contain flex-shrink-0 bg-white/5"
    />
  );
}

export function FootballStandings() {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(47);

  const { data, isLoading, isError, isFetching } = useQuery<StandingsResponse>({
    queryKey: ["football", "standings", selectedLeagueId],
    queryFn: () => fetchStandings(selectedLeagueId),
    staleTime: 30 * 60 * 1000,   // consider fresh for 30 min in the client
    gcTime: 60 * 60 * 1000,      // keep in memory for 1 hour
    retry: 1,
  });

  const selectedLeagueName = LEAGUES.find(l => l.id === selectedLeagueId)?.name || "League";

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-amber-400" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white/90">{selectedLeagueName} Standings</h2>
          </div>
        </div>

        {/* League Selector */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl overflow-x-auto hide-scrollbar">
          {LEAGUES.map(league => (
            <button
              key={league.id}
              onClick={() => setSelectedLeagueId(league.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                selectedLeagueId === league.id 
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              {league.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-white/30" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex items-center justify-center gap-3 py-12 text-white/40">
          <AlertTriangle size={18} />
          <span className="text-sm">Could not load standings. Please try again later.</span>
        </div>
      )}

      {/* Table */}
      {data?.data && data.data.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm overflow-hidden">

          {/* Legend */}
          <div className="flex items-center gap-5 px-5 py-3 border-b border-white/5 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Champions League</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Europa / Conference</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Relegation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Column Headers */}
              <thead>
                <tr className="text-[10px] font-black text-white/25 uppercase tracking-widest border-b border-white/5">
                  <th className="pl-5 pr-3 py-3 text-left w-10">#</th>
                  <th className="px-3 py-3 text-left min-w-[160px]">Club</th>
                  <th className="px-3 py-3 text-center">MP</th>
                  <th className="px-3 py-3 text-center">W</th>
                  <th className="px-3 py-3 text-center">D</th>
                  <th className="px-3 py-3 text-center">L</th>
                  <th className="px-3 py-3 text-center hidden sm:table-cell">GF</th>
                  <th className="px-3 py-3 text-center hidden sm:table-cell">GA</th>
                  <th className="px-3 py-3 text-center">GD</th>
                  <th className="pr-5 pl-3 py-3 text-center font-black text-white/50">Pts</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {data.data.map((row) => {
                  const q = getQualStyle(row.qualColor);
                  return (
                    <tr
                      key={row._id}
                      className={cn(
                        "transition-colors group cursor-default",
                        row.position === 1 ? "bg-gradient-to-r from-amber-500/10 to-transparent" : (q.row || "hover:bg-white/5")
                      )}
                    >
                      {/* Qualification colour bar + Position */}
                      <td className="pl-0 pr-3 py-3">
                        <div className="flex items-center gap-0">
                          <span className={cn("w-1 h-8 rounded-r-full flex-shrink-0", row.position === 1 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : q.bar)} />
                          <div className="pl-3 w-6 flex justify-end">
                            {row.position === 1 ? (
                              <Trophy size={14} className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                            ) : (
                              <span className="text-white/40 font-bold text-xs">{row.position}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Club */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <TeamLogo src={row.logoUrl} name={row.teamName} />
                          <div>
                            <p className={cn("font-semibold leading-tight whitespace-nowrap", row.position === 1 ? "text-amber-400 font-bold" : "text-white/90")}>
                              {row.teamName}
                            </p>
                            {row.shortName && row.shortName !== row.teamName && (
                              <p className="text-[10px] text-white/30 leading-tight sm:hidden">
                                {row.shortName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="px-3 py-3 text-center text-white/50 tabular-nums">{row.played}</td>
                      <td className="px-3 py-3 text-center text-emerald-400 font-semibold tabular-nums">{row.wins}</td>
                      <td className="px-3 py-3 text-center text-amber-400/80 font-semibold tabular-nums">{row.draws}</td>
                      <td className="px-3 py-3 text-center text-rose-400 font-semibold tabular-nums">{row.losses}</td>
                      <td className="px-3 py-3 text-center text-white/40 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                      <td className="px-3 py-3 text-center text-white/40 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                      <td className={cn(
                        "px-3 py-3 text-center font-semibold tabular-nums",
                        row.goalDiff > 0 ? "text-emerald-400" : row.goalDiff < 0 ? "text-rose-400" : "text-white/40"
                      )}>
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>

                      {/* Points – highlighted */}
                      <td className="pr-5 pl-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-lg bg-white/8 font-black text-white text-sm tabular-nums">
                          {row.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] text-white/20">
              {data.stale ? "⚠ Showing cached data (API temporarily unavailable)" : `${data.fromCache ? "Served from cache" : "Live data"} · ${data.data.length} teams`}
            </p>
            <span className="text-[10px] text-white/20 font-semibold">{selectedLeagueName} 2025/26</span>
          </div>
        </div>
      )}
    </section>
  );
}
