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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative border-l-2 border-border/40 ml-4 md:ml-[50%]">
        {sortedEvents.map((event, idx) => {
          const isHome = event.team.id === homeTeam.id;

          return (
            <div key={idx} className={`relative flex items-center mb-8 ${isHome ? 'md:flex-row-reverse md:mr-[50%] md:pr-8' : 'md:ml-0 md:pl-8'} pl-8`}>
              {/* Timeline dot */}
              <div className="absolute w-4 h-4 bg-background border-2 border-primary rounded-full left-[-9px] md:left-auto md:right-[-9px]" style={isHome ? { right: '-9px', left: 'auto' } : {}} />

              {/* Event Content */}
              <div className={`bg-secondary/20 border border-border/40 p-4 rounded-xl flex-1 ${isHome ? 'md:text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isHome ? 'md:justify-end' : ''}`}>
                  <span className="font-bold text-primary">{event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ''}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {event.type}
                  </span>
                </div>
                <div className="font-medium text-foreground">
                  {event.player.name}
                </div>
                {event.assist.name && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Assist: {event.assist.name}
                  </div>
                )}
                {event.detail && event.detail !== "Normal Goal" && (
                  <div className="text-xs opacity-70 mt-1">
                    {event.detail} {event.comments ? `- ${event.comments}` : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Match End Marker */}
        <div className="relative flex items-center pl-8 md:pl-0 md:justify-center mt-8">
          <div className="absolute md:relative left-[-16px] md:left-auto w-8 h-8 bg-secondary rounded-full flex items-center justify-center border border-border/40 text-muted-foreground">
            <Play className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
