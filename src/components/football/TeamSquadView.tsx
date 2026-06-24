import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FotmobTeamData } from '@/hooks/football/useFotmobTeam';

interface TeamSquadViewProps {
  data: FotmobTeamData;
}

export function TeamSquadView({ data }: TeamSquadViewProps) {
  const navigate = useNavigate();
  const squadGroups = data.squad?.squad || [];

  const handlePlayerClick = (player: any) => {
    navigate('/performance-lab', { 
      state: { 
        targetPlayerId: player.id.toString(),
        targetPlayerName: player.name, 
        targetTeamName: data.details.name,
        targetTab: 'players', 
        targetSport: 'football' 
      } 
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      {squadGroups.map((group, index) => (
        <div key={index} className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-4">
            <span>{group.title}</span>
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-xs bg-foreground/5 px-2 py-0.5 rounded-full">{group.members.length}</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {group.members.map((player: any) => (
              <div 
                key={player.id} 
                onClick={() => handlePlayerClick(player)}
                className="bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 transition-all duration-300 p-4 rounded-3xl flex flex-col items-center gap-3 group relative overflow-hidden text-center cursor-pointer"
              >
                {/* Fallback pattern background */}
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-10 transition-opacity bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background" />
                
                <div className="relative w-20 h-20 rounded-full bg-foreground/5 border-2 border-border/50 group-hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center shrink-0">
                  <img 
                    src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`} 
                    alt={player.name}
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* Fallback avatar if image fails */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-black text-2xl">
                    {player.name.charAt(0)}
                  </div>
                </div>
                
                <div className="relative z-10 w-full">
                  <h4 className="font-bold text-sm text-foreground truncate">{player.name}</h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground w-full px-2">
                    {player.cname && player.ccode && (
                      <img 
                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${player.ccode}.png`} 
                        alt={player.cname} 
                        className="w-3.5 h-3.5 object-contain shrink-0" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {player.cname && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider truncate text-center">
                        {player.cname}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
