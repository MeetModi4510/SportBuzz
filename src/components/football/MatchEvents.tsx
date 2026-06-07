import { FootballEvent, FootballTeam } from "../../types/football";
import { Activity, Play, ArrowUp, ArrowDown, ArrowRightLeft } from "lucide-react";

interface MatchEventsProps {
  events: FootballEvent[];
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
}

const renderEventIcon = (type: string, detail: string) => {
  const t = type.toLowerCase();
  if (t === "goal") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="w-4 h-4 text-foreground">
        <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2"/>
        <path d="M12 12l2.5-2h-5z" />
        <path d="M14.5 10l3-5-5-1-3 4" fill="none" />
        <path d="M9.5 10l-3-5 5-1 3 4" fill="none" />
        <path d="M12 12v5l-4 3 1-5" fill="none" />
        <path d="M12 12v5l4 3-1-5" fill="none" />
      </svg>
    );
  }
  if (t === "card") {
    const isRed = detail.toLowerCase().includes("red");
    return (
      <div className={`w-3.5 h-4.5 rounded-[2px] shadow-sm ${isRed ? 'bg-red-500 border border-red-600' : 'bg-yellow-400 border border-yellow-500'}`} />
    );
  }
  if (t === "subst") {
    return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
  }
  return <Activity className="w-4 h-4 text-muted-foreground" />;
};

const getEventStyle = (type: string, detail: string) => {
  // Use a unified, minimalistic glassmorphic style without radiant colors
  return "border-border/30 bg-secondary/10 hover:bg-secondary/20 shadow-sm";
};

const getIconColor = (type: string, detail: string) => {
  const t = type.toLowerCase();
  if (t === "goal") return "text-primary bg-primary/10";
  if (t === "card") {
    return detail.toLowerCase().includes("red") 
      ? "text-red-500 bg-red-500/10" 
      : "text-yellow-500 bg-yellow-500/10";
  }
  if (t === "subst") return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-secondary/50";
};

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
          const rowDirectionClass = isHome ? 'flex-row md:flex-row-reverse' : 'flex-row';

          return (
            <div key={idx} className="relative flex items-center w-full">
              {/* Timeline Dot */}
              <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-background border-[3px] border-primary rounded-full -translate-x-1/2 z-10 flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary),0.5)]" />

              {/* Event Content Container */}
              <div className={`w-full flex ${isHome ? 'md:justify-start' : 'md:justify-end'}`}>
                {/* Event Box Wrapper */}
                <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] ml-14 md:ml-0 ${isHome ? 'md:mr-6' : 'md:ml-6'}`}>
                  
                  <div className={`transition-all duration-300 p-4 rounded-xl backdrop-blur-md border ${getEventStyle(event.type, event.detail)}`}>
                    
                    <div className={`flex items-center gap-4 ${rowDirectionClass}`}>
                      
                      {/* Icon & Time Column */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-border/40 ${getIconColor(event.type, event.detail)}`}>
                          {renderEventIcon(event.type, event.detail)}
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tighter">
                          {event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ''}
                        </span>
                      </div>

                      {/* Details Column */}
                      <div className={`flex flex-col flex-1 justify-center py-1 ${isHome ? 'text-left md:text-right' : 'text-left'}`}>
                        {event.type.toLowerCase() === "subst" ? (
                          <div className="space-y-1.5">
                            {event.assist.name && (
                              <div className={`flex items-center gap-2 ${isHome ? 'md:justify-end' : ''}`}>
                                <ArrowUp className="w-4 h-4 text-green-500" />
                                <span className="font-bold text-foreground text-sm md:text-base leading-tight">IN: {event.assist.name}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 ${isHome ? 'md:justify-end' : ''}`}>
                              <ArrowDown className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-muted-foreground text-sm leading-tight">OUT: {event.player.name}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-foreground text-base leading-tight">
                              {event.player.name}
                            </div>
                            
                            {event.assist.name && (
                              <div className={`text-sm text-muted-foreground mt-1 flex items-center gap-1.5 opacity-90 ${isHome ? 'md:justify-end' : ''}`}>
                                {isHome ? (
                                  <>
                                    <span className="md:hidden text-[10px] uppercase font-bold tracking-widest opacity-50 border border-border px-1 rounded">Assist</span> 
                                    {event.assist.name} 
                                    <span className="hidden md:inline text-[10px] uppercase font-bold tracking-widest opacity-50 border border-border px-1 rounded">Assist</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 border border-border px-1 rounded">Assist</span> {event.assist.name}
                                  </>
                                )}
                              </div>
                            )}
                            
                            <div className={`text-xs font-semibold mt-1.5 ${isHome ? 'md:text-right' : ''}`}>
                              {event.type.toLowerCase() === 'card' ? (
                                <span className={event.detail.toLowerCase().includes("red") ? "text-red-500" : "text-yellow-500"}>
                                  {event.detail} {event.comments ? `- ${event.comments}` : ''}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/70">
                                  {event.detail !== "Normal Goal" ? `${event.detail} ${event.comments ? `- ${event.comments}` : ''}` : 'Goal'}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

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
