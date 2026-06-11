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
      <div className={cn("rounded-full bg-foreground/5 border border-border/50 flex items-center justify-center flex-shrink-0", cx)}>
        <Loader2 className="w-1/3 h-1/3 animate-spin text-muted-foreground/60" />
      </div>
    );
  }

  // If we checked Sofascore but they have no photo, show initials
  if (!photoBase64 || err) {
    return (
      <div className={cn("rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0", cx)}>
        <span className="text-[10px] font-black text-muted-foreground">
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
      className={cn("rounded-full object-cover flex-shrink-0 bg-foreground/5 border border-border", cx)}
    />
  );
}

function TeamBadge({ img, name, className }: { img: string; name: string; className?: string }) {
  const [err, setErr] = useState(false);
  const src = teamBadgeUrl(img);
  const cx = className || "w-6 h-6";

  if (!src || err) {
    return (
      <div className={cn("rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0", cx)}>
        <span className="text-[8px] font-black text-muted-foreground">{name.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      loading="lazy"
      className={cn("rounded-full object-contain flex-shrink-0 bg-foreground/5", cx)}
    />
  );
}

// ── Player Card List ──────────────────────────────────────────────────────────
function PlayerStatList({ rows }: { rows: PlayerStat[] }) {
  if (!rows.length)
    return <p className="text-center text-muted-foreground/60 text-sm py-8 font-light">No data available.</p>;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((p) => {
        return (
          <div key={p._id} className="group relative flex items-center py-1 transition-transform duration-500 hover:translate-x-3 cursor-default">
            {/* Giant Watermark Rank */}
            <div className="absolute left-0 -translate-x-3 top-1/2 -translate-y-1/2 text-[80px] md:text-[100px] font-black text-foreground/[0.1] z-0 select-none pointer-events-none tracking-tighter leading-none group-hover:text-foreground/[0.15] group-hover:-translate-y-[55%] transition-all duration-500">
              {p.rank}
            </div>

            {/* Content Layer */}
            <div className="flex items-center gap-4 z-10 w-full border-b border-border/50 pb-3 group-hover:border-border transition-colors">
              
              {/* Grayscale Squared Avatar */}
              <div className="shrink-0 overflow-hidden rounded-lg w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-black/40 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 bg-foreground/5">
                {p.photoBase64 ? (
                  <img src={p.photoBase64} alt={p.playerName} className="w-full h-full object-cover object-top transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40"><Users size={18} /></div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-lg md:text-xl font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors truncate">
                  {p.playerName}
                </span>
                
                <div className="flex items-center gap-2 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  <TeamBadge img={p.teamBadgeUrl} name={p.teamName} className="w-3.5 h-3.5 grayscale group-hover:grayscale-0" />
                  <span className="text-[10px] uppercase tracking-widest text-foreground/90 font-semibold truncate">
                    {p.teamName}
                  </span>
                  
                  {p.jerseyNumber && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-[10px] text-foreground/80 font-bold uppercase tracking-widest">
                        #{p.jerseyNumber}
                      </span>
                    </>
                  )}

                  {p.position && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-[9px] text-[#d4af37] font-bold uppercase tracking-[0.2em]">
                        {p.position}
                      </span>
                    </>
                  )}

                  {p.country && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <div className="flex items-center gap-1">
                        {COUNTRY_CODES[p.country] && (
                          <img 
                            src={`https://flagcdn.com/w20/${COUNTRY_CODES[p.country]}.png`} 
                            alt={p.country} 
                            className="w-3.5 h-auto rounded-[1px] opacity-90 group-hover:opacity-100" 
                          />
                        )}
                        <span className="text-[10px] text-foreground/80 font-bold uppercase tracking-widest">
                          {p.country}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ultra Thin Huge Stat */}
              <div className="font-thin text-4xl md:text-5xl tabular-nums tracking-tighter text-[#d4af37]/70 group-hover:text-[#d4af37] transition-colors duration-500 shrink-0 pr-2">
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
    return <p className="text-center text-muted-foreground/60 text-sm py-8 font-light">No data available.</p>;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((t) => {
        return (
          <div key={t._id} className="group relative flex items-center py-1 transition-transform duration-500 hover:translate-x-3 cursor-default">
            {/* Giant Watermark Rank */}
            <div className="absolute left-0 -translate-x-3 top-1/2 -translate-y-1/2 text-[80px] md:text-[100px] font-black text-foreground/[0.1] z-0 select-none pointer-events-none tracking-tighter leading-none group-hover:text-foreground/[0.15] group-hover:-translate-y-[55%] transition-all duration-500">
              {t.rank}
            </div>

            {/* Content Layer */}
            <div className="flex items-center gap-4 z-10 w-full border-b border-border/50 pb-3 group-hover:border-border transition-colors">
              
              {/* Grayscale Squared Avatar */}
              <div className="shrink-0 flex items-center justify-center rounded-lg w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-black/40 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 bg-foreground/5 p-1.5 border border-border/50">
                {t.teamBadgeUrl ? (
                  <img src={teamBadgeUrl(t.teamBadgeUrl)} alt={t.teamName} className="w-full h-full object-contain scale-110 group-hover:scale-100 transition-transform duration-700 drop-shadow-lg" />
                ) : (
                  <Shield size={20} className="text-muted-foreground/40" />
                )}
              </div>

              {/* Team Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-foreground transition-colors truncate">
                  {t.teamName}
                </span>
                {t.statPerGame && (
                   <div className="flex items-center gap-2 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                     <span className="text-[10px] uppercase tracking-widest text-foreground font-semibold truncate">
                       {t.statPerGame}
                     </span>
                   </div>
                )}
              </div>

              {/* Ultra Thin Huge Stat */}
              <div className="font-thin text-4xl md:text-5xl tabular-nums tracking-tighter text-[#b8860b] group-hover:text-[#d4af37] transition-colors duration-500 shrink-0 pr-2">
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
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
              Top Stats.
            </h2>
          </div>
        </div>

        {/* League Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border rounded-xl transition-all shadow-sm">
              {selectedLeague?.logo && (
                <div className="bg-white rounded-full p-[2px] shadow-sm flex items-center justify-center shrink-0 border border-border/20">
                  <img src={selectedLeague.logo} alt="" className="w-4 h-4 object-contain" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground">{selectedLeague?.name}</span>
              <ChevronDown size={16} className="text-muted-foreground ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border min-w-[180px] p-1.5 rounded-xl shadow-2xl">
            {TOPSTATS_LEAGUES.map((l) => (
              <DropdownMenuItem
                key={l.id}
                onClick={() => setLeagueId(l.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2 transition-colors",
                  selectedLeague?.id === l.id ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {l.logo && (
                  <div className="bg-white rounded-full p-[2px] shadow-sm flex items-center justify-center shrink-0 border border-border/20">
                    <img src={l.logo} alt={l.name} className="w-4 h-4 object-contain" />
                  </div>
                )}
                <span className="text-sm font-medium">{l.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground/60" />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground/80">
          <AlertTriangle size={18} />
          <span className="text-sm">Could not load top stats. Please try again later.</span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {data && !isLoading && (
        <div className="flex flex-col mt-6">
          {/* ── Header Toggles ─ */}
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setView("players")}
                className={cn(
                  "text-sm tracking-widest uppercase transition-all duration-300 relative",
                  view === "players"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Players
                {view === "players" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-[#d4af37]" />
                )}
              </button>
              <button
                onClick={() => setView("teams")}
                className={cn(
                  "text-sm tracking-widest uppercase transition-all duration-300 relative",
                  view === "teams"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Teams
                {view === "teams" && (
                  <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-[#d4af37]" />
                )}
              </button>
            </div>
            
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-right hidden sm:block">
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
                        "text-xs font-semibold tracking-widest uppercase transition-all whitespace-nowrap",
                        playerTyp === t
                          ? "text-[#d4af37]"
                          : "text-muted-foreground/70 hover:text-foreground/80"
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
                        "text-xs font-semibold tracking-widest uppercase transition-all whitespace-nowrap",
                        teamTyp === t
                          ? "text-[#d4af37]"
                          : "text-muted-foreground/70 hover:text-foreground/80"
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
