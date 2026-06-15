
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
import { LineupPlayerImage } from "@/components/football/LineupPlayerImage";
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
import { useEspnPlayerProfile } from "@/hooks/football/useEspnQueries";
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

    // Fetch football player profile
    const isFootballPlayer = Boolean(isOpen && player && player.sport === 'football' && player.id);
    const { data: espnProfile, isLoading: espnLoading } = useEspnPlayerProfile(player?.id || '', player?.leagueId, isFootballPlayer);

    // Fetch cricket player info when dialog opens
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
            } else if (player?.sport === 'football') {
                if (espnProfile?.data) {
                    setApiData(espnProfile.data);
                } else {
                    setApiData(null);
                }
            } else {
                setApiData(null);
            }
        };

        fetchPlayerInfo();
    }, [isOpen, player, espnProfile]);

    if (!player) return null;

    const isDataLoading = isLoading || (isFootballPlayer && espnLoading);

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

        if (player.sport === 'football' && player.id) {
            return (
                <LineupPlayerImage 
                    playerId={player.id} 
                    playerName={player.name} 
                    className="w-full h-full object-cover" 
                />
            );
        }

        return (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
                <SportIcon sport={player.sport} size={64} className="opacity-50" />
            </div>
        );
    };



    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-[#0a0a0c] border border-white/10 shadow-2xl rounded-2xl">
                {isDataLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                        <p className="text-sm text-white/40 font-medium">Loading profile...</p>
                    </div>
                ) : (
                    <div className="relative max-h-[85vh] overflow-y-auto overflow-x-hidden">
                        {/* Header Banner */}
                        <div className="h-28 relative bg-gradient-to-br from-white/10 to-transparent">
                            {team && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 overflow-hidden">
                                    <img src={team.logo} alt="team" className="w-48 h-48 object-contain blur-[2px]" />
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="px-6 pb-6 relative -mt-14">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-28 h-28 rounded-full border-4 border-[#0a0a0c] overflow-hidden bg-[#0a0a0c] shadow-2xl relative z-10 flex items-center justify-center">
                                    {team && (
                                        <img src={team.logo} className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" alt="" />
                                    )}
                                    <div className="relative z-10 w-full h-full">
                                        {renderPlayerImage()}
                                    </div>
                                </div>

                                {/* Name & Titles */}
                                <div className="mt-3 w-full">
                                    <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                        {apiData?.name || player.name}
                                    </DialogTitle>
                                    <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                                        {team && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                                <img src={team.logo} className="w-3.5 h-3.5 object-contain" alt="" />
                                                <span className="text-[11px] font-bold text-white/80">{team.name}</span>
                                            </div>
                                        )}
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                                            {apiData?.role || player.position}
                                        </span>
                                        {apiData?.country && (
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-white/60">
                                                {apiData.country}
                                            </span>
                                        )}
                                    </div>
                                </div>


                            </div>

                            {/* Divider */}
                            <div className="w-full h-px bg-white/5 my-6" />

                            {/* Match Performance */}
                            {player.matchStats && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Match Performance</h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden p-2">
                                        {player.sport === 'football' && player.rawMatchStats && (
                                            <div className="grid grid-cols-2 gap-x-6">
                                                {Object.entries(player.rawMatchStats)
                                                    .filter(([key]) => key.toLowerCase() !== 'rating')
                                                    .map(([key, value]) => {
                                                        const label = key.replace(/([A-Z])/g, ' $1').trim();
                                                        let labelColor = "text-white/60";
                                                        let valColor = "text-white";
                                                        
                                                        if (key.toLowerCase().includes('yellow') && Number(value) > 0) {
                                                            labelColor = "text-yellow-500/80";
                                                            valColor = "text-yellow-500";
                                                        } else if (key.toLowerCase().includes('red') && Number(value) > 0) {
                                                            labelColor = "text-red-500/80";
                                                            valColor = "text-red-500";
                                                        } else if (key.toLowerCase().includes('goal') && Number(value) > 0) {
                                                            labelColor = "text-emerald-500/80";
                                                            valColor = "text-emerald-400";
                                                        }
                                                        
                                                        return (
                                                            <div key={key} className="flex justify-between items-center py-2.5 px-2 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                                <span className={`text-[11px] font-semibold capitalize ${labelColor}`}>{label}</span>
                                                                <span className={`text-xs font-black tabular-nums ${valColor}`}>{String(value)}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                        {player.sport === 'cricket' && (
                                            <>
                                                {(player.matchStats as any).runs !== undefined && (
                                                    <div className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                        <span className="text-xs font-semibold capitalize text-white/60">Runs</span>
                                                        <span className="text-sm font-black tabular-nums text-white">{(player.matchStats as any).runs}</span>
                                                    </div>
                                                )}
                                                {(player.matchStats as any).wickets !== undefined && (
                                                    <div className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                        <span className="text-xs font-semibold capitalize text-white/60">Wickets</span>
                                                        <span className="text-sm font-black tabular-nums text-white">{(player.matchStats as any).wickets}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Substitution Badges */}
                                    {(player.matchStats.substitutedIn || player.matchStats.substitutedOut) && (
                                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                                            {player.matchStats.substitutedIn && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                                    <ArrowUpCircle size={14} strokeWidth={3} />
                                                    <span className="text-[11px] font-bold">Subbed In: {player.matchStats.substitutedIn}</span>
                                                </div>
                                            )}
                                            {player.matchStats.substitutedOut && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
                                                    <ArrowDownCircle size={14} strokeWidth={3} />
                                                    <span className="text-[11px] font-bold">Subbed Out: {player.matchStats.substitutedOut}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Match Performance Info */}
                            {!apiData && player.personalInfo && Object.values(player.personalInfo).some(v => v) && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Personal Profile</h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                        {Object.entries(player.personalInfo).map(([key, value]) => {
                                            if (!value) return null;
                                            return (
                                                <div key={key} className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                    <span className="text-xs font-semibold text-white/60 capitalize">{key}</span>
                                                    <span className="text-sm font-black text-white text-right">{String(value)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Season/Career Stats */}
                            {player.sport !== 'football' && (!apiData && Object.keys(player.stats).filter(k => k !== 'rating').length > 0) && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Season Statistics</h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                        {Object.entries(player.stats)
                                            .filter(([k]) => k !== 'rating' && k !== 'Goals' && k !== 'Assists' && k !== 'Yellow Cards' && k !== 'Red Cards' && k !== 'Saves')
                                            .map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center px-4 py-3">
                                                    <span className="text-xs font-semibold text-white/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="text-sm font-black text-white tabular-nums">{String(value)}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Football Detailed Career Profile */}
                            {apiData && player.sport === 'football' && (
                                <>
                                    <div className="mt-6 space-y-4">
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Personal Profile</h4>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                            {[
                                                ['Age', apiData.age],
                                                ['Date of Birth', apiData.dob],
                                                ['Height', apiData.height],
                                                ['Weight', apiData.weight],
                                                ['Birth Place', apiData.birthPlace],
                                                ['Citizenship', apiData.citizenship]
                                            ].map(([label, val]) => val && (
                                                <div key={label} className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                    <span className="text-xs font-semibold text-white/60 capitalize">{label}</span>
                                                    <span className="text-sm font-black text-white text-right">{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {apiData.statsSummary && apiData.statsSummary.length > 0 && (
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Season Statistics</h4>
                                            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                                {apiData.statsSummary.map((stat: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                        <span className="text-xs font-semibold text-white/60 capitalize">{stat.displayName || stat.name}</span>
                                                        <span className="text-sm font-black text-white text-right">{String(stat.displayValue || stat.value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Cricket Career Profile */}
                            {apiData && player.sport === 'cricket' && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Career Profile</h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                                        {apiData.battingStyle && (
                                            <div className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                <span className="text-xs font-semibold text-white/60">Batting Style</span>
                                                <span className="text-sm font-black text-white text-right">{apiData.battingStyle}</span>
                                            </div>
                                        )}
                                        {apiData.bowlingStyle && (
                                            <div className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                <span className="text-xs font-semibold text-white/60">Bowling Style</span>
                                                <span className="text-sm font-black text-white text-right">{apiData.bowlingStyle}</span>
                                            </div>
                                        )}
                                        {apiData.dateOfBirth && (
                                            <div className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                                <span className="text-xs font-semibold text-white/60">Date of Birth</span>
                                                <span className="text-sm font-black text-white">{new Date(apiData.dateOfBirth).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
