import { FootballEvent, FootballTeam } from "../../types/football";
import { Activity, Play } from "lucide-react";

interface MatchEventsProps {
  events: FootballEvent[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
}

export function MatchEvents({ events, homeTeam, awayTeam }: MatchEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-secondary/10 rounded-xl border border-border/30">
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <p>No events available yet.</p>
      </div>
    );
  }

  // Sort events by elapsed time
  const sortedEvents = [...events].sort((a, b) => {
    if (a.time.elapsed !== b.time.elapsed) return a.time.elapsed - b.time.elapsed;
    return (a.time.extra || 0) - (b.time.extra || 0);
  });

  return (
    <div className="max-w-2xl mx-auto relative py-8">
      {/* Central Timeline Line */}
      <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-[2px] bg-border/40 -translate-x-1/2" />
      
      <div className="space-y-8">
        {sortedEvents.map((event, idx) => {
          const isHome = event.team.id === homeTeam.id;

          return (
            <div key={idx} className="relative flex items-center w-full">
              {/* Timeline Dot */}
              <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-background border-[3px] border-primary rounded-full -translate-x-1/2 z-10" />

              {/* Event Content Container */}
              <div className={`w-full flex ${isHome ? 'md:justify-start' : 'md:justify-end'}`}>
                {/* Event Box Wrapper */}
                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] ml-16 md:ml-0 ${isHome ? 'md:mr-8 text-left md:text-right' : 'md:ml-8 text-left'}`}>
                  
                  <div className="bg-secondary/20 hover:bg-secondary/30 transition-colors border border-border/40 p-4 rounded-xl shadow-sm">
                    <div className={`flex items-center gap-3 mb-2 ${isHome ? 'md:justify-end' : ''}`}>
                      <span className="font-extrabold text-primary text-sm">
                        {event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ''}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background border border-border/50 px-2.5 py-1 rounded-md">
                        {event.type}
                      </span>
                    </div>
                    
                    <div className="font-semibold text-foreground text-base">
                      {event.player.name}
                    </div>
                    
                    {event.assist.name && (
                      <div className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 opacity-90">
                        {isHome ? (
                          <>
                            <span className="md:hidden">Assist:</span> {event.assist.name} <span className="hidden md:inline text-[10px] uppercase font-bold tracking-widest opacity-50 border border-border px-1 rounded">Assist</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 border border-border px-1 rounded">Assist</span> {event.assist.name}
                          </>
                        )}
                      </div>
                    )}
                    
                    {event.detail && event.detail !== "Normal Goal" && (
                      <div className="text-xs text-muted-foreground/70 mt-2 font-medium">
                        {event.detail} {event.comments ? `- ${event.comments}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Match End Marker */}
        <div className="relative flex w-full">
          <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-8 h-8 bg-background rounded-full flex items-center justify-center border-2 border-border/40 text-muted-foreground z-10 shadow-sm">
            <Play className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
