import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { Loader2 } from "lucide-react";
import { CricketPlayerImage } from "@/components/CricketPlayerImage";

interface PlayerProfilePanelProps {
    playerId: string | null;
    isOpen: boolean;
    onClose: () => void;
    fallbackName?: string;
}

export const PlayerProfilePanel = ({ playerId, isOpen, onClose, fallbackName }: PlayerProfilePanelProps) => {
    const { data: profile, isLoading } = usePlayerProfile(playerId);

    const renderTable = (stats: any, title: string) => {
        if (!stats) return null;
        const formats = ['test', 'odi', 't20', 'ipl'];
        
        // stats is { "matches": { "test": "35", "odi": "43" }, "runs": { "test": "2599" } }
        const headers = Object.keys(stats).filter(k => k !== 'matches');
        
        // Only show table if at least one format has data
        const hasData = formats.some(f => stats.matches && stats.matches[f] && stats.matches[f] !== '0');
        if (!hasData) return null;

        return (
            <div className="mt-6">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{title} Stats</h4>
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Format</th>
                                    <th className="px-4 py-3 font-semibold text-right">M</th>
                                    {headers.map(h => {
                                        let displayH = h;
                                        if (h === 'highest') displayH = 'HS';
                                        else if (h === 'average') displayH = 'Avg';
                                        else if (h.length > 4 && h !== 'balls' && h !== 'runs') displayH = h.substring(0, 3);
                                        return (
                                            <th key={h} className="px-4 py-3 font-semibold text-right uppercase" title={h}>
                                                {displayH}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {formats.map(format => {
                                    if (!stats.matches || !stats.matches[format] || stats.matches[format] === '0') return null;
                                    return (
                                        <tr key={format} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-bold uppercase">{format}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{stats.matches[format]}</td>
                                            {headers.map(h => (
                                                <td key={h} className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                    {stats[h]?.[format] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto bg-background border-l flex flex-col gap-0 shadow-2xl">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Fetching profile...</p>
                    </div>
                ) : profile ? (
                    <div className="flex flex-col pb-8">
                        {/* Header Area */}
                        <div className="relative h-48 bg-gradient-to-br from-primary/10 via-background to-background flex flex-col justify-end p-6 border-b">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full border-4 border-background bg-muted shadow-xl overflow-hidden shrink-0">
                                    <CricketPlayerImage 
                                        playerId={profile.id} 
                                        playerName={profile.name} 
                                        className="w-full h-full object-cover scale-110 object-top"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <SheetTitle className="text-2xl font-black text-foreground drop-shadow-sm tracking-tight leading-none">
                                        {profile.name}
                                    </SheetTitle>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {profile.personalInfo?.role && (
                                            <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                                {profile.personalInfo.role}
                                            </span>
                                        )}
                                        {profile.personalInfo?.battingStyle && (
                                            <span className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
                                                Bat: {profile.personalInfo.battingStyle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="px-6 mt-6 space-y-8">
                            
                            {/* Personal Bio */}
                            {profile.personalInfo && Object.keys(profile.personalInfo).length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Personal Profile</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Born', value: profile.personalInfo.born },
                                            { label: 'Birth Place', value: profile.personalInfo.birthPlace },
                                            { label: 'Bowling', value: profile.personalInfo.bowlingStyle },
                                        ].map((info) => info.value && (
                                            <div key={info.label} className="bg-card border rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground/70">{info.label}</span>
                                                <span className="text-sm font-semibold text-foreground line-clamp-2" title={info.value}>{info.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Batting Stats */}
                            {renderTable(profile.battingStats, 'Career Batting')}
                            
                            {/* Bowling Stats */}
                            {renderTable(profile.bowlingStats, 'Career Bowling')}
                            
                            {(!profile.battingStats || Object.keys(profile.battingStats).length === 0) && 
                             (!profile.bowlingStats || Object.keys(profile.bowlingStats).length === 0) && (
                                <div className="text-center py-10">
                                    <p className="text-sm text-muted-foreground">Detailed career statistics not available for this player.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-muted mb-4 flex items-center justify-center opacity-50">
                            <span className="text-3xl">😕</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{fallbackName || 'Player Not Found'}</h3>
                        <p className="text-sm text-muted-foreground">Unable to load profile data.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
