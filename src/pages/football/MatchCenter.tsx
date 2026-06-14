import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { TeamLogo } from "../../components/TeamLogo";
import { useEspnMatchDetail } from "../../hooks/football/useEspnQueries";
import {
  Loader2, ArrowLeft, Clock, Activity, ListOrdered,
  Users, User, BarChart3, Info, CircleDot, ArrowDown, ArrowUp, ArrowLeftRight, PlayCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet-async";

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function MatchCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "events" | "lineups" | "statistics" | "performance">("summary");

  const { data: matchData, isLoading, error } = useEspnMatchDetail(id || "", !!id);

  // Performance Lab state
  const [perfData, setPerfData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'performance' || !id || perfData) return;
    setPerfLoading(true);
    setPerfError(null);
    fetch(`${API_BASE}/api/football/v2/matches/performance/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setPerfData(json.data);
        else setPerfError(json.message || 'Failed to load performance data');
      })
      .catch(err => setPerfError(err.message))
      .finally(() => setPerfLoading(false));
  }, [activeTab, id, perfData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading ESPN match details…</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Match Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't load the details for this match.</p>
          <button onClick={() => navigate('/football')} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-colors">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const header = matchData.header;
  if (!header || !header.competitions || header.competitions.length === 0) return null;
  
  const comp = header.competitions[0];
  const homeTeamObj = comp.competitors.find((c: any) => c.homeAway === 'home');
  const awayTeamObj = comp.competitors.find((c: any) => c.homeAway === 'away');
  
  const homeTeam = homeTeamObj?.team || {};
  const awayTeam = awayTeamObj?.team || {};
  const status = comp.status?.type?.detail || "Scheduled";
  const statusState = comp.status?.type?.state || "pre"; // pre, in, post
  
  const keyEvents = matchData.keyEvents || [];
  const homeStats = matchData.boxscore?.teams?.find((t: any) => t.team.id === homeTeam.id)?.statistics || [];
  const awayStats = matchData.boxscore?.teams?.find((t: any) => t.team.id === awayTeam.id)?.statistics || [];
  
  const homeRoster = matchData.rosters?.find((r: any) => r.team.id === homeTeam.id)?.roster || [];
  const awayRoster = matchData.rosters?.find((r: any) => r.team.id === awayTeam.id)?.roster || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Helmet>
        <title>{homeTeam.name} vs {awayTeam.name} - SportBuzz</title>
      </Helmet>
      
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto md:px-4 py-4 md:py-8 flex flex-col gap-6">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-4 md:px-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Matches</span>
        </button>

        {/* Scoreboard Header */}
        <div className="bg-secondary/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden group mx-4 md:mx-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-50" />
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 border border-border/50 backdrop-blur-md mb-8">
              <span className="relative flex h-2 w-2">
                {statusState === 'in' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", statusState === 'in' ? "bg-emerald-500" : "bg-muted-foreground")} />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{status}</span>
            </div>

            <div className="flex items-center justify-between w-full max-w-2xl gap-4">
              {/* Home Team */}
              <div className="flex flex-col items-center flex-1 gap-4">
                <TeamLogo logo={homeTeam.logo} name={homeTeam.name} className="w-20 h-20 md:w-28 md:h-28 drop-shadow-xl" />
                <h2 className="text-lg md:text-2xl font-black text-center">{homeTeam.abbreviation || homeTeam.name}</h2>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center justify-center px-4 md:px-8">
                <div className="flex items-baseline gap-2 md:gap-4 font-black tracking-tighter">
                  <span className={cn("text-5xl md:text-7xl", statusState === 'post' && homeTeamObj.winner && "text-emerald-500")}>
                    {homeTeamObj?.score || "0"}
                  </span>
                  <span className="text-3xl md:text-5xl text-muted-foreground/30">-</span>
                  <span className={cn("text-5xl md:text-7xl", statusState === 'post' && awayTeamObj.winner && "text-emerald-500")}>
                    {awayTeamObj?.score || "0"}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center flex-1 gap-4">
                <TeamLogo logo={awayTeam.logo} name={awayTeam.name} className="w-20 h-20 md:w-28 md:h-28 drop-shadow-xl" />
                <h2 className="text-lg md:text-2xl font-black text-center">{awayTeam.abbreviation || awayTeam.name}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-0">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="w-full bg-secondary/50 border border-border/50 rounded-2xl p-1.5 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="summary" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Info className="w-4 h-4 mr-2" />Summary</TabsTrigger>
              <TabsTrigger value="events" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><ListOrdered className="w-4 h-4 mr-2" />Key Events</TabsTrigger>
              <TabsTrigger value="statistics" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><BarChart3 className="w-4 h-4 mr-2" />Stats</TabsTrigger>
              <TabsTrigger value="lineups" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-2" />Lineups</TabsTrigger>
              <TabsTrigger value="performance" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-emerald-500 data-[state=active]:text-emerald-400"><Activity className="w-4 h-4 mr-2" />Lab</TabsTrigger>
            </TabsList>

            {/* SUMMARY TAB */}
            <TabsContent value="summary" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2"><CircleDot className="w-5 h-5 text-emerald-500"/> Match Info</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between pb-4 border-b border-border/50">
                        <span className="text-muted-foreground">Competition</span>
                        <span className="font-semibold">{header.league?.name}</span>
                     </div>
                     <div className="flex justify-between pb-4 border-b border-border/50">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">{new Date(comp.date).toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between pb-4">
                        <span className="text-muted-foreground">Venue</span>
                        <span className="font-semibold">{comp.venue?.fullName || "TBD"}</span>
                     </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* KEY EVENTS TAB */}
            <TabsContent value="events" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
               <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><ListOrdered className="w-5 h-5 text-blue-500"/> Key Events</h3>
                  {keyEvents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No key events recorded yet.</p>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {keyEvents.map((evt: any, i: number) => {
                        const isHome = evt.team?.id === homeTeam.id;
                        return (
                          <div key={i} className={cn("relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active")}>
                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary/80 backdrop-blur shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              {evt.type?.text?.includes("Goal") ? <CircleDot className="w-4 h-4 text-emerald-500"/> :
                               evt.type?.text?.includes("Yellow") ? <div className="w-3 h-4 bg-yellow-400 rounded-sm" /> :
                               evt.type?.text?.includes("Red") ? <div className="w-3 h-4 bg-red-500 rounded-sm" /> :
                               <PlayCircle className="w-4 h-4 text-muted-foreground"/>}
                            </div>
                            
                            {/* Content */}
                            <div className={cn("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-secondary/30 border border-border/50", isHome ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-blue-500")}>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-black text-muted-foreground bg-background px-2 py-0.5 rounded-full">{evt.clock?.displayValue || "?'"}</span>
                                 <span className="font-bold">{evt.type?.text}</span>
                               </div>
                               <p className="text-sm text-foreground/80">{evt.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </TabsContent>

            {/* STATS TAB */}
            <TabsContent value="statistics" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-8 px-4">
                  <TeamLogo logo={homeTeam.logo} name={homeTeam.name} className="w-12 h-12" />
                  <h3 className="text-lg font-black"><BarChart3 className="w-5 h-5 inline-block mr-2 text-purple-500"/> Match Statistics</h3>
                  <TeamLogo logo={awayTeam.logo} name={awayTeam.name} className="w-12 h-12" />
                </div>
                
                {homeStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Statistics not available.</p>
                ) : (
                  <div className="space-y-6">
                    {homeStats.map((hStat: any, idx: number) => {
                      const aStat = awayStats.find((s:any) => s.name === hStat.name);
                      if (!aStat) return null;
                      
                      const hVal = parseFloat(hStat.displayValue.replace('%','')) || 0;
                      const aVal = parseFloat(aStat.displayValue.replace('%','')) || 0;
                      const total = hVal + aVal || 1;
                      const hPct = (hVal / total) * 100;
                      const aPct = (aVal / total) * 100;

                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className={hVal > aVal ? "text-emerald-500" : "text-muted-foreground"}>{hStat.displayValue}</span>
                            <span className="uppercase tracking-wider text-xs text-muted-foreground">{hStat.label || hStat.name}</span>
                            <span className={aVal > hVal ? "text-emerald-500" : "text-muted-foreground"}>{aStat.displayValue}</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                            <div style={{ width: `${hPct}%` }} className={cn("h-full", hVal > aVal ? "bg-emerald-500" : "bg-emerald-500/50")} />
                            <div style={{ width: `${aPct}%` }} className={cn("h-full", aVal > hVal ? "bg-blue-500" : "bg-blue-500/50")} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* LINEUPS TAB */}
            <TabsContent value="lineups" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
               <div className="grid gap-6 md:grid-cols-2">
                 
                 {/* Home Lineup */}
                 <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                       <TeamLogo logo={homeTeam.logo} name={homeTeam.name} className="w-10 h-10" />
                       <h3 className="text-xl font-black">{homeTeam.name}</h3>
                    </div>
                    {homeRoster.length === 0 ? <p className="text-muted-foreground">Lineup not available.</p> : (
                       <div className="space-y-4">
                          <h4 className="text-sm font-bold tracking-wider uppercase text-emerald-500 mb-4">Starting XI</h4>
                          {homeRoster.filter((p:any) => p.starter).map((p:any) => (
                             <div key={p.athlete.id} className="flex items-center gap-4 p-2 hover:bg-secondary/50 rounded-xl transition-colors">
                               <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete.id}.png`} alt={p.athlete.displayName} className="w-12 h-12 rounded-full bg-background object-cover border border-border/50" onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.athlete.displayName)}&background=1e293b&color=fff&rounded=true&bold=true`)} />
                               <div className="flex-1">
                                 <p className="font-bold">{p.athlete.displayName}</p>
                                 <p className="text-xs text-muted-foreground">{p.position?.name}</p>
                               </div>
                               <span className="font-black text-xl text-foreground/20 w-8 text-center">{p.jersey}</span>
                             </div>
                          ))}

                          <h4 className="text-sm font-bold tracking-wider uppercase text-emerald-500 mt-8 mb-4">Substitutes</h4>
                          {homeRoster.filter((p:any) => !p.starter).map((p:any) => (
                             <div key={p.athlete.id} className="flex items-center gap-4 p-2 hover:bg-secondary/50 rounded-xl transition-colors">
                               <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete.id}.png`} alt={p.athlete.displayName} className="w-10 h-10 rounded-full bg-background object-cover border border-border/50 opacity-80" onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.athlete.displayName)}&background=1e293b&color=fff&rounded=true&bold=true`)} />
                               <div className="flex-1">
                                 <p className="font-bold text-foreground/80">{p.athlete.displayName}</p>
                                 <p className="text-xs text-muted-foreground">{p.position?.name}</p>
                               </div>
                               <span className="font-black text-lg text-foreground/20 w-8 text-center">{p.jersey}</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Away Lineup */}
                 <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                       <TeamLogo logo={awayTeam.logo} name={awayTeam.name} className="w-10 h-10" />
                       <h3 className="text-xl font-black">{awayTeam.name}</h3>
                    </div>
                    {awayRoster.length === 0 ? <p className="text-muted-foreground">Lineup not available.</p> : (
                       <div className="space-y-4">
                          <h4 className="text-sm font-bold tracking-wider uppercase text-blue-500 mb-4">Starting XI</h4>
                          {awayRoster.filter((p:any) => p.starter).map((p:any) => (
                             <div key={p.athlete.id} className="flex items-center gap-4 p-2 hover:bg-secondary/50 rounded-xl transition-colors">
                               <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete.id}.png`} alt={p.athlete.displayName} className="w-12 h-12 rounded-full bg-background object-cover border border-border/50" onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.athlete.displayName)}&background=1e293b&color=fff&rounded=true&bold=true`)} />
                               <div className="flex-1">
                                 <p className="font-bold">{p.athlete.displayName}</p>
                                 <p className="text-xs text-muted-foreground">{p.position?.name}</p>
                               </div>
                               <span className="font-black text-xl text-foreground/20 w-8 text-center">{p.jersey}</span>
                             </div>
                          ))}

                          <h4 className="text-sm font-bold tracking-wider uppercase text-blue-500 mt-8 mb-4">Substitutes</h4>
                          {awayRoster.filter((p:any) => !p.starter).map((p:any) => (
                             <div key={p.athlete.id} className="flex items-center gap-4 p-2 hover:bg-secondary/50 rounded-xl transition-colors">
                               <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${p.athlete.id}.png`} alt={p.athlete.displayName} className="w-10 h-10 rounded-full bg-background object-cover border border-border/50 opacity-80" onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.athlete.displayName)}&background=1e293b&color=fff&rounded=true&bold=true`)} />
                               <div className="flex-1">
                                 <p className="font-bold text-foreground/80">{p.athlete.displayName}</p>
                                 <p className="text-xs text-muted-foreground">{p.position?.name}</p>
                               </div>
                               <span className="font-black text-lg text-foreground/20 w-8 text-center">{p.jersey}</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

               </div>
            </TabsContent>

            {/* PERFORMANCE LAB TAB (Kept original logic) */}
            <TabsContent value="performance" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6 min-h-[400px]">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                    <Activity className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-xl font-black">Performance Lab</h3>
                 </div>
                 
                 {perfLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                       <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                       <p>Analyzing match performance data...</p>
                    </div>
                 ) : perfError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center max-w-md mx-auto">
                       <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                         <Activity className="w-8 h-8 opacity-50" />
                       </div>
                       <p className="font-medium text-foreground mb-2">Performance Data Unavailable</p>
                       <p className="text-sm">Advanced metrics are currently being generated or are not available for this specific fixture.</p>
                    </div>
                 ) : perfData ? (
                    <div className="space-y-8">
                       {/* Render advanced performance data here */}
                       <pre className="p-4 bg-black/50 rounded-xl text-xs overflow-auto max-h-96">
                         {JSON.stringify(perfData, null, 2)}
                       </pre>
                    </div>
                 ) : null}
              </div>
            </TabsContent>

          </Tabs>
        </div>

      </main>
    </div>
  );
}
