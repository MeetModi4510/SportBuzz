import React, { useMemo } from 'react';
import { Trophy, MapPin, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalIplMatches } from '@/hooks/cricket/useCricketSeries';
import { TeamLogo } from '@/components/TeamLogo';
import { MatchCard } from '@/components/MatchCard';
import { Match } from '@/data/types';
import { useNavigate } from 'react-router-dom';

export default function SeriesMatches({ season }: { season: string }) {
    const navigate = useNavigate();
    const { data: matches, isLoading, error } = useLocalIplMatches(season);

    const { leagueMatches, knockoutMatches } = useMemo(() => {
        if (!matches) return { leagueMatches: [], knockoutMatches: [] };
        
        const knockouts: any[] = [];
        const leagues: any[] = [];
        
        matches.forEach((m: any) => {
            const stage = (m.stage || '').toLowerCase();
            if (stage.includes('final') || stage.includes('qualifier') || stage.includes('eliminator') || stage.includes('semi')) {
                knockouts.push(m);
            } else {
                leagues.push(m);
            }
        });
        
        return { leagueMatches: leagues, knockoutMatches: knockouts };
    }, [matches]);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading matches...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading matches</div>;
    if (!matches || matches.length === 0) return <div className="p-8 text-center text-muted-foreground">No matches found for {season} season.</div>;

    const convertToMatch = (m: any, index: number, isKnockout: boolean): Match => {
        return {
            id: m.id || String(index),
            sport: 'cricket',
            status: 'completed',
            matchType: m.stage ? m.stage : (isKnockout ? 'Knockout' : `Match ${index + 1}`),
            homeTeam: { name: m.team1, logo: '', shortName: m.team1 },
            awayTeam: { name: m.team2, logo: '', shortName: m.team2 },
            venue: m.city ? `${m.venue}, ${m.city}` : m.venue,
            startTime: m.date,
            displayTime: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            summaryText: m.result,
            homeScore: m.team1Score || '-',
            awayScore: m.team2Score || '-'
        } as unknown as Match;
    };

    return (
        <div className="space-y-12">
            {knockoutMatches.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-foreground border-b border-border/40 pb-3 flex items-center gap-3">
                        <span className="text-primary drop-shadow-sm">🏆</span> Knockouts & Playoffs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {knockoutMatches.map((match: any, index: number) => (
                            <MatchCard 
                                key={`ko-${index}`} 
                                match={convertToMatch(match, index, true)} 
                                onClick={(m) => navigate(`/match/${m.id}`)}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                <h3 className="text-2xl font-black text-foreground border-b border-border/40 pb-3 flex items-center gap-3">
                    <span className="text-blue-500 drop-shadow-sm">🏏</span> League Stage Matches
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {leagueMatches.map((match: any, index: number) => (
                        <MatchCard 
                            key={`lg-${index}`} 
                            match={convertToMatch(match, index, false)} 
                            onClick={(m) => navigate(`/match/${m.id}`)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
