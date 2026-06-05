import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Activity, Zap, Flame, AlertTriangle
} from "lucide-react";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import type { Match } from "@/data/types";

// ─── Colors ──────────────────────────────────────────────────────
const HOME_COLOR = "#3b82f6";
const AWAY_COLOR = "#ef4444";
const CHART_TOOLTIP_STYLE = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
};

// ─── Section Wrapper ─────────────────────────────────────────────
const AnalyticsSection = ({
    icon, title, subtitle, children, className,
}: {
    icon: React.ReactNode; title: string; subtitle?: string;
    children: React.ReactNode; className?: string;
}) => (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
        <div className="px-5 py-3.5 border-b border-border bg-secondary/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
            <div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
interface MatchPerformanceLabProps {
    match: Match;
}

export const MatchPerformanceLab = ({ match }: MatchPerformanceLabProps) => {
    const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "Home";
    const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "Away";

    // 1. Momentum Graph (from match.details.graph)
    const momentumData = useMemo(() => {
        if (!match.details?.graph || !Array.isArray(match.details.graph)) return null;
        
        return match.details.graph.map((point: any) => {
            // Sofascore graph usually has value > 0 for home, < 0 for away
            const val = point.value || 0;
            const homeMomentum = val > 0 ? val : 0;
            const awayMomentum = val < 0 ? Math.abs(val) : 0;
            return {
                minute: point.minute,
                [homeTeam]: homeMomentum,
                [awayTeam]: awayMomentum
            };
        }).sort((a, b) => a.minute - b.minute);
    }, [match.details?.graph, homeTeam, awayTeam]);

    const hasNoData = !momentumData && !match.details?.playerStatistics && !match.details?.playerHeatmap;

    if (hasNoData) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Performance Data Not Available</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Advanced performance analytics, momentum graphs, and player heatmaps are not provided by the API for this specific match.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── 1. Momentum Graph ── */}
            {momentumData ? (
                <AnalyticsSection icon={<Activity size={16} />} title="Match Momentum" subtitle="Real-time dominance graph from Sofascore">
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={momentumData}>
                                <defs>
                                    <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={HOME_COLOR} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={HOME_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={AWAY_COLOR} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={AWAY_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                                <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "currentColor" }} tickCount={10} label={{ value: "Minute", position: "insideBottom", offset: -5, fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10, fill: "currentColor" }} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Area type="monotone" dataKey={homeTeam} stroke={HOME_COLOR} fill="url(#homeGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey={awayTeam} stroke={AWAY_COLOR} fill="url(#awayGrad)" strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AnalyticsSection>
            ) : (
                <AnalyticsSection icon={<Activity size={16} />} title="Match Momentum">
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-sm">
                        <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                        Momentum graph not available
                    </div>
                </AnalyticsSection>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── 2. Player Heatmaps (Real API Integration Placeholder) ── */}
                <AnalyticsSection icon={<Flame size={16} />} title="Player Heatmaps" subtitle="Pitch zone presence">
                    {match.details?.playerHeatmap ? (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-sm">
                             {/* The heatmap structure from Sofascore is complex and requires coordinate mapping. For now, acknowledge its presence. */}
                             <Flame className="h-8 w-8 mb-2 opacity-50 text-orange-500" />
                             <p>Heatmap data received. Coordinate mapping renderer in development.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-sm">
                            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                            Heatmap data not available for this match
                        </div>
                    )}
                </AnalyticsSection>

                {/* ── 3. Player Statistics (Real API Integration Placeholder) ── */}
                <AnalyticsSection icon={<Zap size={16} />} title="Player Statistics" subtitle="Advanced individual stats">
                     {match.details?.playerStatistics ? (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-sm">
                             <Zap className="h-8 w-8 mb-2 opacity-50 text-blue-500" />
                             <p>Player statistics received.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-sm">
                            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                            Advanced player statistics not available
                        </div>
                    )}
                </AnalyticsSection>
            </div>
        </div>
    );
};

export default MatchPerformanceLab;
