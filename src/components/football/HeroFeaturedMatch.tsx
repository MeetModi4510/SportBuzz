import { FootballMatch } from "../../types/football";
import { PlayCircle, CalendarDays, MapPin } from "lucide-react";
import { FootballTeamLogo } from "./FootballTeamLogo";
import { useNavigate } from "react-router-dom";

interface HeroFeaturedMatchProps {
  match?: FootballMatch;
}

export function HeroFeaturedMatch({ match }: HeroFeaturedMatchProps) {
  const navigate = useNavigate();

  if (!match) return null;

  const isLive = match.fixture.status.short === '1H' || match.fixture.status.short === '2H' || match.fixture.status.short === 'HT';
  
  return (
    <div 
      onClick={() => navigate(`/football/match/${match.fixture.id}`)}
      className="relative w-full h-[350px] md:h-[450px] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl mb-12 border border-border/20"
    >
      {/* Background with abstract dark glow */}
      <div className="absolute inset-0 bg-secondary/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10 opacity-90" />
      
      {/* Subtle abstract pattern/grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} 
      />

      {/* Glow Behind Teams */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />

      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 z-10">
        
        {/* Top bar: League info & Status */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-3 bg-background/60 backdrop-blur-md px-4 py-2 rounded-full border border-border/30 shadow-sm">
            <img src={match.league.logo} alt={match.league.name} className="w-5 h-5 object-contain drop-shadow-md" />
            <span className="font-bold text-xs tracking-wider uppercase text-foreground/80">{match.league.name}</span>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border shadow-sm ${isLive ? 'bg-primary/20 text-primary border-primary/50 animate-pulse' : 'bg-background/60 text-muted-foreground border-border/30'}`}>
            {isLive ? 'Live Now' : match.fixture.status.short}
          </div>
        </div>

        {/* Center: Teams & Score */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 w-full my-auto">
          
          {/* Home Team */}
          <div className="flex flex-col items-center gap-5 flex-1 max-w-[200px]">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-background/40 backdrop-blur-md rounded-full p-4 border border-border/30 shadow-xl group-hover:scale-110 transition-transform duration-700">
              <FootballTeamLogo logo={match.teams.home.logo} name={match.teams.home.name} size="lg" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-center drop-shadow-md leading-tight">
              {match.teams.home.name}
            </h2>
          </div>

          {/* Score or VS */}
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            {isLive || ['FT', 'AET', 'PEN'].includes(match.fixture.status.short) ? (
              <div className="flex items-center justify-center gap-4 text-5xl md:text-7xl font-black tracking-tighter drop-shadow-xl tabular-nums">
                <span>{match.goals.home ?? 0}</span>
                <span className="text-muted-foreground/30 text-3xl md:text-5xl font-light">-</span>
                <span>{match.goals.away ?? 0}</span>
              </div>
            ) : (
              <div className="text-3xl md:text-5xl font-black text-muted-foreground/30 italic tracking-tighter">
                VS
              </div>
            )}
            {isLive && match.fixture.status.elapsed && (
              <span className="text-primary font-bold text-lg mt-3 animate-pulse bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                {match.fixture.status.elapsed}'
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-5 flex-1 max-w-[200px]">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-background/40 backdrop-blur-md rounded-full p-4 border border-border/30 shadow-xl group-hover:scale-110 transition-transform duration-700">
              <FootballTeamLogo logo={match.teams.away.logo} name={match.teams.away.name} size="lg" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-center drop-shadow-md leading-tight">
              {match.teams.away.name}
            </h2>
          </div>

        </div>

        {/* Bottom bar: Venue & Time */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full text-xs font-semibold text-muted-foreground/70 mt-auto bg-background/30 backdrop-blur-sm p-3 rounded-2xl border border-border/20">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary/70" />
            <span>{match.fixture.venue.name || 'TBD'}, {match.fixture.venue.city || 'TBD'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-primary/70" />
            <span>{new Date(match.fixture.date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
