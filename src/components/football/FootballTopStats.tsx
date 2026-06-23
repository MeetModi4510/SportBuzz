import { useState, useEffect } from "react";
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
  API_BASE,
  PLAYER_STAT_LABELS,
  TEAM_STAT_LABELS,
  TOPSTATS_LEAGUES,
  playerPhotoUrl,
  teamBadgeUrl,
  PlayerStat,
  TeamStat,
} from "../../hooks/football/useTopStats";
import { useWorldCupTheme } from "../../hooks/football/useWorldCupTheme";

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

const FEDERATION_LOGOS: Record<string, string> = {
  "Mexico": "https://a.espncdn.com/i/teamlogos/soccer/500/203.png",
  "South Korea": "https://a.espncdn.com/i/teamlogos/soccer/500/451.png",
  "Czechia": "https://a.espncdn.com/i/teamlogos/soccer/500/450.png",
  "South Africa": "https://a.espncdn.com/i/teamlogos/soccer/500/467.png",
  "Canada": "https://a.espncdn.com/i/teamlogos/soccer/500/206.png",
  "Switzerland": "https://a.espncdn.com/i/teamlogos/soccer/500/475.png",
  "Bosnia and Herzegovina": "https://a.espncdn.com/i/teamlogos/soccer/500/452.png",
  "Qatar": "https://a.espncdn.com/i/teamlogos/soccer/500/4398.png",
  "Brazil": "https://a.espncdn.com/i/teamlogos/soccer/500/205.png",
  "Morocco": "https://a.espncdn.com/i/teamlogos/soccer/500/2869.png",
  "Scotland": "https://a.espncdn.com/i/teamlogos/soccer/500/580.png",
  "Haiti": "https://a.espncdn.com/i/teamlogos/soccer/500/2654.png",
  "USA": "https://a.espncdn.com/i/teamlogos/soccer/500/660.png",
  "Australia": "https://a.espncdn.com/i/teamlogos/soccer/500/628.png",
  "Paraguay": "https://a.espncdn.com/i/teamlogos/soccer/500/210.png",
  "Germany": "https://a.espncdn.com/i/teamlogos/soccer/500/481.png",
  "Ivory Coast": "https://a.espncdn.com/i/teamlogos/soccer/500/4789.png",
  "Ecuador": "https://a.espncdn.com/i/teamlogos/soccer/500/209.png",
  "Curacao": "https://a.espncdn.com/i/teamlogos/soccer/500/11678.png",
  "Netherlands": "https://a.espncdn.com/i/teamlogos/soccer/500/449.png",
  "Japan": "https://a.espncdn.com/i/teamlogos/soccer/500/627.png",
  "Sweden": "https://a.espncdn.com/i/teamlogos/soccer/500/466.png",
  "Tunisia": "https://a.espncdn.com/i/teamlogos/soccer/500/659.png",
  "New Zealand": "https://a.espncdn.com/i/teamlogos/soccer/500/2666.png",
  "Iran": "https://a.espncdn.com/i/teamlogos/soccer/500/469.png",
  "Belgium": "https://a.espncdn.com/i/teamlogos/soccer/500/459.png",
  "Egypt": "https://a.espncdn.com/i/teamlogos/soccer/500/2620.png",
  "Uruguay": "https://a.espncdn.com/i/teamlogos/soccer/500/212.png",
  "Saudi Arabia": "https://a.espncdn.com/i/teamlogos/soccer/500/655.png",
  "Spain": "https://a.espncdn.com/i/teamlogos/soccer/500/164.png",
  "Cape Verde": "https://a.espncdn.com/i/teamlogos/soccer/500/2597.png",
  "Norway": "https://a.espncdn.com/i/teamlogos/soccer/500/464.png",
  "France": "https://a.espncdn.com/i/teamlogos/soccer/500/478.png",
  "Senegal": "https://a.espncdn.com/i/teamlogos/soccer/500/654.png",
  "Iraq": "https://a.espncdn.com/i/teamlogos/soccer/500/4375.png",
  "Argentina": "https://a.espncdn.com/i/teamlogos/soccer/500/202.png",
  "Austria": "https://a.espncdn.com/i/teamlogos/soccer/500/474.png",
  "Jordan": "https://a.espncdn.com/i/teamlogos/soccer/500/2917.png",
  "Algeria": "https://a.espncdn.com/i/teamlogos/soccer/500/624.png",
  "Colombia": "https://a.espncdn.com/i/teamlogos/soccer/500/208.png",
  "DR Congo": "https://a.espncdn.com/i/teamlogos/soccer/500/2850.png",
  "Portugal": "https://a.espncdn.com/i/teamlogos/soccer/500/482.png",
  "Uzbekistan": "https://a.espncdn.com/i/teamlogos/soccer/500/2570.png",
  "England": "https://a.espncdn.com/i/teamlogos/soccer/500/448.png",
  "Ghana": "https://a.espncdn.com/i/teamlogos/soccer/500/4469.png",
  "Panama": "https://a.espncdn.com/i/teamlogos/soccer/500/2659.png",
  "Croatia": "https://a.espncdn.com/i/teamlogos/soccer/500/477.png"
};

