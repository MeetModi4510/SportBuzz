
import { TeamLogo } from "@/components/TeamLogo";
import { FootballPitchLineup } from "@/components/FootballPitchLineup";
import { useFootballMatchSquads } from "@/hooks/useFootballMatches";
import { Loader2, Users } from "lucide-react";
import type { Match } from "@/data/types";
import { players } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface SimplePlayer {
    name: string;
    id?: string;
    [key: string]: any;
}

interface SquadsViewProps {
    homeTeam: { name: string; logo: string };
    awayTeam: { name: string; logo: string };
    homePlayers: SimplePlayer[];
    awayPlayers: SimplePlayer[];
    homeRestOfSquad?: SimplePlayer[];
    awayRestOfSquad?: SimplePlayer[];
    title: string;
}

const SquadsView = ({ homeTeam, awayTeam, homePlayers, awayPlayers, homeRestOfSquad, awayRestOfSquad, title }: SquadsViewProps) => {
    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Home Team */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                        <TeamLogo logo={homeTeam.logo} name={homeTeam.name} size="md" />
                        <h3 className="font-semibold text-foreground">{homeTeam.name}</h3>
                        <span className="ml-auto text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                            {title}
                        </span>
                    </div>
                    {homePlayers.length > 0 ? (
                        <div className="space-y-2">
                            {homePlayers.map((player, idx) => (
                                <div
                                    key={player.id || idx}
                                    className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-mono text-muted-foreground">
                                        {idx + 1}
                                    </div>
                                    <span className="font-medium text-foreground">{player.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                            <p>No players listed</p>
                        </div>
                    )}
                    {homeRestOfSquad && homeRestOfSquad.length > 0 && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-border/50">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rest of Squad</h4>
                            <div className="space-y-2">
                                {homeRestOfSquad.map((player, idx) => (
                                    <div
                                        key={player.id || idx}
                                        className="flex items-center gap-3 p-3 bg-secondary/10 border border-border/30 rounded-lg opacity-80"
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/50 text-xs font-mono text-muted-foreground">
                                            {idx + 1 + homePlayers.length}
                                        </div>
                                        <span className="font-medium text-muted-foreground">{player.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Away Team */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                        <TeamLogo logo={awayTeam.logo} name={awayTeam.name} size="md" />
                        <h3 className="font-semibold text-foreground">{awayTeam.name}</h3>
                        <span className="ml-auto text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                            {title}
                        </span>
                    </div>
                    {awayPlayers.length > 0 ? (
                        <div className="space-y-2">
                            {awayPlayers.map((player, idx) => (
                                <div
                                    key={player.id || idx}
                                    className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-mono text-muted-foreground">
                                        {idx + 1}
                                    </div>
                                    <span className="font-medium text-foreground">{player.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                            <p>No players listed</p>
                        </div>
                    )}
                    {awayRestOfSquad && awayRestOfSquad.length > 0 && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-border/50">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rest of Squad</h4>
                            <div className="space-y-2">
                                {awayRestOfSquad.map((player, idx) => (
                                    <div
                                        key={player.id || idx}
                                        className="flex items-center gap-3 p-3 bg-secondary/10 border border-border/30 rounded-lg opacity-80"
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/50 text-xs font-mono text-muted-foreground">
                                            {idx + 1 + awayPlayers.length}
                                        </div>
                                        <span className="font-medium text-muted-foreground">{player.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CricketSquads = ({ match, matchData, isLoading }: { match: Match; matchData?: any; isLoading?: boolean }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Determine context: Live/Completed -> "Playing XI", Upcoming -> "Squad"
    const statusLower = match.status?.toLowerCase();
    const isLiveOrCompleted = statusLower === 'live' || statusLower === 'completed';
    const title = isLiveOrCompleted ? "Playing XI" : "Squad";

    // Extract players from API data
    let homePlayers: SimplePlayer[] = [];
    let awayPlayers: SimplePlayer[] = [];

    // Helper to normalize strings for comparison
    const norm = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

    // Strategy 1: data.players (flat list with team/country info)
    // Strategy 2: data.teamInfo (populated team objects for local matches)
    // Strategy 3: data.squad (array of objects with teamName and players)

    const allPlayersFromList = matchData?.players || matchData?.data?.players || [];
    const teamInfo = matchData?.teamInfo || matchData?.data?.teamInfo || [];
    
    // For MongoDB matches, players are in the populated team objects
    const homeNameNorm = norm(match.homeTeam.name);
    const awayNameNorm = norm(match.awayTeam.name);

    if (Array.isArray(allPlayersFromList) && allPlayersFromList.length > 0) {
        homePlayers = allPlayersFromList.filter((p: any) => {
            const t = norm(p.teamName || p.country || p.team_name || '');
            return t.includes(homeNameNorm) || homeNameNorm.includes(t);
        });

        awayPlayers = allPlayersFromList.filter((p: any) => {
            const t = norm(p.teamName || p.country || p.team_name || '');
            return t.includes(awayNameNorm) || awayNameNorm.includes(t);
        });
    } else if (matchData?.homeTeam?.players) {
        // Local MongoDB structure: players are inside the team objects
        homePlayers = matchData.homeTeam.players.map((p: any) => typeof p === 'string' ? { name: p } : p);
        awayPlayers = (matchData.awayTeam?.players || []).map((p: any) => typeof p === 'string' ? { name: p } : p);
    }
    else if (matchData?.squad && Array.isArray(matchData.squad)) {
        // Squad object strategy
        const homeSquad = matchData.squad.find((s: any) => norm(s.teamName || s.name) === norm(match.homeTeam.name));
        const awaySquad = matchData.squad.find((s: any) => norm(s.teamName || s.name) === norm(match.awayTeam.name));

        if (homeSquad?.players) homePlayers = homeSquad.players;
        if (awaySquad?.players) awayPlayers = awaySquad.players;
    }
    // Fallback: Check teamInfo just in case
    else if (Array.isArray(teamInfo)) {
        const homeInfo = teamInfo.find((t: any) => norm(t.name) === norm(match.homeTeam.name));
        const awayInfo = teamInfo.find((t: any) => norm(t.name) === norm(match.awayTeam.name));

        if (homeInfo?.players) homePlayers = homeInfo.players;
        if (awayInfo?.players) awayPlayers = awayInfo.players;
    }

    // Fallback: If no API players found, use match.squads (mock support for non-API matches)
    if (homePlayers.length === 0 && awayPlayers.length === 0 && match.squads) {
        homePlayers = match.squads.homeTeam;
        awayPlayers = match.squads.awayTeam;
    }

    if (homePlayers.length === 0 && awayPlayers.length === 0) {
        // Specific fallback for "Upcoming" matches where API might yield nothing yet
        return (
            <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-10" />
                <p>Squads not announced yet</p>
            </div>
        );
    }

    let homeRestOfSquad: SimplePlayer[] = [];
    let awayRestOfSquad: SimplePlayer[] = [];

    // Prioritize persisted lineups from match model
    const m = match as any;
    if (m.homeLineup && m.homeLineup.length > 0) {
        homePlayers = m.homeLineup.map((name: string) => ({ name }));
        if (m.homeTeam?.players) {
            const playingNames = m.homeLineup.map((n: string) => norm(n));
            homeRestOfSquad = (m.homeTeam.players)
                .map((p: any) => ({ name: typeof p === 'string' ? p : p.name }))
                .filter((p: any) => !playingNames.includes(norm(p.name)));
        }
    } else if ((match.homeTeam as any)?.players) {
        // If no saved lineup, default to first 11 as "Playing XI" and rest as "Rest of Squad"
        const fullSquad = ((match.homeTeam as any).players)
            .map((p: any) => ({ name: typeof p === 'string' ? p : p.name }));
        
        homePlayers = fullSquad.slice(0, 11);
        homeRestOfSquad = fullSquad.slice(11);
    }

    if (m.awayLineup && m.awayLineup.length > 0) {
        awayPlayers = m.awayLineup.map((name: string) => ({ name }));
        if (m.awayTeam?.players) {
            const playingNames = m.awayLineup.map((n: string) => norm(n));
            awayRestOfSquad = (m.awayTeam.players)
                .map((p: any) => ({ name: typeof p === 'string' ? p : p.name }))
                .filter((p: any) => !playingNames.includes(norm(p.name)));
        }
    } else if ((match.awayTeam as any)?.players) {
        // Same for away team
        const fullSquad = ((match.awayTeam as any).players)
            .map((p: any) => ({ name: typeof p === 'string' ? p : p.name }));
            
        awayPlayers = fullSquad.slice(0, 11);
        awayRestOfSquad = fullSquad.slice(11);
    }

    return (
        <SquadsView
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
            homeRestOfSquad={homeRestOfSquad}
            awayRestOfSquad={awayRestOfSquad}
            title={title}
        />
    );
};

const FootballSquads = ({ match }: { match: Match }) => {
    const { data: squads, isLoading } = useFootballMatchSquads(match.id);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const homePlayers = squads?.homeTeam || players.filter((p) => p.sport === match.sport);
    const awayPlayers = squads?.awayTeam || players.filter((p) => p.sport === match.sport);

    return (
        <FootballPitchLineup
            homeTeam={{
                ...match.homeTeam,
                primaryColor: (match.homeTeam as any).primaryColor || '#3B82F6',
            }}
            awayTeam={{
                ...match.awayTeam,
                primaryColor: (match.awayTeam as any).primaryColor || '#EF4444',
            }}
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
            homeFormation={squads?.homeFormation || '4-4-2'}
            awayFormation={squads?.awayFormation || '4-4-2'}
        />
    );
};

interface SquadsListProps {
    match: Match;
    matchData?: any;
    isLoading?: boolean;
}

export const SquadsList = ({ match: m, matchData, isLoading }: SquadsListProps) => {
    const match = m as any;
    if (match.sport === 'football') {
        return <FootballSquads match={match} />;
    }
    return <CricketSquads match={match} matchData={matchData} isLoading={isLoading} />;
};
