import React, { useState } from 'react';
import { Users, Info } from 'lucide-react';
import { CricketPlayerImage } from '@/components/CricketPlayerImage';
import { PlayerProfilePanel } from '@/components/cricket/PlayerProfilePanel';
import { formatPlayerName } from '@/lib/playerNames';

interface Player {
    id: number | string;
    name: string;
    role?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    captain?: boolean;
    keeper?: boolean;
    imageDetails?: {
        imageId: string | number;
    };
}

interface TeamSquad {
    teamName: string;
    teamId: number | string;
    imageDetails?: { imageId: string | number };
    'playing XI'?: Player[];
    bench?: Player[];
    'support staff'?: Player[];
}

interface SquadsTabProps {
    squadsData?: {
        team1?: TeamSquad;
        team2?: TeamSquad;
    };
    loading: boolean;
    error: string | null;
}

export const SquadsTab: React.FC<SquadsTabProps> = ({ squadsData, loading, error }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
    const [selectedPlayerFaceId, setSelectedPlayerFaceId] = useState<number | null>(null);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Loading match squads...</p>
            </div>
        );
    }

    if (error || !squadsData || (!squadsData.team1 && !squadsData.team2)) {
        return (
            <div className="p-8 text-center bg-card/40 border border-border/40 rounded-3xl backdrop-blur-md">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-foreground">Squads unavailable</p>
                <p className="text-sm text-muted-foreground">Squad information is not available for this match yet.</p>
            </div>
        );
    }

    const { team1, team2 } = squadsData;

    const handlePlayerClick = (p: Player) => {
        setSelectedPlayerId(String(p.id));
        setSelectedPlayerName(formatPlayerName(p.name));
        setSelectedPlayerFaceId(p.imageDetails?.imageId ? Number(p.imageDetails.imageId) : null);
    };

    const getTeamInfo = (teamData?: TeamSquad | any) => {
        if (!teamData) return { name: '', imageId: null };
        let name = teamData.teamName || teamData.name;
        let imageId = teamData.imageDetails?.imageId || teamData.imageId;

        if (teamData.team) {
            name = name || teamData.team.name || teamData.team.teamName;
            imageId = imageId || teamData.team.imageId || teamData.team.imageDetails?.imageId;
        }
        
        return { name, imageId };
    };

    const renderPlayerGroup = (title: string, players?: Player[], isSupportStaff: boolean = false, team?: TeamSquad) => {
        if (!players || players.length === 0) return null;

        const { name: tName, imageId: tImageId } = getTeamInfo(team);

        return (
            <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                    {team && tImageId ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary border border-border/50 shrink-0">
                            <img 
                                src={`/api/cricket/scraped/team-logo/${tImageId}`} 
                                alt={tName} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + tName + '&background=random'; }}
                            />
                        </div>
                    ) : (
                        <Info className="w-4 h-4 text-primary" />
                    )}
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                        {team ? `${tName} ` : ''}{title} <span className="text-muted-foreground ml-1">({players.length})</span>
                    </h3>
                </div>
                <div className="flex flex-col gap-3">
                    {players.map((p, i) => {
                        const imageId = p.imageDetails?.imageId;
                        return (
                        <div 
                            key={`${p.id}-${i}`} 
                            onClick={() => handlePlayerClick(p)}
                            className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 p-2 sm:p-4 bg-card/40 hover:bg-card hover:shadow-md cursor-pointer transition-all duration-200 border border-border/40 hover:border-primary/30 rounded-xl sm:rounded-2xl h-auto min-h-[100px] sm:h-[112px] text-center sm:text-left"
                        >
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-secondary/50 flex-shrink-0 border border-border/50 sm:border-2 relative">
                                {imageId ? (
                                    <img 
                                        src={`https://static.cricbuzz.com/a/img/v1/152x152/i1/c${imageId}/player.jpg`} 
                                        alt={formatPlayerName(p.name)}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formatPlayerName(p.name))}&background=random`; }}
                                    />
                                ) : (
                                    <CricketPlayerImage playerId={p.id?.toString()} playerName={formatPlayerName(p.name)} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col items-center sm:items-start w-full">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-1.5 w-full">
                                    <h4 className="font-bold text-[11px] sm:text-sm text-foreground break-words line-clamp-2 leading-tight">{formatPlayerName(p.name)}</h4>
                                    {!isSupportStaff && p.captain && <span className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-primary/20 text-primary whitespace-nowrap">C</span>}
                                    {!isSupportStaff && p.keeper && <span className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-blue-500/20 text-blue-500 whitespace-nowrap">WK</span>}
                                </div>
                                <p className="text-[9px] sm:text-xs font-medium text-muted-foreground mt-0.5 break-words line-clamp-1">{p.role || (isSupportStaff ? 'Staff' : 'Player')}</p>
                                {(p.battingStyle || p.bowlingStyle) && (
                                    <div className="flex flex-col gap-0.5 mt-1 sm:mt-1.5 text-[8px] sm:text-[10px] text-muted-foreground/80 w-full">
                                        {p.battingStyle && !p.battingStyle.includes('$undefined') && <span className="break-words line-clamp-1">{p.battingStyle}</span>}
                                        {p.bowlingStyle && !p.bowlingStyle.includes('$undefined') && <span className="break-words line-clamp-1">{p.bowlingStyle}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        );
    };

    const renderTeamHeader = (team?: TeamSquad) => {
        if (!team) return <div />;
        const { name: tName, imageId: tImageId } = getTeamInfo(team);
        
        return (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 border-b border-border/40 pb-4 text-center sm:text-left">
                {tImageId && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-secondary p-1 shrink-0">
                        <img 
                            src={`/api/cricket/scraped/team-logo/${tImageId}`} 
                            alt={tName} 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + tName + '&background=random'; }}
                        />
                    </div>
                )}
                <h2 className="text-sm sm:text-xl font-black uppercase tracking-wider line-clamp-1">{tName}</h2>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Unified Side-by-Side Layout for ALL screens */}
            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 md:gap-x-12 bg-muted/5 rounded-2xl md:rounded-3xl p-2 sm:p-4 md:p-8 border border-border/20">
                <div className="col-span-1 min-w-0">{renderTeamHeader(team1)}</div>
                <div className="col-span-1 min-w-0">{renderTeamHeader(team2)}</div>

                <div className="col-span-1 min-w-0">{renderPlayerGroup('Playing XI', team1?.['playing XI'], false, team1)}</div>
                <div className="col-span-1 min-w-0">{renderPlayerGroup('Playing XI', team2?.['playing XI'], false, team2)}</div>

                <div className="col-span-1 min-w-0">{renderPlayerGroup('Bench', team1?.bench, false, team1)}</div>
                <div className="col-span-1 min-w-0">{renderPlayerGroup('Bench', team2?.bench, false, team2)}</div>

                <div className="col-span-1 min-w-0">{renderPlayerGroup('Support Staff', team1?.['support staff'], true, team1)}</div>
                <div className="col-span-1 min-w-0">{renderPlayerGroup('Support Staff', team2?.['support staff'], true, team2)}</div>
            </div>

            <PlayerProfilePanel 
                playerId={selectedPlayerId} 
                isOpen={!!selectedPlayerId} 
                onClose={() => setSelectedPlayerId(null)} 
                fallbackName={selectedPlayerName}
                faceImageId={selectedPlayerFaceId}
            />
        </div>
    );
};
