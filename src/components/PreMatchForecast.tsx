import React, { useMemo, useState, useEffect } from 'react';
import { Match } from '@/data/types';
import {
    CloudRain,
    ThermometerSun,
    Wind,
    TrendingUp,
    TrendingDown,
    Activity,
    Droplets,
    Mountain,
    Loader2,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { customMatchApi } from '@/services/api';
import { calculateNRRMargin } from '@/lib/cricketUtils';

interface PreMatchForecastProps {
    match: any;
}

// Simple hash string function for deterministic random values
const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export function PreMatchForecast({ match }: PreMatchForecastProps) {
    const [forecastData, setForecastData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const id = match.id || match._id;
        if (!id) return;

        const fetchForecast = async () => {
            try {
                const res = await customMatchApi.getForecast(id);
                if (res.success && res.data) {
                    setForecastData(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch match forecast", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchForecast();
    }, [match.id, match._id]);

    const conditions = useMemo(() => {
        const seedStr = `${match.id || match._id || ''}-${match.homeTeam?.name || ''}-${match.awayTeam?.name || ''}`;
        const seed = hashString(seedStr);

        const pitchTypes = [
            { type: "Batting Paradise", desc: "Flat track with even bounce. Expect a high-scoring thriller.", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { type: "Green Top", desc: "Seam movement early on. Fast bowlers will dictate the powerplay.", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
            { type: "Dust Bowl", desc: "Dry, abrasive surface. Spinners will get massive turn from day 1.", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
            { type: "Balanced Surface", desc: "Good contest between bat and ball. Spinners come into play later.", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { type: "Two-Paced", desc: "Ball sticks to the surface initially. Cutters and slow bouncers are key.", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" }
        ];
        const pitch = pitchTypes[seed % pitchTypes.length];

        const temp = 22 + (seed % 15);
        const humidity = 40 + ((seed * 3) % 45);
        const rainChance = (seed * 7) % 60; // Max 60% for a match to not be "cancelled" in forecast
        const dewFactor = ['None', 'Light', 'Moderate', 'Heavy'][(seed * 2) % 4];

        return {
            pitch,
            weather: { temp, humidity, rainChance, dewFactor }
        };
    }, [match]);

    if (!match) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Bar: Win Probability */}
            <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-xl backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted" />

                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black tracking-tighter uppercase italic text-foreground/90">Win Probability</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{match.homeTeam?.name} vs {match.awayTeam?.name}</p>
                        </div>
                        <Activity className="text-primary w-5 h-5 animate-pulse" />
                    </div>

                    {isLoading ? (
                        <div className="h-4 bg-muted animate-pulse rounded-full" />
                    ) : (
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-secondary/50 rounded-full flex overflow-hidden border border-border/30">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out"
                                    style={{ width: `${forecastData?.winProb?.home || 50}%` }}
                                />
                                <div
                                    className="bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 ease-out"
                                    style={{ width: `${forecastData?.winProb?.away || 50}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-sm font-bold tracking-tight">
                                <div className="flex flex-col">
                                    <span className="text-blue-500">{forecastData?.winProb?.home || 50}%</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{match.homeTeam?.name}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-orange-500">{forecastData?.winProb?.away || 50}%</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{match.awayTeam?.name}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pitch Profile */}
                <div className={cn(
                    "p-6 rounded-3xl border transition-all duration-500 flex flex-col justify-between shadow-lg backdrop-blur-md",
                    conditions.pitch.bg, conditions.pitch.border
                )}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Mountain size={18} className={conditions.pitch.color} />
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Pitch Profile</h4>
                        </div>
                        <div className="space-y-1">
                            <div className={cn("text-2xl font-black italic tracking-tighter", conditions.pitch.color)}>
                                {forecastData?.venueInsight?.pitch || conditions.pitch.type}
                            </div>
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                {conditions.pitch.desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Weather & Venue */}
                <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 backdrop-blur-sm space-y-6 shadow-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ThermometerSun size={18} className="text-orange-400" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Conditons</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block">Temp</span>
                            <span className="text-xl font-black">{conditions.weather.temp}°C</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block">Rain Chance</span>
                            <span className="text-xl font-black">{conditions.weather.rainChance}%</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block">Score Par</span>
                            <span className="text-xl font-black text-primary">{forecastData?.venueInsight?.score || "280-300"}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block">Dew Factor</span>
                            <span className="text-xl font-black">{conditions.weather.dewFactor}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground italic font-medium leading-tight">
                            {forecastData?.venueInsight?.batting || "Balanced conditions expected."}
                        </p>
                    </div>
                </div>

                {/* Key Matchup */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 space-y-4 relative overflow-hidden group shadow-indigo-500/10 shadow-xl">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Activity size={18} strokeWidth={3} />
                        <h4 className="text-xs font-black uppercase tracking-widest">Key Matchup</h4>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4 pt-2">
                            <div className="h-10 bg-muted animate-pulse rounded-xl" />
                            <div className="h-10 bg-muted animate-pulse rounded-xl" />
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            <div className="flex flex-col items-center gap-1 text-center py-2">
                                <div className="text-sm font-black uppercase tracking-tighter text-indigo-300">
                                    {forecastData?.keyMatchup?.title || "Star Rivalry"}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xl font-black italic tracking-tighter text-foreground">{forecastData?.keyMatchup?.players?.[0]}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">vs</span>
                                    <span className="text-xl font-black italic tracking-tighter text-foreground">{forecastData?.keyMatchup?.players?.[1]}</span>
                                </div>
                            </div>
                            <div className="bg-background/60 backdrop-blur-xl rounded-2xl p-4 border border-indigo-500/30 shadow-inner">
                                <p className="text-[11px] text-center font-bold tracking-tight text-foreground/80 leading-relaxed italic">
                                    "{forecastData?.keyMatchup?.description}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tournament Context / Qualification Scenario */}
            {match.tournament && forecastData?.tournamentContext && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Award size={64} className="text-indigo-400" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Award size={18} strokeWidth={3} />
                            <h4 className="text-xs font-black uppercase tracking-widest">{forecastData.tournamentContext.title}</h4>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-sm font-medium leading-relaxed text-indigo-100">
                                {forecastData.tournamentContext.description}
                            </p>
                        </div>
                        {forecastData.tournamentContext.stats && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                    {forecastData.tournamentContext.stats.map((stat: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <div className="flex-1 text-center">
                                                <p className="text-[10px] uppercase text-indigo-300/60 font-black tracking-widest mb-1">{stat.label}</p>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xl font-black text-white">{stat.points} <span className="text-[10px] text-indigo-300/40 uppercase">Pts</span></span>
                                                    <span className={cn("text-xs font-black px-2 py-0.5 rounded-full mt-1", parseFloat(stat.nrr) > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                                        {stat.nrr}
                                                    </span>
                                                </div>
                                            </div>
                                            {idx === 0 && <div className="w-px h-10 bg-indigo-500/20"></div>}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* NRR Scenarios (Similar to Qualification Analyzer) */}
                                {(() => {
                                    const stats = forecastData.tournamentContext.stats;
                                    if (stats.length >= 2 && stats[0].raw && stats[1].raw) {
                                        const tournamentOvers = match.tournament?.overs || 20;
                                        const defaultTarget = tournamentOvers >= 50 ? 250 : tournamentOvers >= 20 ? 160 : 100;

                                        // Team 2 (Away) trying to overtake Team 1 (Home)
                                        const margin = calculateNRRMargin(
                                            stats[1].raw, // Team 2
                                            stats[0].raw, // Team 1
                                            defaultTarget,
                                            tournamentOvers
                                        );

                                        return (
                                            <div className="grid grid-cols-2 gap-3 h-full">
                                                <div className="bg-blue-500/5 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-3 flex flex-col justify-center gap-1 group/item hover:bg-blue-500/10 transition-colors">
                                                    <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                                                        <TrendingUp size={14} strokeWidth={3} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">If Chasing {defaultTarget}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white leading-tight">
                                                        {defaultTarget} should be chased under <span className="text-blue-400 text-sm">{margin.chaseBeforeOver || 'N/A'}</span> overs
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-medium">To overtake {stats[0].label} in NRR</p>
                                                </div>

                                                <div className="bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-3 flex flex-col justify-center gap-1 group/item hover:bg-amber-500/10 transition-colors">
                                                    <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                                        <TrendingDown size={14} strokeWidth={3} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">If Defending {defaultTarget}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white leading-tight">
                                                        You need to stop opponent under <span className="text-amber-500 text-sm">{margin.restrictToRuns !== null ? `${margin.restrictToRuns}` : 'N/A'}</span> runs
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-medium">To stay ahead of {stats[1].label}</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dynamics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sizzling Hot */}
                <div className="p-6 rounded-3xl bg-gradient-to-b from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 space-y-4 shadow-lg shadow-green-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-500">
                            <TrendingUp size={20} strokeWidth={3} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Sizzling Hot</h4>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">Form Leader</span>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-14 bg-muted/30 animate-pulse rounded-2xl" />)
                        ) : forecastData?.inForm?.length > 0 ? (
                            forecastData.inForm.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center group bg-card/40 hover:bg-card border border-border/30 hover:border-green-500/30 p-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="text-base font-black italic tracking-tighter group-hover:text-green-500 transition-colors">{p.name}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{p.team || 'Pro Player'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">{p.reason}</div>
                                        <div className="flex justify-end gap-1 mt-1">
                                            {[1, 2, 3].map(s => <div key={s} className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-border/20 rounded-3xl bg-muted/5">
                                <p className="text-xs font-bold text-muted-foreground italic">No historical data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Under Pressure */}
                <div className="p-6 rounded-3xl bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 space-y-4 shadow-lg shadow-red-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-500">
                            <TrendingDown size={20} strokeWidth={3} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Under Pressure</h4>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Needs Rhythm</span>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            [1, 2].map(i => <div key={i} className="h-14 bg-muted/30 animate-pulse rounded-2xl" />)
                        ) : forecastData?.outForm?.length > 0 ? (
                            forecastData.outForm.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-card/40 hover:bg-card border border-border/30 hover:border-red-500/30 p-4 rounded-2xl transition-all duration-300 shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="text-base font-black italic tracking-tighter group-hover:text-red-500 transition-colors">{p.name}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{p.team || 'Pro Player'}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-[10px] font-black text-red-500 opacity-60 uppercase">{p.reason}</div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-border/20 rounded-3xl bg-muted/5">
                                <p className="text-xs font-bold text-muted-foreground italic">Stability established</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
