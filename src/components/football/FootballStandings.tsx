import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, AlertTriangle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorldCupTheme } from "@/hooks/football/useWorldCupTheme";
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

interface WorldCupStandingsResponse {
  success: boolean;
  fromCache: boolean;
  stale?: boolean;
  lastFetched: string | null;
  data: Record<string, (StandingRow & { teamLogo?: string })[]>;
}

const LEAGUES = [
  { id: 47, name: "Premier League", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/47.png" },
  { id: 87, name: "La Liga", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/87.png" },
  { id: 54, name: "Bundesliga", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/54.png" },
  { id: 55, name: "Serie A", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/55.png" },
  { id: 53, name: "Ligue 1", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/53.png" },
  { id: 77, name: "World Cup", logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/77.png" },
];

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

async function fetchStandings(leagueId: number): Promise<any> {
  if (leagueId === 77) {
    const res = await fetch(`${API_BASE}/api/football/fotmob-table/77`);
    if (!res.ok) throw new Error("Failed to fetch world cup standings");
    return res.json();
  } else {
    const res = await fetch(`${API_BASE}/api/football/standings?leagueId=${leagueId}`);
    if (!res.ok) throw new Error("Failed to fetch standings");
    return res.json();
  }
}

/** Maps the raw qualColor string to a Tailwind colour set */
function getQualStyle(qualColor: string | null): {
  bar: string;
  row: string;
  badge: string;
  label: string;
} {
  if (!qualColor) return { bar: "bg-transparent", row: "", badge: "bg-foreground/5 text-muted-foreground/60", label: "" };

  const q = qualColor.toLowerCase();
  if (q.includes("champions") || q.includes("ucl"))
    return { bar: "bg-emerald-500", row: "bg-emerald-500/5 hover:bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Champions League" };
  if (q.includes("europa") || q.includes("uel") || q.includes("conference"))
    return { bar: "bg-orange-400", row: "bg-orange-400/5 hover:bg-orange-400/10", badge: "bg-orange-400/20 text-orange-300 border-orange-400/30", label: "Europa League" };
  if (q.includes("relegat"))
    return { bar: "bg-rose-500", row: "bg-rose-500/5 hover:bg-rose-500/10", badge: "bg-rose-500/20 text-rose-400 border-rose-500/30", label: "Relegation" };

  return { bar: "bg-transparent", row: "hover:bg-foreground/5", badge: "", label: "" };
}

function TeamLogo({ src, name, size = "w-6 h-6" }: { src?: string; name: string; size?: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={cn(size, "rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0")}>
        <span className="text-[10px] font-black text-muted-foreground leading-none">
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
      className={cn(size, "rounded-full object-contain flex-shrink-0")}
    />
  );
}

export function FootballStandings() {
  const isWorldCup = useWorldCupTheme();
  
  // Initialize with World Cup if theme is active, otherwise Premier League
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(() => {
    return 47; // Default to 47 initially, useEffect will sync it
  });
  
  const [selectedGroup, setSelectedGroup] = useState<string>("Group A");
  const [selectedTab, setSelectedTab] = useState<"all" | "home" | "away">("all");

  useEffect(() => {
    // On mount or when theme changes, set default to World Cup if active
    if (isWorldCup) {
      setSelectedLeagueId(77);
    } else {
      setSelectedLeagueId(47);
    }
  }, [isWorldCup]);

  const { data, isLoading, isError, isFetching } = useQuery<any>({
    queryKey: ["football", "standings-v2", selectedLeagueId],
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
          <Trophy size={24} className="text-[#d4af37] drop-shadow-md" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">
              {selectedLeagueName} Standings.
            </h2>
          </div>
        </div>

        {/* League Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border rounded-xl transition-all shadow-sm">
              {LEAGUES.find(l => l.id === selectedLeagueId)?.logo && (
                <div className="bg-white rounded-full p-[2px] shadow-sm flex items-center justify-center">
                  <img src={LEAGUES.find(l => l.id === selectedLeagueId)?.logo} alt="" className="w-4 h-4 object-contain" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground/90">{selectedLeagueName}</span>
              <ChevronDown size={16} className="text-muted-foreground ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border min-w-[180px] p-1.5 rounded-xl shadow-2xl">
            {LEAGUES.map(league => (
              <DropdownMenuItem 
                key={league.id} 
                onClick={() => setSelectedLeagueId(league.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2 transition-colors",
                  selectedLeagueId === league.id ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <div className="bg-white rounded-full p-[2px] shadow-sm flex items-center justify-center shrink-0">
                  <img src={league.logo} alt={league.name} className="w-4 h-4 object-contain" />
                </div>
                <span className="text-sm font-medium">{league.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground/60" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground/80">
          <AlertTriangle size={18} />
          <span className="text-sm">Could not load standings. Please try again later.</span>
        </div>
      )}

      {/* Table Content */}
      {selectedLeagueId === 77 ? (
        /* World Cup FotMob Layout */
        data?.data && Array.isArray(data.data) && data.data.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-foreground/[0.03] p-3 rounded-2xl border border-border">
              {/* Tabs for All, Home, Away */}
              <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl w-fit">
                {(["all", "home", "away"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all",
                      selectedTab === tab 
                        ? "bg-foreground text-background shadow-sm" 
                        : "text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Group Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-foreground/[0.02] border border-border rounded-xl transition-all shadow-sm">
                    <span className="text-sm font-bold text-foreground/90">{selectedGroup || data.data[0].leagueName}</span>
                    <ChevronDown size={16} className="text-muted-foreground ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border min-w-[150px] p-1.5 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto">
                  {data.data.map((group: any) => (
                    <DropdownMenuItem 
                      key={group.leagueName} 
                      onClick={() => setSelectedGroup(group.leagueName)}
                      className={cn(
                        "flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors",
                        (selectedGroup || data.data[0].leagueName) === group.leagueName ? "bg-accent text-accent-foreground font-bold" : "text-foreground/70 hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <span className="text-sm">{group.leagueName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-1">
              {(() => {
                const activeGroupData = data.data.find((g: any) => g.leagueName === selectedGroup) || data.data[0];
                const teams = activeGroupData?.table?.[selectedTab];
                if (!teams) return null;

                return (
                  <div key={activeGroupData.leagueName} className="rounded-2xl border border-border bg-card backdrop-blur-sm overflow-hidden flex flex-col shadow-lg relative">
                    {/* Subtle Top Gradient */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    
                    {/* Group Header */}
                    <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                      <span className="font-black text-foreground tracking-tight text-lg">{activeGroupData.leagueName}</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        Top 2 Advance
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 bg-muted/10">
                            <th className="pl-4 pr-3 py-3 text-left w-10">#</th>
                            <th className="px-3 py-3 text-left min-w-[150px]">Team</th>
                            <th className="px-3 py-3 text-center">PL</th>
                            <th className="px-3 py-3 text-center">W</th>
                            <th className="px-3 py-3 text-center">D</th>
                            <th className="px-3 py-3 text-center">L</th>
                            <th className="px-3 py-3 text-center hidden sm:table-cell">+/-</th>
                            <th className="px-3 py-3 text-center">GD</th>
                            <th className="px-3 py-3 text-center font-black text-foreground">PTS</th>
                            <th className="px-4 py-3 text-left">Form</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {teams.map((row: any) => (
                            <tr
                              key={row.id}
                              className={cn(
                                "transition-colors group cursor-default",
                                row.idx <= 2 ? "hover:bg-emerald-500/5" : "hover:bg-foreground/5"
                              )}
                            >
                              <td className="pl-0 pr-3 py-3">
                                <div className="flex items-center gap-0">
                                  <span className={cn("w-[3px] h-8 rounded-r-full flex-shrink-0", row.idx <= 2 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-transparent")} />
                                  <div className="pl-3 w-6 flex justify-end">
                                    <span className={cn("font-bold text-xs", row.idx <= 2 ? "text-emerald-500" : "text-muted-foreground/60")}>
                                      {row.idx}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <TeamLogo src={FEDERATION_LOGOS[row.name] || `https://images.fotmob.com/image_resources/logo/teamlogo/${row.id}.png`} name={row.name} size="w-7 h-7" />
                                  <span className={cn("font-bold leading-tight whitespace-nowrap text-[15px] tracking-tight", row.idx <= 2 ? "text-foreground" : "text-foreground/80")}>
                                    {row.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center text-muted-foreground/80 tabular-nums text-sm font-semibold">{row.played}</td>
                              <td className="px-3 py-3 text-center text-muted-foreground/80 font-semibold tabular-nums text-sm">{row.wins}</td>
                              <td className="px-3 py-3 text-center text-muted-foreground/80 font-semibold tabular-nums text-sm">{row.draws}</td>
                              <td className="px-3 py-3 text-center text-muted-foreground/80 font-semibold tabular-nums text-sm">{row.losses}</td>
                              <td className="px-3 py-3 text-center text-muted-foreground/60 tabular-nums hidden sm:table-cell text-sm">{row.scoresStr}</td>
                              <td className="px-3 py-3 text-center font-semibold tabular-nums text-sm text-foreground/80">
                                {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center justify-center font-black text-foreground text-[15px] tabular-nums">
                                  {row.pts}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-left">
                                <div className="flex items-center gap-1.5">
                                  {/* Just rendering W D L manually for World Cup if form not fully available from FotMob, 
                                      or extracting from recent matches if needed. 
                                      For FotMob, if form exists it's usually inside row.form */}
                                  {row.wins > 0 && <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center border border-emerald-500/30">W</span>}
                                  {row.wins > 1 && <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center border border-emerald-500/30">W</span>}
                                  {row.draws > 0 && <span className="w-5 h-5 rounded-md bg-foreground/20 text-foreground/70 text-[10px] font-black flex items-center justify-center border border-border">D</span>}
                                  {row.losses > 0 && <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black flex items-center justify-center border border-rose-500/30">L</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* World Cup Footer */}
            <div className="px-5 py-4 rounded-2xl border border-border/50 bg-card flex flex-col xl:flex-row justify-between items-center gap-4 shadow-sm">
              <div className="flex items-center gap-4 shrink-0">
                <span className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Advances to Knockout Stage
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-foreground/40 hidden sm:inline-block">FIFA World Cup 2026</span>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Standard League Table Layout */
        data?.data && Array.isArray(data.data) && data.data.length > 0 && (
          <div className="rounded-2xl border border-border bg-foreground/[0.03] backdrop-blur-sm overflow-hidden">
  
            {/* Legend */}
            <div className="flex items-center gap-5 px-5 py-3 border-b border-border/50 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Champions League</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Europa / Conference</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Relegation</span>
            </div>
  
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* Column Headers */}
                <thead>
                  <tr className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest border-b border-border/50">
                    <th className="pl-5 pr-3 py-3 text-left w-10">#</th>
                    <th className="px-3 py-3 text-left min-w-[160px]">Club</th>
                    <th className="px-3 py-3 text-center">MP</th>
                    <th className="px-3 py-3 text-center">W</th>
                    <th className="px-3 py-3 text-center">D</th>
                    <th className="px-3 py-3 text-center">L</th>
                    <th className="px-3 py-3 text-center hidden sm:table-cell">GF</th>
                    <th className="px-3 py-3 text-center hidden sm:table-cell">GA</th>
                    <th className="px-3 py-3 text-center">GD</th>
                    <th className="pr-5 pl-3 py-3 text-center font-black text-muted-foreground">Pts</th>
                  </tr>
                </thead>
  
                <tbody className="divide-y divide-border/50">
                  {(data.data as StandingRow[]).map((row) => {
                    const q = getQualStyle(row.qualColor);
                    return (
                      <tr
                        key={row._id}
                        className={cn(
                          "transition-colors group cursor-default",
                          row.position === 1 ? "bg-gradient-to-r from-amber-500/10 to-transparent" : (q.row || "hover:bg-foreground/5")
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
                                <span className="text-muted-foreground/80 font-bold text-xs">{row.position}</span>
                              )}
                            </div>
                          </div>
                        </td>
  
                        {/* Club */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <TeamLogo src={row.logoUrl} name={row.teamName} />
                            <div>
                              <p className={cn("font-semibold leading-tight whitespace-nowrap", row.position === 1 ? "text-amber-400 font-bold" : "text-foreground/90")}>
                                {row.teamName}
                              </p>
                              {row.shortName && row.shortName !== row.teamName && (
                                <p className="text-[10px] text-muted-foreground/60 leading-tight sm:hidden">
                                  {row.shortName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
  
                        {/* Stats */}
                        <td className="px-3 py-3 text-center text-muted-foreground tabular-nums">{row.played}</td>
                        <td className="px-3 py-3 text-center text-emerald-400 font-semibold tabular-nums">{row.wins}</td>
                        <td className="px-3 py-3 text-center text-amber-400/80 font-semibold tabular-nums">{row.draws}</td>
                        <td className="px-3 py-3 text-center text-rose-400 font-semibold tabular-nums">{row.losses}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground/80 tabular-nums hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground/80 tabular-nums hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className={cn(
                          "px-3 py-3 text-center font-semibold tabular-nums",
                          row.goalDiff > 0 ? "text-emerald-400" : row.goalDiff < 0 ? "text-rose-400" : "text-muted-foreground/80"
                        )}>
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
  
                        {/* Points – highlighted */}
                        <td className="pr-5 pl-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-lg bg-foreground/5 font-black text-foreground text-sm tabular-nums">
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
            <div className="px-5 py-4 border-t border-border/50 bg-foreground/[0.01] flex flex-col xl:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                <span><strong className="text-foreground/70 font-bold pr-1">MP</strong>Matches Played</span>
                <span><strong className="text-foreground/70 font-bold pr-1">W</strong>Wins</span>
                <span><strong className="text-foreground/70 font-bold pr-1">D</strong>Draws</span>
                <span><strong className="text-foreground/70 font-bold pr-1">L</strong>Losses</span>
                <span className="hidden sm:inline"><strong className="text-foreground/70 font-bold pr-1">GF</strong>Goals For</span>
                <span className="hidden sm:inline"><strong className="text-foreground/70 font-bold pr-1">GA</strong>Goals Against</span>
                <span><strong className="text-foreground/70 font-bold pr-1">GD</strong>Goal Diff</span>
                <span><strong className="text-foreground/70 font-bold pr-1">PTS</strong>Points</span>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground/40 font-semibold shrink-0">{selectedLeagueName} 2025/26</span>
            </div>
          </div>
        )
      )}
    </section>
  );
}
