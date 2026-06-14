import { FootballLineup, FootballTeam, FootballEvent } from "../../types/football";
import { FootballTeamLogo } from "./FootballTeamLogo";
import { Users, ArrowUp, ArrowDown } from "lucide-react";
import { LineupPlayerImage } from "./LineupPlayerImage";

import { FootballMatchPlayerStat } from "../../types/football";

interface MatchLineupsProps {
  lineups: FootballLineup[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  events?: FootballEvent[];
  playerStats?: FootballMatchPlayerStat[];
}

export function MatchLineups({ lineups, homeTeam, awayTeam, events = [], playerStats = [] }: MatchLineupsProps) {
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

  // Determine if we have valid X,Y coordinates for the pitch graphic
  const hasGridData = 
    (homeLineup.startXI || []).length > 0 && (awayLineup.startXI || []).length > 0 &&
    (homeLineup.startXI || []).every(item => item.player.grid) && 
    (awayLineup.startXI || []).every(item => item.player.grid);

  const getRows = (players: any[], reverse: boolean = false, formationStr?: string) => {
    if (formationStr) {
      const counts = formationStr.match(/\d+/g)?.map(Number) || [];
      const sum = counts.reduce((a, b) => a + b, 0);
      if (sum > 0) {
         const sortedPlayers = [...players].sort((a, b) => {
           const yA = a.player.grid ? parseInt(a.player.grid.split(':')[0]) : 1;
           const yB = b.player.grid ? parseInt(b.player.grid.split(':')[0]) : 1;
           if (yA !== yB) return yA - yB;
           const xA = a.player.grid ? parseInt(a.player.grid.split(':')[1]) : 1;
           const xB = b.player.grid ? parseInt(b.player.grid.split(':')[1]) : 1;
           return xA - xB;
         });

         // Fix internal ordering for 3-4-2-1 misclassifications by API
         const formDigits = formationStr.replace(/[^\d]/g, '');
         if (formDigits === "3421" && sortedPlayers.length >= 10) {
             // ensure we have at least 10 players, mid6 is index 4 to 9
             const mid6 = sortedPlayers.slice(4, 10);
             if (mid6.length === 6) {
                 const orderedMid6 = [
                     mid6[0], mid6[2], mid6[3], mid6[5], // 4 MIDs (Wide + Central)
                     mid6[1], mid6[4] // 2 AMs (Inner)
                 ];
                 sortedPlayers.splice(4, 6, ...orderedMid6);
             }
         }

         const rows = [];
         rows.push([sortedPlayers[0]]);
         let currentIdx = 1;
         for (const count of counts) {
           rows.push(sortedPlayers.slice(currentIdx, currentIdx + count));
           currentIdx += count;
         }
         return reverse ? rows.reverse() : rows;
      }
    }

    const rows: { [key: number]: any[] } = {};
    players.forEach(item => {
      const row = item.player.grid ? parseInt(item.player.grid.split(':')[0]) : 1;
      if (!rows[row]) rows[row] = [];
      rows[row].push(item);
    });
    
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

  const awayRowsSorted = getRows(awayLineup.startXI || [], false, awayLineup.formation);
  const homeRowsSorted = getRows(homeLineup.startXI || [], true, homeLineup.formation);

  const getPlayerRating = (playerId: number) => {
    if (!playerStats || playerStats.length === 0) return null;
    for (const teamStat of playerStats) {
      const p = teamStat.players.find(p => p.player.id === playerId);
      if (p && p.statistics && p.statistics[0] && p.statistics[0].games.rating) {
        return parseFloat(p.statistics[0].games.rating).toFixed(1);
      }
    }
    return null;
  };

  const getRatingColor = (r: string) => {
    const val = parseFloat(r);
    if (val >= 8.0) return 'bg-green-500 text-white border-green-700';
    if (val >= 7.0) return 'bg-emerald-500 text-white border-emerald-700';
    if (val >= 6.0) return 'bg-yellow-500 text-white border-yellow-700';
    return 'bg-red-500 text-white border-red-700';
  };

  const renderEventIcons = (playerId: number, teamId: number) => {
    const playerEvents = events.filter(e => e.team.id === teamId && (e.player.id === playerId || (e.assist && e.assist.id === playerId)));
    
    if (playerEvents.length === 0) return null;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {playerEvents.map((e, idx) => {
          if (e.type === "Goal") {
            if (e.player.id === playerId) {
              return <span key={idx} title="Goal" className="text-xs leading-none drop-shadow-md">⚽</span>;
            } else if (e.assist && e.assist.id === playerId) {
              return <span key={idx} title="Assist" className="text-xs leading-none drop-shadow-md">👟</span>;
            }
          }
          if (e.type === "Card") {
            if (e.detail === "Yellow Card") return <div key={idx} className="w-2.5 h-3.5 bg-[#FFCC00] shadow-sm" title="Yellow Card" />;
            if (e.detail === "Red Card") return <div key={idx} className="w-2.5 h-3.5 bg-[#FF3333] shadow-sm" title="Red Card" />;
          }
          if (e.type === "subst") {
            if (e.player.id === playerId) return <span key={idx} title="Subbed Out"><ArrowDown className="w-3.5 h-3.5 text-red-500 drop-shadow-sm" /></span>;
            if (e.assist && e.assist.id === playerId) return <span key={idx} title="Subbed In"><ArrowUp className="w-3.5 h-3.5 text-green-500 drop-shadow-sm" /></span>;
          }
          return null;
        })}
      </div>
    );
  };


  const renderPlayerListRow = (item: any, teamId: number, isSub: boolean = false) => {
    const rating = getPlayerRating(item.player.id);
    const eventIcons = renderEventIcons(item.player.id, teamId);
    
    const posMap: Record<string, string> = { "G": "GK", "D": "DEF", "M": "MID", "F": "FWD" };
    const posLabel = item.player.pos ? (posMap[item.player.pos] || item.player.pos) : "";
    
    return (
      <div key={item.player.id} className="flex items-center gap-3 py-2 border-b border-border/10 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded-md">
        
        <div className="w-5 text-right shrink-0">
          <span className="text-xs font-mono font-semibold text-white/40">{item.player.number}</span>
        </div>

        <div className={`relative ${isSub ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-secondary/30 flex items-center justify-center font-bold text-xs border border-border/50 overflow-hidden shrink-0 shadow-sm`}>
          <LineupPlayerImage playerId={item.player.id} playerName={item.player.name} fallbackInitials={item.player.number?.toString()} className="absolute inset-0 z-10" />
        </div>
        
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span className="font-semibold text-[13px] md:text-sm tracking-tight text-white/90 truncate leading-tight">{item.player.name}</span>
          {posLabel && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mt-0.5">{posLabel}</span>}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {eventIcons && <div>{eventIcons}</div>}
          {rating && (
            <div className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded shadow-sm min-w-[28px] text-center ${getRatingColor(rating)}`}>
              {rating}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlayer = (item: any, isHome: boolean) => {
    const rating = getPlayerRating(item.player.id);
    const teamId = isHome ? homeTeam.id : awayTeam.id;
    const eventIcons = renderEventIcons(item.player.id, teamId);

    return (
      <div key={item.player.id} className="flex flex-col items-center justify-center w-16 md:w-20 group z-10 transition-transform hover:scale-110 relative">
        {eventIcons && (
          <div className="mb-0.5 bg-black/60 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10 scale-90 z-30">
            {eventIcons}
          </div>
        )}
        <div className="relative">
          <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold font-display shadow-xl border-[3px] overflow-hidden ${isHome ? 'bg-blue-600 text-white border-blue-400/80' : 'bg-red-600 text-white border-red-400/80'}`}>
            <span className="absolute z-0">{item.player.number}</span>
            <LineupPlayerImage playerId={item.player.id} playerName={item.player.name} className="absolute inset-0 z-10" />
          </div>
          {rating && (
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-sm border shadow-lg z-20 ${getRatingColor(rating)}`}>
              {rating}
            </div>
          )}
        </div>
        <div className="mt-3 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] md:text-xs text-white font-medium text-center truncate w-full shadow-md z-20">
          {item.player.name.split(' ').pop()}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 space-y-8">
      
      {/* Unified Pitch Card */}
      <div className="rounded-2xl overflow-hidden border border-border/30 shadow-2xl bg-background flex flex-col">
        
        {/* Away Team Header (Top) */}
        <div className="flex justify-between items-center bg-secondary/20 p-4 px-6 border-b border-border/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center p-1 border border-border/30 shadow-sm">
              <FootballTeamLogo logo={awayTeam.logo} name={awayTeam.name} size="sm" />
            </div>
            <h3 className="font-bold text-sm md:text-base leading-tight text-foreground">{awayTeam.name}</h3>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase font-bold bg-background/60 px-3 py-1 rounded-full border border-border/40 shadow-sm">
            {awayLineup.formation}
          </span>
        </div>

        {/* The Pitch (Only show if we have coordinate data) */}
        {hasGridData ? (
          <div className="relative w-full aspect-[2/3] md:aspect-[3/4] bg-green-800 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] border-y-4 border-green-900/80 shadow-inner">
            {/* Pitch Markings */}
            <div className="absolute inset-0 border-[3px] border-white/30 m-4 md:m-6 rounded-sm" />
            <div className="absolute top-1/2 left-4 right-4 md:left-6 md:right-6 h-0 border-t-[3px] border-white/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-[3px] border-white/30 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full" />
            
            {/* Penalty Areas */}
            <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 w-48 md:w-64 h-24 border-[3px] border-white/30 border-t-0" />
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-48 md:w-64 h-24 border-[3px] border-white/30 border-b-0" />
            
            {/* Goal Areas */}
            <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 w-20 md:w-28 h-8 md:h-10 border-[3px] border-white/30 border-t-0" />
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-20 md:w-28 h-8 md:h-10 border-[3px] border-white/30 border-b-0" />

            {/* Players Container */}
            <div className="absolute inset-0 flex flex-col m-4 md:m-6 py-4 md:py-8">
              {/* Away Team (Top Half) */}
              <div className="flex-1 flex flex-col justify-between">
                {awayRowsSorted.map((row, idx) => (
                  <div key={`away-row-${idx}`} className="flex justify-around items-center w-full">
                    {row.map(item => renderPlayer(item, false))}
                  </div>
                ))}
              </div>

              {/* Spacer between halves */}
              <div className="h-16" />

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-secondary/5">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-2">Starting XI</h4>
              <div className="flex flex-col">
                {(homeLineup.startXI || []).map(item => renderPlayerListRow(item, homeTeam.id, false))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-2 md:text-right">Starting XI</h4>
              <div className="flex flex-col">
                {(awayLineup.startXI || []).map(item => renderPlayerListRow(item, awayTeam.id, false))}
              </div>
            </div>
          </div>
        )}

        {/* Home Team Header (Bottom) */}
        <div className="flex justify-between items-center bg-secondary/20 p-4 px-6 border-t border-border/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center p-1 border border-border/30 shadow-sm">
              <FootballTeamLogo logo={homeTeam.logo} name={homeTeam.name} size="sm" />
            </div>
            <h3 className="font-bold text-sm md:text-base leading-tight text-foreground">{homeTeam.name}</h3>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase font-bold bg-background/60 px-3 py-1 rounded-full border border-border/40 shadow-sm">
            {homeLineup.formation}
          </span>
        </div>
      </div>
      {/* Substitutes & Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 items-stretch">
        {/* Home Subs */}
        <div className="flex flex-col h-full space-y-6">
          <div className="flex-1 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Substitutes</h4>
            <div className="flex flex-col">
              {(homeLineup.substitutes || []).map(item => renderPlayerListRow(item, homeTeam.id, true))}
              {!(homeLineup.substitutes && homeLineup.substitutes.length > 0) && (
                <p className="text-xs text-muted-foreground italic py-2">No substitute data available.</p>
              )}
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
            <h4 className="font-bold text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2 md:text-right">Substitutes</h4>
            <div className="flex flex-col">
              {(awayLineup.substitutes || []).map(item => renderPlayerListRow(item, awayTeam.id, true))}
              {!(awayLineup.substitutes && awayLineup.substitutes.length > 0) && (
                <p className="text-xs text-muted-foreground italic py-2 md:text-right">No substitute data available.</p>
              )}
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
