import React from 'react';
import { AlertCircle } from 'lucide-react';

export function TeamPlayerStatsView({ data }: { data: any }) {
  const playerStats = data?.stats?.players || [];

  if (playerStats.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">No Player Stats Available</h3>
        <p className="text-muted-foreground text-sm font-medium">Player statistics are currently unavailable for this team.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-12 mt-4">
      {playerStats.map((statCategory: any, idx: number) => (
        <div key={idx} className="bg-card border border-border/40 rounded-[2rem] p-6 relative group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgb(var(--primary),0.1)]">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            {statCategory.header}
          </h3>
          
          <div className="space-y-2">
            {statCategory.topThree?.map((player: any, index: number) => (
              <div key={player.id || index} className="flex items-center gap-4 group/item hover:bg-foreground/5 p-3 rounded-2xl transition-colors">
                <div className={`w-8 font-black text-lg text-center ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-amber-700'}`}>
                  #{index + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-background overflow-hidden relative border-2 border-border flex items-center justify-center shrink-0">
                  <img src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`} className="w-full h-full object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} alt={player.name} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{player.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{player.teamName || player.ccode}</p>
                </div>
                <div className="text-xl font-black text-foreground ml-2">
                  {player.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
