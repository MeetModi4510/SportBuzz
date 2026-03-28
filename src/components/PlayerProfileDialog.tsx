
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Player } from "@/data/types";
import { TeamLogo } from "@/components/TeamLogo";
import { SportIcon } from "@/components/SportIcon";
import { cn } from "@/lib/utils";
import {
    Trophy,
    MapPin,
    Calendar,
    User,
    Activity,
    Award,
    TrendingUp,
    Disc,
    Footprints,
    RectangleVertical,
    Hand,
    ArrowUpCircle,
    ArrowDownCircle,
    Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { teams } from "@/data/mockData";
import { cricketApi } from "@/services/api";
import { Loader2 } from "lucide-react";

interface PlayerProfileDialogProps {
    player: Player | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PlayerProfileDialog = ({ player, isOpen, onClose }: PlayerProfileDialogProps) => {
    const [imgError, setImgError] = useState(false);
    const [apiData, setApiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch player info when dialog opens
    useEffect(() => {
        const fetchPlayerInfo = async () => {
            if (isOpen && player && player.sport === 'cricket' && player.id) {
                // Check if it's a real API player ID (usually UUID or numeric string from API)
                if (player.id.length > 5 || !isNaN(Number(player.id))) {
                    setIsLoading(true);
                    try {
                        const response = await cricketApi.getPlayerInfo(player.id);
                        if (response.data) {
                            setApiData(response.data);
                        }
                    } catch (error) {
                        console.error("Failed to fetch player info:", error);
                    } finally {
                        setIsLoading(false);
                    }
                }
            } else {
                setApiData(null);
            }
        };

        fetchPlayerInfo();
    }, [isOpen, player]);

    if (!player) return null;

    const team = teams.find(t => t.id === player.teamId);

    const getRatingColor = (rating: number) => {
        // Handle both 0-10 and 0-100 scales
        const normalizedRating = rating > 10 ? rating / 10 : rating;
        if (normalizedRating >= 9.0) return "text-completed bg-completed/20 ring-completed/50";
        if (normalizedRating >= 8.0) return "text-upcoming bg-upcoming/20 ring-upcoming/50";
        if (normalizedRating >= 6.0) return "text-blue-500 bg-blue-500/10 ring-blue-500/30";
        return "text-muted-foreground bg-muted ring-muted";
    };

    const renderPlayerImage = () => {
        if (player.image && !imgError) {
            return (
                <img
                    src={player.image}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            );
        }

        if (player.photo && player.photo.startsWith('fp-') && !imgError) {
            const playerId = player.photo.replace('fp-', '');
            return (
                <img
                    src={`https://media.api-sports.io/football/players/${playerId}.png`}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            );
        }

        // Use API image if available
        if (apiData?.playerImg && !imgError) {
            return (
                <img
                    src={apiData.playerImg}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            );
        }

        return (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
                <SportIcon sport={player.sport} size={64} className="opacity-50" />
            </div>
        );
    };

    // Helper to render stat item
    const StatItem = ({ label, value, icon: Icon, color = "text-primary" }: any) => (
        <div className="flex flex-col items-center p-3 bg-card border border-border rounded-xl">
            <div className={cn("p-2 rounded-full bg-secondary mb-2", color)}>
                <Icon size={18} />
            </div>
            <span className="text-xl font-bold font-mono">{value}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-border">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading player profile...</p>
                    </div>
                ) : (
                    <>
                        {/* Header / Banner */}
                        <div className="relative h-32 md:h-40 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
                            <div className="absolute top-4 right-4 z-10">
                                {team && <TeamLogo logo={team.logo} name={team.name} size="md" />}
                            </div>

                            {/* Profile Content */}
                            <div className="relative px-6 pb-6">
                                {/* Avatar - overlapping header */}
                                <div className="relative -mt-16 mb-4 flex justify-between items-end">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden bg-secondary shadow-lg">
                                        {renderPlayerImage()}
                                    </div>

                                    {/* Rating Badge */}
                                    <div className={cn(
                                        "flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm mb-2 ring-1",
                                        getRatingColor(apiData?.localOverallRating || player.rating)
                                    )}>
                                        <div className="flex items-center gap-1.5">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-lg">{(apiData?.localOverallRating ? apiData.localOverallRating / 10 : player.rating).toFixed(1)}</span>
                                        </div>
                                        <span className="text-[9px] uppercase tracking-tighter opacity-70">Overall Rating</span>
                                    </div>
                                </div>

                                {/* Name & Title */}
                                <div className="mb-6">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold">{apiData?.name || player.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        {team && <span className="font-medium text-foreground">{team.name}</span>}
                                        <span>•</span>
                                        <span>{apiData?.role || player.position}</span>
                                        {apiData?.country && (
                                            <>
                                                <span>•</span>
                                                <span>{apiData.country}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Performance Trend */}
                                {apiData?.formTrend && apiData.formTrend.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <TrendingUp size={14} /> Recent Form Trend (Last {apiData.formTrend.length} Matches)
                                        </h4>
                                        <div className="flex items-end gap-1.5 h-16 bg-secondary/20 p-3 rounded-xl border border-border/50">
                                            {apiData.formTrend.map((rating: number, i: number) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex-1 rounded-t-sm transition-all hover:opacity-80",
                                                        rating >= 80 ? "bg-completed" : rating >= 60 ? "bg-blue-500" : rating >= 40 ? "bg-upcoming" : "bg-muted-foreground"
                                                    )}
                                                    style={{ height: `${Math.max(10, rating)}%` }}
                                                    title={`Rating: ${rating / 10}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground px-1 uppercase font-bold tracking-tighter">
                                            <span>Older</span>
                                            <span>Latest</span>
                                        </div>
                                    </div>
                                )}

                                {/* Current Match Performance */}
                                {player.matchStats && (
                                    <div className="mb-6 space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Activity size={14} /> Match Performance
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {/* Show specific match stats based on sport */}
                                            {player.sport === 'football' && (
                                                <>
                                                    {player.matchStats.goals !== undefined && <StatItem label="Goals" value={player.matchStats.goals} icon={Disc} />}
                                                    {player.matchStats.assists !== undefined && <StatItem label="Assists" value={player.matchStats.assists} icon={Footprints} />}
                                                    {player.matchStats.saves !== undefined && <StatItem label="Saves" value={player.matchStats.saves} icon={Hand} />}
                                                    {/* Only show cards if > 0 to save space, or if relevant */}
                                                    {(player.matchStats.yellowCards || 0) > 0 && <StatItem label="Yellow" value={player.matchStats.yellowCards} icon={RectangleVertical} color="text-yellow-500" />}
                                                    {(player.matchStats.redCards || 0) > 0 && <StatItem label="Red" value={player.matchStats.redCards} icon={RectangleVertical} color="text-red-500" />}
                                                </>
                                            )}
                                            {player.sport === 'cricket' && (
                                                <>
                                                    {(player.matchStats as any).runs !== undefined && <StatItem label="Runs" value={(player.matchStats as any).runs} icon={Activity} />}
                                                    {(player.matchStats as any).wickets !== undefined && <StatItem label="Wickets" value={(player.matchStats as any).wickets} icon={Disc} />}
                                                </>
                                            )}
                                        </div>

                                        {/* Substitution Info */}
                                        <div className="flex gap-4 mt-2 text-sm">
                                            {player.matchStats.substitutedIn && (
                                                <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900">
                                                    <ArrowUpCircle size={16} />
                                                    <span>Subbed In: {player.matchStats.substitutedIn}</span>
                                                </div>
                                            )}
                                            {player.matchStats.substitutedOut && (
                                                <div className="flex items-center gap-2 text-red-600 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900">
                                                    <ArrowDownCircle size={16} />
                                                    <span>Subbed Out: {player.matchStats.substitutedOut}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Season Stats / API Stats */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Trophy size={14} /> {apiData ? 'Career Stats' : 'Season Stats'}
                                    </h4>

                                    {apiData ? (
                                        <div className="space-y-4">
                                            {apiData.battingStyle && (
                                                <div className="flex justify-between items-center p-2.5 bg-secondary/30 rounded-lg border border-border/50">
                                                    <span className="text-sm text-muted-foreground">Batting Style</span>
                                                    <span className="font-medium">{apiData.battingStyle}</span>
                                                </div>
                                            )}
                                            {apiData.bowlingStyle && (
                                                <div className="flex justify-between items-center p-2.5 bg-secondary/30 rounded-lg border border-border/50">
                                                    <span className="text-sm text-muted-foreground">Bowling Style</span>
                                                    <span className="font-medium">{apiData.bowlingStyle}</span>
                                                </div>
                                            )}
                                            {apiData.dateOfBirth && (
                                                <div className="flex justify-between items-center p-2.5 bg-secondary/30 rounded-lg border border-border/50">
                                                    <span className="text-sm text-muted-foreground">DOB</span>
                                                    <span className="font-medium">{new Date(apiData.dateOfBirth).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(player.stats).map(([key, value]) => {
                                                // Skip if already shown or specific keys
                                                if (key === 'rating') return null;
                                                return (
                                                    <div key={key} className="flex justify-between items-center p-2.5 bg-secondary/30 rounded-lg border border-border/50">
                                                        <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="font-bold font-mono">{String(value)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
