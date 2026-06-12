import { cn } from "../../lib/utils";
import { FootballMatch } from "../../types/football";
import { formatToIST } from "../../lib/dateUtils";
import { MapPin, Clock, Trophy } from "lucide-react";
import { TeamLogo } from "../TeamLogo";
import { useWorldCupTheme } from "../../hooks/football/useWorldCupTheme";

interface FootballMatchCardProps {
  match: FootballMatch;
  onClick?: (match: FootballMatch) => void;
  className?: string;
}

export const FootballMatchCard = ({ match, onClick, className }: FootballMatchCardProps) => {
  const isWorldCup = useWorldCupTheme();

  const isLive = match.fixture.status.short === "1H" || 
                 match.fixture.status.short === "2H" || 
                 match.fixture.status.short === "HT" || 
                 match.fixture.status.short === "ET" ||
                 match.fixture.status.short === "P";
                 
  const isUpcoming = match.fixture.status.short === "NS";

  const getStatusText = () => {
    if (isLive) return `${match.fixture.status.elapsed}'`;
    if (isUpcoming) return "Upcoming";
    return match.fixture.status.short; // FT, AET, PEN
  };

  const getStatusColor = () => {
    if (isLive) return "text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full";
    if (isUpcoming) return "text-muted-foreground/80 font-medium";
    return "text-muted-foreground/80 font-medium";
  };

  const getKnownTeamColor = (name: string): [number, number, number] | null => {
    const n = name.toLowerCase();
    if (n.includes("inter")) return [37, 99, 235]; // Blue
    if (n.includes("juventus")) return [255, 255, 255]; // White
    if (n.includes("milan")) return [220, 38, 38]; // Red
    if (n.includes("real madrid")) return [255, 255, 255]; // White
    if (n.includes("barcelona")) return [185, 28, 28]; // Deep Red
    if (n.includes("bayern")) return [220, 38, 38]; // Red
    if (n.includes("dortmund")) return [250, 204, 21]; // Yellow
    if (n.includes("arsenal")) return [220, 38, 38]; // Red
    if (n.includes("chelsea")) return [37, 99, 235]; // Blue
    if (n.includes("manchester united") || n.includes("man utd")) return [220, 38, 38]; // Red
    if (n.includes("manchester city") || n.includes("man city")) return [56, 189, 248]; // Sky blue
    if (n.includes("liverpool")) return [220, 38, 38]; // Red
    if (n.includes("paris") || n.includes("psg")) return [30, 58, 138]; // Navy
    if (n.includes("napoli")) return [56, 189, 248]; // Sky blue
    if (n.includes("atletico")) return [220, 38, 38]; // Red
    if (n.includes("tottenham") || n.includes("spurs")) return [255, 255, 255]; // White
    return null;
  };

  const getFallbackColorIndex = (str: string) => {
    const hash = (str || "").split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return Math.abs(hash) % 10;
  };

  const defaultColors: [number, number, number][] = [
    [220, 38, 38],   // 0: red-600
    [37, 99, 235],   // 1: blue-600
    [5, 150, 105],   // 2: emerald-600
    [217, 119, 6],   // 3: amber-600
    [124, 58, 237],  // 4: violet-600
    [219, 39, 119],  // 5: pink-600
    [79, 70, 229],   // 6: indigo-600
    [234, 88, 12],   // 7: orange-600
    [2, 132, 199],   // 8: sky-600
    [147, 51, 234],  // 9: purple-600
  ];

  let homeRGB = getKnownTeamColor(match.teams.home.name);
  let awayRGB = getKnownTeamColor(match.teams.away.name);

  if (!homeRGB) homeRGB = defaultColors[getFallbackColorIndex(match.teams.home.name)];
  if (!awayRGB) {
    let aIdx = getFallbackColorIndex(match.teams.away.name);
    // Collision detection for fallback colors
    if (!getKnownTeamColor(match.teams.home.name) && aIdx === getFallbackColorIndex(match.teams.home.name)) {
      aIdx = (aIdx + 1) % defaultColors.length;
    }
    awayRGB = defaultColors[aIdx];
  }

  // Final check: if they somehow still match exactly, dim the away color
  if (homeRGB[0] === awayRGB[0] && homeRGB[1] === awayRGB[1] && homeRGB[2] === awayRGB[2]) {
     awayRGB = [awayRGB[0] * 0.5, awayRGB[1] * 0.5, awayRGB[2] * 0.5];
  }

  const splitGradient = `linear-gradient(105deg, rgba(${homeRGB[0]},${homeRGB[1]},${homeRGB[2]},0.35) 49.5%, rgba(245,158,11,0.8) 49.5%, rgba(245,158,11,0.8) 50.5%, rgba(${awayRGB[0]},${awayRGB[1]},${awayRGB[2]},0.35) 50.5%)`;

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative overflow-hidden border bg-foreground/[0.02] p-6 backdrop-blur-xl transition-all duration-500 cursor-pointer flex flex-col h-full",
        isWorldCup 
          ? "rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden bg-slate-950" 
          : "rounded-[2rem] border-border/50 hover:bg-foreground/[0.04] hover:border-border",
        className
      )}
      style={isWorldCup ? { backgroundImage: splitGradient } : {}}
    >
      {isWorldCup && (
        <>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] dark:opacity-30 opacity-10 pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-transparent opacity-50 pointer-events-none" />
        </>
      )}
      {!isWorldCup && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-3xl pointer-events-none group-hover:bg-foreground/10 transition-colors" />
      )}

      {/* Header */}
      {isWorldCup && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-400 opacity-80" />
      )}
      <div className={cn("flex items-center justify-between pb-2 mb-2 relative z-10", isWorldCup ? "pt-2 px-1" : "border-b border-border/50")}>
        <div className="flex items-center gap-2">
           <img src={match.league.logo} alt={match.league.name} className="w-6 h-6 object-contain" />
           <span className="text-[10px] text-muted-foreground tracking-widest font-semibold uppercase truncate max-w-[150px]">
             {match.league.name}
           </span>
        </div>
        <div className="flex items-center gap-2">
           {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
           <span className={cn("text-[10px] uppercase tracking-widest", getStatusColor())}>
             {getStatusText()}
           </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex flex-col relative z-10 flex-1 justify-center py-2">
        {isWorldCup ? (
          /* World Cup Layout: Action Split Format */
          <div className="flex items-center justify-between w-full relative">
             <div className="flex flex-col items-center gap-2 flex-1 z-10 group-hover:-translate-x-1 transition-transform duration-500">
               <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] object-contain" />
               <span className={cn("font-black text-[14px] tracking-widest uppercase text-center leading-tight line-clamp-2", match.teams.home.winner ? "text-amber-500 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" : "text-white/95")}>
                 {match.teams.home.name}
               </span>
             </div>
             
             <div className="flex flex-col items-center justify-center shrink-0 px-2 relative z-20">
                <div className="absolute inset-0 bg-amber-500/30 blur-md rounded-full scale-125" />
                <div className="w-14 h-14 rounded-full bg-slate-950/80 backdrop-blur-md border-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10">
                  {isUpcoming ? (
                    <span className="font-black text-[18px] italic tracking-tighter text-amber-500 drop-shadow-md">VS</span>
                  ) : (
                    <span className="font-black text-[20px] tracking-tighter text-white drop-shadow-md">
                      {match.goals.home ?? 0}<span className="text-amber-500 mx-0.5">-</span>{match.goals.away ?? 0}
                    </span>
                  )}
                </div>
             </div>

             <div className="flex flex-col items-center gap-2 flex-1 z-10 group-hover:translate-x-1 transition-transform duration-500">
               <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] object-contain" />
               <span className={cn("font-black text-[14px] tracking-widest uppercase text-center leading-tight line-clamp-2", match.teams.away.winner ? "text-amber-500 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" : "text-white/95")}>
                 {match.teams.away.name}
               </span>
             </div>
          </div>
        ) : (
          /* Regular Layout */
          <div className="flex flex-col gap-5">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="md" className="w-12 h-12" />
                <span className={cn("font-bold text-[17px] tracking-tight", match.teams.home.winner ? "text-foreground" : "text-foreground/70")}>
                  {match.teams.home.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="font-black text-[22px] tracking-tight text-foreground">
                   {isUpcoming ? '-' : match.goals.home ?? 0}
                 </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="md" className="w-12 h-12" />
                <span className={cn("font-bold text-[17px] tracking-tight", match.teams.away.winner ? "text-foreground" : "text-foreground/70")}>
                  {match.teams.away.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="font-black text-[22px] tracking-tight text-foreground">
                   {isUpcoming ? '-' : match.goals.away ?? 0}
                 </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Match Status Summary */}
      <div className={cn("mt-4 pt-2 flex flex-col gap-2 relative z-10", isWorldCup ? "px-1" : "border-t border-border/50")}>
        <div className={cn("flex items-center gap-4 text-[9px] uppercase tracking-widest font-bold", isWorldCup ? "text-white/60 justify-between" : "text-muted-foreground/60")}>
          <div className="flex items-center gap-2 truncate">
            <MapPin size={14} className={isWorldCup ? "text-emerald-400" : ""} />
            <span className="truncate">{match.fixture.venue.name || "Venue"}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock size={14} className={isWorldCup ? "text-amber-400" : ""} />
            <span>{formatToIST(new Date(match.fixture.date), 'short')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
