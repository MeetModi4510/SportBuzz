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

    const renderPlayerGroup = (title: string, players?: Player[], isSupportStaff: boolean = false) => {
        if (!players || players.length === 0) return null;

        return (
            <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{title} <span className="text-muted-foreground ml-1">({players.length})</span></h3>
                </div>
                <div className="flex flex-col gap-3">
                    {players.map((p, i) => {
                        const imageId = p.imageDetails?.imageId;
                        return (
                        <div 
                            key={`${p.id}-${i}`} 
                            onClick={() => handlePlayerClick(p)}
                            className="flex items-center gap-4 p-4 bg-card/40 hover:bg-card hover:shadow-md cursor-pointer transition-all duration-200 border border-border/40 hover:border-primary/30 rounded-2xl h-[112px]"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary/50 flex-shrink-0 border-2 border-border/50 relative">
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
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <h4 className="font-bold text-sm text-foreground break-words line-clamp-2">{formatPlayerName(p.name)}</h4>
                                    {!isSupportStaff && p.captain && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary whitespace-nowrap">C</span>}
                                    {!isSupportStaff && p.keeper && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500 whitespace-nowrap">WK</span>}
                                </div>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5 break-words line-clamp-2">{p.role || (isSupportStaff ? 'Staff' : 'Player')}</p>
                                {(p.battingStyle || p.bowlingStyle) && (
                                    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-muted-foreground/80">
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
        return (
            <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                {team.imageDetails && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary p-1 shrink-0">
                        <img 
                            src={`/api/cricket/scraped/team-logo/${team.imageDetails.imageId}`} 
                            alt={team.teamName} 
                            className="w-full h-full object-contain" 
                            onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + team.teamName + '&background=random'; }}
                        />
                    </div>
                )}
                <h2 className="text-xl font-black uppercase tracking-wider">{team.teamName}</h2>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Desktop Unified Layout */}
            <div className="hidden lg:grid grid-cols-2 gap-x-12 bg-muted/5 rounded-3xl p-8 border border-border/20">
                <div className="col-span-1">{renderTeamHeader(team1)}</div>
                <div className="col-span-1">{renderTeamHeader(team2)}</div>

                <div className="col-span-1">{renderPlayerGroup('Playing XI', team1?.['playing XI'], false)}</div>
                <div className="col-span-1">{renderPlayerGroup('Playing XI', team2?.['playing XI'], false)}</div>

                <div className="col-span-1">{renderPlayerGroup('Bench', team1?.bench, false)}</div>
                <div className="col-span-1">{renderPlayerGroup('Bench', team2?.bench, false)}</div>

                <div className="col-span-1">{renderPlayerGroup('Support Staff', team1?.['support staff'], true)}</div>
                <div className="col-span-1">{renderPlayerGroup('Support Staff', team2?.['support staff'], true)}</div>
            </div>

            {/* Mobile Split Layout */}
            <div className="grid grid-cols-1 gap-8 lg:hidden">
                <div className="bg-muted/5 rounded-3xl p-6 border border-border/20">
                    {renderTeamHeader(team1)}
                    {renderPlayerGroup('Playing XI', team1?.['playing XI'], false)}
                    {renderPlayerGroup('Bench', team1?.bench, false)}
                    {renderPlayerGroup('Support Staff', team1?.['support staff'], true)}
                </div>
                <div className="bg-muted/5 rounded-3xl p-6 border border-border/20">
                    {renderTeamHeader(team2)}
                    {renderPlayerGroup('Playing XI', team2?.['playing XI'], false)}
                    {renderPlayerGroup('Bench', team2?.bench, false)}
                    {renderPlayerGroup('Support Staff', team2?.['support staff'], true)}
                </div>
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
