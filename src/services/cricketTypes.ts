// Cricbuzz API Types based on RapidAPI responses

export interface CricbuzzMatch {
    matchId: number;
    matchDesc: string;
    matchFormat: string;
    startDate: string;
    endDate: string;
    state: string;
    status: string;
    team1: CricbuzzTeam;
    team2: CricbuzzTeam;
    venueInfo: CricbuzzVenue;
    currBatTeamId?: number;
    seriesName: string;
    seriesId: number;
    isTimeAnnounced: boolean;
    stateTitle?: string;
}

export interface CricbuzzTeam {
    teamId: number;
    teamName: string;
    teamSName: string;
    imageId: number;
}

export interface CricbuzzVenue {
    id: number;
    ground: string;
    city: string;
    timezone: string;
    latitude?: string;
    longitude?: string;
}

export interface CricbuzzScorecard {
    matchHeader: {
        matchId: number;
        matchDescription: string;
        matchFormat: string;
        matchType: string;
        complete: boolean;
        domestic: boolean;
        matchStartTimestamp: number;
        matchCompleteTimestamp: number;
        dayNight: boolean;
        year: number;
        state: string;
        status: string;
        team1: CricbuzzTeam;
        team2: CricbuzzTeam;
        seriesDesc: string;
        seriesId: number;
        seriesName: string;
        tpiUrl: string;
        playersOfTheMatch: { id: number; name: string; fullName: string }[];
        matchTeamInfo: {
            battingTeamId: number;
            battingTeamShortName: string;
            bowlingTeamId: number;
            bowlingTeamShortName: string;
        }[];
    };
    scoreCard?: CricbuzzInnings[];
    miniscore?: CricbuzzMiniscore;
}

export interface CricbuzzInnings {
    matchId: number;
    inningsId: number;
    batTeamDetails: {
        batTeamId: number;
        batTeamName: string;
        batTeamShortName: string;
        batsmenData: Record<string, CricbuzzBatsman>;
    };
    bowlTeamDetails: {
        bowlTeamId: number;
        bowlTeamName: string;
        bowlTeamShortName: string;
        bowlersData: Record<string, CricbuzzBowler>;
    };
    scoreDetails: {
        runs: number;
        wickets: number;
        overs: number;
        runRate: number;
        target?: number;
    };
    extrasData: {
        total: number;
        byes: number;
        legByes: number;
        wides: number;
        noBalls: number;
        penalty: number;
    };
    wicketsData: Record<string, CricbuzzWicket>;
    isCompleted: boolean;
}

export interface CricbuzzBatsman {
    batId: number;
    batName: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    isOnStrike?: boolean;
    isCaptain?: boolean;
    isKeeper?: boolean;
    outDesc?: string;
}

export interface CricbuzzBowler {
    bowlId: number;
    bowlName: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
    isInComplete?: boolean;
}

export interface CricbuzzWicket {
    batId: number;
    batName: string;
    wktNbr: number;
    wktOver: number;
    wktRuns: number;
    ballNbr: number;
}

export interface CricbuzzMiniscore {
    inningsId: number;
    batsmanStriker: CricbuzzBatsman;
    batsmanNonStriker: CricbuzzBatsman;
    batTeam: {
        teamId: number;
        teamName: string;
        teamScore: number;
        teamWkts: number;
    };
    bowlerStriker: CricbuzzBowler;
    bowlerNonStriker: CricbuzzBowler;
    overs: number;
    recentOvsBowl: string;
    target?: number;
    partnerShip: {
        runs: number;
        balls: number;
    };
    currentRunRate: number;
    requiredRunRate?: number;
    matchScoreDetails: {
        matchId: number;
        inningsScoreList: {
            inningsId: number;
            batTeamId: number;
            batTeamName: string;
            score: number;
            wickets: number;
            overs: number;
            isDeclared: boolean;
            isFollowOn: boolean;
        }[];
    };
}

export interface CricbuzzMatchesResponse {
    typeMatches: {
        matchType: string;
        seriesMatches: {
            seriesAdWrapper?: {
                seriesId: number;
                seriesName: string;
                matches: CricbuzzMatch[];
            };
        }[];
    }[];
}
