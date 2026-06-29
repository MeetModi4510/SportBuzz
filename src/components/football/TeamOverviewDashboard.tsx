import React from 'react';
import { Trophy, Star, Users, Target, Activity, Clock, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import type { FotmobTeamData } from '@/hooks/football/useFotmobTeam';

const StadiumIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Outer Field */}
    <rect x="2" y="4" width="20" height="16" rx="2" />
    {/* Center Line */}
    <line x1="12" y1="4" x2="12" y2="20" />
    {/* Center Circle */}
    <circle cx="12" cy="12" r="3" />
    {/* Left Penalty Area */}
    <path d="M2 8h4v8H2" />
    {/* Right Penalty Area */}
    <path d="M22 8h-4v8h4" />
  </svg>
);

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
            
            <div className="flex items-center justify-between gap-4 w-full pb-6 pt-12 px-4 relative h-48">
              {/* Central Baseline */}
              <div className="absolute left-0 right-0 top-[50%] h-px bg-border/60 pointer-events-none" />
              
              {formArray.map((match: any, i) => {
                const isWin = match.result === 1;
                const isDraw = match.result === 0;
                const isLoss = match.result === -1;
                
                return (
                  <div key={i} className="flex flex-col items-center justify-center shrink-0 group/bar cursor-pointer relative h-full w-8 z-10">
                    
                    {/* Hover Tooltip Fixed Positioning */}
                    <div className="absolute opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-2 bottom-[85%] left-1/2 -translate-x-1/2 mb-2 bg-background/95 backdrop-blur-md border border-border px-4 py-2.5 rounded-2xl whitespace-nowrap z-50 pointer-events-none transition-all duration-300 flex flex-col items-center shadow-xl">
                      <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase mb-1.5">{match.tournamentName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs">{match.tooltipText?.homeTeam || match.home?.name}</span>
                        <span className={`font-black text-sm px-2 py-0.5 rounded-md ${isWin ? 'bg-emerald-500/10 text-emerald-500' : isDraw ? 'bg-slate-500/10 text-slate-400' : 'bg-rose-500/10 text-rose-500'}`}>{match.score}</span>
                        <span className="font-bold text-xs">{match.tooltipText?.awayTeam || match.away?.name}</span>
                      </div>
                    </div>

                    {/* Opposition Logo */}
                    <div className={`absolute z-20 w-8 h-8 rounded-full bg-background border border-border/40 p-1 flex items-center justify-center shadow-md transition-transform duration-300 group-hover/bar:scale-125 ${
                      isWin ? 'bottom-[calc(50%+42px)]' : 
                      isDraw ? 'bottom-[calc(50%+16px)]' : 
                      'top-[calc(50%+42px)]'
                    }`}>
                      <img src={match.imageUrl} className="w-full h-full object-contain drop-shadow-sm" alt="Opponent" />
                    </div>

                    {/* Clean Bars */}
                    {isWin && (
                      <div className="absolute bottom-[50%] w-4 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-[2px] shadow-[0_0_10px_rgba(16,185,129,0.4)] group-hover/bar:brightness-110 transition-all duration-300" style={{ height: '36px' }} />
                    )}
                    {isLoss && (
                      <div className="absolute top-[50%] w-4 bg-gradient-to-b from-rose-500 to-rose-400 rounded-b-[2px] shadow-[0_0_10px_rgba(244,63,94,0.4)] group-hover/bar:brightness-110 transition-all duration-300" style={{ height: '36px' }} />
                    )}
                    {isDraw && (
                      <div className="absolute top-[50%] -translate-y-1/2 w-4 h-4 bg-slate-400 rounded-[2px] shadow-sm group-hover/bar:brightness-110 transition-all duration-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Match Ticket */}
        {overview.nextMatch && (
          <div className="lg:col-span-5 relative bg-gradient-to-br from-card to-card/50 border border-border/40 rounded-[2rem] shadow-sm overflow-hidden group">
            
            {/* Background Massive Logos for Texture */}
            <div className="absolute -left-16 -top-16 w-64 h-64 opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover:scale-110">
               <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.home.id}.png`} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover:scale-110">
               <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.away.id}.png`} className="w-full h-full object-cover" />
            </div>

            {/* Glowing Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Up Next</span>
                </div>
                {overview.nextMatch.tournament?.name && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2.5 py-1 rounded-full">
                    {overview.nextMatch.tournament.name}
                  </span>
                )}
              </div>
              
              {/* Teams & Score */}
              <div className="flex items-center justify-center mt-auto pb-2">
                {/* Home */}
                <div className="flex flex-col items-center gap-4 flex-1 relative z-10">
                   <div className="relative group/logo">
                     <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                     <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.home.id}.png`} className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)] group-hover/logo:scale-110 transition-transform duration-500 relative z-10" alt="Home" />
                   </div>
                   <span className="text-sm font-black text-foreground text-center line-clamp-1 tracking-wide">{overview.nextMatch.home.name}</span>
                </div>
                
                {/* VS or Date */}
                <div className="flex flex-col items-center justify-center px-2 flex-[0.8] relative z-20">
                   <div className="relative flex flex-col items-center justify-center w-full">
                     {/* Dynamic Slash Background */}
                     <div className="absolute w-[2px] h-24 bg-gradient-to-b from-transparent via-border to-transparent rotate-[25deg]" />
                     
                     <div className="bg-background/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/50 shadow-xl flex flex-col items-center gap-1">
                       <span className="text-xs md:text-sm font-black text-foreground whitespace-nowrap tracking-wider">
                          {new Date(overview.nextMatch.status.utcTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                       </span>
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {new Date(overview.nextMatch.status.utcTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                   </div>
                </div>
                
                {/* Away */}
                <div className="flex flex-col items-center gap-4 flex-1 relative z-10">
                   <div className="relative group/logo">
                     <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                     <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${overview.nextMatch.away.id}.png`} className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)] group-hover/logo:scale-110 transition-transform duration-500 relative z-10" alt="Away" />
                   </div>
                   <span className="text-sm font-black text-foreground text-center line-clamp-1 tracking-wide">{overview.nextMatch.away.name}</span>
                </div>
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
        {overview.venue?.statValue && (
          <div className="bg-card/40 hover:bg-card border border-border/40 p-6 rounded-[2rem] flex items-center gap-6 transition-colors group">
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <StadiumIcon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Home Stadium</p>
              <h4 className="text-lg font-bold text-foreground line-clamp-1">{overview.venue.statValue.name}</h4>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{overview.venue.statValue.city}</p>
              
              {overview.venue.statValue.capacity && (
                <div className="flex items-center gap-4 mt-2 border-t border-border/50 pt-2">
                     <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Capacity</span>
                        <span className="text-xs font-bold">{overview.venue.statValue.capacity.toLocaleString()}</span>
                     </div>
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
