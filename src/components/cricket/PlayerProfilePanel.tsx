import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { Loader2, Calendar, MapPin, Activity } from "lucide-react";
import { CricketPlayerImage } from "@/components/CricketPlayerImage";

interface PlayerProfilePanelProps {
    playerId: string | null;
    isOpen: boolean;
    onClose: () => void;
    fallbackName?: string;
    faceImageId?: number | null;
}

export const PlayerProfilePanel = ({ playerId, isOpen, onClose, fallbackName, faceImageId }: PlayerProfilePanelProps) => {
    const { data: profile, isLoading } = usePlayerProfile(playerId);

    const renderStatsCards = (stats: any, title: string) => {
        if (!stats) return null;
        const formats = ['test', 'odi', 't20', 'ipl'];
        
        const hasData = formats.some(f => stats.matches && stats.matches[f] && stats.matches[f] !== '0');
        if (!hasData) return null;

        const isBatting = title.toLowerCase().includes('batting');

        return (
            <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/30" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] text-center">{title}</h4>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/30" />
                </div>
                <div className="grid grid-cols-1 gap-5">
                    {formats.map(format => {
                        if (!stats.matches || !stats.matches[format] || stats.matches[format] === '0') return null;
                        
                        return (
                            <div key={format} className="bg-card border border-border/50 rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col group hover:border-primary/30 transition-colors">
                                {/* Header */}
                                <div className="px-5 py-3 flex justify-between items-center bg-muted/20 border-b border-border/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[11px]">
                                            {format.toUpperCase()}
                                        </div>
                                        <span className="font-bold text-foreground tracking-widest uppercase text-sm">{format}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-background border border-border/50 px-2.5 py-1 rounded-md shadow-sm">
                                        <span className="text-xs font-bold text-foreground">{stats.matches[format]}</span>
                                        <span className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">Matches</span>
                                    </div>
                                </div>
                                
                                {/* Body */}
                                <div className="p-5">
                                    {isBatting ? (
                                        <div className="flex flex-col gap-4">
                                            {/* Primary Stats */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-primary/70 tracking-widest mb-1">Runs</span>
                                                    <span className="text-2xl font-black text-primary tracking-tighter tabular-nums">{stats.runs?.[format] || '-'}</span>
                                                </div>
                                                <div className="bg-muted/30 border border-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Avg</span>
                                                    <span className="text-xl font-black text-foreground tracking-tighter tabular-nums">{stats.average?.[format] || '-'}</span>
                                                </div>
                                                <div className="bg-muted/30 border border-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">SR</span>
                                                    <span className="text-xl font-black text-foreground tracking-tighter tabular-nums">{stats.strikeRate?.[format] || '-'}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Milestones */}
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">HS</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats.highest?.[format] || '-'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">100s</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats['100s']?.[format] || '0'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">50s</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats['50s']?.[format] || '0'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Inns</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats.innings?.[format] || '-'}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Footer - Boundaries */}
                                            <div className="flex items-center justify-between text-xs font-medium px-2 pt-1">
                                                <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Boundaries</span>
                                                <div className="flex gap-4">
                                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-muted-foreground">4s</span><span className="font-bold text-foreground tabular-nums">{stats.fours?.[format] || '0'}</span></span>
                                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div><span className="text-muted-foreground">6s</span><span className="font-bold text-foreground tabular-nums">{stats.sixes?.[format] || '0'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {/* Primary Stats */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-red-500/70 tracking-widest mb-1">Wickets</span>
                                                    <span className="text-2xl font-black text-red-500 tracking-tighter tabular-nums">{stats.wickets?.[format] || '-'}</span>
                                                </div>
                                                <div className="bg-muted/30 border border-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Econ</span>
                                                    <span className="text-xl font-black text-foreground tracking-tighter tabular-nums">{stats.economy?.[format] || '-'}</span>
                                                </div>
                                                <div className="bg-muted/30 border border-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Avg</span>
                                                    <span className="text-xl font-black text-foreground tracking-tighter tabular-nums">{stats.average?.[format] || '-'}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Milestones */}
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">BBI</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats.bbi?.[format] || '-'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">5W</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats['5w']?.[format] || '0'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">10W</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats['10w']?.[format] || '0'}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center py-2 bg-muted/20 rounded-lg border border-border/20">
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Inns</span>
                                                    <span className="text-sm font-bold text-foreground mt-0.5">{stats.innings?.[format] || '-'}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Footer - Workload */}
                                            <div className="flex items-center justify-between text-xs font-medium px-2 pt-1">
                                                <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Workload</span>
                                                <div className="flex gap-4">
                                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div><span className="text-muted-foreground">Runs</span><span className="font-bold text-foreground tabular-nums">{stats.runs?.[format] || '0'}</span></span>
                                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div><span className="text-muted-foreground">Balls</span><span className="font-bold text-foreground tabular-nums">{stats.balls?.[format] || '0'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden bg-background border-l border-border/40 flex flex-col shadow-2xl">
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-10">
                    {/* Header Area - Renders instantly with cached data */}
                    <div className="relative pt-12 pb-8 px-6 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border/50">
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        <div className="relative z-10 flex flex-col items-center text-center gap-4">
                            <div className="rounded-full shadow-xl ring-4 ring-background overflow-hidden bg-muted flex items-center justify-center">
                                <CricketPlayerImage 
                                    playerId={faceImageId || profile?.faceImageId || null} 
                                    playerName={profile?.name || fallbackName} 
                                    size={140}
                                />
                            </div>
                            <div className="flex flex-col gap-1 items-center">
                                <SheetTitle className="text-3xl font-black text-foreground drop-shadow-sm tracking-tight leading-none">
                                    {profile?.name || fallbackName}
                                </SheetTitle>
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                                    {profile?.personalInfo?.role && (
                                        <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                            {profile.personalInfo.role}
                                        </span>
                                    )}
                                    {profile?.personalInfo?.battingStyle && (
                                        <span className="px-3 py-1 rounded-md bg-muted text-muted-foreground border border-border/50 text-[11px] font-medium shadow-sm">
                                            Bat: {profile.personalInfo.battingStyle}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area - Waits for API */}
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground font-medium">Fetching career stats...</p>
                        </div>
                    ) : profile ? (
                        <div className="px-6 mt-8 space-y-8">
                            
                            {/* Personal Bio */}
                            {profile.personalInfo && Object.keys(profile.personalInfo).length > 0 && (
                                <div>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/30" />
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] text-center">Personal Profile</h4>
                                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Born', value: profile.personalInfo.born, icon: Calendar },
                                            { label: 'Birth Place', value: profile.personalInfo.birthPlace, icon: MapPin },
                                            { label: 'Bowling', value: profile.personalInfo.bowlingStyle, icon: Activity },
                                        ].map((info) => info.value && (
                                            <div key={info.label} className="bg-card border border-border/50 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                                                <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-10 transition-opacity text-foreground">
                                                    <info.icon size={48} />
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 relative z-10">
                                                    <info.icon size={12} className="text-primary/70" />
                                                    {info.label}
                                                </span>
                                                <span className="text-sm font-semibold text-foreground line-clamp-2 relative z-10" title={info.value}>{info.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Batting Stats */}
                            {renderStatsCards(profile.battingStats, 'Career Batting Stats')}
                            
                            {/* Bowling Stats */}
                            {renderStatsCards(profile.bowlingStats, 'Career Bowling Stats')}
                            
                            {(!profile.battingStats || Object.keys(profile.battingStats).length === 0) && 
                             (!profile.bowlingStats || Object.keys(profile.bowlingStats).length === 0) && (
                                <div className="text-center py-12 bg-card border border-border/50 rounded-2xl shadow-sm">
                                    <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">Detailed career statistics not available</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-muted border border-border/50 mb-2 flex items-center justify-center shadow-inner">
                                <span className="text-2xl opacity-40">😕</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Unable to load detailed profile data.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
