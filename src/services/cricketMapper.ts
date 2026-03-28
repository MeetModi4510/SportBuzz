import { Match } from "@/data/types";
import { formatToIST, parseGMT } from '@/lib/dateUtils';
import { getTeamAcronym } from "@/lib/utils";

/**
 * Maps raw API match data to Match model
 */
export function mapApiMatchToModel(apiMatch: any): Match {
    // Determine status
    let status: 'live' | 'upcoming' | 'completed' = 'upcoming';
    const statusLower = (apiMatch.status || '').toLowerCase();

    const hasMeaningfulScores = () => {
        if (!Array.isArray(apiMatch.score) || apiMatch.score.length === 0) return false;
        return apiMatch.score.some((s: any) => (s.r || 0) > 0 || (s.w || 0) > 0 || parseFloat(s.o || 0) > 0);
    };

    const resultKeywords = ['won by', 'won at', 'draw', 'drawn', 'tied', 'no result', 'abandoned', 'match ended', 'completed'];
    const hasResult = resultKeywords.some(k => statusLower.includes(k));

    if (hasResult || apiMatch.matchEnded) {
        status = 'completed';
    } else if (!hasMeaningfulScores() && !apiMatch.matchStarted) {
        status = 'upcoming';
    } else if (apiMatch.matchStarted && !apiMatch.matchEnded) {
        status = 'live';
    } else if (!apiMatch.matchStarted) {
        status = 'upcoming';
    }

    const team1Name = apiMatch.teams?.[0] || apiMatch.teamInfo?.[0]?.name || apiMatch.t1 || 'Team 1';
    const team2Name = apiMatch.teams?.[1] || apiMatch.teamInfo?.[1]?.name || apiMatch.t2 || 'Team 2';
    const teamInfo = apiMatch.teamInfo || [];
    const team1Info = teamInfo.find((t: any) => t.name === team1Name) || teamInfo[0] || {};
    const team2Info = teamInfo.find((t: any) => t.name === team2Name) || teamInfo[1] || {};

    let homeScore = '';
    let awayScore = '';
    let homeScoreBreakdown = { inn1: '', inn2: '' };
    let awayScoreBreakdown = { inn1: '', inn2: '' };
    let inningsScores: { inning: string; score: string; team: string; teamName: string; overs?: string }[] = [];

    const isTest = (apiMatch.matchType || apiMatch.type || '').toLowerCase().includes('test');

    if (apiMatch.score && Array.isArray(apiMatch.score) && apiMatch.score.length > 0) {
        const sortedScores = [...apiMatch.score].sort((a, b) => {
            const aNum = (a.inning || '').toString().match(/(\d+)/)?.[1] || '1';
            const bNum = (b.inning || '').toString().match(/(\d+)/)?.[1] || '1';
            return parseInt(aNum) - parseInt(bNum);
        });

        sortedScores.forEach((inn: any, idx: number) => {
            const inning = (inn.inning || '').toLowerCase();
            const scoreStr = `${inn.r || 0}/${inn.w || 0} (${inn.o || 0} ov)`;
            const isInn2 = inning.includes('2') || inning.includes('second');
            const innNum = (inning.match(/inning\s*(\d+)/i) || [])[1] || '1';
            const teamPart = inning.replace(/\s*inning\s*\d*/i, '').trim();
            
            // Simplified assignment
            let assignedTo: 'home' | 'away' = idx % 2 === 0 ? 'home' : 'away';
            if (teamPart.includes(team1Name.toLowerCase())) assignedTo = 'home';
            if (teamPart.includes(team2Name.toLowerCase())) assignedTo = 'away';

            if (isTest) {
                inningsScores.push({
                    inning: innNum,
                    score: `${inn.r || 0}/${inn.w || 0}`,
                    team: assignedTo,
                    teamName: assignedTo === 'home' ? team1Name : team2Name,
                    overs: inn.o ? `(${inn.o} ov)` : ''
                });
            }

            if (assignedTo === 'home') {
                if (isTest && isInn2) homeScoreBreakdown.inn2 = scoreStr;
                else { homeScoreBreakdown.inn1 = scoreStr; homeScore = scoreStr; }
            } else {
                if (isTest && isInn2) awayScoreBreakdown.inn2 = scoreStr;
                else { awayScoreBreakdown.inn1 = scoreStr; awayScore = scoreStr; }
            }
        });

        if (isTest) {
            homeScore = [homeScoreBreakdown.inn1, homeScoreBreakdown.inn2].filter(Boolean).join(' & ');
            awayScore = [awayScoreBreakdown.inn1, awayScoreBreakdown.inn2].filter(Boolean).join(' & ');
        }
    }

    if (status === 'upcoming') { homeScore = ''; awayScore = ''; }

    return {
        id: apiMatch.id || Math.random().toString(36).substr(2, 9),
        sport: 'cricket',
        matchType: (apiMatch.matchType || apiMatch.type || 'CRICKET').toUpperCase(),
        homeTeam: {
            id: `cricket-${team1Info.id || team1Name.replace(/\s+/g, '-')}`,
            name: team1Name,
            shortName: team1Info.shortname || getTeamAcronym(team1Name),
            logo: apiMatch.team1Flag || team1Info.img || '🏏',
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.homeTeam?.players || team1Info.players
        },
        awayTeam: {
            id: `cricket-${team2Info.id || team2Name.replace(/\s+/g, '-')}`,
            name: team2Name,
            shortName: team2Info.shortname || getTeamAcronym(team2Name),
            logo: apiMatch.team2Flag || team2Info.img || '🏏',
            sport: 'cricket',
            primaryColor: '#6366f1',
            players: apiMatch.awayTeam?.players || team2Info.players
        },
        homeScore,
        awayScore,
        status,
        venue: {
            id: `venue-${apiMatch.venue?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`,
            name: apiMatch.venue || 'Unknown Venue',
            city: '', country: '', capacity: 0, sport: 'cricket',
        },
        startTime: parseGMT(apiMatch.dateTimeGMT || apiMatch.date, false),
        displayTime: formatToIST(apiMatch.dateTimeGMT || apiMatch.date, 'full'),
        summaryText: apiMatch.status,
        stumpsStatus: apiMatch.status,
        inningsScores,
        homeLineup: apiMatch.homeLineup,
        awayLineup: apiMatch.awayLineup
    };
}

