import React, { useState, useMemo, useEffect } from 'react';
import { useMatchFieldData } from '@/hooks/useMatchFieldData';
import { Loader2, AlertCircle, BarChart2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphsTabProps {
    matchId: string;
    inningsList?: { id: number; name: string }[];
    syncTrigger?: number;
    isLive?: boolean;
    isActive?: boolean;
    onBallsCalculated?: (balls: number) => void;
}

export const GraphsTab: React.FC<GraphsTabProps> = ({ matchId, inningsList = [], syncTrigger, isLive, isActive = true, onBallsCalculated }) => {
    const defaultInnings = inningsList.length > 0 ? (isLive ? inningsList[inningsList.length - 1].id : inningsList[0].id) : 1;
    const [activeInnings, setActiveInnings] = useState<number>(defaultInnings);

    // Auto-select latest innings if live, or first if completed
    useEffect(() => {
        if (inningsList.length > 0) {
            setActiveInnings(isLive ? inningsList[inningsList.length - 1].id : inningsList[0].id);
        }
    }, [isLive, inningsList.length]);

    const { 
        data: ballMapData, 
        loading: loadingBallMap, 
        error: ballMapError 
    } = useMatchFieldData(matchId, 'cbBallMap', isActive, String(activeInnings), syncTrigger);

    useEffect(() => {
        if (!onBallsCalculated) return;
        const ballsArray = ballMapData?.data?.balls || ballMapData?.balls;
        if (!ballsArray || ballsArray.length === 0) {
            onBallsCalculated(0);
            return;
        }

        let maxOverBalls = 0;
        ballsArray.forEach((b: any) => {
            if (b.overNum !== undefined && b.overNum !== null) {
                const entryBalls = (parseInt(String(b.overNum)) * 6) + (parseInt(String(b.ballNbr ?? 0)) || 0);
                if (entryBalls > maxOverBalls) maxOverBalls = entryBalls;
            }
        });

        onBallsCalculated(maxOverBalls);
    }, [ballMapData, onBallsCalculated]);

    const renderBallMap = () => {
        const ballsArray = ballMapData?.data?.balls || ballMapData?.balls;

        if (!ballsArray || ballsArray.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 p-12">
                    <p className="text-sm font-medium text-muted-foreground tracking-wide">Ball map data not available</p>
                </div>
            );
        }

        const oversMap = new Map<number, any[]>();
        ballsArray.forEach((b: any) => {
            const overInt = Math.floor(b.overNum);
            if (!oversMap.has(overInt)) oversMap.set(overInt, []);
            oversMap.get(overInt)!.push(b);
        });

        // Sorted newest to oldest
        const sortedOvers = Array.from(oversMap.keys()).sort((a, b) => b - a);

        return (
            <div className="mt-8 relative w-full pb-10">
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-10 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground bg-background/80 backdrop-blur-sm py-2 px-6 rounded-full w-max mx-auto border border-border/40 shadow-sm">
                    <span className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" /> Wicket</span>
                    <span className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-foreground shadow-sm" /> Boundary</span>
                    <span className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-muted/20" /> Dot</span>
                    <span className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-card" /> Run</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
                    {sortedOvers.map((over) => {
                        const balls = oversMap.get(over)!.sort((a, b) => a.ballNbr - b.ballNbr);
                        
                        let overRuns = 0;
                        balls.forEach(b => {
                            const match = String(b.ballLabel || '').match(/\d+/);
                            if (match) overRuns += parseInt(match[0]);
                        });

                        const isOdd = over % 2 !== 0;

                        return (
                            <div 
                                key={over} 
                                className={cn(
                                    "flex flex-col gap-3 p-5 rounded-[1.5rem] bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300",
                                    isOdd ? "md:col-start-1" : "md:col-start-2"
                                )}
                            >
                                {/* Over Header */}
                                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                    <span className="text-sm font-black tracking-widest text-muted-foreground/80 uppercase">Over {over + 1}</span>
                                    <span className="text-xs font-bold text-foreground bg-foreground/10 px-2.5 py-1 rounded-md">{overRuns > 0 ? `${overRuns} Runs` : 'Maiden'}</span>
                                </div>
                                
                                {/* Balls Layout (Horizontal Line) */}
                                <div className="flex flex-wrap gap-2.5 items-center pt-1">
                                    {balls.map((ball: any) => {
                                        const lbl = String(ball.ballLabel || '');
                                        const isWicket = ball.event === "WICKET" || lbl === "W";
                                        const isBoundary = lbl === "4" || lbl === "6";
                                        const isDot = lbl === "•" || lbl === ".";
                                        
                                        // Premium base shape: large, clear circles, centered text
                                        let style = "w-10 h-10 flex shrink-0 items-center justify-center text-[14px] rounded-full transition-transform hover:scale-110 cursor-default";
                                        let displayLbl = lbl;

                                        if (isWicket) {
                                            style += " bg-red-500 text-white font-black shadow-md border border-red-600/50";
                                            displayLbl = "W";
                                        } else if (isBoundary) {
                                            style += " bg-foreground text-background font-black shadow-md border border-border/20";
                                        } else if (isDot) {
                                            style += " bg-muted/20 border-2 border-border text-muted-foreground font-black text-2xl pb-1";
                                            displayLbl = "·";
                                        } else {
                                            style += " bg-card border-2 border-border shadow-sm text-foreground/80 font-bold";
                                        }

                                        return (
                                            <div 
                                                key={ball.ballNbr} 
                                                className={style}
                                                title={`${ball.event || 'Delivery'} - Striker: ${ball.batsmanStrikerId}`}
                                            >
                                                {displayLbl}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">

            {/* Innings Selector (For both Ball Map and Partnerships) */}
            {inningsList.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {inningsList.map((inn) => (
                        <button
                            key={inn.id}
                            onClick={() => setActiveInnings(inn.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                activeInnings === inn.id
                                    ? "bg-background border-2 border-primary text-primary shadow-sm"
                                    : "bg-muted/10 border-2 border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                            )}
                        >
                            {inn.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-[2.5rem] p-6 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden shadow-sm">
                <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-4">
                    <h3 className="text-2xl font-black uppercase tracking-wider text-foreground">
                        Over by Over Map
                        <span className="text-primary/80 ml-3 text-sm tracking-widest">{inningsList.find(i => i.id === activeInnings)?.name}</span>
                    </h3>
                </div>

                {loadingBallMap ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : ballMapError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 p-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-bold">Error Loading Data</p>
                    </div>
                ) : renderBallMap()}
            </div>
        </div>
    );
};
