import React from 'react';
import { AlertCircle, ChevronDown, Trophy } from 'lucide-react';

export function TeamTrophiesView({ data }: { data: any }) {
  const trophyList = data?.history?.trophyList || [];

  if (trophyList.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
          <Trophy className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-black text-foreground tracking-tight">No Trophies Available</h3>
        <p className="text-muted-foreground text-sm font-medium">Trophy history is currently unavailable for this team.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 mt-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Trophy Cabinet</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trophyList.map((trophy: any, idx: number) => {
          const templateId = trophy.tournamentTemplateId?.[0];
          const logoUrl = templateId && templateId !== "-1" 
            ? `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${templateId}.png`
            : `https://images.fotmob.com/image_resources/logo/leaguelogo/${templateId}.png`;

          const wonCount = parseInt(trophy.won?.[0] || '0');
          const runnerUpCount = parseInt(trophy.runnerup?.[0] || '0');
          
          const latestWin = trophy.season_won?.[0]?.split(',')[0] || '';
          const latestRunnerUp = trophy.season_runnerup?.[0]?.split(',')[0] || '';

          return (
            <div key={idx} className="bg-card border border-border/40 rounded-3xl p-6 relative group hover:border-amber-500/30 transition-all duration-500 shadow-sm hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col">
              
              {/* Background Glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-colors duration-500 pointer-events-none" />
              
              {/* Top Section: Logo & Name */}
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="w-20 h-20 mb-5 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center">
                  <img 
                    src={logoUrl} 
                    alt={trophy.name?.[0]} 
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight leading-tight line-clamp-2 min-h-[3rem] flex items-center justify-center">
                  {trophy.name?.[0]}
                </h3>
              </div>

              {/* Stats Section */}
              <div className="flex gap-3 mt-auto relative z-10">
                {/* Winner Card */}
                <div className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center border transition-colors ${
                  wonCount > 0 
                    ? 'bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40' 
                    : 'bg-foreground/5 border-border/30 opacity-50'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${wonCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    Winner
                  </span>
                  <span className={`text-3xl font-black ${wonCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {wonCount}
                  </span>
                  {wonCount > 0 && latestWin && (
                    <span className="text-[10px] text-muted-foreground mt-1 text-center font-medium line-clamp-1 truncate w-full px-1">
                      {latestWin}
                    </span>
                  )}
                </div>

                {/* Runner-up Card */}
                <div className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center border transition-colors ${
                  runnerUpCount > 0 
                    ? 'bg-slate-400/10 border-slate-400/20 group-hover:border-slate-400/40' 
                    : 'bg-foreground/5 border-border/30 opacity-50'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${runnerUpCount > 0 ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    Runner-up
                  </span>
                  <span className={`text-3xl font-black ${runnerUpCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {runnerUpCount}
                  </span>
                  {runnerUpCount > 0 && latestRunnerUp && (
                    <span className="text-[10px] text-muted-foreground mt-1 text-center font-medium line-clamp-1 truncate w-full px-1">
                      {latestRunnerUp}
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