export interface WinProbParams {
    inning: number;
    runs: number;
    wickets: number;
    ballsBowled: number;
    totalOvers: number;
    target?: number | null; // target to reach (score1 + 1)
    matchType?: string;
}

/**
 * Shared utility to calculate win probability percentage for the batting team.
 */
export function calculateWinProbability(params: WinProbParams): number {
    const { inning, runs, wickets, ballsBowled, totalOvers, target, matchType = 'T20' } = params;
    
    const wicketsLeft = 10 - wickets;
    const totalBallsInInning = totalOvers * 6;
    const ballsRemaining = Math.max(0, totalBallsInInning - ballsBowled);
    
    // Par rates based on match type
    const parRates: Record<string, number> = {
        'T20': 8.0,
        'ODI': 5.5,
        'T10': 10.0,
        'T5': 12.0,
        'TEST': 3.2
    };
    const parRate = parRates[matchType.toUpperCase()] || 7.5;

    let battingAdvantage = 50;

    if (inning === 1) {
        const currentCRR = ballsBowled > 0 ? runs / (ballsBowled / 6) : 0;
        const rateAdv = ((currentCRR - parRate) / (parRate || 1)) * 45; // Increased sensitivity from 30
        const wicketPenalty = wickets * 6; // Increased penalty from 4
        const totalBallsInMatch = totalOvers * 12;
        const resourceFactor = (ballsRemaining / totalBallsInMatch) * 10;
        battingAdvantage = 50 + rateAdv - wicketPenalty + resourceFactor;
    } else {
        if (target === undefined || target === null) return 50;
        const runsNeeded = target - runs;
        const rrr_val = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 999;
        const currentCRR = ballsBowled > 0 ? runs / (ballsBowled / 6) : 0;
        const rateAdv = currentCRR > 0 ? ((currentCRR - rrr_val) / Math.max(currentCRR, rrr_val, 1)) * 35 : -10;
        const wicketFactor = (wicketsLeft / 10) * 25;
        const proximity = runs / Math.max(target, 1);
        const proxFactor = proximity * 20;
        const resFactor = (ballsRemaining / totalBallsInInning) * 10;
        battingAdvantage = 30 + rateAdv + wicketFactor + proxFactor + resFactor;
        if (runsNeeded <= 0) battingAdvantage = 100;
        if (wickets >= 10) battingAdvantage = 0;
        if (ballsRemaining <= 0 && runsNeeded > 0) battingAdvantage = 0;
    }

    if (battingAdvantage >= 100) return 100;
    if (battingAdvantage <= 0) return 0;
    const finalProb = Math.max(2, Math.min(98, battingAdvantage));
    return parseFloat(finalProb.toFixed(1));
}
