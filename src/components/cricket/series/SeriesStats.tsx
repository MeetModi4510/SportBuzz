import React from 'react';
import { BarChart, Activity } from 'lucide-react';
import { useLocalIplStats } from '@/hooks/cricket/useCricketSeries';

export default function SeriesStats({ season }: { season: string }) {
    const { data: stats, isLoading, error } = useLocalIplStats(season);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Activity className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading stats...</p>
            </div>
        );
    }

    if (error || !stats || (stats.topRunScorers.length === 0 && stats.topWicketTakers.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border">
                <BarChart className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Stats Available</h3>
                <p className="text-muted-foreground">Statistics are not available for this series.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Run Scorers */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="bg-primary/10 p-4 border-b border-border">
                    <h3 className="font-bold text-primary">Top Run Scorers</h3>
                </div>
                <div className="divide-y divide-border">
                    {stats.topRunScorers.slice(0, 10).map((player: any, index: number) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground font-mono text-sm w-4">{index + 1}</span>
                                <span className="font-bold text-foreground">{player.name || player.player}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">{player.balls || player.matches} {player.balls ? 'balls' : 'M'}</span>
                                <span className="font-black text-primary">{player.runs}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Wicket Takers */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="bg-emerald-500/10 p-4 border-b border-border">
                    <h3 className="font-bold text-emerald-500">Top Wicket Takers</h3>
                </div>
                <div className="divide-y divide-border">
                    {stats.topWicketTakers.slice(0, 10).map((player: any, index: number) => (
                        <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground font-mono text-sm w-4">{index + 1}</span>
                                <span className="font-bold text-foreground">{player.name || player.player}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">{player.ballsBowled ? Math.floor(player.ballsBowled/6) : player.matches} {player.ballsBowled ? 'O' : 'M'}</span>
                                <span className="font-black text-emerald-500">{player.wickets}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
