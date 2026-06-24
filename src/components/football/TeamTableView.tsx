import React from 'react';
import { AlertCircle, Trophy } from 'lucide-react';

export function TeamTableView({ data }: { data: any }) {
  const tableData = data?.table?.[0]?.data;

  if (!tableData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">No Table Data Available</h3>
        <p className="text-muted-foreground text-sm font-medium">Standings are currently unavailable for this team.</p>
      </div>
    );
  }

  // Find the specific table/group that contains the team
  let targetTable = tableData;
  let targetLeagueName = tableData.leagueName;

  if (tableData.composite && tableData.tables) {
    const groupTable = tableData.tables.find((t: any) => 
      t.table?.all?.some((team: any) => team.id === data.details.id)
    );
    if (groupTable) {
      targetTable = groupTable;
      targetLeagueName = `${tableData.leagueName} - ${groupTable.leagueName}`;
    } else {
      // fallback to first table if team not found in any group (unlikely)
      targetTable = tableData.tables[0];
      targetLeagueName = `${tableData.leagueName} - ${targetTable.leagueName}`;
    }
  }

  const allTeams = targetTable?.table?.all || [];

  return (
    <div className="space-y-6 animate-in fade-in pb-12 mt-4">
      <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            {targetLeagueName} Standings
          </h3>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs w-12 text-center">#</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs">Team</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">PL</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">W</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">D</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">L</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">+/-</th>
                <th className="px-4 py-3 font-bold uppercase tracking-widest text-xs text-center">GD</th>
                <th className="px-4 py-3 font-black text-primary uppercase tracking-widest text-xs text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {allTeams.map((team: any) => {
                const isCurrentTeam = team.id === data.details.id;
                return (
                  <tr 
                    key={team.id} 
                    className={`border-b border-border/20 last:border-0 transition-colors hover:bg-foreground/5 ${
                      isCurrentTeam ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-center font-bold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        {team.idx}
                        {team.qualColor && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: team.qualColor }} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-background overflow-hidden relative border border-border flex items-center justify-center shrink-0">
                          <img 
                            src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`} 
                            className="w-full h-full object-contain p-0.5 z-10" 
                            onError={(e) => e.currentTarget.style.display = 'none'} 
                            alt={team.name} 
                          />
                        </div>
                        <span className={`font-bold ${isCurrentTeam ? 'text-primary' : 'text-foreground'}`}>
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.played}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.wins}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.draws}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.losses}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.scoresStr}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground font-medium">{team.goalConDiff > 0 ? `+${team.goalConDiff}` : team.goalConDiff}</td>
                    <td className="px-4 py-4 text-center font-black text-foreground">{team.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {targetTable.legend && targetTable.legend.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 px-4 pt-4 border-t border-border/40">
            {targetTable.legend.map((leg: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leg.color }} />
                {leg.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
