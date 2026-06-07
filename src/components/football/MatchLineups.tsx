import { FootballLineup, FootballTeam, FootballEvent } from "../../types/football";
import { TeamLogo } from "../TeamLogo";
import { Users, ArrowUp, ArrowDown } from "lucide-react";

interface MatchLineupsProps {
  lineups: FootballLineup[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  events?: FootballEvent[];
}

export function MatchLineups({ lineups, homeTeam, awayTeam, events = [] }: MatchLineupsProps) {
  if (!lineups || lineups.length !== 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/10 rounded-xl border border-border/30">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Lineups not available yet.</p>
      </div>
    );
  }

  const homeLineup = lineups.find(l => l.team.id === homeTeam.id);
  const awayLineup = lineups.find(l => l.team.id === awayTeam.id);

  if (!homeLineup || !awayLineup) return null;

  // Helper to group players by row
  const getRows = (players: any[], reverse: boolean = false) => {
    const rows: { [key: number]: any[] } = {};
    players.forEach(item => {
      const row = item.player.grid ? parseInt(item.player.grid.split(':')[0]) : 1;
      if (!rows[row]) rows[row] = [];
      rows[row].push(item);
    });
    
    // Sort players in each row by column
    Object.keys(rows).forEach(row => {
      rows[parseInt(row)].sort((a, b) => {
        const colA = a.player.grid ? parseInt(a.player.grid.split(':')[1]) : 1;
        const colB = b.player.grid ? parseInt(b.player.grid.split(':')[1]) : 1;
        return colA - colB;
      });
    });

    const sortedRowKeys = Object.keys(rows).map(Number).sort((a, b) => reverse ? b - a : a - b);
    return sortedRowKeys.map(key => rows[key]);
  };

  const awayRows = getRows(awayLineup.startXI, true); // Goalkeeper at the top
  const homeRows = getRows(homeLineup.startXI, false); // Goalkeeper at the bottom (Wait, if reverse is false, row 1 is first. So row 1 is top? We want away row 1 at top, home row 1 at bottom. So away is false (1,2,3,4) -> GK at top. Home is true (4,3,2,1) -> GK at bottom.)
  // Let's adjust:
  // Away Team: GK (1) at Top. So rows 1, 2, 3, 4. (reverse: false)
  // Home Team: GK (1) at Bottom. So rows 4, 3, 2, 1. (reverse: true)
  
  const awayRowsSorted = getRows(awayLineup.startXI, false);
  const homeRowsSorted = getRows(homeLineup.startXI, true);

  const renderPlayer = (item: any, isHome: boolean) => (
    <div key={item.player.id} className="flex flex-col items-center justify-center w-16 md:w-20 group z-10 transition-transform hover:scale-110">
      <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold font-display shadow-xl border-[3px] overflow-hidden ${isHome ? 'bg-blue-600 text-white border-blue-400/80' : 'bg-red-600 text-white border-red-400/80'}`}>
        <span className="absolute z-0">{item.player.number}</span>
        {item.player.id && (
          <img 
            src={`https://media.api-sports.io/football/players/${item.player.id}.png`} 
            alt={item.player.name}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] md:text-xs text-white font-medium text-center truncate w-full shadow-md z-20">
        {item.player.name.split(' ').pop()}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300 space-y-8">
      
      {/* Away Team Header (Top) */}
      <div className="flex justify-center items-center bg-secondary/20 p-3 rounded-xl border border-border/40 max-w-[200px] mx-auto shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="sm" />
          <div className="text-left">
            <h3 className="font-bold text-sm md:text-base leading-tight">{awayTeam.name}</h3>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">{awayLineup.formation}</p>
          </div>
        </div>
      </div>
      {/* The Pitch */}
      <div className="relative w-full aspect-[2/3] md:aspect-[3/4] max-w-2xl mx-auto rounded-lg overflow-hidden shadow-2xl border-4 border-green-900 bg-green-700 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">
        {/* Pitch Markings */}
        <div className="absolute inset-0 border-[3px] border-white/30 m-4 rounded-sm" />
        <div className="absolute top-1/2 left-4 right-4 h-0 border-t-[3px] border-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-[3px] border-white/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full" />
        
