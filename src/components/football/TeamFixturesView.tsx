import React from 'react';
import type { FotmobTeamData } from '@/hooks/football/useFotmobTeam';

interface TeamFixturesViewProps {
  data: FotmobTeamData;
}

export function TeamFixturesView({ data }: TeamFixturesViewProps) {
  const fixtures = data.fixtures?.allFixtures?.fixtures || [];

  if (fixtures.length === 0) {
    return (
      <div className="py-24 flex items-center justify-center text-muted-foreground font-bold tracking-widest text-sm uppercase">
        No fixtures available
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {fixtures.map((fixture) => {
        const date = new Date(fixture.status.utcTime);
        const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = fixture.status.started || fixture.status.finished || fixture.status.cancelled 
          ? '' 
          : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        const isFinished = fixture.status.finished;
        const isCancelled = fixture.status.cancelled;
        const isOngoing = fixture.status.started && !fixture.status.finished;

        return (
          <div key={fixture.id} className="bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 transition-colors p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center gap-4 md:gap-8 cursor-pointer group">
            
            {/* Date / Status Block */}
            <div className="w-full md:w-32 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center border-b md:border-b-0 md:border-r border-border/40 pb-4 md:pb-0 md:pr-6 shrink-0">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{dateStr}</span>
              <span className="text-sm font-bold text-foreground mt-1">
                {isFinished ? 'FT' : isCancelled ? 'CANC' : isOngoing ? <span className="text-emerald-500 animate-pulse">LIVE</span> : timeStr}
              </span>
            </div>

            {/* Teams & Score */}
            <div className="flex-1 w-full flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex-1 flex items-center justify-end gap-3 md:gap-4">
                <span className="font-bold text-sm md:text-base text-right line-clamp-1">{fixture.home.name}</span>
                <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${fixture.home.id}.png`} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" alt={fixture.home.name} />
              </div>

              {/* Score or VS */}
              <div className="w-16 md:w-24 flex justify-center shrink-0">
                {isFinished || isOngoing ? (
                  <div className="bg-foreground/10 px-3 py-1.5 rounded-lg flex items-center gap-2 font-black text-lg">
                    <span>{fixture.home.score ?? '-'}</span>
                    <span className="text-muted-foreground text-sm">-</span>
                    <span>{fixture.away.score ?? '-'}</span>
                  </div>
                ) : (
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-foreground/5 px-3 py-1 rounded-full">VS</span>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex items-center justify-start gap-3 md:gap-4">
                <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${fixture.away.id}.png`} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" alt={fixture.away.name} />
                <span className="font-bold text-sm md:text-base text-left line-clamp-1">{fixture.away.name}</span>
              </div>
            </div>

            {/* Tournament Name (Desktop) */}
            <div className="hidden lg:block w-48 text-right">
              <span className="text-xs font-bold text-muted-foreground tracking-wide truncate max-w-full inline-block px-3 py-1 bg-foreground/5 rounded-full">
                {fixture.tournament?.name || 'Match'}
              </span>
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
