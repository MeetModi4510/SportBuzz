import React from 'react';
import { Trophy, Star, MapPin, Users, Target, Activity, Clock, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import type { FotmobTeamData } from '@/hooks/football/useFotmobTeam';

interface TeamOverviewDashboardProps {
  data: FotmobTeamData;
}

export function TeamOverviewDashboard({ data }: TeamOverviewDashboardProps) {
  const { overview } = data;
  
  const topRated = overview.topPlayers?.byRating?.players?.[0];
  const topGoalScorer = overview.topPlayers?.byGoals?.players?.[0];
  const topAssister = overview.topPlayers?.byAssists?.players?.[0];
  
  // Convert teamForm to array for timeline
  const formArray = overview.teamForm ? Object.values(overview.teamForm) : [];
  
  // Coach History is an array, get the most recent coach
  const currentCoach = Array.isArray(overview.coachHistory) && overview.coachHistory.length > 0 
    ? overview.coachHistory[overview.coachHistory.length - 1] 
    : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* SECTION 1: Form & Next Match Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Form Timeline */}
        <div className="lg:col-span-7 bg-gradient-to-br from-card to-card/50 border border-border/40 p-6 md:p-8 rounded-[2rem] shadow-sm relative group">
          {/* Subtle Glow */}
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-50 transition-opacity group-hover:opacity-100" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Recent Form
            </h3>
            
            <div className="flex items-center justify-between gap-2 md:gap-4 w-full pb-4 pt-8 px-2 relative h-40">
              {/* Central Baseline */}
              <div className="absolute left-0 right-0 top-[60%] h-px bg-border/60 pointer-events-none" />
              
              {formArray.map((match: any, i) => {
                const isWin = match.result === 1;
                const isDraw = match.result === 0;
                const isLoss = match.result === -1;
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end shrink-0 group/bar cursor-pointer relative h-full w-12 z-10">
                    
                    {/* Hover Tooltip */}
                    <div className="absolute opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 bottom-full mb-2 bg-background/95 backdrop-blur-md border border-border px-4 py-2.5 rounded-2xl whitespace-nowrap z-50 pointer-events-none transition-all duration-300 flex flex-col items-center shadow-xl">
                      <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase mb-1.5">{match.tournamentName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs">{match.tooltipText?.homeTeam || match.home?.name}</span>
                        <span className="font-black text-sm text-foreground bg-foreground/5 px-2 py-0.5 rounded-md">{match.score}</span>
                        <span className="font-bold text-xs">{match.tooltipText?.awayTeam || match.away?.name}</span>
                      </div>
                    </div>

                    {/* Opposition Logo */}
                    <img 
                      src={match.imageUrl} 
                      className={`w-6 h-6 object-contain absolute z-20 transition-transform duration-300 group-hover/bar:scale-125 ${
                        isWin ? 'bottom-[calc(60%+36px)]' : 
                        isDraw ? 'bottom-[calc(60%+6px)]' : 
                        'bottom-[calc(60%+6px)]'
                      }`} 
                      alt="Opponent" 
                    />

                    {/* Bar */}
                    <div className="w-3 rounded-full relative flex items-center justify-center transition-all duration-500 ease-out overflow-hidden bg-background/5" style={{ height: '100%' }}>
                      {isWin && (
                        <div className="absolute bottom-[40%] w-full bg-gradient-to-t from-emerald-500/80 to-emerald-400 rounded-t-sm shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover/bar:brightness-110" style={{ height: '30px' }} />
                      )}
                      {isLoss && (
                        <div className="absolute top-[60%] w-full bg-gradient-to-b from-rose-500/80 to-rose-400 rounded-b-sm shadow-[0_0_10px_rgba(244,63,94,0.3)] group-hover/bar:brightness-110" style={{ height: '30px' }} />
                      )}
                      {isDraw && (
                        <div className="absolute top-[60%] -translate-y-1/2 w-full bg-slate-500/80 h-[4px] rounded-sm shadow-sm group-hover/bar:brightness-110" />
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Match Ticket */}
        {overview.nextMatch && (
          <div className="lg:col-span-5 bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" /> Next Fixture
              </h3>
              {overview.nextMatch.tournament?.name && (
                <span className="text-[10px] font-bold text-muted-foreground bg-foreground/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {overview.nextMatch.tournament.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-auto relative z-10">
              <div className="flex flex-col items-center gap-3 w-1/3">
                 <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.home.id}.png`} className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform" alt="Home" />
                 <span className="text-xs font-bold text-center line-clamp-2">{overview.nextMatch.home.name}</span>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4 w-1/3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">VS</span>
                 <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-sm text-center flex flex-col items-center gap-0.5">
                   <span className="text-xs md:text-sm font-bold text-foreground block whitespace-nowrap">
                      {new Date(overview.nextMatch.status.utcTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </span>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {new Date(overview.nextMatch.status.utcTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 w-1/3">
                 <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.away.id}.png`} className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform" alt="Away" />
                 <span className="text-xs font-bold text-center line-clamp-2">{overview.nextMatch.away.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Top Performers */}
      <div>
        <div className="flex items-center justify-between mb-6 pl-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Top Performers
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Top Scorer */}
          {topGoalScorer && (
            <div className="bg-card border border-border/40 rounded-[2rem] p-6 relative group hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)] flex flex-col items-center text-center mt-8">
              <div className="absolute -top-10">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center overflow-hidden relative">
                    <img src={`https://images.fotmob.com/image_resources/playerimages/${topGoalScorer.id}.png`} className="w-full h-full object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Target className="w-8 h-8 text-amber-500 absolute opacity-20" />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full mb-3 inline-block">Top Scorer</span>
                <h4 className="font-bold text-base text-foreground line-clamp-1 mb-1">{topGoalScorer.name}</h4>
                {topGoalScorer.teamName && (
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                    {topGoalScorer.teamName}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-black text-foreground">{topGoalScorer.value}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Goals</span>
                </div>
              </div>
            </div>
          )}

          {/* Highest Rated */}
          {topRated && (
            <div className="bg-card border border-border/40 rounded-[2rem] p-6 relative group hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(var(--primary),0.1)] flex flex-col items-center text-center mt-8 md:-translate-y-4">
              <div className="absolute -top-10">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden relative">
                    <img src={`https://images.fotmob.com/image_resources/playerimages/${topRated.id}.png`} className="w-full h-full object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Award className="w-8 h-8 text-primary absolute opacity-20" />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">Highest Rated</span>
                <h4 className="font-bold text-base text-foreground line-clamp-1 mb-1">{topRated.name}</h4>
                {topRated.teamName && (
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                    {topRated.teamName}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-black text-foreground">{topRated.value}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Avg Rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Assister */}
          {topAssister && (
            <div className="bg-card border border-border/40 rounded-[2rem] p-6 relative group hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] flex flex-col items-center text-center mt-8">
              <div className="absolute -top-10">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center overflow-hidden relative">
                    <img src={`https://images.fotmob.com/image_resources/playerimages/${topAssister.id}.png`} className="w-full h-full object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Users className="w-8 h-8 text-emerald-500 absolute opacity-20" />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full mb-3 inline-block">Top Assister</span>
                <h4 className="font-bold text-base text-foreground line-clamp-1 mb-1">{topAssister.name}</h4>
                {topAssister.teamName && (
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                    {topAssister.teamName}
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-2xl font-black text-foreground">{topAssister.value}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Assists</span>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* SECTION 3: Venue & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Stadium Info */}
        {overview.venue?.widget && (
          <div className="bg-card/40 hover:bg-card border border-border/40 p-6 rounded-[2rem] flex items-center gap-6 transition-colors group">
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <MapPin className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Home Stadium</p>
              <h4 className="text-lg font-bold text-foreground line-clamp-1">{overview.venue.widget.name}</h4>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{overview.venue.widget.city}</p>
              
              {overview.venue.statPairs && (
                <div className="flex items-center gap-4 mt-2 border-t border-border/50 pt-2">
                   {overview.venue.statPairs.map(([key, value]: [string, any]) => (
                     <div key={key} className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{key}</span>
                        <span className="text-xs font-bold">{typeof value === 'number' && key === 'Capacity' ? value.toLocaleString() : value}</span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coach Info */}
        {currentCoach && (
          <div className="bg-card/40 hover:bg-card border border-border/40 p-6 rounded-[2rem] flex items-center gap-6 transition-colors group">
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors relative overflow-hidden">
              <Users className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors z-10" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Head Coach</p>
              <h4 className="text-lg font-bold text-foreground line-clamp-1">{currentCoach.name}</h4>
              {currentCoach.season && (
                <p className="text-xs font-semibold text-muted-foreground mb-2">Season: {currentCoach.season}</p>
              )}
              
              {currentCoach.winPercentage !== undefined && (
                <div className="flex items-center gap-4 mt-2 border-t border-border/50 pt-2">
                   <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Win Rate</span>
                      <span className="text-xs font-bold text-emerald-500">{Math.round(currentCoach.winPercentage * 100)}%</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">W-D-L</span>
                      <span className="text-xs font-bold">{currentCoach.win}-{currentCoach.draw}-{currentCoach.loss}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">PPG</span>
                      <span className="text-xs font-bold text-primary">{currentCoach.pointsPerGame}</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