        {/* Penalty Areas */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-24 border-[3px] border-white/30 border-t-0" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-24 border-[3px] border-white/30 border-b-0" />
        
        {/* Goal Areas */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-8 border-[3px] border-white/30 border-t-0" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-8 border-[3px] border-white/30 border-b-0" />

        {/* Players Container */}
        <div className="absolute inset-0 flex flex-col m-4 py-4">
          {/* Away Team (Top Half) */}
          <div className="flex-1 flex flex-col justify-between">
            {awayRowsSorted.map((row, idx) => (
              <div key={`away-row-${idx}`} className="flex justify-around items-center w-full">
                {row.map(item => renderPlayer(item, false))}
              </div>
            ))}
          </div>

          {/* Spacer between halves */}
          <div className="h-12" />

          {/* Home Team (Bottom Half) */}
          <div className="flex-1 flex flex-col justify-between">
            {homeRowsSorted.map((row, idx) => (
              <div key={`home-row-${idx}`} className="flex justify-around items-center w-full">
                {row.map(item => renderPlayer(item, true))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Home Team Header (Bottom) */}
      <div className="flex justify-center items-center bg-secondary/20 p-3 rounded-xl border border-border/40 max-w-[200px] mx-auto shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="sm" />
          <div className="text-left">
            <h3 className="font-bold text-sm md:text-base leading-tight">{homeTeam.name}</h3>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-bold">{homeLineup.formation}</p>
          </div>
        </div>
      </div>
      {/* Substitutes & Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 items-stretch">
        {/* Home Subs */}
        <div className="flex flex-col h-full space-y-6">
          <div className="flex-1 space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">Substitutes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {homeLineup.substitutes.map((item, idx) => {
                const isSubbedIn = events.some(e => e.type.toLowerCase() === "subst" && e.team.id === homeTeam.id && (e.player.id === item.player.id || e.assist.id === item.player.id));
                return (
                  <div key={idx} className="flex items-center gap-3 bg-secondary/10 p-2 rounded-lg border border-border/20">
                    <div className="relative w-7 h-7 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 overflow-hidden">
                      <span className="text-[10px] font-bold opacity-70 absolute z-0">{item.player.number}</span>
                      {item.player.id && (
                        <img 
                          src={`https://media.api-sports.io/football/players/${item.player.id}.png`} 
                          alt={item.player.name}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <p className="font-medium text-xs flex-1 opacity-90 truncate">{item.player.name}</p>
                    {isSubbedIn && <ArrowUp className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 flex items-center gap-4 mt-auto">
             <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 shrink-0 overflow-hidden">
               {homeLineup.coach?.photo ? (
                 <img src={homeLineup.coach.photo} alt={homeLineup.coach.name} className="w-full h-full object-cover" />
               ) : (
                 <Users className="w-6 h-6 text-primary" />
               )}
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Manager</p>
               <p className="font-medium text-sm">{homeLineup.coach?.name || 'Unknown'}</p>
             </div>
          </div>
        </div>

        {/* Away Subs */}
        <div className="flex flex-col h-full space-y-6">
          <div className="flex-1 space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 md:text-right">Substitutes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {awayLineup.substitutes.map((item, idx) => {
                const isSubbedIn = events.some(e => e.type.toLowerCase() === "subst" && e.team.id === awayTeam.id && (e.player.id === item.player.id || e.assist.id === item.player.id));
                return (
                  <div key={idx} className="flex items-center gap-3 bg-secondary/10 p-2 rounded-lg border border-border/20 md:flex-row-reverse md:text-right">
                    <div className="relative w-7 h-7 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 overflow-hidden">
                      <span className="text-[10px] font-bold opacity-70 absolute z-0">{item.player.number}</span>
                      {item.player.id && (
                        <img 
                          src={`https://media.api-sports.io/football/players/${item.player.id}.png`} 
                          alt={item.player.name}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <p className="font-medium text-xs flex-1 opacity-90 truncate">{item.player.name}</p>
                    {isSubbedIn && <ArrowUp className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 flex items-center gap-4 md:flex-row-reverse md:text-right mt-auto">
             <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 shrink-0 overflow-hidden">
               {awayLineup.coach?.photo ? (
                 <img src={awayLineup.coach.photo} alt={awayLineup.coach.name} className="w-full h-full object-cover" />
               ) : (
                 <Users className="w-6 h-6 text-primary" />
               )}
             </div>
             <div>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Manager</p>
               <p className="font-medium text-sm">{awayLineup.coach?.name || 'Unknown'}</p>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
