import { useState, useMemo } from 'react';
import { FootballMatchPlayerStat } from "../../types/football";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Swords, Target, Shield, Zap, Eye, Flame, Activity, Hand } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MatchPerformanceLabProps {
  playerStats: FootballMatchPlayerStat[];
  matchStatus: string;
}

export function MatchPerformanceLab({ playerStats, matchStatus }: MatchPerformanceLabProps) {
  // Do not show for upcoming matches
  if (!['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'].includes(matchStatus) || !playerStats || playerStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-secondary/10 rounded-2xl border border-border/30">
        <Zap className="w-12 h-12 mb-4 opacity-20" />
        <p>Performance Lab data is not available for this match yet.</p>
        <p className="text-sm opacity-60">Data will populate once the match begins.</p>
      </div>
    );
  }

  // Flatten players for easy access
  const allPlayers = useMemo(() => {
    return playerStats.flatMap(teamStat => 
      teamStat.players.map(p => ({
        ...p.player,
        teamId: teamStat.team.id,
        teamName: teamStat.team.name,
        teamLogo: teamStat.team.logo,
        stats: p.statistics[0] // take the first (and usually only) stat object for the match
      }))
    ).filter(p => p.stats && p.stats.games.minutes && p.stats.games.minutes > 0);
  }, [playerStats]);

  // Extract MVP
  const mvp = useMemo(() => {
    return [...allPlayers].sort((a, b) => {
      const ratingA = parseFloat(a.stats.games.rating || '0');
      const ratingB = parseFloat(b.stats.games.rating || '0');
      return ratingB - ratingA;
    })[0];
  }, [allPlayers]);

  // Leaders
  const topPassers = useMemo(() => [...allPlayers].sort((a, b) => (b.stats.passes.total || 0) - (a.stats.passes.total || 0)).slice(0, 3), [allPlayers]);
  const topDefenders = useMemo(() => [...allPlayers].sort((a, b) => ((b.stats.tackles.total || 0) + (b.stats.tackles.interceptions || 0)) - ((a.stats.tackles.total || 0) + (a.stats.tackles.interceptions || 0))).slice(0, 3), [allPlayers]);
  const topAttackers = useMemo(() => [...allPlayers].sort((a, b) => (b.stats.shots.total || 0) - (a.stats.shots.total || 0)).slice(0, 3), [allPlayers]);
  
  const topCreators = useMemo(() => [...allPlayers].sort((a, b) => (b.stats.passes.key || 0) - (a.stats.passes.key || 0)).slice(0, 3), [allPlayers]);
  const topDribblers = useMemo(() => [...allPlayers].sort((a, b) => (b.stats.dribbles.success || 0) - (a.stats.dribbles.success || 0)).slice(0, 3), [allPlayers]);
  const topAggressors = useMemo(() => [...allPlayers].sort((a, b) => (b.stats.fouls.committed || 0) - (a.stats.fouls.committed || 0)).slice(0, 3), [allPlayers]);
  const topGoalkeepers = useMemo(() => [...allPlayers].filter(p => p.stats.games.position === 'Goalkeeper' || p.stats.games.position === 'G').sort((a, b) => (b.stats.goals.saves || 0) - (a.stats.goals.saves || 0)).slice(0, 3), [allPlayers]);

  // Dropdown Options
  const dropdown1Players = useMemo(() => {
    if (!playerStats || playerStats.length < 2) return allPlayers;
    const t1 = allPlayers.filter(p => p.teamId === playerStats[0].team.id).sort((a, b) => a.name.localeCompare(b.name));
    const t2 = allPlayers.filter(p => p.teamId === playerStats[1].team.id).sort((a, b) => a.name.localeCompare(b.name));
    return [...t1, ...t2];
  }, [allPlayers, playerStats]);

  const dropdown2Players = useMemo(() => {
    if (!playerStats || playerStats.length < 2) return allPlayers;
    const t1 = allPlayers.filter(p => p.teamId === playerStats[0].team.id).sort((a, b) => a.name.localeCompare(b.name));
    const t2 = allPlayers.filter(p => p.teamId === playerStats[1].team.id).sort((a, b) => a.name.localeCompare(b.name));
    return [...t2, ...t1];
  }, [allPlayers, playerStats]);

  // H2H State
  const [playerAId, setPlayerAId] = useState<number>(dropdown1Players.length > 0 ? dropdown1Players[0].id : 0);
  const [playerBId, setPlayerBId] = useState<number>(dropdown2Players.length > 0 ? dropdown2Players[0].id : 0);

  const playerA = allPlayers.find(p => p.id === playerAId);
  const playerB = allPlayers.find(p => p.id === playerBId);

  // Radar Data calculation
  // We need to normalize metrics to a 0-100 scale based on the maximums in the match
  const radarData = useMemo(() => {
    if (!playerA || !playerB) return [];

    const getMax = (selector: (p: typeof allPlayers[0]) => number) => Math.max(...allPlayers.map(selector), 1);

    const maxPasses = getMax(p => p.stats.passes.total || 0);
    const maxTackles = getMax(p => (p.stats.tackles.total || 0) + (p.stats.tackles.interceptions || 0));
    const maxDribbles = getMax(p => p.stats.dribbles.success || 0);
    const maxDuels = getMax(p => p.stats.duels.won || 0);
    const maxShots = getMax(p => p.stats.shots.total || 0);

    const safeParse = (val: number | null | undefined) => val || 0;

    return [
      {
        subject: 'Passing',
        A: (safeParse(playerA.stats.passes.total) / maxPasses) * 100,
        B: (safeParse(playerB.stats.passes.total) / maxPasses) * 100,
        fullMark: 100,
        valA: playerA.stats.passes.total || 0,
        valB: playerB.stats.passes.total || 0
      },
      {
        subject: 'Defending',
        A: ((safeParse(playerA.stats.tackles.total) + safeParse(playerA.stats.tackles.interceptions)) / maxTackles) * 100,
        B: ((safeParse(playerB.stats.tackles.total) + safeParse(playerB.stats.tackles.interceptions)) / maxTackles) * 100,
        fullMark: 100,
        valA: safeParse(playerA.stats.tackles.total) + safeParse(playerA.stats.tackles.interceptions),
        valB: safeParse(playerB.stats.tackles.total) + safeParse(playerB.stats.tackles.interceptions)
      },
      {
        subject: 'Dribbling',
        A: (safeParse(playerA.stats.dribbles.success) / maxDribbles) * 100,
        B: (safeParse(playerB.stats.dribbles.success) / maxDribbles) * 100,
        fullMark: 100,
        valA: playerA.stats.dribbles.success || 0,
        valB: playerB.stats.dribbles.success || 0
      },
      {
        subject: 'Duels',
        A: (safeParse(playerA.stats.duels.won) / maxDuels) * 100,
        B: (safeParse(playerB.stats.duels.won) / maxDuels) * 100,
        fullMark: 100,
        valA: playerA.stats.duels.won || 0,
        valB: playerB.stats.duels.won || 0
      },
      {
        subject: 'Attacking',
        A: (safeParse(playerA.stats.shots.total) / maxShots) * 100,
        B: (safeParse(playerB.stats.shots.total) / maxShots) * 100,
        fullMark: 100,
        valA: playerA.stats.shots.total || 0,
        valB: playerB.stats.shots.total || 0
      }
    ];
  }, [playerA, playerB, allPlayers]);

  if (allPlayers.length === 0) return null;

  return (
    <div className="space-y-8 pb-10">
      
      {/* MVP Card */}
      {mvp && (
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-orange-600/10 border border-yellow-500/30 rounded-3xl p-6 md:p-8 animate-in fade-in duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Trophy size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-500/50 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.3)] bg-background">
                <img src={mvp.photo} alt={mvp.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-background rounded-full p-1.5 border border-border">
                <img src={mvp.teamLogo} alt={mvp.teamName} className="w-full h-full object-contain" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-yellow-500/30 mb-2">
                <Trophy size={14} /> Match MVP
              </div>
              <h3 className="text-3xl md:text-4xl font-black">{mvp.name}</h3>
              <p className="text-muted-foreground font-medium">{mvp.stats.games.position} • {mvp.teamName}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <div className="bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border/40">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Rating</span>
                  <span className="text-xl font-bold text-yellow-500">{parseFloat(mvp.stats.games.rating || '0').toFixed(1)}</span>
                </div>
                {(mvp.stats.goals.total || 0) > 0 && (
                  <div className="bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border/40">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Goals</span>
                    <span className="text-xl font-bold text-foreground">{mvp.stats.goals.total}</span>
                  </div>
                )}
                {(mvp.stats.goals.assists || 0) > 0 && (
                  <div className="bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border/40">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Assists</span>
                    <span className="text-xl font-bold text-foreground">{mvp.stats.goals.assists}</span>
                  </div>
                )}
                <div className="bg-background/50 backdrop-blur-md px-4 py-2 rounded-xl border border-border/40">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Pass Acc.</span>
                  <span className="text-xl font-bold text-foreground">{mvp.stats.passes.accuracy || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Head to Head Radar */}
        <div className="lg:col-span-2 bg-secondary/10 border border-border/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 text-primary rounded-xl">
              <Swords size={20} />
            </div>
            <h4 className="text-lg font-bold">Head-to-Head Analysis</h4>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Player 1 (Blue)</label>
              <div className="flex items-center gap-3">
                {playerA && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/50 shrink-0 bg-background">
                    <img src={playerA.photo} alt={playerA.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <Select value={playerAId.toString()} onValueChange={(v) => setPlayerAId(Number(v))}>
                  <SelectTrigger className="flex-1 bg-background border-border/50 rounded-xl h-10 focus:ring-blue-500 [&>span]:w-full [&>span]:text-left">
                    <SelectValue placeholder="Select player 1" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {dropdown1Players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground/30 mx-1">|</span>
                          <img src={p.teamLogo} className="w-6 h-6 object-contain" alt={p.teamName} />
                          <span className="text-xs text-muted-foreground">{p.teamName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Player 2 (Red)</label>
              <div className="flex items-center gap-3">
                {playerB && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-rose-500/50 shrink-0 bg-background">
                    <img src={playerB.photo} alt={playerB.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <Select value={playerBId.toString()} onValueChange={(v) => setPlayerBId(Number(v))}>
                  <SelectTrigger className="flex-1 bg-background border-border/50 rounded-xl h-10 focus:ring-rose-500 [&>span]:w-full [&>span]:text-left">
                    <SelectValue placeholder="Select player 2" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {dropdown2Players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground/30 mx-1">|</span>
                          <img src={p.teamLogo} className="w-6 h-6 object-contain" alt={p.teamName} />
                          <span className="text-xs text-muted-foreground">{p.teamName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {playerA && playerB && (
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="h-[300px] w-full md:w-2/3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="currentColor" className="opacity-20" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12, className: 'opacity-60' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={playerA.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name={playerB.name} dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                    <Tooltip 
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl">
                            <p className="font-bold text-sm mb-2 uppercase tracking-wider">{data.subject}</p>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-blue-500 font-bold">{playerA.name}: {data.valA}</span>
                              <span className="text-rose-500 font-bold">{playerB.name}: {data.valB}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Comparison Stats */}
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-background border border-border/40 p-4 rounded-2xl flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <img src={playerA.teamLogo} className="w-7 h-7 object-contain shrink-0" alt={playerA.teamName} />
                    <span className="text-blue-500 font-bold text-[10px] md:text-xs leading-tight whitespace-normal">{playerA.teamName}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold shrink-0">Team</div>
                  <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
                    <span className="text-rose-500 font-bold text-[10px] md:text-xs leading-tight whitespace-normal text-right">{playerB.teamName}</span>
                    <img src={playerB.teamLogo} className="w-7 h-7 object-contain shrink-0" alt={playerB.teamName} />
                  </div>
                </div>
                <div className="bg-background border border-border/40 p-4 rounded-2xl flex justify-between items-center">
                  <div className="text-blue-500 font-bold text-lg w-1/3">{parseFloat(playerA.stats.games.rating || '0').toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold shrink-0">Rating</div>
                  <div className="text-rose-500 font-bold text-lg w-1/3 text-right">{parseFloat(playerB.stats.games.rating || '0').toFixed(1)}</div>
                </div>
                <div className="bg-background border border-border/40 p-4 rounded-2xl flex justify-between items-center">
                  <div className="text-blue-500 font-bold text-lg">{playerA.stats.passes.accuracy || 0}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pass %</div>
                  <div className="text-rose-500 font-bold text-lg">{playerB.stats.passes.accuracy || 0}%</div>
                </div>
                <div className="bg-background border border-border/40 p-4 rounded-2xl flex justify-between items-center">
                  <div className="text-blue-500 font-bold text-lg">{playerA.stats.shots.on || 0}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Shots on Target</div>
                  <div className="text-rose-500 font-bold text-lg">{playerB.stats.shots.on || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboards */}
        <div className="space-y-6">
          <LeaderboardCard title="Pass Masters" icon={<Target size={16} />} data={topPassers} valueKey="passes.total" suffix="passes" />
          <LeaderboardCard title="Defensive Rocks" icon={<Shield size={16} />} data={topDefenders} valueKey="tackles.total" suffix="actions" />
          <LeaderboardCard title="Attacking Threats" icon={<Zap size={16} />} data={topAttackers} valueKey="shots.total" suffix="shots" />
        </div>
      </div>

      {/* Advanced Metrics Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <LeaderboardCard title="Creative Vision" icon={<Eye size={16} />} data={topCreators} valueKey="passes.key" suffix="key passes" />
        <LeaderboardCard title="Dribbling Wizards" icon={<Flame size={16} />} data={topDribblers} valueKey="dribbles.success" suffix="dribbles" />
        <LeaderboardCard title="The Enforcers" icon={<Activity size={16} />} data={topAggressors} valueKey="fouls.committed" suffix="fouls" />
        <LeaderboardCard title="Wall of Brick" icon={<Hand size={16} />} data={topGoalkeepers} valueKey="goals.saves" suffix="saves" />
      </div>
    </div>
  );
}

function LeaderboardCard({ title, icon, data, valueKey, suffix }: { title: string, icon: React.ReactNode, data: any[], valueKey: string, suffix: string }) {
  const getValue = (p: any) => {
    if (valueKey === 'passes.total') return p.stats.passes.total || 0;
    if (valueKey === 'tackles.total') return (p.stats.tackles.total || 0) + (p.stats.tackles.interceptions || 0);
    if (valueKey === 'shots.total') return p.stats.shots.total || 0;
    if (valueKey === 'passes.key') return p.stats.passes.key || 0;
    if (valueKey === 'dribbles.success') return p.stats.dribbles.success || 0;
    if (valueKey === 'fouls.committed') return p.stats.fouls.committed || 0;
    if (valueKey === 'goals.saves') return p.stats.goals.saves || 0;
    return 0;
  };

  return (
    <div className="bg-secondary/10 border border-border/30 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4 text-foreground/80">
        <div className="p-1.5 bg-secondary border border-border/50 rounded-lg">{icon}</div>
        <h5 className="font-bold text-sm tracking-wide">{title}</h5>
      </div>
      <div className="space-y-3">
        {data.map((p, idx) => (
          <div key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 font-bold text-muted-foreground text-xs">{idx + 1}</div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50">
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold truncate max-w-[120px]">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.teamName}</span>
              </div>
            </div>
            <div className="text-sm font-bold bg-background px-2.5 py-1 rounded-lg border border-border/40">
              {getValue(p)} <span className="text-[10px] text-muted-foreground font-normal">{suffix}</span>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-xs text-muted-foreground text-center py-2">No data available</div>}
      </div>
    </div>
  );
}
