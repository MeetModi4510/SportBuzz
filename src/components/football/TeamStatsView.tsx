import React from 'react';
import { AlertCircle } from 'lucide-react';

export function TeamStatsView({ data }: { data: any }) {
  const teamStats = data?.stats?.teams || [];

  if (teamStats.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">No Team Stats Available</h3>
        <p className="text-muted-foreground text-sm font-medium">Team statistics are currently unavailable for this team.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-12 mt-4">
      {teamStats.map((statCategory: any, idx: number) => (
        <div key={idx} className="bg-card border border-border/40 rounded-[2rem] p-6 relative group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgb(var(--primary),0.1)] flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            {statCategory.header.toLowerCase() === 'fotmob rating' ? 'Average Rating' : statCategory.header}
          </h3>
          
          <div className="space-y-2 flex-1">
            {statCategory.topThree?.map((team: any, index: number) => (
              <div key={team.teamId || index} className={`flex items-center gap-4 group/item hover:bg-foreground/5 p-3 rounded-2xl transition-colors ${team.teamId === statCategory.participant?.teamId ? 'bg-primary/5 border border-primary/20' : ''}`}>
                <div className={`w-8 font-black text-lg text-center ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-amber-700'}`}>
                  #{team.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-background overflow-hidden relative border border-border flex items-center justify-center shrink-0">
                  <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.teamId}.png`} className="w-full h-full object-contain p-1 z-10" onError={(e) => e.currentTarget.style.display = 'none'} alt={team.name} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{team.name}</h4>
                </div>
                <div className="text-xl font-black text-foreground ml-2">
                  {team.value}
                </div>
              </div>
            ))}
          </div>

          {/* If the current team is not in top 3, show their rank below */}
          {statCategory.participant && !statCategory.topThree?.find((t:any) => t.teamId === statCategory.participant.teamId) && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-4 bg-primary/10 border border-primary/30 p-3 rounded-2xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Current Team
                </div>
                <div className="w-8 font-black text-lg text-center text-primary">
                  #{statCategory.participant.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-background overflow-hidden relative border border-border flex items-center justify-center shrink-0">
                  <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${statCategory.participant.teamId}.png`} className="w-full h-full object-contain p-1 z-10" onError={(e) => e.currentTarget.style.display = 'none'} alt={statCategory.participant.name} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{statCategory.participant.name}</h4>
                </div>
                <div className="text-xl font-black text-primary ml-2">
                  {statCategory.participant.value}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