const FOTMOB_MAJOR_CATEGORIES: Record<string, string[]> = {
  "Attacking": ["Top scorer", "Assists", "Goals + Assists", "Goals per 90", "Expected goals (xG)", "Expected goals (xG) per 90", "Expected goals on target (xGOT)", "Shots on target per 90", "Shots per 90", "xG + xA per 90", "Big chances missed"],
  "Playmaking": ["Accurate passes per 90", "Big chances created", "Chances created", "Accurate long balls per 90", "Expected assist (xA)", "Expected assist (xA) per 90", "Successful dribbles per 90", "Possession won final 3rd per 90"],
  "Defending": ["Defensive actions per 90", "Tackles per 90", "Interceptions per 90", "Clearances per 90", "Blocks per 90", "Recoveries per 90"],
  "Goalkeeping": ["Clean sheets", "Save percentage", "Saves per 90", "Goals prevented", "Goals conceded per 90"],
  "Discipline": ["Yellow cards", "Red cards", "Fouls committed per 90", "Penalties won", "Penalties conceded"],
  "Overall": ["FotMob rating", "Minutes played"]
};

function getMajorCategory(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [major, subcats] of Object.entries(FOTMOB_MAJOR_CATEGORIES)) {
    if (subcats.some(s => s.toLowerCase() === lowerLabel)) return major;
  }
  return "Overall";
}

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
  const src = img && img.length < 10 
    ? FEDERATION_LOGOS[name] || `https://images.fotmob.com/image_resources/logo/teamlogo/${img}.png`
    : teamBadgeUrl(img);
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
    <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
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
                  <img src={t.teamBadgeUrl.length < 10 ? (FEDERATION_LOGOS[t.teamName] || `https://images.fotmob.com/image_resources/logo/teamlogo/${t.teamBadgeUrl}.png`) : teamBadgeUrl(t.teamBadgeUrl)} alt={t.teamName} className="w-full h-full object-contain scale-110 group-hover:scale-100 transition-transform duration-700 drop-shadow-lg" />
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
  const isWorldCupTheme = useWorldCupTheme();
  
  // Set initial league: 734 (World Cup) if theme is active, else 65 (Premier League)
  const [leagueId, setLeagueId]   = useState(isWorldCupTheme ? 734 : 65);
  const [view, setView]           = useState<"players" | "teams">("players");
  const [majorCategory, setMajorCategory] = useState<string>("Attacking");
  const [playerTyp, setPlayerTyp] = useState(1);
  const [teamTyp, setTeamTyp]     = useState(10);

  // Sync leagueId if theme toggles
  useEffect(() => {
    setLeagueId(isWorldCupTheme ? 734 : 65);
  }, [isWorldCupTheme]);

  const { data, isLoading, isError } = useTopStats(leagueId, playerTyp, view);

  // Sync playerTyp dynamically when FotMob data loads or majorCategory changes
  useEffect(() => {
    if (data?.isFotmob && data.fotmobTabs && data.fotmobTabs.length > 0) {
      const currentExists = data.fotmobTabs.some(t => Number(t[0]) === playerTyp && getMajorCategory(t[1]) === majorCategory);
      if (!currentExists) {
        const firstInMajor = data.fotmobTabs.find(t => getMajorCategory(t[1]) === majorCategory);
        if (firstInMajor) setPlayerTyp(Number(firstInMajor[0]));
        else setPlayerTyp(Number(data.fotmobTabs[0][0]));
      }
    } else if (data && !data.isFotmob) {
      const currentExists = Object.keys(PLAYER_STAT_LABELS).some(k => Number(k) === playerTyp);
      if (!currentExists) setPlayerTyp(1);
    }
  }, [data, playerTyp, majorCategory]);

  const handleMajorCategoryClick = (major: string) => {
    setMajorCategory(major);
  };

  // Trigger on-demand background enrichment whenever tab changes
  useEffect(() => {
    if (view === "players" && data && !data.isFotmob) {
      fetch(`${API_BASE}/api/football/top-stats/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, statTyp: playerTyp }),
      }).catch(console.error);
    }
  }, [leagueId, playerTyp, view, data]);

  const selectedLeague = TOPSTATS_LEAGUES.find((l) => l.id === leagueId) || TOPSTATS_LEAGUES[0];

  // Filter rows to current tab + type
  const playerRows = (data?.players || []).filter((p) => p.statTyp === playerTyp).slice(0, 10);
  const teamRows   = (data?.teams   || []).filter((t) => t.statTyp === teamTyp).slice(0, 10);

  const playerTypes = data?.isFotmob && data.fotmobTabs ? data.fotmobTabs : Object.entries(PLAYER_STAT_LABELS);
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
          {data?.isFotmob && view === "players" && (
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-4 mb-4 border-b border-border/40">
              {Object.keys(FOTMOB_MAJOR_CATEGORIES).map(major => {
                const hasTabs = data.fotmobTabs?.some(t => getMajorCategory(t[1]) === major);
                if (!hasTabs) return null;
                return (
                  <button
                    key={major}
                    onClick={() => handleMajorCategoryClick(major)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap shrink-0",
                      majorCategory === major
                        ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                        : "bg-foreground/5 text-muted-foreground/60 hover:bg-foreground/10 hover:text-foreground/90"
                    )}
                  >
                    {major}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar pb-2 mb-6">
            {view === "players"
              ? (data?.isFotmob ? playerTypes.filter(t => getMajorCategory(t[1]) === majorCategory) : playerTypes).map(([typ, label]) => {
                  const t = Number(typ);
                  return (
                    <button
                      key={t}
                      onClick={() => setPlayerTyp(t)}
                      className={cn(
                        "text-[11px] font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0",
                        playerTyp === t
                          ? "text-[#d4af37]"
                          : "text-muted-foreground/60 hover:text-foreground/80"
                      )}
                    >
                      {label.toLowerCase() === "fotmob rating" ? "Average rating" : label}
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
