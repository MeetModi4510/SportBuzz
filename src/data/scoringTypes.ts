export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';

export interface PlayerEntry {
    name: string;
    role: PlayerRole;
    photo?: string;
    battingStyle?: string;
    bowlingStyle?: string;
}

export interface Team {
    _id: string;
    name: string;
    captain?: string;
    acronym?: string;
    players?: (PlayerEntry | string)[];
    logo?: string;
    color?: string;
}

/** Utility: extract player name regardless of format (string, object, or Mongoose subdoc) */
export const getPlayerName = (p: PlayerEntry | string | any): string => {
    if (!p) return 'Unknown';
    if (typeof p === 'string') return p;
    // Handle Mongoose subdocuments and plain objects
    if (p.name && typeof p.name === 'string') return p.name;
    // Some legacy entries might be stored oddly
    return String(p) !== '[object Object]' ? String(p) : 'Unknown';
};

/** Utility: extract player role (defaults to Batsman for legacy string entries) */
export const getPlayerRole = (p: PlayerEntry | string | any): PlayerRole =>
    (typeof p === 'object' && p !== null && p.role) ? p.role : 'Batsman';

export interface PointsTableEntry {
    _id: string;
    team: Team;
    played: number;
    won: number;
    lost: number;
    tied: number;
    noResult: number;
    points: number;
    nrr: number;
}

export interface Tournament {
    _id: string;
    name: string;
    format: 'League' | 'Knockout';
    matchType?: 'T10' | 'T20' | 'ODI' | 'Test' | 'Custom';
    overs: number;
    testDays?: number;
    oversPerSession?: number;
    groupStructure?: 'None' | 'Same Group' | 'Cross Group';
    groupsCount?: number;
    groups?: { name: string; teams: Team[] }[];
    pointsRule: {
        win: number;
        tie: number;
    };
    startDate: string;
    endDate: string;
    teams: Team[];
    status: 'Upcoming' | 'Live' | 'Completed';
    pointsTable?: PointsTableEntry[];
    createdBy?: string;
    knockedOutTeams?: (string | Team)[];
}

export interface Match {
    _id: string;
    tournament?: Tournament;
    homeTeam: Team;
    awayTeam: Team;
    venue: string;
    date: string;
    status: 'Upcoming' | 'Live' | 'Completed' | 'Abandoned';
    matchType?: 'League' | 'Semi Final' | 'Final';
    testDay?: number;
    testSession?: number;
    toss?: {
        win: string;
        decision: 'Batting' | 'Bowling';
    };
    currentInnings: number;
    score: {
        team1: { runs: number; wickets: number; overs: number };
        team2: { runs: number; wickets: number; overs: number };
    };
    result?: {
        winner?: string;
        margin?: string;
        isTie: boolean;
        isNoResult: boolean;
    };
    impactPlayers?: {
        team1?: { playerOut: string; playerIn: string };
        team2?: { playerOut: string; playerIn: string };
    };
    homeLineup?: string[];
    awayLineup?: string[];
}

export interface Ball {
    _id: string;
    timestamp?: string;
    match: string;
    inning: number;
    over: number;
    ball: number;
    batsman: string;
    bowler: string;
    nonStriker?: string;
    runs: number;
    extraType: 'wide' | 'noball' | 'bye' | 'legbye' | 'none';
    extraRuns: number;
    wicket: {
        isWicket: boolean;
        type?: 'caught' | 'caught and bowled' | 'bowled' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'others';
        playerOut?: string;
        fielder?: string;
    };
    totalBallRuns: number;
    isDroppedCatch?: boolean;
    droppedFielder?: string;
    shotDirection?: string;
    isCommentaryOnly?: boolean;
    commentaryMessage?: string;
    insightType?: string;
}
