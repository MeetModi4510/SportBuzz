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

const COUNTRY_CODES: Record<string, string> = {
  "England": "gb-eng", "Norway": "no", "Brazil": "br", "Ghana": "gh",
  "France": "fr", "Spain": "es", "Germany": "de", "Italy": "it",
  "Portugal": "pt", "Netherlands": "nl", "Argentina": "ar", "Belgium": "be",
  "Senegal": "sn", "Egypt": "eg", "South Korea": "kr", "Japan": "jp",
  "Uruguay": "uy", "Colombia": "co", "Croatia": "hr", "Morocco": "ma",
  "Switzerland": "ch", "Denmark": "dk", "Serbia": "rs", "Poland": "pl",
  "Sweden": "se", "Wales": "gb-wls", "Scotland": "gb-sct", "USA": "us",
  "Ivory Coast": "ci", "Nigeria": "ng", "Algeria": "dz", "Cameroon": "cm",
  "Chile": "cl", "Mexico": "mx", "Canada": "ca", "Australia": "au"
};

// ── Small helpers ──────────────────────────────────────────────────────────────

function PlayerAvatar({ photoBase64, name, sofascoreId, className }: { photoBase64?: string; name: string; sofascoreId?: string; className?: string }) {
  const [err, setErr] = useState(false);

  const cx = className || "w-9 h-9";

  // If sofascoreId is completely undefined, the backend is still enriching this player
  if (sofascoreId === undefined) {
    return (
      <div className={cn("rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0", cx)}>
        <Loader2 className="w-1/3 h-1/3 animate-spin text-white/30" />
      </div>
    );
  }

  // If we checked Sofascore but they have no photo, show initials
  if (!photoBase64 || err) {
    return (
      <div className={cn("rounded-full bg-white/10 flex items-center justify-center flex-shrink-0", cx)}>
        <span className="text-[10px] font-black text-white/50">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={photoBase64}
      alt={name}
      onError={() => setErr(true)}
      loading="lazy"
      className={cn("rounded-full object-cover flex-shrink-0 bg-white/5 border border-white/10", cx)}
    />
  );
}

function TeamBadge({ img, name, className }: { img: string; name: string; className?: string }) {
  const [err, setErr] = useState(false);
  const src = teamBadgeUrl(img);
  const cx = className || "w-6 h-6";

  if (!src || err) {
    return (
      <div className={cn("rounded-full bg-white/10 flex items-center justify-center flex-shrink-0", cx)}>
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
      className={cn("rounded-full object-contain flex-shrink-0 bg-white/5", cx)}
    />
  );
}

// ── Player Card List ──────────────────────────────────────────────────────────
function PlayerStatList({ rows }: { rows: PlayerStat[] }) {
  if (!rows.length)
    return <p className="text-center text-white/30 text-sm py-8 font-light">No data available.</p>;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((p) => {
        return (
          <div key={p._id} className="group relative flex items-center py-1 transition-transform duration-500 hover:translate-x-3 cursor-default">
            {/* Giant Watermark Rank */}
            <div className="absolute left-0 -translate-x-3 top-1/2 -translate-y-1/2 text-[80px] md:text-[100px] font-black text-white/[0.03] z-0 select-none pointer-events-none tracking-tighter leading-none group-hover:text-white/[0.05] group-hover:-translate-y-[55%] transition-all duration-500">
              {p.rank}
            </div>

            {/* Content Layer */}
            <div className="flex items-center gap-4 z-10 w-full border-b border-white/[0.08] pb-3 group-hover:border-white/[0.15] transition-colors">
              
              {/* Grayscale Squared Avatar */}
              <div className="shrink-0 overflow-hidden rounded-lg w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-black/40 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 bg-white/5">
                {p.photoBase64 ? (
                  <img src={p.photoBase64} alt={p.playerName} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20"><Users size={18} /></div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-lg md:text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors truncate">
                  {p.playerName}
                </span>
                
                <div className="flex items-center gap-2 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <TeamBadge img={p.teamBadgeUrl} name={p.teamName} className="w-3.5 h-3.5 grayscale group-hover:grayscale-0" />
                  <span className="text-[10px] uppercase tracking-widest text-white/80 font-semibold truncate">
                    {p.teamName}
                  </span>
                  
                  {p.jerseyNumber && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                        #{p.jerseyNumber}
                      </span>
                    </>
                  )}

                  {p.position && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em]">
                        {p.position}
                      </span>
                    </>
                  )}

                  {p.country && (
                    <>
                      <span className="text-white/20">•</span>
                      <div className="flex items-center gap-1">
                        {COUNTRY_CODES[p.country] && (
                          <img 
                            src={`https://flagcdn.com/w20/${COUNTRY_CODES[p.country]}.png`} 
                            alt={p.country} 
                            className="w-3.5 h-auto rounded-[1px] opacity-80 group-hover:opacity-100" 
                          />
                        )}
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                          {p.country}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ultra Thin Huge Stat */}
              <div className="font-thin text-4xl md:text-5xl tabular-nums tracking-tighter text-amber-400/50 group-hover:text-amber-400 transition-colors duration-500 shrink-0 pr-2">
                {p.statValue}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Team Card List ────────────────────────────────────────────────────────────
function TeamStatList({ rows }: { rows: TeamStat[] }) {
  if (!rows.length)
    return <p className="text-center text-white/30 text-sm py-8 font-light">No data available.</p>;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((t) => {
        return (
          <div key={t._id} className="group relative flex items-center py-1 transition-transform duration-500 hover:translate-x-3 cursor-default">
            {/* Giant Watermark Rank */}
            <div className="absolute left-0 -translate-x-3 top-1/2 -translate-y-1/2 text-[80px] md:text-[100px] font-black text-white/[0.03] z-0 select-none pointer-events-none tracking-tighter leading-none group-hover:text-white/[0.05] group-hover:-translate-y-[55%] transition-all duration-500">
              {t.rank}
            </div>

            {/* Content Layer */}
            <div className="flex items-center gap-4 z-10 w-full border-b border-white/[0.08] pb-3 group-hover:border-white/[0.15] transition-colors">
              
              {/* Grayscale Squared Avatar */}
              <div className="shrink-0 flex items-center justify-center rounded-lg w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-black/40 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 bg-white/5 p-1.5 border border-white/5">
                {t.teamBadgeUrl ? (
                  <img src={teamBadgeUrl(t.teamBadgeUrl)} alt={t.teamName} className="w-full h-full object-contain scale-110 group-hover:scale-100 transition-transform duration-700 drop-shadow-lg" />
                ) : (
                  <Shield size={20} className="text-white/20" />
                )}
              </div>

              {/* Team Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-lg md:text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors truncate">
                  {t.teamName}
                </span>
                {t.statPerGame && (
                   <div className="flex items-center gap-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                     <span className="text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em] bg-amber-400/10 px-1.5 py-0.5 rounded">
                       {t.statPerGame} per game
                     </span>
                   </div>
                )}
              </div>

              {/* Ultra Thin Huge Stat */}
              <div className="font-thin text-4xl md:text-5xl tabular-nums tracking-tighter text-amber-400/50 group-hover:text-amber-400 transition-colors duration-500 shrink-0 pr-2">
                {t.statValue}
              </div>
            </div>
          </div>
        );
      })}
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
            <BarChart3 size={24} className="text-[#d4af37]" />
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              Top Stats.
            </h2>
          </div>
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
        <div className="flex flex-col mt-6">
          {/* ── Header Toggles ─ */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setView("players")}
                className={cn(
                  "text-sm tracking-widest uppercase transition-all duration-300 relative",
                  view === "players"
                    ? "text-white font-medium"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Players
                {view === "players" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-amber-400" />
                )}
              </button>
              <button
                onClick={() => setView("teams")}
                className={cn(
                  "text-sm tracking-widest uppercase transition-all duration-300 relative",
                  view === "teams"
                    ? "text-white font-medium"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                Teams
                {view === "teams" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-amber-400" />
                )}
              </button>
            </div>
            
            <div className="text-[10px] text-white/30 uppercase tracking-widest text-right hidden sm:block">
               {selectedLeague.name} / Top Stats
            </div>
          </div>

          {/* ── Category chips ─────── */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
            {view === "players"
              ? playerTypes.map(([typ, label]) => {
                  const t = Number(typ);
                  return (
                    <button
                      key={t}
                      onClick={() => setPlayerTyp(t)}
                      className={cn(
                        "text-xs tracking-widest uppercase transition-colors",
                        playerTyp === t
                          ? "text-amber-400 font-semibold"
                          : "text-white/30 hover:text-white/70"
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
                        "text-xs tracking-widest uppercase transition-colors",
                        teamTyp === t
                          ? "text-amber-400 font-semibold"
                          : "text-white/30 hover:text-white/70"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
          </div>

          {/* ── List ──────────────── */}
          {view === "players" ? (
            <PlayerStatList rows={playerRows} />
          ) : (
            <TeamStatList rows={teamRows} />
          )}

        </div>
      )}
    </section>
  );
}
