import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFotmobLeague } from '../../hooks/football/useFotmobLeague';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldAlert, Trophy, Calendar, Users, Activity, BarChart, ArrowRightLeft, Heart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { favoritesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

import { Navbar } from '../../components/Navbar';

export default function FootballLeagueOverview() {
  const { id } = useParams<{ id: string }>();
  const leagueId = id ? parseInt(id, 10) : null;
  const { data, isLoading, error } = useFotmobLeague(leagueId);

  const [activeTab, setActiveTab] = useState<string>('overview');

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (data && data.tabs && data.tabs.length > 0 && activeTab === 'overview' && !data.tabs.includes('overview')) {
      setActiveTab(data.tabs[0]);
    }
  }, [data]);

  React.useEffect(() => {
    if (!leagueId) return;
    const checkFav = async () => {
      try {
        const allFavs = await favoritesApi.get() as any;
        if (allFavs.success) {
          const fav = allFavs.data.find((f: any) => f.type === 'league' && f.itemId === leagueId.toString());
          if (fav) {
            setIsFavorite(true);
            setFavoriteId(fav._id);
          } else {
            setIsFavorite(false);
            setFavoriteId(null);
          }
        }
      } catch (e) {
        console.error('Failed to check favorite status', e);
      }
    };
    checkFav();
  }, [leagueId]);

  const toggleFavorite = async () => {
    if (!leagueId) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite && favoriteId) {
        await favoritesApi.remove(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        toast({ title: 'Removed from Favorites' });
      } else {
        const leagueLogoUrl = `https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`;
        const leagueName = data?.details?.name || 'League';
        const res = await favoritesApi.add({
          type: 'league',
          itemId: leagueId.toString(),
          name: leagueName,
          sport: 'football',
          image: leagueLogoUrl
        }) as any;
        if (res.success) {
          setIsFavorite(true);
          setFavoriteId(res.data._id);
          toast({ title: 'Added to Favorites', description: `${leagueName} has been saved.` });
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update favorites', variant: 'destructive' });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-primary/20" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md border border-primary/20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground animate-pulse font-semibold tracking-wide text-sm uppercase">Loading League Universe...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mb-3 text-2xl font-black text-foreground tracking-tight">Failed to Load League</h2>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">{error || 'Unknown error occurred while fetching league details.'}</p>
        </div>
      </div>
    );
  }

  // Beautiful Table Renderer
  const renderTable = (tabData: any) => {
    try {
      const allTeams = tabData?.[0]?.data?.table?.all || [];
      if (!allTeams.length) throw new Error("No table data");

      return (
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-3">
            <Trophy className="text-amber-400 h-5 w-5" />
            <h3 className="font-bold text-foreground tracking-tight">League Standings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-foreground/[0.02] text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  <th className="py-4 pl-6 w-12">#</th>
                  <th className="py-4 font-bold">Club</th>
                  <th className="py-4 text-center">MP</th>
                  <th className="py-4 text-center">W</th>
                  <th className="py-4 text-center">D</th>
                  <th className="py-4 text-center">L</th>
                  <th className="py-4 text-center hidden sm:table-cell">GF:GA</th>
                  <th className="py-4 text-center">GD</th>
                  <th className="py-4 pr-6 text-center text-foreground font-black">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {allTeams.map((team: any, idx: number) => (
                  <tr key={team.id} className="transition-colors hover:bg-muted/30 group">
                    <td className="py-3 pl-6 font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      {team.idx || idx + 1}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`} 
                          alt={team.name} 
                          className="h-7 w-7 object-contain drop-shadow-sm"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <span className="font-bold text-foreground/90 tracking-tight">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-muted-foreground font-medium tabular-nums">{team.played}</td>
                    <td className="py-3 text-center text-emerald-500/80 font-semibold tabular-nums">{team.wins}</td>
                    <td className="py-3 text-center text-amber-500/80 font-semibold tabular-nums">{team.draws}</td>
                    <td className="py-3 text-center text-rose-500/80 font-semibold tabular-nums">{team.losses}</td>
                    <td className="py-3 text-center text-muted-foreground/60 text-[12px] hidden sm:table-cell tabular-nums">{team.scoresStr}</td>
                    <td className={cn(
                      "py-3 text-center font-bold tabular-nums",
                      team.goalConDiff > 0 ? "text-emerald-500" : team.goalConDiff < 0 ? "text-rose-500" : "text-muted-foreground"
                    )}>
                      {team.goalConDiff > 0 ? `+${team.goalConDiff}` : team.goalConDiff}
                    </td>
                    <td className="py-3 pr-6 text-center">
                      <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-foreground/5 font-black text-foreground shadow-sm">
                        {team.pts}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } catch (e) {
      return renderFallback(tabData, "Table format unsupported");
    }
  };

  // Beautiful Fixtures Renderer
  const renderFixtures = (tabData: any) => {
    try {
      const matches = tabData?.allMatches || tabData?.matches || [];
      if (!matches.length) throw new Error("No fixtures data");

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.slice(0, 30).map((match: any, i: number) => {
            const isPlayed = match.status?.finished || match.status?.cancelled;
            const matchDate = match.status?.startDateStr || match.time || match.status?.utcTime;
            return (
              <div key={match.id || i} className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {matchDate ? format(new Date(matchDate), 'MMM d, yyyy - HH:mm') : 'Upcoming'}
                  </span>
                  {isPlayed ? (
                    <span className="rounded-md bg-foreground/5 px-2 py-1 text-[10px] font-bold text-foreground/60">FT</span>
                  ) : (
                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-500">Upcoming</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 flex-1 justify-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.home?.id}.png`} alt="" className="h-6 w-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="font-bold text-foreground/90">{match.home?.name || 'Home'}</span>
                    </div>
                    <span className={cn("text-lg font-black tabular-nums", isPlayed ? "text-foreground" : "text-muted-foreground/30")}>
                      {isPlayed ? match.home?.score : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${match.away?.id}.png`} alt="" className="h-6 w-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="font-bold text-foreground/90">{match.away?.name || 'Away'}</span>
                    </div>
                    <span className={cn("text-lg font-black tabular-nums", isPlayed ? "text-foreground" : "text-muted-foreground/30")}>
                      {isPlayed ? match.away?.score : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return renderFallback(tabData, "Fixtures format unsupported");
    }
  };

  const renderOverview = () => {
    try {
      const matches = data?.overview?.leagueOverviewMatches || data?.overview?.matches || [];
      const topPlayers = data?.overview?.topPlayers || [];
      const recentTransfers = data?.transfers?.data?.slice(0, 4) || [];
      const previousSeason = data?.seasons?.[1] || data?.seasons?.[0]; // Usually index 1 is the last completed season if 0 is upcoming
      const tableRows = data?.table?.[0]?.data?.table?.all || data?.overview?.table?.[0]?.data?.table?.all || [];

      return (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative rounded-3xl border border-border/50 bg-card/40 p-6 shadow-lg backdrop-blur-md overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Season</span>
              </div>
              <div className="relative z-10">
                <span className="text-3xl font-black text-foreground tracking-tighter drop-shadow-sm">{data?.details?.selectedSeason || '2026/2027'}</span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-lg backdrop-blur-md overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                </div>
                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Defending Champ</span>
              </div>
              <div className="flex items-center gap-3 relative z-10 mt-1">
                {previousSeason?.winner?.id ? (
                  <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${previousSeason.winner.id}.png`} alt="" className="h-8 w-8 object-contain drop-shadow-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : null}
                <span className="text-xl font-black text-foreground truncate tracking-tight">{previousSeason?.winner?.name || 'Unknown'}</span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-lg backdrop-blur-md overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Next Match</span>
              </div>
              <div className="relative z-10">
                {matches.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{matches[0].home?.name}</span>
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase">vs</span>
                      <span className="text-sm font-bold text-foreground truncate">{matches[0].away?.name}</span>
                    </div>
                    <span className="inline-flex items-center self-start px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-black text-emerald-500 mt-1">
                      {matches[0].status?.utcTime ? format(new Date(matches[0].status.utcTime), 'MMM d, HH:mm') : 'Upcoming'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">No upcoming matches</span>
                )}
              </div>
            </div>

            <div className="relative rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-lg backdrop-blur-md overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
                <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">Total Clubs</span>
              </div>
              <div className="relative z-10">
                <span className="text-3xl font-black text-foreground tracking-tighter drop-shadow-sm">{tableRows.length > 0 ? tableRows.length : '20'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 4 Title Race */}
            <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/30 shadow-xl backdrop-blur-xl overflow-hidden flex flex-col">
              <div className="px-8 py-5 border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy className="text-amber-500 h-4 w-4" />
                  </div>
                  <h3 className="font-black text-foreground tracking-tight text-lg">Title Race</h3>
                </div>
                <button onClick={() => setActiveTab('table')} className="text-[11px] uppercase tracking-widest font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  Full Table <ArrowRightLeft className="h-3 w-3" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  {tableRows.slice(0, 5).map((team: any, idx: number) => (
                    <div key={team.id} className="relative flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.01] hover:bg-foreground/[0.04] border border-border/20 transition-all group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black shadow-inner", 
                          idx === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-amber-500/30" : 
                          idx < 4 ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-500/30" : 
                          "bg-muted/50 text-muted-foreground border border-border"
                        )}>
                          {idx + 1}
                        </div>
                        <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`} alt="" className="h-10 w-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <span className="font-bold text-foreground tracking-tight text-lg group-hover:text-primary transition-colors">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-8 relative z-10">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Form</span>
                          <div className="flex gap-1">
                            {team.scoresStr?.split('').map((char: string, i: number) => (
                              <span key={i} className={cn(
                                "h-5 w-5 rounded flex items-center justify-center text-[10px] font-black text-white shadow-sm",
                                char === 'W' ? 'bg-emerald-500' : char === 'D' ? 'bg-amber-500' : char === 'L' ? 'bg-rose-500' : 'bg-muted text-muted-foreground'
                              )}>
                                {char}
                              </span>
                            ))}
                            {!team.scoresStr && <span className="text-sm font-semibold text-muted-foreground">-</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center w-12">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pts</span>
                          <span className="text-2xl font-black text-foreground leading-none">{team.pts}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Blockbuster Transfers Mini */}
            <div className="lg:col-span-1 rounded-3xl border border-border/60 bg-card/30 shadow-xl backdrop-blur-xl overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-border/30 bg-gradient-to-r from-blue-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <ArrowRightLeft className="text-blue-500 h-4 w-4" />
                  </div>
                  <h3 className="font-black text-foreground tracking-tight text-lg">Latest Moves</h3>
                </div>
                <button onClick={() => setActiveTab('transfers')} className="text-[11px] uppercase tracking-widest font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  More <ArrowRightLeft className="h-3 w-3" />
                </button>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {recentTransfers.length > 0 ? recentTransfers.map((t: any, idx: number) => (
                  <div key={idx} className="p-4 bg-foreground/[0.01] hover:bg-foreground/[0.04] border border-border/20 transition-all rounded-2xl flex items-center gap-4 group">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
                      <img src={`https://images.fotmob.com/image_resources/playerimages/${t.playerId}.png`} alt="" className="h-12 w-12 rounded-full object-cover bg-foreground/5 shrink-0 border-2 border-transparent group-hover:border-blue-500/30 transition-colors relative z-10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate group-hover:text-blue-500 transition-colors">{t.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-rose-500 truncate max-w-[80px] bg-rose-500/10 px-1.5 py-0.5 rounded">{t.fromClub}</span>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-500 truncate max-w-[80px] bg-emerald-500/10 px-1.5 py-0.5 rounded">{t.toClub}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <ArrowRightLeft className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <span className="text-sm font-semibold text-muted-foreground">No recent transfers</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Top Performers (If available) */}
          {topPlayers.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Top Performers</h3>
                </div>
                <button onClick={() => setActiveTab('stats')} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Full Stats &rarr;</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topPlayers.slice(0, 4).map((player: any, idx: number) => (
                  <div key={idx} className="flex flex-col p-4 rounded-xl bg-foreground/[0.02] border border-border/30 hover:bg-foreground/[0.05] transition-colors group">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-black text-muted-foreground/30">{idx + 1}</span>
                      <img src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`} alt="" className="h-10 w-10 rounded-full object-cover bg-foreground/5 shadow-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{player.name || player.participantName}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">{player.teamName}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rating</span>
                      <span className="text-xl font-black text-primary">{player.rating || player.goals || player.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (e) {
      return renderFallback(data?.overview, "Overview format unsupported");
    }
  };

  const renderStats = (tabData: any) => {
    try {
      if (!tabData?.players?.length && !tabData?.teams?.length) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-border rounded-2xl bg-card/40 backdrop-blur-md">
            <BarChart className="mb-4 h-12 w-12 opacity-20" />
            <h3 className="text-lg font-bold text-foreground">Season Stats Unavailable</h3>
            <p className="text-sm">Detailed player and team statistics have not been generated for the current active season yet.</p>
          </div>
        );
      }
      return renderFallback(tabData, "Advanced Stats");
    } catch (e) {
      return renderFallback(tabData, "Stats Error");
    }
  };

  const renderTransfers = (tabData: any) => {
    try {
      const transfers = tabData?.data || [];
      if (!transfers.length) throw new Error("No transfers data");
      return (
        <div className="rounded-2xl border border-border bg-card/40 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-3">
            <ArrowRightLeft className="text-blue-500 h-5 w-5" />
            <h3 className="font-bold text-foreground tracking-tight">Recent Transfers</h3>
          </div>
          <div className="divide-y divide-border/30">
            {transfers.slice(0, 50).map((t: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative shrink-0">
                    <img 
                      src={`https://images.fotmob.com/image_resources/playerimages/${t.playerId}.png`} 
                      alt={t.name}
                      className="h-11 w-11 rounded-full object-cover bg-foreground/5 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground truncate">{t.name}</h4>
                    <p className="text-xs text-muted-foreground font-semibold truncate">{t.position?.label || 'Player'} • {t.transferDate ? format(new Date(t.transferDate), 'MMM d, yyyy') : 'Recent'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 sm:w-[320px] shrink-0 bg-foreground/[0.02] p-2 sm:p-0 rounded-lg sm:bg-transparent">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-rose-500 text-xs sm:text-sm font-semibold text-right truncate max-w-[100px]">{t.fromClub}</span>
                    {t.fromClubId ? (
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${t.fromClubId}.png`} alt="" className="h-6 w-6 object-contain drop-shadow-sm shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-rose-500/10 shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center shrink-0 w-8">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground/40" />
                    {t.fee?.value && t.fee.value !== "Undisclosed" && t.fee.value !== "Free transfer" && (
                      <span className="text-[9px] font-black text-emerald-500/70 uppercase mt-1">{t.fee.value}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1 justify-start">
                    {t.toClubId ? (
                      <img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${t.toClubId}.png`} alt="" className="h-6 w-6 object-contain drop-shadow-sm shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 shrink-0" />
                    )}
                    <span className="text-emerald-500 text-xs sm:text-sm font-semibold text-left truncate max-w-[100px]">{t.toClub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch(e) {
      return renderFallback(tabData, "Transfers View");
    }
  };

  const renderSeasons = (tabData: any) => {
    try {
      const seasons = Array.isArray(tabData) ? tabData : tabData?.seasons || [];
      if (!seasons.length) throw new Error("No seasons data");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {seasons.map((season: any, idx: number) => (
            <div key={idx} className="relative rounded-3xl border border-border/50 bg-card/20 shadow-lg backdrop-blur-xl overflow-hidden group hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all duration-500">
              {/* Decorative background glow based on champion status */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-colors" />
              
              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/5 text-xs font-bold tracking-widest text-muted-foreground border border-foreground/10">
                    SEASON
                  </span>
                  <h3 className="font-black text-2xl text-foreground/90 tracking-tighter">{season.seasonName}</h3>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-6">
                  {season.winner && (
                    <div className="flex items-center justify-between relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-2xl -mx-4 px-4 py-2 scale-y-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="relative shrink-0">
                          <div className="absolute -inset-1 bg-amber-500 rounded-full blur-sm opacity-20" />
                          <img 
                            src={`https://images.fotmob.com/image_resources/logo/teamlogo/${season.winner.id}.png`} 
                            alt={season.winner.name}
                            className="h-14 w-14 object-contain drop-shadow-xl relative z-10"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-background border border-amber-500/30 flex items-center justify-center shadow-sm">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-1">Champion</p>
                          <p className="font-black text-foreground text-xl tracking-tight truncate">{season.winner.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {season.winner && season.loser && (
                    <div className="flex items-center gap-4 pl-7 opacity-40">
                      <div className="h-full w-px bg-border absolute left-14 top-0 bottom-0" />
                    </div>
                  )}

                  {season.loser && (
                    <div className="flex items-center gap-4 relative z-10 mt-2">
                      <div className="relative shrink-0">
                        <img 
                          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${season.loser.id}.png`} 
                          alt={season.loser.name}
                          className="h-10 w-10 object-contain drop-shadow-md opacity-80 grayscale group-hover:grayscale-0 transition-all"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                          <span className="text-[10px] font-black text-muted-foreground">2</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-0.5">Runner-Up</p>
                        <p className="font-bold text-foreground/70 tracking-tight truncate">{season.loser.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return renderFallback(tabData, "Seasons View");
    }
  };

  const renderFallback = (tabData: any, message: string = "Raw Data View") => (
    <div className="rounded-2xl border border-border bg-card p-0 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">{message}</h3>
        </div>
      </div>
      <div className="p-6 overflow-auto max-h-[600px] bg-foreground/[0.02]">
        <pre className="text-[11px] leading-relaxed text-muted-foreground/80 font-mono">
          {JSON.stringify(tabData, null, 2)}
        </pre>
      </div>
    </div>
  );

  const renderTabContent = (tabId: string) => {
    const tabData = (data as any)[tabId];
    if (!tabData) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <AlertTriangle className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">No data available for {tabId}</p>
        </div>
      );
    }

    if (tabId === 'overview') return renderOverview(tabData);
    if (tabId === 'table') return renderTable(tabData);
    if (tabId === 'fixtures' || tabId === 'matches') return renderFixtures(tabData);
    if (tabId === 'stats') return renderStats(tabData);
    if (tabId === 'transfers') return renderTransfers(tabData);
    if (tabId === 'seasons') return renderSeasons(tabData);
    
    // Default fallback for any newly discovered tabs from FotMob we haven't mapped yet
    return renderFallback(tabData, `${tabId.toUpperCase()} Details`);
  };

  const tabIcons: Record<string, React.ReactNode> = {
    overview: <Activity size={16} />,
    table: <Trophy size={16} />,
    fixtures: <Calendar size={16} />,
    matches: <Calendar size={16} />,
    stats: <BarChart size={16} />,
    transfers: <ArrowRightLeft size={16} />,
    squad: <Users size={16} />
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      {/* Dynamic Hero Header */}
      <div className="relative overflow-hidden bg-card border-b border-border/40 px-6 py-12 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 max-w-[1400px] mx-auto">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white shadow-2xl shadow-black/5 ring-1 ring-black/5 p-4">
            <img 
              src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`} 
              alt="League Logo" 
              className="h-full w-full object-contain drop-shadow-md"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {!leagueId && <span className="text-4xl font-black text-foreground">{data.details?.name?.charAt(0) || 'L'}</span>}
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground mb-3">
              {data.details?.name || 'League Overview'}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {data.details?.country && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-foreground/5 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-foreground/10">
                  {data.details.country}
                </span>
              )}
              {data.details?.selectedSeason && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-xs font-bold uppercase tracking-widest text-primary border border-primary/20">
                  Season {data.details.selectedSeason}
                </span>
              )}
              <button 
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all ${
                  isFavorite 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                    : 'bg-foreground/5 text-muted-foreground border-border hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <Heart size={14} fill={isFavorite ? "currentColor" : "none"} className={isTogglingFavorite ? "animate-pulse" : ""} />
                {isFavorite ? 'Saved' : 'Favorite'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 pb-px mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex w-full justify-start overflow-x-auto bg-transparent p-0 hide-scrollbar h-auto">
              {data.tabs?.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={cn(
                    "relative flex items-center gap-2.5 h-14 rounded-none border-b-2 border-transparent px-6 font-semibold capitalize text-muted-foreground transition-all whitespace-nowrap",
                    "hover:text-foreground hover:bg-foreground/[0.02]",
                    "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-primary/5"
                  )}
                >
                  {tabIcons[tab] || <Activity size={16} className="opacity-50" />}
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="relative min-h-[500px]">
            {data.tabs?.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {renderTabContent(tab)}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
